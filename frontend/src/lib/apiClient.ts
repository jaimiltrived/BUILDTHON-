import axios, { type AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 90000, // accommodate local LLaMA 3 GPU inference
});

axiosInstance.interceptors.request.use((config) => {
  let token = localStorage.getItem('ftm_token');
  if (!token) {
    try {
      const raw = localStorage.getItem('ftm_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.token || null;
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Real-Time Direct API Client
export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await axiosInstance.get<T>(url, config);
    return res.data;
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const res = await axiosInstance.post<T>(url, data, config);
    return res.data;
  },

  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const res = await axiosInstance.patch<T>(url, data, config);
    return res.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await axiosInstance.delete<T>(url, config);
    return res.data;
  },
};
