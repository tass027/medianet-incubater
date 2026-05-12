// app/hooks/useSessions.js
/**
 * useSessions — fetch & manage sessions from the backend
 *
 * Usage:
 *   const { sessions, loading, error, refetch, createSession, deleteSession } = useSessions({ type, status });
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSessions({ type = 'all', status = 'all', startupId, mentorId } = {}) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (type      && type     !== 'all') params.set('type',      type);
    if (status    && status   !== 'all') params.set('status',    status);
    if (startupId) params.set('startupId', startupId);
    if (mentorId)  params.set('mentorId',  mentorId);
    const qs = params.toString();
    return `/api/admin/sessions${qs ? `?${qs}` : ''}`;
  }, [type, status, startupId, mentorId]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(buildUrl(), { credentials: 'include' });
      const json = await res.json();
      if (json.success) setSessions(json.data || []);
      else setError(json.message || 'Erreur chargement sessions');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (data) => {
    const isMentoring = data.type === 'mentoring' || data.type === 'one2one';
    const endpoint    = isMentoring
      ? '/api/admin/mentoring-sessions'
      : '/api/admin/sessions';

    const res  = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Erreur création session');
    setSessions(prev => [json.data, ...prev]);
    return json.data;
  };

  const deleteSession = async (id) => {
    await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE', credentials: 'include' });
    setSessions(prev => prev.filter(s => (s._id || s.id) !== id));
  };

  const updateSession = async (id, patch) => {
    const res  = await fetch(`/api/admin/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Erreur mise à jour');
    setSessions(prev => prev.map(s => (s._id || s.id) === id ? json.data : s));
    return json.data;
  };

  return { sessions, loading, error, refetch: fetchSessions, createSession, deleteSession, updateSession };
}

// ── Mentor hook (for mentor dashboard) ───────────────────────────────────────
export function useMentorSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/mentor/sessions', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setSessions(json.data || []);
      else setError(json.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const submitDecision = async (sessionId, decision, note = '') => {
    const res  = await fetch(`/api/mentor/sessions/${sessionId}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ decision, note }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    setSessions(prev => prev.map(s => (s._id || s.id) === sessionId ? json.data : s));
    return json.data;
  };

  return { sessions, loading, error, refetch: fetch_, submitDecision };
}