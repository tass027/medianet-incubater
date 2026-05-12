'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  ArrowLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Star: ({ filled, className = 'w-5 h-5' }) => (
    <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Loader: () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  ),
  Save: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
    </svg>
  ),
  Cloud: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
    </svg>
  ),
};

const DEFAULT_CRITERIA = [
  { id: 'team',       label: 'Équipe',            weight: 30, description: 'Compétences, expérience et complémentarité de l\'équipe' },
  { id: 'innovation', label: 'Innovation',         weight: 25, description: 'Originalité de la solution et différenciation marché' },
  { id: 'market',     label: 'Marché',             weight: 20, description: 'Taille du marché cible et potentiel de croissance' },
  { id: 'business',   label: 'Modèle économique',  weight: 15, description: 'Viabilité et scalabilité du business model' },
  { id: 'traction',   label: 'Traction',           weight: 10, description: 'Indicateurs de validation et premiers clients' },
];

// ─── Animated Score Gauge ─────────────────────────────────────────────────────
const ScoreGauge = ({ score, max = 10 }) => {
  const radius  = 54;
  const circ    = 2 * Math.PI * radius;
  const pct     = Math.min((score / max) * 100, 100);
  const dash    = (pct / 100) * circ;
  const color   = score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : score > 0 ? '#ef4444' : '#d1d5db';
  const textCol = score >= 7 ? 'text-emerald-600' : score >= 4 ? 'text-amber-600' : score > 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500';

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor"
          className="text-gray-100 dark:text-gray-700" strokeWidth="10"/>
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
          stroke={color}
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <p className={`text-3xl font-black ${textCol} transition-colors duration-300`}>
          {score.toFixed(1)}
        </p>
        <p className="text-xs text-gray-400 font-medium">/ {max}</p>
      </div>
    </div>
  );
};

// ─── Mini bar chart per criterion ─────────────────────────────────────────────
const MiniBarChart = ({ criteria, scores }) => (
  <div className="flex items-end gap-1.5 h-10">
    {criteria.map(c => {
      const v   = scores[c.id] || 0;
      const pct = (v / 10) * 100;
      const col = v >= 7 ? 'bg-emerald-500' : v >= 4 ? 'bg-amber-500' : v > 0 ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-700';
      return (
        <div key={c.id} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
          <div className="w-full flex items-end" style={{ height: 32 }}>
            <div
              className={`w-full rounded-t transition-all duration-400 ${col}`}
              style={{ height: `${Math.max(pct, 8)}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400 leading-none truncate w-full text-center">
            {c.label.slice(0, 3)}
          </span>
        </div>
      );
    })}
  </div>
);

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, max = 10, disabled = false }) => {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(n === value ? 0 : n)}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => !disabled && setHovered(null)}
          className={`transition-transform ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
        >
          <Icons.Star
            filled={n <= display}
            className={`w-5 h-5 transition-colors ${
              n <= display ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[2.5rem]">
        {value ?? 0}<span className="font-normal text-gray-400">/{max}</span>
      </span>
    </div>
  );
};

// ─── Auto-save status indicator ───────────────────────────────────────────────
const AutoSaveStatus = ({ status }) => {
  const states = {
    idle:   { text: '',                     cls: '' },
    saving: { text: 'Sauvegarde…',          cls: 'text-indigo-500' },
    saved:  { text: 'Brouillon sauvegardé', cls: 'text-emerald-600 dark:text-emerald-400' },
    error:  { text: 'Erreur de sauvegarde', cls: 'text-red-500' },
  };
  const s = states[status] || states.idle;
  if (!s.text) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${s.cls}`}>
      {status === 'saving' ? <Icons.Loader /> : <Icons.Cloud />}
      {s.text}
    </div>
  );
};

// ─── Weighted score calculator ────────────────────────────────────────────────
const calcWeightedScore = (scores, criteria) =>
  criteria.reduce((sum, c) => sum + (scores[c.id] || 0) * (c.weight / 100), 0);

// ─── Main Page ────────────────────────────────────────────────────────────────
function EvaluatePage() {
  const params   = useParams();
  const router   = useRouter();
  const { id: applicationId } = params;

  const [mounted,     setMounted]     = useState(false);
  const [candidature, setCandidature] = useState(null);
  const [criteria,    setCriteria]    = useState(DEFAULT_CRITERIA);
  const [existing,    setExisting]    = useState(null);

  // Form state
  const [scores,         setScores]         = useState({});
  const [comments,       setComments]       = useState({});
  const [globalRemark,   setGlobalRemark]   = useState('');
  const [recommendation, setRecommendation] = useState('review');

  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState(null);
  const [submitted,    setSubmitted]    = useState(false);
  const [isReadOnly,   setIsReadOnly]   = useState(false);
  const [autoSave,     setAutoSave]     = useState('idle'); // idle | saving | saved | error

  // Auto-save debounce ref
  const autoSaveTimer = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !applicationId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: candData } = await axiosAuth.get(`/api/jury-space/candidatures/${applicationId}`);
        setCandidature(candData.candidature || candData.application || candData);

        try {
          const { data: critData } = await axiosAuth.get(`/api/jury-space/candidatures/${applicationId}/criteria`);
          if (critData.criteria?.length) setCriteria(critData.criteria);
        } catch {}

        try {
          const { data: evalData } = await axiosAuth.get(`/api/jury-space/candidatures/${applicationId}/my-evaluation`);
          const ev = evalData.evaluation;
          if (ev) {
            setExisting(ev);
            const savedScores   = {};
            const savedComments = {};
            (ev.scores || []).forEach(s => {
              savedScores[s.criteriaId]   = s.score;
              savedComments[s.criteriaId] = s.comment || '';
            });
            setScores(savedScores);
            setComments(savedComments);
            setGlobalRemark(ev.globalRemark || '');
            setRecommendation(ev.recommendation || 'review');
            if (ev.status === 'submitted') setIsReadOnly(true);
          }
        } catch {}
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mounted, applicationId]);

  // ── Auto-save draft ───────────────────────────────────────────────────────
  const triggerAutoSave = useCallback(() => {
    if (isReadOnly || submitted) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSave('saving');
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const payload = {
          applicationId,
          scores: criteria.map(c => ({
            criteriaId:    c.id,
            criterionLabel: c.label,
            score:         scores[c.id] || 0,
            maxScore:      10,
            comment:       comments[c.id] || '',
          })),
          globalRemark,
          recommendation,
          status: 'draft',
        };
        await axiosAuth.post(
          `/api/jury-space/candidatures/${applicationId}/evaluate`,
          payload
        );
        setAutoSave('saved');
        setTimeout(() => setAutoSave('idle'), 2500);
      } catch {
        setAutoSave('error');
        setTimeout(() => setAutoSave('idle'), 3000);
      }
    }, 2000);
  }, [applicationId, criteria, scores, comments, globalRemark, recommendation, isReadOnly, submitted]);

  // Trigger auto-save on form change
  useEffect(() => {
    if (!mounted || loading || isReadOnly || submitted) return;
    if (Object.keys(scores).length === 0 && !globalRemark) return;
    triggerAutoSave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [scores, comments, globalRemark, recommendation]);

  const weightedScore = calcWeightedScore(scores, criteria);
  const allScored     = criteria.every(c => (scores[c.id] ?? 0) > 0);

  const handleSubmit = useCallback(async () => {
    if (!allScored) return;
    setSubmitting(true);
    setError(null);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    try {
      const payload = {
        applicationId,
        scores: criteria.map(c => ({
          criteriaId:    c.id,
          criterionLabel: c.label,
          score:         scores[c.id] || 0,
          maxScore:      10,
          comment:       comments[c.id] || '',
        })),
        globalRemark,
        recommendation,
        startupName: candidature?.projectName || candidature?.companyName || '',
        programme:   candidature?.programme || '',
        status:      'submitted',
      };
      await axiosAuth.post(`/api/jury-space/candidatures/${applicationId}/evaluate`, payload);
      setSubmitted(true);
      setIsReadOnly(true);
      setAutoSave('idle');
      setTimeout(() => router.push(`/dashboard/jury/candidatures/${applicationId}`), 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  }, [allScored, applicationId, criteria, scores, comments, globalRemark, recommendation, candidature, router]);

  const updateScore   = (id, v) => setScores(prev => ({ ...prev, [id]: v }));
  const updateComment = (id, v) => setComments(prev => ({ ...prev, [id]: v }));

  if (!mounted) return null;

  const candName      = candidature?.projectName || candidature?.companyName || 'Candidature';
  const scoreColor    = weightedScore >= 7 ? 'text-emerald-600' : weightedScore >= 4 ? 'text-amber-600' : 'text-red-500';
  const completedCount = criteria.filter(c => (scores[c.id] ?? 0) > 0).length;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-8"
        style={{ background: 'linear-gradient(135deg,#312e81 0%,#4f46e5 50%,#7c3aed 100%)' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }}
        />
        <div className="relative">
          <Link href={`/dashboard/jury/candidatures/${applicationId}`}>
            <button className="flex items-center gap-2 text-white/70 hover:text-white transition mb-4 text-sm">
              <Icons.ArrowLeft /> Retour à la candidature
            </button>
          </Link>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {loading ? 'Chargement…' : candName}
              </h1>
              <p className="text-indigo-200 text-sm">
                {existing ? 'Modifier votre évaluation' : 'Nouvelle évaluation'}
              </p>
            </div>

            {/* Live gauge in header — NEW */}
            {!loading && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-indigo-300 mb-1">Score pondéré</p>
                  <AutoSaveStatus status={autoSave} />
                  {isReadOnly && (
                    <div className="flex items-center gap-1.5 text-xs text-white/70 mt-1">
                      <Icons.Lock /> Évaluation soumise
                    </div>
                  )}
                </div>
                <div className="relative">
                  {/* Compact gauge in header */}
                  <div className="w-24 h-24 relative">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"/>
                      <circle cx="48" cy="48" r="40" fill="none" strokeWidth="8" strokeLinecap="round"
                        stroke="white"
                        strokeDasharray={`${((weightedScore / 10) * 251.2)} 251.2`}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-xl font-black">{weightedScore.toFixed(1)}</span>
                      <span className="text-[10px] opacity-60">/10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="flex justify-center mb-3 text-indigo-500"><Icons.Loader /></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement de l&apos;évaluation…</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-5 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <span className="font-semibold">Erreur :</span> {error}
        </div>
      )}

      {/* ── Success ── */}
      {submitted && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
          <Icons.CheckCircle />
          <div>
            <p className="font-semibold">Évaluation soumise avec succès !</p>
            <p className="text-sm opacity-80">Redirection en cours…</p>
          </div>
        </div>
      )}

      {/* ── Already submitted ── */}
      {!loading && isReadOnly && !submitted && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
            <Icons.CheckCircle />
            <div>
              <p className="font-semibold">Évaluation déjà soumise</p>
              <p className="text-sm opacity-80">Score final : {weightedScore.toFixed(2)} / 10</p>
            </div>
          </div>
          <button
            onClick={() => setIsReadOnly(false)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Modifier
          </button>
        </div>
      )}

      {/* ── Progress tracker — NEW ── */}
      {!loading && !isReadOnly && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Critères notés : {completedCount} / {criteria.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((completedCount / criteria.length) * 100)}% complété
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completedCount === criteria.length ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${(completedCount / criteria.length) * 100}%` }}
            />
          </div>
          {/* Mini bars + big gauge */}
          <div className="flex items-center gap-6">
            <ScoreGauge score={weightedScore} />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-2">Distribution des scores</p>
              <MiniBarChart criteria={criteria} scores={scores} />
            </div>
          </div>
        </div>
      )}

      {/* ── Criteria Cards ── */}
      {!loading && (
        <div className="space-y-4">
          {criteria.map(c => {
            const score   = scores[c.id] || 0;
            const scored  = score > 0;
            const barColor = score >= 7 ? 'bg-emerald-500' : score >= 4 ? 'bg-amber-500' : score > 0 ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-700';

            return (
              <div
                key={c.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm p-6 transition-all duration-200 ${
                  scored
                    ? 'border-indigo-200 dark:border-indigo-700'
                    : 'border-gray-100 dark:border-gray-700'
                } ${!isReadOnly && scored ? 'ring-1 ring-indigo-100 dark:ring-indigo-900/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {/* Completion dot */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${scored ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{c.label}</h3>
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
                        ×{c.weight ?? 20}%
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{c.description}</p>
                    )}
                  </div>
                  <StarRating
                    value={scores[c.id] || 0}
                    onChange={v => updateScore(c.id, v)}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>

                {/* Contribution display */}
                {scored && (
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>Contribution au score : <strong className="text-indigo-600 dark:text-indigo-400">+{(score * c.weight / 100).toFixed(2)}</strong></span>
                    <span className={score >= 7 ? 'text-emerald-600' : score >= 4 ? 'text-amber-600' : 'text-red-500'}>
                      {score >= 7 ? '✓ Bon' : score >= 4 ? '~ Moyen' : '✗ Faible'}
                    </span>
                  </div>
                )}

                {/* Comment */}
                <textarea
                  disabled={isReadOnly}
                  value={comments[c.id] || ''}
                  onChange={e => updateComment(c.id, e.target.value)}
                  placeholder={`Commentaire sur ${c.label.toLowerCase()}…`}
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed transition"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Global remark + recommendation ── */}
      {!loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Commentaire global
            </label>
            <textarea
              disabled={isReadOnly}
              value={globalRemark}
              onChange={e => setGlobalRemark(e.target.value)}
              placeholder="Vue d'ensemble de la candidature, points forts, axes d'amélioration…"
              rows={4}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed transition"
            />
            {!isReadOnly && (
              <p className="text-xs text-gray-400 mt-1">{globalRemark.length} caractère{globalRemark.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Recommandation
            </label>
            <div className="flex gap-3 flex-wrap">
              {[
                { value: 'accept', label: 'Accepter', cls: 'emerald' },
                { value: 'review', label: 'À revoir', cls: 'amber'   },
                { value: 'reject', label: 'Refuser',  cls: 'red'     },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => !isReadOnly && setRecommendation(opt.value)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition disabled:cursor-not-allowed
                    ${recommendation === opt.value
                      ? opt.cls === 'emerald'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : opt.cls === 'amber'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Score summary + submit ── */}
      {!loading && !isReadOnly && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <ScoreGauge score={weightedScore} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">Score pondéré total</p>
                <p className={`text-3xl font-bold ${scoreColor}`}>
                  {weightedScore.toFixed(2)}<span className="text-lg text-gray-400 font-normal">/10</span>
                </p>
                <AutoSaveStatus status={autoSave} />
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <Link href={`/dashboard/jury/candidatures/${applicationId}`}>
                <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Annuler
                </button>
              </Link>
              <button
                onClick={handleSubmit}
                disabled={!allScored || submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
              >
                {submitting && <Icons.Loader />}
                {submitting ? 'Envoi…' : existing ? 'Mettre à jour' : 'Soumettre l\'évaluation'}
              </button>
            </div>
          </div>

          {!allScored && (
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <span>⚠ Notez tous les critères avant de soumettre.</span>
              <span className="text-gray-400">({completedCount}/{criteria.length} notés)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JuryEvaluatePage() {
  return (
    <ProtectedRoute allowedRoles={['jury', 'mentor', 'admin']}>
      <DashboardLayout>
        <EvaluatePage />
      </DashboardLayout>
    </ProtectedRoute>
  );
}