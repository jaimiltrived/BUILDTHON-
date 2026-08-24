import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import type { LedgerItem } from '../lib/mockData';
import { BookOpen, Check, X, Edit3, RotateCcw, Clock, Award, Search, ShieldCheck } from 'lucide-react';

interface Props {
  onSimulateAgain?: (val: number) => void;
}

export default function DecisionLedger({ onSimulateAgain }: Props) {
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<LedgerItem[]>('/api/ledger/');
      setLedger(data);
    } catch (e) {
      console.error("Failed to fetch live decision ledger", e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/api/ledger/${id}/status`, { status: newStatus });
      setLedger(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (e) {
      console.error("Status update error", e);
    }
  };

  const filtered = ledger.filter(item => {
    const matchesSearch = 
      item.question?.toLowerCase().includes(search.toLowerCase()) ||
      item.proposed_action?.toLowerCase().includes(search.toLowerCase()) ||
      item.id?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || item.status.replace('_', ' ') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BookOpen size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                DECISION GOVERNANCE LEDGER
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                <ShieldCheck size={11} /> Cryptographically Tracked
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Immutable audit trail recording simulated options, AI risk scores, and executive governance sign-offs.
            </p>
          </div>

          <span className="text-xs bg-slate-950/80 text-slate-300 border border-slate-800 px-3.5 py-1.5 rounded-2xl font-mono self-start md:self-auto">
            {ledger.length} Live Decisions Logged
          </span>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions, ID, or actions..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {['ALL', 'APPROVED', 'AWAITING APPROVAL', 'REJECTED', 'MODIFIED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">
              Loading real-time corporate decision records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No decision records found matching your filters.
            </div>
          ) : (
            filtered.map((item) => {
              const cleanStatus = item.status.replace('_', ' ');
              return (
                <div 
                  key={item.id}
                  className="glass-card rounded-3xl p-5 lg:p-6 space-y-4 shadow-xl hover:border-indigo-500/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 px-2.5 py-1 rounded-xl">
                        {item.id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-500" /> {item.date}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono border ${
                      cleanStatus === 'APPROVED' 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40' 
                        : cleanStatus === 'REJECTED' 
                        ? 'bg-red-500/10 text-red-300 border-red-500/40'
                        : cleanStatus === 'MODIFIED'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/40 animate-pulse'
                    }`}>
                      {cleanStatus}
                    </span>
                  </div>

                  {/* Decision Context Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                    <div className="lg:col-span-6 space-y-2.5">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Decision Question</p>
                      <p className="text-sm font-bold text-slate-100 leading-snug">{item.question}</p>
                      
                      <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 mt-2 flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Proposed Adjustment:</span>
                        <span className="font-bold text-indigo-400 font-metric">{item.proposed_action}</span>
                      </div>
                    </div>

                    <div className="lg:col-span-6 space-y-2.5">
                      <p className="text-indigo-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Award size={13} /> AI Recommendation & Expected Return
                      </p>
                      <div className="bg-indigo-950/20 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                        <p className="font-semibold text-slate-100">{item.ai_recommendation}</p>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-indigo-500/20 text-[11px] font-metric">
                          <span className="text-slate-400">Profit: <strong className="text-emerald-400">{item.expected_profit}</strong></span>
                          <span className="text-slate-400">Risk: <strong className={item.risk === 'HIGH' ? 'text-red-400' : 'text-amber-400'}>{item.risk}</strong></span>
                          <span className="text-slate-400">Confidence: <strong className="text-indigo-300">{item.confidence}%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Governance Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => updateStatus(item.id, 'APPROVED')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <Check size={13} /> APPROVE
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, 'REJECTED')}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-red-600/20"
                    >
                      <X size={13} /> REJECT
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, 'MODIFIED')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-600/20"
                    >
                      <Edit3 size={13} /> MODIFY
                    </button>
                    {onSimulateAgain && (
                      <button
                        onClick={() => onSimulateAgain(10)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ml-auto border border-slate-700"
                      >
                        <RotateCcw size={13} /> SIMULATE IN TIME MACHINE
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
