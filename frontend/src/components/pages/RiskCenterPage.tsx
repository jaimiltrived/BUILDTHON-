import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRiskQuery } from '../../lib/queries';
import RiskRow from '../common/RiskRow';
import StatusPill from '../common/StatusPill';
import AuditTrail, { type AuditTrailStep } from '../common/AuditTrail';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function RiskCenterPage() {
  const { user } = useAuth();
  const { data: riskData, isLoading, refetch } = useRiskQuery(user?.organization_id || 'default');
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>('RISK-01');

  const risks = riskData?.risks || [];
  const selectedRisk = risks.find((r: any) => r.id === selectedRiskId) || risks[0];

  const overallScore = riskData?.overall_score || 48;
  const overallLevel = riskData?.overall_level || 'MEDIUM';

  const riskTrailSteps: AuditTrailStep[] = selectedRisk
    ? [
        {
          step: 1,
          title: "Vulnerability Detection & Root Cause",
          timestamp: "Continuous Causal Sentinel",
          actor: "Risk Guardian Agent",
          details: selectedRisk.root_cause,
          evidence_tag: "Elasticity Model -0.8"
        },
        {
          step: 2,
          title: "Affected Enterprise Segment & Cohort Exposure",
          timestamp: "Account Ledger Analysis",
          actor: "Financial Observer Agent",
          details: `Directly impacts: ${selectedRisk.affected_segment}. Estimated revenue vulnerability: ${selectedRisk.impact_formatted}.`,
          evidence_tag: `${selectedRisk.probability}% Occurrence Probability`
        },
        {
          step: 3,
          title: "AI Recommended Mitigation & Policy Control",
          timestamp: "Strategic Policy Engine",
          actor: "AI Finance Supervisor",
          details: selectedRisk.mitigation,
          evidence_tag: `Confidence Score: ${selectedRisk.confidence}%`
        }
      ]
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232E42] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#F1584F]/10 text-[#F1584F] border border-[#F1584F]/30">
              <ShieldAlert size={18} />
            </div>
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              ENTERPRISE RISK GUARDIAN CENTER
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#182234] text-[#E8A33D] border border-[#E8A33D]/30 font-bold">
              Autonomous Sentinel
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Real-time causal risk monitoring, customer elasticity thresholds & automated mitigation protocols
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#182234] hover:bg-[#182234]/80 text-[#8C99AF] hover:text-[#E9EDF4] border border-[#232E42] text-xs font-mono font-bold transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Telemetry
        </button>
      </div>

      {/* Overall Composite Score Bar */}
      <div className="ftm-card p-6 space-y-4 border border-[#232E42]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82]">
              Enterprise Composite Risk Vulnerability
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-bold font-mono text-[#E8A33D]">
                {overallScore}
              </span>
              <span className="text-sm font-mono text-[#5B6A82]">/ 100</span>
              <StatusPill status={overallLevel} />
            </div>
          </div>
          <p className="text-xs text-[#8C99AF] max-w-md text-right font-sans">
            Composite score synthesized across price elasticity, freight friction, supplier inflation, and liquidity buffers.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="h-2.5 bg-[#0B0F17] rounded-full overflow-hidden p-0.5 border border-[#232E42]">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#3ADDA0] via-[#E8A33D] to-[#F1584F]"
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#5B6A82]">
            <span>0 (Safe Resilience)</span>
            <span>50 (Moderate Friction)</span>
            <span>100 (Critical Vulnerability)</span>
          </div>
        </div>
      </div>

      {/* Ranked Risks & Connected-Dot Detail Trail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Ranked Risk List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
              Ranked Risk Registry ({risks.length})
            </h3>
            <span className="text-[10px] font-mono text-[#5B6A82]">Select to inspect causal trail</span>
          </div>

          <div className="space-y-2.5">
            {risks.map((risk: any) => (
              <div
                key={risk.id}
                className={selectedRiskId === risk.id ? 'ring-1 ring-[#E8A33D] rounded-xl' : ''}
              >
                <RiskRow
                  id={risk.id}
                  category={risk.category}
                  level={risk.level}
                  impact_formatted={risk.impact_formatted}
                  probability={risk.probability}
                  description={risk.description}
                  onClick={() => setSelectedRiskId(risk.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Click-Through Forensic Detail Trail (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRisk ? (
            <div className="space-y-4">
              {/* Selected Risk Header Card */}
              <div className="ftm-card p-5 space-y-3 border border-[#232E42]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#E8A33D] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#232E42]">
                      {selectedRisk.id}
                    </span>
                    <StatusPill status={selectedRisk.level} />
                  </div>
                  <span className="text-xs font-mono text-[#5B6A82]">
                    Severity Score: <strong className="text-[#E9EDF4]">{selectedRisk.score}/100</strong>
                  </span>
                </div>

                <h3 className="text-base font-display font-bold text-[#E9EDF4]">
                  {selectedRisk.category}
                </h3>
                <p className="text-xs text-[#8C99AF] leading-relaxed">
                  {selectedRisk.description}
                </p>
              </div>

              {/* Connected-Dot Audit Trail */}
              <AuditTrail
                title={`Forensic Causal Investigation — ${selectedRisk.id}`}
                steps={riskTrailSteps}
              />
            </div>
          ) : (
            <div className="ftm-card p-8 text-center text-[#5B6A82] text-xs">
              Select a risk on the left to inspect the causal audit trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
