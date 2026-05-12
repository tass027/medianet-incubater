'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import { useAdminUserDetail } from '@/app/hooks/useAdminUsers';

// ── Icons ─────────────────────────────────────────────────────────
const I = {
  back:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>,
  edit:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  lock:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  mail:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  phone:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
  pin:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  bld:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  cal:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  check:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>,
  x:        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>,
  activity: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  rocket:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
};

// ✅ FIX 1 : ROLE_COLORS complet avec startup, founder, applicant
const ROLE_COLORS = {
  admin:     'from-[#E24B4A] to-[#c43a39]',
  mentor:    'from-[#3B6D11] to-[#4a8a15]',
  investor:  'from-[#534AB7] to-[#6358d4]',
  jury:      'from-[#185FA5] to-[#1a6fc0]',
  applicant: 'from-[#854F0B] to-[#a06010]',
  startup:   'from-[#0088ba] to-[#00a3e0]',
  founder:   'from-[#0088ba] to-[#00a3e0]',
  support:   'from-[#8b5cf6] to-[#6d28d9]',
};

// ✅ FIX 2 : ROLE_LABELS complet avec startup, founder, applicant — en français
const ROLE_LABELS = {
  admin:     'Administrateur',
  mentor:    'Mentor',
  investor:  'Investisseur',
  jury:      'Jury',
  applicant: 'Candidat',
  startup:   'Startup / Fondateur',
  founder:   'Intrapreneur',
  support:   'Support',
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
// MAIN
// ════════════════════════════════════════════════════════════════
export default function UserDetailPage() {
  const { id } = useParams();
  const { user: currentUser } = useSelector(s => s.auth);

  const { user, activity, loading, error, updateUser, updatePermissions, updateStatus } =
    useAdminUserDetail(id);

  const [alert,      setAlert]      = useState({ show: false, type: '', message: '' });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [saving,     setSaving]     = useState('');

  const notify = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
  };

  const handleUpdate = async (payload) => {
    setSaving('edit');
    try { await updateUser(payload); setIsEditOpen(false); notify('success', 'Utilisateur modifié'); }
    catch (e) { notify('error', e.message); }
    finally { setSaving(''); }
  };

  const handlePerms = async (permissions) => {
    setSaving('perm');
    try { await updatePermissions(permissions); setIsPermOpen(false); notify('success', 'Autorisations mises à jour'); }
    catch (e) { notify('error', e.message); }
    finally { setSaving(''); }
  };

  const handleStatusChange = async (newStatus) => {
    try { await updateStatus(newStatus); notify('success', `Statut défini à ${newStatus}`); }
    catch (e) { notify('error', e.message); }
  };

  const fmt = (d, withTime = false) => {
    if (!d) return '-';
    const date = new Date(d);
    return withTime
      ? date.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const initials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"/>
            <p className="text-gray-500 text-sm">Chargement des données…</p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );

  // ── Error ─────────────────────────────────────────────────────
  if (error || !user) return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 text-3xl mb-4">!</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Utilisateur introuvable</h2>
            <p className="text-gray-500 text-sm mb-4">{error || `Aucun utilisateur avec l'ID ${id}`}</p>
            <Link href="/dashboard/admin/users">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm hover:bg-primary-700 transition-colors">
                Retour aux utilisateurs
              </button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );

  // ✅ FIX 3 : gradient correct selon le rôle
  const gradient = ROLE_COLORS[user.role] || 'from-gray-400 to-gray-600';

  // ✅ FIX 4 : roleLabel utilise roleLabel de la BD ou fallback
  const roleLabel = user.roleLabel || ROLE_LABELS[user.role] || user.role;

  // ✅ FIX 5 : Données startup extraites de startupProfile si disponibles
  const isStartup = ['startup', 'founder', 'applicant'].includes(user.role);
  const startupProfile = user.startupProfile || {};

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { font-family:'Inter',sans-serif; }
          @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .anim { animation:slideUp .4s ease-out forwards; }
          .glass { background:rgba(255,255,255,0.97); border:1px solid rgba(0,0,0,0.06); }
          :global(.dark) .glass { background:#1e293b; border-color:#334155; }
        `}</style>

        <div className="space-y-6 pb-12">

          {/* ── HEADER ── */}
          <div className="relative overflow-hidden rounded-2xl p-8 anim"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 55%,#0088ba 100%)' }}>
            <div className="relative">
              <Link href="/dashboard/admin/users">
                <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-5 transition-colors">
                  {I.back} Retour aux utilisateurs
                </button>
              </Link>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* ✅ FIX 6 : Avatar avec gradient correct */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl bg-gradient-to-br ${gradient}`}>
                    {initials(user.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                      {/* ✅ FIX 7 : Affiche roleLabel lisible */}
                      <Badge variant="primary" size="lg">{roleLabel}</Badge>
                      <Badge variant={STATUS_VARIANTS[user.status] || 'gray'} size="lg">{user.status}</Badge>
                    </div>
                    <p className="text-blue-100 text-sm">{user.email}</p>
                    <div className="flex gap-4 mt-2 text-blue-200 text-xs flex-wrap">
                      {user.createdAt && <span className="flex items-center gap-1">{I.cal} Inscrit le {fmt(user.createdAt)}</span>}
                      {user.location  && <span className="flex items-center gap-1">{I.pin} {user.location}</span>}
                      {user.phone     && <span className="flex items-center gap-1">{I.phone} {user.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setIsPermOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium border border-white/20 transition-all">
                    {I.lock} Autorisations
                  </button>
                  <button onClick={() => setIsEditOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all shadow-lg">
                    {I.edit} Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>

          {alert.show && (
            <Alert type={alert.type} message={alert.message}
              onClose={() => setAlert({ show: false, type: '', message: '' })} />
          )}

          {/* ── INFO GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Informations personnelles ── */}
            <div className="glass rounded-xl overflow-hidden anim">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Informations personnelles</h2>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Nom complet',       value: user.name },
                  { label: 'Email',             value: user.email, mono: true },
                  { label: 'Téléphone',         value: user.phone || '-' },
                  { label: 'Localisation',      value: user.location || '-' },
                  { label: 'Date d\'inscription', value: fmt(user.createdAt) },
                  // ✅ FIX 8 : lastLoginAt (pas lastLogin)
                  { label: 'Dernière connexion', value: fmt(user.lastLoginAt) },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    <p className={`text-sm text-gray-900 dark:text-white font-medium ${item.mono ? 'font-mono text-xs' : ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Informations professionnelles ── */}
            <div className="glass rounded-xl overflow-hidden anim" style={{ animationDelay: '.05s' }}>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Informations professionnelles</h2>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Entreprise',  value: user.company || '-' },
                  { label: 'Département', value: user.department || '-' },
                  // ✅ FIX 9 : roleLabel au lieu de role brut
                  { label: 'Rôle',       value: roleLabel },
                  { label: 'Statut',     value: user.status },
                  { label: 'Expertise',  value: user.expertise?.join(', ') || '-' },
                  // ✅ FIX 10 : Données startup depuis startupProfile
                  ...(startupProfile.startupName
                    ? [{ label: 'Startup',      value: startupProfile.startupName }] : []),
                  ...(startupProfile.sector
                    ? [{ label: 'Secteur',      value: startupProfile.sector }] : []),
                  ...(startupProfile.stage
                    ? [{ label: 'Stade',        value: startupProfile.stage }] : []),
                  ...(startupProfile.website
                    ? [{ label: 'Site web',     value: startupProfile.website }] : []),
                  ...(startupProfile.teamSize
                    ? [{ label: 'Taille équipe', value: String(startupProfile.teamSize) }] : []),
                  ...(startupProfile.foundedYear
                    ? [{ label: 'Fondée en',    value: String(startupProfile.foundedYear) }] : []),
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium break-words">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Actions rapides ── */}
            <div className="glass rounded-xl overflow-hidden anim" style={{ animationDelay: '.1s' }}>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Actions rapides</h2>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs text-gray-400 mb-2">Changer le statut</p>
                {['active', 'inactive', 'suspended', 'pending'].map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
                      user.status === s
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}>
                    {user.status === s && <span className="mr-1.5">✓</span>}
                    {{ active: 'Actif', inactive: 'Inactif', suspended: 'Suspendu', pending: 'En attente' }[s]}
                  </button>
                ))}

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Autorisations</span>
                    <span className="font-semibold text-primary-600">{user.permissions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sessions</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{user.sessionsCount || 0}</span>
                  </div>
                  {/* ✅ FIX 11 : Flags spéciaux depuis la BD */}
                  {user.isEmailVerified !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Email vérifié</span>
                      <span className={`font-semibold ${user.isEmailVerified ? 'text-emerald-600' : 'text-red-500'}`}>
                        {user.isEmailVerified ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  )}
                  {user.isApproved !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Compte approuvé</span>
                      <span className={`font-semibold ${user.isApproved ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {user.isApproved ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── STARTUP PROFILE (si rôle startup) ── */}
          {isStartup && startupProfile.description && (
            <div className="glass rounded-xl overflow-hidden anim" style={{ animationDelay: '.12s' }}>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <span className="text-primary-500">{I.rocket}</span>
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Profil Startup</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {startupProfile.description}
                </p>
                {startupProfile.website && (
                  <a href={startupProfile.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-primary-600 hover:underline font-medium">
                    🌐 {startupProfile.website}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── PERMISSIONS ── */}
          <div className="glass rounded-xl overflow-hidden anim" style={{ animationDelay: '.15s' }}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Autorisations</h2>
                <p className="text-xs text-gray-400 mt-0.5">{user.permissions?.length || 0} autorisation(s) active(s)</p>
              </div>
              <button onClick={() => setIsPermOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                {I.edit} Modifier
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {ALL_PERMISSIONS.map(perm => {
                  const active = user.permissions?.includes(perm.id);
                  return (
                    <div key={perm.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-gray-800'
                      }`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        {active
                          ? <span className="text-white">{I.check}</span>
                          : <span className="text-gray-400 dark:text-gray-500">{I.x}</span>}
                      </span>
                      {perm.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── ACTIVITY ── */}
          <div className="glass rounded-xl overflow-hidden anim" style={{ animationDelay: '.2s' }}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Historique d'activité</h2>
              <p className="text-xs text-gray-400 mt-0.5">Actions récentes du compte</p>
            </div>
            <div className="p-5">
              {!activity || activity.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Aucune activité enregistrée</div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800"/>
                  <div className="space-y-5">
                    {activity.map(a => (
                      <div key={a.id} className="relative flex gap-4">
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                          a.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                          a.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        }`}>
                          {a.type === 'success' ? '✓' : a.type === 'warning' ? '!' : 'ℹ'}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{a.action}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400">{fmt(a.date, true)}</p>
                            {a.ip && <p className="text-xs text-gray-300 dark:text-gray-600">• IP : {a.ip}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MODALS ── */}
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}
          title={`Modifier — ${user.name}`} size="lg">
          <EditUserForm
            user={user}
            onSave={handleUpdate}
            onCancel={() => setIsEditOpen(false)}
            saving={saving === 'edit'}
          />
        </Modal>

        <Modal isOpen={isPermOpen} onClose={() => setIsPermOpen(false)}
          title={`Autorisations — ${user.name}`} size="lg">
          <PermissionsForm
            initial={user.permissions || []}
            onSave={handlePerms}
            onCancel={() => setIsPermOpen(false)}
            saving={saving === 'perm'}
          />
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ════════════════════════════════════════════════════════════════
// EditUserForm
// ════════════════════════════════════════════════════════════════
function EditUserForm({ user, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name:       user.name       || '',
    email:      user.email      || '',
    role:       user.role       || 'mentor',
    status:     user.status     || 'active',
    company:    user.company    || '',
    department: user.department || '',
    location:   user.location   || 'Tunis',
    phone:      user.phone      || '',
  });
  const [errors, setErrors] = useState({});

  // ✅ Seuls les rôles internes sont modifiables par l'admin
  const EDITABLE_ROLES = {
    admin:    'Administrateur',
    mentor:   'Mentor',
    jury:     'Jury',
    investor: 'Investisseur',
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Le nom est requis';
    if (!form.email.trim()) e.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  const fld = (field) =>
    `w-full px-3 py-2.5 text-sm border ${errors[field] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all`;
  const lbl = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1';

  // ✅ Si le rôle actuel est startup/applicant/founder, on l'affiche en lecture seule
  const isStartupRole = ['startup', 'founder', 'applicant'].includes(user.role);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Nom complet *</label>
          <input className={fld('name')} value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className={lbl}>Email *</label>
          <input type="email" className={fld('email')} value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className={lbl}>Rôle *</label>
          {isStartupRole ? (
            // Rôle startup en lecture seule (géré par le processus d'inscription)
            <div className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white bg-gray-50">
              {ROLE_LABELS[user.role] || user.role}
              <p className="text-xs text-gray-400 mt-1">Le rôle des startups est géré par le processus d'inscription.</p>
            </div>
          ) : (
            <select className={fld('role')} value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {Object.entries(EDITABLE_ROLES).map(([v, l]) =>
                <option key={v} value={v}>{l}</option>
              )}
            </select>
          )}
        </div>
        <div>
          <label className={lbl}>Statut *</label>
          <select className={fld('status')} value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            {[
              { v: 'active',    l: 'Actif'      },
              { v: 'inactive',  l: 'Inactif'    },
              { v: 'pending',   l: 'En attente' },
              { v: 'suspended', l: 'Suspendu'   },
            ].map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Entreprise</label>
          <input className={fld('company')} value={form.company}
            onChange={e => setForm(p => ({ ...p, company: e.target.value }))}/>
        </div>
        <div>
          <label className={lbl}>Département</label>
          <input className={fld('department')} value={form.department}
            onChange={e => setForm(p => ({ ...p, department: e.target.value }))}/>
        </div>
        <div>
          <label className={lbl}>Localisation</label>
          <select className={fld('location')} value={form.location}
            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
            {['Tunis','Sfax','Sousse','Monastir','Casablanca','Remote'].map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>
        </div>
        <div>
          <label className={lbl}>Téléphone</label>
          <input className={fld('phone')} value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+216 XX XXX XXX"/>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
          Annuler
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
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
        Basculez les autorisations. Les modifications remplacent les paramètres par défaut du rôle.
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
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300'
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