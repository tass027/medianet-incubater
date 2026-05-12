// app/store/slices/authSlice.js
// ─────────────────────────────────────────────────────────────────
//  JWT + Refresh Token — Redux Toolkit slice
//
//  Stratégie :
//   • L'access token (15 min) est stocké en mémoire (Redux state).
//     Jamais dans localStorage → non accessible par XSS.
//   • Le refresh token (7 jours) est stocké dans un cookie HttpOnly
//     positionné par le serveur Express → non lisible par JS.
//   • À chaque rechargement de page, on appelle /auth/refresh pour
//     récupérer un nouvel access token silencieusement.
//   • Un intercepteur Axios (axiosAuth) injecte l'access token et
//     relance la requête si le serveur répond 401.
// ─────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

// ── Axios instance avec credentials (pour envoyer le cookie refresh) ──
export const axiosAuth = axios.create({
  baseURL: API,
  withCredentials: true,           // envoie les cookies HttpOnly
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────────────────────────
// Thunks
// ─────────────────────────────────────────────────────────────────

/** Connexion — reçoit { accessToken, user } ; le refreshToken est
 *  dans le cookie HttpOnly Set-Cookie du serveur. */
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/login', { email, password });
      // data = { accessToken: '...', user: { id, role, name, email } }
      return data;
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erreur de connexion.';
      return rejectWithValue(msg);
    }
  }
);

/** Inscription fondateur */
export const registerFounder = createAsyncThunk(
  'auth/registerFounder',
  async (payload, { rejectWithValue }) => {
    try {
      // payload contient FormData (pour le logo)
      const { data } = await axiosAuth.post('/auth/register/founder', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Inscription échouée.');
    }
  }
);

/** Inscription candidat */
export const registerApplicant = createAsyncThunk(
  'auth/registerApplicant',
  async (payload, { rejectWithValue }) => {
    try {
      // payload contient FormData (pour le CV)
      const { data } = await axiosAuth.post('/auth/register/applicant', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Inscription échouée.');
    }
  }
);

/** Refresh silencieux — appelé au démarrage de l'app (layout.jsx)
 *  Le serveur lit le cookie HttpOnly et retourne un nouvel accessToken. */
export const refreshTokens = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosAuth.post('/auth/refresh');
      // data = { accessToken: '...', user: { ... } }
      return data;
    } catch {
      return rejectWithValue(null); // session expirée, pas d'erreur visible
    }
  }
);

/** Déconnexion — révoque le refresh token côté serveur */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      await axiosAuth.post(
        '/auth/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // On déconnecte côté client même si le serveur échoue
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,   // { id, name, email, role }
    accessToken: null,   // JWT court (15 min) — en mémoire uniquement
    isLoading:   false,
    isRefreshing:false,  // refresh silencieux en cours
    error:       null,
  },

  reducers: {
    /** Injecter un accessToken manuellement (ex. après un refresh réussi) */
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {

    // ── login ──
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true; state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.isLoading  = false;
        state.accessToken = payload.accessToken;
        state.user        = payload.user;
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // ── registerFounder ──
    builder
      .addCase(registerFounder.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerFounder.fulfilled, (state) => { state.isLoading = false; })
      .addCase(registerFounder.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // ── registerApplicant ──
    builder
      .addCase(registerApplicant.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerApplicant.fulfilled, (state) => { state.isLoading = false; })
      .addCase(registerApplicant.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // ── refresh silencieux ──
    builder
      .addCase(refreshTokens.pending, (state) => { state.isRefreshing = true; })
      .addCase(refreshTokens.fulfilled, (state, { payload }) => {
        state.isRefreshing = false;
        if (payload) {
          state.accessToken = payload.accessToken;
          state.user        = payload.user;
        }
      })
      .addCase(refreshTokens.rejected, (state) => {
        state.isRefreshing = false;
        state.accessToken  = null;
        state.user         = null;
      });

    // ── logout ──
    builder
      .addCase(logout.fulfilled, (state) => {
        state.accessToken = null;
        state.user        = null;
        state.error       = null;
      });
  },
});

export const { setAccessToken, clearError } = authSlice.actions;
export default authSlice.reducer;

// ─────────────────────────────────────────────────────────────────
// Axios interceptor — auto-inject token + auto-refresh on 401
// À appeler UNE SEULE FOIS dans _app.jsx ou le store setup.
// ─────────────────────────────────────────────────────────────────
let store; // sera injecté via setupInterceptors()

export function setupInterceptors(reduxStore) {
  store = reduxStore;

  // 1. Inject access token dans chaque requête
  axiosAuth.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // 2. Si 401 → tenter un refresh puis rejouer la requête originale
  axiosAuth.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;

      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;

        try {
          const result = await store.dispatch(refreshTokens()).unwrap();
          if (result?.accessToken) {
            original.headers.Authorization = `Bearer ${result.accessToken}`;
            return axiosAuth(original); // rejoue la requête
          }
        } catch {
          // refresh échoué → forcer logout
          store.dispatch(logout());
          window.location.href = '/auth/login';
        }
      }

      return Promise.reject(error);
    }
  );
}