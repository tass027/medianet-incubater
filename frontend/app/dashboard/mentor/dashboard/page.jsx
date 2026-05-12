'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import useMentorStartups  from '@/app/hooks/useMentorStartups';
import useMentorSessions  from '@/app/hooks/useMentorSessions';
import useMentorFeedback  from '@/app/hooks/useMentorFeedback';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  users:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  message:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  trend:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  arrow:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7"/></svg>,
  alert:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  star:     <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  clock:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  file:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  book:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  refresh:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  lightning:<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
};

// ─── Tooltip personnalisé ─────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Skeleton = ({ h = 'h-32', className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl ${h} ${className}`} />
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, gradient, trend, trendDir, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: gradient || 'linear-gradient(135deg,#00526e,#0088ba)' }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 bg-white" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10 bg-white" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">{icon}</div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trendDir === 'up' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'}`}>
              {trendDir === 'up' ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        <p className="text-white/70 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-2xl mono">{value ?? '—'}</p>
        {sub && <p className="text-white/50 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
const SESSION_STATUS_COLORS = {
  scheduled:  { bg: '#dbeafe', text: '#1e40af', label: 'Planifiée'  },
  completed:  { bg: '#d1fae5', text: '#065f46', label: 'Complétée'  },
  cancelled:  { bg: '#fee2e2', text: '#991b1b', label: 'Annulée'    },
  jury:       { bg: '#ede9fe', text: '#4c1d95', label: 'Jury'       },
  pending:    { bg: '#fef3c7', text: '#92400e', label: 'En attente' },
};

function StatusPill({ status }) {
  const cfg = SESSION_STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151', label: status };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}>
      {cfg.label}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
export default function MentorDashboard() {
  const router = useRouter();
  const { user } = useSelector(s => s.auth);

  const [mounted,    setMounted]    = useState(false);
  const [time,       setTime]       = useState(new Date());
  const [chartMode,  setChartMode]  = useState('sessions');

  const { startups,  loading: loadingStartups  } = useMentorStartups();
  const { sessions,  loading: loadingSessions  } = useMentorSessions({ status: 'scheduled' });
  const { feedbacks, loading: loadingFeedback  } = useMentorFeedback();

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Computed ──────────────────────────────────────────────────────────────
  const activeStartups   = startups.filter(s => s.status === 'active').length;
  const needsAttention   = startups.filter(s => s.status !== 'active');
  const upcomingSessions = sessions
    .filter(s => new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '—';

  const progressionRate = startups.length
    ? Math.round(startups.reduce((sum, s) => sum + (s.progress || 0), 0) / startups.length)
    : 0;

  // Données graphiques fictives — remplacer par API
  const sessionsChart = [
    { month: 'Jan', completed: 3, scheduled: 2, cancelled: 1 },
    { month: 'Fév', completed: 5, scheduled: 3, cancelled: 0 },
    { month: 'Mar', completed: 4, scheduled: 4, cancelled: 1 },
    { month: 'Avr', completed: 7, scheduled: 5, cancelled: 0 },
    { month: 'Mai', completed: 6, scheduled: 7, cancelled: 1 },
  ];

  const progressChart = startups.map(s => ({
    name: s.name || s.projectName || 'Startup',
    progress: s.progress || 0,
  }));

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['mentor']}>
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
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          }
          :global(.dark) .glass-card { background:#1e293b; border-color:#334155; }
          .tab-btn { padding:5px 13px; border-radius:8px; font-size:12px; font-weight:500; transition:all 0.2s; cursor:pointer; border:none; background:transparent; }
          .tab-btn.active { background:linear-gradient(135deg,#00526e,#006d94); color:white; }
          .tab-btn:not(.active) { color:#64748b; }
          .tab-btn:not(.active):hover { background:#f1f5f9; }
          :global(.dark) .tab-btn:not(.active) { color:#94a3b8; }
          :global(.dark) .tab-btn:not(.active):hover { background:#1e293b; }
          .prog-bar { border-radius:4px; transition:width 0.8s ease; }
          .recharts-cartesian-grid-horizontal line,
          .recharts-cartesian-grid-vertical   line { stroke:rgba(0,0,0,.05); }
          :global(.dark) .recharts-cartesian-grid-horizontal line,
          :global(.dark) .recharts-cartesian-grid-vertical   line { stroke:rgba(255,255,255,.05); }
          .action-card { transition:all .2s; }
          .action-card:hover { background:rgba(0,109,148,.05); transform:translateY(-2px); }
        `}</style>

        <div className="space-y-5 min-h-screen pb-10">

          {/* ── HEADER ── */}
          <div className="relative overflow-hidden rounded-2xl p-8 fade-up"
            style={{ background: 'linear-gradient(135deg,#003d52 0%,#00526e 40%,#006d94 70%,#0088ba 100%)' }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px)' }} />
            <div className="absolute top-0 right-32 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle,#00a3e0,transparent)' }} />

            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-white/90 tracking-widest">ESPACE MENTOR</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white/60 text-xs">Tableau de bord</span>
                  </span>
                  {user?.mentorRoles?.includes('jury') && (
                    <span className="px-2 py-0.5 bg-amber-400/20 text-amber-200 rounded-full text-[10px] font-bold">+ JURY</span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-1">
                  Bonjour, {user?.name?.split(' ')[0] || 'Mentor'} 👋
                </h1>
                <p className="text-blue-200 text-sm max-w-xl">Accompagnez les startups vers la réussite · MEDIANET Incubator</p>
                <div className="flex items-center gap-4 mt-4 text-blue-200/70 text-xs">
                  <span className="flex items-center gap-1.5">
                    {Ic.clock}
                    <span className="mono">{time.toLocaleTimeString('fr-FR')}</span>
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                  <span>{time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'MT'}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{user?.name || 'Mentor'}</p>
                    <p className="text-blue-300 text-[10px] mono">MENTOR</p>
                  </div>
                </div>
                {/* Alerte sessions cette semaine */}
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-200 text-xs font-semibold">
                    {upcomingSessions.length} session{upcomingSessions.length !== 1 ? 's' : ''} cette semaine
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── ATTENTION BANNER ── */}
          {!loadingStartups && needsAttention.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl fade-up">
              {Ic.alert}
              <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">
                <strong>{needsAttention.length} startup{needsAttention.length > 1 ? 's' : ''}</strong>{' '}
                {needsAttention.length > 1 ? 'nécessitent' : 'nécessite'} votre attention :{' '}
                {needsAttention.map(s => s.name || s.projectName).join(', ')}
              </p>
              <Link href="/dashboard/mentor/startups"
                className="text-xs font-semibold text-amber-600 hover:underline whitespace-nowrap">
                Voir →
              </Link>
            </div>
          )}

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(loadingStartups || loadingSessions || loadingFeedback) ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} h="h-32" className={`fade-up-${i + 1}`} />)
            ) : (
              <>
                <div className="fade-up-1">
                  <StatCard
                    icon={Ic.users} label="Startups accompagnées"
                    value={startups.length} sub={`${activeStartups} actives`}
                    gradient="linear-gradient(135deg,#00526e,#006d94)"
                    onClick={() => router.push('/dashboard/mentor/startups')}
                  />
                </div>
                <div className="fade-up-2">
                  <StatCard
                    icon={Ic.calendar} label="Sessions planifiées"
                    value={upcomingSessions.length} sub="À venir"
                    gradient="linear-gradient(135deg,#065f46,#059669)"
                    trend={upcomingSessions.length > 3 ? '+3' : undefined} trendDir="up"
                    onClick={() => router.push('/dashboard/mentor/sessions')}
                  />
                </div>
                <div className="fade-up-3">
                  <StatCard
                    icon={Ic.message} label="Feedbacks donnés"
                    value={feedbacks.length} sub={`Note moy. ${avgRating}/5`}
                    gradient="linear-gradient(135deg,#4c1d95,#7c3aed)"
                    onClick={() => router.push('/dashboard/mentor/feedback')}
                  />
                </div>
                <div className="fade-up-4">
                  <StatCard
                    icon={Ic.trend} label="Progression moyenne"
                    value={`${progressionRate}%`} sub="Sur toutes les startups"
                    gradient="linear-gradient(135deg,#b45309,#d97706)"
                  />
                </div>
              </>
            )}
          </div>

          {/* ── MAIN ROW : Chart + Startups ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Chart sessions */}
            <SectionCard className="lg:col-span-2 fade-up"
              title="Sessions & Activité" subtitle="Évolution mensuelle"
              action={
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {[{ id: 'sessions', label: 'Sessions' }, { id: 'progress', label: 'Progression' }].map(tab => (
                    <button key={tab.id} onClick={() => setChartMode(tab.id)}
                      className={`tab-btn ${chartMode === tab.id ? 'active' : ''}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              }>
              {loadingSessions ? <Skeleton h="h-64" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  {chartMode === 'sessions' ? (
                    <BarChart data={sessionsChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="completed" name="Complétées" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="scheduled" name="Planifiées"  fill="#006d94" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cancelled" name="Annulées"    fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={progressChart} layout="vertical"
                      margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={60} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="progress" name="Progression %" fill="#006d94" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* Startups panel */}
            <SectionCard className="fade-up" title="Mes startups" subtitle="Progression en temps réel"
              action={
                <Link href="/dashboard/mentor/startups"
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                  Voir tout {Ic.arrow}
                </Link>
              }>
              {loadingStartups ? <Skeleton h="h-48" /> : (
                <div className="space-y-3">
                  {startups.slice(0, 6).map((s, i) => {
                    const name   = s.name || s.projectName || 'Startup';
                    const prog   = s.progress || 0;
                    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    const colors = ['#0088ba', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
                    const color  = colors[i % colors.length];
                    return (
                      <div key={s._id || i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          style={{ background: color }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{s.sector || '—'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="prog-bar h-full" style={{ width: `${prog}%`, background: color }} />
                          </div>
                          <span className="text-[10px] mono font-medium text-gray-500 w-8 text-right">{prog}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── SESSIONS À VENIR ── */}
          <SectionCard className="fade-up" title="Sessions à venir" subtitle="Prochains rendez-vous planifiés"
            action={
              <Link href="/dashboard/mentor/sessions/new"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                + Planifier
              </Link>
            }>
            {loadingSessions ? <Skeleton h="h-32" /> : upcomingSessions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune session planifiée</p>
                <Link href="/dashboard/mentor/sessions/new"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
                  Planifier une session {Ic.arrow}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {upcomingSessions.map((s, i) => {
                  const startup = startups.find(st => st._id === (s.startupId?._id || s.startupId));
                  const name    = startup?.name || startup?.projectName || s.startupName || 'Startup';
                  const colors  = ['#0088ba', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'];
                  const color   = colors[i % colors.length];
                  const dateStr = s.date ? new Date(s.date).toLocaleDateString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  }) : '—';
                  const timeStr = s.date ? new Date(s.date).toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit',
                  }) : '';
                  return (
                    <div key={s._id || i} className="flex items-center gap-4 py-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                        <p className="text-xs text-gray-400 truncate">{s.topic || s.title || 'Session de mentorat'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{dateStr}</p>
                        <p className="text-[10px] text-gray-400 mono">{timeStr} · {s.location || s.mode || 'Zoom'}</p>
                      </div>
                      <StatusPill status={s.status || 'scheduled'} />
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ── QUICK ACTIONS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 fade-up">
            {[
              { href: '/dashboard/mentor/feedback',     icon: Ic.message,  label: 'Donner un feedback', sub: 'Évaluer startups',    color: '#8b5cf6', bg: '#ede9fe' },
              { href: '/dashboard/mentor/startups',     icon: Ic.users,    label: 'Voir les startups',  sub: 'Suivi portefeuille',  color: '#0088ba', bg: '#dbeafe' },
              { href: '/dashboard/mentor/sessions/new', icon: Ic.calendar, label: 'Planifier session',  sub: 'Organiser un RDV',    color: '#10b981', bg: '#d1fae5' },
              { href: '/dashboard/mentor/reports',      icon: Ic.file,     label: 'Rapports',           sub: 'Progression mensuelle',color: '#f59e0b', bg: '#fef3c7' },
              { href: '/dashboard/mentor/resources',    icon: Ic.book,     label: 'Ressources',         sub: 'Docs & templates',    color: '#ef4444', bg: '#fee2e2' },
            ].map(({ href, icon, label, sub, color, bg }) => (
              <Link key={href} href={href}>
                <div className="action-card glass-card rounded-xl p-4 flex flex-col gap-2.5 cursor-pointer h-full">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: bg, color }}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-auto" style={{ color }}>
                    Accéder {Ic.arrow}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── FEEDBACKS RÉCENTS ── */}
          {!loadingFeedback && feedbacks.length > 0 && (
            <SectionCard className="fade-up" title="Derniers feedbacks" subtitle="Vos évaluations récentes"
              action={
                <Link href="/dashboard/mentor/feedback"
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                  Voir tout {Ic.arrow}
                </Link>
              }>
              <div className="space-y-3">
                {feedbacks.slice(0, 4).map((fb, i) => {
                  const startupName = fb.startupId?.projectName || fb.startupId?.name || 'Startup';
                  return (
                    <div key={fb._id || i} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                        {startupName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{startupName}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <span key={s} className={s <= fb.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>
                                {Ic.star}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{fb.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* ── FOOTER ── */}
          <div className="relative overflow-hidden rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 10px)' }} />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  {Ic.lightning}
                </div>
                <div>
                  <h3 className="text-white font-bold">MEDIANET Incubator · Guide Mentor</h3>
                  <p className="text-white/50 text-xs">Bonnes pratiques & ressources d'accompagnement</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { value: '250+', label: 'Startups'   },
                  { value: '87%',  label: 'Succès'     },
                  { value: '25+',  label: 'Années'     },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-white font-bold text-lg mono">{s.value}</p>
                    <p className="text-white/40 text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}