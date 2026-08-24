from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.user import User
from app.models.organization import Organization
from app.models.financial import Order, Customer
from app.simulation.engine import SimulationEngine
from app.analytics.risk_engine import RiskEngine

router = APIRouter()

class PriceSimulationRequest(BaseModel):
    percentage_increase: float
    decision_type: str = "Price Change"
    custom_text: Optional[str] = None
    marketing_spend: Optional[float] = 0.0
    delivery_surcharge: Optional[float] = 0.0

@router.post("/simulate-price")
def simulate_price(
    request: PriceSimulationRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    org_id = current_user.organization_id
    if not org_id:
        # Fallback for Super Admin
        org = db.query(Organization).filter(Organization.name == "NOVA COMMERCE").first()
        if not org:
            org = db.query(Organization).first()
        if org:
            org_id = org.id

    if org_id:
        total_customers = db.query(Customer).filter(Customer.organization_id == org_id).count() or 500
        total_revenue = db.query(func.sum(Order.total_amount)).filter(
            Order.organization_id == org_id, 
            Order.status == 'completed'
        ).scalar()
        if not total_revenue:
            total_revenue = db.query(func.sum(Order.total_amount)).filter(
                Order.organization_id == org_id
            ).scalar() or 8240000.0
    else:
        total_customers = 48200
        total_revenue = 8240000.0

    total_revenue_float = float(total_revenue)
    total_profit = total_revenue_float * 0.2572
    current_churn = 0.071
    
    engine = SimulationEngine(
        current_revenue=total_revenue_float,
        current_profit=total_profit,
        current_churn=current_churn,
        current_customers=total_customers
    )
    
    # Calculate scenarios
    result = engine.simulate_price_change(
        percentage_increase=request.percentage_increase,
        marketing_spend_pct=(request.marketing_spend or 0.0) / 100.0,
        delivery_surcharge=request.delivery_surcharge or 0.0
    )
    
    # Calculate risks for the Base scenario
    base_result = result["scenarios"]["base"]
    revenue_risk = RiskEngine.calculate_revenue_risk(total_revenue_float, base_result["revenue"])
    churn_risk = RiskEngine.calculate_churn_risk(current_churn, base_result["churn"])
    overall_risk = RiskEngine.calculate_overall_risk(revenue_risk, churn_risk)
    
    hidden_consequence = None
    if request.percentage_increase > 0.05:
        hidden_consequence = "High-value customers are significantly more price sensitive than the average cohort. Potential 2nd-order churn increase detected."
        
    return {
        "current": {
            "revenue": total_revenue_float,
            "profit": total_profit,
            "churn": current_churn
        },
        "simulation": result,
        "risk_analysis": {
            "level": overall_risk["level"],
            "hidden_consequence": hidden_consequence,
            "total_penalty": overall_risk["total_penalty"]
        }
    }
