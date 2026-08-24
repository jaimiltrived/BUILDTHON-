import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS, type UserRole } from '../../lib/auth';
import { useEngineStatusQuery } from '../../lib/queries';
import { LogOut, ChevronDown, Building, Shield } from 'lucide-react';

interface TopBarProps {
  onRoleChange?: (role: UserRole) => void;
}

export default function TopBar({ onRoleChange }: TopBarProps) {
  const { user, switchRole, logout } = useAuth();
  const { data: engineStatus } = useEngineStatusQuery();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const isLLM = engineStatus?.is_llm ?? false;
  const currentRole = (user?.role || 'CFO') as UserRole;

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'CFO', label: 'CFO (Chief Financial Officer)', desc: 'Full simulation, war room & decision memory' },
    { role: 'BUSINESS_ANALYST', label: 'Business Analyst', desc: 'What-if modeling, scenario comparisons & risk' },
    { role: 'EXECUTIVE', label: 'Executive Approver', desc: 'War room authorizations & sign-offs' },
    { role: 'AUDITOR', label: 'Independent Auditor', desc: 'Read-only compliance audit & forensic ledger' },
    { role: 'ORG_ADMIN', label: 'Organization Admin', desc: 'Data center, user seats & org settings' },
    { role: 'SUPER_ADMIN', label: 'Global Super Admin', desc: 'Platform tenant fleet & AI infrastructure' },
  ];

  const handleSelectRole = (r: UserRole) => {
    switchRole(r);
    if (onRoleChange) onRoleChange(r);
    setRoleMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#121826] border-b border-[#232E42] z-50 px-5 flex items-center justify-between">
      {/* Brand & Organization */}
      <div className="flex items-center gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-[#182234] border border-[#232E42] flex items-center justify-center text-sm shadow-[0_0_12px_rgba(232,163,61,0.2)]">
          ⚡
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-display font-bold tracking-wider text-[#E9EDF4] uppercase">
            FINANCIAL TIME MACHINE
          </span>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[#5B6A82]" />
          <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-[#8C99AF]">
            <Building size={12} className="text-[#5B6A82]" /> Nova Commerce Pvt Ltd
          </span>
        </div>
      </div>

      {/* Right Controls: AI Status Dot + Live Role Switcher + User Profile */}
      <div className="flex items-center gap-3">
        {/* AI Status Dot */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#182234] border border-[#232E42]">
          <span
            className={`w-2 h-2 rounded-full ${
              isLLM ? 'bg-[#3ADDA0] animate-pulse shadow-[0_0_8px_rgba(58,221,160,0.8)]' : 'bg-[#E8A33D]'
            }`}
          />
          <span className="text-[10px] font-mono font-bold text-[#8C99AF] uppercase">
            {isLLM ? `${(engineStatus?.model_name || 'LLAMA3').replace(':latest', '').toUpperCase()} ONLINE` : 'DETERMINISTIC ACTIVE'}
          </span>
        </div>

        {/* Live Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#182234] hover:bg-[#182234]/80 text-[#E9EDF4] border border-[#232E42] text-xs font-mono font-bold cursor-pointer transition-all shadow-md"
          >
            <Shield size={13} className="text-[#E8A33D]" />
            <span className="truncate max-w-[130px] sm:max-w-[180px]">
              {ROLE_LABELS[currentRole] || currentRole}
            </span>
            <ChevronDown size={14} className="text-[#5B6A82]" />
          </button>

          {/* Role Dropdown Menu */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#121826] border border-[#232E42] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="p-2.5 border-b border-[#232E42] bg-[#182234]/50">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82]">
                  Live Persona / Role Switcher
                </p>
              </div>
              <div className="p-1.5 space-y-1 max-h-80 overflow-y-auto">
                {roles.map(({ role: r, label, desc }) => (
                  <button
                    key={r}
                    onClick={() => handleSelectRole(r)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex flex-col gap-0.5 cursor-pointer ${
                      currentRole === r
                        ? 'bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30'
                        : 'text-[#8C99AF] hover:text-[#E9EDF4] hover:bg-[#182234]'
                    }`}
                  >
                    <span className="font-mono font-bold">{label}</span>
                    <span className="text-[10px] text-[#5B6A82] font-sans">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 pl-1">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-semibold text-[#E9EDF4] truncate max-w-[110px]">
              {user?.full_name || 'User'}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg bg-[#182234] hover:bg-[#F1584F]/10 hover:text-[#F1584F] text-[#8C99AF] border border-[#232E42] hover:border-[#F1584F]/30 transition-all cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
