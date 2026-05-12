'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import useTranslation from '@/app/hooks/useTranslation';
import { useApplicationsApi } from '@/app/hooks/useApplicationsApi';
import { useJuryApi } from '@/app/hooks/useJuryApi';
import { useFormsApi } from '@/app/hooks/useFormsApi';
import AiScoreDetail from '@/app/components/ai-scoring/AiScoreDetail';
import AiScoreBadge from '@/app/components/ai-scoring/AiScoreBadge';
// ─── Constantes ────────────────────────────────────────────────
const SCORING_CRITERIA = [
  { id: 'team',       name: 'Equipe',           weight: 30, description: 'Experience, competences, complementarite' },
  { id: 'innovation', name: 'Innovation',        weight: 25, description: 'Originalite, avantage concurrentiel' },
  { id: 'market',     name: 'Marche',            weight: 20, description: 'Taille du marche, potentiel de croissance' },
  { id: 'business',   name: 'Modele economique', weight: 15, description: 'Viabilite financiere, marges' },
  { id: 'traction',   name: 'Traction',          weight: 10, description: 'Preuves marche, premiers clients' },
];

const KANBAN_COLUMNS = [
  { id:'received',    label:'Reçue',          statuses:['submitted','pending'],            color:'#6366f1', bg:'bg-indigo-50 dark:bg-indigo-950/30',   border:'border-indigo-200 dark:border-indigo-800',   header:'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
  { id:'preselected', label:'Présélectionnée', statuses:['reviewing'],                      color:'#f59e0b', bg:'bg-amber-50 dark:bg-amber-950/30',     border:'border-amber-200 dark:border-amber-800',     header:'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  { id:'interview',   label:'Entretien',       statuses:['interview'],                      color:'#8b5cf6', bg:'bg-purple-50 dark:bg-purple-950/30',   border:'border-purple-200 dark:border-purple-800',   header:'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  { id:'decision',    label:'Décision',        statuses:['approved','rejected','accepted'], color:'#10b981', bg:'bg-emerald-50 dark:bg-emerald-950/30', border:'border-emerald-200 dark:border-emerald-800', header:'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
];
const COLUMN_DEFAULT_STATUS = { received:'pending', preselected:'reviewing', interview:'interview', decision:'approved' };

const STATUS_TIMELINE = [
  { status:'submitted', label:'Soumise',     color:'#6366f1' },
  { status:'pending',   label:'En attente',  color:'#f59e0b' },
  { status:'reviewing', label:'En révision', color:'#3b82f6' },
  { status:'interview', label:'Entretien',   color:'#8b5cf6' },
  { status:'approved',  label:'Acceptée',    color:'#10b981' },
];
const STATUS_ORDER = ['submitted','pending','reviewing','interview','approved'];

// ─── Normaliser _id → id (fix MongoDB) ────────────────────────
const normalize = (arr) =>
  (arr || []).map(item => ({
    ...item,
    id: item.id ?? item._id?.toString() ?? item._id,
  }));

function getEmailTemplate(app, status) {
  const templates = {
    reviewing: { subject:`Votre candidature ${app.startupName} est en cours d'analyse`,    body:`Bonjour ${app.founder},\n\nNous avons bien reçu votre candidature.\nVotre dossier est actuellement en cours d'analyse.\n\nCordialement,\nL'équipe MEDIANET` },
    interview: { subject:`Félicitations — Entretien programme pour ${app.startupName}`,     body:`Bonjour ${app.founder},\n\nVotre startup ${app.startupName} est sélectionnée pour un entretien.\n\nCordialement,\nL'équipe MEDIANET` },
    approved:  { subject:`Candidature acceptée — ${app.startupName} rejoint MEDIANET`,      body:`Bonjour ${app.founder},\n\nVotre candidature est ACCEPTÉE dans le programme MEDIANET Accelerator.\n\nBienvenue !\n\nCordialement,\nL'équipe MEDIANET` },
    rejected:  { subject:`Résultat de votre candidature — ${app.startupName}`,              body:`Bonjour ${app.founder},\n\nAprès étude attentive, nous ne pouvons pas retenir votre dossier pour cette édition.\n\nCordialement,\nL'équipe MEDIANET` },
  };
  return templates[status] || { subject:`Mise à jour — ${app.startupName}`, body:`Bonjour ${app.founder},\n\nVotre candidature a été mise à jour.\n\nCordialement,\nL'équipe MEDIANET` };
}

// ─── Icons ─────────────────────────────────────────────────────
const Icons = {
  applications: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  pending:  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  reviewing:<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  score:    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
  search:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  filter:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>,
  close:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  document: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
  time:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  form:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  list:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
  kanban:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>,
  programme:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
  spontaneous:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  mail:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  timeline: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  arrowRight:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>,
  check:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>,
  star:     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  refresh:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
};

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function AdminApplicationsPage() {
  const router = useRouter();
  const { user, accessToken } = useSelector(state => state.auth);
  const { t } = useTranslation();
  const appsApi  = useApplicationsApi();
  const juryApi  = useJuryApi();
  const formsApi = useFormsApi();

  const [mounted, setMounted]             = useState(false);
  const [time, setTime]                   = useState(new Date());
  const [applications, setApplications]   = useState([]);
  const [juryList, setJuryList]           = useState([]);
  const [assignedForms, setAssignedForms] = useState([]);
  const [allProgrammes, setAllProgrammes] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedApp, setSelectedApp]     = useState(null);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [alert, setAlert]                 = useState({ show:false, type:'', message:'' });

  const [searchTerm, setSearchTerm]           = useState('');
  const [filterStatus, setFilterStatus]       = useState('all');
  const [filterSector, setFilterSector]       = useState('all');
  const [filterProgramme, setFilterProgramme] = useState('all');
  const [showFilters, setShowFilters]         = useState(false);
  const [viewMode, setViewMode]               = useState('list');
  const [candidatureTab, setCandidatureTab]   = useState('all');

  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyApp, setNotifyApp]     = useState(null);
  const [notifyEmail, setNotifyEmail] = useState({ subject:'', body:'' });
  const [notifySending, setNotifySending] = useState(false);

  const [stats, setStats] = useState({ total:0, submitted:0, pending:0, reviewing:0, interview:0, accepted:0, averageScore:0 });

  const dragAppId   = useRef(null);
  const dragOverCol = useRef(null);

  // ── Charger données ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [appsRes, statsRes, juryRes, formsRes] = await Promise.all([
        appsApi.fetchAll({ limit: 100 }),
        appsApi.fetchStats(),
        juryApi.fetchAll(),
        formsApi.fetchAll(),
      ]);

      // ✅ FIX PRINCIPAL : normalize() mappe _id → id pour tous les tableaux
      // Cela évite que app.id / juror.id soient undefined dans les appels API
      setApplications(normalize(appsRes.applications));
      setStats(statsRes || {});
      setJuryList(normalize(juryRes.jury));
      setAssignedForms(normalize(formsRes.forms));

      try {
        const saved = localStorage.getItem('admin_programmes');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) setAllProgrammes(list);
        }
      } catch (_) {}
    } catch (err) {
      console.error('[loadData]', err);
      showNotification('error', 'Erreur de chargement des candidatures');
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    loadData();
    return () => clearInterval(timer);
  }, [loadData]);

  const showNotification = (type, message) => {
    setAlert({ show:true, type, message });
    setTimeout(() => setAlert({ show:false, type:'', message:'' }), 3000);
  };

  const calculateTotalScore = (scores) =>
    Math.round(SCORING_CRITERIA.reduce((total, c) => total + (scores[c.id] || 0) * (c.weight / 100), 0));

  // ── Actions backend ───────────────────────────────────────────
  const updateApplicationScores = async (appId, newScores, newRemarks) => {
    if (!appId) { showNotification('error', 'ID candidature manquant'); return; }
    const totalScore = calculateTotalScore(newScores);
    try {
      await appsApi.updateScores(appId, newScores, newRemarks, totalScore);
      setApplications(prev => prev.map(a =>
        a.id === appId ? { ...a, detailedScores: newScores, adminRemarks: newRemarks || {}, totalScore } : a
      ));
      showNotification('success', 'Scores sauvegardés');
    } catch {
      showNotification('error', 'Erreur sauvegarde scores');
    }
  };

  const handleStatusChange = async (appId, newStatus, decisionRemark) => {
    if (!appId) { showNotification('error', 'ID candidature manquant'); return; }
    const app = applications.find(a => a.id === appId);
    try {
      await appsApi.updateStatus(appId, newStatus, decisionRemark);

      const newHistory = [...(app?.statusHistory || []), {
        status: newStatus, date: new Date().toISOString(), by: user?.name || 'Admin',
      }];
      setApplications(prev => prev.map(a =>
        a.id === appId ? { ...a, status: newStatus, lastUpdated: new Date().toISOString(), statusHistory: newHistory, adminDecisionRemark: decisionRemark || a.adminDecisionRemark } : a
      ));
      setIsModalOpen(false);

      if (['reviewing','interview','approved','rejected'].includes(newStatus)) {
        const updatedApp = { ...(app||{}), status: newStatus };
        const template   = getEmailTemplate(updatedApp, newStatus);
        setNotifyApp(updatedApp);
        setNotifyEmail(template);
        setTimeout(() => setIsNotifyModalOpen(true), 400);
      } else {
        showNotification('success', 'Statut mis à jour');
      }
    } catch {
      showNotification('error', 'Erreur mise à jour statut');
    }
  };

  const handleJuryAssign = async (appId, juryIds) => {
    // ✅ Guard : évite l'appel à /undefined/jury
    if (!appId) {
      showNotification('error', 'ID candidature manquant — impossible d\'assigner le jury');
      return;
    }
    try {
      const juryNames = juryList
        .filter(j => juryIds.includes(j.id))
        .map(j => j.name);
      await appsApi.assignJury(appId, juryIds, juryNames);
      setApplications(prev => prev.map(a =>
        a.id === appId ? { ...a, juryIds, juryAssigned: juryNames } : a
      ));
      showNotification('success', 'Jury assigné');
    } catch {
      showNotification('error', 'Erreur assignation jury');
    }
  };

  const handleOpenNotify = (app) => {
    const template = getEmailTemplate(app, app.status);
    setNotifyApp(app);
    setNotifyEmail(template);
    setIsNotifyModalOpen(true);
  };

  const handleSendNotification = async () => {
    setNotifySending(true);
    try {
      await appsApi.markNotified(notifyApp.id);
      setApplications(prev => prev.map(a =>
        a.id === notifyApp.id ? { ...a, notified: true } : a
      ));
      showNotification('success', `Email envoyé à ${notifyApp.email}`);
    } catch {
      showNotification('error', 'Erreur envoi notification');
    } finally {
      setNotifySending(false);
      setIsNotifyModalOpen(false);
    }
  };

  // ── Kanban drag ───────────────────────────────────────────────
  const handleDragStart = (e, appId) => { dragAppId.current = appId; };
  const handleDragOver  = (e, colId) => { e.preventDefault(); dragOverCol.current = colId; };
  const handleDrop      = async (e, colId) => {
    e.preventDefault();
    const appId     = dragAppId.current;
    const newStatus = COLUMN_DEFAULT_STATUS[colId];
    if (appId && newStatus) await handleStatusChange(appId, newStatus, '');
    dragAppId.current = null;
  };

  // ── Helpers UI ────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const variants = { submitted:'info', pending:'warning', reviewing:'info', interview:'accent', approved:'success', accepted:'success', rejected:'error' };
    const labels   = { submitted:'Soumise', pending:'En attente', reviewing:'En révision', interview:'Entretien', approved:'Acceptée', accepted:'Acceptée', rejected:'Rejetée' };
    return <Badge variant={variants[status]||'gray'}>{labels[status]}</Badge>;
  };

  const getScoreColor = (score) =>
    score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 60 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  const sectors = ['all', ...new Set(applications.map(a => a.sector).filter(Boolean))];

  const filteredApplications = applications.filter(app => {
    const matchSearch = [app.startupName, app.founder, app.sector].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchSector = filterSector === 'all' || app.sector === filterSector;
    const matchProg   = filterProgramme === 'all' || app.programmeName === filterProgramme;
    const matchTab    = candidatureTab === 'all' ? true
      : candidatureTab === 'spontaneous' ? (app.type === 'spontaneous' || !app.programmeName)
      : (app.type === 'programme' || !!app.programmeName);
    return matchSearch && matchStatus && matchSector && matchProg && matchTab;
  });

  const sectorGradient = (sector) => ({
    FinTech:['#00526e','#006d94'], HealthTech:['#0088ba','#00a3e0'],
    AgriTech:['#2ccc7d','#27b870'], EdTech:['#ffbf00','#f5b800'], CleanTech:['#ff0080','#e60073'],
  }[sector] || ['#6366f1','#4f46e5']);

  const getProgramme = (name) =>
    name ? (allProgrammes.find(p => p.titre === name) || { titre: name, color:'#006d94' }) : null;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @keyframes slideInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scaleIn   { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          .animate-slide-in-up { animation:slideInUp 0.5s ease-out forwards; }
          .animate-scale-in    { animation:scaleIn 0.4s ease-out forwards; }
          .glass-card { background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border:1px solid rgba(0,0,0,0.05); }
          :global(.dark) .glass-card { background:#1e293b;border:1px solid #334155; }
          .dark-glass { background:linear-gradient(135deg,rgba(0,82,110,0.95),rgba(0,109,148,0.95));backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1); }
          .stat-card { position:relative;overflow:hidden;transition:all 0.3s ease; }
          .stat-card:hover { transform:translateY(-4px); }
          .particle { position:absolute;width:4px;height:4px;background:rgba(255,255,255,0.4);border-radius:50%;animation:float 6s ease-in-out infinite; }
          .application-card { transition:all 0.3s ease; }
          .application-card:hover { transform:translateY(-4px);box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); }
          .kanban-col { min-height:300px; }
          .kanban-card { cursor:grab;transition:all 0.2s; }
          .kanban-card:active { cursor:grabbing;opacity:0.7; }
          .kanban-card:hover { transform:translateY(-2px); }
          .mono { font-family:'JetBrains Mono',monospace; }
          .score-input::-webkit-outer-spin-button,.score-input::-webkit-inner-spin-button{-webkit-appearance:none}
          .score-input[type=number]{-moz-appearance:textfield}
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* HEADER */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up"
            style={{ background:'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="particle" style={{ top:'10%',left:'15%' }}></div>
            <div className="particle" style={{ top:'60%',left:'80%',animationDelay:'1s' }}></div>
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90">CANDIDATURES</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/80">Backend connecté</span>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Gestion des Candidatures</h1>
                <p className="text-blue-100 text-base">MEDIANET Accelerator Program — Tunisia & Africa</p>
                <div className="flex items-center gap-4 text-blue-100 mt-4 text-sm">
                  <span className="mono">{mounted && time.toLocaleTimeString('fr-FR')}</span>
                  <span className="w-px h-3 bg-blue-400/30"></span>
                  <span>{mounted && time.toLocaleDateString('fr-FR', { weekday:'long', month:'short', day:'numeric' })}</span>
                </div>
              </div>
              <div className="dark-glass rounded-xl p-4 min-w-[240px]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user?.name || 'Admin'}</p>
                    <p className="text-blue-200 text-xs mono">PROGRAM ADMIN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label:'Total',       value:stats.total,          color:'from-blue-500 to-blue-600',     text:'text-gray-900 dark:text-white',          icon:Icons.applications },
              { label:'Soumises',    value:stats.submitted||0,   color:'from-blue-400 to-cyan-400',     text:'text-blue-600 dark:text-blue-400',       icon:Icons.document },
              { label:'En attente',  value:stats.pending,        color:'from-amber-500 to-orange-500',  text:'text-amber-600 dark:text-amber-400',     icon:Icons.pending },
              { label:'En révision', value:stats.reviewing,      color:'from-blue-500 to-cyan-500',     text:'text-blue-600 dark:text-blue-400',       icon:Icons.reviewing },
              { label:'Entretien',   value:stats.interview||0,   color:'from-purple-500 to-pink-500',   text:'text-purple-600 dark:text-purple-400',   icon:Icons.timeline },
              { label:'Score moyen', value:stats.averageScore||0,color:'from-emerald-500 to-green-500', text:'text-emerald-600 dark:text-emerald-400', suffix:'/100', icon:Icons.score },
            ].map((stat, i) => (
              <div key={i} className="stat-card glass-card rounded-xl p-5 animate-scale-in dark:!bg-[#1e293b]">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>{stat.icon}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.text}`}>
                  {stat.value}{stat.suffix && <span className="text-sm text-gray-400 ml-0.5">{stat.suffix}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* ALERT */}
          {alert.show && (
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ show:false, type:'', message:'' })} />
          )}

          {/* TABS */}
          <div className="glass-card rounded-xl dark:!bg-[#1e293b] overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id:'all',         label:'Toutes',        icon:Icons.applications, count:applications.length },
                { id:'spontaneous', label:'Spontanées',    icon:Icons.spontaneous,  count:applications.filter(a => a.type==='spontaneous'||!a.programmeName).length },
                { id:'programme',   label:'Par programme', icon:Icons.programme,    count:applications.filter(a => a.type==='programme'||!!a.programmeName).length },
              ].map(tab => (
                <button key={tab.id} onClick={() => { setCandidatureTab(tab.id); setFilterProgramme('all'); }}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${candidatureTab===tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {tab.icon}{tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${candidatureTab===tab.id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
            {candidatureTab === 'programme' && allProgrammes.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 dark:bg-[#0f172a] border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Programme :</span>
                {[{ titre:'Tous', id:'all' }, ...allProgrammes].map(prog => (
                  <button key={prog.id||prog.titre} onClick={() => setFilterProgramme(prog.id === 'all' ? 'all' : prog.titre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterProgramme===(prog.id==='all'?'all':prog.titre) ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
                    {prog.titre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ACTION BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2">
                {Icons.filter} Filtres
              </button>
              <button onClick={loadData}
                className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50">
                {Icons.refresh} Actualiser
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">{filteredApplications.length} candidatures</div>
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
                {[{ id:'list', icon:Icons.list, label:'Liste' }, { id:'kanban', icon:Icons.kanban, label:'Kanban' }].map(v => (
                  <button key={v.id} onClick={() => setViewMode(v.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode===v.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
              <button onClick={() => router.push('/dashboard/admin/forms')}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg flex items-center gap-2">
                {Icons.form}<span className="hidden sm:inline">Formulaires</span>
              </button>
            </div>
          </div>

          {/* SEARCH + FILTERS */}
          <div className="glass-card rounded-xl p-5 dark:!bg-[#1e293b]">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
                <input type="text" placeholder="Rechercher startup, fondateur, secteur..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              {showFilters && (
                <div className="flex gap-3 flex-wrap">
                  {[
                    { value:filterStatus, onChange:e=>setFilterStatus(e.target.value), opts:[
                      <option key="all" value="all">Tous les statuts</option>,
                      <option key="submitted" value="submitted">Soumise</option>,
                      <option key="pending" value="pending">En attente</option>,
                      <option key="reviewing" value="reviewing">En révision</option>,
                      <option key="interview" value="interview">Entretien</option>,
                      <option key="approved" value="approved">Acceptée</option>,
                      <option key="rejected" value="rejected">Rejetée</option>,
                    ]},
                    { value:filterSector, onChange:e=>setFilterSector(e.target.value), opts:[
                      <option key="all" value="all">Tous les secteurs</option>,
                      ...sectors.filter(s=>s!=='all').map(s=><option key={s} value={s}>{s}</option>),
                    ]},
                  ].map(({ value, onChange, opts }, i) => (
                    <select key={i} value={value} onChange={onChange}
                      className="px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none font-medium min-w-[140px]">
                      {opts}
                    </select>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card rounded-xl p-5 animate-pulse dark:!bg-[#1e293b]">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      <div className="flex-1"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div></div>
                    </div>
                  </div>
                ))
              ) : filteredApplications.length === 0 ? (
                <div className="col-span-full glass-card rounded-xl p-12 text-center dark:!bg-[#1e293b]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucune candidature trouvée</h3>
                  <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterSector('all'); }}
                    className="mt-4 px-4 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg">Effacer les filtres</button>
                </div>
              ) : filteredApplications.map((app, index) => (
                <ApplicationCard key={app.id} app={app} index={index}
                  sectorGradient={sectorGradient} getStatusBadge={getStatusBadge}
                  getScoreColor={getScoreColor} getProgramme={getProgramme}
                  setSelectedApp={setSelectedApp} setIsModalOpen={setIsModalOpen}
                  onNotify={handleOpenNotify} />
              ))}
            </div>
          )}

          {/* KANBAN VIEW */}
          {viewMode === 'kanban' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {KANBAN_COLUMNS.map(col => {
                  const colApps = filteredApplications.filter(a => col.statuses.includes(a.status));
                  return (
                    <div key={col.id}
                      className={`kanban-col w-72 flex-shrink-0 rounded-xl border ${col.border} ${col.bg} flex flex-col`}
                      onDragOver={e => handleDragOver(e, col.id)}
                      onDrop={e => handleDrop(e, col.id)}>
                      <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${col.header}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }}></div>
                          <span className="font-semibold text-sm">{col.label}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20">{colApps.length}</span>
                      </div>
                      <div className="flex flex-col gap-3 p-3 flex-1">
                        {colApps.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs text-center gap-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            Déposer ici
                          </div>
                        ) : colApps.map(app => (
                          <KanbanCard key={app.id} app={app}
                            sectorGradient={sectorGradient} getScoreColor={getScoreColor} getProgramme={getProgramme}
                            setSelectedApp={setSelectedApp} setIsModalOpen={setIsModalOpen}
                            onDragStart={handleDragStart} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">Glissez-déposez pour changer le statut</p>
            </div>
          )}

          {/* MODALS */}
          {selectedApp && (
            <ApplicationReviewModal
              isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
              application={selectedApp}
              onStatusChange={handleStatusChange}
              onScoreUpdate={updateApplicationScores}
              onJuryAssign={handleJuryAssign}
              onNotify={handleOpenNotify}
              assignedForms={assignedForms}
              getProgramme={getProgramme}
              router={router}
              juryList={juryList}
            />
          )}

          {isNotifyModalOpen && notifyApp && (
            <NotifyModal
              isOpen={isNotifyModalOpen} onClose={() => setIsNotifyModalOpen(false)}
              app={notifyApp} email={notifyEmail} setEmail={setNotifyEmail}
              onSend={handleSendNotification} sending={notifySending}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Application Card (CORRIGÉE) ─────────────────────────────────────────
function ApplicationCard({ app, index, sectorGradient, getStatusBadge, getScoreColor, getProgramme, setSelectedApp, setIsModalOpen, onNotify }) {
  const [gradFrom, gradTo] = sectorGradient(app.sector);
  const programme = getProgramme(app.programmeName);
  
  return (
    <div className="application-card glass-card rounded-xl overflow-hidden animate-scale-in dark:!bg-[#1e293b] cursor-pointer group"
      style={{ animationDelay:`${index * 0.05}s` }}
      onClick={() => { setSelectedApp(app); setIsModalOpen(true); }}>
      <div className="h-1.5 w-full" style={{ background:`linear-gradient(90deg,${gradFrom},${gradTo})` }}></div>
      <div className="p-5">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
            style={{ background:`linear-gradient(135deg,${gradFrom},${gradTo})` }}>
            {(app.startupName||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{app.startupName}</h3>
              {getStatusBadge(app.status)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{app.founder}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-600 dark:text-gray-400">{app.sector}</span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-600 dark:text-gray-400">{app.stage}</span>
              {programme ? (
                <span className="px-2 py-0.5 rounded-md text-xs font-medium text-white" style={{ background: programme.color || '#006d94' }}>{programme.titre?.replace('Programme ','')}</span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-xs bg-gray-200 dark:bg-gray-700 text-gray-500">Spontanée</span>
              )}
            </div>
          </div>
        </div>

        {/* ✅ GRILLE CORRIGÉE - 3 COLONNES */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">Montant</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{app.amount || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">Lieu</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {(app.location||'').split(',')[0] || 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">Score IA</p>
            <AiScoreBadge applicationId={app.id} />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 mb-3">
          {SCORING_CRITERIA.map(c => (
            <div key={c.id} className="text-center">
              <div className="text-[10px] text-gray-400 mb-1">{{team:'Éq',innovation:'Inn',market:'Mar',business:'Mod',traction:'Tra'}[c.id]}</div>
              <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${(app.detailedScores?.[c.id]||0)>=80?'bg-emerald-500':(app.detailedScores?.[c.id]||0)>=60?'bg-amber-500':'bg-red-500'}`}
                  style={{ width:`${app.detailedScores?.[c.id]||0}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{app.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('fr-FR', { month:'short', day:'numeric' }) : 'N/A'}
            </span>
            {app.notified ? (
              <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Notifié
              </span>
            ) : (
              <button onClick={e => { e.stopPropagation(); onNotify(app); }}
                className="flex items-center gap-1 text-amber-500 hover:text-amber-700 font-semibold">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                Notifier
              </button>
            )}
          </div>
          <button className="text-xs font-medium text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 flex items-center gap-1"
            onClick={e => { e.stopPropagation(); setSelectedApp(app); setIsModalOpen(true); }}>
            Évaluer <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────
function KanbanCard({ app, sectorGradient, getScoreColor, getProgramme, setSelectedApp, setIsModalOpen, onDragStart }) {
  const [gradFrom, gradTo] = sectorGradient(app.sector);
  const programme = getProgramme(app.programmeName);
  return (
    <div draggable onDragStart={e => onDragStart(e, app.id)}
      className="kanban-card glass-card rounded-xl overflow-hidden dark:!bg-[#1e293b]"
      onClick={() => { setSelectedApp(app); setIsModalOpen(true); }}>
      <div className="h-1" style={{ background:`linear-gradient(90deg,${gradFrom},${gradTo})` }}></div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ background:`linear-gradient(135deg,${gradFrom},${gradTo})` }}>
            {(app.startupName||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{app.startupName}</p>
            <p className="text-xs text-gray-500 truncate">{app.founder}</p>
          </div>
        </div>
        {programme ? (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium text-white mb-2" style={{ background: programme.color||'#006d94' }}>
            {programme.titre?.replace('Programme ','')}
          </span>
        ) : <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 mb-2">Spontanée</span>}
        <div className="flex items-center justify-between text-xs">
          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">{app.sector}</span>
          <span className={`font-bold ${getScoreColor(app.totalScore)}`}>{app.totalScore}/100</span>
        </div>
        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
          <div className={`h-full rounded-full ${app.totalScore>=80?'bg-emerald-500':app.totalScore>=60?'bg-amber-500':'bg-red-500'}`}
            style={{ width:`${app.totalScore}%` }}></div>
        </div>
      </div>
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────
function ScoreQualification({ score }) {
  if (score >= 80) return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Excellent</span>;
  if (score >= 60) return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Bon</span>;
  if (score >= 40) return <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Moyen</span>;
  return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Faible</span>;
}

// ─── Status Timeline ──────────────────────────────────────────
function StatusTimeline({ application }) {
  const currentIdx = STATUS_ORDER.indexOf(application.status);
  const isRejected = application.status === 'rejected';
  return (
    <div className="relative pt-2">
      <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
      <div className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500"
        style={{ width: isRejected ? '0%' : `${Math.min((currentIdx/(STATUS_ORDER.length-1))*100,100)}%` }}></div>
      <div className="relative flex justify-between px-2">
        {STATUS_TIMELINE.map((step, i) => {
          const stepIdx   = STATUS_ORDER.indexOf(step.status);
          const isDone    = !isRejected && currentIdx >= stepIdx;
          const isCurrent = !isRejected && currentIdx === stepIdx;
          const hist      = application.statusHistory?.find(h => h.status === step.status);
          return (
            <div key={step.status} className="flex flex-col items-center gap-1.5" style={{ minWidth:64 }}>
              <div className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${isDone?'border-emerald-500 bg-white dark:bg-gray-900':'border-gray-300 bg-gray-100 dark:bg-gray-800'} ${isCurrent?'ring-4 ring-emerald-200':''}`}>
                {isDone
                  ? <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  : <div className="w-2 h-2 rounded-full bg-gray-300"></div>}
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight ${isDone?'text-emerald-600 dark:text-emerald-400':'text-gray-400'}`}>{step.label}</span>
              {hist && <span className="text-[9px] text-gray-400">{new Date(hist.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>}
            </div>
          );
        })}
        {isRejected && (
          <div className="flex flex-col items-center gap-1.5" style={{ minWidth:64 }}>
            <div className="w-8 h-8 rounded-full border-2 border-red-500 bg-white dark:bg-gray-900 flex items-center justify-center z-10">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <span className="text-[10px] font-semibold text-red-500 text-center">Rejetée</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notify Modal ─────────────────────────────────────────────
function NotifyModal({ isOpen, onClose, app, email, setEmail, onSend, sending }) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Notifier — ${app.startupName}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{app.founder}</p>
            <p className="text-xs text-emerald-700 font-mono">{app.email}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Objet</label>
          <input type="text" value={email.subject} onChange={e => setEmail(p=>({...p,subject:e.target.value}))}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</label>
          <textarea value={email.body} onChange={e => setEmail(p=>({...p,body:e.target.value}))} rows={8}
            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none font-mono" />
        </div>
        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50">Annuler</button>
          <button onClick={onSend} disabled={sending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
            {sending
              ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi...</>
              : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>Envoyer</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Review Modal ─────────────────────────────────────────────
function ApplicationReviewModal({ isOpen, onClose, application, onStatusChange, onScoreUpdate, onJuryAssign, onNotify, assignedForms, getProgramme, router, juryList }) {
  const [scores, setScores]             = useState({ ...application.detailedScores });
  const [adminRemarks, setAdminRemarks] = useState({ ...application.adminRemarks });
  const [loading, setLoading]           = useState(false);
  const [activeTab, setActiveTab]       = useState('evaluation');
  const [juryIds, setJuryIds]           = useState(application.juryIds || []);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [pendingDecision, setPendingDecision]     = useState(null);
  const [decisionRemark, setDecisionRemark]       = useState(application.adminDecisionRemark || '');

  const totalScore = Math.round(SCORING_CRITERIA.reduce((t,c) => t + (scores[c.id]||0)*(c.weight/100), 0));
  const programme  = getProgramme(application.programmeName);

  const getScoreColor = (s) => s>=80?'text-emerald-600 dark:text-emerald-400':s>=60?'text-amber-600 dark:text-amber-400':s>=40?'text-orange-600 dark:text-orange-400':'text-red-600 dark:text-red-400';
  const getScoreBg    = (s) => s>=80?'bg-emerald-100 dark:bg-emerald-900/30':s>=60?'bg-amber-100 dark:bg-amber-900/30':'bg-red-100 dark:bg-red-900/30';

  const handleSaveScores = async () => {
    setLoading(true);
    await onScoreUpdate(application.id, scores, adminRemarks);
    setLoading(false);
  };

  const handleDecisionClick = (status) => {
    setPendingDecision(status);
    setDecisionRemark(application.adminDecisionRemark || '');
    setShowDecisionModal(true);
  };

  const handleConfirmDecision = async () => {
    if (!decisionRemark.trim()) return;
    setLoading(true);
    await onStatusChange(application.id, pendingDecision, decisionRemark);
    setShowDecisionModal(false);
    setLoading(false);
  };

  const handleJurySave = async () => {
    await onJuryAssign(application.id, juryIds);
  };

  const TABS = [
    { id:'evaluation', label:'Évaluation admin' },
    { id:'jury',       label:'Jury' },
    { id:'forms',      label:'Formulaires' },
    { id:'details',    label:'Détails' },
    { id:'timeline',   label:'Timeline' },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Dossier : ${application.startupName}`} size="xl">
        {/* Band programme + notif */}
        <div className="flex items-center justify-between gap-2 mb-4 -mt-2 flex-wrap">
          <div className="flex items-center gap-2">
            {programme
              ? <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: programme.color||'#006d94' }}>{programme.titre}</span>
              : <span className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500">Candidature spontanée</span>}
          </div>
          <button onClick={() => { onClose(); setTimeout(() => onNotify(application), 200); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${application.notified ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            {application.notified ? 'Candidat notifié' : 'Notifier le candidat'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab===tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">

          {/* ── Évaluation ── */}
          {activeTab === 'evaluation' && (
            <>
            <AiScoreDetail applicationId={application.id} />
              <div className="flex items-center justify-between">
                <div className={`inline-flex flex-col items-center px-6 py-3 rounded-xl ${getScoreBg(totalScore)}`}>
                  <span className="text-xs text-gray-500 mb-1">Score total calculé</span>
                  <span className={`text-3xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}<span className="text-sm text-gray-400 ml-0.5">/100</span></span>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {SCORING_CRITERIA.map(c => <p key={c.id}>{c.name} ({c.weight}%) → {Math.round((scores[c.id]||0)*c.weight/100)} pts</p>)}
                </div>
              </div>

              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                {SCORING_CRITERIA.map(c => (
                  <div key={c.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{c.name}</span>
                        <span className="text-xs text-gray-400">({c.weight}%)</span>
                        <ScoreQualification score={scores[c.id]||0} />
                      </div>
                      <span className={`text-xl font-bold mono ${getScoreColor(scores[c.id]||0)}`}>{scores[c.id]||0}/100</span>
                    </div>
                    <p className="text-xs text-gray-500 italic mb-3">{c.description}</p>
                    <div className="flex items-center gap-3 mb-3">
                      <input type="number" min="0" max="100" value={scores[c.id]||0}
                        onChange={e => setScores(p=>({...p,[c.id]:Math.max(0,Math.min(100,parseInt(e.target.value)||0))}))}
                        className="score-input w-16 px-2 py-1.5 text-sm font-bold text-center border border-gray-200 dark:border-gray-600 dark:bg-[#0f172a] dark:text-white rounded-lg focus:outline-none" />
                      <input type="range" min="0" max="100" value={scores[c.id]||0}
                        onChange={e => setScores(p=>({...p,[c.id]:parseInt(e.target.value)}))}
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                        style={{ background:`linear-gradient(90deg,${(scores[c.id]||0)>=80?'#10b981':(scores[c.id]||0)>=60?'#f59e0b':'#ef4444'} ${scores[c.id]||0}%,#e5e7eb ${scores[c.id]||0}%)` }} />
                    </div>
                    <textarea value={adminRemarks[c.id]||''} onChange={e => setAdminRemarks(p=>({...p,[c.id]:e.target.value}))}
                      rows={2} placeholder={`Remarque sur ${c.name}...`}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 dark:bg-[#0f172a] dark:text-white rounded-lg focus:outline-none resize-none" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveScores} disabled={loading}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  {loading ? 'Sauvegarde...' : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> Sauvegarder scores</>}
                </button>
              </div>
            </>
          )}

          {/* ── Jury ── */}
          {activeTab === 'jury' && (
            <div className="space-y-5">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assigner un jury à cette candidature</h4>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                {juryList.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun jury disponible — ajoutez-en depuis la page Jurys.</p>
                ) : juryList.map(juror => {
                  // ✅ juror.id est garanti par normalize() dans loadData
                  const jId = juror.id;
                  const isSelected = juryIds.includes(jId);
                  return (
                    <div key={jId} onClick={() => setJuryIds(prev => isSelected ? prev.filter(id=>id!==jId) : [...prev,jId])}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${isSelected?'border-primary-500 bg-primary-50 dark:bg-primary-900/10':'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${isSelected?'bg-primary-600':'bg-gradient-to-br from-indigo-400 to-purple-500'}`}>
                        {(juror.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{juror.name}</p>
                        <p className="text-xs text-gray-500">{(juror.expertise||[]).slice(0,2).join(', ')}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected?'border-primary-500 bg-primary-500':'border-gray-300'}`}>
                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={handleJurySave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                Enregistrer l'assignation
              </button>
              {(application.juryAssigned||[]).length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Jury actuellement assigné :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(application.juryAssigned||[]).map(name => (
                      <span key={name} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">{name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Formulaires ── */}
          {activeTab === 'forms' && (
            <div className="space-y-4">
              {assignedForms.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">Aucun formulaire assigné à cette candidature</p>
                </div>
              ) : assignedForms.map(form => (
                <div key={form.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{form.title}</span>
                    <span className="text-xs text-gray-400">{form.fields || form.questions?.length || 0} questions</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(form.questions || []).map((q, qi) => {
                      const answer = application.formResponses?.[q.id] || application.formResponses?.[q.label];
                      return (
                        <div key={q.id || qi} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-[10px] font-bold flex-shrink-0 mt-0.5">{qi+1}</div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{q.label}</p>
                              {answer
                                ? <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">{answer}</p>
                                : <p className="text-sm text-amber-600 italic px-3 py-2 rounded-lg border border-amber-100 bg-amber-50">Aucune réponse disponible</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Détails ── */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Fondateur',    value:application.founder },
                  { label:'Email',        value:application.email },
                  { label:'Stade',        value:application.stage },
                  { label:'Montant',      value:application.amount },
                  { label:'Secteur',      value:application.sector },
                  { label:'Localisation', value:application.location },
                ].map((item,i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{item.value||'N/A'}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">{application.description||'N/A'}</p>
              </div>
              {application.aiSummary && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Analyse AI</p>
                  <p className="text-sm bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">{application.aiSummary}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Timeline ── */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <StatusTimeline application={application} />
              </div>
              {application.adminDecisionRemark && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Décision admin — justification</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{application.adminDecisionRemark}</p>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Historique</h4>
                <div className="space-y-2">
                  {(application.statusHistory||[]).slice().reverse().map((entry,i) => {
                    const step = STATUS_TIMELINE.find(s=>s.status===entry.status);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:(step?.color||'#6366f1')+'20' }}>
                          <div className="w-3 h-3 rounded-full" style={{ background:step?.color||'#6366f1' }}></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{step?.label||entry.status}</p>
                          <p className="text-xs text-gray-500">Par {entry.by}</p>
                        </div>
                        <span className="text-xs text-gray-400 mono">{entry.date ? new Date(entry.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}) : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => handleDecisionClick('rejected')} disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 disabled:opacity-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>Rejeter
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50">Fermer</button>
              <button onClick={() => handleDecisionClick('reviewing')} disabled={loading}
                className="px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50">En révision</button>
              <button onClick={() => handleDecisionClick('interview')} disabled={loading}
                className="px-4 py-2.5 text-sm text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-50">Entretien</button>
              <button onClick={() => handleDecisionClick('approved')} disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> Accepter
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Decision confirmation Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className={`flex items-center gap-3 mb-5 p-4 rounded-xl ${pendingDecision==='approved'?'bg-emerald-50 border border-emerald-200':pendingDecision==='rejected'?'bg-red-50 border border-red-200':'bg-blue-50 border border-blue-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pendingDecision==='approved'?'bg-emerald-100 text-emerald-600':pendingDecision==='rejected'?'bg-red-100 text-red-600':'bg-blue-100 text-blue-600'}`}>
                {pendingDecision==='approved'
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  : pendingDecision==='rejected'
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {pendingDecision==='approved' ? "Confirmer l'acceptation"
                  : pendingDecision==='rejected' ? 'Confirmer le rejet'
                  : pendingDecision==='interview' ? 'Planifier un entretien'
                  : 'Passer en révision'}
                </p>
                <p className="text-xs text-gray-500">{application.startupName} — {application.founder}</p>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Justification <span className="text-red-500">*</span>
              </label>
              <textarea value={decisionRemark} onChange={e => setDecisionRemark(e.target.value)} rows={4}
                placeholder="Expliquez les raisons de cette décision..."
                className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-[#0f172a] dark:text-white resize-none ${!decisionRemark.trim()?'border-red-300':'border-gray-200 dark:border-gray-700'}`} />
              {!decisionRemark.trim() && <p className="text-xs text-red-500 mt-1">Une justification est obligatoire</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDecisionModal(false)}
                className="px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50">Annuler</button>
              <button onClick={handleConfirmDecision} disabled={!decisionRemark.trim()||loading}
                className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 disabled:opacity-50 ${pendingDecision==='approved'?'bg-gradient-to-r from-emerald-600 to-emerald-700':pendingDecision==='rejected'?'bg-gradient-to-r from-red-600 to-red-700':'bg-gradient-to-r from-primary-600 to-primary-700'}`}>
                {loading
                  ? 'Traitement...'
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Confirmer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}