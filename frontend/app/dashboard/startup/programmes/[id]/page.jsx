'use client';
// app/dashboard/startup/programmes/[id]/page.jsx
// Page détail programme — UI cohérente avec le dashboard startup

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { axiosAuth } from '@/app/store/slices/authSlice';

/* ─── Sector config ─────────────────────────────────────────────────────────── */
const SECTOR_CONFIG = {
  FinTech:    { icon: 'from-blue-500 to-blue-700',    bar: 'from-blue-500 to-blue-600',    light: 'bg-blue-50 text-blue-700 border-blue-200',       dark: 'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/40',     accent: '#3b82f6',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> },
  EdTech:     { icon: 'from-violet-500 to-violet-700', bar: 'from-violet-500 to-violet-600', light: 'bg-violet-50 text-violet-700 border-violet-200',   dark: 'dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/40', accent: '#8b5cf6',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg> },
  AgriTech:   { icon: 'from-amber-500 to-amber-700',  bar: 'from-amber-500 to-amber-600',  light: 'bg-amber-50 text-amber-700 border-amber-200',       dark: 'dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40',   accent: '#f59e0b',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
  CleanTech:  { icon: 'from-emerald-500 to-teal-600', bar: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40', accent: '#10b981',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  HealthTech: { icon: 'from-rose-500 to-pink-600',    bar: 'from-rose-500 to-pink-500',    light: 'bg-rose-50 text-rose-700 border-rose-200',         dark: 'dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/40',     accent: '#f43f5e',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg> },
  'AI/ML':    { icon: 'from-pink-500 to-rose-600',    bar: 'from-pink-500 to-rose-500',    light: 'bg-pink-50 text-pink-700 border-pink-200',         dark: 'dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700/40',     accent: '#ec4899',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/></svg> },
  FoodTech:   { icon: 'from-lime-500 to-green-600',   bar: 'from-lime-500 to-green-500',   light: 'bg-lime-50 text-lime-700 border-lime-200',         dark: 'dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-700/40',     accent: '#84cc16',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg> },
  'Tous secteurs': { icon: 'from-gray-500 to-gray-700', bar: 'from-gray-400 to-gray-500', light: 'bg-gray-100 text-gray-600 border-gray-200', dark: 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', accent: '#6b7280',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
};

const getSector  = (s) => SECTOR_CONFIG[s] || SECTOR_CONFIG['Tous secteurs'];
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const daysLeft   = (d) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : 999;

const BENEFIT_ICONS = [
  <svg key="b0" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  <svg key="b1" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  <svg key="b2" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  <svg key="b3" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>,
  <svg key="b4" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
];

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      <div className="h-9 w-36 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />)}
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
          </div>
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function DashboardProgrammeDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { accessToken } = useSelector(s => s.auth);

  const [prog,           setProg]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('apercu');
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [lightboxImg,    setLightboxImg]    = useState(null);
  const [lightboxIdx,    setLightboxIdx]    = useState(0);
  const [mounted,        setMounted]        = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!accessToken || !params.id) return;
    (async () => {
      try {
        const [progRes, appsRes] = await Promise.all([
          axiosAuth.get(`/api/startups-programmes/${params.id}`),
          axiosAuth.get('/api/startups-programmes/my-applications'),
        ]);
        const p = progRes.data.programme || progRes.data;
        setProg(p);
        const ids = appsRes.data.appliedIds || [];
        setAlreadyApplied(ids.includes((p._id || p.id)?.toString()));
      } catch {
        setProg(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, params.id]);

  const navLightbox = (dir) => {
    if (!prog?.gallery) return;
    const next = (lightboxIdx + dir + prog.gallery.length) % prog.gallery.length;
    setLightboxImg(prog.gallery[next]);
    setLightboxIdx(next);
  };

  if (!mounted || loading) return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout><Skeleton /></DashboardLayout>
    </ProtectedRoute>
  );

  if (!prog) return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout>
        <div className="max-w-md mx-auto py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Programme introuvable</h1>
          <p className="text-sm text-gray-500 mb-6">Ce programme n'existe pas ou a été supprimé.</p>
          <Link href="/dashboard/startup/programmes">
            <button className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold text-sm hover:bg-sky-700 transition-colors">
              Retour aux programmes
            </button>
          </Link>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );

  /* ── Données normalisées ─────────────────────────────────────────────────── */
  const titre    = prog.titre || prog.name || 'Programme';
  const sector   = prog.sector || 'Tous secteurs';
  const sc       = getSector(sector);
  const quota    = prog.quota || prog.maxStartups;
  const dateD    = prog.dateDebut;
  const dateF    = prog.dateFin || prog.deadline;
  const desc     = prog.description || '';
  const subSecs  = prog.subSectors || [];
  const objs     = prog.objectives || [];
  const phases   = prog.phases || [];
  const benefits = prog.benefits || [];
  const jury     = prog.jury || prog.mentors || [];
  const imgSrc   = prog.image || prog.coverImage;
  const logoSrc  = prog.logo || prog.logoUrl;
  const gallery  = prog.gallery || [];
  const testimonials = prog.testimonials || [];
  const partners = prog.partners || [];
  const criteria = prog.criteria || prog.eligibilityCriteria || [];
  const hasStats = prog.stats && Object.values(prog.stats).some(v => v != null);

  const days   = daysLeft(dateF);
  const open   = prog.status !== 'closed' && days > 0;
  const urgent = days <= 14 && days > 0;

  const applyUrl = `/dashboard/startup/apply?programmeId=${prog._id || prog.id}&programmeName=${encodeURIComponent(titre)}`;

  const tabs = [
    { key: 'apercu',     label: 'Aperçu' },
    { key: 'objectifs',  label: 'Objectifs' },
    { key: 'criteres',   label: 'Critères' },
    { key: 'calendrier', label: 'Calendrier' },
    ...(hasStats ? [{ key: 'resultats', label: 'Résultats' }] : []),
    ...(gallery.length > 0 ? [{ key: 'galerie', label: `Galerie (${gallery.length})` }] : []),
  ];

  return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout>
        <style>{`
          @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
          @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          .anim-fade { animation: fadeIn 0.25s ease-out both; }
          .anim-up   { animation: slideUp 0.35s ease-out both; }
        `}</style>

        <div className="pb-10 space-y-6 anim-up">

          {/* ══ BREADCRUMB ════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard/startup/programmes"
              className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Programmes
            </Link>
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">{titre}</span>
          </div>

          {/* ══ HERO HEADER ══════════════════════════════════════════════════ */}
          {imgSrc ? (
            /* With cover image */
            <div className="relative h-56 md:h-72 overflow-hidden rounded-2xl">
              <img src={imgSrc} alt={titre} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />
              <div className={`absolute inset-0 bg-gradient-to-r ${sc.bar} opacity-10`} />

              {/* Status */}
              <div className="absolute top-4 right-4">
                {alreadyApplied ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    Candidature envoyée
                  </span>
                ) : !open ? (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/80">Clôturé</span>
                ) : urgent ? (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500 text-white animate-pulse">{days} jours restants</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/20">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Ouvert
                  </span>
                )}
              </div>

              {/* Bottom — title */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
                <div className="flex items-end gap-4 justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${sc.light} ${sc.dark}`}>
                        {sc.svg}{sector}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-md">{titre}</h1>
                  </div>
                  {logoSrc && (
                    <div className="flex-shrink-0 hidden md:block">
                      <div className="w-14 h-14 rounded-2xl bg-white/95 p-2 shadow-xl">
                        <img src={logoSrc} alt={titre} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Without cover — gradient header matching dashboard style */
            <div className="relative overflow-hidden rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)' }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div className="absolute -top-8 -right-8 w-48 h-48 bg-sky-400/20 rounded-full blur-3xl" />

              <div className="relative px-7 pt-7 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                      {sc.svg}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
                          {sc.svg}{sector}
                        </span>
                        {alreadyApplied ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/80 text-white flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                            Candidature envoyée
                          </span>
                        ) : !open ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/20 text-white/80">Clôturé</span>
                        ) : urgent ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white animate-pulse">{days} jours restants</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Ouvert
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{titre}</h1>
                    </div>
                  </div>
                  {logoSrc && (
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-white/90 p-1.5 shadow-xl">
                        <img src={logoSrc} alt={titre} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-white/10">
                  {(dateD || dateF) && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-sky-200/80">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      {formatDate(dateD)}{dateD && dateF ? ' → ' : ''}{formatDate(dateF)}
                    </span>
                  )}
                  {quota && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-sky-200/80">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {quota} places disponibles
                    </span>
                  )}
                  {prog.applicantsCount > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-sky-200/80">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      {prog.applicantsCount} candidature{prog.applicantsCount > 1 ? 's' : ''} reçue{prog.applicantsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ MAIN CONTENT ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT — content ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Sub-sectors */}
              {subSecs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {subSecs.map((s, i) => (
                    <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${sc.light} ${sc.dark}`}>{s}</span>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Tab nav */}
                <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                        activeTab === tab.key
                          ? 'border-sky-600 text-sky-600 dark:text-sky-400 dark:border-sky-400 bg-sky-50/50 dark:bg-sky-900/10'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-6 min-h-[260px]">

                  {/* Aperçu */}
                  {activeTab === 'apercu' && (
                    <div className="anim-fade space-y-6">
                      {/* Description */}
                      <div className="space-y-3">
                        {desc.split('\n\n').map((para, i) => (
                          <p key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{para}</p>
                        ))}
                      </div>

                      {/* Benefits */}
                      {benefits.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-3">Ce que vous obtenez</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {benefits.map((b, i) => {
                              const label = typeof b === 'string' ? b : (b.label || '');
                              const bDesc = typeof b === 'string' ? '' : (b.desc || b.description || '');
                              return (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white flex-shrink-0`}>
                                    {BENEFIT_ICONS[i % BENEFIT_ICONS.length]}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                                    {bDesc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{bDesc}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Stats highlight */}
                      {hasStats && (
                        <div className={`grid grid-cols-3 gap-4 p-4 rounded-xl border ${sc.light} ${sc.dark}`}>
                          {prog.stats.startups && (
                            <div className="text-center">
                              <div className="text-2xl font-bold">{prog.stats.startups}</div>
                              <div className="text-xs opacity-60 mt-0.5">Startups</div>
                            </div>
                          )}
                          {prog.stats.sessions && (
                            <div className="text-center border-l border-current/15">
                              <div className="text-2xl font-bold">{prog.stats.sessions}</div>
                              <div className="text-xs opacity-60 mt-0.5">Sessions</div>
                            </div>
                          )}
                          {prog.stats.leveesFonds && (
                            <div className="text-center border-l border-current/15">
                              <div className="text-2xl font-bold">{prog.stats.leveesFonds}</div>
                              <div className="text-xs opacity-60 mt-0.5">Levées</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Objectifs */}
                  {activeTab === 'objectifs' && (
                    <div className="anim-fade space-y-2.5">
                      {objs.length > 0 ? objs.map((obj, i) => (
                        <div key={i} className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {String(i + 1).padStart(2, '0')}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                            {typeof obj === 'string' ? obj : obj.label || obj}
                          </p>
                        </div>
                      )) : (
                        <div className="text-center py-10">
                          <p className="text-sm text-gray-400">Objectifs non définis pour ce programme.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Critères */}
                  {activeTab === 'criteres' && (
                    <div className="anim-fade space-y-2.5">
                      {criteria.length > 0 ? criteria.map((crit, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 hover:border-emerald-100 dark:hover:border-emerald-800/40 transition-colors group">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{crit}</span>
                        </div>
                      )) : (
                        <div className="text-center py-10">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                          </div>
                          <p className="text-sm text-gray-400">Critères non définis pour ce programme.</p>
                          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Contactez-nous pour plus d'informations.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Calendrier */}
                  {activeTab === 'calendrier' && (
                    <div className="anim-fade">
                      {phases.length > 0 ? (
                        <div className="space-y-0">
                          {phases.map((phase, i) => {
                            const isDone   = phase.done || phase.statut === 'done';
                            const isActive = phase.statut === 'in-progress';
                            const isLast   = i === phases.length - 1;
                            return (
                              <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold ${
                                    isDone   ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                    : isActive ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                                    : 'bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-200 dark:border-gray-700'
                                  }`}>
                                    {isDone ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                                    ) : isActive ? (
                                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    ) : String(i + 1)}
                                  </div>
                                  {!isLast && <div className={`w-px flex-1 mt-1 mb-1 min-h-[28px] ${isDone ? 'bg-emerald-200 dark:bg-emerald-800/40' : 'bg-gray-100 dark:bg-gray-800'}`} />}
                                </div>
                                <div className={`flex-1 pb-5 pt-1 ${!isDone && !isActive ? 'opacity-40' : ''}`}>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className={`text-sm font-semibold ${isDone ? 'text-emerald-600 dark:text-emerald-400' : isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {phase.label}
                                    </p>
                                    {isActive && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-medium">En cours</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{phase.date}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-sm text-gray-400">Calendrier non défini pour ce programme.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Résultats */}
                  {activeTab === 'resultats' && hasStats && (
                    <div className="anim-fade">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.12em] mb-4">Résultats — 1ère cohorte</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { value: prog.stats.startups,    label: 'Startups incubées',    sub: 'accompagnées' },
                          { value: prog.stats.sessions,    label: 'Sessions de coaching', sub: 'collectives & individuelles' },
                          { value: prog.stats.leveesFonds, label: 'Levées finalisées',    sub: 'deals conclus' },
                        ].filter(s => s.value != null).map((s, i) => (
                          <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 text-center hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all">
                            <div className={`text-3xl font-bold bg-gradient-to-r ${sc.bar} bg-clip-text text-transparent mb-1`}>{s.value}</div>
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Galerie */}
                  {activeTab === 'galerie' && gallery.length > 0 && (
                    <div className="anim-fade">
                      <div className="grid grid-cols-3 gap-2">
                        {gallery.map((img, i) => (
                          <div key={i} onClick={() => { setLightboxImg(img); setLightboxIdx(i); }}
                            className={`relative group overflow-hidden rounded-xl cursor-pointer bg-gray-100 dark:bg-gray-700 ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                            style={{ aspectRatio: '1/1' }}>
                            <img src={img} alt={`Galerie ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Témoignages */}
              {testimonials.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.12em] mb-4">Témoignages</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {testimonials.map((t, i) => (
                      <div key={i} className="relative p-5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${sc.bar}`} />
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                        <div className="flex items-center gap-2.5">
                          {t.photo ? (
                            <img src={t.photo} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white text-xs font-bold`}>
                              {(t.name || '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{t.name}</p>
                            <p className="text-xs text-gray-400">{t.company}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partenaires */}
              {partners.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.12em] mb-4">Partenaires</h3>
                  <div className="flex flex-wrap items-center gap-6">
                    {partners.map((p, i) => (
                      <div key={i}>
                        {p.logo ? (
                          <img src={p.logo} alt={p.name} className="h-7 object-contain grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all" />
                        ) : (
                          <span className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{p.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT — Sidebar ─────────────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">

                {/* CTA Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className={`h-1 bg-gradient-to-r ${sc.bar}`} />

                  <div className="p-5 space-y-3">
                    {/* Dates */}
                    {(dateD || dateF) && (
                      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white flex-shrink-0`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Période</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug">
                            {formatDate(dateD)}{dateD && dateF ? ' → ' : ''}{formatDate(dateF)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Deadline countdown */}
                    {open && days < 60 && (
                      <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${urgent ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${urgent ? 'bg-red-500' : 'bg-amber-500'}`}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${urgent ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {days} jour{days > 1 ? 's' : ''} restant{days > 1 ? 's' : ''}
                          </p>
                          <p className={`text-xs ${urgent ? 'text-red-500/70 dark:text-red-500/60' : 'text-amber-500/70 dark:text-amber-500/60'}`}>
                            Clôture le {formatDate(dateF)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quota */}
                    {quota && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white flex-shrink-0`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Places</p>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{quota} startups</p>
                          </div>
                        </div>
                        <span className={`text-2xl font-bold bg-gradient-to-r ${sc.bar} bg-clip-text text-transparent`}>{quota}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className="px-5 pb-5">
                    {alreadyApplied ? (
                      <>
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 mb-3">
                          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Candidature déjà soumise</p>
                        </div>
                        <Link href="/dashboard/startup/candidatures">
                          <button className="w-full py-3 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                            Voir ma candidature
                          </button>
                        </Link>
                      </>
                    ) : open ? (
                      <>
                        <Link href={applyUrl}>
                          <button className={`w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${sc.bar} hover:opacity-90 hover:-translate-y-px transition-all shadow-md`}>
                            Candidater à ce programme
                          </button>
                        </Link>
                        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">Réponse sous 2 semaines</p>
                      </>
                    ) : (
                      <div className="w-full py-3 text-center rounded-xl text-sm font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                        Programme clôturé
                      </div>
                    )}
                  </div>
                </div>

                {/* Jury */}
                {jury.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.12em] mb-4">Jury d'évaluation</p>
                    <div className="space-y-3">
                      {jury.map((j, i) => {
                        const name     = typeof j === 'string' ? j : (j.name || j.fullName || 'Jury');
                        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            {(j.photo || j.avatar) ? (
                              <img src={j.photo || j.avatar} alt={name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                            ) : (
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{name}</p>
                              {j.role && <p className="text-xs text-gray-400 truncate">{j.role}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Autres programmes */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Pas le bon programme ?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                    Consultez tous nos programmes ou soumettez une candidature spontanée.
                  </p>
                  <div className="space-y-2">
                    <Link href="/dashboard/startup/programmes">
                      <button className="w-full py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                        Voir tous les programmes
                      </button>
                    </Link>
                    <Link href="/dashboard/startup/apply?type=spontane">
                      <button className="w-full py-2 text-sm font-medium text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
                        Candidature spontanée
                      </button>
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ══ LIGHTBOX ═════════════════════════════════════════════════════ */}
        {lightboxImg && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxImg(null)}>
            <button onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            {gallery.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); navLightbox(-1); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); navLightbox(1); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
                  {lightboxIdx + 1} / {gallery.length}
                </div>
              </>
            )}
            <img src={lightboxImg} alt="Galerie" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()} />
          </div>
        )}

      </DashboardLayout>
    </ProtectedRoute>
  );
}