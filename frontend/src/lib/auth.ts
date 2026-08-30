import axios from 'axios';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'CFO'
  | 'BUSINESS_ANALYST'
  | 'EXECUTIVE'
  | 'AUDITOR';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id: string | null;
}

const AUTH_KEY = 'ftm_auth';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export function saveAuth(token: string, refreshToken: string | null, user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, refreshToken, user }));
}

export function getStoredAuth(): { token: string; refreshToken?: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

// Axios instance — auto-injects Bearer token from localStorage
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = getStoredAuth();
  if (stored?.token) {
    config.headers.Authorization = `Bearer ${stored.token}`;
  }
  return config;
});

// Role hierarchy helpers
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Org Admin',
  CFO: 'CFO / Finance Manager',
  BUSINESS_ANALYST: 'Business Analyst',
  EXECUTIVE: 'Executive',
  AUDITOR: 'Auditor',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'text-red-400 bg-red-500/10 border-red-500/30',
  ORG_ADMIN: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  CFO: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  BUSINESS_ANALYST: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  EXECUTIVE: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  AUDITOR: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

export function canAccess(role: UserRole, feature: string): boolean {
  const permissions: Record<string, UserRole[]> = {
    simulator: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    warroom: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    ledger: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    dna: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    prediction: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    memory: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    chat: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    risk: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    data: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST'],
    users: ['SUPER_ADMIN', 'ORG_ADMIN'],
    superadmin: ['SUPER_ADMIN'],
    orgadmin: ['ORG_ADMIN'],
    executive: ['EXECUTIVE'],
    audit: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    reconciliation: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST', 'EXECUTIVE', 'AUDITOR'],
    // Actions
    can_approve: ['CFO', 'EXECUTIVE'],
    can_simulate: ['SUPER_ADMIN', 'ORG_ADMIN', 'CFO', 'BUSINESS_ANALYST'],
    can_log_decision: ['CFO', 'BUSINESS_ANALYST', 'EXECUTIVE'],
  };
  return permissions[feature]?.includes(role) ?? false;
}

/**
 * Maps a role to the tab key that actually exists in App.tsx routing.
 * SUPER_ADMIN and ORG_ADMIN land on the admin tab that's relevant to them.
 */
export function getDefaultTab(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'organizations'; // Maps to <OrganizationsView />
    case 'ORG_ADMIN':
      return 'users';         // Maps to <UsersView />
    case 'EXECUTIVE':
      return 'dashboard';
    case 'AUDITOR':
      return 'audit';
    default:
      return 'simulator';
  }
}
