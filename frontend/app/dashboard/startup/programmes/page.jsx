'use client';
// app/dashboard/startup/programmes/page.jsx
// Page liste — UI cohérente avec le reste du dashboard startup

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { axiosAuth } from '@/app/store/slices/authSlice';

/* ─── Sector config ─────────────────────────────────────────────────────────── */
const SECTOR_CONFIG = {
  FinTech: {
    light: 'bg-blue-50 text-blue-700 border-blue-200',
    dark:  'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/40',
    icon:  'from-blue-500 to-blue-700',
    bar:   'from-blue-500 to-blue-600',
    dot:   'bg-blue-500',
    accent: '#3b82f6',
    svg: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>),
  },
  EdTech: {
    light: 'bg-violet-50 text-violet-700 border-violet-200',
    dark:  'dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/40',
    icon:  'from-violet-500 to-violet-700',
    bar:   'from-violet-500 to-violet-600',
    dot:   'bg-violet-500',
    accent: '#8b5cf6',
    svg: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>),
  },
  AgriTech: {
    light: 'bg-amber-50 text-amber-700 border-amber-200',
    dark:  'dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40',
    icon:  'from-amber-500 to-amber-700',
    bar:   'from-amber-500 to-amber-600',
    dot:   'bg-amber-500',
    accent: '#f59e0b',
    svg: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>),
  },
  CleanTech: {
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dark:  'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40',
    icon:  'from-emerald-500 to-teal-600',
    bar:   'from-emerald-500 to-teal-500',
    dot:   'bg-emerald-500',
    accent: '#10b981',
    svg: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
  },
  HealthTech: {
    light: 'bg-rose-50 text-rose-700 border-rose-200',
    dark:  'dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/40',
    icon:  'from-rose-500 to-pink-600',
    bar:   'from-rose-500 to-pink-500',
    dot:   'bg-rose-500',
    accent: '#f43f5e',
    svg: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>),
  },
  'AI/ML': {
    light: 'bg-pink-50 text-pink-700 border-pink-200',
    dark:  'dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700/40',
    icon:  'from-pink-500 to-rose-600',
    bar:   'from-pink-500 to-rose-500',
    dot:   'bg-pink-500',
    accent: '#ec4899',
    svg: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/></svg>),
  },
  FoodTech: {
    light: 'bg-lime-50 text-lime-700 border-lime-200',
    dark:  'dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-700/40',
    icon:  'from-lime-500 to-green-600',
    bar:   'from-lime-500 to-green-500',
    dot:   'bg-lime-500',
    accent: '#84cc16',
    svg: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>),
  },
  'Tous secteurs': {
    light: 'bg-gray-100 text-gray-600 border-gray-200',
    dark:  'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    icon:  'from-gray-500 to-gray-700',
    bar:   'from-gray-400 to-gray-500',
    dot:   'bg-gray-400',
    accent: '#6b7280',
    svg: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>),
  },
};

const getSector  = (s) => SECTOR_CONFIG[s] || SECTOR_CONFIG['Tous secteurs'];
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const daysLeft   = (d) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : 999;

const SECTORS_FILTER = ['Tous', 'FinTech', 'EdTech', 'AgriTech', 'CleanTech', 'HealthTech', 'AI/ML', 'FoodTech'];

/* ─── Skeleton Card ──────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="h-2 bg-gray-100 dark:bg-gray-700" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-20 bg-gray-100 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
          <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-8 w-24 bg-gray-100 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ─── Programme Card ────────────────────────────────────────────────────────── */
function ProgrammeCard({ prog, index, alreadyApplied, onApply }) {
  const sc     = getSector(prog.sector);
  const days   = daysLeft(prog.dateFin || prog.deadline);
  const urgent = days <= 14 && days > 0;
  const closed = prog.status === 'closed' || days <= 0;

  const titre   = prog.titre || prog.name || 'Programme';
  const sector  = prog.sector || 'Tous secteurs';
  const quota   = prog.quota || prog.maxStartups;
  const dateD   = prog.dateDebut;
  const dateF   = prog.dateFin || prog.deadline;
  const desc    = prog.description || '';
  const subSecs = prog.subSectors || [];
  const objs    = prog.objectives || prog.benefits?.slice(0, 2) || [];

  const detailUrl = `/dashboard/startup/programmes/${prog._id || prog.id}`;

  return (
    <div style={{ animation: `slideUp 0.45s ease-out ${index * 0.06}s both` }}>
      <div className={`group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-black/20 hover:border-gray-200 dark:hover:border-gray-600 ${closed && !alreadyApplied ? 'opacity-60' : ''}`}>

        {/* Accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${sc.bar} flex-shrink-0`} />

        <div className="flex flex-col flex-1 p-5">

          {/* Header : icon + sector + status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {prog.logo ? (
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-1.5 flex-shrink-0">
                  <img src={prog.logo} alt={titre} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white flex-shrink-0`}>
                  {sc.svg}
                </div>
              )}
              <div>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.light} ${sc.dark}`}>
                  {sector}
                </span>
              </div>
            </div>

            {/* Status badge */}
            {alreadyApplied ? (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 flex-shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                Candidaté
              </span>
            ) : closed ? (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 flex-shrink-0">Clôturé</span>
            ) : urgent ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700/40 flex-shrink-0 animate-pulse">{days}j</span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Ouvert
              </span>
            )}
          </div>

          {/* Titre */}
          <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {titre}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2 flex-1">
            {desc.split('\n\n')[0]}
          </p>

          {/* Sub-sectors */}
          {subSecs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {subSecs.slice(0, 3).map((s, i) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sc.light} ${sc.dark}`}>{s}</span>
              ))}
              {subSecs.length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-600">+{subSecs.length - 3}</span>
              )}
            </div>
          )}

          {/* Objectifs */}
          {objs.length > 0 && (
            <div className="space-y-1 mb-3">
              {objs.slice(0, 2).map((obj, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  <span className="line-clamp-1">{typeof obj === 'string' ? obj : obj.label || obj.desc || ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Meta : date + places */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
            {(dateD || dateF) && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                {dateD ? formatDate(dateD) : ''}{dateD && dateF ? ' — ' : ''}{dateF ? formatDate(dateF) : ''}
              </span>
            )}
            {quota && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {quota} places
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto gap-2">
            <Link href={detailUrl} className="text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center gap-1 group/l">
              Détails
              <svg className="w-3.5 h-3.5 group-hover/l:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </Link>

            {alreadyApplied ? (
              <Link href="/dashboard/startup/candidatures">
                <button className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  Ma candidature
                </button>
              </Link>
            ) : !closed ? (
              <button
                onClick={() => onApply(prog)}
                className={`px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r ${sc.bar} rounded-xl hover:opacity-90 hover:-translate-y-px transition-all shadow-sm`}
              >
                Candidater
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function DashboardProgrammesPage() {
  const { accessToken } = useSelector(s => s.auth);
  const router = useRouter();

  const [programmes,   setProgrammes]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [myAppliedIds, setMyAppliedIds] = useState([]);
  const [search,       setSearch]       = useState('');
  const [sector,       setSector]       = useState('Tous');
  const [showClosed,   setShowClosed]   = useState(false);
  const [error,        setError]        = useState(null);
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => { setMounted(true); loadData(); }, [accessToken]);

  const loadData = async (isRefresh = false) => {
    if (!accessToken) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [progRes, appsRes] = await Promise.all([
        axiosAuth.get('/api/startups-programmes'),
        axiosAuth.get('/api/startups-programmes/my-applications'),
      ]);
      setProgrammes(progRes.data.programmes || []);
      setMyAppliedIds(appsRes.data.appliedIds || []);
    } catch {
      setError('Impossible de charger les programmes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApply = (prog) => {
    const titre = prog.titre || prog.name || '';
    router.push(`/dashboard/startup/apply?programmeId=${prog._id || prog.id}&programmeName=${encodeURIComponent(titre)}`);
  };

  const isApplied = (prog) => myAppliedIds.includes((prog._id || prog.id)?.toString());
  const isClosed  = (prog) => {
    const days = daysLeft(prog.dateFin || prog.deadline);
    return prog.status === 'closed' || days <= 0;
  };

  const filtered = programmes.filter(p => {
    const mS = sector === 'Tous' || p.sector === sector;
    const mC = showClosed ? true : !isClosed(p);
    const mQ = !search || (p.titre || p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    return mS && mC && mQ;
  });

  const active    = filtered.filter(p => !isClosed(p));
  const closed    = filtered.filter(p => isClosed(p));
  const openCount = programmes.filter(p => !isClosed(p)).length;

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="space-y-6 pb-10" style={{ animation: 'slideUp 0.35s ease-out both' }}>

          {/* ══ HEADER — style identique à la page candidatures ══════════════ */}
          <div className="relative overflow-hidden rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)' }}>
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            {/* Glow blobs */}
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-sky-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl" />

            <div className="relative px-8 pt-8 pb-7">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                {/* Left — title block */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 mb-4">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-white/80 tracking-wider uppercase">
                      {openCount} programme{openCount !== 1 ? 's' : ''} actif{openCount !== 1 ? 's' : ''} — Candidatures ouvertes
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                    Nos Programmes d'Incubation
                  </h1>
                  <p className="text-sky-200/70 text-sm max-w-lg leading-relaxed">
                    Medianet Incubator accompagne les startups tunisiennes et africaines les plus prometteuses à travers des programmes sectoriels sur-mesure.
                  </p>
                </div>

                {/* Right — stat pills */}
                <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{openCount}</div>
                      <div className="text-xs text-sky-300">Actifs</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-amber-300">{myAppliedIds.length}</div>
                      <div className="text-xs text-sky-300">Candidatures</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-300">{programmes.length}</div>
                      <div className="text-xs text-sky-300">Total</div>
                    </div>
                  </div>
                  {myAppliedIds.length > 0 && (
                    <Link href="/dashboard/startup/candidatures">
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sky-700 text-sm font-bold hover:bg-sky-50 transition-all hover:-translate-y-px shadow-lg shadow-black/10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        Mes {myAppliedIds.length} candidature{myAppliedIds.length > 1 ? 's' : ''}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══ FILTRES ═══════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="px-4 py-3 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un programme..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                />
              </div>

              {/* Sectors */}
              <div className="flex flex-wrap gap-1.5">
                {SECTORS_FILTER.map(s => (
                  <button key={s} onClick={() => setSector(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                      sector === s
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Toggle clôturés + refresh */}
              <div className="flex items-center gap-3 ml-auto">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-medium text-gray-400 hidden sm:block">Clôturés</span>
                  <button
                    onClick={() => setShowClosed(!showClosed)}
                    className={`relative rounded-full transition-colors duration-200 ${showClosed ? 'bg-sky-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    style={{ width: 36, height: 20 }}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${showClosed ? 'translate-x-4' : ''}`} />
                  </button>
                </label>
                <button onClick={() => loadData(true)} disabled={refreshing}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors disabled:opacity-50">
                  <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ══ GRILLE PROGRAMMES ═════════════════════════════════════════════ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">
                  {sector === 'Tous' ? 'Tous les programmes' : `Secteur ${sector}`}
                </p>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {active.length} programme{active.length !== 1 ? 's' : ''} disponible{active.length !== 1 ? 's' : ''}
                </h2>
              </div>
              {active.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Candidatures ouvertes
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Erreur de chargement</h3>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button onClick={() => loadData()} className="px-5 py-2 rounded-xl text-white text-sm font-semibold bg-sky-600 hover:bg-sky-700 transition-colors">Réessayer</button>
              </div>
            ) : active.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Aucun programme trouvé</h3>
                <p className="text-sm text-gray-500 mb-4">{search || sector !== 'Tous' ? 'Modifiez vos filtres pour voir plus de résultats.' : 'Aucun programme actif pour le moment.'}</p>
                {(search || sector !== 'Tous') && (
                  <button onClick={() => { setSector('Tous'); setSearch(''); }} className="px-5 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {active.map((prog, idx) => (
                  <ProgrammeCard
                    key={prog._id || prog.id || idx}
                    prog={prog}
                    index={idx}
                    alreadyApplied={isApplied(prog)}
                    onApply={handleApply}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ══ BANNER CANDIDATURE SPONTANÉE ══════════════════════════════════ */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-100 dark:border-sky-900/30 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Votre projet ne rentre dans aucun programme ?</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Soumettez une candidature spontanée — notre équipe examine chaque dossier sous 48 heures.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/startup/apply?type=spontane" className="flex-shrink-0">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-all hover:-translate-y-px shadow-sm shadow-sky-200 dark:shadow-none">
                  Candidature Spontanée
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
              </Link>
            </div>
          </div>

          {/* ══ PROGRAMMES CLÔTURÉS ═══════════════════════════════════════════ */}
          {showClosed && closed.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-[0.12em] uppercase flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  Programmes clôturés ({closed.length})
                </span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {closed.map((prog, idx) => (
                  <ProgrammeCard
                    key={prog._id || prog.id || idx}
                    prog={prog}
                    index={idx}
                    alreadyApplied={isApplied(prog)}
                    onApply={handleApply}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}