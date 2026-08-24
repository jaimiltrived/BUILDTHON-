import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { Search, Sparkles, AlertTriangle, Brain, ArrowUpRight } from 'lucide-react';

export default function AIMemory() {
  const [history, setHistory] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get<any[]>('/api/memory/history');
      setHistory(res);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = history.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase()) ||
    item.observed_outcome?.toLowerCase().includes(search.toLowerCase()) ||
    item.ai_lesson?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Brain size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                AI INSTITUTIONAL MEMORY
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono font-bold">
                Self-Evolving Knowledge Base
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Persistent memory store of past corporate strategic decisions, actual outcomes, and calibrated algorithmic learnings.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search precedents, lessons, keywords..."
              className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Similar Decision Precedent Warning Banner */}
        <div className="glass-glow-amber rounded-3xl p-5 flex items-start gap-4 shadow-xl border border-amber-500/30">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                Pattern Match Detected (87% Precedent Similarity to Decision #DEC-1042)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300">Historical Precedent Warning:</strong> Increasing standard delivery surcharge by ₹20 in Q4 2025 caused a 1.4% revenue drop because top-tier metro clients reduced checkout velocity. The AI Supervisor uses this institutional memory to lower confidence on flat price hikes without cohort segmentation.
            </p>
          </div>
        </div>

        {/* Decision Cards 2-Col Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="glass-card rounded-3xl p-6 space-y-4 shadow-xl hover:border-purple-500/40">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-purple-950/80 border border-purple-800/60 text-purple-300 px-2.5 py-0.5 rounded-xl font-bold">
                      {item.id}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{item.category} • {item.date}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-100 text-sm mt-1.5">{item.title}</h3>
                </div>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                  {item.accuracy?.overall_accuracy}% Calibrated
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Model Simulation</span>
                  <span className="font-bold text-blue-400 font-metric flex items-center gap-1">
                    <ArrowUpRight size={13} /> {item.predicted?.revenue_change_pct} Revenue
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Actual Real-World</span>
                  <span className={`font-bold font-metric flex items-center gap-1 ${item.actual?.revenue_change_pct?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                    <ArrowUpRight size={13} /> {item.actual?.revenue_change_pct} Revenue
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Observed Outcome</span>
                  <p className="text-slate-300 leading-relaxed">{item.observed_outcome}</p>
                </div>

                <div className="p-3.5 bg-indigo-950/30 rounded-2xl border border-indigo-500/30 space-y-1">
                  <span className="text-indigo-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Sparkles size={12} /> Institutional AI Lesson Learned
                  </span>
                  <p className="text-slate-200 leading-relaxed font-medium">{item.ai_lesson}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
