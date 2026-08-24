from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter()

class LedgerEntry(BaseModel):
    id: str
    question: str
    proposed_action: str
    ai_recommendation: str
    expected_profit: str
    risk: str
    confidence: int
    status: str = "AWAITING_APPROVAL"  # AWAITING_APPROVAL, APPROVED, REJECTED, MODIFIED, EXECUTED, COMPLETED
    date: str = "2026-08-23"

LEDGER_STORE: List[dict] = [
    {
        "id": "DEC-1042",
        "question": "Should we increase product prices by 10%?",
        "proposed_action": "+10% Global Price Hike",
        "ai_recommendation": "Increase price by 5%, not 10%",
        "expected_profit": "₹23.4L",
        "risk": "MEDIUM",
        "confidence": 88,
        "status": "APPROVED",
        "date": "2026-08-22"
    },
    {
        "id": "DEC-1043",
        "question": "Expand logistics delivery network spending by 15%?",
        "proposed_action": "+15% Logistics Budget",
        "ai_recommendation": "Approve with 60-day milestone review",
        "expected_profit": "₹24.8L",
        "risk": "LOW",
        "confidence": 92,
        "status": "AWAITING_APPROVAL",
        "date": "2026-08-23"
    }
]

class CreateLedgerRequest(BaseModel):
    question: str
    proposed_action: str
    ai_recommendation: str
    expected_profit: str
    risk: str
    confidence: int

class UpdateStatusRequest(BaseModel):
    status: str

@router.get("")
@router.get("/")
def get_ledger():
    return LEDGER_STORE

@router.post("")
@router.post("/")
def create_ledger_entry(req: CreateLedgerRequest):
    new_id = f"DEC-{1044 + len(LEDGER_STORE)}"
    entry = {
        "id": new_id,
        "question": req.question,
        "proposed_action": req.proposed_action,
        "ai_recommendation": req.ai_recommendation,
        "expected_profit": req.expected_profit,
        "risk": req.risk,
        "confidence": req.confidence,
        "status": "AWAITING_APPROVAL",
        "date": datetime.now().strftime("%Y-%m-%d")
    }
    LEDGER_STORE.insert(0, entry)
    return entry

@router.patch("/{entry_id}/status")
def update_ledger_status(entry_id: str, req: UpdateStatusRequest):
    valid_statuses = {"AWAITING_APPROVAL", "APPROVED", "REJECTED", "MODIFIED", "EXECUTED", "COMPLETED"}
    norm_status = req.status.upper().replace(" ", "_")
    if norm_status not in valid_statuses:
        norm_status = req.status
        
    for item in LEDGER_STORE:
        if item["id"] == entry_id:
            item["status"] = norm_status
            return item
    return {"error": "Not found"}
