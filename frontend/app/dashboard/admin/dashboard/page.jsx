'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE = `${BASE}/api`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  users:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  apps:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  progs:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
  sessions: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  trend:    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>,
  trendD:   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>,
  refresh:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  star:     <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  ai:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
  bell:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  time:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  mentor:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  jury:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  arrow:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>,
};

const COLORS = {
  primary: '#006d94', secondary: '#0088ba', tertiary: '#00a3e0',
  emerald: '#10b981', amber: '#f59e0b', violet: '#8b5cf6',
  rose: '#f43f5e', cyan: '#06b6d4',
};

const STATUS_COLORS = {
  pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
  review: '#3b82f6', interview: '#8b5cf6', submitted: '#06b6d4',
  reviewing: '#3b82f6',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Skeleton = ({ h = 'h-32', className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl ${h} ${className}`}/>
);

function StatCard({ icon, label, value, trend, trendDir, sub, gradient, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: gradient || 'linear-gradient(135deg, #00526e, #0088ba)' }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 bg-white"/>
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10 bg-white"/>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">{icon}</div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trendDir === 'up' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'}`}>
              {trendDir === 'up' ? Ic.trend : Ic.trendD}{trend}
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

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const router = useRouter();
  const { user, accessToken } = useSelector(s => s.auth);

  const [mounted, setMounted]       = useState(false);
  const [time, setTime]             = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [chartMode, setChartMode]   = useState('applications');

  // ── Data states ──────────────────────────────────────────────────────────
  const [stats, setStats]                       = useState(null);
  const [appsTimeline, setAppsTimeline]         = useState([]);
  const [appsByStatus, setAppsByStatus]         = useState([]);
  const [usersByRole, setUsersByRole]           = useState([]);
  const [userGrowth, setUserGrowth]             = useState([]);
  const [progsOverview, setProgsOverview]       = useState([]);
  const [evalScores, setEvalScores]             = useState(null);
  const [sessionsActivity, setSessionsActivity] = useState([]);
  const [recentApps, setRecentApps]             = useState([]);
  const [topMentors, setTopMentors]             = useState([]);
  const [activityFeed, setActivityFeed]         = useState([]);
  const [perfMetrics, setPerfMetrics]           = useState({ data: [], overall: 0 });
  const [notifications, setNotifications]       = useState({ total: 0, unread: 0 });

  // ── Generic fetcher ──────────────────────────────────────────────────────
  const api = useCallback(async (path) => {
    const url = `${API_BASE}/admin/dashboard${path}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status} — ${path}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  }, [accessToken]);

  // ── Load all data ────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    // ⚠️  Guard: never fire without a valid token
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [
      statsR, timelineR, statusR, roleR,
      growthR, progsR, evalR, sessR,
      appsR, mentorsR, feedR, perfR, notifR,
    ] = await Promise.allSettled([
      api('/stats'),
      api('/charts/applications-timeline'),
      api('/charts/applications-by-status'),
      api('/charts/users-by-role'),
      api('/charts/user-growth'),
      api('/charts/programmes-overview'),
      api('/charts/evaluations-scores'),
      api('/charts/sessions-activity'),
      api('/recent-applications'),
      api('/top-mentors'),
      api('/activity-feed'),
      api('/performance-metrics'),
      api('/notifications-summary'),
    ]);

    const val = (r) => r.status === 'fulfilled' ? r.value : null;

    setStats(val(statsR));
    setAppsTimeline(val(timelineR) || []);
    setAppsByStatus(val(statusR)   || []);
    setUsersByRole(val(roleR)      || []);
    setUserGrowth(val(growthR)     || []);
    setProgsOverview(val(progsR)   || []);
    setSessionsActivity(val(sessR) || []);
    setEvalScores(val(evalR));
    setRecentApps(val(appsR)       || []);
    setTopMentors(val(mentorsR)    || []);
    setActivityFeed(val(feedR)     || []);

    const perf = val(perfR);
    if (perf) {
      setPerfMetrics({
        data:    Array.isArray(perf.data)            ? perf.data    : [],
        overall: typeof perf.overall === 'number'    ? perf.overall : 0,
      });
    }

    const notif = val(notifR);
    if (notif) setNotifications({ total: notif.total || 0, unread: notif.unread || 0 });

    setLoading(false);
  }, [accessToken, api]);

  // ── Effect 1: clock + mount flag (runs once) ─────────────────────────────
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Effect 2: fetch data — waits for token, re-runs on refresh ───────────
  // This is the KEY fix: by including `accessToken` in the dependency array,
  // the fetch fires as soon as Redux is hydrated (token goes from null → string),
  // instead of racing against the refresh-token flow on mount.
  useEffect(() => {
    if (!accessToken) return; // wait until ProtectedRoute hydrates Redux
    loadAll();
  }, [accessToken, loadAll, refreshKey]);

  // ── Status pill ──────────────────────────────────────────────────────────
  const statusLabel = {
    submitted: 'Soumise', pending: 'En attente', reviewing: 'En révision',
    review: 'En révision', interview: 'Entretien', approved: 'Acceptée', rejected: 'Rejetée',
  };
  const getStatusPill = (s) => {
    const color = STATUS_COLORS[s] || '#6b7280';
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: color + '20', color }}>
        {statusLabel[s] || s}
      </span>
    );
  };

  const S            = stats || {};
  const users_s      = S.users        || {};
  const applications = S.applications || {};
  const programmes   = S.programmes   || {};
  const sessions_s   = S.sessions     || {};

  return (
    <ProtectedRoute allowedRoles={['admin']}>
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
          .tab-btn { padding:6px 14px; border-radius:8px; font-size:12px; font-weight:500; transition:all 0.2s; cursor:pointer; border:none; background:transparent; }
          .tab-btn.active { background:linear-gradient(135deg,#00526e,#006d94); color:white; }
          .tab-btn:not(.active) { color:#64748b; }
          .tab-btn:not(.active):hover { background:#f1f5f9; }
          :global(.dark) .tab-btn:not(.active) { color:#94a3b8; }
          :global(.dark) .tab-btn:not(.active):hover { background:#1e293b; }
          .activity-item:hover { background:rgba(0,109,148,0.05); }
          .perf-bar { border-radius:4px; transition:width 1s ease; }
          .recharts-cartesian-grid-horizontal line,
          .recharts-cartesian-grid-vertical line { stroke:rgba(0,0,0,0.05); }
          :global(.dark) .recharts-cartesian-grid-horizontal line,
          :global(.dark) .recharts-cartesian-grid-vertical line { stroke:rgba(255,255,255,0.05); }
        `}</style>

        <div className="space-y-5 min-h-screen pb-10">

          {/* ── HEADER ──────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl p-8 fade-up"
            style={{ background: 'linear-gradient(135deg,#003d52 0%,#00526e 40%,#006d94 70%,#0088ba 100%)' }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px)' }}/>
            <div className="absolute top-0 right-32 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle,#00a3e0,transparent)' }}/>

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-white/90 tracking-widest">ADMINISTRATION</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                    <span className="text-white/60 text-xs">Systèmes en ligne</span>
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-1">Tableau de Bord Admin</h1>
                <p className="text-blue-200 text-sm">MEDIANET Incubator — Portail Administratif</p>
                <div className="flex items-center gap-4 mt-4 text-blue-200/70 text-xs">
                  <span className="flex items-center gap-1.5">
                    {Ic.time}
                    <span className="mono">{mounted && time.toLocaleTimeString('fr-FR')}</span>
                  </span>
                  <span className="w-px h-3 bg-white/20"/>
                  <span>{mounted && time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">

                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className={`p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all ${loading ? 'animate-spin' : ''}`}>
                  {Ic.refresh}
                </button>
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{user?.name || 'Administrateur'}</p>
                    <p className="text-blue-300 text-[10px] mono">SYSTEM ADMINISTRATOR</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── NO TOKEN STATE ───────────────────────────────────────────────── */}
          {!accessToken && !loading && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Session expirée. Reconnexion en cours…</p>
            </div>
          )}

          {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} h="h-32" className={`fade-up-${i + 1}`} />)
            ) : (
              <>
                <div className="fade-up-1">
                  <StatCard icon={Ic.users} label="Utilisateurs totaux"
                    value={users_s.total?.toLocaleString('fr-FR')}
                    trend={users_s.trend?.pct} trendDir={users_s.trend?.dir}
                    sub={`${users_s.activeThisWeek || 0} actifs cette semaine`}
                    gradient="linear-gradient(135deg,#00526e,#006d94)"
                    onClick={() => router.push('/dashboard/admin/users')} />
                </div>
                <div className="fade-up-2">
                  <StatCard icon={Ic.apps} label="Candidatures"
                    value={applications.total?.toLocaleString('fr-FR')}
                    trend={applications.trend?.pct} trendDir={applications.trend?.dir}
                    sub={`${applications.pending || 0} en attente`}
                    gradient="linear-gradient(135deg,#b45309,#d97706)"
                    onClick={() => router.push('/dashboard/admin/applications')} />
                </div>
                <div className="fade-up-3">
                  <StatCard icon={Ic.progs} label="Programmes"
                    value={programmes.total?.toLocaleString('fr-FR')}
                    sub={`${programmes.active || 0} actifs`}
                    gradient="linear-gradient(135deg,#065f46,#059669)"
                    onClick={() => router.push('/dashboard/admin/programmes')} />
                </div>
                <div className="fade-up-4">
                  <StatCard icon={Ic.sessions} label="Sessions mentorat"
                    value={sessions_s.total?.toLocaleString('fr-FR')}
                    sub={`${sessions_s.evaluations || 0} évaluations jury`}
                    gradient="linear-gradient(135deg,#4c1d95,#7c3aed)"
                    onClick={() => router.push('/dashboard/admin/sessions')} />
                </div>
              </>
            )}
          </div>

          {/* ── SUB-STATS ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up-5">
            {[
              { label: 'Mentors',            value: users_s.mentors,                      icon: Ic.mentor, color: '#10b981' },
              { label: 'Investisseurs',      value: users_s.investors,                    icon: Ic.users,  color: '#f59e0b' },
              { label: 'Jurys',              value: users_s.jury,                         icon: Ic.jury,   color: '#8b5cf6' },
              { label: "Taux d'acceptation", value: `${applications.successRate || 0}%`,  icon: Ic.ai,     color: '#06b6d4' },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: s.color }}>{s.icon}</div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.label}</p>
                  <p className="font-bold text-gray-900 dark:text-white mono text-sm">{s.value ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── CHARTS MAIN ROW ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <SectionCard className="lg:col-span-2 fade-up"
              title="Évolution & Tendances" subtitle="Données sur 12 mois"
              action={
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {[
                    { id: 'applications', label: 'Candidatures' },
                    { id: 'users',        label: 'Utilisateurs'  },
                    { id: 'sessions',     label: 'Sessions'      },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setChartMode(tab.id)}
                      className={`tab-btn ${chartMode === tab.id ? 'active' : ''}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              }>
              {loading ? <Skeleton h="h-64" /> : (
                <ResponsiveContainer width="100%" height={280}>
                  {chartMode === 'applications' ? (
                    <AreaChart data={appsTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#006d94" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#006d94" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="total"    name="Total"      stroke="#006d94" fill="url(#gP)" strokeWidth={2.5} dot={false} />
                      <Area type="monotone" dataKey="approved" name="Acceptées"  stroke="#10b981" fill="url(#gG)" strokeWidth={2}   dot={false} />
                      <Area type="monotone" dataKey="pending"  name="En attente" stroke="#f59e0b" fill="url(#gA)" strokeWidth={2}   dot={false} />
                    </AreaChart>
                  ) : chartMode === 'users' ? (
                    <AreaChart data={userGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#006d94" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#006d94" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="total"   name="Total"   stroke="#006d94" fill="url(#gS)" strokeWidth={2.5} dot={false} />
                      <Area type="monotone" dataKey="startup" name="Startups" stroke="#0088ba" fill="none"    strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      <Area type="monotone" dataKey="mentor"  name="Mentors"  stroke="#8b5cf6" fill="url(#gM)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  ) : (
                    <BarChart data={sessionsActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="completed" name="Complétées" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="scheduled" name="Planifiées"  fill="#006d94" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cancelled" name="Annulées"    fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* Donut statuts */}
            <SectionCard className="fade-up" title="Statuts Candidatures" subtitle="Répartition actuelle">
              {loading ? <Skeleton h="h-48" /> : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={appsByStatus} cx="50%" cy="50%"
                        innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {appsByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]}
                        contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {appsByStatus.map((s, i) => {
                      const total = appsByStatus.reduce((a, b) => a + b.value, 0);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }}/>
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{s.name}</span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white mono">{s.value}</span>
                          <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ background: s.color, width: `${Math.round((s.value / (total || 1)) * 100)}%` }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </SectionCard>
          </div>

          {/* ── SECOND CHARTS ROW ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard title="Utilisateurs par Rôle" subtitle="Distribution des profils">
              {loading ? <Skeleton h="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={usersByRole} layout="vertical"
                    margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="role" tick={{ fontSize: 11, fill: '#94a3b8' }} width={70} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Utilisateurs" radius={[0, 6, 6, 0]}>
                      {usersByRole.map((entry, i) => (
                        <Cell key={i} fill={entry.color || COLORS.primary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard title="Distribution des Scores" subtitle="IA vs Jury">
              {loading || !evalScores ? <Skeleton h="h-48" /> : (
                <>
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: COLORS.primary }}/>
                      <span className="text-gray-500">Score IA (moy: {evalScores.avgAi})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: COLORS.violet }}/>
                      <span className="text-gray-500">Score Jury (moy: {evalScores.avgJury})</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart
                      data={(evalScores.ai || []).map((item, i) => ({
                        range: item.range,
                        ai:    item.count,
                        jury:  (evalScores.jury || [])[i]?.count || 0,
                      }))}
                      margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="ai"   name="Score IA"   fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="jury" name="Score Jury" fill={COLORS.violet}  radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </SectionCard>
          </div>

          {/* ── PROGRAMMES TABLE ────────────────────────────────────────────── */}
          {!loading && progsOverview.length > 0 && (
            <SectionCard title="Aperçu des Programmes" subtitle="Candidatures et taux de conversion"
              action={
                <button onClick={() => router.push('/dashboard/admin/programmes')}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Voir tout {Ic.arrow}
                </button>
              }>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {['Programme', 'Statut', 'Candidatures', 'Acceptées', 'Conversion'].map(h => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {progsOverview.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white text-xs">{p.name}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${['active', 'published'].includes(p.status) ?  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {p.statusLabel || (p.status === 'active' ? 'Actif' : p.status)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 mono text-xs text-gray-700 dark:text-gray-300">{p.applications}</td>
                        <td className="py-3 pr-4 mono text-xs text-emerald-600 dark:text-emerald-400">{p.approved}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.conversionRate}%` }}/>
                            </div>
                            <span className="text-xs mono font-medium text-gray-700 dark:text-gray-300">{p.conversionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* ── BOTTOM ROW ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Performance metrics */}
            <SectionCard title="Métriques de Performance" subtitle="KPIs en temps réel">
              {loading ? <Skeleton h="h-56" /> : (
                <div className="space-y-5">
                  {perfMetrics.data.map((m, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{m.icon}</span>
                          <span className="text-gray-600 dark:text-gray-400 font-medium">{m.label}</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white mono">{m.value}%</span>
                      </div>
                      <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="perf-bar h-full" style={{
                          width: `${m.value}%`,
                          background: m.value >= m.target
                            ? 'linear-gradient(90deg,#10b981,#059669)'
                            : 'linear-gradient(90deg,#f59e0b,#d97706)',
                        }}/>
                        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400/60"
                          style={{ left: `${m.target}%` }}/>
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-gray-400">cible : {m.target}%</span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#e5e7eb" strokeWidth="5"/>
                        <circle cx="32" cy="32" r="26" fill="none"
                          stroke="url(#perfGrad)" strokeWidth="5"
                          strokeDasharray={`${(perfMetrics.overall / 100) * 163} 163`}
                          strokeLinecap="round"/>
                        <defs>
                          <linearGradient id="perfGrad" x1="0%" y1="0%" x2="100%">
                            <stop offset="0%"   stopColor="#006d94"/>
                            <stop offset="100%" stopColor="#10b981"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900 dark:text-white mono">{perfMetrics.overall}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Score global</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {perfMetrics.overall >= 70 ? '✅ Excellent ce trimestre'
                          : perfMetrics.overall >= 50 ? '⚠️ En progression'
                          : '❗ Attention requise'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Recent applications */}
            <SectionCard title="Dernières Candidatures" subtitle="Soumissions récentes"
              action={
                <button onClick={() => router.push('/dashboard/admin/applications')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                  Voir tout {Ic.arrow}
                </button>
              }>
              {loading ? <Skeleton h="h-56" /> : (
                <div className="space-y-3">
                  {recentApps.slice(0, 6).map((app, i) => (
                    <div key={i} className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => router.push('/dashboard/admin/applications')}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                        {app.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                          {app.applicantName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{app.programmeName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {getStatusPill(app.status)}
                        <p className="text-[10px] text-gray-400 mt-0.5">{app.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Activity feed */}
            <SectionCard title="Fil d'Activité" subtitle="Dernières actions système">
              {loading ? <Skeleton h="h-56" /> : (
                <div className="space-y-1 -mx-2">
                  {activityFeed.slice(0, 8).map((item, i) => (
                    <div key={i} className="activity-item flex items-start gap-3 px-2 py-2 rounded-lg transition-colors">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: (item.color || '#6b7280') + '20' }}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 leading-tight">{item.message}</p>
                        {item.sub && <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>}
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 mono">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── TOP MENTORS ─────────────────────────────────────────────────── */}
          {!loading && topMentors.length > 0 && (
            <SectionCard title="Top Mentors" subtitle="Classement par activité"
              action={
                <button onClick={() => router.push('/dashboard/admin/mentors')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                  Voir tout {Ic.arrow}
                </button>
              }>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {topMentors.map((m, i) => (
                  <div key={i} className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                      {m.initials}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{m.name}</p>
                    <p className="text-[10px] text-gray-400 truncate mb-2">{m.speciality}</p>
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      {Ic.star}
                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        {m.avgRating ? m.avgRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 mono">{m.sessions} sessions</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── FOOTER ──────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 10px)' }}/>
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold">MEDIANET Incubator</h3>
                  <p className="text-white/50 text-xs">Empowering Tunisian Innovation Since 1998</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { value: '250+',  label: 'Startups'    },
                  { value: '150M+', label: 'Funding TND' },
                  { value: '25+',   label: 'Années'      },
                  { value: '87%',   label: 'Succès'      },
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