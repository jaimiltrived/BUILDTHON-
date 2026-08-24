import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { type UserRole } from './lib/auth';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import CommandPalette from './components/CommandPalette';

// Pages
import DashboardPage from './components/pages/DashboardPage';
import AIControllerPage from './components/pages/AIControllerPage';
import SimulatorPage from './components/pages/SimulatorPage';
import WarRoomPage from './components/pages/WarRoomPage';
import RiskCenterPage from './components/pages/RiskCenterPage';
import DecisionLedgerPage from './components/pages/DecisionLedgerPage';
import PredictionVsRealityPage from './components/pages/PredictionVsRealityPage';
import AIMemoryPage from './components/pages/AIMemoryPage';
import AuditCenterPage from './components/pages/AuditCenterPage';
import { OrganizationsView, UsersView, AIInfraView, SettingsView } from './components/pages/AdminPages';
import FinancialGraph from './components/FinancialGraph';
import DataCenter from './components/DataCenter';
import ResearcherPage from './components/pages/ResearcherPage';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider onTabChange={setActiveTab}>
        <AppAuthGate activeTab={activeTab} setActiveTab={setActiveTab} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppAuthGate({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (!isAuthenticated || !user) {
    if (!showLogin) {
      return <LandingPage onEnter={() => setShowLogin(true)} />;
    }
    return <LoginPage />;
  }

  return <AppInner activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function AppInner({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) {
  const { user } = useAuth();
  const role = (user?.role || 'CFO') as UserRole;

  // Handle role default routes
  useEffect(() => {
    if (role === 'AUDITOR' && activeTab === 'dashboard') {
      setActiveTab('audit');
    }
  }, [role]);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === 'AUDITOR') {
      setActiveTab('audit');
    } else {
      setActiveTab('dashboard');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'chat':
        return <AIControllerPage onNavigate={setActiveTab} />;
      case 'researcher':
        return <ResearcherPage />;
      case 'simulator':
        return <SimulatorPage onNavigate={setActiveTab} />;
      case 'warroom':
        return <WarRoomPage onNavigate={setActiveTab} />;
      case 'risk':
        return <RiskCenterPage />;
      case 'ledger':
        return (
          <DecisionLedgerPage
            onSimulateAgain={() => {
              setActiveTab('simulator');
            }}
          />
        );
      case 'prediction':
        return <PredictionVsRealityPage />;
      case 'memory':
        return <AIMemoryPage />;
      case 'audit':
        return <AuditCenterPage />;
      case 'dna':
        return <FinancialGraph />;
      case 'data':
        return <DataCenter />;
      case 'organizations':
        return <OrganizationsView />;
      case 'users':
        return <UsersView />;
      case 'ai-infra':
        return <AIInfraView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E9EDF4] font-sans selection:bg-[#E8A33D]/20 selection:text-[#E8A33D]">
      <CommandPalette onNavigate={(tab) => setActiveTab(tab)} />
      
      {/* Fixed 56px Topbar */}
      <TopBar onRoleChange={handleRoleChange} />

      {/* Fixed ~220px Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabSelect={setActiveTab} />

      {/* Main Content Area (Independent scroll, padding to clear fixed bars) */}
      <main className="pl-[220px] pt-14 min-h-screen bg-[#0B0F17]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
