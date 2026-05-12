import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  export const triggerAiScore = createAsyncThunk(
    'aiScoring/trigger',
    async (applicationId, { getState, rejectWithValue }) => {
      try {
        const { auth } = getState();
        // ✅ Fix : ton store utilise accessToken
        const token = auth.accessToken || auth.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.post(
          `${API}/ai-scoring/trigger/${applicationId}`, {}, config
        );
        return { applicationId, ...data };
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Erreur');
      }
    }
  );

  export const fetchAiScore = createAsyncThunk(
    'aiScoring/fetch',
    async (applicationId, { getState, rejectWithValue }) => {
      try {
        const { auth } = getState();
        // ✅ Fix : ton store utilise accessToken
        const token = auth.accessToken || auth.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(
          `${API}/ai-scoring/${applicationId}`, config
        );
        return { applicationId, ...data };
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Erreur');
      }
    }
  );

const aiScoringSlice = createSlice({
  name: 'aiScoring',
  initialState: {
    scores: {},      // { [applicationId]: scoreData }
    loading: {},     // { [applicationId]: true/false }
    error: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // trigger
      .addCase(triggerAiScore.pending, (state, action) => {
        state.loading[action.meta.arg] = true;
      })
      .addCase(triggerAiScore.fulfilled, (state, action) => {
        state.loading[action.payload.applicationId] = false;
        state.scores[action.payload.applicationId] = { status: 'pending' };
      })
      .addCase(triggerAiScore.rejected, (state, action) => {
        state.loading[action.meta.arg] = false;
        state.error[action.meta.arg] = action.payload;
      })
      // fetch
      .addCase(fetchAiScore.pending, (state, action) => {
        state.loading[action.meta.arg] = true;
      })
      .addCase(fetchAiScore.fulfilled, (state, action) => {
        state.loading[action.payload.applicationId] = false;
        state.scores[action.payload.applicationId] = action.payload;
      })
      .addCase(fetchAiScore.rejected, (state, action) => {
        state.loading[action.meta.arg] = false;
      });
  },
});

export default aiScoringSlice.reducer;