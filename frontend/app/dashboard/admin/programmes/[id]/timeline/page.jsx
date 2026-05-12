'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ─── Types d'étapes ───────────────────────────────────────────
const STEP_TYPES = {
  SUBMISSION: 'submission',
  REVIEW:     'review',
  INTERVIEW:  'interview',
  JURY:       'jury',
  DECISION:   'decision',
  ONBOARDING: 'onboarding',
  CUSTOM:     'custom',
};

const STEP_TYPE_CONFIG = {
  submission: { label: 'Dépôt candidature',   color: 'blue'    },
  review:     { label: 'Évaluation',           color: 'amber'   },
  interview:  { label: 'Entretien',            color: 'purple'  },
  jury:       { label: 'Passage devant jury',  color: 'indigo'  },
  decision:   { label: 'Décision finale',      color: 'emerald' },
  onboarding: { label: 'Onboarding',           color: 'teal'    },
  custom:     { label: 'Personnalisée',        color: 'gray'    },
};

// ─── localStorage pour les timelines ─────────────────────────
const TIMELINES_KEY = 'admin_timelines';
const loadTimelines  = () => { try { return JSON.parse(localStorage.getItem(TIMELINES_KEY) || '{}'); } catch { return {}; } };
const saveTimelines  = (d) => { try { localStorage.setItem(TIMELINES_KEY, JSON.stringify(d)); } catch {} };

// ─── Icônes ──────────────────────────────────────────────────
const Icons = {
  plus:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>,
  edit:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  delete: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  back:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>,
  detail: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
};

// ─── Couleurs des étapes ──────────────────────────────────────
const getStepColorClass = (type) => {
  const colorMap = {
    blue:    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber:   'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    purple:  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    indigo:  'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    teal:    'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    gray:    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };
  const config = STEP_TYPE_CONFIG[type] || STEP_TYPE_CONFIG.custom;
  return colorMap[config.color] || colorMap.gray;
};

// ─── Template par défaut ──────────────────────────────────────
const buildDefaultTemplate = (progId, progTitre) => ({
  id:          `template-${progId}`,
  programmeId: progId,
  name:        `Timeline - ${progTitre || 'Programme'}`,
  steps: [
    { id: 'step-1', order: 1, type: 'submission', label: 'Dépôt dossier',   defaultDuration: 7,  description: 'Dépôt complet du dossier de candidature' },
    { id: 'step-2', order: 2, type: 'review',     label: 'Pré-sélection',   defaultDuration: 14, description: 'Évaluation par équipe' },
    { id: 'step-3', order: 3, type: 'interview',  label: 'Entretien',       defaultDuration: 5,  description: 'Entretien avec experts' },
    { id: 'step-4', order: 4, type: 'jury',       label: 'Passage jury',    defaultDuration: 7,  description: 'Présentation devant comité' },
    { id: 'step-5', order: 5, type: 'decision',   label: 'Décision finale', defaultDuration: 3,  description: 'Notification de la décision' },
  ],
});

// ─── Timeline initiale pour un candidat ──────────────────────
const buildAppTimeline = (progId, steps, submittedAt) => ({
  programmeId: progId,
  currentStep: steps[0]?.id,
  steps: steps.map((s, i) => ({
    stepId:      s.id,
    status:      i === 0 ? 'in_progress' : 'pending',
    startedAt:   i === 0 ? (submittedAt || new Date().toISOString().split('T')[0]) : null,
    completedAt: null,
    dueDate:     null,
  })),
});

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function ProgrammeTimelinePage() {
  const params          = useParams();
  const router          = useRouter();
  const progId          = params?.id;
  const { accessToken } = useSelector(s => s.auth);

  const [loading,              setLoading]              = useState(true);
  const [programme,            setProgramme]            = useState(null);
  const [timelineTemplate,     setTimelineTemplate]     = useState(null);
  const [applications,         setApplications]         = useState([]);
  const [applicationsTimeline, setApplicationsTimeline] = useState({});
  const [alert,                setAlert]                = useState({ show: false, type: '', message: '' });

  const [isAddStepModalOpen,     setIsAddStepModalOpen]     = useState(false);
  const [isEditModalOpen,        setIsEditModalOpen]        = useState(false);
  const [editingStep,            setEditingStep]            = useState(null);
  const [selectedApp,            setSelectedApp]            = useState(null);
  const [isAppTimelineModalOpen, setIsAppTimelineModalOpen] = useState(false);

  const [newStep, setNewStep] = useState({ type: 'custom', label: '', defaultDuration: 7, description: '' });

  // ══════════════════════════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!progId || !accessToken) return;
    setLoading(true);

    const load = async () => {
      try {
        const { data } = await axiosAuth.get(`/api/admin/programmes/${progId}`);
        const prog = data.programme;
        setProgramme({ ...prog, id: prog._id });

        // ✅ FIX : normaliser les candidatures depuis le bon champ
        // Le controller corrigé renvoie :
        //   data.candidaturesDetail → tableau [{id, startup, founder, status, submittedAt}]
        //   data.applications       → alias du même tableau
        //   data.candidatures       → NUMBER (compteur) — ne pas .map() dessus !
        let apps = [];

        if (Array.isArray(data.candidaturesDetail) && data.candidaturesDetail.length > 0) {
          // Nouveau format — controller corrigé
          apps = data.candidaturesDetail.map(c => ({
            id:          String(c.id || c._id),
            startupName: c.startup     || c.startupName || '—',
            founder:     c.founder     || '—',
            status:      c.status      || 'pending',
            submittedAt: c.submittedAt || new Date().toISOString().split('T')[0],
          }));

        } else if (Array.isArray(data.applications) && data.applications.length > 0) {
          // Alias du controller
          apps = data.applications.map(c => ({
            id:          String(c.id || c._id),
            startupName: c.startup     || c.startupName || '—',
            founder:     c.founder     || '—',
            status:      c.status      || 'pending',
            submittedAt: c.submittedAt || new Date().toISOString().split('T')[0],
          }));

        } else if (Array.isArray(data.candidatures)) {
          // Ancien format — tableau d'objets User (fallback)
          apps = data.candidatures.map(c => {
            const appDoc = (c.applications || []).find(
              a => String(a.programmeId) === String(progId)
            );
            return {
              id:          String(c._id),
              startupName: c.startupProfile?.startupName || c.startupName || c.name || '—',
              founder:     c.name || c.founderName || '—',
              status:      appDoc?.status || c.status || 'pending',
              submittedAt: appDoc?.submittedAt || c.createdAt || new Date().toISOString().split('T')[0],
            };
          });
        }
        // Si data.candidatures est un NUMBER → apps reste [] (pas d'erreur)

        setApplications(apps);

        // Charge/initialise le template de timeline (localStorage)
        const allTimelines = loadTimelines();
        const templateKey  = `template_${progId}`;

        let template = allTimelines[templateKey];
        if (!template) {
          template = buildDefaultTemplate(progId, prog.titre);
          allTimelines[templateKey] = template;
        }
        setTimelineTemplate(template);

        // Charge/initialise les timelines par candidat (localStorage)
        const appTimelines = {};
        apps.forEach(app => {
          const appKey = `app_${progId}_${app.id}`;
          if (allTimelines[appKey]) {
            appTimelines[app.id] = allTimelines[appKey];
          } else {
            appTimelines[app.id] = buildAppTimeline(progId, template.steps, app.submittedAt);
            allTimelines[appKey] = appTimelines[app.id];
          }
        });

        saveTimelines(allTimelines);
        setApplicationsTimeline(appTimelines);

      } catch (err) {
        console.error('[TimelinePage] erreur API:', err);
        notify('error', 'Impossible de charger le programme.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [progId, accessToken]);

  const notify = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  const persistTemplate = (tmpl) => {
    const all = loadTimelines();
    all[`template_${progId}`] = tmpl;
    saveTimelines(all);
  };

  const persistAppTimeline = (appId, tl) => {
    const all = loadTimelines();
    all[`app_${progId}_${appId}`] = tl;
    saveTimelines(all);
  };

  // ─── CRUD étapes du template ──────────────────────────────
  const handleAddStep = () => {
    if (!newStep.label.trim()) { notify('error', 'Le nom de l\'étape est requis'); return; }
    const step = {
      id:              `step-${Date.now()}`,
      order:           (timelineTemplate?.steps?.length || 0) + 1,
      type:            newStep.type,
      label:           newStep.label,
      defaultDuration: newStep.defaultDuration,
      description:     newStep.description,
    };
    const updated = { ...timelineTemplate, steps: [...(timelineTemplate?.steps || []), step] };
    setTimelineTemplate(updated);
    persistTemplate(updated);
    setIsAddStepModalOpen(false);
    setNewStep({ type: 'custom', label: '', defaultDuration: 7, description: '' });
    notify('success', 'Étape ajoutée.');
  };

  const handleUpdateStep = (stepId, updates) => {
    const updated = {
      ...timelineTemplate,
      steps: timelineTemplate.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
    };
    setTimelineTemplate(updated);
    persistTemplate(updated);
    notify('success', 'Étape mise à jour.');
  };

  const handleDeleteStep = (stepId) => {
    const updated = {
      ...timelineTemplate,
      steps: timelineTemplate.steps
        .filter(s => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i + 1 })),
    };
    setTimelineTemplate(updated);
    persistTemplate(updated);
    notify('success', 'Étape supprimée.');
  };

  const handleBulkApply = () => {
    const all    = loadTimelines();
    const newTls = { ...applicationsTimeline };
    applications.forEach(app => {
      const tl = buildAppTimeline(progId, timelineTemplate?.steps || [], app.submittedAt);
      newTls[app.id]                    = tl;
      all[`app_${progId}_${app.id}`]    = tl;
    });
    saveTimelines(all);
    setApplicationsTimeline(newTls);
    notify('success', 'Timeline appliqué à toutes les candidatures.');
  };

  const handleUpdateCandidateStep = (appId, stepId, updates) => {
    setApplicationsTimeline(prev => {
      const updated = {
        ...prev,
        [appId]: {
          ...prev[appId],
          steps: prev[appId].steps.map(s => s.stepId === stepId ? { ...s, ...updates } : s),
        },
      };
      persistAppTimeline(appId, updated[appId]);
      return updated;
    });
    notify('success', 'Progression mise à jour.');
  };

  // ─── Guards ───────────────────────────────────────────────
  if (loading) return (
    <ProtectedRoute allowedRoles={['admin']}><DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout></ProtectedRoute>
  );

  if (!programme) return (
    <ProtectedRoute allowedRoles={['admin']}><DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Programme introuvable</h2>
        <button onClick={() => router.push('/dashboard/admin/programmes')}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all">
          ← Retour aux programmes
        </button>
      </div>
    </DashboardLayout></ProtectedRoute>
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6 min-h-screen pb-10">

          {/* Header */}
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => router.push('/dashboard/admin/programmes')}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
              {Icons.back}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Timeline — {programme.titre}
                </h1>
                <button onClick={() => router.push(`/dashboard/admin/programmes/${progId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 transition-colors border border-primary-200 dark:border-primary-800">
                  {Icons.detail} Voir les détails
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {timelineTemplate?.steps?.length || 0} étape(s) · {applications.length} candidature(s)
              </p>
            </div>
          </div>

          {/* Alert */}
          {alert.show && (
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ show: false })} />
          )}

          {/* Deux colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Colonne 1 : Template ── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Processus de sélection</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Étapes par défaut pour toutes les candidatures</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleBulkApply}
                    className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                    Appliquer à tous
                  </button>
                  <button onClick={() => setIsAddStepModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1">
                    {Icons.plus} Ajouter
                  </button>
                </div>
              </div>

              <div className="p-5">
                {!timelineTemplate?.steps?.length ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">Aucune étape définie</p>
                    <button onClick={() => setIsAddStepModalOpen(true)} className="mt-3 text-primary-600 text-sm font-medium">
                      + Ajouter une première étape
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-4">
                      {timelineTemplate.steps.map(step => (
                        <div key={step.id} className="relative ml-12">
                          <div className={`absolute -left-9 w-8 h-8 rounded-full ${getStepColorClass(step.type)} border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold`}>
                            {step.order}
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{step.label}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStepColorClass(step.type)}`}>
                                    {STEP_TYPE_CONFIG[step.type]?.label}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                                <p className="text-xs text-gray-400 mt-1">Durée estimée : <span className="font-medium">{step.defaultDuration} jours</span></p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <button onClick={() => { setEditingStep({ ...step }); setIsEditModalOpen(true); }}
                                  className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition-colors">
                                  {Icons.edit}
                                </button>
                                <button onClick={() => handleDeleteStep(step.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                                  {Icons.delete}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Colonne 2 : Candidatures ── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Candidatures en cours</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Suivi individuel — cliquez pour gérer</p>
              </div>

              <div className="p-5 space-y-3">
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm font-medium">Aucune candidature pour ce programme</p>
                    <p className="text-xs mt-1">Les candidatures apparaîtront ici une fois soumises.</p>
                  </div>
                ) : (
                  applications.map(app => {
                    const tl             = applicationsTimeline[app.id];
                    const completedSteps = tl?.steps.filter(s => s.status === 'completed').length || 0;
                    const totalSteps     = tl?.steps.length || 1;
                    const progress       = Math.round((completedSteps / totalSteps) * 100);
                    const currentStepDef = timelineTemplate?.steps.find(s => s.id === tl?.currentStep);

                    return (
                      <div key={app.id}
                        className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer"
                        onClick={() => { setSelectedApp(app); setIsAppTimelineModalOpen(true); }}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{app.startupName}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{app.founder}</p>
                            {currentStepDef && (
                              <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${getStepColorClass(currentStepDef.type)}`}>
                                Étape en cours : {currentStepDef.label}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400">Progression</span>
                            <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{progress}%</p>
                            <p className="text-xs text-gray-400">{completedSteps}/{totalSteps} étapes</p>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                          {tl?.steps.map(step => (
                            <div key={step.stepId}
                              className={`flex-1 h-1.5 rounded-full transition-colors ${
                                step.status === 'completed'  ? 'bg-emerald-500' :
                                step.status === 'in_progress'? 'bg-amber-500'   :
                                'bg-gray-200 dark:bg-gray-700'
                              }`} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal ajout étape ── */}
        <Modal isOpen={isAddStepModalOpen} onClose={() => setIsAddStepModalOpen(false)} title="Ajouter une étape" size="md">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Type d'étape</label>
              <select value={newStep.type} onChange={e => setNewStep({ ...newStep, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                {Object.entries(STEP_TYPE_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Nom *</label>
              <input type="text" value={newStep.label} onChange={e => setNewStep({ ...newStep, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="ex : Validation finale" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Durée (jours)</label>
              <input type="number" min="1" value={newStep.defaultDuration}
                onChange={e => setNewStep({ ...newStep, defaultDuration: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Description</label>
              <textarea value={newStep.description} onChange={e => setNewStep({ ...newStep, description: e.target.value })}
                rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setIsAddStepModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Annuler
              </button>
              <button onClick={handleAddStep}
                className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                Ajouter
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Modal édition étape ── */}
        {editingStep && (
          <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier l'étape" size="md">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Nom</label>
                <input type="text" value={editingStep.label} onChange={e => setEditingStep({ ...editingStep, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Type</label>
                <select value={editingStep.type} onChange={e => setEditingStep({ ...editingStep, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  {Object.entries(STEP_TYPE_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Durée (jours)</label>
                <input type="number" min="1" value={editingStep.defaultDuration}
                  onChange={e => setEditingStep({ ...editingStep, defaultDuration: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Description</label>
                <textarea value={editingStep.description} onChange={e => setEditingStep({ ...editingStep, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  Annuler
                </button>
                <button onClick={() => { handleUpdateStep(editingStep.id, editingStep); setIsEditModalOpen(false); }}
                  className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                  Enregistrer
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Modal timeline candidat ── */}
        {selectedApp && (
          <ApplicationTimelineModal
            isOpen={isAppTimelineModalOpen}
            onClose={() => setIsAppTimelineModalOpen(false)}
            application={selectedApp}
            timeline={applicationsTimeline[selectedApp.id]}
            templateSteps={timelineTemplate?.steps || []}
            onUpdateStep={(stepId, updates) => handleUpdateCandidateStep(selectedApp.id, stepId, updates)}
          />
        )}

      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Modal timeline d'un candidat ────────────────────────────
function ApplicationTimelineModal({ isOpen, onClose, application, timeline, templateSteps, onUpdateStep }) {
  const [selectedStep,    setSelectedStep]    = useState(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  const getStepDef = (stepId) => templateSteps.find(s => s.id === stepId);

  const EditIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Timeline — ${application.startupName}`} size="lg">
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-500">Fondateur</p>
            <p className="font-semibold text-gray-900 dark:text-white">{application.founder}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Candidature déposée le</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('fr-FR') : '—'}
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            {(timeline?.steps || []).map(step => {
              const stepDef      = getStepDef(step.stepId);
              if (!stepDef) return null;
              const isCompleted  = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              const isOverdue    = step.dueDate && new Date(step.dueDate) < new Date() && !isCompleted;

              return (
                <div key={step.stepId} className="relative ml-12">
                  <div className={`absolute -left-9 w-8 h-8 rounded-full ${getStepColorClass(stepDef.type)} border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold ${isCompleted ? 'ring-2 ring-emerald-400' : ''}`}>
                    {isCompleted ? '✓' : stepDef.order}
                  </div>
                  <div className={`rounded-xl p-4 ${
                    isCompleted  ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800' :
                    isInProgress ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800' :
                    'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700'
                  } ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{stepDef.label}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStepColorClass(stepDef.type)}`}>
                            {STEP_TYPE_CONFIG[stepDef.type]?.label}
                          </span>
                          {isOverdue && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold">
                              En retard
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{stepDef.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs">
                          {step.startedAt   && <span className="text-gray-500">Début : {new Date(step.startedAt).toLocaleDateString('fr-FR')}</span>}
                          {step.completedAt && <span className="text-emerald-600 dark:text-emerald-400 font-medium">Terminé : {new Date(step.completedAt).toLocaleDateString('fr-FR')}</span>}
                          {step.dueDate && !step.completedAt && (
                            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                              Date limite : {new Date(step.dueDate).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-3">
                        {!isCompleted && !isInProgress && (
                          <button onClick={() => onUpdateStep(step.stepId, { status: 'in_progress', startedAt: new Date().toISOString().split('T')[0] })}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors">
                            Démarrer
                          </button>
                        )}
                        {isInProgress && (
                          <button onClick={() => onUpdateStep(step.stepId, { status: 'completed', completedAt: new Date().toISOString().split('T')[0] })}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors">
                            Terminer
                          </button>
                        )}
                        <button onClick={() => { setSelectedStep(step); setIsDateModalOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition-colors">
                          {EditIcon}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal date limite */}
      {selectedStep && (
        <Modal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} title="Modifier la date limite" size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">Date limite</label>
              <input type="date" value={selectedStep.dueDate || ''}
                onChange={e => {
                  onUpdateStep(selectedStep.stepId, { dueDate: e.target.value });
                  setSelectedStep({ ...selectedStep, dueDate: e.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div className="flex justify-end">
              <button onClick={() => setIsDateModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}