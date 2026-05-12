// hooks/useAdminDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API  = `${BASE}/api`;

// ─── Core fetcher ─────────────────────────────────────────────────────────────
async function apiFetch(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

// ─── Initial state ────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  stats:         { data: null, loading: true, error: null },
  appsTimeline:  { data: [],   loading: true, error: null },
  appsByStatus:  { data: [],   loading: true, error: null },
  usersByRole:   { data: [],   loading: true, error: null },
  userGrowth:    { data: [],   loading: true, error: null },
  programmes:    { data: [],   loading: true, error: null },
  evalScores:    { data: null, loading: true, error: null },
  sessions:      { data: [],   loading: true, error: null },
  recentApps:    { data: [],   loading: true, error: null },
  topMentors:    { data: [],   loading: true, error: null },
  activityFeed:  { data: [],   loading: true, error: null },
  perfMetrics:   { data: [],   overall: 0, loading: true, error: null },
  notifications: { data: null, loading: true, error: null },
};

export function useAdminDashboard() {
  // Read accessToken from Redux (defined in authSlice)
  const { accessToken } = useSelector(s => s.auth);

  const [state, setState]           = useState(INITIAL_STATE);
  const [lastRefresh, setLastRefresh] = useState(null);

  // ── Partial state update ─────────────────────────────────────────────────
  const update = useCallback((key, patch) => {
    setState(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  // ── Fetch a single section with optional transform ────────────────────────
  const fetchSection = useCallback(async (key, path, transform) => {
    try {
      const raw         = await apiFetch(path, accessToken);
      const transformed = transform ? transform(raw) : { data: raw };
      update(key, { ...transformed, loading: false, error: null });
    } catch (err) {
      update(key, { loading: false, error: err.message });
    }
  }, [accessToken, update]);

  // ── Fetch everything in parallel ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    // ⚠️  Guard: never fire without a token — avoids 401 race on mount
    if (!accessToken) return;

    // Reset to loading
    setState(prev => {
      const next = {};
      Object.keys(prev).forEach(k => {
        next[k] = { ...prev[k], loading: true, error: null };
      });
      return next;
    });

    await Promise.allSettled([
      fetchSection('stats',        '/admin/dashboard/stats'),
      fetchSection('appsTimeline', '/admin/dashboard/charts/applications-timeline'),
      fetchSection('appsByStatus', '/admin/dashboard/charts/applications-by-status'),
      fetchSection('usersByRole',  '/admin/dashboard/charts/users-by-role'),
      fetchSection('userGrowth',   '/admin/dashboard/charts/user-growth'),
      fetchSection('programmes',   '/admin/dashboard/charts/programmes-overview'),

      // evalScores: json.data = { ai, jury, avgAi, avgJury }
      fetchSection('evalScores', '/admin/dashboard/charts/evaluations-scores',
        raw => ({ data: raw })),

      fetchSection('sessions',     '/admin/dashboard/charts/sessions-activity'),
      fetchSection('recentApps',   '/admin/dashboard/recent-applications'),
      fetchSection('topMentors',   '/admin/dashboard/top-mentors'),
      fetchSection('activityFeed', '/admin/dashboard/activity-feed'),

      // perfMetrics: controller returns { success, data: { data:[...], overall:N } }
      // apiFetch already extracts json.data → raw = { data:[...], overall:N }
      fetchSection('perfMetrics', '/admin/dashboard/performance-metrics',
        raw => ({
          data:    Array.isArray(raw?.data)            ? raw.data    : [],
          overall: typeof raw?.overall === 'number'    ? raw.overall : 0,
        })),

      // notifications: { total, unread, byType }
      fetchSection('notifications', '/admin/dashboard/notifications-summary',
        raw => ({ data: raw })),
    ]);

    setLastRefresh(new Date());
  }, [fetchSection, accessToken]);

  // ── Refresh a single section ──────────────────────────────────────────────
  const refreshSection = useCallback((key) => {
    const pathMap = {
      stats:         '/admin/dashboard/stats',
      appsTimeline:  '/admin/dashboard/charts/applications-timeline',
      appsByStatus:  '/admin/dashboard/charts/applications-by-status',
      usersByRole:   '/admin/dashboard/charts/users-by-role',
      userGrowth:    '/admin/dashboard/charts/user-growth',
      programmes:    '/admin/dashboard/charts/programmes-overview',
      evalScores:    '/admin/dashboard/charts/evaluations-scores',
      sessions:      '/admin/dashboard/charts/sessions-activity',
      recentApps:    '/admin/dashboard/recent-applications',
      topMentors:    '/admin/dashboard/top-mentors',
      activityFeed:  '/admin/dashboard/activity-feed',
      perfMetrics:   '/admin/dashboard/performance-metrics',
      notifications: '/admin/dashboard/notifications-summary',
    };
    if (pathMap[key]) fetchSection(key, pathMap[key]);
  }, [fetchSection]);

  // ── KEY FIX: two separate effects ─────────────────────────────────────────
  //
  // The original code used a single useEffect([loadAll, refreshKey]) which fired
  // on mount — at that point Redux hadn't been hydrated by refreshTokens() yet,
  // so accessToken was still null and every API call returned 401.
  //
  // Fix: watch `accessToken` explicitly. The effect runs once when the component
  // mounts (skipped because token is null), then re-runs the moment ProtectedRoute
  // finishes the refresh-token flow and Redux sets the token.
  useEffect(() => {
    if (!accessToken) return; // wait for token — do not fetch yet
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000); // auto-refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchAll, accessToken]); // accessToken in deps = re-fire when token arrives

  // ── Derived helpers ───────────────────────────────────────────────────────
  const isAnyLoading = Object.values(state).some(s => s.loading);
  const hasErrors    = Object.entries(state)
    .filter(([, s]) => s.error)
    .map(([k, s]) => ({ section: k, error: s.error }));

  return {
    stats:         state.stats,
    appsTimeline:  state.appsTimeline,
    appsByStatus:  state.appsByStatus,
    usersByRole:   state.usersByRole,
    userGrowth:    state.userGrowth,
    programmes:    state.programmes,
    evalScores:    state.evalScores,
    sessions:      state.sessions,
    recentApps:    state.recentApps,
    topMentors:    state.topMentors,
    activityFeed:  state.activityFeed,
    perfMetrics:   state.perfMetrics,
    notifications: state.notifications,
    refresh:       fetchAll,
    refreshSection,
    lastRefresh,
    isAnyLoading,
    hasErrors,
  };
}