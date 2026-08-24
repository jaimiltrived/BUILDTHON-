from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api import deps
from app.api.deps import RoleChecker
from app.models.user import User, RoleEnum
from app.core import security
from pydantic import BaseModel, EmailStr

router = APIRouter()

ADMIN_ROLES = ["SUPER_ADMIN", "ORG_ADMIN"]
SUPER_ADMIN_ONLY = ["SUPER_ADMIN"]


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    organization_id: Optional[str]

    class Config:
        from_attributes = True


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "EXECUTIVE"
    organization_id: Optional[str] = None


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker(ADMIN_ROLES))
):
    """List users. Super Admin sees all; Org Admin sees their org only."""
    if current_user.role_str == "SUPER_ADMIN":
        return db.query(User).all()
    return db.query(User).filter(User.organization_id == current_user.organization_id).all()


@router.post("/", response_model=UserResponse)
def create_user(
    body: UserCreateRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker(ADMIN_ROLES))
):
    """Create/invite a new user. Org Admin can only add users to their org."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Org Admins can only assign users to their own org
    org_id = body.organization_id
    if current_user.role_str == "ORG_ADMIN":
        org_id = current_user.organization_id

    # Org Admins cannot create SUPER_ADMIN
    if current_user.role_str == "ORG_ADMIN" and body.role == "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Org Admin cannot assign Super Admin role")

    try:
        role_enum = RoleEnum(body.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")

    user = User(
        email=body.email,
        hashed_password=security.get_password_hash(body.password),
        full_name=body.full_name,
        role=role_enum,
        organization_id=org_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker(ADMIN_ROLES))
):
    """Get a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Org Admin can only see their org's users
    if current_user.role_str == "ORG_ADMIN" and user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    body: UserUpdateRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker(ADMIN_ROLES))
):
    """Update user role, name, or active status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role_str == "ORG_ADMIN" and user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None:
        try:
            user.role = RoleEnum(body.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")

    db.commit()
    db.refresh(user)
    return user
