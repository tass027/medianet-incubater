'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import Button from '@/app/components/common/Button';
import Card from '@/app/components/common/Card';

// ── SVG Icons ───────────────────────────────────────────────────────
const Icons = {
  Rocket: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Users: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  LightBulb: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  CheckCircle: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ChevronLeft: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Upload: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Building: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Mail: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Phone: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Document: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  AlertTriangle: (className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const STEPS = [
  { key: 'startup', label: 'Votre startup', icon: Icons.Building },
  { key: 'founders', label: 'L\'équipe', icon: Icons.Users },
  { key: 'project', label: 'Le projet', icon: Icons.LightBulb },
  { key: 'review', label: 'Révision', icon: Icons.Document },
];

const SECTORS = ['FinTech', 'HealthTech', 'AgriTech', 'EdTech', 'CleanTech', 'E-Commerce', 'AI/ML', 'Cybersécurité', 'Logistique', 'Autre'];
const STAGES = ['Idée / Concept', 'MVP en cours', 'MVP lancé', 'Premiers clients', 'Croissance', 'Scale'];

const MOCK_PROG = {
  spontane: { titre: 'Candidature Spontanée', sector: 'Tous secteurs', isSpontane: true },
  '1': { titre: 'Programme FinTech 2026', sector: 'FinTech', dateFin: '2026-06-30', quota: 10 },
  '2': { titre: 'Programme EdTech 2026', sector: 'EdTech', dateFin: '2026-07-15', quota: 8 },
};

export default function PostulerPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id;
  const isSpontane = programId === 'spontane';

  const [programme, setProgramme] = useState(null);
  const [step, setStep] = useState('startup');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    startupName: '', sector: '', stage: '', website: '', linkedIn: '',
    founderName: '', founderEmail: '', founderPhone: '', founderRole: '',
    cofounderName: '', cofounderRole: '',
    teamSize: '',
    pitchShort: '', problemStatement: '', solution: '', marketSize: '',
    traction: '', fundingNeeded: '', useOfFunds: '',
    pitchDeck: null,
  });

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/programmes/public/${programId}`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        setProgramme(d.programme);
      } catch {
        setProgramme(MOCK_PROG[programId] || MOCK_PROG.spontane);
      }
    };
    load();
  }, [programId]);

  const stepIndex = STEPS.findIndex(s => s.key === step);
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form, programmeId: isSpontane ? null : programId, type: isSpontane ? 'spontane' : 'programme' };
      const res = await fetch('/api/candidatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      console.log('Submission error (mock success)');
    } finally {
      setSubmitting(false);
      setStep('success');
    }
  };

  const inputClass = "w-full px-4 py-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all";
  const labelClass = "block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5";

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Navbar />
        <div className="pt-32 pb-20 max-w-lg mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Candidature envoyée !</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
            {isSpontane
              ? 'Votre candidature spontanée a bien été reçue. Notre équipe vous contactera sous 48h.'
              : `Votre dossier pour le programme "${programme?.titre}" a bien été soumis.`
            }
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            Un email de confirmation a été envoyé à <strong className="text-primary-600">{form.founderEmail}</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/programmes">
              <Button variant="primary" size="lg">Retour aux programmes</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">Retour à l'accueil</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const StepIcon = STEPS[stepIndex]?.icon || Icons.Document;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={isSpontane ? '/programmes' : `/programmes/${programId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 mb-5 transition-colors group"
          >
            <Icons.ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {isSpontane ? 'Retour aux programmes' : 'Retour au programme'}
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 mb-4">
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">
              {isSpontane ? 'Candidature Spontanée' : programme?.titre || 'Programme'}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isSpontane ? 'Soumettez votre dossier' : 'Candidatez au programme'}
          </h1>
        </div>

        {/* Progress Steps */}
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {STEPS.map((s, i) => {
              const StepIconComponent = s.icon;
              const isActive = s.key === step;
              const isCompleted = i < stepIndex;
              
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all flex-shrink-0 ${
                    isActive 
                      ? 'bg-primary-600 text-white shadow-md' 
                      : isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Icons.CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIconComponent className="w-5 h-5" />
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            {STEPS.map(s => (
              <span key={s.key} className={s.key === step ? 'text-primary-600 dark:text-primary-400 font-semibold' : ''}>
                {s.label}
              </span>
            ))}
          </div>
        </Card>

        {/* Form Body */}
        <Card className="overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <StepIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {step === 'startup' && 'Informations sur votre startup'}
                {step === 'founders' && 'L\'équipe fondatrice'}
                {step === 'project' && 'Le projet en détail'}
                {step === 'review' && 'Révision avant envoi'}
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Step: Startup */}
            {step === 'startup' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nom de la startup *</label>
                    <input className={inputClass} type="text" placeholder="ex: PayTunis" value={form.startupName} onChange={e => setField('startupName', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Secteur d'activité *</label>
                    <select className={inputClass} value={form.sector} onChange={e => setField('sector', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className={labelClass}>Stade de développement *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STAGES.map(s => (
                      <button key={s} type="button" onClick={() => setField('stage', s)}
                        className={`px-3 py-2.5 text-sm rounded-xl border text-left transition-all ${
                          form.stage === s 
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold' 
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Site web</label>
                    <input className={inputClass} type="url" placeholder="https://..." value={form.website} onChange={e => setField('website', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>LinkedIn startup</label>
                    <input className={inputClass} type="url" placeholder="linkedin.com/company/..." value={form.linkedIn} onChange={e => setField('linkedIn', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* Step: Founders */}
            {step === 'founders' && (
              <>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Icons.Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Fondateur principal</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nom complet *</label>
                    <input className={inputClass} type="text" value={form.founderName} onChange={e => setField('founderName', e.target.value)} placeholder="Ahmed Ben Ali" />
                  </div>
                  <div>
                    <label className={labelClass}>Rôle *</label>
                    <input className={inputClass} type="text" value={form.founderRole} onChange={e => setField('founderRole', e.target.value)} placeholder="CEO, CTO..." />
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input className={inputClass} type="email" value={form.founderEmail} onChange={e => setField('founderEmail', e.target.value)} placeholder="ahmed@startup.tn" />
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone *</label>
                    <input className={inputClass} type="tel" value={form.founderPhone} onChange={e => setField('founderPhone', e.target.value)} placeholder="+216 XX XXX XXX" />
                  </div>
                </div>
                
                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
                    <div className="flex items-center gap-2">
                      <Icons.Users className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Co-fondateur (optionnel)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nom</label>
                      <input className={inputClass} type="text" value={form.cofounderName} onChange={e => setField('cofounderName', e.target.value)} placeholder="Sonia Mrad" />
                    </div>
                    <div>
                      <label className={labelClass}>Rôle</label>
                      <input className={inputClass} type="text" value={form.cofounderRole} onChange={e => setField('cofounderRole', e.target.value)} placeholder="CTO, CMO..." />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className={labelClass}>Taille de l'équipe</label>
                  <select className={inputClass} value={form.teamSize} onChange={e => setField('teamSize', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {['1 (Solo)', '2', '3-5', '6-10', '10+'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Step: Project */}
            {step === 'project' && (
              <>
                <div>
                  <label className={labelClass}>Pitch en une phrase * (max 150 caractères)</label>
                  <textarea className={inputClass + ' resize-none'} rows={2} maxLength={150}
                    placeholder="Nous aidons [qui] à [faire quoi] grâce à [comment]"
                    value={form.pitchShort} onChange={e => setField('pitchShort', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">{form.pitchShort.length}/150 caractères</p>
                </div>
                
                <div>
                  <label className={labelClass}>Problème résolu *</label>
                  <textarea className={inputClass + ' resize-none'} rows={3}
                    placeholder="Décrivez le problème que vous résolvez..."
                    value={form.problemStatement} onChange={e => setField('problemStatement', e.target.value)} />
                </div>
                
                <div>
                  <label className={labelClass}>Votre solution *</label>
                  <textarea className={inputClass + ' resize-none'} rows={3}
                    placeholder="Comment votre solution résout ce problème..."
                    value={form.solution} onChange={e => setField('solution', e.target.value)} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Taille de marché</label>
                    <input className={inputClass} type="text" placeholder="ex: 50M DT / an" value={form.marketSize} onChange={e => setField('marketSize', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Traction actuelle</label>
                    <input className={inputClass} type="text" placeholder="ex: 200 utilisateurs" value={form.traction} onChange={e => setField('traction', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Financement recherché</label>
                    <input className={inputClass} type="text" placeholder="ex: 500 000 DT" value={form.fundingNeeded} onChange={e => setField('fundingNeeded', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Utilisation des fonds</label>
                    <input className={inputClass} type="text" placeholder="ex: 60% tech, 30% commercial" value={form.useOfFunds} onChange={e => setField('useOfFunds', e.target.value)} />
                  </div>
                </div>
                
                <div>
                  <label className={labelClass}>Pitch Deck (PDF, max 10MB)</label>
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('pitchDeck')?.click()}>
                    <input id="pitchDeck" type="file" accept=".pdf" className="hidden"
                      onChange={e => setField('pitchDeck', e.target.files?.[0] || null)} />
                    {form.pitchDeck ? (
                      <div className="flex items-center justify-center gap-3 text-primary-600 dark:text-primary-400">
                        <Icons.Document className="w-5 h-5" />
                        <span className="text-sm font-semibold">{form.pitchDeck.name}</span>
                      </div>
                    ) : (
                      <>
                        <Icons.Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cliquez pour uploader votre Pitch Deck</p>
                        <p className="text-xs text-gray-400 mt-1">PDF uniquement · Max 10 MB</p>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Step: Review */}
            {step === 'review' && (
              <div className="space-y-4">
                {[
                  { title: 'Startup', icon: Icons.Building, items: [
                    ['Nom', form.startupName], ['Secteur', form.sector], ['Stade', form.stage]
                  ]},
                  { title: 'Équipe', icon: Icons.Users, items: [
                    ['Fondateur', form.founderName], ['Rôle', form.founderRole], ['Email', form.founderEmail], ['Téléphone', form.founderPhone]
                  ]},
                  { title: 'Projet', icon: Icons.LightBulb, items: [
                    ['Pitch', form.pitchShort], ['Financement', form.fundingNeeded], ['Traction', form.traction]
                  ]},
                ].map((section, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <section.icon className="w-4 h-4 text-primary-600" />
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{section.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {section.items.map(([k, v]) => v && (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{k}</span>
                          <span className="text-gray-900 dark:text-white font-medium text-right max-w-[60%] truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {(!form.startupName || !form.sector || !form.stage || !form.founderName || !form.founderEmail || !form.pitchShort) && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-3">
                    <Icons.AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Champs manquants</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Certains champs obligatoires ne sont pas remplis.</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
                  <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                    En soumettant ce formulaire, vous acceptez que Medianet Incubator traite vos données dans le cadre de l'évaluation de votre candidature.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => stepIndex > 0 && setStep(STEPS[stepIndex - 1].key)}
              disabled={stepIndex === 0}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              Précédent
            </button>
            
            {step === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 bg-gradient-to-r from-primary-600 to-secondary-600 flex items-center gap-2"
              >
                {submitting ? 'Envoi en cours...' : 'Soumettre ma candidature'}
                {!submitting && <Icons.ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                onClick={() => setStep(STEPS[stepIndex + 1].key)}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 flex items-center gap-2"
              >
                Suivant
                <Icons.ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
}