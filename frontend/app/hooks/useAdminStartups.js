'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

// ─── Normalise une startup venant du backend ──────────────────────────────────
function normalizeStartup(app) {
  const name =
    app.project?.startupName ||
    app.startupName ||
    app.formResponses?.startupName ||
    'Startup';

  const sector =
    app.project?.sector ||
    app.sector ||
    app.formResponses?.sector ||
    'SaaS';

  const stage =
    app.project?.stage ||
    app.stage ||
    app.formResponses?.stage ||
    'mvp';

  const location =
    app.project?.location || app.location || 'Tunis, Tunisie';

  const founder =
    app.team?.founderName ||
    app.founder ||
    app.founderName ||
    app.formResponses?.founderName ||
    'Fondateur';

  const website = app.project?.website || app.website || '';

  const description =
    app.project?.description ||
    app.description ||
    app.formResponses?.description ||
    '';

  // ── Documents : toujours un array de strings ──────────────────
  const rawDocs = app.documents || [];
  const documents = rawDocs.map((d) => {
    if (typeof d === 'string') return d;
    return d?.name || d?.filename || '[document]';
  });

  // ── Score ──────────────────────────────────────────────────────
  let score = 65;
  if (typeof app.totalScore === 'number') {
    score = app.totalScore;
  } else if (typeof app.aiScore?.total === 'number') {
    score = app.aiScore.total;
  } else if (app.detailedScores) {
    score = Math.round(
      (app.detailedScores.team       ?? 0) * 0.3 +
      (app.detailedScores.innovation ?? 0) * 0.25 +
      (app.detailedScores.market     ?? 0) * 0.2 +
      (app.detailedScores.business   ?? 0) * 0.15 +
      (app.detailedScores.traction   ?? 0) * 0.1
    );
  }

  // ── KPIs ──────────────────────────────────────────────────────
  const kpis = app.kpis || {
    mrr:    app.economy?.monthlyRevenue ? `${app.economy.monthlyRevenue} TND` : '—',
    users:  app.economy?.customers ?? 0,
    growth: app.economy?.growthRate || '—',
  };

  // ── Assignations ──────────────────────────────────────────────
  const investorIds =
    app.investorIds?.length       ? app.investorIds :
    app.assignedInvestorIds?.length ? app.assignedInvestorIds :
    (app.matching?.investors || []).filter((i) => i.status === 'approved').map((i) => String(i.investorId || i._id));

  const mentorIds =
    app.mentorIds?.length       ? app.mentorIds :
    app.assignedMentorIds?.length ? app.assignedMentorIds :
    (app.matching?.mentors || []).filter((m) => m.status === 'approved').map((m) => String(m.mentorId || m._id));

  // ── Logo (initiales) ──────────────────────────────────────────
  const logo = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Status UI ─────────────────────────────────────────────────
  const statusMap = {
    accepted:  'active',
    approved:  'active',
    graduated: 'graduated',
    paused:    'paused',
  };
  const status = statusMap[app.status] || 'active';

  return {
    id:                String(app._id),
    _id:               String(app._id),
    name,
    sector,
    stage,
    location,
    founder,
    website,
    description,
    documents,
    score,
    kpis,
    investorIds:       investorIds || [],
    mentorIds:         mentorIds   || [],
    logo,
    status,
    programmeName:     app.programmeName    || null,
    timelinePhase:     app.timelinePhase    || 'ideation',
    timelineProgress:  app.timelineProgress ?? 20,
    timelineNotes:     app.timelineNotes    || '',
    applicationStatus: app.status,
    acceptedAt:        app.decidedAt || app.updatedAt || app.createdAt,
    aiScore:           app.aiScore   || null,
    matching:          app.matching  || null,
    besoins:           app.besoins           || [],
    sessionHistory:    app.sessionHistory    || [],
    startupFormations: app.startupFormations || [],
    formResponses:     app.formResponses     || {},
  };
}

// ─── Lit le token depuis toutes les sources possibles ────────────────────────
function resolveToken(reduxState) {
  // 1. Essayer toutes les clés connues dans Redux state.auth
  const auth = reduxState || {};
  const fromRedux =
    auth.token        ||
    auth.accessToken  ||
    auth.access_token ||
    auth.jwt          ||
    auth.authToken    ||
    null;

  if (fromRedux) return fromRedux;

  // 2. Fallback localStorage (côté client uniquement)
  if (typeof window === 'undefined') return null;

  const lsKeys = ['token', 'accessToken', 'authToken', 'jwt', 'access_token', 'auth_token'];
  for (const key of lsKeys) {
    const v = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (v && v !== 'null' && v !== 'undefined') return v;
  }

  // 3. Cookie JS-accessible
  const cookies = document.cookie.split(';').map((c) => c.trim());
  const tokenCookie = cookies.find(
    (c) =>
      c.startsWith('token=') ||
      c.startsWith('authToken=') ||
      c.startsWith('jwt=') ||
      c.startsWith('accessToken=')
  );
  if (tokenCookie) return tokenCookie.split('=').slice(1).join('=');

  return null;
}

// ════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ════════════════════════════════════════════════════════════════
export function useAdminStartups({ sector, status, search } = {}) {
  const authState = useSelector((state) => state.auth);
  
  // ← Stocker authState dans un ref pour que les callbacks lisent toujours la valeur fraîche
  const authRef = useRef(authState);
  useEffect(() => {
    authRef.current = authState;
  }, [authState]);

  const [startups, setStartups] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // makeHeaders lit depuis le ref → toujours à jour, sans dépendance instable
  const makeHeaders = useCallback((extra = {}) => {
    const tok = resolveToken(authRef.current);
    return {
      'Content-Type': 'application/json',
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      ...extra,
    };
  }, []); // ← dépendances vides : stable pour toujours

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sector && sector !== 'all') params.set('sector', sector);
      if (status && status !== 'all') params.set('status', status);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/startups?${params}`, {
        credentials: 'include',
        headers: makeHeaders(),
      });

      if (res.status === 401) throw new Error('Session expirée (401).');
      if (!res.ok) {
        let msg = `Erreur ${res.status}`;
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }

      const json = await res.json();
      const raw  = json.data || json.startups || json || [];
      const arr  = Array.isArray(raw) ? raw : Object.values(raw);
      setStartups(arr.map(normalizeStartup));
    } catch (err) {
      setError(err.message);
      setStartups([]);
    } finally {
      setLoading(false);
    }
  }, [sector, status, search, makeHeaders]);

  useEffect(() => { fetchStartups(); }, [fetchStartups]);

  const updateAssignments = useCallback(
    async (startupId, investorIds, mentorIds) => {
      if (!startupId) throw new Error('startupId manquant');

      const res = await fetch(`/api/admin/startups/${startupId}/assign`, {
        method: 'PATCH',
        credentials: 'include',
        headers: makeHeaders(),
        body: JSON.stringify({
          investorIds: investorIds.map(String), // ← forcer strings
          mentorIds:   mentorIds.map(String),
        }),
      });

      if (!res.ok) {
        let msg = `Erreur ${res.status}`;
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }

      const json = await res.json();
      setStartups((prev) =>
        prev.map((s) => s.id === String(startupId)
          ? { ...s, investorIds: investorIds.map(String), mentorIds: mentorIds.map(String) }
          : s
        )
      );
      return json;
    },
    [makeHeaders]
  );

  const updateTimeline = useCallback(
    async (startupId, timelinePhase, timelineProgress, timelineNotes) => {
      const res = await fetch(`/api/admin/startups/${startupId}/timeline`, {
        method: 'PATCH',
        credentials: 'include',
        headers: makeHeaders(),
        body: JSON.stringify({ timelinePhase, timelineProgress, timelineNotes }),
      });
      if (!res.ok) {
        let msg = `Erreur ${res.status}`;
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      const json = await res.json();
      setStartups((prev) =>
        prev.map((s) => s.id === String(startupId)
          ? { ...s, timelinePhase, timelineProgress, timelineNotes }
          : s
        )
      );
      return json;
    },
    [makeHeaders]
  );

  return { startups, loading, error, refetch: fetchStartups, updateAssignments, updateTimeline };
}