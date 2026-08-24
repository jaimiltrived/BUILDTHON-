import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api, ROLE_LABELS, type UserRole } from '../../lib/auth';
import {
  Users, Database, RefreshCw,
  CheckCircle, UserCheck, AlertCircle, Building2, UserPlus
} from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  organization_id: string | null;
}

const ROLES = ['CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR', 'ORG_ADMIN'];
const ROLE_COLOR: Record<string, string> = {
  CFO: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  BUSINESS_ANALYST: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  EXECUTIVE: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
  AUDITOR: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  ORG_ADMIN: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
};

export default function OrgAdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '', password: 'nova123', role: 'EXECUTIVE' });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users/');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!form.email) return;
    setCreating(true);
    setCreateMsg('');
    try {
      const res = await api.post('/api/users/', {
        email: form.email,
        password: form.password,
        full_name: form.full_name || null,
        role: form.role,
        organization_id: user?.organization_id,
      });
      setUsers(prev => [res.data, ...prev]);
      setForm({ email: '', full_name: '', password: 'nova123', role: 'EXECUTIVE' });
      setShowInvite(false);
      setCreateMsg('User created successfully.');
    } catch (e: any) {
      setCreateMsg(e?.response?.data?.detail || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (u: UserRow) => {
    try {
      await api.patch(`/api/users/${u.id}`, { is_active: !u.is_active });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Building2 size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                ORGANIZATION ADMINISTRATION
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/30 font-mono font-bold">
                Tenant Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Admin: <strong className="text-slate-200">{user?.full_name}</strong> · Manage Nova Commerce team seats and RBAC role assignments
            </p>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-orange-600/20 uppercase tracking-wider"
          >
            <UserPlus size={15} /> Invite Team Member
          </button>
        </div>

        {/* Invite Form Modal / Drawer */}
        {showInvite && (
          <div className="glass-card rounded-3xl p-6 space-y-4 border border-orange-500/40 shadow-2xl animate-in fade-in">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-300">Invite New Enterprise Seat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Work email address *"
                className="bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs outline-none focus:border-orange-500 transition-all font-medium"
              />
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Full name (e.g. Maya Iyer)"
                className="bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs outline-none focus:border-orange-500 transition-all font-medium"
              />
              <input
                type="text"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Initial temporary password"
                className="bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs outline-none focus:border-orange-500 transition-all font-medium"
              />
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs outline-none focus:border-orange-500 transition-all font-medium"
              >
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r as UserRole] || r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 items-center pt-1">
              <button
                onClick={inviteUser}
                disabled={creating}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-xl transition-all disabled:opacity-60 cursor-pointer uppercase tracking-wider"
              >
                {creating ? 'Provisioning...' : 'Provision User Seat'}
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              {createMsg && (
                <span className={`text-xs font-bold ${createMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {createMsg}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Telemetry Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Team Members Provisioned', value: users.length, color: 'text-orange-400' },
            { icon: UserCheck, label: 'Active Active Seats', value: users.filter(u => u.is_active).length, color: 'text-emerald-400' },
            { icon: Database, label: 'Grounded Records Ingested', value: '45,821', color: 'text-blue-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card rounded-3xl p-5 space-y-2 border border-slate-800/80">
              <div className={`flex items-center gap-2 ${color}`}>
                <Icon size={16} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
              </div>
              <p className={`text-3xl font-black ${color} font-metric`}>{value}</p>
            </div>
          ))}
        </div>

        {/* User table */}
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-950/60">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users size={14} className="text-orange-400" /> Active Organization Roster ({users.length})
            </h3>
            <button onClick={loadUsers} className="text-slate-400 hover:text-slate-200 transition-colors p-1" title="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading organizational roster…</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-all">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-200">
                      {(u.full_name || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-200">{u.full_name || '—'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${ROLE_COLOR[u.role] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {ROLE_LABELS[u.role as UserRole] || u.role}
                    </span>
                    <button
                      onClick={() => toggleActive(u)}
                      className="cursor-pointer p-1"
                      title={u.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {u.is_active
                        ? <CheckCircle size={17} className="text-emerald-400 hover:text-red-400 transition-colors" />
                        : <AlertCircle size={17} className="text-slate-600 hover:text-emerald-400 transition-colors" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
