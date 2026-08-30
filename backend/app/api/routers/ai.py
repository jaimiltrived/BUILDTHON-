from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from app.api import deps
from app.api.org_utils import resolve_org
from app.models.user import User
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
    current_user: User = Depends(deps.get_current_active_user),
):
    """Invokes AI supervisor multi-agent system to analyze a proposed decision organization-wise."""
    org_id, org_name = resolve_org(current_user, db)

    total_customers = 48_200
    total_revenue = 8_240_000.0
    if org_id:
        count = db.query(Customer).filter(Customer.organization_id == org_id).count()
        if count:
            total_customers = count
        rev = db.query(func.sum(Order.total_amount)).filter(
            Order.organization_id == org_id, Order.status == "completed"
        ).scalar() or db.query(func.sum(Order.total_amount)).filter(
            Order.organization_id == org_id
        ).scalar()
        if rev:
            total_revenue = float(rev)

    total_profit = total_revenue * 0.2572
    baseline = {
        "revenue": total_revenue,
        "profit": total_profit,
        "churn": 0.071,
        "customers": total_customers,
        "name": org_name,
    }

    return await supervisor.analyze_decision(
        decision_type=req.decision_type,
        parameter_value=req.parameter_value,
        description=req.description,
        baseline=baseline,
    )


@router.post("/chat")
async def chat_with_ai(
    req: AIChatRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Natural-language conversational command interface powered live by LLaMA 3."""
    org_id, _ = resolve_org(current_user, db)
    return await supervisor.handle_chat(req.message, db=db, org_id=org_id)


from app.agents.langchain_rag_engine import langchain_rag_engine


class LangChainRAGRequest(BaseModel):
    query: str
    context_override: Optional[str] = None


class RAGIngestRequest(BaseModel):
    doc_id: str
    title: str
    text: str


@router.post("/langchain-rag-query")
async def langchain_rag_query(
    req: LangChainRAGRequest,
    current_user: User = Depends(deps.get_current_active_user),
):
    """Executes a grounded RAG query using LangChain framework wrappers and local LLaMA 3."""
    return langchain_rag_engine.execute_rag_query(req.query, context_override=req.context_override)


@router.post("/langchain-rag-ingest")
async def langchain_rag_ingest(
    req: RAGIngestRequest,
    current_user: User = Depends(deps.get_current_active_user),
):
    """Ingests and chunks enterprise document into local LangChain RAG vector index."""
    chunks_count = langchain_rag_engine.ingest_document(req.doc_id, req.title, req.text)
    return {
        "status": "INGESTED",
        "doc_id": req.doc_id,
        "title": req.title,
        "chunks_indexed": chunks_count,
        "engine": "LangChain RecursiveCharacterTextSplitter"
    }

