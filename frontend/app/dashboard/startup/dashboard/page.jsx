'use client';

// /app/dashboard/startup/dashboard/page.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';

const BASE     = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE = `${BASE}/api`;

// ─── Helper : extrait un tableau depuis n'importe quelle structure API ────────
function extractArray(json) {
  if (!json) return [];
  // Cas tableau direct
  if (Array.isArray(json)) return json;
  // Cas { data: [...] }
  if (Array.isArray(json.data)) return json.data;
  // Cas { data: { docs: [...] } }
  if (json.data && Array.isArray(json.data.docs)) return json.data.docs;
  // Cas { applications: [...] }
  if (Array.isArray(json.applications)) return json.applications;
  // Cas { candidatures: [...] }
  if (Array.isArray(json.candidatures)) return json.candidatures;
  // Cas { docs: [...] }
  if (Array.isArray(json.docs)) return json.docs;
  // Cas { results: [...] }
  if (Array.isArray(json.results)) return json.results;
  console.warn('⚠️ Structure API inconnue — aucun tableau trouvé:', json);
  return [];
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  rocket:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  check:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  clock:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  chart:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  plus:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  arrow:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7"/></svg>,
  star:    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  lock:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  mentor:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  timeIc:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  support: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  warn:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
};

// ─── Config statuts ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  draft:     { label: 'Brouillon',       bg: '#f1f5f9', color: '#475569' },
  pending:   { label: 'En attente',      bg: '#fef3c7', color: '#92400e' },
  reviewing: { label: 'En évaluation',   bg: '#dbeafe', color: '#1e40af' },
  review:    { label: 'En révision',     bg: '#dbeafe', color: '#1e40af' },
  interview: { label: 'Entretien prévu', bg: '#ede9fe', color: '#4c1d95' },
  approved:  { label: 'Approuvée ✓',    bg: '#d1fae5', color: '#065f46' },
  accepted:  { label: 'Acceptée ✓',     bg: '#d1fae5', color: '#065f46' },
  rejected:  { label: 'Non retenue',     bg: '#fee2e2', color: '#991b1b' },
};

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Soumission du dossier' },
  { key: 'ai',        label: 'Évaluation IA'         },
  { key: 'jury',      label: 'Évaluation jury'       },
  { key: 'interview', label: 'Entretien'             },
  { key: 'decision',  label: 'Décision finale'       },
];

// ─── Composants ───────────────────────────────────────────────────────────────
const Skeleton = ({ h = 'h-32', className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl ${h} ${className}`} />
);

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || { label: status || '—', bg: '#f3f4f6', color: '#374151' };
  return (
    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, gradient, onClick }) {
  return (
    <div onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: gradient }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 bg-white" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10 bg-white" />
      <div className="relative">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-3">{icon}</div>
        <p className="text-white/70 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-2xl mono">{value ?? '—'}</p>
        {sub && <p className="text-white/50 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function LockedCard({ icon, title, desc }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 p-5 flex items-start gap-4 opacity-60">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <span className="text-gray-400">{icon}</span>
      </div>
      <div>
        <p className="font-bold text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
          <span className="text-gray-400">{Ic.lock}</span> {title}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 font-medium">
          🔓 Disponible après acceptation dans un programme
        </p>
      </div>
    </div>
  );
}

// ─── Banner d'erreur ──────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
      <span className="flex-shrink-0">{Ic.warn}</span>
      <span>{message}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
export default function StartupDashboardPage() {
  const router = useRouter();
  const { user, accessToken } = useSelector(s => s.auth);

  const [mounted,      setMounted]      = useState(false);
  const [time,         setTime]         = useState(new Date());
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState(null);

  // ── Charger les candidatures ──────────────────────────────────────────────
  const loadApplications = useCallback(async () => {
    if (!accessToken) {
      console.warn('⚠️ Pas de accessToken — chargement annulé');
      setLoading(false);
      return;
    }

    setApiError(null);

    // Liste des endpoints à essayer dans l'ordre
    const endpoints = [
      `${API_BASE}/startup/applications`,
      `${API_BASE}/startup/candidatures`,
      `${API_BASE}/applications/my`,
      `${API_BASE}/applications`,
    ];

    for (const url of endpoints) {
      try {
        console.log(`🔍 Tentative: ${url}`);
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log(`   → status: ${res.status}`);

        if (res.status === 404) continue; // essaie le suivant
        if (res.status === 401) {
          setApiError('Session expirée — veuillez vous reconnecter.');
          setLoading(false);
          return;
        }

        if (res.ok) {
          const json = await res.json();
          console.log(`   → réponse:`, json);

          const arr = extractArray(json);
          console.log(`   → tableau extrait (${arr.length} items):`, arr);

          setApplications(arr);
          setLoading(false);
          return; // succès, on arrête
        }
      } catch (e) {
        console.warn(`   → erreur réseau:`, e.message);
      }
    }

    // Tous les endpoints ont échoué
    console.error('❌ Aucun endpoint n\'a retourné de données');
    setApiError('Impossible de charger les candidatures. Vérifiez votre connexion.');
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (accessToken) loadApplications();
    else { setLoading(false); }
  }, [accessToken, loadApplications]);

  if (!mounted) return null;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const safeApps      = Array.isArray(applications) ? applications : [];
  const isFounder     = safeApps.some(a => ['accepted', 'approved'].includes(a.status));
  const acceptedCount = safeApps.filter(a => ['accepted', 'approved'].includes(a.status)).length;
  const pendingCount  = safeApps.filter(a => !['accepted', 'approved', 'rejected'].includes(a.status)).length;
  const avgScore      = safeApps.length
    ? Math.round(safeApps.reduce((s, a) => s + (a.score || a.aiScore || 0), 0) / safeApps.length)
    : 0;
  const acceptedApp = safeApps.find(a => ['accepted', 'approved'].includes(a.status));

  return (
    <ProtectedRoute allowedRoles={['startup']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Space Grotesk', sans-serif; }
          .mono { font-family: 'JetBrains Mono', monospace; }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .fade-up   { animation: fadeUp 0.5s ease-out forwards; }
          .fade-up-1 { animation: fadeUp 0.5s 0.05s ease-out both; }
          .fade-up-2 { animation: fadeUp 0.5s 0.10s ease-out both; }
          .fade-up-3 { animation: fadeUp 0.5s 0.15s ease-out both; }
          .fade-up-4 { animation: fadeUp 0.5s 0.20s ease-out both; }
          .fade-up-5 { animation: fadeUp 0.5s 0.25s ease-out both; }
          .glass-card {
            background: rgba(255,255,255,0.96);
            border: 1px solid rgba(0,0,0,0.05);
            backdrop-filter: blur(12px);
            box-shadow: 0 1px 3px rgba(0,0,0,.04);
          }
          :global(.dark) .glass-card { background:#1e293b; border-color:#334155; }
          .app-row { transition: background 0.12s; }
          .app-row:hover { background: rgba(0,109,148,0.04); }
          .founder-card { transition: all 0.2s; }
          .founder-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,.08); }
        `}</style>

        <div className="space-y-5 min-h-screen pb-10">

          {/* ── ERREUR API ── */}
          {apiError && (
            <div className="fade-up">
              <ErrorBanner message={apiError} />
            </div>
          )}

          {/* ── HEADER ── */}
          <div className="relative overflow-hidden rounded-2xl p-8 fade-up"
            style={{ background: 'linear-gradient(135deg,#003d52 0%,#00526e 40%,#006d94 70%,#0098c8 100%)' }}>
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent 0,transparent 19px,rgba(255,255,255,1) 19px,rgba(255,255,255,1) 20px)' }} />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {isFounder ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: 'rgba(245,158,11,.9)' }}>
                      ⭐ MODE FONDATEUR ACTIF
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: 'rgba(59,130,246,.9)' }}>
                      MODE CANDIDAT
                    </span>
                  )}
                  {isFounder && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-300">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      {acceptedCount} programme{acceptedCount > 1 ? 's' : ''} accepté{acceptedCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-1">
                  Bonjour, {user?.name?.split(' ')[0] ?? 'Startup'} 👋
                </h1>
                <p className="text-cyan-100 text-base max-w-xl">
                  {isFounder
                    ? 'Gérez votre startup incubée et candidatez à de nouveaux programmes.'
                    : "Complétez et suivez vos candidatures aux programmes d'incubation MEDIANET."}
                </p>
                <div className="flex items-center gap-3 mt-4 text-cyan-200 text-xs">
                  <span className="flex items-center gap-1.5">
                    {Ic.timeIc}
                    <span className="mono">{time.toLocaleTimeString('fr-FR')}</span>
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                  <span>{time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Mini-card utilisateur */}
              <div className="rounded-xl px-4 py-3 min-w-[210px] flex-shrink-0"
                style={{ background: 'rgba(0,40,60,.45)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' }}>
                    {(user?.name ?? 'ST').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{user?.name}</p>
                    <p className="text-cyan-300 text-xs truncate max-w-[130px]">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Dossiers', val: safeApps.length },
                    { label: 'Acceptés', val: acceptedCount   },
                    { label: 'Score',    val: avgScore || '—' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg py-2 text-center"
                      style={{ background: 'rgba(0,40,60,.4)', border: '1px solid rgba(255,255,255,.07)' }}>
                      <p className="text-white font-bold text-base leading-tight mono">{s.val}</p>
                      <p className="text-cyan-300 text-[9px]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Barre modes */}
            <div className="relative mt-5 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
              style={{ background: 'rgba(0,0,0,.2)', border: '1px solid rgba(255,255,255,.07)' }}>
              <div className="flex items-center gap-6 flex-wrap">
                {[
                  { mode: 'Candidat',  color: '#3b82f6', active: true,     desc: 'Candidatures & suivi' },
                  { mode: 'Fondateur', color: '#f59e0b', active: isFounder, desc: 'KPIs · Mentorat · Investisseurs' },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${m.active ? 'animate-pulse' : 'opacity-30'}`}
                      style={{ background: m.active ? m.color : '#94a3b8' }} />
                    <span className={`text-xs font-semibold ${m.active ? 'text-white' : 'text-white/30'}`}>{m.mode}</span>
                    <span className={`text-xs ${m.active ? 'text-cyan-200' : 'text-white/20'}`}>— {m.desc}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/startup/apply"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                {Ic.plus} Nouvelle candidature
              </Link>
            </div>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} h="h-32" className={`fade-up-${i + 1}`} />)
            ) : (
              <>
                <div className="fade-up-1">
                  <StatCard icon={Ic.rocket} label="Candidatures" value={safeApps.length}
                    sub="Total soumises"        gradient="linear-gradient(135deg,#00526e,#006d94)"
                    onClick={() => router.push('/dashboard/startup/apply')} />
                </div>
                <div className="fade-up-2">
                  <StatCard icon={Ic.check} label="Acceptées" value={acceptedCount}
                    sub="Programmes actifs"   gradient="linear-gradient(135deg,#065f46,#059669)" />
                </div>
                <div className="fade-up-3">
                  <StatCard icon={Ic.clock} label="En attente" value={pendingCount}
                    sub="En cours d'évaluation" gradient="linear-gradient(135deg,#b45309,#d97706)" />
                </div>
                <div className="fade-up-4">
                  <StatCard icon={Ic.star} label="Score moyen" value={avgScore ? `${avgScore}/100` : '—'}
                    sub="Évaluation jury"      gradient="linear-gradient(135deg,#4c1d95,#7c3aed)" />
                </div>
              </>
            )}
          </div>

          {/* ── CANDIDATURES + TIMELINE ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Liste candidatures */}
            <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden fade-up">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Mes candidatures</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Suivi en temps réel</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={loadApplications}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                    title="Rafraîchir">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </button>
                  <Link href="/dashboard/startup/apply"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                    {Ic.plus} Candidater
                  </Link>
                </div>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} h="h-16" />)}
                  </div>
                ) : safeApps.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white"
                      style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                      {Ic.rocket}
                    </div>
                    <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">Aucune candidature</p>
                    <p className="text-sm text-gray-400 mb-4 max-w-xs mx-auto">
                      Déposez votre première candidature pour rejoindre un programme MEDIANET.
                    </p>
                    <Link href="/dashboard/startup/apply"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
                      style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                      {Ic.plus} Démarrer ma candidature
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {safeApps.map((app, i) => (
                      <div key={app._id || app.id || i}
                        className="app-row flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                          {(app.programmeName || app.programName || app.program || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 dark:text-white text-sm truncate">
                            {app.programmeName || app.programName || app.program?.name || app.program || 'Programme'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {app.sector || app.category || '—'} · Soumis le{' '}
                            {app.createdAt || app.submittedAt
                              ? new Date(app.createdAt || app.submittedAt).toLocaleDateString('fr-FR')
                              : '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                          {(app.score || app.aiScore) > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                              {Ic.star} {app.score || app.aiScore}/100
                            </span>
                          )}
                          <StatusPill status={app.status} />
                          <Link href={`/dashboard/startup/status${app._id ? `/${app._id}` : ''}`}
                            className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            Détails {Ic.arrow}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card rounded-2xl overflow-hidden fade-up">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Étapes de sélection</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {acceptedApp?.programmeName || acceptedApp?.program || 'Processus de candidature'}
                </p>
              </div>
              <div className="p-6">
                {loading ? <Skeleton h="h-48" /> : (
                  <div className="space-y-0">
                    {TIMELINE_STEPS.map((step, i) => {
                      const app = acceptedApp || safeApps[0];
                      const statusOrder = ['pending', 'reviewing', 'interview', 'approved', 'accepted'];
                      const currentIdx  = statusOrder.indexOf(app?.status);
                      const stepDone    = isFounder ? true : i <= currentIdx;
                      const isLast      = i === TIMELINE_STEPS.length - 1;
                      return (
                        <div key={step.key} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                              stepDone ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                            }`} />
                            {!isLast && (
                              <div className={`w-0.5 flex-1 min-h-[28px] ${stepDone ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            )}
                          </div>
                          <div className="pb-5">
                            <p className={`text-sm font-semibold ${stepDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'}`}>
                              {step.label}
                            </p>
                            {stepDone && (
                              <p className="text-[10px] text-gray-400 mono mt-0.5">
                                {isFounder ? 'Validé ✓' : 'En cours'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── ESPACE FONDATEUR ── */}
          <div className="space-y-4 fade-up">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 dark:text-white">Espace Fondateur</h2>
              {isFounder ? (
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ⭐ ACTIF
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {Ic.lock} Disponible après acceptation
                </span>
              )}
            </div>

            {isFounder ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { href: '/dashboard/startup/kpis',      icon: Ic.chart,  label: 'KPIs & Performance', desc: 'Revenus, utilisateurs, rétention',       color: '#0088ba', bg: '#e0f2fe' },
                  { href: '/dashboard/startup/matches',   icon: Ic.star,   label: 'Investisseurs',       desc: 'Recommandations personnalisées',           color: '#8b5cf6', bg: '#ede9fe' },
                  { href: '/dashboard/startup/mentoring', icon: Ic.mentor, label: 'Mentorat',            desc: 'Sessions programmées',                     color: '#10b981', bg: '#d1fae5' },
                ].map((card, i) => (
                  <Link key={i} href={card.href}>
                    <div className="founder-card glass-card rounded-2xl p-5 flex items-start gap-4 cursor-pointer">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: card.bg, color: card.color }}>
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{card.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
                      </div>
                      <span className="text-gray-300 dark:text-gray-600 mt-0.5">{Ic.arrow}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LockedCard icon={Ic.chart}  title="KPIs & Performance" desc="Indicateurs clés de votre startup incubée" />
                <LockedCard icon={Ic.star}   title="Investisseurs"       desc="Recommandations d'investisseurs personnalisées" />
                <LockedCard icon={Ic.mentor} title="Mentorat"            desc="Sessions avec des experts du programme" />
              </div>
            )}
          </div>

          {/* ── QUICK LINKS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-up">
            {[
              { href: '/dashboard/startup/apply',  icon: Ic.rocket, label: 'Formulaire de candidature', desc: 'Complétez ou soumettez un nouveau dossier',       color: '#0088ba', bg: 'rgba(0,136,186,.1)' },
              { href: '/dashboard/startup/status', icon: Ic.chart,  label: 'Suivi des candidatures',    desc: 'Timeline, évaluations et prochaines étapes',      color: '#10b981', bg: 'rgba(16,185,129,.1)' },
            ].map(({ href, icon, label, desc, color, bg }) => (
              <Link key={href} href={href}>
                <div className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg, color }}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-white text-sm">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">{Ic.arrow}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* ── FOOTER ── */}
          <div className="relative overflow-hidden rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 fade-up"
            style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                {Ic.support}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Support MEDIANET</p>
                <p className="text-gray-400 text-xs">support@medianet.tn · Réponse &lt;48h</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              {['24/7 Support', 'AUTO Sauvegarde', 'SSL Sécurisé'].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-5">
                  <div className="text-center">
                    <p className="text-white font-bold text-sm mono">{s.split(' ')[0]}</p>
                    <p className="text-gray-500 text-[10px]">{s.split(' ').slice(1).join(' ')}</p>
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-6 bg-white/10" />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}