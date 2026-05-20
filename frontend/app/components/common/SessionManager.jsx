'use client';

import { useState, useEffect, useMemo } from 'react';

// ─── Icons (SVG uniquement, sans emoji) ────────────────────────────────────
const Icon = {
  x: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  ),
  video: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
    </svg>
  ),
  building: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  user: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  ),
  link: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
    </svg>
  ),
  send: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
    </svg>
  ),
  bell: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
    </svg>
  ),
  trash: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  chevronDown: (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
    </svg>
  ),
  filter: (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
    </svg>
  ),
  clock: (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  presentation: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
    </svg>
  ),
};

// ─── Types de sessions ────────────────────────────────────────────────────
const SESSION_TYPES = [
  {
    id: 'workshop',
    label: 'Workshop',
    description: 'Atelier pratique en groupe',
    color: '#6d28d9',
    bg: 'rgba(109,40,217,0.08)',
    border: 'rgba(109,40,217,0.25)',
  },
  {
    id: 'formation',
    label: 'Formation',
    description: 'Module de formation structuré',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
  },
  {
    id: 'conference',
    label: 'Conférence',
    description: 'Présentation ou keynote',
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.25)',
  },
  {
    id: 'pitching',
    label: 'Pitch & Investisseurs',
    description: 'Session de pitch face à des investisseurs',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.25)',
  },
  {
    id: 'mentoring',
    label: 'Mentorat one-to-one',
    description: 'Session individuelle mentor / startup',
    color: '#db2777',
    bg: 'rgba(219,39,119,0.08)',
    border: 'rgba(219,39,119,0.25)',
  },
];

const TYPE_MAP = Object.fromEntries(SESSION_TYPES.map(t => [t.id, t]));

const DOMAINS = [
  'Finance','Marketing','Juridique','Technologie','Produit','Fundraising',
  'Opérations','RH','Stratégie','FinTech','AgriTech','HealthTech','Autre',
];

const STATUS_CONFIG = {
  upcoming: { label: 'À venir',   color: '#006d94', bg: 'rgba(0,109,148,0.1)'  },
  ongoing:  { label: 'En cours',  color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  done:     { label: 'Terminée', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  cancelled:{ label: 'Annulée', color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
  pending:  { label: 'En attente', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const MOCK_MENTORS = [
  { _id: 'men-1', name: 'Rania Souissi',  expertise: 'Growth & Marketing', initials: 'RS' },
  { _id: 'men-2', name: 'Yassine Khelif', expertise: 'Product & Tech',     initials: 'YK' },
  { _id: 'men-3', name: 'Amira Hamdani',  expertise: 'Finance & Stratégie',initials: 'AH' },
  { _id: 'men-4', name: 'Tarek Bouzid',   expertise: 'B2B Sales & Ops',    initials: 'TB' },
  { _id: 'men-5', name: 'Sonia Trabelsi', expertise: 'Juridique',          initials: 'ST' },
];

const EMPTY_SESSION = {
  type: '',
  title: '',
  domain: '',
  description: '',
  date: '',
  time: '',
  duration: 60,
  isOnline: true,
  location: '',
  meetLink: '',
  calendarLink: '',
  capacity: 20,
  targetMode: 'all',
  selectedProgrammes: [],
  selectedStartups: [],
  speakers: [],
  mentorId: '',
  startupId: '',
  notifyMentor: true,
  notifyStartup: true,
  customNotificationBody: '',
  status: 'upcoming',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function SessionManager({ isOpen, onClose, startups = [], mentors = [] }) {
  const allMentors = mentors.length ? mentors : MOCK_MENTORS;

  const [view,         setView]         = useState('list'); // 'list' | 'create' | 'detail'
  const [sessions,     setSessions]     = useState(SEED_SESSIONS);
  const [filterType,   setFilterType]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected,     setSelected]     = useState(null);
  const [form,         setForm]         = useState({ ...EMPTY_SESSION });
  const [step,         setStep]         = useState(1); // étapes wizard 1→4
  const [saving,       setSaving]       = useState(false);
  const [notification, setNotification] = useState(null);
  const [speakerInput, setSpeakerInput] = useState({ name: '', email: '', role: '' });
  const [showSpeakerForm, setShowSpeakerForm] = useState(false);

  useEffect(() => {
    if (!isOpen) { setView('list'); setStep(1); }
  }, [isOpen]);

  const filtered = useMemo(() =>
    sessions.filter(s =>
      (filterType === 'all' || s.type === filterType) &&
      (filterStatus === 'all' || s.status === filterStatus)
    ), [sessions, filterType, filterStatus]);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    const newSession = {
      ...form,
      _id: `sess-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    if (form.type === 'mentoring' && form.notifyMentor) {
      notify('Session créée. Notifications envoyées au mentor et à la startup.', 'success');
    } else {
      notify('Session créée avec succès.', 'success');
    }
    setSaving(false);
    setForm({ ...EMPTY_SESSION });
    setStep(1);
    setView('list');
  };

  const handleDelete = (id) => {
    setSessions(prev => prev.filter(s => s._id !== id));
    setView('list');
    setSelected(null);
    notify('Session supprimée.', 'info');
  };

  const addSpeaker = () => {
    if (!speakerInput.name) return;
    setForm(p => ({ ...p, speakers: [...p.speakers, { ...speakerInput }] }));
    setSpeakerInput({ name: '', email: '', role: '' });
    setShowSpeakerForm(false);
  };

  const removeSpeaker = (i) =>
    setForm(p => ({ ...p, speakers: p.speakers.filter((_, idx) => idx !== i) }));

  if (!isOpen) return null;

  const typeObj = TYPE_MAP[form.type];
  const isMentoring = form.type === 'mentoring';
  const canProceed1 = form.type && form.title && form.domain;
  const canProceed2 = form.date && form.time;
  const canProceed3 = isMentoring ? (form.mentorId && form.startupId) : true;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%',
          maxWidth: view === 'create' ? '760px' : '900px',
          maxHeight: '92vh',
          background: 'var(--color-bg, #ffffff)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 32px 80px -12px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'all',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: view === 'create' ? 'rgba(0,109,148,0.03)' : 'transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {(view === 'create' || view === 'detail') && (
                <button
                  onClick={() => { setView('list'); setStep(1); setSelected(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#6b7280',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                  Retour
                </button>
              )}
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {view === 'list'   && 'Gestion des sessions'}
                  {view === 'create' && 'Nouvelle session'}
                  {view === 'detail' && selected?.title}
                </h2>
                {view === 'create' && (
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                    Étape {step} / 4
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {view === 'list' && (
                <button
                  onClick={() => { setView('create'); setStep(1); setForm({ ...EMPTY_SESSION }); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 16px',
                    background: '#006d94',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {Icon.plus}
                  Créer une session
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  width: '32px', height: '32px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '8px',
                  background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                {Icon.x}
              </button>
            </div>
          </div>

          {/* ── Notification toast ── */}
          {notification && (
            <div style={{
              margin: '0.75rem 1.75rem 0',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              background: notification.type === 'success' ? 'rgba(5,150,105,0.1)' : 'rgba(0,109,148,0.1)',
              color: notification.type === 'success' ? '#065f46' : '#006d94',
              border: `1px solid ${notification.type === 'success' ? 'rgba(5,150,105,0.2)' : 'rgba(0,109,148,0.2)'}`,
              display: 'flex', alignItems: 'center', gap: '8px',
              flexShrink: 0,
            }}>
              {Icon.check}
              {notification.msg}
            </div>
          )}

          {/* ── Body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

            {/* ════════════ LIST VIEW ════════════ */}
            {view === 'list' && (
              <div>
                {/* Filtres */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
                    {Icon.filter}
                    <span style={{ fontSize: '13px' }}>Filtrer :</span>
                  </div>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="all">Tous les types</option>
                    {SESSION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="all">Tous les statuts</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '12px', color: '#9ca3af', alignSelf: 'center', marginLeft: 'auto' }}>
                    {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Liste */}
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      margin: '0 auto 1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#d1d5db',
                    }}>
                      {Icon.calendar}
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280', margin: '0 0 6px' }}>
                      Aucune session trouvée
                    </p>
                    <p style={{ fontSize: '13px', margin: 0 }}>Ajustez les filtres ou créez une nouvelle session.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map(s => <SessionRow key={s._id} session={s} onSelect={() => { setSelected(s); setView('detail'); }} />)}
                  </div>
                )}
              </div>
            )}

            {/* ════════════ CREATE WIZARD ════════════ */}
            {view === 'create' && (
              <div>
                {/* Barre d'étapes */}
                <StepBar current={step} total={4} />

                {/* ── Étape 1 : Type & infos de base ── */}
                {step === 1 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <Label>Type de session</Label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
                      {SESSION_TYPES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setForm(p => ({ ...p, type: t.id }))}
                          style={{
                            padding: '14px 12px',
                            border: `2px solid ${form.type === t.id ? t.color : 'rgba(0,0,0,0.07)'}`,
                            borderRadius: '10px',
                            background: form.type === t.id ? t.bg : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700, color: t.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {t.label}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.4 }}>{t.description}</div>
                          {form.type === t.id && (
                            <div style={{ marginTop: '6px', color: t.color }}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <Field label="Titre de la session *">
                        <input
                          style={inputStyle}
                          placeholder="Ex : Pitch Clinic — Panel Investisseurs Seed"
                          value={form.title}
                          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        />
                      </Field>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Field label="Domaine">
                          <select style={inputStyle} value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}>
                            <option value="">Sélectionner…</option>
                            {DOMAINS.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </Field>
                        <Field label="Capacité (participants)">
                          <input
                            type="number" min="1" style={inputStyle}
                            value={form.capacity}
                            onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                          />
                        </Field>
                      </div>
                      <Field label="Description">
                        <textarea
                          rows={3}
                          style={{ ...inputStyle, resize: 'none' }}
                          placeholder="Objectifs, programme, prérequis…"
                          value={form.description}
                          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* ── Étape 2 : Date, heure, lieu ── */}
                {step === 2 && (
                  <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <Field label="Date *">
                        <input type="date" style={inputStyle} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                      </Field>
                      <Field label="Heure *">
                        <input type="time" style={inputStyle} value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                      </Field>
                      <Field label="Durée (min)">
                        <input type="number" min="15" step="15" style={inputStyle} value={form.duration} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))} />
                      </Field>
                    </div>

                    {/* Toggle online / présentiel */}
                    <div style={{
                      padding: '1rem',
                      border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.015)',
                    }}>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: form.isOnline ? '1rem' : '0' }}>
                        {[
                          { val: true,  icon: Icon.video,    label: 'En ligne' },
                          { val: false, icon: Icon.building, label: 'Présentiel' },
                        ].map(opt => (
                          <button
                            key={String(opt.val)}
                            onClick={() => setForm(p => ({ ...p, isOnline: opt.val }))}
                            style={{
                              flex: 1,
                              padding: '10px',
                              border: `2px solid ${form.isOnline === opt.val ? '#006d94' : 'rgba(0,0,0,0.07)'}`,
                              borderRadius: '8px',
                              background: form.isOnline === opt.val ? 'rgba(0,109,148,0.06)' : 'transparent',
                              color: form.isOnline === opt.val ? '#006d94' : '#6b7280',
                              fontSize: '13px', fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                            }}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                      {form.isOnline ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          <Field label="Lien de réunion (Meet, Zoom…)">
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>{Icon.link}</div>
                              <input
                                style={{ ...inputStyle, paddingLeft: '36px' }}
                                placeholder="https://meet.google.com/…"
                                value={form.meetLink}
                                onChange={e => setForm(p => ({ ...p, meetLink: e.target.value }))}
                              />
                            </div>
                          </Field>
                          <Field label="Lien Google Calendar (optionnel)">
                            <input
                              style={inputStyle}
                              placeholder="https://calendar.google.com/…"
                              value={form.calendarLink}
                              onChange={e => setForm(p => ({ ...p, calendarLink: e.target.value }))}
                            />
                          </Field>
                        </div>
                      ) : (
                        <Field label="Lieu exact">
                          <input
                            style={inputStyle}
                            placeholder="Bâtiment, salle, adresse complète"
                            value={form.location}
                            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                          />
                        </Field>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Étape 3 : Intervenants / Cibles ── */}
                {step === 3 && (
                  <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem' }}>

                    {isMentoring ? (
                      /* ── Mode mentorat ── */
                      <div>
                        <div style={{
                          padding: '12px 16px',
                          background: 'rgba(219,39,119,0.06)',
                          border: '1px solid rgba(219,39,119,0.2)',
                          borderRadius: '10px',
                          marginBottom: '1rem',
                        }}>
                          <p style={{ fontSize: '13px', color: '#9d174d', fontWeight: 500, margin: 0 }}>
                            Session mentorat one-to-one — Le mentor et la startup seront notifiés par notification et e-mail.
                          </p>
                        </div>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          <Field label="Mentor *">
                            <select style={inputStyle} value={form.mentorId} onChange={e => setForm(p => ({ ...p, mentorId: e.target.value }))}>
                              <option value="">Sélectionner un mentor…</option>
                              {allMentors.map(m => (
                                <option key={m._id} value={m._id}>
                                  {m.name}{m.expertise ? ` — ${m.expertise}` : ''}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Startup *">
                            <select style={inputStyle} value={form.startupId} onChange={e => setForm(p => ({ ...p, startupId: e.target.value }))}>
                              <option value="">Sélectionner une startup…</option>
                              {startups.map(s => (
                                <option key={s.id || s._id} value={s.id || s._id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>
                      </div>
                    ) : (
                      /* ── Mode collectif ── */
                      <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {/* Ciblage */}
                        <div>
                          <Label>Audience cible</Label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                              { val: 'all',       label: 'Toutes les startups' },
                              { val: 'programme', label: 'Par programme' },
                              { val: 'specific',  label: 'Startups spécifiques' },
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setForm(p => ({ ...p, targetMode: opt.val }))}
                                style={{
                                  flex: 1, padding: '8px',
                                  border: `1.5px solid ${form.targetMode === opt.val ? '#006d94' : 'rgba(0,0,0,0.08)'}`,
                                  borderRadius: '8px',
                                  background: form.targetMode === opt.val ? 'rgba(0,109,148,0.07)' : 'transparent',
                                  color: form.targetMode === opt.val ? '#006d94' : '#6b7280',
                                  fontSize: '12px', fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {form.targetMode === 'specific' && startups.length > 0 && (
                          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '10px' }}>
                            {startups.map(s => {
                              const sid = s.id || s._id;
                              const sel = form.selectedStartups.includes(sid);
                              return (
                                <div
                                  key={sid}
                                  onClick={() => setForm(p => ({
                                    ...p,
                                    selectedStartups: sel
                                      ? p.selectedStartups.filter(x => x !== sid)
                                      : [...p.selectedStartups, sid],
                                  }))}
                                  style={{
                                    padding: '10px 14px',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    cursor: 'pointer',
                                    background: sel ? 'rgba(0,109,148,0.05)' : 'transparent',
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                  }}
                                >
                                  <div style={{
                                    width: '20px', height: '20px', borderRadius: '5px',
                                    border: `2px solid ${sel ? '#006d94' : 'rgba(0,0,0,0.15)'}`,
                                    background: sel ? '#006d94' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', flexShrink: 0,
                                  }}>
                                    {sel && <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                                  </div>
                                  <span style={{ fontSize: '13px', color: '#374151' }}>{s.name}</span>
                                  {s.sector && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>{s.sector}</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Intervenants / Speakers */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <Label>Intervenants / Speakers</Label>
                            <button
                              onClick={() => setShowSpeakerForm(!showSpeakerForm)}
                              style={{
                                fontSize: '12px', color: '#006d94', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '5px',
                                background: 'none', border: 'none', cursor: 'pointer',
                              }}
                            >
                              {Icon.plus} Ajouter
                            </button>
                          </div>

                          {showSpeakerForm && (
                            <div style={{
                              padding: '12px',
                              border: '1px solid rgba(0,109,148,0.2)',
                              borderRadius: '10px',
                              background: 'rgba(0,109,148,0.03)',
                              marginBottom: '10px',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr auto',
                              gap: '8px',
                              alignItems: 'end',
                            }}>
                              <Field label="Nom *">
                                <input style={inputStyle} placeholder="Nom complet" value={speakerInput.name} onChange={e => setSpeakerInput(p => ({ ...p, name: e.target.value }))} />
                              </Field>
                              <Field label="E-mail">
                                <input style={inputStyle} placeholder="email@…" value={speakerInput.email} onChange={e => setSpeakerInput(p => ({ ...p, email: e.target.value }))} />
                              </Field>
                              <Field label="Rôle / Titre">
                                <input style={inputStyle} placeholder="Ex : Investisseur" value={speakerInput.role} onChange={e => setSpeakerInput(p => ({ ...p, role: e.target.value }))} />
                              </Field>
                              <button onClick={addSpeaker} disabled={!speakerInput.name} style={{
                                height: '38px', padding: '0 14px',
                                background: '#006d94', color: '#fff', border: 'none', borderRadius: '8px',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                              }}>
                                OK
                              </button>
                            </div>
                          )}

                          {form.speakers.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {form.speakers.map((sp, i) => (
                                <div key={i} style={{
                                  padding: '10px 14px',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                  borderRadius: '8px',
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                }}>
                                  <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: '#006d94', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 700,
                                  }}>
                                    {sp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#111827' }}>{sp.name}</p>
                                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                                      {[sp.role, sp.email].filter(Boolean).join(' · ')}
                                    </p>
                                  </div>
                                  <button onClick={() => removeSpeaker(i)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
                                    {Icon.trash}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {form.speakers.length === 0 && !showSpeakerForm && (
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Aucun intervenant ajouté</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Étape 4 : Notifications & récapitulatif ── */}
                {step === 4 && (
                  <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem' }}>
                    {/* Récapitulatif */}
                    <div style={{
                      padding: '1.25rem',
                      border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.015)',
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                        Récapitulatif
                      </p>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <SummaryRow label="Type"     value={typeObj?.label || '—'} />
                        <SummaryRow label="Titre"    value={form.title || '—'} />
                        <SummaryRow label="Domaine"  value={form.domain || '—'} />
                        <SummaryRow label="Date"     value={form.date && form.time ? `${form.date} à ${form.time}` : '—'} />
                        <SummaryRow label="Durée"    value={form.duration ? `${form.duration} min` : '—'} />
                        <SummaryRow label="Lieu"     value={form.isOnline ? (form.meetLink || 'En ligne (lien non renseigné)') : (form.location || 'Non renseigné')} />
                        {isMentoring && (
                          <>
                            <SummaryRow label="Mentor"   value={allMentors.find(m => m._id === form.mentorId)?.name || '—'} />
                            <SummaryRow label="Startup"  value={startups.find(s => (s.id || s._id) === form.startupId)?.name || '—'} />
                          </>
                        )}
                        {!isMentoring && (
                          <SummaryRow label="Audience"  value={
                            form.targetMode === 'all' ? 'Toutes les startups' :
                            form.targetMode === 'programme' ? 'Par programme' :
                            `${form.selectedStartups.length} startup(s) sélectionnée(s)`
                          } />
                        )}
                        {form.speakers.length > 0 && (
                          <SummaryRow label="Intervenants" value={form.speakers.map(s => s.name).join(', ')} />
                        )}
                      </div>
                    </div>

                    {/* Notifications */}
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        {Icon.bell} Notifications
                      </p>
                      <div style={{ display: 'grid', gap: '8px', marginBottom: '1rem' }}>
                        {isMentoring ? (
                          <>
                            <Toggle
                              label="Notifier le mentor par notification + e-mail"
                              checked={form.notifyMentor}
                              onChange={v => setForm(p => ({ ...p, notifyMentor: v }))}
                            />
                            <Toggle
                              label="Notifier la startup par notification + e-mail"
                              checked={form.notifyStartup}
                              onChange={v => setForm(p => ({ ...p, notifyStartup: v }))}
                            />
                          </>
                        ) : (
                          <Toggle
                            label="Notifier toutes les startups ciblées"
                            checked={form.notifyStartup}
                            onChange={v => setForm(p => ({ ...p, notifyStartup: v }))}
                          />
                        )}
                      </div>
                      {(form.notifyMentor || form.notifyStartup) && (
                        <Field label="Message personnalisé (optionnel)">
                          <textarea
                            rows={3}
                            style={{ ...inputStyle, resize: 'none' }}
                            placeholder="Message inclus dans l'e-mail de notification…"
                            value={form.customNotificationBody}
                            onChange={e => setForm(p => ({ ...p, customNotificationBody: e.target.value }))}
                          />
                        </Field>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Navigation wizard ── */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: '2rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <button
                    onClick={() => step > 1 ? setStep(s => s - 1) : setView('list')}
                    style={{
                      padding: '9px 18px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: '#6b7280',
                      fontSize: '13px', fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {step === 1 ? 'Annuler' : 'Précédent'}
                  </button>

                  {step < 4 ? (
                    <button
                      onClick={() => setStep(s => s + 1)}
                      disabled={
                        (step === 1 && !canProceed1) ||
                        (step === 2 && !canProceed2) ||
                        (step === 3 && !canProceed3)
                      }
                      style={{
                        padding: '9px 24px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#006d94',
                        color: '#fff',
                        fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer',
                        opacity: (
                          (step === 1 && !canProceed1) ||
                          (step === 2 && !canProceed2) ||
                          (step === 3 && !canProceed3)
                        ) ? 0.4 : 1,
                      }}
                    >
                      Suivant
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      style={{
                        padding: '9px 24px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#006d94',
                        color: '#fff',
                        fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving ? (
                        <><Spinner /> Création…</>
                      ) : (
                        <>{Icon.send} Créer et envoyer</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ════════════ DETAIL VIEW ════════════ */}
            {view === 'detail' && selected && (
              <SessionDetail
                session={selected}
                allMentors={allMentors}
                startups={startups}
                onDelete={() => handleDelete(selected._id)}
                onStatusChange={(status) => {
                  setSessions(prev => prev.map(s => s._id === selected._id ? { ...s, status } : s));
                  setSelected(prev => ({ ...prev, status }));
                  notify('Statut mis à jour.');
                }}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </>
  );
}

// ─── SessionRow ─────────────────────────────────────────────────────────────
function SessionRow({ session, onSelect }) {
  const t = TYPE_MAP[session.type] || {};
  const s = STATUS_CONFIG[session.status] || STATUS_CONFIG.upcoming;
  const dateStr = session.date
    ? `${fmt(session.date)}${session.time ? ' à ' + session.time : ''}`
    : '—';

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '14px 16px',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.15s ease',
        background: '#fff',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,109,148,0.3)'; e.currentTarget.style.background = 'rgba(0,109,148,0.02)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.background = '#fff'; }}
    >
      {/* Type pill */}
      <div style={{
        padding: '5px 11px',
        borderRadius: '6px',
        background: t.bg || 'rgba(0,0,0,0.05)',
        border: `1px solid ${t.border || 'rgba(0,0,0,0.08)'}`,
        fontSize: '11px', fontWeight: 700,
        color: t.color || '#6b7280',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}>
        {t.label || session.type}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.title}
        </p>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap' }}>
          {session.domain && <span>{session.domain}</span>}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            {dateStr}
          </span>
          {session.duration && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {session.duration} min
            </span>
          )}
          {session.capacity && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {session.enrolled ?? 0}/{session.capacity}
            </span>
          )}
        </div>
      </div>

      {/* Statut */}
      <div style={{
        padding: '4px 10px',
        borderRadius: '6px',
        background: s.bg,
        color: s.color,
        fontSize: '11px', fontWeight: 600,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {s.label}
      </div>

      {/* Chevron */}
      <svg width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7"/>
      </svg>
    </div>
  );
}

// ─── SessionDetail ───────────────────────────────────────────────────────────
function SessionDetail({ session, allMentors, startups, onDelete, onStatusChange }) {
  const t = TYPE_MAP[session.type] || {};
  const s = STATUS_CONFIG[session.status] || STATUS_CONFIG.upcoming;

  const mentor  = session.mentorId  ? allMentors.find(m => m._id === session.mentorId)  : null;
  const startup = session.startupId ? startups.find(s => (s.id || s._id) === session.startupId) : null;

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* En-tête session */}
      <div style={{
        padding: '1.25rem',
        border: `1px solid ${t.border || 'rgba(0,0,0,0.07)'}`,
        borderRadius: '12px',
        background: t.bg || 'rgba(0,0,0,0.015)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
          <div style={{
            padding: '5px 10px',
            borderRadius: '6px',
            background: t.color ? `${t.color}18` : 'rgba(0,0,0,0.05)',
            color: t.color || '#6b7280',
            fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            flexShrink: 0,
          }}>
            {t.label || session.type}
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: '6px',
            background: s.bg, color: s.color,
            fontSize: '11px', fontWeight: 600,
          }}>
            {s.label}
          </div>
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
          {session.title}
        </h3>
        {session.description && (
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
            {session.description}
          </p>
        )}
      </div>

      {/* Grille infos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <InfoCard icon={Icon.calendar} label="Date & heure">
          {session.date ? `${fmt(session.date)}${session.time ? ' à ' + session.time : ''}` : '—'}
        </InfoCard>
        <InfoCard icon={Icon.clock} label="Durée">
          {session.duration ? `${session.duration} minutes` : '—'}
        </InfoCard>
        <InfoCard icon={session.isOnline ? Icon.video : Icon.building} label={session.isOnline ? 'Lien réunion' : 'Lieu'}>
          {session.isOnline
            ? (session.meetLink ? <a href={session.meetLink} target="_blank" rel="noreferrer" style={{ color: '#006d94', textDecoration: 'none', fontSize: '12px' }}>{session.meetLink}</a> : 'Non renseigné')
            : (session.location || '—')
          }
        </InfoCard>
        <InfoCard icon={Icon.users} label="Participants">
          {session.capacity ? `${session.enrolled ?? 0} / ${session.capacity}` : '—'}
        </InfoCard>
      </div>

      {/* Mentor & Startup (mentorat) */}
      {session.type === 'mentoring' && (mentor || startup) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {mentor && (
            <div style={{ padding: '12px 14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '10px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Mentor</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#db2777', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  {mentor.initials || mentor.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#111827' }}>{mentor.name}</p>
                  {mentor.expertise && <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{mentor.expertise}</p>}
                </div>
              </div>
            </div>
          )}
          {startup && (
            <div style={{ padding: '12px 14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '10px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Startup</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#006d94', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  {startup.logo || startup.name?.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#111827' }}>{startup.name}</p>
                  {startup.sector && <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{startup.sector}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speakers */}
      {session.speakers?.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
            Intervenants
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {session.speakers.map((sp, i) => (
              <div key={i} style={{ padding: '10px 14px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#006d94', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  {sp.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{sp.name}</p>
                  {(sp.role || sp.email) && (
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                      {[sp.role, sp.email].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex', gap: '10px', paddingTop: '1rem',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button
          onClick={onDelete}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '8px',
            background: 'rgba(220,38,38,0.05)',
            color: '#dc2626',
            fontSize: '13px', fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {Icon.trash} Supprimer
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {session.status !== 'done' && (
            <button
              onClick={() => onStatusChange('done')}
              style={{ padding: '8px 14px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', background: 'transparent', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Marquer terminée
            </button>
          )}
          {session.status !== 'cancelled' && (
            <button
              onClick={() => onStatusChange('cancelled')}
              style={{ padding: '8px 14px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', background: 'transparent', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Micro-composants ────────────────────────────────────────────────────────
function StepBar({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => i + 1).map(n => (
        <div key={n} style={{ flex: 1, height: '3px', borderRadius: '2px', background: n <= current ? '#006d94' : 'rgba(0,0,0,0.08)', transition: 'background 0.3s ease' }} />
      ))}
    </div>
  );
}

function Label({ children }) {
  return <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>{children}</p>;
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{label}</label>
      {children}
    </div>
  );
}

function InfoCard({ icon, label, children }) {
  return (
    <div style={{ padding: '12px 14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#9ca3af' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', margin: 0 }}>{children}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
      <span style={{ color: '#6b7280', minWidth: '100px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{
        width: '36px', height: '20px', borderRadius: '10px',
        background: checked ? '#006d94' : 'rgba(0,0,0,0.12)',
        position: 'relative', flexShrink: 0,
        transition: 'background 0.2s ease',
      }}>
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff',
          position: 'absolute', top: '2px',
          left: checked ? '18px' : '2px',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0110 10" strokeWidth="3" strokeLinecap="round"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  );
}

// ─── Styles réutilisables ────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

const selectStyle = {
  padding: '7px 12px',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#374151',
  background: '#fff',
  outline: 'none',
  cursor: 'pointer',
};

// ─── Seed data de démo ───────────────────────────────────────────────────────
const SEED_SESSIONS = [
  {
    _id: 'demo-1',
    type: 'pitch',
    title: 'Pitch Clinic — Panel Investisseurs Seed',
    domain: 'Fundraising',
    description: 'Session intensive de feedback pitch face à un panel de 3 investisseurs. 8 min pitch + 12 min Q&R par startup.',
    date: '2026-05-01',
    time: '14:00',
    duration: 120,
    isOnline: true,
    meetLink: 'https://meet.google.com/pitch-clinic-001',
    capacity: 12,
    enrolled: 7,
    status: 'upcoming',
    targetMode: 'all',
    speakers: [
      { name: 'Karim Oueslati', email: 'k.oueslati@sawari.com', role: 'Venture Capital' },
      { name: 'Samia Belhadj',  email: 's.belhadj@africinvest.com', role: 'Investisseur' },
    ],
  },
  {
    _id: 'demo-2',
    type: 'workshop',
    title: 'Financial Modelling — Unit Economics & Burn Rate',
    domain: 'Finance',
    description: 'Atelier pratique : construction du modèle financier sur 3 ans, P&L, cash burn et unit economics.',
    date: '2026-05-12',
    time: '10:00',
    duration: 180,
    isOnline: false,
    location: 'Incubateur MEDIANET, Lac 2, Tunis — Salle Innovation B',
    capacity: 20,
    enrolled: 14,
    status: 'upcoming',
    targetMode: 'programme',
    speakers: [{ name: 'Amira Hamdani', email: 'a.hamdani@finlab.tn', role: 'CFO Advisor' }],
  },
  {
    _id: 'demo-3',
    type: 'mentoring',
    title: 'Session Mentorat — Stratégie FinTech',
    domain: 'FinTech',
    description: 'Focus sur stratégie go-to-market et préparation seed round.',
    date: '2026-04-28',
    time: '10:30',
    duration: 60,
    isOnline: true,
    meetLink: 'https://meet.google.com/mentor-session-001',
    capacity: 1,
    enrolled: 1,
    status: 'upcoming',
    targetMode: 'specific',
    mentorId: 'men-1',
    startupId: '',
    notifyMentor: true,
    notifyStartup: true,
    speakers: [],
  },
  {
    _id: 'demo-4',
    type: 'conference',
    title: 'Legal Essentials — GDPR, Term Sheets & Cap Table',
    domain: 'Juridique',
    description: 'Fondamentaux juridiques pour startups : protection données, structuration cap table, lecture term sheet.',
    date: '2026-04-10',
    time: '11:00',
    duration: 90,
    isOnline: false,
    location: 'MEDIANET HQ, Avenue Kheireddine Pacha, Tunis — Amphi A',
    capacity: 50,
    enrolled: 31,
    status: 'done',
    targetMode: 'all',
    speakers: [{ name: 'Sonia Trabelsi', email: 's.trabelsi@legalstartup.tn', role: 'Avocate' }],
  },
  {
    _id: 'demo-5',
    type: 'formation',
    title: 'Growth Hacking — Acquisition & Rétention',
    domain: 'Marketing',
    date: '2026-06-01',
    time: '09:30',
    duration: 240,
    isOnline: true,
    meetLink: 'https://meet.google.com/growth-masterclass-2026',
    capacity: 35,
    enrolled: 22,
    status: 'upcoming',
    targetMode: 'all',
    speakers: [{ name: 'Rania Souissi', email: 'r.souissi@growthlab.tn', role: 'Growth Lead' }],
  },
];