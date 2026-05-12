// app/store/slices/startupSlice.js
'use client';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosAuth } from './authSlice';

// ── THUNKS ──────────────────────────────────────────
export const fetchMyApplications = createAsyncThunk(
  'startup/fetchApplications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      const { data } = await axiosAuth.get('/startup/applications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Erreur');
    }
  }
);

export const submitApplication = createAsyncThunk(
  'startup/submitApplication',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      const { data } = await axiosAuth.post('/startup/applications', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Erreur lors de la soumission');
    }
  }
);

export const fetchKPIs = createAsyncThunk(
  'startup/fetchKPIs',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      const { data } = await axiosAuth.get('/startup/kpis', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchMentoringData = createAsyncThunk(
  'startup/fetchMentoring',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      const { data } = await axiosAuth.get('/startup/mentoring', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchInvestorMatches = createAsyncThunk(
  'startup/fetchInvestors',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      const { data } = await axiosAuth.get('/startup/investors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const bookSession = createAsyncThunk(
  'startup/bookSession',
  async (sessionData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      const { data } = await axiosAuth.post('/startup/mentoring/sessions', sessionData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Erreur réservation');
    }
  }
);

// ── SLICE ───────────────────────────────────────────
const startupSlice = createSlice({
  name: 'startup',
  initialState: {
    applications:   [],
    isFounder:      false,
    kpis:           [],
    mentoring:      null,
    investors:      [],
    loading:        false,
    kpisLoading:    false,
    submitLoading:  false,
    error:          null,
    submitSuccess:  false,
    lastSubmitted:  null,
  },
  reducers: {
    clearError(state)        { state.error = null; },
    clearSubmitSuccess(state){ state.submitSuccess = false; state.lastSubmitted = null; },
    setIsFounder(state, { payload }) { state.isFounder = payload; },
  },
  extraReducers: (builder) => {
    // fetchMyApplications
    builder
      .addCase(fetchMyApplications.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyApplications.fulfilled, (state, { payload }) => {
        state.loading      = false;
        state.applications = payload.applications ?? [];
        state.isFounder    = payload.isFounder    ?? false;
      })
      .addCase(fetchMyApplications.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // submitApplication
    builder
      .addCase(submitApplication.pending,   (state) => { state.submitLoading = true; state.error = null; state.submitSuccess = false; })
      .addCase(submitApplication.fulfilled, (state, { payload }) => {
        state.submitLoading = false;
        state.submitSuccess = true;
        state.lastSubmitted = payload.application;
        state.isFounder     = payload.isFounder ?? state.isFounder;
        if (payload.application) {
          state.applications.push(payload.application);
        }
      })
      .addCase(submitApplication.rejected,  (state, { payload }) => {
        state.submitLoading = false;
        state.error         = payload;
      });

    // fetchKPIs
    builder
      .addCase(fetchKPIs.pending,   (state) => { state.kpisLoading = true; })
      .addCase(fetchKPIs.fulfilled, (state, { payload }) => {
        state.kpisLoading = false;
        state.kpis        = payload.kpis ?? [];
        state.isFounder   = payload.isFounder ?? state.isFounder;
      })
      .addCase(fetchKPIs.rejected,  (state, { payload }) => {
        state.kpisLoading = false;
        // 403 NOT_FOUNDER → isFounder = false
        if (payload?.code === 'NOT_FOUNDER') state.isFounder = false;
      });

    // fetchMentoringData
    builder
      .addCase(fetchMentoringData.fulfilled, (state, { payload }) => {
        state.mentoring = payload;
        state.isFounder = payload.isFounder ?? state.isFounder;
      })
      .addCase(fetchMentoringData.rejected, (state, { payload }) => {
        if (payload?.code === 'NOT_FOUNDER') state.isFounder = false;
      });

    // fetchInvestorMatches
    builder
      .addCase(fetchInvestorMatches.fulfilled, (state, { payload }) => {
        state.investors = payload.investors ?? [];
        state.isFounder = payload.isFounder ?? state.isFounder;
      })
      .addCase(fetchInvestorMatches.rejected, (state, { payload }) => {
        if (payload?.code === 'NOT_FOUNDER') state.isFounder = false;
      });

    // bookSession
    builder
      .addCase(bookSession.fulfilled, (state, { payload }) => {
        if (state.mentoring) {
          state.mentoring.sessions = [...(state.mentoring.sessions ?? []), payload.session];
        }
      });
  },
});

export const { clearError, clearSubmitSuccess, setIsFounder } = startupSlice.actions;
export default startupSlice.reducer;