import { Sparkles, ArrowUpRight, History, ExternalLink } from 'lucide-react';

interface AIInsightCardProps {
  title?: string;
  recommendation: string;
  summary?: string;
  confidence?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  why?: string[];
  evidence?: string[];
  sourceAgents?: string[];
  similarDecision?: {
    id: string;
    time_ago?: string;
    lesson?: string;
  };
  followUps?: string[];
  onFollowUpClick?: (question: string) => void;
  onCitationClick?: (citation: string) => void;
  onMemoryClick?: (decisionId: string) => void;
  className?: string;
}

export default function AIInsightCard({
  title = "AI Finance Supervisor Verdict",
  recommendation,
  summary,
  confidence = 88,
  riskLevel = "MEDIUM",
  why = [],
  evidence = [],
  sourceAgents = [],
  similarDecision,
  followUps = [],
  onFollowUpClick,
  onCitationClick,
  onMemoryClick,
  className = "",
}: AIInsightCardProps) {
  const riskBadgeClass =
    riskLevel === 'HIGH'
      ? 'bg-[#F1584F]/10 text-[#F1584F] border-[#F1584F]/30'
      : riskLevel === 'MEDIUM'
      ? 'bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/30'
      : 'bg-[#3ADDA0]/10 text-[#3ADDA0] border-[#3ADDA0]/30';

  return (
    <div className={`ai-insight-card p-5 space-y-4 shadow-xl ${className}`}>
      {/* Header: Title + Paired Confidence & Risk */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232E42] pb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[#E8A33D]">
              {title}
            </h4>
            <span className="text-[10px] text-[#8C99AF] font-mono">
              Deterministic Multi-Agent Supervisor
            </span>
          </div>
        </div>

        {/* ALWAYS Paired Confidence & Risk */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-[#182234] text-[#E9EDF4] px-2.5 py-1 rounded-lg border border-[#232E42] font-semibold">
            Confidence: <strong className="text-[#5B8DEF]">{confidence}%</strong>
          </span>
          <span className={`px-2.5 py-1 rounded-lg border font-bold uppercase ${riskBadgeClass}`}>
            Risk: {riskLevel}
          </span>
        </div>
      </div>

      {/* Primary Recommendation (Numbers-first, direct) */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82]">
          Recommendation
        </span>
        <p className="text-base font-display font-bold text-[#E9EDF4] leading-snug">
          {recommendation}
        </p>
        {summary && (
          <p className="text-xs text-[#8C99AF] leading-relaxed pt-1">
            {summary}
          </p>
        )}
      </div>

      {/* WHY? Numbered Reasoning List */}
      {why && why.length > 0 && (
        <div className="ftm-card-nested p-3.5 space-y-2 border border-[#232E42]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8A33D] block">
            Why? Rationale & Causality:
          </span>
          <ol className="space-y-1.5 text-xs text-[#E9EDF4]/90 list-decimal list-inside font-sans">
            {why.map((reason, idx) => (
              <li key={idx} className="leading-relaxed">
                {reason}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* AI Memory Precedent Note (Feature: learns from org decision history) */}
      {similarDecision && (
        <div
          onClick={() => onMemoryClick && onMemoryClick(similarDecision.id)}
          className={`p-3 rounded-lg bg-[#0B0F17] border border-[#E8A33D]/30 flex items-start gap-2.5 transition-colors ${
            onMemoryClick ? 'cursor-pointer hover:border-[#E8A33D]' : ''
          }`}
        >
          <History size={15} className="text-[#E8A33D] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-mono font-bold text-[#E8A33D] flex items-center gap-1">
              Institutional Memory Match: Decision #{similarDecision.id} ({similarDecision.time_ago || 'past record'})
              <ArrowUpRight size={12} />
            </span>
            <p className="text-[#8C99AF] mt-0.5 text-[11px]">
              {similarDecision.lesson || "Past precedent used to calibrate risk penalty."}
            </p>
          </div>
        </div>
      )}

      {/* Grounded Evidence & Source Agents */}
      {(evidence.length > 0 || sourceAgents.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          {evidence.length > 0 && (
            <div className="p-3 bg-[#0B0F17] rounded-lg border border-[#232E42] space-y-1">
              <span className="font-mono text-[10px] font-bold text-[#5B6A82] uppercase block">
                📊 Grounded Data Citations:
              </span>
              <ul className="space-y-1 text-[11px] text-[#8C99AF]">
                {evidence.map((ev, idx) => (
                  <li
                    key={idx}
                    onClick={() => onCitationClick && onCitationClick(ev)}
                    className={`flex items-center gap-1.5 ${
                      onCitationClick ? 'hover:text-[#5B8DEF] cursor-pointer' : ''
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-[#5B8DEF]" />
                    <span className="font-mono truncate">{ev}</span>
                    {onCitationClick && <ExternalLink size={10} className="shrink-0" />}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sourceAgents.length > 0 && (
            <div className="p-3 bg-[#0B0F17] rounded-lg border border-[#232E42] space-y-1">
              <span className="font-mono text-[10px] font-bold text-[#5B6A82] uppercase block">
                🤖 Contributing Agent Nodes:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {sourceAgents.map((ag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono bg-[#182234] text-[#8C99AF] px-2 py-0.5 rounded border border-[#232E42]"
                  >
                    {ag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contextual Follow-up Chips */}
      {followUps && followUps.length > 0 && (
        <div className="pt-2 border-t border-[#232E42]/80 space-y-2">
          <span className="text-[10px] font-mono text-[#5B6A82] uppercase tracking-wider block">
            Suggested Next Inquiries:
          </span>
          <div className="flex flex-wrap gap-2">
            {followUps.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => onFollowUpClick && onFollowUpClick(chip)}
                className="text-xs text-[#8C99AF] hover:text-[#E8A33D] bg-[#182234] hover:bg-[#182234]/80 px-3 py-1.5 rounded-lg border border-[#232E42] hover:border-[#E8A33D]/40 transition-all font-medium text-left cursor-pointer"
              >
                ↳ {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
