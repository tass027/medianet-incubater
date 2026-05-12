import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import startupReducer from './slices/startupSlice';
import applicationReducer from './slices/applicationSlice';
import { setupInterceptors } from './slices/authSlice'; // ← importer setupInterceptors
import aiScoringReducer from './slices/aiScoringSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      startup: startupReducer,
      application: applicationReducer,
      aiScoring: aiScoringReducer,
    },
  });
};

export const store = makeStore();

setupInterceptors(store); // ← appeler avec le store