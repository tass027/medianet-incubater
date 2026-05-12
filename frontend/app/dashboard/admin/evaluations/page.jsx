'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import { useEvaluationsApi } from '@/app/hooks/useEvaluationsApi';
import { useApplicationsApi } from '@/app/hooks/useApplicationsApi';
import axiosAuth from '@/app/lib/axiosAuth';

// ─── Constants ───────────────────────────────────────────────────────────────
const CRITERIA = [
  { id: 'team',       name: 'Équipe',      weight: 30, color: '#6366f1' },
  { id: 'innovation', name: 'Innovation',  weight: 25, color: '#0ea5e9' },
  { id: 'market',     name: 'Marché',      weight: 20, color: '#10b981' },
  { id: 'business',   name: 'Modèle Éco.', weight: 15, color: '#f59e0b' },
  { id: 'traction',   name: 'Traction',    weight: 10, color: '#ef4444' },
];

const SECTOR_COLORS = {
  FinTech:    '#0ea5e9', HealthTech: '#10b981', AgriTech: '#22c55e',
  EdTech:     '#f59e0b', CleanTech:  '#a855f7', Default:  '#64748b',
};
const sectorColor = (s) => SECTOR_COLORS[s] || SECTOR_COLORS.Default;

const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const scoreLabel = (s) => s >= 80 ? 'Excellent' : s >= 65 ? 'Bien' : s >= 50 ? 'Moyen' : 'Faible';
const scoreClr  = (s) => s >= 80 ? '#10b981' : s >= 65 ? '#f59e0b' : s >= 50 ? '#f97316' : '#ef4444';
const normalize = (arr) => (arr || []).map(i => ({ ...i, id: i.id ?? i._id?.toString() }));

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminEvaluationsPage() {
  const router   = useRouter();
  const { user } = useSelector(s => s.auth);
  const evalsApi = useEvaluationsApi();
  const appsApi  = useApplicationsApi();

  const [loading,       setLoading]       = useState(true);
  const [alert,         setAlert]         = useState({ show: false, type: '', message: '' });
  const [search,        setSearch]        = useState('');
  const [programGroups, setProgramGroups] = useState([]);   // [{programme, applications:[...]}]
  const [stats,         setStats]         = useState({});
  const [expandedProg,  setExpandedProg]  = useState({});   // {programmeId: bool}
  const [modalItem,     setModalItem]     = useState(null); // {type:'eval'|'remind', data}
  const [reminderSending, setReminderSending] = useState({});
  const [exportLoading, setExportLoading] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

// ─── REMPLACER la fonction loadData dans page.jsx (admin/evaluations) ────────
// Fixes :
// 1. Déduplication des programmes par NOM (pas par ID) pour éviter les doublons
// 2. Score affiché correctement (déjà converti côté backend)
// 3. Founder/sector affichés depuis les données enrichies

const loadData = useCallback(async () => {
  setLoading(true);
  try {
    const evalsRes = await evalsApi.fetchAll();

    const evals = normalize(evalsRes.evaluations || []).map(e => ({
      id:            e.id,
      startupName:   e.startupName   || 'N/A',
      founder:       e.founder       || 'N/A',
      email:         e.email         || '',
      sector:        e.sector        || 'N/A',
      stage:         e.stage         || '',
      programmeName: e.programmeName || null,
      // ✅ FIX : dédupliquer par nom de programme + ID comme fallback
      programmeId:   e.programmeId?.toString() || 'no_programme',
      // ✅ Clé de déduplication : nom du programme (normalise les doublons d'ID)
      progGroupKey:  (e.programmeName || 'Sans programme').trim().toLowerCase(),
      status:        e.status        || 'pending',
      submittedAt:   e.submittedAt   || e.createdAt,
      updatedAt:     e.updatedAt,
      jurorName:     e.juryName      || e.jurorName || 'Jury',
      jurorId:       e.juryId?.toString() || null,
      jurySubmitted: e.jurySubmitted ?? (e.status === 'submitted' || e.status === 'completed'),
      scores:        e.scores        || { team:0, innovation:0, market:0, business:0, traction:0 },
      // ✅ totalScore déjà converti /100 par le backend
      totalScore:    e.totalScore    || 0,
      feedback:      e.feedback      || e.globalRemark || '',
      applicationId: e.applicationId?.toString() || null,
    }));

    // ✅ FIX : grouper par NOM de programme (pour éviter les doublons d'ID)
    const progMap = {};

    evals.forEach(ev => {
      // Clé = nom normalisé pour dédupliquer "Programme FinTech 2026" avec IDs différents
      const groupKey  = ev.progGroupKey;
      const progName  = ev.programmeName || 'Sans programme';
      const progId    = ev.programmeId || 'no_programme';
      const appId     = ev.applicationId || `app_${ev.startupName}_${ev.programmeId}`;

      if (!progMap[groupKey]) {
        progMap[groupKey] = {
          progId,    // on garde le premier ID rencontré
          progName,
          applications: {},
        };
      }

      if (!progMap[groupKey].applications[appId]) {
        progMap[groupKey].applications[appId] = {
          id:           appId,
          startupName:  ev.startupName,
          founder:      ev.founder,
          email:        ev.email,
          sector:       ev.sector,
          stage:        ev.stage,
          programmeName: progName,
          programmeId:  progId,
          submittedAt:  ev.submittedAt,
          juryAssigned: [],
          linkedEvals:  [],
          totalScore:   0,
        };
      }

      const appEntry = progMap[groupKey].applications[appId];
      appEntry.linkedEvals.push(ev);

      if (ev.jurorName && !appEntry.juryAssigned.includes(ev.jurorName)) {
        appEntry.juryAssigned.push(ev.jurorName);
      }
    });

    const groups = Object.values(progMap)
      .map(prog => ({
        ...prog,
        applications: Object.values(prog.applications).map(app => ({
          ...app,
          totalScore: app.linkedEvals.length > 0
            ? Math.round(
                app.linkedEvals.reduce((s, e) => s + (e.totalScore || 0), 0)
                / app.linkedEvals.length
              )
            : 0,
        })).sort((a, b) => a.startupName.localeCompare(b.startupName)),
      }))
      .sort((a, b) => a.progName.localeCompare(b.progName));

    if (groups.length > 0) {
      setExpandedProg({ [groups[0].progId]: true });
    }

    setProgramGroups(groups);

    const totalEvals     = evals.length;
    const completedEvals = evals.filter(e => e.jurySubmitted).length;
    const pendingEvals   = evals.filter(e => !e.jurySubmitted).length;
    const avgScore = totalEvals > 0
      ? Math.round(evals.reduce((s, e) => s + (e.totalScore || 0), 0) / totalEvals)
      : 0;

    setStats({
      totalProgs:     groups.length,
      totalApps:      Object.values(progMap)
                        .reduce((n, g) => n + Object.keys(g.applications).length, 0),
      totalEvals,
      completedEvals,
      pendingEvals,
      avgScore,
      completionRate: totalEvals > 0
        ? Math.round((completedEvals / totalEvals) * 100)
        : 0,
    });

  } catch (err) {
    console.error('[loadData]', err);
    showAlert('error', 'Erreur de chargement des données');
  } finally {
    setLoading(false);
  }
}, []); // eslint-disable-line

  useEffect(() => { loadData(); }, [loadData]);

  // ── Reminder ──────────────────────────────────────────────────────────────
  const sendReminder = async (jurorId, jurorName, appId, startupName) => {
    const key = `${jurorId}-${appId}`;
    setReminderSending(p => ({ ...p, [key]: true }));
    try {
      await axiosAuth.post('/api/admin/evaluations/remind', {
        juryId: jurorId, applicationId: appId,
      });
      showAlert('success', `Rappel envoyé à ${jurorName} pour ${startupName}`);
    } catch {
      showAlert('error', `Erreur lors de l'envoi du rappel`);
    } finally {
      setReminderSending(p => ({ ...p, [key]: false }));
    }
  };

  // ── Save eval ─────────────────────────────────────────────────────────────
  const handleSaveEval = async (updated) => {
    try {
      await evalsApi.update(updated.id, {
        scores: updated.scores, totalScore: updated.totalScore,
        feedback: updated.feedback, status: updated.status, jurySubmitted: updated.jurySubmitted,
      });
      await loadData();
      setModalItem(null);
      showAlert('success', `Évaluation de ${updated.startupName} mise à jour`);
    } catch {
      showAlert('error', 'Erreur lors de la sauvegarde');
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    setExportLoading(true);
    setTimeout(() => {
      const allEvals = programGroups.flatMap(g =>
        g.applications.flatMap(a => a.linkedEvals)
      );
      const headers = ['Programme','Startup','Fondateur','Secteur','Juré','Score','Statut','Date'];
      const rows = allEvals.map(e => [
        e.programmeName||'',e.startupName,e.founder,e.sector,e.jurorName,
        e.totalScore,e.status,fmtDate(e.submittedAt),
      ]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `evaluations_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      setExportLoading(false);
      showAlert('success', 'Export CSV téléchargé');
    }, 400);
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = programGroups.map(g => ({
    ...g,
    applications: g.applications.filter(a =>
      [a.startupName, a.founder, a.sector, ...(a.juryAssigned||[])]
        .join(' ').toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.applications.length > 0);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
          @keyframes scaleIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
          @keyframes spin     { to{transform:rotate(360deg)} }
          @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
          @keyframes shimmer  { 0%,100%{opacity:.35} 50%{opacity:.7} }

          .fade-up   { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both }
          .scale-in  { animation: scaleIn .35s ease both }
          .shimmer   { animation: shimmer 1.6s ease-in-out infinite }

          .card {
            background: rgba(255,255,255,.97);
            border: 1px solid rgba(0,0,0,.06);
            border-radius: 16px;
          }
          :global(.dark) .card {
            background: #1e293b;
            border-color: #334155;
          }

          .prog-header {
            display:flex; align-items:center; justify-content:space-between;
            padding: 16px 20px; cursor:pointer;
            border-radius: 14px;
            transition: background .15s;
          }
          .prog-header:hover { background: rgba(0,109,148,.04) }
          :global(.dark) .prog-header:hover { background: rgba(56,189,248,.04) }

          .app-row {
            display:grid; grid-template-columns: 1fr auto;
            gap: 12px; padding: 14px 16px;
            border-radius: 12px;
            border: 1px solid rgba(0,0,0,.05);
            transition: all .2s;
          }
          :global(.dark) .app-row { border-color: rgba(255,255,255,.06) }
          .app-row:hover { border-color: rgba(0,109,148,.25); background: rgba(0,109,148,.02) }

          .jury-chip {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 5px 10px; border-radius: 20px;
            font-size: 11px; font-weight: 500;
            border: 1px solid transparent;
            transition: all .15s;
          }
          .jury-chip.done   { background:#dcfce7; color:#15803d; border-color:#bbf7d0 }
          .jury-chip.inprog { background:#fef9c3; color:#a16207; border-color:#fef08a }
          .jury-chip.pending{ background:#f1f5f9; color:#64748b; border-color:#e2e8f0 }
          :global(.dark) .jury-chip.done    { background:#052e16; color:#4ade80; border-color:#166534 }
          :global(.dark) .jury-chip.inprog  { background:#422006; color:#fbbf24; border-color:#92400e }
          :global(.dark) .jury-chip.pending { background:#1e293b; color:#94a3b8; border-color:#334155 }

          .btn-remind {
            display:inline-flex; align-items:center; gap:5px;
            padding: 4px 10px; font-size:11px; font-weight:600;
            border-radius: 8px; cursor:pointer;
            background: rgba(0,109,148,.08); color: #006d94;
            border: 1px solid rgba(0,109,148,.18);
            transition: all .15s;
          }
          :global(.dark) .btn-remind { background:rgba(56,189,248,.08); color:#38bdf8; border-color:rgba(56,189,248,.2) }
          .btn-remind:hover { background: rgba(0,109,148,.15) }
          .btn-remind:disabled { opacity:.5; cursor:default }

          .btn-primary {
            display:inline-flex; align-items:center; gap:7px;
            padding: 9px 18px; font-size:13px; font-weight:600;
            color:#fff; border-radius:10px;
            background: linear-gradient(135deg,#006d94,#0088ba);
            transition: all .2s;
          }
          .btn-primary:hover { box-shadow:0 6px 20px -4px rgba(0,109,148,.4); transform:translateY(-1px) }
          .btn-primary:disabled { opacity:.55; pointer-events:none }

          .btn-ghost {
            display:inline-flex; align-items:center; gap:6px;
            padding: 9px 14px; font-size:13px; font-weight:500;
            background:transparent; border:1px solid rgba(0,0,0,.1);
            border-radius:10px; color:#475569; transition:all .15s;
          }
          :global(.dark) .btn-ghost { color:#94a3b8; border-color:rgba(255,255,255,.1) }
          .btn-ghost:hover { background:rgba(0,0,0,.03) }

          .track { height:4px; background:#e2e8f0; border-radius:99px; overflow:hidden }
          :global(.dark) .track { background:#1e293b }
          .fill  { height:100%; border-radius:99px; transition:width .6s cubic-bezier(.16,1,.3,1) }

          .stat-card {
            padding: 16px 20px; border-radius: 14px;
            border: 1px solid rgba(0,0,0,.06);
            background: rgba(255,255,255,.97);
          }
          :global(.dark) .stat-card { background:#1e293b; border-color:#334155 }

          .search-input {
            width:100%; padding: 9px 14px 9px 38px; font-size:13px;
            border: 1px solid rgba(0,0,0,.1); border-radius:10px;
            background:#fff; color:#111;
            transition: border .15s, box-shadow .15s;
          }
          :global(.dark) .search-input { background:#0f172a; color:#e2e8f0; border-color:#334155 }
          .search-input:focus { outline:none; border-color:#006d94; box-shadow:0 0 0 3px rgba(0,109,148,.1) }

          .score-badge {
            display:inline-flex; align-items:baseline; gap:2px;
            padding: 3px 9px; border-radius:8px;
            font-family: monospace; font-weight:700; font-size:13px;
          }

          .spin { animation: spin .7s linear infinite }
          .pulsing { animation: pulse 2s ease-in-out infinite }
        `}</style>

        <div className="space-y-5 pb-16">

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl fade-up"
            style={{ background:'linear-gradient(135deg,#00526e 0%,#006d94 55%,#0088ba 100%)', minHeight:180 }}>
            <div style={{ position:'absolute',width:320,height:320,borderRadius:'50%',background:'rgba(255,255,255,.03)',top:-100,right:-60,pointerEvents:'none' }}/>
            <div style={{ position:'absolute',width:160,height:160,borderRadius:'50%',background:'rgba(0,168,224,.07)',bottom:-60,left:200,pointerEvents:'none' }}/>

            <div className="relative px-8 py-7 flex flex-col lg:flex-row gap-6 justify-between">
              <div className="flex-1">
                <button onClick={() => router.push('/dashboard/admin/applications')}
                  className="flex items-center gap-2 mb-4 text-[11px] font-semibold text-white/60 hover:text-white/90 transition-colors tracking-widest uppercase">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  Candidatures
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/80 uppercase rounded-md"
                    style={{ background:'rgba(255,255,255,.09)', border:'1px solid rgba(255,255,255,.13)' }}>
                    Admin · Jury
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-white/50 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulsing"/>
                    Synchronisé
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-1" style={{ letterSpacing:'-0.3px' }}>
                  Évaluations Jury
                </h1>
                <p className="text-blue-200/60 text-sm font-light">
                  Vue consolidée par programme · scores · rappels jury
                </p>
              </div>

              {/* Mini stats header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 self-end">
                {[
                  { label:'Programmes',  value: stats.totalProgs     || 0, accent:'#38bdf8' },
                  { label:'Évaluations', value: stats.totalEvals     || 0, accent:'#818cf8' },
                  { label:'Terminées',   value: stats.completedEvals || 0, accent:'#4ade80' },
                  { label:'Score moy.',  value: stats.avgScore       || 0, accent:'#fb923c' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl px-4 py-3 text-center"
                    style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)' }}>
                    <div className="text-white/45 text-[9px] tracking-widest uppercase mb-0.5">{s.label}</div>
                    <div className="font-bold text-base" style={{ color: s.accent, fontFamily:'monospace' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── GLOBAL PROGRESS ──────────────────────────────────────────── */}
          {!loading && stats.totalEvals > 0 && (
            <div className="card px-6 py-4 fade-up" style={{ animationDelay:'.1s' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Progression globale</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stats.completedEvals} / {stats.totalEvals} évaluations soumises</p>
                </div>
                <span className="font-bold text-xl text-[#006d94] dark:text-sky-400" style={{ fontFamily:'monospace' }}>
                  {stats.completionRate}%
                </span>
              </div>
              <div className="track">
                <div className="fill" style={{ width:`${stats.completionRate}%`, background:'linear-gradient(90deg,#005577,#0088ba)' }}/>
              </div>
              <div className="flex gap-5 mt-2.5 flex-wrap">
                {[
                  { label:'En attente', val: stats.pendingEvals,   color:'#f59e0b' },
                  { label:'Terminées',  val: stats.completedEvals, color:'#10b981' },
                  { label:'Total',      val: stats.totalEvals,     color:'#6366f1' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: b.color }}/>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {b.label} <span className="font-semibold text-gray-700 dark:text-gray-200" style={{ fontFamily:'monospace' }}>{b.val}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ALERT ────────────────────────────────────────────────────── */}
          {alert.show && (
            <Alert type={alert.type} message={alert.message}
              onClose={() => setAlert({ show:false, type:'', message:'' })} />
          )}

          {/* ── TOOLBAR ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 flex-wrap fade-up" style={{ animationDelay:'.15s' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={loadData} className="btn-ghost">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Actualiser
              </button>
              <button onClick={handleExportCSV} disabled={exportLoading} className="btn-primary">
                {exportLoading
                  ? <svg className="w-3.5 h-3.5 spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/></svg>
                  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>}
                Exporter CSV
              </button>
            </div>
            {/* Search */}
            <div className="relative min-w-[240px]">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Startup, fondateur, juré…"
                className="search-input"/>
            </div>
          </div>

          {/* ── LOADING ──────────────────────────────────────────────────── */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-5 shimmer">
                  <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-3"/>
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-5"/>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="h-16 bg-gray-50 dark:bg-gray-900 rounded-xl"/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── EMPTY ────────────────────────────────────────────────────── */}
          {!loading && filtered.length === 0 && (
            <div className="card p-16 text-center fade-up">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">Aucune donnée</p>
              <p className="text-sm text-gray-400 font-light">
                {search ? 'Aucun résultat pour cette recherche.' : 'Aucune candidature ou évaluation trouvée.'}
              </p>
            </div>
          )}

          {/* ── PROGRAMME GROUPS ────────────────────────────────────────── */}
          {!loading && filtered.map((group, gi) => {
            const isOpen = !!expandedProg[group.progId];
            const totalApps   = group.applications.length;
            const evalsDone   = group.applications.reduce((n, a) =>
              n + a.linkedEvals.filter(e => e.jurySubmitted).length, 0);
            const evalsTotal  = group.applications.reduce((n, a) => n + a.linkedEvals.length, 0);
            const pendingJury = group.applications.reduce((n, a) => {
              const done = a.linkedEvals.filter(e => e.jurySubmitted).length;
              return n + Math.max(0, (a.juryAssigned||[]).length - done);
            }, 0);

            return (
              <div key={group.progId} className="card fade-up overflow-hidden" style={{ animationDelay:`${gi*.05}s` }}>

                {/* Programme header */}
                <div className="prog-header"
                  onClick={() => setExpandedProg(p => ({ ...p, [group.progId]: !p[group.progId] }))}>
                  <div className="flex items-center gap-4">
                    {/* Expand icon */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform"
                      style={{ background:'rgba(0,109,148,.1)', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                      <svg className="w-4 h-4 text-[#006d94] dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <p className="font-bold text-base text-gray-900 dark:text-white">{group.progName}</p>
                        {pendingJury > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 tracking-wider">
                            {pendingJury} EN ATTENTE
                          </span>
                        )}
                        {pendingJury === 0 && evalsTotal > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 tracking-wider">
                            COMPLET
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-light">
                        {totalApps} candidature{totalApps > 1 ? 's' : ''} · {evalsDone}/{evalsTotal} évaluations soumises
                      </p>
                    </div>
                  </div>

                  {/* Progress ring summary */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: evalsTotal > 0 && evalsDone === evalsTotal ? '#10b981' : '#006d94', fontFamily:'monospace' }}>
                          {evalsTotal > 0 ? Math.round((evalsDone / evalsTotal) * 100) : 0}%
                        </p>
                        <p className="text-[10px] text-gray-400">complétion</p>
                      </div>
                      <ProgMiniBar done={evalsDone} total={evalsTotal}/>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>

                {/* Divider */}
                {isOpen && <div className="border-t border-gray-100 dark:border-gray-800 mx-5"/>}

                {/* Applications list */}
                {isOpen && (
                  <div className="p-4 space-y-3">
                    {group.applications.map((app, ai) => (
                      <ApplicationRow
                        key={app.id}
                        app={app}
                        idx={ai}
                        reminderSending={reminderSending}
                        onOpenEval={(ev) => setModalItem({ type:'eval', data: ev })}
                        onRemind={sendReminder}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── MODAL ─────────────────────────────────────────────────────── */}
        {modalItem?.type === 'eval' && (
          <EvalModal
            isOpen
            evaluation={modalItem.data}
            onClose={() => setModalItem(null)}
            onSave={handleSaveEval}
            onGoToApplication={() => { setModalItem(null); router.push('/dashboard/admin/applications'); }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Mini progress bar (5 segments) ──────────────────────────────────────────
function ProgMiniBar({ done, total }) {
  const pct = total > 0 ? done / total : 0;
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-1.5 rounded-full" style={{
          height: 24 - i * 3,
          background: i < Math.round(pct * 5) ? '#006d94' : '#e2e8f0',
          opacity: i < Math.round(pct * 5) ? 0.4 + i * 0.15 : 0.3,
        }}/>
      ))}
    </div>
  );
}

// ─── Application Row ─────────────────────────────────────────────────────────
function ApplicationRow({ app, idx, reminderSending, onOpenEval, onRemind }) {
  const sc = sectorColor(app.sector);

  // Score moyen calculé depuis les évals liées
  const avgScore = app.linkedEvals.length > 0
    ? Math.round(app.linkedEvals.reduce((s, e) => s + (e.totalScore || 0), 0) / app.linkedEvals.length)
    : 0;

  // Toutes les évals soumises ?
  const allDone = app.linkedEvals.length > 0 && app.linkedEvals.every(e => e.jurySubmitted);

  return (
    <div className="scale-in" style={{ animationDelay: `${idx * .04}s` }}>
      <div style={{
        background: 'rgba(248,250,252,.8)',
        border: '1px solid rgba(0,0,0,.06)',
        borderRadius: 14,
        padding: '14px 16px',
        transition: 'all .2s',
      }}>

        {/* ── TOP ROW : avatar + info + score ────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg,${sc}cc,${sc})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 700,
          }}>
            {app.startupName.slice(0, 2).toUpperCase()}
          </div>

          {/* Name + badges + founder */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary, #0f172a)' }}>
                {app.startupName}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                color: '#fff', background: sc,
              }}>
                {app.sector}
              </span>
              {app.stage && (
                <span style={{
                  padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                  background: 'rgba(0,0,0,.06)', color: '#64748b',
                }}>
                  {app.stage}
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
              {app.founder}
              {app.email && (
                <span style={{ marginLeft: 8, color: '#cbd5e1' }}>{app.email}</span>
              )}
            </span>
          </div>

          {/* Score moyen — affiché proprement en haut à droite */}
          {app.linkedEvals.length > 0 && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                Score moy.
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'baseline', gap: 1,
                padding: '3px 10px', borderRadius: 8,
                background: `${scoreClr(avgScore)}18`,
                color: scoreClr(avgScore),
                fontFamily: 'monospace', fontWeight: 700, fontSize: 15,
              }}>
                {avgScore}
                <span style={{ fontSize: 9, fontWeight: 400, opacity: .65 }}>/100</span>
              </div>
              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                {fmtDate(app.submittedAt)}
              </div>
            </div>
          )}
        </div>

        {/* ── JURY CHIPS ──────────────────────────────────────────────── */}
        <div style={{ marginTop: 10, marginLeft: 52 }}>
          {app.linkedEvals.length === 0 && (app.juryAssigned || []).length === 0 && (
            <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>
              Aucun jury assigné
            </span>
          )}

          {/* Chips depuis linkedEvals (source de vérité) */}
          {app.linkedEvals.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {app.linkedEvals.map((ev, ji) => {
                const done       = ev.jurySubmitted || ev.status === 'submitted' || ev.status === 'completed';
                const inProgress = !done && ev.status === 'in_progress';
                const remKey     = `${ev.jurorId || ev.jurorName}-${app.id}`;

                // Couleurs selon statut
                const chipStyle = done
                  ? { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }
                  : inProgress
                  ? { bg: '#fef9c3', color: '#a16207', border: '#fef08a' }
                  : { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };

                return (
                  <div key={ji} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {/* Chip cliquable */}
                    <div
                      onClick={() => onOpenEval(ev)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                        fontSize: 11, fontWeight: 600,
                        background: chipStyle.bg, color: chipStyle.color,
                        border: `1px solid ${chipStyle.border}`,
                        transition: 'all .15s',
                      }}
                    >
                      {/* Icône statut */}
                      {done ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : inProgress ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="4" strokeWidth={2}/>
                        </svg>
                      )}

                      {/* Nom juré */}
                      <span>{ev.jurorName}</span>

                      {/* Score inline si soumis */}
                      {done && ev.totalScore > 0 && (
                        <span style={{
                          marginLeft: 2, fontFamily: 'monospace', fontWeight: 700, fontSize: 12,
                          padding: '0 5px', borderRadius: 5,
                          background: `${scoreClr(ev.totalScore)}22`,
                          color: scoreClr(ev.totalScore),
                        }}>
                          {ev.totalScore}
                        </span>
                      )}

                      {/* Label statut */}
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
                        opacity: .75, textTransform: 'uppercase',
                      }}>
                        {done ? 'soumis' : inProgress ? 'en cours' : 'attente'}
                      </span>
                    </div>

                    {/* Bouton rappel — seulement si pas soumis */}
                    {!done && (
                      <button
                        disabled={!!reminderSending[remKey]}
                        onClick={() => onRemind(ev.jurorId || ev.jurorName, ev.jurorName, app.id, app.startupName)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 9px', fontSize: 10, fontWeight: 700,
                          borderRadius: 8, cursor: reminderSending[remKey] ? 'default' : 'pointer',
                          background: 'rgba(0,109,148,.08)', color: '#006d94',
                          border: '1px solid rgba(0,109,148,.18)',
                          opacity: reminderSending[remKey] ? .5 : 1,
                          transition: 'all .15s',
                        }}
                      >
                        {reminderSending[remKey] ? (
                          <svg className="spin" width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"/>
                          </svg>
                        ) : (
                          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                          </svg>
                        )}
                        Rappeler
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cas : jury assigné mais aucune éval encore créée */}
          {app.linkedEvals.length === 0 && (app.juryAssigned || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {app.juryAssigned.map((name, ji) => (
                <div key={ji} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 600,
                    background: '#fef3c7', color: '#92400e',
                    border: '1px solid #fde68a',
                  }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" strokeWidth={2}/>
                    </svg>
                    {name}
                    <span style={{ fontSize: 9, fontWeight: 700, opacity: .7, textTransform: 'uppercase' }}>
                      attente
                    </span>
                  </span>
                  <button
                    disabled={!!reminderSending[`${name}-${app.id}`]}
                    onClick={() => onRemind(name, name, app.id, app.startupName)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 9px', fontSize: 10, fontWeight: 700,
                      borderRadius: 8, cursor: 'pointer',
                      background: 'rgba(0,109,148,.08)', color: '#006d94',
                      border: '1px solid rgba(0,109,148,.18)',
                      transition: 'all .15s',
                    }}
                  >
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                    Rappeler
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── EVAL MINI-ROWS (sous la carte, sans duplication) ────────── */}
      {app.linkedEvals.length > 1 && (
        <div style={{
          marginTop: 4, marginLeft: 16,
          paddingLeft: 16,
          borderLeft: '2px dashed rgba(0,109,148,.15)',
        }}>
          {app.linkedEvals.map(ev => (
            <EvalMiniRow key={ev.id} ev={ev} onOpen={() => onOpenEval(ev)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Evaluation mini-row ─────────────────────────────────────────────────────
function EvalMiniRow({ ev, onOpen }) {
  const done = ev.jurySubmitted || ev.status === 'completed' || ev.status === 'submitted';
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
      onClick={onOpen}>
      <div className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: done ? '#10b981' : ev.status === 'in_progress' ? '#0ea5e9' : '#f59e0b' }}/>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{ev.jurorName}</p>
        <span className="text-[10px] text-gray-400 font-light hidden sm:block">{fmtDate(ev.submittedAt)}</span>
      </div>
      {ev.totalScore > 0 && (
        <span className="text-xs font-bold flex-shrink-0" style={{ color: scoreClr(ev.totalScore), fontFamily:'monospace' }}>
          {ev.totalScore}/100
        </span>
      )}
      <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
        done ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
             : ev.status === 'in_progress' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
             : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      }`}>
        {done ? 'SOUMIS' : ev.status === 'in_progress' ? 'EN COURS' : 'ATTENTE'}
      </span>
      <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
      </svg>
    </div>
  );
}

// ─── Evaluation Detail Modal ──────────────────────────────────────────────────
function EvalModal({ isOpen, evaluation, onClose, onSave, onGoToApplication }) {
  const [scores,   setScores]  = useState(evaluation.scores || { team:0, innovation:0, market:0, business:0, traction:0 });
  const [feedback, setFeedback]= useState(evaluation.feedback || '');
  const [loading,  setLoading] = useState(false);
  const [tab,      setTab]     = useState('scores');

  const totalScore = Math.round(
    CRITERIA.reduce((t, c) => t + (scores[c.id] || 0) * (c.weight / 100), 0)
  );

  const handleSave = async (draft = false) => {
    setLoading(true);
    await onSave({
      ...evaluation, scores, totalScore, feedback,
      status: draft ? 'in_progress' : 'completed',
      jurySubmitted: !draft,
    });
    setLoading(false);
  };

  const sc = sectorColor(evaluation.sector);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Évaluation — ${evaluation.startupName}`} size="xl">
      {/* Banner */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ background:`linear-gradient(135deg,${sc}cc,${sc})` }}>
          {evaluation.startupName.slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white">{evaluation.startupName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: sc }}>{evaluation.sector}</span>
            <span className="text-xs text-gray-400 font-light">Juré : <strong className="text-gray-600 dark:text-gray-300">{evaluation.jurorName}</strong></span>
            {evaluation.jurySubmitted && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 tracking-wider">SOUMIS</span>}
          </div>
        </div>
        <button onClick={onGoToApplication}
          className="text-xs font-semibold text-[#006d94] dark:text-sky-400 hover:underline flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          Voir candidature
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-5 gap-0">
        {[['scores','Scores'],['details','Détails'],['feedback','Feedback']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors uppercase tracking-widest ${tab === id ? 'border-[#006d94] text-[#006d94] dark:border-sky-400 dark:text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Scores tab */}
      {tab === 'scores' && (
        <div className="space-y-4">
          {/* Total */}
          <div className="flex flex-col items-center py-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-slate-900/40">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Score total pondéré</span>
            <span className="text-5xl font-extrabold leading-none" style={{ color: scoreClr(totalScore), fontFamily:'monospace' }}>{totalScore}</span>
            <span className="text-xs text-gray-400 mt-1 font-light">/100 · {scoreLabel(totalScore)}</span>
          </div>

          {/* Sliders */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {CRITERIA.map(c => (
              <div key={c.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-slate-800/30">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }}/>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</span>
                    <span className="text-xs text-gray-400">({c.weight}%)</span>
                  </div>
                  <span className="font-bold text-base" style={{ color: c.color, fontFamily:'monospace' }}>{scores[c.id]||0}</span>
                </div>
                <input type="range" min="0" max="100" value={scores[c.id]||0}
                  style={{ accentColor: c.color }}
                  onChange={e => setScores(p => ({ ...p, [c.id]: parseInt(e.target.value) }))}
                  className="w-full cursor-pointer"/>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span className="font-light">Pondération {c.weight}%</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300" style={{ fontFamily:'monospace' }}>
                    +{Math.round((scores[c.id]||0)*c.weight/100)} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details tab */}
      {tab === 'details' && (
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Startup',    evaluation.startupName],
            ['Fondateur',  evaluation.founder],
            ['Secteur',    evaluation.sector],
            ['Stade',      evaluation.stage],
            ['Programme',  evaluation.programmeName],
            ['Évaluateur', evaluation.jurorName],
            ['Soumis le',  fmtDate(evaluation.submittedAt)],
            ['Statut',     evaluation.jurySubmitted ? 'Soumis' : evaluation.status],
          ].map(([l, v], i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40">
              <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-widest font-semibold">{l}</p>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{v || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feedback tab */}
      {tab === 'feedback' && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-widest">
            Feedback du jury
          </label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={8}
            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 dark:bg-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006d94]/15 focus:border-[#006d94] resize-none font-light"
            placeholder="Observations et recommandations du jury…"/>
          <p className="text-[10px] text-gray-400 mt-1" style={{ fontFamily:'monospace' }}>{feedback.length} caractères</p>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"/>
        <p className="text-xs text-amber-700 dark:text-amber-400 font-light">
          En soumettant, le score sera synchronisé avec le dossier de candidature.
        </p>
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <button onClick={onClose} className="btn-ghost">Fermer</button>
        <div className="flex gap-2">
          <button onClick={() => handleSave(true)} disabled={loading}
            className="btn-ghost border-[#006d94]/30 text-[#006d94] dark:text-sky-400">
            {loading ? '…' : 'Brouillon'}
          </button>
          <button onClick={() => handleSave(false)} disabled={loading} className="btn-primary">
            {loading
              ? <><svg className="w-3.5 h-3.5 spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Traitement…</>
              : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Soumettre</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}