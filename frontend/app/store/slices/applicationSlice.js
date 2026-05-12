import { createSlice } from '@reduxjs/toolkit';

const applicationSlice = createSlice({
  name: 'application',
  initialState: {
    applications: [],
    currentApplication: null,
    loading: false,
    error: null,
  },
  reducers: {
    setApplications: (state, action) => {
      state.applications = action.payload;
    },
    setCurrentApplication: (state, action) => {
      state.currentApplication = action.payload;
    },
    clearCurrentApplication: (state) => {
      state.currentApplication = null;
    },
    addApplication: (state, action) => {
      state.applications.push(action.payload);
    },
  },
});

export const { 
  setApplications, 
  setCurrentApplication, 
  clearCurrentApplication,
  addApplication 
} = applicationSlice.actions;

export default applicationSlice.reducer;