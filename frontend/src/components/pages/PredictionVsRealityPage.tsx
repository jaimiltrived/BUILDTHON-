import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePredictionVsRealityQuery, useRecordActualMutation } from '../../lib/queries';
import MetricCard from '../common/MetricCard';
import TimelineSpine from '../common/TimelineSpine';
import { History, PlusCircle, CheckCircle2, Sparkles, Layers } from 'lucide-react';

export default function PredictionVsRealityPage() {
  const { user } = useAuth();
  const isAuditor = user?.role === 'AUDITOR';

  const { data: pvrData } = usePredictionVsRealityQuery(user?.organization_id || 'default');
  const { mutate: recordActual, isPending: recording } = useRecordActualMutation(user?.organization_id || 'default');

  const [decisionId, setDecisionId] = useState(`DEC-${Math.floor(1050 + Math.random() * 9000)}`);
  const [actualRevenue, setActualRevenue] = useState(8820000);
  const [actualProfit, setActualProfit] = useState(2310000);
  const [actualChurn, setActualChurn] = useState(7.4);
  const [notes, setNotes] = useState('Actual revenue closely matched Base (+7.0%), slight churn spike in non-metro segments.');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuditor) return;

    recordActual({
      decision_id: decisionId,
      actual_revenue: Number(actualRevenue),
      actual_profit: Number(actualProfit),
      actual_churn: Number(actualChurn),
      notes,
    });

    setSuccessMsg('Outcome recorded successfully into AI Decision Memory calibration engine!');
    setDecisionId(`DEC-${Math.floor(1050 + Math.random() * 9000)}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const evaluations = pvrData?.recent_evaluations || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232E42] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#5B8DEF]/10 text-[#5B8DEF] border border-[#5B8DEF]/30">
              <History size={18} />
            </div>
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              PREDICTION VS REALITY CALIBRATION
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#182234] text-[#3ADDA0] border border-[#3ADDA0]/30 font-bold">
              Continuous Learning Loop
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Auditing model accuracy over time by comparing simulated forecasts against verified actual execution outcomes
          </p>
        </div>

        {isAuditor && (
          <span className="text-xs font-mono font-bold text-[#E8A33D] bg-[#E8A33D]/10 border border-[#E8A33D]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Layers size={13} /> Read-Only Compliance Mode Active
          </span>
        )}
      </div>

      {/* Accuracy KPI Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Model Accuracy"
          value={`${pvrData?.overall_prediction_accuracy || 91.4}%`}
          delta="Calibrated"
          deltaType="positive"
          subtitle={`Across ${pvrData?.tracked_decisions_count || 8} tracked decisions`}
        />
        <MetricCard
          title="Revenue Variance Accuracy"
          value={`${pvrData?.revenue_prediction_accuracy || 94.2}%`}
          delta={`Mean Err: ${(100 - (pvrData?.revenue_prediction_accuracy || 94.2)).toFixed(1)}%`}
          deltaType="positive"
          subtitle="Top-line model"
        />
        <MetricCard
          title="Profit Margin Accuracy"
          value={`${pvrData?.profit_prediction_accuracy || 89.5}%`}
          delta={`Mean Err: ${(100 - (pvrData?.profit_prediction_accuracy || 89.5)).toFixed(1)}%`}
          deltaType="neutral"
          subtitle="Operating profit model"
        />
        <MetricCard
          title="Customer Churn Accuracy"
          value={`${pvrData?.churn_prediction_accuracy || 90.8}%`}
          delta="Self-Tuning"
          deltaType="positive"
          subtitle="Elasticity model"
        />
      </div>

      {/* Timeline Spine Signature Motif */}
      <TimelineSpine
        pastLabel="Model Calibration Baseline"
        pastValue="91.4% Historical Accuracy"
        presentLabel="Active Model Calibration: Aug 2026"
        presentValue="Continuous ML Feedback"
        pessimisticValue="94.2% Rev"
        baseValue="89.5% Pft"
        optimisticValue="90.8% Churn"
      />

      {/* Paired Predicted vs Actual Evaluations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Evaluations History (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="ftm-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
                Historical Decision Calibration Log
              </h3>
              <span className="text-[10px] font-mono text-[#5B6A82]">
                Paired Model vs Real-World Execution
              </span>
            </div>

            <div className="space-y-4">
              {evaluations.map((item: any, idx: number) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="ftm-card-nested p-5 space-y-3.5 border border-[#232E42] hover:border-[#5B8DEF]/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232E42] pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#E8A33D] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#232E42]">
                          {item.id}
                        </span>
                        <span className="text-xs font-mono text-[#5B6A82]">{item.category} · {item.date}</span>
                      </div>
                      <h4 className="text-sm font-display font-bold text-[#E9EDF4] mt-1">
                        {item.title}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#3ADDA0] bg-[#3ADDA0]/10 border border-[#3ADDA0]/30 px-3 py-1 rounded-full">
                      {item.accuracy?.overall_accuracy}% Calibrated Accuracy
                    </span>
                  </div>

                  {/* Paired Bars Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ftm-card-nested p-3 border border-[#232E42] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#5B6A82] uppercase block">Target Metric</span>
                      <span className="font-bold text-[#E9EDF4]">Revenue Growth</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5B6A82] uppercase block">Predicted Forecast</span>
                      <span className="font-bold text-[#5B8DEF]">{item.predicted?.revenue_change_pct}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5B6A82] uppercase block">Actual Execution</span>
                      <span
                        className={`font-bold ${
                          item.actual?.revenue_change_pct?.startsWith('+')
                            ? 'text-[#3ADDA0]'
                            : 'text-[#F1584F]'
                        }`}
                      >
                        {item.actual?.revenue_change_pct}
                      </span>
                    </div>
                  </div>

                  {/* Plain Language Lesson Learned */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-[#0B0F17] rounded-lg border border-[#232E42]">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#5B6A82] block mb-0.5">
                        Observed Consequence:
                      </span>
                      <p className="text-[#8C99AF] leading-relaxed font-sans">
                        {item.observed_outcome}
                      </p>
                    </div>

                    <div className="p-3 bg-[#E8A33D]/5 rounded-lg border border-[#E8A33D]/30">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#E8A33D] flex items-center gap-1 mb-0.5">
                        <Sparkles size={12} /> Plain-Language AI Institutional Lesson:
                      </span>
                      <p className="text-[#E9EDF4] leading-relaxed font-sans">
                        {item.ai_lesson}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Record New Actual Result Form (4 cols) */}
        <div className="lg:col-span-4">
          <div className="ftm-card p-6 space-y-4 border border-[#232E42]">
            <div className="border-b border-[#232E42] pb-3">
              <h3 className="text-sm font-display font-bold text-[#E9EDF4] flex items-center gap-2">
                <PlusCircle size={16} className="text-[#3ADDA0]" /> Record Actual Outcome
              </h3>
              <p className="text-xs text-[#8C99AF] mt-1">
                Feed real execution numbers back into the model to continuously calibrate future simulation algorithms
              </p>
            </div>

            {successMsg && (
              <div className="p-3 bg-[#3ADDA0]/10 border border-[#3ADDA0]/30 rounded-lg text-xs text-[#3ADDA0] flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82] mb-1">
                  Decision ID
                </label>
                <input
                  type="text"
                  value={decisionId}
                  disabled={isAuditor}
                  onChange={(e) => setDecisionId(e.target.value)}
                  className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-[#E9EDF4] font-mono font-bold outline-none focus:border-[#E8A33D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82] mb-1">
                    Actual Revenue (₹)
                  </label>
                  <input
                    type="number"
                    value={actualRevenue}
                    disabled={isAuditor}
                    onChange={(e) => setActualRevenue(Number(e.target.value))}
                    className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-[#E9EDF4] font-mono font-bold outline-none focus:border-[#E8A33D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82] mb-1">
                    Actual Profit (₹)
                  </label>
                  <input
                    type="number"
                    value={actualProfit}
                    disabled={isAuditor}
                    onChange={(e) => setActualProfit(Number(e.target.value))}
                    className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-[#E9EDF4] font-mono font-bold outline-none focus:border-[#E8A33D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82] mb-1">
                  Observed Churn Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={actualChurn}
                  disabled={isAuditor}
                  onChange={(e) => setActualChurn(Number(e.target.value))}
                  className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-[#E9EDF4] font-mono font-bold outline-none focus:border-[#E8A33D]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82] mb-1">
                  Plain-Language Contextual Lesson
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  disabled={isAuditor}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#182234] border border-[#232E42] rounded-lg p-3 text-[#E9EDF4] text-xs outline-none focus:border-[#E8A33D]"
                />
              </div>

              <button
                type="submit"
                disabled={isAuditor || recording}
                className={`w-full py-3.5 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all ${
                  isAuditor
                    ? 'bg-[#182234] text-[#5B6A82] border border-[#232E42] cursor-not-allowed opacity-60'
                    : 'bg-[#3ADDA0] hover:bg-[#3ADDA0]/90 text-[#0B0F17] shadow-md shadow-[#3ADDA0]/20 cursor-pointer'
                }`}
              >
                {recording ? "Calibrating Neural Weights…" : isAuditor ? "FEEDBACK LOOP (LOCKED FOR AUDIT)" : "CALIBRATE AI DECISION MEMORY"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
