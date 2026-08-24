import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type UserRole } from '../lib/auth';
import {
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  UserCheck,
  BarChart3,
  Database,
  Building,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  Key,
  Globe,
  Cpu,
  FileText,
  Check,
  X,
  HelpCircle,
  Phone,
  Clock,
  RefreshCw,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import axios from 'axios';

interface DemoCred {
  role: UserRole;
  roleName: string;
  email: string;
  password: string;
  tag: string;
  color: string;
  borderActive: string;
  desc: string;
  icon: string;
}

const DEMO_CREDENTIALS: DemoCred[] = [
  {
    role: 'CFO',
    roleName: 'CFO / Finance Head',
    email: 'cfo@nova.com',
    password: 'nova123',
    tag: 'Full Suite',
    color: 'bg-[#E8A33D]/10 text-[#E8A33D]',
    borderActive: 'border-[#E8A33D] ring-1 ring-[#E8A33D]',
    desc: 'Simulations, War Room, Ledger, AI Supervisor & Risk',
    icon: '⚡',
  },
  {
    role: 'BUSINESS_ANALYST',
    roleName: 'Business Analyst',
    email: 'analyst@nova.com',
    password: 'nova123',
    tag: 'Analytics & Models',
    color: 'bg-[#5B8DEF]/10 text-[#5B8DEF]',
    borderActive: 'border-[#5B8DEF] ring-1 ring-[#5B8DEF]',
    desc: 'Scenario Modeling, DNA Graph, What-If Forecasts',
    icon: '📊',
  },
  {
    role: 'EXECUTIVE',
    roleName: 'Executive Member',
    email: 'exec@nova.com',
    password: 'nova123',
    tag: 'War Room Sign-off',
    color: 'bg-[#3ADDA0]/10 text-[#3ADDA0]',
    borderActive: 'border-[#3ADDA0] ring-1 ring-[#3ADDA0]',
    desc: 'Strategic Decision Authorizations & Approvals',
    icon: '⚖️',
  },
  {
    role: 'AUDITOR',
    roleName: 'Compliance Auditor',
    email: 'auditor@nova.com',
    password: 'nova123',
    tag: 'Read-Only Audit',
    color: 'bg-[#E8A33D]/10 text-[#E8A33D]',
    borderActive: 'border-[#E8A33D] ring-1 ring-[#E8A33D]',
    desc: 'Immutable Forensic Ledger & Model Verification',
    icon: '🛡️',
  },
  {
    role: 'ORG_ADMIN',
    roleName: 'Organization Admin',
    email: 'admin@nova.com',
    password: 'admin123',
    tag: 'Tenant & Seats',
    color: 'bg-[#5B8DEF]/10 text-[#5B8DEF]',
    borderActive: 'border-[#5B8DEF] ring-1 ring-[#5B8DEF]',
    desc: 'Data Center, Team Seats & Org Parameters',
    icon: '🏢',
  },
  {
    role: 'SUPER_ADMIN',
    roleName: 'Super Administrator',
    email: 'superadmin@ftm.com',
    password: 'super123',
    tag: 'Platform Master',
    color: 'bg-[#F1584F]/10 text-[#F1584F]',
    borderActive: 'border-[#F1584F] ring-1 ring-[#F1584F]',
    desc: 'Tenant Fleet, AI Infrastructure & System Telemetry',
    icon: '🌐',
  },
];

const AVAILABLE_ORGS = [
  { id: 'nova-corp', name: 'NOVA COMMERCE (Primary Demo)' },
  { id: 'apex-global', name: 'Apex Global Financials' },
  { id: 'genesis-holdings', name: 'Genesis Venture Holdings' },
];

export default function LoginPage() {
  const { login, requestOtp, resendOtp, verifyOtpAndRegister } = useAuth();
  
  // Tabs: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Register State
  const [regStage, setRegStage] = useState<'details' | 'otp'>('details');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('CFO');
  const [regOrgType, setRegOrgType] = useState<'existing' | 'new'>('existing');
  const [regSelectedOrg, setRegSelectedOrg] = useState(AVAILABLE_ORGS[0].name);
  const [regCustomOrg, setRegCustomOrg] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(300);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [copiedDevOtp, setCopiedDevOtp] = useState(false);
  const otpInputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  // Modals
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [showSsoModal, setShowSsoModal] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<'okta' | 'google' | 'azure'>('okta');

  // Health Ping
  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        await axios.get('http://localhost:8001/api/health', { timeout: 3500 });
        setBackendLatency(Date.now() - start);
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // OTP Countdown Timers
  useEffect(() => {
    if (authMode !== 'register' || regStage !== 'otp') return;

    const timer = setInterval(() => {
      setOtpExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [authMode, regStage]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, text: 'Moderate', color: 'bg-amber-500' };
    return { score, text: 'Strong (Enterprise Compliant)', color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(regPassword);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Invalid corporate email or password. Please verify credentials or choose a quick persona.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must contain at least 6 characters for enterprise compliance.');
      return;
    }
    if (!agreedTerms) {
      setError('Please accept the Sovereign AI Data Governance and Security Agreement.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestOtp(regEmail.trim(), regPhone.trim() || undefined);
      setDevOtp(res.dev_otp || null);
      setOtpExpiresIn(res.expires_in_seconds || 300);
      setResendCooldown(res.cooldown_seconds || 60);
      setOtpDigits(['', '', '', '', '', '']);
      setRegStage('otp');
      setSuccessMsg(res.message || `Verification code dispatched to ${regEmail.trim()}`);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Failed to dispatch verification code. The email may already be in use or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (i < digitsOnly.length) {
          newDigits[i] = digitsOnly[i];
        }
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(digitsOnly.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    const singleChar = digitsOnly.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleChar;
    setOtpDigits(newDigits);

    if (singleChar && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const focusIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  const fillDevOtp = () => {
    if (!devOtp) return;
    const digits = devOtp.split('').slice(0, 6);
    const newDigits = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      newDigits[i] = d;
    });
    setOtpDigits(newDigits);
    setCopiedDevOtp(true);
    setTimeout(() => setCopiedDevOtp(false), 2000);
    otpInputsRef.current[5]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (otpExpiresIn <= 0) {
      setError('Verification code has expired. Please click "Resend Code".');
      return;
    }

    setLoading(true);
    try {
      await verifyOtpAndRegister({
        email: regEmail.trim(),
        otp: fullCode,
        password: regPassword,
        full_name: regFullName.trim() || regEmail.split('@')[0],
        role: regRole,
        organization_id: regOrgType === 'new' ? regCustomOrg.trim() : regSelectedOrg,
      });
      setSuccessMsg('Security code verified! Provisioning your sovereign workspace...');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await resendOtp(regEmail.trim(), regPhone.trim() || undefined);
      setDevOtp(res.dev_otp || null);
      setOtpExpiresIn(res.expires_in_seconds || 300);
      setResendCooldown(res.cooldown_seconds || 60);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMsg('A new verification code has been dispatched!');
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Failed to resend verification code. Please wait before retrying.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred: DemoCred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setSelectedRole(cred.role);
    setError('');
    setSuccessMsg('');
  };

  const quickLaunchDemo = async (cred: DemoCred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setSelectedRole(cred.role);
    setError('');
    setLoading(true);
    try {
      await login(cred.email, cred.password);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Failed to auto-launch demo seat.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
  };

  const handleSsoLaunch = async () => {
    setLoading(true);
    setShowSsoModal(false);
    // Simulate enterprise SSO handshake
    setTimeout(async () => {
      try {
        await login('cfo@nova.com', 'nova123');
      } catch (e: any) {
        setError('SSO Handshake failed. Please check enterprise directory settings.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E9EDF4] flex items-center justify-center p-4 lg:p-8 selection:bg-[#E8A33D]/20 selection:text-[#E8A33D] font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
        
        {/* Left Column: Branding, Value Pillars & Live Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-8">
          
          {/* Brand Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#182234] to-[#121826] border border-[#E8A33D]/30 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(232,163,61,0.25)]">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-display font-bold text-[#E9EDF4] tracking-wider uppercase">
                  FINANCIAL TIME MACHINE
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30 font-mono font-bold">
                  v2.4 Sovereign
                </span>
              </div>
              <p className="text-xs text-[#8C99AF]">AI Financial Decision Twin & Simulation Engine</p>
            </div>
          </div>

          {/* Hero Value Statement */}
          <div className="space-y-3">
            <h2 className="text-3xl font-display font-bold text-[#E9EDF4] leading-tight tracking-tight">
              Test every major financial move <br />
              <span className="bg-gradient-to-r from-[#E8A33D] via-[#F3C474] to-[#E8A33D] bg-clip-text text-transparent">
                in simulated time first.
              </span>
            </h2>
            <p className="text-xs text-[#8C99AF] leading-relaxed font-sans">
              Local-first enterprise AI agents simulate multi-scenario cash flow, churn elasticity, and risk impacts before corporate capital is deployed.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {[
              {
                icon: Sparkles,
                title: 'Multi-Scenario Timeline Spine',
                desc: 'Simulate Optimistic, Base & Stress-Test futures in seconds',
                color: 'text-[#E8A33D] bg-[#E8A33D]/10 border-[#E8A33D]/20',
              },
              {
                icon: Shield,
                title: 'Cryptographic Decision Ledger',
                desc: 'Tamper-evident governance, rationale logs & forensic audit',
                color: 'text-[#3ADDA0] bg-[#3ADDA0]/10 border-[#3ADDA0]/20',
              },
              {
                icon: BarChart3,
                title: 'Prediction vs Reality Loop',
                desc: 'Self-calibrating institutional memory comparing projections',
                color: 'text-[#5B8DEF] bg-[#5B8DEF]/10 border-[#5B8DEF]/20',
              },
              {
                icon: Database,
                title: 'Local Sovereign AI Engine',
                desc: 'Qwen3 4B via Ollama — enterprise data never leaves your infrastructure',
                color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-[#121826]/80 border border-[#232E42] hover:border-[#384860] transition-colors"
                >
                  <div className={`p-2 rounded-lg border ${f.color} shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-display font-bold text-[#E9EDF4]">{f.title}</p>
                    <p className="text-[11px] text-[#8C99AF] leading-snug">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Telemetry Bar */}
          <div className="p-3.5 rounded-xl bg-[#121826]/60 border border-[#232E42] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-[#3ADDA0] animate-pulse shadow-[0_0_8px_#3ADDA0]'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-[#8C99AF] text-[11px]">
                {backendStatus === 'online'
                  ? `API Gateway Online ${backendLatency ? `(${backendLatency}ms)` : ''}`
                  : backendStatus === 'checking'
                  ? 'Connecting to Local Core...'
                  : 'Backend Disconnected (Port 8001)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPermissionsModal(true)}
              className="text-[#E8A33D] hover:text-[#F3C474] text-[11px] font-sans font-medium flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
            >
              <FileText size={12} />
              Role Matrix
            </button>
          </div>

          {/* Trust & Compliance Badges */}
          <div className="flex items-center justify-between gap-2 px-1 text-[10px] text-[#5B6A82] font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Shield size={11} className="text-[#3ADDA0]" /> SOC-2 TYPE II
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock size={11} className="text-[#5B8DEF]" /> AES-256 / SHA-256
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu size={11} className="text-[#E8A33D]" /> ZERO DATA EGRESS
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Portal (Sign In / Register / Quick Persona) (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-[#121826] rounded-2xl p-6 lg:p-8 shadow-2xl border border-[#232E42] relative overflow-hidden backdrop-blur-md">
            
            {/* Top Glowing Ambient Accents */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#E8A33D]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#5B8DEF]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Portal Header & Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232E42] pb-5">
              <div>
                <h3 className="text-lg font-display font-bold text-[#E9EDF4] flex items-center gap-2">
                  {authMode === 'signin' ? (
                    <>
                      <UserCheck size={20} className="text-[#E8A33D]" />
                      Enterprise Access Portal
                    </>
                  ) : regStage === 'otp' ? (
                    <>
                      <ShieldCheck size={20} className="text-[#3ADDA0]" />
                      Verify Enterprise Identity
                    </>
                  ) : (
                    <>
                      <UserCheck size={20} className="text-[#E8A33D]" />
                      Register New Workspace Seat
                    </>
                  )}
                </h3>
                <p className="text-xs text-[#8C99AF] mt-0.5">
                  {authMode === 'signin'
                    ? 'Authenticate corporate credentials or select a 1-click test persona'
                    : regStage === 'otp'
                    ? 'Step 2 of 2: Enter the 6-digit cryptographic verification code'
                    : 'Step 1 of 2: Configure corporate seat parameters and enterprise credentials'}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-[#0B0F17] p-1 rounded-xl border border-[#232E42] shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  id="tab-signin"
                  onClick={() => {
                    setAuthMode('signin');
                    setRegStage('details');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-[#182234] text-[#E8A33D] shadow-sm border border-[#E8A33D]/30'
                      : 'text-[#8C99AF] hover:text-[#E9EDF4]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="tab-register"
                  onClick={() => {
                    setAuthMode('register');
                    setRegStage('details');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-[#182234] text-[#E8A33D] shadow-sm border border-[#E8A33D]/30'
                      : 'text-[#8C99AF] hover:text-[#E9EDF4]'
                  }`}
                >
                  Register Seat
                </button>
              </div>
            </div>

            {/* Error / Success Notifications */}
            {error && (
              <div className="mt-4 flex items-center gap-2.5 p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-200"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 flex items-center gap-2.5 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs animate-fadeIn">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span className="flex-1">{successMsg}</span>
              </div>
            )}

            {/* MODE 1: SIGN IN FORM & 1-CLICK PERSONAS */}
            {authMode === 'signin' ? (
              <div className="space-y-5 mt-5">
                
                {/* 1-Click Persona Quick Access Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={12} className="text-[#E8A33D]" /> 1-Click Role Presets (Live Testing)
                    </label>
                    <span className="text-[10px] text-[#5B6A82] font-mono">Click card to load • Click ⚡ to launch</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEMO_CREDENTIALS.map((cred) => {
                      const isSelected = selectedRole === cred.role || email === cred.email;
                      return (
                        <div
                          key={cred.email}
                          onClick={() => fillDemo(cred)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative group ${
                            isSelected
                              ? `${cred.color} ${cred.borderActive} shadow-lg scale-[1.01]`
                              : 'bg-[#182234]/70 border-[#232E42] hover:border-[#5B8DEF]/50 text-[#8C99AF]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{cred.icon}</span>
                              <span className="text-xs font-display font-bold text-[#E9EDF4]">
                                {cred.roleName}
                              </span>
                            </div>
                            <button
                              type="button"
                              title={`Instant launch as ${cred.roleName}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                quickLaunchDemo(cred);
                              }}
                              className="opacity-80 hover:opacity-100 p-1 rounded-md bg-[#0B0F17] hover:bg-[#E8A33D] hover:text-[#0B0F17] text-[#E8A33D] border border-[#232E42] transition-colors"
                            >
                              <Zap size={11} />
                            </button>
                          </div>
                          <p className="text-[10px] text-[#8C99AF] line-clamp-1 leading-normal font-sans">
                            {cred.desc}
                          </p>
                          <div className="flex items-center justify-between text-[9px] font-mono text-[#5B6A82] pt-0.5 border-t border-[#232E42]/50">
                            <span>{cred.email}</span>
                            <span className="text-[#3ADDA0]">{cred.tag}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-[#232E42] w-full" />
                  <span className="bg-[#121826] px-3 text-[10px] font-mono text-[#5B6A82] uppercase tracking-wider shrink-0">
                    Or Enter Corporate Credentials
                  </span>
                </div>

                {/* Sign In Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider mb-1.5">
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setSelectedRole(null);
                        }}
                        placeholder="cfo@nova.com"
                        required
                        className="w-full bg-[#182234] border border-[#232E42] rounded-xl pl-10 pr-3.5 py-2.5 text-[#E9EDF4] text-xs font-mono placeholder-[#5B6A82] outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setShowForgotPasswordModal(true);
                          setForgotSubmitted(false);
                        }}
                        className="text-[11px] text-[#E8A33D] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#182234] border border-[#232E42] rounded-xl pl-10 pr-10 py-2.5 text-[#E9EDF4] text-xs font-mono placeholder-[#5B6A82] outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6A82] hover:text-[#E9EDF4] transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Preferences & SSO Row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[#8C99AF] select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-[#232E42] bg-[#182234] text-[#E8A33D] focus:ring-0 cursor-pointer"
                      />
                      Remember workspace session
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowSsoModal(true)}
                      className="text-[11px] text-[#5B8DEF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Globe size={12} /> Enterprise SSO
                    </button>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    id="login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#E8A33D] to-[#F3C474] hover:from-[#E8A33D]/90 hover:to-[#F3C474]/90 text-[#0B0F17] font-display font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#E8A33D]/20 disabled:opacity-60 flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Authenticating Seat...
                      </>
                    ) : (
                      <>
                        <Zap size={16} /> ENTER FINANCIAL TIME MACHINE <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Switch */}
                <div className="text-center pt-2 text-xs text-[#8C99AF]">
                  New organization or need an authorized role seat?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError('');
                    }}
                    className="text-[#E8A33D] font-bold hover:underline cursor-pointer"
                  >
                    Register Seat Now
                  </button>
                </div>
              </div>
            ) : regStage === 'details' ? (
              /* MODE 2 - STAGE 1: REGISTRATION DETAILS FORM */
              <form onSubmit={handleRequestOtp} className="space-y-4 mt-5">
                
                {/* Full Name & Corporate Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
                      <input
                        id="reg-fullname"
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Priya Patel"
                        required
                        className="w-full bg-[#182234] border border-[#232E42] rounded-xl pl-10 pr-3.5 py-2.5 text-[#E9EDF4] text-xs font-mono placeholder-[#5B6A82] outline-none focus:border-[#E8A33D] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider mb-1.5">
                      Corporate Work Email
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
                      <input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="priya@company.com"
                        required
                        className="w-full bg-[#182234] border border-[#232E42] rounded-xl pl-10 pr-3.5 py-2.5 text-[#E9EDF4] text-xs font-mono placeholder-[#5B6A82] outline-none focus:border-[#E8A33D] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Phone (Optional SMS Fallback) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider">
                      Mobile Number <span className="text-[#5B6A82] font-normal lowercase">(optional for SMS verification)</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#5B8DEF]">Email OTP + SMS Fallback</span>
                  </div>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
                    <input
                      id="reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210 / +1 (555) 019-2834"
                      className="w-full bg-[#182234] border border-[#232E42] rounded-xl pl-10 pr-3.5 py-2.5 text-[#E9EDF4] text-xs font-mono placeholder-[#5B6A82] outline-none focus:border-[#E8A33D] transition-all"
                    />
                  </div>
                </div>

                {/* Role Selection Grid */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider">
                      Assign Enterprise Role & Permissions
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPermissionsModal(true)}
                      className="text-[11px] text-[#E8A33D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle size={11} /> Capabilities breakdown
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { role: 'CFO' as UserRole, label: 'CFO / Finance Lead', icon: '⚡', desc: 'Simulations, War Room & Ledger' },
                      { role: 'BUSINESS_ANALYST' as UserRole, label: 'Business Analyst', icon: '📊', desc: 'Scenario Modeling & DNA Graph' },
                      { role: 'EXECUTIVE' as UserRole, label: 'Executive Approver', icon: '⚖️', desc: 'Authorizations & War Room' },
                      { role: 'AUDITOR' as UserRole, label: 'Independent Auditor', icon: '🛡️', desc: 'Forensic Audit & Verification' },
                      { role: 'ORG_ADMIN' as UserRole, label: 'Organization Admin', icon: '🏢', desc: 'Data Center & User Seats' },
                      { role: 'SUPER_ADMIN' as UserRole, label: 'Super Admin', icon: '🌐', desc: 'Fleet & Infrastructure' },
                    ].map((r) => {
                      const isSelected = regRole === r.role;
                      return (
                        <button
                          key={r.role}
                          type="button"
                          onClick={() => setRegRole(r.role)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-[#E8A33D]/10 border-[#E8A33D] ring-1 ring-[#E8A33D] text-[#E9EDF4]'
                              : 'bg-[#182234]/70 border-[#232E42] hover:border-[#5B8DEF]/50 text-[#8C99AF]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{r.icon}</span>
                            {isSelected && <Check size={12} className="text-[#E8A33D]" />}
                          </div>
                          <span className="text-xs font-display font-bold text-[#E9EDF4] line-clamp-1">
                            {r.label}
                          </span>
                          <span className="text-[9px] text-[#8C99AF] line-clamp-1">
                            {r.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Organization Setup */}
                <div className="p-3 rounded-xl bg-[#182234]/50 border border-[#232E42] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider flex items-center gap-1.5">
                      <Building size={12} className="text-[#5B8DEF]" /> Organization / Tenant Workspace
                    </label>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1 text-[11px] text-[#8C99AF] cursor-pointer">
                        <input
                          type="radio"
                          name="orgType"
                          checked={regOrgType === 'existing'}
                          onChange={() => setRegOrgType('existing')}
                          className="text-[#E8A33D] focus:ring-0"
                        />
                        Join Existing
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-[#8C99AF] cursor-pointer">
                        <input
                          type="radio"
                          name="orgType"
                          checked={regOrgType === 'new'}
                          onChange={() => setRegOrgType('new')}
                          className="text-[#E8A33D] focus:ring-0"
                        />
                        New Tenant
                      </label>
                    </div>
                  </div>

                  {regOrgType === 'existing' ? (
                    <select
                      value={regSelectedOrg}
                      onChange={(e) => setRegSelectedOrg(e.target.value)}
                      className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-[#E9EDF4] text-xs font-mono outline-none focus:border-[#E8A33D]"
                    >
                      {AVAILABLE_ORGS.map((o) => (
                        <option key={o.id} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={regCustomOrg}
                      onChange={(e) => setRegCustomOrg(e.target.value)}
                      placeholder="e.g. Apex Global Financials Inc."
                      required={regOrgType === 'new'}
                      className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-[#E9EDF4] text-xs font-mono placeholder-[#5B6A82] outline-none focus:border-[#E8A33D]"
                    />
                  )}
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#182234] border border-[#232E42] rounded-xl pl-10 pr-10 py-2.5 text-[#E9EDF4] text-xs font-mono placeholder-[#5B6A82] outline-none focus:border-[#E8A33D] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6A82] hover:text-[#E9EDF4] transition-colors p-1 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
                      <input
                        id="reg-confirm-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#182234] border border-[#232E42] rounded-xl pl-10 pr-3.5 py-2.5 text-[#E9EDF4] text-xs font-mono placeholder-[#5B6A82] outline-none focus:border-[#E8A33D] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {regPassword && (
                  <div className="space-y-1.5 bg-[#0B0F17]/80 p-2.5 rounded-lg border border-[#232E42]">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8C99AF]">Security Complexity:</span>
                      <span className={passStrength.score >= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                        {passStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full ${
                            passStrength.score >= step ? passStrength.color : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Agreement */}
                <label className="flex items-start gap-2 cursor-pointer text-[#8C99AF] text-[11px] select-none pt-1">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-[#232E42] bg-[#182234] text-[#E8A33D] focus:ring-0 cursor-pointer"
                  />
                  <span>
                    I accept the{' '}
                    <span className="text-[#E8A33D]">Sovereign AI Data Governance Policy</span> and acknowledge local-first
                    cryptographic execution on the organizational node.
                  </span>
                </label>

                {/* Request OTP Action Button */}
                <button
                  id="register-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#E8A33D] to-[#F3C474] hover:from-[#E8A33D]/90 hover:to-[#F3C474]/90 text-[#0B0F17] font-display font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#E8A33D]/20 disabled:opacity-60 flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Dispatching Verification Code...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} /> SEND 6-DIGIT VERIFICATION CODE <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {/* Footer Switch */}
                <div className="text-center pt-2 text-xs text-[#8C99AF]">
                  Already have a seat provisioned?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setError('');
                    }}
                    className="text-[#E8A33D] font-bold hover:underline cursor-pointer"
                  >
                    Sign In with Credentials
                  </button>
                </div>
              </form>
            ) : (
              /* MODE 2 - STAGE 2: 6-DIGIT OTP VERIFICATION VIEW */
              <form onSubmit={handleVerifyOtp} className="space-y-5 mt-5 animate-fadeIn">
                
                {/* Stage Badge & Recipient Summary Card */}
                <div className="p-4 rounded-xl bg-[#182234]/80 border border-[#232E42] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#3ADDA0]/10 text-[#3ADDA0] border border-[#3ADDA0]/30 font-mono font-bold uppercase">
                        Step 2 of 2
                      </span>
                      <span className="text-xs font-display font-bold text-[#E9EDF4]">Identity Verification</span>
                    </div>
                    <p className="text-xs text-[#8C99AF] flex items-center gap-1.5">
                      <Mail size={13} className="text-[#5B8DEF]" />
                      <span>Code dispatched to <strong className="text-[#E9EDF4] font-mono">{regEmail}</strong></span>
                      {regPhone && <span className="text-[#5B6A82]">({regPhone})</span>}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRegStage('details');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-[#E8A33D] hover:text-[#F3C474] font-medium flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer shrink-0"
                  >
                    <ArrowLeft size={12} /> Edit Details
                  </button>
                </div>

                {/* 6 Individual Digit OTP Input Boxes */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase tracking-wider">
                      Enter 6-Digit Security Code
                    </label>
                    <span className="text-[10px] font-mono text-[#8C99AF]">Auto-advances as you type</span>
                  </div>

                  <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputsRef.current[idx] = el;
                        }}
                        id={`otp-box-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        autoFocus={idx === 0}
                        className={`h-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl bg-[#0B0F17] border transition-all outline-none ${
                          digit
                            ? 'border-[#E8A33D] text-[#E8A33D] shadow-[0_0_12px_rgba(232,163,61,0.2)] bg-[#E8A33D]/5'
                            : 'border-[#232E42] text-[#E9EDF4] focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Dev Quick Helper Toast / Auto-Fill Banner */}
                {devOtp && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-[#E8A33D]/10 via-[#182234] to-[#E8A33D]/10 border border-[#E8A33D]/30 flex items-center justify-between gap-3 text-xs animate-pulse">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#E8A33D] shrink-0" />
                      <div>
                        <span className="text-[11px] font-mono text-[#8C99AF] uppercase tracking-wider block">
                          Local Dev Test OTP
                        </span>
                        <span className="font-mono font-bold text-sm tracking-widest text-[#E8A33D]">
                          {devOtp}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={fillDevOtp}
                      className="px-3 py-1.5 rounded-lg bg-[#E8A33D]/20 hover:bg-[#E8A33D]/30 text-[#E8A33D] border border-[#E8A33D]/40 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy size={12} />
                      {copiedDevOtp ? 'Code Filled!' : 'Auto-Fill Code'}
                    </button>
                  </div>
                )}

                {/* Timers & Resend Action Bar */}
                <div className="flex items-center justify-between text-xs font-mono p-3 bg-[#0B0F17]/60 rounded-xl border border-[#232E42]">
                  {/* Expiration Countdown */}
                  <div className="flex items-center gap-1.5">
                    <Clock
                      size={14}
                      className={otpExpiresIn < 60 ? 'text-red-400 animate-pulse' : 'text-[#8C99AF]'}
                    />
                    <span className={otpExpiresIn < 60 ? 'text-red-400 font-bold' : 'text-[#8C99AF]'}>
                      Expires in {formatTime(otpExpiresIn)}
                    </span>
                  </div>

                  {/* Resend Cooldown Button */}
                  <div>
                    {resendCooldown > 0 ? (
                      <span className="text-[#5B6A82] text-[11px]">
                        Resend in <strong className="text-[#8C99AF]">{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-[#E8A33D] hover:text-[#F3C474] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                {/* Verify & Provision Seat Action */}
                <button
                  id="otp-verify-submit"
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6 || otpExpiresIn <= 0}
                  className="w-full bg-gradient-to-r from-[#3ADDA0] via-[#4ce4ab] to-[#3ADDA0] hover:brightness-110 text-[#0B0F17] font-display font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#3ADDA0]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Verifying Code & Provisioning Seat...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> VERIFY & PROVISION ENTERPRISE SEAT <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {/* Back to Step 1 */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRegStage('details');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-[#8C99AF] hover:text-[#E9EDF4] flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Return to Profile Configuration
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Role Permissions & Access Matrix */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-[#232E42] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="text-base font-display font-bold text-[#E9EDF4]">
                    Role Access & Capability Matrix
                  </h4>
                  <p className="text-xs text-[#8C99AF]">Enterprise RBAC security boundaries for sovereign operations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="p-1.5 rounded-lg text-[#8C99AF] hover:text-[#E9EDF4] hover:bg-[#182234] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#232E42] text-[#8C99AF]">
                    <th className="pb-3 pr-4 font-bold uppercase text-[10px]">Module / Capability</th>
                    <th className="pb-3 px-2 text-center text-[#E8A33D]">CFO</th>
                    <th className="pb-3 px-2 text-center text-[#5B8DEF]">Analyst</th>
                    <th className="pb-3 px-2 text-center text-[#3ADDA0]">Executive</th>
                    <th className="pb-3 px-2 text-center text-amber-400">Auditor</th>
                    <th className="pb-3 px-2 text-center text-orange-400">Org Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232E42]/50 text-[#C1CAD8]">
                  {[
                    { feature: 'Multi-Scenario Timeline Simulator', cfo: true, ana: true, exe: true, aud: 'View', org: true },
                    { feature: 'Decision War Room & Matrix', cfo: true, ana: true, exe: true, aud: 'View', org: false },
                    { feature: 'War Room Strategic Sign-Off', cfo: true, ana: false, exe: true, aud: false, org: false },
                    { feature: 'Cryptographic Decision Ledger', cfo: true, ana: true, exe: true, aud: true, org: true },
                    { feature: 'Prediction vs Reality Memory Loop', cfo: true, ana: true, exe: true, aud: true, org: false },
                    { feature: 'Financial DNA Dependency Graph', cfo: true, ana: true, exe: true, aud: 'View', org: true },
                    { feature: 'Risk & Vulnerability Center', cfo: true, ana: true, exe: true, aud: true, org: true },
                    { feature: 'Data Center & Financial Ingestion', cfo: true, ana: true, exe: false, aud: false, org: true },
                    { feature: 'User Seats & Team Management', cfo: false, ana: false, exe: false, aud: false, org: true },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#182234]/50">
                      <td className="py-2.5 pr-4 font-sans text-xs font-medium text-[#E9EDF4]">{row.feature}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadge(row.cfo)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadge(row.ana)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadge(row.exe)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadge(row.aud)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadge(row.org)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 bg-[#182234] hover:bg-[#232E42] border border-[#232E42] text-xs font-display font-bold text-[#E9EDF4] rounded-xl transition-colors cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Forgot Password Recovery */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-[#232E42] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-[#E8A33D]" />
                <h4 className="text-base font-display font-bold text-[#E9EDF4]">
                  Reset Enterprise Seat Credentials
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-[#8C99AF] hover:text-[#E9EDF4]"
              >
                <X size={16} />
              </button>
            </div>

            {!forgotSubmitted ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-[#8C99AF] leading-relaxed">
                  Enter your registered work email. A cryptographic recovery token will be dispatched to your organization administrator.
                </p>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#8C99AF] uppercase mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="cfo@nova.com"
                    className="w-full bg-[#182234] border border-[#232E42] rounded-xl px-3.5 py-2.5 text-[#E9EDF4] text-xs font-mono outline-none focus:border-[#E8A33D]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 bg-[#182234] text-[#8C99AF] hover:text-[#E9EDF4] rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-[#0B0F17] font-display font-bold rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    Send Recovery Token
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-display font-bold text-[#E9EDF4]">Recovery Dispatched</h5>
                  <p className="text-xs text-[#8C99AF]">
                    In demo mode, you can immediately use any of the 6 quick-access personas or seed passwords (<code className="text-[#E8A33D]">nova123</code> / <code className="text-[#E8A33D]">admin123</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="w-full bg-[#182234] hover:bg-[#232E42] border border-[#232E42] py-2.5 rounded-xl text-xs font-display font-bold text-[#E9EDF4]"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Enterprise SSO Simulation */}
      {showSsoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-[#232E42] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#232E42] pb-3">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-[#5B8DEF]" />
                <h4 className="text-base font-display font-bold text-[#E9EDF4]">
                  Enterprise Single Sign-On (SAML 2.0)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSsoModal(false)}
                className="text-[#8C99AF] hover:text-[#E9EDF4]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#8C99AF]">
              Select your organization's Identity Provider to initiate a SAML 2.0 / OIDC enterprise authentication flow.
            </p>

            <div className="space-y-2 pt-1">
              {[
                { id: 'okta' as const, name: 'Okta Enterprise Identity', desc: 'SAML 2.0 with SCIM Provisioning' },
                { id: 'google' as const, name: 'Google Workspace Enterprise', desc: 'OAuth 2.0 with Domain Locking' },
                { id: 'azure' as const, name: 'Microsoft Azure Active Directory', desc: 'Entra ID SAML Federation' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => setSsoProvider(prov.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    ssoProvider === prov.id
                      ? 'bg-[#5B8DEF]/10 border-[#5B8DEF] ring-1 ring-[#5B8DEF]'
                      : 'bg-[#182234] border-[#232E42] hover:border-[#5B8DEF]/50 text-[#8C99AF]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-display font-bold text-[#E9EDF4]">{prov.name}</p>
                    <p className="text-[10px] text-[#8C99AF]">{prov.desc}</p>
                  </div>
                  {ssoProvider === prov.id && <Check size={14} className="text-[#5B8DEF]" />}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowSsoModal(false)}
                className="px-4 py-2 bg-[#182234] text-[#8C99AF] hover:text-[#E9EDF4] rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSsoLaunch}
                className="px-4 py-2 bg-[#5B8DEF] hover:bg-[#5B8DEF]/90 text-[#0B0F17] font-display font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                Launch SSO Handshake <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to render matrix check / view pill
function renderBadge(val: boolean | string) {
  if (val === true) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
        ✓
      </span>
    );
  }
  if (val === 'View') {
    return (
      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-mono font-bold">
        Read
      </span>
    );
  }
  return <span className="text-slate-600 text-xs">—</span>;
}
