'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

const MATCHING_ALLOWED = ['accepted', 'approved', 'active', 'interview'];
const POLL_INTERVAL_MS = 15000;  // vérifier toutes les 15s (Ollama peut être lent)
const POLL_MAX_ATTEMPTS = 40;    // 40 × 15s ≈ 10 min max (suffisant pour Mistral local)

const Icons = {
  refresh: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>),
  investor: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
  mentor: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>),
  jury: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>),
  check: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>),
  x: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>),
  mail: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>),
  spark: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>),
  lock: (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>),
  clock: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
};

function scoreColor(s) {
  if (s >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', ring: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
  if (s >= 60) return { text: 'text-amber-600 dark:text-amber-400',   ring: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30' };
  return         { text: 'text-red-600 dark:text-red-400',            ring: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/30' };
}

function ScoreRing({ score, size = 52 }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const { ring } = scoreColor(score);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-gray-800" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={ring} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${scoreColor(score).text}`}>{score}</span>
      </div>
    </div>
  );
}

// ── Barre de progression pour le polling ────────────────────────────────────
function PollingProgress({ attempts, max }) {
  const pct = Math.min(100, Math.round((attempts / max) * 100));
  const elapsed = attempts * (POLL_INTERVAL_MS / 1000);
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
          <span className="animate-spin">{Icons.clock}</span>
          Analyse IA en cours…
        </div>
        <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">{elapsed}s écoulées</span>
      </div>
      <div className="w-full h-1.5 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-blue-400 dark:text-blue-500 mt-1.5">
        Vérification {attempts}/{max} — résultats disponibles dans ~{Math.max(0, Math.round(((max - attempts) * POLL_INTERVAL_MS) / 1000))}s
      </p>
    </div>
  );
}

function MatchCard({ item, type, onValidate, onEmail, applicationId }) {
  const [expanded, setExpanded] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const name    = item.investorName || item.mentorName || item.juryName || '—';
  const subline = item.investorType || (item.expertise || []).join(', ') || '';
  const score   = item.score ?? 0;

  const statusColors = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    pending:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  const statusLabels = { approved: 'Validé', rejected: 'Rejeté', pending: 'En attente' };
  const itemStatus   = item.status || 'pending';

  const handleValidate = async (action) => {
    setLoading(true);
    await onValidate(item, action);
    setLoading(false);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 transition-all hover:shadow-sm">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ScoreRing score={score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">{name}</p>
                {subline && <p className="text-xs text-gray-500 dark:text-gray-400">{subline}</p>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[itemStatus]}`}>
                {statusLabels[itemStatus]}
              </span>
            </div>
            {item.reasoning && (
              <p className={`text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-1.5 ${!expanded ? 'line-clamp-2' : ''}`}>
                {item.reasoning}
              </p>
            )}
            {(item.highlights?.length > 0 || item.risks?.length > 0) && expanded && (
              <div className="mt-2 space-y-1.5">
                {item.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.highlights.map((h, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                        <span className="text-emerald-500">{Icons.check}</span>{h}
                      </span>
                    ))}
                  </div>
                )}
                {item.risks?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.risks.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full">
                        ⚠ {r}
                      </span>
                    ))}
                  </div>
                )}
                {/* needsMatch / coveredNeeds */}
                {(item.needsMatch?.length > 0 || item.coveredNeeds?.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(item.needsMatch || item.coveredNeeds || []).map((n, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full">
                        ✦ {n}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setExpanded((x) => !x)}
            className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {expanded ? '▲ Réduire' : '▼ Voir détails'}
          </button>
          {itemStatus === 'pending' && (
            <div className="flex gap-1.5">
              <button onClick={() => handleValidate('reject')} disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50">
                {Icons.x} Rejeter
              </button>
              <button onClick={() => handleValidate('approve')} disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 rounded-lg transition-all disabled:opacity-50">
                {Icons.check} Valider
              </button>
              <button onClick={() => onEmail(item, type)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 rounded-lg transition-all">
                {Icons.mail} Email
              </button>
            </div>
          )}
          {itemStatus !== 'pending' && (
            <button onClick={() => onEmail(item, type)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 rounded-lg transition-all">
              {Icons.mail} Contacter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailModal({ item, type, startupName, onClose, onSend }) {
  const name = item?.investorName || item?.mentorName || item?.juryName || '';
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await onSend(message);
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Envoyer un email</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">À : {name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">{Icons.x}</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400">
            Destinataire : <strong className="text-gray-700 dark:text-gray-200">{name}</strong>
            {' · '}Startup : <strong className="text-gray-700 dark:text-gray-200">{startupName}</strong>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              Message personnalisé (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Ajoutez un message personnalisé…"
            />
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Annuler
          </button>
          <button onClick={handleSend} disabled={sending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
            {sending
              ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Envoi…</>)
              : (<>{Icons.mail} Envoyer</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function MatchingPanel({ applicationId, applicationStatus, onApproved }) {
  const { token } = useSelector((s) => s.auth);

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [triggering,   setTriggering]   = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [error,        setError]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('investors');
  const [emailModal,   setEmailModal]   = useState(null);
  const [notification, setNotification] = useState(null);

  // Ref pour éviter les fuites mémoire si le composant se démonte pendant le polling
  const pollRef    = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Garde : statuts non autorisés
  if (!MATCHING_ALLOWED.includes(applicationStatus)) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 mb-4">
          {Icons.lock}
        </div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Matching IA disponible pour les startups acceptées
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Statut actuel : <span className="font-mono font-bold">{applicationStatus}</span>
        </p>
      </div>
    );
  }

  // ✅ FIX: Lire le token depuis localStorage en fallback si Redux est vide (après F5)
  const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
  };

  const showNotif = (msg, type = 'success') => {
    if (!mountedRef.current) return;
    setNotification({ msg, type });
    setTimeout(() => { if (mountedRef.current) setNotification(null); }, 5000);
  };

  // ── fetchMatches ──────────────────────────────────────────────────────────
  // silent=true → ne touche pas loading, retourne les données
  const fetchMatches = useCallback(async (silent = false) => {
    if (!applicationId) return null;
    if (!silent && mountedRef.current) setLoading(true);
    if (!silent && mountedRef.current) setError(null);
    try {
      const res = await fetch(`/api/matching/${applicationId}`, {
        credentials: 'include',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      
      // ✅ FIX: Gérer la structure du backend
      // Le backend retourne soit { data: { matching: { investors, mentors, jury } } }
      // soit directement { matching: { investors, mentors, jury } }
      let normalizedData = json.data || json;
      
      // Si les données viennent de Application.matching, restructurer
      if (normalizedData?.matching && !normalizedData?.investors) {
        normalizedData = {
          ...normalizedData,
          investors: normalizedData.matching?.investors || [],
          mentors:   normalizedData.matching?.mentors   || [],
          jury:      normalizedData.matching?.jury      || [],
        };
      }
      
      if (mountedRef.current) {
        setData(normalizedData);
        // Choisir l'onglet par défaut selon le mode
        if (normalizedData?.jury?.length > 0 && !(normalizedData?.investors?.length > 0)) {
          setActiveTab('jury');
        } else {
          setActiveTab('investors');
        }
      }
      return normalizedData;
    } catch (err) {
      if (!silent && mountedRef.current) setError(err.message);
      return null;
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, [applicationId, effectiveToken]); // ✅ FIX: Utiliser effectiveToken au lieu de token

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // ── Démarrer le polling ───────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    if (mountedRef.current) setPollAttempts(0);

    pollRef.current = setInterval(async () => {
      if (!mountedRef.current) { clearInterval(pollRef.current); return; }
      attempts++;
      setPollAttempts(attempts);

      const d = await fetchMatches(true); // silencieux

      const isDone   = d?.status === 'completed' || d?.matchStatus === 'completed' || (d?.investors?.length > 0 || d?.mentors?.length > 0);
      const isFailed = d?.status === 'failed'    || d?.matchStatus === 'failed';
      const maxed    = attempts >= POLL_MAX_ATTEMPTS;

      if (isDone || isFailed || maxed) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        if (mountedRef.current) {
          setTriggering(false);
          setPollAttempts(0);
          if (isDone)   showNotif('✅ Matching IA terminé avec succès.');
          if (isFailed) showNotif('❌ Le matching a échoué — vérifiez les logs Ollama.', 'error');
          if (maxed && !isDone && !isFailed)
            showNotif('⏱ Délai max atteint — le matching tourne toujours en arrière-plan.', 'error');
        }
      }
    }, POLL_INTERVAL_MS);
  }, [fetchMatches]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Déclencher le matching (mode ASYNC + polling) ─────────────────────────
  const handleTrigger = async () => {
    if (triggering) return;
    // Bloquer si pas de besoins
    if (data?.hasNeeds === false) {
      showNotif('⚠ Ajoutez des besoins avant de lancer le matching.', 'error');
      return;
    }
    setTriggering(true);
    setError(null);
    try {
      // ✅ On appelle /trigger (async) et NON /trigger/sync
      // Cela évite l'ECONNRESET lié au timeout proxy Next.js (~60s)
      const res = await fetch(`/api/matching/trigger/${applicationId}`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur HTTP ${res.status}`);
      }
      showNotif(' Matching lancé — polling en cours…', 'info');
      startPolling();
    } catch (err) {
      setError(err.message);
      showNotif(err.message, 'error');
      setTriggering(false);
    }
  };

  // ── Valider / rejeter un match ────────────────────────────────────────────
  const handleValidate = async (item, action) => {
    try {
      const isInvestor = !!item.investorId;
      const endpoint   = isInvestor
        ? `/api/matching/${applicationId}/validate`
        : `/api/matching/${applicationId}/validate-mentor`;
      const body = isInvestor
        ? { investorId: String(item.investorId || item._id), action }
        : { mentorId:   String(item.mentorId   || item._id), action };

      const res = await fetch(endpoint, {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      // Mise à jour optimiste du state
      setData((prev) => {
        if (!prev) return prev;
        const updateList = (list, idField) =>
          (list || []).map((x) =>
            String(x[idField] || x._id) === String(body[isInvestor ? 'investorId' : 'mentorId'])
              ? { ...x, status: action === 'approve' ? 'approved' : 'rejected' }
              : x
          );
        const updated = {
          ...prev,
          investors: isInvestor ? updateList(prev.investors, 'investorId') : prev.investors,
          mentors:  !isInvestor ? updateList(prev.mentors,   'mentorId')   : prev.mentors,
        };

        // Vérifier si tous les matches ont été examinés (plus de "pending")
        const allItems = [...(updated.investors || []), ...(updated.mentors || []), ...(updated.jury || [])];
        const anyPending = allItems.some((x) => !x.status || x.status === 'pending');

        // Notification et callback après approbation
        if (action === 'approve') {
          if (!anyPending) {
            showNotif("✅ Match validé. Pensez à finaliser l'assignation dans l'onglet dédié.");
            if (typeof onApproved === 'function') onApproved();
          } else {
            showNotif('✅ Match validé.');
          }
        } else {
          showNotif('❌ Match rejeté.');
        }

        return updated;
      });
    } catch (err) {
      showNotif(err.message, 'error');
    }
  };

  // ── Envoyer un email ──────────────────────────────────────────────────────
  const handleEmailSend = async (message) => {
    if (!emailModal) return;
    const { item, type } = emailModal;
    const name  = item.investorName || item.mentorName || item.juryName || '';
    const email = item.email || item.investorEmail || item.mentorEmail || '';
    try {
      const res = await fetch(`/api/matching/${applicationId}/send-email`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders,
        body: JSON.stringify({
          type,
          targetId:    String(item.investorId || item.mentorId || item._id || ''),
          targetEmail: email,
          targetName:  name,
          startupName: data?.startupName || '',
          message,
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      showNotif(`📧 Email envoyé à ${name}.`);
    } catch (err) {
      showNotif(err.message, 'error');
    }
  };

  // ── Dériver les données affichées ─────────────────────────────────────────
  const investors  = data?.investors || [];
  const mentors    = data?.mentors   || [];
  const jury       = data?.jury      || [];
  const isEvalMode = jury.length > 0 && investors.length === 0;

  const tabs = isEvalMode
    ? [{ id: 'jury',      label: `Jury (${jury.length})`,               icon: Icons.jury }]
    : [
        { id: 'investors', label: `Investisseurs (${investors.length})`, icon: Icons.investor },
        { id: 'mentors',   label: `Mentors (${mentors.length})`,         icon: Icons.mentor },
      ];

  const currentList = activeTab === 'investors' ? investors : activeTab === 'mentors' ? mentors : jury;
  const iType       = activeTab === 'investors' ? 'investor' : activeTab === 'mentors' ? 'mentor' : 'jury';

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Notification */}
      {notification && (
        <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          notification.type === 'error'
            ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            : notification.type === 'info'
            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
        }`}>
          {notification.type === 'error' ? Icons.x : Icons.check}
          {notification.msg}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
            {Icons.spark}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Matching IA</p>
            {data?.generatedAt && (
              <p className="text-[10px] text-gray-400">
                Dernier matching : {new Date(data.generatedAt).toLocaleString('fr-FR')}
              </p>
            )}
            {data?.hasNeeds === false && !triggering && (
              <p className="text-[10px] text-amber-500">⚠ Besoins non renseignés — matching générique</p>
            )}
          </div>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering || loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={triggering ? 'animate-spin' : ''}>{Icons.refresh}</span>
          {triggering ? 'Calcul en cours…' : 'Relancer le matching'}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Barre de progression polling */}
      {triggering && (
        <PollingProgress attempts={pollAttempts} max={POLL_MAX_ATTEMPTS} />
      )}

      {/* Chargement initial */}
      {loading && !triggering && (
        <div className="flex items-center justify-center py-10 gap-3">
          <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400">Chargement…</span>
        </div>
      )}

      {/* État vide — aucun matching encore */}
 {!loading && !triggering && !error && !data && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 mb-4">
      {Icons.spark}
    </div>
    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Aucun matching généré</p>
    <p className="text-xs text-gray-400 mb-4">Ajoutez des besoins dans l'onglet "Besoins", puis lancez le matching.</p>
  </div>
)}

{/* Besoins non renseignés — matching bloqué */}
{!loading && data && data.hasNeeds === false && !triggering && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-400 mb-4">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
      </svg>
    </div>
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Besoins non renseignés</p>
    <p className="text-xs text-gray-400 mb-4 max-w-xs">
      Ajoutez au moins un besoin dans l'onglet <strong>"Besoins"</strong> pour générer un matching pertinent.
    </p>
    <button
      onClick={() => {/* pas de trigger ici */}}
      disabled
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-xl cursor-not-allowed"
    >
      {Icons.spark} Lancer le matching
    </button>
  </div>
)}

{/* Résultats — uniquement si hasNeeds */}
    {!loading && data && data.hasNeeds !== false && (
        <>
          {/* Onglets */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Statistiques rapides */}
          {currentList.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total',      value: currentList.length,                                        color: 'text-gray-700 dark:text-gray-200' },
                { label: 'Validés',    value: currentList.filter((x) => x.status === 'approved').length, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'En attente', value: currentList.filter((x) => !x.status || x.status === 'pending').length, color: 'text-amber-600 dark:text-amber-400' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Liste vide */}
          {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucun {iType} trouvé dans ce matching.</p>
              <p className="text-xs text-gray-400 mt-1">Relancez le matching pour obtenir de nouveaux résultats.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {currentList.map((item, idx) => (
                <MatchCard
                  key={item.investorId || item.mentorId || item.juryId || idx}
                  item={item}
                  type={iType}
                  applicationId={applicationId}
                  onValidate={handleValidate}
                  onEmail={(i, t) => setEmailModal({ item: i, type: t })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal email */}
      {emailModal && (
        <EmailModal
          item={emailModal.item}
          type={emailModal.type}
          startupName={data?.startupName || ''}
          onClose={() => setEmailModal(null)}
          onSend={handleEmailSend}
        />
      )}
    </div>
  );
}