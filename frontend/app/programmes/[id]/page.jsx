'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import Button from '@/app/components/common/Button';
import Card from '@/app/components/common/Card';
import { MOCK_PROGRAMMES } from '@/app/programmes/page';

/* ─── Sector config ───────────────────────────────────────────── */
const SECTOR_CONFIG = {
  FinTech: {
    light: 'bg-blue-50 text-blue-700 border-blue-200',
    dark:  'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/40',
    icon:  'from-blue-500 to-blue-700',
    bar:   'from-blue-500 to-blue-600',
    accent: '#3b82f6',
    svg: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>),
  },
  EdTech: {
    light: 'bg-violet-50 text-violet-700 border-violet-200',
    dark:  'dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/40',
    icon:  'from-violet-500 to-violet-700',
    bar:   'from-violet-500 to-violet-600',
    accent: '#8b5cf6',
    svg: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>),
  },
  AgriTech: {
    light: 'bg-amber-50 text-amber-700 border-amber-200',
    dark:  'dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40',
    icon:  'from-amber-500 to-amber-700',
    bar:   'from-amber-500 to-amber-600',
    accent: '#f59e0b',
    svg: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>),
  },
  CleanTech: {
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dark:  'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40',
    icon:  'from-emerald-500 to-teal-600',
    bar:   'from-emerald-500 to-teal-500',
    accent: '#10b981',
    svg: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
  },
  HealthTech: {
    light: 'bg-green-50 text-green-700 border-green-200',
    dark:  'dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/40',
    icon:  'from-green-500 to-green-700',
    bar:   'from-green-500 to-green-600',
    accent: '#22c55e',
    svg: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>),
  },
  FoodTech: {
    light: 'bg-lime-50 text-lime-700 border-lime-200',
    dark:  'dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-700/40',
    icon:  'from-lime-500 to-green-600',
    bar:   'from-lime-500 to-green-500',
    accent: '#84cc16',
    svg: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>),
  },
  'AI/ML': {
    light: 'bg-pink-50 text-pink-700 border-pink-200',
    dark:  'dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700/40',
    icon:  'from-pink-500 to-rose-600',
    bar:   'from-pink-500 to-rose-500',
    accent: '#ec4899',
    svg: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/></svg>),
  },
  'Tous secteurs': {
    light: 'bg-gray-100 text-gray-600 border-gray-200',
    dark:  'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    icon:  'from-gray-500 to-gray-700',
    bar:   'from-gray-400 to-gray-500',
    accent: '#6b7280',
    svg: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>),
  },
};

const getSector  = (s) => SECTOR_CONFIG[s] || SECTOR_CONFIG['Tous secteurs'];
const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const daysLeft   = (d) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
const candidatureUrl = (progId, progName) =>
  `/login?redirect=programme&progId=${progId}&progName=${encodeURIComponent(progName)}`;

const BENEFIT_ICONS = [
  <svg key="b0" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  <svg key="b1" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  <svg key="b2" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  <svg key="b3" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>,
  <svg key="b4" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 10H3m18-10h-2m2 10h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  <svg key="b5" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
];

export default function ProgrammeDetailPage() {
  const params = useParams();
  const [prog, setProg]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('apercu');
  const [lightboxImg, setLightboxImg] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [mounted, setMounted]     = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const res = await fetch(`/api/programmes/public/${params.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        setProg(d.programme);
      } catch {
        const found = MOCK_PROGRAMMES.find(p => p._id === params.id);
        setProg(found || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  // Parallax on hero
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        const img = heroRef.current.querySelector('.hero-img');
        if (img) img.style.transform = `translateY(${scrolled * 0.3}px) scale(1.1)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openLightbox = (img, idx) => { setLightboxImg(img); setLightboxIdx(idx); };
  const navLightbox = (dir) => {
    if (!prog?.gallery) return;
    const next = (lightboxIdx + dir + prog.gallery.length) % prog.gallery.length;
    setLightboxImg(prog.gallery[next]);
    setLightboxIdx(next);
  };

  if (!mounted || loading) return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <Navbar />
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 dark:text-gray-500 tracking-widest uppercase">Chargement</p>
      </div>
    </div>
  );

  if (!prog) return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-40 text-center">
        <p className="text-gray-400 mb-6 text-sm tracking-widest uppercase">404 — Introuvable</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Programme introuvable</h1>
        <Link href="/programmes"><Button variant="primary">Retour aux programmes</Button></Link>
      </div>
      <Footer />
    </div>
  );

  const sc      = getSector(prog.sector);
  const days    = daysLeft(prog.dateFin);
  const open    = prog.status === 'published';
  const urgent  = days <= 14 && days > 0;
  const applyUrl = candidatureUrl(prog._id, prog.titre);

  const hasStats        = prog.stats && Object.values(prog.stats).some(v => v != null);
  const hasGallery      = prog.gallery?.length > 0;
  const hasTestimonials = prog.testimonials?.length > 0;
  const hasSubSectors   = prog.subSectors?.length > 0;
  const hasPartners     = prog.partners?.length > 0;

  const tabs = [
    { key: 'apercu',     label: 'Aperçu' },
    { key: 'objectifs',  label: 'Objectifs' },
    { key: 'criteres',   label: 'Critères' },
    { key: 'calendrier', label: 'Calendrier' },
    ...(hasStats ? [{ key: 'resultats', label: 'Résultats' }] : []),
  ];

  const statsData = hasStats ? [
    { value: prog.stats.startups,        label: 'Startups incubées',        sub: 'accompagnées sur 6 mois' },
    { value: prog.stats.labelStartup,    label: 'Labels startup',           sub: 'obtenus par les équipes' },
    { value: prog.stats.commercialisent, label: 'Startups actives',         sub: 'commercialisent leurs produits' },
    { value: prog.stats.leveesFonds,     label: 'Levées finalisées',        sub: 'deals conclus avec investisseurs' },
    { value: prog.stats.sessions,        label: 'Sessions de coaching',     sub: 'collectives & one-to-one' },
  ].filter(s => s.value != null) : [];

  return (
    <div className="relative bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════ */}
      {prog.image ? (
        <div ref={heroRef} className="relative mt-16 h-[55vh] md:h-[65vh] overflow-hidden">
          <img
            src={prog.image}
            alt={prog.titre}
            className="hero-img w-full h-full object-cover scale-110 origin-center"
          />
          {/* Multi-layer overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className={`absolute inset-0 bg-gradient-to-r ${sc.bar} opacity-10`} />

          {/* Top left — back nav */}
          <div className="absolute top-6 left-6 md:left-10">
            <Link href="/programmes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Programmes
            </Link>
          </div>

          {/* Status badge top right */}
          <div className="absolute top-6 right-6">
            {!open ? (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-white/80 border border-white/20">
                Clôturé
              </span>
            ) : urgent ? (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse">
                {days} jours restants
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Candidatures ouvertes
              </span>
            )}
          </div>

          {/* Bottom — titre + logo sur l'image */}
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8">
            <div className="max-w-7xl mx-auto flex items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.light} ${sc.dark} backdrop-blur-sm`}>
                    {sc.svg}
                    {prog.sector}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                  {prog.titre}
                </h1>
              </div>
              {prog.logo && (
                <div className="flex-shrink-0 hidden md:block">
                  <div className="w-20 h-20 rounded-2xl bg-white/95 backdrop-blur-sm p-2 shadow-2xl">
                    <img src={prog.logo} alt={prog.titre} className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* No image — clean header */
        <div className="mt-16 pt-12 pb-0 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <Link href="/programmes"
              className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-8 transition-colors group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Retour aux programmes
            </Link>
            <div className="flex items-start gap-3 mb-4 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-semibold border ${sc.light} ${sc.dark}`}>
                {sc.svg}{prog.sector}
              </span>
              {!open ? (
                <span className="text-sm px-3 py-1.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">Clôturé</span>
              ) : urgent ? (
                <span className="text-sm px-3 py-1.5 rounded-full font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700/40 animate-pulse">{days} jours restants</span>
              ) : (
                <span className="text-sm px-3 py-1.5 rounded-full font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Candidatures ouvertes
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">{prog.titre}</h1>
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT ══════════════════════════════════════ */}
      <section className="relative bg-white dark:bg-gray-900 pt-10">

        {/* Thin accent line */}
        <div className={`h-px w-full bg-gradient-to-r ${sc.bar} opacity-40`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">

          {/* Back link for image hero (shown under hero) */}
          {prog.image && (
            <div className="hidden">
              {/* Already shown on hero */}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* ── LEFT COLUMN ──────────────────────────────── */}
            <div className="lg:col-span-2 space-y-0">

              {/* Back nav for no-image variant already in hero */}
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-5 py-6 border-b border-gray-100 dark:border-gray-800 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span className="font-medium">{formatDate(prog.dateDebut)}</span>
                  <span className="text-gray-300 dark:text-gray-600 mx-1">—</span>
                  <span className="font-medium">{formatDate(prog.dateFin)}</span>
                </div>
                {prog.quota && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span className="font-medium">{prog.quota} startups</span>
                  </div>
                )}
              </div>

              {/* Sub-sectors chips */}
              {hasSubSectors && (
                <div className="mb-8">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] mb-3">Secteurs couverts</p>
                  <div className="flex flex-wrap gap-2">
                    {prog.subSectors.map((s, i) => (
                      <span key={i} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all hover:scale-105 cursor-default ${sc.light} ${sc.dark}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TABS ── */}
              <div className="flex gap-1 mb-8 bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-1.5 flex-wrap">
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex-1 min-w-max ${
                      activeTab === tab.key
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── TAB CONTENT ── */}
              <div className="min-h-[320px]">

                {/* Aperçu */}
                {activeTab === 'apercu' && (
                  <div className="animate-fade-in space-y-8">
                    <div className="space-y-4">
                      {prog.description?.split('\n\n').map((para, i) => (
                        <p key={i} className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">{para}</p>
                      ))}
                    </div>

                    {prog.benefits?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] mb-5">Ce que vous obtenez</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {prog.benefits.map((b, i) => (
                            <div key={i}
                              className="group flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                                {b.icon || BENEFIT_ICONS[i % BENEFIT_ICONS.length]}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{b.label}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{b.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Objectifs */}
                {activeTab === 'objectifs' && (
                  <div className="animate-fade-in space-y-3">
                    {prog.objectives?.length > 0 ? prog.objectives.map((obj, i) => (
                      <div key={i}
                        className="group flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">{obj}</p>
                      </div>
                    )) : <p className="text-gray-400 text-sm">Objectifs non définis.</p>}
                  </div>
                )}

                {/* Critères */}
                {activeTab === 'criteres' && (
                  <div className="animate-fade-in space-y-3">
                    {prog.criteria?.length > 0 ? prog.criteria.map((crit, i) => (
                      <div key={i}
                        className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 hover:border-emerald-100 dark:hover:border-emerald-800/50 hover:shadow-md transition-all group">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                          <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{crit}</span>
                      </div>
                    )) : <p className="text-gray-400 text-sm">Critères non définis.</p>}
                  </div>
                )}

                {/* Calendrier */}
                {activeTab === 'calendrier' && (
                  <div className="animate-fade-in">
                    {prog.phases?.length > 0 ? (
                      <div className="space-y-0">
                        {prog.phases.map((phase, i) => {
                          const isDone = phase.done || phase.statut === 'done';
                          const isActive = phase.statut === 'in-progress';
                          const isLast = i === prog.phases.length - 1;
                          return (
                            <div key={i} className="flex gap-5">
                              {/* Timeline column */}
                              <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold transition-all ${
                                  isDone
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : isActive
                                      ? `bg-gradient-to-br ${sc.icon} text-white shadow-lg`
                                      : 'bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-200 dark:border-gray-700'
                                }`}>
                                  {isDone ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                    </svg>
                                  ) : isActive ? (
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                  ) : String(i + 1)}
                                </div>
                                {!isLast && (
                                  <div className={`w-px flex-1 mt-1 mb-1 min-h-[2rem] ${isDone ? 'bg-emerald-200 dark:bg-emerald-800/50' : 'bg-gray-100 dark:bg-gray-800'}`} />
                                )}
                              </div>
                              {/* Content */}
                              <div className={`flex-1 pb-6 pt-1.5 ${!isDone && !isActive ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className={`font-semibold text-sm ${
                                    isDone ? 'text-emerald-600 dark:text-emerald-400'
                                    : isActive ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                  }`}>{phase.label}</p>
                                  {isActive && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${sc.bar} text-white font-medium`}>
                                      En cours
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{phase.date}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-gray-400 text-sm">Calendrier non défini.</p>}
                  </div>
                )}

                {/* Résultats */}
                {activeTab === 'resultats' && hasStats && (
                  <div className="animate-fade-in">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] mb-6">
                      Résultats — 1ère cohorte
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {statsData.map((s, i) => (
                        <div key={i}
                          className="group p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg transition-all text-center">
                          <div className={`text-4xl font-bold bg-gradient-to-r ${sc.bar} bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform inline-block`}>
                            {s.value}
                          </div>
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{s.label}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{s.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ══ GALERIE ═══════════════════════════════════ */}
              {hasGallery && (
                <div className="mt-16 pt-16 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] mb-1">Galerie</p>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Retour en images</h2>
                    </div>
                    <span className="text-sm text-gray-400">{prog.gallery.length} photos</span>
                  </div>

                  {/* Masonry-like grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {prog.gallery.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => openLightbox(img, i)}
                        className={`relative group overflow-hidden rounded-xl cursor-pointer bg-gray-100 dark:bg-gray-800 ${
                          i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                        }`}>
                        <img
                          src={img}
                          alt={`${prog.titre} — photo ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ TÉMOIGNAGES ═══════════════════════════════ */}
              {hasTestimonials && (
                <div className="mt-16 pt-16 border-t border-gray-100 dark:border-gray-800">
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] mb-1">Témoignages</p>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ce qu'ils en disent</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {prog.testimonials.map((t, i) => (
                      <div key={i}
                        className="group relative p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg transition-all overflow-hidden">
                        {/* Accent line top */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${sc.bar} opacity-60`} />
                        {/* Large quote mark */}
                        <div className={`absolute -top-2 -left-1 text-8xl font-serif leading-none bg-gradient-to-br ${sc.bar} bg-clip-text text-transparent opacity-10 select-none pointer-events-none`}>
                          &ldquo;
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-5 relative">
                          {t.text}
                        </p>
                        <div className="flex items-center gap-3">
                          {t.photo ? (
                            <img src={t.photo} alt={t.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {t.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{t.name}</p>
                            <p className={`text-xs font-medium truncate ${sc.light.split(' ')[1]}`}>{t.company}</p>
                          </div>
                          {t.logo && (
                            <img src={t.logo} alt={t.company} className="h-6 object-contain opacity-40 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ PARTENAIRES ═══════════════════════════════ */}
              {hasPartners && (
                <div className="mt-16 pt-16 border-t border-gray-100 dark:border-gray-800">
                  <div className="mb-8">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] mb-1">Partenaires</p>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ils nous accompagnent</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-8">
                    {prog.partners.map((p, i) => (
                      <div key={i} className="group">
                        {p.logo ? (
                          <img
                            src={p.logo}
                            alt={p.name}
                            className="h-9 object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-50 group-hover:opacity-100"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">{p.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ──────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">

                {/* CTA Card */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/60 shadow-lg">
                  {/* Accent top bar */}
                  <div className={`h-1 w-full bg-gradient-to-r ${sc.bar}`} />

                  {/* Logo if no hero image */}
                  {prog.logo && !prog.image && (
                    <div className="flex justify-center pt-6 pb-2">
                      <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-700 p-2">
                        <img src={prog.logo} alt={prog.titre} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    {/* Dates */}
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white flex-shrink-0`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Période</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                          {formatDate(prog.dateDebut)} → {formatDate(prog.dateFin)}
                        </p>
                      </div>
                    </div>

                    {/* Quota */}
                    {prog.quota && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white flex-shrink-0`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Places</p>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{prog.quota} startups</p>
                          </div>
                        </div>
                        <span className={`text-2xl font-bold bg-gradient-to-r ${sc.bar} bg-clip-text text-transparent`}>{prog.quota}</span>
                      </div>
                    )}

                    {/* Stats mini */}
                    {hasStats && (
                      <div className={`p-3.5 rounded-xl border ${sc.light} ${sc.dark}`}>
                        <p className="text-xs font-semibold opacity-60 mb-3 uppercase tracking-widest">1ère cohorte</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {prog.stats.startups && (
                            <div>
                              <div className="text-xl font-bold">{prog.stats.startups}</div>
                              <div className="text-xs opacity-60 leading-tight">startups</div>
                            </div>
                          )}
                          {prog.stats.sessions && (
                            <div>
                              <div className="text-xl font-bold">{prog.stats.sessions}</div>
                              <div className="text-xs opacity-60 leading-tight">sessions</div>
                            </div>
                          )}
                          {prog.stats.leveesFonds && (
                            <div>
                              <div className="text-xl font-bold">{prog.stats.leveesFonds}</div>
                              <div className="text-xs opacity-60 leading-tight">levées</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    {open ? (
                      <>
                        <Link href={applyUrl}>
                          <button className={`w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${sc.bar} hover:opacity-90 hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0`}>
                            Candidater à ce programme
                          </button>
                        </Link>
                        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2.5">
                          {prog.formulaire || 'Formulaire standard'} · Réponse sous 2 semaines
                        </p>
                      </>
                    ) : (
                      <div className="w-full py-3.5 text-center rounded-xl text-sm font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                        Programme clôturé
                      </div>
                    )}
                  </div>
                </div>

                {/* Jury */}
                {prog.jury?.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/60 p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] mb-4">Jury d'évaluation</p>
                    <div className="space-y-3">
                      {prog.jury.map((j, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sc.icon} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {j.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{j}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other programmes */}
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-5 bg-gray-50/50 dark:bg-gray-800/30">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Pas le bon programme ?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                    Consultez tous nos programmes ou soumettez une candidature spontanée.
                  </p>
                  <Link href="/programmes">
                    <button className="w-full py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                      Voir tous les programmes
                    </button>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BOTTOM CTA ════════════════════════════════════════ */}
      <section className="py-24 bg-gray-950 dark:bg-gray-950 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${sc.bar} opacity-10`} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ background: `${sc.accent}18` }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: `${sc.accent}12` }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white/70 tracking-widest uppercase">Places limitées</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Prêt à rejoindre<br />
            <span className={`bg-gradient-to-r ${sc.bar} bg-clip-text text-transparent`}>
              l'aventure ?
            </span>
          </h2>

          <p className="text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Rejoignez notre prochaine cohorte et bénéficiez d'un accompagnement sur-mesure pour votre startup.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {open ? (
              <Link href={applyUrl}>
                <button className={`px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${sc.bar} hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg`}>
                  Candidater à ce programme
                </button>
              </Link>
            ) : (
              <Link href="/programmes">
                <button className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 hover:-translate-y-0.5 transition-all">
                  Voir les autres programmes
                </button>
              </Link>
            )}
            <Link href="/contact">
              <button className="px-8 py-3.5 rounded-xl text-sm font-semibold text-white/70 border border-white/10 hover:border-white/20 hover:text-white hover:-translate-y-0.5 transition-all">
                Nous contacter
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ LIGHTBOX ══════════════════════════════════════════ */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}>
          {/* Close */}
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          {/* Prev */}
          {prog.gallery?.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navLightbox(-1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          {/* Next */}
          {prog.gallery?.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navLightbox(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          )}
          <img
            src={lightboxImg}
            alt="Galerie"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          {/* Counter */}
          {prog.gallery?.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
              {lightboxIdx + 1} / {prog.gallery.length}
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}