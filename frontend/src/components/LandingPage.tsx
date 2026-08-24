import { useState, useEffect } from 'react';
import {
  Zap, Sparkles, Shield, BarChart3, Database,
  Lock, Cpu, ArrowRight, Play, CheckCircle2, ChevronRight, Loader2
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

type SimulationMode = 'pricing' | 'logistics' | 'marketing';

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [simMode, setSimMode] = useState<SimulationMode>('pricing');
  const [sliderVal, setSliderVal] = useState<number>(10);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendLatency, setBackendLatency] = useState<number | null>(null);
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  // Live status ping check
  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        const res = await fetch('http://localhost:8001/api/health');
        if (res.ok) {
          setBackendLatency(Date.now() - start);
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch {
        setBackendStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update slider default when switching modes
  useEffect(() => {
    if (simMode === 'pricing') setSliderVal(10); // 10%
    else if (simMode === 'logistics') setSliderVal(50); // ₹50 flat
    else if (simMode === 'marketing') setSliderVal(4); // ₹4 Lakhs
  }, [simMode]);

  // Live 1-click persona login API handshake
  const handleQuickLogin = async (email: string, roleName: string) => {
    setLoggingInRole(roleName);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", "nova123");
      
      const res = await fetch("http://localhost:8001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("ftm_auth", JSON.stringify({
          token: data.access_token,
          user: data.user
        }));
        // Instant reload to trigger context initialization
        window.location.reload();
      } else {
        alert("Connection established, but quick login credentials failed to authenticate.");
      }
    } catch (e) {
      console.error(e);
      alert("Unable to reach the local API node. Ensure the FastAPI backend is running on port 8001.");
    } finally {
      setLoggingInRole(null);
    }
  };

  // Base corporate metrics
  const baselineRevenue = 8240000;
  const baselineProfit = 2120000;
  const baselineChurn = 0.071;

  // Sandbox multi-strategy math calculations
  let pessRev = 0, pessProfit = 0, pessChurn = 0;
  let baseRev = 0, baseProfit = 0, baseChurn = 0;
  let optRev = 0, optProfit = 0, optChurn = 0;
  let logsTitle = "";
  let logsDesc = "";

  if (simMode === 'pricing') {
    const pct = sliderVal / 100;
    
    // Base (Elasticity = -0.55)
    const baseVol = pct * -0.55;
    baseRev = baselineRevenue * (1 + pct) * (1 + baseVol);
    baseProfit = baseRev * 0.2572;
    baseChurn = Math.min(0.9, baselineChurn + pct * 0.22 + Math.abs(baseVol) * 0.35);

    // Optimistic (Elasticity = -0.28)
    const optVol = pct * -0.28;
    optRev = baselineRevenue * (1 + pct) * (1 + optVol);
    optProfit = optRev * 0.29;
    optChurn = Math.min(0.9, baselineChurn + pct * 0.08 + Math.abs(optVol) * 0.2);

    // Pessimistic (Elasticity = -0.85)
    const pessVol = pct * -0.85;
    pessRev = baselineRevenue * (1 + pct) * (1 + pessVol);
    pessProfit = pessRev * 0.22;
    pessChurn = Math.min(0.9, baselineChurn + pct * 0.42 + Math.abs(pessVol) * 0.5);

    logsTitle = "PRICING ELASTICITY CALIBRATION";
    logsDesc = `Proposed price hike: +${sliderVal}% | Predicted demand coefficient drag: ${(baseVol * 100).toFixed(1)}%`;
  } else if (simMode === 'logistics') {
    // sliderVal is flat surcharge in INR (₹10 - ₹150)
    const orderCount = 45821;
    const fraction = sliderVal / 150;
    
    // Base (surcharge retention loss = 5%)
    const baseDrag = fraction * -0.05;
    baseRev = baselineRevenue * (1 + baseDrag) + (sliderVal * orderCount * (1 + baseDrag));
    baseProfit = (baselineRevenue * (1 + baseDrag) * 0.2572) + (sliderVal * orderCount * (1 + baseDrag) * 0.9);
    baseChurn = Math.min(0.9, baselineChurn + fraction * 0.08);

    // Optimistic (retention loss = 2%)
    const optDrag = fraction * -0.02;
    optRev = baselineRevenue * (1 + optDrag) + (sliderVal * orderCount * (1 + optDrag));
    optProfit = (baselineRevenue * (1 + optDrag) * 0.2572) + (sliderVal * orderCount * (1 + optDrag) * 0.94);
    optChurn = Math.min(0.9, baselineChurn + fraction * 0.03);

    // Pessimistic (retention loss = 12%)
    const pessDrag = fraction * -0.12;
    pessRev = baselineRevenue * (1 + pessDrag) + (sliderVal * orderCount * (1 + pessDrag));
    pessProfit = (baselineRevenue * (1 + pessDrag) * 0.2572) + (sliderVal * orderCount * (1 + pessDrag) * 0.8);
    pessChurn = Math.min(0.9, baselineChurn + fraction * 0.18);

    logsTitle = "LOGISTICS SURCHARGE PROFILE";
    logsDesc = `Freight fee: +₹${sliderVal}/order | Projected surcharge margin recapture: ₹${((sliderVal * orderCount) / 100000).toFixed(1)}L`;
  } else if (simMode === 'marketing') {
    // sliderVal is marketing budget in Lakhs (₹1L - ₹10L) reallocated to digital performance channels
    const fraction = sliderVal / 10;
    
    // Base (Acquisition multiplier = 1.45x, cost overhead = -1.5% margin)
    const baseRevGrowth = fraction * 0.11;
    baseRev = baselineRevenue * (1 + baseRevGrowth);
    baseProfit = baseRev * (0.2572 - fraction * 0.012);
    baseChurn = Math.max(0.01, baselineChurn - fraction * 0.006);

    // Optimistic (Acquisition multiplier = 1.8x)
    const optRevGrowth = fraction * 0.16;
    optRev = baselineRevenue * (1 + optRevGrowth);
    optProfit = optRev * (0.2572 - fraction * 0.008);
    optChurn = Math.max(0.01, baselineChurn - fraction * 0.011);

    // Pessimistic (Acquisition multiplier = 1.1x)
    const pessRevGrowth = fraction * 0.04;
    pessRev = baselineRevenue * (1 + pessRevGrowth);
    pessProfit = pessRev * (0.2572 - fraction * 0.02);
    pessChurn = Math.max(0.01, baselineChurn - fraction * 0.002);

    logsTitle = "OPEX CHANNEL BUDGET SHIFT";
    logsDesc = `Digital channel re-route: ₹${sliderVal}L | Target segment acquisition yield: +${(baseRevGrowth * 100).toFixed(1)}% revenue`;
  }

  const formatLakhs = (val: number) => {
    return `₹${(val / 100000).toFixed(1)}L`;
  };

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E9EDF4] selection:bg-[#E8A33D]/20 selection:text-[#E8A33D] font-sans antialiased overflow-x-hidden relative tech-grid">
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#E8A33D]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-1/4 w-[600px] h-[600px] bg-[#5B8DEF]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* 1. Header Navigation */}
      <header className="border-b border-[#232E42] bg-[#121826]/80 backdrop-blur-md sticky top-0 z-50 h-14">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#182234] border border-[#232E42] flex items-center justify-center text-sm shadow-[0_0_12px_rgba(232,163,61,0.2)] select-none">
              ⚡
            </div>
            <div>
              <h1 className="text-xs font-display font-black tracking-wider text-[#E9EDF4] uppercase leading-none">
                FINANCIAL TIME MACHINE
              </h1>
              <span className="text-[8px] text-[#8C99AF] uppercase tracking-widest font-mono">Sovereign Decision Twin</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-mono uppercase tracking-wider text-[#8C99AF]">
            <button onClick={() => handleScroll('sandbox')} className="hover:text-[#E8A33D] transition-colors cursor-pointer">
              Simulation Sandbox
            </button>
            <button onClick={() => handleScroll('presets')} className="hover:text-[#E8A33D] transition-colors cursor-pointer">
              1-Click Presets
            </button>
            <button onClick={() => handleScroll('pillars')} className="hover:text-[#E8A33D] transition-colors cursor-pointer">
              System Pillars
            </button>
          </nav>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#182234] border border-[#232E42] text-[10px] font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-[#3ADDA0] animate-pulse shadow-[0_0_6px_rgba(58,221,160,0.8)]'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-[#8C99AF] font-bold text-[9px] uppercase tracking-wide">
                {backendStatus === 'online'
                  ? `LOCAL CORE ONLINE (${backendLatency || 4}ms)`
                  : 'LOCAL CORE OFFLINE'}
              </span>
            </div>
            
            <button
              onClick={onEnter}
              className="px-4 py-1.5 bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-[#0B0F17] text-xs font-display font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider"
            >
              Sign In
            </button>
          </div>
          
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch relative">
        
        {/* Left Side: Onboarding & Presets */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8A33D]/10 border border-[#E8A33D]/30 text-[#E8A33D] text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles size={11} /> Next-Gen Enterprise Causal Modeling
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-[#E9EDF4] leading-[1.08] tracking-tight">
              Test strategic corporate choices <br />
              <span className="bg-gradient-to-r from-[#E8A33D] via-[#F3C474] to-[#E8A33D] bg-clip-text text-transparent">
                in twin-time first.
              </span>
            </h2>
            <p className="text-sm text-[#8C99AF] leading-relaxed max-w-xl">
              An on-premise, secure sandbox running local multi-agent audits, mapping price elasticity matrices, and preserving intelligence via a cryptographic decision ledger.
            </p>
          </div>

          {/* Direct Login Preset Card Panel */}
          <div id="presets" className="bg-[#121826] border border-[#232E42] rounded-2xl p-5 space-y-4 scroll-mt-20">
            <div>
              <h3 className="text-xs font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
                🚀 1-Click Platform Launcher Presets
              </h3>
              <p className="text-[10px] text-[#8C99AF] mt-0.5">Bypass login forms to immediately launch the dashboard in specific roles</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { role: 'CFO / MODEL OWNER', email: 'cfo@nova.com', desc: 'Simulations, war rooms & ledger management', label: 'CFO' },
                { role: 'BOARD EXECUTIVE', email: 'exec@nova.com', desc: 'Ledger signatures, approvals & final audits', label: 'Executive' },
                { role: 'INDEPENDENT AUDITOR', email: 'auditor@nova.com', desc: 'Read-only blockchain check & logs inspection', label: 'Auditor' }
              ].map((preset) => (
                <button
                  key={preset.email}
                  disabled={loggingInRole !== null}
                  onClick={() => handleQuickLogin(preset.email, preset.label)}
                  className="p-3.5 rounded-xl border border-[#232E42] bg-[#0B0F17]/50 hover:bg-[#182234] hover:border-[#E8A33D]/40 transition-all text-left space-y-2 group cursor-pointer disabled:opacity-50 text-xs flex flex-col justify-between h-36"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/25 rounded">
                      {preset.label}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 font-semibold break-all">{preset.email}</p>
                    <p className="text-[9px] text-[#5B6A82] leading-snug line-clamp-2">{preset.desc}</p>
                  </div>
                  
                  <div className="flex items-center justify-between w-full pt-1.5 border-t border-[#232E42] text-[10px] font-mono font-bold text-[#E8A33D] group-hover:text-[#F3C474]">
                    {loggingInRole === preset.label ? (
                      <span className="flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Launching...</span>
                    ) : (
                      <span className="flex items-center gap-0.5">LAUNCH NOW <ChevronRight size={11} /></span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-[10px] text-[#5B6A82] font-mono pt-1">
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-400" /> SECURE AUDITS</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><Lock size={12} className="text-blue-400" /> ZERO EXTERNAL SHARING</span>
          </div>
        </div>

        {/* Right Side: What-If Multi-Strategy Sandbox */}
        <div id="sandbox" className="lg:col-span-6 scroll-mt-20">
          <div className="bg-[#121826] border border-[#232E42] rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-md flex flex-col justify-between h-full">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#232E42] pb-3.5">
              <div>
                <h3 className="text-xs font-display font-bold text-[#E9EDF4] uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E8A33D] animate-ping" />
                  What-If Simulation Sandbox
                </h3>
                <p className="text-[10px] text-[#8C99AF] mt-0.5">Select a strategy mode and adjust parameters live</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold border text-indigo-400 border-indigo-500/30 bg-indigo-500/10 uppercase tracking-widest">
                Multi-Strategy
              </span>
            </div>

            {/* Sandbox Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-[#0B0F17] p-1 rounded-xl border border-[#232E42]">
              {[
                { id: 'pricing', label: 'Catalog Pricing', icon: BarChart3 },
                { id: 'logistics', label: 'Freight Surcharge', icon: Database },
                { id: 'marketing', label: 'OpEx Realloc', icon: Cpu }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSimMode(tab.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      simMode === tab.id
                        ? 'bg-[#121826] text-[#E8A33D] border border-[#232E42] shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={12} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Configured Slider details */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-[#8C99AF]">
                <span>
                  {simMode === 'pricing' ? 'Proposed Catalog Price Increase' : 
                   simMode === 'logistics' ? 'Proposed Flat Freight Surcharge' :
                   'Proposed OpEx Rerouted to Digital'}
                </span>
                <span className="text-[#E8A33D] font-bold">
                  {simMode === 'pricing' ? `+${sliderVal}%` : 
                   simMode === 'logistics' ? `+₹${sliderVal}` :
                   `₹${sliderVal} Lakhs`}
                </span>
              </div>
              
              <input
                type="range"
                min={simMode === 'pricing' ? 1 : simMode === 'logistics' ? 10 : 1}
                max={simMode === 'pricing' ? 25 : simMode === 'logistics' ? 150 : 10}
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0B0F17] rounded-lg appearance-none cursor-pointer accent-[#E8A33D]"
              />
              
              <div className="flex justify-between text-[9px] font-mono text-[#5B6A82]">
                <span>{simMode === 'pricing' ? '+1% (Safe margin)' : simMode === 'logistics' ? '₹10 (Low cost)' : '₹1L (Conservative)'}</span>
                <span>{simMode === 'pricing' ? '+25% (Elasticity cap)' : simMode === 'logistics' ? '₹150 (Friction limit)' : '₹10L (Aggressive shift)'}</span>
              </div>
            </div>

            {/* Sandbox Projections Output */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'PESSIMISTIC PATH',
                  revenue: pessRev,
                  profit: pessProfit,
                  churn: pessChurn,
                  color: 'text-red-400',
                  bg: 'bg-red-500/5 border-red-500/10'
                },
                {
                  label: 'BASE EXPECTED',
                  revenue: baseRev,
                  profit: baseProfit,
                  churn: baseChurn,
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/5 border-amber-500/15 ring-1 ring-amber-500/20'
                },
                {
                  label: 'OPTIMISTIC PATH',
                  revenue: optRev,
                  profit: optProfit,
                  churn: optChurn,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/5 border-emerald-500/10'
                }
              ].map((sc) => (
                <div key={sc.label} className={`p-3.5 rounded-xl border ${sc.bg} space-y-2.5`}>
                  <p className="text-[9px] font-mono text-[#8C99AF] font-bold">{sc.label}</p>
                  <div>
                    <span className="text-[9px] block text-[#5B6A82] font-mono leading-none">Net Revenue</span>
                    <span className={`text-base font-black font-mono ${sc.color}`}>{formatLakhs(sc.revenue)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 border-t border-[#232E42]/60 pt-1.5 text-[9px] font-mono">
                    <div>
                      <span className="text-[#5B6A82] block">Profit</span>
                      <span className="text-[#E9EDF4] font-bold">{formatLakhs(sc.profit)}</span>
                    </div>
                    <div>
                      <span className="text-[#5B6A82] block">Churn</span>
                      <span className="text-red-400 font-bold">{(sc.churn * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Live Feed Log */}
            <div className="p-3 bg-[#0B0F17] rounded-xl border border-[#232E42]/60 font-mono text-[10px] text-[#8C99AF] space-y-1.5">
              <div className="flex justify-between items-center text-[9px] text-[#5B6A82] border-b border-[#232E42] pb-1.5">
                <span>{logsTitle}</span>
                <span>PROFILED 0.4ms</span>
              </div>
              <p className="text-slate-300 truncate">{logsDesc}</p>
              <p>🛡️ Calculated cash conversion: <span className="text-[#3ADDA0]">₹{(baseProfit * 0.88 / 100000).toFixed(1)}L liquid cashflow</span></p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Core Capability Pillars */}
      <section id="pillars" className="max-w-7xl mx-auto px-6 py-16 border-t border-[#232E42]/60 space-y-10 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-xs font-mono font-bold text-[#E8A33D] uppercase tracking-widest">System Pillars</h3>
          <h2 className="text-2xl font-display font-bold text-[#E9EDF4] uppercase">Decentralized Financial Intelligence</h2>
          <p className="text-xs text-[#8C99AF]">Four primary architectural concepts backing the sovereign Time Machine workflow</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              icon: BarChart3,
              title: 'Multi-Scenario timeline',
              desc: 'Gives CFOs instantly simulated pessimistic, base, and optimistic financial paths for strategic stress-testing.',
              color: 'text-[#E8A33D]'
            },
            {
              icon: Database,
              title: 'Local Privacy Core',
              desc: 'Queries models locally via Ollama. Ensures proprietary corporate ledgers and numbers never exit private infrastructure.',
              color: 'text-[#5B8DEF]'
            },
            {
              icon: Shield,
              title: 'Decision Ledger',
              desc: 'Records scenario parameters, user sign-offs, and neural rationales into a tamper-evident audit index.',
              color: 'text-[#3ADDA0]'
            },
            {
              icon: Cpu,
              title: 'Calibration Loop',
              desc: 'Compares past simulated projections against actual accounting figures to optimize future predictive models.',
              color: 'text-purple-400'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="ftm-card p-5 space-y-3.5 border border-[#232E42] hover:border-[#E8A33D]/60 hover:scale-[1.01] transition-all duration-300">
                <div className={`p-2 rounded-lg bg-[#182234] w-fit ${item.color}`}>
                  <Icon size={18} />
                </div>
                <h4 className="text-sm font-display font-bold text-[#E9EDF4] uppercase tracking-wide">{item.title}</h4>
                <p className="text-xs text-[#8C99AF] leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Footer CTA */}
      <footer className="border-t border-[#232E42] bg-[#121826]/40 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-sm font-display font-bold text-[#E9EDF4] uppercase tracking-wider">Ready to deploy?</h3>
            <p className="text-xs text-[#8C99AF]">Initiate simulations and autonomous financial research locally.</p>
          </div>
          
          <button
            onClick={onEnter}
            className="px-6 py-2.5 bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-[#0B0F17] text-xs font-display font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
          >
            Launch Twin Platform <ArrowRight size={13} />
          </button>
        </div>
      </footer>

    </div>
  );
}
