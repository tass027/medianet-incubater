'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import { useAdminUsers } from '@/app/hooks/useAdminUsers';
import { useAdminRoles } from '@/app/hooks/useAdminRoles';
import { confirmDelete, toastSuccess, toastError } from '@/app/hooks/useSwal';

// ── Icons ─────────────────────────────────────────────────────────
const I = {
  search:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  plus:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>,
  edit:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  trash:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  download: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  filter:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>,
  eye:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  lock:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  users:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  location: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  building: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  refresh:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  mail:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
};

// ── Constants ─────────────────────────────────────────────────────

// ✅ FIX 1 : Ajout de startup et founder dans ROLE_COLORS
const ROLE_COLORS = {
  admin:     { bg: 'from-[#E24B4A] to-[#c43a39]', badge: 'primary'   },
  mentor:    { bg: 'from-[#3B6D11] to-[#4a8a15]', badge: 'accent'    },
  investor:  { bg: 'from-[#534AB7] to-[#6358d4]', badge: 'secondary' },
  jury:      { bg: 'from-[#185FA5] to-[#1a6fc0]', badge: 'primary'   },
  applicant: { bg: 'from-[#854F0B] to-[#a06010]', badge: 'secondary' },
  startup:   { bg: 'from-[#0088ba] to-[#00a3e0]', badge: 'primary'   },
  founder:   { bg: 'from-[#0088ba] to-[#00a3e0]', badge: 'primary'   },
};

// ✅ FIX 2 : Labels de fallback si la BD ne retourne pas de label
const ROLE_FALLBACK_LABELS = {
  admin:     'Administrateur',
  mentor:    'Mentor',
  jury:      'Jury',
  investor:  'Investisseur',
  applicant: 'Candidat',
  startup:   'Startup / Fondateur',
  founder:   'Intrapreneur',
};

// ✅ Rôles créables par l'admin uniquement
const ADMIN_CREATABLE_ROLES = {
  admin:    'Administrateur',
  mentor:   'Mentor',
  jury:     'Jury',
  investor: 'Investisseur',
};

const STATUS_VARIANTS = {
  active: 'success', inactive: 'gray', pending: 'warning', suspended: 'error',
};

const ALL_PERMISSIONS = [
  { id: 'MANAGE_USERS',            label: 'Gérer les utilisateurs',              group: 'Admin'      },
  { id: 'CONFIGURE_PLATFORM',      label: 'Configurer la plateforme',            group: 'Admin'      },
  { id: 'GENERATE_REPORTS',        label: 'Générer des rapports',                group: 'Admin'      },
  { id: 'MANAGE_ROLES',            label: 'Gérer les rôles',                     group: 'Admin'      },
  { id: 'EVALUATE_APPLICATIONS',   label: 'Évaluer les candidatures',            group: 'Opérations' },
  { id: 'MANAGE_FORMS',            label: 'Gérer les formulaires',               group: 'Opérations' },
  { id: 'VALIDATE_MATCHES',        label: 'Valider les correspondances',         group: 'Opérations' },
  { id: 'MANAGE_STARTUP_PROFILES', label: 'Gérer les profils de startups',       group: 'Startups'   },
  { id: 'VIEW_ALL_STARTUPS',       label: 'Voir toutes les startups',            group: 'Startups'   },
  { id: 'VIEW_INVESTOR_CATALOG',   label: 'Voir le catalogue des investisseurs', group: 'Startups'   },
  { id: 'PROVIDE_MENTORING',       label: 'Fournir du mentorat',                 group: 'Mentorat'   },
  { id: 'ACCESS_SUPPORT_TOOLS',    label: "Accéder aux outils d'assistance",     group: 'Support'    },
];

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);

  const {
    users, stats, pagination, loading, error,
    search, setSearch,
    filterRole, setFilterRole,
    filterStatus, setFilterStatus,
    page, setPage, sort, setSort,
    selectedIds, toggleSelect, selectAll,
    fetchUsers, createUser, updateUser, updatePermissions, updateStatus, deleteUser,
    bulkAction, exportCSV,
  } = useAdminUsers();

  // ✅ Rôles depuis la BD pour le filtre
  const { roles: availableRoles } = useAdminRoles();

  const [alert,        setAlert]        = useState({ show: false, type: '', message: '' });
  const [showFilters,  setShowFilters]  = useState(false);
  const [isAddOpen,    setIsAddOpen]    = useState(false);
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [isPermOpen,   setIsPermOpen]   = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [savingAction, setSavingAction] = useState('');

  const notify = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4500);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    setSavingAction('create');
    try {
      const data = await createUser(payload);
      setIsAddOpen(false);
      if (data.emailError) {
        notify('warning', `Le compte de ${payload.name} a été créé, mais l'envoi de l'e-mail d'invitation a échoué.`);
      } else {
        notify('success', `Le compte de ${payload.name} a été créé et un e-mail d'invitation lui a été envoyé.`);
      }
    } catch (e) { notify('error', e.message); }
    finally { setSavingAction(''); }
  };

  const handleUpdate = async (payload) => {
    setSavingAction('edit');
    try {
      await updateUser(selectedUser._id, payload);
      setIsEditOpen(false);
      notify('success', 'Utilisateur modifié avec succès');
    } catch (e) { notify('error', e.message); }
    finally { setSavingAction(''); }
  };

  const handleUpdatePermissions = async (permissions) => {
    setSavingAction('perm');
    try {
      await updatePermissions(selectedUser._id, permissions);
      setIsPermOpen(false);
      notify('success', 'Autorisations modifiées');
    } catch (e) { notify('error', e.message); }
    finally { setSavingAction(''); }
  };


  const handleDelete = async (u) => {
    const { isConfirmed } = await confirmDelete(u.name);
    if (!isConfirmed) return;
    try {
      await deleteUser(u._id);
      toastSuccess(`${u.name} supprimé.`);
    } catch (e) {
      toastError(e.message);
    }
  };

  const handleBulk = async (action, value) => {
    if (!selectedIds.length) return notify('warning', "Sélectionnez d'abord les utilisateurs");
    setSavingAction('bulk');
    try {
      await bulkAction(action, value);
      notify('success', `Action en masse "${action}" appliquée`);
    } catch (e) { notify('error', e.message); }
    finally { setSavingAction(''); }
  };

  const handleStatusToggle = async (u, newStatus) => {
    try {
      await updateStatus(u._id, newStatus);
      notify('success', `Statut défini à ${newStatus}`);
    } catch (e) { notify('error', e.message); }
  };

  const handleExport = async () => {
    try { await exportCSV(); notify('success', 'Exportation commencée'); }
    catch (e) { notify('error', e.message); }
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const formatDate  = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';
  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const roleGradient = (role) =>
    ROLE_COLORS[role]?.bg || 'from-gray-400 to-gray-500';

  // ✅ FIX 3 : getRoleLabel utilise roleLabel de la BD + fallback local
  const getRoleLabel = (u) =>
    u.roleLabel && u.roleLabel !== u.role
      ? u.roleLabel
      : ROLE_FALLBACK_LABELS[u.role] || u.role;

  const statsCards = [
    { label: 'Utilisateurs totaux', value: stats.total       || 0, color: 'text-primary-600' },
    { label: "Actif aujourd'hui",   value: stats.activeToday || 0, color: 'text-emerald-600' },
    { label: 'Administrateurs',     value: stats.admin       || 0, color: 'text-blue-600'    },
    { label: 'Candidats',           value: stats.applicant   || 0, color: 'text-rose-600'    },
    { label: 'Mentors',             value: stats.mentor      || 0, color: 'text-purple-600'  },
    { label: 'En attente',          value: stats.pending     || 0, color: 'text-amber-600'   },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { font-family: 'Inter', sans-serif; }
          @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scaleIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
          .anim-up { animation: slideUp 0.45s ease-out forwards; }
          .anim-in { animation: scaleIn 0.35s ease-out forwards; }
          .glass { background:rgba(255,255,255,0.97); border:1px solid rgba(0,0,0,0.06); }
          :global(.dark) .glass { background:#1e293b; border-color:#334155; }
          .ucard { transition:all .25s ease; }
          .ucard:hover { transform:translateY(-3px); box-shadow:0 16px 32px -8px rgba(0,82,110,.18); }
          :global(.dark) .ucard:hover { box-shadow:0 16px 32px -8px rgba(0,0,0,.4); }
        `}</style>

        <div className="space-y-6 pb-12">

          {/* ── HEADER ── */}
          <div className="relative overflow-hidden rounded-2xl p-8 anim-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 55%,#0088ba 100%)' }}>
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Gestion des utilisateurs</h1>
                <p className="text-blue-100 text-sm">Gérez les comptes internes — connecté à la base de données en direct</p>
                <div className="flex items-center gap-3 mt-3 text-blue-200 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"/>
                    Données en direct
                  </span>
                  <span className="opacity-40">|</span>
                  <span>{stats.total || 0} utilisateurs au total</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all border border-white/20">
                  {I.download} Exporter CSV
                </button>
                <button onClick={() => setIsAddOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all shadow-lg">
                  {I.plus} Ajouter un utilisateur
                </button>
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statsCards.map((s, i) => (
              <div key={i} className="glass rounded-xl p-4 anim-in" style={{ animationDelay: `${i * 0.04}s` }}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── ALERT ── */}
          {alert.show && (
            <Alert type={alert.type} message={alert.message}
              onClose={() => setAlert({ show: false, type: '', message: '' })} />
          )}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
              <span>⚠ {error}</span>
              <button onClick={fetchUsers} className="flex items-center gap-1 text-xs font-medium hover:underline">
                {I.refresh} Réessayer
              </button>
            </div>
          )}

          {/* ── SEARCH + FILTERS ── */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{I.search}</span>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, email ou entreprise…"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none" />
              </div>
              <button onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {I.filter} Filtres
              </button>
              <button onClick={fetchUsers}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                {I.refresh}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 anim-in">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rôle</label>
                  <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none">
                    <option value="all">Tous les rôles</option>
                    {/* ✅ Rôles depuis la BD avec label */}
                    {availableRoles.map(role => (
                      <option key={role.name} value={role.name}>
                        {role.label || ROLE_FALLBACK_LABELS[role.name] || role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Statut</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none">
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="pending">En attente</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trier par</label>
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none">
                    <option value="-createdAt">Plus récent en premier</option>
                    <option value="createdAt">Plus ancien en premier</option>
                    <option value="name">Nom A→Z</option>
                    <option value="-name">Nom Z→A</option>
                    <option value="-lastActive">Dernière activité</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── BULK ACTIONS ── */}
          {selectedIds.length > 0 && (
            <div className="glass rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 anim-in border-l-4 border-primary-500">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedIds.length} utilisateur(s) sélectionné(s)
              </span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Définir comme actif',   value: 'active',    cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                  { label: 'Définir comme inactif', value: 'inactive',  cls: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200' },
                  { label: 'Suspendre',             value: 'suspended', cls: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                ].map(b => (
                  <button key={b.value} onClick={() => handleBulk('status', b.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${b.cls}`}>
                    {b.label}
                  </button>
                ))}
                <button onClick={() => handleBulk('delete')}
                  className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          )}

          {/* ── USERS GRID ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-xl p-5 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"/>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"/>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"/>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6"/>
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="glass rounded-xl p-16 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
                {I.users}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucun utilisateur trouvé</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Essayez d'ajuster vos filtres</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <input type="checkbox" className="w-4 h-4 rounded accent-primary-600"
                  checked={selectedIds.length === users.length && users.length > 0}
                  onChange={selectAll} />
                <span>Sélectionner tout ({users.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u, idx) => (
                  <div key={u._id}
                    className={`ucard glass rounded-xl overflow-hidden anim-in group relative ${selectedIds.includes(u._id) ? 'ring-2 ring-primary-500' : ''}`}
                    style={{ animationDelay: `${idx * 0.03}s` }}>
                    <div className={`h-1.5 w-full bg-gradient-to-r ${roleGradient(u.role)}`} />
                    <div className="p-5">
                      <div className="absolute top-4 left-4 z-10">
                        <input type="checkbox" className="w-4 h-4 rounded accent-primary-600"
                          checked={selectedIds.includes(u._id)}
                          onChange={() => toggleSelect(u._id)}
                          onClick={e => e.stopPropagation()} />
                      </div>
                      <div className="flex gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${roleGradient(u.role)} shadow-md`}>
                          {getInitials(u.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {/* ✅ FIX 4 : getRoleLabel() pour afficher le bon label */}
                            <Badge variant={ROLE_COLORS[u.role]?.badge || 'gray'} size="sm">
                              {getRoleLabel(u)}
                            </Badge>
                            <Badge variant={STATUS_VARIANTS[u.status] || 'gray'} size="sm">
                              {u.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        {u.company  && <div className="flex items-center gap-1.5">{I.building}<span className="truncate">{u.company}</span></div>}
                        {u.location && <div className="flex items-center gap-1.5">{I.location}<span>{u.location}</span></div>}
                        <div className="flex items-center gap-1.5">{I.calendar}<span>Inscrit le {formatDate(u.createdAt)}</span></div>
                        {u.permissions?.length > 0 && <div className="flex items-center gap-1.5">{I.lock}<span>{u.permissions.length} permission(s)</span></div>}
                      </div>

                      {/* ✅ FIX 5 : Actions toujours visibles (suppression du opacity-0 group-hover) */}
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <button onClick={() => router.push(`/dashboard/admin/users/${u._id}`)}
                          className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
                          {I.eye} Afficher
                        </button>
                        <div className="flex gap-1">
                          <button onClick={() => { setSelectedUser(u); setIsPermOpen(true); }} title="Gérer les autorisations"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                            {I.lock}
                          </button>
                          <button onClick={() => { setSelectedUser(u); setIsEditOpen(true); }} title="Modifier"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                            {I.edit}
                          </button>
                          <button onClick={() => handleDelete(u)} title="Supprimer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            {I.trash}
                          </button>
                        </div>
                      </div>

                      {u.status !== 'active' && (
                        <button onClick={() => handleStatusToggle(u, 'active')}
                          className="mt-2 w-full text-xs py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors font-medium">
                          Activer le compte
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    ← Précédent
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                    Page {page} / {pagination.pages} ({pagination.total} utilisateurs)
                  </span>
                  <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── MODALS ── */}
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Ajouter un nouvel utilisateur" size="lg">
          <UserForm mode="create" onSave={handleCreate} onCancel={() => setIsAddOpen(false)} saving={savingAction === 'create'} />
        </Modal>

        {selectedUser && (
          <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Modifier — ${selectedUser.name}`} size="lg">
            <UserForm mode="edit" initial={selectedUser} onSave={handleUpdate} onCancel={() => setIsEditOpen(false)} saving={savingAction === 'edit'} />
          </Modal>
        )}

        {selectedUser && (
          <Modal isOpen={isPermOpen} onClose={() => setIsPermOpen(false)} title={`Autorisations — ${selectedUser.name}`} size="lg">
            <PermissionsForm initial={selectedUser.permissions || []} onSave={handleUpdatePermissions} onCancel={() => setIsPermOpen(false)} saving={savingAction === 'perm'} />
          </Modal>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ════════════════════════════════════════════════════════════════
// UserForm
// ════════════════════════════════════════════════════════════════
function UserForm({ mode, initial = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name:              initial.name  || '',
    email:             initial.email || '',
    password:          '',
    role:              initial.role && ADMIN_CREATABLE_ROLES[initial.role] ? initial.role : 'mentor',
    status:            initial.status     || 'active',
    company:           initial.company    || '',
    department:        initial.department || '',
    location:          initial.location   || 'Tunis',
    phone:             initial.phone      || '',
    invitationMessage: '',
  });
  const [errors, setErrors] = useState({});
  const [showInvitationMsg, setShowInvitationMsg] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Le nom est requis';
    if (!form.email.trim()) e.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    if (mode === 'create' && !form.password) e.password = 'Le mot de passe est requis';
    if (!ADMIN_CREATABLE_ROLES[form.role])   e.role     = 'Veuillez sélectionner un rôle valide';
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const payload = { ...form };
    if (!payload.password)          delete payload.password;
    if (!payload.invitationMessage) delete payload.invitationMessage;
    onSave(payload);
  };

  const fldCls = (field) =>
    `w-full px-3 py-2.5 text-sm border ${errors[field] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all`;
  const lblCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lblCls}>Nom complet *</label>
          <input className={fldCls('name')} value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jean Dupont"/>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className={lblCls}>Email *</label>
          <input type="email" className={fldCls('email')} value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="utilisateur@exemple.com"/>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
        {mode === 'create' && (
          <div>
            <label className={lblCls}>Mot de passe temporaire *</label>
            <input type="password" className={fldCls('password')} value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 caractères"/>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            <p className="text-xs text-gray-400 mt-1">Ce mot de passe sera transmis dans l'e-mail d'invitation.</p>
          </div>
        )}
        <div>
          <label className={lblCls}>Rôle *</label>
          <select className={fldCls('role')} value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="">-- Sélectionnez un rôle --</option>
            {Object.entries(ADMIN_CREATABLE_ROLES).map(([v, l]) =>
              <option key={v} value={v}>{l}</option>
            )}
          </select>
          {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
          <p className="text-xs text-gray-400 mt-1">Seuls les comptes internes peuvent être créés manuellement.</p>
        </div>
        <div>
          <label className={lblCls}>Statut *</label>
          <select className={fldCls('status')} value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>
        <div>
          <label className={lblCls}>Entreprise</label>
          <input className={fldCls('company')} value={form.company}
            onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="MEDIANET"/>
        </div>
        <div>
          <label className={lblCls}>Département</label>
          <input className={fldCls('department')} value={form.department}
            onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="R&D"/>
        </div>
        <div>
          <label className={lblCls}>Localisation</label>
          <select className={fldCls('location')} value={form.location}
            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
            {['Tunis','Sfax','Sousse','Monastir','Casablanca','Remote'].map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>
        </div>
        <div>
          <label className={lblCls}>Téléphone</label>
          <input className={fldCls('phone')} value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+216 XX XXX XXX"/>
        </div>
      </div>

      {mode === 'create' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <button type="button" onClick={() => setShowInvitationMsg(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Personnaliser le message d'invitation <span className="text-gray-400 font-normal">(optionnel)</span>
            </span>
            <span className="text-gray-400 text-xs">{showInvitationMsg ? '▲ Masquer' : '▼ Afficher'}</span>
          </button>
          {showInvitationMsg && (
            <div className="p-4 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ce message apparaîtra dans l'e-mail d'invitation, en plus des informations de connexion.
              </p>
              <textarea rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all resize-none"
                placeholder="Ex : Bienvenue dans l'équipe ! Votre rôle de mentor débutera le 15 juin."
                value={form.invitationMessage}
                onChange={e => setForm(p => ({ ...p, invitationMessage: e.target.value }))}
              />
              <p className="text-xs text-gray-400">{form.invitationMessage.length} / 500 caractères</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
          Annuler
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? 'Création en cours…' : mode === 'create' ? "✉ Créer et envoyer l'invitation" : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════
// PermissionsForm
// ════════════════════════════════════════════════════════════════
function PermissionsForm({ initial, onSave, onCancel, saving }) {
  const [selected, setSelected] = useState(initial || []);
  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
  );
  const groups = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Basculez les autorisations pour cet utilisateur. Les modifications remplacent les paramètres par défaut du rôle.
      </p>
      <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
        {groups.map(group => (
          <div key={group}>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{group}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ALL_PERMISSIONS.filter(p => p.group === group).map(perm => (
                <label key={perm.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selected.includes(perm.id)
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-700'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                  <input type="checkbox" className="w-4 h-4 accent-primary-600"
                    checked={selected.includes(perm.id)} onChange={() => toggle(perm.id)} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500">{selected.length} / {ALL_PERMISSIONS.length} autorisations</span>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Annuler
          </button>
          <button onClick={() => onSave(selected)} disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer les autorisations'}
          </button>
        </div>
      </div>
    </div>
  );
}