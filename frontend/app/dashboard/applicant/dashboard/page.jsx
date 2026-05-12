'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ===================================================
// ICONS
// ===================================================
const Icons = {
  Rocket: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Document: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendingUp: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
  Users: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

// ===================================================
// MAIN COMPONENT
// ===================================================
export default function ApplicantDashboard() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [hasApplication, setHasApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [stats, setStats] = useState({
    completionRate: 0,
    documentsUploaded: 0,
    daysRemaining: 0,
    lastActivity: null
  });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Vérifier si l'utilisateur a déjà une candidature
    const checkApplication = async () => {
      // Ici on fera l'appel API plus tard
      setHasApplication(false);
    };
    checkApplication();
    
    return () => clearInterval(timer);
  }, []);

  const handleStartApplication = () => {
    router.push('/dashboard/applicant/apply');
  };

  const handleContinueApplication = () => {
    router.push('/dashboard/applicant/apply');
  };

  const handleViewStatus = () => {
    router.push('/dashboard/applicant/status');
  };

  const steps = [
    { id: 1, label: 'Informations personnelles', completed: false, icon: '👤' },
    { id: 2, label: 'Informations startup', completed: false, icon: '🚀' },
    { id: 3, label: 'Modèle économique', completed: false, icon: '💼' },
    { id: 4, label: 'Traction & Métriques', completed: false, icon: '📈' },
    { id: 5, label: 'Documents', completed: false, icon: '📄' },
  ];

  const recentActivities = [
    { id: 1, action: 'Création de compte', date: '2026-03-26T10:30:00', type: 'success' },
    { id: 2, action: 'Vérification email envoyée', date: '2026-03-26T10:31:00', type: 'info' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['applicant']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { font-family: 'Inter', sans-serif; }

          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }

          .animate-slide-in-up { animation: slideInUp 0.5s ease-out forwards; }
          .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }

          .glass-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
          }
          :global(.dark) .glass-card {
            background: #1e293b;
            border: 1px solid #334155;
          }
          .glass-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -12px rgba(0,0,0,0.15);
          }
          .dark-glass {
            background: linear-gradient(135deg, rgba(0,82,110,0.95), rgba(0,109,148,0.95));
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .step-indicator {
            transition: all 0.3s ease;
          }
          .step-indicator.completed {
            background: #10b981;
            border-color: #10b981;
          }
          .step-indicator.current {
            background: #f59e0b;
            border-color: #f59e0b;
            animation: pulse-ring 2s infinite;
          }

          :global(.dark) .text-gray-900 { color: #f1f5f9; }
          :global(.dark) .text-gray-700 { color: #cbd5e1; }
          :global(.dark) .text-gray-600 { color: #94a3b8; }
          :global(.dark) .bg-gray-50 { background-color: #0f172a; }
          :global(.dark) .bg-white { background-color: #1e293b; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide">
                    ESPACE CANDIDAT
                  </div>
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/80">Prêt à postuler</span>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  Bienvenue, {user?.name?.split(' ')[0] || 'Candidat'}
                </h1>
                <p className="text-blue-100 text-base lg:text-lg max-w-2xl">
                  Complétez votre dossier pour rejoindre le programme d'incubation MEDIANET
                </p>
                <div className="flex items-center gap-4 text-blue-100 mt-4">
                  <div className="flex items-center gap-2">
                    <Icons.Clock className="w-4 h-4 text-blue-200" />
                    <span className="mono text-sm">
                      {mounted && time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-blue-400/30"></div>
                  <span className="text-sm">
                    {mounted && time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* User Card */}
              <div className="dark-glass rounded-xl p-4 min-w-[260px]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'AP'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user?.name || 'Candidat'}</p>
                    <p className="text-blue-200 text-xs mono">CANDIDAT</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-8 h-1 bg-blue-400 rounded-full"></div>
                      <div className="w-4 h-1 bg-cyan-400 rounded-full"></div>
                      <div className="w-2 h-1 bg-yellow-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS CARDS ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-5 animate-scale-in dark:!bg-[#1e293b] group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Document className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Taux de complétion</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0%</p>
              <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 animate-scale-in dark:!bg-[#1e293b] group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Documents soumis</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">0/5</p>
              <p className="text-xs text-gray-400 mt-1">Business plan, pitch deck, etc.</p>
            </div>

            <div className="glass-card rounded-xl p-5 animate-scale-in dark:!bg-[#1e293b] group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Date limite</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">30 jours</p>
              <p className="text-xs text-gray-400 mt-1">Avant la clôture</p>
            </div>

            <div className="glass-card rounded-xl p-5 animate-scale-in dark:!bg-[#1e293b] group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Statut</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Non commencé</p>
              <p className="text-xs text-gray-400 mt-1">Commencez votre candidature</p>
            </div>
          </div>

          {/* ── MAIN ACTION CARD ────────────────────────────────────────── */}
          {!hasApplication ? (
            <div className="glass-card rounded-xl p-8 animate-scale-in text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Icons.Rocket className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Commencez votre candidature
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Rejoignez le programme d'incubation MEDIANET. Complétez votre dossier en 5 étapes simples.
              </p>
              <button
                onClick={handleStartApplication}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Démarrer ma candidature
                <Icons.ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-8 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Votre candidature</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Continue où tu t'étais arrêté</p>
                </div>
                <Badge variant="warning">En cours</Badge>
              </div>

              {/* Progress Steps */}
              <div className="mb-6">
                <div className="flex justify-between mb-4">
                  {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                        step.completed ? 'step-indicator completed text-white' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                      }`}>
                        {step.completed ? '✓' : step.id}
                      </div>
                      <span className="text-xs text-gray-500 mt-1 hidden sm:block">{step.label}</span>
                    </div>
                  ))}
                </div>
                <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                  <div className="absolute h-full bg-primary-500 rounded-full transition-all" style={{ width: '0%' }}></div>
                </div>
              </div>

              <button
                onClick={handleContinueApplication}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Continuer ma candidature
              </button>
            </div>
          )}

          {/* ── RECENT ACTIVITIES ───────────────────────────────────────── */}
          <div className="glass-card rounded-xl overflow-hidden animate-scale-in dark:!bg-[#1e293b]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Activités récentes</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Historique de vos actions</p>
            </div>
            <div className="p-6">
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {activity.type === 'success' ? (
                          <Icons.Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Icons.Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Icons.Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune activité récente</p>
                  <p className="text-sm">Commencez votre candidature pour voir vos actions</p>
                </div>
              )}
            </div>
          </div>

          {/* ── QUICK LINKS ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/applicant/apply" className="glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icons.Document className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Formulaire de candidature</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Complétez votre dossier</p>
              </div>
              <Icons.ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-primary-500 transition-colors" />
            </Link>

            <Link href="/dashboard/applicant/status" className="glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icons.TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Suivi de candidature</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">État d'avancement</p>
              </div>
              <Icons.ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-primary-500 transition-colors" />
            </Link>

            <Link href="/dashboard/applicant/settings" className="glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icons.Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Mon profil</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gérer mes informations</p>
              </div>
              <Icons.ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-primary-500 transition-colors" />
            </Link>
          </div>

          {/* Footer Support */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Besoin d'aide ?</h3>
                  <p className="text-white/60 text-sm">Notre équipe est à votre disposition</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-xl mono">24/7</p>
                  <p className="text-white/60 text-xs">Support disponible</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl mono">~48h</p>
                  <p className="text-white/60 text-xs">Délai de réponse</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <a href="mailto:support@medianet.tn" className="text-white/80 text-sm hover:text-white transition">
                  support@medianet.tn
                </a>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}