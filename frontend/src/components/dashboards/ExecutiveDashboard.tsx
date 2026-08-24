import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/auth';
import {
  TrendingUp, TrendingDown, CheckCircle,
  Briefcase, Award, Check, X, Edit3, Clock
} from 'lucide-react';

interface LedgerEntry {
  id: string;
  question: string;
  proposed_action: string;
  ai_recommendation: string;
  expected_profit: string;
  risk: string;
  confidence: number;
  status: string;
  date: string;
}

const RISK_COLORS: Record<string, string> = {
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  HIGH: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  AWAITING_APPROVAL: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  APPROVED: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  REJECTED: 'text-red-300 bg-red-500/10 border-red-500/30',
  MODIFIED: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  COMPLETED: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
};

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [baseline, setBaseline] = useState<any>(null);
  const [selected, setSelected] = useState<LedgerEntry | null>(null);
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ledgerRes, baselineRes] = await Promise.all([
        api.get('/api/ledger/'),
        api.get('/api/data/live-baseline'),
      ]);
      setLedger(ledgerRes.data);
      setBaseline(baselineRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/ledger/${id}/status`, { status });
      setLedger(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      setActionMsg(prev => ({ ...prev, [id]: `Decision marked as ${status.toLowerCase().replace('_', ' ')}` }));
      if (selected?.id === id) setSelected(null);
      setTimeout(() => setActionMsg(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const pending = ledger.filter(e => e.status === 'AWAITING_APPROVAL');
  const recentDecisions = ledger.filter(e => e.status !== 'AWAITING_APPROVAL').slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Briefcase size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                EXECUTIVE DECISION WAR ROOM
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono font-bold">
                Executive Authority
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Executive Principal: <strong className="text-slate-200">{user?.full_name}</strong> · Authorize corporate interventions with risk scorecards
            </p>
          </div>
        </div>

        {/* Business Health KPIs */}
        {baseline && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Baseline Revenue', value: `₹${(baseline.revenue / 100000).toFixed(1)}L`, trend: '+8.4%', up: true, color: 'text-emerald-400' },
              { label: 'Baseline Net Profit', value: `₹${(baseline.profit / 100000).toFixed(1)}L`, trend: '+11.2%', up: true, color: 'text-blue-400' },
              { label: 'Gross Margin Ratio', value: `${baseline.gross_margin}%`, trend: '+2.1%', up: true, color: 'text-indigo-400' },
              { label: 'Financial Health Score', value: `${baseline.financial_health_score}/100`, trend: 'EXCELLENT', up: true, color: 'text-purple-400' },
            ].map(({ label, value, trend, up, color }) => (
              <div key={label} className="glass-card rounded-3xl p-5 space-y-2 border border-slate-800/80">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className={`text-3xl font-black ${color} font-metric`}>{value}</p>
                <p className={`text-xs flex items-center gap-1 font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {trend}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Action Needed Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Decisions Requiring Executive Sign-Off ({pending.length})
            </h3>
          </div>

          {pending.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <CheckCircle size={28} className="text-emerald-400" />
              <p className="font-bold text-slate-200">No Pending Approvals</p>
              <p className="text-slate-500">All simulated decisions have been reviewed and committed to the governance ledger.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((entry) => (
                <div key={entry.id} className="glass-card rounded-3xl p-5 lg:p-6 space-y-4 border border-amber-500/30 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl">
                        {entry.id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Clock size={12} /> {entry.date}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${RISK_COLORS[entry.risk] || ''}`}>
                      {entry.risk} RISK
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                    <div className="lg:col-span-7 space-y-2">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Action Proposed</p>
                      <p className="text-base font-extrabold text-slate-100">{entry.proposed_action}</p>
                      <p className="text-xs text-slate-400">{entry.question}</p>
                    </div>

                    <div className="lg:col-span-5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <p className="text-indigo-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Award size={13} /> AI Recommendation
                      </p>
                      <p className="text-slate-200 font-medium">{entry.ai_recommendation}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-metric text-[11px]">
                        <span className="text-slate-400">Profit: <strong className="text-emerald-400">{entry.expected_profit}</strong></span>
                        <span className="text-slate-400">Confidence: <strong className="text-indigo-300">{entry.confidence}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {actionMsg[entry.id] && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-bold animate-in fade-in">
                      {actionMsg[entry.id]}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => updateStatus(entry.id, 'APPROVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5 uppercase"
                    >
                      <Check size={14} /> APPROVE STRATEGY
                    </button>
                    <button
                      onClick={() => updateStatus(entry.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/20 flex items-center gap-1.5 uppercase"
                    >
                      <X size={14} /> REJECT
                    </button>
                    <button
                      onClick={() => updateStatus(entry.id, 'MODIFIED')}
                      className="px-4 py-2 bg-amber-600/80 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-600/20 flex items-center gap-1.5 uppercase"
                    >
                      <Edit3 size={14} /> REQUEST REVISION
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Executed Decisions */}
        {recentDecisions.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Recently Logged Executive Decisions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentDecisions.map(d => (
                <div key={d.id} className="glass-card rounded-2xl p-4 space-y-2 border border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-slate-400 font-bold">{d.id}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[d.status] || ''}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200">{d.proposed_action}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{d.ai_recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
