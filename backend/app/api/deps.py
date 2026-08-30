from typing import Generator, List
# pyrefly: ignore [missing-import]
from fastapi import Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordBearer
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import decode_token
from app.models.user import User
from app.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload:
        raise credentials_exception
    # Reject refresh tokens from being used as access tokens
    if payload.get("type") == "refresh":
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    token_data = TokenData(email=email)
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


class RoleChecker:
    """Dependency that enforces role-based access control.

    Usage:
        @router.get("/admin-only")
        def admin_route(user: User = Depends(RoleChecker(["SUPER_ADMIN"]))):
            ...
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        user_role = current_user.role_str
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' is not permitted for this operation",
            )
        return current_user
