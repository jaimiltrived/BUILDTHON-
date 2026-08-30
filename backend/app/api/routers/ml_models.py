from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.api import deps
from app.models.user import User
from app.ml.financial_ml_engine import financial_ml_engine

router = APIRouter()


class ChurnPredictRequest(BaseModel):
    price_delta_percentage: float = 0.05
    accounts_sample: Optional[List[Dict[str, Any]]] = None


class PriceOptimizeRequest(BaseModel):
    current_revenue: Optional[float] = 8240000.0
    current_profit: Optional[float] = 2120000.0


@router.get("/metrics")
def get_ml_model_metrics(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Returns live performance telemetry for all production ML models:
    - ROC-AUC Score, Accuracy, Precision, Recall
    - Gradient Boosting R² Elasticity Metric
    - Ranked Feature Importance Weights
    """
    return {
        "status": "HEALTHY",
        "models": financial_ml_engine.metrics,
        "feature_importances": financial_ml_engine.feature_importances
    }


@router.post("/predict-churn")
def predict_churn(
    req: ChurnPredictRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Executes Random Forest inference to predict cohort churn rates under a simulated price change.
    """
    return financial_ml_engine.predict_churn_risk(
        price_delta_pct=req.price_delta_percentage,
        accounts_sample=req.accounts_sample
    )


@router.post("/optimize-price")
def optimize_price(
    req: PriceOptimizeRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Executes Gradient Boosting regression to calculate the optimal price point on the continuous profit curve.
    """
    return financial_ml_engine.optimize_price_point(
        current_revenue=req.current_revenue or 8240000.0,
        current_profit=req.current_profit or 2120000.0
    )


@router.post("/retrain")
def retrain_models(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Triggers live model retraining against the corporate data repository.
    """
    metrics = financial_ml_engine.train_all_models()
    return {
        "status": "RETRAINED_SUCCESSFULLY",
        "timestamp": metrics.get("last_trained_at"),
        "updated_metrics": metrics
    }
