import axios from 'axios';
import { store } from '@/app/store/store';

const axiosAuth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// ── Intercepteur REQUEST : injecte le token à chaque appel ──
axiosAuth.interceptors.request.use(
  (config) => {
    const token = store.getState().auth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Intercepteur RESPONSE ────────────────────────────────────
axiosAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      const is404AiReporting = error?.response?.status === 404 &&
        error?.config?.url?.includes('/ai-reporting/');
      if (!is404AiReporting) {
        console.error(
          `[axiosAuth] ${error?.response?.status ?? 'Network Error'} → ${error?.config?.url}`
        );
      }
    }
    return Promise.reject(error);
  }
);

export default axiosAuth;