'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import useTranslation from '@/app/hooks/useTranslation';
import { useAdminRoles } from '@/app/hooks/useAdminRoles';

// ===================================================
// CONSTANTS
// ===================================================

const PERMISSIONS = [
  { id: 'MANAGE_USERS',            label: 'Gérer les utilisateurs',              description: 'Créer, modifier, supprimer les utilisateurs' },
  { id: 'EVALUATE_APPLICATIONS',   label: 'Évaluer les candidatures',            description: 'Examiner et noter les candidatures' },
  { id: 'VIEW_INVESTOR_CATALOG',   label: 'Voir le catalogue des investisseurs', description: 'Accéder à la base de données des investisseurs' },
  { id: 'MANAGE_FORMS',            label: 'Gérer les formulaires',               description: 'Créer et modifier les formulaires' },
  { id: 'MANAGE_STARTUP_PROFILES', label: 'Gérer les profils de startups',       description: 'Modifier les informations sur les startups' },
  { id: 'VIEW_ALL_STARTUPS',       label: 'Voir toutes les startups',            description: 'Afficher tous les profils de startups' },
  { id: 'VALIDATE_MATCHES',        label: 'Valider les correspondances',         description: 'Approuver les correspondances investisseur-startup' },
  { id: 'PROVIDE_MENTORING',       label: 'Fournir du mentorat',                 description: 'Accéder aux outils de mentorat' },
  { id: 'ACCESS_SUPPORT_TOOLS',    label: "Accéder aux outils d'assistance",     description: "Utiliser le tableau de bord d'assistance" },
  { id: 'GENERATE_REPORTS',        label: 'Générer des rapports',                description: 'Créer des rapports analytiques' },
  { id: 'CONFIGURE_PLATFORM',      label: 'Configurer la plateforme',            description: 'Configuration du système' },
  { id: 'MANAGE_ROLES',            label: 'Gérer les rôles',                     description: 'Créer et modifier les rôles' },
];

// ===================================================
// ICONS
// ===================================================

const Icons = {
  roles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  permission: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  copy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth={1.8} />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={1.8} />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  filter: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  time: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

// ===================================================
// MAIN PAGE
// ===================================================

export default function AdminRolesPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const {
    roles, stats, loading, error,
    fetchRoles,
    createRole, updateRole, updateRolePermissions, deleteRole, duplicateRole,
  } = useAdminRoles();

  const [mounted,                setMounted]                = useState(false);
  const [time,                   setTime]                   = useState(new Date());
  const [selectedRole,           setSelectedRole]           = useState(null);
  const [isEditModalOpen,        setIsEditModalOpen]        = useState(false);
  const [isAddModalOpen,         setIsAddModalOpen]         = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isDeleteModalOpen,      setIsDeleteModalOpen]      = useState(false);
  const [roleToDelete,           setRoleToDelete]           = useState(null);
  const [alert,                  setAlert]                  = useState({ show: false, type: '', message: '' });
  const [searchTerm,             setSearchTerm]             = useState('');
  const [showFilters,            setShowFilters]            = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddRole = async (newRole) => {
    try {
      await createRole(newRole);
      setIsAddModalOpen(false);
      showNotification('success', `Rôle "${newRole.name}" créé avec succès`);
    } catch (e) {
      showNotification('error', e.message);
    }
  };

  const handleUpdateRole = async (updatedRole) => {
    try {
      await updateRole(updatedRole.id, {
        name:        updatedRole.name,
        description: updatedRole.description,
        color:       updatedRole.color,
      });
      setIsEditModalOpen(false);
      showNotification('success', `Rôle "${updatedRole.name}" modifié avec succès`);
    } catch (e) {
      showNotification('error', e.message);
    }
  };

  // ✅ FIX: vérifie isSystem AVANT d'ouvrir le modal
  const handleDeleteRole = (role) => {
    if (role.isSystem) {
      showNotification('error', 'Les rôles système ne peuvent pas être supprimés');
      return;
    }
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  // ✅ FIX: gère les erreurs du backend (403, 409, 500…)
  const confirmDeleteRole = async () => {
    try {
      await deleteRole(roleToDelete.id);
      showNotification('success', `Rôle "${roleToDelete.name}" supprimé`);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    } catch (e) {
      // L'erreur remonte depuis le hook qui doit throw sur !res.ok
      showNotification('error', e.message || 'Erreur lors de la suppression');
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleDuplicateRole = async (role) => {
    try {
      await duplicateRole(role.id);
      showNotification('success', `Rôle "${role.name}" dupliqué`);
    } catch (e) {
      showNotification('error', e.message);
    }
  };

  const handleUpdatePermissions = async (roleId, permissions) => {
    try {
      await updateRolePermissions(roleId, permissions);
      setIsPermissionsModalOpen(false);
      showNotification('success', 'Autorisations modifiées avec succès');
    } catch (e) {
      showNotification('error', e.message);
    }
  };

  const filteredRoles = roles.filter(role =>
    (role.label || role.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes slideInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          .animate-slide-in-up { animation:slideInUp 0.5s ease-out forwards; }
          .animate-scale-in { animation:scaleIn 0.4s ease-out forwards; }
          .glass-card { background:rgba(255,255,255,0.95); backdrop-filter:blur(10px); border:1px solid rgba(0,0,0,0.05); }
          :global(.dark) .glass-card { background:#1e293b; border:1px solid #334155; box-shadow:0 4px 20px rgba(0,0,0,0.2); }
          .dark-glass { background:linear-gradient(135deg,rgba(0,82,110,0.95),rgba(0,109,148,0.95)); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1); }
          .stat-card { position:relative; overflow:hidden; transition:all 0.3s ease; }
          .stat-card:hover { transform:translateY(-4px); box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); }
          :global(.dark) .stat-card:hover { box-shadow:0 20px 25px -5px rgba(0,0,0,0.3); }
          .particle { position:absolute; width:4px; height:4px; background:rgba(255,255,255,0.4); border-radius:50%; animation:float 6s ease-in-out infinite; }
          .mono { font-family:'JetBrains Mono',monospace; }
          .role-card { transition:all 0.3s ease; }
          .role-card:hover { transform:translateY(-4px); box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); }
          :global(.dark) .role-card:hover { box-shadow:0 20px 25px -5px rgba(0,0,0,0.3); }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* ── HEADER ────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="particle" style={{ top:'10%', left:'15%', animationDelay:'0s' }}></div>
            <div className="particle" style={{ top:'60%', left:'80%', animationDelay:'1s' }}></div>
            <div className="particle" style={{ top:'30%', left:'50%', animationDelay:'2s' }}></div>

            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide">
                    GESTION DES RÔLES & AUTORISATIONS
                  </div>
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/80">En direct</span>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  Rôles & Autorisations
                </h1>
                <p className="text-blue-100 text-base lg:text-lg max-w-2xl">
                  Définissez les rôles des utilisateurs et gérez les autorisations d'accès sur l'ensemble de la plateforme
                </p>
                <div className="flex items-center gap-4 text-blue-100 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-200">{Icons.time}</span>
                    <span className="mono text-sm">
                      {mounted && time.toLocaleTimeString(t.locale || 'en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-blue-400/30"></div>
                  <span className="text-sm">
                    {mounted && time.toLocaleDateString(t.locale || 'en-US', { weekday:'long', month:'short', day:'numeric' })}
                  </span>
                </div>
              </div>

              <div className="dark-glass rounded-xl p-4 min-w-[260px]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user?.name || 'Admin User'}</p>
                    <p className="text-blue-200 text-xs mono">ROLE ADMIN</p>
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

          {/* ── STATS ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Rôles totaux',         value: stats.total      || 0, color: 'from-blue-500 to-blue-600',       text: 'text-gray-900 dark:text-white',           icon: Icons.roles },
              { label: 'Rôles système',         value: stats.system     || 0, color: 'from-purple-500 to-purple-600',   text: 'text-purple-600 dark:text-purple-400',    icon: Icons.lock },
              { label: 'Rôles personnalisés',   value: stats.custom     || 0, color: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600 dark:text-emerald-400',  icon: Icons.plus },
              { label: 'Utilisateurs assignés', value: stats.totalUsers || 0, color: 'from-amber-500 to-orange-500',    text: 'text-amber-600 dark:text-amber-400',      icon: Icons.users },
            ].map((stat, i) => (
              <div key={i} className="stat-card glass-card rounded-xl p-5 animate-scale-in dark:!bg-[#1e293b]"
                style={{ animationDelay: `${0.1 + i * 0.02}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* ── ALERT / ERROR ─────────────────────────────────────────── */}
          {alert.show && (
            <Alert type={alert.type} message={alert.message}
              onClose={() => setAlert({ show: false, type: '', message: '' })} />
          )}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
              <span>⚠ {error}</span>
              <button onClick={fetchRoles} className="text-xs font-medium hover:underline">Réessayer</button>
            </div>
          )}

          {/* ── ACTION BAR ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <span className={showFilters ? 'text-primary-600 dark:text-primary-400' : ''}>{Icons.filter}</span>
              Filtres
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{filteredRoles.length} rôles trouvés</span>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                {Icons.plus}
                <span className="hidden sm:inline">Créer un rôle</span>
              </button>
            </div>
          </div>

          {/* ── SEARCH ────────────────────────────────────────────────── */}
          <div className="glass-card rounded-xl p-5 dark:!bg-[#1e293b]">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
                <input
                  type="text"
                  placeholder="Rechercher les rôles par nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
              {showFilters && (
                <select className="px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium">
                  <option value="all">Tous les types</option>
                  <option value="system">Rôles système</option>
                  <option value="custom">Rôles personnalisés</option>
                </select>
              )}
            </div>
          </div>

          {/* ── ROLES GRID ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-5 animate-pulse dark:!bg-[#1e293b]">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredRoles.length === 0 ? (
              <div className="col-span-full glass-card rounded-xl p-12 text-center dark:!bg-[#1e293b]">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
                  {Icons.roles}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucun rôle trouvé</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Essayez d'ajuster votre recherche ou créez un nouveau rôle</p>
                <button onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 transition-colors">
                  Créer un rôle
                </button>
              </div>
            ) : (
              filteredRoles.map((role, index) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  index={index}
                  onEdit={() => { setSelectedRole(role); setIsEditModalOpen(true); }}
                  onDelete={() => handleDeleteRole(role)}
                  onDuplicate={() => handleDuplicateRole(role)}
                  onPermissions={() => { setSelectedRole(role); setIsPermissionsModalOpen(true); }}
                />
              ))
            )}
          </div>
        </div>

        {/* ── MODALS ──────────────────────────────────────────────────── */}
        {selectedRole && (
          <>
            <RoleEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              role={selectedRole}
              onSave={handleUpdateRole}
            />
            <PermissionsModal
              isOpen={isPermissionsModalOpen}
              onClose={() => setIsPermissionsModalOpen(false)}
              role={selectedRole}
              permissions={PERMISSIONS}
              onSave={handleUpdatePermissions}
            />
          </>
        )}

        <RoleAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddRole}
          permissions={PERMISSIONS}
        />

        {/* ── DELETE CONFIRM MODAL ────────────────────────────────────── */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setRoleToDelete(null); }}
          role={roleToDelete}
          onConfirm={confirmDeleteRole}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ===================================================
// ROLE CARD
// ===================================================
function RoleCard({ role, index, onEdit, onDelete, onDuplicate, onPermissions }) {
  const getRoleColorStyle = (color) => ({
    background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
  });
  const isProtected = role.isSystem;

  return (
    <div className="role-card glass-card rounded-xl overflow-hidden animate-scale-in dark:!bg-[#1e293b] hover:shadow-xl transition-all group"
      style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="h-1.5 w-full" style={{ background: role.color }}></div>
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
            style={getRoleColorStyle(role.color)}>
            {/* ✅ Initiales depuis label */}
            {(role.label || role.name).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* ✅ Affiche label depuis BD */}
              <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                {role.label || role.name}
              </h3>
              {isProtected && (
                <Badge variant="info" size="sm">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Système
                  </span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{role.description}</p>
          </div>

          <button
            onClick={isProtected ? undefined : onDelete}
            title={isProtected ? 'Les rôles système ne peuvent pas être supprimés' : 'Supprimer ce rôle'}
            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all
              ${isProtected
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40'
                : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer'
              }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          <span className="text-gray-600 dark:text-gray-400">{role.userCount || 0} utilisateurs assignés</span>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Autorisations</span>
            <span className="text-xs text-gray-400">{(role.permissions || []).length} / {PERMISSIONS.length}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(role.permissions || []).slice(0, 3).map(perm => {
              const permLabel = PERMISSIONS.find(p => p.id === perm)?.label || perm;
              return (
                <span key={perm} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {permLabel.length > 20 ? permLabel.slice(0, 18) + '…' : permLabel}
                </span>
              );
            })}
            {(role.permissions || []).length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                +{role.permissions.length - 3} plus
              </span>
            )}
            {(role.permissions || []).length === 0 && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400 italic">
                Aucune autorisation assignée
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center gap-1">
          <button onClick={onPermissions}
            className="flex flex-col items-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Autorisations</span>
          </button>
          <button onClick={onEdit}
            className="flex flex-col items-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Modifier</span>
          </button>
          {!isProtected && (
            <button onClick={onDuplicate}
              className="flex flex-col items-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth={1.8} />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={1.8} />
              </svg>
              <span>Copier</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
// ===================================================
// ROLE EDIT MODAL
// ===================================================
function RoleEditModal({ isOpen, onClose, role, onSave }) {
  const [formData, setFormData] = useState({ name: '', description: '', color: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) setFormData({ name: role.name, description: role.description || '', color: role.color });
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    await onSave({ ...role, ...formData });
    setSaving(false);
  };

  const inputClass = "w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
  const labelClass = "block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5";
  const colorOptions = ['#00526e','#006d94','#0088ba','#2ccc7d','#ffbf00','#ff0080','#7C3AED','#4F46E5','#DC2626','#F59E0B'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Modifier le rôle: ${role?.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Nom du rôle *</label>
          <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="ex: Chef de produit" className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            rows={3} placeholder="Décrivez le rôle..." className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className={labelClass}>Couleur du thème</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {colorOptions.map(c => (
              <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, color: c }))}
                className={`w-8 h-8 rounded-full transition-all ${formData.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                style={{ background: c }} />
            ))}
          </div>
          <input type="text" value={formData.color} onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
            placeholder="#HEX" className={`${inputClass} font-mono text-sm`} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {saving ? 'Enregistrement en cours…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ===================================================
// ROLE ADD MODAL
// ===================================================
function RoleAddModal({ isOpen, onClose, onSave, permissions }) {
  const [formData, setFormData] = useState({ name: '', description: '', color: '#00526e', permissions: [] });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setFormData({ name: '', description: '', color: '#00526e', permissions: [] });
  };

  const toggle = (id) => setFormData(p => ({
    ...p, permissions: p.permissions.includes(id) ? p.permissions.filter(x => x !== id) : [...p.permissions, id]
  }));

  const inputClass = "w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
  const labelClass = "block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5";
  const colorOptions = ['#00526e','#006d94','#0088ba','#2ccc7d','#ffbf00','#ff0080','#7C3AED','#4F46E5','#DC2626','#F59E0B'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un nouveau rôle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom du rôle *</label>
            <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="ex: Chef de produit" className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Couleur du thème</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(c => (
                <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-full transition-all ${formData.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            rows={2} placeholder="Décrivez le rôle..." className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className={labelClass}>Autorisations</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            {permissions.map(perm => (
              <label key={perm.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${formData.permissions.includes(perm.id) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <input type="checkbox" checked={formData.permissions.includes(perm.id)} onChange={() => toggle(perm.id)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{perm.label}</span>
                  <p className="text-xs text-gray-400">{perm.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Annuler
          </button>
          <button type="submit" disabled={saving || !formData.name.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {saving ? 'Création en cours…' : 'Créer un rôle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ===================================================
// PERMISSIONS MODAL
// ===================================================
function PermissionsModal({ isOpen, onClose, role, permissions, onSave }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) setSelected(role.permissions || []);
  }, [role]);

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
  );

  const handleSave = async () => {
    setSaving(true);
    await onSave(role.id, selected);
    setSaving(false);
  };

  const groups = {
    UserManagement:      permissions.filter(p => ['MANAGE_USERS','MANAGE_ROLES','CONFIGURE_PLATFORM'].includes(p.id)),
    Applications:        permissions.filter(p => ['EVALUATE_APPLICATIONS','MANAGE_FORMS','VALIDATE_MATCHES'].includes(p.id)),
    StartupEcosystem:    permissions.filter(p => ['MANAGE_STARTUP_PROFILES','VIEW_ALL_STARTUPS','VIEW_INVESTOR_CATALOG'].includes(p.id)),
    SupportAndMentoring: permissions.filter(p => ['PROVIDE_MENTORING','ACCESS_SUPPORT_TOOLS','GENERATE_REPORTS'].includes(p.id)),
  };
  const groupLabels = {
    UserManagement:      'Gestion des utilisateurs',
    Applications:        'Candidatures',
    StartupEcosystem:    'Écosystème de startups',
    SupportAndMentoring: 'Support & Mentorat',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissions: ${role?.name}`} size="lg">
      <div className="space-y-5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configurez les autorisations d'accès pour <span className="font-semibold text-primary-600">{role?.name}</span>.
        </p>
        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
          {Object.entries(groups).map(([key, perms]) => !perms.length ? null : (
            <div key={key}>
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {groupLabels[key]}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {perms.map(perm => (
                  <label key={perm.id}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selected.includes(perm.id) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                    <input type="checkbox" checked={selected.includes(perm.id)} onChange={() => toggle(perm.id)}
                      className="mt-0.5 w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{perm.label}</p>
                      <p className="text-xs text-gray-400">{perm.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {saving ? 'Enregistrement en cours…' : 'Enregistrer les autorisations'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ===================================================
// DELETE CONFIRM MODAL
// ===================================================
function DeleteConfirmModal({ isOpen, onClose, role, onConfirm }) {
  const [deleting, setDeleting]       = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText === role?.name;

  useEffect(() => {
    if (!isOpen) setConfirmText('');
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supprimer le rôle" size="sm">
      <div className="space-y-5">

        {/* Icône danger */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Supprimer «&nbsp;{role?.name}&nbsp;»&nbsp;?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cette action est{' '}
            <span className="font-semibold text-red-600 dark:text-red-400">irréversible</span>.
            Les utilisateurs assignés à ce rôle perdront leurs autorisations associées.
          </p>
        </div>

        {/* ✅ Avertissement si des utilisateurs sont assignés */}
        {role?.userCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-bold">{role.userCount}</span>{' '}
              utilisateur{role.userCount > 1 ? 's' : ''}{' '}
              sera{role.userCount > 1 ? 'ont' : ''} affecté{role.userCount > 1 ? 's' : ''}.
              {' '}La suppression sera bloquée par le serveur.
            </span>
          </div>
        )}

        {/* Confirmation par saisie du nom */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Tapez{' '}
            <span className="font-mono font-bold text-gray-900 dark:text-white">{role?.name}</span>{' '}
            pour confirmer
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={role?.name}
            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed || deleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Suppression…
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}