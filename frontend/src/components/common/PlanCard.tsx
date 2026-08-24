import { Award, ArrowUpRight, Check } from 'lucide-react';
import StatusPill from './StatusPill';

export interface PlanCardProps {
  name: string;
  price_change: string;
  score: number;
  revenue_pct: string;
  profit_pct: string;
  churn_pct: string;
  risk_level: string;
  expected_profit: string;
  components: {
    expected_profit: number;
    risk_penalty: number;
    uncertainty_penalty: number;
    strategic_benefit: number;
  };
  winner?: boolean;
  approved?: boolean;
  onApprove?: () => void;
  disabled?: boolean;
}

export default function PlanCard({
  name,
  price_change,
  score,
  revenue_pct,
  profit_pct,
  churn_pct,
  risk_level,
  components,
  winner = false,
  approved = false,
  onApprove,
  disabled = false,
}: PlanCardProps) {
  return (
    <div
      className={`p-6 rounded-[12px] flex flex-col justify-between relative overflow-hidden transition-all ${
        winner ? 'plan-card-winner' : 'ftm-card plan-card-loser'
      }`}
    >
      {/* Winner Trophy / Recommended Banner */}
      {winner && (
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-[#E8A33D] via-[#E8A33D] to-[#3ADDA0] text-[#0B0F17] text-[10px] font-mono font-bold uppercase tracking-wider py-1 text-center shadow-md flex items-center justify-center gap-1.5">
          <Award size={13} /> AI Top Recommended Strategy (Rank #1)
        </div>
      )}

      <div className={winner ? 'pt-4' : ''}>
        {/* Card Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-base font-display font-bold text-[#E9EDF4]">{name}</h3>
            <span className="text-2xl font-bold font-mono text-[#E8A33D]">{price_change}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82] block">
              Score
            </span>
            <span className="text-2xl font-bold font-mono text-[#E9EDF4]">
              {score}
              <span className="text-xs text-[#5B6A82] font-normal">/100</span>
            </span>
          </div>
        </div>

        {/* Key Metrics Breakdown */}
        <div className="space-y-2.5 text-xs mb-5 ftm-card-nested p-4 border border-[#232E42]">
          <div className="flex justify-between items-center">
            <span className="text-[#8C99AF]">Revenue Impact:</span>
            <span className="font-mono font-bold text-[#3ADDA0] flex items-center gap-0.5">
              <ArrowUpRight size={13} /> {revenue_pct}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8C99AF]">Profit Impact:</span>
            <span className="font-mono font-bold text-[#3ADDA0] flex items-center gap-0.5">
              <ArrowUpRight size={13} /> {profit_pct}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8C99AF]">Projected Churn:</span>
            <span
              className={`font-mono font-bold ${
                risk_level === 'HIGH' ? 'text-[#F1584F]' : 'text-[#E8A33D]'
              }`}
            >
              {churn_pct}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#232E42]">
            <span className="text-[#8C99AF]">Risk Profile:</span>
            <StatusPill status={risk_level} />
          </div>
        </div>

        {/* Mathematical Model Breakdown */}
        <div className="bg-[#0B0F17] rounded-lg p-3.5 text-[11px] space-y-1.5 mb-5 border border-[#232E42] font-mono">
          <p className="text-[10px] text-[#5B6A82] uppercase tracking-wider font-bold mb-1">
            Mathematical Components
          </p>
          <div className="flex justify-between text-[#8C99AF]">
            <span>Expected Profit:</span>
            <span className="text-[#3ADDA0] font-bold">
              ₹{(components.expected_profit / 100000).toFixed(1)}L
            </span>
          </div>
          <div className="flex justify-between text-[#F1584F]">
            <span>- Risk Penalty:</span>
            <span>₹{(components.risk_penalty / 1000).toFixed(0)}k</span>
          </div>
          <div className="flex justify-between text-[#E8A33D]">
            <span>- Uncertainty Penalty:</span>
            <span>₹{(components.uncertainty_penalty / 1000).toFixed(0)}k</span>
          </div>
          <div className="flex justify-between text-[#5B8DEF]">
            <span>+ Strategic Benefit:</span>
            <span>₹{(components.strategic_benefit / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onApprove}
        disabled={disabled || approved}
        className={`w-full py-3.5 rounded-lg font-display font-bold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
          disabled
            ? 'bg-[#182234] text-[#5B6A82] border border-[#232E42] cursor-not-allowed opacity-60'
            : approved
            ? 'bg-[#3ADDA0] text-[#0B0F17] font-bold shadow-md shadow-[#3ADDA0]/20 cursor-default'
            : winner
            ? 'bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-[#0B0F17] shadow-lg shadow-[#E8A33D]/25 cursor-pointer'
            : 'bg-[#182234] hover:bg-[#232E42] text-[#E9EDF4] border border-[#232E42] cursor-pointer'
        }`}
      >
        {approved ? (
          <>
            <Check size={16} /> STRATEGY COMMITTED TO LEDGER
          </>
        ) : disabled ? (
          "READ-ONLY AUDIT VIEW"
        ) : (
          "APPROVE & LOG STRATEGY"
        )}
      </button>
    </div>
  );
}
