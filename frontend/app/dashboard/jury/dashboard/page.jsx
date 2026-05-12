'use client';

// /app/dashboard/jury/dashboard/page.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useJuryDashboard } from '@/app/hooks/Usejuryspace';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  file:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  star:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
  check:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  clock:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  trend:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  arrow:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7"/></svg>,
  alert:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  info:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  shield: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  clockT: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

const CRITERIA_COLORS = {
  Innovation: '#4f46e5',
  Viabilité:  '#10b981',
  Équipe:     '#f59e0b',
  Marché:     '#ef4444',
  Impact:     '#06b6d4',
};

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

// ─── StatCard — entièrement cliquable ────────────────────────────────────────
function StatCard({ icon, label, value, sub, gradient, valueColor, href }) {
  const router = useRouter();
  const handleClick = () => href && router.push(href);
  return (
    <div
      onClick={handleClick}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:brightness-110 select-none
        ${href ? 'cursor-pointer ring-2 ring-transparent hover:ring-white/20 focus:outline-none focus:ring-white/30' : ''}`}
      style={{ background: gradient || 'linear-gradient(135deg,#312e81,#4f46e5)' }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 bg-white" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10 bg-white" />
      <div className="relative">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-3">
          {icon}
        </div>
        <p className="text-white/70 text-xs mb-1">{label}</p>
        <p className={`font-bold text-2xl mono ${valueColor || 'text-white'}`}>{value ?? '—'}</p>
        {sub && (
          <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
            {sub}
            {href && <span className="ml-auto opacity-60">{Ic.arrow}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, action, children, className = '', href }) {
  const router = useRouter();
  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      <div
        onClick={href ? () => router.push(href) : undefined}
        className={`px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between
          ${href ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors' : ''}`}
      >
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            {title}
            {href && <span className="text-gray-300 dark:text-gray-600">{Ic.arrow}</span>}
          </h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function JuryDashboardPage() {
  const router = useRouter();
  const { user } = useSelector(s => s.auth);

  const [mounted, setMounted] = useState(false);
  const [time,    setTime]    = useState(new Date());

  const { stats, recent, debug, loading } = useJuryDashboard();

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;

  const total     = stats?.total     ?? 0;
  const evaluated = stats?.evaluated ?? 0;
  const pending   = stats?.pending   ?? 0;
  const avgScore  = stats?.avgScore  != null ? Number(stats.avgScore).toFixed(1) : '—';
  const pctDone   = total > 0 ? Math.round((evaluated / total) * 100) : 0;

  // URLs avec filtre de statut — adapter selon votre routing
  const URL_ALL       = '/dashboard/jury/candidatures';
  const URL_PENDING   = '/dashboard/jury/candidatures?status=pending';
  const URL_EVALUATED = '/dashboard/jury/evaluations';

  const scoreDistribution = [
    { range: '0-20',   count: 0 },
    { range: '20-40',  count: 1 },
    { range: '40-60',  count: 2 },
    { range: '60-70',  count: 3 },
    { range: '70-80',  count: 4 },
    { range: '80-90',  count: 3 },
    { range: '90-100', count: 1 },
  ];

  const criteria = [
    { name: 'Innovation', score: 78 },
    { name: 'Viabilité',  score: 65 },
    { name: 'Équipe',     score: 82 },
    { name: 'Marché',     score: 70 },
    { name: 'Impact',     score: 74 },
  ];

  const donutData = [
    { name: 'Évaluées',   value: evaluated, color: '#10b981', href: URL_EVALUATED },
    { name: 'En attente', value: pending,   color: '#f59e0b', href: URL_PENDING   },
  ];

  return (
    <ProtectedRoute allowedRoles={['mentor', 'jury']}>
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
          .cand-row { transition: background 0.12s; }
          .cand-row:hover { background: rgba(79,70,229,0.04); }
          .prog-bar { border-radius: 4px; transition: width 0.8s ease; }
          .recharts-cartesian-grid-horizontal line,
          .recharts-cartesian-grid-vertical   line { stroke: rgba(0,0,0,.05); }
          :global(.dark) .recharts-cartesian-grid-horizontal line,
          :global(.dark) .recharts-cartesian-grid-vertical   line { stroke: rgba(255,255,255,.05); }
          .action-card { transition: all 0.2s; }
          .action-card:hover { transform: translateY(-2px); background: rgba(79,70,229,0.04); }
          .donut-legend-row { transition: background 0.12s; border-radius: 8px; }
          .donut-legend-row:hover { background: rgba(0,0,0,0.04); }
          :global(.dark) .donut-legend-row:hover { background: rgba(255,255,255,0.05); }
        `}</style>

        <div className="space-y-5 min-h-screen pb-10">

          {/* ── HEADER ── */}
          <div className="relative overflow-hidden rounded-2xl p-8 fade-up"
            style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4338ca 70%,#6366f1 100%)' }}>
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px,rgba(255,255,255,1) 1.5px,transparent 0)', backgroundSize: '28px 28px' }} />
            <div className="absolute top-0 right-32 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle,#a5b4fc,transparent)' }} />

            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-white/90 tracking-widest">ESPACE JURY</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white/60 text-xs">Tableau de bord</span>
                  </span>
                  {user?.role === 'mentor' && user?.mentorRoles?.includes('jury') && (
                    <span className="px-2 py-0.5 bg-cyan-400/20 text-cyan-200 rounded-full text-[10px] font-bold">MENTOR + JURY</span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-1">
                  Bonjour, {user?.name?.split(' ')[0] || 'Jury'} 🎓
                </h1>
                <p className="text-indigo-200 text-sm max-w-lg">Évaluez les candidatures assignées · MEDIANET Incubator</p>
                <div className="flex items-center gap-4 mt-4 text-indigo-200/70 text-xs">
                  <span className="flex items-center gap-1.5">
                    {Ic.clockT}
                    <span className="mono">{time.toLocaleTimeString('fr-FR')}</span>
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                  <span>{time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'JR'}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{user?.name || 'Jury'}</p>
                    <p className="text-indigo-300 text-[10px] mono">JURY · CONFIDENTIEL</p>
                  </div>
                </div>
                {/* Barre de progression — cliquable */}
                <div
                  onClick={() => router.push(URL_ALL)}
                  className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 min-w-[180px] cursor-pointer hover:bg-white/15 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/70 text-[10px]">Progression</span>
                    <span className="text-white font-bold text-xs mono group-hover:underline">{pctDone}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${pctDone}%` }} />
                  </div>
                  <p className="text-white/40 text-[10px] mt-1 flex items-center gap-1">
                    {evaluated}/{total} candidatures évaluées
                    <span className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity">{Ic.arrow}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── PENDING BANNER — cliquable vers candidatures en attente ── */}
          {!loading && pending > 0 && (
            <div
              onClick={() => router.push(URL_PENDING)}
              className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl fade-up cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
            >
              <span className="text-amber-500 flex-shrink-0">{Ic.alert}</span>
              <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">
                <strong>{pending} candidature{pending > 1 ? 's' : ''}</strong>{' '}
                {pending > 1 ? 'attendent' : 'attend'} votre évaluation
                <span className="ml-2 text-amber-600 dark:text-amber-400 text-xs">· Délai : 9 mai 2026</span>
              </p>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap flex items-center gap-1 group-hover:gap-2 transition-all">
                Évaluer maintenant {Ic.arrow}
              </span>
            </div>
          )}

          {/* ── DIAGNOSTIC ── */}
          {!loading && total === 0 && debug && (
            <div className="glass-card rounded-2xl p-6 border-l-4 border-indigo-400 fade-up">
              <div className="flex items-start gap-3">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">{Ic.info}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm mb-1">Aucune candidature assignée pour le moment</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{debug.message}</p>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1 text-xs mono text-gray-500 dark:text-gray-400">
                    <p><span className="text-indigo-500">email :</span> {debug.userEmail}</p>
                    <p><span className="text-indigo-500">userId :</span> {debug.userId}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">💡 {debug.tip}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── KPI CARDS — toutes cliquables ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} h="h-32" className={`fade-up-${i + 1}`} />)
            ) : (
              <>
                <div className="fade-up-1">
                  <StatCard icon={Ic.file}  label="Candidatures totales" value={total}
                    sub="Assignées à ce jury"
                    gradient="linear-gradient(135deg,#312e81,#4f46e5)"
                    href={URL_ALL} />
                </div>
                <div className="fade-up-2">
                  <StatCard icon={Ic.check} label="Évaluées" value={evaluated}
                    sub={`Complétées · ${pctDone}%`}
                    gradient="linear-gradient(135deg,#065f46,#059669)"
                    href={URL_EVALUATED} />
                </div>
                <div className="fade-up-3">
                  <StatCard icon={Ic.clock} label="En attente" value={pending}
                    sub="À traiter maintenant"
                    gradient="linear-gradient(135deg,#b45309,#d97706)"
                    valueColor={pending > 0 ? 'text-amber-200' : 'text-white'}
                    href={URL_PENDING} />
                </div>
                <div className="fade-up-4">
                  <StatCard icon={Ic.trend} label="Score moyen" value={avgScore}
                    sub="Sur toutes mes évaluations"
                    gradient="linear-gradient(135deg,#4c1d95,#7c3aed)"
                    href={URL_EVALUATED} />
                </div>
              </>
            )}
          </div>

          {/* ── MAIN ROW ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Liste candidatures */}
            <SectionCard className="lg:col-span-2 fade-up"
              title="Candidatures assignées" subtitle="Cliquer pour évaluer"
              href={URL_ALL}
              action={
                <div className="flex items-center gap-2">
                  {pending > 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); router.push(URL_PENDING); }}
                      className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                    >
                      {pending} en attente
                    </button>
                  )}
                  <Link href={URL_ALL}
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1">
                    Tout voir {Ic.arrow}
                  </Link>
                </div>
              }>
              {loading ? <Skeleton h="h-64" /> : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 -mx-6">
                  {recent.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Aucune candidature assignée</p>
                      <Link href={URL_ALL} className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                        Voir toutes les candidatures {Ic.arrow}
                      </Link>
                    </div>
                  ) : (
                    recent.map((c, i) => {
                      const name    = c.projectName || c.companyName || 'Candidature';
                      const initials = name.slice(0, 2).toUpperCase();
                      const colors  = ['#4f46e5', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
                      const color   = colors[i % colors.length];
                      // Lien vers la candidature — si déjà évaluée, vers l'évaluation
                      const href = c.juryEvaluated && c.evaluationId
                        ? `/dashboard/jury/evaluations/${c.evaluationId}`
                        : `/dashboard/jury/candidatures/${c._id}`;
                      return (
                        <Link key={c._id} href={href}>
                          <div className="cand-row flex items-center gap-4 px-6 py-3.5 cursor-pointer">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: color }}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                              <p className="text-xs text-gray-400 truncate">{c.sector || c.programmeName || '—'}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {c.juryScore != null && (
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mono">
                                  {c.juryScore}/100
                                </span>
                              )}
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                c.juryEvaluated
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              }`}>
                                {c.juryEvaluated ? 'Évalué' : 'En attente'}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">{Ic.arrow}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </SectionCard>

            {/* Colonne droite : Donut + Critères */}
            <div className="flex flex-col gap-5">

              {/* Donut — légende cliquable */}
              <SectionCard className="fade-up" title="Répartition" subtitle="Cliquer pour filtrer">
                {loading ? <Skeleton h="h-40" /> : (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%"
                          innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value"
                          onClick={(data) => data?.href && router.push(data.href)}
                          style={{ cursor: 'pointer' }}
                        >
                          {donutData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="transparent"
                              style={{ cursor: 'pointer', outline: 'none' }}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Légende — chaque item cliquable */}
                    <div className="space-y-1 mt-1">
                      {donutData.map((d, i) => (
                        <div
                          key={i}
                          onClick={() => router.push(d.href)}
                          className="donut-legend-row flex items-center gap-2 px-2 py-2 cursor-pointer group"
                        >
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                            {d.name}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white mono">{d.value}</span>
                          <span className="opacity-0 group-hover:opacity-60 transition-opacity text-gray-400">{Ic.arrow}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </SectionCard>

              {/* Critères — cliquables vers évaluations */}
              <SectionCard className="fade-up" title="Critères d'évaluation" subtitle="Mes moyennes par critère"
                href={URL_EVALUATED}>
                {loading ? <Skeleton h="h-40" /> : (
                  <div className="space-y-3">
                    {criteria.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => router.push(URL_EVALUATED)}
                        className="cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                            {c.name}
                          </span>
                          <span className="text-xs font-bold mono text-gray-900 dark:text-white">{c.score}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="prog-bar h-full group-hover:opacity-90 transition-opacity" style={{
                            width: `${c.score}%`,
                            background: CRITERIA_COLORS[c.name] || '#4f46e5',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>

          {/* ── DISTRIBUTION SCORES — barres cliquables ── */}
          <SectionCard className="fade-up" title="Distribution des scores" subtitle="Cliquer sur une barre pour filtrer"
            href={URL_EVALUATED}>
            {loading ? <Skeleton h="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={scoreDistribution}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  onClick={(data) => data?.activePayload && router.push(URL_EVALUATED)}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Candidatures" radius={[5, 5, 0, 0]}>
                    {scoreDistribution.map((entry, i) => {
                      const colors = ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b'];
                      return <Cell key={i} fill={colors[i] || '#4f46e5'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* ── QUICK ACTIONS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up">
            {[
              {
                href: URL_ALL,
                icon: Ic.file,
                title: 'Candidatures',
                sub: 'Consulter et évaluer',
                bg: 'bg-indigo-100 dark:bg-indigo-900/30',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
              },
              {
                href: URL_PENDING,
                icon: Ic.clock,
                title: 'En attente',
                sub: `${pending} candidature${pending > 1 ? 's' : ''} à traiter`,
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                badge: pending > 0 ? pending : null,
              },
              {
                href: URL_EVALUATED,
                icon: Ic.star,
                title: 'Mes évaluations',
                sub: 'Historique et scores',
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
              },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="action-card glass-card rounded-xl p-5 flex items-center gap-4 cursor-pointer">
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} flex-shrink-0`}>
                    <span className={item.iconColor}>{item.icon}</span>
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.sub}</p>
                  </div>
                  <span className="text-gray-400">{Ic.arrow}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* ── FOOTER ── */}
          <div className="relative overflow-hidden rounded-2xl p-6 fade-up"
            style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)' }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 10px)' }} />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white">
                  {Ic.shield}
                </div>
                <div>
                  <h3 className="text-white font-bold">Évaluation confidentielle</h3>
                  <p className="text-white/50 text-xs">Scores consolidés par l'admin avant décision finale</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { value: 'OBJECTIF',     label: 'Rigueur',       href: URL_ALL       },
                  { value: 'CONFIDENTIEL', label: 'Usage interne', href: null          },
                  { value: '9 MAI',        label: 'Deadline',      href: URL_PENDING   },
                ].map((s, i) => (
                  <div
                    key={i}
                    onClick={() => s.href && router.push(s.href)}
                    className={`text-center ${s.href ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  >
                    <p className="text-white font-bold text-sm mono">{s.value}</p>
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