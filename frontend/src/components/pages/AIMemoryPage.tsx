import { useState } from 'react';
import { useAIMemoryQuery } from '../../lib/queries';
import { Database, Search, Sparkles, AlertTriangle } from 'lucide-react';

export default function AIMemoryPage() {
  const { data: memories = [] } = useAIMemoryQuery('default');
  const [search, setSearch] = useState('');

  const filtered = memories.filter((item: any) =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase()) ||
    item.observed_outcome?.toLowerCase().includes(search.toLowerCase()) ||
    item.ai_lesson?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232E42] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30">
              <Database size={18} />
            </div>
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              AI INSTITUTIONAL DECISION MEMORY
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#182234] text-[#E8A33D] border border-[#E8A33D]/30 font-bold">
              Persistent Knowledge Base
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Historical repository of past corporate strategies, actual execution outcomes, and codified plain-language lessons
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past precedents, lessons, IDs…"
            className="w-full bg-[#182234] border border-[#232E42] rounded-lg pl-9 pr-3 py-2 text-xs text-[#E9EDF4] outline-none focus:border-[#E8A33D] transition-all font-mono"
          />
        </div>
      </div>

      {/* Historical Precedent Pattern Match Warning Banner */}
      <div className="ftm-card p-5 border border-[#E8A33D]/50 bg-gradient-to-r from-[#182234] via-[#121826] to-[#E8A33D]/10 flex items-start gap-3.5 shadow-xl">
        <div className="p-2 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] shrink-0 mt-0.5 border border-[#E8A33D]/30">
          <AlertTriangle size={18} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[#E8A33D] uppercase tracking-wider">
              Pattern Match Detected (87% Precedent Similarity to Decision #DEC-1042)
            </span>
          </div>
          <p className="text-xs text-[#E9EDF4]/90 leading-relaxed font-sans">
            <strong className="text-[#E8A33D]">Historical Precedent Warning:</strong> Increasing standard delivery surcharge by ₹20 in Q4 2025 previously caused a 1.4% revenue drop because top-tier metro clients reduced checkout velocity. The AI Supervisor uses this institutional memory to lower confidence on flat price hikes without cohort segmentation.
          </p>
        </div>
      </div>

      {/* Memory Cards 2-Col Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item: any, idx: number) => (
          <div
            key={`${item.id}-${idx}`}
            className="ftm-card p-5 space-y-4 border border-[#232E42] hover:border-[#E8A33D]/40 transition-colors"
          >
            <div className="flex justify-between items-start border-b border-[#232E42] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#E8A33D] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#232E42]">
                    {item.id}
                  </span>
                  <span className="text-xs font-mono text-[#5B6A82]">{item.category} · {item.date}</span>
                </div>
                <h3 className="font-display font-bold text-[#E9EDF4] text-sm mt-1.5">{item.title}</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#3ADDA0] bg-[#3ADDA0]/10 border border-[#3ADDA0]/30 px-2.5 py-1 rounded-full">
                {item.accuracy?.overall_accuracy}% Calibrated
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#0B0F17] rounded-lg border border-[#232E42] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#5B6A82] block">
                  Observed Real-World Outcome
                </span>
                <p className="text-[#8C99AF] leading-relaxed font-sans">{item.observed_outcome}</p>
              </div>

              <div className="p-3.5 bg-[#E8A33D]/5 rounded-lg border border-[#E8A33D]/30 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#E8A33D] flex items-center gap-1.5">
                  <Sparkles size={13} /> Plain-Language AI Institutional Lesson
                </span>
                <p className="text-[#E9EDF4] leading-relaxed font-sans font-medium">{item.ai_lesson}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
