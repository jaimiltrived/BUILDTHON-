import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import axios from 'axios';
import {
  type AuthUser,
  type UserRole,
  saveAuth,
  clearAuth,
  getStoredAuth,
  getDefaultTab,
} from '../lib/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export interface RegisterParams {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
  organization_id?: string;
}

export interface OTPVerifyParams {
  email: string;
  otp: string;
  password: string;
  full_name?: string;
  role?: UserRole;
  organization_id?: string;
}

export interface OTPResponseData {
  message: string;
  expires_in_seconds: number;
  cooldown_seconds: number;
  dev_otp?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ defaultTab: string }>;
  register: (params: RegisterParams) => Promise<{ defaultTab: string }>;
  requestOtp: (email: string, phone?: string) => Promise<OTPResponseData>;
  resendOtp: (email: string, phone?: string) => Promise<OTPResponseData>;
  verifyOtpAndRegister: (params: OTPVerifyParams) => Promise<{ defaultTab: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children, onTabChange }: { children: ReactNode; onTabChange?: (tab: string) => void }) {
  const stored = getStoredAuth();
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [token, setToken] = useState<string | null>(stored?.token ?? null);

  const login = useCallback(async (email: string, password: string): Promise<{ defaultTab: string }> => {
    // FastAPI OAuth2 form-encoded login
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const res = await axios.post(`${API_BASE}/api/auth/login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token, user: userData } = res.data;
    const authUser: AuthUser = {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      organization_id: userData.organization_id,
    };

    saveAuth(access_token, refresh_token ?? null, authUser);
    setToken(access_token);
    setUser(authUser);

    const defaultTab = getDefaultTab(authUser.role);
    onTabChange?.(defaultTab);
    return { defaultTab };
  }, [onTabChange]);

  const register = useCallback(async (params: RegisterParams): Promise<{ defaultTab: string }> => {
    await axios.post(`${API_BASE}/api/auth/register`, {
      email: params.email,
      password: params.password,
      full_name: params.full_name || params.email.split('@')[0],
      role: params.role || 'CFO',
      organization_id: params.organization_id || null,
    });
    return await login(params.email, params.password);
  }, [login]);

  const requestOtp = useCallback(async (email: string, phone?: string): Promise<OTPResponseData> => {
    const res = await axios.post(`${API_BASE}/api/auth/register/request-otp`, {
      email,
      phone: phone || null,
    });
    return res.data;
  }, []);

  const resendOtp = useCallback(async (email: string, phone?: string): Promise<OTPResponseData> => {
    const res = await axios.post(`${API_BASE}/api/auth/register/resend-otp`, {
      email,
      phone: phone || null,
    });
    return res.data;
  }, []);

  const verifyOtpAndRegister = useCallback(async (params: OTPVerifyParams): Promise<{ defaultTab: string }> => {
    const res = await axios.post(`${API_BASE}/api/auth/register/verify-otp`, {
      email: params.email,
      otp: params.otp,
      password: params.password,
      full_name: params.full_name || params.email.split('@')[0],
      role: params.role || 'CFO',
      organization_id: params.organization_id || null,
    });

    const { access_token, refresh_token, user: userData } = res.data;
    const authUser: AuthUser = {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      organization_id: userData.organization_id,
    };

    saveAuth(access_token, refresh_token ?? null, authUser);
    setToken(access_token);
    setUser(authUser);

    const defaultTab = getDefaultTab(authUser.role);
    onTabChange?.(defaultTab);
    return { defaultTab };
  }, [onTabChange]);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const switchRole = useCallback((newRole: UserRole) => {
    setUser((prev) => {
      const updatedUser: AuthUser = prev
        ? { ...prev, role: newRole }
        : {
            id: 'demo-user',
            email: 'demo@fluidmoney.ai',
            full_name: 'Demo User',
            role: newRole,
            organization_id: 'default-org',
          };
      const currentToken = token || 'demo-token';
      saveAuth(currentToken, null, updatedUser);
      return updatedUser;
    });
    const defaultTab = getDefaultTab(newRole);
    onTabChange?.(defaultTab);
  }, [token, onTabChange]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, requestOtp, resendOtp, verifyOtpAndRegister, logout, switchRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
