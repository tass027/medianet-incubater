'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import Link from 'next/link';
import useMentorSessions from '@/app/hooks/useMentorSessions';
import useMentorStartups from '@/app/hooks/useMentorStartups';

const Icons = {
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Plus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Calendar: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Trash: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
};

const STATUS_OPTIONS = [
  { value: '',          label: 'Tous les statuts' },
  { value: 'scheduled', label: 'Planifiées' },
  { value: 'done',      label: 'Tenues' },
  { value: 'cancelled', label: 'Annulées' },
];

export default function MentorSessionsPage() {
  const [mounted,    setMounted]    = useState(false);
  const [filterStartup, setFilterStartup] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [updating,   setUpdating]   = useState(null);

  const { startups }                       = useMentorStartups();
  const { sessions, loading, error, updateSession, deleteSession } =
    useMentorSessions({ startupId: filterStartup || undefined, status: filterStatus || undefined });

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      await updateSession(id, { status: newStatus });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette session ?')) return;
    try { await deleteSession(id); } catch (e) { console.error(e); }
  };

  // Group sessions by date
  const grouped = sessions.reduce((acc, s) => {
    const day = new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {});

  return (
    <ProtectedRoute allowedRoles={['mentor']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { font-family: 'Inter', sans-serif; }
          .glass-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.05);
          }
          :global(.dark) .glass-card { background: #1e293b; border: 1px solid #334155; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                  <Link href="/dashboard/mentor/startups">
                    <button className="flex items-center gap-2 text-white/80 hover:text-white transition">
                      <Icons.ArrowLeft className="w-4 h-4" />
                      Retour
                    </button>
                  </Link>
                <Link href="/dashboard/mentor/sessions/new">
                  <Button variant="primary" className="!bg-white !text-[#006d94] flex items-center gap-2">
                    <Icons.Plus className="w-4 h-4" />
                    Nouvelle session
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">Sessions</h1>
              <p className="text-blue-100 text-base">Gérez votre agenda d'accompagnement</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterStartup}
              onChange={(e) => setFilterStartup(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:bg-gray-800 dark:text-white"
            >
              <option value="">Toutes les startups</option>
              {startups.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:bg-gray-800 dark:text-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="glass-card rounded-xl p-8 text-center text-red-500">{error}</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Icons.Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune session trouvée</p>
              <Link href="/dashboard/mentor/sessions/new">
                <Button variant="primary" className="mt-4">Planifier une session</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([day, daySessions]) => (
                <div key={day}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 capitalize">
                    {day}
                  </h3>
                  <div className="space-y-3">
                    {daySessions.map((session) => {
                      const startupName = session.startupId?.projectName
                        || session.startupId?.companyName
                        || 'Startup';
                      return (
                        <div key={session._id} className="glass-card rounded-xl p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00526e] to-[#0088ba] flex items-center justify-center text-white font-bold">
                                {startupName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{startupName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{session.topic}</p>
                                <div className="flex gap-3 text-xs text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Icons.Clock className="w-3 h-3" />
                                    {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span>{session.duration} min</span>
                                  {session.meetingLink && (
                                    <a href={session.meetingLink} target="_blank" rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline">Lien réunion</a>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={
                                session.status === 'done' ? 'success' :
                                session.status === 'cancelled' ? 'danger' : 'info'
                              } size="sm">
                                {session.status === 'done' ? 'Tenue' : session.status === 'cancelled' ? 'Annulée' : 'Planifiée'}
                              </Badge>
                              {session.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStatusChange(session._id, 'done')}
                                  disabled={updating === session._id}
                                  className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 transition"
                                  title="Marquer comme tenue"
                                >
                                  <Icons.Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(session._id)}
                                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition"
                                title="Supprimer"
                              >
                                <Icons.Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {session.notes && (
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                              {session.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}