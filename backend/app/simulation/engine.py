from typing import Dict, Any
from app.analytics.finance_engine import FinanceEngine
from app.analytics.risk_engine import RiskEngine

class SimulationEngine:
    def __init__(
        self,
        current_revenue: float = 8240000.0,
        current_profit: float = 2120000.0,
        current_churn: float = 0.071,
        current_customers: int = 48200
    ):
        self.current_revenue = current_revenue
        self.current_profit = current_profit
        self.current_churn = current_churn
        self.current_customers = current_customers
        self.current_expenses = current_revenue - current_profit

    def _calculate_scenario(
        self,
        percentage_increase: float,
        elasticity: float,
        churn_multiplier: float,
        cost_variability: float = 0.65,
        marketing_spend_pct: float = 0.0,
        delivery_surcharge: float = 0.0
    ) -> Dict[str, Any]:
        # 1st Order Effect: Volume elasticity from price change
        price_volume_change_pct = percentage_increase * elasticity
        
        # Marketing Lever Impact: Volume lift & Acquisition costs
        marketing_volume_lift = (marketing_spend_pct * 0.45)  # e.g. 10% marketing -> +4.5% volume lift
        marketing_cost = self.current_revenue * (marketing_spend_pct * 0.06)  # Marketing campaign budget
        
        # Delivery Surcharge Lever Impact: Direct fee collection & small cart friction
        # Assuming ~65% of accounts make monthly deliveries
        monthly_orders = self.current_customers * 0.65
        delivery_fee_revenue = delivery_surcharge * monthly_orders
        delivery_friction_churn = (delivery_surcharge / 100.0) * 0.015 if delivery_surcharge > 10 else 0.0

        # Net volume multiplier
        total_volume_change_pct = price_volume_change_pct + marketing_volume_lift
        
        # New Revenue = Base price-adjusted revenue + Delivery surcharge revenue
        new_product_revenue = self.current_revenue * (1.0 + percentage_increase) * (1.0 + total_volume_change_pct)
        new_revenue = new_product_revenue + delivery_fee_revenue
        
        # Cost dynamics: Fixed expenses (35%) + Variable expenses (65% scales with volume) + Marketing OpEx
        fixed_costs = self.current_expenses * (1.0 - cost_variability)
        variable_costs = (self.current_expenses * cost_variability) * (1.0 + total_volume_change_pct)
        new_expenses = fixed_costs + variable_costs + marketing_cost
        new_profit = new_revenue - new_expenses
        
        # Margins & Cash flow
        operating_margin = FinanceEngine.calculate_operating_margin(new_revenue, new_expenses * 0.4, new_expenses * 0.6)
        cash_flow = new_profit * 0.88  # Operating cash flow conversion
        
        # 2nd Order Churn & Customer retention
        second_order_churn_effect = abs(price_volume_change_pct) * 0.35 + delivery_friction_churn
        new_churn = min(0.95, max(0.01, self.current_churn + (percentage_increase * churn_multiplier) + second_order_churn_effect - (marketing_volume_lift * 0.1)))
        retained_customers = int(self.current_customers * (1.0 - new_churn))
        
        # Scenario ROI
        scenario_roi = FinanceEngine.calculate_roi(new_profit - self.current_profit, max(10000.0, abs(percentage_increase) * 50000.0 + marketing_cost))
        
        # Dynamic Risk for this scenario
        rev_risk = RiskEngine.calculate_revenue_risk(self.current_revenue, new_revenue)
        churn_risk = RiskEngine.calculate_churn_risk(self.current_churn, new_churn)
        overall_risk = RiskEngine.calculate_overall_risk(rev_risk, churn_risk)
        
        # Derived Confidence
        confidence = FinanceEngine.calculate_confidence(sample_size=self.current_customers, volatility=0.06, historical_accuracy=94.0)

        return {
            "revenue": round(new_revenue, 2),
            "expenses": round(new_expenses, 2),
            "profit": round(new_profit, 2),
            "margin": round(operating_margin * 100, 1),
            "cash_flow": round(cash_flow, 2),
            "customers": retained_customers,
            "churn": round(new_churn, 4),
            "roi": round(scenario_roi, 1),
            "risk_score": overall_risk["total_penalty"],
            "risk_level": overall_risk["level"],
            "confidence": confidence
        }

    def simulate_price_change(
        self,
        percentage_increase: float,
        marketing_spend_pct: float = 0.0,
        delivery_surcharge: float = 0.0
    ) -> Dict[str, Any]:
        """
        Simulates the effect of multi-lever strategic parameters dynamically derived from live baseline numbers.
        Returns complete Optimistic, Base, and Pessimistic scenarios.
        """
        # Base Scenario (Expected elasticity = -0.55, churn multiplier = 0.22)
        base = self._calculate_scenario(
            percentage_increase,
            elasticity=-0.55,
            churn_multiplier=0.22,
            marketing_spend_pct=marketing_spend_pct,
            delivery_surcharge=delivery_surcharge
        )
        
        # Optimistic Scenario (Loyal retention, elasticity = -0.28, low churn multiplier = 0.08)
        optimistic = self._calculate_scenario(
            percentage_increase,
            elasticity=-0.28,
            churn_multiplier=0.08,
            marketing_spend_pct=marketing_spend_pct,
            delivery_surcharge=delivery_surcharge
        )
        
        # Pessimistic Scenario (High churn elasticity = -0.85, high churn multiplier = 0.42)
        pessimistic = self._calculate_scenario(
            percentage_increase,
            elasticity=-0.85,
            churn_multiplier=0.42,
            marketing_spend_pct=marketing_spend_pct,
            delivery_surcharge=delivery_surcharge
        )
        
        second_order = FinanceEngine.calculate_second_order_effects(
            price_change_pct=percentage_increase,
            baseline_churn=self.current_churn,
            elasticity=-0.55
        )

        return {
            "current": {
                "revenue": self.current_revenue,
                "profit": self.current_profit,
                "churn": self.current_churn,
                "customers": self.current_customers
            },
            "scenarios": {
                "optimistic": optimistic,
                "base": base,
                "pessimistic": pessimistic
            },
            "uncertainty_range": {
                "pessimistic_revenue": pessimistic["revenue"],
                "expected_revenue": base["revenue"],
                "optimistic_revenue": optimistic["revenue"],
                "confidence_pct": base["confidence"]
            },
            "deltas": {
                "revenue": round(base["revenue"] - self.current_revenue, 2),
                "profit": round(base["profit"] - self.current_profit, 2),
                "churn_pct": round((base["churn"] - self.current_churn) * 100, 2)
            },
            "second_order_effects": second_order
        }
