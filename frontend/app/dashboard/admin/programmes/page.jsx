'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import { useSelector } from 'react-redux';
import useTranslation from '@/app/hooks/useTranslation';
import { axiosAuth } from '@/app/store/slices/authSlice';
import { confirmWarning, toastSuccess } from '@/app/hooks/useSwal';

// ─── Constants ────────────────────────────────────────────────
const PROGRAMME_STATUS = {
  DRAFT:     'draft',
  PUBLISHED: 'published',
  CLOSED:    'closed',
  SCHEDULED: 'scheduled',
};

const SECTORS = [
  'FinTech', 'HealthTech', 'AgriTech', 'EdTech',
  'CleanTech', 'E-Commerce', 'AI/ML', 'Cybersécurité',
  'Logistique', 'RH/Future of Work',
];

const ALL_SECTORS = [...SECTORS, 'Tous secteurs'];

const SECTOR_COLORS = {
  'FinTech':           { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',    bar: '#185FA5' },
  'HealthTech':        { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300',  bar: '#1D9E75' },
  'AgriTech':          { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300',  bar: '#BA7517' },
  'EdTech':            { bg: 'bg-purple-100 dark:bg-purple-900/30',text: 'text-purple-700 dark:text-purple-300',bar: '#534AB7' },
  'CleanTech':         { bg: 'bg-teal-100 dark:bg-teal-900/30',    text: 'text-teal-700 dark:text-teal-300',   bar: '#0F6E56' },
  'E-Commerce':        { bg: 'bg-orange-100 dark:bg-orange-900/30',text: 'text-orange-700 dark:text-orange-300',bar: '#D85A30' },
  'AI/ML':             { bg: 'bg-pink-100 dark:bg-pink-900/30',    text: 'text-pink-700 dark:text-pink-300',    bar: '#993556' },
  'Cybersécurité':     { bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-300',      bar: '#B91C1C' },
  'Logistique':        { bg: 'bg-cyan-100 dark:bg-cyan-900/30',    text: 'text-cyan-700 dark:text-cyan-300',    bar: '#0E7490' },
  'RH/Future of Work': { bg: 'bg-indigo-100 dark:bg-indigo-900/30',text: 'text-indigo-700 dark:text-indigo-300',bar: '#4338CA' },
  'Tous secteurs':     { bg: 'bg-gray-100 dark:bg-gray-800',       text: 'text-gray-700 dark:text-gray-300',    bar: '#5F5E5A' },
};

const getSectorStyle = (sector) => SECTOR_COLORS[sector] || SECTOR_COLORS['Tous secteurs'];

const STATUS_MAP = {
  [PROGRAMME_STATUS.PUBLISHED]: { label: 'Publié',    variant: 'success' },
  [PROGRAMME_STATUS.DRAFT]:     { label: 'Brouillon', variant: 'gray'    },
  [PROGRAMME_STATUS.CLOSED]:    { label: 'Clôturé',   variant: 'error'   },
  [PROGRAMME_STATUS.SCHEDULED]: { label: 'Planifié',  variant: 'warning' },
};

const JURY_MOCK = [
  { id: 1, initials: 'KG', name: 'Karim Ghorbel',    post: 'CFO — Medianet',              domains: ['FinTech', 'E-Commerce'],  status: 'active',   cls: 'blue'   },
  { id: 2, initials: 'SM', name: 'Sonia Mrad',        post: 'Dir. Innovation — TT',        domains: ['AI/ML', 'EdTech'],        status: 'active',   cls: 'purple' },
  { id: 3, initials: 'YB', name: 'Yassine Ben Salah', post: 'Partner — AfricaVentures',    domains: ['AgriTech', 'CleanTech'],  status: 'active',   cls: 'green'  },
  { id: 4, initials: 'AH', name: 'Amira Hamdani',     post: 'CEO — HealthBridge',          domains: ['HealthTech'],             status: 'invited',  cls: 'blue'   },
  { id: 5, initials: 'OT', name: 'Omar Trabelsi',     post: 'Head of Digital — Attijari',  domains: ['FinTech'],               status: 'inactive', cls: 'purple' },
];

const FORMS_MOCK = [
  { id: 1, name: 'Formulaire Candidature Standard',  fields: 12, used: 3, badge: 'info'    },
  { id: 2, name: 'Formulaire FinTech Spécialisé',   fields: 18, used: 1, badge: 'success' },
  { id: 3, name: 'Formulaire Impact & Innovation',   fields: 15, used: 2, badge: 'info'    },
  { id: 4, name: 'Formulaire Accélération 2026',     fields: 20, used: 0, badge: 'warn'    },
];

const MOCK_PROGRAMMES = [
  { id: 1, titre: 'Programme FinTech 2026',    description: 'Accélération de startups dans le domaine de la finance digitale, paiements mobiles et inclusion financière.', sector: 'FinTech',       status: PROGRAMME_STATUS.PUBLISHED,  dateDebut: '2026-04-01', dateFin: '2026-06-30', quota: 10, candidatures: 23, formulaire: 'Formulaire FinTech Avancé', jury: ['Karim Ghorbel', 'Omar Trabelsi'], createdAt: '2026-02-15', scheduledPublish: null },
  { id: 2, titre: 'Programme EdTech 2026',     description: 'Programme dédié aux solutions innovantes dans l\'éducation, formation en ligne et compétences numériques.',    sector: 'EdTech',        status: PROGRAMME_STATUS.PUBLISHED,  dateDebut: '2026-04-15', dateFin: '2026-07-15', quota: 8,  candidatures: 15, formulaire: 'Formulaire EdTech',        jury: ['Sonia Mrad'],                    createdAt: '2026-02-20', scheduledPublish: null },
  { id: 3, titre: 'Programme AgriTech 2026',   description: 'Soutien aux startups transformant l\'agriculture africaine grâce au digital, IoT et data.',                   sector: 'AgriTech',      status: PROGRAMME_STATUS.DRAFT,      dateDebut: '2026-05-01', dateFin: '2026-08-31', quota: 6,  candidatures: 0,  formulaire: 'Formulaire AgriTech',      jury: ['Yassine Ben Salah'],             createdAt: '2026-03-01', scheduledPublish: '2026-04-10' },
  { id: 4, titre: 'Programme CleanTech 2026',  description: 'Accélération de solutions durables : énergie renouvelable, gestion des déchets et mobilité verte.',           sector: 'CleanTech',     status: PROGRAMME_STATUS.SCHEDULED,  dateDebut: '2026-06-01', dateFin: '2026-09-30', quota: 5,  candidatures: 0,  formulaire: 'Formulaire CleanTech',     jury: ['Yassine Ben Salah'],             createdAt: '2026-03-10', scheduledPublish: '2026-05-01' },
  { id: 5, titre: 'Candidatures Spontanées',   description: 'Formulaire de base pour toutes les candidatures hors programme défini. Ouvert en permanence.',                sector: 'Tous secteurs', status: PROGRAMME_STATUS.PUBLISHED,  dateDebut: '2026-01-01', dateFin: '2026-12-31', quota: null, candidatures: 47, formulaire: 'Formulaire de Base',     jury: [],                                createdAt: '2026-01-01', scheduledPublish: null },
  { id: 6, titre: 'Programme HealthTech 2025', description: 'Programme passé — santé numérique, télémédecine et dispositifs médicaux connectés.',                          sector: 'HealthTech',    status: PROGRAMME_STATUS.CLOSED,     dateDebut: '2025-06-01', dateFin: '2025-09-30', quota: 8,  candidatures: 34, formulaire: 'Formulaire HealthTech',   jury: ['Amira Hamdani'],                 createdAt: '2025-04-01', scheduledPublish: null },
];

// ─── Helpers ──────────────────────────────────────────────────
const getDaysLeft   = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
const getFillRate   = (c, q) => !q ? null : Math.min(Math.round((c / q) * 100), 100);
const formatDate    = (d, opts = {}) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', ...opts });

// ─── Icons ────────────────────────────────────────────────────
const Icons = {
  search:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  plus:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>,
  edit:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  delete:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  calendar:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  users:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  filter:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>,
  clock:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  form:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  grid:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
  list:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
  jury:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  duplicate: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  x:         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  check:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 6L9 17l-5-5"/></svg>,
  info:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4M12 8h.01"/></svg>,
  warn:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  link:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M11 12h2"/></svg>,
  file:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" strokeWidth={2}/></svg>,
  arrow:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7"/></svg>,
  timeline:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
};

// ════════════════════════════════════════════════════════════════
// WIZARD COMPONENT (5-Step Create Programme)
// ════════════════════════════════════════════════════════════════
const WIZARD_STEPS = [
  { num: 1, label: 'Informations' },
  { num: 2, label: 'Contenu & Dates' },
  { num: 3, label: 'Formulaire' },
  { num: 4, label: 'Jury' },
  { num: 5, label: 'Révision & Publication' },
];

const EMPTY_WIZARD = {
  step: 1,
  titre: '', secteurs: [], description: '',
  dateDebut: '', dateFin: '',
  autoPublish: false, autoPublishDate: '',
  criteria: [], objectives: [],
  newCrit: '', newObj: '',
  linkedForm: null,
  jury: [],
  isPublished: false,
  showFormCreate: false,
  filterJuryDomain: 'all',
  searchJury: '',
  _formName: '',
};

function CreateProgrammeWizard({ onClose, onCreated }) {
  const [wiz, setWiz] = useState({ ...EMPTY_WIZARD });
  const set = (patch) => setWiz(prev => ({ ...prev, ...patch }));

  const progress = ((wiz.step - 1) / 4) * 100;

  const inp  = "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
  const lbl  = "block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5";

  const renderStep = () => {
    if (wiz.isPublished) return <PublishedSuccess wiz={wiz} onClose={onClose} onReset={() => setWiz({ ...EMPTY_WIZARD })} />;
    switch (wiz.step) {
      case 1: return <Step1 wiz={wiz} set={set} inp={inp} lbl={lbl} />;
      case 2: return <Step2 wiz={wiz} set={set} inp={inp} lbl={lbl} />;
      case 3: return wiz.showFormCreate ? <FormCreator wiz={wiz} set={set} inp={inp} lbl={lbl} /> : <Step3 wiz={wiz} set={set} inp={inp} lbl={lbl} />;
      case 4: return <Step4 wiz={wiz} set={set} inp={inp} lbl={lbl} />;
      case 5: return <Step5 wiz={wiz} set={set} onCreated={onCreated} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#0f172a] flex flex-col animate-scale-in">
        <div className="relative overflow-hidden rounded-t-3xl px-7 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #00526e 0%, #006d94 50%, #0088ba 100%)' }}>
          <div>
            <h2 className="text-lg font-semibold text-white">Créer un programme</h2>
            <p className="text-blue-200 text-sm mt-0.5">Configurez votre programme d'incubation en 5 étapes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 mr-2">
              {WIZARD_STEPS.map(s => (
                <div key={s.num} className="h-[3px] rounded-full transition-all duration-300"
                  style={{ width: s.num === wiz.step ? 20 : 8, background: s.num < wiz.step ? '#9FE1CB' : s.num === wiz.step ? '#fff' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              {Icons.x}
            </button>
          </div>
        </div>
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <div className="h-full rounded-r-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #006d94, #0F6E56)' }} />
        </div>
        <div className="px-7 py-4 bg-white dark:bg-[#1e293b] border-b border-gray-100 dark:border-gray-800 flex items-center gap-0">
          {WIZARD_STEPS.map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all ${
                  wiz.step > step.num ? 'bg-[#0F6E56] text-white' :
                  wiz.step === step.num ? 'bg-[#006d94] text-white' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'
                }`}>
                  {wiz.step > step.num ? <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg> : step.num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${wiz.step === step.num ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step.label}</span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div className={`w-6 sm:w-8 h-px mx-1 sm:mx-2 flex-shrink-0 ${wiz.step > step.num ? 'bg-[#5DCAA5]' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-7 pt-6 pb-2 bg-white dark:bg-[#0f172a]">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

function Step1({ wiz, set, inp, lbl }) {
  const canNext = wiz.titre.trim() && wiz.secteurs.length > 0;
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Informations du programme</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Renseignez le titre et les secteurs cibles de votre programme.</p>
        <div className="space-y-4">
          <div>
            <label className={lbl}>Titre du programme *</label>
            <input className={inp} type="text" placeholder="ex: Programme FinTech 2026" value={wiz.titre} onChange={e => set({ titre: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Secteur(s) d'activité * — sélection multiple</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SECTORS.map(d => {
                const sel = wiz.secteurs.includes(d);
                return (
                  <button key={d} type="button" onClick={() => {
                    set({ secteurs: sel ? wiz.secteurs.filter(x => x !== d) : [...wiz.secteurs, d] });
                  }} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    sel ? 'bg-[#E1F5EE] text-[#0F6E56] border-[#5DCAA5] dark:bg-[#0F6E56]/20 dark:border-[#5DCAA5]/50' :
                    'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-500'
                  }`}>{d}</button>
                );
              })}
            </div>
            {wiz.secteurs.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">{wiz.secteurs.length} sélectionné(s) :</span>
                {wiz.secteurs.map(s => (
                  <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-[#E1F5EE] text-[#0F6E56] font-medium dark:bg-[#0F6E56]/20 dark:text-[#5DCAA5]">{s}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Vous pouvez sélectionner plusieurs secteurs. Les jurys seront filtrés selon ces domaines.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pb-6">
        <span className="text-xs text-gray-400">Étape 1 sur 5</span>
        <button onClick={() => set({ step: 2 })} disabled={!canNext} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #006d94, #00526e)' }}>
          Suivant →
        </button>
      </div>
    </div>
  );
}

function Step2({ wiz, set, inp, lbl }) {
  const canNext = wiz.dateDebut && wiz.dateFin;
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Description & Dates</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Décrivez le programme et définissez sa période de dépôt.</p>
        <div className="space-y-4">
          <div>
            <label className={lbl}>Description du programme</label>
            <textarea className={inp + ' resize-none'} rows={3} placeholder="Décrivez les objectifs, le public cible, le process de sélection..." value={wiz.description} onChange={e => set({ description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Date de début *</label>
              <input className={inp} type="date" value={wiz.dateDebut} onChange={e => set({ dateDebut: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Date de fin *</label>
              <input className={inp} type="date" value={wiz.dateFin} onChange={e => set({ dateFin: e.target.value })} />
            </div>
          </div>
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Publication automatique</p>
                <p className="text-xs text-gray-400 mt-0.5">Programmez la mise en ligne automatique sur la page publique.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={wiz.autoPublish} onChange={e => set({ autoPublish: e.target.checked })} />
                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-[#0F6E56] rounded-full transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
            {wiz.autoPublish && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#EAF3DE] to-[#E1F5EE] border border-[#9FE1CB] dark:from-[#0F6E56]/10 dark:to-[#0F6E56]/20 dark:border-[#0F6E56]/40">
                <p className="text-xs font-semibold text-[#085041] dark:text-[#5DCAA5] mb-2">Date de publication automatique</p>
                <input className={inp} type="datetime-local" value={wiz.autoPublishDate} onChange={e => set({ autoPublishDate: e.target.value })} />
                <p className="text-xs text-[#0F6E56] dark:text-[#5DCAA5] mt-1.5">Le programme sera visible sur la page publique à cette date/heure exacte.</p>
              </div>
            )}
          </div>
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Critères de sélection</p>
            <ListEditor items={wiz.criteria} inputVal={wiz.newCrit} onInputChange={v => set({ newCrit: v })}
              onAdd={() => { if (wiz.newCrit.trim()) { set({ criteria: [...wiz.criteria, wiz.newCrit.trim()], newCrit: '' }); }}}
              onRemove={i => set({ criteria: wiz.criteria.filter((_, idx) => idx !== i) })}
              placeholder="Ajouter un critère..." inp={inp} />
          </div>
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Objectifs du programme</p>
            <ListEditor items={wiz.objectives} inputVal={wiz.newObj} onInputChange={v => set({ newObj: v })}
              onAdd={() => { if (wiz.newObj.trim()) { set({ objectives: [...wiz.objectives, wiz.newObj.trim()], newObj: '' }); }}}
              onRemove={i => set({ objectives: wiz.objectives.filter((_, idx) => idx !== i) })}
              placeholder="Ajouter un objectif..." inp={inp} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pb-6">
        <button onClick={() => set({ step: 1 })} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">← Précédent</button>
        <button onClick={() => set({ step: 3 })} disabled={!canNext} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #006d94, #00526e)' }}>
          Suivant →
        </button>
      </div>
    </div>
  );
}

function Step3({ wiz, set, inp, lbl }) {
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Lier un formulaire de candidature</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Associez un formulaire existant ou créez-en un nouveau spécifique à ce programme.</p>
        {wiz.linkedForm ? (
          <div className="flex items-center gap-3 p-3.5 bg-[#E1F5EE] dark:bg-[#0F6E56]/20 border border-[#9FE1CB] dark:border-[#0F6E56]/40 rounded-xl mb-4">
            <div className="w-9 h-9 bg-[#0F6E56] rounded-lg flex items-center justify-center text-white flex-shrink-0">{Icons.link}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#085041] dark:text-[#5DCAA5] truncate">{wiz.linkedForm.name}</p>
              <p className="text-xs text-[#0F6E56] dark:text-[#5DCAA5]/70">{wiz.linkedForm.fields} champs · Utilisé dans {wiz.linkedForm.used} programme(s)</p>
            </div>
            <button className="text-xs font-medium px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors" onClick={() => set({ linkedForm: null })}>Changer</button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              <span className="flex-shrink-0 mt-0.5">{Icons.info}</span>
              <span>Sélectionnez un formulaire existant ou créez-en un nouveau pour collecter les candidatures.</span>
            </div>
            <p className={lbl + ' mt-4 mb-2'}>Formulaires disponibles</p>
            <div className="space-y-2 mb-4">
              {FORMS_MOCK.map(f => {
                const sel = wiz.linkedForm?.id === f.id;
                return (
                  <div key={f.id} onClick={() => set({ linkedForm: f })}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${sel ? 'border-[#0F6E56] bg-[#E1F5EE] dark:bg-[#0F6E56]/20 dark:border-[#0F6E56]/60' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${sel ? 'bg-[#0F6E56] border-[#0F6E56]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'}`}>
                      {sel && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-300 flex-shrink-0">{Icons.file}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">{f.fields} champs · {f.used} programme(s)</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.badge === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : f.badge === 'warn' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                      {f.badge === 'success' ? 'Actif' : f.badge === 'warn' ? 'Nouveau' : 'Standard'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucun formulaire adapté ?</p>
              <button onClick={() => set({ showFormCreate: true })} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                {Icons.plus} Créer un nouveau formulaire
              </button>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-between pb-6">
        <button onClick={() => set({ step: 2 })} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">← Précédent</button>
        <div className="flex items-center gap-3">
          {!wiz.linkedForm && <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">Optionnel</span>}
          <button onClick={() => set({ step: 4 })} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #006d94, #00526e)' }}>
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}

function FormCreator({ wiz, set, inp, lbl }) {
  const presets = [
    { id: 'name', label: 'Nom du projet / startup', checked: true },
    { id: 'founder', label: 'Fondateur(s)', checked: true },
    { id: 'sector', label: 'Secteur d\'activité', checked: true },
    { id: 'stage', label: 'Stade de développement', checked: true },
    { id: 'pitch', label: 'Description du projet (pitch)', checked: false },
    { id: 'market', label: 'Marché cible', checked: false },
    { id: 'team', label: 'Composition de l\'équipe', checked: false },
    { id: 'revenue', label: 'Revenus / Traction', checked: false },
  ];
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Créer un formulaire de candidature</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ce formulaire sera créé dans la section Formulaires puis automatiquement assigné à ce programme.</p>
        <div className="space-y-4">
          <button onClick={() => set({ showFormCreate: false })} className="text-xs font-medium px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Retour à la liste
          </button>
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <span className="flex-shrink-0 mt-0.5">{Icons.info}</span>
            <span>Ce formulaire sera créé dans la section Formulaires puis automatiquement assigné à ce programme.</span>
          </div>
          <div>
            <label className={lbl}>Nom du formulaire *</label>
            <input className={inp} type="text" placeholder="ex: Formulaire FinTech 2026" value={wiz._formName} onChange={e => set({ _formName: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Champs prédéfinis à inclure</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {presets.map(p => (
                <div key={p.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer ${p.checked ? 'border-[#0F6E56] bg-[#E1F5EE]/60 dark:bg-[#0F6E56]/10 dark:border-[#0F6E56]/40' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${p.checked ? 'bg-[#0F6E56] border-[#0F6E56]' : 'border-gray-300 dark:border-gray-600'}`}>
                    {p.checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => {
            const newForm = { id: 99, name: wiz._formName || 'Nouveau formulaire', fields: 8, used: 0, badge: 'success' };
            set({ linkedForm: newForm, showFormCreate: false });
          }} className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #0F6E56, #0a5040)' }}>
            Créer et assigner ce formulaire
          </button>
        </div>
      </div>
    </div>
  );
}

function Step4({ wiz, set, inp, lbl }) {
  const filtered = JURY_MOCK.filter(j => {
    const matchSearch = !wiz.searchJury || j.name.toLowerCase().includes(wiz.searchJury.toLowerCase());
    const matchDomain = wiz.filterJuryDomain === 'all' || j.domains.includes(wiz.filterJuryDomain);
    return matchSearch && matchDomain;
  });
  const avatarCls = { blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' };
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Assigner le jury</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Sélectionnez les experts qui évalueront les candidatures de ce programme.</p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className={inp + ' flex-1'} type="text" placeholder="Rechercher un jury..." value={wiz.searchJury} onChange={e => set({ searchJury: e.target.value })} />
            <select className={inp} style={{ width: 'auto' }} value={wiz.filterJuryDomain} onChange={e => set({ filterJuryDomain: e.target.value })}>
              <option value="all">Tous domaines</option>
              {SECTORS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {wiz.jury.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{wiz.jury.length} jury sélectionné(s)</span>
              <button className="text-xs text-blue-600 dark:text-blue-400 underline" onClick={() => set({ jury: [] })}>Tout désélectionner</button>
            </div>
          )}
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Aucun jury correspondant aux filtres.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(j => {
                const isSel = wiz.jury.includes(j.id);
                return (
                  <div key={j.id} onClick={() => set({ jury: isSel ? wiz.jury.filter(id => id !== j.id) : [...wiz.jury, j.id] })}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSel ? 'border-[#0F6E56] bg-[#E1F5EE] dark:bg-[#0F6E56]/10 dark:border-[#0F6E56]/50' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${isSel ? 'bg-[#0F6E56] border-[#0F6E56]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'}`}>
                      {isSel && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarCls[j.cls] || avatarCls.blue}`}>{j.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{j.name}</p>
                      <p className="text-xs text-gray-400">{j.post}</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {j.domains.map(d => <span key={d} className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{d}</span>)}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${j.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : j.status === 'invited' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {j.status === 'active' ? 'Actif' : j.status === 'invited' ? 'Invité' : 'Inactif'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Expert non listé ?</p>
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              {Icons.plus} Inviter un nouveau jury
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pb-6">
        <button onClick={() => set({ step: 3 })} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">← Précédent</button>
        <div className="flex items-center gap-3">
          {wiz.jury.length === 0 && <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">Optionnel</span>}
          <button onClick={() => set({ step: 5 })} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #006d94, #00526e)' }}>
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}

function Step5({ wiz, set, onCreated }) {
  const incomplete = [];
  if (!wiz.titre) incomplete.push('titre');
  if (!wiz.secteurs.length) incomplete.push('secteur');
  if (!wiz.dateDebut || !wiz.dateFin) incomplete.push('dates');
  const isReady = incomplete.length === 0;

  const summaryRows = [
    ['Titre', wiz.titre || '—'],
    ['Secteur(s)', wiz.secteurs.join(', ') || '—'],
    ['Description', wiz.description ? (wiz.description.length > 80 ? wiz.description.slice(0, 80) + '...' : wiz.description) : '—'],
    ['Début', wiz.dateDebut ? new Date(wiz.dateDebut).toLocaleDateString('fr-FR') : '—'],
    ['Fin', wiz.dateFin ? new Date(wiz.dateFin).toLocaleDateString('fr-FR') : '—'],
    ['Publication auto', wiz.autoPublish ? (wiz.autoPublishDate ? new Date(wiz.autoPublishDate).toLocaleString('fr-FR') : 'Date non définie') : 'Non'],
    ['Critères', wiz.criteria.length ? wiz.criteria.length + ' critère(s)' : 'Aucun'],
    ['Objectifs', wiz.objectives.length ? wiz.objectives.length + ' objectif(s)' : 'Aucun'],
    ['Formulaire', wiz.linkedForm ? wiz.linkedForm.name : 'Non lié'],
    ['Jury assigné', wiz.jury.length ? wiz.jury.length + ' membre(s)' : 'Aucun'],
  ];

  const handlePublish = async () => {
    const { isConfirmed } = await confirmWarning(
      'Publier ce programme ?',
      'Le programme sera visible par tous les candidats.',
      'Publier'
    );
    if (!isConfirmed) return;
    onCreated?.({ ...wiz, status: PROGRAMME_STATUS.PUBLISHED });
    set({ isPublished: true });
    toastSuccess('Programme publié avec succès.');
  };

  const handleDraft = () => {
    onCreated?.({ ...wiz, status: PROGRAMME_STATUS.DRAFT });
    set({ isPublished: true });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Révision & Publication</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Vérifiez les informations avant de publier le programme.</p>
        <div>
          {summaryRows.map(([k, v]) => (
            <div key={k} className="flex justify-between items-start py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">{k}</span>
              <span className="text-sm text-gray-900 dark:text-white font-medium text-right">{v}</span>
            </div>
          ))}
          <div className="mt-4">
            {isReady ? (
              <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                <span className="flex-shrink-0 mt-0.5">{Icons.check}</span>
                <span>Programme prêt à être publié.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                <span className="flex-shrink-0 mt-0.5">{Icons.warn}</span>
                <span>Informations manquantes : {incomplete.join(', ')}.</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pb-6">
        <button onClick={() => set({ step: 4 })} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">← Précédent</button>
        <div className="flex gap-3">
          <button onClick={handleDraft} className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">
            Sauvegarder brouillon
          </button>
          <button onClick={handlePublish} disabled={!isReady} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-40"
            style={{ background: isReady ? 'linear-gradient(135deg, #0F6E56, #085041)' : '#9ca3af' }}>
            {Icons.arrow} Publier le programme
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishedSuccess({ wiz, onClose, onReset }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 mx-auto bg-[#E1F5EE] dark:bg-[#0F6E56]/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[#0F6E56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{wiz.titre} publié !</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Votre programme est maintenant visible et prêt à recevoir des candidatures.</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[{ label: 'Secteurs', value: wiz.secteurs.length }, { label: 'Jury assigné', value: wiz.jury.length }, { label: 'Formulaire', value: wiz.linkedForm ? 'Lié' : 'Non lié' }].map(s => (
          <div key={s.label} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center flex-wrap pb-6">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #006d94, #00526e)' }}>Voir le programme</button>
        <button onClick={onReset} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-all">Créer un autre programme</button>
      </div>
    </div>
  );
}

function ListEditor({ items, inputVal, onInputChange, onAdd, onRemove, placeholder, inp }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={inp + ' flex-1'} type="text" placeholder={placeholder} value={inputVal}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }} />
        <button onClick={onAdd} className="px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap">
          + Ajouter
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">Aucun élément ajouté — optionnel</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{item}</span>
              <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500 transition-colors text-base leading-none font-bold">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════
export default function AdminProgrammesPage() {
  const router = useRouter();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const [mounted, setMounted]   = useState(false);
  const [time, setTime]         = useState(new Date());
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [searchTerm, setSearchTerm]     = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy]             = useState('createdAt');
  const [viewMode, setViewMode]         = useState('grid');
  const [showFilters, setShowFilters]   = useState(false);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedProg, setSelectedProg] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const { accessToken } = useSelector(state => state.auth);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadProgrammes = async () => {
      setLoading(true);
      try {
        const { data } = await axiosAuth.get('/api/admin/programmes');
        setProgrammes(data.programmes || []);
      } catch (err) {
        console.error('[loadProgrammes]', err);
        setProgrammes(MOCK_PROGRAMMES);
      } finally {
        setLoading(false);
      }
    };
    if (mounted) {
      loadProgrammes();
    }
  }, [mounted]);

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
  };

  const handleDelete = async (prog) => {
    try {
      await axiosAuth.delete(`/api/admin/programmes/${prog._id}`);
      setProgrammes(prev => prev.filter(p => p._id !== prog._id));
      showNotification('success', `"${prog.titre}" supprimé.`);
      setConfirmDelete(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur suppression.';
      showNotification('error', msg);
      setConfirmDelete(null);
    }
  };

  const handleToggleStatus = async (prog, e) => {
    e.stopPropagation();
    const newStatus = prog.status === PROGRAMME_STATUS.PUBLISHED
      ? PROGRAMME_STATUS.CLOSED
      : (prog.status === PROGRAMME_STATUS.DRAFT || prog.status === PROGRAMME_STATUS.SCHEDULED)
        ? PROGRAMME_STATUS.PUBLISHED
        : null;
    if (!newStatus) return;

    try {
      const { data } = await axiosAuth.patch(
        `/api/admin/programmes/${prog._id}/status`,
        { status: newStatus }
      );
      setProgrammes(prev => prev.map(p => p._id === prog._id ? data.programme : p));
      showNotification('success', newStatus === PROGRAMME_STATUS.PUBLISHED ? `"${prog.titre}" publié.` : `"${prog.titre}" clôturé.`);
    } catch (err) {
      showNotification('error', 'Erreur changement de statut.');
    }
  };

  const handleSaveEdit = async (updated) => {
    try {
      const { data } = await axiosAuth.put(
        `/api/admin/programmes/${updated._id}`,
        updated
      );
      setProgrammes(prev => prev.map(p => p._id === updated._id ? data.programme : p));
      setIsEditModalOpen(false);
      showNotification('success', `"${updated.titre}" mis à jour.`);
    } catch (err) {
      console.error('[handleSaveEdit]', err);
      showNotification('error', 'Erreur lors de la mise à jour.');
    }
  };

  const handleDuplicate = async (prog, e) => {
    e.stopPropagation();
    const payload = {
      ...prog,
      titre:        `${prog.titre} (copie)`,
      status:       PROGRAMME_STATUS.DRAFT,
      candidatures: 0,
    };
    delete payload._id;

    try {
      const { data } = await axiosAuth.post('/api/admin/programmes', payload);
      setProgrammes(prev => [data.programme, ...prev]);
      showNotification('success', `"${data.programme.titre}" créé en brouillon.`);
    } catch (err) {
      showNotification('error', 'Erreur lors de la duplication.');
    }
  };

  const handleWizardCreated = async (wiz) => {
    const { titre, secteurs, status, description, dateDebut, dateFin,
            criteria, objectives, linkedForm, autoPublish, autoPublishDate } = wiz;

    const payload = {
      titre:       titre || 'Sans titre',
      description: description || '',
      sector:      secteurs?.[0] || 'Tous secteurs',
      status,
      dateDebut:   dateDebut || new Date().toISOString().split('T')[0],
      dateFin:     dateFin || '',
      quota:       null,
      formulaire:  linkedForm?.name || '',
      objectives:  objectives || [],
      criteria:    criteria   || [],
      scheduledPublish: (autoPublish && autoPublishDate) ? autoPublishDate : null,
    };

    try {
      const { data } = await axiosAuth.post('/api/admin/programmes', payload);
      setProgrammes(prev => [data.programme, ...prev]);
      showNotification('success', `"${data.programme.titre}" ${status === 'published' ? 'publié' : 'créé en brouillon'}.`);
    } catch (err) {
      console.error('[handleWizardCreated]', err);
      showNotification('error', 'Erreur lors de la création du programme.');
    }
  };

  const filtered = programmes
    .filter(p => {
      const q = searchTerm.toLowerCase();
      const matchSearch = p.titre.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.sector.toLowerCase().includes(q);
      const matchSector = filterSector === 'all' || p.sector === filterSector;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchSector && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'candidatures') return b.candidatures - a.candidatures;
      if (sortBy === 'dateFin') return new Date(a.dateFin) - new Date(b.dateFin);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const stats = {
    total:             programmes.length,
    published:         programmes.filter(p => p.status === PROGRAMME_STATUS.PUBLISHED).length,
    draft:             programmes.filter(p => p.status === PROGRAMME_STATUS.DRAFT || p.status === PROGRAMME_STATUS.SCHEDULED).length,
    closed:            programmes.filter(p => p.status === PROGRAMME_STATUS.CLOSED).length,
    totalCandidatures: programmes.reduce((a, p) => a + (Number(p.candidatures) || 0), 0),
  };
  
  const activeFiltersCount = [filterSector !== 'all', filterStatus !== 'all', searchTerm !== ''].filter(Boolean).length;

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
          @keyframes slideInUp { from{opacity:0;transform:translateY(50px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideInRight { from{opacity:0;transform:translateX(100px)} to{opacity:1;transform:translateX(0)} }
          @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          @keyframes holographic-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          .animate-slide-in-up    { animation:slideInUp 0.6s ease-out forwards }
          .animate-slide-in-right { animation:slideInRight 0.6s ease-out forwards }
          .animate-scale-in       { animation:scaleIn 0.5s ease-out forwards }
          .animate-fade-in        { animation:fadeIn 0.3s ease forwards }
          .glass-card  { background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border:1px solid rgba(0,0,0,0.05) }
          :global(.dark) .glass-card { background:#1e293b;border:1px solid #334155 }
          .dark-glass  { background:linear-gradient(135deg,rgba(0,82,110,0.9),rgba(0,109,148,0.9));backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1) }
          .holographic { position:relative;background:linear-gradient(135deg,rgba(0,186,255,0.1) 0%,rgba(255,191,0,0.1) 50%,rgba(0,186,255,0.1) 100%);background-size:200% 200%;animation:holographic-shift 3s ease infinite }
          .cyber-grid  { background-image:linear-gradient(rgba(0,186,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,191,0,0.05) 1px,transparent 1px);background-size:50px 50px }
          .stat-card   { position:relative;overflow:hidden;transition:all 0.3s ease }
          .stat-card:hover { transform:translateY(-4px);box-shadow:0 20px 25px -5px rgba(0,82,110,0.2) }
          :global(.dark) .stat-card:hover { box-shadow:0 20px 25px -5px rgba(0,0,0,0.5) }
          .prog-card   { transition:all 0.3s ease;cursor:pointer }
          .prog-card:hover { transform:translateY(-4px);box-shadow:0 20px 25px -5px rgba(0,82,110,0.15) }
          :global(.dark) .prog-card:hover { box-shadow:0 20px 25px -5px rgba(0,0,0,0.5) }
          .prog-list-row { transition:all 0.2s ease;cursor:pointer }
          .prog-list-row:hover { background:rgba(0,82,110,0.04) }
          :global(.dark) .prog-list-row:hover { background:rgba(255,255,255,0.03) }
          .particle { position:absolute;width:4px;height:4px;background:rgba(255,255,255,0.3);border-radius:50%;animation:float 6s ease-in-out infinite }
          .mono { font-family:'JetBrains Mono',monospace }
        `}</style>

        <div className="space-y-7 cyber-grid min-h-screen pb-10">
          {/* Alert */}
          {alert.show && (
            <div className="animate-fade-in fixed top-4 right-4 z-50 max-w-sm">
              <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'}`}>
                <span className="text-sm font-medium">{alert.message}</span>
                <button onClick={() => setAlert({ show: false })} className="ml-2 opacity-60 hover:opacity-100">{Icons.x}</button>
              </div>
            </div>
          )}

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl p-10 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg, #00526e 0%, #006d94 50%, #0088ba 100%)' }}>
            <div className="particle" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
            <div className="particle" style={{ top: '60%', left: '80%', animationDelay: '1s' }}></div>
            <div className="particle" style={{ top: '30%', left: '50%', animationDelay: '2s' }}></div>
            <div className="absolute inset-0 holographic opacity-30"></div>
            <div className="relative flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Gestion des Programmes</h1>
                <p className="text-blue-200 text-lg font-medium">Créez et gérez les programmes d'incubation MEDIANET</p>
                <div className="flex items-center gap-6 text-blue-100 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">System Online</span>
                  </div>
                  <div className="w-px h-4 bg-blue-400/30 hidden sm:block"></div>
                  <div className="mono text-sm">{mounted && time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  <div className="w-px h-4 bg-blue-400/30 hidden sm:block"></div>
                  <div className="mono text-sm">{mounted && time.toLocaleDateString('fr-FR', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                </div>
              </div>
              <div className="dark-glass rounded-2xl p-5 min-w-[260px] animate-slide-in-right">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl">
                      {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{currentUser?.name || 'Admin'}</p>
                    <p className="text-blue-200 text-sm mono">SYS.ADMIN</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-12 h-1 bg-primary-400 rounded-full"></div>
                      <div className="w-8 h-1 bg-secondary-500 rounded-full"></div>
                      <div className="w-4 h-1 bg-yellow-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Total',          value: stats.total,             color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/30', delay: '0.1s' },
              { label: 'Publiés',        value: stats.published,         color: 'text-green-600 dark:text-green-400',     bg: 'bg-green-100 dark:bg-green-900/30',     delay: '0.15s' },
              { label: 'En préparation', value: stats.draft,             color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-900/30',     delay: '0.2s' },
              { label: 'Clôturés',       value: stats.closed,            color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-100 dark:bg-gray-800',          delay: '0.25s' },
              { label: 'Candidatures',   value: stats.totalCandidatures, color: 'text-purple-600 dark:text-purple-400',   bg: 'bg-purple-100 dark:bg-purple-900/30',   delay: '0.3s' },
            ].map((s, i) => (
              <div key={i} className="stat-card glass-card rounded-2xl p-5 animate-scale-in dark:!bg-[#1e293b]" style={{ animationDelay: s.delay }}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <span className={`font-bold text-sm ${s.color}`}>#</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${showFilters ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <span className={showFilters ? 'text-primary-600' : ''}>{Icons.filter}</span>
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{activeFiltersCount}</span>
                )}
              </button>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2.5 text-sm bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                <option value="createdAt">Trier : Date de création</option>
                <option value="candidatures">Trier : Candidatures</option>
                <option value="dateFin">Trier : Date de fin</option>
              </select>
              <div className="flex items-center bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{Icons.grid}</button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{Icons.list}</button>
              </div>
            </div>
            <button onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-900/20 transition-all flex items-center gap-2">
              {Icons.plus} Créer un programme
            </button>
          </div>

          {/* Search + Filters */}
          <div className="glass-card rounded-2xl p-5 dark:!bg-[#1e293b]">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
                <input type="text" placeholder="Rechercher par titre, description, secteur..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">{Icons.x}</button>
                )}
              </div>
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-scale-in">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5">Secteur</label>
                    <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                      <option value="all">Tous les secteurs</option>
                      {ALL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5">Statut</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                      <option value="all">Tous les statuts</option>
                      <option value={PROGRAMME_STATUS.PUBLISHED}>Publié</option>
                      <option value={PROGRAMME_STATUS.DRAFT}>Brouillon</option>
                      <option value={PROGRAMME_STATUS.SCHEDULED}>Planifié</option>
                      <option value={PROGRAMME_STATUS.CLOSED}>Clôturé</option>
                    </select>
                  </div>
                  {activeFiltersCount > 0 && (
                    <button onClick={() => { setFilterSector('all'); setFilterStatus('all'); setSearchTerm(''); }}
                      className="sm:col-span-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                      {Icons.x} Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="px-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Chargement...' : `${filtered.length} programme${filtered.length !== 1 ? 's' : ''} trouvé${filtered.length !== 1 ? 's' : ''}`}
              {activeFiltersCount > 0 && <span className="text-primary-600 dark:text-primary-400"> (filtré{filtered.length !== 1 ? 's' : ''})</span>}
            </p>
          </div>

          {/* ══ GRID VIEW ══ */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl p-6 animate-pulse dark:!bg-[#1e293b]">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div></div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="col-span-full glass-card rounded-2xl p-12 text-center dark:!bg-[#1e293b]">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-400">{Icons.filter}</div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucun programme trouvé</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Créez votre premier programme ou ajustez les filtres.</p>
                  {activeFiltersCount > 0 && (
                    <button onClick={() => { setFilterSector('all'); setFilterStatus('all'); setSearchTerm(''); }} className="px-4 py-2 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-xl hover:bg-primary-100 transition-colors">
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((prog, idx) => {
                  const style    = getSectorStyle(prog.sector);
                  const daysLeft = getDaysLeft(prog.dateFin);
                  const fillRate = getFillRate(prog.candidatures, prog.quota);
                  const sm       = STATUS_MAP[prog.status] || STATUS_MAP[PROGRAMME_STATUS.DRAFT];
                  const canPublish = prog.status === PROGRAMME_STATUS.DRAFT || prog.status === PROGRAMME_STATUS.SCHEDULED;
                  const canClose   = prog.status === PROGRAMME_STATUS.PUBLISHED;
                  return (
                    <div key={prog._id} className="prog-card glass-card rounded-2xl overflow-hidden animate-scale-in dark:!bg-[#1e293b] group"
                      style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => router.push(`/dashboard/admin/programmes/${prog._id}`)}>
                      <div className="h-1.5 w-full" style={{ background: style.bar }}></div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1.5 line-clamp-1">{prog.titre}</h3>
                            <div className="flex flex-wrap gap-1.5">
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${style.bg} ${style.text}`}>{prog.sector}</span>
                              <Badge variant={sm.variant} size="sm">{sm.label}</Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">{prog.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                          <span className="text-gray-400 flex-shrink-0">{Icons.calendar}</span>
                          <span className="mono">
                            {new Date(prog.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(prog.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {prog.status === PROGRAMME_STATUS.PUBLISHED && daysLeft > 0 && (
                            <span className={`ml-auto font-semibold flex-shrink-0 ${daysLeft <= 14 ? 'text-red-500' : 'text-amber-500'}`}>{daysLeft}j restants</span>
                          )}
                          {prog.status === PROGRAMME_STATUS.CLOSED && <span className="ml-auto text-gray-400 text-xs flex-shrink-0">Terminé</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                          <span className="text-gray-400">{Icons.users}</span>
                          <span>{prog.candidatures} candidature{prog.candidatures !== 1 ? 's' : ''}{prog.quota ? ` / ${prog.quota} places` : ' (illimité)'}</span>
                          {prog.jury && prog.jury.length > 0 && <span className="ml-auto flex items-center gap-1 text-gray-400"><span>{Icons.jury}</span>{prog.jury.length} jury</span>}
                        </div>
                        {fillRate !== null && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span>Remplissage</span>
                              <span className={fillRate >= 80 ? 'text-red-500 font-semibold' : fillRate >= 50 ? 'text-amber-500 font-semibold' : 'text-green-500 font-semibold'}>{fillRate}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${fillRate >= 80 ? 'bg-red-400' : fillRate >= 50 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${fillRate}%` }}></div>
                            </div>
                          </div>
                        )}
                        {prog.formulaire && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span className="text-gray-400">{Icons.form}</span>
                            <span className="truncate">{prog.formulaire}</span>
                          </div>
                        )}
                        {prog.status === PROGRAMME_STATUS.SCHEDULED && prog.scheduledPublish && (
                          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 mb-3">
                            <span className="flex-shrink-0">{Icons.clock}</span>
                            <span>Publication le {new Date(prog.scheduledPublish).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                          </div>
                        )}
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 mono">{formatDate(prog.createdAt)}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin/programmes/${prog._id}/timeline`); }}
                              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition-colors" title="Gérer le timeline">{Icons.timeline}</button>
                            {canPublish && (
                              <button onClick={(e) => handleToggleStatus(prog, e)} className="px-2.5 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 rounded-lg transition-all">Publier</button>
                            )}
                            {canClose && (
                              <button onClick={(e) => handleToggleStatus(prog, e)} className="px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition-all">Clôturer</button>
                            )}
                            <button onClick={(e) => handleDuplicate(prog, e)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors" title="Dupliquer">{Icons.duplicate}</button>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedProg(prog); setIsEditModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors" title="Modifier">{Icons.edit}</button>
                            {prog.status !== PROGRAMME_STATUS.PUBLISHED && (
                              <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(prog); }} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Supprimer">{Icons.delete}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ══ LIST VIEW ══ */}
          {viewMode === 'list' && (
            <div className="glass-card rounded-2xl overflow-hidden dark:!bg-[#1e293b]">
              {loading ? (
                <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucun programme trouvé</p>
                  <p className="text-sm">Créez votre premier programme ou ajustez les filtres.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                      {['Programme', 'Secteur', 'Statut', 'Candidatures', 'Dates', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filtered.map((prog, i) => {
                      const style    = getSectorStyle(prog.sector);
                      const sm       = STATUS_MAP[prog.status] || STATUS_MAP[PROGRAMME_STATUS.DRAFT];
                      const fillRate = getFillRate(prog.candidatures, prog.quota);
                      return (
                        <tr key={prog._id} className={`prog-list-row ${i % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-gray-900/10'}`} onClick={() => router.push(`/dashboard/admin/programmes/${prog._id}`)}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: style.bar }}></div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{prog.titre}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 max-w-[240px]">{prog.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5"><span className={`px-2 py-0.5 text-xs rounded-full font-medium ${style.bg} ${style.text}`}>{prog.sector}</span></td>
                          <td className="px-5 py-3.5"><Badge variant={sm.variant} size="sm">{sm.label}</Badge></td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{prog.candidatures}{prog.quota ? ` / ${prog.quota}` : ''}</p>
                              {fillRate !== null && (
                                <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                  <div className={`h-full rounded-full ${fillRate >= 80 ? 'bg-red-400' : fillRate >= 50 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${fillRate}%` }}></div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 mono whitespace-nowrap">
                            {new Date(prog.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(prog.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => router.push(`/dashboard/admin/programmes/${prog._id}/timeline`)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition-colors" title="Gérer le timeline">{Icons.timeline}</button>
                              {(prog.status === PROGRAMME_STATUS.DRAFT || prog.status === PROGRAMME_STATUS.SCHEDULED) && (
                                <button onClick={(e) => handleToggleStatus(prog, e)} className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 transition-colors">Publier</button>
                              )}
                              {prog.status === PROGRAMME_STATUS.PUBLISHED && (
                                <button onClick={(e) => handleToggleStatus(prog, e)} className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors">Clôturer</button>
                              )}
                              <button onClick={(e) => handleDuplicate(prog, e)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition-colors" title="Dupliquer">{Icons.duplicate}</button>
                              <button onClick={(e) => { e.stopPropagation(); setSelectedProg(prog); setIsEditModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition-colors" title="Modifier">{Icons.edit}</button>
                              {prog.status !== PROGRAMME_STATUS.PUBLISHED && (
                                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(prog); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors" title="Supprimer">{Icons.delete}</button>
                              )}
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

        {/* ── Create Programme Wizard (5-step) ── */}
        {isWizardOpen && (
          <CreateProgrammeWizard
            onClose={() => setIsWizardOpen(false)}
            onCreated={handleWizardCreated}
          />
        )}

        {/* ── Edit Modal ── */}
        {selectedProg && isEditModalOpen && (
          <ProgrammeEditModal
            programme={selectedProg}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEdit}
          />
        )}

        {/* ── Confirm Delete Modal ── */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl p-6 animate-scale-in">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                Êtes-vous sûr de vouloir supprimer <strong>"{confirmDelete.titre}"</strong> ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">Annuler</button>
                <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        )}

      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────
function ProgrammeEditModal({ programme, onClose, onSave }) {
  const [form, setForm] = useState(programme);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (programme) setForm(programme); }, [programme]);

  if (!programme) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { onSave(form); setLoading(false); }, 400);
  };

  const inputCls  = "w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
  const labelCls  = "block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5";
  const selectCls = "w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Modifier : {programme.titre}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Titre du programme *</label>
            <input type="text" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Secteur</label>
              <select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} className={selectCls}>
                {ALL_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Statut</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={selectCls}>
                <option value={PROGRAMME_STATUS.DRAFT}>Brouillon</option>
                <option value={PROGRAMME_STATUS.SCHEDULED}>Planifié</option>
                <option value={PROGRAMME_STATUS.PUBLISHED}>Publié</option>
                <option value={PROGRAMME_STATUS.CLOSED}>Clôturé</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date de début *</label>
              <input type="date" value={form.dateDebut?.split('T')[0] || ''} onChange={e => setForm({ ...form, dateDebut: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Date de fin *</label>
              <input type="date" value={form.dateFin?.split('T')[0] || ''} onChange={e => setForm({ ...form, dateFin: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quota de places</label>
              <input type="number" min="1" value={form.quota || ''} onChange={e => setForm({ ...form, quota: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} placeholder="Illimité si vide" />
            </div>
            <div>
              <label className={labelCls}>Publication planifiée</label>
              <input type="date" value={form.scheduledPublish?.split('T')[0] || ''} onChange={e => setForm({ ...form, scheduledPublish: e.target.value || null })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Formulaire lié</label>
            <input type="text" value={form.formulaire || ''} onChange={e => setForm({ ...form, formulaire: e.target.value })} className={inputCls} placeholder="Nom du formulaire" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Annuler</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}