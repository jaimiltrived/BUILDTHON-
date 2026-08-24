from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.api import deps
from app.api.deps import RoleChecker
from app.models.user import User
from app.models.organization import Organization
from pydantic import BaseModel

router = APIRouter()

SUPER_ADMIN_ONLY = ["SUPER_ADMIN"]
ADMIN_ROLES = ["SUPER_ADMIN", "ORG_ADMIN"]


class OrganizationResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    user_count: Optional[int] = 0

    class Config:
        from_attributes = True


class OrganizationCreateRequest(BaseModel):
    name: str


@router.get("/", response_model=List[dict])
def list_organizations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker(SUPER_ADMIN_ONLY))
):
    """List all organizations. Super Admin only."""
    orgs = db.query(Organization).all()
    result = []
    for org in orgs:
        user_count = db.query(User).filter(User.organization_id == org.id).count()
        result.append({
            "id": org.id,
            "name": org.name,
            "created_at": org.created_at.isoformat(),
            "user_count": user_count
        })
    return result


@router.post("/", response_model=dict)
def create_organization(
    body: OrganizationCreateRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker(SUPER_ADMIN_ONLY))
):
    """Create a new organization tenant. Super Admin only."""
    existing = db.query(Organization).filter(Organization.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization with this name already exists")

    org = Organization(
        id=str(uuid.uuid4()),
        name=body.name
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return {
        "id": org.id,
        "name": org.name,
        "created_at": org.created_at.isoformat(),
        "user_count": 0
    }


@router.get("/{org_id}", response_model=dict)
def get_organization(
    org_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker(ADMIN_ROLES))
):
    """Get a specific organization. Org Admin can only see their own."""
    if current_user.role_str == "ORG_ADMIN" and current_user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    user_count = db.query(User).filter(User.organization_id == org_id).count()
    users = db.query(User).filter(User.organization_id == org_id).all()

    return {
        "id": org.id,
        "name": org.name,
        "created_at": org.created_at.isoformat(),
        "user_count": user_count,
        "users": [
            {"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role_str, "is_active": u.is_active}
            for u in users
        ]
    }
