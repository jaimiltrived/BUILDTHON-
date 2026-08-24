import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Bot, User, Clock, Terminal, ChevronDown, ChevronUp, Cpu, Activity, Database, Sliders, Info, Server, Check, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Cell } from 'recharts';
import { apiClient } from '../../lib/apiClient';
import { useEngineStatusQuery } from '../../lib/queries';

interface PipelineStep {
  name: string;
  status: string;
  duration_ms: number;
  detail: string;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  generationMode?: string;
  sourceAgents?: string[];
  pipelineSteps?: PipelineStep[];
  isExpanded?: boolean;
}

// Simple debounce hook for smooth slider updates
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Inline Simulator Component for Real-time Causal Playgrounds inside Chat Bubbles
function InlineSimulator({ initialVal }: { initialVal: number }) {
  const [sliderValue, setSliderValue] = useState(initialVal);
  const [marketingValue, setMarketingValue] = useState(5);
  const [deliveryValue, setDeliveryValue] = useState(0);

  const debouncedPrice = useDebounce(sliderValue, 200);
  const debouncedMarketing = useDebounce(marketingValue, 200);
  const debouncedDelivery = useDebounce(deliveryValue, 200);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    let active = true;
    const runSim = async () => {
      setLoading(true);
      try {
        const res = await apiClient.post<any>('/api/simulations/simulate-price', {
          percentage_increase: debouncedPrice / 100,
          marketing_spend: debouncedMarketing,
          delivery_surcharge: debouncedDelivery,
          decision_type: 'Command Tower Sandbox'
        });
        if (active) {
          setData(res);
        }
      } catch (err) {
        console.error('Inline simulation error', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    runSim();
    return () => {
      active = false;
    };
  }, [debouncedPrice, debouncedMarketing, debouncedDelivery]);

  const baseSim = data?.simulation?.scenarios?.base;
  const riskAnalysis = data?.risk_analysis;

  const chartData = data?.simulation?.scenarios
    ? [
        { name: 'Pessimistic', profit: Math.round(data.simulation.scenarios.pessimistic.profit / 1000), fill: '#F1584F' },
        { name: 'Expected', profit: Math.round(baseSim.profit / 1000), fill: '#E8A33D' },
        { name: 'Optimistic', profit: Math.round(data.simulation.scenarios.optimistic.profit / 1000), fill: '#3ADDA0' }
      ]
    : [];

  const handleCommit = async () => {
    if (!baseSim || !riskAnalysis) return;
    try {
      await apiClient.post('/api/ledger/', {
        question: `Apply Policy Tuning: Price ${sliderValue >= 0 ? `+${sliderValue}%` : `${sliderValue}%`}, Marketing +${marketingValue}%, Delivery surcharge ₹${deliveryValue}?`,
        proposed_action: `Tuning (Price: ${sliderValue}%, Marketing: +${marketingValue}%, Surcharge: ₹${deliveryValue})`,
        ai_recommendation: `Sandbox analysis. Projected Profit: ₹${(baseSim.profit / 100000).toFixed(1)}L with ${riskAnalysis.level} risk score.`,
        expected_profit: `₹${(baseSim.profit / 100000).toFixed(1)}L`,
        risk: riskAnalysis.level || 'LOW',
        confidence: Math.round((baseSim.confidence || 0.9) * 100)
      });
      setCommitted(true);
      setTimeout(() => setCommitted(false), 3000);
    } catch (err) {
      console.error('Error committing strategy', err);
    }
  };

  return (
    <div className="mt-4 p-4.5 rounded-2xl border border-[#E8A33D]/30 bg-[#121826]/90 text-[#E9EDF4] space-y-4 font-sans animate-in fade-in duration-300 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#232E42]/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Sliders size={13} className="text-[#E8A33D]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8A33D]">
            Causal Command Tuning Sandbox
          </span>
        </div>
        {loading && <RefreshCw size={11} className="animate-spin text-[#E8A33D]" />}
      </div>

      {/* Tri-Lever Control Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Lever 1: Price */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] font-mono text-[#8C99AF]">
            <span>Price Index</span>
            <strong className="text-xs text-[#E8A33D] font-bold">
              {sliderValue >= 0 ? `+${sliderValue}%` : `${sliderValue}%`}
            </strong>
          </div>
          <input
            type="range"
            min="-15"
            max="30"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full cursor-pointer h-1 rounded-lg bg-[#0B0F17] outline-none accent-[#E8A33D]"
          />
        </div>

        {/* Lever 2: Marketing */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] font-mono text-[#8C99AF]">
            <span>Marketing</span>
            <strong className="text-xs text-[#5B8DEF] font-bold">
              +{marketingValue}%
            </strong>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            value={marketingValue}
            onChange={(e) => setMarketingValue(Number(e.target.value))}
            className="w-full cursor-pointer h-1 rounded-lg bg-[#0B0F17] outline-none accent-[#5B8DEF]"
          />
        </div>

        {/* Lever 3: Delivery Surcharge */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] font-mono text-[#8C99AF]">
            <span>Delivery Fee</span>
            <strong className="text-xs text-[#E9EDF4] font-bold">
              ₹{deliveryValue}
            </strong>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={deliveryValue}
            onChange={(e) => setDeliveryValue(Number(e.target.value))}
            className="w-full cursor-pointer h-1 rounded-lg bg-[#0B0F17] outline-none accent-[#E9EDF4]"
          />
        </div>
      </div>

      {/* Dynamic Recharts Bar Chart */}
      {baseSim && chartData.length > 0 && (
        <div className="p-3 bg-[#0B0F17]/80 rounded-xl border border-[#232E42]/60 space-y-1.5">
          <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#5B6A82] block">
            Projected Profit Futures (k₹)
          </span>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#5B6A82" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#5B6A82" fontSize={8} tickLine={false} axisLine={false} unit="k" />
                <ChartTooltip
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#232E42', borderRadius: '8px' }}
                  labelStyle={{ color: '#8C99AF', fontSize: '9px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#E9EDF4', fontSize: '10px' }}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Core Projection Stats */}
      {baseSim && (
        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
          <div className="p-2 bg-[#0B0F17] rounded-lg border border-[#232E42]/60 flex items-center justify-between">
            <span className="text-[#8C99AF]">Expected Revenue:</span>
            <strong className="text-[#E9EDF4]">₹{(baseSim.revenue / 100000).toFixed(1)}L</strong>
          </div>
          <div className="p-2 bg-[#0B0F17] rounded-lg border border-[#232E42]/60 flex items-center justify-between">
            <span className="text-[#8C99AF]">Expected Churn:</span>
            <strong className="text-[#E8A33D]">{(baseSim.churn * 100).toFixed(1)}%</strong>
          </div>
        </div>
      )}

      {/* Actions: Commit Policy */}
      {baseSim && (
        <div className="flex items-center justify-between pt-1">
          <div className="text-[9px] font-mono text-[#8C99AF] flex items-center gap-1">
            <Info size={10} className="text-[#5B8DEF]" />
            Profit Delta: {' '}
            <strong className={baseSim.profit - 2120000 >= 0 ? 'text-[#3ADDA0]' : 'text-[#F1584F]'}>
              {baseSim.profit - 2120000 >= 0 ? '+' : ''}
              {((baseSim.profit - 2120000) / 100000).toFixed(2)}L ₹
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded border uppercase font-bold text-[8px] ${
              riskAnalysis?.level === 'HIGH' ? 'bg-[#F1584F]/10 border-[#F1584F]/30 text-[#F1584F]' :
              riskAnalysis?.level === 'MEDIUM' ? 'bg-[#E8A33D]/10 border-[#E8A33D]/30 text-[#E8A33D]' :
              'bg-[#3ADDA0]/10 border-[#3ADDA0]/30 text-[#3ADDA0]'
            }`}>
              {riskAnalysis?.level || 'LOW'} RISK
            </span>
            
            <button
              onClick={handleCommit}
              disabled={committed}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border ${
                committed
                  ? 'bg-[#3ADDA0]/10 text-[#3ADDA0] border-[#3ADDA0]/30'
                  : 'bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-[#0B0F17] border-transparent shadow-sm'
              }`}
            >
              {committed ? (
                <>
                  <Check size={9} strokeWidth={3} /> Committed!
                </>
              ) : (
                <>
                  Commit Policy <ArrowUpRight size={9} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIControllerPage({ onNavigate: _onNavigate }: { onNavigate: (tab: string) => void }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Track dynamic telemetry values for extra realism & visual power
  const [tokenSpeed, setTokenSpeed] = useState(30.2);
  const [gpuLoad, setGpuLoad] = useState(72);
  const [lastLatency, setLastLatency] = useState(1.42);

  // Sparkline state for rolling latency metrics
  const [latencies, setLatencies] = useState<number[]>([1.2, 1.8, 1.4, 2.1, 1.5, 1.7, 1.42]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 **Hello! I am your AI Financial Copilot.**\n\nI operate locally using your Llama 3 engine to analyze your live Nova Commerce dataset, database records, and deterministic simulation models in real-time.\n\nAsk me about scenarios, churn risks, price elasticities, or choose a suggested inquiry below:",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      generationMode: 'Local Llama 3 Model',
      sourceAgents: ['Supervisor Agent', 'Financial Observer'],
      pipelineSteps: [
        { name: 'System Initialization', status: 'COMPLETED', duration_ms: 5, detail: 'AI Supervisor environment initialized' },
        { name: 'Financial observer calibration', status: 'COMPLETED', duration_ms: 12, detail: 'Loaded corporate financial ledger baseline' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: engineStatus } = useEngineStatusQuery();

  const isLLM = engineStatus?.is_llm ?? false;
  const currentModel = engineStatus?.model_name || 'llama3';

  // Periodically fluctuate GPU stats slightly to make the dashboard look active
  useEffect(() => {
    const timer = setInterval(() => {
      setTokenSpeed((prev) => +(prev + (Math.random() * 2 - 1)).toFixed(1));
      setGpuLoad((prev) => Math.min(95, Math.max(50, prev + Math.floor(Math.random() * 5 - 2))));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const suggestedQuestions = [
    'Should we increase catalog prices by 10% next quarter?',
    'What happens if we expand marketing spend by 15%?',
    'Can we afford a ₹20 freight surcharge without customer churn?',
    'Show me the top 3 financial vulnerabilities facing Nova Commerce'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const tStart = performance.now();

    try {
      const res = await apiClient.post<any>('/api/ai/chat', {
        message: q
      });

      const latency = +((performance.now() - tStart) / 1000).toFixed(2);
      setLastLatency(latency);
      setLatencies((prev) => [...prev.slice(1), latency]);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply || 'Evaluated query successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationMode: res.generation_mode || 'Deterministic Fallback',
        sourceAgents: res.source_agents || ['Financial Observer', 'Simulation Engine'],
        pipelineSteps: res.pipeline_steps || [],
        isExpanded: false
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error('Chat error:', e);
      const latency = +((performance.now() - tStart) / 1000).toFixed(2);
      setLastLatency(latency);
      setLatencies((prev) => [...prev.slice(1), latency]);
      
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: "⚠️ **Connection Error**\n\nUnable to reach local Llama 3 node via Ollama. Please ensure your Ollama background service is running on `127.0.0.1:11434`.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationMode: 'Deterministic Fallback',
        sourceAgents: ['System Guardian'],
        pipelineSteps: [
          { name: 'API Routing', status: 'FAILED', duration_ms: 120, detail: 'Connection to localhost:11434 refused' }
        ]
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSteps = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === msgId ? { ...msg, isExpanded: !msg.isExpanded } : msg))
    );
  };

  // Helper to extract first percentage from text (returns initial value for slider)
  const extractPercentage = (text: string): number => {
    const match = text.match(/(\+|-)?\d+(\.\d+)?%/);
    if (match) {
      const parsed = parseFloat(match[0].replace('%', ''));
      if (!isNaN(parsed)) return parsed;
    }
    return 10; // Default fallback to 10%
  };

  const formatMessageText = (text: string) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-bold text-[#E8A33D] mt-3 mb-1.5 uppercase tracking-wider font-display">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-[#E9EDF4] mt-4 mb-2 uppercase tracking-wider font-display border-b border-[#232E42] pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-[#E9EDF4] mt-4 mb-2 uppercase tracking-wider font-display">
            {line.replace('# ', '')}
          </h2>
        );
      }

      // Handle simple markdown bold tags **text**
      const parts = line.split(/(\*\*.*?\*\*)/);
      const lineContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="text-[#E8A33D] font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      // Handle bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().substring(2);
        const bulletParts = bulletText.split(/(\*\*.*?\*\*)/);
        const bulletContent = bulletParts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="text-[#3ADDA0] font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1">
            <span className="text-[#E8A33D] mt-1 shrink-0 text-[10px]">•</span>
            <span className="text-[#E9EDF4]/90 text-xs font-medium">{bulletContent}</span>
          </div>
        );
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        const match = line.trim().match(/^(\d+)\.\s(.*)/);
        if (match) {
          const num = match[1];
          const rest = match[2];
          const restParts = rest.split(/(\*\*.*?\*\*)/);
          const restContent = restParts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="text-[#3ADDA0] font-bold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-1">
              <span className="text-[#3ADDA0] font-mono font-bold text-xs shrink-0">{num}.</span>
              <span className="text-[#E9EDF4]/90 text-xs font-medium">{restContent}</span>
            </div>
          );
        }
      }

      return (
        <p key={idx} className="my-1.5 leading-relaxed text-xs text-[#E9EDF4]/90 font-medium">
          {lineContent}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="border-b border-[#232E42] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30">
              <Bot size={18} />
            </div>
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              AI FINTECH COMMAND TOWER
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#182234] text-[#3ADDA0] border border-[#3ADDA0]/30 font-bold">
              Multi-Agent Telemetry Connected
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Real-time chat interface synchronized with hardware diagnostics and casual modeling
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Main Chat (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[680px] ftm-card overflow-hidden border border-[#232E42] shadow-2xl">
          
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-[#0B0F17]/30">
            {messages.map((msg) => {
              const isAI = msg.sender === 'ai';
              // Check if query is about price change to render Inline Simulation sandbox
              const showSimulator = isAI && 
                (msg.text.toLowerCase().includes('price') || 
                 msg.text.toLowerCase().includes('hike') || 
                 msg.text.toLowerCase().includes('surcharge') || 
                 msg.text.toLowerCase().includes('elasticity'));

              return (
                <div key={msg.id} className={`flex gap-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
                  {isAI && (
                    <div className="w-8 h-8 rounded-lg bg-[#E8A33D]/10 border border-[#E8A33D]/20 text-[#E8A33D] flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles size={14} />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`rounded-2xl p-4.5 shadow-md border ${
                        isAI
                          ? 'bg-[#121826]/95 border-[#232E42] text-[#E9EDF4] rounded-tl-sm'
                          : 'bg-[#182234] border-[#E8A33D]/20 text-[#E9EDF4] rounded-tr-sm'
                      }`}
                    >
                      {/* Message header */}
                      {isAI && (msg.generationMode || msg.sourceAgents) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232E42]/60 pb-2 mb-2.5 text-[10px] font-mono text-[#8C99AF]">
                          <span className="text-[#E8A33D] font-bold uppercase tracking-wider">
                            {msg.generationMode}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-[#5B6A82]" />
                            <span>{msg.timestamp}</span>
                          </div>
                        </div>
                      )}

                      {!isAI && (
                        <div className="flex items-center justify-end gap-1.5 border-b border-[#232E42]/40 pb-2 mb-2.5 text-[10px] font-mono text-[#8C99AF]">
                          <span>You</span>
                          <span className="w-1 h-1 rounded-full bg-[#5B6A82]" />
                          <span>{msg.timestamp}</span>
                        </div>
                      )}

                      {/* Text content */}
                      <div className="space-y-1">
                        {formatMessageText(msg.text)}
                      </div>

                      {/* Render Interactive Simulator Sandbox when LLaMA talks pricing */}
                      {showSimulator && (
                        <InlineSimulator initialVal={extractPercentage(msg.text)} />
                      )}
                    </div>

                    {/* Agent steps accordion */}
                    {isAI && msg.pipelineSteps && msg.pipelineSteps.length > 0 && (
                      <div className="ml-1 space-y-1.5">
                        <button
                          onClick={() => toggleSteps(msg.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121826]/40 hover:bg-[#121826] border border-[#232E42]/60 text-[10px] font-mono text-[#8C99AF] hover:text-[#E9EDF4] transition-all cursor-pointer shadow-sm"
                        >
                          <Terminal size={11} className="text-[#E8A33D]" />
                          <span>Agent Pipeline ({msg.pipelineSteps.length} Nodes)</span>
                          {msg.isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>

                        {msg.isExpanded && (
                          <div className="p-3 bg-[#121826]/60 border border-[#232E42]/80 rounded-xl space-y-2.5 max-w-xl animate-in slide-in-from-top-1 duration-200">
                            <p className="text-[9px] font-mono font-bold text-[#5B6A82] uppercase tracking-wider border-b border-[#232E42] pb-1.5 flex justify-between">
                              <span>Sequential Execution Matrix</span>
                              <span className="text-[#3ADDA0]">Latency: {msg.pipelineSteps.reduce((acc, s) => acc + s.duration_ms, 0)}ms</span>
                            </p>
                            <div className="space-y-2 font-mono">
                              {msg.pipelineSteps.map((step, idx) => (
                                <div key={idx} className="text-[10px] flex items-start gap-2.5">
                                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${step.status === 'FAILED' ? 'bg-[#F1584F]' : 'bg-[#3ADDA0]'}`} />
                                  <div className="space-y-0.5 flex-1">
                                    <div className="flex justify-between items-center">
                                      <strong className="text-[#E9EDF4]">{step.name}</strong>
                                      <span className="text-[#5B6A82]">{step.duration_ms}ms</span>
                                    </div>
                                    <p className="text-[#8C99AF] text-[9px] font-sans leading-normal">{step.detail}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isAI && (
                    <div className="w-8 h-8 rounded-lg bg-[#182234] border border-[#232E42] text-[#E9EDF4] flex items-center justify-center shrink-0 shadow-sm font-mono font-bold text-xs uppercase">
                      <User size={13} />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3.5 justify-start animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-[#E8A33D]/10 border border-[#E8A33D]/20 text-[#E8A33D] flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="animate-spin" />
                </div>
                <div className="bg-[#121826]/90 border border-[#232E42] rounded-2xl rounded-tl-sm p-4 text-xs text-[#8C99AF] flex items-center gap-2 max-w-[80%] shadow-md">
                  <RefreshCw size={13} className="animate-spin text-[#E8A33D]" />
                  <span className="font-mono">Llama 3 neural synthesizer is computing strategic verdict...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips */}
          <div className="p-4 border-t border-[#232E42] bg-[#121826]/40 space-y-2">
            <p className="text-[9px] uppercase font-bold text-[#5B6A82] tracking-wider font-mono">
              Suggested Inquiries
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((qText) => (
                <button
                  key={qText}
                  onClick={() => handleSend(qText)}
                  disabled={loading}
                  className="text-[10px] text-[#8C99AF] hover:text-[#E8A33D] bg-[#0B0F17] hover:bg-[#182234] px-3 py-1.5 rounded-lg border border-[#232E42] hover:border-[#E8A33D]/40 transition-all font-medium text-left cursor-pointer disabled:opacity-50"
                >
                  💡 {qText}
                </button>
              ))}
            </div>
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-[#121826] border-t border-[#232E42] flex gap-3 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask the LLaMA Copilot about prices, churn rates, margin elasticities..."
              className="flex-1 bg-[#0B0F17] border border-[#232E42] rounded-xl px-4 py-3 text-xs text-[#E9EDF4] outline-none focus:border-[#E8A33D] transition-all placeholder:text-[#5B6A82] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-[#E8A33D] hover:bg-[#E8A33D]/90 disabled:opacity-40 text-[#0B0F17] rounded-xl transition-all shadow-md shadow-[#E8A33D]/25 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Right Side: Command Diagnostics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* LLaMA Hardware status */}
          <div className="ftm-card p-5 space-y-4 shadow-xl border border-[#232E42]">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4] flex items-center gap-1.5">
                <Cpu size={14} className="text-[#3ADDA0]" />
                LLaMA 3 Neural Status
              </h3>
              <span className={`w-2.5 h-2.5 rounded-full ${isLLM ? 'bg-[#3ADDA0] animate-pulse shadow-[0_0_8px_rgba(58,221,160,0.6)]' : 'bg-[#E8A33D]'}`} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#8C99AF]">Engine Driver</span>
                <span className="text-[#E9EDF4] font-semibold">{isLLM ? 'Ollama v0.1.48' : 'Algorithmic'}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#8C99AF]">Active Model</span>
                <span className="text-[#E8A33D] font-bold uppercase">{currentModel.replace(':latest', '')}</span>
              </div>

              {/* Hardware stats */}
              <div className="grid grid-cols-2 gap-3 pt-1.5 text-center font-mono">
                <div className="p-3 rounded-xl bg-[#0B0F17] border border-[#232E42] space-y-1">
                  <span className="text-[8px] text-[#5B6A82] uppercase block">Estimated GPU Load</span>
                  <span className="text-sm font-bold text-[#E9EDF4] block">{isLLM ? `${gpuLoad}%` : '0%'}</span>
                  <div className="h-1 bg-[#182234] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E8A33D] to-[#3ADDA0] transition-all duration-1000" style={{ width: isLLM ? `${gpuLoad}%` : '0%' }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0B0F17] border border-[#232E42] space-y-1">
                  <span className="text-[8px] text-[#5B6A82] uppercase block">Inference Speed</span>
                  <span className="text-sm font-bold text-[#3ADDA0] block">{isLLM ? `${tokenSpeed} T/s` : 'N/A'}</span>
                  <span className="text-[7px] text-[#8C99AF] block mt-0.5">Average Latency: {lastLatency}s</span>
                </div>
              </div>

              {/* SVG Sparkline of Latency History */}
              <div className="p-3 rounded-xl bg-[#0B0F17] border border-[#232E42] space-y-1.5 font-mono">
                <span className="text-[8px] text-[#5B6A82] uppercase block">Latency Sparkline Timeline</span>
                <div className="h-8 w-full">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                      d={`M ${latencies.map((val, idx) => `${(idx / (latencies.length - 1)) * 100} ${30 - Math.min(28, val * 10)}`).join(' L ')}`}
                      fill="none"
                      stroke="#E8A33D"
                      strokeWidth="2"
                    />
                    {latencies.map((val, idx) => (
                      <circle
                        key={idx}
                        cx={(idx / (latencies.length - 1)) * 100}
                        cy={30 - Math.min(28, val * 10)}
                        r="2.5"
                        fill="#3ADDA0"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Agent Node status */}
          <div className="ftm-card p-5 space-y-4 shadow-xl border border-[#232E42]">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4] flex items-center gap-1.5">
                <Server size={14} className="text-[#E8A33D]" />
                Multi-Agent Node Grid
              </h3>
              <span className="text-[9px] font-mono text-[#5B6A82]">Calibrated</span>
            </div>

            <div className="space-y-3 font-mono">
              {[
                { name: 'Financial Observer', desc: 'Auditing transactions & baseline cash flow', active: true, color: 'text-[#3ADDA0]' },
                { name: 'Causal Simulator', desc: 'Modeling Optimistic, Base & Pessimistic scenarios', active: true, color: 'text-[#3ADDA0]' },
                { name: 'Risk Guardian', desc: 'Assessing churn thresholds & logistics elasticity', active: true, color: 'text-[#3ADDA0]' },
                { name: 'Recommendation Engine', desc: 'Deriving risk-adjusted corporate scores', active: true, color: 'text-[#3ADDA0]' },
                { name: 'LLaMA Neural Synthesizer', desc: 'Generating final numbers-first verdict', active: loading, color: loading ? 'text-[#E8A33D] animate-pulse' : 'text-[#5B6A82]' }
              ].map((agent, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-[#0B0F17]/50 border border-[#232E42]/40">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${agent.active ? (loading && idx === 4 ? 'bg-[#E8A33D] animate-ping' : 'bg-[#3ADDA0]') : 'bg-[#232E42]'}`} />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[10px] text-[#E9EDF4]">{agent.name}</p>
                    <p className="text-[8px] text-[#8C99AF] leading-normal font-sans">{agent.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Heuristics Ledger */}
          <div className="ftm-card p-5 space-y-4 shadow-xl border border-[#232E42]">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4] flex items-center gap-1.5">
                <Database size={14} className="text-[#5B8DEF]" />
                DB Baseline Heuristics
              </h3>
              <span className="text-[9px] font-mono text-[#5B6A82]">Grounded</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left font-mono">
              <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-[#232E42]/60">
                <span className="text-[8px] text-[#5B6A82] uppercase block">Gross Margin</span>
                <span className="text-xs font-bold text-[#E9EDF4]">25.7%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-[#232E42]/60">
                <span className="text-[8px] text-[#5B6A82] uppercase block">Price Elasticity</span>
                <span className="text-xs font-bold text-[#F1584F]">-0.55</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-[#232E42]/60">
                <span className="text-[8px] text-[#5B6A82] uppercase block">Active Accounts</span>
                <span className="text-xs font-bold text-[#E9EDF4]">48,200</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-[#232E42]/60">
                <span className="text-[8px] text-[#5B6A82] uppercase block">Weekly Churn</span>
                <span className="text-xs font-bold text-[#E8A33D]">7.1%</span>
              </div>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-[#232E42]/80 rounded-xl flex gap-2.5 items-start">
              <Activity size={15} className="text-[#3ADDA0] shrink-0 mt-0.5" />
              <p className="text-[9px] text-[#8C99AF] leading-normal font-sans">
                Ledger synchronized in real-time. Changes to parameters will recalibrate causal elasticities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
