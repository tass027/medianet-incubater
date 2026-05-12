'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';

// ===================================================
// CONSTANTS
// ===================================================
const SECTORS = [
  { value: 'FinTech', label: 'FinTech', color: 'from-green-500 to-emerald-500' },
  { value: 'HealthTech', label: 'HealthTech', color: 'from-red-500 to-pink-500' },
  { value: 'EdTech', label: 'EdTech', color: 'from-blue-500 to-indigo-500' },
  { value: 'AgriTech', label: 'AgriTech', color: 'from-lime-500 to-green-500' },
  { value: 'CleanTech', label: 'CleanTech', color: 'from-teal-500 to-cyan-500' },
  { value: 'SaaS', label: 'SaaS', color: 'from-purple-500 to-violet-500' },
  { value: 'E-commerce', label: 'E-commerce', color: 'from-orange-500 to-amber-500' },
  { value: 'Mobility', label: 'Mobility', color: 'from-sky-500 to-blue-500' },
  { value: 'Logistics', label: 'Logistics', color: 'from-yellow-500 to-amber-500' },
  { value: 'Other', label: 'Autre', color: 'from-gray-500 to-gray-600' }
];

const STAGES = [
  { value: 'idea', label: 'Idée', description: 'Concept en cours de développement' },
  { value: 'mvp', label: 'MVP', description: 'Produit minimum viable existant' },
  { value: 'traction', label: 'Early Traction', description: 'Premiers clients, validation marché' },
  { value: 'growth', label: 'Growth', description: 'Croissance confirmée' },
  { value: 'scale', label: 'Scale', description: 'Mise à l\'échelle' }
];

const TEAM_SIZES = [
  { value: '1-2', label: '1-2 personnes' },
  { value: '3-5', label: '3-5 personnes' },
  { value: '6-10', label: '6-10 personnes' },
  { value: '11-20', label: '11-20 personnes' },
  { value: '20+', label: 'Plus de 20 personnes' }
];

const FUNDING_RANGES = [
  { value: '<50k', label: 'Moins de 50 000 TND' },
  { value: '50k-200k', label: '50 000 - 200 000 TND' },
  { value: '200k-500k', label: '200 000 - 500 000 TND' },
  { value: '500k-1M', label: '500 000 - 1 000 000 TND' },
  { value: '>1M', label: 'Plus de 1 000 000 TND' }
];

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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Upload: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
    </svg>
  ),
  Trash: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Save: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  Info: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  User: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Briefcase: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Chart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  File: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
};

// ===================================================
// STEP INDICATOR COMPONENT
// ===================================================
const StepIndicator = ({ currentStep, steps, onStepClick }) => {
  return (
    <div className="relative">
      <div className="flex justify-between mb-8">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          
          return (
            <button
              key={step.number}
              onClick={() => onStepClick?.(step.number)}
              className="flex flex-col items-center flex-1 group"
              disabled={!isCompleted && !isActive}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {isCompleted ? (
                    <Icons.Check className="w-5 h-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                {isActive && (
                  <div className="absolute -inset-1 rounded-full bg-primary-400/20 -z-10 animate-pulse" />
                )}
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>
                {step.title}
              </span>
              <span className="text-[10px] text-gray-400 hidden sm:block">{step.description}</span>
            </button>
          );
        })}
      </div>
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
        <div
          className="h-full bg-gradient-to-r from-primary-600 to-primary-700 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

// ===================================================
// FILE UPLOAD COMPONENT
// ===================================================
const FileUploadZone = ({ label, name, accept, required, value, onChange, error }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onChange(acceptedFiles[0]);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}
          ${error ? 'border-red-500' : ''}`}
      >
        <input {...getInputProps()} name={name} />
        <div className="flex flex-col items-center gap-2">
          <Icons.Upload className="w-8 h-8 text-gray-400" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isDragActive ? (
              <p>Déposez le fichier ici</p>
            ) : (
              <>
                <p className="font-medium">Cliquez ou glissez-déposez</p>
                <p className="text-xs">PDF, PPT, Excel (max 10 Mo)</p>
              </>
            )}
          </div>
        </div>
      </div>
      {value && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <Icons.Check className="w-4 h-4" />
          <span>{value.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="text-red-500 hover:text-red-700 ml-auto"
          >
            <Icons.Trash className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// ===================================================
// MAIN PAGE
// ===================================================
export default function ApplyPage() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [formProgress, setFormProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    startupName: '',
    sector: '',
    stage: '',
    website: '',
    description: '',
    founderName: user?.name || '',
    founderEmail: user?.email || '',
    founderPhone: '',
    teamSize: '',
    businessModel: '',
    targetMarket: '',
    fundingNeeded: '',
    competitors: '',
    usp: '',
    revenue: '',
    customers: '',
    achievements: '',
    videoUrl: '',
    businessPlan: null,
    pitchDeck: null,
    financials: null,
  });

  const steps = [
    { number: 1, title: 'Projet', description: 'Informations générales' },
    { number: 2, title: 'Équipe', description: 'Talents et compétences' },
    { number: 3, title: 'Business', description: 'Modèle et stratégie' },
    { number: 4, title: 'Traction', description: 'Preuves et métriques' },
    { number: 5, title: 'Documents', description: 'Pièces jointes' }
  ];

  // Auto-save effect
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving');
      setTimeout(() => {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('saved'), 2000);
      }, 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, mounted]);

  // Calculate progress
  useEffect(() => {
    let completed = 0;
    if (formData.startupName && formData.sector && formData.stage && formData.description?.length >= 100) completed++;
    if (formData.founderName && formData.founderEmail && formData.founderPhone && formData.teamSize) completed++;
    if (formData.businessModel?.length >= 50 && formData.targetMarket?.length >= 50 && formData.fundingNeeded && formData.usp?.length >= 50) completed++;
    if (formData.revenue || formData.customers || formData.achievements) completed++;
    if (formData.businessPlan && formData.pitchDeck) completed++;
    setFormProgress(Math.round((completed / 5) * 100));
  }, [formData]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const validateStep = (step) => {
    switch(step) {
      case 1:
        if (!formData.startupName || !formData.sector || !formData.stage || formData.description?.length < 100) {
          setAlert({ type: 'error', message: 'Veuillez remplir tous les champs requis' });
          return false;
        }
        break;
      case 2:
        if (!formData.founderName || !formData.founderEmail || !formData.founderPhone || !formData.teamSize) {
          setAlert({ type: 'error', message: 'Veuillez remplir tous les champs requis' });
          return false;
        }
        break;
      case 3:
        if (!formData.businessModel || !formData.targetMarket || !formData.fundingNeeded || !formData.usp) {
          setAlert({ type: 'error', message: 'Veuillez remplir tous les champs requis' });
          return false;
        }
        break;
      case 5:
        if (!formData.businessPlan || !formData.pitchDeck) {
          setAlert({ type: 'error', message: 'Veuillez télécharger tous les documents requis' });
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (!validateStep(5)) return;
    setLoading(true);
    setTimeout(() => {
      setAlert({ type: 'success', message: 'Candidature soumise avec succès' });
      setLoading(false);
      setTimeout(() => {
        router.push('/dashboard/applicant/status');
      }, 2000);
    }, 2000);
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

          :global(.dark) .text-gray-900 { color: #f1f5f9; }
          :global(.dark) .text-gray-700 { color: #cbd5e1; }
          :global(.dark) .text-gray-600 { color: #94a3b8; }
          :global(.dark) .bg-gray-50 { background-color: #0f172a; }
          :global(.dark) .bg-white { background-color: #1e293b; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* Header Section */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide">
                    CANDIDATURE
                  </div>
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/80">Sauvegarde automatique</span>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  Programme d'incubation
                </h1>
                <p className="text-blue-100 text-base lg:text-lg max-w-2xl">
                  Complétez votre dossier en 5 étapes pour rejoindre le programme MEDIANET
                </p>
                <div className="flex items-center gap-4 text-blue-100 mt-4">
                  <div className="flex items-center gap-2">
                    <Icons.Clock className="w-4 h-4 text-blue-200" />
                    <span className="mono text-sm">
                      {mounted && time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-blue-400/30"></div>
                  <div className="flex items-center gap-2">
                    {autoSaveStatus === 'saving' && (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-xs">Sauvegarde en cours</span>
                      </>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <>
                        <Icons.Check className="w-3 h-3" />
                        <span className="text-xs">Sauvegardé</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="dark-glass rounded-xl p-4 min-w-[200px]" style={{ background: 'rgba(0,82,110,0.9)', backdropFilter: 'blur(10px)' }}>
                <div className="text-center">
                  <p className="text-blue-200 text-xs uppercase tracking-wide mb-2">Progression</p>
                  <div className="relative w-20 h-20 mx-auto">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="35"
                        fill="none"
                        stroke="white"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 35}
                        strokeDashoffset={2 * Math.PI * 35 * (1 - formProgress / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                      {formProgress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="glass-card rounded-xl p-6">
            <StepIndicator currentStep={currentStep} steps={steps} onStepClick={setCurrentStep} />
          </div>

          {/* Alert */}
          {alert && (
            <div className="animate-slide-in-up">
              <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            </div>
          )}

          {/* Form Content */}
          <div className="glass-card rounded-xl p-6 lg:p-8">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icons.Rocket className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Informations générales</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Présentez votre projet en détail</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nom de la startup <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.startupName}
                      onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                      placeholder="Ex: PayTunis"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Secteur d'activité <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Sélectionnez un secteur</option>
                      {SECTORS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Stade du projet <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Sélectionnez un stade</option>
                      {STAGES.map(s => (
                        <option key={s.value} value={s.value}>{s.label} - {s.description}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Site web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                      placeholder="https://exemple.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Description du projet <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    placeholder="Décrivez votre projet : le problème résolu, votre solution, la valeur ajoutée..."
                  />
                  <div className="mt-2 text-xs text-gray-500 flex justify-between">
                    <span>Minimum 100 caractères</span>
                    <span>{formData.description?.length || 0} caractères</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Team */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icons.User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Équipe fondatrice</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Les talents derrière votre projet</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nom du fondateur <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.founderName}
                      onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.founderEmail}
                      onChange={(e) => setFormData({ ...formData, founderEmail: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.founderPhone}
                      onChange={(e) => setFormData({ ...formData, founderPhone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Taille de l'équipe <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Sélectionnez</option>
                      {TEAM_SIZES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Business Model */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icons.Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Modèle économique</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Votre stratégie de création de valeur</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Modèle économique <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.businessModel}
                    onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    placeholder="Décrivez comment vous générez des revenus"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Proposition de valeur unique <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.usp}
                    onChange={(e) => setFormData({ ...formData, usp: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    placeholder="Qu'est-ce qui vous différencie de vos concurrents ?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Marché cible <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.targetMarket}
                    onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    placeholder="Qui sont vos clients ? Quelle est la taille du marché ?"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Montant recherché <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.fundingNeeded}
                      onChange={(e) => setFormData({ ...formData, fundingNeeded: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Sélectionnez un montant</option>
                      {FUNDING_RANGES.map(range => (
                        <option key={range.value} value={range.value}>{range.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Principaux concurrents
                    </label>
                    <textarea
                      value={formData.competitors}
                      onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                      placeholder="Listez vos principaux concurrents"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Traction */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icons.Chart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Traction et métriques</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Preuves de validation marché</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Revenus mensuels (TND)
                    </label>
                    <input
                      type="text"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                      placeholder="Ex: 50 000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre de clients
                    </label>
                    <input
                      type="text"
                      value={formData.customers}
                      onChange={(e) => setFormData({ ...formData, customers: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                      placeholder="Ex: 1 200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Réalisations clés
                  </label>
                  <textarea
                    value={formData.achievements}
                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    placeholder="Prix, partenariats, articles de presse, jalons importants..."
                  />
                </div>
              </div>
            )}

            {/* Step 5: Documents */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icons.File className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Documents requis</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Téléchargez vos documents</p>
                  </div>
                </div>

                <FileUploadZone
                  label="Business Plan"
                  name="businessPlan"
                  accept={['application/pdf']}
                  required
                  value={formData.businessPlan}
                  onChange={(file) => setFormData({ ...formData, businessPlan: file })}
                  error={null}
                />

                <FileUploadZone
                  label="Pitch Deck"
                  name="pitchDeck"
                  accept={['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']}
                  required
                  value={formData.pitchDeck}
                  onChange={(file) => setFormData({ ...formData, pitchDeck: file })}
                  error={null}
                />

                <FileUploadZone
                  label="Projections financières"
                  name="financials"
                  accept={['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']}
                  required={false}
                  value={formData.financials}
                  onChange={(file) => setFormData({ ...formData, financials: file })}
                  error={null}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Vidéo de pitch
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="mt-1 text-xs text-gray-500">Lien vers votre vidéo de présentation</p>
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-3">
                    <Icons.Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-medium">Informations importantes</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Les documents doivent être en français ou en anglais</li>
                        <li>Taille maximale : 10 Mo par fichier</li>
                        <li>Formats acceptés : PDF, PPT, PPTX, XLS, XLSX</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                >
                  <Icons.ArrowLeft className="w-4 h-4" />
                  Précédent
                </button>
              )}
              
              <div className="flex-1 flex justify-center">
                <Badge variant="info" size="sm">
                  <span className="flex items-center gap-1">
                    <Icons.Clock className="w-3 h-3" />
                    Étape {currentStep} sur {steps.length}
                  </span>
                </Badge>
              </div>

              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                >
                  Suivant
                  <Icons.ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours
                    </>
                  ) : (
                    <>
                      <Icons.Check className="w-4 h-4" />
                      Soumettre ma candidature
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icons.Save className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Sauvegarde automatique</h3>
                  <p className="text-white/60 text-sm">Vous pouvez quitter et revenir plus tard</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-xl">SECURISE</p>
                  <p className="text-white/60 text-xs">Données protégées</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">AUTO</p>
                  <p className="text-white/60 text-xs">Enregistrement automatique</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}