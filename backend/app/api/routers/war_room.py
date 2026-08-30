from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.api.org_utils import resolve_org
from app.models.user import User
from app.analytics.war_room import WarRoomEngine
from app.models.financial import Customer, Order
from sqlalchemy import func

router = APIRouter()


@router.get("/compare")
def compare_strategies(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Returns Plan A vs Plan B vs Plan C comparison with Risk-Adjusted Values.
    Uses live org financials from the database for the authenticated user's
    organization. Falls back to NOVA COMMERCE defaults if no data found.
    """
    org_id, _ = resolve_org(current_user, db)

    current_revenue = 8_240_000.0
    current_customers = 48_200
    if org_id:
        count = db.query(Customer).filter(Customer.organization_id == org_id).count()
        if count:
            current_customers = count
        rev = db.query(func.sum(Order.total_amount)).filter(
            Order.organization_id == org_id,
            Order.status == "completed",
        ).scalar()
        if not rev:
            rev = db.query(func.sum(Order.total_amount)).filter(
                Order.organization_id == org_id
            ).scalar()
        if rev:
            current_revenue = float(rev)

    current_profit = current_revenue * 0.2572
    current_churn = 0.071

    return WarRoomEngine.compare_strategies(
        current_revenue=current_revenue,
        current_profit=current_profit,
        current_churn=current_churn,
        current_customers=current_customers,
    )
