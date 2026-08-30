"""
Shared utility: resolve_org
===========================
Resolves the effective organization ID for the current user.
- If the user has an organization_id set, it uses that.
- Super-admins (no org) fall back to NOVA COMMERCE, then the first available org.

Import and use instead of copy-pasting the 15-line pattern across every router.
"""
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.organization import Organization


def resolve_org(user: User, db: Session) -> tuple[str | None, str]:
    """
    Returns (org_id, org_name) for the given user.
    Falls back gracefully for super-admin users without a fixed org.
    """
    if user.organization_id:
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()
        if org:
            return org.id, org.name
        return user.organization_id, "NOVA COMMERCE"

    # Fallback for super-admin / unassigned users
    org = (
        db.query(Organization).filter(Organization.name == "NOVA COMMERCE").first()
        or db.query(Organization).first()
    )
    if org:
        return org.id, org.name
    return None, "NOVA COMMERCE"
