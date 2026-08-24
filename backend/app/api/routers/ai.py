from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from app.api import deps
from app.models.user import User
from app.models.organization import Organization
from app.models.financial import Customer, Order
from app.agents.supervisor import AIAgentSupervisor

router = APIRouter()
supervisor = AIAgentSupervisor()

class AIAnalyzeRequest(BaseModel):
    decision_type: str = "Price Change"
    parameter_value: float = 0.10
    description: str = ""

class AIChatRequest(BaseModel):
    message: str

class AIResearchRequest(BaseModel):
    topic: str
    focus_area: Optional[str] = "Market & Financial Intelligence"

@router.get("/status")
async def get_ai_status():
    """Returns whether local LLaMA 3 via Ollama is active or Deterministic Fallback is operational."""
    return await supervisor.check_engine_status()

@router.post("/analyze")
async def analyze_decision(
    req: AIAnalyzeRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Invokes AI supervisor multi-agent system to analyze a proposed decision organization-wise."""
    org_id = current_user.organization_id
    org_name = "Nova Commerce"
    if not org_id:
        # Fallback for Super Admin
        org = db.query(Organization).filter(Organization.name == "NOVA COMMERCE").first()
        if not org:
            org = db.query(Organization).first()
        if org:
            org_id = org.id
            org_name = org.name
    else:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            org_name = org.name

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

    baseline = {
        "revenue": total_revenue_float,
        "profit": total_profit,
        "churn": current_churn,
        "customers": total_customers,
        "name": org_name
    }

    return await supervisor.analyze_decision(
        decision_type=req.decision_type, 
        parameter_value=req.parameter_value, 
        description=req.description,
        baseline=baseline
    )

@router.post("/chat")
async def chat_with_ai(
    req: AIChatRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Natural-language conversational command interface powered live by LLaMA 3."""
    org_id = current_user.organization_id
    if not org_id:
        org = db.query(Organization).filter(Organization.name == "NOVA COMMERCE").first()
        if not org:
            org = db.query(Organization).first()
        if org:
            org_id = org.id
    return await supervisor.handle_chat(req.message, db=db, org_id=org_id)

@router.post("/research")
async def conduct_research(
    req: AIResearchRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Conducts deep autonomous market & financial research using live LLaMA 3."""
    org_id = current_user.organization_id
    if not org_id:
        org = db.query(Organization).filter(Organization.name == "NOVA COMMERCE").first()
        if not org:
            org = db.query(Organization).first()
        if org:
            org_id = org.id
    return await supervisor.conduct_research(req.topic, req.focus_area or "Market & Financial Intelligence", db=db, org_id=org_id)
