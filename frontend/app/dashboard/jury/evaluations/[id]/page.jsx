'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Back:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/></svg>,
  Star:     ({ filled, className = 'w-4 h-4' }) => <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
  Check:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  Send:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
  Save:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>,
  Edit:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  Up:       () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>,
  Down:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/></svg>,
  Msg:      () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  Plus:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  Trash:    () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  Info:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Spin:     () => <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>,
  Calendar: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Globe:    () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
  Doc:      () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Chevron:  ({ open }) => <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
  List:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
  Target:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.5}/><circle cx="12" cy="12" r="6" strokeWidth={1.5}/><circle cx="12" cy="12" r="2" strokeWidth={1.5}/></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normToTen = raw => {
  const n = Number(raw);
  if (isNaN(n)) return 0;
  return n > 10 ? +(n / 10).toFixed(2) : +n.toFixed(2);
};

const getScore = ev => {
  if (!ev) return null;
  // Ignorer computedScore / totalScore s'ils valent 0 (non encore calculés côté API)
  if (ev.computedScore != null && Number(ev.computedScore) > 0) return normToTen(ev.computedScore);
  if (ev.totalScore    != null && Number(ev.totalScore)    > 0) return normToTen(ev.totalScore);
  if (ev.scores?.length) {
    // N'inclure que les critères avec un score > 0
    const valid = ev.scores.filter(c => Number(c.score) > 0);
    if (!valid.length) return null;
    const avg = valid.reduce((s, c) => s + normToTen(c.score), 0) / valid.length;
    return +avg.toFixed(2);
  }
  return null;
};

const scoreColor = v => {
  if (v == null || v === 0) return { text: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', bar: 'bg-slate-300 dark:bg-slate-600', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', ring: 'ring-slate-200 dark:ring-slate-700' };
  if (v >= 8)   return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' };
  if (v >= 5)   return { text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20',     bar: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',   ring: 'ring-amber-200 dark:ring-amber-800' };
  return               { text: 'text-rose-600 dark:text-rose-400',        bg: 'bg-rose-50 dark:bg-rose-900/20',       bar: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',      ring: 'ring-rose-200 dark:ring-rose-800' };
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const CRITERIA_LABELS = { team: 'Équipe', innovation: 'Innovation', market: 'Marché', business: 'Modèle économique', traction: 'Traction' };
const getCritLabel = s => CRITERIA_LABELS[s.criteriaId] || s.criteriaName || s.criteriaId || 'Critère';

const RECO_MAP = {
  accept: { label: 'Accepter', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800', dot: 'bg-emerald-500' },
  reject: { label: 'Refuser',  cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800',                 dot: 'bg-rose-500' },
  review: { label: 'À revoir', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800',           dot: 'bg-amber-500' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StarRating = ({ value, onChange, disabled }) => {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" disabled={disabled}
          onClick={() => !disabled && onChange(n)}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => !disabled && setHovered(null)}
          className={`transition-all duration-100 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-125'}`}>
          <Icon.Star filled={n <= display} className={`w-5 h-5 transition-colors ${n <= display ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
        </button>
      ))}
      <span className="ml-2.5 text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
        {(value ?? 0).toFixed(1)}<span className="text-xs font-normal text-slate-400 ml-0.5">/10</span>
      </span>
    </div>
  );
};

// Radial score gauge
const ScoreGauge = ({ score, size = 140 }) => {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const pct = score != null ? Math.min(100, (score / 10) * 100) : 0;
  const dash = (pct / 100) * circ;
  const col = scoreColor(score);
  const trackColor = score == null ? '#94a3b8' : score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-700/60" strokeWidth="8"/>
        <circle cx="55" cy="55" r={r} fill="none" stroke={trackColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)', opacity: 0.9 }}
        />
      </svg>
      <div className="text-center z-10">
        <p className={`font-black tabular-nums leading-none ${col.text}`} style={{ fontSize: size * 0.21 }}>
          {score != null ? score.toFixed(1) : '—'}
        </p>
        <p className="text-slate-400 font-medium" style={{ fontSize: size * 0.09 }}>/ 10</p>
      </div>
    </div>
  );
};

// Criterion display card (view mode)
const CriterionCard = ({ s, idx }) => {
  const val = normToTen(s.score);
  const pct = Math.min(100, (val / 10) * 100);
  const col = scoreColor(val);
  return (
    <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 hover:shadow-sm">
      <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-0.5">
        <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
          {idx + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{getCritLabel(s)}</span>
          <span className={`text-base font-black tabular-nums px-2.5 py-0.5 rounded-lg ${col.badge}`}>
            {val.toFixed(1)}<span className="text-xs font-normal opacity-70 ml-0.5">/10</span>
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${col.bar}`} style={{ width: `${pct}%` }} />
        </div>
        {(s.comment || s.remark) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-0.5">
            {s.comment || s.remark}
          </p>
        )}
      </div>
    </div>
  );
};

// Criterion edit card
const CriterionEditCard = ({ s, idx, onChange }) => {
  const val = Number(s.score) || 0;
  const pct = (val / 10) * 100;
  const col = scoreColor(val);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
            {idx + 1}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">{getCritLabel(s)}</span>
        </div>
        <StarRating value={val} onChange={v => onChange({ ...s, score: v })} />
      </div>
      <div className="space-y-1">
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${col.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>0</span><span>5</span><span>10</span>
        </div>
      </div>
      <textarea rows={2} value={s.comment || ''}
        onChange={e => onChange({ ...s, comment: e.target.value })}
        placeholder={`Justification pour « ${getCritLabel(s)} »…`}
        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition-all"
      />
    </div>
  );
};

const FormSection = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left">
        <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{title}</span>
        <Icon.Chevron open={open} />
      </button>
      {open && <div className="px-5 py-4 bg-white dark:bg-slate-800 space-y-3">{children}</div>}
    </div>
  );
};

// Toast notification
const Toast = ({ t }) => {
  if (!t) return null;
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold animate-in fade-in slide-in-from-right-4 duration-300
      ${t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
      {t.type === 'error' ? <Icon.Info /> : <Icon.Check />}
      {t.msg}
    </div>
  );
};

// Skeleton loader block
const Skeleton = ({ className }) => (
  <div className={`bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse ${className}`} />
);

// Empty state
const EmptyState = ({ icon, title, subtitle, action }) => (
  <div className="py-14 text-center space-y-3">
    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">{title}</p>
      {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// Section label
const SectionLabel = ({ children, className = '' }) => (
  <p className={`text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ${className}`}>{children}</p>
);

// Tag / badge
const Tag = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${className}`}>{children}</span>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
function EvaluationDetailPage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { id: evaluationId } = params;

  const [evaluation,    setEvaluation]    = useState(null);
  const [candidature,   setCandidature]   = useState(null);
  const [applicationId, setApplicationId] = useState(null);

  const [mode,      setMode]      = useState(() => searchParams.get('mode') === 'edit' ? 'edit' : 'view');
  const [activeTab, setActiveTab] = useState('scores');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [sending,   setSending]   = useState(false);
  const [toast,     setToast]     = useState(null);
  const [mounted,   setMounted]   = useState(false);

  const [editScores,     setEditScores]     = useState([]);
  const [globalRemark,   setGlobalRemark]   = useState('');
  const [recommendation, setRecommendation] = useState('review');
  const [positivePoints, setPositivePoints] = useState([]);
  const [negativePoints, setNegativePoints] = useState([]);
  const [feedbacks,      setFeedbacks]      = useState([]);
  const [newPos,  setNewPos]  = useState('');
  const [newNeg,  setNewNeg]  = useState('');
  const [newFeed, setNewFeed] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = useCallback(async () => {
    if (!evaluationId) return;
    setLoading(true);
    try {
      const { data: listData } = await axiosAuth.get('/api/jury-space/my-evaluations');
      const all = listData.evaluations ?? [];
      let ev = all.find(e =>
        e._id === evaluationId ||
        e._id?.toString() === evaluationId ||
        e.candidatureId?._id?.toString() === evaluationId ||
        e.applicationId?.toString() === evaluationId
      );
      if (!ev) { showToast('Évaluation introuvable', 'error'); setLoading(false); return; }
      const candId = ev.candidatureId?._id?.toString?.() || ev.candidatureId?.toString?.() || ev.applicationId?.toString?.() || null;
      setApplicationId(candId);
      if (candId) {
        try {
          const { data: evalData } = await axiosAuth.get(`/api/jury-space/candidatures/${candId}/my-evaluation`);
          if (evalData.evaluation) {
            const rich = evalData.evaluation;
            ev = {
              ...ev,
              scores:         (rich.scores?.length > 0 && rich.scores.some(s => Number(s.score) > 0)) ? rich.scores : ev.scores,
              globalRemark:   rich.globalRemark   || ev.globalRemark   || '',
              recommendation: rich.recommendation || ev.recommendation || '',
              positivePoints: rich.positivePoints?.length > 0 ? rich.positivePoints : (ev.positivePoints || []),
              negativePoints: rich.negativePoints?.length > 0 ? rich.negativePoints : (ev.negativePoints || []),
              feedbacks:      rich.feedbacks?.length > 0 ? rich.feedbacks : (ev.feedbacks || []),
              computedScore:  rich.computedScore  ?? ev.computedScore,
            };
          }
        } catch {}
      }
      setEvaluation(ev);
      setEditScores((ev.scores || []).map(s => ({ ...s, score: normToTen(s.score), comment: s.comment || s.remark || '' })));
      setGlobalRemark(ev.globalRemark || '');
      setRecommendation(ev.recommendation || 'review');
      setPositivePoints(ev.positivePoints || []);
      setNegativePoints(ev.negativePoints || []);
      setFeedbacks((ev.feedbacks || []).map(f => typeof f === 'string' ? f : (f?.text || '')));
      if (candId) {
        try {
          const { data: candData } = await axiosAuth.get(`/api/jury-space/candidatures/${candId}`);
          setCandidature(candData.candidature || candData.application || candData);
        } catch {
          setCandidature({ projectName: ev.startupName || ev.candidatureInfo?.name || '', programmeName: ev.programmeName || ev.programme || '' });
        }
      } else if (ev.startupName || ev.candidatureInfo) {
        setCandidature({ projectName: ev.startupName || ev.candidatureInfo?.name || '', programmeName: ev.programmeName || ev.programme || '' });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => { if (mounted) loadAll(); }, [mounted, loadAll]);

  useEffect(() => {
    if (evaluation && editScores.length === 0 && (evaluation.scores?.length ?? 0) === 0) {
      const DEFAULTS = ['team', 'innovation', 'market', 'business', 'traction'];
      const LABELS = { team: 'Équipe', innovation: 'Innovation', market: 'Marché', business: 'Modèle économique', traction: 'Traction' };
      setEditScores(DEFAULTS.map(id => ({ criteriaId: id, criteriaName: LABELS[id], score: 0, comment: '' })));
    }
  }, [evaluation, editScores.length]);

  const editAvg = editScores.length
    ? editScores.reduce((s, c) => s + (Number(c.score) || 0), 0) / editScores.length
    : 0;

  const buildPayload = () => ({
    scores: editScores.map(s => ({
      criteriaId: s.criteriaId, criteriaName: s.criteriaName || getCritLabel(s),
      score: Number(s.score), comment: s.comment || '', remark: s.comment || '',
    })),
    globalRemark, recommendation, positivePoints, negativePoints,
    feedbacks: feedbacks.map(f => ({ text: typeof f === 'string' ? f : (f?.text || '') })),
  });

  const handleSave = async () => {
    if (!evaluation?._id) return;
    setSaving(true);
    try {
      await axiosAuth.patch(`/api/jury-space/evaluations/${evaluation._id}`, buildPayload());
      showToast('Rapport sauvegardé');
      await loadAll();
      setMode('view');
      router.replace(`/dashboard/jury/evaluations/${evaluationId}`);
    } catch (err) { showToast(err.response?.data?.message || 'Erreur de sauvegarde', 'error'); }
    finally { setSaving(false); }
  };

  const handleSendToAdmin = async () => {
    if (!evaluation?._id) return;
    setSending(true);
    try {
      await axiosAuth.patch(`/api/jury-space/evaluations/${evaluation._id}`, buildPayload());
      await axiosAuth.post(`/api/jury-space/evaluations/${evaluation._id}/send-to-admin`);
      showToast("Évaluation envoyée à l'administration !");
      await loadAll();
      setMode('view');
      router.replace(`/dashboard/jury/evaluations/${evaluationId}`);
    } catch (err) { showToast(err.response?.data?.message || "Erreur lors de l'envoi", 'error'); }
    finally { setSending(false); }
  };

  const addItem = (list, setList, val, setVal) => {
    const t = typeof val === 'string' ? val.trim() : '';
    if (!t) return;
    setList(prev => [...prev, t]);
    setVal('');
  };

  const handleEnterEdit = () => { setMode('edit'); router.replace(`/dashboard/jury/evaluations/${evaluationId}?mode=edit`); };
  const handleCancelEdit = () => { setMode('view'); router.replace(`/dashboard/jury/evaluations/${evaluationId}`); loadAll(); };

  const ev         = evaluation;
  const cand       = candidature;
  const finalScore = getScore(ev);
  const col        = scoreColor(finalScore);

  const candName = cand?.projectName || cand?.companyName || ev?.startupName || ev?.candidatureInfo?.name || ev?.candidatureId?.projectName || ev?.candidatureId?.companyName || 'Candidature';
  const progName = cand?.programmeName || ev?.programmeName || ev?.programme || ev?.candidatureInfo?.programme || '';

  const TABS = [
    { id: 'scores',    label: 'Critères',   icon: <Icon.Target /> },
    { id: 'global',    label: 'Note globale', icon: <Icon.Doc /> },
    { id: 'points',    label: 'Points clés', icon: <Icon.Up /> },
    { id: 'feedbacks', label: 'Feedbacks',  icon: <Icon.Msg /> },
    { id: 'form',      label: 'Formulaire', icon: <Icon.Info /> },
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-16 max-w-[1400px] mx-auto">
      <Toast t={toast} />

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)' }}>
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        {/* Glow orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />

        <div className="relative px-8 pt-6 pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => router.push('/dashboard/jury/evaluations')}
              className="flex items-center gap-1.5 text-indigo-300 hover:text-white transition-colors text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-white/10 -ml-2.5">
              <Icon.Back />
              <span>Mes évaluations</span>
            </button>
            <span className="text-indigo-600/60 text-sm">/</span>
            <span className="text-indigo-300/80 text-sm truncate max-w-xs">{loading ? '…' : candName}</span>
          </div>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div className="flex-1 min-w-0 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-72" />
                  <Skeleton className="h-5 w-48" />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">{candName}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {progName && (
                      <Tag className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
                        {progName}
                      </Tag>
                    )}
                    {ev?.submittedAt && (
                      <Tag className="bg-white/10 text-white/60 border border-white/10">
                        <Icon.Calendar />
                        {fmtDate(ev.submittedAt)}
                      </Tag>
                    )}
                    {ev?.sentToAdmin && (
                      <Tag className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                        <Icon.Check />Envoyé à l'admin
                      </Tag>
                    )}
                    {mode === 'edit' && (
                      <Tag className="bg-amber-500/20 border border-amber-400/30 text-amber-300">
                        <Icon.Edit />Mode édition
                      </Tag>
                    )}
                  </div>
                </>
              )}
            </div>

            {!loading && (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <ScoreGauge score={mode === 'edit' && editScores.length ? editAvg : finalScore} size={128} />
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  {mode === 'edit' ? 'Aperçu' : 'Score final'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      )}

      {!loading && ev && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5 min-w-0">

            {/* Candidature info card */}
            {cand && (cand.founderName || cand.sector || cand.description) && (
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
                  <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                    <span className="text-slate-400"><Icon.Doc /></span>
                    Informations sur la candidature
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
                  {[
                    { label: 'Fondateur',    value: cand.founderName },
                    { label: 'Email',        value: cand.email },
                    { label: 'Programme',    value: cand.programmeName || progName },
                    { label: 'Secteur',      value: cand.sector },
                    { label: 'Stade',        value: cand.stage },
                    { label: 'Localisation', value: cand.location },
                  ].filter(({ value }) => value).map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{value}</p>
                    </div>
                  ))}
                  {cand.description && (
                    <div className="col-span-full pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <p className="text-xs text-slate-400 mb-1">Description</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">{cand.description}</p>
                    </div>
                  )}
                  {cand.website && (
                    <div className="col-span-full">
                      <a href={cand.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                        <Icon.Globe />{cand.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TABS ── */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden">
              {/* Tab bar */}
              <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-700/60">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 border-b-2 -mb-px flex-shrink-0
                      ${activeTab === t.id
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                    <span className="opacity-70">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-6">

                {/* ── VIEW MODE ── */}
                {mode === 'view' && (
                  <>
                    {activeTab === 'scores' && (
                      <div className="space-y-3">
                        {!ev.scores?.length ? (
                          <EmptyState
                            icon={<Icon.Target />}
                            title="Aucun critère noté"
                            subtitle="Cliquez sur Modifier l'évaluation pour remplir les scores."
                            action={
                              <button onClick={handleEnterEdit}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                                <Icon.Edit />Compléter l'évaluation
                              </button>
                            }
                          />
                        ) : (
                          <>
                            {ev.scores.map((s, i) => <CriterionCard key={i} s={s} idx={i} />)}
                            {finalScore != null && (
                              <div className={`flex items-center justify-between rounded-2xl px-5 py-4 mt-2 ${col.bg} ring-1 ${col.ring}`}>
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Moyenne</p>
                                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{ev.scores.length} critère{ev.scores.length > 1 ? 's' : ''} évalués</p>
                                </div>
                                <span className={`text-3xl font-black tabular-nums ${col.text}`}>
                                  {finalScore.toFixed(2)}<span className="text-sm font-normal text-slate-400 ml-1">/10</span>
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === 'global' && (
                      <div className="space-y-6">
                        <div>
                          <SectionLabel>Commentaire global</SectionLabel>
                          {ev.globalRemark
                            ? <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{ev.globalRemark}</p>
                              </div>
                            : <p className="text-sm text-slate-400 italic">Aucun commentaire global ajouté.</p>}
                        </div>
                        {ev.recommendation && (
                          <div>
                            <SectionLabel>Recommandation finale</SectionLabel>
                            <Tag className={RECO_MAP[ev.recommendation]?.cls || 'bg-slate-100 text-slate-600'}>
                              <span className={`w-2 h-2 rounded-full ${RECO_MAP[ev.recommendation]?.dot || 'bg-slate-400'}`} />
                              {RECO_MAP[ev.recommendation]?.label || ev.recommendation}
                            </Tag>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'points' && (
                      <div className="space-y-8">
                        {/* Points forts */}
                        <div>
                          <SectionLabel>
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <Icon.Up />Points forts
                            </span>
                          </SectionLabel>
                          {ev.positivePoints?.length
                            ? <div className="space-y-2">
                                {ev.positivePoints.map((pt, i) => (
                                  <div key={i} className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl px-4 py-3">
                                    <span className="text-emerald-500 shrink-0 mt-0.5 w-4 h-4"><Icon.Check /></span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{pt}</p>
                                  </div>
                                ))}
                              </div>
                            : <p className="text-sm text-slate-400 italic">Aucun point fort renseigné.</p>}
                        </div>
                        {/* Points faibles */}
                        <div>
                          <SectionLabel>
                            <span className="inline-flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                              <Icon.Down />Points faibles
                            </span>
                          </SectionLabel>
                          {ev.negativePoints?.length
                            ? <div className="space-y-2">
                                {ev.negativePoints.map((pt, i) => (
                                  <div key={i} className="flex items-start gap-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-xl px-4 py-3">
                                    <span className="text-rose-400 shrink-0 mt-0.5 w-4 h-4"><Icon.Down /></span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{pt}</p>
                                  </div>
                                ))}
                              </div>
                            : <p className="text-sm text-slate-400 italic">Aucun point faible renseigné.</p>}
                        </div>
                      </div>
                    )}

                    {activeTab === 'feedbacks' && (
                      <div className="space-y-2.5">
                        {ev.feedbacks?.length
                          ? ev.feedbacks.map((f, i) => (
                              <div key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                                <span className="text-indigo-400 shrink-0 mt-0.5"><Icon.Msg /></span>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{f?.text || f}</p>
                              </div>
                            ))
                          : <p className="text-sm text-slate-400 italic py-4">Aucun feedback additionnel.</p>}
                      </div>
                    )}

                    {activeTab === 'form' && (
                      <div className="space-y-3">
                        {cand?.responses?.length > 0 ? (
                          <FormSection title={`Réponses au formulaire (${cand.responses.length})`} defaultOpen>
                            <div className="space-y-4">
                              {cand.responses.map((r, i) => (
                                <div key={i} className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">{r.question}</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{r.answer || '—'}</p>
                                </div>
                              ))}
                            </div>
                          </FormSection>
                        ) : (
                          applicationId ? (
                            <EmptyState
                              icon={<Icon.Doc />}
                              title="Réponses formulaire non chargées"
                              action={
                                <Link href={`/dashboard/jury/candidatures/${applicationId}`}>
                                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors">
                                    <Icon.Doc />Voir la candidature complète
                                  </button>
                                </Link>
                              }
                            />
                          ) : (
                            <p className="text-sm text-slate-400 italic py-4 text-center">Aucune réponse formulaire disponible.</p>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ── EDIT MODE ── */}
                {mode === 'edit' && (
                  <>
                    {activeTab === 'scores' && (
                      <div className="space-y-4">
                        {editScores.length === 0 ? (
                          <EmptyState icon={<Icon.Target />} title="Aucun critère chargé." />
                        ) : (
                          editScores.map((s, i) => (
                            <CriterionEditCard key={i} s={s} idx={i}
                              onChange={ns => setEditScores(prev => prev.map((sc, idx) => idx === i ? ns : sc))} />
                          ))
                        )}
                        {editScores.length > 0 && (
                          <div className={`flex items-center justify-between rounded-2xl px-5 py-4 ring-1 ${scoreColor(editAvg).bg} ${scoreColor(editAvg).ring}`}>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Score moyen</span>
                            <span className={`text-2xl font-black tabular-nums ${scoreColor(editAvg).text}`}>
                              {editAvg.toFixed(2)}<span className="text-sm font-normal text-slate-400 ml-1">/10</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'global' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Commentaire global</label>
                          <textarea rows={7} value={globalRemark} onChange={e => setGlobalRemark(e.target.value)}
                            placeholder="Vue d'ensemble, points forts, axes d'amélioration…"
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all" />
                          <p className="text-xs text-slate-400 mt-1.5">{globalRemark.length} caractères</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Recommandation finale</label>
                          <div className="flex gap-3 flex-wrap">
                            {[
                              { val: 'accept', label: 'Accepter', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200 dark:shadow-emerald-900 shadow-md' },
                              { val: 'review', label: 'À revoir',  activeCls: 'bg-amber-500 text-white border-amber-500 shadow-amber-200 dark:shadow-amber-900 shadow-md' },
                              { val: 'reject', label: 'Refuser',   activeCls: 'bg-rose-600 text-white border-rose-600 shadow-rose-200 dark:shadow-rose-900 shadow-md' },
                            ].map(opt => (
                              <button key={opt.val}
                                onClick={() => setRecommendation(recommendation === opt.val ? '' : opt.val)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2
                                  ${recommendation === opt.val ? opt.activeCls : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'points' && (
                      <div className="space-y-8">
                        {/* Points forts */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <Icon.Up />Points forts
                          </h3>
                          <div className="flex gap-2">
                            <input type="text" value={newPos} onChange={e => setNewPos(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && addItem(positivePoints, setPositivePoints, newPos, setNewPos)}
                              placeholder="Ex. : Équipe expérimentée…"
                              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-900/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                            <button onClick={() => addItem(positivePoints, setPositivePoints, newPos, setNewPos)}
                              className="px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center">
                              <Icon.Plus />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {positivePoints.map((pt, i) => (
                              <div key={i} className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl px-4 py-3">
                                <span className="text-emerald-500 shrink-0"><Icon.Check /></span>
                                <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">{pt}</p>
                                <button onClick={() => setPositivePoints(p => p.filter((_, j) => j !== i))}
                                  className="text-slate-300 hover:text-rose-500 transition-colors shrink-0 p-1"><Icon.Trash /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Points faibles */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-rose-500 dark:text-rose-400 flex items-center gap-2">
                            <Icon.Down />Points faibles
                          </h3>
                          <div className="flex gap-2">
                            <input type="text" value={newNeg} onChange={e => setNewNeg(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && addItem(negativePoints, setNegativePoints, newNeg, setNewNeg)}
                              placeholder="Ex. : Marché trop restreint…"
                              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-900/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all" />
                            <button onClick={() => addItem(negativePoints, setNegativePoints, newNeg, setNewNeg)}
                              className="px-4 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center">
                              <Icon.Plus />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {negativePoints.map((pt, i) => (
                              <div key={i} className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-xl px-4 py-3">
                                <span className="text-rose-400 shrink-0"><Icon.Down /></span>
                                <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">{pt}</p>
                                <button onClick={() => setNegativePoints(p => p.filter((_, j) => j !== i))}
                                  className="text-slate-300 hover:text-rose-500 transition-colors shrink-0 p-1"><Icon.Trash /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'feedbacks' && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input type="text" value={newFeed} onChange={e => setNewFeed(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(feedbacks, setFeedbacks, newFeed, setNewFeed)}
                            placeholder="Ajouter un feedback…"
                            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                          <button onClick={() => addItem(feedbacks, setFeedbacks, newFeed, setNewFeed)}
                            className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center">
                            <Icon.Plus />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {feedbacks.map((f, i) => (
                            <div key={i} className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-3.5">
                              <span className="text-indigo-400 shrink-0 mt-0.5"><Icon.Msg /></span>
                              <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">{typeof f === 'string' ? f : f?.text}</p>
                              <button onClick={() => setFeedbacks(p => p.filter((_, j) => j !== i))}
                                className="text-slate-300 hover:text-rose-500 transition-colors shrink-0 p-1"><Icon.Trash /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'form' && (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                        <span className="text-amber-500 shrink-0 mt-0.5"><Icon.Info /></span>
                        <p className="text-sm text-amber-700 dark:text-amber-400">Les réponses au formulaire sont en lecture seule et ne peuvent pas être modifiées.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-4">

            {/* Score summary card */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Récapitulatif</p>

                {/* Big score display */}
                <div className={`rounded-2xl px-5 py-5 text-center mb-5 ${col.bg} ring-1 ${col.ring}`}>
                  <p className="text-xs font-medium text-slate-400 mb-1">Score final</p>
                  <p className={`text-5xl font-black tabular-nums ${col.text} leading-none`}>
                    {finalScore != null ? finalScore.toFixed(1) : '—'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">/ 10</p>
                </div>

                {/* Per-criterion mini bars */}
                {ev.scores?.length > 0 && (
                  <div className="space-y-2.5">
                    {ev.scores.map((s, i) => {
                      const v = normToTen(s.score);
                      const c = scoreColor(v);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400 w-24 truncate shrink-0 leading-tight">{getCritLabel(s)}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${(v / 10) * 100}%` }} />
                          </div>
                          <span className={`text-xs font-bold tabular-nums w-8 text-right shrink-0 ${c.text}`}>{v.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recommendation & meta */}
              {(ev.recommendation || ev.submittedAt || ev.status) && (
                <div className="border-t border-slate-100 dark:border-slate-700/60 px-5 py-4 space-y-3">
                  {ev.recommendation && (
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Recommandation</p>
                      <Tag className={RECO_MAP[ev.recommendation]?.cls || 'bg-slate-100 text-slate-600'}>
                        <span className={`w-2 h-2 rounded-full ${RECO_MAP[ev.recommendation]?.dot}`} />
                        {RECO_MAP[ev.recommendation]?.label || ev.recommendation}
                      </Tag>
                    </div>
                  )}
                  <div className="space-y-1.5 text-xs text-slate-400">
                    {ev.submittedAt && (
                      <p className="flex items-center gap-1.5"><Icon.Calendar />Soumis le {fmtDate(ev.submittedAt)}</p>
                    )}
                    {ev.sentToAdmin && ev.sentToAdminAt && (
                      <p className="flex items-center gap-1.5 text-emerald-500">
                        <Icon.Check />Envoyé admin le {fmtDate(ev.sentToAdminAt)}
                      </p>
                    )}
                    {ev.status && (
                      <p className="capitalize">
                        <span className="text-slate-400">Statut : </span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{ev.status}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions card */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-5 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Actions</p>

              {mode === 'view' ? (
                <>
                  <button onClick={handleEnterEdit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm shadow-indigo-200 dark:shadow-indigo-900">
                    <Icon.Edit />Modifier l'évaluation
                  </button>

                  {ev && !ev.sentToAdmin ? (
                    <button onClick={async () => {
                        setSending(true);
                        try {
                          await axiosAuth.post(`/api/jury-space/evaluations/${ev._id}/send-to-admin`);
                          showToast("Évaluation envoyée à l'admin !");
                          await loadAll();
                        } catch (err) { showToast(err.response?.data?.message || 'Erreur', 'error'); }
                        finally { setSending(false); }
                      }} disabled={sending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm shadow-emerald-200 dark:shadow-emerald-900">
                      {sending ? <Icon.Spin /> : <Icon.Send />}
                      Envoyer à l'administration
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold ring-1 ring-emerald-200 dark:ring-emerald-800">
                      <Icon.Check />Déjà envoyé à l'admin
                    </div>
                  )}

                  <div className="pt-1 space-y-2">
                    <button onClick={() => router.push('/dashboard/jury/evaluations')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <Icon.List />Retour à la liste
                    </button>
                    {applicationId && (
                      <Link href={`/dashboard/jury/candidatures/${applicationId}`} className="block">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <Icon.Doc />Voir la candidature
                        </button>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {editScores.length > 0 && (
                    <div className={`rounded-xl px-4 py-3 mb-2 ${scoreColor(editAvg).bg} ring-1 ${scoreColor(editAvg).ring}`}>
                      <p className="text-xs text-slate-400 mb-0.5">Aperçu score</p>
                      <p className={`text-2xl font-black tabular-nums ${scoreColor(editAvg).text}`}>
                        {editAvg.toFixed(2)}<span className="text-sm font-normal text-slate-400 ml-1">/10</span>
                      </p>
                    </div>
                  )}

                  <button onClick={handleSave} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm shadow-indigo-200 dark:shadow-indigo-900">
                    {saving ? <Icon.Spin /> : <Icon.Save />}
                    Sauvegarder
                  </button>

                  <button onClick={handleSendToAdmin} disabled={sending || ev.sentToAdmin}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150
                      ${ev.sentToAdmin
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900'}`}>
                    {sending ? <Icon.Spin /> : <Icon.Send />}
                    {ev.sentToAdmin ? 'Déjà envoyé' : 'Sauvegarder & Envoyer'}
                  </button>

                  <button onClick={handleCancelEdit}
                    className="w-full px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    Annuler les modifications
                  </button>
                </>
              )}
            </div>

            {/* Programme badge */}
            {progName && progName !== '—' && (
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Programme</p>
                <p className="font-bold text-slate-800 dark:text-white">{progName}</p>
                {cand?.appliedAt && (
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <Icon.Calendar />Candidature le {fmtDate(cand.appliedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Not found */}
      {!loading && !ev && (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Icon.Target />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">Évaluation introuvable</p>
          <p className="text-slate-400 text-sm mb-6">Cette évaluation n'existe pas ou vous n'y avez pas accès.</p>
          <button onClick={() => router.push('/dashboard/jury/evaluations')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Icon.Back />Retour à la liste
          </button>
        </div>
      )}
    </div>
  );
}

export default function JuryEvaluationDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['jury', 'mentor', 'admin']}>
      <DashboardLayout>
        <EvaluationDetailPage />
      </DashboardLayout>
    </ProtectedRoute>
  );
}