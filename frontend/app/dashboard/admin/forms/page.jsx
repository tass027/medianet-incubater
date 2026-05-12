'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import { useSelector } from 'react-redux';
import { useFormsApi } from '@/app/hooks/useFormsApi';
import { confirmDelete, toastSuccess, toastError, alertError } from '@/app/hooks/useSwal';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  form: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  layers: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2l10 6-10 6L2 8l10-6zM2 16l10 6 10-6M2 12l10 6 10-6" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.8} stroke="currentColor" fill="none"/>
      <circle cx="12" cy="12" r="6" strokeWidth={1.8} stroke="currentColor" fill="none"/>
      <circle cx="12" cy="12" r="2" strokeWidth={1.8} stroke="currentColor" fill="none"/>
    </svg>
  ),
  checkCircle: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chartBar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  paperclip: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  archive: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  externalLink: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  inherit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  programme: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  filter: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
};

// ─── PROGRAMMES ───────────────────────────────────────────────────────────────
const PROGRAMMES = [
  { id: 'form-base',           label: 'Formulaire de Base',    sector: null,         color: '#3B82F6' },
  { id: 'form-fintech-2026',   label: 'FinTech 2026',          sector: 'FinTech',    color: '#0EA5E9' },
  { id: 'form-edtech-2026',    label: 'EdTech 2026',           sector: 'EdTech',     color: '#8B5CF6' },
  { id: 'form-agritech-2026',  label: 'AgriTech 2026',         sector: 'AgriTech',   color: '#F59E0B' },
  { id: 'form-cleantech-2026', label: 'CleanTech 2026',        sector: 'CleanTech',  color: '#10B981' },
  { id: 'form-healthtech-2025',label: 'HealthTech 2025',       sector: 'HealthTech', color: '#EF4444' },
];

const SECTOR_COLORS = {
  'FinTech':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'EdTech':     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'AgriTech':   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'CleanTech':  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'HealthTech': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

// ─── Mock candidates ──────────────────────────────────────────────────────────
const MOCK_CANDIDATES = [
  { id: 1, name: 'Imen Ben Ammar',  email: 'imen.benammar@startup.tn', startup: 'PayTunis'    },
  { id: 2, name: 'Sara Ben Ali',    email: 'sara.benali@edulearn.tn',  startup: 'EduLearn TN' },
  { id: 3, name: 'Ibrahim Diallo',  email: 'ibrahim@agrismart.ci',     startup: 'AgriSmart'   },
  { id: 4, name: 'Mohamed Khemiri', email: 'mohamed@solartech.tn',     startup: 'SolarTech'   },
  { id: 5, name: 'Hela Ghariani',   email: 'hela@dabadoc.ma',          startup: 'DabaDoc'     },
];

const STATUS_CONFIG = {
  published: { label: 'Published', variant: 'success', icon: Icon.checkCircle },
  draft:     { label: 'Draft',     variant: 'warning', icon: Icon.clock       },
  archived:  { label: 'Archived',  variant: 'gray',    icon: Icon.archive     },
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function AdminFormsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  // ✅ FIX 1 : useFormsApi() appelé DANS le composant (pas au niveau module)
  const formsApi = useFormsApi();

  const [mounted, setMounted]       = useState(false);
  const [time, setTime]             = useState(new Date());
  const [forms, setForms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [alert, setAlert]           = useState({ show: false, type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus]       = useState('all');
  const [filterProgramme, setFilterProgramme] = useState('all');

  const [isSendOpen, setIsSendOpen]       = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedForm, setSelectedForm]   = useState(null);

  useEffect(() => {
    setMounted(true);

    // ✅ FIX 2 : timer défini avant le return du cleanup
    const timer = setInterval(() => setTime(new Date()), 1000);

    // ✅ FIX 3 : await dans une fonction async interne
    const load = async () => {
      try {
        const res = await formsApi.fetchAll();
        setForms(res.forms || []);
      } catch (err) {
        console.error('Failed to load forms:', err);
        showAlert('error', 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    };

    load();

    // ✅ FIX 4 : cleanup correct — timer est bien défini ici
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };


  const handleDeleteForm = async (form) => {
    const { isConfirmed } = await confirmDelete(form.title);
    if (!isConfirmed) return;
    try {
      await formsApi.remove(form.id);
      setForms(prev => prev.filter(f => f.id !== form.id));
      toastSuccess(`Formulaire "${form.title}" supprimé.`);
    } catch (err) {
      const data = err?.response?.data;
      alertError(
        'Suppression impossible',
        data?.reason === 'has_responses'
          ? `Ce formulaire contient ${data.responseCount} réponse(s).`
          : data?.reason === 'linked_to_published_programme'
          ? data.message
          : data?.message ?? 'Erreur lors de la suppression.'
      );
    }
  };

  const handleSendForm = (formId, recipients) => {
    setForms(prev => prev.map(f =>
      f.id === formId
        ? { ...f, status: 'published', sentToNames: recipients, sentTo: recipients.length }
        : f
    ));
    setIsSendOpen(false);
    showAlert('success', `Form sent to ${recipients.length} candidate(s) successfully`);
  };

  // ─── Filtrage ───────────────────────────────────────────────────────────────
  const filteredForms = forms.filter(f => {
    const matchSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType   = filterType   === 'all' || f.type   === filterType;
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;

    let matchProg = true;
    if (filterProgramme === 'base') {
      matchProg = !f.programme;
    } else if (filterProgramme !== 'all') {
      matchProg = f.programme === filterProgramme;
    }

    return matchSearch && matchType && matchStatus && matchProg;
  });

  const baseForm     = filteredForms.filter(f => !f.programme);
  const programForms = filteredForms.filter(f =>  f.programme);

  const groupedByProgramme = programForms.reduce((acc, f) => {
    if (!acc[f.programme]) acc[f.programme] = [];
    acc[f.programme].push(f);
    return acc;
  }, {});

  const stats = {
    total:     forms.length,
    basic:     forms.filter(f => f.type   === 'basic').length,
    custom:    forms.filter(f => f.type   === 'custom').length,
    published: forms.filter(f => f.status === 'published').length,
    responses: forms.reduce((acc, f) => acc + (f.responses || 0), 0),
  };

  const getProgrammeLabel  = (progId) => PROGRAMMES.find(p => p.id === progId)?.label  || progId;
  const getProgrammeSector = (progId) => PROGRAMMES.find(p => p.id === progId)?.sector || null;
  const getProgrammeColor  = (progId) => PROGRAMMES.find(p => p.id === progId)?.color  || '#6B7280';

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

          @keyframes float            { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
          @keyframes slideInUp        { from{opacity:0;transform:translateY(50px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideInRight     { from{opacity:0;transform:translateX(100px)} to{opacity:1;transform:translateX(0)} }
          @keyframes scaleIn          { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          @keyframes holographicShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          @keyframes toastIn          { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }

          .animate-slide-in-up    { animation:slideInUp 0.6s ease-out forwards; }
          .animate-slide-in-right { animation:slideInRight 0.6s ease-out forwards; }
          .animate-scale-in       { animation:scaleIn 0.5s ease-out forwards; }
          .toast-in               { animation:toastIn 0.35s cubic-bezier(.22,1,.36,1) both; }

          .glass-card { background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border:1px solid rgba(0,0,0,0.05); }
          :global(.dark) .glass-card { background:#1e293b;border:1px solid #334155;box-shadow:0 4px 20px rgba(0,0,0,0.2); }
          .dark-glass { background:linear-gradient(135deg,rgba(0,82,110,0.9),rgba(0,109,148,0.9));backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1); }
          .holographic { background:linear-gradient(135deg,rgba(0,186,255,0.1) 0%,rgba(255,191,0,0.1) 50%,rgba(0,186,255,0.1) 100%);background-size:200% 200%;animation:holographicShift 3s ease infinite; }
          .cyber-grid { background-image:linear-gradient(rgba(0,186,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,191,0,0.05) 1px,transparent 1px);background-size:50px 50px; }
          .stat-card { position:relative;overflow:hidden;transition:all 0.3s ease; }
          .stat-card:hover { transform:translateY(-4px);box-shadow:0 20px 25px -5px rgba(0,82,110,0.2); }
          :global(.dark) .stat-card:hover { box-shadow:0 20px 25px -5px rgba(0,0,0,0.5); }
          .form-card { transition:all 0.3s ease; }
          .form-card:hover { transform:translateY(-4px);box-shadow:0 20px 25px -5px rgba(0,82,110,0.2); }
          :global(.dark) .form-card:hover { box-shadow:0 20px 25px -5px rgba(0,0,0,0.5); }
          .particle { position:absolute;width:4px;height:4px;background:rgba(255,255,255,0.3);border-radius:50%;animation:float 6s ease-in-out infinite; }
          .mono { font-family:'JetBrains Mono',monospace; }

          :global(.dark) .text-gray-900  { color:#f1f5f9; }
          :global(.dark) .text-gray-700  { color:#cbd5e1; }
          :global(.dark) .text-gray-600  { color:#94a3b8; }
          :global(.dark) .text-gray-500  { color:#64748b; }
          :global(.dark) .bg-gray-50     { background-color:#0f172a; }
          :global(.dark) .bg-white       { background-color:#1e293b; }
          :global(.dark) .border-gray-100{ border-color:#334155; }
          :global(.dark) .border-gray-200{ border-color:#1e293b; }
          :global(.dark) input,:global(.dark) select,:global(.dark) textarea {
            background-color:#0f172a;border-color:#334155;color:#f1f5f9;
          }
          :global(.dark) input::placeholder,:global(.dark) textarea::placeholder { color:#475569; }
          :global(.dark) select option { background-color:#0f172a;color:#f1f5f9; }
        `}</style>

        {/* Toast */}
        {alert.show && (
          <div className={`toast-in fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold
            ${alert.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {alert.type === 'success'
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {alert.message}
          </div>
        )}

        <div className="space-y-8 cyber-grid min-h-screen">

          {/* HEADER */}
          <div className="relative overflow-hidden rounded-3xl p-10 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="particle" style={{ top:'10%', left:'15%', animationDelay:'0s' }}></div>
            <div className="particle" style={{ top:'60%', left:'80%', animationDelay:'1s' }}></div>
            <div className="particle" style={{ top:'30%', left:'50%', animationDelay:'2s' }}></div>
            <div className="absolute inset-0 holographic opacity-30"></div>

            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide">
                    FORM MANAGEMENT
                  </div>
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/80">System Online</span>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Form Management</h1>
                <p className="text-blue-200 text-lg font-medium">
                  Create &amp; send basic and custom forms to candidates
                </p>
                <div className="flex items-center gap-6 text-blue-100 mt-4">
                  <div className="mono text-sm">
                    {mounted && time.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                  </div>
                  <div className="w-px h-4 bg-blue-400/30"></div>
                  <div className="mono text-sm">
                    {mounted && time.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
                  </div>
                </div>
              </div>

              <div className="dark-glass rounded-2xl p-5 min-w-[280px] animate-slide-in-right">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{user?.name || 'Admin User'}</p>
                    <p className="text-blue-200 text-sm mono">SYS.ADMIN</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-12 h-1 bg-blue-400 rounded-full"></div>
                      <div className="w-8 h-1 bg-cyan-400 rounded-full"></div>
                      <div className="w-4 h-1 bg-yellow-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Forms',     value: stats.total,     color: 'text-gray-900 dark:text-white',          icon: Icon.form,        bg: 'text-slate-600 dark:text-slate-300' },
              { label: 'Basic Forms',     value: stats.basic,     color: 'text-blue-600 dark:text-blue-400',       icon: Icon.layers,      bg: 'text-blue-600 dark:text-blue-400'   },
              { label: 'Custom Forms',    value: stats.custom,    color: 'text-violet-600 dark:text-violet-400',   icon: Icon.target,      bg: 'text-violet-600 dark:text-violet-400'},
              { label: 'Published',       value: stats.published, color: 'text-emerald-600 dark:text-emerald-400', icon: Icon.checkCircle, bg: 'text-emerald-600 dark:text-emerald-400'},
              { label: 'Total Responses', value: stats.responses, color: 'text-[#006d94] dark:text-sky-400',       icon: Icon.chartBar,    bg: 'text-[#006d94] dark:text-sky-400'   },
            ].map((s, i) => (
              <div key={i} className="stat-card glass-card rounded-2xl p-5 animate-scale-in dark:!bg-[#1e293b]"
                style={{ animationDelay: `${i * 0.07}s` }}>
                <div className={`p-2 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm w-fit mb-3 ${s.bg}`}>
                  {s.icon}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* TOOLBAR */}
          <div className="glass-card rounded-2xl p-5 dark:!bg-[#1e293b]">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{Icon.search}</span>
                  <input
                    type="text" placeholder="Search forms..." value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Filter Type */}
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:border-primary-500 font-medium">
                  <option value="all">All Types</option>
                  <option value="basic">Basic</option>
                  <option value="custom">Custom</option>
                </select>

                {/* Filter Status */}
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:border-primary-500 font-medium">
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>

                {/* Filter Programme */}
                <select value={filterProgramme} onChange={e => setFilterProgramme(e.target.value)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:border-primary-500 font-medium">
                  <option value="all">All Programmes</option>
                  <option value="base">Formulaire de base</option>
                  {PROGRAMMES.filter(p => p.id !== 'form-base').map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => router.push('/dashboard/admin/forms/new')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg hover:from-primary-700 hover:to-primary-800 transition-all whitespace-nowrap">
                {Icon.plus}
                Create Form
                <span className="opacity-70">{Icon.externalLink}</span>
              </button>
            </div>
          </div>

          {/* FORMULAIRES GROUPÉS */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 animate-pulse dark:!bg-[#1e293b]">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center dark:!bg-[#1e293b]">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400 flex items-center justify-center">{Icon.form}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No forms found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first form to get started</p>
              <button
                onClick={() => router.push('/dashboard/admin/forms/new')}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                Create First Form
              </button>
            </div>
          ) : (
            <div className="space-y-8">

              {/* SECTION : Formulaire de base */}
              {baseForm.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {Icon.layers}
                    </div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Formulaire de base</h2>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Source — tous programmes héritent de celui-ci</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {baseForm.map((form, index) => (
                      <FormCard
                        key={form.id} form={form} index={index}
                        onPreview={() => { setSelectedForm(form); setIsPreviewOpen(true); }}
                        onEdit={() => router.push(`/dashboard/admin/forms/${form.id}`)}
                        onSend={() => { setSelectedForm(form); setIsSendOpen(true); }}
                        onDelete={() => handleDeleteForm(form)}
                        onResponses={() => router.push(`/dashboard/admin/forms/${form.id}/responses`)}
                        getProgrammeLabel={getProgrammeLabel}
                        getProgrammeSector={getProgrammeSector}
                        getProgrammeColor={getProgrammeColor}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTIONS : Par programme */}
              {Object.entries(groupedByProgramme).map(([progId, progForms]) => {
                const progLabel   = getProgrammeLabel(progId);
                const progSector  = getProgrammeSector(progId);
                const sectorClass = progSector ? SECTOR_COLORS[progSector] : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                const progColor   = getProgrammeColor(progId);

                return (
                  <div key={progId}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                        style={{ background: progColor }}>
                        {Icon.programme}
                      </div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">{progLabel}</h2>
                      {progSector && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${sectorClass}`}>
                          {progSector}
                        </span>
                      )}
                      <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{progForms.length} formulaire{progForms.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {progForms.map((form, index) => (
                        <FormCard
                          key={form.id} form={form} index={index}
                          onPreview={() => { setSelectedForm(form); setIsPreviewOpen(true); }}
                          onEdit={() => router.push(`/dashboard/admin/forms/${form.id}`)}
                          onSend={() => { setSelectedForm(form); setIsSendOpen(true); }}
                          onDelete={() => handleDeleteForm(form)}
                          onResponses={() => router.push(`/dashboard/admin/forms/${form.id}/responses`)}
                          getProgrammeLabel={getProgrammeLabel}
                          getProgrammeSector={getProgrammeSector}
                          getProgrammeColor={getProgrammeColor}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* MODALS */}
        {isSendOpen && selectedForm && (
          <SendFormModal
            form={selectedForm}
            candidates={MOCK_CANDIDATES}
            onClose={() => setIsSendOpen(false)}
            onSend={handleSendForm}
          />
        )}

        {isPreviewOpen && selectedForm && (
          <PreviewModal
            form={selectedForm}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── FORM CARD ────────────────────────────────────────────────────────────────
function FormCard({ form, index, onPreview, onEdit, onSend, onDelete, onResponses, getProgrammeLabel, getProgrammeSector, getProgrammeColor }) {
  const isBasic     = form.type === 'basic';
  const progLabel   = form.programme ? getProgrammeLabel(form.programme)  : null;
  const sector      = form.programme ? getProgrammeSector(form.programme) : null;
  const sectorClass = sector ? SECTOR_COLORS[sector] : null;

  const completionColor =
    form.completionRate >= 80 ? 'bg-green-500 dark:bg-green-400' :
    form.completionRate >= 40 ? 'bg-amber-500 dark:bg-amber-400' :
    'bg-red-400 dark:bg-red-400';

  return (
    <div
      className="form-card glass-card rounded-2xl p-6 animate-scale-in dark:!bg-[#1e293b]"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
            isBasic
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
              : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
          }`}>
            {isBasic ? Icon.layers : Icon.target}
          </div>
          <div className="flex flex-col gap-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isBasic
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            }`}>
              {form.type?.toUpperCase()}
            </span>
            {form.isInherited && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 flex items-center gap-1">
                <span className="w-3 h-3">{Icon.inherit}</span>
                Hérité
              </span>
            )}
          </div>
        </div>
        <Badge variant={STATUS_CONFIG[form.status]?.variant || 'gray'}>
          {STATUS_CONFIG[form.status]?.label || form.status}
        </Badge>
      </div>

      {/* Badge programme */}
      {progLabel && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-400 w-3.5 h-3.5">{Icon.programme}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sectorClass || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {progLabel}
          </span>
        </div>
      )}

      {/* Title + description */}
      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1 leading-tight">{form.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{form.description}</p>

      {/* Barre de complétion */}
      {form.sentTo > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Taux de complétion</span>
            <span className={
              form.completionRate >= 80 ? 'text-green-600 dark:text-green-400 font-semibold' :
              form.completionRate >= 40 ? 'text-amber-600 dark:text-amber-400 font-semibold' :
              'text-red-500 dark:text-red-400 font-semibold'
            }>{form.completionRate}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${completionColor}`}
              style={{ width: `${form.completionRate}%` }}></div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-[#0f172a] rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Fields</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{form.fields}</p>
        </div>
        <button onClick={onResponses}
          className="bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg p-2 text-center transition-all cursor-pointer border-0 w-full">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Responses</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{form.responses || 0}</p>
        </button>
        <div className="bg-gray-50 dark:bg-[#0f172a] rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
            {form.sentToNames === 'all' ? 'All' : Array.isArray(form.sentToNames) ? form.sentToNames.length : (form.sentTo || 0)}
          </p>
        </div>
      </div>

      {/* Recipients preview */}
      {Array.isArray(form.sentToNames) && form.sentToNames.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {form.sentToNames.slice(0, 2).map((name, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
              {name}
            </span>
          ))}
          {form.sentToNames.length > 2 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-full">
              +{form.sentToNames.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Created date */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Created {new Date(form.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>

      {/* Actions */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 grid grid-cols-5 gap-1.5">
        <button onClick={onPreview}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all">
          {Icon.eye}<span>Preview</span>
        </button>
        <button onClick={onEdit}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
          {Icon.edit}<span>Edit</span>
        </button>
        <button onClick={onResponses}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all">
          {Icon.chartBar}<span>Results</span>
        </button>
        <button onClick={onSend}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all">
          {Icon.send}<span>Send</span>
        </button>
        <button onClick={onDelete}
          className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all">
          {Icon.trash}<span>Delete</span>
        </button>
      </div>
    </div>
  );
}

// ─── SEND FORM MODAL ──────────────────────────────────────────────────────────
function SendFormModal({ form, candidates, onClose, onSend }) {
  const [selected, setSelected] = useState([]);
  const [sendAll, setSendAll]   = useState(false);
  const [message, setMessage]   = useState(
    `Hello,\n\nPlease complete the "${form.title}" form at your earliest convenience.\n\nBest regards,\nMEDIANET Team`
  );
  const [sending, setSending] = useState(false);

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSend = () => {
    const recipients = sendAll
      ? candidates.map(c => c.name)
      : candidates.filter(c => selected.includes(c.id)).map(c => c.name);
    if (!recipients.length) return alert('Select at least one recipient');
    setSending(true);
    setTimeout(() => { onSend(form.id, recipients); setSending(false); }, 600);
  };

  const count = sendAll ? candidates.length : selected.length;

  return (
    <Modal isOpen={true} onClose={onClose} title={`Send: ${form.title}`} size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {Icon.form}
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{form.title}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">{form.fields} fields · {form.type} form</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Send to all candidates</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{candidates.length} candidates in the system</p>
          </div>
          <button
            onClick={() => { setSendAll(!sendAll); setSelected([]); }}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${sendAll ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${sendAll ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {!sendAll && (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Select Recipients
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {candidates.map(c => (
                <label key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                    selected.includes(c.id)
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                      : 'bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}>
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)}
                    className="accent-primary-500 w-4 h-4" />
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.startup} · {c.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">
            Email Message
          </label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:border-primary-500 text-sm resize-none" />
        </div>

        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
          count > 0
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {count > 0 ? `Will be sent to ${count} recipient${count !== 1 ? 's' : ''}` : 'No recipients selected yet'}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t dark:border-gray-700">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending || count === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow transition-all disabled:opacity-50">
            {Icon.send}
            {sending ? 'Sending...' : 'Send Form'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── PREVIEW MODAL ────────────────────────────────────────────────────────────
function PreviewModal({ form, onClose }) {
  const TYPES  = ['text','textarea','select','radio','checkbox','file','date','number'];
  const LABELS = ['Full Name','Project Description','Target Market','Business Model','Technologies Used','Upload Pitch Deck','Expected Launch Date','Team Size','Monthly Revenue','Competitive Advantage','Funding Required','Previous Funding'];

  const previewFields = Array.from({ length: form.fields }, (_, i) => ({
    id: i, type: TYPES[i % 8], label: LABELS[i] || `Question ${i + 1}`, required: i < 3,
  }));

  const renderInput = (f) => {
    const base = 'w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] rounded-xl text-gray-400 cursor-not-allowed';
    switch (f.type) {
      case 'textarea': return <textarea rows={3} disabled placeholder="Your answer..." className={`${base} resize-none`} />;
      case 'select':   return <select disabled className={base}><option>Select an option...</option><option>Option A</option><option>Option B</option></select>;
      case 'radio':    return <div className="space-y-2">{['Option A','Option B','Option C'].map(o => <label key={o} className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed"><input type="radio" disabled /> {o}</label>)}</div>;
      case 'checkbox': return <div className="space-y-2">{['Option A','Option B','Option C'].map(o => <label key={o} className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed"><input type="checkbox" disabled /> {o}</label>)}</div>;
      case 'file':     return <div className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 text-xs">{Icon.paperclip} Click to upload</div>;
      case 'date':     return <input type="date" disabled className={base} />;
      case 'number':   return <input type="number" disabled placeholder="0" className={base} />;
      default:         return <input type="text" disabled placeholder="Your answer..." className={base} />;
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Preview: ${form.title}`} size="lg">
      <div className="space-y-4">
        <div className="p-5 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 dark:border-primary-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{form.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{form.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>{form.fields} fields</span>
            <span>·</span>
            <span>Fields marked <span className="text-red-500">*</span> are required</span>
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {previewFields.map((f, i) => (
            <div key={f.id}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {i + 1}. {f.label}
                {f.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderInput(f)}
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button disabled
            className="w-full py-3 text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl opacity-40 cursor-not-allowed">
            Submit — Preview Only
          </button>
        </div>

        <div className="flex justify-end border-t dark:border-gray-700 pt-4">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  );
}