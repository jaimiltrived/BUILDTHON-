import { useState, useEffect } from 'react';
import { api } from '../lib/auth';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle, ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';

interface RiskItem {
  id: string;
  category: string;
  level: string;
  score: number;
  impact_amount: number;
  impact_formatted: string;
  probability: number;
  trend: string;
  description: string;
  root_cause: string;
  affected_segment: string;
  mitigation: string;
  confidence: number;
}

interface RiskData {
  overall_score: number;
  overall_level: string;
  risks: RiskItem[];
  last_calculated: string;
  data_coverage_months: number;
}

const LEVEL_CONFIG = {
  HIGH: {
    icon: AlertTriangle,
    color: 'text-red-400',
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    bar: 'bg-red-500',
    badge: 'text-red-400 bg-red-500/10 border-red-500/30',
    gaugeFill: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500',
  },
  MEDIUM: {
    icon: AlertCircle,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    bar: 'bg-amber-500',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    gaugeFill: 'bg-gradient-to-r from-emerald-500 via-yellow-500 to-amber-500',
  },
  LOW: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    bar: 'bg-emerald-500',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    gaugeFill: 'bg-gradient-to-r from-teal-500 to-emerald-500',
  },
};

const TREND_ICON: Record<string, string> = {
  increasing: '↑ Increasing',
  decreasing: '↓ Decreasing',
  stable: '→ Stable',
};

export default function RiskCenter() {
  const [data, setData] = useState<RiskData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/risk/center');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div className="glass-panel rounded-3xl p-16 text-center text-slate-400 text-xs space-y-3">
        <RefreshCw size={22} className="animate-spin mx-auto text-amber-400" />
        <p className="font-bold text-slate-200">Evaluating Enterprise Financial Risks</p>
      </div>
    );
  }

  const overallCfg = LEVEL_CONFIG[data.overall_level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.MEDIUM;

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                ENTERPRISE RISK GUARDIAN CENTER
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-bold">
                Live Sentinel
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Continuous multi-factor analysis across {data.data_coverage_months} months of operations · Updated {new Date(data.last_calculated).toLocaleTimeString()}
            </p>
          </div>

          <button 
            onClick={load} 
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
          </button>
        </div>

        {/* Overall Risk Score Deck */}
        <div className={`glass-card ${overallCfg.border} rounded-3xl p-6 lg:p-7 space-y-4 shadow-2xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Enterprise Risk Composite</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className={`text-5xl font-black ${overallCfg.color} font-metric`}>{data.overall_score}</span>
                <span className="text-slate-500 text-sm font-bold">/ 100</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${overallCfg.badge} uppercase tracking-wider`}>
                  {data.overall_level} THREAT LEVEL
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-2xl ${overallCfg.bg} border ${overallCfg.border}`}>
              <ShieldAlert size={36} className={overallCfg.color} />
            </div>
          </div>

          {/* Meter Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${overallCfg.gaugeFill}`}
                style={{ width: `${data.overall_score}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
              <span>0 (Stable Resilience)</span>
              <span>50 (Moderate Exposure)</span>
              <span>100 (Critical Vulnerability)</span>
            </div>
          </div>
        </div>

        {/* Risk Items */}
        <div className="space-y-3.5">
          {data.risks.map(risk => {
            const cfg = LEVEL_CONFIG[risk.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.LOW;
            const Icon = cfg.icon;
            const isOpen = expanded === risk.id;

            return (
              <div key={risk.id} className={`glass-card border ${cfg.border} rounded-3xl overflow-hidden transition-all shadow-lg`}>
                {/* Summary row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 cursor-pointer hover:bg-slate-800/30 transition-all gap-4"
                  onClick={() => setExpanded(isOpen ? null : risk.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${cfg.bg} ${cfg.border} border shrink-0`}>
                      <Icon size={20} className={cfg.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                          {risk.level}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {TREND_ICON[risk.trend] || '→ Stable'}
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-100">{risk.category}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{risk.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Potential Impact</p>
                      <p className={`text-sm font-black ${cfg.color} font-metric`}>{risk.impact_formatted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Probability</p>
                      <p className="text-sm font-black text-slate-200 font-metric">{risk.probability}%</p>
                    </div>
                    <div className="w-16 hidden sm:block">
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${risk.score}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 font-metric mt-1">{risk.score}/100</p>
                    </div>
                    <div className="p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Forensic Detail */}
                {isOpen && (
                  <div className="px-5 pb-6 pt-0 space-y-4 border-t border-slate-800/80 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                      <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1.5">
                        <p className="text-[10px] font-black text-red-300 uppercase tracking-wider">Underlying Root Cause</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{risk.root_cause}</p>
                      </div>
                      <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1.5">
                        <p className="text-[10px] font-black text-amber-300 uppercase tracking-wider">Affected Cohort / Segment</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{risk.affected_segment}</p>
                      </div>
                      <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1.5">
                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles size={11} /> AI Mitigation Strategy
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">{risk.mitigation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                      <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl">
                        AI Guardian Confidence: <strong className="text-indigo-300">{risk.confidence}%</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
