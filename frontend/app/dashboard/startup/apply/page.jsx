'use client';

// /app/dashboard/startup/apply/page.jsx
// FIXES APPLIQUÉS :
//   1. endpoint formulaire → /api/apply/form?programmeId=xxx  (pour programme ET spontané)
//   2. endpoint soumission → /api/apply/submit

import { useState, useEffect, useCallback, Suspense } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { axiosAuth } from '@/app/store/slices/authSlice';
import { useDropzone } from 'react-dropzone';

// ── ICONS ─────────────────────────────────────────────────────────────────────
const IC = {
  Rocket: ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  Check:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  Clock:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Right:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7"/></svg>,
  Left:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/></svg>,
  Upload: ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"/></svg>,
  Trash:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  User:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  Brief:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  Chart:  ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  File:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Info:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Save:   ({ c }) => <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>,
};

const ICON_MAP = {
  Rocket: IC.Rocket, User: IC.User, Brief: IC.Brief,
  Chart:  IC.Chart,  File: IC.File, Info:  IC.Info,
};

const cls = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800 dark:text-white outline-none text-sm';

// ── STEP INDICATOR ────────────────────────────────────────────────────────────
function StepIndicator({ current, steps }) {
  return (
    <div className="relative">
      <div className="flex justify-between mb-6">
        {steps.map(step => {
          const isActive    = current === step.n;
          const isCompleted = current > step.n;
          return (
            <div key={step.n} className="flex flex-col items-center flex-1">
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                  style={isActive ? { background: 'linear-gradient(135deg,#00526e,#0088ba)' } : {}}
                >
                  {isCompleted ? <IC.Check c="w-5 h-5" /> : <span>{step.n}</span>}
                </div>
                {isActive && <div className="absolute -inset-1 rounded-full bg-blue-400/20 -z-10 animate-pulse" />}
              </div>
              <span className={`text-xs mt-2 font-medium hidden sm:block ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((current - 1) / Math.max(steps.length - 1, 1)) * 100}%`,
            background: 'linear-gradient(90deg,#00526e,#0088ba)',
          }}
        />
      </div>
    </div>
  );
}

// ── FILE UPLOAD ───────────────────────────────────────────────────────────────
function FileUpload({ label, name, accept = [], required, value, onChange }) {
  const onDrop = useCallback(f => { if (f.length > 0) onChange(f[0]); }, [onChange]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:   accept.reduce((a, t) => ({ ...a, [t]: [] }), {}),
    maxSize:  10 * 1024 * 1024,
    multiple: false,
  });
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}`}
      >
        <input {...getInputProps()} name={name} />
        <IC.Upload c="w-8 h-8 text-gray-400 mx-auto mb-2" />
        {isDragActive
          ? <p className="text-sm text-gray-600 dark:text-gray-400">Déposez le fichier ici</p>
          : <>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cliquez ou glissez-déposez</p>
              <p className="text-xs text-gray-400">PDF, PPT, Excel (max 10 Mo)</p>
            </>
        }
      </div>
      {value && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <IC.Check c="w-4 h-4" />
          <span className="flex-1 truncate">{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="text-red-500 hover:text-red-700">
            <IC.Trash c="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── DYNAMIC FIELD ─────────────────────────────────────────────────────────────
function DynamicField({ field, value, onChange, fileValue, onFileChange }) {
  if (field.type === 'file') {
    return (
      <FileUpload
        label={field.label}
        name={field.key}
        accept={field.accept || []}
        required={field.required}
        value={fileValue}
        onChange={f => onFileChange(field.key, f)}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={value || ''}
          onChange={e => onChange(field.key, e.target.value)}
          rows={field.key === 'description' ? 6 : 4}
          className={cls}
          placeholder={field.placeholder || ''}
        />
        {field.minLength && (
          <p className="mt-1 text-xs text-gray-500 flex justify-between">
            <span>Minimum {field.minLength} caractères</span>
            <span className={(value || '').length >= field.minLength ? 'text-emerald-500' : ''}>
              {(value || '').length} car.
            </span>
          </p>
        )}
        {field.helpText && <p className="text-xs text-gray-400 italic mt-1">{field.helpText}</p>}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className={cls}>
          <option value="">Sélectionnez...</option>
          {(field.options || []).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {field.helpText && <p className="text-xs text-gray-400 italic mt-1">{field.helpText}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={field.type}
        value={value || ''}
        onChange={e => onChange(field.key, e.target.value)}
        className={cls}
        placeholder={field.placeholder || ''}
      />
      {field.helpText && <p className="text-xs text-gray-400 italic mt-1">{field.helpText}</p>}
    </div>
  );
}

// ── STEP HEADER ───────────────────────────────────────────────────────────────
function StepHeader({ iconName, title, sub }) {
  const IconComp = ICON_MAP[iconName] || IC.File;
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
        <IconComp c="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

// ── INNER COMPONENT ───────────────────────────────────────────────────────────
function ApplyPageInner() {
  const { user }     = useSelector(s => s.auth);
  const router       = useRouter();
  const searchParams = useSearchParams();

  const programmeId   = searchParams.get('programmeId')   || null;
  const programmeName = searchParams.get('programmeName') || null;
  const isSpontane    = searchParams.get('type') === 'spontane';

  const [mounted,     setMounted]     = useState(false);
  const [time,        setTime]        = useState(new Date());
  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [formError,   setFormError]   = useState(null);
  const [alert,       setAlert]       = useState(null);
  const [saveStatus,  setSave]        = useState('saved');
  const [progress,    setProgress]    = useState(0);
  const [submitted,   setSubmitted]   = useState(false);

  const [formSchema,   setFormSchema]   = useState(null);
  const [steps,        setSteps]        = useState([]);
  const [fieldsByStep, setFieldsByStep] = useState({});

  const [values,     setValues]     = useState({
    founderName:  user?.name  || '',
    founderEmail: user?.email || '',
  });
  const [fileValues, setFileValues] = useState({});

  // ── Chargement du schéma ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchForm = async () => {
      setFormLoading(true);
      setFormError(null);
      try {
        /*
         * FIX #1 : un seul endpoint unifié pour TOUS les cas
         *   - Programme spécifique : /api/apply/form?programmeId=<id>
         *   - Candidature spontanée : /api/apply/form?programmeId=spontane
         *
         * Le controller applyController.js gère les deux cas côté backend.
         */
        const pid = (programmeId && !isSpontane) ? programmeId : 'spontane';
        const endpoint = `/api/apply/form?programmeId=${pid}`;

        const { data } = await axiosAuth.get(endpoint);

        // Le backend retourne toujours { success: true, form: { ... } }
        const schema = data.form || data.formulaire || data;
        setFormSchema(schema);

        // Construction des étapes depuis le schéma retourné par applyController
        const stepsArr = Array.isArray(schema?.steps) && schema.steps.length > 0
          ? schema.steps
          : [
              { n: 1, title: 'Projet',    desc: 'Informations générales', icon: 'Rocket' },
              { n: 2, title: 'Équipe',    desc: 'Talents et compétences', icon: 'User'   },
              { n: 3, title: 'Business',  desc: 'Modèle et stratégie',    icon: 'Brief'  },
              { n: 4, title: 'Traction',  desc: 'Preuves et métriques',   icon: 'Chart'  },
              { n: 5, title: 'Documents', desc: 'Pièces jointes',         icon: 'File'   },
            ];
        setSteps(stepsArr);

        // Répartition des champs par étape
        // applyController retourne fields[] avec un champ `step` sur chaque field
        const byStep = {};
        const fields = schema?.fields || [];
        if (Array.isArray(fields)) {
          fields.forEach(f => {
            const s = f.step || 1;
            if (!byStep[s]) byStep[s] = [];
            byStep[s].push(f);
          });
        }
        Object.keys(byStep).forEach(s => {
          byStep[s].sort((a, b) => (a.order || 0) - (b.order || 0));
        });
        setFieldsByStep(byStep);

      } catch (err) {
        console.error('[fetchForm] failed:', err?.response?.config?.url, err);
        setFormError(
          err.response?.data?.message ||
          `Impossible de charger le formulaire (${err.response?.status || 'réseau'}).`
        );
      } finally {
        setFormLoading(false);
      }
    };
    fetchForm();
  }, [programmeId, isSpontane]);

  // Auto-save indicator
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      setSave('saving');
      setTimeout(() => setSave('saved'), 600);
    }, 1800);
    return () => clearTimeout(t);
  }, [values, fileValues, mounted]);

  // Progress calculation
  useEffect(() => {
    if (!steps.length) return;
    let filled = 0;
    steps.forEach(s => {
      const fields  = fieldsByStep[s.n] || [];
      const textReq = fields.filter(f => f.required && f.type !== 'file');
      const fileReq = fields.filter(f => f.required && f.type === 'file');
      const textOk  = textReq.every(f => (values[f.key] || '').trim().length > 0);
      const fileOk  = fileReq.every(f => !!fileValues[f.key]);
      if (textOk && fileOk) filled++;
    });
    setProgress(Math.round((filled / steps.length) * 100));
  }, [values, fileValues, steps, fieldsByStep]);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (key, val) => setValues(prev => ({ ...prev, [key]: val }));
  const handleFile   = (key, f)   => setFileValues(prev => ({ ...prev, [key]: f }));

  const validate = stepN => {
    const fields  = fieldsByStep[stepN] || [];
    const missing = [];
    for (const f of fields) {
      if (!f.required) continue;
      if (f.type === 'file') {
        if (!fileValues[f.key]) missing.push(f.label);
      } else if (f.type === 'textarea' && f.minLength) {
        if ((values[f.key] || '').length < f.minLength)
          missing.push(`${f.label} (min. ${f.minLength} car.)`);
      } else {
        if (!(values[f.key] || '').trim()) missing.push(f.label);
      }
    }
    if (missing.length > 0) {
      setAlert({ type: 'error', message: `Champs requis : ${missing.join(', ')}` });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate(step)) {
      setAlert(null);
      setStep(p => Math.min(p + 1, steps.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const handlePrev = () => {
    setStep(p => Math.max(p - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── SOUMISSION ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate(step)) return;
    setLoading(true);
    setAlert(null);
    try {
      const hasFiles = Object.values(fileValues).some(Boolean);
      let payload;

      if (hasFiles) {
        payload = new FormData();
        payload.append('programmeId',   programmeId   || '');
        payload.append('programmeName', programmeName || (isSpontane ? 'Candidature spontanée' : ''));
        if (formSchema?._id || formSchema?.id) {
          payload.append('formId', formSchema._id || formSchema.id);
        }
        Object.entries(values).forEach(([k, v]) => payload.append(k, v ?? ''));
        Object.entries(fileValues).forEach(([k, f]) => { if (f) payload.append(k, f); });
      } else {
        payload = {
          programmeId,
          programmeName: programmeName || (isSpontane ? 'Candidature spontanée' : ''),
          ...(formSchema?._id || formSchema?.id ? { formId: formSchema._id || formSchema.id } : {}),
          ...values,
        };
      }

      /*
       * FIX #2 : soumission vers /api/apply/submit
       * (remplace l'ancien /api/startup/applications)
       */
      await axiosAuth.post('/api/apply/submit', payload, {
        headers: hasFiles ? { 'Content-Type': 'multipart/form-data' } : {},
      });

      setSubmitted(true);
      setAlert({ type: 'success', message: '🎉 Candidature soumise avec succès !' });
      setTimeout(() => {
        router.push('/dashboard/startup/candidatures');
      }, 2500);

    } catch (err) {
      if (err.response?.status === 409) {
        setAlert({
          type: 'error',
          message: '⚠️ Vous avez déjà soumis une candidature pour ce programme.',
        });
      } else {
        setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la soumission.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (formLoading) {
    return (
      <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
        <DashboardLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Chargement du formulaire…</p>
              {programmeName && (
                <p className="text-sm text-gray-400 mt-1">Programme : {programmeName}</p>
              )}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (formError) {
    return (
      <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
        <DashboardLayout>
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Formulaire indisponible</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{formError}</p>
              {programmeId && (
                <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  Programme ID : {programmeId}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}
              >
                Réessayer
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ── Écran de succès ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
        <DashboardLayout>
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <IC.Check c="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                🎉 Candidature soumise !
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Votre candidature pour <strong>{programmeName || 'ce programme'}</strong> a été enregistrée.
              </p>
              <p className="text-sm text-gray-400 mb-6">Redirection vers vos candidatures…</p>
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // ── Current step ──────────────────────────────────────────────────────────
  const currentStep   = steps.find(s => s.n === step) || steps[0] || { n: 1, title: '', desc: '', icon: 'File' };
  const currentFields = fieldsByStep[step] || [];

  const colFields    = currentFields.filter(f => f.group === 'col-2' && f.type !== 'file');
  const singleFields = currentFields.filter(f => f.group !== 'col-2' && f.type !== 'file');
  const fileFields   = currentFields.filter(f => f.type === 'file');

  const displayTitle = isSpontane
    ? (formSchema?.title || 'Candidature Spontanée')
    : (programmeName || formSchema?.title || "Programme d'incubation");

  const headerSub = programmeName
    ? `Candidature pour : ${programmeName}`
    : isSpontane
      ? 'Candidature spontanée — Ouvert en permanence'
      : formSchema?.description || "Programme d'incubation MEDIANET";

  return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { font-family:'Inter',sans-serif; }
          @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
          .anim { animation:slideUp 0.45s ease-out forwards; }
          .glass-card {
            background:rgba(255,255,255,0.97);
            border:1px solid rgba(0,0,0,0.06);
            box-shadow:0 1px 3px rgba(0,0,0,0.05);
          }
          :global(.dark) .glass-card { background:#1e293b; border:1px solid #334155; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <div
            className="anim relative overflow-hidden rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-3 mb-3">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/90 tracking-wide">
                    CANDIDATURE
                  </span>
                  {programmeName && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white border border-white/30">
                      {programmeName}
                    </span>
                  )}
                  {isSpontane && !programmeName && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white border border-white/30">
                      Spontanée
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">
                      {saveStatus === 'saving' ? 'Sauvegarde…' : 'Sauvegardé'}
                    </span>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  {displayTitle}
                </h1>
                <p className="text-blue-100 text-base max-w-2xl">{headerSub}</p>
                <div className="flex items-center gap-4 text-blue-100 mt-4">
                  <div className="flex items-center gap-2">
                    <IC.Clock c="w-4 h-4 text-blue-200" />
                    <span className="font-mono text-sm">
                      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {formSchema?.title && !isSpontane && (
                    <span className="text-xs text-white/40 hidden lg:inline">
                      Formulaire : {formSchema.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress ring */}
              <div className="rounded-xl p-4 min-w-[160px]"
                style={{ background: 'rgba(0,82,110,0.9)', backdropFilter: 'blur(10px)' }}>
                <p className="text-blue-200 text-xs uppercase tracking-wide mb-2 text-center">Progression</p>
                <div className="relative w-20 h-20 mx-auto">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6"/>
                    <circle cx="40" cy="40" r="35" fill="none" stroke="white" strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 35}
                      strokeDashoffset={2 * Math.PI * 35 * (1 - progress / 100)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEPS ──────────────────────────────────────────────────── */}
          {steps.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <StepIndicator current={step} steps={steps} />
            </div>
          )}

          {/* ── ALERT ──────────────────────────────────────────────────── */}
          {alert && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              alert.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700'
            }`}>
              {alert.type === 'success' ? <IC.Check c="w-5 h-5" /> : <IC.Info c="w-5 h-5" />}
              <span className="text-sm font-medium">{alert.message}</span>
              <button onClick={() => setAlert(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
            </div>
          )}

          {/* ── FORM ───────────────────────────────────────────────────── */}
          <div className="glass-card rounded-xl p-6 lg:p-8">
            <StepHeader
              iconName={currentStep.icon}
              title={currentStep.title}
              sub={currentStep.desc}
            />

            <div className="space-y-5">
              {colFields.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {colFields.map(field => (
                    <DynamicField
                      key={field.key}
                      field={field}
                      value={values[field.key]}
                      onChange={handleChange}
                      fileValue={fileValues[field.key]}
                      onFileChange={handleFile}
                    />
                  ))}
                </div>
              )}

              {singleFields.map(field => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={handleChange}
                  fileValue={fileValues[field.key]}
                  onFileChange={handleFile}
                />
              ))}

              {fileFields.map(field => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={handleChange}
                  fileValue={fileValues[field.key]}
                  onFileChange={handleFile}
                />
              ))}

              {fileFields.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-3">
                    <IC.Info c="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-medium">Informations importantes</p>
                      <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
                        <li>Documents en français ou en anglais</li>
                        <li>Taille maximale : 10 Mo par fichier</li>
                        <li>Formats acceptés : PDF, PPT, PPTX, XLS, XLSX</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {currentFields.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <IC.Info c="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Aucun champ configuré pour cette étape.</p>
                  <p className="text-xs mt-1 text-gray-300">
                    Vérifiez que ce programme a bien un formulaire lié dans l&apos;interface admin.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {step > 1 ? (
                <button
                  onClick={handlePrev}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <IC.Left c="w-4 h-4" /> Précédent
                </button>
              ) : <div />}

              <span className="text-xs text-gray-400 font-medium">Étape {step}/{steps.length}</span>

              {step < steps.length ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}
                >
                  Suivant <IC.Right c="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi…</>
                    : <><IC.Check c="w-4 h-4" /> Soumettre ma candidature</>
                  }
                </button>
              )}
            </div>
          </div>

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <div
            className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <IC.Save c="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Sauvegarde automatique</p>
                <p className="text-white/50 text-xs">Vous pouvez quitter et revenir plus tard</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center">
              {['SÉCURISÉ', 'AUTO-SAVE', 'SSL'].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-6">
                  <div>
                    <p className="text-white font-bold text-sm font-mono">{s}</p>
                    <p className="text-white/40 text-[10px]">{['Données protégées', 'Enregistrement auto', 'Connexion sécurisée'][i]}</p>
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-6 bg-white/10" />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ApplyPageInner />
    </Suspense>
  );
}