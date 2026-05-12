'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function useMentorSessions(filters = {}) {
  const { accessToken } = useSelector((state) => state.auth);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchSessions = useCallback(async () => {
    if (!accessToken) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.startupId) params.set('startupId', filters.startupId);
      if (filters.status)    params.set('status',    filters.status);
      if (filters.from)      params.set('from',      filters.from);
      if (filters.to)        params.set('to',        filters.to);

      const res = await fetch(`${API}/api/mentor/sessions?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters.startupId, filters.status, filters.from, filters.to]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (payload) => {
    const res = await fetch(`${API}/api/mentor/sessions`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Création échouée');
    }
    const data = await res.json();
    setSessions((prev) => [data.session, ...prev]);
    return data;
  };

  const updateSession = async (id, payload) => {
    const res = await fetch(`${API}/api/mentor/sessions/${id}`, {
      method: 'PUT',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Mise à jour échouée');
    }
    const data = await res.json();
    setSessions((prev) => prev.map((s) => (s._id === id ? data.session : s)));
    return data.session;
  };

  const deleteSession = async (id) => {
    const res = await fetch(`${API}/api/mentor/sessions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Suppression échouée');
    }
    setSessions((prev) => prev.filter((s) => s._id !== id));
  };

  return {
    sessions, loading, error,
    refetch: fetchSessions,
    createSession, updateSession, deleteSession,
  };
}