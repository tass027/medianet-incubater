'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useChatbot } from './hooks/useChatbot';

// ─── Animated counter hook ───────────────────────────────────────
function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let frameId: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [target, duration, start]);

  return count;
}

// ─── Intersection observer hook ──────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

// ─── FAQ data ─────────────────────────────────────────────────────
const FAQ = [
  {
    q: 'Comment candidater ?',
    a: 'Créez un compte, choisissez un programme actif ou soumettez une candidature spontanée. Notre équipe vous répond sous 48h.',
  },
  {
    q: 'Quel financement est disponible ?',
    a: 'Entre 10 000 DT et 150 000 DT selon le stade de votre startup et le programme sélectionné.',
  },
  {
    q: 'Durée du programme ?',
    a: 'Entre 6 et 12 mois, avec un accompagnement personnalisé par un mentor dédié.',
  },
  {
    q: 'Quels secteurs sont acceptés ?',
    a: 'FinTech, EdTech, AgriTech, HealthTech, CleanTech, AI/ML, e-commerce et tous secteurs tech innovants.',
  },
];

// ─── Chatbot ─────────────────────────────────────────────────────
function Chatbot() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, isStreaming, send, escalate } = useChatbot({
    apiUrl: process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/ai/chat`
      : '/api/ai/chat',
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quick = ['Candidater', 'Financement', 'Programmes', 'Contact'];

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
      {open && (
        <div className="cb-window">

          {/* ── Header ── */}
          <div className="cb-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="cb-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                <div>
                  <p className="cb-header-title">Assistant IA — MEDIANET</p>
                  <p className="cb-header-status">
                    <span className="cb-status-dot" style={{ background: isStreaming ? '#F59E0B' : '#22C55E' }} />
                    {isStreaming ? 'Génération en cours' : 'En ligne'}
                  </p>
                </div>
              </div>
              <button className="cb-close-btn" onClick={() => setOpen(false)} aria-label="Fermer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Tab bar */}
            <div className="cb-tabs">
              {['chat', 'faq'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`cb-tab-btn${tab === t ? ' cb-tab-active' : ''}`}
                >
                  {t === 'chat' ? 'Conversation' : 'FAQ'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Chat tab ── */}
          {tab === 'chat' ? (
            <>
              <div className="cb-messages">
                {messages.map((m, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                        gap: 8,
                        alignItems: 'flex-end',
                      }}
                    >
                      {m.role === 'bot' && (
                        <div className="cb-msg-avatar">AI</div>
                      )}

                      {m.role === 'bot' ? (
                        <div
                          className="cb-msg-bot"
                          style={
                            m.isContact
                              ? { background: '#EFF6FF', borderColor: '#BFDBFE', maxWidth: '84%', whiteSpace: 'pre-line' }
                              : m.isError
                              ? { background: '#FFF5F5', borderColor: '#FECACA', color: '#DC2626', maxWidth: '84%' }
                              : { whiteSpace: 'pre-line' }
                          }
                        >
                          {m.text.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                            part.startsWith('**')
                              ? <strong key={j}>{part.slice(2, -2)}</strong>
                              : part
                          )}
                          {m.isStreaming && m.text && (
                            <span className="cb-cursor" />
                          )}
                        </div>
                      ) : (
                        <div className="cb-msg-user">{m.text}</div>
                      )}
                    </div>

                    {/* Contact action button */}
                    {m.role === 'bot' && m.isContact && !m.isStreaming && (
                      <div style={{ paddingLeft: 36, marginTop: 6 }}>
                        <a
                          href="mailto:nour.chaabouni@medianet.com.tn"
                          className="cb-contact-btn"
                        >
                          Envoyer un message
                        </a>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator — only while waiting for first token */}
                {isStreaming && messages[messages.length - 1]?.text === '' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div className="cb-msg-avatar">AI</div>
                    <div className="cb-typing">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="cb-typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              <div className="cb-quick-row">
                {quick.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    disabled={isStreaming}
                    className="cb-quick-btn"
                  >
                    {q}
                  </button>
                ))}
                <button
                  onClick={escalate}
                  disabled={isStreaming}
                  className="cb-quick-btn cb-quick-escalate"
                >
                  Conseiller
                </button>
              </div>

              {/* Input */}
              <div className="cb-input-row">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isStreaming && send()}
                  placeholder={isStreaming ? 'Génération en cours…' : 'Votre message…'}
                  disabled={isStreaming}
                  className="cb-input"
                />
                <button
                  onClick={() => send()}
                  disabled={isStreaming || !input.trim()}
                  className="cb-send-btn"
                  aria-label="Envoyer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            /* ── FAQ tab ── */
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {FAQ.map((f, i) => (
                <details key={i} className="cb-faq-item">
                  <summary className="cb-faq-summary">
                    {f.q}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </summary>
                  <div className="cb-faq-body">{f.a}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FAB ── */}
      <div style={{ position: 'relative' }}>
        {!open && <span className="cb-fab-ring" />}
        <button
          onClick={() => setOpen((o) => !o)}
          className="cb-fab"
          aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        >
          {open ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          )}
        </button>
        {!open && (
          <span className="cb-fab-badge">1</span>
        )}
      </div>
    </div>
  );
}

// ─── Stats section ────────────────────────────────────────────────
function StatsSection() {
  const [ref, inView] = useInView(0.3);
  const s1 = useCounter(120, 1600, inView);
  const s2 = useCounter(45, 1400, inView);
  const s3 = useCounter(24, 1200, inView);

  return (
    <section ref={ref} className="hp-stats-section">
      <div className="hp-stats-dots" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', position: 'relative' }}>
        <div className="hp-stats-grid">
          {[
            { value: s1, suffix: '+',     label: 'Startups accompagnées',   sub: 'depuis 2018',            color: '#1D77E6' },
            { value: s2, suffix: '+',     label: 'Investisseurs partenaires',sub: 'réseau actif',           color: '#F59E0B' },
            { value: s3, suffix: 'M DT+', label: 'Levées de fonds',         sub: 'cumulées',               color: '#10b981' },
            { value: 87, suffix: '%',     label: 'Taux de réussite',         sub: 'au-dessus de la moyenne',color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className="hp-stat-card">
              <div style={{ fontSize: 48, fontWeight: 900, color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>
                {inView ? s.value : 0}{s.suffix}
              </div>
              <div className="hp-stat-label">{s.label}</div>
              <div className="hp-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Hero constants ───────────────────────────────────────────────
const HERO_SECTOR_COLOR: Record<string, { bg: string; icon: string; light: string }> = {
  FinTech:  { bg: '#EEF2FF', icon: '#6366F1', light: '#E0E7FF' },
  EdTech:   { bg: '#F5F3FF', icon: '#8B5CF6', light: '#EDE9FE' },
  CleanTech:{ bg: '#ECFDF5', icon: '#10B981', light: '#D1FAE5' },
  'AI/ML':  { bg: '#FFF0F3', icon: '#EC4899', light: '#FCE7F3' },
};

const HERO_SECTOR_COLOR_DARK: Record<string, { bg: string; icon: string; light: string }> = {
  FinTech:  { bg: '#1e1b4b', icon: '#818CF8', light: '#312e81' },
  EdTech:   { bg: '#2e1065', icon: '#a78bfa', light: '#4c1d95' },
  CleanTech:{ bg: '#064e3b', icon: '#34d399', light: '#065f46' },
  'AI/ML':  { bg: '#500724', icon: '#f472b6', light: '#831843' },
};

const HERO_SECTOR_ICON: Record<string, JSX.Element> = {
  FinTech: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  EdTech: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  CleanTech: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12m0 0C12 6 6 4 3 7c0 5 4 9 9 9zm0 0c0-6 6-8 9-5-1 5-4 9-9 9"/>
    </svg>
  ),
  'AI/ML': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    </svg>
  ),
};

const HERO_BLOBS = [
  { w: 380, h: 380, top: -10, left: 15,  color: 'rgba(96,165,250,0.22)'  },
  { w: 280, h: 280, top:  35, left: -4,  color: 'rgba(167,243,208,0.25)' },
  { w: 220, h: 220, top:  58, left: 52,  color: 'rgba(196,181,253,0.20)' },
  { w: 300, h: 300, top: -14, left: 70,  color: 'rgba(251,207,232,0.22)' },
  { w: 190, h: 190, top:  48, left: 80,  color: 'rgba(253,230,138,0.18)' },
  { w: 240, h: 240, top:  18, left: 38,  color: 'rgba(134,239,172,0.15)' },
];

const HERO_BLOBS_DARK = [
  { w: 380, h: 380, top: -10, left: 15,  color: 'rgba(96,165,250,0.08)'  },
  { w: 280, h: 280, top:  35, left: -4,  color: 'rgba(167,243,208,0.06)' },
  { w: 220, h: 220, top:  58, left: 52,  color: 'rgba(196,181,253,0.07)' },
  { w: 300, h: 300, top: -14, left: 70,  color: 'rgba(251,207,232,0.05)' },
  { w: 190, h: 190, top:  48, left: 80,  color: 'rgba(253,230,138,0.05)' },
  { w: 240, h: 240, top:  18, left: 38,  color: 'rgba(134,239,172,0.05)' },
];

// ─── Main ─────────────────────────────────────────────────────────
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!mounted) return null;

  const blobs = isDark ? HERO_BLOBS_DARK : HERO_BLOBS;

  const progs = [
    { id: '1', titre: 'Programme FinTech 2026',   sector: 'FinTech',   dateFin: '2026-06-30', quota: 10 },
    { id: '2', titre: 'Programme EdTech 2026',    sector: 'EdTech',    dateFin: '2026-07-15', quota: 8  },
    { id: '3', titre: 'Programme CleanTech 2026', sector: 'CleanTech', dateFin: '2026-08-31', quota: 6  },
    { id: '4', titre: 'Programme AI/ML 2026',     sector: 'AI/ML',     dateFin: '2026-09-30', quota: 5  },
  ];

  const features = [
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
      title: 'Mise en Relation IA',
      desc: 'Algorithme intelligent connectant votre startup aux bons investisseurs et mentors.',
      color: '#1D77E6',
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
      title: 'Suivi en Temps Réel',
      desc: 'Tableaux de bord KPIs, jalons et rapports de performance pour piloter votre croissance.',
      color: '#F59E0B',
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
      title: 'Réseau International',
      desc: 'Accès à 45+ investisseurs, fonds et partenaires stratégiques en Afrique et en Europe.',
      color: '#10b981',
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      title: 'Accompagnement Expert',
      desc: 'Mentorat dédié 2h/semaine, ateliers sectoriels et coaching juridique & financier.',
      color: '#8b5cf6',
    },
  ];

  const testimonials = [
    {
      name: 'Ahmed Trabelsi', role: 'CEO, PayTunis', init: 'AT', stars: 5,
      quote: 'MediaNet nous a mis en relation avec Africinvest en 3 semaines. La plateforme a complètement transformé notre trajectoire de financement.',
    },
    {
      name: 'Samia Belhadj', role: 'Dir. Investissements, Africinvest', init: 'SB', stars: 5,
      quote: "L'algorithme de matching nous a fait gagner un temps précieux. Deux de nos meilleurs deals viennent de cette plateforme.",
    },
    {
      name: 'Imen Ben Ammar', role: 'PDG, EduLearn TN', init: 'IB', stars: 5,
      quote: 'Du premier formulaire au Demo Day, tout était fluide. Le programme de mentorat est remarquable — merci MediaNet !',
    },
  ];

  const process = [
    { step: '01', title: 'Créez votre compte',      desc: 'Inscription en 2 minutes, un seul espace pour gérer toutes vos candidatures.'             },
    { step: '02', title: 'Choisissez votre voie',   desc: 'Programme sectoriel avec dates fixes ou candidature spontanée examinée sous 48h.'         },
    { step: '03', title: 'Soumettez votre dossier', desc: 'Formulaire dédié par programme : startup, équipe, projet et pitch deck.'                  },
    { step: '04', title: 'Suivi & évaluation',      desc: 'Suivez le statut en temps réel depuis votre tableau de bord startup.'                     },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        :root {
          --hp-bg-primary:       #f8fafc;
          --hp-bg-secondary:     #f1f5f9;
          --hp-hero-bg:          #EFF6FF;
          --hp-text-primary:     #0f172a;
          --hp-text-secondary:   #1e293b;
          --hp-text-muted:       #64748b;
          --hp-text-desc:        #475569;
          --hp-card-bg:          rgba(255,255,255,0.92);
          --hp-card-border:      rgba(255,255,255,0.95);
          --hp-card-shadow:      0 4px 6px rgba(0,0,0,.04), 0 24px 64px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.9);
          --hp-item-bg:          #fff;
          --hp-item-border:      rgba(15,23,42,0.07);
          --hp-input-bg:         #f8fafc;
          --hp-input-border:     rgba(15,23,42,0.1);
          --hp-msg-bot-bg:       #f8fafc;
          --hp-msg-bot-border:   rgba(15,23,42,0.08);
          --hp-msg-bot-color:    #0f172a;
          --hp-faq-bg:           #fff;
          --hp-faq-body-bg:      #f8fafc;
          --hp-faq-border:       rgba(15,23,42,0.08);
          --hp-stats-outer-bg:   #f1f5f9;
          --hp-stat-card-bg:     #fff;
          --hp-stat-grid-gap:    rgba(15,23,42,0.08);
          --hp-dot-color:        rgba(29,119,230,0.06);
          --hp-process-bg:       #f1f5f9;
          --hp-process-step-bg:  #fff;
          --hp-process-step-bd:  rgba(15,23,42,0.1);
          --hp-process-line:     rgba(15,23,42,0.1);
          --hp-testi-bg:         #f8fafc;
          --hp-quick-bg:         #f1f5f9;
          --hp-quick-color:      #1D77E6;
          --hp-quick-border:     transparent;
          --hp-badge-bg:         rgba(255,255,255,0.8);
          --hp-badge-border:     rgba(0,0,0,0.07);
          --hp-prog-header-bd:   rgba(0,0,0,0.05);
          --hp-prog-row-hover-shadow: 0 4px 16px rgba(0,0,0,.08);
        }

        .dark {
          --hp-bg-primary:       #0f172a;
          --hp-bg-secondary:     #1e293b;
          --hp-hero-bg:          #0d1b2e;
          --hp-text-primary:     #f1f5f9;
          --hp-text-secondary:   #e2e8f0;
          --hp-text-muted:       #94a3b8;
          --hp-text-desc:        #cbd5e1;
          --hp-card-bg:          rgba(15,23,42,0.95);
          --hp-card-border:      rgba(255,255,255,0.08);
          --hp-card-shadow:      0 4px 6px rgba(0,0,0,.3), 0 24px 64px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05);
          --hp-item-bg:          #1e293b;
          --hp-item-border:      rgba(255,255,255,0.07);
          --hp-input-bg:         #0f172a;
          --hp-input-border:     rgba(255,255,255,0.1);
          --hp-msg-bot-bg:       #0f172a;
          --hp-msg-bot-border:   rgba(255,255,255,0.08);
          --hp-msg-bot-color:    #e2e8f0;
          --hp-faq-bg:           #1e293b;
          --hp-faq-body-bg:      #0f172a;
          --hp-faq-border:       rgba(255,255,255,0.08);
          --hp-stats-outer-bg:   #0f172a;
          --hp-stat-card-bg:     #1e293b;
          --hp-stat-grid-gap:    rgba(255,255,255,0.05);
          --hp-dot-color:        rgba(96,165,250,0.04);
          --hp-process-bg:       #0f172a;
          --hp-process-step-bg:  #1e293b;
          --hp-process-step-bd:  rgba(255,255,255,0.08);
          --hp-process-line:     rgba(255,255,255,0.08);
          --hp-testi-bg:         #0f172a;
          --hp-quick-bg:         #1e293b;
          --hp-quick-color:      #60a5fa;
          --hp-quick-border:     transparent;
          --hp-badge-bg:         rgba(30,41,59,0.9);
          --hp-badge-border:     rgba(255,255,255,0.1);
          --hp-prog-header-bd:   rgba(255,255,255,0.05);
          --hp-prog-row-hover-shadow: 0 4px 16px rgba(0,0,0,.4);
        }

        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: var(--hp-bg-primary); color: var(--hp-text-primary); }

        @keyframes hp-blink  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes hp-fadeup { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hp-scroll { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(6px);opacity:.4} }
        @keyframes cb-ping   { 75%,100%{transform:scale(1.8);opacity:0} }
        @keyframes cb-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes cb-blink  { 0%,100%{opacity:1} 50%{opacity:0} }

        /* ── Hero ── */
        .hp-hero { min-height: 100vh; position: relative; overflow: hidden; background: var(--hp-hero-bg); display: flex; align-items: center; padding: 100px 0 72px; }
        .hp-blob { position: absolute; border-radius: 50%; pointer-events: none; }
        .hp-hero-inner { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 40px; display: grid; grid-template-columns: 1fr 490px; gap: 72px; align-items: center; width: 100%; animation: hp-fadeup .7s ease both; }
        .hp-badge { display: inline-flex; align-items: center; gap: 8px; padding: 9px 20px; border-radius: 999px; background: var(--hp-badge-bg); border: 1px solid var(--hp-badge-border); backdrop-filter: blur(8px); font-size: 13.5px; font-weight: 600; color: #1D4ED8; margin-bottom: 32px; }
        .dark .hp-badge { color: #60a5fa; }
        .hp-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; animation: hp-blink 2s ease-in-out infinite; }
        .hp-h1 { font-size: clamp(48px, 5.5vw, 72px); font-weight: 900; line-height: 1.07; color: var(--hp-text-primary); margin: 0 0 24px; letter-spacing: -1.5px; }
        .hp-h1 span { color: #1D77E6; }
        .hp-desc { font-size: 17px; line-height: 1.75; color: var(--hp-text-desc); max-width: 480px; margin: 0 0 40px; }
        .hp-btns { display: flex; gap: 14px; flex-wrap: wrap; }
        .hp-btn-gold { display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; border-radius: 14px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; border: none; cursor: pointer; font-family: inherit; transition: transform .18s, box-shadow .18s; box-shadow: 0 4px 20px rgba(245,158,11,.35); }
        .hp-btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,158,11,.5); }
        .hp-btn-gold2 { display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; border-radius: 14px; background: linear-gradient(135deg, #F59E0B 0%, #B45309 100%); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; border: none; cursor: pointer; font-family: inherit; transition: transform .18s, box-shadow .18s; box-shadow: 0 4px 20px rgba(180,83,9,.3); }
        .hp-btn-gold2:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(180,83,9,.45); }
        .hp-prog-card { background: var(--hp-card-bg); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid var(--hp-card-border); box-shadow: var(--hp-card-shadow); overflow: hidden; animation: hp-fadeup .7s .2s ease both; }
        .hp-prog-header { padding: 24px 28px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--hp-prog-header-bd); }
        .hp-prog-title { font-size: 17px; font-weight: 800; color: var(--hp-text-primary); letter-spacing: -.3px; }
        .hp-prog-live { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #16A34A; }
        .hp-prog-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; animation: hp-blink 2s ease-in-out infinite; }
        .hp-prog-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
        .hp-prog-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; border: 1px solid rgba(0,0,0,.05); text-decoration: none; transition: transform .15s, box-shadow .15s; cursor: pointer; }
        .dark .hp-prog-row { border-color: rgba(255,255,255,0.05); }
        .hp-prog-row:hover { transform: translateX(3px); box-shadow: var(--hp-prog-row-hover-shadow); }
        .hp-prog-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .hp-prog-info { flex: 1; }
        .hp-prog-name { font-size: 14px; font-weight: 700; color: var(--hp-text-primary); margin: 0 0 3px; }
        .hp-prog-places { font-size: 12.5px; color: var(--hp-text-muted); font-weight: 500; margin: 0; }
        .hp-prog-status { font-size: 13px; font-weight: 700; color: #16A34A; }
        .hp-prog-footer { padding: 16px 20px 20px; }
        .hp-prog-cta { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 18px; border-radius: 14px; background: linear-gradient(135deg, #06B6D4 0%, #F59E0B 100%); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; font-family: inherit; transition: transform .18s, box-shadow .18s; box-shadow: 0 4px 18px rgba(6,182,212,.3); }
        .hp-prog-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(6,182,212,.4); }
        .hp-scroll-ind { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .hp-scroll-mouse { width: 24px; height: 38px; border: 2px solid rgba(15,23,42,.2); border-radius: 12px; display: flex; justify-content: center; padding: 4px 0; }
        .dark .hp-scroll-mouse { border-color: rgba(255,255,255,.2); }
        .hp-scroll-dot { width: 3px; height: 8px; border-radius: 2px; background: #1D77E6; animation: hp-scroll 1.6s ease infinite; }

        /* ── Stats ── */
        .hp-stats-section { padding: 80px 0; background: var(--hp-stats-outer-bg); position: relative; overflow: hidden; }
        .hp-stats-dots { position: absolute; inset: 0; background-image: radial-gradient(circle at 1px 1px, var(--hp-dot-color) 1px, transparent 0); background-size: 40px 40px; }
        .hp-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); border-radius: 20px; overflow: hidden; border: 1px solid var(--hp-stat-grid-gap); gap: 1px; background: var(--hp-stat-grid-gap); }
        .hp-stat-card { padding: 40px 32px; background: var(--hp-stat-card-bg); display: flex; flex-direction: column; gap: 8px; }
        .hp-stat-label { font-size: 15px; font-weight: 700; color: var(--hp-text-primary); }
        .hp-stat-sub   { font-size: 12px; color: var(--hp-text-muted); }

        /* ── Features ── */
        .hp-features-section { padding: 96px 0; background: var(--hp-bg-primary); }
        .hp-feature-card { padding: 28px; border-radius: 18px; background: var(--hp-item-bg); border: 1px solid var(--hp-item-border); transition: all .3s; }
        .hp-feature-card:hover { transform: translateY(-4px); border-color: #1D77E6; box-shadow: 0 12px 32px rgba(29,119,230,.1); }
        .hp-feature-title { font-size: 16px; font-weight: 800; margin: 0 0 10px; color: var(--hp-text-primary); }
        .hp-feature-desc  { font-size: 14px; line-height: 1.7; color: var(--hp-text-muted); margin: 0; }
        .hp-section-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #1D77E6; margin-bottom: 12px; }
        .hp-section-h2 { font-size: clamp(30px, 4vw, 44px); font-weight: 900; margin: 0; color: var(--hp-text-primary); letter-spacing: -.5px; }
        .hp-section-h2 span { color: #1D77E6; }

        /* ── Process ── */
        .hp-process-section { padding: 96px 0; background: var(--hp-process-bg); }
        .hp-process-step-circle-active   { width: 56px; height: 56px; border-radius: 50%; background: #1D77E6; border: 2px solid #1D77E6; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .hp-process-step-circle-inactive { width: 56px; height: 56px; border-radius: 50%; background: var(--hp-process-step-bg); border: 2px solid var(--hp-process-step-bd); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .hp-process-line { position: absolute; top: 28px; left: 12.5%; right: 12.5%; height: 1px; background: var(--hp-process-line); z-index: 0; }
        .hp-process-step-title { font-size: 15px; font-weight: 800; margin: 0 0 8px; color: var(--hp-text-primary); }
        .hp-process-step-desc  { font-size: 13px; line-height: 1.6; color: var(--hp-text-muted); margin: 0; }

        /* ── Testimonials ── */
        .hp-testi-section { padding: 96px 0; background: var(--hp-testi-bg); }
        .hp-testi-card { padding: 28px; border-radius: 18px; background: var(--hp-item-bg); border: 1px solid var(--hp-item-border); transition: all .3s; }
        .hp-testi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
        .hp-testi-quote { font-size: 14px; line-height: 1.75; color: var(--hp-text-muted); margin: 0 0 20px; font-style: italic; }
        .hp-testi-name  { margin: 0; font-size: 14px; font-weight: 700; color: var(--hp-text-primary); }
        .hp-testi-role  { margin: 0; font-size: 12px; color: var(--hp-text-muted); }

        /* ── CTA ── */
        .hp-cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .2s; text-decoration: none; border: none; font-family: inherit; }
        .hp-cta-primary { background: #1D77E6; color: #fff; box-shadow: 0 4px 18px rgba(29,119,230,.35); }
        .hp-cta-primary:hover { background: #1558c0; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(29,119,230,.5); }
        .hp-cta-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,.3); color: #fff; }
        .hp-cta-ghost:hover { border-color: #F59E0B; color: #F59E0B; }

        /* ════════════════════════════════════════════
           CHATBOT — premium redesign
        ════════════════════════════════════════════ */
        .cb-window {
          position: absolute; bottom: 76px; right: 0;
          width: 368px; border-radius: 20px; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.06);
          display: flex; flex-direction: column; height: 540px;
          background: var(--hp-item-bg);
        }

        /* Header */
        .cb-header {
          background: linear-gradient(135deg, #080f1e 0%, #0a1f4e 100%);
          padding: 18px 20px 0;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .cb-avatar {
          width: 40px; height: 40px; border-radius: 11px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cb-header-title {
          color: #fff; font-weight: 700; font-size: 13.5px; margin: 0 0 2px;
          letter-spacing: -.2px;
        }
        .cb-header-status {
          color: rgba(255,255,255,.45); font-size: 11.5px; margin: 0;
          display: flex; align-items: center; gap: 5px;
        }
        .cb-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          display: inline-block; transition: background .4s;
        }
        .cb-close-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
          color: rgba(255,255,255,.6); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .cb-close-btn:hover { background: rgba(255,255,255,.14); color: #fff; }

        /* Tabs */
        .cb-tabs {
          display: flex; gap: 0; margin-top: 14px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .cb-tab-btn {
          flex: 1; padding: 9px 0; border: none; background: none; cursor: pointer;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,.35);
          font-family: inherit; transition: color .2s; position: relative;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
        }
        .cb-tab-active { color: #fff; border-bottom-color: #1D77E6; }

        /* Messages area */
        .cb-messages {
          flex: 1; overflow-y: auto; padding: 18px 16px;
          display: flex; flex-direction: column; gap: 14px;
          scroll-behavior: smooth;
        }
        .cb-messages::-webkit-scrollbar { width: 4px; }
        .cb-messages::-webkit-scrollbar-track { background: transparent; }
        .cb-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,.1); border-radius: 4px; }

        /* Message bubbles */
        .cb-msg-avatar {
          width: 26px; height: 26px; border-radius: 7px;
          background: linear-gradient(135deg, #1D77E6, #0c2d6b);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 9px; font-weight: 800;
          flex-shrink: 0; letter-spacing: .5px;
        }
        .cb-msg-user {
          max-width: 78%; padding: 10px 14px;
          border-radius: 16px 16px 3px 16px;
          font-size: 13px; line-height: 1.55;
          background: linear-gradient(135deg, #1D77E6, #1558c0);
          color: #fff;
          box-shadow: 0 2px 8px rgba(29,119,230,.25);
        }
        .cb-msg-bot {
          max-width: 78%; padding: 10px 14px;
          border-radius: 16px 16px 16px 3px;
          font-size: 13px; line-height: 1.55;
          background: var(--hp-msg-bot-bg);
          color: var(--hp-msg-bot-color);
          border: 1px solid var(--hp-msg-bot-border);
        }

        /* Blinking cursor during stream */
        .cb-cursor {
          display: inline-block; width: 2px; height: 13px;
          background: #1D77E6; margin-left: 2px;
          vertical-align: middle;
          animation: cb-blink .7s step-end infinite;
        }

        /* Typing dots */
        .cb-typing {
          padding: 11px 16px; border-radius: 16px 16px 16px 3px;
          background: var(--hp-msg-bot-bg); border: 1px solid var(--hp-msg-bot-border);
          display: flex; gap: 4px; align-items: center;
        }
        .cb-typing-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #94a3b8; display: block;
          animation: cb-bounce 1.1s ease infinite;
        }

        /* Contact CTA link */
        .cb-contact-btn {
          display: inline-block; padding: 5px 12px;
          border-radius: 6px; font-size: 11.5px; font-weight: 600;
          background: #1D77E6; color: #fff; text-decoration: none;
          letter-spacing: .2px; transition: background .15s;
        }
        .cb-contact-btn:hover { background: #1558c0; }

        /* Quick replies */
        .cb-quick-row {
          padding: 6px 16px 8px;
          display: flex; gap: 5px; overflow-x: auto; flex-shrink: 0;
        }
        .cb-quick-row::-webkit-scrollbar { display: none; }
        .cb-quick-btn {
          flex-shrink: 0; padding: 5px 11px; border-radius: 6px;
          font-size: 11.5px; font-weight: 600; cursor: pointer;
          background: var(--hp-quick-bg);
          border: 1px solid var(--hp-quick-border);
          color: var(--hp-quick-color);
          font-family: inherit;
          transition: opacity .15s, background .15s;
        }
        .cb-quick-btn:disabled { opacity: .4; cursor: default; }
        .cb-quick-escalate {
          border-color: rgba(245,158,11,.3);
          color: #B45309;
          background: #FFFBEB;
        }
        .dark .cb-quick-escalate { background: #1c1408; color: #F59E0B; border-color: rgba(245,158,11,.2); }

        /* Input row */
        .cb-input-row {
          padding: 8px 14px 14px;
          display: flex; gap: 8px; flex-shrink: 0;
          border-top: 1px solid var(--hp-item-border);
        }
        .cb-input {
          flex: 1; padding: 9px 13px; border-radius: 10px; font-size: 13px;
          border: 1px solid var(--hp-input-border);
          background: var(--hp-input-bg);
          color: var(--hp-text-primary);
          outline: none; font-family: inherit;
          transition: border-color .15s;
        }
        .cb-input:focus { border-color: #1D77E6; }
        .cb-input:disabled { opacity: .5; }
        .cb-send-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: #1D77E6; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background .2s, transform .15s;
        }
        .cb-send-btn:hover:not(:disabled) { background: #1558c0; transform: translateY(-1px); }
        .cb-send-btn:disabled { background: #94a3b8; cursor: default; }

        /* FAQ */
        .cb-faq-item { margin-bottom: 6px; border-radius: 10px; overflow: hidden; border: 1px solid var(--hp-faq-border); }
        .cb-faq-summary { padding: 11px 14px; cursor: pointer; font-size: 12.5px; font-weight: 600; color: var(--hp-text-primary); background: var(--hp-faq-bg); list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .cb-faq-body { padding: 11px 14px; font-size: 12.5px; color: var(--hp-text-muted); line-height: 1.6; border-top: 1px solid var(--hp-faq-border); background: var(--hp-faq-body-bg); }

        /* FAB */
        .cb-fab {
          position: relative; width: 54px; height: 54px; border-radius: 50%;
          background: linear-gradient(135deg, #1D77E6, #0a1f4e);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(29,119,230,.38);
          transition: transform .2s, box-shadow .2s;
        }
        .cb-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(29,119,230,.48); }
        .cb-fab-ring {
          position: absolute; inset: 0; border-radius: 50%;
          background: #1D77E6; opacity: .28;
          animation: cb-ping 1.6s cubic-bezier(0,0,.2,1) infinite;
        }
        .cb-fab-badge {
          position: absolute; top: -4px; right: -4px;
          width: 19px; height: 19px; border-radius: 50%;
          background: #F59E0B;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: #0a1628;
          border: 2px solid var(--hp-bg-primary);
        }

        @media (max-width: 960px) { .hp-hero-inner { grid-template-columns: 1fr; gap: 44px; } .hp-h1 { font-size: 44px; } }
        @media (max-width: 640px) { .hp-hero-inner { padding: 0 20px; } .hp-h1 { font-size: 36px; letter-spacing: -1px; } .cb-window { width: calc(100vw - 32px); right: 0; } }
      `}</style>

      <Navbar />

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hp-hero">
        {blobs.map((b, i) => (
          <div key={i} className="hp-blob" style={{ width: b.w, height: b.h, top: `${b.top}%`, left: `${b.left}%`, background: b.color }} />
        ))}

        <div className="hp-hero-inner">
          <div>
            <div className="hp-badge">
              <span className="hp-badge-dot" />
              5 programmes actifs — Candidatures ouvertes
            </div>
            <h1 className="hp-h1">
              Accélérez Votre <br /><span>Aventure</span><br />Startup
            </h1>
            <p className="hp-desc">
              Connectez-vous avec des investisseurs, des mentors et des ressources. MediaNet est votre passerelle vers le succès entrepreneurial.
            </p>
            <div className="hp-btns">
              <Link href="/postuler" className="hp-btn-gold">Candidater Maintenant</Link>
              <Link href="/programmes" className="hp-btn-gold2">Découvrir les Programmes</Link>
            </div>
          </div>

          <div className="hp-prog-card">
            <div className="hp-prog-header">
              <span className="hp-prog-title">Programmes Actifs</span>
              <span className="hp-prog-live">
                <span className="hp-prog-live-dot" />En Direct
              </span>
            </div>
            <div className="hp-prog-list">
              {progs.map((p) => {
                const colors = isDark ? HERO_SECTOR_COLOR_DARK[p.sector] : HERO_SECTOR_COLOR[p.sector];
                return (
                  <Link key={p.id} href={`/programmes/${p.id}`} className="hp-prog-row" style={{ background: colors.bg }}>
                    <div className="hp-prog-icon" style={{ background: colors.light }}>
                      <span style={{ color: colors.icon }}>{HERO_SECTOR_ICON[p.sector]}</span>
                    </div>
                    <div className="hp-prog-info">
                      <p className="hp-prog-name">{p.titre}</p>
                      <p className="hp-prog-places">{p.quota} places</p>
                    </div>
                    <span className="hp-prog-status">Ouvert</span>
                  </Link>
                );
              })}
            </div>
            <div className="hp-prog-footer">
              <Link href="/programmes" className="hp-prog-cta">
                Voir tous les programmes
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="hp-scroll-ind">
          <div className="hp-scroll-mouse"><div className="hp-scroll-dot" /></div>
        </div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <StatsSection />

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="hp-features-section">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="hp-section-eyebrow">Pourquoi MediaNet</p>
            <h2 className="hp-section-h2">Tout pour réussir votre <span>incubation</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} className="hp-feature-card">
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 20 }}>
                  {f.icon}
                </div>
                <h3 className="hp-feature-title">{f.title}</h3>
                <p className="hp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PROCESS ══════════════════ */}
      <section className="hp-process-section">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="hp-section-eyebrow">Comment ça marche</p>
            <h2 className="hp-section-h2">4 étapes vers l'incubation</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', position: 'relative' }}>
            <div className="hp-process-line" />
            {process.map((step, i) => (
              <div key={i} style={{ padding: '0 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div className={i === 0 ? 'hp-process-step-circle-active' : 'hp-process-step-circle-inactive'}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? '#fff' : 'var(--hp-text-muted)' }}>{step.step}</span>
                </div>
                <h3 className="hp-process-step-title">{step.title}</h3>
                <p className="hp-process-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href="/login" className="hp-cta-btn hp-cta-primary">
              Commencer maintenant
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="hp-testi-section">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="hp-section-eyebrow">Témoignages</p>
            <h2 className="hp-section-h2">Ce que nos <span>entrepreneurs</span> disent</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="hp-testi-card">
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[...Array(t.stars)].map((_, j) => (
                    <svg key={j} width="14" height="14" viewBox="0 0 20 20" fill="#F59E0B">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <blockquote className="hp-testi-quote">"{t.quote}"</blockquote>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `hsl(${i * 80 + 200},55%,48%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    {t.init}
                  </div>
                  <div>
                    <p className="hp-testi-name">{t.name}</p>
                    <p className="hp-testi-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 60%, #0a1628 100%)', padding: '96px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.08) 0%, transparent 70%)' }} aria-hidden="true" />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 40px', position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 20, background: 'rgba(255,255,255,.08)', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', animation: 'hp-blink 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>Places limitées disponibles</span>
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, color: '#fff', margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-1px' }}>
            Prêt à transformer<br /><span style={{ color: '#F59E0B' }}>votre startup ?</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.65)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.75 }}>
            Rejoignez notre prochaine cohorte et bénéficiez d&apos;un accompagnement sur-mesure pour accélérer votre croissance.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="hp-btn-gold">Candidater maintenant</Link>
            <Link href="/contact" className="hp-cta-btn hp-cta-ghost">Nous contacter</Link>
          </div>
        </div>
      </section>

      <Footer />
      <Chatbot />
    </>
  );
}