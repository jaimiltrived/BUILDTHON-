import axios, { type AxiosRequestConfig } from 'axios';
import { clearAuth } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 90000, // accommodate local LLaMA 3 GPU inference
});

// ── Request interceptor: attach Bearer token ─────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  let token: string | null = null;
  try {
    const raw = localStorage.getItem('ftm_auth');
    if (raw) token = JSON.parse(raw)?.token ?? null;
  } catch {
    // ignore
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-logout on 401 ─────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is expired / invalid — clear stored credentials and reload to
      // surface the login page via the AuthProvider's isAuthenticated check.
      clearAuth();
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

// Real-Time Direct API Client
export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await axiosInstance.get<T>(url, config);
    return res.data;
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await axiosInstance.post<T>(url, data, config);
    return res.data;
  },

  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await axiosInstance.patch<T>(url, data, config);
    return res.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await axiosInstance.delete<T>(url, config);
    return res.data;
  },
};
