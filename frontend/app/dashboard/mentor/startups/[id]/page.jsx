'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

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
  Calendar: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  TrendingUp: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Message: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Star: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  FileText: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Book: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h13.5A1.5 1.5 0 0121 4.5v12a1.5 1.5 0 01-1.5 1.5H6.5" />
    </svg>
  ),
  ExternalLink: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Plus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
};

const TABS = ['Aperçu', 'Sessions', 'Feedbacks', 'KPIs', 'Rapports', 'Ressources'];

const RESOURCE_TYPE_COLORS = {
  document: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  video:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  link:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  template: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  other:    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

// ─── Bouton "Gérer" avec style inline pour garantir le rendu ─────────────────
const ManageButton = ({ href, label }) => (
  <Link href={href}>
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 22px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        border: '2px solid #006d94',
        color: '#006d94',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#006d94';
        e.currentTarget.style.color = 'white';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,109,148,0.3)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#006d94';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {label}
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    </span>
  </Link>
);

export default function StartupProfilePage() {
  const { id } = useParams();
  const { accessToken } = useSelector((s) => s.auth);

  const [startup,   setStartup]   = useState(null);
  const [sessions,  setSessions]  = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [kpis,      setKpis]      = useState({});
  const [reports,   setReports]   = useState([]);
  const [resources, setResources] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('Aperçu');
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!id || !accessToken) return;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [profileRes, kpisRes, reportsRes, resourcesRes] = await Promise.all([
          fetch(`${API}/api/mentor/startups/${id}`,            { headers, credentials: 'include' }),
          fetch(`${API}/api/mentor/startups/${id}/kpis`,       { headers, credentials: 'include' }),
          fetch(`${API}/api/mentor/reports?startupId=${id}`,   { headers, credentials: 'include' }),
          fetch(`${API}/api/mentor/resources?startupId=${id}`, { headers, credentials: 'include' }),
        ]);

        if (!profileRes.ok) {
          const body = await profileRes.json().catch(() => ({}));
          throw new Error(body.message || `Erreur ${profileRes.status}`);
        }

        const profileData = await profileRes.json();
        setStartup(profileData.startup    || null);
        setSessions(profileData.sessions  || []);
        setFeedbacks(profileData.feedbacks || []);

        if (kpisRes.ok)      { const d = await kpisRes.json();      setKpis(d.kpis           || {}); }
        if (reportsRes.ok)   { const d = await reportsRes.json();   setReports(d.reports     || []); }
        if (resourcesRes.ok) { const d = await resourcesRes.json(); setResources(d.resources || []); }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, accessToken]);

  if (!mounted) return null;

  const tabCounts = {
    'Sessions':   sessions.length,
    'Feedbacks':  feedbacks.length,
    'KPIs':       Object.keys(kpis).length,
    'Rapports':   reports.length,
    'Ressources': resources.length,
  };

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
            transition: all 0.3s ease;
          }
          :global(.dark) .glass-card { background: #1e293b; border: 1px solid #334155; }
          .tab-active { border-bottom: 2px solid #006d94; color: #006d94; font-weight: 600; }
          .progress-bar { transition: width 0.6s ease; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* ── Header ── */}
          <div
            className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}
          >
            <div className="relative">
              <Link href="/dashboard/mentor/startups">
                <button className="flex items-center gap-2 text-white/80 hover:text-white transition mb-4">
                  <Icons.ArrowLeft className="w-4 h-4" />
                  Retour aux startups
                </button>
              </Link>

              {loading && <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />}

              {error && !loading && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-white text-sm">
                  {error}
                </div>
              )}

              {!loading && startup && (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
                        {(startup.projectName || startup.companyName || startup.startupName || '?').charAt(0)}
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-white">
                          {startup.projectName || startup.companyName || startup.startupName || 'Startup'}
                        </h1>
                        <p className="text-blue-100">
                          {startup.sector || ''}{startup.stage ? ` · ${startup.stage}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-blue-100 text-sm">
                      Fondateur : {startup.founderName || startup.fullName || '—'}
                    </p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Link href={`/dashboard/mentor/sessions/new?startupId=${id}`}>
                      <Button variant="outline" className="!text-white !border-white/40 !bg-white/10 hover:!bg-white/20">
                        <Icons.Calendar className="w-4 h-4 mr-2" />
                        Planifier session
                      </Button>
                    </Link>
                    <Link href={`/dashboard/mentor/feedback?startupId=${id}`}>
                      <Button variant="primary" className="!bg-white !text-[#006d94]">
                        <Icons.Message className="w-4 h-4 mr-2" />
                        Feedback
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          {!loading && startup && (
            <div className="glass-card rounded-xl overflow-hidden">

              <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-6 py-4 text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                      activeTab === tab
                        ? 'tab-active'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab}
                    {tabCounts[tab] > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === tab
                          ? 'bg-[#006d94]/10 text-[#006d94]'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {tabCounts[tab]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">

                {/* ════ Aperçu ════ */}
                {activeTab === 'Aperçu' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
                      <dl className="space-y-3">
                        {[
                          ['Secteur',   startup.sector      || '—'],
                          ['Stade',     startup.stage       || '—'],
                          ['Fondateur', startup.founderName || startup.fullName || '—'],
                          ['Email',     startup.email       || '—'],
                          ['Site',      startup.website     || '—'],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                            <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progression globale</h3>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-[#00526e] to-[#0088ba] rounded-full progress-bar"
                          style={{ width: `${startup.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">{startup.progress || 0}%</p>

                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                          <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Sessions</p>
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                          <p className="text-2xl font-bold text-emerald-600">{feedbacks.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Feedbacks</p>
                        </div>
                        <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-center">
                          <p className="text-2xl font-bold text-violet-600">{reports.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Rapports</p>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                          <p className="text-2xl font-bold text-amber-600">{resources.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Ressources</p>
                        </div>
                      </div>

                      {startup.description && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {startup.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ════ Sessions ════ */}
                {activeTab === 'Sessions' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                      </h3>
                      <Link href={`/dashboard/mentor/sessions/new?startupId=${id}`}>
                        <Button variant="primary" size="sm">+ Planifier</Button>
                      </Link>
                    </div>

                    {sessions.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Icons.Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Aucune session enregistrée</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map((s) => (
                          <div key={s._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">{s.topic}</span>
                              <Badge variant={
                                s.status === 'done' ? 'success' :
                                s.status === 'cancelled' ? 'danger' : 'info'
                              } size="sm">
                                {s.status === 'done' ? 'Tenue' : s.status === 'cancelled' ? 'Annulée' : 'Planifiée'}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Icons.Calendar className="w-3 h-3" />
                                {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icons.Clock className="w-3 h-3" />
                                {s.duration} min
                              </span>
                            </div>
                            {s.notes && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{s.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Bouton Gérer en bas ── */}
                    <div className="mt-6 pt-5 flex justify-center" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <ManageButton href="/dashboard/mentor/sessions" label="Gérer les sessions" />
                    </div>
                  </div>
                )}

                {/* ════ Feedbacks ════ */}
                {activeTab === 'Feedbacks' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
                      </h3>
                      <Link href={`/dashboard/mentor/feedback?startupId=${id}`}>
                        <Button variant="primary" size="sm">+ Feedback</Button>
                      </Link>
                    </div>

                    {feedbacks.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Icons.Message className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Aucun feedback soumis</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {feedbacks.map((fb) => (
                          <div key={fb._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Icons.Star key={s} className={`w-4 h-4 ${
                                    s <= fb.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'
                                  }`} />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(fb.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{fb.comment}</p>
                            {fb.axes && Object.entries(fb.axes).some(([, v]) => v) && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {Object.entries(fb.axes).filter(([, v]) => v).map(([axis, text]) => (
                                  <div key={axis} className="p-2 bg-white dark:bg-gray-900/50 rounded-lg">
                                    <p className="text-xs font-semibold text-gray-500 capitalize mb-1">{axis}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Bouton Gérer en bas ── */}
                    <div className="mt-6 pt-5 flex justify-center" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <ManageButton href="/dashboard/mentor/feedback" label="Gérer les feedbacks" />
                    </div>
                  </div>
                )}

                {/* ════ KPIs ════ */}
                {activeTab === 'KPIs' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Métriques de performance</h3>
                    {Object.keys(kpis).length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Icons.TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Aucun KPI disponible pour cette startup</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(kpis).map(([key, value]) => (
                          <div key={key} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ════ Rapports ════ */}
                {activeTab === 'Rapports' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {reports.length} rapport{reports.length !== 1 ? 's' : ''}
                      </h3>
                      <Link href={`/dashboard/mentor/reports/new?startupId=${id}`}>
                        <Button variant="primary" size="sm">
                          <Icons.Plus className="w-3.5 h-3.5 mr-1" />
                          Nouveau rapport
                        </Button>
                      </Link>
                    </div>

                    {/* Notice */}
                    <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                      <Icons.FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Pour créer ou modifier des rapports, accédez à la section dédiée.
                      </p>
                    </div>

                    {reports.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Icons.FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Aucun rapport disponible</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((r) => (
                          <div key={r._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icons.FileText className="w-4 h-4 text-[#006d94]" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  Rapport — {r.period?.month}/{r.period?.year}
                                </span>
                              </div>
                              <Badge variant={r.status === 'final' ? 'success' : 'warning'} size="sm">
                                {r.status === 'final' ? 'Finalisé' : 'Brouillon'}
                              </Badge>
                            </div>
                            {r.overallProgress !== undefined && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Progression globale</span>
                                  <span>{r.overallProgress}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#00526e] to-[#0088ba] rounded-full"
                                    style={{ width: `${r.overallProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {r.recommendations && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {r.recommendations}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Bouton Gérer en bas ── */}
                    <div className="mt-6 pt-5 flex justify-center" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <ManageButton href="/dashboard/mentor/reports" label="Gérer les rapports" />
                    </div>
                  </div>
                )}

                {/* ════ Ressources ════ */}
                {activeTab === 'Ressources' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {resources.length} ressource{resources.length !== 1 ? 's' : ''}
                      </h3>
                      <Link href={`/dashboard/mentor/resources/new?startupId=${id}`}>
                        <Button variant="primary" size="sm">
                          <Icons.Plus className="w-3.5 h-3.5 mr-1" />
                          Ajouter
                        </Button>
                      </Link>
                    </div>

                    {/* Notice */}
                    <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                      <Icons.Book className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Pour créer ou modifier des ressources, accédez à la section dédiée.
                      </p>
                    </div>

                    {resources.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Icons.Book className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Aucune ressource partagée</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resources.map((res) => (
                          <div key={res._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Icons.Book className="w-4 h-4 text-[#006d94] flex-shrink-0" />
                                <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {res.title}
                                </span>
                              </div>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                RESOURCE_TYPE_COLORS[res.type] || RESOURCE_TYPE_COLORS.other
                              }`}>
                                {res.type || 'autre'}
                              </span>
                            </div>
                            {res.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                {res.description}
                              </p>
                            )}
                            {res.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {res.tags.map((tag) => (
                                  <span key={tag} className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {res.url && (
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[#006d94] hover:underline mt-1"
                              >
                                <Icons.ExternalLink className="w-3 h-3" />
                                Accéder à la ressource
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Bouton Gérer en bas ── */}
                    <div className="mt-6 pt-5 flex justify-center" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <ManageButton href="/dashboard/mentor/resources" label="Gérer les ressources" />
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}