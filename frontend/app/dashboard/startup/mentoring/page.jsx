'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Check:     (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  X:         (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  Cal:       (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Video:     (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>,
  Link:      (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
  File:      (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
  Star:      (p) => <svg {...p} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  Download:  (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  Upload:    (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>,
  Alert:     (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  User:      (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  ChevDown:  (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
  Folder:    (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
  Eye:       (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  Lock:      (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  Rocket:    (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  Refresh:   (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  Lightning: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  Spinner:   (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
  ArrowLeft: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/></svg>,
};

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_TYPE_LABELS = {
  mentoring:  'Séance de mentorat',
  conference: 'Conférence',
  workshop:   'Workshop',
  pitch:      'One-to-one pitch',
  other:      'Événement',
};

const SCORE_COLOR = (s) => s >= 85 ? '#059669' : s >= 70 ? '#d97706' : '#3b82f6';
const SCORE_BG    = (s) => s >= 85 ? '#d1fae5' : s >= 70 ? '#fef3c7' : '#dbeafe';

const TYPE_COLORS = {
  PDF:   { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
  Excel: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  Notion:{ bg: '#eff6ff', text: '#1e40af', border: '#93c5fd' },
  Vidéo: { bg: '#f5f3ff', text: '#5b21b6', border: '#c4b5fd' },
};

// ── Mock data (fallback) ──────────────────────────────────────────────────────
const MOCK_MATCHES = [
  {
    id: 'match-1',
    recommendationStatus: 'pending_founder_validation',
    sessionStatus: 'none',
    matchScore: 92,
    mentor: {
      name: 'Rania Souissi', title: 'Growth Expert · Ex-Jumia',
      bio: "10 ans d'expérience en growth marketing et acquisition client pour les startups e-commerce et FinTech en Afrique du Nord.",
      expertise: ['Growth Marketing', 'FinTech', 'User Acquisition', 'Branding'],
      experience: '10 ans', language: 'FR / AR', format: 'Vidéo',
    },
  },
  {
    id: 'match-2',
    recommendationStatus: 'founder_validated',
    sessionStatus: 'session_proposed',
    sessionType: 'mentoring',
    sessionDate: new Date(Date.now() + 4 * 864e5).toISOString(),
    sessionDuration: '1h00',
    sessionLink: 'https://meet.google.com/abc-defg-hij',
    matchScore: 87,
    mentor: {
      name: 'Yassine Khelif', title: 'CTO · Product & Tech Advisor',
      bio: 'Expert en architecture SaaS et product management. A accompagné plus de 20 startups tunisiennes.',
      expertise: ['Product Management', 'SaaS', 'Architecture', 'DevOps'],
      experience: '12 ans', language: 'FR / EN', format: 'Hybride',
    },
  },
  {
    id: 'match-3',
    recommendationStatus: 'founder_validated',
    sessionStatus: 'session_confirmed',
    sessionType: 'workshop',
    sessionDate: new Date(Date.now() + 10 * 864e5).toISOString(),
    sessionDuration: '2h00',
    sessionLink: 'https://meet.google.com/xyz-uvwx-yz',
    matchScore: 78,
    mentor: {
      name: 'Amira Hamdani', title: 'CFO · Finance & Strategy',
      bio: 'Experte en modélisation financière et levée de fonds seed et série A.',
      expertise: ['Finance', 'Fundraising', 'Business Model', 'Investisseurs'],
      experience: '8 ans', language: 'FR / EN / AR', format: 'Vidéo',
    },
  },
];

const MOCK_RESOURCES = [
  { id: 'r1', title: 'Pitch deck template Q2 2025',  type: 'PDF',   size: '2.4 MB', mentor: 'Yassine Khelif',  date: '8 mai 2025',   category: 'Fundraising', shared: true },
  { id: 'r2', title: 'Financial model SaaS',          type: 'Excel', size: '1.1 MB', mentor: 'Amira Hamdani',   date: '5 mai 2025',   category: 'Finance',     shared: true },
  { id: 'r3', title: 'Due diligence checklist',       type: 'PDF',   size: '540 KB', mentor: 'Amira Hamdani',   date: '3 mai 2025',   category: 'Fundraising', shared: true },
  { id: 'r4', title: 'Growth hacking playbook',       type: 'Notion',size: '—',      mentor: 'Rania Souissi',   date: '1 mai 2025',   category: 'Growth',      shared: false },
  { id: 'r5', title: 'OKR template for startups',     type: 'PDF',   size: '320 KB', mentor: 'Yassine Khelif',  date: '28 avr. 2025', category: 'Management',  shared: true },
  { id: 'r6', title: 'RGPD guide — startups TN',      type: 'PDF',   size: '890 KB', mentor: 'Amira Hamdani',   date: '25 avr. 2025', category: 'Légal',       shared: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function avatarInitials(name = '') {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#00526e', '#7c3aed', '#b45309', '#0f766e', '#be185d', '#1d4ed8'];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);
  const ok = type === 'success';
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl"
      style={{ background: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`, minWidth: 300 }}>
      {ok ? <Icons.Check className="w-5 h-5 flex-shrink-0" style={{ color: '#16a34a' }}/> : <Icons.Alert className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }}/>}
      <p className="text-sm font-semibold" style={{ color: ok ? '#166534' : '#991b1b' }}>{message}</p>
      <button onClick={onClose} className="ml-auto opacity-50 hover:opacity-100" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <Icons.X className="w-4 h-4" style={{ color: ok ? '#166534' : '#991b1b' }}/>
      </button>
    </div>
  );
}

// ── Locked state ──────────────────────────────────────────────────────────────
function LockedMentoring() {
  return (
    <div className="mn-card" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 48 }}>
      <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(0,82,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icons.Lock className="w-8 h-8" style={{ color: '#94a3b8' }}/>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>Espace Mentorat Fondateur</h2>
      <p style={{ color: '#64748b', maxWidth: 400, lineHeight: 1.6, margin: '0 0 24px' }}>
        L'accès au mentorat est réservé aux startups dont la candidature a été acceptée dans un programme MEDIANET.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/dashboard/startup/apply"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#00526e,#0088ba)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          <Icons.Rocket className="w-4 h-4"/> Déposer une candidature
        </Link>
        <Link href="/dashboard/startup/dashboard"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="mn-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e2e8f0', flexShrink: 0 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: '#e2e8f0', borderRadius: 6, width: '60%', marginBottom: 8 }}/>
          <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, width: '40%' }}/>
        </div>
      </div>
      <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, marginBottom: 8 }}/>
      <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, width: '80%', marginBottom: 16 }}/>
      <div style={{ height: 40, background: '#e2e8f0', borderRadius: 10 }}/>
    </div>
  );
}

// ── MentorRow ─────────────────────────────────────────────────────────────────
function MentorRow({ match: initialMatch, token, onToast }) {
  const [match,      setMatch]      = useState(initialMatch);
  const [open,       setOpen]       = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [rejecting,  setRejecting]  = useState(false);
  const [note,       setNote]       = useState('');

  const mentor  = match.mentor || {};
  const name    = mentor.name  || 'Mentor';
  const status  = match.recommendationStatus;
  const isPending  = status === 'pending_founder_validation';
  const isAccepted = status === 'founder_validated';

  const apiPatch = async (url, body) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}${url}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    } catch (err) {
      console.warn('[MentorRow] API error:', err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const doAccept = async () => {
    await apiPatch(`/api/startup/mentor-matches/${match.id}/validate`);
    setMatch(p => ({ ...p, recommendationStatus: 'founder_validated' }));
    onToast('Mentor accepté ! L\'équipe MEDIANET organise la suite.', 'success');
  };

  const doRefuse = async () => {
    if (note.trim().length < 10) return;
    await apiPatch(`/api/startup/mentor-matches/${match.id}/refuse`, { reason: note.trim() });
    setMatch(p => ({ ...p, recommendationStatus: 'founder_rejected', founderRefuseReason: note.trim() }));
    setRejecting(false);
    onToast('Refus enregistré. L\'admin a été notifié.', 'success');
  };

  const stripeColor = isPending ? '#f59e0b' : isAccepted ? '#10b981' : '#ef4444';
  const ac = avatarColor(name);

  return (
    <div className="mn-card" style={{ overflow: 'hidden' }}>
      <div style={{ height: 3, background: stripeColor }}/>
      <div style={{ padding: '16px 20px' }}>

        {/* ── Compact row ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {avatarInitials(name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mentor.title}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
              {(mentor.expertise || []).slice(0, 3).map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569', whiteSpace: 'nowrap' }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {match.matchScore > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: SCORE_BG(match.matchScore), border: `2px solid ${SCORE_COLOR(match.matchScore)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: SCORE_COLOR(match.matchScore) }}>{match.matchScore}%</span>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Match</div>
              </div>
            )}

            <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap',
              background: isPending ? '#fef3c7' : isAccepted ? '#d1fae5' : '#fee2e2',
              color: isPending ? '#92400e' : isAccepted ? '#065f46' : '#991b1b',
              border: `1px solid ${isPending ? '#fde68a' : isAccepted ? '#a7f3d0' : '#fca5a5'}` }}>
              {isPending ? ' En attente' : isAccepted ? '✓ Accepté' : '✗ Refusé'}
            </span>

            <button onClick={() => setOpen(!open)}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {open ? 'Réduire' : 'Voir profil'}
              <Icons.ChevDown style={{ width: 14, height: 14, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}/>
            </button>
          </div>
        </div>

        {/* ── Expanded detail ── */}
        {open && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>

            {mentor.bio && (
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, marginBottom: 16 }}>{mentor.bio}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {[['Expérience', mentor.experience], ['Langue', mentor.language], ['Format', mentor.format]].map(([label, val]) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{val || '—'}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            {isPending && !rejecting && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={doAccept} disabled={loading}
                  style={{ flex: 1, padding: '11px 0', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.7 : 1 }}>
                  {loading ? <Icons.Spinner className="w-4 h-4 mn-spin"/> : <Icons.Check className="w-4 h-4"/>}
                  Accepter ce mentor
                </button>
                <button onClick={() => setRejecting(true)} disabled={loading}
                  style={{ flex: 1, padding: '11px 0', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icons.X className="w-4 h-4"/> Refuser
                </button>
              </div>
            )}

            {isPending && rejecting && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 13, color: '#991b1b', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icons.Alert style={{ width: 15, height: 15, flexShrink: 0 }}/> Motif obligatoire (min. 10 caractères)
                </p>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Expliquez pourquoi ce mentor ne correspond pas à vos besoins…"
                  style={{ width: '100%', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}/>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: note.trim().length >= 10 ? '#059669' : '#dc2626' }}>
                    {note.trim().length >= 10 ? `✓ ${note.trim().length} caractères` : `${10 - note.trim().length} manquants`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={doRefuse} disabled={loading || note.trim().length < 10}
                    style={{ flex: 1, padding: '10px 0', background: note.trim().length >= 10 && !loading ? '#dc2626' : '#fca5a5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: note.trim().length >= 10 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {loading ? <Icons.Spinner className="w-4 h-4 mn-spin"/> : <Icons.X className="w-4 h-4"/>}
                    Confirmer le refus
                  </button>
                  <button onClick={() => { setRejecting(false); setNote(''); }}
                    style={{ padding: '10px 16px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {isAccepted && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 14px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10 }}>
                <Icons.Check style={{ width: 16, height: 16, color: '#059669', flexShrink: 0 }}/>
                <span style={{ fontSize: 13, color: '#065f46', fontWeight: 500 }}>Mentor accepté — l'équipe MEDIANET organise la prochaine étape.</span>
              </div>
            )}

            {status === 'founder_rejected' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10 }}>
                <Icons.X style={{ width: 16, height: 16, color: '#dc2626', flexShrink: 0, marginTop: 1 }}/>
                <div>
                  <p style={{ fontSize: 13, color: '#991b1b', fontWeight: 600, margin: 0 }}>Refus enregistré.</p>
                  {match.founderRefuseReason && <p style={{ fontSize: 12, color: '#991b1b', opacity: 0.8, margin: '4px 0 0', fontStyle: 'italic' }}>Motif : « {match.founderRefuseReason} »</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SessionCard ───────────────────────────────────────────────────────────────
function SessionCard({ match: initialMatch, token, onToast }) {
  const [match,     setMatch]     = useState(initialMatch);
  const [loading,   setLoading]   = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note,      setNote]      = useState('');

  const sesStatus   = match.sessionStatus;
  const isProposed  = sesStatus === 'session_proposed';
  const isConfirmed = sesStatus === 'session_confirmed';
  const typeLabel   = SESSION_TYPE_LABELS[match.sessionType] || match.sessionType || 'Session';
  const name        = match.mentor?.name || 'Mentor';

  const apiPatch = async (url, body) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}${url}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    } catch (err) {
      console.warn('[SessionCard] API error:', err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const doConfirm = async () => {
    await apiPatch(`/api/startup/mentor-matches/${match.id}/session/confirm`);
    setMatch(p => ({ ...p, sessionStatus: 'session_confirmed' }));
    onToast('Session confirmée ! Un email de confirmation vous a été envoyé.', 'success');
  };

  const doRefuse = async () => {
    if (note.trim().length < 10) return;
    await apiPatch(`/api/startup/mentor-matches/${match.id}/session/refuse`, { reason: note.trim() });
    setMatch(p => ({ ...p, sessionStatus: 'session_refused' }));
    setRejecting(false);
    onToast('Refus de session enregistré.', 'success');
  };

  const stripeColor = isProposed ? '#7c3aed' : isConfirmed ? '#10b981' : '#ef4444';
  const ac = avatarColor(name);

  return (
    <div className="mn-card" style={{ overflow: 'hidden' }}>
      <div style={{ height: 3, background: stripeColor }}/>
      <div style={{ padding: '18px 20px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {avatarInitials(name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{name}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#ede9fe', color: '#4c1d95' }}>{typeLabel}</span>
              {match.sessionDuration && <span style={{ fontSize: 12, color: '#64748b' }}>· {match.sessionDuration}</span>}
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, flexShrink: 0,
            background: isProposed ? '#ede9fe' : isConfirmed ? '#d1fae5' : '#fee2e2',
            color: isProposed ? '#4c1d95' : isConfirmed ? '#065f46' : '#991b1b',
            border: `1px solid ${isProposed ? '#c4b5fd' : isConfirmed ? '#a7f3d0' : '#fca5a5'}` }}>
            {isProposed ? ' À confirmer' : isConfirmed ? '✓ Confirmée' : '✗ Refusée'}
          </span>
        </div>

        {match.sessionDate && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <Icons.Cal style={{ width: 16, height: 16, color: '#475569', flexShrink: 0 }}/>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{fmtDate(match.sessionDate)}</span>
          </div>
        )}

        {isProposed && !rejecting && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={doConfirm} disabled={loading}
              style={{ flex: 1, padding: '11px 0', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Icons.Spinner className="w-4 h-4 mn-spin"/> : <Icons.Check style={{ width: 15, height: 15 }}/>}
              Confirmer ma présence
            </button>
            <button onClick={() => setRejecting(true)} disabled={loading}
              style={{ padding: '11px 18px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Refuser
            </button>
          </div>
        )}

        {isProposed && rejecting && (
          <div style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 13, color: '#991b1b', margin: '0 0 10px' }}>Motif de refus (min. 10 caractères) :</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Ex. : date non disponible, conflit d'agenda…"
              style={{ width: '100%', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}/>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={doRefuse} disabled={loading || note.trim().length < 10}
                style={{ flex: 1, padding: '9px 0', background: note.trim().length >= 10 && !loading ? '#dc2626' : '#fca5a5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: note.trim().length >= 10 ? 'pointer' : 'not-allowed' }}>
                Confirmer le refus
              </button>
              <button onClick={() => { setRejecting(false); setNote(''); }}
                style={{ padding: '9px 16px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10, alignItems: 'center' }}>
              <Icons.Check style={{ width: 15, height: 15, color: '#059669', flexShrink: 0 }}/>
              <span style={{ fontSize: 13, color: '#065f46', fontWeight: 500 }}>Confirmée — un email de rappel vous sera envoyé.</span>
            </div>
            {match.sessionLink && (
              <a href={match.sessionLink} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', background: '#eff6ff', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                <Icons.Video style={{ width: 15, height: 15 }}/> Rejoindre la session
              </a>
            )}
          </div>
        )}

        {sesStatus === 'session_refused' && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, alignItems: 'center' }}>
            <Icons.Alert style={{ width: 15, height: 15, color: '#dc2626', flexShrink: 0 }}/>
            <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 500 }}>Refusée — l'admin peut proposer une nouvelle date.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ResourceDepot ─────────────────────────────────────────────────────────────
function ResourceDepot({ resources }) {
  const [filter, setFilter] = useState('Tous');
  const categories = ['Tous', ...Array.from(new Set(resources.map(r => r.category)))];
  const filtered   = filter === 'Tous' ? resources : resources.filter(r => r.category === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding: '6px 16px', borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none', transition: 'all .15s',
              background: filter === cat ? 'linear-gradient(135deg,#00526e,#0088ba)' : '#f1f5f9',
              color: filter === cat ? '#fff' : '#64748b' }}>
            {cat}
          </button>
        ))}
      </div>

      <label style={{ display: 'block', border: '2px dashed #cbd5e1', borderRadius: 14, padding: '22px 24px', textAlign: 'center', marginBottom: 20, background: '#fafbfc', cursor: 'pointer' }}>
        <input type="file" style={{ display: 'none' }}/>
        <Icons.Upload style={{ width: 26, height: 26, color: '#94a3b8', margin: '0 auto 8px' }}/>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: 0 }}>Déposer un fichier ici</p>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>PDF, Excel, Notion, Word · max 20 MB</p>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => {
          const tc = TYPE_COLORS[r.type] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#fff', border: '1px solid #e8edf2', borderRadius: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icons.File style={{ width: 18, height: 18, color: tc.text }}/>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  Par <span style={{ color: '#475569', fontWeight: 500 }}>{r.mentor}</span> · {r.date}{r.size !== '—' ? ` · ${r.size}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>{r.type}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{r.category}</span>
                {!r.shared && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>En attente</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button title="Prévisualiser" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Eye style={{ width: 15, height: 15, color: '#64748b' }}/>
                </button>
                <button title="Télécharger" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Download style={{ width: 15, height: 15, color: '#64748b' }}/>
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
            Aucun document dans cette catégorie.
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function StartupMentoringPage() {
  const { user, accessToken: token } = useSelector(state => state.auth);

  const [mounted,  setMounted]  = useState(false);
  const [tab,      setTab]      = useState('mentors');
  const [matches,  setMatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  const isFounder =
    user?.isFounder === true ||
    ['founder', 'startup', 'Startup', 'Founder'].includes(user?.role);

  useEffect(() => { setMounted(true); }, []);

  const fetchMatches = useCallback(async () => {
    if (!isFounder) { setLoading(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/startup/mentor-matches`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setMatches(data.data);
      } else {
        setMatches(MOCK_MATCHES);
      }
    } catch {
      setMatches(MOCK_MATCHES);
    } finally {
      setLoading(false);
    }
  }, [token, isFounder]);

  useEffect(() => { if (mounted) fetchMatches(); }, [mounted, fetchMatches]);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  if (!mounted) return null;

  // Derived counts
  const pendingMentors  = matches.filter(m => m.recommendationStatus === 'pending_founder_validation').length;
  const pendingSessions = matches.filter(m => m.sessionStatus === 'session_proposed').length;

  // Sessions = validated matches that have a session
  const sessionMatches  = matches.filter(m => m.sessionStatus && m.sessionStatus !== 'none');

  const tabs = [
    { id: 'mentors',   label: 'Mentors à valider',   badge: pendingMentors,  Icon: Icons.User   },
    { id: 'sessions',  label: 'Sessions',             badge: pendingSessions, Icon: Icons.Cal    },
    { id: 'resources', label: 'Dépôt de ressources',  badge: null,            Icon: Icons.Folder },
  ];

  return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout>
        <style jsx global>{`
          .mn-card {
            background: #fff;
            border: 1px solid #e8edf2;
            border-radius: 14px;
            transition: box-shadow .2s;
          }
          .mn-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.07); }
          .mn-spin { animation: mn-rotate .85s linear infinite; }
          @keyframes mn-rotate { to { transform: rotate(360deg); } }
          @keyframes mn-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .mn-anim { animation: mn-up .45s ease forwards; }
        `}</style>

        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

       <div style={{ padding: '0 0 40px' }}>
          {/* ── Header ── */}
          <div className="mn-anim" style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '28px 32px', marginBottom: 24, background: 'linear-gradient(135deg,#00526e 0%,#006d94 55%,#0098c8 100%)' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                  Espace Fondateur — Mentorat
                </span>
                {isFounder && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}/>
                    Accès actif
                  </span>
                )}
              </div>
              <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 6px', letterSpacing: -0.5 }}>Mentorat & Accompagnement</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: '0 0 16px' }}>Gérez vos recommandations de mentors et confirmez vos sessions</p>
              {isFounder && !loading && (
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: `${matches.length} recommandation${matches.length > 1 ? 's' : ''}`, Icon: Icons.User },
                    { label: `${pendingMentors} en attente`,       Icon: Icons.Alert },
                    { label: `${pendingSessions} session${pendingSessions > 1 ? 's' : ''} à confirmer`, Icon: Icons.Cal },
                  ].map(({ label, Icon }) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                      <Icon style={{ width: 15, height: 15 }}/> {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={fetchMatches}
              style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex' }}>
              <Icons.Refresh style={{ width: 16, height: 16 }}/>
            </button>
          </div>

          {/* ── Locked ── */}
          {!isFounder ? (
            <LockedMentoring/>
          ) : (
            <>
              {/* ── Tabs ── */}
              <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 14, padding: 6, border: '1px solid #e2e8f0', marginBottom: 24 }}>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all .2s',
                      background: tab === t.id ? 'linear-gradient(135deg,#00526e,#0088ba)' : 'transparent',
                      color: tab === t.id ? '#fff' : '#64748b' }}>
                    <t.Icon style={{ width: 16, height: 16 }}/>
                    {t.label}
                    {t.badge > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 800, minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                        background: tab === t.id ? 'rgba(255,255,255,0.25)' : '#fef3c7', color: tab === t.id ? '#fff' : '#92400e' }}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Tab: Mentors ── */}
              {tab === 'mentors' && (
                <div className="mn-anim">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Recommandations de mentors</h2>
                    {pendingMentors > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                        {pendingMentors} en attente
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[1, 2, 3].map(i => <Skeleton key={i}/>)}
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="mn-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <Icons.User style={{ width: 40, height: 40, color: '#cbd5e1', margin: '0 auto 16px' }}/>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', margin: 0 }}>Aucune recommandation pour l'instant.</p>
                      <p style={{ fontSize: 13, color: '#cbd5e1', margin: '6px 0 0' }}>L'équipe MEDIANET vous proposera bientôt des mentors.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {matches.map(m => <MentorRow key={m.id} match={m} token={token} onToast={showToast}/>)}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: Sessions ── */}
              {tab === 'sessions' && (
                <div className="mn-anim">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Vos sessions de mentorat</h2>
                    {pendingSessions > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#ede9fe', color: '#4c1d95', border: '1px solid #c4b5fd' }}>
                        {pendingSessions} à confirmer
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[1, 2].map(i => <Skeleton key={i}/>)}
                    </div>
                  ) : sessionMatches.length === 0 ? (
                    <div className="mn-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <Icons.Cal style={{ width: 40, height: 40, color: '#cbd5e1', margin: '0 auto 16px' }}/>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', margin: 0 }}>Aucune session proposée.</p>
                      <p style={{ fontSize: 13, color: '#cbd5e1', margin: '6px 0 0' }}>Les sessions apparaissent ici après validation d'un mentor.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {sessionMatches.map(m => <SessionCard key={m.id} match={m} token={token} onToast={showToast}/>)}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: Resources ── */}
              {tab === 'resources' && (
                <div className="mn-anim">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dépôt de ressources</h2>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#065f46', border: '1px solid #a7f3d0' }}>
                      {MOCK_RESOURCES.filter(r => r.shared).length} documents partagés
                    </span>
                  </div>
                  <ResourceDepot resources={MOCK_RESOURCES}/>
                </div>
              )}

              {/* ── Back link ── */}
              <div style={{ marginTop: 32 }}>
                <Link href="/dashboard/startup/dashboard"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                  <Icons.ArrowLeft style={{ width: 15, height: 15 }}/> Retour au dashboard
                </Link>
              </div>
            </>
          )}

          {/* ── Footer ── */}
          <div style={{ marginTop: 24, padding: '18px 24px', background: 'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icons.Lightning style={{ width: 18, height: 18, color: '#fff' }}/>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, margin: 0 }}>Besoin d'aide ?</p>
              <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>mentorat@medianet.tn · Réponse &lt;24h</p>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[['EXPERT', 'Mentors certifiés'], ['NETWORK', 'Réseau MENA'], ['SUPPORT', '24/7 disponible']].map(([title, sub], i, arr) => (
                <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 12, margin: 0 }}>{title}</p>
                    <p style={{ color: '#64748b', fontSize: 10, margin: 0 }}>{sub}</p>
                  </div>
                  {i < arr.length - 1 && <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }}/>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}