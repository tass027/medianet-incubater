'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

/* ─── Blobs (identiques home, programmes, incubation) ──────────── */
const HERO_BLOBS = [
  { w: 420, h: 420, top: -12, left: 10,  color: 'rgba(96,165,250,0.22)'  },
  { w: 300, h: 300, top: 38,  left: -5,  color: 'rgba(167,243,208,0.25)' },
  { w: 240, h: 240, top: 60,  left: 50,  color: 'rgba(196,181,253,0.20)' },
  { w: 320, h: 320, top: -16, left: 68,  color: 'rgba(251,207,232,0.22)' },
  { w: 200, h: 200, top: 50,  left: 82,  color: 'rgba(253,230,138,0.18)' },
];
const HERO_BLOBS_DARK = [
  { w: 420, h: 420, top: -12, left: 10,  color: 'rgba(96,165,250,0.07)'  },
  { w: 300, h: 300, top: 38,  left: -5,  color: 'rgba(167,243,208,0.06)' },
  { w: 240, h: 240, top: 60,  left: 50,  color: 'rgba(196,181,253,0.07)' },
  { w: 320, h: 320, top: -16, left: 68,  color: 'rgba(251,207,232,0.05)' },
  { w: 200, h: 200, top: 50,  left: 82,  color: 'rgba(253,230,138,0.05)' },
];

/* ─── Animated number ───────────────────────────────────────────── */
function AnimNum({ target, suffix = '', duration = 1800 }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let startTime = null;
      const step = (ts) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(ease * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Data ──────────────────────────────────────────────────────── */
const TIMELINE = [
  {
    year: '2000',
    title: 'Fondation de Medianet',
    desc: "Création de Medianet Group à Tunis, pionnier de la transformation digitale en Tunisie.",
    color: '#1D77E6',
  },
  {
    year: '2018',
    title: 'Lancement de l\'Incubateur',
    desc: "Medianet lance son programme d'incubation technologique, le premier axé sur l'accompagnement 360° des startups tunisiennes.",
    color: '#8B5CF6',
  },
  {
    year: '2021',
    title: 'Startup Village 2500m²',
    desc: "Inauguration du Startup Village — 2500m² dédiés à l'innovation, au co-working et à la créativité au cœur de Menzah, Tunis.",
    color: '#10B981',
  },
  {
    year: '2022',
    title: 'Programme FoodStart 1ère édition',
    desc: "Lancement du premier programme sectoriel spécialisé FoodTech en Tunisie. 8 startups, 25 experts, 22 formations.",
    color: '#F59E0B',
  },
  {
    year: '2023',
    title: 'Réseau Africinvest & International',
    desc: "Partenariat stratégique avec Africinvest et 45+ investisseurs. Extension du réseau à l'Afrique subsaharienne et à l'Europe.",
    color: '#EC4899',
  },
  {
    year: '2025',
    title: 'FoodStart 2ème Édition',
    desc: "Lancement de la 2ème édition FoodStart et ouverture de nouveaux programmes sectoriels : FinTech, EdTech, CleanTech, AI/ML.",
    color: '#06B6D4',
  },
];

const VALUES = [
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>),
    title: 'Innovation',
    desc: "Nous encourageons la pensée disruptive et accompagnons les entrepreneurs qui osent remettre en question le statu quo dans leurs secteurs.",
    color: '#1D77E6',
  },
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>),
    title: 'Communauté',
    desc: "L'entraide entre entrepreneurs est au cœur de notre ADN. Startup Village n'est pas juste un espace — c'est une famille.",
    color: '#8B5CF6',
  },
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>),
    title: 'Excellence',
    desc: "25 ans d'expertise tech au service des startups. Nous n'accompagnons pas juste — nous transformons des idées en entreprises performantes.",
    color: '#10B981',
  },
  {
    icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
    title: 'Impact',
    desc: "Chaque startup que nous accompagnons contribue à l'économie tunisienne et africaine. Notre succès se mesure au vôtre.",
    color: '#F59E0B',
  },
];

const TEAM = [
  {
    name: 'Fedi Glenza',
    role: 'Responsable Medianet Incubator',
    bio: "Expert en accompagnement de startups avec 200+ sessions de coaching. Visionnaire de l'écosystème entrepreneurial tunisien.",
    initials: 'FG',
    grad: 'linear-gradient(135deg,#1D77E6,#0c2d6b)',
    domains: ['Stratégie', 'Financement', 'Écosystème'],
    img: '/team/fedi-glenza.jpg',
  },
  {
    name: 'Karim Ghorbel',
    role: 'CFO — Medianet Group',
    bio: "Expert financier avec 15+ ans d'expérience dans les secteurs FinTech et e-commerce. Mentor de plus de 120 sessions.",
    initials: 'KG',
    grad: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
    domains: ['FinTech', 'Finance', 'Levée de fonds'],
    img: '/team/karim-ghorbel.jpg',
  },
  {
    name: 'Sonia Mrad',
    role: 'Dir. Innovation — Tunisie Telecom',
    bio: "Pionnière de l'innovation digitale en Tunisie. Spécialiste AI/ML et EdTech avec une vision africaine de la technologie.",
    initials: 'SM',
    grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
    domains: ['AI/ML', 'EdTech', 'Innovation'],
    img: '/team/sonia-mrad.jpg',
  },
  {
    name: 'Yassine Ben Salah',
    role: 'Partner — AfricaVentures',
    bio: "Investisseur spécialisé AgriTech et CleanTech. Construit des ponts entre les startups tunisiennes et les marchés africains.",
    initials: 'YB',
    grad: 'linear-gradient(135deg,#10B981,#047857)',
    domains: ['AgriTech', 'CleanTech', 'Afrique'],
    img: '/team/yassine-ben-salah.jpg',
  },
];

const PARTNERS = [
  { name: 'FFBD Consulting',   logo: '/programmes/partner-ffbd.png',       type: 'Partenaire FoodStart' },
  { name: 'Magic Hotels',      logo: '/programmes/partner-magic.png',      type: 'Partenaire hôtelier'   },
  { name: 'Plan B',            logo: '/programmes/partner-planb.png',      type: 'Partenaire créatif'    },
  { name: 'Startup Village',   logo: '/programmes/partner-sv.png',         type: 'Espace & co-working'   },
  { name: 'Africinvest',       logo: '/programmes/partner-africinvest.png',type: 'Fonds d\'investissement'},
  { name: 'BFPME',             logo: '/programmes/partner-bfpme.png',      type: 'Financement public'    },
  { name: 'ExpressFm',         logo: '/programmes/partner-expressfm.png',  type: 'Média partenaire'      },
  { name: 'Scaylab',           logo: '/programmes/partner-scaylab.png',    type: 'Tech partenaire'       },
];

/* ─── Main ──────────────────────────────────────────────────────── */
export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark]   = useState(false);

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
    heroBg:   isDark ? '#0d1b2e'            : '#EFF6FF',
    bg:       isDark ? '#0f172a'            : '#f8fafc',
    bgAlt:    isDark ? '#1e293b'            : '#f1f5f9',
    text:     isDark ? '#f1f5f9'            : '#0f172a',
    textMut:  isDark ? '#94a3b8'            : '#64748b',
    textDesc: isDark ? '#cbd5e1'            : '#475569',
    card:     isDark ? '#1e293b'            : '#ffffff',
    cardBd:   isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
    divider:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
    badgeBg:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
    badgeBd:  isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.07)',
    dotColor: isDark ? 'rgba(96,165,250,0.04)'  : 'rgba(29,119,230,0.05)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
        @keyframes ab-fadeup { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ab-blink  { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes ab-scroll { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(6px);opacity:.3} }
        @keyframes ab-shimmer{ 0%{background-position:200% center} 100%{background-position:-200% center} }
        .ab-animate { animation: ab-fadeup .7s ease both; }
        .ab-shimmer {
          background: linear-gradient(135deg, #1D77E6 0%, #06B6D4 50%, #10B981 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ab-shimmer 4s linear infinite;
        }
        .ab-card-hover { transition: transform .25s, box-shadow .25s, border-color .25s; }
        .ab-card-hover:hover { transform: translateY(-4px) !important; box-shadow: 0 16px 40px rgba(0,0,0,.1) !important; }
        .ab-team-card:hover { border-color: rgba(29,119,230,0.3) !important; }
        .ab-value-card:hover { border-color: rgba(29,119,230,0.2) !important; }
        .ab-tl-dot { transition: transform .2s; }
        .ab-tl-dot:hover { transform: scale(1.2); }
        @media(max-width:960px) { .ab-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
        @media(max-width:640px) { .ab-hero-grid { padding: 0 20px !important; } .ab-h1 { font-size: 42px !important; } }
      `}</style>

      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', minHeight: '75vh',
        display: 'flex', alignItems: 'center',
        paddingTop: 100, paddingBottom: 80,
        overflow: 'hidden', background: V.heroBg,
        transition: 'background .3s',
      }}>
        {blobs.map((b, i) => (
          <div key={i} style={{ position: 'absolute', width: b.w, height: b.h, top: `${b.top}%`, left: `${b.left}%`, borderRadius: '50%', background: b.color, pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: isDark ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)' : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="ab-animate" style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 40px', width: '100%' }}>
          <div className="ab-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: 80, alignItems: 'center' }}>

            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 999, background: V.badgeBg, border: `1px solid ${V.badgeBd}`, backdropFilter: 'blur(8px)', marginBottom: 28 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'ab-blink 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.7)' : '#1D4ED8' }}>
                  25 ans d'innovation — Tunis, Tunisie
                </span>
              </div>

              <h1 className="ab-h1" style={{ fontSize: 'clamp(44px, 5.5vw, 72px)', fontWeight: 900, lineHeight: 1.07, letterSpacing: '-1.5px', marginBottom: 24, color: V.text }}>
                Nous Transformons<br />
                <span className="ab-shimmer">les idées</span><br />
                en succès
              </h1>

              <p style={{ fontSize: 18, lineHeight: 1.8, color: V.textDesc, maxWidth: 520, marginBottom: 36 }}>
                En tant qu'incubateur technologique, Medianet guide les porteurs de projets dans la transformation d'idées novatrices en entreprises performantes, propulsant l'écosystème des startups tunisiens et africains.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link href="/programmes">
                  <button style={{ padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 20px rgba(245,158,11,.35)', transition: 'all .18s' }}>
                    Voir nos programmes
                  </button>
                </Link>
                <Link href="/incubation">
                  <button style={{ padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all .18s', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)', border: `1px solid ${V.cardBd}`, color: V.text, backdropFilter: 'blur(8px)' }}>
                    Notre programme d'incubation
                  </button>
                </Link>
              </div>
            </div>

            {/* Right — identity card */}
            <div style={{ borderRadius: 24, overflow: 'hidden', background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.92)', border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 4px 6px rgba(0,0,0,.3), 0 24px 64px rgba(0,0,0,.5)' : '0 4px 6px rgba(0,0,0,.04), 0 24px 64px rgba(0,0,0,.12)', backdropFilter: 'blur(20px)' }}>
              {/* Logo header */}
              <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 100%)', padding: '28px 28px 24px', textAlign: 'center' }}>
                <img
                  src="/logos/medianet incubater logo.png"
                  alt="Medianet Incubator"
                  style={{ height: 56, display: 'block', margin: '0 auto 12px', objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Tunis — Tunisie</p>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: V.divider }}>
                {[
                  { value: '25',   suffix: ' ans',  label: "d'expertise",         color: '#1D77E6' },
                  { value: '120',  suffix: '+',      label: 'startups incubées',   color: '#8B5CF6' },
                  { value: '45',   suffix: '+',      label: 'investisseurs',       color: '#F59E0B' },
                  { value: '24',   suffix: 'M DT+',  label: 'levées de fonds',     color: '#10B981' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '20px 22px', background: V.card }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>
                      <AnimNum target={parseInt(s.value)} suffix={s.suffix} />
                    </div>
                    <div style={{ fontSize: 12, color: V.textMut, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Quote */}
              <div style={{ padding: '20px 24px', borderTop: `1px solid ${V.divider}`, background: V.card }}>
                <p style={{ fontSize: 13, color: V.textMut, fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 12px' }}>
                  "Ce qui nous distingue, c'est notre savoir-faire et notre engagement envers la création d'un environnement propice à la croissance et à l'innovation des startups."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#1D77E6,#0c2d6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>FG</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: V.text, margin: 0 }}>Fedi Glenza</p>
                    <p style={{ fontSize: 11, color: '#1D77E6', margin: 0, fontWeight: 600 }}>Responsable Medianet Incubator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 24, height: 38, border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, borderRadius: 12, display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <div style={{ width: 3, height: 8, borderRadius: 2, background: '#1D77E6', animation: 'ab-scroll 1.6s ease infinite' }} />
          </div>
        </div>
      </section>

      {/* ══ MISSION ══════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgAlt, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, ${V.dotColor} 1px, transparent 0)`, backgroundSize: '36px 36px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

            {/* Left — photo mosaic */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: isDark ? '0 24px 64px rgba(0,0,0,.5)' : '0 24px 64px rgba(0,0,0,.15)' }}>
                <img src="/programmes/foodstart-hero.jpg" alt="Medianet Incubator"
                  style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = 'linear-gradient(135deg,#1D77E6,#0c2d6b)'; e.target.parentNode.style.minHeight = '280px'; }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)', borderRadius: 24 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                {[
                  { src: '/incubation/startup-village.jpg', label: 'Startup Village 2500m²' },
                  { src: '/incubation/mentoring.jpg',       label: 'Mentoring 1-to-1' },
                ].map((img, i) => (
                  <div key={i} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: isDark ? '0 8px 24px rgba(0,0,0,.4)' : '0 8px 24px rgba(0,0,0,.08)' }}>
                    <img src={img.src} alt={img.label} style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = `linear-gradient(135deg, ${i === 0 ? '#8B5CF6,#6D28D9' : '#10B981,#047857'})`; e.target.parentNode.style.minHeight = '130px'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                    <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, fontWeight: 700, color: '#fff', opacity: 0.9 }}>{img.label}</span>
                  </div>
                ))}
              </div>

              {/* Floating badge */}
              <div style={{ position: 'absolute', top: -16, right: -16, background: V.card, border: `1px solid ${V.cardBd}`, borderRadius: 16, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: V.text, margin: 0 }}>6+ programmes</p>
                  <p style={{ fontSize: 11, color: V.textMut, margin: 0 }}>sectoriels lancés</p>
                </div>
              </div>
            </div>

            {/* Right — text */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Notre Mission</p>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: V.text, margin: '0 0 20px', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                Bien plus qu'un<br />
                <span style={{ color: '#1D77E6' }}>simple espace de travail</span>
              </h2>
              <p style={{ fontSize: 16, color: V.textDesc, lineHeight: 1.8, margin: '0 0 24px' }}>
                Medianet s'engage à fournir bien plus qu'un simple espace de travail. Nos programmes d'incubation technologique visent à créer un <strong style={{ color: V.text }}>écosystème</strong>, un environnement favorable à la croissance et à l'innovation.
              </p>
              <p style={{ fontSize: 16, color: V.textDesc, lineHeight: 1.8, margin: '0 0 32px' }}>
                Nous mettons l'accent sur la <strong style={{ color: V.text }}>formation</strong>, le <strong style={{ color: V.text }}>mentorat de qualité</strong>, l'accès à un <strong style={{ color: V.text }}>réseau influent</strong> et des <strong style={{ color: V.text }}>partenariats stratégiques</strong>. Ces éléments offrent à nos startups des opportunités uniques pour se développer et réussir sur le long terme.
              </p>

              {/* 3 pillars */}
              {[
                { icon: '🎓', label: 'Formation continue',    desc: '22+ ateliers sur mesure, coaching hebdomadaire et formations sectorielles' },
                { icon: '🤝', label: 'Réseau & communauté',   desc: 'Accès à 45+ investisseurs, 25+ mentors et à la communauté alumni Medianet' },
                { icon: '🚀', label: 'Ressources opérationnelles', desc: "Startup Village 2500m², labos culinaires, outils tech et visibilité médiatique" },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14, padding: '14px 16px', borderRadius: 14, background: V.card, border: `1px solid ${V.cardBd}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: V.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{p.icon}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: V.text, margin: '0 0 2px' }}>{p.label}</p>
                    <p style={{ fontSize: 12, color: V.textMut, margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CHIFFRES CLÉS ════════════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: V.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', borderRadius: 20, overflow: 'hidden', border: `1px solid ${V.divider}`, gap: 1, background: V.divider }}>
            {[
              { target: 25,  suffix: ' ans',    label: "d'expertise",              sub: 'fondé en 2000',            color: '#1D77E6' },
              { target: 120, suffix: '+',        label: 'startups accompagnées',    sub: 'depuis le lancement',      color: '#8B5CF6' },
              { target: 45,  suffix: '+',        label: 'investisseurs partenaires',sub: 'réseau actif',             color: '#F59E0B' },
              { target: 24,  suffix: 'M DT+',   label: 'levées de fonds',           sub: 'cumulées',                 color: '#10B981' },
              { target: 87,  suffix: '%',        label: 'taux de réussite',          sub: 'au-dessus de la moyenne',  color: '#06B6D4' },
              { target: 6,   suffix: '+',        label: 'programmes lancés',         sub: 'multi-sectoriels',         color: '#EC4899' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '36px 28px', background: V.card, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  <AnimNum target={s.target} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: V.text }}>{s.label}</div>
                <div style={{ fontSize: 12, color: V.textMut }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ VALEURS ══════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgAlt, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, ${V.dotColor} 1px, transparent 0)`, backgroundSize: '36px 36px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Nos valeurs</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: V.text, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
              Ce qui nous <span style={{ color: '#1D77E6' }}>distingue</span>
            </h2>
            <p style={{ fontSize: 16, color: V.textMut, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Notre approche complète contribue au succès à long terme des startups que nous accompagnons.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {VALUES.map((v, i) => (
              <div key={i} className="ab-value-card ab-card-hover" style={{ padding: '28px 24px', borderRadius: 20, background: V.card, border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.2)' : '0 2px 8px rgba(0,0,0,.04)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${v.color}, ${v.color}55)` }} />
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${v.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.color, marginBottom: 18 }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: V.text, margin: '0 0 10px' }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: V.textMut, margin: 0, lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TIMELINE ═════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Notre histoire</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: V.text, margin: 0, letterSpacing: '-0.5px' }}>
              25 ans d'<span style={{ color: '#1D77E6' }}>innovation</span>
            </h2>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, transparent, ${V.divider} 10%, ${V.divider} 90%, transparent)` }} />

            {TIMELINE.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 48, position: 'relative' }}>
                {/* Left side */}
                <div style={{ flex: 1, textAlign: 'right', paddingRight: 48 }}>
                  {i % 2 === 0 ? (
                    <div style={{ padding: '20px 22px', borderRadius: 16, background: V.card, border: `1px solid ${V.cardBd}`, display: 'inline-block', textAlign: 'left', maxWidth: 360, boxShadow: isDark ? '0 4px 16px rgba(0,0,0,.25)' : '0 4px 16px rgba(0,0,0,.06)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: item.color, marginBottom: 6 }}>{item.year}</div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: V.text, margin: '0 0 6px' }}>{item.title}</h3>
                      <p style={{ fontSize: 13, color: V.textMut, margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  ) : <div style={{ height: 10 }} />}
                </div>

                {/* Center dot */}
                <div className="ab-tl-dot" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 16, width: 16, height: 16, borderRadius: '50%', background: item.color, border: `3px solid ${V.bg}`, boxShadow: `0 0 0 3px ${item.color}40`, zIndex: 2 }} />

                {/* Right side */}
                <div style={{ flex: 1, paddingLeft: 48 }}>
                  {i % 2 === 1 ? (
                    <div style={{ padding: '20px 22px', borderRadius: 16, background: V.card, border: `1px solid ${V.cardBd}`, display: 'inline-block', maxWidth: 360, boxShadow: isDark ? '0 4px 16px rgba(0,0,0,.25)' : '0 4px 16px rgba(0,0,0,.06)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: item.color, marginBottom: 6 }}>{item.year}</div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: V.text, margin: '0 0 6px' }}>{item.title}</h3>
                      <p style={{ fontSize: 13, color: V.textMut, margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  ) : <div style={{ height: 10 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ÉQUIPE ═══════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', background: V.bgAlt, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, ${V.dotColor} 1px, transparent 0)`, backgroundSize: '36px 36px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>L'équipe</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: V.text, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
              Les experts <span style={{ color: '#1D77E6' }}>qui vous accompagnent</span>
            </h2>
            <p style={{ fontSize: 16, color: V.textMut, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Des professionnels engagés, intégrés à chaque étape de votre parcours entrepreneurial.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {TEAM.map((m, i) => (
              <div key={i} className="ab-team-card ab-card-hover" style={{ borderRadius: 20, overflow: 'hidden', background: V.card, border: `1px solid ${V.cardBd}`, boxShadow: isDark ? '0 4px 16px rgba(0,0,0,.25)' : '0 4px 16px rgba(0,0,0,.06)' }}>
                {/* Header image / gradient */}
                <div style={{ height: 100, background: m.grad, position: 'relative', overflow: 'hidden' }}>
                  <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))' }} />
                  {/* Avatar overlapping */}
                  <div style={{ position: 'absolute', bottom: -22, left: 20, width: 52, height: 52, borderRadius: 14, background: m.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800, border: `3px solid ${V.card}` }}>
                    {m.initials}
                  </div>
                </div>
                <div style={{ padding: '28px 20px 20px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: V.text, margin: '0 0 2px' }}>{m.name}</h3>
                  <p style={{ fontSize: 12, color: '#1D77E6', fontWeight: 600, margin: '0 0 10px' }}>{m.role}</p>
                  <p style={{ fontSize: 13, color: V.textMut, margin: '0 0 14px', lineHeight: 1.6 }}>{m.bio}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {m.domains.map(d => (
                      <span key={d} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: isDark ? 'rgba(29,119,230,0.12)' : 'rgba(29,119,230,0.08)', color: '#1D77E6' }}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PARTENAIRES ══════════════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: V.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#1D77E6', marginBottom: 12 }}>Écosystème</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: V.text, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
              Nos <span style={{ color: '#1D77E6' }}>partenaires</span>
            </h2>
            <p style={{ fontSize: 16, color: V.textMut, maxWidth: 520, margin: '0 auto' }}>Un réseau stratégique au service des startups que nous accompagnons.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {PARTNERS.map((p, i) => (
              <div key={i} className="ab-card-hover" style={{ padding: '20px 16px', borderRadius: 16, background: V.card, border: `1px solid ${V.cardBd}`, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: V.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={p.logo} alt={p.name} style={{ width: 44, height: 44, objectFit: 'contain', filter: isDark ? 'brightness(0) invert(1)' : 'none', opacity: isDark ? 0.6 : 1 }}
                    onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:11px;font-weight:800;color:#1D77E6">${p.name.slice(0,2)}</span>`; }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: V.text, margin: '0 0 2px' }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: V.textMut, margin: 0 }}>{p.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTACT & CTA ════════════════════════════════════════ */}
      <section style={{ padding: '96px 0', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 60%, #0a1628 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,.07) 0%, transparent 70%)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

            {/* Left — contact info */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(245,158,11,0.8)', marginBottom: 12 }}>Nous contacter</p>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                Rejoignez<br />l'aventure
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 36 }}>
                Que vous soyez porteur de projet, investisseur ou partenaire — nous sommes là pour construire ensemble l'avenir de l'entrepreneuriat en Tunisie et en Afrique.
              </p>

              {[
                { icon: '📍', label: 'Adresse',  value: 'Startup Village, Menzah, Tunis — Tunisie' },
                { icon: '📧', label: 'Email',    value: 'incubateur@medianet.tn' },
                { icon: '🕐', label: 'Horaires', value: 'Lun–Ven 8h00 – 17h00' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>{c.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — CTAs */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(12px)' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Prêt à vous lancer ?</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>
                Rejoignez notre prochaine cohorte et bénéficiez d'un accompagnement sur-mesure.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link href="/programmes">
                  <button style={{ width: '100%', padding: '14px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 18px rgba(245,158,11,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .18s', fontFamily: 'inherit' }}>
                    Voir nos programmes
                    <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </Link>
                <Link href="/incubation">
                  <button style={{ width: '100%', padding: '14px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'all .18s', fontFamily: 'inherit' }}>
                    Découvrir l'incubation
                  </button>
                </Link>
                <Link href="/login">
                  <button style={{ width: '100%', padding: '14px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all .18s', fontFamily: 'inherit' }}>
                    Candidater maintenant
                  </button>
                </Link>
              </div>

              {/* Social */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, justifyContent: 'center' }}>
                {[
                  { label: 'LinkedIn',  href: 'https://www.linkedin.com/company/medianet-incubator' },
                  { label: 'Facebook',  href: 'https://www.facebook.com/MedianetIncubator' },
                  { label: 'Instagram', href: 'https://www.instagram.com/medianet.incubator' },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'all .15s' }}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}