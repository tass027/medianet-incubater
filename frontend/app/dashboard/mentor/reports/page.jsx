'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import Link from 'next/link';
import useMentorStartups from '@/app/hooks/useMentorStartups';
import useMentorReports from '@/app/hooks/useMentorReports';

const Icons = {
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ChevronDown: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

const MILESTONES = [
  { label: 'MVP validé',               key: 'mvp'         },
  { label: 'Premier client signé',     key: 'first_client' },
  { label: 'Équipe constituée',        key: 'team'        },
  { label: 'Business plan finalisé',   key: 'biz_plan'    },
  { label: 'Prototype fonctionnel',    key: 'prototype'   },
  { label: 'Financement obtenu',       key: 'funding'     },
];

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const now = new Date();

export default function MentorReportsPage() {
  const [mounted,    setMounted]    = useState(false);
  const [selectedStartup, setSelectedStartup] = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);

  const { startups, loading: loadingStartups } = useMentorStartups();
  const { reports, loading, error, submitReport } = useMentorReports(selectedStartup || null);

  const [form, setForm] = useState({
    startupId:       '',
    month:           now.getMonth() + 1,
    year:            now.getFullYear(),
    milestones:      MILESTONES.map((m) => ({ label: m.label, achieved: false, note: '' })),
    axes:            { product: '', team: '', market: '', finance: '' },
    overallProgress: 50,
    recommendations: '',
    status:          'draft',
  });

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const setAxis = (axis) => (e) =>
    setForm((prev) => ({ ...prev, axes: { ...prev.axes, [axis]: e.target.value } }));

  const toggleMilestone = (index) =>
    setForm((prev) => {
      const m = [...prev.milestones];
      m[index] = { ...m[index], achieved: !m[index].achieved };
      return { ...prev, milestones: m };
    });

  const setMilestoneNote = (index, note) =>
    setForm((prev) => {
      const m = [...prev.milestones];
      m[index] = { ...m[index], note };
      return { ...prev, milestones: m };
    });

  const handleSubmit = async (status) => {
    if (!form.startupId) return alert('Sélectionnez une startup');
    setSubmitting(true);
    try {
      await submitReport({ ...form, status });
      setSuccess(true);
      setShowForm(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
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
          }
          :global(.dark) .glass-card { background: #1e293b; border: 1px solid #334155; }
          .input-base {
            width: 100%;
            padding: 0.625rem 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            transition: all 0.2s;
            background: white;
            color: #111827;
          }
          :global(.dark) .input-base { border-color: #374151; background: #1f2937; color: #f9fafb; }
          .input-base:focus { outline: none; border-color: #006d94; box-shadow: 0 0 0 3px rgba(0,109,148,0.15); }
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
                <Button
                  variant="primary"
                  className="!bg-white !text-[#006d94]"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? 'Fermer le formulaire' : '+ Nouveau rapport'}
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-white">Rapports de progression</h1>
              <p className="text-blue-100 mt-1">Documentez l'avancement mensuel de vos startups</p>
            </div>
          </div>

          {success && (
            <div className="glass-card rounded-xl p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
              <Icons.Check className="w-5 h-5" />
              Rapport enregistré avec succès
            </div>
          )}

          {/* New Report Form */}
          {showForm && (
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Nouveau rapport mensuel</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Startup</label>
                  <select
                    value={form.startupId}
                    onChange={(e) => setForm((prev) => ({ ...prev, startupId: e.target.value }))}
                    className="input-base"
                    disabled={loadingStartups}
                  >
                    <option value="">Sélectionner…</option>
                    {startups.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mois</label>
                  <select value={form.month} onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))} className="input-base">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Année</label>
                  <select value={form.year} onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))} className="input-base">
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Milestones */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Jalons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {form.milestones.map((m, i) => (
                    <div key={m.label} className={`p-3 rounded-xl border transition-all ${
                      m.achieved
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={m.achieved}
                          onChange={() => toggleMilestone(i)}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        <span className={`text-sm font-medium ${m.achieved ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {m.label}
                        </span>
                      </label>
                      {m.achieved && (
                        <input
                          type="text"
                          placeholder="Note optionnelle…"
                          value={m.note}
                          onChange={(e) => setMilestoneNote(i, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-gray-900/50 text-gray-700 dark:text-gray-300"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Axes */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Analyse par axe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'product', label: 'Produit', color: 'blue' },
                    { key: 'team',    label: 'Équipe',  color: 'purple' },
                    { key: 'market',  label: 'Marché',  color: 'emerald' },
                    { key: 'finance', label: 'Finance', color: 'amber' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                      <textarea
                        value={form.axes[key]}
                        onChange={setAxis(key)}
                        rows={3}
                        placeholder={`Observations sur l'axe ${label.toLowerCase()}…`}
                        className="input-base resize-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Progression globale : <span className="text-[#006d94]">{form.overallProgress}%</span>
                </label>
                <input
                  type="range" min="0" max="100" step="5"
                  value={form.overallProgress}
                  onChange={(e) => setForm((prev) => ({ ...prev, overallProgress: Number(e.target.value) }))}
                  className="w-full accent-[#006d94]"
                />
              </div>

              {/* Recommendations */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Recommandations & prochaines étapes
                </label>
                <textarea
                  value={form.recommendations}
                  onChange={(e) => setForm((prev) => ({ ...prev, recommendations: e.target.value }))}
                  rows={4}
                  placeholder="Actions recommandées pour le mois suivant…"
                  className="input-base resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={submitting}>
                  Enregistrer brouillon
                </Button>
                <Button variant="primary" onClick={() => handleSubmit('submitted')} disabled={submitting}>
                  {submitting ? 'Envoi…' : 'Soumettre le rapport'}
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={selectedStartup}
              onChange={(e) => setSelectedStartup(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="">Toutes les startups</option>
              {startups.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="glass-card rounded-xl p-8 text-center text-red-500">{error}</div>
          ) : reports.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-gray-400">
              <p>Aucun rapport trouvé. Créez votre premier rapport de progression.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const startupName = report.startupId?.projectName
                  || report.startupId?.companyName
                  || 'Startup';
                const achievedCount = report.milestones.filter((m) => m.achieved).length;
                return (
                  <div key={report._id} className="glass-card rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{startupName}</p>
                        <p className="text-sm text-gray-500">
                          {MONTHS[report.period.month - 1]} {report.period.year}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={report.status === 'submitted' ? 'success' : 'warning'} size="sm">
                          {report.status === 'submitted' ? 'Soumis' : 'Brouillon'}
                        </Badge>
                        <span className="text-lg font-bold text-[#006d94]">{report.overallProgress}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-[#00526e] to-[#0088ba] rounded-full transition-all duration-500"
                        style={{ width: `${report.overallProgress}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{achievedCount}/{report.milestones.length} jalons atteints</span>
                      {report.recommendations && (
                        <span className="truncate max-w-xs">{report.recommendations}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}