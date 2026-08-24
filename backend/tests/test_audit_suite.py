import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app
from app.analytics.finance_engine import FinanceEngine

def test_full_suite():
    client = TestClient(app)
    print("=== FINANCIAL TIME MACHINE FULL AUDIT SUITE ===")
    
    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("[PASS] 1. Health check:", res.json()["status"])

    # 2. AI Status
    res = client.get("/api/ai/status")
    assert res.status_code == 200, f"AI status failed: {res.status_code}"
    status_data = res.json()
    assert "mode" in status_data
    assert "is_llm" in status_data
    print(f"[PASS] 2. AI Status ({status_data['mode']}): is_llm={status_data['is_llm']}, label='{status_data['label']}'")

    # 3. What-If Simulation (+10%)
    res = client.post("/api/simulations/simulate-price", json={"percentage_increase": 0.10, "decision_type": "Price Change"})
    assert res.status_code == 200, f"Simulation failed: {res.status_code}"
    sim_data = res.json()
    assert "scenarios" in sim_data["simulation"]
    assert "optimistic" in sim_data["simulation"]["scenarios"]
    assert "base" in sim_data["simulation"]["scenarios"]
    assert "pessimistic" in sim_data["simulation"]["scenarios"]
    base_rev = sim_data["simulation"]["scenarios"]["base"]["revenue"]
    print(f"[PASS] 3. Simulation Engine (+10%): Base Revenue = INR {base_rev:,.0f}, Risk = {sim_data['risk_analysis']['level']}")

    # 4. Decision War Room
    res = client.get("/api/war-room/compare")
    assert res.status_code == 200, f"War Room failed: {res.status_code}"
    wr_data = res.json()
    assert len(wr_data["plans"]) == 3
    print(f"[PASS] 4. Decision War Room: Ranked #1 = {wr_data['recommended_plan']} with Score = {wr_data['plans'][0]['risk_adjusted_score']}/100")

    # 5. AI Multi-Agent Analysis
    res = client.post("/api/ai/analyze", json={"decision_type": "Price Change", "parameter_value": 0.10})
    assert res.status_code == 200, f"AI analyze failed: {res.status_code}"
    ai_data = res.json()
    assert "pipeline_steps" in ai_data
    assert "uncertainty_range" in ai_data
    assert "why" in ai_data
    print(f"[PASS] 5. AI Multi-Agent Analysis: Pipeline Steps = {len(ai_data['pipeline_steps'])}, Uncertainty = [{ai_data['uncertainty_range']['pessimistic_revenue']:,.0f} - {ai_data['uncertainty_range']['expected_revenue']:,.0f} - {ai_data['uncertainty_range']['optimistic_revenue']:,.0f}]")

    # 6. AI Chat Intent Controller
    res = client.post("/api/ai/chat", json={"message": "What if price +10%?"})
    assert res.status_code == 200, f"AI chat failed: {res.status_code}"
    chat_data = res.json()
    assert "reply" in chat_data
    assert "pipeline_steps" in chat_data
    print(f"[PASS] 6. AI Chat Controller: Source Agents = {chat_data['source_agents']}")

    # 7. Decision Ledger
    res = client.get("/api/ledger/")
    assert res.status_code == 200, f"Ledger get failed: {res.status_code}"
    ledger_entries = res.json()
    print(f"[PASS] 7. Decision Ledger GET: {len(ledger_entries)} entries retrieved")

    # 8. Create Ledger Entry
    res = client.post("/api/ledger/", json={
        "question": "Expand logistics network +15%?",
        "proposed_action": "+15% Logistics Expansion",
        "ai_recommendation": "Approve with 60-day milestone review",
        "expected_profit": "INR 24.8L",
        "risk": "LOW",
        "confidence": 92
    })
    assert res.status_code == 200, f"Ledger create failed: {res.status_code}"
    created_entry = res.json()
    print(f"[PASS] 8. Decision Ledger POST: Created entry {created_entry['id']} with status '{created_entry['status']}'")

    # 9. Update Ledger Status
    res = client.patch(f"/api/ledger/{created_entry['id']}/status", json={"status": "APPROVED"})
    assert res.status_code == 200, f"Ledger patch failed: {res.status_code}"
    assert res.json()["status"] == "APPROVED"
    print(f"[PASS] 9. Decision Ledger PATCH: Updated {created_entry['id']} status to 'APPROVED'")

    # 10. Prediction vs Reality Dynamic Accuracy
    res = client.get("/api/memory/prediction-vs-reality")
    assert res.status_code == 200, f"Prediction vs reality failed: {res.status_code}"
    pvr_data = res.json()
    assert "overall_prediction_accuracy" in pvr_data
    print(f"[PASS] 10. Prediction vs Reality GET: Overall Accuracy = {pvr_data['overall_prediction_accuracy']}%, Revenue Accuracy = {pvr_data['revenue_prediction_accuracy']}%")

    # 11. Record Actual Outcome with Real Math
    res = client.post("/api/memory/record-actual", json={
        "decision_id": "DEC-TEST",
        "actual_revenue": 8750000.0,
        "actual_profit": 2300000.0,
        "actual_churn": 7.6,
        "predicted_revenue": 8870000.0,
        "predicted_profit": 2340000.0,
        "predicted_churn": 7.5,
        "notes": "Validation test record"
    })
    assert res.status_code == 200, f"Record actual failed: {res.status_code}"
    rec_record = res.json()["record"]
    expected_rev_acc = FinanceEngine.calculate_accuracy(8870000.0, 8750000.0)
    assert rec_record["accuracy"]["revenue_accuracy"] == expected_rev_acc
    print(f"[PASS] 11. Record Actual Outcome POST: Dynamic Revenue Accuracy = {rec_record['accuracy']['revenue_accuracy']}% (Calculated authentically)")

    print("\n>>> ALL 11 AUDIT SUITE TESTS PASSED 100% CLEANLY! <<<")

if __name__ == "__main__":
    test_full_suite()
