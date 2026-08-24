from typing import Dict, Any
from app.simulation.engine import SimulationEngine
from app.analytics.finance_engine import FinanceEngine
from app.analytics.risk_engine import RiskEngine

def get_financial_metrics(current_revenue: float = 8240000.0, current_profit: float = 2120000.0, current_churn: float = 0.071, current_customers: int = 48200) -> Dict[str, Any]:
    """Retrieve the current observed baseline financial metrics."""
    return {
        "revenue": current_revenue,
        "profit": current_profit,
        "gross_margin": FinanceEngine.calculate_gross_margin(current_revenue, current_revenue - current_profit),
        "churn": current_churn,
        "customers": current_customers,
        "financial_health_score": 87,
        "status": "HEALTHY"
    }

def simulate_price_change_tool(percentage_increase: float, current_revenue: float = 8240000.0, current_profit: float = 2120000.0, current_churn: float = 0.071, current_customers: int = 48200) -> Dict[str, Any]:
    """Simulates a price increase using the deterministic 3-scenario simulation engine."""
    engine = SimulationEngine(current_revenue, current_profit, current_churn, current_customers)
    sim = engine.simulate_price_change(percentage_increase)
    
    base_res = sim["scenarios"]["base"]
    rev_risk = RiskEngine.calculate_revenue_risk(current_revenue, base_res["revenue"])
    churn_risk = RiskEngine.calculate_churn_risk(current_churn, base_res["churn"])
    overall_risk = RiskEngine.calculate_overall_risk(rev_risk, churn_risk)
    
    return {
        "scenarios": sim["scenarios"],
        "deltas": sim["deltas"],
        "risk": overall_risk
    }

def calculate_risk_adjusted_value(expected_benefit: float, risk_penalty: float, uncertainty_penalty: float, strategic_benefit: float) -> float:
    """Computes Risk-Adjusted Value = Expected Benefit - Risk Penalty - Uncertainty Penalty + Strategic Benefit"""
    return expected_benefit - risk_penalty - uncertainty_penalty + strategic_benefit
