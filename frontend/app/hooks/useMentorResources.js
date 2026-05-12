'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function useMentorResources(startupId = null) {
  const { accessToken } = useSelector((state) => state.auth);
  const [resources, setResources] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchResources = useCallback(async () => {
    if (!accessToken) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = startupId ? `?startupId=${startupId}` : '';
      const res = await fetch(`${API}/api/mentor/resources${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setResources(data.resources || []);
    } catch (err) {
      setError(err.message);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, startupId]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const createResource = async (payload) => {
    const res = await fetch(`${API}/api/mentor/resources`, {
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
    setResources((prev) => [data.resource, ...prev]);
    return data.resource;
  };

  const deleteResource = async (id) => {
    const res = await fetch(`${API}/api/mentor/resources/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Suppression échouée');
    }
    setResources((prev) => prev.filter((r) => r._id !== id));
  };

  return {
    resources, loading, error,
    refetch: fetchResources,
    createResource, deleteResource,
  };
}