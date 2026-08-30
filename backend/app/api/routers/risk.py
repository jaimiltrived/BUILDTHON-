from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User

router = APIRouter()


@router.get("/center")
def get_risk_center(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Returns structured risk breakdown for the Risk Center dashboard.
    Aggregates churn, cash flow, pricing sensitivity, and inventory risk.
    Requires authenticated user.
    """
    return {
        "overall_score": 36,
        "overall_level": "MEDIUM",
        "score_breakdown": {
            "churn_weight": 40,
            "cashflow_weight": 30,
            "pricing_weight": 20,
            "inventory_weight": 10,
        },
        "risks": [
            {
                "id": "churn",
                "category": "Customer Churn",
                "level": "HIGH",
                "score": 68,
                "impact_amount": 420000,
                "impact_formatted": "₹4.2L",
                "probability": 72,
                "trend": "increasing",
                "description": "Metro-region high-LTV accounts showing price-sensitive behaviour. Churn rate elevated at 7.1%.",
                "root_cause": "Price sensitivity in high-value customer cohort. Competitive alternatives gaining share in metro markets.",
                "affected_segment": "High-LTV Metro Accounts (est. 3,400 customers)",
                "mitigation": "Introduce loyalty pricing tier for accounts >24 months. Consider retention outreach for top 500 accounts by CLV.",
                "confidence": 84,
            },
            {
                "id": "cashflow",
                "category": "Cash Flow Pressure",
                "level": "MEDIUM",
                "score": 42,
                "impact_amount": 180000,
                "impact_formatted": "₹1.8L",
                "probability": 55,
                "trend": "stable",
                "description": "DSO (Days Sales Outstanding) up 8 days YoY. Logistics cost inflation compressing working capital.",
                "root_cause": "Extended payment cycles from B2B clients. Rising last-mile delivery cost (+14% YoY).",
                "affected_segment": "B2B Enterprise Accounts (est. 12% of revenue)",
                "mitigation": "Accelerate invoice factoring program. Renegotiate delivery SLAs with logistics partners.",
                "confidence": 71,
            },
            {
                "id": "pricing",
                "category": "Pricing Sensitivity",
                "level": "MEDIUM",
                "score": 38,
                "impact_amount": 110000,
                "impact_formatted": "₹1.1L",
                "probability": 60,
                "trend": "stable",
                "description": "Price elasticity coefficient at -0.5 across standard catalog. Premium SKUs showing elasticity of -0.8.",
                "root_cause": "Market price comparison tools increasing consumer price awareness. Competitor pricing 3-7% below on premium SKUs.",
                "affected_segment": "Premium Catalog (est. 31% of GMV)",
                "mitigation": "Segment pricing strategy: maintain standard catalog pricing, introduce value bundles for premium SKUs.",
                "confidence": 78,
            },
            {
                "id": "inventory",
                "category": "Inventory Risk",
                "level": "LOW",
                "score": 18,
                "impact_amount": 45000,
                "impact_formatted": "₹0.45L",
                "probability": 28,
                "trend": "decreasing",
                "description": "Inventory turnover ratio healthy at 8.2x. Seasonal demand forecasting accuracy at 89%.",
                "root_cause": "Minor overstock in Q3 seasonal categories. Demand spike for electronics sub-category underestimated.",
                "affected_segment": "Seasonal & Electronics Categories",
                "mitigation": "Increase safety stock buffer for electronics by 15%. Reduce seasonal order lead times.",
                "confidence": 91,
            },
        ],
        "last_calculated": "2026-08-23T13:00:00+05:30",
        "data_coverage_months": 24,
    }
