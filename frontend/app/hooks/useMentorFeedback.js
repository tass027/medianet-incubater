'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function useMentorFeedback(startupId = null) {
  const { accessToken } = useSelector((state) => state.auth);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchFeedbacks = useCallback(async () => {
    if (!accessToken) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Le hook accepte startupId en paramètre OU en query string
      // GET /api/mentor/feedback?startupId=xxx  (getAllFeedback)
      // GET /api/mentor/feedback/:startupId     (getFeedbackByStartup)
      const url = startupId
        ? `${API}/api/mentor/feedback/${startupId}`
        : `${API}/api/mentor/feedback`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
    } catch (err) {
      setError(err.message);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, startupId]);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  const submitFeedback = async (payload) => {
    const res = await fetch(`${API}/api/mentor/feedback`, {
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
    setFeedbacks((prev) => [data.feedback, ...prev]);
    return data.feedback;
  };

  return { feedbacks, loading, error, refetch: fetchFeedbacks, submitFeedback };
}