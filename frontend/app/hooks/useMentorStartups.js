'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function useMentorStartups() {
  const { accessToken } = useSelector((state) => state.auth);
  const [startups, setStartups] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchStartups = useCallback(async () => {
    if (!accessToken) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/mentor/startups`, {
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      setStartups(data.startups || []);
    } catch (err) {
      setError(err.message);
      setStartups([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

  return { startups, loading, error, refetch: fetchStartups };
}