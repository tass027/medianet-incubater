// app/hooks/useMatching.js
// Hook frontend — connecte la page startups au service AI matching
// Appels : trigger sync → GET résultats → validate/reject un match

import { useState, useCallback } from 'react';

const BASE_MATCHING = '/api/matching';

export default function useMatching() {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // ── Déclencher le matching IA (mode synchrone) ────────────────────────────
  // POST /api/matching/trigger/:applicationId/sync
  const triggerMatching = useCallback(async (applicationId) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_MATCHING}/trigger/${applicationId}/sync`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Erreur matching');
      return json.data; // { investors, mentors, jury, mode }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Récupérer les matches existants ──────────────────────────────────────
  // GET /api/matching/:applicationId
  const getMatches = useCallback(async (applicationId) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_MATCHING}/${applicationId}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Erreur récupération matches');
      return json.data; // { investors, mentors, jury, generatedAt, status }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Valider un match investisseur ─────────────────────────────────────────
  // PATCH /api/matching/:applicationId/validate  { investorId, action: 'approve'|'reject' }
  const validateInvestorMatch = useCallback(async (applicationId, investorId, action) => {
    const res  = await fetch(`${BASE_MATCHING}/${applicationId}/validate`, {
      method:      'PATCH',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ investorId, action }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json;
  }, []);

  // ── Valider un match mentor ───────────────────────────────────────────────
  // PATCH /api/matching/:applicationId/validate-mentor  { mentorId, action }
  const validateMentorMatch = useCallback(async (applicationId, mentorId, action) => {
    const res  = await fetch(`${BASE_MATCHING}/${applicationId}/validate-mentor`, {
      method:      'PATCH',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ mentorId, action }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json;
  }, []);

  // ── Envoyer un email de mise en relation ──────────────────────────────────
  // POST /api/matching/:applicationId/send-email
  const sendMatchEmail = useCallback(async (applicationId, { type, targetId, targetEmail, targetName, startupName, message }) => {
    const res  = await fetch(`${BASE_MATCHING}/${applicationId}/send-email`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ type, targetId, targetEmail, targetName, startupName, message }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json;
  }, []);

  return {
    loading,
    error,
    triggerMatching,
    getMatches,
    validateInvestorMatch,
    validateMentorMatch,
    sendMatchEmail,
  };
}