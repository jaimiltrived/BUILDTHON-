
interface TimelineSpineProps {
  pastLabel?: string;
  pastValue?: string;
  presentLabel?: string;
  presentValue?: string;
  pessimisticValue?: string;
  baseValue?: string;
  optimisticValue?: string;
  compact?: boolean;
}

export default function TimelineSpine({
  pastLabel = 'Past Baseline (24-Mo)',
  pastValue = '₹64.2L → ₹81.0L',
  presentLabel = 'Present Moment (Aug 2026)',
  presentValue = '₹82.4L Baseline',
  pessimisticValue = '₹76.9L',
  baseValue = '₹88.7L',
  optimisticValue = '₹94.1L',
  compact = false,
}: TimelineSpineProps) {
  if (compact) {
    return (
      <div className="w-full ftm-card-nested p-3.5 space-y-2 border border-[#232E42]">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#5B6A82] uppercase tracking-wider">
          <span>Past</span>
          <span className="text-[#E8A33D] font-bold">● Present</span>
          <span>Branched Futures</span>
        </div>
        <div className="relative flex items-center h-4">
          {/* Past Solid Line */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-[#232E42] via-[#5B8DEF]/60 to-[#E8A33D] timeline-spine-line" />
          {/* Present Node */}
          <div className="w-3.5 h-3.5 rounded-full bg-[#E8A33D] border-2 border-[#0B0F17] timeline-present-node shadow-[0_0_12px_rgba(232,163,61,0.8)] z-10 mx-1 shrink-0" />
          {/* Future Dashed Line */}
          <div className="flex-1 h-0.5 border-t-2 border-dashed border-[#5B8DEF] opacity-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full ftm-card p-5 space-y-4 border border-[#232E42]">
      {/* Header labels */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
            Financial Time Horizon
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#182234] text-[#8C99AF] border border-[#232E42]">
            Deterministic Timeline Spine
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#5B6A82]">
          Continuous Causal Mapping
        </span>
      </div>

      {/* Main 3-Segment Horizontal Visual Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1">
        
        {/* Past Segment (4 cols) */}
        <div className="md:col-span-4 ftm-card-nested p-3 space-y-1 border border-[#232E42]">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-[#5B6A82]">
            <span>Historical Ground Truth</span>
            <span className="text-[#8C99AF]">Past</span>
          </div>
          <p className="text-sm font-bold font-mono text-[#8C99AF] truncate">{pastValue}</p>
          <p className="text-[10px] text-[#5B6A82] truncate">{pastLabel}</p>
        </div>

        {/* Present Node (4 cols) */}
        <div className="md:col-span-4 ftm-card-nested p-3 space-y-1 border border-[#E8A33D]/50 bg-gradient-to-r from-[#182234] to-[#E8A33D]/5 relative overflow-hidden">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider">
            <span className="text-[#E8A33D] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E8A33D] timeline-present-node inline-block" />
              Present Moment
            </span>
            <span className="text-[#E8A33D] font-mono font-semibold">Active Engine</span>
          </div>
          <p className="text-base font-bold font-mono text-[#E9EDF4]">{presentValue}</p>
          <p className="text-[10px] text-[#8C99AF] truncate">{presentLabel}</p>
        </div>

        {/* Future Branched Segment (4 cols) */}
        <div className="md:col-span-4 ftm-card-nested p-3 space-y-1.5 border border-[#232E42]">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-[#5B6A82]">
            <span>Predicted Multi-Futures</span>
            <span className="text-[#5B8DEF]">Forecast</span>
          </div>
          
          <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
            <div className="bg-[#0B0F17] p-1.5 rounded border border-[#F1584F]/30">
              <span className="text-[9px] font-mono uppercase text-[#F1584F] block">Pessimistic</span>
              <span className="text-xs font-bold font-mono text-[#F1584F]">{pessimisticValue}</span>
            </div>
            <div className="bg-[#0B0F17] p-1.5 rounded border border-[#5B8DEF]/40">
              <span className="text-[9px] font-mono uppercase text-[#5B8DEF] block">Base Case</span>
              <span className="text-xs font-bold font-mono text-[#5B8DEF]">{baseValue}</span>
            </div>
            <div className="bg-[#0B0F17] p-1.5 rounded border border-[#3ADDA0]/30">
              <span className="text-[9px] font-mono uppercase text-[#3ADDA0] block">Optimistic</span>
              <span className="text-xs font-bold font-mono text-[#3ADDA0]">{optimisticValue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Connecting Spine Bar */}
      <div className="relative flex items-center h-3 px-2">
        {/* Past Solid Fading Line */}
        <div className="w-[38%] h-0.5 bg-gradient-to-r from-transparent via-[#5B8DEF]/50 to-[#E8A33D] timeline-spine-line" />
        
        {/* Present Node Glow Anchor */}
        <div className="w-3.5 h-3.5 rounded-full bg-[#E8A33D] border-2 border-[#0B0F17] timeline-present-node shadow-[0_0_15px_rgba(232,163,61,1)] z-10 shrink-0 mx-1" />
        
        {/* Future Dashed Branching Line */}
        <div className="w-[60%] h-0.5 border-t-2 border-dashed border-[#5B8DEF] opacity-80" />
      </div>
    </div>
  );
}
