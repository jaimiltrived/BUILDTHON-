class RiskEngine:
    """
    Calculates the risk-adjusted value of a decision based on multiple risk factors.
    """
    
    @staticmethod
    def calculate_revenue_risk(current_revenue: float, projected_revenue: float) -> dict:
        drop = current_revenue - projected_revenue
        if drop > 0:
            score = (drop / current_revenue) * 100
            level = "HIGH" if score > 10 else "MEDIUM"
            return {"level": level, "score": round(score, 2), "penalty": drop * 0.5}
        return {"level": "LOW", "score": 0.0, "penalty": 0.0}
        
    @staticmethod
    def calculate_churn_risk(current_churn: float, projected_churn: float) -> dict:
        increase = projected_churn - current_churn
        if increase > 0:
            score = (increase / current_churn) * 100
            level = "HIGH" if score > 20 else "MEDIUM"
            # Assuming average LTV is 50,000 for penalty calculation
            penalty = (increase * 100) * 50000 
            return {"level": level, "score": round(score, 2), "penalty": penalty}
        return {"level": "LOW", "score": 0.0, "penalty": 0.0}

    @staticmethod
    def calculate_overall_risk(revenue_risk: dict, churn_risk: dict) -> dict:
        total_score = revenue_risk["score"] + churn_risk["score"]
        total_penalty = revenue_risk["penalty"] + churn_risk["penalty"]
        
        if total_score > 30:
            level = "HIGH"
        elif total_score > 10:
            level = "MEDIUM"
        else:
            level = "LOW"
            
        return {
            "level": level,
            "total_score": round(total_score, 2),
            "total_penalty": round(total_penalty, 2)
        }


if __name__ == "__main__":
    import json

    print("=" * 60)
    print(" FINANCIAL TIME MACHINE - RISK ENGINE SIMULATION")
    print("=" * 60)

    # Scenario 1: Growth Scenario (Revenue Up, Churn Stable)
    curr_rev, proj_rev = 10_000_000.0, 11_500_000.0
    curr_churn, proj_churn = 5.0, 4.8
    rev_risk_1 = RiskEngine.calculate_revenue_risk(curr_rev, proj_rev)
    churn_risk_1 = RiskEngine.calculate_churn_risk(curr_churn, proj_churn)
    overall_1 = RiskEngine.calculate_overall_risk(rev_risk_1, churn_risk_1)

    print("\n[Scenario 1: Expansion (+15% Revenue, -0.2% Churn)]")
    print(f"  Revenue Risk: {json.dumps(rev_risk_1)}")
    print(f"  Churn Risk:   {json.dumps(churn_risk_1)}")
    print(f"  Overall Risk: {json.dumps(overall_1)}")

    # Scenario 2: Moderate Risk (Slight Price Hike - Revenue +5%, Churn +1.2%)
    curr_rev, proj_rev = 10_000_000.0, 10_500_000.0
    curr_churn, proj_churn = 5.0, 6.2
    rev_risk_2 = RiskEngine.calculate_revenue_risk(curr_rev, proj_rev)
    churn_risk_2 = RiskEngine.calculate_churn_risk(curr_churn, proj_churn)
    overall_2 = RiskEngine.calculate_overall_risk(rev_risk_2, churn_risk_2)

    print("\n[Scenario 2: Price Increase (+5% Revenue, +1.2% Churn)]")
    print(f"  Revenue Risk: {json.dumps(rev_risk_2)}")
    print(f"  Churn Risk:   {json.dumps(churn_risk_2)}")
    print(f"  Overall Risk: {json.dumps(overall_2)}")

    # Scenario 3: High Risk / Downturn (-15% Revenue Drop, +3.0% Churn Spike)
    curr_rev, proj_rev = 10_000_000.0, 8_500_000.0
    curr_churn, proj_churn = 5.0, 8.0
    rev_risk_3 = RiskEngine.calculate_revenue_risk(curr_rev, proj_rev)
    churn_risk_3 = RiskEngine.calculate_churn_risk(curr_churn, proj_churn)
    overall_3 = RiskEngine.calculate_overall_risk(rev_risk_3, churn_risk_3)

    print("\n[Scenario 3: Market Contraction (-15% Revenue, +3.0% Churn)]")
    print(f"  Revenue Risk: {json.dumps(rev_risk_3)}")
    print(f"  Churn Risk:   {json.dumps(churn_risk_3)}")
    print(f"  Overall Risk: {json.dumps(overall_3)}")

    print("\n" + "=" * 60)
    print(" RISK ENGINE EXECUTION COMPLETE - ALL SCENARIOS EVALUATED")
    print("=" * 60)
