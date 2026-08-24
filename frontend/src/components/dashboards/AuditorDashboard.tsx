import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/auth';
import { Search, Eye, Clock, FileText, ShieldCheck } from 'lucide-react';

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

interface MemoryEntry {
  id: string;
  title: string;
  category: string;
  date: string;
  accuracy: { overall_accuracy: number };
  ai_lesson: string;
  observed_outcome: string;
}

const STATUS_COLORS: Record<string, string> = {
  AWAITING_APPROVAL: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  APPROVED: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  REJECTED: 'text-red-300 bg-red-500/10 border-red-500/30',
  MODIFIED: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  COMPLETED: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
};

const RISK_COLORS: Record<string, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
};

export default function AuditorDashboard() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [pvr, setPvr] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LedgerEntry | null>(null);
  const [tab, setTab] = useState<'ledger' | 'memory' | 'accuracy'>('ledger');

  useEffect(() => {
    Promise.all([
      api.get('/api/ledger/').then(r => setLedger(r.data)),
      api.get('/api/memory/history').then(r => setMemory(r.data)),
      api.get('/api/memory/prediction-vs-reality').then(r => setPvr(r.data)),
    ]).catch(console.error);
  }, []);

  const filtered = ledger.filter(e =>
    e.question.toLowerCase().includes(search.toLowerCase()) ||
    e.proposed_action.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                INDEPENDENT AUDIT & COMPLIANCE CENTER
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-bold">
                Read-Only Audit Trail
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Auditor Principal: <strong className="text-slate-200">{user?.full_name}</strong> · Forensic verification of AI decisions and executive approvals
            </p>
          </div>
        </div>

        {/* Accuracy Telemetry Grid */}
        {pvr && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Overall Model Accuracy', value: `${pvr.overall_prediction_accuracy}%`, color: 'text-emerald-400', sub: 'Calibrated baseline' },
              { label: 'Revenue Variance Accuracy', value: `${pvr.revenue_prediction_accuracy}%`, color: 'text-blue-400', sub: 'Historical mean' },
              { label: 'Profit Projection Accuracy', value: `${pvr.profit_prediction_accuracy}%`, color: 'text-indigo-400', sub: 'OpEx adjusted' },
              { label: 'Audited Corporate Decisions', value: pvr.tracked_decisions_count, color: 'text-amber-400', sub: 'Immutable ledger' },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className="glass-card rounded-3xl p-4 space-y-1.5 border border-slate-800/80">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-black ${color} font-metric`}>{value}</p>
                <p className="text-[10px] text-slate-500 font-mono">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/90 w-fit">
          {(['ledger', 'memory', 'accuracy'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === t 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'accuracy' ? 'Prediction Accuracy' : t === 'ledger' ? 'Decision Ledger Audit' : 'AI Memory History'}
            </button>
          ))}
        </div>

        {/* Ledger Tab */}
        {tab === 'ledger' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search audit decisions by ID, prompt, or action…"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-slate-200 text-xs outline-none focus:border-amber-500/50 transition-all font-medium"
              />
            </div>

            <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/80 shadow-xl">
              <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText size={14} className="text-amber-400" /> Decision Ledger — Read Only ({filtered.length})
                </p>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Integrity Verified
                </span>
              </div>
              
              <div className="divide-y divide-slate-800/60">
                {filtered.map(entry => (
                  <div key={entry.id}>
                    <div
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-all cursor-pointer"
                      onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-lg">{entry.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[entry.status] || ''}`}>
                            {entry.status.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] font-bold ${RISK_COLORS[entry.risk] || 'text-slate-400'}`}>
                            {entry.risk} RISK
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-200">{entry.proposed_action}</p>
                        <p className="text-xs text-slate-400 truncate max-w-lg">{entry.question}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-mono text-[11px]"><Clock size={12} />{entry.date}</span>
                        <Eye size={15} className={selected?.id === entry.id ? 'text-amber-400' : 'text-slate-500'} />
                      </div>
                    </div>

                    {/* Expanded Audit Forensic Card */}
                    {selected?.id === entry.id && (
                      <div className="mx-5 mb-4 p-5 bg-slate-950/90 border border-amber-500/30 rounded-2xl space-y-3.5 text-xs animate-in fade-in">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                          {[
                            { label: 'Decision ID', value: entry.id },
                            { label: 'Timestamp', value: entry.date },
                            { label: 'Expected Profit', value: entry.expected_profit },
                            { label: 'Confidence Score', value: `${entry.confidence}%` },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">{label}</p>
                              <p className="text-slate-200 font-bold font-metric mt-0.5">{value}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">Question Evaluated</p>
                          <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">{entry.question}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">AI Recommendation & Evidence</p>
                          <p className="text-slate-200 leading-relaxed bg-indigo-950/20 p-3 rounded-xl border border-indigo-500/20 font-medium">{entry.ai_recommendation}</p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-400/90 font-mono">
                          <Eye size={12} /> Read-only compliance audit view — cryptographic signature locked
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Memory Tab */}
        {tab === 'memory' && (
          <div className="space-y-4">
            {memory.map(m => (
              <div key={m.id} className="glass-card rounded-3xl p-5 space-y-3 border border-slate-800/80">
                <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-3">
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase">{m.category} · {m.date}</p>
                    <p className="text-sm font-bold text-slate-100 mt-0.5">{m.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Calibrated Score</p>
                    <p className={`text-base font-black font-metric ${m.accuracy.overall_accuracy >= 90 ? 'text-emerald-400' : m.accuracy.overall_accuracy >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                      {m.accuracy.overall_accuracy}%
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-[11px] font-bold text-blue-300">Observed Real-World Outcome</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.observed_outcome}</p>
                </div>
                <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20">
                  <p className="text-[11px] font-bold text-indigo-300 mb-1">📘 Institutional Lesson Learned</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.ai_lesson}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Accuracy Tab */}
        {tab === 'accuracy' && pvr && (
          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-6 space-y-5 border border-slate-800/80">
              <h3 className="text-sm font-black text-slate-200">Model Prediction Accuracy Breakdown</h3>
              {[
                { label: 'Top-Line Revenue Prediction', value: pvr.revenue_prediction_accuracy },
                { label: 'Net Profit Prediction', value: pvr.profit_prediction_accuracy },
                { label: 'Customer Churn Elasticity Prediction', value: pvr.churn_prediction_accuracy },
                { label: 'Overall Combined Decision Score', value: pvr.overall_prediction_accuracy },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-black font-metric ${value >= 90 ? 'text-emerald-400' : value >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{value}%</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
