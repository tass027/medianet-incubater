'use client';

// /app/dashboard/startup/candidatures/page.jsx
// Utilise GET /api/startup/candidatures (nouveau endpoint dédié)

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:     { label:'Brouillon',       color:'#64748b', bg:'bg-slate-100 dark:bg-slate-900/50',    text:'text-slate-600 dark:text-slate-400',    dot:'bg-slate-400'   },
  pending:   { label:'En attente',      color:'#3b82f6', bg:'bg-blue-50 dark:bg-blue-950/30',       text:'text-blue-700 dark:text-blue-400',       dot:'bg-blue-500 animate-pulse'   },
  reviewing: { label:'En évaluation',   color:'#f59e0b', bg:'bg-amber-50 dark:bg-amber-950/30',     text:'text-amber-700 dark:text-amber-400',     dot:'bg-amber-500 animate-pulse'  },
  interview: { label:'Entretien prévu', color:'#8b5cf6', bg:'bg-violet-50 dark:bg-violet-950/30',   text:'text-violet-700 dark:text-violet-400',   dot:'bg-violet-500'  },
  accepted:  { label:'Acceptée ✓',      color:'#10b981', bg:'bg-emerald-50 dark:bg-emerald-950/30', text:'text-emerald-700 dark:text-emerald-400', dot:'bg-emerald-500' },
  rejected:  { label:'Non retenue',     color:'#ef4444', bg:'bg-red-50 dark:bg-red-950/30',         text:'text-red-700 dark:text-red-400',         dot:'bg-red-500'     },
};

// ── ICONS ─────────────────────────────────────────────────────────────────────
const IC = {
  Check:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  Clock:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Cal:     ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Eye:     ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  Down:    ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/></svg>,
  Up:      ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7"/></svg>,
  Plus:    ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  Filter:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>,
  Rocket:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  Refresh: ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  Star:    ({ c }) => <svg className={c} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  Tag:     ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>,
  Warn:    ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
  Trash:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  Money:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

// ── MINI TIMELINE ─────────────────────────────────────────────────────────────
function MiniTimeline({ status, timelineSteps }) {
  const steps = ['pending', 'reviewing', 'interview', 'accepted'];
  const idx = steps.indexOf(status);
  const isRejected = status === 'rejected';
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const done    = !isRejected && i <= idx;
        const current = !isRejected && i === idx;
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all
              ${done ? 'bg-emerald-500' : current ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {done && <IC.Check c="w-3 h-3 text-white"/>}
              {!done && <span className={`w-1.5 h-1.5 rounded-full ${current ? 'bg-white' : 'bg-gray-400'}`}/>}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-4 ${i < idx ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── CANDIDATURE CARD ──────────────────────────────────────────────────────────
function CandidatureCard({ app, index, onWithdraw }) {
  const [expanded,    setExpanded]    = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
  const r   = app.formResponses || {};

  const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '—';
  const daysSince = app.appliedAt
    ? Math.floor((Date.now() - new Date(app.appliedAt)) / 864e5) : null;

  const canWithdraw = ['draft','pending'].includes(app.status);

  const handleWithdraw = async () => {
    if (!confirm('Retirer cette candidature ? Cette action est irréversible.')) return;
    setWithdrawing(true);
    try {
      await onWithdraw(app._id);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden"
      style={{
        borderLeft: `4px solid ${cfg.color}`,
        opacity: 0,
        animation: `slideUp 0.5s ease-out ${index * 0.08}s forwards`,
      }}
    >
      {/* ── Header ── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                {cfg.label}
              </span>
              {r.sector && (
                <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {r.sector}
                </span>
              )}
              {app.programme?.sector && !r.sector && (
                <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {app.programme.sector}
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
              {app.programmeName || 'Candidature spontanée'}
            </h3>
            {r.startupName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {r.startupName}
                {r.stage && <span className="ml-2 text-xs">· {r.stage}</span>}
              </p>
            )}
          </div>
          {app.aiScore?.total > 0 && (
            <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
              <IC.Star c="w-4 h-4"/>
              <span className="text-sm font-bold">{app.aiScore.total}/100</span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <IC.Cal c="w-3.5 h-3.5"/>
            <span>Soumis le {fmtDate(app.appliedAt)}</span>
            {daysSince !== null && <span className="text-gray-400">({daysSince}j)</span>}
          </div>
          {app.programme?.fundingAmount && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <IC.Money c="w-3.5 h-3.5"/>
              <span>{app.programme.fundingAmount}</span>
            </div>
          )}
          {r.fundingNeeded && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <IC.Tag c="w-3.5 h-3.5"/>
              <span>{r.fundingNeeded}</span>
            </div>
          )}
        </div>

        {/* Timeline + Actions */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <MiniTimeline status={app.status} timelineSteps={app.timelineSteps}/>
          <div className="flex items-center gap-2">
            {canWithdraw && (
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Retirer la candidature"
              >
                <IC.Trash c={`w-3.5 h-3.5 ${withdrawing ? 'animate-spin' : ''}`}/>
              </button>
            )}
            <Link
              href={`/dashboard/startup/status?appId=${app._id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background:'linear-gradient(135deg,#00526e,#0088ba)' }}
            >
              <IC.Eye c="w-3.5 h-3.5"/> Suivi détaillé
            </Link>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {expanded ? <IC.Up c="w-4 h-4"/> : <IC.Down c="w-4 h-4"/>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-900/30">

          {/* Infos programme */}
          {app.programme && (
            <div className="mb-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] text-blue-400 uppercase tracking-wide mb-1.5">Infos programme</p>
              <div className="grid grid-cols-2 gap-2">
                {app.programme.fundingAmount && (
                  <div>
                    <p className="text-[10px] text-gray-400">Financement</p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{app.programme.fundingAmount}</p>
                  </div>
                )}
                {app.programme.duration && (
                  <div>
                    <p className="text-[10px] text-gray-400">Durée</p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{app.programme.duration}</p>
                  </div>
                )}
                {app.programme.deadline && (
                  <div>
                    <p className="text-[10px] text-gray-400">Clôture</p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {new Date(app.programme.deadline).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Réponses formulaire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label:'Startup',     value: r.startupName   },
              { label:'Secteur',     value: r.sector        },
              { label:'Stade',       value: r.stage         },
              { label:'Équipe',      value: r.teamSize      },
              { label:'Financement', value: r.fundingNeeded },
              { label:'Fondateur',   value: r.founderName   },
            ].filter(f => f.value).map((field, i) => (
              <div key={i}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{field.label}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{field.value}</p>
              </div>
            ))}
          </div>

          {r.description && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">{r.description}</p>
            </div>
          )}

          {/* Timeline historique */}
          {app.timelineSteps?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Historique</p>
              <div className="space-y-1.5">
                {app.timelineSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      step.status === 'done'   ? 'bg-emerald-500' :
                      step.status === 'active' ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'
                    }`}/>
                    <span className={step.status === 'active' ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                      {step.label}
                    </span>
                    {step.date && (
                      <span className="ml-auto text-gray-400 font-mono">
                        {new Date(step.date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score IA */}
          {app.aiScore?.total > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Score IA</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {app.aiScore.total}<span className="text-sm text-gray-400">/100</span>
                </p>
                {app.aiScore.summary && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic flex-1 line-clamp-2">
                    "{app.aiScore.summary}"
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Link
              href={`/dashboard/startup/status?appId=${app._id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:shadow-md transition-all"
              style={{ background:'linear-gradient(135deg,#00526e,#0088ba)' }}
            >
              <IC.Eye c="w-3.5 h-3.5"/> Voir suivi complet
            </Link>
            {app.isAccepted && (
              <Link
                href="/dashboard/startup/kpis"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:shadow-md transition-all"
                style={{ background:'linear-gradient(135deg,#059669,#10b981)' }}
              >
                <IC.Star c="w-3.5 h-3.5"/> Espace Fondateur
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function CandidaturesPage() {
  const { accessToken } = useSelector(s => s.auth);

  const [mounted,      setMounted]      = useState(false);
  const [applications, setApplications] = useState([]);
  const [stats,        setStats]        = useState({});
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [filter,       setFilter]       = useState('all');
  const [alert,        setAlert]        = useState(null);

  useEffect(() => { setMounted(true); loadApplications(); }, [accessToken]);

  const loadApplications = async (isRefresh = false) => {
    if (!accessToken) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      // ── Nouvel endpoint dédié ──
      const { data } = await axiosAuth.get('/api/startup/candidatures');
      setApplications(data.applications || []);
      setStats(data.stats || {});
    } catch {
      setAlert({ type:'error', message:'Impossible de charger les candidatures.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleWithdraw = async (appId) => {
    try {
      await axiosAuth.delete(`/api/startup/candidatures/${appId}`);
      setApplications(prev => prev.filter(a => a._id !== appId));
      setAlert({ type:'success', message:'Candidature retirée avec succès.' });
    } catch (err) {
      setAlert({ type:'error', message: err.response?.data?.message || 'Impossible de retirer la candidature.' });
    }
  };

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  const FILTERS = [
    { key:'all',       label:'Toutes',       count: applications.length },
    { key:'pending',   label:'En attente',   count: stats.pending   || 0 },
    { key:'reviewing', label:'Évaluation',   count: stats.reviewing || 0 },
    { key:'interview', label:'Entretien',    count: stats.interview || 0 },
    { key:'accepted',  label:'Acceptées',    count: stats.accepted  || 0 },
    { key:'rejected',  label:'Non retenues', count: stats.rejected  || 0 },
  ];

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['startup','founder','applicant']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { font-family:'Inter',sans-serif; }
          @keyframes slideUp {
            from { opacity:0; transform:translateY(20px); }
            to   { opacity:1; transform:translateY(0); }
          }
          .glass-card {
            background:rgba(255,255,255,0.97);
            border:1px solid rgba(0,0,0,0.06);
            box-shadow:0 1px 3px rgba(0,0,0,0.05);
            transition:all 0.3s ease;
          }
          :global(.dark) .glass-card { background:#1e293b; border:1px solid #334155; }
          .glass-card:hover { box-shadow:0 8px 25px -8px rgba(0,82,110,0.12); }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* HEADER */}
          <div
            className="relative overflow-hidden rounded-2xl p-8"
            style={{ background:'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)', animation:'slideUp 0.4s ease-out forwards' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"/>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"/>
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/90 tracking-wide">
                    MES CANDIDATURES
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-300">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                    {stats.active || 0} en cours
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Suivi de mes candidatures</h1>
                <p className="text-blue-100 text-base max-w-2xl">
                  Retrouvez l'ensemble de vos candidatures aux programmes d'incubation MEDIANET avec leurs statuts et détails.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label:'Total',     value: stats.total    || 0 },
                  { label:'En cours',  value: stats.active   || 0 },
                  { label:'Acceptées', value: stats.accepted || 0 },
                  { label:'Non ret.',  value: stats.rejected || 0 },
                ].map((s, i) => (
                  <div key={i} className="text-center px-3 py-2 rounded-xl" style={{ background:'rgba(255,255,255,0.1)' }}>
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-blue-200 text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
              <IC.Filter c="w-4 h-4 text-gray-400 flex-shrink-0"/>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                    filter === f.key
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                  style={filter === f.key ? { background:'linear-gradient(135deg,#00526e,#0088ba)' } : {}}
                >
                  {f.label}
                  {f.key !== 'all' && f.count > 0 && (
                    <span className="ml-1 opacity-70">({f.count})</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => loadApplications(true)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary-600 transition-colors"
              >
                <IC.Refresh c={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}/>
              </button>
              <Link
                href="/dashboard/startup/programmes"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white hover:shadow-md transition-all"
                style={{ background:'linear-gradient(135deg,#00526e,#0088ba)' }}
              >
                <IC.Plus c="w-3.5 h-3.5"/> Nouvelle candidature
              </Link>
            </div>
          </div>

          {/* ALERT */}
          {alert && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              alert.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700'
            }`}>
              {alert.type === 'success' ? <IC.Check c="w-5 h-5"/> : <IC.Warn c="w-5 h-5"/>}
              <span className="text-sm">{alert.message}</span>
              <button onClick={() => setAlert(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
            </div>
          )}

          {/* CONTENT */}
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"/>
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"/>
                  </div>
                  <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"/>
                  <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-lg"/>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {filter === 'all' ? 'Aucune candidature' : `Aucune candidature "${STATUS_CONFIG[filter]?.label}"`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                {filter === 'all' ? "Vous n'avez pas encore soumis de candidature." : 'Aucune candidature ne correspond à ce filtre.'}
              </p>
              <Link
                href="/dashboard/startup/programmes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm hover:shadow-lg transition-all"
                style={{ background:'linear-gradient(135deg,#00526e,#0088ba)' }}
              >
                <IC.Rocket c="w-4 h-4"/> Voir les programmes disponibles
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filtered.length} candidature{filtered.length !== 1 ? 's' : ''}
                {filter !== 'all' && <span className="ml-1">· "{STATUS_CONFIG[filter]?.label}"</span>}
              </p>
              {filtered
                .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
                .map((app, i) => (
                  <CandidatureCard
                    key={app._id || i}
                    app={app}
                    index={i}
                    onWithdraw={handleWithdraw}
                  />
                ))}
            </div>
          )}

          {/* FOOTER CTA */}
          {applications.length > 0 && (
            <div className="glass-card rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Vous pouvez candidater à plusieurs programmes simultanément
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Explorez les nouveaux programmes ouverts et augmentez vos chances
                </p>
              </div>
              <Link
                href="/dashboard/startup/programmes"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-md transition-all flex-shrink-0"
                style={{ background:'linear-gradient(135deg,#00526e,#0088ba)' }}
              >
                <IC.Rocket c="w-4 h-4"/> Voir les programmes
              </Link>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}