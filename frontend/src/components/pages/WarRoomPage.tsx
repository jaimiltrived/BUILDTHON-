import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWarRoomQuery, useLogDecisionMutation } from '../../lib/queries';
import PlanCard from '../common/PlanCard';
import AIInsightCard from '../common/AIInsightCard';
import { Scale, Layers } from 'lucide-react';

interface WarRoomPageProps {
  onNavigate: (tab: string) => void;
}

export default function WarRoomPage({ onNavigate }: WarRoomPageProps) {
  const { user } = useAuth();
  const isAuditor = user?.role === 'AUDITOR';

  const { data } = useWarRoomQuery();
  const { mutate: logDecision } = useLogDecisionMutation(user?.organization_id || 'default');
  const [approvedPlan, setApprovedPlan] = useState<string | null>(null);

  const plans = data?.plans || [
    {
      name: "Plan A (Balanced Growth)",
      price_change: "+5%",
      risk_adjusted_score: 92,
      revenue_pct: "+7.2%",
      profit_pct: "+9.4%",
      churn_pct: "+0.4%",
      risk_level: "LOW",
      confidence: 94,
      components: {
        expected_profit: 2340000,
        risk_penalty: 15000,
        uncertainty_penalty: 22000,
        strategic_benefit: 85000
      }
    },
    {
      name: "Plan B (Aggressive Margin)",
      price_change: "+15%",
      risk_adjusted_score: 84,
      revenue_pct: "+14.8%",
      profit_pct: "+18.2%",
      churn_pct: "+2.8%",
      risk_level: "HIGH",
      confidence: 86,
      components: {
        expected_profit: 2910000,
        risk_penalty: 145000,
        uncertainty_penalty: 72000,
        strategic_benefit: 45000
      }
    },
    {
      name: "Plan C (Conservative Baseline)",
      price_change: "0%",
      risk_adjusted_score: 76,
      revenue_pct: "+0.0%",
      profit_pct: "+0.0%",
      churn_pct: "0.0%",
      risk_level: "LOW",
      confidence: 98,
      components: {
        expected_profit: 2120000,
        risk_penalty: 0,
        uncertainty_penalty: 10000,
        strategic_benefit: 0
      }
    }
  ];

  const recommendedPlan = data?.recommended_plan || "Plan A (Balanced Growth)";

  const handleApprove = (plan: any) => {
    if (isAuditor) return;
    setApprovedPlan(plan.name);

    logDecision({
      question: `Execute War Room Strategy: ${plan.name} (${plan.price_change})?`,
      proposed_action: `${plan.price_change} Adjustment`,
      ai_recommendation: `Approved via Decision War Room (${plan.risk_adjusted_score}/100 Risk-Adjusted Score)`,
      expected_profit: `₹${(plan.components.expected_profit / 100000).toFixed(1)}L`,
      risk: plan.risk_level,
      confidence: plan.confidence || 90,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232E42] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30">
              <Scale size={18} />
            </div>
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              DECISION WAR ROOM — MULTI-STRATEGY COMPARISON
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#182234] text-[#E8A33D] border border-[#E8A33D]/30 font-bold">
              Mathematical Scorecard
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Compare competing multi-scenario strategic plans evaluated by the Risk-Adjusted Decision Engine
          </p>
        </div>

        {isAuditor && (
          <span className="text-xs font-mono font-bold text-[#E8A33D] bg-[#E8A33D]/10 border border-[#E8A33D]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Layers size={13} /> Read-Only Compliance Mode Active
          </span>
        )}
      </div>

      {/* 3-Card Battle Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {plans.map((p: any) => {
          const isWinner = p.name === recommendedPlan;
          const isApproved = approvedPlan === p.name;
          return (
            <PlanCard
              key={p.name}
              name={p.name}
              price_change={p.price_change}
              score={p.risk_adjusted_score}
              revenue_pct={p.revenue_pct}
              profit_pct={p.profit_pct}
              churn_pct={p.churn_pct}
              risk_level={p.risk_level}
              expected_profit={`₹${(p.components.expected_profit / 100000).toFixed(1)}L`}
              components={p.components}
              winner={isWinner}
              approved={isApproved}
              disabled={isAuditor}
              onApprove={() => handleApprove(p)}
            />
          );
        })}
      </div>

      {/* AI Supervisor Strategic Evaluation */}
      <AIInsightCard
        title="AI Supervisor Strategic Evaluation"
        recommendation={data?.ai_rationale || "Plan A (+5% Balanced Growth) dominates Plan B (+15%) on a risk-adjusted basis (Score 92 vs 84)."}
        summary={data?.ai_rationale ? `Live Organic Evaluation: ${data.ai_rationale}` : "While Plan B displays higher headline revenue on paper (+14.8%), its steep churn penalty (-₹1.45L) in Tier-2 merchant accounts creates long-term value destruction. Plan A yields optimal customer lifetime value with high execution certainty."}
        confidence={plans.find((p: any) => p.name === recommendedPlan)?.confidence || 94}
        riskLevel={plans.find((p: any) => p.name === recommendedPlan)?.risk_level || "LOW"}
        why={[
          "Plan A avoids the -0.8 merchant price elasticity cliff observed above +7% hikes.",
          "Net annual operating profit improves by ₹6.2L without contractual churn.",
          "Mathematical scorecard gives Plan A 92/100 composite resilience."
        ]}
        evidence={[
          `Live Revenue Baseline: ₹${((data?.current_metrics?.revenue || 8240000) / 100000).toFixed(1)}L`,
          `Active Customer Base: ${(data?.current_metrics?.customers || 48200).toLocaleString()} merchants`,
          "Risk-Adjusted Value Formula = Profit Gain - Risk Penalty - Uncertainty Penalty + Strategic Benefit"
        ]}
        sourceAgents={[
          "Financial Observer Agent",
          "Simulation Engine Agent",
          "Risk Guardian Agent",
          "Recommendation Agent"
        ]}
        similarDecision={{
          id: "DEC-1038",
          time_ago: "Q1 2026",
          lesson: "+6% price realignment achieved 94.8% prediction accuracy with zero merchant cancellations."
        }}
        followUps={[
          "View full audit trail in the Decision Ledger",
          "Inspect customer churn sensitivity in the Risk Center",
          "Run a custom prompt scenario in the Simulator"
        ]}
        onFollowUpClick={() => onNavigate('chat')}
        onMemoryClick={() => onNavigate('memory')}
      />
    </div>
  );
}
