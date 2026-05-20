'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/app/store/slices/authSlice';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getRoleName, getInitials } from '@/app/lib/utils';
import useTranslation from '@/app/hooks/useTranslation';
import axiosAuth from '@/app/lib/axiosAuth';

const resolveRole = (role) => {
  if (role === 'founder' || role === 'applicant') return 'startup';
  return role;
};

// ─── NOTIFICATION HELPERS ────────────────────────────────────────────────────

// SVG icon paths for each notification type (no emojis)
const NOTIF_ICONS = {
  // calendar-check: session assigned / confirmed / completed
  calendar_check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="9 16 11 18 15 14" />
    </svg>
  ),
  // calendar-plus: session new / mentor_session_created
  calendar_plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="15" x2="12" y2="19" />
      <line x1="10" y1="17" x2="14" y2="17" />
    </svg>
  ),
  // clock: reminder / pending
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  // x-circle: cancelled / declined
  x_circle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  // users: mentoring_request
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  // check-circle: mentor_accepted
  check_circle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  // scale: mentor_decision
  scale: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 6l9-3 9 3" />
      <path d="M3 6l4 8c0 2.2-1.8 4-4 4s-4-1.8-4-4z" transform="translate(3,0)" />
      <path d="M17 6l4 8c0 2.2-1.8 4-4 4s-4-1.8-4-4z" />
    </svg>
  ),
  // building: startup_assigned
  building: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  ),
  // bar-chart: kpi_update
  bar_chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  // message-square: feedback
  message_square: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  // settings: system
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

const NOTIF_TYPE_CONFIG = {
  session_assigned:       { avatarBg: '#EAF3DE', iconColor: '#3B6D11', dot: '#059669', icon: NOTIF_ICONS.calendar_check },
  session_confirmed:      { avatarBg: '#EAF3DE', iconColor: '#3B6D11', dot: '#059669', icon: NOTIF_ICONS.calendar_check },
  session_reminder:       { avatarBg: '#FAEEDA', iconColor: '#854F0B', dot: '#d97706', icon: NOTIF_ICONS.clock         },
  session_new:            { avatarBg: '#E6F1FB', iconColor: '#0C447C', dot: '#185FA5', icon: NOTIF_ICONS.calendar_plus },
  session_completed:      { avatarBg: '#EAF3DE', iconColor: '#3B6D11', dot: '#3B6D11', icon: NOTIF_ICONS.check_circle  },
  session_cancelled:      { avatarBg: '#FCEBEB', iconColor: '#A32D2D', dot: '#dc2626', icon: NOTIF_ICONS.x_circle      },
  session_pending:        { avatarBg: '#FAEEDA', iconColor: '#854F0B', dot: '#d97706', icon: NOTIF_ICONS.clock         },
  mentoring_request:      { avatarBg: '#E6F1FB', iconColor: '#0C447C', dot: '#185FA5', icon: NOTIF_ICONS.users         },
  mentor_accepted:        { avatarBg: '#EAF3DE', iconColor: '#3B6D11', dot: '#059669', icon: NOTIF_ICONS.check_circle  },
  mentor_declined:        { avatarBg: '#FCEBEB', iconColor: '#A32D2D', dot: '#dc2626', icon: NOTIF_ICONS.x_circle      },
  mentor_decision:        { avatarBg: '#E6F1FB', iconColor: '#0C447C', dot: '#185FA5', icon: NOTIF_ICONS.scale         },
  mentor_session_created: { avatarBg: '#E6F1FB', iconColor: '#0C447C', dot: '#185FA5', icon: NOTIF_ICONS.calendar_plus },
  startup_assigned:       { avatarBg: '#FAEEDA', iconColor: '#854F0B', dot: '#f59e0b', icon: NOTIF_ICONS.building      },
  kpi_update_requested:   { avatarBg: '#E6F1FB', iconColor: '#185FA5', dot: '#3b82f6', icon: NOTIF_ICONS.bar_chart     },
  feedback_requested:     { avatarBg: '#EEEDFE', iconColor: '#3C3489', dot: '#7c3aed', icon: NOTIF_ICONS.message_square},
  system:                 { avatarBg: '#F1EFE8', iconColor: '#5F5E5A', dot: '#6b7280', icon: NOTIF_ICONS.settings      },
};

function getNotifTypeConfig(type) {
  return NOTIF_TYPE_CONFIG[type] || NOTIF_TYPE_CONFIG.system;
}

function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const diff    = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  if (seconds < 60) return 'maintenant';
  if (minutes < 60) return `${minutes} min`;
  if (hours   < 24) return `${hours}h`;
  if (days    <  7) return `${days}j`;
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── NOTIFICATION ITEM ───────────────────────────────────────────────────────
function NotificationItem({ notif, onMarkRead, onDelete, onClose }) {
  const { avatarBg, iconColor, dot, icon } = getNotifTypeConfig(notif.type);
  const unread = !notif.read;

  return (
    <div
      onClick={() => {
        if (unread) onMarkRead(notif._id);
        if (notif.link && notif.link !== '#') onClose();
      }}
      className="notif-item group flex items-start gap-3 px-4 py-3.5 cursor-pointer"
      style={{
        background: unread ? 'rgba(230,241,251,0.55)' : 'transparent',
        borderBottom: '0.5px solid rgba(0,0,0,0.06)',
        transition: 'background 0.15s ease',
      }}
    >
      {/* icon avatar */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span
            className="text-sm leading-snug"
            style={{
              fontWeight: unread ? 700 : 500,
              color: unread ? '#0C447C' : '#374151',
            }}
          >
            {notif.title}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="text-xs whitespace-nowrap"
              style={{ color: unread ? '#378ADD' : '#9ca3af' }}
            >
              {formatRelativeTime(notif.createdAt)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-all"
              aria-label="Supprimer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <p
          className="text-xs line-clamp-2 leading-relaxed mb-2"
          style={{ color: unread ? '#185FA5' : '#6b7280' }}
        >
          {notif.body}
        </p>

        {notif.link && notif.link !== '#' && (
          <Link
            href={notif.link}
            onClick={(e) => { e.stopPropagation(); if (unread) onMarkRead(notif._id); onClose(); }}
            className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
            style={{ color: unread ? '#0C447C' : '#185FA5' }}
          >
            Voir
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* unread dot */}
      {unread && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-2 notification-dot"
          style={{ background: dot }}
        />
      )}
    </div>
  );
}

// ─── NOTIFICATION PANEL ──────────────────────────────────────────────────────
function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosAuth.get('/api/notifications');
      if (data.success) setNotifications(data.data || []);
    } catch (err) {
      if (err?.response?.status !== 401) console.error('[NotificationPanel]', err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
    );
    try { await axiosAuth.patch(`/api/notifications/${id}/read`); } catch {}
  };

  const markAllAsRead = async () => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: now })));
    try { await axiosAuth.patch('/api/notifications/read-all'); } catch {}
  };

  const deleteNotif = async (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    try { await axiosAuth.delete(`/api/notifications/${id}`); } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayed   = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div
      className="notif-panel absolute right-0 mt-2 w-96 rounded-2xl overflow-hidden z-50"
      style={{
        background: 'white',
        border: '0.5px solid rgba(0,0,0,0.09)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span
              className="text-base font-bold"
              style={{ color: '#0C447C' }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#E6F1FB',
                  color: '#185FA5',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 99,
                  lineHeight: '18px',
                  display: 'inline-block',
                }}
              >
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold hover:underline"
                style={{ color: '#185FA5' }}
              >
                Tout marquer lu
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Pill tabs */}
        <div className="flex gap-1.5">
          {[
            { id: 'all',    label: 'Toutes' },
            { id: 'unread', label: `Non lues${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '5px 14px',
                borderRadius: 99,
                border: filter === id ? 'none' : '0.5px solid rgba(0,0,0,0.12)',
                background: filter === id ? '#185FA5' : 'transparent',
                color: filter === id ? '#fff' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
        {loading ? (
          <div className="flex flex-col gap-3 px-5 py-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-3 items-start">
                <div
                  className="flex-shrink-0"
                  style={{ width: 38, height: 38, borderRadius: '50%', background: '#e5e7eb' }}
                />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div style={{ color: '#d1d5db' }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </p>
          </div>
        ) : (
          displayed.map(notif => (
            <NotificationItem
              key={notif._id}
              notif={notif}
              onMarkRead={markAsRead}
              onDelete={deleteNotif}
              onClose={onClose}
            />
          ))
        )}
      </div>

      {/* ── Footer ── */}
      {!loading && (
        <div
          className="px-5 py-3 flex justify-center"
          style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)' }}
        >
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={e => e.currentTarget.style.color = '#185FA5'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
  const { user }        = useSelector((state) => state.auth);
  const { t, language } = useTranslation();
  const dispatch        = useDispatch();
  const router          = useRouter();
  const pathname        = usePathname();

  const effectiveRole = resolveRole(user?.role);

  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [mounted,           setMounted]           = useState(false);
  const [time,              setTime]              = useState(new Date());
  const [showProfileMenu,   setShowProfileMenu]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount,       setUnreadCount]       = useState(0);

  const notifRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?._id) window.__notifUserId = user._id;
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    const fetchCount = async () => {
      try {
        const { data } = await axiosAuth.get('/api/notifications');
        if (data.success) setUnreadCount((data.data || []).filter(n => !n.read).length);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [user?._id, effectiveRole]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = async () => {
    try { await dispatch(logout()).unwrap(); } catch {}
    finally { router.push('/login'); }
  };

  const getNavigationItems = () => {
    if (!mounted || !user?.role) return [];

    const ic = {
      dashboard:    (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>),
      users:        (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
      applications: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>),
      evaluations:  (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>),
      forms:        (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>),
      investors:    (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
      kpis:         (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>),
      matches:      (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>),
      startups:     (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>),
      feedback:     (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>),
      status:       (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>),
      mentor:       (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>),
      reporting:    (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>),
      calendar:     (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
      resources:    (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h13.5A1.5 1.5 0 0121 4.5v12a1.5 1.5 0 01-1.5 1.5H6.5" /></svg>),
      jury:         (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>),
      programmes:   (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>),
      candidatures: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>),
    };

    const base = [{
      name: t.dashboard || 'Dashboard',
      href: effectiveRole === 'jury' ? '/dashboard/jury/dashboard' : `/dashboard/${effectiveRole}/dashboard`,
      icon: ic.dashboard,
    }];

    const roleItems = {
      admin: [
        { name: 'Roles & Permissions', href: '/dashboard/admin/roles',        icon: ic.users        },
        { name: 'Utilisateurs',        href: '/dashboard/admin/users',        icon: ic.users        },
        { name: 'Programmes',          href: '/dashboard/admin/programmes',   icon: ic.forms        },
        { name: 'Formulaires',         href: '/dashboard/admin/forms',        icon: ic.forms        },
        { name: 'Candidatures',        href: '/dashboard/admin/applications', icon: ic.applications },
        { name: 'Jury',                href: '/dashboard/admin/jury',         icon: ic.users        },
        { name: 'Évaluations',         href: '/dashboard/admin/evaluations',  icon: ic.evaluations  },
        { name: 'Startups',            href: '/dashboard/admin/startups',     icon: ic.startups     },
        { name: 'Investisseurs',       href: '/dashboard/admin/investors',    icon: ic.investors    },
        { name: 'Mentors',             href: '/dashboard/admin/mentors',      icon: ic.users        },
        { name: 'Reporting',           href: '/dashboard/admin/reporting',    icon: ic.reporting    },
      ],
      startup: [
        { name: 'Programmes ouverts', href: '/dashboard/startup/programmes',   icon: ic.programmes   },
        { name: 'Mes candidatures',   href: '/dashboard/startup/candidatures', icon: ic.candidatures },
        { name: 'Suivi détaillé',     href: '/dashboard/startup/status',       icon: ic.status       },
        { name: 'KPIs & Performance', href: '/dashboard/startup/kpis',         icon: ic.kpis         },
        { name: 'Investisseurs',      href: '/dashboard/startup/matches',      icon: ic.matches      },
        { name: 'Mentorat',           href: '/dashboard/startup/mentoring',    icon: ic.mentor       },
      ],
      jury: [
        { name: 'Candidatures',    href: '/dashboard/jury/candidatures', icon: ic.applications },
        { name: 'Mes évaluations', href: '/dashboard/jury/evaluations',  icon: ic.evaluations  },
      ],
      mentor: [
        { name: 'Startups',   href: '/dashboard/mentor/startups',  icon: ic.startups  },
        { name: 'Sessions',   href: '/dashboard/mentor/sessions',  icon: ic.calendar  },
        { name: 'Feedback',   href: '/dashboard/mentor/feedback',  icon: ic.feedback  },
        { name: 'Rapports',   href: '/dashboard/mentor/reports',   icon: ic.reporting },
        { name: 'Ressources', href: '/dashboard/mentor/resources', icon: ic.resources },
        ...(user?.mentorRoles?.includes('jury')
          ? [{ name: 'Jury', href: '/dashboard/jury/dashboard', icon: ic.jury, badge: 'JURY' }]
          : []),
      ],
    };

    return [...base, ...(roleItems[effectiveRole] || [])];
  };

  const navItems = getNavigationItems();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full z-30 top-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center ml-4 lg:ml-0">
                <img src="/logos/medianet incubater logo.png" alt="Medianet Incubator" className="h-24 w-auto object-contain" />
              </Link>
              <div className="w-32" />
            </div>
          </div>
        </nav>
        <aside className="fixed top-16 left-0 z-20 w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="h-full px-3 py-4" />
        </aside>
        <main className="pt-16 lg:pl-64"><div className="p-4 sm:p-6 lg:p-8">{children}</div></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { font-family: 'Syne', -apple-system, BlinkMacSystemFont, sans-serif; }

        @keyframes slideDown  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.1)} }

        .glass-nav {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        :global(.dark) .glass-nav { background:rgba(31,41,55,0.9); border-bottom:1px solid rgba(255,255,255,0.05); }

        .glass-sidebar {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(0,0,0,0.05);
        }
        :global(.dark) .glass-sidebar { background:rgba(31,41,55,0.95); border-right:1px solid rgba(255,255,255,0.05); }

        .nav-link { position:relative; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .nav-link::before {
          content:''; position:absolute; left:0; top:0; bottom:0; width:4px;
          background:linear-gradient(135deg,#667eea,#764ba2); border-radius:0 4px 4px 0;
          transform:scaleY(0); transition:transform 0.3s ease;
        }
        :global(.dark) .nav-link::before { background:linear-gradient(135deg,#818cf8,#a78bfa); }
        .nav-link.active::before { transform:scaleY(1); }
        .nav-link:hover { background:linear-gradient(90deg,rgba(102,126,234,0.1) 0%,transparent 100%); }
        :global(.dark) .nav-link:hover { background:linear-gradient(90deg,rgba(102,126,234,0.2) 0%,transparent 100%); }
        .nav-link.active { background:linear-gradient(90deg,rgba(102,126,234,0.15) 0%,rgba(118,75,162,0.05) 100%); font-weight:600; }
        :global(.dark) .nav-link.active { background:linear-gradient(90deg,rgba(102,126,234,0.3) 0%,rgba(118,75,162,0.1) 100%); }

        .mono { font-family:'JetBrains Mono',monospace; }
        .profile-menu { animation:slideDown 0.2s ease-out; }
        .notif-panel  { animation:slideDown 0.2s ease-out; }
        .notification-dot { animation:pulse-dot 2s ease-in-out infinite; }
        .nav-section-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(102,126,234,0.2),transparent); margin:8px 0; }

        .founder-badge { background:linear-gradient(135deg,#f59e0b,#d97706); color:white; font-size:9px; font-weight:700; padding:1px 5px; border-radius:4px; margin-left:auto; }
        .locked-badge  { background:rgba(100,116,139,0.15); color:#94a3b8; font-size:9px; font-weight:600; padding:1px 5px; border-radius:4px; margin-left:auto; }
        .jury-badge    { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; font-size:9px; font-weight:700; padding:1px 6px; border-radius:4px; margin-left:auto; letter-spacing:0.05em; }

        .notif-item:hover { background: rgba(230,241,251,0.35) !important; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav className="glass-nav fixed w-full z-30 top-0 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 lg:hidden transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <img src="/logos/medianet incubater logo.png" alt="Medianet Incubator" className="h-24 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
              <div className="w-2 h-2 bg-green-400 rounded-full notification-dot" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mono">
                {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {time.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-3">

                {/* ── NOTIFICATION BELL ── */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                    className="relative p-3 text-gray-600 dark:text-gray-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all"
                    aria-label="Notifications"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-800 notification-dot">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <NotificationPanel
                      onClose={() => {
                        setShowNotifications(false);
                        axiosAuth.get('/api/notifications')
                          .then(({ data }) => { if (data.success) setUnreadCount((data.data || []).filter(n => !n.read).length); })
                          .catch(() => {});
                      }}
                    />
                  )}
                </div>

                {/* ── PROFILE MENU ── */}
                <div className="relative">
                  <button
                    onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all group"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mono">
                        {effectiveRole === 'admin'  ? 'SYS.ADMIN' :
                         effectiveRole === 'jury'   ? 'JURY · CONFIDENTIEL' :
                         effectiveRole === 'mentor' ? (user?.mentorRoles?.includes('jury') ? 'MENTOR · JURY' : 'MENTOR')
                         : effectiveRole.toUpperCase()}
                        {effectiveRole === 'startup' && user?.isFounder && <span className="ml-1 text-amber-500">⭐</span>}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all">
                        {getInitials(user?.name || 'User')}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full" />
                    </div>
                  </button>

                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <div className="profile-menu absolute right-0 mt-2 w-64 glass-nav rounded-2xl shadow-2xl overflow-hidden z-50">
                        <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                              {getInitials(user?.name || 'User')}
                            </div>
                            <div>
                              <p className="font-bold text-white">{user?.name}</p>
                              <p className="text-xs text-blue-100 mono">{user?.email}</p>
                              {effectiveRole === 'jury' && (
                                <span className="inline-block mt-1 text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full tracking-wide">ESPACE JURY</span>
                              )}
                              {effectiveRole === 'mentor' && user?.mentorRoles?.includes('jury') && (
                                <span className="inline-block mt-1 text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full tracking-wide">MENTOR + JURY</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-2 dark:bg-gray-800">
                          <Link href={`/dashboard/${effectiveRole}/profile`} className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all" onClick={() => setShowProfileMenu(false)}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            <span className="font-semibold">Profil</span>
                          </Link>
                          <Link href={`/dashboard/${effectiveRole}/settings`} className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all" onClick={() => setShowProfileMenu(false)}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="font-semibold">Paramètres</span>
                          </Link>
                          <div className="my-2 h-px bg-gray-200 dark:bg-gray-700" />
                          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            <span className="font-semibold">Déconnexion</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ══ SIDEBAR ══ */}
      {user && (
        <>
          <aside className={`glass-sidebar fixed top-20 left-0 z-20 w-72 h-[calc(100vh-5rem)] shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            <div className="h-full px-4 py-6 overflow-y-auto">
              <div className="mb-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-blue-100 dark:border-gray-700">
                <div className="mb-3">
                  <img src="/logos/medianet incubater logo.png" alt="Medianet Incubator" className="h-24 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                {effectiveRole === 'jury' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full notification-dot inline-block" />
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">ESPACE JURY</span>
                  </div>
                )}
                {effectiveRole === 'startup' && (
                  <div className="flex items-center gap-1.5">
                    {user?.isFounder ? (
                      <><span className="w-1.5 h-1.5 bg-amber-400 rounded-full notification-dot inline-block" /><span className="text-xs text-amber-600 dark:text-amber-400 font-bold">MODE FONDATEUR</span></>
                    ) : (
                      <><span className="w-1.5 h-1.5 bg-blue-400 rounded-full notification-dot inline-block" /><span className="text-xs text-blue-600 dark:text-blue-400 font-bold">MODE CANDIDAT</span></>
                    )}
                  </div>
                )}
                {effectiveRole === 'mentor' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full notification-dot inline-block" />
                    <span className="text-xs text-violet-600 dark:text-violet-400 font-bold">
                      {user?.mentorRoles?.includes('jury') ? 'ESPACE MENTOR · JURY' : 'ESPACE MENTOR'}
                    </span>
                  </div>
                )}
                {!['startup', 'mentor', 'jury'].includes(effectiveRole) && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full notification-dot" />
                    <span className="text-gray-600 dark:text-gray-400 font-medium">System Operational</span>
                  </div>
                )}
              </div>

              {effectiveRole === 'jury'    && <div className="mb-2 px-4"><p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Espace Jury</p></div>}
              {effectiveRole === 'startup' && <div className="mb-2 px-4"><p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Candidatures</p></div>}
              {effectiveRole === 'mentor'  && <div className="mb-2 px-4"><p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Espace Mentor</p></div>}

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const founderOnlyPaths = ['/dashboard/startup/kpis', '/dashboard/startup/matches', '/dashboard/startup/mentoring'];
                  const isFounded      = user?.isFounder === true;
                  const isFounderOnly  = effectiveRole === 'startup' && founderOnlyPaths.includes(item.href);
                  const showFounderDivider = effectiveRole === 'startup' && item.href === '/dashboard/startup/kpis';
                  const showAdminDivider   = effectiveRole === 'admin'   && item.href === '/dashboard/admin/forms';
                  const showJuryDivider    = effectiveRole === 'mentor'  && item.badge === 'JURY';

                  return (
                    <div key={item.name}>
                      {showFounderDivider && (
                        <div className="nav-section-divider">
                          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-3 mb-1">Espace Fondateur</p>
                        </div>
                      )}
                      {showAdminDivider && <div className="nav-section-divider" />}
                      {showJuryDivider && (
                        <div className="nav-section-divider">
                          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-3 mb-1">Rôle Jury</p>
                        </div>
                      )}
                      <Link
                        href={item.href}
                        className={`nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${isActive ? 'active' : 'text-gray-700 dark:text-gray-400'} ${isFounderOnly && !isFounded ? 'opacity-50' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className={`transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                          {item.icon}
                        </div>
                        <span className={`font-semibold flex-1 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>
                          {item.name}
                        </span>
                        {isFounderOnly && (isFounded ? <span className="founder-badge">PRO</span> : <span className="locked-badge">🔒</span>)}
                        {item.badge === 'JURY' && <span className="jury-badge">JURY</span>}
                      </Link>
                    </div>
                  );
                })}
              </nav>

              <div className="lg:hidden mt-4">
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3.5 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all font-semibold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </aside>

          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}
        </>
      )}

      {/* ══ MAIN ══ */}
      <main className="pt-20 lg:pl-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}