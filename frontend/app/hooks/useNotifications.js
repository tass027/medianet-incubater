'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION TYPES REFERENCE
// ═══════════════════════════════════════════════════════════════════════════
export const NOTIFICATION_TYPES = {
  // Sessions
  session_assigned:       { label: 'Session assignée',        icon: '📅', color: '#006d94' },
  session_confirmed:      { label: 'Session confirmée',       icon: '✅', color: '#059669' },
  session_reminder:       { label: 'Rappel session',          icon: '⏰', color: '#d97706' },
  session_new:            { label: 'Nouvelle session',        icon: '🆕', color: '#7c3aed' },
  session_completed:      { label: 'Session terminée',        icon: '🏁', color: '#6b7280' },
  session_cancelled:      { label: 'Session annulée',         icon: '❌', color: '#dc2626' },
  session_pending:        { label: 'Session en attente',      icon: '⏳', color: '#d97706' },
  // Mentoring
  mentoring_request:      { label: 'Invitation mentorat',     icon: '🤝', color: '#db2777' },
  mentor_accepted:        { label: 'Mentor a accepté',        icon: '✅', color: '#059669' },
  mentor_declined:        { label: 'Mentor a décliné',        icon: '❌', color: '#dc2626' },
  mentor_decision:        { label: 'Décision mentor',         icon: '💬', color: '#7c3aed' },
  mentor_session_created: { label: 'Session créée (mentor)',  icon: '📋', color: '#006d94' },
  // Startup
  startup_assigned:       { label: 'Startup assignée',        icon: '🚀', color: '#f59e0b' },
  kpi_update_requested:   { label: 'Mise à jour KPIs',        icon: '📊', color: '#3b82f6' },
  feedback_requested:     { label: 'Feedback demandé',        icon: '📝', color: '#8b5cf6' },
  // System
  system:                 { label: 'Système',                  icon: 'ℹ️', color: '#6b7280' },
};

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — used as fallback when API is unavailable
// ═══════════════════════════════════════════════════════════════════════════
const MOCK_NOTIFICATIONS = [
  {
    _id: 'notif-1',
    type: 'session_assigned',
    title: 'Nouvelle session de mentorat',
    body: "L'administrateur vous a assigné une session de mentorat avec une startup FinTech. Date : dans 5 jours à 10h30.",
    link: '/dashboard/mentor/sessions',
    read: false,
    readAt: null,
    recipientRole: 'mentor',
    data: { sessionType: 'mentoring', domain: 'FinTech' },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif-2',
    type: 'session_reminder',
    title: 'Rappel — Session demain',
    body: 'Rappel : votre session de mentorat "Stratégie FinTech" a lieu demain à 10h30.',
    link: '/dashboard/mentor/sessions',
    read: false,
    readAt: null,
    recipientRole: 'mentor',
    data: { hoursUntil: 24 },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif-3',
    type: 'mentor_accepted',
    title: 'Mentor a accepté la session',
    body: 'Le mentor a confirmé sa disponibilité pour la session "Stratégie FinTech" du 28 avril.',
    link: '/dashboard/admin/startups',
    read: true,
    readAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    recipientRole: 'admin',
    data: {},
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif-4',
    type: 'kpi_update_requested',
    title: 'Mise à jour KPIs requise',
    body: 'Votre mentor vous demande de mettre à jour vos KPIs avant la prochaine session. Deadline : dans 3 jours.',
    link: '/dashboard/startup/kpis',
    read: false,
    readAt: null,
    recipientRole: 'startup',
    data: { requiresAction: true },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif-5',
    type: 'session_new',
    title: 'Nouvelle formation disponible',
    body: 'Une nouvelle formation "Growth Hacking Masterclass" est disponible. Date : dans 18 jours à 09h30.',
    link: '/dashboard/startup/sessions',
    read: true,
    readAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    recipientRole: 'startup',
    data: { sessionType: 'formation' },
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif-6',
    type: 'mentor_session_created',
    title: 'Nouvelle session créée par un mentor',
    body: 'Le mentor Yassine Khelif a planifié une session "Review Technique" en présentiel dans 6 jours.',
    link: '/dashboard/admin/startups',
    read: false,
    readAt: null,
    recipientRole: 'admin',
    data: {},
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format relative time (e.g. "il y a 2h", "maintenant")
 */
export function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours   / 24);

  if (seconds < 60)  return 'maintenant';
  if (minutes < 60)  return `il y a ${minutes} min`;
  if (hours   < 24)  return `il y a ${hours}h`;
  if (days    < 7)   return `il y a ${days}j`;
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Get notification type config (icon, color, label)
 */
export function getNotifConfig(type) {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * useNotifications
 *
 * @param {Object} options
 * @param {number}  options.pollingInterval  - ms between polls (default: 30_000). Set to 0 to disable.
 * @param {string}  options.recipientRole    - filter by role: 'admin' | 'mentor' | 'startup' | undefined (all)
 * @param {boolean} options.useMock          - force mock data (default: false)
 *
 * @returns {Object} {
 *   notifications, unreadCount, loading, error,
 *   markAsRead, markAllAsRead, deleteNotification, refetch,
 *   createLocalNotification,
 * }
 */
export function useNotifications({
  pollingInterval = 30_000,
  recipientRole   = undefined,
  useMock         = false,
} = {}) {
  const [notifications,  setNotifications]  = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [lastFetched,    setLastFetched]    = useState(null);
  const pollingRef = useRef(null);
  const abortRef   = useRef(null);

  // ── Build API URL ────────────────────────────────────────────────────────
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (recipientRole) params.set('role', recipientRole);
    const qs = params.toString();
    return `/api/notifications${qs ? `?${qs}` : ''}`;
  }, [recipientRole]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      if (useMock) throw new Error('mock');

      const res  = await fetch(buildUrl(), {
        credentials: 'include',
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.success) {
        setNotifications(json.data || []);
      } else {
        throw new Error(json.message || 'Erreur API');
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // cancelled — ignore
      // Fallback to mock data on any error
      let mock = MOCK_NOTIFICATIONS;
      if (recipientRole) mock = mock.filter(n => n.recipientRole === recipientRole);
      setNotifications(mock);
      if (!useMock) {
        setError(err.message);
        console.warn('[useNotifications] API unavailable, using mock data:', err.message);
      }
    } finally {
      if (!silent) setLoading(false);
      setLastFetched(new Date());
    }
  }, [buildUrl, useMock, recipientRole]);

  // ── Initial fetch + polling ──────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();

    if (pollingInterval > 0) {
      pollingRef.current = setInterval(() => fetchNotifications(true), pollingInterval);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (abortRef.current)   abortRef.current.abort();
    };
  }, [fetchNotifications, pollingInterval]);

  // ── Mark one as read ─────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
    );

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[useNotifications] markAsRead failed:', err.message);
      // Revert optimistic update on failure
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: false, readAt: null } : n)
      );
    }
  }, []);

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: now })));

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[useNotifications] markAllAsRead failed:', err.message);
    }
  }, []);

  // ── Delete one ───────────────────────────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));

    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[useNotifications] delete failed:', err.message);
    }
  }, []);

  // ── Create a local (in-memory) notification ──────────────────────────────
  // Useful for showing immediate feedback after an admin action
  const createLocalNotification = useCallback(({ type, title, body, link, data = {} }) => {
    const notif = {
      _id:     `local-${Date.now()}`,
      type,
      title,
      body,
      link:    link || '#',
      read:    false,
      readAt:  null,
      data,
      createdAt: new Date().toISOString(),
      _isLocal: true,
    };
    setNotifications(prev => [notif, ...prev]);
    return notif;
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;

  const groupedByDate = notifications.reduce((acc, n) => {
    const date = new Date(n.createdAt);
    const today    = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    let key;
    if (date.toDateString() === today.toDateString())     key = "Aujourd'hui";
    else if (date.toDateString() === yesterday.toDateString()) key = 'Hier';
    else key = date.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });

    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return {
    // Data
    notifications,
    unreadCount,
    groupedByDate,
    lastFetched,

    // State
    loading,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createLocalNotification,
    refetch: () => fetchNotifications(false),
    refetchSilent: () => fetchNotifications(true),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/** Hook for admin dashboard — polls every 30s */
export function useAdminNotifications() {
  return useNotifications({ recipientRole: 'admin', pollingInterval: 30_000 });
}

/** Hook for mentor dashboard — polls every 45s */
export function useMentorNotifications() {
  return useNotifications({ recipientRole: 'mentor', pollingInterval: 45_000 });
}

/** Hook for startup dashboard — polls every 60s */
export function useStartupNotifications() {
  return useNotifications({ recipientRole: 'startup', pollingInterval: 60_000 });
}

/** Lightweight hook that only returns unread count (for nav badges) */
export function useUnreadCount(recipientRole) {
  const { unreadCount, loading } = useNotifications({
    recipientRole,
    pollingInterval: 20_000,
  });
  return { unreadCount, loading };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SIDE HELPER (for API route handlers)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a notification payload to insert in MongoDB
 * Use in your Next.js API routes or Express controllers
 *
 * @example
 * await db.collection('notifications').insertOne(
 *   buildNotificationPayload({
 *     recipientId:   mentor._id,
 *     recipientRole: 'mentor',
 *     type:          'session_assigned',
 *     title:         'Nouvelle session de mentorat',
 *     body:          `Session "${session.title}" planifiée.`,
 *     link:          `/dashboard/mentor/sessions`,
 *     data:          { sessionId: session._id },
 *   })
 * );
 */
export function buildNotificationPayload({
  recipientId,
  recipientRole,
  type,
  title,
  body,
  link = '#',
  data = {},
}) {
  return {
    recipientId,
    recipientRole,
    type,
    title,
    body,
    link,
    read:      false,
    readAt:    null,
    data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}