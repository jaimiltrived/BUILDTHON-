from typing import Dict, Any, List
import math

class FinanceEngine:
    """
    Layer A: Deterministic Finance Engine
    Core financial arithmetic, statistical models, second-order effects, and accuracy metrics.
    """
    
    @staticmethod
    def calculate_gross_margin(revenue: float, cogs: float) -> float:
        if revenue <= 0:
            return 0.0
        return (revenue - cogs) / revenue

    @staticmethod
    def calculate_operating_margin(revenue: float, operating_expenses: float, cogs: float) -> float:
        if revenue <= 0:
            return 0.0
        operating_income = revenue - cogs - operating_expenses
        return operating_income / revenue

    @staticmethod
    def calculate_profit(revenue: float, expenses: float) -> float:
        return revenue - expenses

    @staticmethod
    def calculate_roi(net_profit: float, investment_cost: float) -> float:
        if investment_cost <= 0:
            return 0.0
        return (net_profit / investment_cost) * 100.0

    @staticmethod
    def calculate_clv(average_purchase_value: float, average_purchase_frequency: float, average_customer_lifespan: float) -> float:
        customer_value = average_purchase_value * average_purchase_frequency
        return customer_value * average_customer_lifespan

    @staticmethod
    def calculate_churn_rate(customers_beginning: int, customers_lost: int) -> float:
        if customers_beginning <= 0:
            return 0.0
        return min(1.0, max(0.0, customers_lost / customers_beginning))

    @staticmethod
    def calculate_cash_flow(operating_cash: float, investing_cash: float, financing_cash: float) -> float:
        return operating_cash + investing_cash + financing_cash

    @staticmethod
    def calculate_accuracy(predicted: float, actual: float) -> float:
        """
        Mathematical accuracy calculation: 100 - (abs(predicted - actual) / abs(actual) * 100)
        Guards against division by zero and clamps between 0.0 and 100.0.
        """
        if actual == 0:
            if predicted == 0:
                return 100.0
            return 0.0
        pct_error = (abs(predicted - actual) / abs(actual)) * 100.0
        return round(max(0.0, min(100.0, 100.0 - pct_error)), 2)

    @staticmethod
    def calculate_risk_adjusted_value(
        expected_benefit: float,
        risk_penalty: float,
        uncertainty_penalty: float,
        strategic_benefit: float = 0.0
    ) -> float:
        """
        Risk-Adjusted Value = Expected Benefit - Risk Penalty - Uncertainty Penalty + Strategic Benefit
        """
        score = expected_benefit - risk_penalty - uncertainty_penalty + strategic_benefit
        return round(score, 2)

    @staticmethod
    def calculate_second_order_effects(
        price_change_pct: float,
        baseline_churn: float = 0.071,
        elasticity: float = -0.55,
        segment_weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Calculates direct, indirect, and long-term consequences of strategic adjustments.
        Uses elasticity curves across customer segments: High-Value (-0.35), Price-Sensitive (-1.2), Standard (-0.55).
        """
        if segment_weights is None:
            segment_weights = {"High Value": 0.20, "Price Sensitive": 0.50, "Standard": 0.30}

        # Weighted aggregate elasticity
        weighted_elasticity = (
            segment_weights.get("High Value", 0.2) * -0.35 +
            segment_weights.get("Price Sensitive", 0.5) * -1.20 +
            segment_weights.get("Standard", 0.3) * elasticity
        )

        volume_impact_pct = price_change_pct * weighted_elasticity
        
        # Churn amplification multiplier for large positive price hikes
        churn_multiplier = 1.0
        if price_change_pct > 0.05:
            churn_multiplier = 1.0 + (price_change_pct * 2.2)
        elif price_change_pct < 0:
            churn_multiplier = max(0.6, 1.0 + (price_change_pct * 1.5))
            
        projected_churn = min(0.95, max(0.01, baseline_churn * churn_multiplier))
        churn_delta_pct = projected_churn - baseline_churn

        return {
            "direct_volume_impact_pct": round(volume_impact_pct * 100, 2),
            "projected_churn_rate": round(projected_churn, 4),
            "churn_delta_pct": round(churn_delta_pct * 100, 2),
            "weighted_elasticity": round(weighted_elasticity, 3),
            "price_sensitivity_warning": churn_delta_pct > 0.015
        }

    @staticmethod
    def calculate_confidence(
        sample_size: int,
        volatility: float = 0.08,
        historical_accuracy: float = 95.0,
        assumption_count: int = 3
    ) -> int:
        """
        Derives authentic confidence score (0 - 100) based on empirical data quality:
        - Sample size weighting (logarithmic scaling)
        - Historical volatility penalty
        - Track record accuracy weighting
        - Assumption count penalty
        """
        size_factor = min(35.0, 10.0 * math.log10(max(10, sample_size)))  # max 35 pts
        accuracy_factor = (historical_accuracy / 100.0) * 45.0             # max 45 pts
        volatility_penalty = min(20.0, volatility * 100.0)                 # up to -20 pts
        assumption_penalty = assumption_count * 2.5                        # -2.5 pts per assumption
        
        raw_confidence = size_factor + accuracy_factor - volatility_penalty - assumption_penalty + 20.0
        return int(max(40, min(99, round(raw_confidence))))
