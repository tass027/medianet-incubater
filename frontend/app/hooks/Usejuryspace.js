// src/app/hooks/useJurySpace.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ═════════════════════════════════════════════════════════════════════════════
// useJuryDashboard — stats + candidatures récentes
// ═════════════════════════════════════════════════════════════════════════════
export function useJuryDashboard() {
  const [stats,   setStats]   = useState({ total: 0, evaluated: 0, pending: 0, avgScore: null });
  const [recent,  setRecent]  = useState([]);
  const [debug,   setDebug]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosAuth.get('/api/jury-space/dashboard');
      setStats(data.stats  || { total: 0, evaluated: 0, pending: 0, avgScore: null });
      setRecent(data.recent || []);
      if (data.debug) setDebug(data.debug);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, recent, debug, loading, error, refetch: fetch };
}

// ═════════════════════════════════════════════════════════════════════════════
// useJuryCandidatures — liste paginée + filtres
// ═════════════════════════════════════════════════════════════════════════════
export function useJuryCandidatures() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | pending | evaluated

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosAuth.get('/api/jury-space/candidatures');
      setCandidatures(data.candidatures || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Filtrage côté client
  const filtered = candidatures.filter(c => {
    const name = (c.projectName || c.companyName || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'all'       ? true :
      filterStatus === 'evaluated' ? c.juryEvaluated :
      filterStatus === 'pending'   ? !c.juryEvaluated : true;
    return matchSearch && matchStatus;
  });

  const pendingCount   = candidatures.filter(c => !c.juryEvaluated).length;
  const evaluatedCount = candidatures.filter(c =>  c.juryEvaluated).length;

  return {
    candidatures: filtered,
    total: candidatures.length,
    pendingCount,
    evaluatedCount,
    loading, error,
    search, setSearch,
    filterStatus, setFilterStatus,
    refetch: fetch,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// useJuryCandidatureDetail — dossier complet + critères + évaluation existante
// ═════════════════════════════════════════════════════════════════════════════
export function useJuryCandidatureDetail(applicationId) {
  const [candidature, setCandidature] = useState(null);
  const [criteria,    setCriteria]    = useState([]);
  const [existing,    setExisting]    = useState(null); // évaluation déjà soumise
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Formulaire d'évaluation
  const [scores,     setScores]     = useState({});  // { criterionId: number }
  const [remarks,    setRemarks]    = useState({});  // { criterionId: string }
  const [globalNote, setGlobalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError,setSubmitError]= useState(null);
  const [submitted,  setSubmitted]  = useState(false);

  const fetch = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const [candRes, critRes, evalRes] = await Promise.all([
        axiosAuth.get(`/api/jury-space/candidatures/${applicationId}`),
        axiosAuth.get(`/api/jury-space/candidatures/${applicationId}/criteria`),
        axiosAuth.get(`/api/jury-space/candidatures/${applicationId}/my-evaluation`),
      ]);

      setCandidature(candRes.data.candidature || candRes.data);

      const list = critRes.data.criteria || [];
      setCriteria(list);

      // Init scores à 0
      const initScores  = {};
      const initRemarks = {};
      list.forEach(cr => {
        initScores[cr._id]  = 0;
        initRemarks[cr._id] = '';
      });
      setScores(initScores);
      setRemarks(initRemarks);

      // Pré-remplir si évaluation existante
      const ev = evalRes.data.evaluation;
      if (ev) {
        setExisting(ev);
        const prefillScores  = {};
        const prefillRemarks = {};
        (ev.scores || []).forEach(s => {
          prefillScores[s.criterionId]  = s.score;
          prefillRemarks[s.criterionId] = s.remark || '';
        });
        setScores(prefillScores);
        setRemarks(prefillRemarks);
        setGlobalNote(ev.globalNote || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Score pondéré calculé en temps réel
  const totalWeight = criteria.reduce((sum, cr) => sum + (cr.weight || 1), 0);
  const computedScore = criteria.length
    ? criteria.reduce((sum, cr) => {
        const s   = scores[cr._id] || 0;
        const w   = cr.weight  || 1;
        const max = cr.maxScore || 10;
        return sum + (s / max) * w;
      }, 0) / (totalWeight || 1) * (criteria[0]?.maxScore || 10)
    : 0;

  const allFilled = criteria.length > 0 && criteria.every(cr => (scores[cr._id] || 0) > 0);
  const isReadonly = !!existing && !submitted;

  const setScore  = useCallback((id, val) => setScores(p => ({ ...p, [id]: val })), []);
  const setRemark = useCallback((id, val) => setRemarks(p => ({ ...p, [id]: val })), []);

  const submitEvaluation = useCallback(async () => {
    if (!allFilled || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        scores: criteria.map(cr => ({
          criterionId:    cr._id,
          criterionLabel: cr.label,
          score:          scores[cr._id]  || 0,
          remark:         remarks[cr._id] || '',
          weight:         cr.weight  || 1,
          maxScore:       cr.maxScore || 10,
        })),
        globalNote,
        computedScore: Number(computedScore.toFixed(2)),
      };
      const { data } = await axiosAuth.post(
        `/api/jury-space/candidatures/${applicationId}/evaluate`,
        payload
      );
      setExisting(data.evaluation || payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }, [allFilled, submitting, criteria, scores, remarks, globalNote, computedScore, applicationId]);

  return {
    // Data
    candidature, criteria, existing,
    loading, error,
    // Form state
    scores, remarks, globalNote,
    setScore, setRemark, setGlobalNote,
    // Computed
    computedScore, allFilled, isReadonly,
    // Submit
    submitEvaluation, submitting, submitError, submitted,
    // Utils
    refetch: fetch,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// useJuryEvaluations — historique des évaluations soumises
// ═════════════════════════════════════════════════════════════════════════════
export function useJuryEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [avgScore,    setAvgScore]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosAuth.get('/api/jury-space/my-evaluations');
      setEvaluations(data.evaluations || []);
      setAvgScore(data.avgScore ?? null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { evaluations, avgScore, loading, error, refetch: fetch };
}

// ═════════════════════════════════════════════════════════════════════════════
// useJuryDebug — diagnostic (admin uniquement)
// ═════════════════════════════════════════════════════════════════════════════
export function useJuryDebug() {
  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosAuth.get('/api/jury-space/debug');
      setInfo(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { info, loading, error, fetch };
}