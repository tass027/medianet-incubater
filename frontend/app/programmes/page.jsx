// app/programmes/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import Link from 'next/link';

/* ─── Blobs (identiques page accueil) ───────────────────────────── */
const HERO_BLOBS = [
  { w: 420, h: 420, top: -12, left: 10,  color: 'rgba(96,165,250,0.22)'  },
  { w: 300, h: 300, top: 38,  left: -5,  color: 'rgba(167,243,208,0.25)' },
  { w: 240, h: 240, top: 60,  left: 50,  color: 'rgba(196,181,253,0.20)' },
  { w: 320, h: 320, top: -16, left: 68,  color: 'rgba(251,207,232,0.22)' },
  { w: 200, h: 200, top: 50,  left: 82,  color: 'rgba(253,230,138,0.18)' },
  { w: 260, h: 260, top: 20,  left: 35,  color: 'rgba(134,239,172,0.15)' },
];
const HERO_BLOBS_DARK = [
  { w: 420, h: 420, top: -12, left: 10,  color: 'rgba(96,165,250,0.07)'  },
  { w: 300, h: 300, top: 38,  left: -5,  color: 'rgba(167,243,208,0.06)' },
  { w: 240, h: 240, top: 60,  left: 50,  color: 'rgba(196,181,253,0.07)' },
  { w: 320, h: 320, top: -16, left: 68,  color: 'rgba(251,207,232,0.05)' },
  { w: 200, h: 200, top: 50,  left: 82,  color: 'rgba(253,230,138,0.05)' },
  { w: 260, h: 260, top: 20,  left: 35,  color: 'rgba(134,239,172,0.05)' },
];

/* ─── Sector config ─────────────────────────────────────────────── */
const SECTOR_CONFIG = {
  FinTech: {
    light: 'bg-blue-50 text-blue-700 border-blue-200',
    dark:  'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/40',
    icon:  'from-blue-500 to-blue-700',
    bar:   'from-blue-500 to-blue-600',
    glow:  'group-hover:shadow-blue-500/15',
    svg: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>),
  },
  EdTech: {
    light: 'bg-violet-50 text-violet-700 border-violet-200',
    dark:  'dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/40',
    icon:  'from-violet-500 to-violet-700',
    bar:   'from-violet-500 to-violet-600',
    glow:  'group-hover:shadow-violet-500/15',
    svg: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>),
  },
  AgriTech: {
    light: 'bg-amber-50 text-amber-700 border-amber-200',
    dark:  'dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40',
    icon:  'from-amber-500 to-amber-700',
    bar:   'from-amber-500 to-amber-600',
    glow:  'group-hover:shadow-amber-500/15',
    svg: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>),
  },
  CleanTech: {
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dark:  'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40',
    icon:  'from-emerald-500 to-teal-600',
    bar:   'from-emerald-500 to-teal-500',
    glow:  'group-hover:shadow-emerald-500/15',
    svg: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
  },
  HealthTech: {
    light: 'bg-rose-50 text-rose-700 border-rose-200',
    dark:  'dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/40',
    icon:  'from-rose-500 to-pink-600',
    bar:   'from-rose-500 to-pink-500',
    glow:  'group-hover:shadow-rose-500/15',
    svg: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>),
  },
  'AI/ML': {
    light: 'bg-pink-50 text-pink-700 border-pink-200',
    dark:  'dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700/40',
    icon:  'from-pink-500 to-rose-600',
    bar:   'from-pink-500 to-rose-500',
    glow:  'group-hover:shadow-pink-500/15',
    svg: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/></svg>),
  },
  FoodTech: {
    light: 'bg-lime-50 text-lime-700 border-lime-200',
    dark:  'dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-700/40',
    icon:  'from-lime-500 to-green-600',
    bar:   'from-lime-500 to-green-500',
    glow:  'group-hover:shadow-lime-500/15',
    svg: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>),
  },
  'Tous secteurs': {
    light: 'bg-gray-100 text-gray-600 border-gray-200',
    dark:  'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    icon:  'from-gray-500 to-gray-700',
    bar:   'from-gray-400 to-gray-500',
    glow:  'group-hover:shadow-gray-500/10',
    svg: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>),
  },
};

/* ─── Sector colors for the hero card rows ──────────────────────── */
const HERO_ROW_COLORS = {
  light: {
    FinTech:        { bg: '#EEF2FF', icon: '#E0E7FF', text: '#6366F1' },
    EdTech:         { bg: '#F5F3FF', icon: '#EDE9FE', text: '#8B5CF6' },
    CleanTech:      { bg: '#ECFDF5', icon: '#D1FAE5', text: '#10B981' },
    'AI/ML':        { bg: '#FFF0F3', icon: '#FCE7F3', text: '#EC4899' },
    FoodTech:       { bg: '#F7FEE7', icon: '#ECFCCB', text: '#65a30d' },
    AgriTech:       { bg: '#FFFBEB', icon: '#FEF3C7', text: '#D97706' },
    HealthTech:     { bg: '#FFF1F2', icon: '#FFE4E6', text: '#E11D48' },
    'Tous secteurs':{ bg: '#F8FAFC', icon: '#F1F5F9', text: '#64748B' },
  },
  dark: {
    FinTech:        { bg: '#1e1b4b', icon: '#312e81', text: '#818CF8' },
    EdTech:         { bg: '#2e1065', icon: '#4c1d95', text: '#a78bfa' },
    CleanTech:      { bg: '#064e3b', icon: '#065f46', text: '#34d399' },
    'AI/ML':        { bg: '#500724', icon: '#831843', text: '#f472b6' },
    FoodTech:       { bg: '#1a2e05', icon: '#365314', text: '#a3e635' },
    AgriTech:       { bg: '#431407', icon: '#7c2d12', text: '#fbbf24' },
    HealthTech:     { bg: '#4c0519', icon: '#9f1239', text: '#fb7185' },
    'Tous secteurs':{ bg: '#1e293b', icon: '#334155', text: '#94a3b8' },
  },
};

const getSector      = (s) => SECTOR_CONFIG[s] || SECTOR_CONFIG['Tous secteurs'];
const SECTORS_FILTER = ['Tous', 'FinTech', 'EdTech', 'AgriTech', 'CleanTech', 'HealthTech', 'AI/ML', 'FoodTech'];
const formatDate     = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const daysLeft       = (d) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
const candidatureUrl = (id, name) => `/login?redirect=programme&progId=${id}&progName=${encodeURIComponent(name)}`;
const spontaneUrl    = () => `/login?redirect=spontane`;

/* ─── Mock data — NOTE: all string values use double quotes to avoid apostrophe issues ─── */
export const MOCK_PROGRAMMES = [
  {
    _id: '1', slug: 'fintech-2026',
    titre: 'Programme FinTech 2026',
    description: "Accélération de startups dans le domaine de la finance digitale, paiements mobiles et inclusion financière.",
    sector: 'FinTech', status: 'published',
    dateDebut: '2026-04-01', dateFin: '2026-06-30', quota: 10,
    image: '/programmes/fintech-hero.jpg', logo: '/programmes/fintech-logo.jpg',
    jury: ['Karim Ghorbel', 'Omar Trabelsi'],
    subSectors: ['Néobanques', 'Paiements digitaux', 'Crédit alternatif', 'Assurtech'],
    objectives: [
      "Accompagner 10 startups FinTech à fort potentiel",
      "Faciliter l'accès au financement (200K – 2M DT)",
      "Développer le réseau avec les banques partenaires",
    ],
    phases: [
      { label: 'Dépôt des candidatures', date: '01 Fév — 31 Mar 2026', done: true,  statut: 'done'        },
      { label: 'Sélection & entretiens', date: '01 — 15 Avr 2026',     done: false, statut: 'in-progress' },
      { label: 'Démarrage programme',    date: '01 Mai 2026',           done: false, statut: 'pending'     },
      { label: 'Demo Day FinTech',       date: '30 Jun 2026',           done: false, statut: 'pending'     },
    ],
    benefits: [
      { label: 'Startup Village',      desc: "Accès aux espaces co-working premium (2500m²) à Menzah, Tunis" },
      { label: 'Mentor dédié',         desc: "10h/mois avec un expert FinTech senior pendant toute la durée" },
      { label: 'Réseau investisseurs', desc: "Mise en relation directe avec 45+ investisseurs partenaires" },
    ],
    stats: { startups: 8, sessions: 28, leveesFonds: 3 },
    testimonials: [
      { name: 'Ines Bouaziz', company: 'PayLink TN', photo: '/programmes/testimonial-ines.jpg', text: "Le programme FinTech de Medianet nous a permis d'accélérer notre roadmap de 6 mois." },
    ],
    gallery: ['/programmes/fintech-gallery-1.jpg', '/programmes/fintech-gallery-2.jpg'],
    partners: [{ name: 'BIAT', logo: '/programmes/partner-biat.png' }],
  },
  {
    _id: '2', slug: 'edtech-2026',
    titre: 'Programme EdTech 2026',
    description: "Programme dédié aux solutions innovantes dans l'éducation, formation en ligne et compétences numériques pour l'Afrique.",
    sector: 'EdTech', status: 'published',
    dateDebut: '2026-04-15', dateFin: '2026-07-15', quota: 8,
    image: '/programmes/edtech-hero.jpg', logo: '/programmes/edtech-logo.jpg',
    jury: ['Sonia Mrad', 'Hatem Zouari'],
    subSectors: ['E-learning', 'Formation pro', 'Enseignement supérieur', 'Gamification'],
    objectives: [
      "Accompagner 8 startups EdTech à impact pédagogique mesurable",
      "Déployer les solutions dans 3+ établissements partenaires",
    ],
    phases: [
      { label: 'Dépôt des candidatures', date: '15 Fév — 15 Avr 2026', done: false, statut: 'in-progress' },
      { label: 'Sélection & jury',       date: '15 — 30 Avr 2026',     done: false, statut: 'pending'     },
      { label: 'Demo Day EdTech',        date: '15 Jul 2026',           done: false, statut: 'pending'     },
    ],
    benefits: [
      { label: 'Startup Village',      desc: "Accès aux espaces de travail premium (2500m²)" },
      { label: 'Mentoring expert',     desc: "10h/mois de sessions 1-to-1 avec des experts" },
      { label: "Fonds d'amorçage",     desc: "Accès à des subventions Erasmus+ et fonds AFD" },
    ],
    stats: { startups: 6, sessions: 24, leveesFonds: 2 },
    testimonials: [
      { name: 'Youssef Mansouri', company: 'LearnIQ', photo: '/programmes/testimonial-youssef.jpg', text: "L'accès aux établissements partenaires a transformé notre approche." },
    ],
    gallery: ['/programmes/edtech-gallery-1.jpg', '/programmes/edtech-gallery-2.jpg'],
    partners: [{ name: 'AFD', logo: '/programmes/partner-afd.png' }],
  },
  {
    _id: '3', slug: 'cleantech-2026',
    titre: 'Programme CleanTech 2026',
    description: "Accélération de solutions durables dans l'énergie renouvelable, la gestion des ressources et les technologies vertes adaptées au contexte nord-africain.",
    sector: 'CleanTech', status: 'published',
    dateDebut: '2026-06-01', dateFin: '2026-09-30', quota: 5,
    image: '/programmes/cleantech-hero.jpg',
    jury: ['Yassine Ben Salah', 'Emna Sfar'],
    subSectors: ['Énergie solaire', 'Gestion des eaux', 'Économie circulaire', 'Mobilité durable'],
    objectives: [
      "Accélérer 5 startups CleanTech à impact environnemental prouvé",
      "Déployer des projets pilotes avec STEG et SONEDE",
    ],
    phases: [
      { label: 'Publication & candidatures', date: '01 — 31 Mai 2026', done: false, statut: 'pending' },
      { label: 'Demo Day CleanTech',         date: '30 Sep 2026',       done: false, statut: 'pending' },
    ],
    benefits: [
      { label: 'Pilotes STEG/SONEDE', desc: "Accès aux programmes pilotes de STEG et SONEDE" },
      { label: 'Finance verte',       desc: "Accès aux fonds Proparco, AFD, BEI pour projets CleanTech" },
    ],
    stats: null, testimonials: [], gallery: [],
    partners: [{ name: 'STEG', logo: '/programmes/partner-steg.png' }],
  },
  {
    _id: '4', slug: 'candidatures-spontanees',
    titre: 'Candidatures Spontanées',
    description: "Vous avez un projet innovant hors programme actif ? Soumettez votre dossier. Notre équipe examine chaque candidature et vous recontacte sous 48h.",
    sector: 'Tous secteurs', status: 'published',
    dateDebut: '2026-01-01', dateFin: '2026-12-31', quota: null,
    jury: [], subSectors: ['HealthTech', 'LegalTech', 'Logistique', 'SaaS B2B', 'Impact social'],
    objectives: [], phases: [],
    benefits: [
      { label: 'Réponse 48h',            desc: "Engagement de réponse personnalisée sous 48 heures ouvrées" },
      { label: 'Orientation sur mesure', desc: "Mise en relation avec le bon mentor ou programme selon votre projet" },
    ],
    stats: null, testimonials: [], gallery: [], partners: [],
  },
  {
    _id: '5', slug: 'healthtech-2025',
    titre: 'Programme HealthTech 2025',
    description: "Santé numérique, télémédecine et dispositifs médicaux connectés — cohorte 2025 clôturée avec succès (8 startups, 3.2M DT levés).",
    sector: 'HealthTech', status: 'closed',
    dateDebut: '2025-06-01', dateFin: '2025-09-30', quota: 8,
    image: '/programmes/healthtech-hero.jpg',
    jury: ['Amira Hamdani'], subSectors: ['Télémédecine', 'Dispositifs connectés'],
    objectives: [], phases: [], benefits: [],
    stats: { startups: 8, sessions: 32, leveesFonds: 4 },
    testimonials: [], gallery: [], partners: [],
  },
  {
    _id: '6', slug: 'foodstart-2',
    titre: 'FoodStart 2ème Édition',
    description: "Programme d'incubation FoodTech de 6 mois — Agritech, Food services, Livraison, Science de l'alimentation et Consumer tech.",
    sector: 'FoodTech', status: 'published',
    dateDebut: '2025-09-01', dateFin: '2026-05-24', quota: 8,
    image: '/programmes/foodstart-hero.jpg', logo: '/programmes/foodstart-logo.jpg',
    jury: ['Experts FoodStart'],
    subSectors: ['Agritech', 'Food services', 'Livraison', 'Consumer tech'],
    objectives: [
      "8 startups FoodTech accompagnées sur 6 mois",
      "Demo Day public le 24 Mai 2026",
    ],
    phases: [
      { label: 'Sourcing',              date: 'Septembre 2025',             done: true,  statut: 'done'        },
      { label: 'Pitch day',             date: 'Novembre 2025',              done: true,  statut: 'done'        },
      { label: 'Accompagnement 6 mois', date: 'Décembre 2025 — Avril 2026', done: false, statut: 'in-progress' },
      { label: 'Demo Day FoodStart',    date: '24 Mai 2026',                done: false, statut: 'pending'     },
    ],
    benefits: [
      { label: 'Plateformes de test',    desc: "Accès à des laboratoires culinaires et plus de 350 clients bêta" },
      { label: 'Startup Village',        desc: "2500m² dédiés à l'innovation — co-working, salles de réunion" },
      { label: 'Programme de mentoring', desc: "10h de sessions 1-to-1 par mois avec des experts sectoriels" },
    ],
    stats: { startups: 8, sessions: 22, leveesFonds: 2 },
    testimonials: [
      { name: 'Achref Mrabet',  company: 'UKLA',     photo: '/programmes/testimonial-achref.jpg', text: "The biggest advantage of being in the Medianet incubator is having direct access to people with 25 years of experience." },
      { name: 'Anis Ben Ghali', company: 'CHITELIX', photo: '/programmes/testimonial-anis.jpg',   text: "Le programme FoodStart nous a permis de labéliser notre startup et d'accélérer notre levée de fond." },
    ],
    gallery: ['/programmes/foodstart-gallery-1.jpg', '/programmes/foodstart-gallery-2.jpg', '/programmes/foodstart-gallery-3.jpg'],
    partners: [{ name: 'FFBD Consulting', logo: '/programmes/partner-ffbd.png' }],
  },
];

/* ─── Stat counter ──────────────────────────────────────────────── */
function StatCard({ value, label, colorStyle }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const num = parseInt(value) || 0;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = Math.ceil(num / 40);
      const timer = setInterval(() => {
        start += step;
        if (start >= num) { setCount(num); clearInterval(timer); }
        else setCount(start);
      }, 30);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [num]);

  const display = typeof value === 'string' && value.includes('M')
    ? `${count}M DT`
    : `${count}${typeof value === 'string' && value.includes('+') ? '+' : ''}`;

  return (
    <div ref={ref} className="group text-center">
      <div className="text-3xl md:text-4xl font-bold mb-1 group-hover:scale-110 transition-transform duration-300" style={colorStyle}>
        {display}
      </div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
    </div>
  );
}

/* ─── Programme Card ────────────────────────────────────────────── */
function ProgrammeCard({ prog, index, closed = false }) {
  const sc      = getSector(prog.sector);
  const days    = daysLeft(prog.dateFin);
  const urgent  = days <= 14 && days > 0;
  const hasStats = prog.stats && Object.values(prog.stats).some(v => v != null);

  return (
    <div className="group relative flex flex-col" style={{ animationDelay: `${index * 0.07}s` }}>
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-r ${sc.bar} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm`} />
      <div className={`relative flex flex-col h-full rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl ${sc.glow} ${closed ? 'opacity-65' : ''}`}>

        {prog.image ? (
          <div className="relative h-44 overflow-hidden flex-shrink-0">
            <img src={prog.image} alt={prog.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className={`absolute inset-0 bg-gradient-to-br ${sc.bar} opacity-20`} />
            {prog.logo && (
              <div className="absolute bottom-3 left-4 w-12 h-12 rounded-xl bg-white/95 p-1.5 shadow-xl">
                <img src={prog.logo} alt="" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              {closed ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white/80">Clôturé</span>
              ) : urgent ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white animate-pulse">{days}j restants</span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/90 text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />Ouvert
                </span>
              )}
            </div>
            <div className="absolute bottom-3 right-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${sc.light} ${sc.dark}`}>{prog.sector}</span>
            </div>
          </div>
        ) : (
          <div className={`relative h-24 flex-shrink-0 bg-gradient-to-br ${sc.icon} flex items-center px-6 overflow-hidden`}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            <div className="relative flex items-center justify-between w-full">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">{sc.svg}</div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">{prog.sector}</span>
                {!closed && <span className="text-xs text-white/80 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />{urgent ? `${days}j` : 'Ouvert'}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {prog.titre}
            </h3>
            {prog.quota && <span className="flex-shrink-0 text-xs font-semibold text-gray-400 mt-1">{prog.quota} places</span>}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2 flex-1">
            {prog.description?.split('\n\n')[0]}
          </p>

          {prog.subSectors?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {prog.subSectors.slice(0, 3).map((s, i) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sc.light} ${sc.dark}`}>{s}</span>
              ))}
              {prog.subSectors.length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 border border-gray-200 dark:border-gray-600">+{prog.subSectors.length - 3}</span>
              )}
            </div>
          )}

          {prog.objectives?.length > 0 && (
            <div className="mb-4 space-y-1.5">
              {prog.objectives.slice(0, 2).map((obj, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          )}

          {hasStats && (
            <div className={`flex gap-4 p-3 rounded-xl mb-4 border ${sc.light} ${sc.dark}`}>
              {prog.stats.startups && <div className="text-center flex-1"><div className="text-lg font-bold">{prog.stats.startups}</div><div className="text-xs opacity-60">startups</div></div>}
              {prog.stats.sessions && <div className="text-center flex-1 border-l border-current/20"><div className="text-lg font-bold">{prog.stats.sessions}</div><div className="text-xs opacity-60">sessions</div></div>}
              {prog.stats.leveesFonds && <div className="text-center flex-1 border-l border-current/20"><div className="text-lg font-bold">{prog.stats.leveesFonds}</div><div className="text-xs opacity-60">levées</div></div>}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span>{formatDate(prog.dateDebut)} — {formatDate(prog.dateFin)}</span>
          </div>

          {prog.jury?.length > 0 && (
            <div className="flex items-center gap-2 mb-5">
              <div className="flex -space-x-2">
                {prog.jury.slice(0, 3).map((j, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full bg-gradient-to-br ${sc.icon} border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold`}>
                    {j.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-400">Jury</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between mt-auto">
            <Link href={`/programmes/${prog._id}`}>
              <button className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 group/link">
                Voir les détails
                <svg className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </Link>
            {!closed && (
              <Link href={prog.titre?.includes('Spontan') ? spontaneUrl() : candidatureUrl(prog._id, prog.titre)}>
                <button className={`px-4 py-2 text-sm font-bold text-white bg-gradient-to-r ${sc.bar} rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all`}>
                  Candidater
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [sector, setSector]         = useState('Tous');
  const [showClosed, setShowClosed] = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [isDark, setIsDark]         = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/programmes/public');
        if (!res.ok) throw new Error();
        const d = await res.json();
        setProgrammes(d.programmes?.length ? d.programmes : MOCK_PROGRAMMES);
      } catch {
        setProgrammes(MOCK_PROGRAMMES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = programmes.filter(p => {
    const mS = sector === 'Tous' || p.sector === sector;
    const mC = showClosed ? true : p.status !== 'closed';
    return mS && mC;
  });
  const active   = filtered.filter(p => p.status !== 'closed');
  const closed   = filtered.filter(p => p.status === 'closed');
  const spontane = programmes.find(p => p.titre?.includes('Spontan'));
  const nbActive = programmes.filter(p => p.status === 'published' && !p.titre?.includes('Spontan')).length;
  const blobs    = isDark ? HERO_BLOBS_DARK : HERO_BLOBS;
  const rowColors = isDark ? HERO_ROW_COLORS.dark : HERO_ROW_COLORS.light;

  if (!mounted) return null;

  return (
    <div className="relative bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      {/* ══ HERO — fond clair avec blobs identiques à la home ════ */}
      <section
        className="relative min-h-[88vh] flex items-center pt-20 overflow-hidden transition-colors duration-300"
        style={{ background: isDark ? '#0d1b2e' : '#EFF6FF' }}
      >
        {/* Blobs animés */}
        {blobs.map((b, i) => (
          <div key={i} style={{
            position: 'absolute', width: b.w, height: b.h,
            top: `${b.top}%`, left: `${b.left}%`,
            borderRadius: '50%', background: b.color, pointerEvents: 'none',
          }} />
        ))}

        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" style={{ zIndex: 2 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* ── Left ── */}
            <div>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 20px', borderRadius: 999, marginBottom: 32,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'}`,
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.7)' : '#1D4ED8' }}>
                  {nbActive} programme{nbActive > 1 ? 's' : ''} actif{nbActive > 1 ? 's' : ''} — Candidatures ouvertes
                </span>
              </div>

              {/* Titre */}
              <h1 style={{
                fontSize: 'clamp(44px, 5.5vw, 72px)', fontWeight: 900,
                lineHeight: 1.07, letterSpacing: '-1.5px', marginBottom: 24,
                color: isDark ? '#f1f5f9' : '#0f172a',
              }}>
                Nos <span style={{ color: '#1D77E6' }}>Programmes</span>{'\n'}d&apos;Incubation
              </h1>

              {/* Description */}
              <p style={{ fontSize: 17, lineHeight: 1.75, color: isDark ? 'rgba(255,255,255,0.5)' : '#475569', maxWidth: 480, marginBottom: 40 }}>
                Medianet Incubator accompagne les startups tunisiennes et africaines les plus prometteuses à travers des programmes sectoriels sur-mesure.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 56 }}>
                <Link href={spontaneUrl()}>
                  <button style={{
                    padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                    color: '#fff', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    boxShadow: '0 4px 20px rgba(245,158,11,.35)',
                    transition: 'transform .18s',
                  }}>
                    Candidater Maintenant
                  </button>
                </Link>
                <a href="#programmes">
                  <button style={{
                    padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', transition: 'transform .18s',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    backdropFilter: 'blur(8px)',
                  }}>
                    Découvrir les Programmes
                  </button>
                </a>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, paddingTop: 24, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                <StatCard value="120+" label="Startups incubées"  colorStyle={{ color: isDark ? '#60a5fa' : '#1D77E6' }} />
                <StatCard value="45+"  label="Investisseurs"      colorStyle={{ color: isDark ? '#fbbf24' : '#D97706' }} />
                <StatCard value="24M DT" label="Levées de fonds"  colorStyle={{ color: isDark ? '#34d399' : '#059669' }} />
              </div>
            </div>

            {/* ── Right — card glassmorphism ── */}
            <div className="relative">
              <div style={{
                borderRadius: 24, overflow: 'hidden',
                background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.92)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)'}`,
                boxShadow: isDark
                  ? '0 4px 6px rgba(0,0,0,.3), 0 24px 64px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)'
                  : '0 4px 6px rgba(0,0,0,.04), 0 24px 64px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.9)',
                backdropFilter: 'blur(20px)',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px 16px',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.3px' }}>Programmes Actifs</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#16A34A' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                    En Direct
                  </span>
                </div>

                {/* Liste programmes */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(loading ? MOCK_PROGRAMMES : programmes)
                    .filter(p => p.status === 'published' && !p.titre?.includes('Spontan'))
                    .slice(0, 5)
                    .map((p) => {
                      const sc = getSector(p.sector);
                      const dl = daysLeft(p.dateFin);
                      const c  = rowColors[p.sector] || rowColors['Tous secteurs'];
                      return (
                        <Link key={p._id} href={`/programmes/${p._id}`}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                            background: c.bg, textDecoration: 'none',
                            border: '1px solid rgba(0,0,0,0.04)',
                            transition: 'transform .15s, box-shadow .15s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                          >
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ color: c.text }}><div style={{ transform: 'scale(0.85)' }}>{sc.svg}</div></span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</p>
                              <p style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b', margin: 0, fontWeight: 500 }}>{p.quota ? `${p.quota} places` : 'Ouvert'}</p>
                            </div>
                            {dl > 0 && dl <= 30 ? (
                              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0, background: dl <= 14 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: dl <= 14 ? '#dc2626' : '#d97706' }}>{dl}j</span>
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>Ouvert</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                </div>

                {/* Footer */}
                <div style={{ padding: '0 16px 20px' }}>
                  <a href="#programmes">
                    <button style={{
                      width: '100%', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                      color: '#fff', border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #06B6D4 0%, #F59E0B 100%)',
                      boxShadow: '0 4px 18px rgba(6,182,212,.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'transform .18s',
                    }}>
                      Voir tous les programmes
                      <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div style={{ width: 24, height: 38, border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, borderRadius: 12, display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <div style={{ width: 3, height: 8, borderRadius: 2, background: '#1D77E6' }} />
          </div>
        </div>
      </section>

      {/* ══ STICKY FILTERS ═══════════════════════════════════════ */}
      <div id="programmes" className="sticky top-16 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex flex-wrap gap-1.5">
              {SECTORS_FILTER.map(s => (
                <button key={s} onClick={() => setSector(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${sector === s ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-gray-400">Programmes clôturés</span>
              <button onClick={() => setShowClosed(!showClosed)}
                className={`relative rounded-full transition-colors duration-200 ${showClosed ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                style={{ width: 40, height: 22 }}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-gray-900 rounded-full shadow-sm transition-transform duration-200 ${showClosed ? 'translate-x-[18px]' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ PROGRAMMES GRID ══════════════════════════════════════ */}
      <section className="py-16 bg-gray-50/50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1">{sector === 'Tous' ? 'Tous les programmes' : `Secteur ${sector}`}</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{active.length} programme{active.length > 1 ? 's' : ''} disponible{active.length > 1 ? 's' : ''}</h2>
            </div>
            {active.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Candidatures ouvertes
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700 h-80" />)}
            </div>
          ) : active.length === 0 ? (
            <div className="text-center py-24">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucun programme dans ce secteur</h3>
              <p className="text-gray-500 mb-6">Consultez tous les programmes ou soumettez une candidature spontanée</p>
              <button onClick={() => setSector('Tous')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Voir tous les programmes</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {active.map((prog, idx) => <ProgrammeCard key={prog._id} prog={prog} index={idx} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══ SPONTANE BANNER ══════════════════════════════════════ */}
      {spontane && (
        <section className="py-10 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl p-10 md:p-12" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 60%, #0a1628 100%)' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 mb-5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-white/70 tracking-widest uppercase">Candidature permanente</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Votre projet ne rentre dans aucun programme ?</h2>
                  <p className="text-white/50 max-w-md leading-relaxed">Soumettez votre dossier — notre équipe examine chaque candidature personnellement sous 48 heures.</p>
                </div>
                <div className="flex-shrink-0 text-center">
                  <Link href={spontaneUrl()}>
                    <button style={{ padding: '14px 32px', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 18px rgba(245,158,11,.3)' }}>
                      Candidature Spontanée
                    </button>
                  </Link>
                  <p className="text-white/30 text-xs mt-3">Réponse garantie sous 48h</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ CLOSED ════════════════════════════════════════════════ */}
      {showClosed && closed.length > 0 && (
        <section className="pb-16 bg-gray-50/50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              <h2 className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase">Programmes clôturés</h2>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {closed.map((prog, idx) => <ProgrammeCard key={prog._id} prog={prog} index={idx} closed />)}
            </div>
          </div>
        </section>
      )}

      {/* ══ BOTTOM CTA ════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 60%, #0a1628 100%)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white/70">Places Limitées</span>
          </div>
          <h2 style={{ fontSize: 'clamp(40px,5vw,64px)', fontWeight: 900, color: '#fff', marginBottom: 24, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Prêt à Rejoindre<br />
            <span style={{ color: '#F59E0B' }}>L&apos;Aventure ?</span>
          </h2>
          <p className="text-lg text-white/40 mb-12 max-w-xl mx-auto leading-relaxed">
            Rejoignez notre prochaine cohorte et bénéficiez d&apos;un accompagnement sur-mesure pour transformer votre startup.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={spontaneUrl()}>
              <button style={{ padding: '16px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 24px rgba(245,158,11,.4)' }}>
                Candidater Maintenant
              </button>
            </Link>
            <Link href="/contact">
              <button style={{ padding: '16px 40px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.6)', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>
                Nous Contacter
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}