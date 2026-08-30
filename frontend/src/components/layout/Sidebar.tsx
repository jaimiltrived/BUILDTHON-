import type { ComponentType } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { type UserRole } from '../../lib/auth';
import {
  LayoutDashboard,
  Bot,
  Sliders,
  Scale,
  ShieldAlert,
  BookOpen,
  History,
  Database,
  Layers,
  HardDrive,
  Users,
  Building2,
  Server,
  Settings,
  Activity,
  Search,
  Coins,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

interface NavSection {
  caption: string;
  items: {
    id: string;
    label: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    tag?: string;
  }[];
}

export default function Sidebar({ activeTab, onTabSelect }: SidebarProps) {
  const { user } = useAuth();
  const role = (user?.role || 'CFO') as UserRole;

  const getNavSections = (): NavSection[] => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          {
            caption: 'PLATFORM CORE',
            items: [
              { id: 'dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
              { id: 'organizations', label: 'Organizations', icon: Building2 },
              { id: 'users', label: 'Users & Roles', icon: Users },
            ],
          },
          {
            caption: 'SYSTEM & AUDIT',
            items: [
              { id: 'ai-infra', label: 'AI Infrastructure', icon: Server },
              { id: 'audit', label: 'Global Audit Trail', icon: Layers },
              { id: 'settings', label: 'Platform Settings', icon: Settings },
            ],
          },
        ];

      case 'ORG_ADMIN':
        return [
          {
            caption: 'TENANT OVERVIEW',
            items: [
              { id: 'dashboard', label: 'Org Dashboard', icon: LayoutDashboard },
              { id: 'data', label: 'Data Center', icon: HardDrive },
              { id: 'users', label: 'Team Members', icon: Users },
            ],
          },
          {
            caption: 'GOVERNANCE & SETUP',
            items: [
              { id: 'audit', label: 'Compliance Audit', icon: Layers },
              { id: 'settings', label: 'Org Settings', icon: Settings },
            ],
          },
        ];

      case 'EXECUTIVE':
        return [
          {
            caption: 'EXECUTIVE WAR ROOM',
            items: [
              { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
              { id: 'warroom', label: 'Decision War Room', icon: Scale, tag: 'Sign-off' },
              { id: 'reconciliation', label: 'Reconciliation & Cash', icon: Coins, tag: 'Track 04' },
            ],
          },
          {
            caption: 'GOVERNANCE AUDIT',
            items: [
              { id: 'ledger', label: 'Decision Ledger', icon: BookOpen },
              { id: 'prediction', label: 'Prediction vs Reality', icon: History },
            ],
          },
        ];

      case 'AUDITOR':
        return [
          {
            caption: 'COMPLIANCE AUDIT',
            items: [
              { id: 'audit', label: 'Audit Center', icon: Layers, tag: 'Read-Only' },
              { id: 'reconciliation', label: 'Reconciliation Loop', icon: Coins, tag: 'Verified' },
              { id: 'ledger', label: 'Decision Ledger', icon: BookOpen, tag: 'Locked' },
              { id: 'prediction', label: 'Prediction vs Reality', icon: History, tag: 'Locked' },
            ],
          },
        ];

      case 'BUSINESS_ANALYST':
        return [
          {
            caption: 'ANALYTICS & MODELING',
            items: [
              { id: 'dashboard', label: 'Financial Overview', icon: LayoutDashboard },
              { id: 'chat', label: 'AI Controller', icon: Bot },
              { id: 'reconciliation', label: 'Reconciliation & Cash', icon: Coins, tag: 'Track 04' },
              { id: 'researcher', label: 'Live Researcher', icon: Search, tag: 'LLM' },
              { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
              { id: 'warroom', label: 'Compare Scenarios', icon: Scale },
            ],
          },
          {
            caption: 'RISK & CAUSAL DNA',
            items: [
              { id: 'risk', label: 'Risk Center', icon: ShieldAlert },
              { id: 'dna', label: 'Causal DNA Graph', icon: Activity },
            ],
          },
        ];

      case 'CFO':
      default:
        return [
          {
            caption: 'DECISION CORE',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'reconciliation', label: 'Reconciliation & Cash', icon: Coins, tag: 'Track 04' },
              { id: 'chat', label: 'AI Controller', icon: Bot, tag: 'AI' },
              { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
              { id: 'warroom', label: 'Decision War Room', icon: Scale },
            ],
          },
          {
            caption: 'INTELLIGENCE & RISK',
            items: [
              { id: 'researcher', label: 'Live Researcher', icon: Search, tag: 'LLM' },
              { id: 'risk', label: 'Risk Center', icon: ShieldAlert },
              { id: 'ledger', label: 'Decision Ledger', icon: BookOpen },
              { id: 'prediction', label: 'Prediction vs Reality', icon: History },
              { id: 'memory', label: 'AI Memory', icon: Database },
              { id: 'dna', label: 'Causal DNA Graph', icon: Activity },
              { id: 'data', label: 'Data Center', icon: HardDrive },
            ],
          },
        ];
    }
  };

  const sections = getNavSections();

  return (
    <aside className="fixed top-14 left-0 bottom-0 w-[220px] bg-[#121826] border-r border-[#232E42] z-40 flex flex-col justify-between overflow-y-auto p-3.5 select-none">
      <div className="space-y-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6A82] px-2.5">
              {section.caption}
            </h5>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabSelect(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                      isActive
                        ? 'bg-[#182234] text-[#E8A33D] font-semibold border border-[#E8A33D]/30 shadow-sm'
                        : 'text-[#8C99AF] hover:text-[#E9EDF4] hover:bg-[#182234]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        size={15}
                        className={
                          isActive
                            ? 'text-[#E8A33D]'
                            : 'text-[#5B6A82] group-hover:text-[#8C99AF] transition-colors'
                        }
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.tag && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-[#0B0F17] text-[#5B6A82] border border-[#232E42]">
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer / System Health Pill */}
      <div className="pt-4 border-t border-[#232E42] px-1 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#5B6A82]">
          <span>Security Protocol</span>
          <span className="text-[#3ADDA0]">Strict RBAC</span>
        </div>
        <p className="text-[10px] font-mono text-[#5B6A82] truncate">
          v2.4.0 · Local-First ML
        </p>
      </div>
    </aside>
  );
}
