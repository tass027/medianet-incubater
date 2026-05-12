// app/hooks/useStartup.js
'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyApplications } from '@/app/store/slices/startupSlice';

/**
 * Hook centralisé pour synchroniser les données startup.
 * À appeler dans les pages startup pour charger les candidatures
 * et calculer isFounder.
 */
export default function useStartup() {
  const dispatch = useDispatch();
  const startup  = useSelector(s => s.startup);
  const auth     = useSelector(s => s.auth);

  // isFounder peut venir du store startup OU du user Redux (login/refresh)
  const isFounder = startup.isFounder || auth.user?.isFounder || false;

  useEffect(() => {
    if (auth.accessToken && auth.user) {
      dispatch(fetchMyApplications());
    }
  }, [auth.accessToken, dispatch]);

  return {
    ...startup,
    isFounder,
    applications: startup.applications,
    loading:      startup.loading,
  };
}