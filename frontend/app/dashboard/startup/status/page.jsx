'use client';

// /app/dashboard/startup/status/page.jsx
// Design aligné sur la page candidatures — même UI, même glass-card, sans split-panel

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ── STATUS CONFIG (même que candidatures) ─────────────────────────────────────
const STATUS_CONFIG = {
  draft:     { label: 'Brouillon',       color: '#64748b', bg: 'bg-slate-100',    text: 'text-slate-600',    dot: 'bg-slate-400'                     },
  pending:   { label: 'Soumise',         color: '#3b82f6', bg: 'bg-blue-50',      text: 'text-blue-700',     dot: 'bg-blue-500 animate-pulse'         },
  reviewing: { label: 'En évaluation',   color: '#f59e0b', bg: 'bg-amber-50',     text: 'text-amber-700',    dot: 'bg-amber-500 animate-pulse'        },
  interview: { label: 'Entretien prévu', color: '#8b5cf6', bg: 'bg-violet-50',    text: 'text-violet-700',   dot: 'bg-violet-500'                     },
  accepted:  { label: 'Acceptée',        color: '#10b981', bg: 'bg-emerald-50',   text: 'text-emerald-700',  dot: 'bg-emerald-500'                    },
  rejected:  { label: 'Non retenue',     color: '#ef4444', bg: 'bg-red-50',       text: 'text-red-700',      dot: 'bg-red-500'                        },
};

const PIPELINE_STEPS = [
  { key: 'pending',   label: 'Soumise'    },
  { key: 'reviewing', label: 'Évaluation' },
  { key: 'interview', label: 'Entretien'  },
  { key: 'accepted',  label: 'Acceptée'   },
];

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Soumise'       },
  { key: 'reviewing', label: 'Évaluation'    },
  { key: 'interview', label: 'Entretien'     },
  { key: 'decision',  label: 'Décision finale' },
];

// ── ICONS ─────────────────────────────────────────────────────────────────────
const IC = {
  Check:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  Clock:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Cal:     ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Down:    ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/></svg>,
  Up:      ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7"/></svg>,
  Back:    ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/></svg>,
  Plus:    ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  Filter:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>,
  Refresh: ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  Star:    ({ c }) => <svg className={c} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  Warn:    ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
  Rocket:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const daysSince = d => d ? Math.floor((Date.now() - new Date(d)) / 864e5) : 0;

function mapApp(app) {
  const r = app.formResponses || {};
  return {
    _id:         app._id,
    name:        app.programmeName || 'Candidature spontanée',
    startupName: r.startupName || '',
    sector:      r.sector || app.programme?.sector || '',
    stage:       r.stage  || '',
    funding:     r.fundingNeeded || '',
    status:      app.status || 'pending',
    submittedAt: app.appliedAt,
    decidedAt:   app.decidedAt,
    score:       app.aiScore?.total || null,
    timeline:    app.timelineSteps || [],
    aiScore:     app.aiScore || null,
    programme:   app.programme || null,
    isAccepted:  app.isAccepted || false,
  };
}

// ── MINI PIPELINE BAR (idem candidatures) ─────────────────────────────────────
function PipelineBar({ status }) {
  const steps   = PIPELINE_STEPS;
  const idx     = steps.findIndex(s => s.key === status);
  const isRejected = status === 'rejected';
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const done    = !isRejected && i <= idx;
        const current = !isRejected && i === idx;
        return (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all
              ${done ? 'bg-emerald-500' : current ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {done && !current
                ? <IC.Check c="w-3 h-3 text-white"/>
                : <span className={`w-1.5 h-1.5 rounded-full ${current ? 'bg-white' : 'bg-gray-400'}`}/>}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-6 ${i < idx && !isRejected ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`}/>
            )}
          </div>
        );
      })}
      {isRejected && (
        <span className="ml-2 text-xs text-red-500 font-medium">Non retenue</span>
      )}
    </div>
  );
}

// ── TIMELINE DÉTAILLÉ (section dépliée) ───────────────────────────────────────
function TimelineDetail({ steps, status }) {
  return (
    <div className="relative mt-4">
      <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-200 dark:bg-gray-700"/>
      <div className="space-y-4">
        {TIMELINE_STEPS.map((ds) => {
          const stepData = steps.find(s => s.step === ds.key);
          const isDone   = stepData?.status === 'done';
          const isActive = stepData?.status === 'active';
          return (
            <div key={ds.key} className="flex gap-3 items-start">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all
                ${isDone ? 'bg-emerald-500' : isActive ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {isDone
                  ? <IC.Check c="w-3.5 h-3.5 text-white"/>
                  : isActive
                    ? <span className="w-2 h-2 rounded-full bg-white"/>
                    : <span className="w-2 h-2 rounded-full bg-gray-400"/>
                }
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${isDone || isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {ds.label}
                  </span>
                  {stepData?.date
                    ? <span className="text-xs text-gray-400 font-mono">{fmtDate(stepData.date)}</span>
                    : isActive && <span className="text-xs text-amber-500 animate-pulse">En cours</span>
                  }
                </div>
                {stepData?.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{stepData.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SCORE BREAKDOWN ───────────────────────────────────────────────────────────
function ScoreBreakdown({ aiScore }) {
  if (!aiScore?.scores) return null;
  const cats = [
    { key: 'problem',  label: 'Problème',  max: 20 },
    { key: 'market',   label: 'Marché',    max: 20 },
    { key: 'team',     label: 'Équipe',    max: 20 },
    { key: 'solution', label: 'Solution',  max: 20 },
    { key: 'traction', label: 'Traction',  max: 20 },
  ];
  return (
    <div className="space-y-2.5 mt-3">
      {cats.map(c => {
        const val   = aiScore.scores[c.key] || 0;
        const pct   = (val / c.max) * 100;
        const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
        return (
          <div key={c.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">{c.label}</span>
              <span className="font-semibold" style={{ color }}>{val}/{c.max}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ACTIONS SUGGÉRÉES ────────────────────────────────────────────────────────
function ActionsSection({ status, appId }) {
  const actions = {
    pending:   [
      { title: 'Préparer votre pitch deck',          desc: 'Mettez à jour avec les derniers KPIs',     urgent: false },
      { title: 'Ajouter les projections financières', desc: 'Les projections 3 ans sont recommandées', urgent: true  },
    ],
    reviewing: [
      { title: 'Préparer votre pitch deck',          desc: 'Assurez-vous que tout est à jour',         urgent: false },
    ],
    interview: [
      { title: "Préparer l'entretien", desc: "Consultez le guide et préparez vos réponses", urgent: true, link: '/resources/interview-guide' },
    ],
    accepted:  [
      { title: "Accéder à l'espace Fondateur", desc: 'KPIs, investisseurs et mentorat disponibles', urgent: false, link: '/dashboard/startup/kpis' },
    ],
  };
  const list = actions[status] || [];
  if (list.length === 0) {
    return (
      <div className="text-center py-6">
        <IC.Check c="w-8 h-8 mx-auto mb-2 text-emerald-400"/>
        <p className="text-sm text-gray-500 dark:text-gray-400">Aucune action requise pour l'instant</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 mt-3">
      {list.map((a, i) => (
        <div key={i} className={`p-3 rounded-xl border flex gap-3 items-start
          ${a.urgent ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
          <IC.Warn c={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.urgent ? 'text-red-400' : 'text-blue-400'}`}/>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.desc}</p>
            {a.link && (
              <Link href={a.link} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Voir le guide
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CARTE DE SUIVI COMPLET ────────────────────────────────────────────────────
function StatusCard({ app, index }) {
  const [tab,      setTab]      = useState('timeline');
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;

  const TABS = [
    { id: 'timeline', label: 'Parcours'   },
    { id: 'score',    label: 'Évaluation' },
    { id: 'actions',  label: 'Actions'    },
  ];

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden"
      style={{
        borderLeft: `4px solid ${cfg.color}`,
        opacity: 0,
        animation: `slideUp 0.5s ease-out ${index * 0.1}s forwards`,
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
              {app.sector && (
                <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {app.sector}
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{app.name}</h3>
            {app.startupName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {app.startupName}
                {app.stage && <span className="ml-2 text-xs">· {app.stage}</span>}
              </p>
            )}
          </div>
          {app.score !== null && app.score !== undefined && (
            <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
              <IC.Star c="w-4 h-4"/>
              <span className="text-sm font-bold">{app.score}/100</span>
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div className="mt-3 mb-4">
          <PipelineBar status={app.status}/>
          <div className="flex items-center justify-between mt-2">
            {PIPELINE_STEPS.map(s => (
              <span key={s.key} className="text-[10px] text-gray-400 flex-1 text-center">{s.label}</span>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex items-center gap-1.5">
            <IC.Cal c="w-3.5 h-3.5"/>
            <span>Soumise le {fmtDate(app.submittedAt)}</span>
            <span className="text-gray-300">·</span>
            <span>{daysSince(app.submittedAt)} jour{daysSince(app.submittedAt) !== 1 ? 's' : ''}</span>
          </div>
          {app.score === null && (
            <span className="italic text-gray-400">Score en attente</span>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-end gap-2 mt-3">
          <a
            href="mailto:incubation@medianet.tn"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
          >
            Contacter
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
          >
            {expanded ? <><IC.Up c="w-3.5 h-3.5"/> Réduire</> : <><IC.Down c="w-3.5 h-3.5"/> Voir le détail</>}
          </button>
        </div>
      </div>

      {/* ── Détail déplié ── */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-900/30">

          {/* Onglets */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: tab === t.id ? '#fff' : 'transparent',
                  color:      tab === t.id ? '#1e293b' : '#94a3b8',
                  boxShadow:  tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenu onglets */}
          {tab === 'timeline' && (
            <TimelineDetail steps={app.timeline} status={app.status}/>
          )}

          {tab === 'score' && (
            <div>
              {app.score !== null && app.score !== undefined ? (
                <>
                  <div className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                    <div className="text-4xl font-black text-amber-500">{app.score}</div>
                    <div>
                      <p className="text-xs text-gray-500">Score global</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">sur 100 points</p>
                    </div>
                  </div>
                  <ScoreBreakdown aiScore={app.aiScore}/>
                  {app.aiScore?.summary && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-400">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">Commentaire évaluateur</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{app.aiScore.summary}"</p>
                    </div>
                  )}
                  {app.aiScore?.strengths?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-emerald-600 mb-2">Points forts</p>
                      <div className="space-y-1.5">
                        {app.aiScore.strengths.map((s, i) => (
                          <div key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                            <span className="text-emerald-500 flex-shrink-0">—</span>{s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {app.aiScore?.weaknesses?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-amber-600 mb-2">Axes d'amélioration</p>
                      <div className="space-y-1.5">
                        {app.aiScore.weaknesses.map((s, i) => (
                          <div key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                            <span className="text-amber-500 flex-shrink-0">—</span>{s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <IC.Clock c="w-8 h-8 mx-auto mb-2 text-gray-300"/>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Score en attente</p>
                  <p className="text-xs text-gray-400 mt-1">Disponible après la revue du comité</p>
                </div>
              )}
            </div>
          )}

          {tab === 'actions' && (
            <ActionsSection status={app.status} appId={app._id}/>
          )}

          {/* Info programme si dispo */}
          {app.programme && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Infos programme</p>
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
              </div>
            </div>
          )}

          {/* CTA Espace fondateur */}
          {app.isAccepted && (
            <div className="mt-4">
              <Link
                href="/dashboard/startup/kpis"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-white hover:shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                <IC.Star c="w-3.5 h-3.5"/> Accéder à l'espace Fondateur
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function StatusPage() {
  const { accessToken } = useSelector(s => s.auth);
  const searchParams    = useSearchParams();
  const focusedAppId    = searchParams.get('appId');

  const [mounted,      setMounted]      = useState(false);
  const [applications, setApplications] = useState([]);
  const [stats,        setStats]        = useState({});
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [filter,       setFilter]       = useState('all');
  const [alert,        setAlert]        = useState(null);

  useEffect(() => { setMounted(true); loadData(); }, [accessToken]);

  // Si un appId est fourni via query param, filtre ou met en avant cette candidature
  useEffect(() => {
    if (focusedAppId && applications.length > 0) {
      const app = applications.find(a => a._id === focusedAppId);
      if (app) setFilter(app.status);
    }
  }, [focusedAppId, applications]);

  const loadData = async (isRefresh = false) => {
    if (!accessToken) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await axiosAuth.get('/api/startup/candidatures');
      const mapped = (data.applications || []).map(mapApp);
      setApplications(mapped);
      setStats(data.stats || {});
    } catch {
      setAlert({ type: 'error', message: 'Impossible de charger les données.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const FILTERS = [
    { key: 'all',       label: 'Toutes',       count: applications.length  },
    { key: 'pending',   label: 'En attente',   count: stats.pending   || 0 },
    { key: 'reviewing', label: 'Évaluation',   count: stats.reviewing || 0 },
    { key: 'interview', label: 'Entretien',    count: stats.interview || 0 },
    { key: 'accepted',  label: 'Acceptées',    count: stats.accepted  || 0 },
    { key: 'rejected',  label: 'Non retenues', count: stats.rejected  || 0 },
  ];

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  // Si focusedAppId, trie cette app en premier
  const sorted = [...filtered].sort((a, b) => {
    if (a._id === focusedAppId) return -1;
    if (b._id === focusedAppId) return 1;
    return new Date(b.submittedAt) - new Date(a.submittedAt);
  });

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { font-family: 'Inter', sans-serif; }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .glass-card {
            background: rgba(255,255,255,0.97);
            border: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
          }
          :global(.dark) .glass-card {
            background: #1e293b;
            border: 1px solid #334155;
          }
          .glass-card:hover {
            box-shadow: 0 8px 25px -8px rgba(0,82,110,0.12);
          }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* HEADER — identique à la page candidatures */}
          <div
            className="relative overflow-hidden rounded-2xl p-8"
            style={{
              background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)',
              animation: 'slideUp 0.4s ease-out forwards',
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"/>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"/>
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Link
                    href="/dashboard/startup/candidatures"
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-medium text-white/80 transition-colors"
                  >
                    <IC.Back c="w-3.5 h-3.5"/> Mes candidatures
                  </Link>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-300">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                    {stats.active || 0} en cours
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Suivi par évaluation</h1>
                <p className="text-blue-100 text-base max-w-2xl">
                  Vue détaillée de la progression de vos candidatures, scores et actions recommandées.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total',     value: stats.total    || 0 },
                  { label: 'En cours',  value: stats.active   || 0 },
                  { label: 'Acceptées', value: stats.accepted || 0 },
                  { label: 'Non ret.',  value: stats.rejected || 0 },
                ].map((s, i) => (
                  <div key={i} className="text-center px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-blue-200 text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BARRE DE FILTRES — identique à la page candidatures */}
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
                  style={filter === f.key ? { background: 'linear-gradient(135deg,#00526e,#0088ba)' } : {}}
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
                onClick={() => loadData(true)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors"
                title="Actualiser"
              >
                <IC.Refresh c={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}/>
              </button>
              <Link
                href="/dashboard/startup/programmes"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white hover:shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}
              >
                <IC.Plus c="w-3.5 h-3.5"/> Nouvelle candidature
              </Link>
            </div>
          </div>

          {/* ALERTE */}
          {alert && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              alert.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700'
            }`}>
              {alert.type === 'success' ? <IC.Check c="w-5 h-5"/> : <IC.Warn c="w-5 h-5"/>}
              <span className="text-sm">{alert.message}</span>
              <button onClick={() => setAlert(null)} className="ml-auto opacity-50 hover:opacity-100">x</button>
            </div>
          )}

          {/* CONTENU */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
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
          ) : sorted.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <IC.Rocket c="w-10 h-10 mx-auto mb-4 text-gray-300"/>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {filter === 'all' ? 'Aucune candidature' : `Aucune candidature "${STATUS_CONFIG[filter]?.label}"`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                {filter === 'all'
                  ? "Vous n'avez pas encore soumis de candidature."
                  : 'Aucune candidature ne correspond à ce filtre.'}
              </p>
              <Link
                href="/dashboard/startup/programmes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm hover:shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}
              >
                <IC.Rocket c="w-4 h-4"/> Voir les programmes disponibles
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sorted.length} candidature{sorted.length !== 1 ? 's' : ''}
                {filter !== 'all' && <span className="ml-1">· "{STATUS_CONFIG[filter]?.label}"</span>}
              </p>
              {sorted.map((app, i) => (
                <StatusCard
                  key={app._id || i}
                  app={app}
                  index={i}
                />
              ))}
            </div>
          )}

          {/* FOOTER CTA */}
          {applications.length > 0 && (
            <div className="glass-card rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Vous avez des questions sur votre candidature ?
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  L'équipe MEDIANET Incubator est disponible pour vous accompagner
                </p>
              </div>
              <a
                href="mailto:incubation@medianet.tn"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-md transition-all flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}
              >
                Contacter l'équipe
              </a>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}