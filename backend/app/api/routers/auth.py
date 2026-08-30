import secrets
import uuid
from datetime import timedelta
import hashlib
import time
from typing import Optional, Dict
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import security
from app.core.config import settings
from app.core.email import send_otp_email
from app.api import deps
from app.models.user import User
from app.models.organization import Organization
from app.schemas.user import (
    Token,
    TokenData,
    UserCreate,
    UserInDB,
    OTPRequest,
    OTPVerifyAndRegister,
    OTPResponse,
)

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory OTP store
# Structure: { email: { "hashed_otp": str, "expires_at": float,
#                        "attempts": int, "last_requested_at": float } }
# ---------------------------------------------------------------------------
otp_store: Dict[str, dict] = {}

# ---------------------------------------------------------------------------
# Login rate-limiting (in-memory sliding window per identifier)
# Structure: { identifier: deque([timestamp, ...]) }
# ---------------------------------------------------------------------------
_login_attempts: Dict[str, deque] = defaultdict(deque)


def _check_login_rate_limit(identifier: str) -> None:
    """
    Sliding-window rate limiter for login attempts.
    Raises 429 if the identifier exceeds RATE_LIMIT_LOGIN_MAX within the window.
    """
    now = time.time()
    window = settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS
    max_attempts = settings.RATE_LIMIT_LOGIN_MAX
    dq = _login_attempts[identifier]
    # Evict old timestamps outside the window
    while dq and dq[0] < now - window:
        dq.popleft()
    if len(dq) >= max_attempts:
        wait = int(window - (now - dq[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please wait {wait}s before retrying.",
        )
    dq.append(now)


def _hash_otp(email: str, otp: str) -> str:
    salt = settings.SECRET_KEY
    clean_email = email.lower().strip()
    clean_otp = otp.strip()
    return hashlib.sha256(f"{clean_email}:{clean_otp}:{salt}".encode("utf-8")).hexdigest()


def _generate_otp() -> str:
    """Cryptographically secure 6-digit OTP via secrets module."""
    return f"{secrets.randbelow(900000) + 100000}"


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login")
def login_access_token(
    request: Request,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    OAuth2 compatible token login. Returns access + refresh tokens and user
    profile for frontend role routing.

    Rate-limited: max RATE_LIMIT_LOGIN_MAX attempts per email per window.
    """
    # Rate-limit by email (primary) and IP (secondary)
    ip = request.client.host if request.client else "unknown"
    _check_login_rate_limit(form_data.username.lower().strip())
    _check_login_rate_limit(ip)

    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = security.create_access_token(
        user.email, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = security.create_refresh_token(user.email)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name or user.email.split("@")[0].title(),
            "role": user.role_str,
            "organization_id": user.organization_id,
        },
    }


@router.post("/refresh")
def refresh_access_token(
    body: RefreshRequest,
    db: Session = Depends(deps.get_db),
):
    """
    Exchange a valid refresh token for a fresh access token.
    The refresh token itself is NOT rotated — implement rotation if you add
    a server-side token store (e.g. Redis).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = security.decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise credentials_exception
    email: str = payload.get("sub")
    if not email:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise credentials_exception

    new_access_token = security.create_access_token(
        user.email, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/register/request-otp", response_model=OTPResponse)
def request_registration_otp(
    *,
    db: Session = Depends(deps.get_db),
    body: OTPRequest,
):
    """
    Generate and dispatch a cryptographically secure 6-digit OTP with
    5-minute TTL and 60-second cooldown.
    """
    clean_email = body.email.lower().strip()

    # 1. Check if user already exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An enterprise account with this email already exists in the system.",
        )

    # 2. Rate limiting check (60-second cooldown between OTP requests)
    now = time.time()
    if clean_email in otp_store:
        last_req = otp_store[clean_email].get("last_requested_at", 0)
        cooldown_elapsed = now - last_req
        if cooldown_elapsed < 60:
            remaining_cooldown = int(60 - cooldown_elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining_cooldown}s before requesting a new verification code.",
            )

    # 3. Generate cryptographically secure 6-digit OTP and store SHA-256 hash only
    otp_code = _generate_otp()
    hashed = _hash_otp(clean_email, otp_code)

    otp_store[clean_email] = {
        "hashed_otp": hashed,
        "expires_at": now + 300,  # 5 minutes validity
        "attempts": 0,
        "last_requested_at": now,
        "phone": body.phone,
    }

    # Terminal log for development debugging (never returned in the API response)
    print("\n==========================================")
    print("[ENTERPRISE AUTH OTP] Verification Code")
    print(f"Destination: {clean_email}")
    if body.phone:
        print(f"Mobile SMS:  {body.phone}")
    print(f"6-Digit OTP:  {otp_code}")
    print("Expiration:   5 minutes (300 seconds)")
    print("==========================================\n")

    # Send OTP via Gmail SMTP (async, non-blocking)
    send_otp_email(recipient_email=clean_email, otp_code=otp_code)

    resp = {
        "message": f"Verification code dispatched to {clean_email}",
        "expires_in_seconds": 300,
        "cooldown_seconds": 60,
    }
    if settings.API_ENV == "development":
        resp["dev_otp"] = otp_code
    return resp


@router.post("/register/resend-otp", response_model=OTPResponse)
def resend_registration_otp(
    *,
    db: Session = Depends(deps.get_db),
    body: OTPRequest,
):
    """
    Resend registration OTP respecting 60-second rate-limit cooldown.
    """
    return request_registration_otp(db=db, body=body)


@router.post("/register/verify-otp")
def verify_otp_and_register(
    *,
    db: Session = Depends(deps.get_db),
    body: OTPVerifyAndRegister,
):
    """
    Verify 6-digit OTP hash, enforce attempt limit (max 3), invalidate OTP
    immediately, and provision the enterprise user seat with automated JWT
    authentication.
    """
    clean_email = body.email.lower().strip()

    # 1. Check if user already exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )

    # 2. Check if OTP record exists
    if clean_email not in otp_store:
        raise HTTPException(
            status_code=400,
            detail="No verification code was requested for this email. Please click 'Send Verification Code'.",
        )

    record = otp_store[clean_email]
    now = time.time()

    # 3. Check expiration (5 minutes)
    if now > record["expires_at"]:
        otp_store.pop(clean_email, None)
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired (5-minute limit). Please request a new code.",
        )

    # 4. Check maximum failed attempts (max 3 tries)
    if record["attempts"] >= 3:
        otp_store.pop(clean_email, None)
        raise HTTPException(
            status_code=400,
            detail="Maximum verification attempts exceeded. Please request a new code.",
        )

    # 5. Verify SHA-256 OTP Hash (constant-time comparison via hmac)
    import hmac
    provided_hash = _hash_otp(clean_email, body.otp)
    if not hmac.compare_digest(provided_hash, record["hashed_otp"]):
        record["attempts"] += 1
        remaining = 3 - record["attempts"]
        if remaining <= 0:
            otp_store.pop(clean_email, None)
            raise HTTPException(
                status_code=400,
                detail="Invalid verification code. Maximum attempts reached. Please request a new code.",
            )
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect 6-digit verification code. {remaining} attempt(s) remaining.",
        )

    # 6. OTP Validated — Invalidate immediately to prevent replay attacks
    otp_store.pop(clean_email, None)

    # 7. Resolve or Provision Organization in Database
    resolved_org_id = None
    if body.organization_id:
        target_org = db.query(Organization).filter(
            (Organization.id == body.organization_id) | (Organization.name == body.organization_id)
        ).first()
        if not target_org:
            target_org = Organization(id=str(uuid.uuid4()), name=body.organization_id)
            db.add(target_org)
            db.flush()
        resolved_org_id = target_org.id
    else:
        first_org = db.query(Organization).first()
        if first_org:
            resolved_org_id = first_org.id
        else:
            default_org = Organization(id=str(uuid.uuid4()), name="NOVA COMMERCE")
            db.add(default_org)
            db.flush()
            resolved_org_id = default_org.id

    role_val = body.role.value if hasattr(body.role, "value") else str(body.role)
    user_obj = User(
        email=clean_email,
        hashed_password=security.get_password_hash(body.password),
        full_name=body.full_name or clean_email.split("@")[0].title(),
        role=role_val,
        organization_id=resolved_org_id,
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)

    # 8. Generate access + refresh tokens for instant authenticated session
    access_token = security.create_access_token(
        user_obj.email, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = security.create_refresh_token(user_obj.email)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_obj.id,
            "email": user_obj.email,
            "full_name": user_obj.full_name or user_obj.email.split("@")[0].title(),
            "role": user_obj.role_str,
            "organization_id": user_obj.organization_id,
        },
    }


@router.post("/register", response_model=UserInDB)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
):
    """
    Direct user registration (legacy / API programmatic access).
    """
    clean_email = user_in.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )

    resolved_org_id = None
    if user_in.organization_id:
        target_org = db.query(Organization).filter(
            (Organization.id == user_in.organization_id) | (Organization.name == user_in.organization_id)
        ).first()
        if not target_org:
            target_org = Organization(id=str(uuid.uuid4()), name=user_in.organization_id)
            db.add(target_org)
            db.flush()
        resolved_org_id = target_org.id
    else:
        first_org = db.query(Organization).first()
        if first_org:
            resolved_org_id = first_org.id
        else:
            default_org = Organization(id=str(uuid.uuid4()), name="NOVA COMMERCE")
            db.add(default_org)
            db.flush()
            resolved_org_id = default_org.id

    role_val = user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role)
    user_obj = User(
        email=clean_email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=role_val,
        organization_id=resolved_org_id,
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    return user_obj


@router.get("/me", response_model=UserInDB)
def read_users_me(
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get current authenticated user profile.
    """
    return current_user
