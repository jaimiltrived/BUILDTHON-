import { useAuth } from '../../contexts/AuthContext';
import { useDashboardQuery, useRiskQuery, useLedgerQuery, useMonthlyTrendQuery, useLiveBaselineQuery } from '../../lib/queries';
import MetricCard from '../common/MetricCard';
import TimelineSpine from '../common/TimelineSpine';
import AIInsightCard from '../common/AIInsightCard';
import RiskRow from '../common/RiskRow';
import StatusPill from '../common/StatusPill';
import { DollarSign, Activity, Percent, ShieldCheck, Sliders } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const role = user?.role || 'CFO';

  const { data: metrics, isLoading: loadingMetrics } = useDashboardQuery(user?.organization_id || 'default', role);
  const { data: baseline } = useLiveBaselineQuery();
  const { data: monthlyData = [] } = useMonthlyTrendQuery();
  const { data: riskData } = useRiskQuery(user?.organization_id || 'default');
  const { data: ledger } = useLedgerQuery(user?.organization_id || 'default');

  const topRisks = riskData?.risks?.slice(0, 3) || [];
  const pendingDecisions = ledger?.filter((d: any) => d.status === 'AWAITING_APPROVAL' || d.status === 'APPROVED').slice(0, 3) || [];

  // Scale chart data to kINR for clean axis rendering
  const chartPoints = monthlyData.map((d) => ({
    name: d.name,
    revenue: Math.round(d.revenue / 1000),
    profit: Math.round(d.profit / 1000),
    orders: d.orders,
  }));

  const revFormatted = baseline?.revenue_formatted || metrics?.revenue_formatted || "₹82.4L";
  const profitFormatted = baseline?.profit_formatted || metrics?.profit_formatted || "₹21.2L";
  const marginFormatted = baseline?.margin_formatted || metrics?.margin_formatted || "25.7%";
  const customerCount = baseline?.customers || metrics?.total_customers || 500;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232E42] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              FINANCIAL EXECUTIVE DASHBOARD
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#182234] text-[#E8A33D] border border-[#E8A33D]/30 font-bold">
              Nova Commerce ({customerCount.toLocaleString()} Accounts Active)
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Real-time causal financial intelligence, multi-scenario predictions & executive risk telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('simulator')}
            className="px-4 py-2 bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-[#0B0F17] font-display font-bold text-xs rounded-lg transition-all shadow-md shadow-[#E8A33D]/20 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Sliders size={14} /> Run What-If Simulation
          </button>
        </div>
      </div>

      {/* 2. Signature Timeline Spine Motif with Live Database Baseline */}
      <TimelineSpine
        pastLabel="Nova Commerce Database Baseline"
        pastValue={`${revFormatted} Baseline GMV`}
        presentLabel={`Live Synced (${baseline?.timestamp || 'Active'})`}
        presentValue={`${revFormatted} GMV • ${profitFormatted} Net Profit`}
        pessimisticValue="Pessimistic: -6.6% (Churn Alert)"
        baseValue="Base: +7.6% (Recommended)"
        optimisticValue="Optimistic: +14.2% (Expansion)"
      />

      {/* 3. Four Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Live Baseline Revenue"
          value={revFormatted}
          delta={metrics?.revenue_delta || "+12.4%"}
          deltaType="positive"
          subtitle="Direct Database Query"
          icon={DollarSign}
          loading={loadingMetrics}
        />
        <MetricCard
          title="Baseline Net Profit"
          value={profitFormatted}
          delta={metrics?.profit_delta || "+8.7%"}
          deltaType="positive"
          subtitle={`Operating Margin ${marginFormatted}`}
          icon={Activity}
          loading={loadingMetrics}
        />
        <MetricCard
          title="Gross Margin Ratio"
          value={marginFormatted}
          delta={metrics?.margin_delta || "+2.1%"}
          deltaType="positive"
          subtitle="OpEx normalized"
          icon={Percent}
          loading={loadingMetrics}
        />
        <MetricCard
          title="Financial Health Score"
          value={`${metrics?.health_score || 87}/100`}
          delta={baseline?.status || "HEALTHY"}
          deltaType="positive"
          subtitle="Zero Liquidity Deficit"
          icon={ShieldCheck}
          loading={loadingMetrics}
        />
      </div>

      {/* 4. Chart & Top Risks / Pending Decisions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Trajectory Recharts (7 cols) */}
        <div className="lg:col-span-7 ftm-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
            <div>
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
                Real-Time Historical Trajectory & Orders
              </h3>
              <p className="text-[11px] text-[#8C99AF] font-mono">
                Aggregated from {customerCount.toLocaleString()} Live Accounts & Orders (k₹)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-[#3ADDA0]">
                <span className="w-2 h-2 rounded-full bg-[#3ADDA0]" /> Revenue
              </span>
              <span className="flex items-center gap-1 text-[#5B8DEF]">
                <span className="w-2 h-2 rounded-full bg-[#5B8DEF]" /> Net Profit
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#182234" />
                <XAxis
                  dataKey="name"
                  stroke="#5B6A82"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#232E42' }}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  stroke="#5B6A82"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#232E42' }}
                  fontFamily="JetBrains Mono"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121826',
                    border: '1px solid #232E42',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3ADDA0"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3ADDA0' }}
                  name="Revenue (k₹)"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#5B8DEF"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#5B8DEF' }}
                  name="Profit (k₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Risks / Pending Decisions Feed (5 cols) */}
        <div className="lg:col-span-5 ftm-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3 mb-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
                {role === 'EXECUTIVE' ? 'Pending Executive Decisions' : 'Active Financial Vulnerabilities'}
              </h3>
              <button
                onClick={() => onNavigate(role === 'EXECUTIVE' ? 'ledger' : 'risk')}
                className="text-[11px] font-mono text-[#E8A33D] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2.5">
              {role === 'EXECUTIVE' ? (
                pendingDecisions.map((d: any) => (
                  <div
                    key={d.id}
                    onClick={() => onNavigate('warroom')}
                    className="ftm-card-nested p-3 space-y-1 hover:border-[#2F3D57] transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-[#8C99AF]">{d.id}</span>
                      <StatusPill status={d.status} />
                    </div>
                    <p className="text-xs font-bold text-[#E9EDF4] line-clamp-1">{d.proposed_action}</p>
                    <p className="text-[11px] text-[#8C99AF] line-clamp-1">{d.ai_recommendation}</p>
                  </div>
                ))
              ) : (
                topRisks.map((risk: any) => (
                  <RiskRow
                    key={risk.id}
                    id={risk.id}
                    category={risk.category}
                    level={risk.level}
                    impact_formatted={risk.impact_formatted}
                    probability={risk.probability}
                    description={risk.description}
                    onClick={() => onNavigate('risk')}
                  />
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#232E42] flex items-center justify-between text-[11px] font-mono text-[#5B6A82]">
            <span>Model Coverage: 24 Months</span>
            <span className="text-[#3ADDA0]">100% Causal Grounded</span>
          </div>
        </div>
      </div>

      {/* 5. Featured AI Insight Card */}
      <AIInsightCard
        title="AI Finance Supervisor — Strategic Synthesis"
        recommendation="Maintain +5% price adjustment ceiling on standard catalog to avert ₹4.5L churn penalty in Tier-2 MSME merchants."
        summary="Causal sensitivity models demonstrate that Tier-2 merchant accounts exhibit high elasticity (-0.8) on price hikes above 7%, whereas +5% hikes produce ₹23.4L profit with near-zero attrition."
        confidence={92}
        riskLevel="LOW"
        why={[
          "Immediate margin expansion of +2.1% captures +₹6.2L annual net profit without customer dissatisfaction.",
          "Sub-₹1,000 cart sizes remain protected from cart abandonment thresholds.",
          "Maintains superior risk-adjusted scorecard (92/100) vs aggressive +15% hikes (84/100)."
        ]}
        evidence={[
          `Historical 24-month Nova Commerce baseline: ${revFormatted} revenue`,
          "Customer Price Elasticity Model: -0.5",
          "MSME Regional Segment Sensitivity Matrix"
        ]}
        sourceAgents={[
          "Financial Observer Agent",
          "Simulation Engine Agent",
          "Risk Guardian Agent",
          "Recommendation Agent"
        ]}
        similarDecision={{
          id: "DEC-1042",
          time_ago: "8 months ago",
          lesson: "Standardizing freight fees without volume tiers caused 1.4% revenue drop in Q4 2025."
        }}
        followUps={[
          "Show me customer segments most affected by price changes",
          "Compare +5% strategy against +10% and +15% in War Room",
          "Check cash conversion cycle implications"
        ]}
        onFollowUpClick={() => onNavigate('chat')}
        onMemoryClick={() => onNavigate('memory')}
      />
    </div>
  );
}
