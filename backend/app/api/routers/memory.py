from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.analytics.finance_engine import FinanceEngine
import uuid

router = APIRouter()

# Persistent in-memory decision knowledge base
DECISION_MEMORY: List[Dict[str, Any]] = [
    {
        "id": "DEC-1042",
        "title": "Increase standard delivery fee by ₹20",
        "category": "Operations / Logistics",
        "date": "2025-11-15",
        "predicted": {
            "revenue": 8450000.0,
            "profit": 2240000.0,
            "revenue_change_pct": "+3.2%",
            "churn": 7.3
        },
        "actual": {
            "revenue": 8120000.0,
            "profit": 2080000.0,
            "revenue_change_pct": "-1.4%",
            "churn": 8.9
        },
        "accuracy": {
            "revenue_accuracy": FinanceEngine.calculate_accuracy(8450000.0, 8120000.0),
            "profit_accuracy": FinanceEngine.calculate_accuracy(2240000.0, 2080000.0),
            "churn_accuracy": FinanceEngine.calculate_accuracy(7.3, 8.9),
            "overall_accuracy": round((
                FinanceEngine.calculate_accuracy(8450000.0, 8120000.0) +
                FinanceEngine.calculate_accuracy(2240000.0, 2080000.0) +
                FinanceEngine.calculate_accuracy(7.3, 8.9)
            ) / 3.0, 1)
        },
        "observed_outcome": "High-value customer cohort in Metro regions curtailed order frequency by 14%, resulting in net top-line contraction.",
        "ai_lesson": "Logistics fee increases disproportionately affect high-LTV accounts. Bundle delivery into subscription tier instead."
    },
    {
        "id": "DEC-1038",
        "title": "20% Discount Flash Sale on Summer Catalog",
        "category": "Marketing / Pricing",
        "date": "2025-06-10",
        "predicted": {
            "revenue": 9200000.0,
            "profit": 2400000.0,
            "revenue_change_pct": "+12.0%",
            "churn": 6.8
        },
        "actual": {
            "revenue": 9480000.0,
            "profit": 2450000.0,
            "revenue_change_pct": "+15.2%",
            "churn": 6.9
        },
        "accuracy": {
            "revenue_accuracy": FinanceEngine.calculate_accuracy(9200000.0, 9480000.0),
            "profit_accuracy": FinanceEngine.calculate_accuracy(2400000.0, 2450000.0),
            "churn_accuracy": FinanceEngine.calculate_accuracy(6.8, 6.9),
            "overall_accuracy": round((
                FinanceEngine.calculate_accuracy(9200000.0, 9480000.0) +
                FinanceEngine.calculate_accuracy(2400000.0, 2450000.0) +
                FinanceEngine.calculate_accuracy(6.8, 6.9)
            ) / 3.0, 1)
        },
        "observed_outcome": "Volume expansion compensated for margin compression. Acquired 3,400 new first-time purchasers.",
        "ai_lesson": "Seasonal discounts with high inventory turnover generate strong top-line spikes with minimal retention downside."
    }
]

class ActualResultInput(BaseModel):
    decision_id: str
    actual_revenue: float
    actual_profit: float
    actual_churn: float
    predicted_revenue: float = 8870000.0
    predicted_profit: float = 2340000.0
    predicted_churn: float = 7.5
    notes: str = ""

@router.get("/history")
def get_decision_history():
    """Retrieve historical business decisions and their logged outcomes."""
    return DECISION_MEMORY

@router.get("/prediction-vs-reality")
def get_prediction_vs_reality():
    """Dynamically calculates aggregated prediction vs reality accuracy benchmarks from all stored records."""
    if not DECISION_MEMORY:
        return {
            "overall_prediction_accuracy": 0.0,
            "revenue_prediction_accuracy": 0.0,
            "profit_prediction_accuracy": 0.0,
            "churn_prediction_accuracy": 0.0,
            "tracked_decisions_count": 0,
            "recent_evaluations": []
        }

    rev_accs = [item["accuracy"]["revenue_accuracy"] for item in DECISION_MEMORY]
    profit_accs = [item["accuracy"]["profit_accuracy"] for item in DECISION_MEMORY]
    churn_accs = [item["accuracy"]["churn_accuracy"] for item in DECISION_MEMORY]
    overall_accs = [item["accuracy"]["overall_accuracy"] for item in DECISION_MEMORY]

    return {
        "overall_prediction_accuracy": round(sum(overall_accs) / len(overall_accs), 1),
        "revenue_prediction_accuracy": round(sum(rev_accs) / len(rev_accs), 1),
        "profit_prediction_accuracy": round(sum(profit_accs) / len(profit_accs), 1),
        "churn_prediction_accuracy": round(sum(churn_accs) / len(churn_accs), 1),
        "tracked_decisions_count": len(DECISION_MEMORY),
        "recent_evaluations": DECISION_MEMORY
    }

@router.post("/record-actual")
def record_actual_result(data: ActualResultInput):
    """Logs the actual outcome and calculates real mathematical error and accuracy."""
    clean_id = data.decision_id
    if any(item["id"] == clean_id for item in DECISION_MEMORY):
        clean_id = f"{clean_id}-{uuid.uuid4().hex[:4].upper()}"

    # Calculate authentic mathematical accuracies
    rev_acc = FinanceEngine.calculate_accuracy(data.predicted_revenue, data.actual_revenue)
    profit_acc = FinanceEngine.calculate_accuracy(data.predicted_profit, data.actual_profit)
    churn_acc = FinanceEngine.calculate_accuracy(data.predicted_churn, data.actual_churn)
    overall_acc = round((rev_acc + profit_acc + churn_acc) / 3.0, 1)

    pct_rev_change = ((data.actual_revenue - 8240000.0) / 8240000.0) * 100.0

    new_entry = {
        "id": clean_id,
        "title": f"Decision {clean_id} Execution Review",
        "category": "Strategic Execution",
        "date": "2026-08-23",
        "predicted": {
            "revenue": data.predicted_revenue,
            "profit": data.predicted_profit,
            "revenue_change_pct": f"{((data.predicted_revenue - 8240000.0)/8240000.0)*100:+.1f}%",
            "churn": data.predicted_churn
        },
        "actual": {
            "revenue": data.actual_revenue,
            "profit": data.actual_profit,
            "revenue_change_pct": f"{pct_rev_change:+.1f}%",
            "churn": data.actual_churn
        },
        "accuracy": {
            "revenue_accuracy": rev_acc,
            "profit_accuracy": profit_acc,
            "churn_accuracy": churn_acc,
            "overall_accuracy": overall_acc
        },
        "observed_outcome": data.notes or f"Real-world financial outcome produced {rev_acc}% revenue accuracy against baseline prediction.",
        "ai_lesson": f"Prediction model calibrated. Revenue error was {abs(data.predicted_revenue - data.actual_revenue):,.0f} INR."
    }
    
    DECISION_MEMORY.insert(0, new_entry)
    return {"status": "success", "message": "Decision outcome recorded with authentic accuracy metrics.", "record": new_entry}
