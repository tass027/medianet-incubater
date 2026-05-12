'use client';

// app/dashboard/admin/mentors/page.jsx
// Page admin : gestion des mentors + assignation double rôle jury

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const Icon = {
  mentor: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  ),
  jury: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
    </svg>
  ),
  startup: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>
  ),
  link: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
    </svg>
  ),
  unlink: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// BADGE COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  if (role === 'jury') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
        {Icon.jury}
        JURY
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
      {Icon.mentor}
      MENTOR
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
    error:   'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
    info:    'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  };

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[toast.type] || colors.info}`}
      style={{ animation: 'slideDown 0.3s ease-out' }}>
      {toast.type === 'success' && <span className="text-green-500">{Icon.check}</span>}
      {toast.type === 'error'   && <span className="text-red-500">{Icon.x}</span>}
      {toast.message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">{Icon.x}</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL : ASSIGNER UNE STARTUP
// ─────────────────────────────────────────────────────────────────────────────
function AssignStartupModal({ mentor, onClose, onAssigned }) {
  const [startups,  setStartups]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    (async () => {
      try {
        // ✅ FIXED: /api prefix added
        const { data } = await axiosAuth.get('/api/admin/applications?status=accepted');
        const assignedIds = (mentor.assignedStartups || []).map(s =>
          typeof s === 'string' ? s : s._id?.toString()
        );
        const available = (data.applications || []).filter(
          a => !assignedIds.includes(a.applicationId?.toString())
        );
        setStartups(available);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [mentor]);

  const filtered = startups.filter(s =>
    s.startupName?.toLowerCase().includes(search.toLowerCase()) ||
    s.founder?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // ✅ FIXED: /api prefix added
      await axiosAuth.post(`/api/admin/mentors/${mentor._id}/assign-startup`, {
        startupId: selected,
      });
      onAssigned();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Assigner une startup à <span className="text-primary-600">{mentor.name}</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Seules les startups acceptées et non encore assignées sont affichées.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icon.search}</span>
            <input
              type="text"
              placeholder="Rechercher une startup..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Aucune startup disponible</div>
            ) : (
              filtered.map(s => (
                <label
                  key={s.applicationId}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                    selected === s.applicationId
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="startup"
                    value={s.applicationId}
                    checked={selected === s.applicationId}
                    onChange={() => setSelected(s.applicationId)}
                    className="text-primary-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {s.startupName || s.userName}
                    </p>
                    <p className="text-xs text-gray-500">{s.sector} · {s.stage}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                    Acceptée
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">
            Annuler
          </button>
          <button onClick={handleAssign} disabled={!selected || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
            {saving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : Icon.link}
            Assigner
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR CARD
// ─────────────────────────────────────────────────────────────────────────────
function MentorCard({ mentor, onToggleJury, onAssignStartup, onUnassignStartup, loading }) {
  const [expanded, setExpanded] = useState(false);
  const isJury = mentor.mentorRoles?.includes('jury');

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
      isJury ? 'border-purple-200 dark:border-purple-800' : 'border-gray-100 dark:border-gray-800'
    }`}>
      <div className={`h-1.5 rounded-t-2xl ${isJury ? 'bg-gradient-to-r from-purple-500 to-violet-600' : 'bg-gradient-to-r from-teal-500 to-cyan-600'}`}/>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
              isJury
                ? 'bg-gradient-to-br from-purple-500 to-violet-600'
                : 'bg-gradient-to-br from-teal-500 to-cyan-600'
            }`}>
              {mentor.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{mentor.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{mentor.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            {(mentor.mentorRoles?.length ? mentor.mentorRoles : ['mentor']).map(r => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{mentor.startupCount || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Startups assignées</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${isJury ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <p className={`text-sm font-bold ${isJury ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {isJury ? 'Mentor + Jury' : 'Mentor seul'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Double rôle</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onToggleJury(mentor)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
              isJury
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100'
            }`}
            title={isJury ? 'Retirer le rôle jury' : 'Assigner le rôle jury'}
          >
            {isJury ? Icon.x : Icon.plus}
            {isJury ? 'Retirer Jury' : 'Ajouter Jury'}
          </button>

          <button
            onClick={() => onAssignStartup(mentor)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 transition-all"
          >
            {Icon.link}
            Assigner startup
          </button>

          {mentor.startupCount > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-all"
            >
              {Icon.startup}
              {expanded ? 'Masquer' : `Voir startups (${mentor.startupCount})`}
            </button>
          )}
        </div>

        {/* Liste startups assignées (expandable) */}
        {expanded && mentor.assignedStartups?.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            {mentor.assignedStartups.map(s => {
              const id   = s._id || s;
              const name = s.startupName || s.name || id;
              return (
                <div key={id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500">{Icon.startup}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                      {s.sector && <p className="text-xs text-gray-400">{s.sector} · {s.stage}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => onUnassignStartup(mentor._id, id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Retirer cette startup"
                  >
                    {Icon.unlink}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminMentorsPage() {
  const { accessToken } = useSelector(s => s.auth);

  const [mentors,       setMentors]       = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState('all');
  const [assignModal,   setAssignModal]   = useState(null);
  const [toast,         setToast]         = useState({ show: false, type: 'info', message: '' });

  const showToast = (type, message) =>
    setToast({ show: true, type, message });

  const hideToast = () =>
    setToast(t => ({ ...t, show: false }));

  // ── Fetch mentors + stats ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ FIXED: /api prefix added to both calls
      const [mentorsRes, statsRes] = await Promise.all([
        axiosAuth.get('/api/admin/mentors'),
        axiosAuth.get('/api/admin/mentors/stats'),
      ]);
      setMentors(mentorsRes.data.mentors || []);
      setStats(statsRes.data.stats || null);
    } catch (err) {
      console.error(err);
      showToast('error', 'Erreur lors du chargement des mentors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toggle rôle jury ───────────────────────────────────────────────────────
  const handleToggleJury = async (mentor) => {
    const isJury = mentor.mentorRoles?.includes('jury');
    const action = isJury ? 'remove' : 'add';
    const label  = isJury ? 'retiré de' : 'ajouté à';

    setActionLoading(true);
    try {
      // ✅ FIXED: /api prefix added
      const { data } = await axiosAuth.patch(`/api/admin/mentors/${mentor._id}/roles`, {
        action,
        role: 'jury',
      });

      setMentors(prev => prev.map(m =>
        m._id === mentor._id
          ? { ...m, mentorRoles: data.mentor.mentorRoles, isJury: data.mentor.isJury }
          : m
      ));

      showToast('success', `Rôle Jury ${label} ${mentor.name}`);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors de la mise à jour du rôle');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Unassign startup ───────────────────────────────────────────────────────
  const handleUnassignStartup = async (mentorId, startupId) => {
    if (!confirm('Retirer cette startup du mentor ?')) return;
    setActionLoading(true);
    try {
      // ✅ FIXED: /api prefix added
      await axiosAuth.delete(`/api/admin/mentors/${mentorId}/unassign-startup/${startupId}`);
      showToast('success', 'Startup retirée du mentor');
      fetchData();
    } catch (err) {
      showToast('error', 'Erreur lors du retrait de la startup');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Filtres ────────────────────────────────────────────────────────────────
  const displayed = mentors
    .filter(m => {
      if (filter === 'jury')   return m.mentorRoles?.includes('jury');
      if (filter === 'mentor') return !m.mentorRoles?.includes('jury');
      return true;
    })
    .filter(m =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
          .animate-slide-in { animation: slideDown 0.4s ease-out; }
        `}</style>

        <Toast toast={toast} onClose={hideToast} />

        {assignModal && (
          <AssignStartupModal
            mentor={assignModal}
            onClose={() => setAssignModal(null)}
            onAssigned={() => { fetchData(); showToast('success', 'Startup assignée avec succès'); }}
          />
        )}

        <div className="space-y-6 pb-10">

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/90 tracking-wide">
                    GESTION DES MENTORS
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-1">Mentors & Double Rôle Jury</h1>
                <p className="text-blue-100">
                  Assignez des startups aux mentors et gérez leurs accès jury
                </p>
              </div>
              <button
                onClick={fetchData}
                className="self-start lg:self-auto flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all"
              >
                {Icon.refresh}
                Actualiser
              </button>
            </div>
          </div>

          {/* ── STATS ───────────────────────────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total mentors',   value: stats.total,        color: 'text-gray-900 dark:text-white' },
                { label: 'Mentor + Jury',   value: stats.juryCount,    color: 'text-purple-600 dark:text-purple-400' },
                { label: 'Mentor seul',     value: stats.mentorOnly,   color: 'text-teal-600 dark:text-teal-400' },
                { label: 'Avec startups',   value: stats.withStartups, color: 'text-amber-600 dark:text-amber-400' },
              ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── FILTRES ──────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icon.search}</span>
              <input
                type="text"
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>

            <div className="flex gap-2">
              {[
                { key: 'all',    label: 'Tous' },
                { key: 'mentor', label: 'Mentor' },
                { key: 'jury',   label: 'Mentor + Jury' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === f.key
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── GRILLE DES MENTORS ───────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"/>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"/>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"/>
                    <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"/>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-28"/>
                    <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-32"/>
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
                {Icon.mentor}
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {search ? 'Aucun mentor trouvé pour cette recherche' : 'Aucun mentor disponible'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayed.map(mentor => (
                <MentorCard
                  key={mentor._id}
                  mentor={mentor}
                  loading={actionLoading}
                  onToggleJury={handleToggleJury}
                  onAssignStartup={m => setAssignModal(m)}
                  onUnassignStartup={handleUnassignStartup}
                />
              ))}
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
              Comment fonctionne le double rôle Mentor + Jury ?
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
              Quand vous ajoutez le rôle <strong>Jury</strong> à un mentor, il voit apparaître un lien
              <strong> "Jury"</strong> dans sa sidebar avec un badge violet. Il peut accéder à l'espace jury
              sans changer de compte. Son rôle principal reste <code>mentor</code> dans la base de données.
              Vous pouvez retirer le rôle jury à tout moment — il perdra immédiatement l'accès à l'espace jury.
            </p>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}