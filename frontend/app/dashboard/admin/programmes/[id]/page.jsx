// FIXES APPLIQUÉS :
// 1. notes normalisées avec id au chargement (useEffect setProgramme)
// 2. documents normalisés avec id au chargement
// 3. sortedNotes.map utilise fallback key robuste
// 4. auditLog normalisé avec id
// Chercher "// FIX" pour voir les changements

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import { axiosAuth } from '@/app/store/slices/authSlice';
import EvaluationTabSection from './EvaluationTabSection';

const PROGRAMME_STATUS = {
  DRAFT: 'draft', PUBLISHED: 'published', CLOSED: 'closed', SCHEDULED: 'scheduled',
};

const SECTOR_COLORS = {
  'FinTech':       { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',    bar: '#185FA5' },
  'HealthTech':    { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300',  bar: '#1D9E75' },
  'AgriTech':      { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300',  bar: '#BA7517' },
  'EdTech':        { bg: 'bg-purple-100 dark:bg-purple-900/30',text: 'text-purple-700 dark:text-purple-300',bar: '#534AB7' },
  'CleanTech':     { bg: 'bg-teal-100 dark:bg-teal-900/30',    text: 'text-teal-700 dark:text-teal-300',    bar: '#0F6E56' },
  'E-Commerce':    { bg: 'bg-orange-100 dark:bg-orange-900/30',text: 'text-orange-700 dark:text-orange-300',bar: '#D85A30' },
  'AI/ML':         { bg: 'bg-pink-100 dark:bg-pink-900/30',    text: 'text-pink-700 dark:text-pink-300',    bar: '#993556' },
  'Tous secteurs': { bg: 'bg-gray-100 dark:bg-gray-800',       text: 'text-gray-700 dark:text-gray-300',    bar: '#5F5E5A' },
};
const getSectorStyle = (sector) => SECTOR_COLORS[sector] || SECTOR_COLORS['Tous secteurs'];

const ALL_JURY_POOL = [
  { id: 'jury-1', firstName: 'Karim',   lastName: 'Ghorbel',    post: 'CFO',               company: 'Medianet',            domains: ['FinTech', 'E-Commerce'], status: 'active',   email: 'karim.ghorbel@medianet.tn' },
  { id: 'jury-2', firstName: 'Sonia',   lastName: 'Mrad',        post: 'Dir. Innovation',   company: 'Tunisie Telecom',     domains: ['AI/ML', 'EdTech'],        status: 'active',   email: 'sonia.mrad@tt.tn' },
  { id: 'jury-3', firstName: 'Yassine', lastName: 'Ben Salah',   post: 'Partner',            company: 'AfricaVentures',      domains: ['AgriTech', 'CleanTech'],  status: 'active',   email: 'y.bensalah@africaventures.tn' },
  { id: 'jury-4', firstName: 'Amira',   lastName: 'Hamdani',     post: 'CEO',                company: 'HealthBridge Africa', domains: ['HealthTech'],             status: 'invited',  email: 'amira.hamdani@healthbridge.africa' },
  { id: 'jury-5', firstName: 'Omar',    lastName: 'Trabelsi',    post: 'Head of Digital',   company: 'Attijari Bank',       domains: ['FinTech'],                status: 'inactive', email: 'o.trabelsi@attijari.tn' },
];

const DEFAULT_EVAL_CRITERIA = [
  { id: 'innovation',  label: 'Innovation & Technologie',    weight: 30 },
  { id: 'impact',      label: 'Impact social & économique',  weight: 25 },
  { id: 'viabilite',   label: 'Viabilité du modèle',         weight: 25 },
  { id: 'equipe',      label: 'Équipe & Compétences',        weight: 20 },
];

const DECISION_STATUS = {
  accepted:  { label: 'Acceptée',    variant: 'success', color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800' },
  rejected:  { label: 'Refusée',     variant: 'error',   color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-200 dark:border-red-800'   },
  pending:   { label: 'En attente',  variant: 'warning', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800' },
  waitlist:  { label: 'Liste att.',  variant: 'primary', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800'  },
};

const formatDate = (d, opts = {}) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric', ...opts }) : '—';
const getDaysLeft = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
const getFillRate = (c, q) => !q ? null : Math.min(Math.round((c / q) * 100), 100);

const STATUS_MAP = {
  [PROGRAMME_STATUS.PUBLISHED]: { label:'Publié',    variant:'success' },
  [PROGRAMME_STATUS.DRAFT]:     { label:'Brouillon', variant:'gray'    },
  [PROGRAMME_STATUS.CLOSED]:    { label:'Clôturé',   variant:'error'   },
  [PROGRAMME_STATUS.SCHEDULED]: { label:'Planifié',  variant:'warning' },
};

const CANDIDATURE_STATUS = {
  pending:   { label:'En attente',  variant:'warning' },
  reviewing: { label:'En révision', variant:'primary' },
  interview: { label:'Entretien',   variant:'accent'  },
  accepted:  { label:'Acceptée',    variant:'success' },
  rejected:  { label:'Rejetée',     variant:'error'   },
};

const NOTE_TYPES = {
  general:  { label:'General',  color:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  jury:     { label:'Jury',     color:'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  candidat: { label:'Candidat', color:'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  urgent:   { label:'Urgent',   color:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// FIX: Helper pour normaliser un tableau avec id garanti
const normalizeWithId = (arr, prefix = 'item') =>
  (arr || []).map((item, idx) => ({
    ...item,
    id: item.id ?? item._id?.toString?.() ?? `${prefix}-${idx}-${Date.now()}`,
  }));

const IC = {
  back:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  timeline: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  users:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  jury:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  form:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  target:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} stroke="currentColor" fill="none"/><circle cx="12" cy="12" r="6" strokeWidth={2} stroke="currentColor" fill="none"/><circle cx="12" cy="12" r="2" strokeWidth={2} stroke="currentColor" fill="none"/></svg>,
  star:     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  clock:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  check:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>,
  x:        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  plus:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>,
  edit:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  trash:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  search:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  eye:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  link:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M11 12h2"/></svg>,
  unlink:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>,
  globe:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  download: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  upload:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"/></svg>,
  pin:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>,
  pinFill:  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>,
  history:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  chart:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  prev:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>,
  next:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>,
  decision: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  eval:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>,
  send:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
  arrowRight:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>,
};

// ═══════════════════════════════════════════════════════════════
// FORM LINK MODAL — inchangé
// ═══════════════════════════════════════════════════════════════
function FormLinkModal({ isOpen, onClose, programme, onLink }) {
  const [forms,    setForms]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(programme?.formulaire || '');
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axiosAuth.get('/api/forms?status=all');
        setForms(data.forms || []);
      } catch (err) {
        console.error('❌ Erreur loading forms:', err);
        setForms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

  const filtered = forms.filter(f =>
    (f.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.subtitle || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusCls = {
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    draft:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    archived:  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };

  const publishedForms = filtered.filter(f => f.status === 'published');
  const draftForms = filtered.filter(f => f.status === 'draft' || !f.status);
  const archivedForms = filtered.filter(f => f.status === 'archived');

  const FormItem = ({ f, sel }) => (
    <div key={f._id || f.id} onClick={() => setSelected(f.title)}
      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${sel ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 ring-2 ring-primary-300/30' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 bg-gray-50 dark:bg-gray-800/50'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${sel ? 'border-primary-600 bg-primary-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'}`}>
        {sel && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.type === 'basic' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>
        {IC.form}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{f.title || '(Sans titre)'}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls[f.status] || statusCls.draft}`}>
            {{ published: 'Publié', draft: 'Brouillon', archived: 'Archivé' }[f.status] || f.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {f.fields || f.questions?.length || 0} champs{f.responses > 0 && ` · ${f.responses} réponses`}
        </p>
      </div>
    </div>
  );

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lier un formulaire" size="lg">
      <div className="space-y-4">
        {programme?.formulaire && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">ℹ️</span>
            <span><strong>Formulaire actuel:</strong> "{programme.formulaire}"</span>
          </div>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{IC.search}</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un formulaire…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
            <span className="text-sm">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Aucun formulaire disponible.</div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {publishedForms.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2 px-1">✓ Publiés ({publishedForms.length})</p>
                <div className="space-y-2">{publishedForms.map(f => <FormItem key={f._id} f={f} sel={selected === f.title || selected === f._id?.toString()} />)}</div>
              </div>
            )}
            {draftForms.length > 0 && (
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 px-1">📝 Brouillons ({draftForms.length})</p>
                <div className="space-y-2">{draftForms.map(f => <FormItem key={f._id} f={f} sel={selected === f.title || selected === f._id?.toString()} />)}</div>
              </div>
            )}
            {archivedForms.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">📦 Archivés ({archivedForms.length})</p>
                <div className="space-y-2">{archivedForms.map(f => <FormItem key={f._id} f={f} sel={selected === f.title || selected === f._id?.toString()} />)}</div>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">Annuler</button>
          <button onClick={() => { if (!selected) return; setSaving(true); onLink(selected); setSaving(false); }}
            disabled={saving || !selected}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
            {saving ? 'Liaison…' : <>{IC.link} Lier ce formulaire</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// FORM PREVIEW MODAL — inchangé
// ═══════════════════════════════════════════════════════════════
function FormPreviewModal({ isOpen, onClose, formTitle, onChangeForm, router }) {
  const [formData,  setFormData]  = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('questions');
  const [respIdx,   setRespIdx]   = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen || !formTitle) return;
    const load = async () => {
      setLoading(true);
      setTab('questions');
      setSubmitted(false);
      setAnswers({});
      try {
        const { data: listData } = await axiosAuth.get('/api/forms?status=all');
        const form = (listData.forms || []).find(f => f.title === formTitle || f._id?.toString() === formTitle);
        if (form) {
          setFormData(form);
          try {
            const { data: respData } = await axiosAuth.get(`/api/forms/${form._id}/responses`);
            setResponses(respData.responses || []);
          } catch { setResponses([]); }
        } else {
          setFormData(null);
        }
      } catch { setFormData(null); }
      finally { setLoading(false); }
    };
    load();
  }, [isOpen, formTitle]);

  if (!isOpen) return null;

  const questions = formData?.questions || [];
  const currentResp = responses[respIdx];

  const renderPreviewInput = (q) => {
    const val = answers[q.id];
    const set = (v) => setAnswers(prev => ({ ...prev, [q.id]: v }));
    const base = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20";
    switch (q.type) {
      case 'short':    return <input type="text" value={val||''} onChange={e=>set(e.target.value)} placeholder="Votre réponse…" className={base}/>;
      case 'long':     return <textarea rows={3} value={val||''} onChange={e=>set(e.target.value)} placeholder="Votre réponse…" className={base + ' resize-none'}/>;
      case 'radio':    return <div className="space-y-2">{(q.options||[]).map(o=><label key={o} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"><input type="radio" name={q.id} checked={val===o} onChange={()=>set(o)} className="accent-primary-600 w-4 h-4"/>{o}</label>)}</div>;
      case 'checkbox': return <div className="space-y-2">{(q.options||[]).map(o=>{const arr=val||[];return<label key={o} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"><input type="checkbox" checked={arr.includes(o)} onChange={e=>set(e.target.checked?[...arr,o]:arr.filter(x=>x!==o))} className="accent-primary-600 w-4 h-4"/>{o}</label>})}</div>;
      case 'dropdown': return <select value={val||''} onChange={e=>set(e.target.value)} className={base}><option value="">Choisir…</option>{(q.options||[]).map(o=><option key={o}>{o}</option>)}</select>;
      case 'date':     return <input type="date" value={val||''} onChange={e=>set(e.target.value)} className={base}/>;
      case 'file':     return <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center text-xs text-gray-400">📎 Cliquer pour uploader</div>;
      default:         return <input type="text" value={val||''} onChange={e=>set(e.target.value)} className={base}/>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Formulaire — ${formTitle}`} size="xl">
      <div className="space-y-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'questions', label: `Questions${questions.length ? ` (${questions.length})` : ''}` },
            { id: 'responses', label: `Réponses${responses.length ? ` (${responses.length})` : ''}` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
            <span className="text-sm">Chargement…</span>
          </div>
        ) : !formData ? (
          <div className="text-center py-12 text-gray-400 text-sm">Formulaire introuvable.</div>
        ) : (
          <>
            {tab === 'questions' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{formData.title}</h3>
                  {formData.subtitle && <p className="text-xs text-gray-500 mb-2">{formData.subtitle}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>{questions.length} champ(s)</span>
                    <span>{responses.length} réponse(s)</span>
                  </div>
                </div>
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Aucune question.</div>
                ) : submitted ? (
                  <div className="flex flex-col items-center gap-4 py-10 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl">✓</div>
                    <p className="font-semibold text-gray-900 dark:text-white">Réponse soumise (aperçu)</p>
                    <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="text-sm text-primary-600 underline">Réinitialiser</button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {questions.map((q, i) => (
                      <div key={q.id} className="bg-white dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{i + 1}. {q.title || q.label}{q.required && <span className="text-red-500 ml-1">*</span>}</p>
                        {renderPreviewInput(q)}
                      </div>
                    ))}
                    <button onClick={() => setSubmitted(true)} className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl">Soumettre (aperçu)</button>
                  </div>
                )}
              </div>
            )}
            {tab === 'responses' && (
              <div className="space-y-4">
                {responses.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-sm">Aucune réponse pour ce formulaire.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800">
                      <button onClick={() => setRespIdx(i => Math.max(0, i - 1))} disabled={respIdx === 0} className="p-1.5 rounded-lg border text-gray-500 hover:text-gray-900 disabled:opacity-30">{IC.prev}</button>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentResp?.respondent || '—'}</p>
                        <p className="text-xs text-gray-400">Réponse {respIdx + 1} / {responses.length}</p>
                      </div>
                      <button onClick={() => setRespIdx(i => Math.min(responses.length - 1, i + 1))} disabled={respIdx === responses.length - 1} className="p-1.5 rounded-lg border text-gray-500 hover:text-gray-900 disabled:opacity-30">{IC.next}</button>
                    </div>
                    {formData._id && (
                      <button onClick={() => { onClose(); router.push(`/dashboard/admin/forms/${formData._id}/responses`); }}
                        className="w-full py-2.5 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 flex items-center justify-center gap-2">
                        {IC.chart} Voir toutes les réponses →
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onChangeForm} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl flex items-center gap-2">{IC.link} Changer</button>
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl">Fermer</button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// JURY ASSIGN MODAL — inchangé
// ═══════════════════════════════════════════════════════════════
function JuryAssignModal({ isOpen, onClose, programme, onSave }) {
  const [selected, setSelected] = useState(programme?.jury || []);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = ALL_JURY_POOL.filter(j =>
    `${j.firstName} ${j.lastName} ${j.company}`.toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (name) => setSelected(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);

  const statusColor = {
    active:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    invited:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assigner des jurys — ${programme?.titre}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
          <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">{selected.length} jury(s) sélectionné(s)</span>
          {selected.length > 0 && <button onClick={() => setSelected([])} className="text-xs text-primary-600 underline">Tout désélectionner</button>}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{IC.search}</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white focus:outline-none" />
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filtered.map(j => {
            const fullName = `${j.firstName} ${j.lastName}`;
            const sel = selected.includes(fullName);
            return (
              <div key={j.id} onClick={() => toggle(fullName)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${sel ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 bg-gray-50 dark:bg-gray-800/50'}`}>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 flex-shrink-0 ${sel ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'}`}>
                  {sel && <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#006d94,#0088ba)' }}>
                  {j.firstName[0]}{j.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fullName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[j.status]}`}>
                      {{ active: 'Actif', invited: 'Invité', inactive: 'Inactif' }[j.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{j.post} — {j.company}</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {j.domains.map(d => <span key={d} className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{d}</span>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all">Annuler</button>
          <button onClick={() => { setSaving(true); onSave(selected); setSaving(false); }} disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl disabled:opacity-50 flex items-center gap-2">
            {saving ? 'Enregistrement...' : <>{IC.check} Enregistrer</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function ProgrammeDetailPage() {
  const router                = useRouter();
  const params                = useParams();
  const { user: currentUser } = useSelector(s => s.auth);
  const { accessToken }       = useSelector(s => s.auth);

  const progId = params?.id;

  const [programme,  setProgramme]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [alert,      setAlert]      = useState({ show: false, type: '', message: '' });

  const [showJuryModal,     setShowJuryModal]    = useState(false);
  const [showFormLinkModal, setShowFormLinkModal] = useState(false);
  const [showFormPreview,   setShowFormPreview]   = useState(false);

  const [newNote,      setNewNote]      = useState('');
  const [noteType,     setNoteType]     = useState('general');
  const [editingNote,  setEditingNote]  = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [candFilter,   setCandFilter]   = useState('all');
  const [candSearch,   setCandSearch]   = useState('');
  const [uploading,    setUploading]    = useState(false);

  const [evalStats,   setEvalStats]   = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);

  const [decisionStats,   setDecisionStats]   = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);

  // ── Load programme ──────────────────────────────────────────
  useEffect(() => {
    if (!progId || !accessToken) return;
    setLoading(true);
    const load = async () => {
      try {
        const { data } = await axiosAuth.get(`/api/admin/programmes/${progId}`);
        const prog = data.programme;

        let candidaturesDetail = [];
        if (data.candidaturesDetail && Array.isArray(data.candidaturesDetail)) {
          candidaturesDetail = data.candidaturesDetail;
        } else if (data.applications && Array.isArray(data.applications)) {
          candidaturesDetail = data.applications;
        } else if (data.candidatures && Array.isArray(data.candidatures)) {
          candidaturesDetail = data.candidatures.map(c => {
            const app = (c.applications || []).find(a => String(a.programmeId) === String(progId));
            return {
              id:          String(c._id),
              startup:     c.startupProfile?.startupName || c.startupName || c.name || '—',
              founder:     c.name || c.founderName || '—',
              sector:      c.startupProfile?.sector || c.sector || prog.sector,
              status:      app?.status || c.status || 'pending',
              score:       c.totalScore || c.aiScore?.total || null,
              submittedAt: app?.submittedAt || c.createdAt || new Date().toISOString(),
            };
          });
        }

        setProgramme({
          ...prog,
          _id: prog._id,
          id:  prog._id,
          objectifs:        prog.objectives   || prog.objectifs        || [],
          critereSelection: prog.criteria     || prog.critereSelection || [],
          phases:           prog.phases       || [],
          jury:             prog.jury         || [],
          formulaire:       prog.formulaire   || '',
          candidatures:     data.candidatures || candidaturesDetail.length,
          candidaturesDetail,
          // FIX: normaliser notes, documents, auditLog avec id garanti
          notes:     normalizeWithId(prog.notes     || [], 'note'),
          documents: normalizeWithId(prog.documents || [], 'doc'),
          auditLog:  normalizeWithId(prog.auditLog  || [], 'log'),
        });

      } catch (err) {
        console.error('[ProgrammeDetailPage load]', err);
        notify('error', 'Impossible de charger le programme.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [progId, accessToken]);

  useEffect(() => {
    if (activeTab !== 'evaluation' || !progId || evalStats) return;
    const load = async () => {
      setEvalLoading(true);
      try {
        const { data } = await axiosAuth.get(`/api/admin/programmes/${progId}/evaluations`);
        setEvalStats(data);
      } catch {
        setEvalStats({ evaluations: [], totalEvaluated: 0, pending: 0, avgScore: null });
      } finally {
        setEvalLoading(false);
      }
    };
    load();
  }, [activeTab, progId, evalStats]);

  useEffect(() => {
    if (activeTab !== 'decision' || !progId || decisionStats) return;
    const load = async () => {
      setDecisionLoading(true);
      try {
        const { data } = await axiosAuth.get(`/api/admin/programmes/${progId}/decisions`);
        setDecisionStats(data);
      } catch {
        setDecisionStats({ decisions: [], accepted: 0, rejected: 0, pending: 0, waitlist: 0, notified: 0 });
      } finally {
        setDecisionLoading(false);
      }
    };
    load();
  }, [activeTab, progId, decisionStats]);

  const notify = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
  };

  const updateBackend = async (payload) => {
    try {
      const { data } = await axiosAuth.put(`/api/admin/programmes/${progId}`, payload);
      return data.programme;
    } catch {
      notify('error', 'Erreur lors de la mise à jour.');
      return null;
    }
  };

  const handleSaveJury = async (juryNames) => {
    const updated = await updateBackend({ ...programme, jury: juryNames });
    if (updated) {
      setProgramme(prev => ({ ...prev, jury: juryNames }));
      setShowJuryModal(false);
      notify('success', `${juryNames.length} jury assigné(s).`);
    }
  };

  const handleRemoveJury = async (name) => {
    const newJury = (programme.jury || []).filter(j => j !== name);
    const updated = await updateBackend({ ...programme, jury: newJury });
    if (updated) {
      setProgramme(prev => ({ ...prev, jury: newJury }));
      notify('success', 'Jury retiré.');
    }
  };

  const handleLinkForm = async (formTitle) => {
    const updated = await updateBackend({ ...programme, formulaire: formTitle });
    if (updated) {
      setProgramme(prev => ({ ...prev, formulaire: formTitle }));
      setShowFormLinkModal(false);
      notify('success', `Formulaire "${formTitle}" lié.`);
    }
  };

  const handleUnlinkForm = async () => {
    const updated = await updateBackend({ ...programme, formulaire: '' });
    if (updated) {
      setProgramme(prev => ({ ...prev, formulaire: '' }));
      notify('success', 'Formulaire délié.');
    }
  };

  const handleToggleStatus = async () => {
    const next =
      programme.status === PROGRAMME_STATUS.PUBLISHED ? PROGRAMME_STATUS.CLOSED
      : (programme.status === PROGRAMME_STATUS.DRAFT || programme.status === PROGRAMME_STATUS.SCHEDULED) ? PROGRAMME_STATUS.PUBLISHED
      : null;
    if (!next) return;
    try {
      const { data } = await axiosAuth.patch(`/api/admin/programmes/${progId}/status`, { status: next });
      setProgramme(prev => ({ ...prev, status: data.programme?.status || next }));
      notify('success', next === PROGRAMME_STATUS.PUBLISHED ? `"${programme.titre}" publié.` : `"${programme.titre}" clôturé.`);
    } catch { notify('error', 'Erreur changement de statut.'); }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // FIX: id unique garanti pour les nouvelles notes
    const note = {
      id:      `note-local-${Date.now()}`,
      auteur:  currentUser?.name || 'Admin',
      date:    new Date().toISOString(),
      contenu: newNote.trim(),
      type:    noteType,
      pinned:  false,
    };
    setProgramme(prev => ({ ...prev, notes: [note, ...(prev.notes || [])] }));
    setNewNote(''); setNoteType('general');
    notify('success', 'Note ajoutée.');
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      // FIX: id unique garanti pour les nouveaux documents
      const doc = {
        id:         `doc-local-${Date.now()}`,
        name:       file.name,
        size:       `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        type:       file.name.split('.').pop(),
      };
      setProgramme(prev => ({ ...prev, documents: [...(prev.documents || []), doc] }));
      setUploading(false);
      notify('success', `"${file.name}" uploadé.`);
    }, 900);
    e.target.value = '';
  };

  const style    = programme ? getSectorStyle(programme.sector) : {};
  const daysLeft = programme ? getDaysLeft(programme.dateFin) : 0;
  const fillRate = programme ? getFillRate(programme.candidatures, programme.quota) : null;

  const filteredCands = (programme?.candidaturesDetail || []).filter(c => {
    const mf = candFilter === 'all' || c.status === candFilter;
    const ms = !candSearch || c.startup.toLowerCase().includes(candSearch.toLowerCase()) || c.founder?.toLowerCase().includes(candSearch.toLowerCase());
    return mf && ms;
  });

  // FIX: sortedNotes trié sur les notes normalisées
  const sortedNotes = [...(programme?.notes || [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  const sm         = programme ? (STATUS_MAP[programme.status] || STATUS_MAP[PROGRAMME_STATUS.DRAFT]) : {};
  const getStatusV = (s) => STATUS_MAP[s]?.variant || 'gray';
  const getStatusL = (s) => STATUS_MAP[s]?.label   || s;

  const totalEval = evalStats?.totalEvaluated ?? 0;
  const pendingEval = evalStats?.pending ?? (programme?.candidaturesDetail?.length || 0);
  const totalDecisions = decisionStats?.decisions?.length ?? 0;

  const TABS = programme ? [
    { id: 'overview',     label: 'Vue d\'ensemble' },
    { id: 'jury',         label: `Jury (${programme.jury?.length || 0})` },
    { id: 'formulaire',   label: programme.formulaire ? 'Formulaire lié ●' : 'Formulaire' },
    { id: 'candidatures', label: `Candidatures (${programme.candidaturesDetail?.length || 0})` },
    { id: 'documents',    label: `Documents (${programme.documents?.length || 0})` },
    { id: 'notes',        label: `Notes (${programme.notes?.length || 0})` },
    { id: 'evaluation',   label: `Évaluation jury${totalEval ? ` (${totalEval})` : ''}` },
    { id: 'decision',     label: `Décision finale${totalDecisions ? ` (${totalDecisions})` : ''}` },
    { id: 'audit',        label: `Historique (${programme.auditLog?.length || 0})` },
  ] : [];

  if (loading) return (
    <ProtectedRoute allowedRoles={['admin']}><DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout></ProtectedRoute>
  );

  if (!programme) return (
    <ProtectedRoute allowedRoles={['admin']}><DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Programme introuvable</h2>
        <button onClick={() => router.push('/dashboard/admin/programmes')}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl">← Retour</button>
      </div>
    </DashboardLayout></ProtectedRoute>
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
          @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
          @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
          .slide-up  { animation:slideUp .45s cubic-bezier(.22,1,.36,1) both }
          .fade-in   { animation:fadeIn .3s ease both }
          .glass     { background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border:1px solid rgba(0,0,0,.05) }
          :global(.dark) .glass { background:#1e293b;border:1px solid #334155 }
          .dark-gl   { background:linear-gradient(135deg,rgba(0,82,110,.9),rgba(0,109,148,.9));backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1) }
          .particle  { position:absolute;width:4px;height:4px;background:rgba(255,255,255,.3);border-radius:50%;animation:float 6s ease-in-out infinite }
          .tab-btn   { transition:all .18s }
          .jury-card { transition:all .18s }
          .jury-card:hover { transform:translateY(-2px);box-shadow:0 8px 20px -4px rgba(0,82,110,.15) }
          :global(.dark) .jury-card:hover { box-shadow:0 8px 20px -4px rgba(0,0,0,.4) }
          .eval-criteria-bar { transition: width 0.6s cubic-bezier(.22,1,.36,1) }
        `}</style>

        <div className="space-y-5 min-h-screen pb-10">

          {alert.show && (
            <div className="fade-in fixed top-4 right-4 z-50 max-w-sm">
              <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ show: false })} />
            </div>
          )}

          {/* ── HERO ──────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl p-8 slide-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="particle" style={{ top: '10%', left: '15%', animationDelay: '0s' }} />
            <div className="particle" style={{ top: '65%', left: '82%', animationDelay: '1.2s' }} />
            <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg,rgba(0,186,255,.08) 0%,rgba(255,191,0,.08) 50%,rgba(0,186,255,.08) 100%)', backgroundSize: '200% 200%' }} />

            <div className="relative flex items-center gap-3 mb-5 flex-wrap">
              <button onClick={() => router.push('/dashboard/admin/programmes')}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors">
                {IC.back} Programmes
              </button>
              <span className="text-white/30">|</span>
              <button onClick={() => router.push(`/dashboard/admin/programmes/${programme._id}/timeline`)}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors">
                {IC.timeline} Timeline
              </button>
            </div>

            <div className="relative flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>{programme.sector}</span>
                  <Badge variant={getStatusV(programme.status)} size="sm">{getStatusL(programme.status)}</Badge>
                  {programme.status === PROGRAMME_STATUS.PUBLISHED && daysLeft > 0 && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${daysLeft <= 14 ? 'bg-red-900/40 text-red-300' : 'bg-amber-900/40 text-amber-300'}`}>
                      {daysLeft}j restants
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{programme.titre}</h1>
                <p className="text-blue-200 max-w-2xl mb-5">{programme.description}</p>
                <div className="flex items-center gap-5 flex-wrap text-sm text-blue-100">
                  <span className="flex items-center gap-1.5">{IC.calendar}
                    <span className="font-mono text-xs">{formatDate(programme.dateDebut, { day: 'numeric', month: 'short' })} → {formatDate(programme.dateFin, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                  <span className="flex items-center gap-1.5">{IC.users}
                    <span>{programme.candidatures} candidature{programme.candidatures !== 1 ? 's' : ''}{programme.quota ? ` / ${programme.quota} places` : ''}</span>
                  </span>
                  {programme.formulaire && (
                    <span className="flex items-center gap-1.5">{IC.form}<span className="truncate max-w-[180px]">{programme.formulaire}</span></span>
                  )}
                </div>
              </div>

              <div className="dark-gl rounded-2xl p-5 min-w-[200px] flex flex-col gap-2">
                {(programme.status === PROGRAMME_STATUS.DRAFT || programme.status === PROGRAMME_STATUS.SCHEDULED) && (
                  <button onClick={handleToggleStatus}
                    className="w-full px-4 py-2 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-all flex items-center justify-center gap-1.5">
                    {IC.globe} Publier
                  </button>
                )}
                {programme.status === PROGRAMME_STATUS.PUBLISHED && (
                  <button onClick={handleToggleStatus}
                    className="w-full px-4 py-2 text-xs font-semibold text-red-300 bg-red-900/30 hover:bg-red-900/50 rounded-lg border border-red-800/50 transition-all">
                    Clôturer
                  </button>
                )}
                <button onClick={() => setShowJuryModal(true)}
                  className="w-full px-4 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center gap-1.5">
                  {IC.jury} Gérer les jurys
                </button>
                <button onClick={() => programme.formulaire ? setShowFormPreview(true) : setShowFormLinkModal(true)}
                  className="w-full px-4 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center gap-1.5">
                  {IC.form} {programme.formulaire ? 'Voir formulaire' : 'Lier formulaire'}
                </button>
                <button onClick={() => setActiveTab('evaluation')}
                  className="w-full px-4 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center gap-1.5">
                  {IC.eval} Évaluation jury
                </button>
                <button onClick={() => setActiveTab('decision')}
                  className="w-full px-4 py-2 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center gap-1.5">
                  {IC.decision} Décision finale
                </button>
              </div>
            </div>
          </div>

          {/* ── Fill rate ─────────────────────────────────────── */}
          {fillRate !== null && (
            <div className="glass rounded-2xl px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Taux de remplissage</span>
                <span className={`text-sm font-bold ${fillRate >= 80 ? 'text-red-500' : fillRate >= 50 ? 'text-amber-500' : 'text-green-500'}`}>
                  {fillRate}% — {programme.candidatures} / {programme.quota} places
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${fillRate >= 80 ? 'bg-red-400' : fillRate >= 50 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${fillRate}%` }} />
              </div>
            </div>
          )}

          {/* ── TABS ──────────────────────────────────────────── */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`tab-btn px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* ═══════════ OVERVIEW ═══════════ */}
              {activeTab === 'overview' && (
                <div className="space-y-6 fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-4 text-primary-600">{IC.target}
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Objectifs</h3>
                      </div>
                      {!(programme.objectifs?.length) ? (
                        <p className="text-sm text-gray-400 italic">Aucun objectif défini.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {programme.objectifs.map((o, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                              <span className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">{IC.check}</span>{o}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-4 text-amber-500">{IC.star}
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Critères de sélection</h3>
                      </div>
                      {!(programme.critereSelection?.length) ? (
                        <p className="text-sm text-gray-400 italic">Aucun critère défini.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {programme.critereSelection.map((c, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                              <span className="mt-1 w-4 h-4 flex-shrink-0 rounded-full border-2 border-amber-400 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              </span>{c}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { tab: 'jury',         icon: IC.jury,     label: 'Jurys assignés', value: programme.jury?.length || 0,   sub: 'Gérer →' },
                      { tab: 'formulaire',   icon: IC.form,     label: 'Formulaire lié', value: programme.formulaire || 'Non lié', isText: true, sub: programme.formulaire ? 'Voir & réponses →' : 'Lier →' },
                      { tab: 'evaluation',   icon: IC.eval,     label: 'Évaluation jury', value: totalEval || 0, sub: 'Gérer les évaluations →' },
                      { tab: 'decision',     icon: IC.decision, label: 'Décision finale', value: totalDecisions || 0, sub: 'Gérer les décisions →' },
                    ].map(item => (
                      <button key={item.tab} onClick={() => setActiveTab(item.tab)}
                        className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800 text-left hover:border-primary-300 transition-all group">
                        <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
                          {item.icon}<span className="text-xs font-semibold uppercase tracking-wide">{item.label}</span>
                        </div>
                        {item.isText
                          ? <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.value}</p>
                          : <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                        }
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 group-hover:underline">{item.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════ JURY TAB ═══════════ */}
              {activeTab === 'jury' && (
                <div className="fade-in space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Jurys assignés</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(programme.jury || []).length} expert(s)</p>
                    </div>
                    <button onClick={() => setShowJuryModal(true)}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center gap-2">
                      {IC.plus} Assigner des jurys
                    </button>
                  </div>
                  {(programme.jury || []).length === 0 ? (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      <div className="w-14 h-14 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-400">{IC.jury}</div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aucun jury assigné</p>
                      <button onClick={() => setShowJuryModal(true)} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl mt-3">Assigner des jurys</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(programme.jury || []).map((name, idx) => {
                        const j = ALL_JURY_POOL.find(x => `${x.firstName} ${x.lastName}` === name);
                        return (
                          <div key={idx} className="jury-card bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#006d94,#0088ba)' }}>
                              {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                                  {j && <p className="text-xs text-gray-500 dark:text-gray-400">{j.post} — {j.company}</p>}
                                </div>
                                <button onClick={() => handleRemoveJury(name)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">{IC.x}</button>
                              </div>
                              {j && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {j.domains.map(d => (
                                    <span key={d} className="px-2 py-0.5 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full border border-primary-100 dark:border-primary-800">{d}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={() => setShowJuryModal(true)}
                        className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 hover:border-primary-400 transition-all text-gray-400 hover:text-primary-600">
                        {IC.plus}<span className="text-sm font-medium">Modifier les jurys</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════ FORMULAIRE TAB ═══════════ */}
              {activeTab === 'formulaire' && (
                <div className="fade-in space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Formulaire de candidature</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Formulaire que remplissent les candidats pour postuler</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {programme.formulaire ? (
                        <>
                          <button onClick={() => setShowFormPreview(true)}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center gap-2">{IC.eye} Voir & réponses</button>
                          <button onClick={() => setShowFormLinkModal(true)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center gap-2">{IC.link} Changer</button>
                          <button onClick={handleUnlinkForm}
                            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-1.5">{IC.unlink} Délier</button>
                        </>
                      ) : (
                        <button onClick={() => setShowFormLinkModal(true)}
                          className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center gap-2">{IC.link} Lier un formulaire</button>
                      )}
                    </div>
                  </div>

                  {!programme.formulaire ? (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      <div className="w-14 h-14 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-400">{IC.form}</div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aucun formulaire lié</p>
                      <p className="text-xs text-gray-400 mb-4">Associez un formulaire pour collecter les candidatures</p>
                      <button onClick={() => setShowFormLinkModal(true)} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl">Lier un formulaire</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 rounded-xl border border-primary-200 dark:border-primary-800">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md text-white bg-blue-500">{IC.form}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">{programme.formulaire}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Cliquez sur "Voir & réponses" pour consulter les questions et les réponses des candidats.</p>
                        </div>
                        <button onClick={() => setShowFormPreview(true)}
                          className="px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-700 rounded-xl hover:bg-primary-50 transition-all flex items-center gap-2">
                          {IC.eye} Aperçu
                        </button>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-start gap-2 text-sm text-purple-700 dark:text-purple-300">{IC.form}<span>Pour créer ou modifier des formulaires, accédez à la section dédiée.</span></div>
                        <button onClick={() => router.push('/dashboard/admin/forms')}
                          className="px-4 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-100 transition-colors whitespace-nowrap">
                          Gérer les formulaires →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════ CANDIDATURES TAB ═══════════ */}
              {activeTab === 'candidatures' && (
                <div className="fade-in space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total',       value: programme.candidaturesDetail?.length || 0, color: 'text-gray-900 dark:text-white', f: 'all' },
                      { label: 'En révision', value: (programme.candidaturesDetail||[]).filter(c=>c.status==='reviewing').length, color: 'text-blue-600 dark:text-blue-400', f: 'reviewing' },
                      { label: 'Acceptées',   value: (programme.candidaturesDetail||[]).filter(c=>c.status==='accepted').length,  color: 'text-green-600 dark:text-green-400', f: 'accepted' },
                      { label: 'En attente',  value: (programme.candidaturesDetail||[]).filter(c=>c.status==='pending').length,   color: 'text-amber-600 dark:text-amber-400', f: 'pending' },
                    ].map((s, i) => (
                      <button key={i} onClick={() => setCandFilter(s.f)}
                        className={`bg-gray-50 dark:bg-gray-900/30 rounded-xl p-3 border text-center transition-all hover:border-primary-400 ${candFilter === s.f ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-100 dark:border-gray-800'}`}>
                        <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{IC.search}</span>
                    <input type="text" value={candSearch} onChange={e => setCandSearch(e.target.value)}
                      placeholder="Rechercher une candidature…"
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                  </div>
                  {filteredCands.length === 0 ? (
                    <div className="text-center py-12 text-gray-400"><p className="text-sm">Aucune candidature trouvée.</p></div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                            {['Startup', 'Fondateur', 'Secteur', 'Statut', 'Score', 'Déposée le'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {filteredCands.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer transition-colors"
                              onClick={() => router.push('/dashboard/admin/applications')}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                    style={{ background: `linear-gradient(135deg,${style.bar},${style.bar}99)` }}>
                                    {c.startup.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.startup}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{c.founder || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSectorStyle(c.sector).bg} ${getSectorStyle(c.sector).text}`}>{c.sector}</span>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={CANDIDATURE_STATUS[c.status]?.variant || 'gray'} size="sm">
                                  {CANDIDATURE_STATUS[c.status]?.label || c.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {c.score != null ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${c.score >= 80 ? 'bg-green-500' : c.score >= 60 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${c.score}%` }} />
                                    </div>
                                    <span className="text-xs font-bold font-mono">{c.score}/100</span>
                                  </div>
                                ) : <span className="text-xs text-gray-400">—</span>}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                                {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString('fr-FR') : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-start gap-2 text-sm text-purple-700 dark:text-purple-300">{IC.form}<span>Pour créer ou modifier des candidatures, accédez à la section dédiée.</span></div>
                          <button onClick={() => router.push('/dashboard/admin/applications')}
                            className="px-4 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-100 transition-colors whitespace-nowrap">
                            Gérer les candidatures →
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              )}

              {/* ═══════════ DOCUMENTS TAB ═══════════ */}
              {activeTab === 'documents' && (
                <div className="fade-in space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Documents officiels du programme</p>
                    <label className={`cursor-pointer px-4 py-2 text-sm font-medium text-white rounded-lg transition-all flex items-center gap-2 ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}>
                      {uploading ? 'Upload...' : <>{IC.upload} Uploader</>}
                      <input type="file" className="hidden" disabled={uploading} onChange={handleUpload} />
                    </label>
                  </div>
                  {!(programme.documents?.length) ? (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      <p className="text-sm">Aucun document uploadé.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* FIX: key robuste sur doc.id normalisé */}
                      {programme.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${doc.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                              {(doc.type || 'file').toUpperCase().slice(0,4)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                              <p className="text-xs text-gray-400">{doc.size} · {formatDate(doc.uploadedAt)}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button className="p-2 text-gray-400 hover:text-primary-600 rounded-lg">{IC.download}</button>
                            <button onClick={() => setProgramme(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== doc.id) }))}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg">{IC.trash}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════ NOTES TAB ═══════════ */}
              {activeTab === 'notes' && (
                <div className="fade-in space-y-5">
                  <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Nouvelle note</p>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                      placeholder="Écrivez une note interne…" rows={4}
                      className="w-full px-4 py-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {Object.entries(NOTE_TYPES).map(([key, val]) => (
                          <button key={key} onClick={() => setNoteType(key)}
                            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${noteType === key ? val.color + ' ring-2 ring-offset-1 ring-primary-400/40' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            {val.label}
                          </button>
                        ))}
                      </div>
                      <button onClick={handleAddNote} disabled={!newNote.trim()}
                        className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl disabled:opacity-40 flex items-center gap-2">
                        {IC.plus} Ajouter
                      </button>
                    </div>
                  </div>
                  {sortedNotes.length === 0 ? (
                    <div className="text-center py-10 text-gray-400"><p className="text-sm">Aucune note.</p></div>
                  ) : (
                    <div className="space-y-3">
                      {/* FIX: key robuste — note.id garanti par normalizeWithId */}
                      {sortedNotes.map((note, noteIdx) => (
                        <div key={note.id ?? noteIdx} className={`rounded-xl border p-4 ${note.pinned ? 'bg-amber-50/80 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 'bg-white dark:bg-gray-900/30 border-gray-100 dark:border-gray-800'}`}>
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {note.pinned && <span className="text-amber-500 text-xs font-semibold flex items-center gap-1">{IC.pinFill} Épinglée</span>}
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${NOTE_TYPES[note.type]?.color || NOTE_TYPES.general.color}`}>{NOTE_TYPES[note.type]?.label || 'General'}</span>
                              <span className="text-xs text-gray-400">{note.auteur} · {new Date(note.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setProgramme(prev => ({ ...prev, notes: prev.notes.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n) }))}
                                className={`p-1.5 rounded-lg transition-colors ${note.pinned ? 'text-amber-500 bg-amber-100' : 'text-gray-400 hover:text-amber-500'}`}>
                                {note.pinned ? IC.pinFill : IC.pin}
                              </button>
                              {editingNote === note.id ? (
                                <button onClick={() => {
                                  setProgramme(prev => ({ ...prev, notes: prev.notes.map(n => n.id === note.id ? { ...n, contenu: editNoteText } : n) }));
                                  setEditingNote(null);
                                }} className="p-1.5 text-green-600 rounded-lg">{IC.check}</button>
                              ) : (
                                <button onClick={() => { setEditingNote(note.id); setEditNoteText(note.contenu); }}
                                  className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg">{IC.edit}</button>
                              )}
                              <button onClick={() => setProgramme(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== note.id) }))}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">{IC.trash}</button>
                            </div>
                          </div>
                          {editingNote === note.id ? (
                            <textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} rows={3} autoFocus
                              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:outline-none resize-none" />
                          ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{note.contenu}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════ ÉVALUATION JURY ═══════════ */}
              {activeTab === 'evaluation' && (
                <div className="fade-in">
                  <EvaluationTabSection
                    progId={progId}
                    evalStats={evalStats}
                    evalLoading={evalLoading}
                  />
                </div>
              )}

              {/* ═══════════ DÉCISION FINALE ═══════════ */}
              {activeTab === 'decision' && (
                <div className="fade-in space-y-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Décision finale</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Validation et notification des candidats</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                    (decisionStats?.accepted ?? 0) > 0
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${(decisionStats?.accepted ?? 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      {(decisionStats?.accepted ?? 0) > 0 ? IC.check : IC.clock}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${(decisionStats?.accepted ?? 0) > 0 ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                        {(decisionStats?.accepted ?? 0) > 0 ? 'Décisions en cours' : 'En attente de candidatures'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {totalDecisions} décision(s) enregistrée(s) · {decisionStats?.notified ?? 0} notification(s) envoyée(s)
                      </p>
                    </div>
                  </div>

                  {decisionLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: `Acceptées / ${programme.quota || '?'} places`, value: decisionStats?.accepted ?? 0,  color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-100 dark:border-green-800' },
                        { label: 'Refusées',                                       value: decisionStats?.rejected ?? 0,  color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-100 dark:border-red-800'   },
                        { label: 'En attente',                                     value: decisionStats?.pending ?? 0,   color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-100 dark:border-amber-800' },
                        { label: 'Notifiés',                                       value: decisionStats?.notified ?? 0,  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-100 dark:border-blue-800'  },
                      ].map((s, i) => (
                        <div key={i} className={`${s.bg} ${s.border} border rounded-xl p-4 text-center`}>
                          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Tableau des décisions</h4>
                      <button onClick={() => router.push(`/dashboard/admin/programmes/${progId}/decision`)}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                        Voir tout {IC.arrowRight}
                      </button>
                    </div>
                    {decisionLoading ? (
                      <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
                    ) : !decisionStats?.decisions?.length ? (
                      <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                        <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-3 text-gray-300">{IC.decision}</div>
                        <p className="text-sm">Aucune décision enregistrée pour le moment.</p>
                        <button onClick={() => router.push(`/dashboard/admin/programmes/${progId}/decision`)}
                          className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                          Saisir les décisions
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                              {['Startup', 'Fondateur', 'Décision', 'Notifié', 'Date'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {decisionStats.decisions.map((d, i) => {
                              const ds = DECISION_STATUS[d.decision] || DECISION_STATUS.pending;
                              return (
                                <tr key={d.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer transition-colors"
                                  onClick={() => router.push(`/dashboard/admin/programmes/${progId}/decision`)}>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                        style={{ background: `linear-gradient(135deg,${style.bar},${style.bar}99)` }}>
                                        {(d.startup || '?').slice(0, 2).toUpperCase()}
                                      </div>
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{d.startup || '—'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{d.founder || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ds.bg} ${ds.color} border ${ds.border}`}>
                                      {ds.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {d.notified
                                      ? <span className="flex items-center gap-1 text-xs text-green-600">{IC.check} Envoyé</span>
                                      : <span className="text-xs text-gray-400">—</span>
                                    }
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-400">{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 rounded-xl border border-primary-100 dark:border-primary-800 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2 text-sm text-primary-700 dark:text-primary-300">
                        {IC.decision}
                        <span>Gérez les acceptations, refus et listes d'attente.</span>
                      </div>
                      <button onClick={() => router.push(`/dashboard/admin/programmes/${progId}/decision`)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5">
                        Gérer les décisions {IC.arrowRight}
                      </button>
                    </div>
                    <button onClick={() => router.push(`/dashboard/admin/programmes/${progId}/decision`)}
                      className="px-5 py-3 text-sm font-semibold text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-2 whitespace-nowrap">
                      {IC.send} Envoyer notifications
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════ AUDIT / HISTORIQUE ═══════════ */}
              {activeTab === 'audit' && (
                <div className="fade-in">
                  {!(programme.auditLog?.length) ? (
                    <div className="text-center py-12 text-gray-400"><p className="text-sm">Aucun historique.</p></div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
                      <div className="space-y-4">
                        {/* FIX: key robuste sur log.id normalisé */}
                        {programme.auditLog.map((log, logIdx) => (
                          <div key={log.id ?? logIdx} className="relative flex gap-4">
                            <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-500">{IC.history}</div>
                            <div className="flex-1 py-1.5">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.action}</p>
                              <p className="text-xs text-gray-400">{log.user} · {new Date(log.date).toLocaleString('fr-FR')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        <JuryAssignModal isOpen={showJuryModal} onClose={() => setShowJuryModal(false)} programme={programme} onSave={handleSaveJury} />
        <FormLinkModal isOpen={showFormLinkModal} onClose={() => setShowFormLinkModal(false)} programme={programme} onLink={handleLinkForm} />
        <FormPreviewModal isOpen={showFormPreview} onClose={() => setShowFormPreview(false)} formTitle={programme?.formulaire} onChangeForm={() => { setShowFormPreview(false); setShowFormLinkModal(true); }} router={router} />

      </DashboardLayout>
    </ProtectedRoute>
  );
}