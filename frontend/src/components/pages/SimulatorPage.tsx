import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSimulationMutation, useLogDecisionMutation } from '../../lib/queries';
import TimelineSpine from '../common/TimelineSpine';
import AIInsightCard from '../common/AIInsightCard';
import { Sliders, Sparkles, Check, Layers } from 'lucide-react';

interface SimulatorPageProps {
  onNavigate: (tab: string) => void;
}

export default function SimulatorPage({ onNavigate }: SimulatorPageProps) {
  const { user } = useAuth();
  const isAuditor = user?.role === 'AUDITOR';

  // Levers
  const [priceChange, setPriceChange] = useState(10);
  const [marketingSpend, setMarketingSpend] = useState(5);
  const [deliverySurcharge, setDeliverySurcharge] = useState(0);

  const [decisionCategory] = useState('Price Change (Standard Catalog)');
  const [customPrompt] = useState('');
  const [logged, setLogged] = useState(false);

  const { mutate: runSimulation, data: simData, isPending: simulating } = useSimulationMutation();
  const { mutate: logDecision } = useLogDecisionMutation(user?.organization_id || 'default');

  useEffect(() => {
    executeSimulation(10);
  }, []);

  const executeSimulation = (val?: number) => {
    const pVal = val !== undefined ? val : priceChange;
    if (val !== undefined) setPriceChange(val);

    runSimulation({
      percentage_increase: pVal / 100,
      decision_type: decisionCategory,
      custom_text: customPrompt,
    });
  };

  const handleApprove = () => {
    if (isAuditor || !simData) return;
    const sim = simData.simulation?.simulation?.scenarios?.base;
    const analysis = simData.analysis;

    logDecision({
      question: `Apply ${decisionCategory} (${priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`})?`,
      proposed_action: `${priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`} Adjustment`,
      ai_recommendation: analysis?.recommendation || 'Approved via Simulator',
      expected_profit: `₹${(sim?.profit / 100000 || 23.4).toFixed(1)}L`,
      risk: analysis?.risk_level || 'LOW',
      confidence: Math.round((analysis?.confidence || 0.9) * 100),
    });

    setLogged(true);
    setTimeout(() => setLogged(false), 3500);
  };

  const baseSim = simData?.simulation?.simulation?.scenarios?.base;
  const optSim = simData?.simulation?.simulation?.scenarios?.optimistic;
  const pessSim = simData?.simulation?.simulation?.scenarios?.pessimistic;
  const analysis = simData?.analysis;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232E42] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30">
              <Sliders size={18} />
            </div>
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              WHAT-IF DECISION SIMULATOR
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#182234] text-[#E8A33D] border border-[#E8A33D]/30 font-bold">
              Multi-Scenario Engine
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Adjust financial strategic levers to model downstream causal consequences across 3 branched futures
          </p>
        </div>

        {isAuditor && (
          <span className="text-xs font-mono font-bold text-[#E8A33D] bg-[#E8A33D]/10 border border-[#E8A33D]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Layers size={13} /> Read-Only Compliance Mode Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Levers & Preset Panel (5 cols) */}
        <div className="lg:col-span-5 ftm-card p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
              Strategic Control Levers
            </h3>
            <span className="text-[10px] font-mono text-[#5B6A82]">
              Deterministic Input Vector
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82]">
              ⚡ Strategy Presets
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: '+5% Safe Hike', val: 5, tag: 'Optimal Retention', color: 'text-[#3ADDA0]' },
                { label: '+10% Standard', val: 10, tag: 'Baseline Catalog', color: 'text-[#5B8DEF]' },
                { label: '+15% High Margin', val: 15, tag: 'Elevated Churn', color: 'text-[#E8A33D]' },
                { label: '-5% Volume Push', val: -5, tag: 'Acquisition Focus', color: 'text-[#E9EDF4]' },
              ].map((p) => (
                <button
                  key={p.val}
                  disabled={isAuditor}
                  onClick={() => executeSimulation(p.val)}
                  className={`p-3 rounded-lg ftm-card-nested text-left border border-[#232E42] hover:border-[#E8A33D]/40 transition-all cursor-pointer ${
                    priceChange === p.val ? 'border-[#E8A33D] bg-[#E8A33D]/5' : ''
                  } ${isAuditor ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className={`font-mono font-bold block ${p.color}`}>{p.label}</span>
                  <span className="text-[10px] text-[#5B6A82] font-sans">{p.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Vector */}
          <div className="space-y-4 pt-1">
            {/* Price Lever */}
            <div className="ftm-card-nested p-4 space-y-2 border border-[#232E42]">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold uppercase text-[#8C99AF]">
                  Catalog Price Adjustment
                </label>
                <span className="text-base font-bold font-mono text-[#E8A33D]">
                  {priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="30"
                value={priceChange}
                disabled={isAuditor}
                onChange={(e) => setPriceChange(Number(e.target.value))}
                className={`w-full cursor-pointer ${isAuditor ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex justify-between text-[10px] font-mono text-[#5B6A82]">
                <span>-20% Contraction</span>
                <span>0% Neutral</span>
                <span>+30% Aggressive</span>
              </div>
            </div>

            {/* Marketing Spend */}
            <div className="ftm-card-nested p-4 space-y-2 border border-[#232E42]">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold uppercase text-[#8C99AF]">
                  Marketing Allocation
                </label>
                <span className="text-base font-bold font-mono text-[#5B8DEF]">
                  +{marketingSpend}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={marketingSpend}
                disabled={isAuditor}
                onChange={(e) => setMarketingSpend(Number(e.target.value))}
                className={`w-full cursor-pointer ${isAuditor ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Delivery Surcharge */}
            <div className="ftm-card-nested p-4 space-y-2 border border-[#232E42]">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold uppercase text-[#8C99AF]">
                  Delivery Fee Surcharge
                </label>
                <span className="text-base font-bold font-mono text-[#E9EDF4]">
                  ₹{deliverySurcharge}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={deliverySurcharge}
                disabled={isAuditor}
                onChange={(e) => setDeliverySurcharge(Number(e.target.value))}
                className={`w-full cursor-pointer ${isAuditor ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <button
              onClick={() => executeSimulation()}
              disabled={simulating || isAuditor}
              className={`w-full py-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                isAuditor
                  ? 'bg-[#182234] text-[#5B6A82] border border-[#232E42] cursor-not-allowed'
                  : 'bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-[#0B0F17] shadow-[#E8A33D]/25 cursor-pointer'
              }`}
            >
              {simulating ? (
                <>
                  <Sparkles className="animate-spin" size={16} /> Synthesizing Causal Futures…
                </>
              ) : isAuditor ? (
                "INTERACTIVE CONTROLS MUTED (AUDIT ONLY)"
              ) : (
                "RUN TIME MACHINE SIMULATION →"
              )}
            </button>
          </div>
        </div>

        {/* Results, Before/After, & Three-Futures (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Before -> After Comparison Card */}
          <div className="ftm-card p-5 space-y-4 border border-[#232E42]">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
                Baseline vs Simulated Delta Comparison
              </h3>
              <span className="text-[10px] font-mono text-[#E8A33D] font-bold">
                {priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`} Scenario
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before */}
              <div className="ftm-card-nested p-4 space-y-2 border border-[#232E42]">
                <span className="text-[10px] font-mono uppercase text-[#5B6A82] block font-bold">
                  Current Baseline (Present)
                </span>
                <p className="text-2xl font-bold font-mono text-[#8C99AF]">₹82.4L</p>
                <div className="text-xs font-mono text-[#5B6A82] space-y-1">
                  <p>Profit: ₹21.2L (25.7%)</p>
                  <p>Churn: 7.1% baseline</p>
                </div>
              </div>

              {/* After */}
              <div className="ftm-card-nested p-4 space-y-2 border border-[#E8A33D]/40 bg-[#E8A33D]/5">
                <span className="text-[10px] font-mono uppercase text-[#E8A33D] block font-bold">
                  Simulated Outcome (Base Case)
                </span>
                <p className="text-2xl font-bold font-mono text-[#3ADDA0]">
                  ₹{(baseSim?.revenue / 100000 || 88.7).toFixed(1)}L
                </p>
                <div className="text-xs font-mono text-[#E9EDF4] space-y-1">
                  <p>
                    Profit: <strong className="text-[#3ADDA0]">₹{(baseSim?.profit / 100000 || 23.4).toFixed(1)}L</strong> (+9.4%)
                  </p>
                  <p>
                    Churn: <strong className="text-[#E8A33D]">{((baseSim?.churn || 0.089) * 100).toFixed(1)}%</strong> (+1.8%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Spine Branching */}
          <TimelineSpine
            pastLabel="Nova Commerce Historical Baseline"
            pastValue="₹64.2L → ₹81.0L"
            presentLabel="Active Parameters (Present)"
            presentValue="₹82.4L"
            pessimisticValue={`₹${(pessSim?.revenue / 100000 || 76.9).toFixed(1)}L`}
            baseValue={`₹${(baseSim?.revenue / 100000 || 88.7).toFixed(1)}L`}
            optimisticValue={`₹${(optSim?.revenue / 100000 || 94.1).toFixed(1)}L`}
          />

          {/* Three-Futures Table */}
          <div className="ftm-card p-5 space-y-4">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
              Three Branched Futures Scenario Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Pessimistic */}
              <div className="p-4 rounded-xl ftm-card-nested border border-[#F1584F]/30 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#F1584F] block">
                  Pessimistic Future
                </span>
                <p className="text-xl font-bold font-mono text-[#E9EDF4]">
                  ₹{(pessSim?.revenue / 100000 || 76.9).toFixed(1)}L
                </p>
                <div className="text-xs font-mono space-y-1 text-[#8C99AF]">
                  <p>Profit: <strong className="text-[#F1584F]">₹{(pessSim?.profit / 100000 || 17.8).toFixed(1)}L</strong></p>
                  <p>Churn: <strong className="text-[#F1584F]">{((pessSim?.churn || 0.114) * 100).toFixed(1)}%</strong></p>
                </div>
              </div>

              {/* Base */}
              <div className="p-4 rounded-xl ftm-card-nested border border-[#5B8DEF]/50 space-y-2 bg-[#5B8DEF]/5">
                <span className="text-[10px] font-mono font-bold uppercase text-[#5B8DEF] block">
                  Base Scenario Future
                </span>
                <p className="text-xl font-bold font-mono text-[#E9EDF4]">
                  ₹{(baseSim?.revenue / 100000 || 88.7).toFixed(1)}L
                </p>
                <div className="text-xs font-mono space-y-1 text-[#8C99AF]">
                  <p>Profit: <strong className="text-[#3ADDA0]">₹{(baseSim?.profit / 100000 || 23.4).toFixed(1)}L</strong></p>
                  <p>Churn: <strong className="text-[#E8A33D]">{((baseSim?.churn || 0.089) * 100).toFixed(1)}%</strong></p>
                </div>
              </div>

              {/* Optimistic */}
              <div className="p-4 rounded-xl ftm-card-nested border border-[#3ADDA0]/30 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#3ADDA0] block">
                  Optimistic Future
                </span>
                <p className="text-xl font-bold font-mono text-[#E9EDF4]">
                  ₹{(optSim?.revenue / 100000 || 94.1).toFixed(1)}L
                </p>
                <div className="text-xs font-mono space-y-1 text-[#8C99AF]">
                  <p>Profit: <strong className="text-[#3ADDA0]">₹{(optSim?.profit / 100000 || 29.1).toFixed(1)}L</strong></p>
                  <p>Churn: <strong className="text-[#3ADDA0]">{((optSim?.churn || 0.076) * 100).toFixed(1)}%</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Supervisor Verdict in AIInsightCard */}
          {analysis && (
            <div className="space-y-4">
              <AIInsightCard
                title="AI Supervisor Scenario Evaluation"
                recommendation={analysis.recommendation}
                summary={analysis.summary}
                confidence={Math.round((analysis.confidence || 0.9) * 100)}
                riskLevel={analysis.risk_level || 'LOW'}
                why={analysis.why}
                evidence={analysis.evidence}
                sourceAgents={analysis.source_agents}
                similarDecision={analysis.similar_decision}
                followUps={[
                  'Compare against +15% high-margin strategy in War Room',
                  'View regional customer cohort sensitivity',
                  'Simulate logistics surcharge offset'
                ]}
                onFollowUpClick={() => onNavigate('chat')}
                onMemoryClick={() => onNavigate('memory')}
              />

              {/* Governance Decision Actions */}
              <div className="ftm-card p-4 flex flex-wrap items-center justify-between gap-3 border border-[#232E42]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-display font-bold text-[#E9EDF4]">
                    Commit Scenario to Corporate Governance Ledger
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {logged && (
                    <span className="text-xs font-mono text-[#3ADDA0] font-bold">
                      ✓ Committed to Ledger!
                    </span>
                  )}
                  <button
                    onClick={handleApprove}
                    disabled={isAuditor || logged}
                    className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      isAuditor
                        ? 'bg-[#182234] text-[#5B6A82] border border-[#232E42] cursor-not-allowed opacity-60'
                        : 'bg-[#3ADDA0] hover:bg-[#3ADDA0]/90 text-[#0B0F17] cursor-pointer shadow-md shadow-[#3ADDA0]/20'
                    }`}
                  >
                    <Check size={14} /> {isAuditor ? 'Muted (Audit Only)' : 'Commit & Log Decision'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
