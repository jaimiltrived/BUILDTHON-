from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.api import deps
from app.models.user import User
from app.analytics.reconciliation_engine import ReconciliationEngine
from app.agents.supervisor import AIAgentSupervisor

router = APIRouter()
supervisor = AIAgentSupervisor()

# In-memory batch cache to persist user-resolved exception states across requests
_active_batch_cache: Dict[str, Any] = {}
_last_run_result: Dict[str, Any] = {}

class ResolveExceptionRequest(BaseModel):
    exception_id: str
    resolution_action: str # e.g. "APPROVE_AI_SPLIT", "RECOVER_FEE_CLAIM", "WRITE_OFF_FX", "DEMAND_TDS_NOTE", "TREASURY_INQUIRY"
    notes: Optional[str] = "Manual resolution applied via AI Finance Controller"

@router.get("/batch")
def get_synthetic_batch(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Returns the 65-record multi-source synthetic batch (Bank Statement, ERP Invoices, Gateway Settlements).
    Generates a new batch if not already cached.
    """
    global _active_batch_cache
    if not _active_batch_cache:
        _active_batch_cache = ReconciliationEngine.generate_synthetic_batch()
    
    return _active_batch_cache

@router.get("/run")
def get_reconciliation_run(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Returns the current active reconciliation run result, or runs the pipeline if not yet run.
    """
    global _active_batch_cache, _last_run_result
    if not _last_run_result:
        if not _active_batch_cache:
            _active_batch_cache = ReconciliationEngine.generate_synthetic_batch()
        _last_run_result = ReconciliationEngine.run_reconciliation_pipeline(_active_batch_cache)
    return _last_run_result

@router.post("/run")
def run_reconciliation(
    force_new_batch: bool = False,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Executes the 3-Stage Autonomous Reconciliation Pipeline:
    - Stage 1: Deterministic Exact Match
    - Stage 2: Heuristic & Gateway Fee Tolerance Match
    - Stage 3: AI Cognitive Discrepancy Analysis (LLaMA 3 & Rule Triage)
    Returns: Complete scorecard, measured accuracy & throughput, matched pairs, honest exception queue, and forward cash position.
    """
    global _active_batch_cache, _last_run_result

    if force_new_batch or not _active_batch_cache:
        _active_batch_cache = ReconciliationEngine.generate_synthetic_batch()

    result = ReconciliationEngine.run_reconciliation_pipeline(_active_batch_cache)
    _last_run_result = result
    return result

@router.post("/analyze")
async def analyze_reconciliation_discrepancies(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Invokes LLaMA 3 multi-agent supervisor to perform deep neural discrepancy analysis on the active reconciliation run.
    """
    global _active_batch_cache, _last_run_result
    if not _last_run_result:
        if not _active_batch_cache:
            _active_batch_cache = ReconciliationEngine.generate_synthetic_batch()
        _last_run_result = ReconciliationEngine.run_reconciliation_pipeline(_active_batch_cache)

    return await supervisor.analyze_reconciliation_batch(_last_run_result)

@router.post("/resolve-exception")
def resolve_exception(
    req: ResolveExceptionRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Human-in-the-loop override or AI resolution trigger to close an exception in the honest exception queue.
    """
    global _last_run_result
    if not _last_run_result or "exceptions" not in _last_run_result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active reconciliation run found. Please run reconciliation first."
        )

    matched_exc = None
    remaining_exceptions = []
    for exc in _last_run_result["exceptions"]:
        if exc["exception_id"] == req.exception_id:
            matched_exc = exc
        else:
            remaining_exceptions.append(exc)

    if not matched_exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exception {req.exception_id} not found in the active exception queue."
        )

    # Update scorecard and reconciled numbers
    _last_run_result["exceptions"] = remaining_exceptions
    _last_run_result["scorecard"]["unresolved_exceptions_count"] = len(remaining_exceptions)
    
    disputed_resolved = matched_exc.get("disputed_amount", 0.0)
    _last_run_result["scorecard"]["unresolved_disputed_value"] = max(
        0.0, 
        round(_last_run_result["scorecard"]["unresolved_disputed_value"] - disputed_resolved, 2)
    )

    # Add to matched pairs as resolved
    _last_run_result["matched_pairs"].append({
        "match_id": f"RES-{req.exception_id}",
        "stage": "STAGE_3_HUMAN_IN_THE_LOOP",
        "confidence": 99,
        "status": "MANUALLY_RESOLVED",
        "bank_txn_id": matched_exc.get("bank_txn_id", "N/A"),
        "invoice_id": matched_exc.get("invoice_id", "MULTI/ADJUSTMENT"),
        "description": f"Resolved: {matched_exc['description']} [{req.resolution_action}]",
        "matched_amount": matched_exc.get("amount", 0.0),
        "variance": 0.0,
        "reasoning": f"Resolution: {req.resolution_action}. Notes: {req.notes}"
    })

    _last_run_result["scorecard"]["auto_matched_records"] += 1
    total = _last_run_result["scorecard"]["total_records_processed"]
    matched = _last_run_result["scorecard"]["auto_matched_records"]
    _last_run_result["scorecard"]["match_rate_percentage"] = round((matched / total) * 100, 2)

    return {
        "status": "SUCCESS",
        "resolved_exception_id": req.exception_id,
        "action_applied": req.resolution_action,
        "remaining_exceptions_count": len(remaining_exceptions),
        "updated_scorecard": _last_run_result["scorecard"]
    }

@router.get("/cash-forecast")
def get_cash_forecast(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Returns 30-day forward cash position forecasting ladder and runway metrics.
    """
    global _last_run_result
    if not _last_run_result:
        _last_run_result = ReconciliationEngine.run_reconciliation_pipeline()
    
    return _last_run_result.get("cash_position", {})

