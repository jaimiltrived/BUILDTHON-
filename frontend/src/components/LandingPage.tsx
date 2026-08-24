import { useState, useEffect } from 'react';
import {
  Zap, Sparkles, Shield, BarChart3, Database,
  Lock, Cpu, ArrowRight, Play, CheckCircle2, Server, HelpCircle
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [priceChange, setPriceChange] = useState<number>(10); // in percent
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

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

  // Live sandbox calculation logic replicating backend SimulationEngine math
  const baselineRevenue = 8240000;
  const baselineProfit = 2120000;
  const baselineCustomers = 48200;
  const baselineChurn = 0.071;

  const pct = priceChange / 100;

  // Base Scenario (Elasticity = -0.55, Churn mult = 0.22)
  const baseVolChange = pct * -0.55;
  const baseRev = baselineRevenue * (1 + pct) * (1 + baseVolChange);
  const baseProfit = baseRev * 0.2572;
  const baseChurn = Math.min(0.95, Math.max(0.01, baselineChurn + pct * 0.22 + Math.abs(baseVolChange) * 0.35));

  // Optimistic Scenario (Elasticity = -0.28, Churn mult = 0.08)
  const optVolChange = pct * -0.28;
  const optRev = baselineRevenue * (1 + pct) * (1 + optVolChange);
  const optProfit = optRev * 0.29;
  const optChurn = Math.min(0.95, Math.max(0.01, baselineChurn + pct * 0.08 + Math.abs(optVolChange) * 0.35));

  // Pessimistic Scenario (Elasticity = -0.85, Churn mult = 0.42)
  const pessVolChange = pct * -0.85;
  const pessRev = baselineRevenue * (1 + pct) * (1 + pessVolChange);
  const pessProfit = pessRev * 0.22;
  const pessChurn = Math.min(0.95, Math.max(0.01, baselineChurn + pct * 0.42 + Math.abs(pessVolChange) * 0.35));

  const formatLakhs = (val: number) => {
    return `₹${(val / 100000).toFixed(1)}L`;
  };

  const getRiskLevel = (p: number) => {
    if (p <= 5) return { text: 'LOW RISK', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    if (p <= 12) return { text: 'MODERATE RISK', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    return { text: 'HIGH RISK', color: 'text-red-400 border-red-500/30 bg-red-500/10' };
  };

  const risk = getRiskLevel(priceChange);

  // Smooth scroll handler
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E9EDF4] selection:bg-[#E8A33D]/20 selection:text-[#E8A33D] font-sans antialiased overflow-x-hidden relative">
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#E8A33D]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-1/4 w-[600px] h-[600px] bg-[#5B8DEF]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* 1. Header Navigation */}
      <header className="border-b border-[#232E42] bg-[#121826]/80 backdrop-blur-md sticky top-0 z-50 h-14">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          
          {/* Logo & Branding */}
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
          
          {/* Middle Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-mono uppercase tracking-wider text-[#8C99AF]">
            <button
              onClick={() => handleScroll('sandbox')}
              className="hover:text-[#E8A33D] transition-colors cursor-pointer"
            >
              Simulation Sandbox
            </button>
            <button
              onClick={() => handleScroll('pillars')}
              className="hover:text-[#E8A33D] transition-colors cursor-pointer"
            >
              System Pillars
            </button>
            <button
              onClick={() => handleScroll('roles')}
              className="hover:text-[#E8A33D] transition-colors cursor-pointer"
            >
              Operational Roles
            </button>
          </nav>
          
          {/* Right Status Indicator & Call to Action */}
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
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8A33D]/10 border border-[#E8A33D]/30 text-[#E8A33D] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles size={11} /> Next-Gen Enterprise Causal Modeling
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-[#E9EDF4] leading-[1.1] tracking-tight">
            Test major financial moves <br />
            <span className="bg-gradient-to-r from-[#E8A33D] via-[#F3C474] to-[#E8A33D] bg-clip-text text-transparent">
              in simulated time first.
            </span>
          </h2>
          <p className="text-sm text-[#8C99AF] leading-relaxed max-w-xl">
            A secure local-first platform running autonomous multi-agent analysis, stress-testing pricing elasticities, and preserving institutional intelligence via a tamper-proof cryptographic decision ledger.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onEnter}
              className="px-6 py-3 bg-gradient-to-r from-[#E8A33D] to-[#F3C474] hover:from-[#d69330] hover:to-[#e4b25f] text-[#0B0F17] text-xs font-display font-black rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#E8A33D]/15"
            >
              Enter Platform Presets <ArrowRight size={14} />
            </button>
            <button
              onClick={() => handleScroll('sandbox')}
              className="px-6 py-3 bg-[#121826] hover:bg-[#182234] border border-[#232E42] text-[#E9EDF4] text-xs font-display font-bold rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              Try Simulation Sandbox <Play size={12} className="text-[#E8A33D]" />
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#5B6A82] font-mono pt-4">
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-400" /> SOC-2 COMPLIANT</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><Lock size={12} className="text-blue-400" /> ON-PREM PRIVACY</span>
          </div>
        </div>

        {/* 3. Hero Visual Box / Mini Interactive Sandbox */}
        <div id="sandbox" className="lg:col-span-6 scroll-mt-20">
          <div className="bg-[#121826] border border-[#232E42] rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
            
            {/* Glossy Header */}
            <div className="flex justify-between items-center border-b border-[#232E42] pb-4">
              <div>
                <h3 className="text-xs font-display font-bold text-[#E9EDF4] uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E8A33D] animate-ping" />
                  What-If Simulation Sandbox
                </h3>
                <p className="text-[10px] text-[#8C99AF] mt-0.5">Drag slider to test catalog price change impact live</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${risk.color}`}>
                {risk.text}
              </span>
            </div>

            {/* Slider Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-[#8C99AF]">
                <span>Proposed Price Change</span>
                <span className="text-[#E8A33D] font-bold">+{priceChange}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={priceChange}
                onChange={(e) => setPriceChange(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0B0F17] rounded-lg appearance-none cursor-pointer accent-[#E8A33D]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#5B6A82]">
                <span>+1% (Safe margin)</span>
                <span>+25% (Elasticity stress limit)</span>
              </div>
            </div>

            {/* Sandbox Projections Output */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'PESSIMISTIC SCENARIO',
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
                  label: 'OPTIMISTIC OUTCOME',
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
                <span>LOCAL CAUSAL LOGS</span>
                <span>PROFILED 0.4ms</span>
              </div>
              <p>⚡ Baseline Customers: <span className="text-[#E9EDF4]">{baselineCustomers.toLocaleString()} accounts</span></p>
              <p>📊 Estimated volume shift: <span className="text-[#F1584F]">{(baseVolChange * 100).toFixed(1)}% volume drag</span></p>
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

      {/* 5. Role Presets Panel */}
      <section id="roles" className="max-w-7xl mx-auto px-6 py-12 border-t border-[#232E42]/60 space-y-8 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-[#E8A33D] uppercase tracking-widest">Workspace Personnel</h3>
            <h2 className="text-2xl font-display font-bold text-[#E9EDF4] uppercase">Role-Based Operational Matrix</h2>
          </div>
          <p className="text-xs text-[#8C99AF] max-w-md">
            The platform isolates permissions according to corporate hierarchy, giving executives approval oversight and auditors read-only verification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { role: 'CFO', name: 'Chief Financial Officer', desc: 'Owns pricing models, initializes simulations, creates war rooms, and reviews real-time risk guardian signals.' },
            { role: 'Executive', name: 'Board Member / CEO', desc: 'Reviews pending simulation proposals logged by CFOs, providing authorization and cryptographic approvals.' },
            { role: 'Auditor', name: 'Compliance & Forensic', desc: 'Inspects immutable ledger timelines, validating model integrity, history logs, and baseline accuracies.' }
          ].map((p, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#121826]/75 border border-[#232E42] space-y-2.5 hover:border-[#E8A33D]/40 transition-all duration-300">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/25 rounded-md">
                {p.role}
              </span>
              <h4 className="text-xs font-bold text-[#E9EDF4]">{p.name}</h4>
              <p className="text-[11px] text-[#8C99AF] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Footer CTA */}
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
