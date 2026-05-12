'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import { useJuryApi } from '@/app/hooks/useJuryApi';
import { confirmDelete, toastSuccess, toastError } from '@/app/hooks/useSwal';

// ─── Constantes ───────────────────────────────────────────────
const JURY_STATUS = { ACTIVE: 'active', INVITED: 'invited', INACTIVE: 'inactive' };

const DOMAINS = [
  'FinTech', 'HealthTech', 'AgriTech', 'EdTech',
  'CleanTech', 'E-Commerce', 'AI/ML', 'Cybersécurité',
  'Logistique', 'RH/Future of Work',
];

// ─── Icons ────────────────────────────────────────────────────
const Icons = {
  search:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  plus:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>,
  edit:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  delete:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  mail:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  history:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  star:     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  filter:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>,
  send:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
  layers:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l10 6-10 6L2 8l10-6zM2 16l10 6 10-6M2 12l10 6 10-6"/></svg>,
  check:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 6L9 17l-5-5"/></svg>,
  x:        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  link:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M11 12h2"/></svg>,
  refresh:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
};

// ════════════════════════════════════════════════════════════════
// PROGRAMME ASSIGN MODAL
// ════════════════════════════════════════════════════════════════
function ProgrammeAssignModal({ isOpen, onClose, jury, allProgrammes, onSave, saving }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (jury) {
      // Réconcilier avec les IDs ou les noms stockés
      const ids = jury.assignedProgrammeIds || [];
      const names = jury.assignedProgrammes || [];
      const initial = allProgrammes
        .filter(p => ids.includes(p.id) || ids.includes(p._id?.toString()) || names.includes(p.titre))
        .map(p => p.id || p._id?.toString());
      setSelected(initial);
    }
  }, [jury, allProgrammes]);

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const statusColors = {
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    closed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  const statusLabels = { published: 'Publié', draft: 'Brouillon', scheduled: 'Planifié', closed: 'Clôturé' };

  if (!isOpen || !jury) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assigner des programmes — ${jury.name}`} size="lg">
      <div className="space-y-4">
        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 flex items-start gap-2 text-sm text-primary-700 dark:text-primary-300">
          <span className="flex-shrink-0 mt-0.5">{Icons.link}</span>
          <span>Sélectionnez les programmes pour <strong>{jury.name}</strong>.</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="text-primary-600 font-bold">{selected.length}</span> programme(s) sélectionné(s)
          </p>
          {selected.length > 0 && (
            <button onClick={() => setSelected([])} className="text-xs text-gray-500 underline">
              Tout désélectionner
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {allProgrammes.map(prog => {
            const progId = prog.id || prog._id?.toString();
            const isSel = selected.includes(progId);
            return (
              <div key={progId} onClick={() => toggle(progId)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isSel ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 bg-gray-50 dark:bg-gray-800/50'}`}>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 flex-shrink-0 ${isSel ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 bg-white dark:bg-gray-900'}`}>
                  {isSel && <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: prog.color || '#006d94' }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{prog.titre}</p>
                  <p className="text-xs text-gray-500">{prog.sector}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[prog.status] || ''}`}>
                  {statusLabels[prog.status] || prog.status}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={() => onSave(selected)} disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
            {saving ? 'Enregistrement...' : <>{Icons.check} Enregistrer</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function AdminJuryPage() {
  const { user: currentUser } = useSelector(state => state.auth);
  const juryApi = useJuryApi();

  const [mounted, setMounted]   = useState(false);
  const [time, setTime]         = useState(new Date());
  const [jury, setJury]         = useState([]);
  const [allProgrammes, setAllProgrammes] = useState([]);
  const [stats, setStats]       = useState({ total:0, active:0, invited:0, assigned:0, totalEvals:0, avgScore:'—' });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const [searchTerm, setSearchTerm]     = useState('');
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProg, setFilterProg]     = useState('all');
  const [showFilters, setShowFilters]   = useState(false);

  const [selectedJury, setSelectedJury]   = useState(null);
  const [isEditOpen, setIsEditOpen]       = useState(false);
  const [isAddOpen, setIsAddOpen]         = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen]   = useState(false);
  const [isAssignOpen, setIsAssignOpen]   = useState(false);

  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const [newJury, setNewJury] = useState({
    name: '', post: '', company: '', email: '', linkedin: '',
    expertise: [], status: JURY_STATUS.INVITED, assignedProgrammes: [], bio: '',
  });

  // ── Charger données ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [juryRes, statsRes] = await Promise.all([
        juryApi.fetchAll(),
        juryApi.fetchStats(),
      ]);
      setJury(juryRes.jury || []);
      setStats(statsRes || {});

      // Charger programmes
      try {
        const saved = localStorage.getItem('admin_programmes');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) setAllProgrammes(list);
        }
      } catch (_) {}
    } catch (err) {
      showNotification('error', 'Erreur de chargement des jurys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    loadData();
    return () => clearInterval(timer);
  }, [loadData]);

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
  };

  // ── CRUD ──────────────────────────────────────────────────────
  const handleDelete = async (j) => {
    const { isConfirmed } = await confirmDelete(j.name);
    if (!isConfirmed) return;
    try {
      await juryApi.remove(j._id?.toString() || j.id);
      setJury(prev => prev.filter(x =>
        (x._id?.toString() || x.id) !== (j._id?.toString() || j.id)
      ));
      toastSuccess(`${j.name} supprimé(e).`);
    } catch {
      toastError('Erreur lors de la suppression.');
    }
  };

  const handleSaveEdit = async (updated) => {
    setSaving(true);
    try {
      const jId = updated._id?.toString() || updated.id;
      const result = await juryApi.update(jId, updated);
      setJury(prev => prev.map(j => (j._id?.toString() || j.id) === jId ? { ...j, ...result } : j));
      setIsEditOpen(false);
      showNotification('success', 'Profil jury mis à jour.');
    } catch {
      showNotification('error', 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleAddJury = async () => {
    setSaving(true);
    try {
      const created = await juryApi.create(newJury);
      setJury(prev => [created, ...prev]);
      setIsAddOpen(false);
      setNewJury({ name:'', post:'', company:'', email:'', linkedin:'', expertise:[], status: JURY_STATUS.INVITED, assignedProgrammes:[], bio:'' });
      showNotification('success', `${created.name} ajouté(e) comme jury.`);
      loadData(); // recharger stats
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de la création';
      showNotification('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async (email, message) => {
    try {
      const jId = selectedJury?._id?.toString() || selectedJury?.id || 'new';
      await juryApi.sendInvite(jId, email, message);
      showNotification('success', `Invitation envoyée à ${email}`);
      setIsInviteOpen(false);
    } catch {
      showNotification('error', 'Erreur envoi invitation');
    }
  };

  // ── Assignation programmes ────────────────────────────────────
  const handleSaveProgrammeAssign = async (selectedIds) => {
    setSaving(true);
    try {
      const jId = selectedJury._id?.toString() || selectedJury.id;
      const selectedProgs = allProgrammes.filter(p => selectedIds.includes(p.id || p._id?.toString()));
      const progNames = selectedProgs.map(p => p.titre);

      await juryApi.assignProgrammes(jId, selectedIds, progNames);
      setJury(prev => prev.map(j =>
        (j._id?.toString() || j.id) === jId
          ? { ...j, assignedProgrammes: progNames, assignedProgrammeIds: selectedIds }
          : j
      ));
      setIsAssignOpen(false);
      showNotification('success', `${selectedJury.name} assigné(e) à ${selectedIds.length} programme(s).`);
    } catch {
      showNotification('error', 'Erreur lors de l\'assignation');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProgramme = async (j, progName, e) => {
    e.stopPropagation();
    try {
      const jId = j._id?.toString() || j.id;
      const newNames = (j.assignedProgrammes || []).filter(n => n !== progName);
      await juryApi.assignProgrammes(jId, j.assignedProgrammeIds?.filter(id => {
        const prog = allProgrammes.find(p => p.titre === progName);
        return id !== (prog?.id || prog?._id?.toString());
      }) || [], newNames);
      setJury(prev => prev.map(x =>
        (x._id?.toString() || x.id) === jId ? { ...x, assignedProgrammes: newNames } : x
      ));
      showNotification('success', 'Programme retiré.');
    } catch {
      showNotification('error', 'Erreur');
    }
  };

  // ── Filtres ───────────────────────────────────────────────────
  const filtered = jury.filter(j => {
    const name = `${j.name} ${j.company || ''} ${j.post || ''}`.toLowerCase();
    const matchSearch  = name.includes(searchTerm.toLowerCase()) || (j.email || '').includes(searchTerm.toLowerCase());
    const matchDomain  = filterDomain === 'all' || (j.expertise || []).includes(filterDomain);
    const matchStatus  = filterStatus === 'all' || j.status === filterStatus;
    const matchProg    = filterProg === 'all' || (j.assignedProgrammes || []).some(p => p.includes(filterProg)) || (filterProg === 'none' && !(j.assignedProgrammes?.length));
    return matchSearch && matchDomain && matchStatus && matchProg;
  });

  // ── Helpers ───────────────────────────────────────────────────
  const getStatusColor  = (s) => ({ active: 'linear-gradient(135deg,#0f6e56,#1D9E75)', invited: 'linear-gradient(135deg,#0088ba,#00a3e0)', inactive: 'linear-gradient(135deg,#5F5E5A,#888780)' }[s] || '#888780');
  const getStatusLabel  = (s) => ({ active: 'Actif', invited: 'Invité', inactive: 'Inactif' }[s] || s);
  const getStatusVariant = (s) => ({ active: 'success', invited: 'primary', inactive: 'gray' }[s] || 'gray');
  const getInitials     = (j) => (j.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const getAvgScore     = (evals) => !evals?.length ? null : (evals.reduce((a, e) => a + (e.score||0), 0) / evals.length).toFixed(1);

  const getProgrammeByName = (name) =>
    allProgrammes.find(p => p.titre === name) || { titre: name, color: '#006d94', bg: '#E6F1FB', sector: '' };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
          @keyframes slideInUp { from{opacity:0;transform:translateY(50px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          @keyframes holographic-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          .animate-slide-in-up { animation:slideInUp 0.6s ease-out forwards }
          .animate-scale-in { animation:scaleIn 0.5s ease-out forwards }
          .glass-card { background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border:1px solid rgba(0,0,0,0.05) }
          :global(.dark) .glass-card { background:#1e293b;border:1px solid #334155 }
          .dark-glass { background:linear-gradient(135deg,rgba(0,82,110,0.9),rgba(0,109,148,0.9));backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1) }
          .holographic { background:linear-gradient(135deg,rgba(0,186,255,0.1) 0%,rgba(255,191,0,0.1) 50%,rgba(0,186,255,0.1) 100%);background-size:200% 200%;animation:holographic-shift 3s ease infinite }
          .stat-card { position:relative;overflow:hidden;transition:all 0.3s ease }
          .stat-card:hover { transform:translateY(-4px);box-shadow:0 20px 25px -5px rgba(0,82,110,0.2) }
          .jury-card { transition:all 0.3s ease }
          .jury-card:hover { transform:translateY(-4px);box-shadow:0 20px 25px -5px rgba(0,82,110,0.2) }
          .particle { position:absolute;width:4px;height:4px;background:rgba(255,255,255,0.3);border-radius:50%;animation:float 6s ease-in-out infinite }
        `}</style>

        <div className="space-y-8 min-h-screen pb-10">

          {/* ── Header ── */}
          <div className="relative overflow-hidden rounded-3xl p-10 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="particle" style={{ top:'10%', left:'15%' }}></div>
            <div className="particle" style={{ top:'60%', left:'80%', animationDelay:'1s' }}></div>
            <div className="absolute inset-0 holographic opacity-30"></div>
            <div className="relative flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">Gestion des Jurys</h1>
                <p className="text-blue-200 text-lg">Invitez, gérez et assignez les experts évaluateurs</p>
                <div className="flex items-center gap-6 text-blue-100 mt-4 flex-wrap text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Backend connecté</span>
                  </div>
                  <span className="font-mono">{mounted && time.toLocaleTimeString('fr-FR')}</span>
                </div>
              </div>
              <div className="dark-glass rounded-2xl p-5 min-w-[260px]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl">
                    {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                  </div>
                  <div>
                    <p className="font-bold text-white">{currentUser?.name || 'Admin'}</p>
                    <p className="text-blue-200 text-sm font-mono">SYS.ADMIN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {[
              { label:'Total Jurys',   value:stats.total,      color:'text-primary-600 dark:text-primary-400',  bg:'bg-primary-100 dark:bg-primary-900/30' },
              { label:'Actifs',        value:stats.active,     color:'text-green-600 dark:text-green-400',      bg:'bg-green-100 dark:bg-green-900/30' },
              { label:'Invités',       value:stats.invited,    color:'text-blue-600 dark:text-blue-400',        bg:'bg-blue-100 dark:bg-blue-900/30' },
              { label:'Assignés',      value:stats.assigned,   color:'text-purple-600 dark:text-purple-400',    bg:'bg-purple-100 dark:bg-purple-900/30' },
              { label:'Évaluations',   value:stats.totalEvals, color:'text-violet-600 dark:text-violet-400',    bg:'bg-violet-100 dark:bg-violet-900/30' },
              { label:'Score Moyen',   value:stats.avgScore || '—', color:'text-amber-600 dark:text-amber-400', bg:'bg-amber-100 dark:bg-amber-900/30' },
            ].map((s, i) => (
              <div key={i} className="stat-card glass-card rounded-2xl p-5 animate-scale-in dark:!bg-[#1e293b]">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <span className={`font-bold text-sm ${s.color}`}>{i === 5 ? '★' : '#'}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Alert */}
          {alert.show && (
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ show:false, type:'', message:'' })} />
          )}

          {/* ── Action bar ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${showFilters ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 text-primary-700' : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {Icons.filter} Filtres
              </button>
              <button onClick={() => { setSelectedJury(null); setIsInviteOpen(true); }}
                className="px-4 py-2.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2">
                {Icons.send} Invitation
              </button>
              <button onClick={loadData} className="px-4 py-2.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50">
                {Icons.refresh} Actualiser
              </button>
            </div>
            <button onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg flex items-center gap-2">
              {Icons.plus} Ajouter un jury
            </button>
          </div>

          {/* ── Search + Filters ── */}
          <div className="glass-card rounded-2xl p-5 dark:!bg-[#1e293b]">
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
              <input type="text" placeholder="Rechercher par nom, email, société..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </div>
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                {[
                  {
                    label:'Domaine', value:filterDomain, onChange: e => setFilterDomain(e.target.value),
                    options: [<option key="all" value="all">Tous les domaines</option>, ...DOMAINS.map(d => <option key={d} value={d}>{d}</option>)],
                  },
                  {
                    label:'Statut', value:filterStatus, onChange: e => setFilterStatus(e.target.value),
                    options: [
                      <option key="all" value="all">Tous les statuts</option>,
                      <option key="active" value="active">Actif</option>,
                      <option key="invited" value="invited">Invité</option>,
                      <option key="inactive" value="inactive">Inactif</option>,
                    ],
                  },
                  {
                    label:'Programme', value:filterProg, onChange: e => setFilterProg(e.target.value),
                    options: [
                      <option key="all" value="all">Tous les programmes</option>,
                      <option key="none" value="none">Non assigné</option>,
                      ...allProgrammes.map(p => <option key={p.id||p._id} value={p.titre}>{p.titre}</option>),
                    ],
                  },
                ].map(({ label, value, onChange, options }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5">{label}</label>
                    <select value={value} onChange={onChange}
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none">
                      {options}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
            {filtered.length} jury(s) trouvé(s)
          </p>

          {/* ── Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 animate-pulse dark:!bg-[#1e293b]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="flex-1"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></div>
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full glass-card rounded-2xl p-12 text-center dark:!bg-[#1e293b]">
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucun jury trouvé</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ajoutez un jury ou modifiez vos filtres.</p>
              </div>
            ) : filtered.map((j, idx) => {
              const avg      = getAvgScore(j.evaluations);
              const progNames = j.assignedProgrammes || [];
              const jId      = j._id?.toString() || j.id;
              return (
                <div key={jId}
                  className="jury-card glass-card rounded-2xl overflow-hidden animate-scale-in dark:!bg-[#1e293b] group cursor-pointer"
                  style={{ animationDelay:`${idx * 0.05}s` }}
                  onClick={() => { setSelectedJury(j); setIsEditOpen(true); }}>
                  <div className="h-1.5 w-full" style={{ background: getStatusColor(j.status) }}></div>
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                          style={{ background: getStatusColor(j.status) }}>
                          {getInitials(j)}
                        </div>
                        {j.status === 'active' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 bg-green-400"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{j.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">{j.post} {j.company ? `— ${j.company}` : ''}</p>
                        <Badge variant={getStatusVariant(j.status)} size="sm">{getStatusLabel(j.status)}</Badge>
                      </div>
                      {avg && (
                        <div className="flex items-center gap-1 text-amber-500">
                          {Icons.star}<span className="text-sm font-bold">{avg}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {Icons.mail}<span className="truncate">{j.email}</span>
                    </div>

                    {/* Expertise */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(j.expertise || []).slice(0, 3).map(d => (
                        <span key={d} className="px-2 py-0.5 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full border border-primary-100 dark:border-primary-800">{d}</span>
                      ))}
                      {(j.expertise || []).length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">+{j.expertise.length - 3}</span>
                      )}
                    </div>

                    {/* Programmes */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Programmes</span>
                        <button onClick={e => { e.stopPropagation(); setSelectedJury(j); setIsAssignOpen(true); }}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                          {Icons.link} Gérer
                        </button>
                      </div>
                      {progNames.length === 0 ? (
                        <button onClick={e => { e.stopPropagation(); setSelectedJury(j); setIsAssignOpen(true); }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-400 hover:text-primary-600 flex items-center gap-1.5">
                          {Icons.plus} Assigner à un programme
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {progNames.slice(0, 2).map(name => {
                            const prog = getProgrammeByName(name);
                            return (
                              <div key={name} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                style={{ borderColor: (prog.color || '#006d94') + '40', background: prog.bg || '#E6F1FB', color: prog.color || '#006d94' }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: prog.color || '#006d94' }}></span>
                                <span className="truncate max-w-[90px]">{name.replace('Programme ', '')}</span>
                                <button onClick={e => handleRemoveProgramme(j, name, e)} className="ml-0.5 opacity-60 hover:opacity-100">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              </div>
                            );
                          })}
                          {progNames.length > 2 && (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500">+{progNames.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <p className="text-xs text-gray-400">{j.evaluationsCount || j.evaluations?.length || 0} évaluation(s)</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); setSelectedJury(j); setIsHistoryOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">{Icons.history}</button>
                        <button onClick={e => { e.stopPropagation(); setSelectedJury(j); setIsAssignOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">{Icons.layers}</button>
                        <button onClick={e => { e.stopPropagation(); setSelectedJury(j); setIsEditOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">{Icons.edit}</button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(j); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">{Icons.delete}</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Modals ── */}
        {selectedJury && (
          <JuryEditModal
            isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}
            jury={selectedJury} allProgrammes={allProgrammes}
            onSave={handleSaveEdit} saving={saving}
            onOpenAssign={() => { setIsEditOpen(false); setIsAssignOpen(true); }}
          />
        )}

        <JuryAddModal
          isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}
          newJury={newJury} setNewJury={setNewJury}
          onSave={handleAddJury} saving={saving} allProgrammes={allProgrammes}
        />

        {selectedJury && (
          <JuryHistoryModal
            isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}
            jury={selectedJury}
          />
        )}

        <InviteModal
          isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)}
          onSend={handleSendInvite}
        />

        {selectedJury && (
          <ProgrammeAssignModal
            isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)}
            jury={selectedJury} allProgrammes={allProgrammes}
            onSave={handleSaveProgrammeAssign} saving={saving}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────
function JuryEditModal({ isOpen, onClose, jury, allProgrammes, onSave, saving, onOpenAssign }) {
  const [form, setForm] = useState({ ...jury });
  useEffect(() => { if (jury) setForm({ ...jury }); }, [jury]);

  const toggleDomain = (d) => setForm(prev => ({
    ...prev,
    expertise: prev.expertise?.includes(d) ? prev.expertise.filter(x => x !== d) : [...(prev.expertise||[]), d],
  }));

  const inp = "w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
  const lbl = "block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Modifier : ${jury.name}`} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Nom complet</label><input value={form.name||''} onChange={e => setForm({...form, name:e.target.value})} className={inp} /></div>
          <div><label className={lbl}>Email</label><input type="email" value={form.email||''} onChange={e => setForm({...form, email:e.target.value})} className={inp} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Poste</label><input value={form.post||''} onChange={e => setForm({...form, post:e.target.value})} className={inp} /></div>
          <div><label className={lbl}>Société</label><input value={form.company||''} onChange={e => setForm({...form, company:e.target.value})} className={inp} /></div>
        </div>
        <div>
          <label className={lbl}>LinkedIn</label>
          <input value={form.linkedin||''} onChange={e => setForm({...form, linkedin:e.target.value})} className={inp} placeholder="linkedin.com/in/..." />
        </div>
        <div>
          <label className={lbl}>Statut</label>
          <select value={form.status||'invited'} onChange={e => setForm({...form, status:e.target.value})} className={inp}>
            <option value="active">Actif</option>
            <option value="invited">Invité</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Domaines d'expertise</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {DOMAINS.map(d => (
              <button key={d} type="button" onClick={() => toggleDomain(d)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${(form.expertise||[]).includes(d) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 hover:border-primary-400'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={lbl + ' mb-0'}>Programmes assignés</label>
            <button type="button" onClick={onOpenAssign} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>Gérer
            </button>
          </div>
          {!(form.assignedProgrammes?.length) ? (
            <p className="text-xs text-gray-400 italic">Aucun programme assigné.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(form.assignedProgrammes||[]).map(name => (
                <span key={name} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  {name.replace('Programme ', '')}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50">Annuler</button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Modal ────────────────────────────────────────────────
function JuryAddModal({ isOpen, onClose, newJury, setNewJury, onSave, saving, allProgrammes }) {
  const toggleDomain = (d) => setNewJury(prev => ({
    ...prev, expertise: prev.expertise.includes(d) ? prev.expertise.filter(x => x !== d) : [...prev.expertise, d],
  }));

  const inp = "w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
  const lbl = "block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un jury" size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Nom complet *</label><input value={newJury.name} onChange={e => setNewJury({...newJury, name:e.target.value})} className={inp} placeholder="Prénom Nom" required /></div>
          <div><label className={lbl}>Email *</label><input type="email" value={newJury.email} onChange={e => setNewJury({...newJury, email:e.target.value})} className={inp} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Poste</label><input value={newJury.post} onChange={e => setNewJury({...newJury, post:e.target.value})} className={inp} placeholder="CEO, Partner..." /></div>
          <div><label className={lbl}>Société</label><input value={newJury.company} onChange={e => setNewJury({...newJury, company:e.target.value})} className={inp} /></div>
        </div>
        <div><label className={lbl}>LinkedIn</label><input value={newJury.linkedin} onChange={e => setNewJury({...newJury, linkedin:e.target.value})} className={inp} placeholder="linkedin.com/in/..." /></div>
        <div>
          <label className={lbl}>Domaines d'expertise</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {DOMAINS.map(d => (
              <button key={d} type="button" onClick={() => toggleDomain(d)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${newJury.expertise.includes(d) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 hover:border-primary-400'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
          Le jury sera créé avec le statut <strong>Invité</strong> dans MongoDB.
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50">Annuler</button>
          <button onClick={onSave} disabled={saving || !newJury.name || !newJury.email}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg disabled:opacity-50">
            {saving ? 'Création...' : 'Ajouter le jury'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── History Modal ─────────────────────────────────────────────
function JuryHistoryModal({ isOpen, onClose, jury }) {
  const evals = jury.evaluations || [];
  const avg = evals.length ? (evals.reduce((a, e) => a + (e.score||0), 0) / evals.length).toFixed(1) : null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Évaluations : ${jury.name}`} size="lg">
      <div className="space-y-4">
        {avg && (
          <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{avg}</div>
            <div><p className="text-sm font-medium text-gray-900 dark:text-white">Score moyen</p><p className="text-xs text-gray-500">{evals.length} évaluation(s)</p></div>
          </div>
        )}
        {evals.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Aucune évaluation enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {evals.map((ev, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ev.candidature || ev.startupName || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{ev.programme || ''} · {ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : ''}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <svg fill="currentColor" viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{ev.score}</span>
                  <span className="text-xs text-gray-400">/5</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl">Fermer</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Invite Modal ──────────────────────────────────────────────
function InviteModal({ isOpen, onClose, onSend }) {
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState(`Bonjour,\n\nNous vous invitons à rejoindre la plateforme MEDIANET Incubator en tant que jury évaluateur.\n\nCordialement,\nL'équipe MEDIANET`);
  const inp = "w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
  const lbl = "block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-1.5";
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Envoyer une invitation jury" size="lg">
      <div className="space-y-4">
        <div><label className={lbl}>Email *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="expert@example.com" className={inp} /></div>
        <div><label className={lbl}>Message</label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className={inp + ' resize-none'} /></div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl">Annuler</button>
          <button onClick={() => onSend(email, message)} disabled={!email}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
            Envoyer l'invitation
          </button>
        </div>
      </div>
    </Modal>
  );
}