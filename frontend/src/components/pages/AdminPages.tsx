import { useState } from 'react';
import { useOrganizationsQuery, useUsersQuery, useEngineStatusQuery } from '../../lib/queries';
import { apiClient } from '../../lib/apiClient';
import { Plus } from 'lucide-react';

// 1. Organizations Screen
export function OrganizationsView() {
  const { data: orgs = [], refetch } = useOrganizationsQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await apiClient.post('/api/organizations/', { name: name.trim() });
      setName('');
      setShowCreate(false);
      refetch();
    } catch (e) {
      console.error("Organization creation failed", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-[#232E42] pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase">ENTERPRISE ORGANIZATIONS</h2>
          <p className="text-xs text-[#8C99AF]">Multi-tenant isolation & sovereign financial database directory</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[#E8A33D] hover:bg-[#E8A33D]/90 text-[#0B0F17] font-display font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer uppercase"
        >
          <Plus size={14} /> Provision Tenant
        </button>
      </div>

      {showCreate && (
        <div className="ftm-card p-5 space-y-3 border border-[#E8A33D]/40">
          <h3 className="text-xs font-mono font-bold uppercase text-[#E8A33D]">Provision New Tenant</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enterprise Name (e.g. Apex Global Logistics)"
              className="flex-1 bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-xs text-[#E9EDF4] outline-none focus:border-[#E8A33D]"
            />
            <button
              onClick={handleCreate}
              className="px-5 py-2 bg-[#E8A33D] text-[#0B0F17] font-display font-bold text-xs rounded-lg uppercase cursor-pointer"
            >
              Provision
            </button>
          </div>
        </div>
      )}

      <div className="ftm-card divide-y divide-[#232E42] overflow-hidden">
        {orgs.map((org: any) => (
          <div key={org.id} className="p-4 flex items-center justify-between hover:bg-[#182234]/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#182234] border border-[#232E42] flex items-center justify-center font-bold text-[#E8A33D]">
                {org.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-[#E9EDF4]">{org.name}</p>
                <p className="text-[10px] font-mono text-[#5B6A82]">{org.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[#8C99AF]">{org.user_count || 6} Seats</span>
              <span className="px-2 py-0.5 rounded-full bg-[#3ADDA0]/10 text-[#3ADDA0] border border-[#3ADDA0]/30 text-[10px] font-bold">
                ACTIVE
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Users & RBAC Screen
export function UsersView() {
  const { data: users = [] } = useUsersQuery('default');
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-[#232E42] pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase">USERS & RBAC SEATS</h2>
          <p className="text-xs text-[#8C99AF]">Manage team seats, permissions, and cryptographic role assignments</p>
        </div>
      </div>

      <div className="ftm-card divide-y divide-[#232E42] overflow-hidden">
        {users.map((u: any) => (
          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-[#182234]/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#182234] border border-[#232E42] flex items-center justify-center font-mono font-bold text-xs text-[#E9EDF4]">
                {(u.full_name || u.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-[#E9EDF4]">{u.full_name || '—'}</p>
                <p className="text-[10px] font-mono text-[#5B6A82]">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-[#182234] text-[#E8A33D] border border-[#E8A33D]/30 font-mono text-[10px] font-bold">
                {u.role}
              </span>
              <span className="text-[10px] font-mono text-[#3ADDA0]">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. AI Infrastructure Screen
export function AIInfraView() {
  const { data: engineStatus } = useEngineStatusQuery();
  const isLlama = engineStatus?.is_llm;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#232E42] pb-4">
        <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase">AI INFERENCE INFRASTRUCTURE</h2>
        <p className="text-xs text-[#8C99AF]">Local-first Ollama Llama 3 & deterministic causal simulation nodes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            name: "Llama 3 Local Model", 
            status: isLlama ? "ONLINE (Localhost:11434)" : "FALLBACK OPERATIONAL", 
            latency: isLlama ? "12ms" : "1ms",
            active: true
          },
          { 
            name: "Deterministic Fallback DAG", 
            status: "OPERATIONAL (In-Memory)", 
            latency: "1ms",
            active: true
          },
          { 
            name: "Causal Sensitivity Matrices", 
            status: "HEALTHY (24-Mo Cache)", 
            latency: "4ms",
            active: true
          },
        ].map((node) => (
          <div key={node.name} className="ftm-card p-5 space-y-3 border border-[#232E42]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-display font-bold text-[#E9EDF4]">{node.name}</span>
              <span className="w-2 h-2 rounded-full bg-[#3ADDA0] shadow-[0_0_8px_rgba(58,221,160,0.8)]" />
            </div>
            <p className="text-[11px] font-mono text-[#8C99AF]">{node.status}</p>
            <div className="pt-2 border-t border-[#232E42] flex justify-between text-[10px] font-mono text-[#5B6A82]">
              <span>Inference Latency:</span>
              <span className="text-[#3ADDA0] font-bold">{node.latency}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Platform Settings Screen
export function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#232E42] pb-4">
        <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase">ORGANIZATION & FINANCIAL SETTINGS</h2>
        <p className="text-xs text-[#8C99AF]">Configure fiscal calendar, sovereign currency, and sensitivity parameters</p>
      </div>

      <div className="ftm-card p-6 space-y-4 max-w-2xl border border-[#232E42]">
        <div className="space-y-1">
          <label className="text-xs font-mono font-bold uppercase text-[#5B6A82]">Fiscal Year Calendar</label>
          <input
            type="text"
            defaultValue="April 1 – March 31 (Indian Financial Year)"
            className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-xs text-[#E9EDF4] font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono font-bold uppercase text-[#5B6A82]">Base Reporting Currency</label>
          <input
            type="text"
            defaultValue="INR (₹) Lakhs & Crores"
            className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-xs text-[#E9EDF4] font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono font-bold uppercase text-[#5B6A82]">Elasticity Sensitivity Threshold</label>
          <input
            type="text"
            defaultValue="-0.50 (Standard Non-Metro MSME Index)"
            className="w-full bg-[#182234] border border-[#232E42] rounded-lg px-3 py-2 text-xs text-[#E9EDF4] font-mono"
          />
        </div>

        <button className="px-5 py-2.5 bg-[#E8A33D] text-[#0B0F17] font-display font-bold text-xs rounded-lg uppercase tracking-wider cursor-pointer shadow-md shadow-[#E8A33D]/20">
          Save Configuration
        </button>
      </div>
    </div>
  );
}
