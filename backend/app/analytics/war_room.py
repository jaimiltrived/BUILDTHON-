from typing import List, Dict, Any
from app.simulation.engine import SimulationEngine
from app.analytics.risk_engine import RiskEngine
from app.analytics.finance_engine import FinanceEngine

class WarRoomEngine:
    """
    Decision War Room Engine:
    Compares Plan A (+5%), Plan B (+10%), and Plan C (+15%).
    Calculates Risk-Adjusted Value = Expected Financial Benefit - Risk Penalty - Uncertainty Penalty + Strategic Benefit.
    Ranks the strategies based on mathematical risk-adjusted score without hardcoding.
    """
    
    @staticmethod
    def compare_strategies(
        current_revenue: float = 8240000.0,
        current_profit: float = 2120000.0,
        current_churn: float = 0.071,
        current_customers: int = 48200
    ) -> Dict[str, Any]:
        engine = SimulationEngine(current_revenue, current_profit, current_churn, current_customers)
        
        plans_config = [
            {"name": "Plan A", "price_inc": 0.05, "label": "+5%", "strategic_benefit": 150000.0, "uncertainty_factor": 0.04},
            {"name": "Plan B", "price_inc": 0.10, "label": "+10%", "strategic_benefit": 200000.0, "uncertainty_factor": 0.09},
            {"name": "Plan C", "price_inc": 0.15, "label": "+15%", "strategic_benefit": 250000.0, "uncertainty_factor": 0.18},
        ]
        
        plans_result = []
        for p in plans_config:
            sim = engine.simulate_price_change(p["price_inc"])
            base = sim["scenarios"]["base"]
            
            revenue_delta_pct = round(((base["revenue"] - current_revenue) / current_revenue) * 100, 1)
            profit_delta_pct = round(((base["profit"] - current_profit) / current_profit) * 100, 1)
            churn_delta_pct = round((base["churn"] - current_churn) * 100, 1)
            
            # Risk calculations
            rev_risk = RiskEngine.calculate_revenue_risk(current_revenue, base["revenue"])
            churn_risk = RiskEngine.calculate_churn_risk(current_churn, base["churn"])
            overall_risk = RiskEngine.calculate_overall_risk(rev_risk, churn_risk)
            
            expected_profit_gain = max(0.0, base["profit"] - current_profit)
            risk_penalty = float(overall_risk["total_penalty"])
            uncertainty_penalty = current_profit * p["uncertainty_factor"]
            strategic_benefit = p["strategic_benefit"]
            
            # Risk-Adjusted Value Calculation
            raw_risk_adjusted_value = FinanceEngine.calculate_risk_adjusted_value(
                expected_benefit=expected_profit_gain,
                risk_penalty=risk_penalty,
                uncertainty_penalty=uncertainty_penalty,
                strategic_benefit=strategic_benefit
            )
            
            # Dynamic Mathematical Score (10 to 99 scale)
            # Higher net risk-adjusted gain relative to baseline profit scales the score
            profit_scale = max(100000.0, current_profit * 0.20)
            score_delta = (raw_risk_adjusted_value / profit_scale) * 25.0
            risk_adjusted_score = int(max(15, min(98, round(70.0 + score_delta))))
            
            plans_result.append({
                "name": p["name"],
                "price_change": p["label"],
                "revenue_pct": f"+{revenue_delta_pct}%" if revenue_delta_pct >= 0 else f"{revenue_delta_pct}%",
                "profit_pct": f"+{profit_delta_pct}%" if profit_delta_pct >= 0 else f"{profit_delta_pct}%",
                "churn_pct": f"+{churn_delta_pct}%" if churn_delta_pct >= 0 else f"{churn_delta_pct}%",
                "risk_level": overall_risk["level"],
                "risk_adjusted_score": risk_adjusted_score,
                "confidence": base["confidence"],
                "components": {
                    "expected_profit": round(base["profit"], 2),
                    "expected_profit_gain": round(expected_profit_gain, 2),
                    "risk_penalty": round(risk_penalty, 2),
                    "uncertainty_penalty": round(uncertainty_penalty, 2),
                    "strategic_benefit": round(strategic_benefit, 2),
                    "net_risk_adjusted_value": round(raw_risk_adjusted_value, 2)
                },
                "scenarios": sim["scenarios"]
            })
            
        # Recommend the highest risk-adjusted score
        recommended = max(plans_result, key=lambda x: x["risk_adjusted_score"])
        
        return {
            "current_metrics": {
                "revenue": current_revenue,
                "profit": current_profit,
                "churn": current_churn,
                "customers": current_customers
            },
            "plans": plans_result,
            "recommended_plan": recommended["name"],
            "ai_rationale": (
                f"{recommended['name']} ({recommended['price_change']}) is mathematically ranked #1 with a "
                f"risk-adjusted score of {recommended['risk_adjusted_score']}/100. It maximizes net profit expansion "
                f"(₹{recommended['components']['expected_profit_gain']:,.0f}) while minimizing churn penalties and uncertainty."
            )
        }
