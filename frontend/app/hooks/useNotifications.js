'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axiosAuth from '@/app/lib/axiosAuth';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════
export const NOTIFICATION_TYPES = {
  session_assigned:       { label: 'Session assignée',       color: '#006d94' },
  session_confirmed:      { label: 'Session confirmée',      color: '#059669' },
  session_reminder:       { label: 'Rappel session',          color: '#d97706' },
  session_new:            { label: 'Nouvelle session',        color: '#7c3aed' },
  session_completed:      { label: 'Session terminée',        color: '#6b7280' },
  session_cancelled:      { label: 'Session annulée',         color: '#dc2626' },
  session_pending:        { label: 'Session en attente',      color: '#d97706' },
  mentoring_request:      { label: 'Invitation mentorat',     color: '#db2777' },
  mentor_accepted:        { label: 'Mentor a accepté',        color: '#059669' },
  mentor_declined:        { label: 'Mentor a décliné',        color: '#dc2626' },
  mentor_decision:        { label: 'Décision mentor',         color: '#7c3aed' },
  mentor_session_created: { label: 'Session créée (mentor)',  color: '#006d94' },
  startup_assigned:       { label: 'Startup assignée',        color: '#f59e0b' },
  kpi_update_requested:   { label: 'Mise à jour KPIs',        color: '#3b82f6' },
  feedback_requested:     { label: 'Feedback demandé',        color: '#8b5cf6' },
  system:                 { label: 'Système',                 color: '#6b7280' },
};

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
export function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const diff    = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours   / 24);
  if (seconds < 60) return 'maintenant';
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours   < 24) return `il y a ${hours}h`;
  if (days    < 7)  return `il y a ${days}j`;
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function getNotifConfig(type) {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
}

// ═══════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════
export function useNotifications({
  pollingInterval = 30_000,
  recipientRole   = undefined,
} = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [lastFetched,   setLastFetched]   = useState(null);

  const pollingRef = useRef(null);
  const socketRef  = useRef(null);

  // ── Fetch ──────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const { data } = await axiosAuth.get('/api/notifications');
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setNotifications([]);
        return;
      }
      console.error('[useNotifications] fetch error:', err.message);
      setError(err.message);
      setNotifications([]);
    } finally {
      if (!silent) setLoading(false);
      setLastFetched(new Date());
    }
  }, []);

  // ── Polling ────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    if (pollingInterval > 0) {
      pollingRef.current = setInterval(() => fetchNotifications(true), pollingInterval);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchNotifications, pollingInterval]);

  // ── Socket.IO temps réel ───────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userId = window.__notifUserId;
    if (!userId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    socketRef.current = io(apiUrl, {
      auth:                { userId, role: recipientRole },
      withCredentials:     true,
      reconnectionAttempts: 5,
      transports:          ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket] connecté, room:', userId);
    });

    socketRef.current.on('notification:new', (notif) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
    });

    socketRef.current.on('connect_error', (err) => {
      console.warn('[Socket] erreur:', err.message);
    });

    return () => socketRef.current?.disconnect();
  }, [recipientRole]);

  // ── Actions ────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
    );
    try {
      await axiosAuth.patch(`/api/notifications/${id}/read`);
    } catch (err) {
      console.warn('[useNotifications] markAsRead failed:', err.message);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: false, readAt: null } : n)
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: now })));
    try {
      await axiosAuth.patch('/api/notifications/read-all');
    } catch (err) {
      console.warn('[useNotifications] markAllAsRead failed:', err.message);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    try {
      await axiosAuth.delete(`/api/notifications/${id}`);
    } catch (err) {
      console.warn('[useNotifications] delete failed:', err.message);
    }
  }, []);

  // ── Derived ────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;

  const groupedByDate = notifications.reduce((acc, n) => {
    const date      = new Date(n.createdAt);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    let key;
    if (date.toDateString() === today.toDateString())          key = "Aujourd'hui";
    else if (date.toDateString() === yesterday.toDateString()) key = 'Hier';
    else key = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return {
    notifications, unreadCount, groupedByDate, lastFetched,
    loading, error,
    markAsRead, markAllAsRead, deleteNotification,
    refetch:       () => fetchNotifications(false),
    refetchSilent: () => fetchNotifications(true),
  };
}

// ═══════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════
export function useAdminNotifications()   { return useNotifications({ recipientRole: 'admin',   pollingInterval: 30_000 }); }
export function useMentorNotifications()  { return useNotifications({ recipientRole: 'mentor',  pollingInterval: 45_000 }); }
export function useStartupNotifications() { return useNotifications({ recipientRole: 'startup', pollingInterval: 60_000 }); }
export function useUnreadCount(recipientRole) {
  const { unreadCount, loading } = useNotifications({ recipientRole, pollingInterval: 20_000 });
  return { unreadCount, loading };
}