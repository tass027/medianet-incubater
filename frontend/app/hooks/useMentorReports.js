'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function useMentorReports(startupId = null) {
  const { accessToken } = useSelector((state) => state.auth);
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchReports = useCallback(async () => {
    if (!accessToken) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = startupId ? `?startupId=${startupId}` : '';
      const res = await fetch(`${API}/api/mentor/reports${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, startupId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const submitReport = async (payload) => {
    const res = await fetch(`${API}/api/mentor/reports`, {
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
      throw new Error(body.message || 'Envoi échoué');
    }
    const data = await res.json();
    setReports((prev) => {
      const idx = prev.findIndex((r) => r._id === data.report._id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = data.report;
        return updated;
      }
      return [data.report, ...prev];
    });
    return data.report;
  };

  return { reports, loading, error, refetch: fetchReports, submitReport };
}