// app/hooks/useProgrammes.js
'use client';

import { useState, useEffect, useCallback } from 'react';

/* ─── Hook : liste des programmes publics ────────────────────── */
export function useProgrammes() {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchProgrammes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/programmes/public', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProgrammes(data.programmes || []);
    } catch (err) {
      console.error('[useProgrammes] Erreur:', err.message);
      setError(err.message);
      setProgrammes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProgrammes(); }, [fetchProgrammes]);

  return { programmes, loading, error, refetch: fetchProgrammes };
}

/* ─── Hook : détail d'un programme par ID ────────────────────── */
export function useProgrammeDetail(id) {
  const [programme, setProgramme] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/programmes/public/${id}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setProgramme(data.programme || null);
      } catch (err) {
        console.error('[useProgrammeDetail] Erreur:', err.message);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  return { programme, loading, error };
}