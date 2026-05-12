'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Modal from '@/app/components/common/Modal';
import { useSelector } from 'react-redux';
import { useInvestors } from '@/app/hooks/useInvestors';

// ─── Icônes ───────────────────────────────────────────────────────────────────
const Icon = {
  search:      (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>),
  plus:        (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>),
  profile:     (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
  lightning:   (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
  trash:       (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>),
  check:       (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>),
  location:    (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  link:        (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>),
  mail:        (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>),
  phone:       (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>),
  wallet:      (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M3 6h18M3 14h10m-7 4h4" /></svg>),
  clock:       (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  checkCircle: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  dollar:      (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  users:       (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
  warning:     (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>),
  refresh:     (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>),
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const TYPES_INVESTISSEUR = ['VC', 'Business Angel', 'Accélérateur', 'Fonds Public', 'Corporate VC', 'Family Office'];
const TOUS_SECTEURS      = ['FinTech', 'HealthTech', 'AgriTech', 'EdTech', 'CleanTech', 'SaaS', 'E-commerce', 'Mobilité', 'BioTech', 'Logistique', 'Industrie'];
const TOUS_STADES        = ['Pré-amorçage', 'Amorçage', 'Série A', 'Série B'];

const STYLE_TYPE = {
  'VC':              'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  'Business Angel':  'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'Accélérateur':    'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  'Fonds Public':    'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Corporate VC':    'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Family Office':   'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

// ─── Formatage TND ─────────────────────────────────────────────────────────────
const tnd = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M TND`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} K TND`;
  return `${n} TND`;
};

// ─── Config score ──────────────────────────────────────────────────────────────
const configScore = (s) => s >= 85
  ? { barre: 'bg-emerald-500', texte: 'text-emerald-600 dark:text-emerald-400' }
  : s >= 70
  ? { barre: 'bg-amber-500',   texte: 'text-amber-600 dark:text-amber-400' }
  : { barre: 'bg-red-500',     texte: 'text-red-600 dark:text-red-400' };

// ─── Carte statistique ─────────────────────────────────────────────────────────
function CarteStatistique({ label, valeur, icone, accent }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${accent}`}>
      <div className="mb-3">
        <div className="p-2 w-fit rounded-xl bg-white/60 dark:bg-black/30 backdrop-blur-sm">{icone}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{valeur}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function PageInvestisseursAdmin() {
  const { user } = useSelector(s => s.auth);
  const [mounted, setMounted] = useState(false);
  const [heure, setHeure]     = useState(new Date());
  const [toast, setToast]     = useState(null);

  // Filtres
  const [recherche, setRecherche] = useState('');
  const [fType,     setFType]     = useState('tous');
  const [fSecteur,  setFSecteur]  = useState('tous');
  const [fStade,    setFStade]    = useState('tous');

  // Modales
  const [detailOuvert,  setDetailOuvert]  = useState(false);
  const [matchOuvert,   setMatchOuvert]   = useState(false);
  const [ajoutOuvert,   setAjoutOuvert]   = useState(false);
  const [selectionne,   setSelectionne]   = useState(null);

  const {
    investors,
    stats,
    loading,
    error,
    refetch,
    ajouterInvestisseur,
    supprimerInvestisseur,
    validerMatch,
    rejeterMatch,
  } = useInvestors({ type: fType, secteur: fSecteur, stade: fStade, recherche });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setHeure(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const afficherToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  const handleValiderMatch = async (investorId, matchId) => {
    try {
      const mis = await validerMatch(investorId, matchId);
      if (selectionne?._id === investorId) setSelectionne(mis);
      afficherToast('success', 'Match validé — le fondateur a été notifié');
    } catch (e) {
      afficherToast('erreur', e.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleRejeterMatch = async (investorId, matchId) => {
    try {
      const mis = await rejeterMatch(investorId, matchId);
      if (selectionne?._id === investorId) setSelectionne(mis);
      afficherToast('avertissement', 'Match rejeté');
    } catch (e) {
      afficherToast('erreur', e.response?.data?.message || 'Erreur lors du rejet');
    }
  };

  const handleAjouter = async (data) => {
    try {
      await ajouterInvestisseur(data);
      setAjoutOuvert(false);
      afficherToast('success', `${data.nom} ajouté au catalogue`);
    } catch (e) {
      afficherToast('erreur', e.response?.data?.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleSupprimer = async (inv) => {
    if (!confirm(`Retirer "${inv.nom}" du catalogue ?`)) return;
    try {
      await supprimerInvestisseur(inv._id);
      afficherToast('success', `${inv.nom} retiré du catalogue`);
    } catch (e) {
      afficherToast('erreur', e.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
          * { font-family: 'Inter', sans-serif; }
          .mono { font-family: 'JetBrains Mono', monospace; }

          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
          @keyframes slideInHaut { from{opacity:0;transform:translateY(50px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideInDroite { from{opacity:0;transform:translateX(100px)} to{opacity:1;transform:translateX(0)} }
          @keyframes fonduHaut  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes toastEntree { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
          @keyframes holographique { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

          .anim-slide-haut    { animation:slideInHaut 0.6s ease-out forwards; }
          .anim-slide-droite  { animation:slideInDroite 0.6s ease-out forwards; }
          .fondu-haut         { animation:fonduHaut 0.5s ease-out both; }
          .toast-entree       { animation:toastEntree 0.35s cubic-bezier(.22,1,.36,1) both; }

          .carte-verre { background:rgba(255,255,255,0.95); backdrop-filter:blur(10px); border:1px solid rgba(0,0,0,0.05); }
          :global(.dark) .carte-verre { background:#1e293b; border:1px solid #334155; box-shadow:0 4px 20px rgba(0,0,0,0.3); }
          .verre-sombre { background:linear-gradient(135deg,rgba(0,82,110,0.95),rgba(0,109,148,0.95)); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.15); }
          .holographique { background:linear-gradient(135deg,rgba(0,186,255,0.1) 0%,rgba(255,191,0,0.1) 50%,rgba(0,186,255,0.1) 100%); background-size:200% 200%; animation:holographique 3s ease infinite; }
          .particule { position:absolute;width:4px;height:4px;background:rgba(255,255,255,0.4);border-radius:50%;animation:float 6s ease-in-out infinite; }
          .carte-hover { transition:transform 0.25s ease,box-shadow 0.25s ease; }
          .carte-hover:hover { transform:translateY(-3px); }

          :global(.dark) input,:global(.dark) select,:global(.dark) textarea { background:#0f172a; border-color:#334155; color:#f1f5f9; }
          :global(.dark) input::placeholder { color:#475569; }
        `}</style>

        {/* Toast */}
        {toast && (
          <div className={`toast-entree fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'erreur' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'}`}>
            <span className="text-white">{toast.type === 'success' ? Icon.check : Icon.warning}</span>
            {toast.msg}
          </div>
        )}

        <div className="space-y-8">

          {/* ── En-tête héro ── */}
          <div className="relative overflow-hidden rounded-3xl p-10 anim-slide-haut"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="particule" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
            <div className="particule" style={{ top: '60%', left: '80%', animationDelay: '1s' }}></div>
            <div className="particule" style={{ top: '30%', left: '50%', animationDelay: '2s' }}></div>
            <div className="absolute inset-0 holographique opacity-20"></div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Catalogue des Investisseurs</h1>
                <p className="text-blue-100 text-lg font-medium">Gérez le catalogue et validez les correspondances générées par l'algorithme</p>
                <div className="flex items-center gap-6 text-blue-100/90 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Système en ligne</span>
                  </div>
                  <div className="w-px h-4 bg-blue-400/30"></div>
                  <div className="mono text-sm">{mounted && heure.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  <div className="w-px h-4 bg-blue-400/30"></div>
                  <div className="mono text-sm">{mounted && heure.toLocaleDateString('fr-TN', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
              <div className="verre-sombre rounded-2xl p-5 min-w-[280px] anim-slide-droite">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{user?.name || 'Administrateur'}</p>
                    <p className="text-blue-100 text-sm mono">ADMIN INVESTISSEMENT</p>
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

          {/* ── Statistiques ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 fondu-haut" style={{ animationDelay: '60ms' }}>
            <CarteStatistique label="Total investisseurs"    valeur={stats?.total ?? '—'}              icone={<span className="text-slate-600 dark:text-slate-300">{Icon.users}</span>}       accent="bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700" />
            <CarteStatistique label="Capital déployé"        valeur={tnd(stats?.totalInvesti)}         icone={<span className="text-emerald-600 dark:text-emerald-400">{Icon.dollar}</span>}   accent="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800" />
            <CarteStatistique label="Correspondances att."   valeur={stats?.matchesEnAttente ?? '—'}   icone={<span className="text-amber-600 dark:text-amber-400">{Icon.clock}</span>}        accent="bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800" />
            <CarteStatistique label="Correspondances val."   valeur={stats?.matchesValidés ?? '—'}     icone={<span className="text-[#006d94] dark:text-sky-400">{Icon.checkCircle}</span>}    accent="bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800" />
            <CarteStatistique label="Ticket moyen"           valeur={tnd(stats?.ticketMoyen)}          icone={<span className="text-violet-600 dark:text-violet-400">{Icon.wallet}</span>}     accent="bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800" />
          </div>

          {/* ── Barre d'outils ── */}
          <div className="flex flex-col sm:flex-row gap-3 fondu-haut" style={{ animationDelay: '120ms' }}>
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{Icon.search}</span>
              <input value={recherche} onChange={e => setRecherche(e.target.value)}
                placeholder="Rechercher investisseurs, entreprises, localisations…"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-[#1e293b] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006d94]/40 focus:border-[#006d94] transition-all" />
            </div>
            {[
              { val: fType,    set: setFType,    opts: TYPES_INVESTISSEUR, placeholder: 'Tous les types' },
              { val: fSecteur, set: setFSecteur, opts: TOUS_SECTEURS,      placeholder: 'Tous les secteurs' },
              { val: fStade,   set: setFStade,   opts: TOUS_STADES,        placeholder: 'Tous les stades' },
            ].map((f, i) => (
              <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
                className="px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-[#1e293b] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006d94]/40 focus:border-[#006d94] font-medium transition-all">
                <option value="tous">{f.placeholder}</option>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            <button onClick={() => setAjoutOuvert(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#006d94] hover:bg-[#00526e] text-white text-sm font-semibold rounded-xl shadow hover:shadow-lg transition-all whitespace-nowrap">
              {Icon.plus} Ajouter
            </button>
          </div>

          {/* ── Erreur ── */}
          {error && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button onClick={refetch} className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:underline">
                {Icon.refresh} Réessayer
              </button>
            </div>
          )}

          {/* ── Grille ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e293b] p-6 animate-pulse">
                  <div className="flex gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 shrink-0"></div>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : investors.length === 0 ? (
            <div className="carte-verre rounded-2xl p-12 text-center dark:!bg-[#1e293b]">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400 flex items-center justify-center">{Icon.users}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun investisseur trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Ajustez vos filtres ou ajoutez un nouvel investisseur</p>
              <button onClick={() => setAjoutOuvert(true)}
                className="px-6 py-3 bg-[#006d94] hover:bg-[#00526e] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                Ajouter un investisseur
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {investors.map((inv, i) => (
                <CarteInvestisseur key={inv._id} investisseur={inv} index={i}
                  onProfil={() => { setSelectionne(inv); setDetailOuvert(true); }}
                  onCorrespondances={() => { setSelectionne(inv); setMatchOuvert(true); }}
                  onSupprimer={() => handleSupprimer(inv)} />
              ))}
            </div>
          )}
        </div>

        {detailOuvert && selectionne && <ModalDetailInvestisseur investisseur={selectionne} onFermer={() => setDetailOuvert(false)} />}
        {matchOuvert  && selectionne && <ModalCorrespondances investisseur={selectionne} onFermer={() => setMatchOuvert(false)} onValider={handleValiderMatch} onRejeter={handleRejeterMatch} />}
        {ajoutOuvert  && <ModalAjoutInvestisseur onFermer={() => setAjoutOuvert(false)} onSauvegarder={handleAjouter} />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ─── Carte Investisseur ───────────────────────────────────────────────────────
function CarteInvestisseur({ investisseur: inv, index, onProfil, onCorrespondances, onSupprimer }) {
  const nbEnAttente = inv.matches.filter(m => m.statut === 'en_attente').length;
  return (
    <div className="carte-hover fondu-haut group bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700"
      style={{ animationDelay: `${index * 55}ms` }}>
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#006d94] to-[#0088ba] flex items-center justify-center text-white font-bold text-lg shadow-md">
                {inv.initiales || inv.nom?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-[#1e293b]"></div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{inv.nom}</h3>
              <p className="text-xs font-semibold text-[#006d94] dark:text-sky-400">{inv.entreprise}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">{Icon.location}{inv.localisation}</div>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${STYLE_TYPE[inv.type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>{inv.type}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg">{tnd(inv.ticketMin)}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-300 to-sky-300 dark:from-emerald-800 dark:to-sky-800"></div>
          <span className="text-xs mono font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 rounded-lg">{tnd(inv.ticketMax)}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {inv.secteurs?.slice(0, 3).map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">{s}</span>)}
          {inv.secteurs?.length > 3 && <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">+{inv.secteurs.length - 3}</span>}
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {inv.stades?.map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">{s}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-700/60">
        {[{ label: 'Portefeuille', valeur: inv.portfolio }, { label: 'Déployé', valeur: tnd(inv.totalInvesti) }, { label: 'Correspondances', valeur: inv.matches?.length ?? 0 }].map(s => (
          <div key={s.label} className="flex flex-col items-center justify-center py-3 border-r border-gray-100 dark:border-gray-700/60 last:border-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white mono">{s.valeur}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {nbEnAttente > 0 && (
        <div className="mx-4 mb-3 mt-0 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {Icon.clock}
            {nbEnAttente} correspondance{nbEnAttente !== 1 ? 's' : ''} en attente
          </div>
          <button onClick={onCorrespondances} className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap">Examiner →</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 px-4 pb-4">
        {[
          { label: 'Profil',        icone: Icon.profile,   onClick: onProfil,          cls: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30' },
          { label: 'Correspond.',   icone: Icon.lightning, onClick: onCorrespondances,  cls: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30' },
          { label: 'Retirer',       icone: Icon.trash,     onClick: onSupprimer,        cls: 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' },
        ].map(btn => (
          <button key={btn.label} onClick={btn.onClick} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${btn.cls}`}>
            {btn.icone}
            <span className="text-[10px] leading-none">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Modal Détail Investisseur ────────────────────────────────────────────────
function ModalDetailInvestisseur({ investisseur: inv, onFermer }) {
  return (
    <Modal isOpen={true} onClose={onFermer} title="Profil de l'investisseur" size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-5 p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-[#00526e]/30 dark:to-[#006d94]/30 border border-sky-100 dark:border-sky-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#006d94] to-[#0088ba] flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
            {inv.initiales || inv.nom?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{inv.nom}</h3>
            <p className="text-sm font-semibold text-[#006d94] dark:text-sky-400">{inv.entreprise}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">{Icon.location} {inv.localisation}</span>
              <span className={`px-2 py-0.5 rounded-lg border text-xs font-semibold ${STYLE_TYPE[inv.type] || ''}`}>{inv.type}</span>
            </div>
            {inv.siteWeb && (
              <a href={inv.siteWeb} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-[#006d94] dark:text-sky-400 hover:underline">{Icon.link} {inv.siteWeb}</a>
            )}
          </div>
        </div>

        {inv.bio && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">À propos</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{inv.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[{ label: 'Portefeuille', valeur: inv.portfolio, couleur: 'text-blue-600 dark:text-blue-400' }, { label: 'Déployé', valeur: tnd(inv.totalInvesti), couleur: 'text-emerald-600 dark:text-emerald-400' }, { label: 'Correspondances', valeur: inv.matches?.length ?? 0, couleur: 'text-violet-600 dark:text-violet-400' }].map(s => (
            <div key={s.label} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800">
              <p className={`text-xl font-bold mono ${s.couleur}`}>{s.valeur}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 text-center">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Fourchette d'investissement</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800">
            <span className="mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{tnd(inv.ticketMin)}</span>
            <div className="flex-1 h-2 bg-gradient-to-r from-emerald-300 to-sky-400 dark:from-emerald-800 dark:to-sky-600 rounded-full"></div>
            <span className="mono text-sm font-bold text-sky-600 dark:text-sky-400">{tnd(inv.ticketMax)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Secteurs ciblés</p>
            <div className="flex flex-wrap gap-1.5">{inv.secteurs?.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-medium border border-sky-100 dark:border-sky-800">{s}</span>)}</div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Stades d'investissement</p>
            <div className="flex flex-wrap gap-1.5">{inv.stades?.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium">{s}</span>)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800"><span className="text-gray-400">{Icon.mail}</span><span className="text-xs text-gray-600 dark:text-gray-300 truncate">{inv.email}</span></div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800"><span className="text-gray-400">{Icon.phone}</span><span className="text-xs text-gray-600 dark:text-gray-300">{inv.telephone}</span></div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onFermer} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">Fermer</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal Correspondances (version avec API matching) ───────────────────────
function ModalCorrespondances({ investisseur, onFermer, onValider, onRejeter }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

// ✅ Ajoute cette fonction
  const handleRefresh = () => {
    const formattedMatches = (investisseur.matches || []).map(m => ({
      _id: m._id,
      nom: m.nom,
      score: m.score,
      statut: m.statut,
      secteur: null,
      reasoning: null
    }));
    setMatches(formattedMatches);
  };

  useEffect(() => {
    const formattedMatches = (investisseur.matches || []).map(m => ({
      _id: m._id,
      nom: m.nom,
      score: m.score,
      statut: m.statut,
      secteur: null,
      reasoning: null
    }));
    setMatches(formattedMatches);
    setLoading(false);
  }, [investisseur._id]);

  const STATUT_STYLE = {
    validé:      { label: 'Validé',      bg: 'bg-emerald-50 dark:bg-emerald-950', texte: 'text-emerald-700 dark:text-emerald-300', bordure: 'border-emerald-200 dark:border-emerald-800' },
    en_attente:  { label: 'En attente',  bg: 'bg-amber-50 dark:bg-amber-950',     texte: 'text-amber-700 dark:text-amber-300',     bordure: 'border-amber-200 dark:border-amber-800' },
    rejeté:      { label: 'Rejeté',      bg: 'bg-red-50 dark:bg-red-950',         texte: 'text-red-700 dark:text-red-300',         bordure: 'border-red-200 dark:border-red-800' },
  };

  const tries = [...matches].sort((a, b) => b.score - a.score);

  return (
    <Modal isOpen={true} onClose={onFermer} title={`Correspondances — ${investisseur.nom}`} size="lg">
      <div className="space-y-5">
        {/* En-tête investisseur */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950 border border-sky-100 dark:border-sky-800">
          <div className="w-12 h-12 rounded-xl bg-[#006d94] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
            {investisseur.initiales}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{investisseur.nom}</h3>
              <span className="text-xs text-gray-400">·</span>
              <p className="text-sm text-[#006d94] dark:text-sky-400">{investisseur.entreprise}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">{Icon.location} {investisseur.localisation}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${STYLE_TYPE[investisseur.type] || ''}`}>{investisseur.type}</span>
        </div>

        {/* Info + bouton refresh */}
        <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">i</div>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Scores de compatibilité générés par l'algorithme IA. Validez les correspondances à score élevé pour initier le contact avec les startups.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Mise à jour...' : 'Rafraîchir'}
          </button>
        </div>

        {/* État chargement */}
        {loading && (
          <div className="flex flex-col items-center py-16">
            <div className="w-10 h-10 border-2 border-[#006d94] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 mt-3">Chargement des correspondances...</p>
          </div>
        )}

        {/* État erreur */}
        {error && !loading && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-500 dark:text-gray-400">{error}</p>
            <button onClick={fetchMatches} className="mt-3 text-sm text-[#006d94] hover:underline">
              Réessayer
            </button>
          </div>
        )}

        {/* Liste des correspondances */}
        {!loading && !error && tries.length === 0 && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-500 dark:text-gray-400">Aucune correspondance trouvée</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 text-center max-w-md">
              Les correspondances apparaîtront une fois que l'algorithme aura identifié des startups compatibles avec ce profil.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#006d94] rounded-lg hover:bg-[#00526e] transition-colors"
            >
              Lancer la recherche
            </button>
          </div>
        )}

        {/* Liste des matches */}
        {!loading && !error && tries.length > 0 && (
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 -mr-2">
            {tries.map((m) => {
              const sc = configScore(m.score);
              const st = STATUT_STYLE[m.statut] || STATUT_STYLE.en_attente;
              return (
                <div key={m._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#006d94] to-[#0088ba] flex items-center justify-center text-white text-sm font-medium">
                          {m.nom?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{m.nom}</h4>
                          {m.secteur && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{m.secteur}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-light ${sc.texte}`}>{m.score}</span>
                            <span className="text-xs text-gray-400">%</span>
                          </div>
                          <p className="text-xs text-gray-400">compatibilité</p>
                        </div>
                        <div className={`w-0.5 h-8 rounded-full ${sc.barre}`}></div>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50">
                    {/* Raisonnement IA */}
                    {m.reasoning && (
                      <div className="mb-3 text-xs text-gray-600 dark:text-gray-400 italic">
                        “{m.reasoning}”
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${st.bg} ${st.bordure}`}>
                        <span className={`text-xs font-medium ${st.texte}`}>{st.label}</span>
                      </div>
                      {m.statut === 'en_attente' && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => onRejeter(investisseur._id, m._id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors">
                            Rejeter
                          </button>
                          <button onClick={() => onValider(investisseur._id, m._id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#006d94] hover:bg-[#00526e] rounded-lg transition-colors">
                            Valider
                          </button>
                        </div>
                      )}
                      {m.statut === 'validé' && (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800">
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Startup notifiée</span>
                        </div>
                      )}
                      {m.statut === 'rejeté' && (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800">
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">✗ Rejeté</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500 dark:text-gray-400">Force de la correspondance</span>
                        <span className={`font-mono text-sm font-medium ${sc.texte}`}>{m.score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${sc.barre}`} style={{ width: `${m.score}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pied de modal avec compteur */}
        {!loading && !error && tries.length > 0 && (
          <div className="pt-3 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
            {tries.length} correspondance{tries.length !== 1 ? 's' : ''} trouvée{tries.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Modal Ajout Investisseur ─────────────────────────────────────────────────
function ModalAjoutInvestisseur({ onFermer, onSauvegarder }) {
  const [form, setForm] = useState({
    nom: '', entreprise: '', email: '', telephone: '', localisation: '',
    type: 'VC', bio: '', siteWeb: '', secteurs: [], stades: [],
    ticketMin: 0, ticketMax: 0,
  });
  const [sauvegarde, setSauvegarde] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const basculerTableau = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));

  const handleSauvegarder = async () => {
    if (!form.nom || !form.entreprise || !form.email) {
      alert('Le nom, l\'entreprise et l\'email sont obligatoires');
      return;
    }
    setSauvegarde(true);
    try {
      await onSauvegarder(form);
    } finally {
      setSauvegarde(false);
    }
  };

  const clsInput = "w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006d94]/40 focus:border-[#006d94] transition-all";

  return (
    <Modal isOpen={true} onClose={onFermer} title="Ajouter un investisseur" size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Nom complet *',    clé: 'nom',         placeholder: 'ex. Samia Belhadj' },
            { label: 'Entreprise *',     clé: 'entreprise',  placeholder: 'ex. AfriCInvest' },
            { label: 'Email *',          clé: 'email',       placeholder: 'investisseur@entreprise.com' },
            { label: 'Téléphone',        clé: 'telephone',   placeholder: '+216 XX XXX XXX' },
            { label: 'Localisation',     clé: 'localisation', placeholder: 'Tunis, Tunisie' },
            { label: 'Site web',         clé: 'siteWeb',     placeholder: 'https://entreprise.com' },
          ].map(f => (
            <div key={f.clé}>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
              <input value={form[f.clé]} onChange={e => set(f.clé, e.target.value)} placeholder={f.placeholder} className={clsInput} />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Type d'investisseur</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className={clsInput}>
            {TYPES_INVESTISSEUR.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Présentation</label>
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={2} placeholder="Brève description de l'investisseur…" className={`${clsInput} resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Secteurs ciblés', clé: 'secteurs', opts: TOUS_SECTEURS,      actif: 'bg-[#006d94] border-[#006d94] text-white' },
            { label: 'Stades',          clé: 'stades',   opts: TOUS_STADES,         actif: 'bg-violet-600 border-violet-600 text-white' },
          ].map(g => (
            <div key={g.clé}>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{g.label}</label>
              <div className="flex flex-wrap gap-1.5">
                {g.opts.map(o => (
                  <button key={o} type="button" onClick={() => basculerTableau(g.clé, o)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${form[g.clé].includes(o) ? g.actif : 'bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Ticket minimum (TND)', clé: 'ticketMin', placeholder: '150000' },
            { label: 'Ticket maximum (TND)', clé: 'ticketMax', placeholder: '1500000' },
          ].map(f => (
            <div key={f.clé}>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
              <input type="number" value={form[f.clé]} onChange={e => set(f.clé, Number(e.target.value))} placeholder={f.placeholder} className={clsInput} />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onFermer} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">Annuler</button>
          <button onClick={handleSauvegarder} disabled={sauvegarde}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#006d94] hover:bg-[#00526e] text-white rounded-xl shadow transition-all disabled:opacity-60">
            {sauvegarde && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            Ajouter au catalogue
          </button>
        </div>
      </div>
    </Modal>
  );
}