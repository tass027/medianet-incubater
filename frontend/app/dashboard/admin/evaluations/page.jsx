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
import { useAiReportingApi } from '@/app/hooks/useAiReportingApi';

// ─── Constants ───────────────────────────────────────────────────────────────
const CRITERIA = [
  { id: 'team',       name: 'Équipe',      weight: 30, color: '#6366f1' },
  { id: 'innovation', name: 'Innovation',  weight: 25, color: '#0ea5e9' },
  { id: 'market',     name: 'Marché',      weight: 20, color: '#10b981' },
  { id: 'business',   name: 'Modèle Éco.', weight: 15, color: '#f59e0b' },
  { id: 'traction',   name: 'Traction',    weight: 10, color: '#ef4444' },
];

const SECTOR_COLORS = {
  FinTech: '#0ea5e9', HealthTech: '#10b981', AgriTech: '#22c55e',
  EdTech: '#f59e0b', CleanTech: '#a855f7', Default: '#64748b',
};
const sectorColor = (s) => SECTOR_COLORS[s] || SECTOR_COLORS.Default;
const scoreClr    = (s) => s >= 80 ? '#10b981' : s >= 65 ? '#f59e0b' : s >= 50 ? '#f97316' : '#ef4444';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const scoreLabel = (s) => s >= 80 ? 'Excellent' : s >= 65 ? 'Bien' : s >= 50 ? 'Moyen' : 'Faible';
const normalize = (arr) => (arr || []).map(i => ({ ...i, id: i.id ?? i._id?.toString() }));

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminEvaluationsPage() {
  const router = useRouter();
  const { user } = useSelector(s => s.auth);
  const evalsApi = useEvaluationsApi();
  const aiReportingApi = useAiReportingApi();
  const appsApi = useApplicationsApi();

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [search, setSearch] = useState('');
  const [programGroups, setProgramGroups] = useState([]);
  const [stats, setStats] = useState({});
  const [expandedProg, setExpandedProg] = useState({});
  const [modalItem, setModalItem] = useState(null);
  const [reminderSending, setReminderSending] = useState({});

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

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
        programmeId:   e.programmeId?.toString() || 'no_programme',
        progGroupKey:  (e.programmeName || 'Sans programme').trim().toLowerCase(),
        status:        e.status        || 'pending',
        submittedAt:   e.submittedAt   || e.createdAt,
        updatedAt:     e.updatedAt,
        jurorName:     e.juryName      || e.jurorName || 'Jury',
        jurorId:       e.juryId?.toString() || null,
        jurySubmitted: e.jurySubmitted ?? (e.status === 'submitted' || e.status === 'completed'),
        scores:        e.scores        || { team: 0, innovation: 0, market: 0, business: 0, traction: 0 },
        totalScore:    e.totalScore    || 0,
        feedback:      e.feedback      || e.globalRemark || '',
        applicationId: e.applicationId?.toString() || null,
      }));

      evals.sort((a, b) => {
        if (a.jurySubmitted && !b.jurySubmitted) return -1;
        if (!a.jurySubmitted && b.jurySubmitted) return 1;
        return 0;
      });

      const progMap = {};

      evals.forEach(ev => {
        const groupKey = ev.progGroupKey;
        const progName = ev.programmeName || 'Sans programme';
        const progId   = ev.programmeId || 'no_programme';
        const appId    = ev.applicationId || `app_${ev.startupName}_${ev.programmeId}`;

        if (!progMap[groupKey]) {
          progMap[groupKey] = { progId, progName, applications: {} };
        }

        if (!progMap[groupKey].applications[appId]) {
          progMap[groupKey].applications[appId] = {
            id:            appId,
            applicationId: ev.applicationId || null,
            startupName:   ev.startupName,
            founder:       ev.founder,
            email:         ev.email,
            sector:        ev.sector,
            stage:         ev.stage,
            programmeName: progName,
            programmeId:   progId,
            submittedAt:   ev.submittedAt,
            juryAssigned:  [],
            linkedEvals:   [],
            totalScore:    0,
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
              ? Math.round(app.linkedEvals.reduce((s, e) => s + (e.totalScore || 0), 0) / app.linkedEvals.length)
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
        totalApps:      Object.values(progMap).reduce((n, g) => n + Object.keys(g.applications).length, 0),
        totalEvals,
        completedEvals,
        pendingEvals,
        avgScore,
        completionRate: totalEvals > 0 ? Math.round((completedEvals / totalEvals) * 100) : 0,
      });

    } catch (err) {
      console.error('[loadData]', err);
      showAlert('error', 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadData(); }, [loadData]);

  const sendReminder = async (jurorId, jurorName, appId, startupName) => {
    const key = `${jurorId}-${appId}`;
    setReminderSending(p => ({ ...p, [key]: true }));
    try {
      await axiosAuth.post('/api/admin/evaluations/remind', { juryId: jurorId, applicationId: appId });
      showAlert('success', `Rappel envoyé à ${jurorName} pour ${startupName}`);
    } catch {
      showAlert('error', `Erreur lors de l'envoi du rappel`);
    } finally {
      setReminderSending(p => ({ ...p, [key]: false }));
    }
  };

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

  const filtered = programGroups.map(g => ({
    ...g,
    applications: g.applications.filter(a =>
      [a.startupName, a.founder, a.sector, ...(a.juryAssigned || [])]
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
          .card { background: rgba(255,255,255,.97); border: 1px solid rgba(0,0,0,.06); border-radius: 16px; }
          :global(.dark) .card { background: #1e293b; border-color: #334155; }
          .prog-header { display:flex; align-items:center; justify-content:space-between; padding: 16px 20px; cursor:pointer; border-radius: 14px; transition: background .15s; }
          .prog-header:hover { background: rgba(0,109,148,.04) }
          :global(.dark) .prog-header:hover { background: rgba(56,189,248,.04) }
          .btn-primary { display:inline-flex; align-items:center; gap:7px; padding: 9px 18px; font-size:13px; font-weight:600; color:#fff; border-radius:10px; background: linear-gradient(135deg,#006d94,#0088ba); transition: all .2s; }
          .btn-primary:hover { box-shadow:0 6px 20px -4px rgba(0,109,148,.4); transform:translateY(-1px) }
          .btn-primary:disabled { opacity:.55; pointer-events:none }
          .btn-ghost { display:inline-flex; align-items:center; gap:6px; padding: 9px 14px; font-size:13px; font-weight:500; background:transparent; border:1px solid rgba(0,0,0,.1); border-radius:10px; color:#475569; transition:all .15s; }
          :global(.dark) .btn-ghost { color:#94a3b8; border-color:rgba(255,255,255,.1) }
          .btn-ghost:hover { background:rgba(0,0,0,.03) }
          .track { height:4px; background:#e2e8f0; border-radius:99px; overflow:hidden }
          :global(.dark) .track { background:#1e293b }
          .fill  { height:100%; border-radius:99px; transition:width .6s cubic-bezier(.16,1,.3,1) }
          .search-input { width:100%; padding: 9px 14px 9px 38px; font-size:13px; border: 1px solid rgba(0,0,0,.1); border-radius:10px; background:#fff; color:#111; transition: border .15s, box-shadow .15s; }
          :global(.dark) .search-input { background:#0f172a; color:#e2e8f0; border-color:#334155 }
          .search-input:focus { outline:none; border-color:#006d94; box-shadow:0 0 0 3px rgba(0,109,148,.1) }
          .spin { animation: spin .7s linear infinite }
          .pulsing { animation: pulse 2s ease-in-out infinite }
        `}</style>

        <div className="space-y-5 pb-16">
          {/* HEADER */}
          <div className="relative overflow-hidden rounded-2xl fade-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 55%,#0088ba 100%)', minHeight: 180 }}>
            <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,.03)', top: -100, right: -60, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,168,224,.07)', bottom: -60, left: 200, pointerEvents: 'none' }} />
            <div className="relative px-8 py-7 flex flex-col lg:flex-row gap-6 justify-between">
              <div className="flex-1">
                <button onClick={() => router.push('/dashboard/admin/applications')}
                  className="flex items-center gap-2 mb-4 text-[11px] font-semibold text-white/60 hover:text-white/90 transition-colors tracking-widest uppercase">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Candidatures
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/80 uppercase rounded-md"
                    style={{ background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.13)' }}>
                    Admin · Jury
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-white/50 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulsing" />
                    Synchronisé
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.3px' }}>Évaluations Jury</h1>
                <p className="text-blue-200/60 text-sm font-light">Vue consolidée par programme · scores · rappels jury</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 self-end">
                {[
                  { label: 'Programmes',  value: stats.totalProgs     || 0, accent: '#38bdf8' },
                  { label: 'Évaluations', value: stats.totalEvals     || 0, accent: '#818cf8' },
                  { label: 'Terminées',   value: stats.completedEvals || 0, accent: '#4ade80' },
                  { label: 'Score moy.',  value: stats.avgScore       || 0, accent: '#fb923c' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl px-4 py-3 text-center"
                    style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)' }}>
                    <div className="text-white/45 text-[9px] tracking-widest uppercase mb-0.5">{s.label}</div>
                    <div className="font-bold text-base" style={{ color: s.accent, fontFamily: 'monospace' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GLOBAL PROGRESS */}
          {!loading && stats.totalEvals > 0 && (
            <div className="card px-6 py-4 fade-up" style={{ animationDelay: '.1s' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Progression globale</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stats.completedEvals} / {stats.totalEvals} évaluations soumises</p>
                </div>
                <span className="font-bold text-xl text-[#006d94] dark:text-sky-400" style={{ fontFamily: 'monospace' }}>{stats.completionRate}%</span>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${stats.completionRate}%`, background: 'linear-gradient(90deg,#005577,#0088ba)' }} />
              </div>
              <div className="flex gap-5 mt-2.5 flex-wrap">
                {[
                  { label: 'En attente', val: stats.pendingEvals,   color: '#f59e0b' },
                  { label: 'Terminées',  val: stats.completedEvals, color: '#10b981' },
                  { label: 'Total',      val: stats.totalEvals,     color: '#6366f1' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {b.label} <span className="font-semibold text-gray-700 dark:text-gray-200" style={{ fontFamily: 'monospace' }}>{b.val}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alert.show && (
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ show: false, type: '', message: '' })} />
          )}

          {/* TOOLBAR */}
          <div className="flex items-center justify-between gap-3 flex-wrap fade-up" style={{ animationDelay: '.15s' }}>
            <button onClick={loadData} className="btn-ghost">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
            <div className="relative min-w-[240px]">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Startup, fondateur, juré…" className="search-input" />
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-5 shimmer">
                  <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-5" />
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (<div key={j} className="h-16 bg-gray-50 dark:bg-gray-900 rounded-xl" />))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY */}
          {!loading && filtered.length === 0 && (
            <div className="card p-16 text-center fade-up">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">Aucune donnée</p>
              <p className="text-sm text-gray-400 font-light">
                {search ? 'Aucun résultat pour cette recherche.' : 'Aucune candidature ou évaluation trouvée.'}
              </p>
            </div>
          )}

          {/* PROGRAMME GROUPS */}
          {!loading && filtered.map((group, gi) => {
            const isOpen = !!expandedProg[group.progId];
            const totalApps  = group.applications.length;
            const evalsDone  = group.applications.reduce((n, a) => n + a.linkedEvals.filter(e => e.jurySubmitted).length, 0);
            const evalsTotal = group.applications.reduce((n, a) => n + a.linkedEvals.length, 0);
            const pendingJury = group.applications.reduce((n, a) => {
              const done = a.linkedEvals.filter(e => e.jurySubmitted).length;
              return n + Math.max(0, (a.juryAssigned || []).length - done);
            }, 0);

            return (
              <div key={group.progId} className="card fade-up overflow-hidden" style={{ animationDelay: `${gi * .05}s` }}>
                <div className="prog-header" onClick={() => setExpandedProg(p => ({ ...p, [group.progId]: !p[group.progId] }))}>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,109,148,.1)', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .2s' }}>
                      <svg className="w-4 h-4 text-[#006d94] dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: evalsTotal > 0 && evalsDone === evalsTotal ? '#10b981' : '#006d94', fontFamily: 'monospace' }}>
                          {evalsTotal > 0 ? Math.round((evalsDone / evalsTotal) * 100) : 0}%
                        </p>
                        <p className="text-[10px] text-gray-400">complétion</p>
                      </div>
                      <ProgMiniBar done={evalsDone} total={evalsTotal} />
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {isOpen && <div className="border-t border-gray-100 dark:border-gray-800 mx-5" />}
                {isOpen && (
                  <div className="p-4 space-y-3">
                    {group.applications.map((app, ai) => (
                      <ApplicationRow
                        key={app.id}
                        app={app}
                        idx={ai}
                        reminderSending={reminderSending}
                        onOpenEval={(ev) => setModalItem({ type: 'eval', data: ev })}
                        onRemind={sendReminder}
                        onOpenReport={(a) => setModalItem({ type: 'appReport', data: { app: a } })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MODALS */}
        {modalItem?.type === 'eval' && (
          <EvalModal
            isOpen
            evaluation={modalItem.data}
            onClose={() => setModalItem(null)}
            onSave={handleSaveEval}
            onGoToApplication={() => { setModalItem(null); router.push('/dashboard/admin/applications'); }}
          />
        )}
        {modalItem?.type === 'appReport' && (
          <AppReportModal
            isOpen
            app={modalItem.data.app}
            onClose={() => setModalItem(null)}
            aiReportingApi={aiReportingApi}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Mini progress bar ────────────────────────────────────────────────────────
function ProgMiniBar({ done, total }) {
  const pct = total > 0 ? done / total : 0;
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-1.5 rounded-full" style={{
          height: 24 - i * 3,
          background: i < Math.round(pct * 5) ? '#006d94' : '#e2e8f0',
          opacity: i < Math.round(pct * 5) ? 0.4 + i * 0.15 : 0.3,
        }} />
      ))}
    </div>
  );
}

// ─── Application Row ──────────────────────────────────────────────────────────
function ApplicationRow({ app, idx, reminderSending, onOpenEval, onRemind, onOpenReport }) {
  const sc = sectorColor(app.sector);
  const avgScore = app.linkedEvals.length > 0
    ? Math.round(app.linkedEvals.reduce((s, e) => s + (e.totalScore || 0), 0) / app.linkedEvals.length)
    : 0;

  return (
    <div className="scale-in" style={{ animationDelay: `${idx * .04}s` }}>
      <div style={{ background: 'rgba(248,250,252,.8)', border: '1px solid rgba(0,0,0,.06)', borderRadius: 14, padding: '14px 16px', transition: 'all .2s' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg,${sc}cc,${sc})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
            {app.startupName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary, #0f172a)' }}>{app.startupName}</span>
              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#fff', background: sc }}>{app.sector}</span>
              {app.stage && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,.06)', color: '#64748b' }}>{app.stage}</span>}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
              {app.founder}
              {app.email && <span style={{ marginLeft: 8, color: '#cbd5e1' }}>{app.email}</span>}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            {app.linkedEvals.length > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Score moy.</div>
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 1, padding: '3px 10px', borderRadius: 8, background: `${scoreClr(avgScore)}18`, color: scoreClr(avgScore), fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>
                  {avgScore}<span style={{ fontSize: 9, fontWeight: 400, opacity: .65 }}>/100</span>
                </div>
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>{fmtDate(app.submittedAt)}</div>
              </div>
            )}
            {app.linkedEvals.length > 0 && (
              <button onClick={() => onOpenReport(app)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg,rgba(124,58,237,.1),rgba(147,51,234,.07))', color: '#7c3aed', border: '1px solid rgba(124,58,237,.2)', transition: 'all .15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(124,58,237,.18),rgba(147,51,234,.13))'; e.currentTarget.style.boxShadow = '0 3px 10px -2px rgba(124,58,237,.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(124,58,237,.1),rgba(147,51,234,.07))'; e.currentTarget.style.boxShadow = 'none'; }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Rapport IA
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 10, marginLeft: 52 }}>
          {app.linkedEvals.length === 0 && (app.juryAssigned || []).length === 0 && (
            <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>Aucun jury assigné</span>
          )}
          {app.linkedEvals.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {app.linkedEvals.map((ev, ji) => {
                const done       = ev.jurySubmitted || ev.status === 'submitted' || ev.status === 'completed';
                const inProgress = !done && ev.status === 'in_progress';
                const remKey     = `${ev.jurorId || ev.jurorName}-${app.id}`;
                const chipStyle  = done ? { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' } : inProgress ? { bg: '#fef9c3', color: '#a16207', border: '#fef08a' } : { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };

                return (
                  <div key={ji} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div onClick={() => onOpenEval(ev)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 600, background: chipStyle.bg, color: chipStyle.color, border: `1px solid ${chipStyle.border}`, transition: 'all .15s' }}>
                      {done ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : inProgress ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" strokeWidth={2} /></svg>
                      )}
                      <span>{ev.jurorName}</span>
                      {done && ev.totalScore > 0 && (
                        <span style={{ marginLeft: 2, fontFamily: 'monospace', fontWeight: 700, fontSize: 12, padding: '0 5px', borderRadius: 5, background: `${scoreClr(ev.totalScore)}22`, color: scoreClr(ev.totalScore) }}>{ev.totalScore}</span>
                      )}
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', opacity: .75, textTransform: 'uppercase' }}>
                        {done ? 'soumis' : inProgress ? 'en cours' : 'attente'}
                      </span>
                    </div>
                    {!done && (
                      <button disabled={!!reminderSending[remKey]} onClick={() => onRemind(ev.jurorId || ev.jurorName, ev.jurorName, app.id, app.startupName)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', fontSize: 10, fontWeight: 700, borderRadius: 8, cursor: reminderSending[remKey] ? 'default' : 'pointer', background: 'rgba(0,109,148,.08)', color: '#006d94', border: '1px solid rgba(0,109,148,.18)', opacity: reminderSending[remKey] ? .5 : 1, transition: 'all .15s' }}>
                        {reminderSending[remKey] ? (
                          <svg style={{ animation: 'spin .7s linear infinite' }} width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9" /></svg>
                        ) : (
                          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        )}
                        Rappeler
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {app.linkedEvals.length === 0 && (app.juryAssigned || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {app.juryAssigned.map((name, ji) => (
                <div key={ji} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" strokeWidth={2} /></svg>
                    {name}
                    <span style={{ fontSize: 9, fontWeight: 700, opacity: .7, textTransform: 'uppercase' }}>attente</span>
                  </span>
                  <button disabled={!!reminderSending[`${name}-${app.id}`]} onClick={() => onRemind(name, name, app.id, app.startupName)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', fontSize: 10, fontWeight: 700, borderRadius: 8, cursor: 'pointer', background: 'rgba(0,109,148,.08)', color: '#006d94', border: '1px solid rgba(0,109,148,.18)', transition: 'all .15s' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Rappeler
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {app.linkedEvals.length > 1 && (
        <div style={{ marginTop: 4, marginLeft: 16, paddingLeft: 16, borderLeft: '2px dashed rgba(0,109,148,.15)' }}>
          {app.linkedEvals.map(ev => (
            <EvalMiniRow key={ev.id} ev={ev} onOpen={() => onOpenEval(ev)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Eval Mini Row ────────────────────────────────────────────────────────────
function EvalMiniRow({ ev, onOpen }) {
  const done = ev.jurySubmitted || ev.status === 'completed' || ev.status === 'submitted';
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-all" onClick={onOpen}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: done ? '#10b981' : ev.status === 'in_progress' ? '#0ea5e9' : '#f59e0b' }} />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{ev.jurorName}</p>
        <span className="text-[10px] text-gray-400 font-light hidden sm:block">{fmtDate(ev.submittedAt)}</span>
      </div>
      {ev.totalScore > 0 && <span className="text-xs font-bold flex-shrink-0" style={{ color: scoreClr(ev.totalScore), fontFamily: 'monospace' }}>{ev.totalScore}/100</span>}
      <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${done ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : ev.status === 'in_progress' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
        {done ? 'SOUMIS' : ev.status === 'in_progress' ? 'EN COURS' : 'ATTENTE'}
      </span>
      <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

// ─── Eval Modal ───────────────────────────────────────────────────────────────
function EvalModal({ isOpen, evaluation, onClose, onSave, onGoToApplication }) {
  const [scores, setScores]     = useState(evaluation.scores || { team: 0, innovation: 0, market: 0, business: 0, traction: 0 });
  const [feedback, setFeedback] = useState(evaluation.feedback || '');
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState('scores');

  const totalScore = Math.round(CRITERIA.reduce((t, c) => t + (scores[c.id] || 0) * (c.weight / 100), 0));
  const sc = sectorColor(evaluation.sector);

  const handleSave = async (draft = false) => {
    setLoading(true);
    await onSave({ ...evaluation, scores, totalScore, feedback, status: draft ? 'in_progress' : 'completed', jurySubmitted: !draft });
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Évaluation — ${evaluation.startupName}`} size="xl">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg,${sc}cc,${sc})` }}>
          {evaluation.startupName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white">{evaluation.startupName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: sc }}>{evaluation.sector}</span>
            <span className="text-xs text-gray-400 font-light">Juré : <strong className="text-gray-600 dark:text-gray-300">{evaluation.jurorName}</strong></span>
            {evaluation.jurySubmitted && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 tracking-wider">SOUMIS</span>}
          </div>
        </div>
        <button onClick={onGoToApplication} className="text-xs font-semibold text-[#006d94] dark:text-sky-400 hover:underline flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Voir candidature
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-5 gap-0">
        {[['scores', 'Scores'], ['details', 'Détails'], ['feedback', 'Feedback']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors uppercase tracking-widest ${tab === id ? 'border-[#006d94] text-[#006d94] dark:border-sky-400 dark:text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'scores' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-slate-900/40">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Score total pondéré</span>
            <span className="text-5xl font-extrabold leading-none" style={{ color: scoreClr(totalScore), fontFamily: 'monospace' }}>{totalScore}</span>
            <span className="text-xs text-gray-400 mt-1 font-light">/100 · {scoreLabel(totalScore)}</span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {CRITERIA.map(c => (
              <div key={c.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-slate-800/30">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</span>
                    <span className="text-xs text-gray-400">({c.weight}%)</span>
                  </div>
                  <span className="font-bold text-base" style={{ color: c.color, fontFamily: 'monospace' }}>{scores[c.id] || 0}</span>
                </div>
                <input type="range" min="0" max="100" value={scores[c.id] || 0} style={{ accentColor: c.color }}
                  onChange={e => setScores(p => ({ ...p, [c.id]: parseInt(e.target.value) }))} className="w-full cursor-pointer" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span className="font-light">Pondération {c.weight}%</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300" style={{ fontFamily: 'monospace' }}>+{Math.round((scores[c.id] || 0) * c.weight / 100)} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'details' && (
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Startup', evaluation.startupName], ['Fondateur', evaluation.founder],
            ['Secteur', evaluation.sector], ['Stade', evaluation.stage],
            ['Programme', evaluation.programmeName], ['Évaluateur', evaluation.jurorName],
            ['Soumis le', fmtDate(evaluation.submittedAt)], ['Statut', evaluation.jurySubmitted ? 'Soumis' : evaluation.status],
          ].map(([l, v], i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40">
              <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-widest font-semibold">{l}</p>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{v || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'feedback' && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-widest">Feedback du jury</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={8}
            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 dark:bg-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006d94]/15 focus:border-[#006d94] resize-none font-light"
            placeholder="Observations et recommandations du jury…" />
          <p className="text-[10px] text-gray-400 mt-1" style={{ fontFamily: 'monospace' }}>{feedback.length} caractères</p>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400 font-light">En soumettant, le score sera synchronisé avec le dossier de candidature.</p>
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <button onClick={onClose} className="btn-ghost">Fermer</button>
        <div className="flex gap-2">
          <button onClick={() => handleSave(true)} disabled={loading} className="btn-ghost border-[#006d94]/30 text-[#006d94] dark:text-sky-400">
            {loading ? '…' : 'Brouillon'}
          </button>
          <button onClick={() => handleSave(false)} disabled={loading} className="btn-primary">
            {loading
              ? <><svg className="w-3.5 h-3.5 spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Traitement…</>
              : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Soumettre</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── App Report Modal ─────────────────────────────────────────────────────────
// Structure rapport attendue :
//   report.report.synthese_executive, synthese_feedbacks
//   report.report.tableau_comparatif[]  { critere, poids_pct, moyenne, ecart_max, consensus, scores_par_jure, interpretation }
//   report.report.analyse_jury          { jure_severe, jure_indulgent, fiabilite, convergences[], divergences[] }
//   report.report.forces[]              { titre, analyse }
//   report.report.axes_amelioration[]   { titre, analyse, action }
//   report.report.decision_finale       { recommandation, niveau_confiance, score_pondere, justification, conditions[], prochaines_etapes[] }

function AppReportModal({ isOpen, app, onClose, aiReportingApi }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [cached, setCached]         = useState(false);
  const [copied, setCopied]         = useState(false);

  const avgScore       = app.linkedEvals.length > 0
    ? Math.round(app.linkedEvals.reduce((s, e) => s + (e.totalScore || 0), 0) / app.linkedEvals.length)
    : 0;
  const submittedCount = app.linkedEvals.filter(e => e.jurySubmitted).length;
  const sc             = sectorColor(app.sector);

  const resolveAppId = () =>
    app.applicationId || app.linkedEvals?.find(e => e.applicationId)?.applicationId || null;

  useEffect(() => {
    if (!isOpen) return;
    const appId = resolveAppId();
    if (!appId) return;
    aiReportingApi.getReport(appId)
      .then(data => { setReportData(data.report); setCached(true); })
      .catch(() => {});
  }, [isOpen, app.applicationId]); // eslint-disable-line

  const generate = async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const appId = resolveAppId();
      if (!appId) { setError('ID de candidature manquant.'); return; }
      const data = await aiReportingApi.generate(appId, force);
      setReportData(data.report);
      setCached(data.cached);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de génération. Vérifiez qu'Ollama est démarré.");
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async () => {
    try {
      const appId = resolveAppId();
      if (appId) await aiReportingApi.deleteReport(appId);
      setReportData(null); setCached(false);
    } catch { setError('Erreur lors de la suppression'); }
  };

  const copyReport = () => {
    if (!reportData) return;
    const r  = reportData.report || {};
    const df = r.decision_finale || {};
    const lines = [
      `# Rapport IA — ${app.startupName}`,
      `Score pondéré : ${reportData.scorePondere}/100 | Recommandation : ${reportData.recommandation}`,
      '',
      '## Synthèse', r.synthese_executive || '',
      '',
      '## Points forts',
      ...(r.forces || []).map(f => `• ${f.titre} : ${f.analyse}`),
      '',
      "## Axes d'amélioration",
      ...(r.axes_amelioration || []).map(f => `• ${f.titre} : ${f.analyse} → ${f.action}`),
      '',
      '## Décision',
      `Recommandation : ${df.recommandation}`,
      `Confiance : ${df.niveau_confiance}`,
      df.justification || '',
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const r  = reportData?.report || null;
  const df = r?.decision_finale || null;

  const DECISION_COLOR  = { Selectionner: '#10b981', 'A surveiller': '#f59e0b', 'Non retenu': '#ef4444' };
  const FIABILITE_COLOR = { Eleve: '#10b981', Modere: '#f59e0b', Faible: '#ef4444' };

  const decisionColor   = DECISION_COLOR[df?.recommandation]        || '#6366f1';
  const confidenceColor = FIABILITE_COLOR[df?.niveau_confiance]     || '#94a3b8';
  const fiabiliteColor  = FIABILITE_COLOR[r?.analyse_jury?.fiabilite] || '#94a3b8';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <style>{`
        @keyframes ai-spin  { to { transform: rotate(360deg); } }
        @keyframes ai-fade  { from { opacity:0;transform:translateY(6px) } to { opacity:1;transform:none } }
        @keyframes ai-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .ai-spin { animation: ai-spin .8s linear infinite; }
        .ai-fade { animation: ai-fade .35s ease both; }
        .ai-dot  { animation: ai-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ width:42, height:42, borderRadius:13, flexShrink:0, background:`linear-gradient(135deg,${sc}cc,${sc})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13 }}>
          {app.startupName.slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{app.startupName}</span>
            <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, color:'#fff', background:sc }}>{app.sector}</span>
            {cached && reportData && (
              <span style={{ padding:'2px 8px', borderRadius:99, fontSize:9, fontWeight:700, background:'rgba(16,185,129,.1)', color:'#059669', border:'1px solid rgba(16,185,129,.2)' }}>RAPPORT EXISTANT</span>
            )}
          </div>
          <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{app.founder} · {app.programmeName}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:9, background:'linear-gradient(135deg,rgba(124,58,237,.1),rgba(147,51,234,.07))', border:'1px solid rgba(124,58,237,.18)' }}>
          <svg width="13" height="13" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span style={{ fontSize:11, fontWeight:700, color:'#7c3aed' }}>Rapport IA</span>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {[
          { label:'Jurés assignés', val: app.linkedEvals.length,                                  color:'#7c3aed' },
          { label:'Évals soumises', val:`${submittedCount}/${app.linkedEvals.length}`,             color:'#10b981' },
          { label:'Score moyen',   val: app.linkedEvals.length > 0 ? `${avgScore}/100` : '—',     color: scoreClr(avgScore) },
        ].map((s,i) => (
          <div key={i} style={{ padding:'10px 12px', borderRadius:10, background:`${s.color}0d`, border:`1px solid ${s.color}25`, textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>{s.label}</div>
            <div style={{ fontSize:15, fontWeight:800, color:s.color, fontFamily:'monospace' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)', marginBottom:14, fontSize:12, color:'#dc2626' }}>
          {error}
        </div>
      )}

      {/* Report area */}
      <div style={{ borderRadius:14, border:'1px solid', borderColor: r ? 'rgba(124,58,237,.15)' : 'rgba(0,0,0,.07)', background: r ? 'rgba(124,58,237,.015)' : 'rgba(248,250,252,.8)', minHeight:260, overflow:'hidden', transition:'all .3s' }}>

        {/* Empty state */}
        {!r && !loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', gap:12 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,rgba(124,58,237,.1),rgba(147,51,234,.06))', border:'1px solid rgba(124,58,237,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="22" height="22" fill="none" stroke="#7c3aed" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#374151', marginBottom:4 }}>Aucun rapport généré</p>
              <p style={{ fontSize:12, color:'#9ca3af', maxWidth:280, lineHeight:1.5 }}>
                Cliquez sur <strong style={{ color:'#7c3aed' }}>Générer</strong> pour produire une synthèse IA des évaluations jury.
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', gap:16 }}>
            <div style={{ position:'relative', width:44, height:44 }}>
              <svg className="ai-spin" width="44" height="44" fill="none" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" stroke="rgba(124,58,237,.15)" strokeWidth="3" />
                <path d="M22 4a18 18 0 0118 18" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            </div>
            <p style={{ fontWeight:700, fontSize:13, color:'#374151' }}>Ollama analyse les évaluations…</p>
            <div style={{ display:'flex', gap:5 }}>
              {[0,1,2].map(i => <div key={i} className="ai-dot" style={{ width:6, height:6, borderRadius:'50%', background:'#7c3aed', animationDelay:`${i*.2}s` }} />)}
            </div>
          </div>
        )}

        {/* Report content */}
        {r && !loading && (
          <div className="ai-fade" style={{ padding:'20px 22px', maxHeight:460, overflowY:'auto' }}>

            {/* Metadata */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, padding:'8px 12px', borderRadius:9, background:'rgba(0,0,0,.025)', flexWrap:'wrap' }}>
              <span style={{ fontSize:10, color:'#94a3b8' }}>Généré le {new Date(reportData.generatedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}</span>
              <span style={{ fontSize:10, color:'#cbd5e1' }}>·</span>
              <span style={{ fontSize:10, color:'#94a3b8' }}>Modèle : <strong style={{ color:'#64748b' }}>{reportData.model}</strong></span>
              <span style={{ fontSize:10, color:'#cbd5e1' }}>·</span>
              <span style={{ fontSize:10, color:'#94a3b8' }}>{reportData.juryCount} juré{reportData.juryCount > 1 ? 's' : ''}</span>
              <span style={{ fontSize:10, color:'#cbd5e1' }}>·</span>
              <span style={{ fontSize:10, color:'#94a3b8' }}>Score pondéré : <strong style={{ color: scoreClr(reportData.scorePondere), fontFamily:'monospace' }}>{reportData.scorePondere}/100</strong></span>
            </div>

            {/* Decision badge */}
            {df && (
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, padding:'12px 16px', borderRadius:12, background:`${decisionColor}0d`, border:`1px solid ${decisionColor}25` }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:decisionColor, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>Recommandation</div>
                  <div style={{ fontWeight:800, fontSize:15, color:decisionColor }}>{df.recommandation}</div>
                  {df.justification && <div style={{ fontSize:11, color:'#64748b', marginTop:4, lineHeight:1.5 }}>{df.justification}</div>}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>Confiance</div>
                  <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:`${confidenceColor}15`, color:confidenceColor }}>{df.niveau_confiance}</span>
                </div>
              </div>
            )}

            {/* Synthèse */}
            {r.synthese_executive && (
              <RSection title="Synthèse" icon={<svg width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
                <p style={{ fontSize:13, color:'#374151', lineHeight:1.7 }}>{r.synthese_executive}</p>
              </RSection>
            )}

            {/* Tableau comparatif */}
            {r.tableau_comparatif?.length > 0 && (
              <RSection title="Scores par critère" icon={<svg width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {r.tableau_comparatif.map((t, i) => (
                    <div key={i} style={{ padding:'10px 12px', borderRadius:10, background:'rgba(0,0,0,.02)', border:'1px solid rgba(0,0,0,.06)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:'#374151', width:130, flexShrink:0 }}>
                          {t.critere} <span style={{ color:'#94a3b8', fontWeight:400 }}>({t.poids_pct}%)</span>
                        </span>
                        <div style={{ flex:1, height:6, borderRadius:99, background:'#e2e8f0', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:99, background: t.moyenne >= 70 ? '#10b981' : t.moyenne >= 50 ? '#f59e0b' : '#ef4444', width:`${t.moyenne}%`, transition:'width .6s' }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:'#374151', fontFamily:'monospace', width:32, textAlign:'right' }}>{t.moyenne}</span>
                        {!t.consensus && (
                          <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:5, background:'rgba(245,158,11,.1)', color:'#d97706', whiteSpace:'nowrap' }}>DIVERGENCE</span>
                        )}
                      </div>
                      {t.scores_par_jure && Object.keys(t.scores_par_jure).length > 0 && (
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                          {Object.entries(t.scores_par_jure).map(([name, score]) => (
                            <span key={name} style={{ fontSize:10, padding:'1px 7px', borderRadius:5, background:'rgba(100,116,139,.08)', color:'#475569', fontFamily:'monospace' }}>
                              {name}: <strong>{score}</strong>
                            </span>
                          ))}
                          <span style={{ fontSize:10, color:'#94a3b8' }}>écart max: <strong style={{ color: t.ecart_max > 20 ? '#ef4444' : '#64748b' }}>{t.ecart_max} pts</strong></span>
                        </div>
                      )}
                      {t.interpretation && (
                        <p style={{ fontSize:11, color:'#64748b', lineHeight:1.5, margin:0, fontStyle:'italic' }}>{t.interpretation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </RSection>
            )}

            {/* Analyse jury */}
            {r.analyse_jury && (
              <RSection title="Analyse jury" icon={<svg width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                  {r.analyse_jury.jure_severe && (
                    <div style={{ padding:'8px 10px', borderRadius:9, background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.12)' }}>
                      <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>Juré le + sévère</div>
                      <div style={{ fontWeight:700, fontSize:12, color:'#dc2626' }}>{r.analyse_jury.jure_severe.nom}</div>
                      <div style={{ fontSize:11, color:'#ef4444', fontFamily:'monospace' }}>{r.analyse_jury.jure_severe.score}/100</div>
                    </div>
                  )}
                  {r.analyse_jury.jure_indulgent && (
                    <div style={{ padding:'8px 10px', borderRadius:9, background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.12)' }}>
                      <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>Juré le + indulgent</div>
                      <div style={{ fontWeight:700, fontSize:12, color:'#059669' }}>{r.analyse_jury.jure_indulgent.nom}</div>
                      <div style={{ fontSize:11, color:'#10b981', fontFamily:'monospace' }}>{r.analyse_jury.jure_indulgent.score}/100</div>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:11, color:'#64748b' }}>Fiabilité des évaluations :</span>
                  <span style={{ padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:`${fiabiliteColor}15`, color:fiabiliteColor }}>{r.analyse_jury.fiabilite}</span>
                </div>
                {r.analyse_jury.convergences?.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Convergences</div>
                    {r.analyse_jury.convergences.map((c, i) => (
                      <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start', marginBottom:4 }}>
                        <svg width="14" height="14" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:2 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {r.analyse_jury.divergences?.length > 0 && (
                  <div>
                    <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Divergences</div>
                    {r.analyse_jury.divergences.map((d, i) => (
                      <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start', marginBottom:4 }}>
                        <svg width="14" height="14" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:2 }}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{d}</span>
                      </div>
                    ))}
                  </div>
                )}
              </RSection>
            )}

            {/* Forces */}
            {r.forces?.length > 0 && (
              <RSection title="Points forts" icon={<svg width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {r.forces.map((f, i) => (
                    <div key={i} style={{ padding:'10px 12px', borderRadius:9, background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.15)' }}>
                      <div style={{ fontWeight:700, fontSize:12, color:'#065f46', marginBottom:3 }}>{f.titre}</div>
                      <div style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{f.analyse}</div>
                    </div>
                  ))}
                </div>
              </RSection>
            )}

            {/* Axes d'amélioration */}
            {r.axes_amelioration?.length > 0 && (
              <RSection title="Axes d'amélioration" icon={<svg width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {r.axes_amelioration.map((f, i) => (
                    <div key={i} style={{ padding:'10px 12px', borderRadius:9, background:'rgba(239,68,68,.04)', border:'1px solid rgba(239,68,68,.12)' }}>
                      <div style={{ fontWeight:700, fontSize:12, color:'#991b1b', marginBottom:3 }}>{f.titre}</div>
                      <div style={{ fontSize:12, color:'#374151', lineHeight:1.5, marginBottom: f.action ? 5 : 0 }}>{f.analyse}</div>
                      {f.action && (
                        <div style={{ display:'flex', gap:6, alignItems:'flex-start', marginTop:5, padding:'5px 8px', borderRadius:6, background:'rgba(239,68,68,.06)' }}>
                          <span style={{ fontSize:10, fontWeight:700, color:'#dc2626', flexShrink:0 }}>→</span>
                          <span style={{ fontSize:11, color:'#b91c1c', lineHeight:1.4 }}>{f.action}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </RSection>
            )}

            {/* Synthèse feedbacks */}
            {r.synthese_feedbacks && (
              <RSection title="Synthèse des feedbacks" icon={<svg width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}>
                <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, fontStyle:'italic' }}>"{r.synthese_feedbacks}"</p>
              </RSection>
            )}

            {/* Prochaines étapes */}
            {df && (df.conditions?.length > 0 || df.prochaines_etapes?.length > 0) && (
              <RSection title="Prochaines étapes" icon={<svg width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                {df.conditions?.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Points de vigilance</div>
                    {df.conditions.map((c, i) => (
                      <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start', marginBottom:4 }}>
                        <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(245,158,11,.12)', color:'#d97706', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{i+1}</span>
                        <span style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {df.prochaines_etapes?.length > 0 && (
                  <div>
                    <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Actions concrètes</div>
                    {df.prochaines_etapes.map((e, i) => (
                      <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start', marginBottom:4 }}>
                        <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(99,102,241,.12)', color:'#6366f1', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{i+1}</span>
                        <span style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{e}</span>
                      </div>
                    ))}
                  </div>
                )}
              </RSection>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      {r && (
        <div className="ai-fade" style={{ display:'flex', gap:8, marginTop:10, padding:'8px 12px', borderRadius:9, background:'rgba(124,58,237,.04)', border:'1px solid rgba(124,58,237,.1)' }}>
          <svg width="13" height="13" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24" style={{ marginTop:1, flexShrink:0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p style={{ fontSize:11, color:'#7c3aed', lineHeight:1.5 }}>
            Rapport généré localement via Ollama ({reportData?.model}). Vérifiez avant toute décision officielle.
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, paddingTop:16, borderTop:'1px solid rgba(0,0,0,.07)', marginTop:14 }}>
        <button onClick={onClose} className="btn-ghost">Fermer</button>
        <div style={{ display:'flex', gap:8 }}>
          {r && (
            <>
              <button onClick={deleteReport} className="btn-ghost" style={{ color:'#ef4444', borderColor:'rgba(239,68,68,.2)' }}>Supprimer</button>
              <button onClick={copyReport} className="btn-ghost" style={ copied ? { borderColor:'#10b981', color:'#10b981' } : {} }>
                {copied ? 'Copié' : 'Copier'}
              </button>
            </>
          )}
          <button
            onClick={() => generate(!!r)}
            disabled={loading || submittedCount === 0}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', fontSize:13, fontWeight:600, color:'#fff', borderRadius:10, border:'none', background: loading || submittedCount === 0 ? '#9ca3af' : 'linear-gradient(135deg,#7c3aed,#9333ea)', cursor: loading || submittedCount === 0 ? 'default' : 'pointer', boxShadow: loading || submittedCount === 0 ? 'none' : '0 4px 14px -3px rgba(124,58,237,.4)' }}>
            {loading
              ? <><svg className="ai-spin" width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity=".25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Génération…</>
              : <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>{r ? 'Regénérer' : 'Générer'}</>
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Section helper ───────────────────────────────────────────────────────────
function RSection({ title, icon, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        {icon}
        <span style={{ fontSize:11, fontWeight:800, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}