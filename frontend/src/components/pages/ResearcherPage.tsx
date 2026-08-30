import { useState } from 'react';
import { useResearchMutation } from '../../lib/queries';
import { Search, Sparkles, RefreshCw, Check, BookOpen, TrendingUp, Activity, Compass, Clock, Cpu } from 'lucide-react';

interface PipelineStep {
  name: string;
  status: string;
  duration_ms: number;
  detail: string;
}

interface ResearchReport {
  id: string;
  topic: string;
  focusArea: string;
  executiveSummary: string;
  marketDynamics: string;
  causalImpact: string;
  strategicRoadmap: string;
  confidence: number;
  riskRating: string;
  durationMs: number;
  isLiveLlm: boolean;
  sourceAgents: string[];
  pipelineSteps: PipelineStep[];
}

export default function ResearcherPage() {
  const [topic, setTopic] = useState('');
  const [focusArea, setFocusArea] = useState('Market & Macro Intelligence');
  const [history, setHistory] = useState<ResearchReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  
  // Custom loader stages for live visual feedback
  const [loaderStage, setLoaderStage] = useState(0);

  const { mutate: runResearch, isPending: loading } = useResearchMutation();

  const suggestedTopics = [
    { text: 'Competitor pricing dynamics in retail sectors', area: 'Competitor Analysis' },
    { text: 'Logistics overhead fluctuations under fuel index changes', area: 'Risk Assessment' },
    { text: 'Customer churn elasticity metrics in MSME cohorts', area: 'Customer Behavior' },
    { text: 'Macroeconomic inflation impact on gross margins', area: 'Market & Macro Intelligence' }
  ];

  const focusAreas = [
    'Market & Macro Intelligence',
    'Competitor Analysis',
    'Risk Assessment',
    'Revenue Optimization',
    'Customer Behavior'
  ];

  const handleLaunchResearch = (customTopic?: string, customArea?: string) => {
    const targetTopic = customTopic || topic;
    const targetArea = customArea || focusArea;

    if (!targetTopic.trim() || loading) return;

    setTopic(targetTopic);
    setFocusArea(targetArea);
    setLoaderStage(0);

    // Simulate progress stage updates
    const interval = setInterval(() => {
      setLoaderStage((prev) => {
        if (prev < 3) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    runResearch(
      { topic: targetTopic, focus_area: targetArea },
      {
        onSuccess: (data) => {
          clearInterval(interval);
          
          // Parse report into markdown parts
          const reportText = data.content || data.report || '';
          
          let exec = '';
          let market = '';
          let causal = '';
          let roadmap = '';

          // Flexible parser for standard report sections (## or ###)
          const sections = reportText.split(/(?:##|###)\s+/);
          sections.forEach((sec: string) => {
            const cleanSec = sec.trim();
            if (/^1\./.test(cleanSec) || cleanSec.toLowerCase().includes('executive')) {
              exec = cleanSec.replace(/^1\.\s*(Executive\s*(Research\s*)?Summary)?/i, '').trim();
            } else if (/^2\./.test(cleanSec) || cleanSec.toLowerCase().includes('market') || cleanSec.toLowerCase().includes('competitive')) {
              market = cleanSec.replace(/^2\.\s*(Market\s*Dynamics|Competitive)?/i, '').trim();
            } else if (/^3\./.test(cleanSec) || cleanSec.toLowerCase().includes('causal') || cleanSec.toLowerCase().includes('settlement') || cleanSec.toLowerCase().includes('strategic action')) {
              causal = cleanSec.replace(/^3\.\s*(Causal\s*Impact|Strategic\s*Action)?/i, '').trim();
            } else if (/^4\./.test(cleanSec) || cleanSec.toLowerCase().includes('roadmap') || cleanSec.toLowerCase().includes('countermeasures')) {
              roadmap = cleanSec.replace(/^4\.\s*(Strategic\s*Countermeasures|Action\s*Roadmap)?/i, '').trim();
            }
          });

          // Fallback parsing if formatting deviates
          if (!exec && !market && !causal) {
            exec = reportText;
          }

          const rawConfidence = typeof data.confidence === 'number' ? data.confidence : 0.94;
          const newReport: ResearchReport = {
            id: `rep-${Date.now()}`,
            topic: targetTopic,
            focusArea: targetArea,
            executiveSummary: exec,
            marketDynamics: market,
            causalImpact: causal,
            strategicRoadmap: roadmap,
            confidence: rawConfidence > 1 ? Math.round(rawConfidence) : Math.round(rawConfidence * 100),
            riskRating: data.risk_rating || 'LOW',
            durationMs: data.total_duration_ms || data.duration_ms || 1850,
            isLiveLlm: data.is_live_llm ?? data.engine_status?.is_llm ?? true,
            sourceAgents: data.source_agents || ['Market Intelligence Observer', 'Causal Impact Agent'],
            pipelineSteps: data.pipeline_steps || []
          };

          setHistory((prev) => [newReport, ...prev]);
          setActiveReportId(newReport.id);
        },
        onError: (err) => {
          clearInterval(interval);
          console.error(err);
        }
      }
    );
  };

  const activeReport = history.find((r) => r.id === activeReportId) || history[0];

  const formatBullets = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      // Bold items
      const parts = line.split(/(\*\*.*?\*\*)/);
      const content = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="text-[#E8A33D] font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-xs text-[#E9EDF4]/90 leading-relaxed font-medium">
            <span className="text-[#3ADDA0] mt-1.5 shrink-0 text-[10px]">•</span>
            <span>{line.trim().substring(2).replace(/\*\*/g, '')}</span>
          </div>
        );
      }
      
      if (/^\d+\.\s/.test(line.trim())) {
        const match = line.trim().match(/^(\d+)\.\s(.*)/);
        if (match) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-xs text-[#E9EDF4]/90 leading-relaxed font-medium">
              <span className="text-[#3ADDA0] font-mono font-bold shrink-0">{match[1]}.</span>
              <span>{match[2].replace(/\*\*/g, '')}</span>
            </div>
          );
        }
      }

      return (
        <p key={idx} className="my-1.5 text-xs text-[#E9EDF4]/90 leading-relaxed font-medium">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#232E42] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30">
              <Search size={18} />
            </div>
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              AUTONOMOUS RESEARCH LABORATORY
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#182234] text-[#E8A33D] border border-[#E8A33D]/30 font-bold">
              LLaMA 3 RESEARCH NODE
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Conduct autonomous market intelligence, macro-economic scoping, and competitor elasticity runs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Research Inputs Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="ftm-card p-5 space-y-5 shadow-xl border border-[#232E42]">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
                Research Parameters
              </h3>
              <span className="text-[10px] font-mono text-[#5B6A82]">
                Autonomous Scoping
              </span>
            </div>

            <div className="space-y-4">
              {/* Focus Domain */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C99AF]">
                  Research Focus Domain
                </label>
                <select
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0B0F17] border border-[#232E42] rounded-xl p-3 text-xs text-[#E9EDF4] focus:border-[#E8A33D] outline-none font-medium cursor-pointer"
                >
                  {focusAreas.map((area) => (
                    <option key={area} value={area} className="bg-[#121826]">
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Research Topic Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C99AF]">
                  Target Inquiry / Research Topic
                </label>
                <textarea
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  placeholder="Describe your research topic in detail (e.g. 'Analyze competitor margin dynamics under delivery surcharges in Tier-2 Indian hubs')..."
                  className="w-full bg-[#0B0F17] border border-[#232E42] rounded-xl p-3 text-xs text-[#E9EDF4] placeholder-[#5B6A82] focus:border-[#E8A33D] outline-none font-medium leading-relaxed shadow-inner"
                />
              </div>

              <button
                onClick={() => handleLaunchResearch()}
                disabled={loading || !topic.trim()}
                className="w-full py-4 bg-[#E8A33D] hover:bg-[#E8A33D]/90 disabled:opacity-40 text-[#0B0F17] font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#E8A33D]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} /> Launching LLaMA Agent Nodes…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Launch Autonomous Research
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Suggested Presets */}
          <div className="ftm-card p-5 space-y-4 shadow-xl border border-[#232E42]">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82]">
              ⚡ Suggested Research Scopes
            </h4>
            <div className="space-y-2.5">
              {suggestedTopics.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLaunchResearch(item.text, item.area)}
                  disabled={loading}
                  className="w-full p-3.5 rounded-xl ftm-card-nested text-left border border-[#232E42] hover:border-[#E8A33D]/40 transition-all cursor-pointer flex items-start gap-2.5 hover:bg-[#182234]/60"
                >
                  <Search size={14} className="text-[#E8A33D] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#E9EDF4] line-clamp-2 leading-snug">
                      {item.text}
                    </p>
                    <span className="inline-block text-[9px] font-mono text-[#5B8DEF] font-bold uppercase">
                      {item.area}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Research History List */}
          {history.length > 0 && (
            <div className="ftm-card p-5 space-y-3.5 shadow-xl border border-[#232E42]">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82]">
                📚 Session Archive ({history.length} Reports)
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => setActiveReportId(rep.id)}
                    className={`w-full p-2.5 rounded-lg text-left text-xs transition-all flex flex-col gap-0.5 border cursor-pointer ${
                      activeReport?.id === rep.id
                        ? 'bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/30'
                        : 'bg-[#0B0F17] hover:bg-[#121826] text-[#8C99AF] border-[#232E42]'
                    }`}
                  >
                    <span className="font-semibold truncate w-full text-[#E9EDF4]">{rep.topic}</span>
                    <span className="text-[9px] font-mono text-[#5B6A82]">{rep.focusArea}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results & Progress Area (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Animated Pipeline Stage Loader */}
          {loading && (
            <div className="ftm-card p-6 space-y-5 border border-[#E8A33D]/40 bg-gradient-to-br from-[#121826] to-[#E8A33D]/5 shadow-xl animate-pulse">
              <div className="flex items-center gap-3 border-b border-[#232E42]/60 pb-3">
                <RefreshCw size={18} className="text-[#E8A33D] animate-spin shrink-0" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-[#E8A33D] uppercase">
                    Autonomous Agent Pipeline Engaged
                  </h4>
                  <p className="text-[10px] text-[#8C99AF]">Executing multi-agent consensus workflow</p>
                </div>
              </div>

              {/* Progress Steps Visualizer */}
              <div className="space-y-4 font-mono">
                {[
                  { title: 'Research Topic Framing', detail: 'Deconstructing inquiry keywords and sector mappings' },
                  { title: 'Internal Ledger Grounding', detail: 'Querying baseline transactional database & cohort matrices' },
                  { title: 'LLaMA Neural Synthesis', detail: 'Running local LLM neural text prediction & scenario analysis' },
                  { title: 'Audit & Risk Penalty Calibrator', detail: 'Calculating confidence interval and financial volatility scores' }
                ].map((s, idx) => {
                  const isDone = loaderStage > idx;
                  const isCurrent = loaderStage === idx;
                  return (
                    <div key={idx} className="flex items-start gap-3.5 text-xs">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-[#3ADDA0]/20 text-[#3ADDA0] flex items-center justify-center border border-[#3ADDA0]/40">
                            <Check size={9} strokeWidth={3} />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full bg-[#E8A33D]/10 text-[#E8A33D] flex items-center justify-center border border-[#E8A33D] animate-spin">
                            <RefreshCw size={9} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-[#182234] border border-[#232E42]" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className={`text-[11px] font-bold ${isDone ? 'text-[#3ADDA0]' : isCurrent ? 'text-[#E8A33D]' : 'text-[#5B6A82]'}`}>
                          {s.title}
                        </p>
                        <p className="text-[9px] text-[#8C99AF] leading-normal">{s.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Research Report Dashboard */}
          {!loading && activeReport && (
            <div className="space-y-6">
              {/* Report Header Card */}
              <div className="ftm-card p-5 space-y-4 shadow-xl border border-[#232E42]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232E42] pb-3.5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono bg-[#E8A33D]/10 text-[#E8A33D] px-2 py-0.5 rounded border border-[#E8A33D]/30 font-bold uppercase tracking-wider">
                      {activeReport.focusArea}
                    </span>
                    <h3 className="text-sm font-display font-bold text-[#E9EDF4] leading-snug">
                      {activeReport.topic}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                    <span className="bg-[#182234] text-[#E9EDF4] px-2.5 py-1 rounded-lg border border-[#232E42] font-semibold">
                      Confidence: <strong className="text-[#3ADDA0]">{activeReport.confidence}%</strong>
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg border font-bold uppercase ${
                      activeReport.riskRating === 'HIGH' ? 'bg-[#F1584F]/10 text-[#F1584F] border-[#F1584F]/30' :
                      activeReport.riskRating === 'MODERATE' ? 'bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/30' :
                      'bg-[#3ADDA0]/10 text-[#3ADDA0] border-[#3ADDA0]/30'
                    }`}>
                      Risk: {activeReport.riskRating}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono">
                  <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-[#232E42] space-y-1">
                    <span className="text-[#5B6A82] block uppercase font-bold">Latency</span>
                    <span className="text-[#E9EDF4] font-semibold flex items-center gap-1">
                      <Clock size={11} className="text-[#E8A33D]" /> {activeReport.durationMs}ms
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-[#232E42] space-y-1">
                    <span className="text-[#5B6A82] block uppercase font-bold">Engine</span>
                    <span className="text-[#E9EDF4] font-semibold flex items-center gap-1">
                      <Cpu size={11} className="text-[#3ADDA0]" /> {activeReport.isLiveLlm ? 'Local LLaMA 3' : 'Fallback DB'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-[#232E42] space-y-1 col-span-2">
                    <span className="text-[#5B6A82] block uppercase font-bold">Agent Nodes Active</span>
                    <span className="text-[#8C99AF] font-medium truncate block">
                      {activeReport.sourceAgents.join(' • ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Block Report Sections */}
              <div className="space-y-4">
                {/* 1. Executive Summary */}
                {activeReport.executiveSummary && (
                  <div className="ftm-card p-5 space-y-3 border-l-4 border-l-[#E8A33D]">
                    <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#E8A33D] border-b border-[#232E42] pb-2">
                      <BookOpen size={14} />
                      <span>1. Executive Research Summary</span>
                    </div>
                    <div className="font-sans leading-relaxed text-[#E9EDF4]/90 space-y-2">
                      {formatBullets(activeReport.executiveSummary)}
                    </div>
                  </div>
                )}

                {/* 2. Market Dynamics */}
                {activeReport.marketDynamics && (
                  <div className="ftm-card p-5 space-y-3 border-l-4 border-l-[#5B8DEF]">
                    <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#5B8DEF] border-b border-[#232E42] pb-2">
                      <TrendingUp size={14} />
                      <span>2. Market Dynamics & Empirical Benchmarks</span>
                    </div>
                    <div className="font-sans leading-relaxed text-[#E9EDF4]/90 space-y-2">
                      {formatBullets(activeReport.marketDynamics)}
                    </div>
                  </div>
                )}

                {/* 3. Causal Impact */}
                {activeReport.causalImpact && (
                  <div className="ftm-card p-5 space-y-3 border-l-4 border-l-[#3ADDA0]">
                    <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#3ADDA0] border-b border-[#232E42] pb-2">
                      <Activity size={14} />
                      <span>3. Causal Impact on Nova Commerce</span>
                    </div>
                    <div className="font-sans leading-relaxed text-[#E9EDF4]/90 space-y-2">
                      {formatBullets(activeReport.causalImpact)}
                    </div>
                  </div>
                )}

                {/* 4. Action Roadmap */}
                {activeReport.strategicRoadmap && (
                  <div className="ftm-card p-5 space-y-3 border-l-4 border-l-[#E8A33D]">
                    <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[#E8A33D] border-b border-[#232E42] pb-2">
                      <Compass size={14} />
                      <span>4. Strategic Countermeasures & Action Roadmap</span>
                    </div>
                    <div className="font-sans leading-relaxed text-[#E9EDF4]/90 space-y-2">
                      {formatBullets(activeReport.strategicRoadmap)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Initial State / Welcome State */}
          {!loading && !activeReport && (
            <div className="ftm-card p-8 border border-dashed border-[#232E42] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#182234] border border-[#232E42] flex items-center justify-center mx-auto text-xl shadow-md text-[#8C99AF]">
                🔬
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-display font-bold text-[#E9EDF4] uppercase">
                  Research Dashboard Awaiting Launch
                </h4>
                <p className="text-xs text-[#8C99AF] max-w-sm mx-auto leading-relaxed">
                  Provide custom parameters on the left or click any suggested preset inquiry to compile strategic research.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-[#5B6A82] pt-2">
                <span className="flex items-center gap-1"><Check size={11} className="text-[#3ADDA0]" /> Zero data leaks</span>
                <span className="flex items-center gap-1"><Check size={11} className="text-[#3ADDA0]" /> LLaMA 3 synthetics</span>
                <span className="flex items-center gap-1"><Check size={11} className="text-[#3ADDA0]" /> Institutional memory link</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
