import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export const axiosAuth = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const normalizeRole = (role) => {
  if (role === 'founder' || role === 'applicant') return 'startup';
  return role;
};

const normalizeUser = (user) => {
  if (!user) return null;
  return { ...user, role: normalizeRole(user.role) };
};

// ── localStorage helpers ──────────────────────────────────────────────────────
const storage = {
  get: (key) => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(key) || null; } catch { return null; }
  },
  set: (key, value) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, value); } catch {}
  },
  remove: (key) => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(key); } catch {}
  },
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/login', { email, password });
      return { ...data, user: normalizeUser(data.user) };
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message ?? 'Erreur de connexion.';
      if (status === 429) return rejectWithValue({ message, isRateLimit: true });
      return rejectWithValue({ message, isRateLimit: false });
    }
  }
);

export const registerStartup = createAsyncThunk(
  'auth/registerStartup',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/register/startup', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Inscription échouée.');
    }
  }
);

export const registerFounder = createAsyncThunk(
  'auth/registerFounder',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/register/startup', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data ?? 'Inscription échouée.');
    }
  }
);

export const registerApplicant = createAsyncThunk(
  'auth/registerApplicant',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/register/applicant', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Inscription échouée.');
    }
  }
);

export const refreshTokens = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/refresh');
      return { ...data, user: normalizeUser(data.user) };
    } catch (err) {
      if (err.response?.status === 429) return rejectWithValue({ isRateLimit: true });
      return rejectWithValue(null);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const token = getState().auth.accessToken;
      await axiosAuth.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/forgot-password', { email });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Erreur.');
    }
  }
);

export const verifyCode = createAsyncThunk(
  'auth/verifyCode',
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/verify-code', { email, code });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Code incorrect.');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, resetToken, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/reset-password', { email, resetToken, newPassword });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Erreur.');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ token, email }, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.get(`/auth/verify-email?token=${token}&email=${email}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Lien invalide.');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:         null,
    accessToken:  storage.get('accessToken'),
    isLoading:    false,
    isRefreshing: false,
    error:        null,
    isRateLimit:  false,
    resetToken:   null,
    message:      null,
  },

  reducers: {
    setAccessToken(state, action) {
      state.accessToken = action.payload;
      storage.set('accessToken', action.payload);
    },
    clearError(state) {
      state.error = null;
      state.isRateLimit = false;
    },
    clearMessage(state) {
      state.message = null;
    },
  },

  extraReducers: (builder) => {

    // ── login ──────────────────────────────────────────────────────────────
    builder
      .addCase(login.pending, (state) => {
        state.isLoading   = true;
        state.error       = null;
        state.isRateLimit = false;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.isLoading   = false;
        state.accessToken = payload.accessToken;
        state.user        = payload.user;
        state.isRateLimit = false;
        storage.set('accessToken', payload.accessToken);
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.isLoading   = false;
        state.isRateLimit = payload?.isRateLimit ?? false;
        state.error       = payload?.message ?? 'Erreur de connexion.';
      });

    // ── registerStartup ────────────────────────────────────────────────────
    builder
      .addCase(registerStartup.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerStartup.fulfilled, (state, { payload }) => { state.isLoading = false; state.message = payload.message; })
      .addCase(registerStartup.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // ── registerFounder ────────────────────────────────────────────────────
    builder
      .addCase(registerFounder.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerFounder.fulfilled, (state, { payload }) => { state.isLoading = false; state.message = payload.message; })
      .addCase(registerFounder.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // ── registerApplicant ──────────────────────────────────────────────────
    builder
      .addCase(registerApplicant.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerApplicant.fulfilled, (state, { payload }) => { state.isLoading = false; state.message = payload.message; })
      .addCase(registerApplicant.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // ── refreshTokens ──────────────────────────────────────────────────────
    builder
      .addCase(refreshTokens.pending, (state) => {
        state.isRefreshing = true;
      })
      .addCase(refreshTokens.fulfilled, (state, { payload }) => {
        state.isRefreshing = false;
        if (payload) {
          state.accessToken = payload.accessToken;
          state.user        = payload.user;
          storage.set('accessToken', payload.accessToken);
        }
        state.isRateLimit = false;
      })
      .addCase(refreshTokens.rejected, (state, { payload }) => {
        state.isRefreshing = false;
        if (payload?.isRateLimit) {
          state.isRateLimit = true;
        } else {
          state.accessToken = null;
          state.user        = null;
          state.isRateLimit = false;
          storage.remove('accessToken');
        }
      });

    // ── logout ─────────────────────────────────────────────────────────────
    builder.addCase(logout.fulfilled, (state) => {
      state.accessToken = null;
      state.user        = null;
      state.error       = null;
      state.resetToken  = null;
      state.isRateLimit = false;
      storage.remove('accessToken');
    });

    // ── forgotPassword ─────────────────────────────────────────────────────
    builder
      .addCase(forgotPassword.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(forgotPassword.fulfilled, (state, { payload }) => { state.isLoading = false; state.message = payload.message; })
      .addCase(forgotPassword.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // ── verifyCode ─────────────────────────────────────────────────────────
    builder
      .addCase(verifyCode.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyCode.fulfilled, (state, { payload }) => { state.isLoading = false; state.resetToken = payload.resetToken; state.message = payload.message; })
      .addCase(verifyCode.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // ── resetPassword ──────────────────────────────────────────────────────
    builder
      .addCase(resetPassword.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(resetPassword.fulfilled, (state, { payload }) => { state.isLoading = false; state.resetToken = null; state.message = payload.message; })
      .addCase(resetPassword.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // ── verifyEmail ────────────────────────────────────────────────────────
    builder
      .addCase(verifyEmail.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyEmail.fulfilled, (state, { payload }) => { state.isLoading = false; state.message = payload.message; })
      .addCase(verifyEmail.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { setAccessToken, clearError, clearMessage } = authSlice.actions;
export default authSlice.reducer;

// ── Interceptors ──────────────────────────────────────────────────────────────
let store;
let refreshPromise = null;

export function setupInterceptors(reduxStore) {
  store = reduxStore;

  axiosAuth.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  axiosAuth.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;

      if (error.response?.status === 429) {
        return Promise.reject(error);
      }

      // ✅ FIX: Ne pas intercepter les erreurs 401 des routes auth
      // Sinon le login bloque indéfiniment en essayant de refresh
      const isAuthRoute =
        original.url?.includes('/auth/login') ||
        original.url?.includes('/auth/refresh') ||
        original.url?.includes('/auth/register') ||
        original.url?.includes('/auth/forgot-password') ||
        original.url?.includes('/auth/reset-password') ||
        original.url?.includes('/auth/verify');

      if (error.response?.status === 401 && isAuthRoute) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;

        if (!refreshPromise) {
          refreshPromise = store.dispatch(refreshTokens()).unwrap();
        }

        try {
          const result = await refreshPromise;
          refreshPromise = null;
          if (result?.accessToken) {
            original.headers.Authorization = `Bearer ${result.accessToken}`;
            return axiosAuth(original);
          }
        } catch (refreshError) {
          refreshPromise = null;

          if (refreshError?.isRateLimit) {
            return Promise.reject(error);
          }

          store.dispatch(logout());

          const pathname = window.location.pathname;
          if (
            pathname.startsWith('/dashboard/admin') ||
            pathname.startsWith('/dashboard/mentor') ||
            pathname.startsWith('/auth/internal-login') ||
            pathname === '/internal/login'
          ) {
            window.location.href = '/internal/login';
          } else if (
            pathname.startsWith('/dashboard/startup') ||
            pathname.startsWith('/dashboard/founder') ||
            pathname.startsWith('/dashboard/applicant') ||
            pathname === '/login'
          ) {
            window.location.href = '/login';
          } else {
            window.location.href = '/';
          }
        }
      }
      return Promise.reject(error);
    }
  );
}