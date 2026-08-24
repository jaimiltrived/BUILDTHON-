import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { Sparkles, Scale, ArrowUpRight, Check, AlertCircle } from 'lucide-react';

export default function WarRoom() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvedPlan, setApprovedPlan] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWarRoom();
  }, []);

  const fetchWarRoom = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get<any>('/api/war-room/compare');
      setData(res);
    } catch (e) {
      console.error("War room fetch failed", e);
      setErrorMsg("Failed to load real-time war room data. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async (plan: any) => {
    setApprovedPlan(plan.name);
    try {
      await apiClient.post('/api/ledger/', {
        question: `Execute War Room Strategy ${plan.name} (${plan.price_change})?`,
        proposed_action: `${plan.price_change} Adjustment`,
        ai_recommendation: `Approved via Decision War Room (${plan.risk_adjusted_score}/100 Score)`,
        expected_profit: `₹${(plan.components.expected_profit / 100000).toFixed(1)}L`,
        risk: plan.risk_level,
        confidence: plan.confidence || 90
      });
    } catch (e) {
      console.error("Ledger recording failed", e);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-16 text-center text-slate-400 font-mono text-xs space-y-3 shadow-2xl">
        <Sparkles className="animate-spin mx-auto text-indigo-400" size={24} />
        <p className="text-slate-300 font-sans font-bold text-sm">Evaluating Multi-Scenario War Room Models</p>
        <p className="text-slate-500 font-sans text-xs">Computing deterministic risk penalties, customer churn elasticities, and net scorecards...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-3xl text-center text-red-300 text-sm flex items-center justify-center gap-2 shadow-xl">
        <AlertCircle size={18} className="text-red-400 shrink-0" />
        <span>{errorMsg}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Scale size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                DECISION WAR ROOM
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono font-bold">
                Live Scenario Matrix
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Multi-scenario strategy comparison using the mathematical Risk-Adjusted Decision Engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1.5 font-mono shadow-sm">
              <Sparkles size={13} /> Mathematical Model Active
            </span>
          </div>
        </div>

        {/* Comparison 3-Cards Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.plans?.map((p: any) => {
            const isRecommended = p.name === data.recommended_plan;
            const isApproved = approvedPlan === p.name;
            return (
              <div 
                key={p.name}
                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isRecommended 
                    ? 'glass-glow-indigo border-indigo-500/60 shadow-2xl scale-[1.02]' 
                    : 'glass-card hover:border-slate-700'
                }`}
              >
                {isRecommended && (
                  <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider py-1 text-center shadow-md">
                    ⭐ AI Top Recommended Strategy (Rank #1)
                  </div>
                )}

                <div className={isRecommended ? 'pt-4' : ''}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-100">{p.name}</h3>
                      <span className="text-2xl font-black text-indigo-400 font-metric">{p.price_change}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Score</span>
                      <span className="text-xl font-black text-indigo-300 font-metric">{p.risk_adjusted_score}<span className="text-xs text-slate-500 font-normal">/100</span></span>
                    </div>
                  </div>

                  {/* Key Metrics Breakdown */}
                  <div className="space-y-2.5 text-xs mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Revenue Impact:</span>
                      <span className="font-bold text-emerald-400 font-metric flex items-center gap-0.5">
                        <ArrowUpRight size={13} /> {p.revenue_pct}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Profit Impact:</span>
                      <span className="font-bold text-emerald-400 font-metric flex items-center gap-0.5">
                        <ArrowUpRight size={13} /> {p.profit_pct}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Projected Churn:</span>
                      <span className={`font-bold font-metric ${p.risk_level === 'HIGH' ? 'text-red-400' : 'text-amber-400'}`}>
                        {p.churn_pct}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Risk Profile:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                        p.risk_level === 'LOW' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                        p.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                        'bg-red-500/10 text-red-300 border-red-500/30'
                      }`}>
                        {p.risk_level} RISK
                      </span>
                    </div>
                  </div>

                  {/* Score Formula Breakdown */}
                  <div className="bg-slate-950/80 rounded-2xl p-3.5 text-[11px] space-y-1.5 mb-5 border border-slate-800/90 font-mono">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Mathematical Components</p>
                    <div className="flex justify-between text-slate-300">
                      <span>Expected Profit:</span>
                      <span className="text-emerald-400 font-bold">₹{(p.components.expected_profit/100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>- Risk Penalty:</span>
                      <span>₹{(p.components.risk_penalty/1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>- Uncertainty:</span>
                      <span>₹{(p.components.uncertainty_penalty/1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between text-indigo-400">
                      <span>+ Strategic Value:</span>
                      <span>₹{(p.components.strategic_benefit/1000).toFixed(0)}k</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApprovePlan(p)}
                  className={`w-full py-3.5 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg tracking-wider uppercase ${
                    isApproved 
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
                      : isRecommended 
                      ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/25' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isApproved ? (
                    <>
                      <Check size={16} /> STRATEGY COMMITTED TO LEDGER
                    </>
                  ) : (
                    "APPROVE & LOG STRATEGY"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* AI Rationale Card */}
        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-3xl p-5 flex items-start gap-4 shadow-xl">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-indigo-300 text-xs uppercase tracking-wider">
              AI Supervisor Strategic Recommendation
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">{data?.ai_rationale}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
