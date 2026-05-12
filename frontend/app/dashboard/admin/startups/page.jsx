'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import MatchingPanel from '@/app/components/ai-matching/MatchingPanel';
import SessionManager from '@/app/components/common/SessionManager';
import { useSelector } from 'react-redux';
import useTranslation from '@/app/hooks/useTranslation';
import { useAdminStartups } from '@/app/hooks/useAdminStartups';

// ═══════════════════════════════════════════════════════════════════════════
// STATIC REFERENCE DATA
// ═══════════════════════════════════════════════════════════════════════════
const MOCK_INVESTORS = [
  { id: 'inv-1', name: 'Samia Belhadj',  company: 'AfriCInvest',     avatar: 'SB', color: '#006d94' },
  { id: 'inv-2', name: 'Mehdi Gharbi',   company: 'BVMT Capital',    avatar: 'MG', color: '#8b5cf6' },
  { id: 'inv-3', name: 'Leila Mansouri', company: 'Flat6Labs',       avatar: 'LM', color: '#10b981' },
  { id: 'inv-4', name: 'Karim Oueslati', company: 'Sawari Ventures', avatar: 'KO', color: '#f59e0b' },
  { id: 'inv-5', name: 'David Nkosi',    company: 'Partech Africa',  avatar: 'DN', color: '#ef4444' },
];
const MOCK_MENTORS = [
  { id: 'men-1', name: 'Rania Souissi',  expertise: 'Growth & Marketing', avatar: 'RS', color: '#ec4899' },
  { id: 'men-2', name: 'Yassine Khelif', expertise: 'Product & Tech',     avatar: 'YK', color: '#06b6d4' },
  { id: 'men-3', name: 'Amira Hamdani',  expertise: 'Finance & Strategy', avatar: 'AH', color: '#84cc16' },
  { id: 'men-4', name: 'Tarek Bouzid',   expertise: 'B2B Sales & Ops',    avatar: 'TB', color: '#f97316' },
  { id: 'men-5', name: 'Sonia Trabelsi', expertise: 'Legal & Compliance', avatar: 'ST', color: '#a855f7' },
];
const SECTORS = ['FinTech','HealthTech','AgriTech','EdTech','CleanTech','SaaS','E-commerce','AI/ML','Logistics'];
const SECTOR_COLOR = {
  FinTech:      ['#00526e','#006d94'],
  HealthTech:   ['#0088ba','#00a3e0'],
  AgriTech:     ['#16a34a','#22c55e'],
  EdTech:       ['#b45309','#f59e0b'],
  CleanTech:    ['#0f766e','#14b8a6'],
  SaaS:         ['#6d28d9','#8b5cf6'],
  'E-commerce': ['#be185d','#ec4899'],
  'AI/ML':      ['#1d4ed8','#3b82f6'],
  Logistics:    ['#92400e','#d97706'],
};
const TIMELINE_PHASES = [
  { id: 'onboarding',  label: 'Onboarding',    duration: 2 },
  { id: 'ideation',    label: 'Ideation & MVP', duration: 6 },
  { id: 'development', label: 'Product Dev',    duration: 8 },
  { id: 'gtm',         label: 'Go-to-Market',   duration: 6 },
  { id: 'fundraising', label: 'Fundraising',    duration: 4 },
  { id: 'graduation',  label: 'Graduation',     duration: 2 },
];
const STATUS_MAP = {
  active:    { label: 'Active',    variant: 'success' },
  paused:    { label: 'En pause',  variant: 'warning' },
  graduated: { label: 'Diplomee',  variant: 'info'    },
};
const FORMATION_TYPES = [
  { id: 'onboarding_formation', label: 'Formation Onboarding'   },
  { id: 'monthly_report',       label: 'Rapport Mensuel'        },
  { id: 'kpi_update',           label: 'Mise a jour KPIs'       },
  { id: 'mentoring_feedback',   label: 'Feedback Mentoring'     },
  { id: 'investor_readiness',   label: 'Investor Readiness'     },
  { id: 'custom',               label: 'Formation personnalisee'},
];
const NEED_CATEGORIES = [
  { id: 'technique',   label: 'Technique & Produit'   },
  { id: 'commercial',  label: 'Commercial & Ventes'    },
  { id: 'financier',   label: 'Financier & Levee'      },
  { id: 'rh',          label: 'RH & Recrutement'       },
  { id: 'legal',       label: 'Juridique & Conformite' },
  { id: 'marketing',   label: 'Marketing & Croissance' },
  { id: 'partenariat', label: 'Partenariats & Reseau'  },
  { id: 'autre',       label: 'Autre'                  },
];
const NEED_PRIORITIES = [
  { id: 'critique', label: 'Critique', color: '#ef4444' },
  { id: 'haute',    label: 'Haute',    color: '#f97316' },
  { id: 'moyenne',  label: 'Moyenne',  color: '#f59e0b' },
  { id: 'faible',   label: 'Faible',   color: '#22c55e' },
];
const NEED_STATUSES = [
  { id: 'ouvert',   label: 'Ouvert'   },
  { id: 'en_cours', label: 'En cours' },
  { id: 'resolu',   label: 'Resolu'   },
];
const SESSION_TYPES = [
  { id: 'mentorat',     label: 'Mentorat'         },
  { id: 'workshop',     label: 'Workshop'          },
  { id: 'coaching',     label: 'Coaching'          },
  { id: 'revue',        label: 'Revue de KPIs'     },
  { id: 'investisseur', label: 'Rencontre Invest.' },
  { id: 'formation',    label: 'Formation'         },
  { id: 'pitch',        label: 'Pitch'             },
  { id: 'conference',   label: 'Conference'        },
  { id: 'autre',        label: 'Autre'             },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
const getSectorGrad   = (sector) => SECTOR_COLOR[sector] || ['#475569','#64748b'];
const getScoreColor   = (s) => s >= 80 ? 'text-emerald-600 dark:text-emerald-400' : s >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
const getScoreBar     = (s) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';
const getPhaseIndex   = (id) => TIMELINE_PHASES.findIndex((p) => p.id === id);
const resolveInvestor = (id) => MOCK_INVESTORS.find((i) => i.id === id) || null;
const resolveMentor   = (id) => MOCK_MENTORS.find((m) => m.id === id)   || null;

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════
const Icons = {
  search:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  filter:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>,
  grid:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
  list:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
  x:        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  refresh:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  location: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  save:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>,
  programme:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
  trash:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  sessions: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  building: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  doc:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  chart:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  send:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
};

const iCls = 'w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminStartupsPage() {
  const { user } = useSelector((state) => state.auth);
  const { t }    = useTranslation();

  const [mounted,      setMounted]      = useState(false);
  const [time,         setTime]         = useState(new Date());
  const [alert,        setAlert]        = useState({ show: false, type: '', message: '' });
  const [search,       setSearch]       = useState('');
  const [fSector,      setFSector]      = useState('all');
  const [fStatus,      setFStatus]      = useState('all');
  const [showFilters,  setShowFilters]  = useState(false);
  const [viewMode,     setViewMode]     = useState('grid');
  const [showSessions, setShowSessions] = useState(false);
  const [mentors,      setMentors]      = useState([]);

  useEffect(() => {
    fetch('/api/admin/mentors', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => { if (j.success) setMentors(j.data || []); })
      .catch(() => {});
  }, []);

  const { startups, loading, error, refetch, updateAssignments, updateTimeline } =
    useAdminStartups({ sector: fSector, status: fStatus, search });

  const [selected,    setSelected]    = useState(null);
  const [modalTab,    setModalTab]    = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3200);
  };

  const handleSaveAssignments = async (startupId, investorIds, mentorIds) => {
    try {
      await updateAssignments(startupId, investorIds, mentorIds);
      if (selected?.id === startupId) {
        setSelected((prev) => ({ ...prev, investorIds: [...investorIds], mentorIds: [...mentorIds] }));
      }
      showNotification('success', 'Assignations mises a jour.');
    } catch {
      showNotification('error', 'Erreur lors de la sauvegarde.');
    }
  };

  const handleSaveTimeline = async (startupId, timelinePhase, timelineProgress, timelineNotes) => {
    try {
      await updateTimeline(startupId, timelinePhase, timelineProgress, timelineNotes);
      if (selected?.id === startupId) {
        setSelected((prev) => ({ ...prev, timelinePhase, timelineProgress, timelineNotes }));
      }
      showNotification('success', 'Timeline mise a jour.');
    } catch {
      showNotification('error', 'Erreur lors de la sauvegarde.');
    }
  };

  const stats = {
    total:        startups.length,
    active:       startups.filter((s) => s.status === 'active').length,
    paused:       startups.filter((s) => s.status === 'paused').length,
    graduated:    startups.filter((s) => s.status === 'graduated').length,
    avgScore:     startups.length ? Math.round(startups.reduce((a, s) => a + (s.score || 0), 0) / startups.length) : 0,
    withInvestor: startups.filter((s) => s.investorIds?.length > 0).length,
  };

  const activeFilters = [fSector !== 'all', fStatus !== 'all', search !== ''].filter(Boolean).length;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          .mono { font-family: 'JetBrains Mono', monospace; }
          @keyframes slideInUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideInRight { from{opacity:0;transform:translateX(80px)} to{opacity:1;transform:translateX(0)} }
          @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes holographic-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          .animate-slide-in-up    { animation:slideInUp 0.6s ease-out forwards; }
          .animate-slide-in-right { animation:slideInRight 0.6s ease-out forwards; }
          .animate-scale-in       { animation:scaleIn 0.45s ease-out forwards; }
          .animate-fade-in        { animation:fadeIn 0.3s ease forwards; }
          .glass-card { background:rgba(255,255,255,0.95); backdrop-filter:blur(10px); border:1px solid rgba(0,0,0,0.05); }
          :global(.dark) .glass-card { background:#1e293b; border:1px solid #334155; box-shadow:0 4px 20px rgba(0,0,0,0.25); }
          .dark-glass { background:linear-gradient(135deg,rgba(0,82,110,0.95),rgba(0,109,148,0.95)); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.12); }
          .holographic { background:linear-gradient(135deg,rgba(0,186,255,0.08) 0%,rgba(255,191,0,0.08) 50%,rgba(0,186,255,0.08) 100%); background-size:200% 200%; animation:holographic-shift 3s ease infinite; }
          .particle { position:absolute; width:4px; height:4px; background:rgba(255,255,255,0.35); border-radius:50%; animation:float 6s ease-in-out infinite; }
          .startup-card { transition:all 0.3s ease; cursor:pointer; }
          .startup-card:hover { transform:translateY(-4px); box-shadow:0 20px 30px -8px rgba(0,82,110,0.18); }
          .stat-card { transition:all 0.3s ease; }
          .stat-card:hover { transform:translateY(-3px); }
          .timeline-bar { transition:width 0.8s cubic-bezier(0.4,0,0.2,1); }
          :global(.dark) .text-gray-900 { color:#f1f5f9; }
          :global(.dark) .text-gray-600 { color:#94a3b8; }
          :global(.dark) .bg-white      { background-color:#1e293b; }
          :global(.dark) .bg-gray-50    { background-color:#0f172a; }
        `}</style>

        <div className="space-y-7 min-h-screen pb-10">

          {/* ALERT */}
          {alert.show && (
            <div className="animate-fade-in fixed top-4 right-4 z-50 max-w-sm">
              <Alert type={alert.type} message={alert.message}
                onClose={() => setAlert({ show: false, type: '', message: '' })} />
            </div>
          )}

          {/* HERO */}
          <div className="relative overflow-hidden rounded-3xl p-10 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="particle" style={{ top:'10%', left:'12%', animationDelay:'0s' }} />
            <div className="particle" style={{ top:'65%', left:'78%', animationDelay:'1.2s' }} />
            <div className="absolute inset-0 holographic opacity-25" />
            <div className="relative flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide">STARTUPS</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">Live</span>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Gestion des Startups</h1>
                <p className="text-blue-100 text-lg font-medium">Assignation investisseurs & mentors · Timeline · Sessions</p>
                <div className="flex items-center gap-6 text-blue-100/90 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Backend connecte</span>
                  </div>
                  <span className="mono text-sm">
                    {mounted && time.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                  </span>
                  <button onClick={() => setShowSessions(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold text-white transition-all border border-white/20">
                    {Icons.sessions} Sessions
                  </button>
                </div>
              </div>
              <div className="dark-glass rounded-2xl p-5 min-w-[240px] animate-slide-in-right">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl">
                      {user?.name?.split(' ').map((n) => n[0]).join('') || 'AD'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{user?.name || 'Admin'}</p>
                    <p className="text-blue-200 text-sm mono">SYS.ADMIN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ERROR BANNER */}
          {error && (
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-700 dark:text-red-300">
              <span>{error}</span>
              <button onClick={refetch}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg hover:bg-red-200 transition-colors font-medium">
                {Icons.refresh} Reessayer
              </button>
            </div>
          )}

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label:'Total',        value: stats.total,        color:'text-primary-600 dark:text-primary-400', bg:'from-blue-500 to-blue-600',     delay:'0.08s' },
              { label:'Actives',      value: stats.active,       color:'text-emerald-600 dark:text-emerald-400', bg:'from-emerald-500 to-green-600', delay:'0.12s' },
              { label:'En pause',     value: stats.paused,       color:'text-amber-600 dark:text-amber-400',     bg:'from-amber-500 to-orange-500',  delay:'0.16s' },
              { label:'Diplomees',    value: stats.graduated,    color:'text-sky-600 dark:text-sky-400',         bg:'from-sky-500 to-cyan-500',      delay:'0.20s' },
              { label:'Score moyen',  value: stats.avgScore,     color:'text-purple-600 dark:text-purple-400',   bg:'from-purple-500 to-pink-500',   delay:'0.24s', suffix:'/100' },
              { label:'Avec invest.', value: stats.withInvestor, color:'text-rose-600 dark:text-rose-400',       bg:'from-rose-500 to-pink-500',     delay:'0.28s' },
            ].map((s, i) => (
              <div key={i} className="stat-card glass-card rounded-2xl p-4 animate-scale-in dark:!bg-[#1e293b]" style={{ animationDelay: s.delay }}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white text-xs font-bold shadow mb-2`}>#</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>
                  {loading ? '...' : s.value}
                  {s.suffix && !loading && <span className="text-xs text-gray-400 ml-0.5">{s.suffix}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* TOOLBAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${showFilters ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {Icons.filter} Filtres
                {activeFilters > 0 && <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{activeFilters}</span>}
              </button>
              <div className="flex items-center bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{Icons.grid}</button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{Icons.list}</button>
              </div>
              <button onClick={refetch} className="p-2.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title="Actualiser">
                {Icons.refresh}
              </button>
              <button onClick={() => setShowSessions(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all">
                {Icons.sessions} Sessions
              </button>
              {activeFilters > 0 && (
                <button onClick={() => { setFSector('all'); setFStatus('all'); setSearch(''); }}
                  className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 hover:underline">
                  {Icons.x} Reinitialiser
                </button>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Chargement...' : `${startups.length} startup${startups.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* SEARCH / FILTERS */}
          <div className="glass-card rounded-2xl p-5 dark:!bg-[#1e293b]">
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
              <input type="text" placeholder="Rechercher par nom, fondateur, secteur..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{Icons.x}</button>
              )}
            </div>
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5">Secteur</label>
                  <select value={fSector} onChange={(e) => setFSector(e.target.value)} className={iCls}>
                    <option value="all">Tous les secteurs</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5">Statut</label>
                  <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={iCls}>
                    <option value="all">Toutes (acceptees)</option>
                    <option value="active">Actives</option>
                    <option value="graduated">Diplomees</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl p-6 animate-pulse dark:!bg-[#1e293b]">
                    <div className="flex gap-4 mb-4">
                      <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : startups.length === 0 ? (
                <div className="col-span-full glass-card rounded-2xl p-12 text-center dark:!bg-[#1e293b]">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-400">{Icons.building}</div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucune startup trouvee</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ajustez vos filtres ou lancez le seed script.</p>
                </div>
              ) : startups.map((startup, idx) => {
                const [g1, g2] = getSectorGrad(startup.sector);
                const sm       = STATUS_MAP[startup.status] || STATUS_MAP.active;
                const phaseIdx = getPhaseIndex(startup.timelinePhase);
                const phase    = TIMELINE_PHASES[phaseIdx];
                return (
                  <div key={startup.id}
                    className="startup-card glass-card rounded-2xl overflow-hidden animate-scale-in dark:!bg-[#1e293b] group"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                    onClick={() => { setSelected(startup); setModalTab('overview'); setIsModalOpen(true); }}>
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg,${g1},${g2})` }} />
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
                          style={{ background: `linear-gradient(135deg,${g1},${g2})` }}>
                          {startup.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{startup.name}</h3>
                            <Badge variant={sm.variant} size="sm">{sm.label}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{startup.founder}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">{Icons.location} {startup.location}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{startup.sector}</span>
                        <span className="px-2 py-0.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">{startup.stage}</span>
                        {startup.programmeName && (
                          <span className="px-2 py-0.5 text-xs rounded-full font-medium text-white flex items-center gap-1" style={{ background: g1 }}>
                            {Icons.programme} {startup.programmeName.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Score IA</span>
                          <span className={`font-semibold ${getScoreColor(startup.score)}`}>{startup.score}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full timeline-bar ${getScoreBar(startup.score)}`} style={{ width: `${startup.score}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[{ label:'MRR', value: startup.kpis?.mrr }, { label:'Users', value: startup.kpis?.users }, { label:'Growth', value: startup.kpis?.growth }].map((k) => (
                          <div key={k.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1.5 text-center">
                            <p className="text-[10px] text-gray-400">{k.label}</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white mono">{k.value ?? '—'}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Timeline</span>
                          <span className="font-semibold" style={{ color: g1 }}>{phase?.label || '—'}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full timeline-bar" style={{ width: `${startup.timelineProgress}%`, background: `linear-gradient(90deg,${g1},${g2})` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>Phase {phaseIdx + 1}/{TIMELINE_PHASES.length}</span>
                          <span>{startup.timelineProgress}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <InvestorAvatars ids={startup.investorIds} />
                        <MentorAvatars   ids={startup.mentorIds} />
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 mono">
                          {startup.acceptedAt && new Date(startup.acceptedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setSelected(startup); setModalTab('assign'); setIsModalOpen(true); }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 transition-all">Assigner</button>
                          <button onClick={(e) => { e.stopPropagation(); setSelected(startup); setModalTab('timeline'); setIsModalOpen(true); }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 transition-all">Timeline</button>
                          <button onClick={(e) => { e.stopPropagation(); setSelected(startup); setModalTab('formations'); setIsModalOpen(true); }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100 transition-all">Formations</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="glass-card rounded-2xl overflow-hidden dark:!bg-[#1e293b]">
              {loading ? (
                <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : startups.length === 0 ? (
                <div className="p-12 text-center"><p className="text-lg font-bold text-gray-900 dark:text-white">Aucune startup trouvee</p></div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                      {['Startup','Secteur','Statut','Score','Timeline','Investisseurs','Mentors','Actions'].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {startups.map((startup, i) => {
                      const [g1, g2] = getSectorGrad(startup.sector);
                      const sm       = STATUS_MAP[startup.status] || STATUS_MAP.active;
                      const phaseIdx = getPhaseIndex(startup.timelinePhase);
                      const phase    = TIMELINE_PHASES[phaseIdx];
                      return (
                        <tr key={startup.id}
                          className={`hover:bg-gray-50/60 dark:hover:bg-white/5 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-gray-50/30 dark:bg-gray-900/10' : ''}`}
                          onClick={() => { setSelected(startup); setModalTab('overview'); setIsModalOpen(true); }}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: `linear-gradient(135deg,${g1},${g2})` }}>{startup.logo}</div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{startup.name}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{startup.founder}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5"><span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{startup.sector}</span></td>
                          <td className="px-5 py-3.5"><Badge variant={sm.variant} size="sm">{sm.label}</Badge></td>
                          <td className="px-5 py-3.5">
                            <span className={`font-bold text-sm ${getScoreColor(startup.score)}`}>{startup.score}</span>
                            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                              <div className={`h-full rounded-full ${getScoreBar(startup.score)}`} style={{ width: `${startup.score}%` }} />
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{phase?.label || '—'}</p>
                            <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${startup.timelineProgress}%`, background: `linear-gradient(90deg,${g1},${g2})` }} />
                            </div>
                          </td>
                          <td className="px-5 py-3.5"><InvestorAvatars ids={startup.investorIds} size="sm" /></td>
                          <td className="px-5 py-3.5"><MentorAvatars   ids={startup.mentorIds}   size="sm" /></td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { setSelected(startup); setModalTab('assign');     setIsModalOpen(true); }} className="px-2 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100">Assigner</button>
                              <button onClick={() => { setSelected(startup); setModalTab('timeline');   setIsModalOpen(true); }} className="px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100">Timeline</button>
                              <button onClick={() => { setSelected(startup); setModalTab('formations'); setIsModalOpen(true); }} className="px-2 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100">Formations</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {selected && (
          <StartupModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            startup={selected}
            initialTab={modalTab}
            onSaveAssignments={handleSaveAssignments}
            onSaveTimeline={handleSaveTimeline}
          />
        )}

        <SessionManager
          isOpen={showSessions}
          onClose={() => setShowSessions(false)}
          startups={startups}
          mentors={mentors}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function InvestorAvatars({ ids = [], size = 'md' }) {
  const wh = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-6 h-6 text-[9px]';
  if (!ids || ids.length === 0) return <span className="text-xs text-red-400 italic">Non assigne</span>;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide mr-1">Inv.</span>
      <div className="flex -space-x-1">
        {ids.map((id) => {
          const inv = resolveInvestor(id);
          return (
            <div key={id} title={inv ? `${inv.name} - ${inv.company}` : `ID: ${id}`}
              className={`${wh} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-gray-900`}
              style={{ background: inv?.color || '#94a3b8' }}>
              {inv ? inv.avatar : '?'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MentorAvatars({ ids = [], size = 'md' }) {
  const wh = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-6 h-6 text-[9px]';
  if (!ids || ids.length === 0) return <span className="text-xs text-red-400 italic">Non assigne</span>;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide mr-1">Men.</span>
      <div className="flex -space-x-1">
        {ids.map((id) => {
          const men = resolveMentor(id);
          return (
            <div key={id} title={men ? `${men.name} - ${men.expertise}` : `ID: ${id}`}
              className={`${wh} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-gray-900`}
              style={{ background: men?.color || '#94a3b8' }}>
              {men ? men.avatar : '?'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STARTUP MODAL
// ═══════════════════════════════════════════════════════════════════════════
function StartupModal({ isOpen, onClose, startup, initialTab, onSaveAssignments, onSaveTimeline }) {
  const [activeTab,        setActiveTab]        = useState(initialTab || 'overview');
  const [investorIds,      setInvestorIds]      = useState([...(startup.investorIds || [])]);
  const [mentorIds,        setMentorIds]        = useState([...(startup.mentorIds   || [])]);
  const [timelinePhase,    setTimelinePhase]    = useState(startup.timelinePhase);
  const [timelineProgress, setTimelineProgress] = useState(startup.timelineProgress);
  const [timelineNotes,    setTimelineNotes]    = useState(startup.timelineNotes || '');
  const [saving,           setSaving]           = useState(false);

  const [besoins,           setBesoins]      = useState(startup.besoins           || []);
  const [sessions,          setSessions]     = useState(startup.sessionHistory    || []);
  const [startupFormations, setStartupForms] = useState(startup.startupFormations || []);

  const [showNeedForm,    setShowNeedForm]    = useState(false);
  const [newBesoin,       setNewBesoin]       = useState({ category: 'technique', priority: 'moyenne', title: '', description: '', status: 'ouvert' });
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [newSession,      setNewSession]      = useState({ type: 'mentorat', title: '', date: '', duration: '', participants: '', notes: '', outcome: '' });
  const [showNewForm,     setShowNewForm]     = useState(false);
  const [newFormation,    setNewFormation]    = useState({ type: 'custom', title: '', deadline: '', description: '' });

  useEffect(() => {
    setActiveTab(initialTab || 'overview');
    setInvestorIds([...(startup.investorIds || [])]);
    setMentorIds([...(startup.mentorIds     || [])]);
    setTimelinePhase(startup.timelinePhase);
    setTimelineProgress(startup.timelineProgress);
    setTimelineNotes(startup.timelineNotes || '');
    setBesoins(startup.besoins           || []);
    setSessions(startup.sessionHistory   || []);
    setStartupForms(startup.startupFormations || []);
  }, [startup, initialTab]);

  const [g1, g2] = getSectorGrad(startup.sector);
  const phaseIdx  = getPhaseIndex(timelinePhase);

  const handleSaveAssign = async () => {
    setSaving(true);
    await onSaveAssignments(startup.id, investorIds, mentorIds);
    setSaving(false);
  };

  const handleSaveTimeline = async () => {
    setSaving(true);
    await onSaveTimeline(startup.id, timelinePhase, timelineProgress, timelineNotes);
    setSaving(false);
  };

  const handleCreateBesoin = () => {
    if (!newBesoin.title) return;
    setBesoins((prev) => [...prev, { id: `b${Date.now()}`, ...newBesoin, createdAt: new Date().toISOString() }]);
    setNewBesoin({ category: 'technique', priority: 'moyenne', title: '', description: '', status: 'ouvert' });
    setShowNeedForm(false);
  };

  const handleCreateSession = () => {
    if (!newSession.title || !newSession.date) return;
    setSessions((prev) => [...prev, { id: `s${Date.now()}`, ...newSession, createdAt: new Date().toISOString() }]);
    setNewSession({ type: 'mentorat', title: '', date: '', duration: '', participants: '', notes: '', outcome: '' });
    setShowSessionForm(false);
  };

  const handleCreateFormation = () => {
    if (!newFormation.title) return;
    setStartupForms((prev) => [...prev, { id: `sf${Date.now()}`, ...newFormation, status: 'active', responses: 0, total: 1, sentAt: new Date().toISOString() }]);
    setNewFormation({ type: 'custom', title: '', deadline: '', description: '' });
    setShowNewForm(false);
  };

  const TABS = [
    { id: 'overview',   label: "Vue d'ensemble"         },
    { id: 'besoins',    label: 'Besoins'                 },
    { id: 'assign',     label: 'Investisseurs & Mentors' },
    { id: 'timeline',   label: 'Timeline'                },
    { id: 'sessions',   label: 'Historique Sessions'     },
    { id: 'formations', label: 'Formations specifiques'  },
    { id: 'kpis',       label: 'KPIs'                    },
    { id: 'matching',   label: 'Matching IA'             },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={startup.name} size="xl">
      {startup.programmeName && (
        <div className="flex items-center gap-2 mb-4 -mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: g1 }}>
            {startup.programmeName}
          </span>
        </div>
      )}

      {/* TABS */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex space-x-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VUE D'ENSEMBLE */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="flex items-start gap-5 p-5 rounded-2xl" style={{ background: `linear-gradient(135deg,${g1}18,${g2}18)`, border: `1px solid ${g1}30` }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0" style={{ background: `linear-gradient(135deg,${g1},${g2})` }}>{startup.logo}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{startup.name}</h3>
                <Badge variant={STATUS_MAP[startup.status]?.variant || 'success'} size="sm">{STATUS_MAP[startup.status]?.label}</Badge>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{startup.founder}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{startup.location}</span>
                {startup.website && <a href={startup.website} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: g1 }}>{startup.website}</a>}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">{startup.description || 'Aucune description.'}</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Secteur', value: startup.sector, color:'text-primary-600 dark:text-primary-400' },
              { label:'Stade',   value: startup.stage,  color:'text-amber-600 dark:text-amber-400' },
              { label:'Score',   value: `${startup.score}/100`, color: getScoreColor(startup.score) },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
                <p className={`font-bold mono ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AssignSummary title="Investisseurs" ids={investorIds} pool={MOCK_INVESTORS} />
            <AssignSummary title="Mentors"       ids={mentorIds}   pool={MOCK_MENTORS} isMentor />
          </div>
        </div>
      )}

      {/* MATCHING IA */}
      {activeTab === 'matching' && (
        <MatchingPanel applicationId={startup.id} applicationStatus={startup.applicationStatus} />
      )}

      {/* ASSIGN */}
      {activeTab === 'assign' && (
        <div className="space-y-6">
          {(investorIds.length > 0 || mentorIds.length > 0) && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Assignations actuelles</p>
              <div className="flex flex-wrap gap-2">
                {investorIds.map((id) => { const inv = resolveInvestor(id); return (
                  <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]" style={{ background: inv?.color || '#94a3b8' }}>{inv?.avatar || '?'}</span>
                    {inv?.name || id} <span className="text-gray-400">· Inv.</span>
                  </span>
                ); })}
                {mentorIds.map((id) => { const men = resolveMentor(id); return (
                  <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]" style={{ background: men?.color || '#94a3b8' }}>{men?.avatar || '?'}</span>
                    {men?.name || id} <span className="text-gray-400">· Men.</span>
                  </span>
                ); })}
              </div>
            </div>
          )}
          <SelectableList title="Investisseurs" selectedIds={investorIds}
            onToggle={(id) => setInvestorIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
            items={MOCK_INVESTORS.map((i) => ({ id: i.id, primary: i.name, secondary: i.company, avatar: i.avatar, color: i.color }))} g1={g1} />
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <SelectableList title="Mentors" selectedIds={mentorIds}
            onToggle={(id) => setMentorIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
            items={MOCK_MENTORS.map((m) => ({ id: m.id, primary: m.name, secondary: m.expertise, avatar: m.avatar, color: m.color }))} g1={g1} />
          <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <SaveButton onClick={handleSaveAssign} saving={saving} label="Enregistrer les assignations" color="primary" />
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Phases du programme</p>
            <div className="relative">
              <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="absolute top-5 left-5 h-1 rounded-full transition-all duration-700"
                style={{ width:`calc(${(phaseIdx / (TIMELINE_PHASES.length - 1)) * 100}% * (100% - 40px) / 100%)`, background:`linear-gradient(90deg,${g1},${g2})`, maxWidth:'calc(100% - 40px)' }} />
              <div className="flex justify-between relative">
                {TIMELINE_PHASES.map((phase, idx) => {
                  const done = idx < phaseIdx; const current = idx === phaseIdx;
                  return (
                    <div key={phase.id} className="flex flex-col items-center gap-2" style={{ width:`${100/TIMELINE_PHASES.length}%` }}>
                      <button onClick={() => setTimelinePhase(phase.id)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all z-10 ${current ? 'border-white ring-2 text-white shadow-lg' : done ? 'border-white text-white' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400'}`}
                        style={current || done ? { background:`linear-gradient(135deg,${g1},${g2})`, borderColor: g2 } : {}}>
                        {done ? '✓' : idx + 1}
                      </button>
                      <span className="text-[10px] font-medium text-center leading-tight" style={current ? { color: g1, fontWeight:700 } : {}}>{phase.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="font-semibold text-gray-700 dark:text-gray-200">Progression phase actuelle</label>
              <span className="font-bold mono" style={{ color: g1 }}>{timelineProgress}%</span>
            </div>
            <input type="range" min="0" max="100" value={timelineProgress} onChange={(e) => setTimelineProgress(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ background:`linear-gradient(90deg,${g1} ${timelineProgress}%,#e5e7eb ${timelineProgress}%)` }} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Notes de progression</label>
            <textarea value={timelineNotes} onChange={(e) => setTimelineNotes(e.target.value)} rows={4} className={`${iCls} resize-none`} placeholder="Avancement, jalons atteints..." />
          </div>
          <div className="p-4 rounded-xl border" style={{ background:`${g1}10`, borderColor:`${g1}30` }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: g1 }}>Phase actuelle</p>
            <p className="font-bold text-gray-900 dark:text-white">{TIMELINE_PHASES[phaseIdx]?.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Duree estimee : {TIMELINE_PHASES[phaseIdx]?.duration} semaines</p>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <SaveButton onClick={handleSaveTimeline} saving={saving} label="Mettre a jour la timeline" color="purple" />
          </div>
        </div>
      )}

      {/* BESOINS */}
      {activeTab === 'besoins' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Identification des besoins</h4>
              <p className="text-xs text-gray-400 mt-0.5">{besoins.filter((b) => b.status !== 'resolu').length} besoin(s) ouvert(s)</p>
            </div>
            <button onClick={() => setShowNeedForm(!showNeedForm)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">+ Ajouter besoin</button>
          </div>
          {besoins.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {NEED_PRIORITIES.map((p) => {
                const count = besoins.filter((b) => b.priority === p.id && b.status !== 'resolu').length;
                return (
                  <div key={p.id} className="p-3 rounded-xl border text-center" style={{ borderColor:`${p.color}30`, background:`${p.color}08` }}>
                    <p className="text-lg font-bold" style={{ color: p.color }}>{count}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{p.label}</p>
                  </div>
                );
              })}
            </div>
          )}
          {showNeedForm && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">Nouveau besoin</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Categorie</label><select value={newBesoin.category} onChange={(e) => setNewBesoin((p) => ({ ...p, category: e.target.value }))} className={iCls}>{NEED_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Priorite</label><select value={newBesoin.priority} onChange={(e) => setNewBesoin((p) => ({ ...p, priority: e.target.value }))} className={iCls}>{NEED_PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Titre *</label><input value={newBesoin.title} onChange={(e) => setNewBesoin((p) => ({ ...p, title: e.target.value }))} placeholder="Ex : Acces financement SICAR..." className={iCls} /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Description</label><textarea value={newBesoin.description} onChange={(e) => setNewBesoin((p) => ({ ...p, description: e.target.value }))} rows={2} className={`${iCls} resize-none`} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNeedForm(false)} className="px-4 py-2 text-xs text-gray-600 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</button>
                <button onClick={handleCreateBesoin} disabled={!newBesoin.title} className="px-4 py-2 text-xs font-semibold bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-40">Enregistrer</button>
              </div>
            </div>
          )}
          {besoins.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-sm font-medium">Aucun besoin identifie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {['critique','haute','moyenne','faible'].map((pId) => {
                const group = besoins.filter((b) => b.priority === pId);
                if (!group.length) return null;
                const pInfo = NEED_PRIORITIES.find((p) => p.id === pId);
                return (
                  <div key={pId}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: pInfo.color }}>{pInfo.label} ({group.length})</p>
                    {group.map((besoin, bIdx) => {
                      const cat  = NEED_CATEGORIES.find((c) => c.id === besoin.category);
                      const stat = NEED_STATUSES.find((s) => s.id === besoin.status);
                      const bid  = besoin._id || besoin.id || `besoin-${bIdx}`;
                      return (
                        <div key={bid} className="p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl mb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{besoin.title}</span>
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{cat?.label}</span>
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                                  style={{ background: besoin.status==='resolu'?'#dcfce7':besoin.status==='en_cours'?'#dbeafe':'#fef3c7', color: besoin.status==='resolu'?'#166534':besoin.status==='en_cours'?'#1e40af':'#92400e' }}>
                                  {stat?.label}
                                </span>
                              </div>
                              {besoin.description && <p className="text-xs text-gray-500 dark:text-gray-400">{besoin.description}</p>}
                              <p className="text-[10px] text-gray-400 mt-1">{besoin.createdAt && new Date(besoin.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {besoin.status !== 'resolu' && (
                                <select value={besoin.status} onChange={(e) => setBesoins((prev) => prev.map((b) => (b._id||b.id)===bid ? { ...b, status: e.target.value } : b))}
                                  className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                                  {NEED_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                              )}
                              <button onClick={() => setBesoins((p) => p.filter((b) => (b._id||b.id) !== bid))} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* HISTORIQUE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Historique des sessions</h4>
              <p className="text-xs text-gray-400 mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''} enregistree{sessions.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowSessionForm(!showSessionForm)} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-xl hover:bg-cyan-700 transition-colors">+ Nouvelle session</button>
          </div>
          {sessions.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:'Total sessions', value: sessions.length },
                { label:'Mentorats',      value: sessions.filter((s) => ['mentorat','mentoring'].includes(s.type)).length },
                { label:'Ateliers',       value: sessions.filter((s) => ['workshop','formation','pitch','conference'].includes(s.type)).length },
              ].map((k) => (
                <div key={k.label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
          )}
          {showSessionForm && (
            <div className="p-4 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">Nouvelle session</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Type</label><select value={newSession.type} onChange={(e) => setNewSession((p) => ({ ...p, type: e.target.value }))} className={iCls}>{SESSION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Date *</label><input type="date" value={newSession.date} onChange={(e) => setNewSession((p) => ({ ...p, date: e.target.value }))} className={iCls} /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Titre *</label><input value={newSession.title} onChange={(e) => setNewSession((p) => ({ ...p, title: e.target.value }))} placeholder="Ex : Session strategie go-to-market..." className={iCls} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Duree</label><input value={newSession.duration} onChange={(e) => setNewSession((p) => ({ ...p, duration: e.target.value }))} placeholder="Ex : 1h30" className={iCls} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Participants</label><input value={newSession.participants} onChange={(e) => setNewSession((p) => ({ ...p, participants: e.target.value }))} placeholder="Ex : Rania Souissi" className={iCls} /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Notes</label><textarea value={newSession.notes} onChange={(e) => setNewSession((p) => ({ ...p, notes: e.target.value }))} rows={2} className={`${iCls} resize-none`} /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Resultats / Actions</label><textarea value={newSession.outcome} onChange={(e) => setNewSession((p) => ({ ...p, outcome: e.target.value }))} rows={2} className={`${iCls} resize-none`} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowSessionForm(false)} className="px-4 py-2 text-xs text-gray-600 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</button>
                <button onClick={handleCreateSession} disabled={!newSession.title || !newSession.date} className="px-4 py-2 text-xs font-semibold bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-40">Enregistrer</button>
              </div>
            </div>
          )}
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-sm font-medium">Aucune session enregistree</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-4">
                {[...sessions].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).map((session, idx) => {
                  const typeColors = {
                    mentorat:['#006d94','#0088ba'],mentoring:['#006d94','#0088ba'],
                    workshop:['#8b5cf6','#a78bfa'],formation:['#7c3aed','#a78bfa'],
                    coaching:['#10b981','#34d399'],revue:['#f59e0b','#fbbf24'],
                    investisseur:['#ef4444','#f87171'],pitch:['#d97706','#f59e0b'],
                    conference:['#059669','#34d399'],autre:['#64748b','#94a3b8'],
                  };
                  const [tc1,tc2] = typeColors[session.type] || typeColors.autre;
                  const typeInfo  = SESSION_TYPES.find((t) => t.id === session.type);
                  const sid       = session._id || session.id || `session-${idx}`;
                  const sDate     = session.date || session.createdAt;
                  return (
                    <div key={sid} className="pl-10 relative">
                      <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 z-10" style={{ background: tc1 }} />
                      <div className="p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full text-white" style={{ background:`linear-gradient(90deg,${tc1},${tc2})` }}>{typeInfo?.label || session.type}</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{session.title}</span>
                              {session.status === 'done' && <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">Terminee</span>}
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {sDate && <span>{new Date(sDate).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</span>}
                              {session.duration    && <span>· {session.duration}{typeof session.duration === 'number' ? ' min' : ''}</span>}
                              {session.participants&& <span>· {session.participants}</span>}
                            </div>
                            {session.notes && <div className="mb-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p><p className="text-xs text-gray-600 dark:text-gray-300">{session.notes}</p></div>}
                            {(session.outcome || session.description) && <div className="p-2.5 rounded-lg border" style={{ background:`${tc1}10`, borderColor:`${tc1}30` }}><p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: tc1 }}>Resultats</p><p className="text-xs text-gray-600 dark:text-gray-300">{session.outcome || session.description}</p></div>}
                          </div>
                          <button onClick={() => setSessions((p) => p.filter((s) => (s._id||s.id) !== sid))} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FORMATIONS SPECIFIQUES */}
      {activeTab === 'formations' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Formations specifiques</h4>
              <p className="text-xs text-gray-400 mt-0.5">Formulaires envoyes uniquement a {startup.name}</p>
            </div>
            <button onClick={() => setShowNewForm(!showNewForm)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">+ Nouvelle</button>
          </div>
          {showNewForm && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Type</label><select value={newFormation.type} onChange={(e) => setNewFormation((p) => ({ ...p, type: e.target.value }))} className={iCls}>{FORMATION_TYPES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Titre *</label><input value={newFormation.title} onChange={(e) => setNewFormation((p) => ({ ...p, title: e.target.value }))} placeholder="Titre" className={iCls} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Date limite</label><input type="date" value={newFormation.deadline} onChange={(e) => setNewFormation((p) => ({ ...p, deadline: e.target.value }))} className={iCls} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Instructions</label><input value={newFormation.description} onChange={(e) => setNewFormation((p) => ({ ...p, description: e.target.value }))} placeholder="Instructions..." className={iCls} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-xs text-gray-600 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50">Annuler</button>
                <button onClick={handleCreateFormation} disabled={!newFormation.title} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                  Envoyer
                </button>
              </div>
            </div>
          )}
          {startupFormations.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <p className="text-sm font-medium">Aucune formation pour {startup.name}</p>
            </div>
          ) : (
            startupFormations.map((formation, index) => {
              const ft  = FORMATION_TYPES.find((t) => t.id === formation.type);
              const fid = formation._id || formation.id || `formation-${index}`;
              return (
                <div key={fid} className="p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{formation.title}</p>
                      <p className="text-xs text-gray-400">
                        {ft?.label}
                        {formation.deadline && ` · Deadline : ${new Date(formation.deadline).toLocaleDateString('fr-FR')}`}
                        {' · '}{formation.status === 'completed' ? 'Complete' : 'En attente'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setStartupForms((p) => p.filter((_, i) => i !== index))} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* KPIs */}
      {activeTab === 'kpis' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'MRR',          value: startup.kpis?.mrr,    color:'from-emerald-500 to-green-600' },
              { label:'Utilisateurs', value: startup.kpis?.users,  color:'from-blue-500 to-blue-600' },
              { label:'Croissance',   value: startup.kpis?.growth, color:'from-purple-500 to-purple-600' },
            ].map((k) => (
              <div key={k.label} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center">
                <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-white shadow-md mb-3`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mono">{k.value || '—'}</p>
              </div>
            ))}
          </div>
          {startup.documents?.length > 0 && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Documents ({startup.documents.length})</p>
              <div className="flex flex-wrap gap-2">
                {startup.documents.map((doc, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white dark:bg-gray-900 rounded-lg text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border border-gray-200 dark:border-gray-700">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    {typeof doc === 'string' ? doc : (doc?.name || '[document]')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════
function AssignSummary({ title, ids, pool, isMentor }) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{title} ({ids.length})</p>
      {ids.length === 0 ? <p className="text-xs text-red-400 italic">Aucun assigne</p> : ids.map((id) => {
        const item = pool.find((x) => x.id === id);
        return item ? (
          <div key={id} className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: item.color }}>{item.avatar}</div>
            <span className="text-xs text-gray-700 dark:text-gray-300">{item.name}</span>
            {isMentor && item.expertise && <span className="text-[10px] text-gray-400">· {item.expertise}</span>}
            {!isMentor && item.company   && <span className="text-[10px] text-gray-400">· {item.company}</span>}
          </div>
        ) : (
          <div key={id} className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-[9px] font-bold">?</div>
            <span className="text-xs text-gray-400 italic mono">{id}</span>
          </div>
        );
      })}
    </div>
  );
}

function SelectableList({ title, selectedIds, onToggle, items, g1 }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{title} — {selectedIds.length} selectionne(s)</p>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => {
          const sel = selectedIds.includes(item.id);
          return (
            <div key={item.id} onClick={() => onToggle(item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${sel ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: sel ? g1 : item.color }}>{item.avatar}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.primary}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.secondary}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'}`}>
                {sel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving, label, color = 'primary' }) {
  const colors = { primary: 'from-primary-600 to-primary-700', purple: 'from-purple-600 to-purple-700' };
  return (
    <button onClick={onClick} disabled={saving}
      className={`px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r ${colors[color]} rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2`}>
      {saving ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Sauvegarde...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          {label}
        </>
      )}
    </button>
  );
}