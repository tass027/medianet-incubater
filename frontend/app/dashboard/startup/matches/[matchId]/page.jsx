'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icons = {
  ArrowLeft:   (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/></svg>,
  Check:       (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  X:           (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  MapPin:      (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  Calendar:    (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Dollar:      (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  TrendingUp:  (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  AlertCircle: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Link:        (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
  Clock:       (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Spinner:     (p) => <svg {...p} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
};

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CFG = {
  pending_founder_validation: { label: 'En attente de votre décision', color: '#b45309', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
  founder_validated:          { label: 'Accepté',                      color: '#065f46', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)' },
  founder_rejected:           { label: 'Match refusé',                 color: '#991b1b', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)'  },
  session_proposed:           { label: 'Session proposée',             color: '#5b21b6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.30)' },
  session_confirmed:          { label: 'Session confirmée',            color: '#065f46', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)' },
  session_refused:            { label: 'Session refusée',              color: '#991b1b', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)'  },
};

const scoreColor = (s) => s >= 85 ? '#059669' : s >= 70 ? '#d97706' : '#2563eb';
const scoreBg    = (s) => s >= 85 ? 'rgba(16,185,129,0.12)' : s >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)';

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, []);
  const ok = type === 'success';
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl toast-in"
      style={{ background: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`, minWidth: 280 }}>
      {ok
        ? <Icons.Check className="w-5 h-5 flex-shrink-0" style={{ color: '#16a34a' }} />
        : <Icons.AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />}
      <p className="text-sm font-medium" style={{ color: ok ? '#166534' : '#991b1b' }}>{message}</p>
    </div>
  );
}

/* ─── Reusable card ──────────────────────────────────────────────────────── */
function Card({ children, className = '', style = {} }) {
  return (
    <div className={`glass-card rounded-xl ${className}`} style={style}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">{children}</p>;
}

/* ─── Compatibility bar ──────────────────────────────────────────────────── */
function CompatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-slate-400 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

/* ─── Decision panel (shared between pending_match and session_proposed) ── */
function DecisionPanel({ status, note, setNote, refuseStep, setRefuseStep, actionLoading, onAccept, onRefuse }) {
  const isSession = status === 'session_proposed';
  const minLen    = 10;
  const noteValid = note.trim().length >= minLen;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
        {isSession
          ? 'Une session a été proposée avec cet investisseur. Confirmez-vous votre participation ?'
          : 'L\'équipe MEDIANET a identifié cet investisseur comme un bon match. Prenez le temps de lire son profil avant de décider.'}
      </p>

      {/* Textarea */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-1.5">
          {refuseStep === 'confirming'
            ? `Motif de refus ${isSession ? 'de session' : ''} (requis, min. ${minLen} car.)`
            : 'Note personnelle (optionnel)'}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={refuseStep === 'confirming'
            ? `Expliquez pourquoi vous refusez ce${isSession ? 'tte session' : ' match'}…`
            : `Ex. : ${isSession ? 'Je confirme ma présence…' : 'Cet investisseur correspond à notre secteur…'}`}
          className="note-area w-full rounded-xl px-3.5 py-3 text-sm resize-none"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: refuseStep === 'confirming' && !noteValid ? '#dc2626' : '#94a3b8' }}>
            {refuseStep === 'confirming' && !noteValid
              ? `${minLen - note.trim().length} caractères manquants`
              : refuseStep === 'confirming' && noteValid ? '✓ Longueur suffisante' : ''}
          </span>
          <span className="text-xs text-gray-400">{note.length}/500</span>
        </div>
      </div>

      {refuseStep === 'idle' ? (
        <div className="flex flex-col gap-2.5">
          {/* Accept */}
          <button
            onClick={onAccept}
            disabled={actionLoading}
            className="action-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: actionLoading ? '#d1fae5' : 'linear-gradient(135deg,#059669,#10b981)', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
          >
            {actionLoading
              ? <Icons.Spinner className="w-4 h-4 animate-spin" />
              : <Icons.Check className="w-4 h-4" />}
            {isSession ? 'Confirmer la session' : 'Accepter ce match'}
          </button>
          {/* Go to refuse confirmation */}
          <button
            onClick={() => setRefuseStep('confirming')}
            disabled={actionLoading}
            className="action-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(239,68,68,0.07)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.25)', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
          >
            <Icons.X className="w-4 h-4" />
            {isSession ? 'Refuser la session' : 'Refuser ce match'}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Warning */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Icons.AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#991b1b' }}>
              {isSession
                ? 'L\'admin MEDIANET pourra vous proposer une nouvelle date si vous refusez.'
                : 'Cette action est définitive. L\'admin MEDIANET sera notifié avec votre motif.'}
            </p>
          </div>
          {/* Confirm refuse */}
          <button
            onClick={onRefuse}
            disabled={actionLoading || !noteValid}
            className="action-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: actionLoading || !noteValid ? '#fca5a5' : '#dc2626', cursor: actionLoading || !noteValid ? 'not-allowed' : 'pointer' }}
          >
            {actionLoading ? <Icons.Spinner className="w-4 h-4 animate-spin" /> : <Icons.X className="w-4 h-4" />}
            Confirmer le refus
          </button>
          {/* Cancel */}
          <button
            onClick={() => setRefuseStep('idle')}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function MatchDetail() {
  const { matchId } = useParams();
  const { user, accessToken: token } = useSelector((s) => s.auth);

  const [match,         setMatch]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState(null);
  const [toast,         setToast]         = useState(null);
  const [mounted,       setMounted]       = useState(false);
  const [note,          setNote]          = useState('');
  const [refuseStep,    setRefuseStep]    = useState('idle'); // 'idle' | 'confirming'

  useEffect(() => { setMounted(true); }, []);

  /* ── fetch ── */
  const fetchMatch = async () => {
    try {
      setLoading(true); setError(null);
      const res  = await fetch(`${API}/api/startup/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Erreur de chargement');
      setMatch(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (matchId && mounted) fetchMatch(); }, [matchId, mounted]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  /* ── actions ── */
  const handleValidate = async () => {
    try {
      setActionLoading(true);
      const res  = await fetch(`${API}/api/startup/matches/${matchId}/validate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMatch((prev) => ({ ...prev, status: data.data.status }));
      showToast('Match accepté ! L\'équipe MEDIANET va organiser la suite.', 'success');
    } catch (err) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuseMatch = async () => {
    try {
      setActionLoading(true);
      const res  = await fetch(`${API}/api/startup/matches/${matchId}/refuse`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: note.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMatch((prev) => ({ ...prev, status: data.data.status, founderRefuseReason: note.trim() }));
      setRefuseStep('idle');
      showToast('Refus enregistré. L\'admin a été notifié.', 'success');
    } catch (err) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSession = async () => {
    try {
      setActionLoading(true);
      const res  = await fetch(`${API}/api/startup/matches/${matchId}/session/confirm`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMatch((prev) => ({ ...prev, status: data.data.status }));
      showToast('Session confirmée ! Un email de confirmation vous a été envoyé.', 'success');
    } catch (err) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuseSession = async () => {
    try {
      setActionLoading(true);
      const res  = await fetch(`${API}/api/startup/matches/${matchId}/session/refuse`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: note.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMatch((prev) => ({ ...prev, status: data.data.status }));
      setRefuseStep('idle');
      showToast('Refus de session enregistré. L\'admin peut proposer une nouvelle date.', 'success');
    } catch (err) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── derived investor fields (matches controller field names) ── */
  const inv           = match?.investor || {};
  const name          = inv.nom         || inv.name         || 'Investisseur';
  const bio           = inv.bio         || inv.description  || '';
  const location      = inv.localisation|| inv.location     || '';
  const secteurs      = inv.secteurs    || inv.focus        || [];
  const stades        = inv.stades      || inv.stage        || [];
  const ticketMin     = inv.ticketMin;
  const ticketMax     = inv.ticketMax;
  const entreprise    = inv.entreprise  || inv.company      || '';
  const type          = inv.type        || inv.investorType || '';
  const logo          = inv.logo        || null;
  const initials      = name.substring(0, 2).toUpperCase();

  const investmentRange = (ticketMin && ticketMax)
    ? `${(ticketMin / 1000).toFixed(0)}K – ${(ticketMax / 1_000_000).toFixed(1).replace('.0', '')}M TND`
    : null;

  const status    = match?.status;
  const statusCfg = STATUS_CFG[status] || {};
  const score     = match?.matchScore || 0;
  const sc        = scoreColor(score);

  const isPending         = status === 'pending_founder_validation';
  const isSessionProposed = status === 'session_proposed';

  /* compat breakdown — derived from match data */
  const compatRows = [
    { label: 'Secteur',      value: secteurs.length  ? Math.min(100, score + 15) : score },
    { label: 'Stade',        value: stades.length    ? Math.min(100, score + 10) : score },
    { label: 'Ticket moyen', value: investmentRange  ? Math.min(100, score + 5)  : score },
    { label: 'Géographie',   value: location         ? Math.min(100, score + 20) : score },
  ].map((r) => ({ ...r, value: Math.round(Math.min(100, r.value)) }));

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout>
        <style jsx global>{`
          @keyframes slideUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes toastIn  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
          @keyframes spin     { to{transform:rotate(360deg)} }
          .slide-up    { animation: slideUp 0.4s ease-out both; }
          .toast-in    { animation: toastIn 0.3s ease-out both; }
          .animate-spin { animation: spin 0.85s linear infinite; }

          .glass-card {
            background: rgba(255,255,255,0.98);
            border: 1px solid rgba(0,0,0,0.07);
            box-shadow: 0 1px 10px rgba(0,0,0,0.05);
          }
          :global(.dark) .glass-card {
            background: #1e293b;
            border: 1px solid #334155;
            box-shadow: 0 1px 10px rgba(0,0,0,0.25);
          }

          .action-btn { transition: all 0.18s ease; }
          .action-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.14); }
          .action-btn:active:not(:disabled) { transform: translateY(0); }

          .tag {
            background: #eff6ff; color: #1d4ed8;
            border: 1px solid #bfdbfe;
          }
          :global(.dark) .tag {
            background: rgba(59,130,246,0.12); color: #93c5fd;
            border-color: rgba(59,130,246,0.25);
          }

          .note-area {
            background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a;
          }
          :global(.dark) .note-area {
            background: #0f172a; border-color: #334155; color: #e2e8f0;
          }
          .note-area:focus { outline: none; border-color: #0088ba; }

          .stat-block {
            background: #f8fafc; border: 1px solid #f1f5f9;
          }
          :global(.dark) .stat-block {
            background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.07);
          }
        `}</style>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="space-y-5 pb-12">

          {/* ── Banner ───────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl slide-up" style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)', animationDelay: '0s' }}>
            <div className="p-6 pb-8">
              <Link href="/dashboard/startup/matches" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-5 transition-colors">
                <Icons.ArrowLeft className="w-4 h-4" /> Retour aux matches
              </Link>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/80 tracking-wide mb-3">INVESTOR PROFILE</span>
                  <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">{loading ? '…' : name}</h1>
                  {location && !loading && (
                    <p className="text-blue-100 text-sm flex items-center gap-1.5">
                      <Icons.MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {location}
                      {entreprise && <><span className="text-white/30 mx-1">·</span>{entreprise}</>}
                    </p>
                  )}
                </div>
                {!loading && match && (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${sc}22`, border: `2.5px solid ${sc}`, boxShadow: `0 0 0 4px ${sc}18` }}>
                      <span className="font-black text-lg" style={{ color: sc }}>{score}%</span>
                    </div>
                    <p className="text-xs text-white/60">Compatibilité</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                      {(status === 'founder_validated' || status === 'session_confirmed') && <Icons.Check className="w-3 h-3" />}
                      {statusCfg.label || status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Loading ───────────────────────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-9 h-9 rounded-full border-2 animate-spin" style={{ borderColor: '#0088ba', borderTopColor: 'transparent' }} />
              <p className="mt-4 text-gray-400 text-sm">Chargement du profil…</p>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────────── */}
          {error && !loading && (
            <Card className="p-12 text-center slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <Icons.AlertCircle className="w-7 h-7" style={{ color: '#dc2626' }} />
              </div>
              <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">Match introuvable</h3>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <Link href="/dashboard/startup/matches" className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm inline-block" style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                Retour à la liste
              </Link>
            </Card>
          )}

          {/* ── Main content ──────────────────────────────────────────── */}
          {match && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* ── LEFT: investor profile ──────────────────────────── */}
              <div className="lg:col-span-2 space-y-5">

                {/* Profile header card */}
                <Card className="overflow-hidden slide-up" style={{ animationDelay: '0.05s' }}>
                  <div className="h-1" style={{ background: 'linear-gradient(90deg,#00526e,#0088ba,#10b981)' }} />
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                        {logo ? <img src={logo} alt={name} className="w-full h-full object-cover" /> : initials}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{name}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {type && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#e0f2fe', color: '#0369a1' }}>{type}</span>
                          )}
                          {location && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Icons.MapPin className="w-3 h-3" />{location}
                            </span>
                          )}
                          {entreprise && (
                            <span className="text-xs text-gray-400">· {entreprise}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {bio && (
                      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-5 pb-5 border-b border-gray-100 dark:border-slate-700">{bio}</p>
                    )}

                    {/* Key stats grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {investmentRange && (
                        <div className="stat-block rounded-xl p-3.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icons.Dollar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#059669' }} />
                            <span className="text-xs text-gray-500 dark:text-slate-400">Investissement</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{investmentRange}</p>
                        </div>
                      )}
                      {stades.length > 0 && (
                        <div className="stat-block rounded-xl p-3.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icons.TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0088ba' }} />
                            <span className="text-xs text-gray-500 dark:text-slate-400">Stades préférés</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{Array.isArray(stades) ? stades.join(', ') : stades}</p>
                        </div>
                      )}
                      {location && (
                        <div className="stat-block rounded-xl p-3.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icons.MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#7c3aed' }} />
                            <span className="text-xs text-gray-500 dark:text-slate-400">Localisation</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Sectors */}
                {secteurs.length > 0 && (
                  <Card className="p-6 slide-up" style={{ animationDelay: '0.08s' }}>
                    <SectionTitle>Secteurs d'investissement</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {secteurs.map((s, i) => (
                        <span key={i} className="tag px-3 py-1.5 rounded-lg text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Session info */}
                {(status === 'session_proposed' || status === 'session_confirmed') && match.sessionDate && (
                  <Card className="p-6 slide-up" style={{ animationDelay: '0.1s', borderColor: status === 'session_confirmed' ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)' }}>
                    <SectionTitle>{status === 'session_confirmed' ? '✓ Session confirmée' : '📅 Session proposée'}</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="stat-block rounded-xl p-4 flex items-start gap-3">
                        <Icons.Calendar className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Date & heure</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {new Date(match.sessionDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            {' '}à{' '}
                            {new Date(match.sessionDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {match.sessionLink && (
                        <div className="stat-block rounded-xl p-4 flex items-start gap-3">
                          <Icons.Link className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Lien de réunion</p>
                            <a href={match.sessionLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline" style={{ color: '#0088ba' }}>Rejoindre →</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Refuse reason display */}
                {(status === 'founder_rejected' || status === 'session_refused') && match.founderRefuseReason && (
                  <Card className="p-6 slide-up" style={{ animationDelay: '0.1s', borderColor: 'rgba(239,68,68,0.3)' }}>
                    <SectionTitle>Motif de refus</SectionTitle>
                    <p className="text-sm text-gray-600 dark:text-slate-300 italic leading-relaxed">"{match.founderRefuseReason}"</p>
                  </Card>
                )}

              </div>

              {/* ── RIGHT: compatibility + decision ─────────────────── */}
              <div className="space-y-5">

                {/* Compatibility breakdown */}
                <Card className="p-6 slide-up" style={{ animationDelay: '0.07s' }}>
                  <SectionTitle>Compatibilité détaillée</SectionTitle>
                  <div className="space-y-3">
                    {compatRows.map((r) => (
                      <CompatBar key={r.label} label={r.label} value={r.value} color={scoreColor(r.value)} />
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Score global</span>
                    <span className="text-base font-bold" style={{ color: sc }}>{score}%</span>
                  </div>
                </Card>

                {/* Decision card */}
                <Card className="overflow-hidden slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">Votre décision</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0" style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="p-5">

                    {/* Active decision states */}
                    {(isPending || isSessionProposed) && (
                      <DecisionPanel
                        status={status}
                        note={note}
                        setNote={setNote}
                        refuseStep={refuseStep}
                        setRefuseStep={setRefuseStep}
                        actionLoading={actionLoading}
                        onAccept={isPending ? handleValidate : handleConfirmSession}
                        onRefuse={isPending ? handleRefuseMatch : handleRefuseSession}
                      />
                    )}

                    {/* Read-only states */}
                    {status === 'founder_validated' && (
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                          <Icons.Clock className="w-4 h-4" style={{ color: '#059669' }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Match accepté</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">L'équipe MEDIANET va organiser la prochaine étape avec l'investisseur.</p>
                        </div>
                      </div>
                    )}

                    {status === 'founder_rejected' && (
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                          <Icons.X className="w-4 h-4" style={{ color: '#dc2626' }} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Vous avez refusé ce match. Aucune action supplémentaire n'est requise.</p>
                      </div>
                    )}

                    {status === 'session_confirmed' && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                            <Icons.Check className="w-4 h-4" style={{ color: '#059669' }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Session confirmée</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Un email de confirmation vous a été envoyé.</p>
                          </div>
                        </div>
                        {match.sessionLink && (
                          <a
                            href={match.sessionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-btn flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                            style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)', display: 'flex' }}
                          >
                            <Icons.Link className="w-4 h-4" /> Rejoindre la session
                          </a>
                        )}
                      </div>
                    )}

                    {status === 'session_refused' && (
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                          <Icons.AlertCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Session refusée. L'admin peut vous proposer une nouvelle date.</p>
                      </div>
                    )}

                  </div>
                </Card>

                {/* Back link */}
                <Link
                  href="/dashboard/startup/matches"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/40"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <Icons.ArrowLeft className="w-4 h-4" /> Retour aux matches
                </Link>

              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}