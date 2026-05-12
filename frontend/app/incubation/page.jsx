// app/incubation/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

/* ─── Blobs (identiques home & programmes) ─────────────────────── */
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

/* ─── Data ─────────────────────────────────────────────────────── */
const PHASES = [
  {
    num: '01', title: 'Candidature & Sélection', duration: '2–4 semaines',
    grad: ['#3B82F6', '#1D4ED8'], accentBg: 'rgba(59,130,246,0.08)',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    description: "Déposez votre dossier via notre formulaire en ligne. Notre comité de sélection évalue chaque candidature selon des critères précis : innovation, marché, équipe et viabilité.",
    actions: ['Remplissage du formulaire de candidature en ligne', 'Soumission du pitch deck et business plan', 'Entretien de présélection (30 min)', 'Présentation finale devant le jury', 'Notification de décision sous 2 semaines'],
    deliverable: "Lettre d'admission ou feedback détaillé",
    tags: [],
  },
  {
    num: '02', title: 'Diagnostic & Cadrage', duration: '2 semaines',
    grad: ['#8B5CF6', '#6D28D9'], accentBg: 'rgba(139,92,246,0.08)',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    ),
    description: "Analyse approfondie de votre startup : modèle économique, équipe, marché, technologie et besoins prioritaires pour définir un plan d'accompagnement personnalisé.",
    actions: ["Audit de l'équipe et des compétences", 'Analyse du modèle économique (BMC)', 'Étude de marché et positionnement', 'Identification des blocages critiques', "Définition du plan d'accompagnement personnalisé"],
    deliverable: "Business Model Canvas validé + roadmap personnalisée",
    tags: ['Mentors'],
  },
  {
    num: '03', title: 'Accompagnement Intensif', duration: '3–6 mois',
    grad: ['#1D77E6', '#0c2d6b'], accentBg: 'rgba(29,119,230,0.08)',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    description: "Le coeur du programme. Sessions hebdomadaires avec mentors, ateliers collectifs et accès complet aux ressources Medianet Group et au Startup Village.",
    actions: ['Sessions hebdomadaires avec mentor référent (10h/mois)', 'Ateliers collectifs : pitch, finance, legal, growth', 'Accès aux locaux Startup Village (co-working premium 2500m²)', 'Support technique, juridique et branding', 'Networking avec la communauté Medianet et alumni'],
    deliverable: "MVP validé, traction mesurable, KPIs définis",
    tags: ['Mentors'],
  },
  {
    num: '04', title: 'Préparation au Financement', duration: '4–6 semaines',
    grad: ['#F59E0B', '#B45309'], accentBg: 'rgba(245,158,11,0.08)',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
      </svg>
    ),
    description: "Préparation intensive à la levée de fonds. Connexion avec notre réseau de 45+ investisseurs selon le secteur et le stade de votre startup.",
    actions: ['Structuration du dossier financier (data room)', 'Pitch deck investisseur optimisé', 'Sessions de simulation avec business angels', 'Introduction warm aux investisseurs ciblés', 'Négociation des termes (term sheet)'],
    deliverable: "Dossier investisseur complet + warm introductions",
    tags: ['Mentors', 'Investisseurs'],
  },
  {
    num: '05', title: 'Demo Day & Alumni', duration: '1 journée',
    grad: ['#10B981', '#047857'], accentBg: 'rgba(16,185,129,0.08)',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
      </svg>
    ),
    description: "Présentation publique devant 200+ investisseurs, partenaires et médias. L'événement le plus important de votre parcours — votre lancement officiel.",
    actions: ['Présentation de 5 minutes devant les investisseurs', 'Session de networking post-demo (2h)', 'Couverture médiatique (presse, réseaux sociaux, TV)', "Intégration à la communauté alumni Medianet", 'Suivi post-programme (6 mois)'],
    deliverable: "Visibilité maximale + deals potentiels + réseau alumni",
    tags: ['Mentors', 'Investisseurs'],
  },
];

const BENEFITS = [
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>),
    title: "Startup Village 2500m²",
    desc: "Accès au co-working haut de gamme de Medianet — salles de réunion équipées, fibre optique, laboratoires culinaires et espaces de créativité.",
    color: '#1D77E6', stat: '2500m²', statLabel: "d'espace",
    img: '/incubation/startup-village.jpg',
  },
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>),
    title: "Mentor Dédié",
    desc: "Un expert sectoriel attitré disponible 10h/mois — coach produit, mentor commercial, expert technique ou juriste selon vos besoins.",
    color: '#8b5cf6', stat: '10h', statLabel: 'par mois',
    img: '/incubation/mentoring.jpg',
  },
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>),
    title: "Formation & Ateliers",
    desc: "22+ ateliers sur mesure : pitch, finance, juridique, croissance, product management, branding et préparation à la levée de fonds.",
    color: '#F59E0B', stat: '22+', statLabel: 'formations',
    img: '/incubation/formations.jpg',
  },
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>),
    title: "Accès au Financement",
    desc: "Mise en relation directe avec 45+ investisseurs. Tickets de 10K à 5M DT. Introductions warm auprès d'Africinvest, BFPME, Smart Capital et Business Angels.",
    color: '#10b981', stat: '45+', statLabel: 'investisseurs',
    img: '/incubation/financement.jpg',
  },
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
    title: "Réseau International",
    desc: "Accès au réseau Africinvest et partenaires africains pour une expansion continentale. Connexion aux marchés du Maghreb, Afrique subsaharienne et Europe.",
    color: '#06B6D4', stat: '3', statLabel: 'continents',
    img: '/incubation/reseau.jpg',
  },
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>),
    title: "Visibilité & Demo Day",
    desc: "Communication via les canaux Medianet Group : digital, TV, presse. Demo Day public médiatisé devant 200+ investisseurs, partenaires et journalistes.",
    color: '#EC4899', stat: '200+', statLabel: 'présents au Demo Day',
    img: '/incubation/demoday.jpg',
  },
];

const STARTUPS = [
  {
    name: 'Lightresa',
    sector: 'HotelTech',
    desc: "Transformation digitale du secteur hôtelier — CRS, booking engine et système cashless.",
    stats: ['+20 hôtels', '+7000 bookings/mois', '+500 partenaires'],
    color: '#1D77E6',
    logo: '/startups/lightresa-logo.png',
    img: '/startups/lightresa.jpg',
  },
  {
    name: 'Club Privilèges',
    sector: 'Loyalty Tech',
    desc: "Application de remises permanentes auprès de 500+ partenaires, disponible dans 3 pays.",
    stats: ['+500 partenaires', '+80K utilisateurs', '7 opérateurs télécom'],
    color: '#8B5CF6',
    logo: '/startups/club-privileges-logo.png',
    img: '/startups/club-privileges.jpg',
  },
  {
    name: 'Bmoov / Parkimap',
    sector: 'MobilityTech',
    desc: "1ère application de parking en Tunisie — +100K transactions dans 3 pays.",
    stats: ['+100 parkings', '+100K transactions', '3 pays'],
    color: '#10B981',
    logo: '/startups/parkimap-logo.png',
    img: '/startups/parkimap.jpg',
  },
  {
    name: 'Cochef',
    sector: 'FoodTech',
    desc: "L'incubateur culinaire — accompagnement de chefs entrepreneurs avec 5K commandes en 3 mois.",
    stats: ['5K commandes', '45K TND turnover', '3 mois'],
    color: '#F59E0B',
    logo: '/startups/cochef-logo.png',
    img: '/startups/cochef.jpg',
  },
  {
    name: 'Poslik',
    sector: 'RetailTech',
    desc: "Caisse connectée avec QR code, KDS et PDAs temps réel pour une expérience digitale unique.",
    stats: ['+40 clients', '+1K transactions/jour'],
    color: '#EC4899',
    logo: '/startups/poslik-logo.png',
    img: '/startups/poslik.jpg',
  },
  {
    name: 'FoodStart Cohorte 1',
    sector: 'FoodTech Program',
    desc: "8 startups, 25 experts, 22 formations, 10h/mois de mentoring 1-to-1.",
    stats: ['2 labels Startup Act', '2 commercialisent', '1 levée de fonds'],
    color: '#84cc16',
    logo: '/programmes/foodstart-logo.jpg',
    img: '/programmes/foodstart-hero.jpg',
  },
];

const MENTORS = [
  { name: 'Karim Ghorbel',     role: 'CFO — Medianet Group',              domains: ['FinTech', 'E-Commerce'], initials: 'KG', grad: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', sessions: '120+ sessions' },
  { name: 'Sonia Mrad',        role: 'Dir. Innovation — Tunisie Telecom',  domains: ['AI/ML', 'EdTech'],      initials: 'SM', grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', sessions: '95+ sessions'  },
  { name: 'Yassine Ben Salah', role: 'Partner — AfricaVentures',           domains: ['AgriTech', 'CleanTech'],initials: 'YB', grad: 'linear-gradient(135deg,#10B981,#047857)', sessions: '80+ sessions'  },
  { name: 'Amira Hamdani',     role: 'CEO — HealthBridge',                 domains: ['HealthTech'],            initials: 'AH', grad: 'linear-gradient(135deg,#06B6D4,#0284C7)', sessions: '65+ sessions'  },
  { name: 'Omar Trabelsi',     role: 'Head of Digital — Attijari',         domains: ['FinTech'],               initials: 'OT', grad: 'linear-gradient(135deg,#F59E0B,#B45309)', sessions: '55+ sessions'  },
  { name: 'Leila Chaari',      role: 'CTO — Datavora',                     domains: ['AI/ML', 'Data'],         initials: 'LC', grad: 'linear-gradient(135deg,#EC4899,#BE185D)', sessions: '70+ sessions'  },
  { name: 'Fedi Glenza',       role: 'Responsable — Medianet Incubator',   domains: ['Tous secteurs'],         initials: 'FG', grad: 'linear-gradient(135deg,#1D77E6,#0c2d6b)', sessions: '200+ sessions' },
];

const FAQS = [
  { q: "Qui peut candidater au programme d'incubation ?", a: "Toute startup tunisienne ou africaine avec un MVP ou une idée avancée, une équipe de minimum 2 personnes et un secteur tech/digital. Les startups en phase seed jusqu'à Series A sont éligibles." },
  { q: "Le programme est-il payant ?", a: "Le programme d'incubation Medianet est partiellement subventionné. Une contribution symbolique peut être demandée pour certains programmes. Les modalités exactes sont communiquées lors de l'admission." },
  { q: "Medianet prend-il des parts dans ma startup ?", a: "Non. Medianet Incubator ne prend pas de participation automatique. Les investissements éventuels sont séparés et se font via nos partenaires investisseurs avec des termes négociés librement." },
  { q: "Combien de startups sont sélectionnées par programme ?", a: "Entre 5 et 12 startups par programme selon le secteur. La sélection est rigoureuse pour garantir la qualité de l'accompagnement de chaque équipe." },
  { q: "Quelle est la durée totale du programme ?", a: "Entre 6 et 9 mois selon le programme sectoriel choisi. Le programme FoodStart dure 6 mois, d'autres programmes peuvent s'étendre sur 9 mois avec un suivi post-programme de 6 mois supplémentaires." },
];

/* ─── Intersection observer hook ───────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Animated Number ───────────────────────────────────────────── */
function AnimNum({ target, suffix = '' }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = Math.ceil(target / 50);
      const t = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(t); }
        else setCount(start);
      }, 28);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Phase Row ─────────────────────────────────────────────────── */
function PhaseRow({ phase, index, isDark }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '20px 24px', cursor: 'pointer',
          background: open
            ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)')
            : 'transparent',
          transition: 'background .2s',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8', minWidth: 24 }}>{phase.num}</span>

        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${phase.grad[0]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: phase.grad[0] }}>
          {phase.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', margin: '0 0 3px' }}>{phase.title}</p>
          <p style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8', margin: 0 }}>{phase.description.slice(0, 70)}…</p>
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : '#64748b' }}>{phase.duration}</span>
          {phase.tags.map(t => (
            <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: t === 'Investisseurs' ? 'rgba(245,158,11,0.12)' : 'rgba(29,119,230,0.1)', color: t === 'Investisseurs' ? '#D97706' : '#1D77E6' }}>{t}</span>
          ))}
        </div>

        {/* Chevron */}
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform .25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="14" height="14" fill="none" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{
          padding: '0 24px 24px',
          display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24,
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
        }}>
          <div style={{ paddingTop: 20 }}>
            <p style={{ fontSize: 14, color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.75, marginBottom: 20 }}>{phase.description}</p>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8', marginBottom: 14 }}>Ce qui se passe</p>
            {phase.actions.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{i+1}</div>
                <span style={{ fontSize: 13, color: isDark ? '#e2e8f0' : '#334155', lineHeight: 1.6 }}>{a}</span>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 20 }}>
            <div style={{ borderRadius: 16, padding: 20, background: `linear-gradient(135deg, ${phase.grad[0]}, ${phase.grad[1]})`, color: '#fff', marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, margin: '0 0 10px' }}>Livrable clé</p>
              <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>{phase.deliverable}</p>
            </div>
            {phase.tags.length > 0 && (
              <div style={{ borderRadius: 14, padding: 16, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8', margin: '0 0 10px' }}>Acteurs impliqués</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {phase.tags.map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: t === 'Investisseurs' ? 'rgba(245,158,11,0.1)' : 'rgba(29,119,230,0.1)', color: t === 'Investisseurs' ? '#D97706' : '#1D77E6' }}>{t}</span>
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Équipe Medianet</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function IncubationPage() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark]   = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('mentors');

  useEffect(() => {
    setMounted(true);
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  if (!mounted) return null;

  const blobs = isDark ? HERO_BLOBS_DARK : HERO_BLOBS;
  const V = {
    bg:       isDark ? '#0d1b2e' : '#EFF6FF',
    bgS:      isDark ? '#0f172a' : '#f8fafc',
    bgS2:     isDark ? '#1e293b' : '#f1f5f9',
    text:     isDark ? '#f1f5f9' : '#0f172a',
    textMut:  isDark ? '#94a3b8' : '#64748b',
    textDesc: isDark ? '#cbd5e1' : '#475569',
    card:     isDark ? '#1e293b' : '#ffffff',
    cardBd:   isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
    divider:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
    badgeBg:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
    badgeBd:  isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
        @keyframes inc-fadeup { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes inc-blink  { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes inc-shimmer{ 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes inc-scroll { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(6px);opacity:.3} }
        .inc-animate { animation: inc-fadeup .7s ease both; }
        .inc-shimmer {
          background: linear-gradient(135deg, #1D77E6 0%, #06B6D4 50%, #10B981 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: inc-shimmer 4s linear infinite;
        }
        .inc-card-hover { transition: transform .25s, box-shadow .25s, border-color .25s; }
        .inc-card-hover:hover { transform: translateY(-4px) !important; }
        .inc-mentor-card:hover { border-color: rgba(29,119,230,0.3) !important; }
        .inc-startup-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 48px rgba(0,0,0,0.15) !important; }
        .inc-tab-active { background: #1D77E6 !important; color: #fff !important; box-shadow: 0 4px 14px rgba(29,119,230,.3) !important; }
        .inc-tab-inactive:hover { background: rgba(29,119,230,0.06) !important; color: #1D77E6 !important; }
        .inc-faq-q:hover { background: rgba(29,119,230,0.03) !important; }
        @media(max-width:900px){ .inc-phase-body { grid-template-columns: 1fr !important; } .inc-phase-pills { display: none !important; } }
        @media(max-width:640px){ .inc-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; } .inc-h1 { font-size: 42px !important; } .inc-stats-row { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>

      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', paddingTop: 100, paddingBottom: 80, overflow: 'hidden', background: V.bg, transition: 'background .3s' }}>
        {blobs.map((b, i) => (
          <div key={i} style={{ position: 'absolute', width: b.w, height: b.h, top: `${b.top}%`, left: `${b.left}%`, borderRadius: '50%', background: b.color, pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: isDark ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)' : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="inc-animate" style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 40px', width: '100%' }}>
          <div className="inc-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: 80, alignItems: 'center' }}>

            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 999, background: V.badgeBg, border: `1px solid ${V.badgeBd}`, backdropFilter: 'blur(8px)', marginBottom: 28 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'inc-blink 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.7)' : '#1D4ED8' }}>
                  Medianet Incubator — Nous transformons les idées en succès
                </span>
              </div>

              <h1 className="inc-h1" style={{ fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 900, lineHeight: 1.07, letterSpacing: '-1.5px', color: V.text, margin: '0 0 24px' }}>
                De l&apos;Idée à la<br />
                <span className="inc-shimmer">Levée de Fonds</span>
              </h1>

              <p style={{ fontSize: 17, lineHeight: 1.8, color: V.textDesc, maxWidth: 520, margin: '0 0 36px' }}>
                Notre programme d&apos;incubation intègre mentors sectoriels, investisseurs partenaires et ressources opérationnelles de Medianet Group pour maximiser vos chances de succès.
              </p>

              {/* Hero stats */}
              <div className="inc-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 36 }}>
                {[
                  { label: '6–9 mois', sub: 'durée programme',       color: '#1D77E6', bg: 'rgba(29,119,230,0.08)' },
                  { label: '25+ experts', sub: 'mentors actifs',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                  { label: '45+ fonds',  sub: 'investisseurs',        color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
                  { label: '87%',        sub: 'taux de réussite',     color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: V.card, border: `1px solid ${V.cardBd}`, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, background: s.bg, marginBottom: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.label}</p>
                    <p style={{ fontSize: 11, color: V.textMut, margin: 0, lineHeight: 1.4 }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/postuler">
                  <button style={{ padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 20px rgba(245,158,11,.35)', transition: 'all .18s' }}>
                    Candidater Maintenant →
                  </button>
                </Link>
                <Link href="/programmes">
                  <button style={{ padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)', border: `1px solid ${V.cardBd}`, color: V.text, backdropFilter: 'blur(8px)', transition: 'all .18s' }}>
                    Voir les programmes
                  </button>
                </Link>
              </div>

              <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ width: 24, height: 38, border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, borderRadius: 12, display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                  <div style={{ width: 3, height: 8, borderRadius: 2, background: '#1D77E6', animation: 'inc-scroll 1.6s ease infinite' }} />
                </div>
              </div>
            </div>

            {/* Right — Image mosaic */}
            <div style={{ position: 'relative' }}>
              {/* Main image */}
              <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: isDark ? '0 24px 64px rgba(0,0,0,.5)' : '0 24px 64px rgba(0,0,0,.15)', position: 'relative' }}>
                <img
                  src="/incubation/startup-village.jpg"
                  alt="Startup Village Medianet"
                  style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = 'linear-gradient(135deg,#1D77E6,#0c2d6b)'; e.target.parentNode.style.minHeight = '280px'; }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
                    Startup Village · Menzah, Tunis
                  </span>
                </div>
              </div>

              {/* Sub images grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                {[
                  { src: '/incubation/mentoring.jpg',  label: 'Mentoring 1-to-1' },
                  { src: '/programmes/foodstart-hero.jpg', label: 'Demo Day FoodStart' },
                ].map((img, i) => (
                  <div key={i} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: isDark ? '0 8px 24px rgba(0,0,0,.4)' : '0 8px 24px rgba(0,0,0,.08)' }}>
                    <img
                      src={img.src} alt={img.label}
                      style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = `linear-gradient(135deg, ${i === 0 ? '#8B5CF6,#6D28D9' : '#10B981,#047857'})`; e.target.parentNode.style.minHeight = '130px'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                    <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', opacity: 0.9 }}>{img.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating badge */}
              <div style={{ position: 'absolute', top: -16, right: -16, background: isDark ? '#1e293b' : '#fff', border: `1px solid ${V.cardBd}`, borderRadius: 16, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: V.text, margin: 0 }}>87% de succès</p>
                  <p style={{ fontSize: 11, color: V.textMut, margin: 0 }}>startups financées</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CHIFFRES CLÉS ═════════════════════════════════════════ */}
      <section style={{ padding: '72px 0', background: V.bgS2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'rgba(96,165,250,0.04)' : 'rgba(29,119,230,0.05)'} 1px, transparent 0)`, backgroundSize: '36px 36px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', borderRadius: 20, overflow: 'hidden', border: `1px solid ${V.divider}`, gap: 1, background: V.divider }}>
            {[
  { target: 120, suffix: '+', label: 'Startups accompagnées', sub: 'depuis 2018',        color: '#1D77E6' },
  { target: 45,  suffix: '+', label: 'Investisseurs partenaires', sub: 'réseau actif',    color: '#F59E0B' },
  { target: 24,  suffix: 'M DT+', label: 'Levées de fonds', sub: 'cumulées',             color: '#10b981' },
  { target: 87,  suffix: '%', label: 'Taux de réussite', sub: 'au-dessus de la moyenne', color: '#8b5cf6' },
  { target: 25,  suffix: '+', label: 'Experts & mentors', sub: 'actifs dans le réseau',  color: '#06B6D4' },
  { target: 6,   suffix: '+', label: 'Programmes lancés', sub: 'multi-sectoriels',        color: '#EC4899' }, // Fixed: added suffix: '+'
].map((s, i) => (
              <div key={i} style={{ padding: '36px 28px', background: V.card, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  <AnimNum target={s.target} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: V.text }}>{s.label}</div>
                <div style={{ fontSize: 12, color: V.textMut }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PHASES ════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgS }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Comment ça marche</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: V.text, letterSpacing: '-0.5px', margin: '0 0 14px' }}>
              Le Parcours <span style={{ color: '#1D77E6' }}>d&apos;Incubation</span>
            </h2>
            <p style={{ fontSize: 16, color: V.textMut, lineHeight: 1.7, maxWidth: 540 }}>5 phases structurées, chacune avec des livrables concrets et un accompagnement personnalisé.</p>
          </div>

          <div style={{ borderRadius: 24, overflow: 'hidden', border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.3)' : '0 2px 8px rgba(0,0,0,.06)', background: V.card }}>
            {PHASES.map((phase, i) => (
              <PhaseRow key={i} phase={phase} index={i} isDark={isDark} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ AVANTAGES ═════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgS2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'rgba(96,165,250,0.04)' : 'rgba(29,119,230,0.05)'} 1px, transparent 0)`, backgroundSize: '36px 36px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Ce que vous obtenez</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: V.text, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
              Un Accompagnement <span style={{ color: '#1D77E6' }}>360°</span>
            </h2>
            <p style={{ fontSize: 16, color: V.textMut, lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>Bien au-delà du financement — un écosystème complet pour transformer votre idée en entreprise performante.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} className="inc-card-hover" style={{ display: 'flex', gap: 20, padding: 24, borderRadius: 20, background: V.card, border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.2)' : '0 2px 8px rgba(0,0,0,.04)' }}>
                {/* Left: image or icon */}
                <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <img
                    src={b.img} alt={b.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = `${b.color}18`; e.target.parentNode.style.display = 'flex'; e.target.parentNode.style.alignItems = 'center'; e.target.parentNode.style.justifyContent = 'center'; e.target.parentNode.innerHTML = `<div style="color:${b.color};width:32px;height:32px">${b.icon.props.children ? '' : ''}</div>`; }}
                  />
                  <div style={{ position: 'absolute', bottom: 4, right: 4, background: b.color, borderRadius: 8, padding: '2px 6px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{b.stat}</span>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: V.text, margin: '0 0 6px' }}>{b.title}</h3>
                  <p style={{ fontSize: 13, color: V.textMut, margin: 0, lineHeight: 1.7 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STARTUPS ALUMNI ═══════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgS }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Success Stories</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: V.text, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
              Nos <span style={{ color: '#1D77E6' }}>Startups</span> qui Brillent
            </h2>
            <p style={{ fontSize: 16, color: V.textMut, lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>Des startups tunisiennes incubées par Medianet qui transforment leurs secteurs.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {STARTUPS.map((s, i) => (
              <div key={i} className="inc-startup-card inc-card-hover" style={{ borderRadius: 20, overflow: 'hidden', background: V.card, border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 4px 16px rgba(0,0,0,.25)' : '0 4px 16px rgba(0,0,0,.06)', cursor: 'pointer' }}>
                {/* Image */}
                <div style={{ position: 'relative', height: 160, overflow: 'hidden', background: `${s.color}18` }}>
                  <img src={s.img} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${s.color}60, transparent)` }} />
                  {/* Logo */}
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
                    <img src={s.logo} alt={s.name} style={{ height: 22, display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:12px;font-weight:800;color:#0f172a">${s.name}</span>`; }}
                    />
                  </div>
                  {/* Sector */}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: s.color, color: '#fff' }}>{s.sector}</span>
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: '18px 20px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: V.text, margin: '0 0 6px' }}>{s.name}</h3>
                  <p style={{ fontSize: 13, color: V.textMut, margin: '0 0 14px', lineHeight: 1.6 }}>{s.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {s.stats.map((st, j) => (
                      <span key={j} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${s.color}12`, color: s.color }}>{st}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MENTORS & INVESTISSEURS ═══════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgS2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'rgba(96,165,250,0.04)' : 'rgba(29,119,230,0.05)'} 1px, transparent 0)`, backgroundSize: '36px 36px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>L&apos;écosystème</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: V.text, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
              Mentors & <span style={{ color: '#1D77E6' }}>Experts</span>
            </h2>
            <p style={{ fontSize: 16, color: V.textMut, lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>Des professionnels intégrés à chaque étape du parcours pour maximiser vos chances.</p>
          </div>

          {/* Tab */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', background: V.card, border: `1px solid ${V.cardBd}`, borderRadius: 16, padding: 4, gap: 4 }}>
              {[
                { key: 'mentors',    label: 'Mentors (25+)' },
                { key: 'investors', label: 'Investisseurs (45+)' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={activeTab === tab.key ? 'inc-tab-active' : 'inc-tab-inactive'}
                  style={{ padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .2s', fontFamily: 'inherit', background: 'transparent', color: V.textMut }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'mentors' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {MENTORS.map((m, i) => (
                <div key={i} className="inc-mentor-card inc-card-hover" style={{ padding: 22, borderRadius: 18, background: V.card, border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.2)' : '0 2px 8px rgba(0,0,0,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: m.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{m.initials}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: V.text, margin: '0 0 2px' }}>{m.name}</p>
                      <p style={{ fontSize: 12, color: V.textMut, margin: '0 0 2px' }}>{m.role}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', margin: 0 }}>{m.sessions}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {m.domains.map(d => (
                      <span key={d} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.05)', color: V.textMut }}>{d}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'investors' && (
            <div>
              {/* Info banner */}
              <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" fill="none" stroke="#F59E0B" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#FBBF24' : '#92400E', margin: '0 0 4px' }}>Comment interviennent les investisseurs ?</p>
                  <p style={{ fontSize: 13, color: isDark ? '#FCD34D' : '#B45309', margin: 0, lineHeight: 1.6 }}>
                    Intégrés dès la phase 4 via des sessions de pitch simulées. En phase 5 (Demo Day), vous présentez devant tout le réseau. Des introductions chaleureuses sont organisées selon votre profil et secteur.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {[
                  { name: 'Africinvest',   type: 'Fonds de capital-risque', ticket: '500K – 5M DT',  focus: ['Tech', 'AgriTech', 'FinTech'],  logo: 'AF', grad: 'linear-gradient(135deg,#1D77E6,#0c2d6b)' },
                  { name: 'BFPME',         type: 'Financement public',      ticket: '100K – 3M DT',  focus: ['PME Innovantes', 'Export'],      logo: 'BF', grad: 'linear-gradient(135deg,#10B981,#047857)' },
                  { name: 'SICAR Tunisie', type: "Société d'investissement",ticket: '200K – 2M DT',  focus: ['Tech', 'Industrie'],             logo: 'SI', grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' },
                  { name: 'Smart Capital', type: "Fonds d'amorçage",        ticket: '50K – 500K DT', focus: ['Startups early-stage'],          logo: 'SC', grad: 'linear-gradient(135deg,#F59E0B,#B45309)' },
                  { name: 'Angels Tunisie',type: 'Business Angels',         ticket: '10K – 200K DT', focus: ['Tous secteurs tech'],            logo: 'AT', grad: 'linear-gradient(135deg,#EC4899,#BE185D)' },
                  { name: 'Medianet Group',type: 'Corporate venture',       ticket: '50K – 1M DT',   focus: ['Digital', 'Media', 'Tech'],      logo: 'MN', grad: 'linear-gradient(135deg,#06B6D4,#0284C7)' },
                ].map((inv, i) => (
                  <div key={i} className="inc-mentor-card inc-card-hover" style={{ padding: 22, borderRadius: 18, background: V.card, border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.2)' : '0 2px 8px rgba(0,0,0,.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 14, background: inv.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{inv.logo}</div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: V.text, margin: '0 0 2px' }}>{inv.name}</p>
                        <p style={{ fontSize: 12, color: V.textMut, margin: '0 0 2px' }}>{inv.type}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', margin: 0 }}>Ticket: {inv.ticket}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {inv.focus.map(f => (
                        <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'rgba(245,158,11,0.08)', color: isDark ? '#FBBF24' : '#B45309' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══ TÉMOIGNAGES ═══════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgS }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Témoignages</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: V.text, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
              Ce qu&apos;ils en disent
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {[
              { name: 'Achref Mrabet',   company: 'UKLA / FoodStart',     init: 'AM', color: '#F59E0B', quote: "The biggest advantage of being in the Medianet incubator is having direct access to people with 25 years of experience. You'll make real friendships with other entrepreneurs in Startup Village, it really feels like home." },
              { name: 'Anis Ben Ghali',  company: 'CHITELIX / FoodStart', init: 'AB', color: '#10B981', quote: "Le programme FoodStart a été pour nous la révélation du potentiel de notre projet. La visibilité et la qualité de la formation reçue nous a permis de labéliser notre startup et d'accélérer notre levée de fond." },
              { name: 'Fedi Glenza',     company: 'Responsable Medianet Incubator', init: 'FG', color: '#1D77E6', quote: "Nous mettons l'accent sur la formation, le mentorat de qualité, l'accès à un réseau influent et des partenariats stratégiques. Ces éléments offrent à nos startups des opportunités uniques pour se développer et réussir sur le long terme." },
            ].map((t, i) => (
              <div key={i} className="inc-card-hover" style={{ padding: 28, borderRadius: 20, background: V.card, border: `1px solid ${V.cardBd}`, position: 'relative', overflow: 'hidden', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.2)' : '0 2px 8px rgba(0,0,0,.04)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${t.color}, ${t.color}88)` }} />
                <div style={{ fontSize: 72, fontWeight: 900, color: t.color, opacity: 0.07, lineHeight: 0.8, position: 'absolute', top: 16, left: 16, userSelect: 'none' }}>&ldquo;</div>
                <p style={{ fontSize: 14, color: V.textMut, lineHeight: 1.8, margin: '0 0 20px', fontStyle: 'italic', position: 'relative' }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800 }}>{t.init}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: V.text, margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: t.color, fontWeight: 600, margin: 0 }}>{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgS2 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Questions</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: V.text, margin: 0, letterSpacing: '-0.5px' }}>
              Questions <span style={{ color: '#1D77E6' }}>Fréquentes</span>
            </h2>
          </div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ marginBottom: 10, borderRadius: 16, overflow: 'hidden', background: V.card, border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,.2)' : '0 1px 4px rgba(0,0,0,.04)' }}>
              <button className="inc-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 22px', textAlign: 'left', fontSize: 15, fontWeight: 700, color: V.text, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}>
                <span>{faq.q}</span>
                <svg style={{ flexShrink: 0, transition: 'transform .25s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }} width="18" height="18" fill="none" stroke={V.textMut} strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 22px 18px', fontSize: 14, lineHeight: 1.8, color: V.textMut, borderTop: `1px solid ${V.divider}`, paddingTop: 14 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA FINAL ═════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 60%, #0a1628 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,.07) 0%, transparent 70%)' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px', position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 20, background: 'rgba(255,255,255,.08)', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', animation: 'inc-blink 2s ease-in-out infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>Places limitées disponibles</span>
          </div>

          <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, color: '#fff', margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-1.5px' }}>
            Prêt à transformer<br />
            <span style={{ color: '#F59E0B' }}>votre startup ?</span>
          </h2>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.65)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.75 }}>
            Rejoignez notre prochaine cohorte et bénéficiez d&apos;un accompagnement sur-mesure pour accélérer votre croissance en Tunisie et en Afrique.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/postuler">
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .2s', boxShadow: '0 4px 20px rgba(245,158,11,.4)', fontFamily: 'inherit' }}>
                Candidater maintenant
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </Link>
            <Link href="/programmes">
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 14, background: 'transparent', border: '1.5px solid rgba(255,255,255,.25)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit' }}>
                Voir les programmes
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}