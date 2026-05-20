'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import useTranslation from '@/app/hooks/useTranslation';

// ─── Mock Historique Rapports IA ──────────────────────────────
const MOCK_REPORTS = [
  {
    id: 'RPT-2024-001',
    titre: 'Évaluation jury — FoodStart 2024 · Session 1',
    programme: 'FoodStart 2024',
    session: 'Session 1',
    genereLe: '2024-03-12T14:32:00',
    generePar: 'Système IA MEDIANET',
    juryMembers: ['Sonia Mrad', 'Karim Jalel', 'Nadia Ben Salem'],
    candidaturesEvaluees: 34,
    statut: 'finalisé',
    scoresMoyens: { pertinence: 82, viabilite: 76, innovation: 88, equipe: 79 },
    topInsights: [
      { type: 'success', text: 'Forte cohérence inter-jurés sur les dossiers FinTech (écart-type < 5).' },
      { type: 'warning', text: '3 dossiers avec écart de notation > 20 pts — révision recommandée.' },
      { type: 'info',    text: 'Critère "Innovation" systématiquement mieux noté que "Viabilité financière".' },
    ],
    tags: ['FinTech', 'FoodTech', 'Session 1'],
  },
  {
    id: 'RPT-2024-002',
    titre: 'Évaluation jury — FoodStart 2024 · Session 2',
    programme: 'FoodStart 2024',
    session: 'Session 2',
    genereLe: '2024-04-28T10:15:00',
    generePar: 'Système IA MEDIANET',
    juryMembers: ['Sonia Mrad', 'Ali Trabelsi'],
    candidaturesEvaluees: 27,
    statut: 'finalisé',
    scoresMoyens: { pertinence: 79, viabilite: 71, innovation: 85, equipe: 83 },
    topInsights: [
      { type: 'success', text: 'Le taux de consensus jury a augmenté de 12% vs Session 1.' },
      { type: 'warning', text: 'Biais détecté : les startups fondées par des femmes reçoivent en moyenne 4 pts de moins sur "Viabilité".' },
    ],
    tags: ['FoodTech', 'Session 2', 'Biais détecté'],
  },
  {
    id: 'RPT-2024-003',
    titre: 'Évaluation jury — Startup Village S1 · Session 1',
    programme: 'Startup Village S1',
    session: 'Session 1',
    genereLe: '2024-08-05T09:00:00',
    generePar: 'Système IA MEDIANET',
    juryMembers: ['Karim Jalel', 'Mehdi Oueslati', 'Rim Zaidi'],
    candidaturesEvaluees: 42,
    statut: 'finalisé',
    scoresMoyens: { pertinence: 74, viabilite: 68, innovation: 80, equipe: 77 },
    topInsights: [
      { type: 'info',    text: 'HealthTech domine les meilleures notations de cette session (top 5 sur 8).' },
      { type: 'warning', text: 'Durée moyenne d\'évaluation par dossier : 22 min — au-dessus du seuil recommandé (15 min).' },
      { type: 'success', text: 'Aucun conflit d\'intérêt déclaré. Tous les jurés ont complété leur checklist.' },
    ],
    tags: ['HealthTech', 'CleanTech', 'Multi-secteur'],
  },
  {
    id: 'RPT-2024-004',
    titre: 'Évaluation jury — FinTech Boost · Session 1',
    programme: 'FinTech Boost',
    session: 'Session 1',
    genereLe: '2024-11-19T16:45:00',
    generePar: 'Système IA MEDIANET',
    juryMembers: ['Nadia Ben Salem', 'Youssef Baccouche'],
    candidaturesEvaluees: 18,
    statut: 'brouillon',
    scoresMoyens: { pertinence: 88, viabilite: 83, innovation: 91, equipe: 85 },
    topInsights: [
      { type: 'success', text: 'Panel homogène — spécialisation FinTech des jurés reflétée dans la qualité des évaluations.' },
      { type: 'info',    text: 'CryptoTN et PayNow ont les meilleurs scores combinés (> 90/100).' },
    ],
    tags: ['FinTech', 'InsurTech', 'Session 1'],
  },
  {
    id: 'RPT-2025-001',
    titre: 'Évaluation jury — EdTech Launch · Pré-sélection',
    programme: 'EdTech Launch',
    session: 'Pré-sélection',
    genereLe: '2025-02-03T11:20:00',
    generePar: 'Système IA MEDIANET',
    juryMembers: ['Sonia Mrad', 'Hatem Ghariani', 'Leila Dridi'],
    candidaturesEvaluees: 12,
    statut: 'en_cours',
    scoresMoyens: { pertinence: 70, viabilite: 64, innovation: 77, equipe: 72 },
    topInsights: [
      { type: 'info',    text: 'Phase de pré-sélection — rapport partiel basé sur 12 dossiers sur 20 attendus.' },
      { type: 'warning', text: 'Critère "Équipe" insuffisamment renseigné dans 4 dossiers — complétion requise avant finalisation.' },
    ],
    tags: ['EdTech', 'Pré-sélection', 'Partiel'],
  },
];

// ─── Icons ────────────────────────────────────────────────────
const Icons = {
  report: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
  pdf: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  sparkle: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm0 16l.75 2.25L15 21l-2.25.75L12 24l-.75-2.25L9 21l2.25-.75L12 18z"/>
    </svg>
  ),
  jury: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
};

// ─── Score Bar ────────────────────────────────────────────────
function ScoreBar({ label, value }) {
  const color = value >= 85 ? '#1D9E75' : value >= 70 ? '#EF9F27' : '#E24B4A';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-bold mono w-8 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function AdminReportingPage() {
  const { user: currentUser } = useSelector(s => s.auth);
  const { t } = useTranslation();

  const [mounted,       setMounted]       = useState(false);
  const [time,          setTime]          = useState(new Date());
  const [search,        setSearch]        = useState('');
  const [filterStatut,  setFilterStatut]  = useState('tous');
  const [filterProg,    setFilterProg]    = useState('tous');
  const [selectedRpt,   setSelectedRpt]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reports,       setReports]       = useState(MOCK_REPORTS);
  const [exportLoading, setExportLoading] = useState(null);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const programmes = ['tous', ...Array.from(new Set(reports.map(r => r.programme)))];

  const filtered = reports.filter(r => {
    const matchSearch = search === '' ||
      r.titre.toLowerCase().includes(search.toLowerCase()) ||
      r.programme.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'tous' || r.statut === filterStatut;
    const matchProg   = filterProg   === 'tous' || r.programme === filterProg;
    return matchSearch && matchStatut && matchProg;
  });

  const handleDelete = (id) => {
    setReports(prev => prev.filter(r => r.id !== id));
    if (selectedRpt?.id === id) setSelectedRpt(null);
    setDeleteConfirm(null);
  };

  const handleExport = (id) => {
    setExportLoading(id);
    setTimeout(() => setExportLoading(null), 1400);
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const statutCfg = {
    'finalisé':  { label: 'Finalisé',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'   },
    'brouillon': { label: 'Brouillon',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'   },
    'en_cours':  { label: 'En cours',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'       },
  };

  const avgScore = (s) => Math.round((s.pertinence + s.viabilite + s.innovation + s.equipe) / 4);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          @keyframes slideInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
          @keyframes scaleIn   { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
          @keyframes holographic-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          .animate-slide-up  { animation: slideInUp 0.5s cubic-bezier(.22,1,.36,1) forwards }
          .animate-fade-in   { animation: fadeIn 0.3s ease forwards }
          .animate-scale-in  { animation: scaleIn 0.35s ease-out forwards }
          .glass-card { background:rgba(255,255,255,0.95); backdrop-filter:blur(10px); border:1px solid rgba(0,0,0,0.05) }
          :global(.dark) .glass-card { background:#1e293b; border:1px solid #334155 }
          .holographic { background:linear-gradient(135deg,rgba(0,186,255,0.1) 0%,rgba(255,191,0,0.1) 50%,rgba(0,186,255,0.1) 100%); background-size:200% 200%; animation:holographic-shift 3s ease infinite }
          .rpt-row { transition:all 0.2s ease; cursor:pointer }
          .rpt-row:hover { background:rgba(24,95,165,0.04) }
          :global(.dark) .rpt-row:hover { background:rgba(255,255,255,0.04) }
          .mono { font-family:'JetBrains Mono', monospace }
          :global(.dark) .text-gray-900 { color:#f1f5f9 }
          :global(.dark) .text-gray-700 { color:#cbd5e1 }
          :global(.dark) .text-gray-600 { color:#94a3b8 }
          :global(.dark) .text-gray-500 { color:#64748b }
          :global(.dark) .bg-white      { background-color:#1e293b }
          :global(.dark) .border-gray-100 { border-color:#334155 }
          :global(.dark) .border-gray-200 { border-color:#2d3748 }
          :global(.dark) .bg-gray-50    { background-color:#0f172a }
        `}</style>

        <div className="space-y-6 min-h-screen pb-12">

          {/* ── HEADER ──────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden rounded-3xl p-10 animate-slide-up"
            style={{ background: 'linear-gradient(135deg, #00526e 0%, #006d94 50%, #0088ba 100%)' }}
          >
            <div className="absolute" style={{ top:'15%', left:'20%', width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.3)' }}></div>
            <div className="absolute" style={{ top:'60%', left:'75%', width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.3)' }}></div>
            <div className="absolute inset-0 holographic opacity-30"></div>

            <div className="relative flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                  Historique des Rapports IA
                </h1>
                <p className="text-blue-200 text-lg font-medium mb-4">
                  Rapports d'évaluation générés automatiquement par le jury assisté IA
                </p>
                <div className="flex items-center gap-6 text-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{reports.length} rapport{reports.length !== 1 ? 's' : ''} archivé{reports.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-px h-4 bg-blue-400/30"></div>
                  <div className="mono text-sm">
                    {mounted && time.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                  </div>
                  <div className="w-px h-4 bg-blue-400/30"></div>
                  <div className="mono text-sm">
                    {mounted && time.toLocaleDateString('fr-FR', { weekday:'long', month:'short', day:'numeric' })}
                  </div>
                </div>
              </div>

              <div style={{ background:'linear-gradient(135deg,rgba(0,82,110,0.9),rgba(0,109,148,0.9))', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)' }}
                className="rounded-2xl p-4 min-w-[220px] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg">
                      {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{currentUser?.name || 'Admin'}</p>
                    <p className="text-blue-200 text-xs mono">SYS.ADMIN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS RAPIDES ───────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total rapports',          value: reports.length,                                          sub: 'tous programmes',         color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20'    },
              { label: 'Finalisés',               value: reports.filter(r => r.statut === 'finalisé').length,    sub: 'archivés',                 color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20'  },
              { label: 'En cours',                value: reports.filter(r => r.statut === 'en_cours').length,    sub: 'à finaliser',              color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20'  },
              { label: 'Candidatures évaluées',   value: reports.reduce((s, r) => s + r.candidaturesEvaluees, 0), sub: 'total cumulé',            color: 'text-purple-600 dark:text-purple-400',bg: 'bg-purple-50 dark:bg-purple-900/20'},
            ].map((s, i) => (
              <div key={i} className={`glass-card rounded-2xl p-5 animate-scale-in ${s.bg}`} style={{ animationDelay: `${i * 0.07}s` }}>
                <p className={`text-sm font-medium mb-1 ${s.color}`}>{s.label}</p>
                <p className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── FILTRES ─────────────────────────────────────────── */}
          <div className="glass-card rounded-2xl p-5 dark:!bg-[#1e293b] animate-scale-in">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
                <input
                  type="text"
                  placeholder="Rechercher un rapport…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['tous', 'finalisé', 'en_cours', 'brouillon'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatut(s)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      filterStatut === s
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {s === 'tous' ? 'Tous' : statutCfg[s]?.label || s}
                  </button>
                ))}
              </div>
              <select
                value={filterProg}
                onChange={e => setFilterProg(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                {programmes.map(p => (
                  <option key={p} value={p}>{p === 'tous' ? 'Tous les programmes' : p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── LISTE RAPPORTS ──────────────────────────────────── */}
          <div className="glass-card rounded-2xl overflow-hidden dark:!bg-[#1e293b] animate-fade-in">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  {Icons.report}
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aucun rapport trouvé</p>
                <p className="text-xs mt-1 text-gray-400">Modifiez vos filtres pour voir d'autres résultats.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((rpt, idx) => (
                  <div
                    key={rpt.id}
                    className={`rpt-row px-6 py-4 flex items-center gap-4 ${selectedRpt?.id === rpt.id ? 'bg-primary-50/60 dark:bg-primary-900/10' : ''}`}
                    onClick={() => setSelectedRpt(selectedRpt?.id === rpt.id ? null : rpt)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: rpt.statut === 'finalisé' ? '#1D9E75' : rpt.statut === 'brouillon' ? '#EF9F27' : '#185FA5' }}>
                      {Icons.report}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{rpt.titre}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${statutCfg[rpt.statut]?.cls}`}>
                          {statutCfg[rpt.statut]?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="mono">{rpt.id}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">{Icons.jury} {rpt.juryMembers.length} jurés</span>
                        <span>·</span>
                        <span>{rpt.candidaturesEvaluees} dossiers évalués</span>
                        <span>·</span>
                        <span>{fmtDate(rpt.genereLe)} à {fmtTime(rpt.genereLe)}</span>
                      </div>
                    </div>

                    <div className="text-center flex-shrink-0 hidden sm:block">
                      <p className="text-xs text-gray-400 mb-0.5">Score moy.</p>
                      <p className={`text-xl font-bold mono ${
                        avgScore(rpt.scoresMoyens) >= 80 ? 'text-green-600 dark:text-green-400' :
                        avgScore(rpt.scoresMoyens) >= 65 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-500'
                      }`}>{avgScore(rpt.scoresMoyens)}<span className="text-xs font-normal">/100</span></p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleExport(rpt.id)}
                        disabled={exportLoading === rpt.id}
                        title="Exporter PDF"
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-400 hover:text-primary-600 flex items-center justify-center transition-all disabled:opacity-50"
                      >
                        {exportLoading === rpt.id
                          ? <span className="w-3.5 h-3.5 border-2 border-primary-400 border-t-primary-700 rounded-full animate-spin"></span>
                          : Icons.pdf}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(rpt.id)}
                        title="Supprimer"
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-500 flex items-center justify-center transition-all"
                      >
                        {Icons.trash}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── DÉTAIL RAPPORT ──────────────────────────────────── */}
          {selectedRpt && (
            <div className="glass-card rounded-2xl overflow-hidden dark:!bg-[#1e293b] animate-scale-in">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                    {Icons.sparkle}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedRpt.titre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mono">{selectedRpt.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRpt(null)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 flex items-center justify-center transition-all"
                >
                  {Icons.close}
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scores */}
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Scores moyens du jury</h3>
                  <div className="space-y-3">
                    <ScoreBar label="Pertinence"  value={selectedRpt.scoresMoyens.pertinence}  />
                    <ScoreBar label="Viabilité"   value={selectedRpt.scoresMoyens.viabilite}   />
                    <ScoreBar label="Innovation"  value={selectedRpt.scoresMoyens.innovation}  />
                    <ScoreBar label="Équipe"      value={selectedRpt.scoresMoyens.equipe}      />
                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Score global</span>
                      <span className={`text-lg font-bold mono ${
                        avgScore(selectedRpt.scoresMoyens) >= 80 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>{avgScore(selectedRpt.scoresMoyens)}/100</span>
                    </div>
                  </div>
                </div>

                {/* Insights IA */}
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Insights IA générés</h3>
                  <div className="space-y-3">
                    {selectedRpt.topInsights.map((ins, i) => (
                      <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm ${
                        ins.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40' :
                        ins.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40' :
                        'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40'
                      }`}>
                        <span className={`flex-shrink-0 mt-0.5 ${
                          ins.type === 'success' ? 'text-green-500' :
                          ins.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                        }`}>
                          {ins.type === 'success' ? Icons.check : ins.type === 'warning' ? Icons.warning : Icons.info}
                        </span>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{ins.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jurés */}
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Membres du jury</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRpt.juryMembers.map((j, i) => (
                      <span key={i}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                        <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                          {j.split(' ').map(n => n[0]).join('')}
                        </span>
                        {j}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Méta */}
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Détails du rapport</h3>
                  <div className="space-y-2 text-sm mb-4">
                    {[
                      { label: 'Programme',  value: selectedRpt.programme },
                      { label: 'Session',    value: selectedRpt.session },
                      { label: 'Généré le',  value: `${fmtDate(selectedRpt.genereLe)} à ${fmtTime(selectedRpt.genereLe)}` },
                      { label: 'Généré par', value: selectedRpt.generePar },
                      { label: 'Dossiers',   value: `${selectedRpt.candidaturesEvaluees} candidatures` },
                    ].map((info, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <span className="text-gray-500 dark:text-gray-400">{info.label}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{info.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRpt.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(selectedRpt.id)}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all flex items-center gap-2"
                >
                  {Icons.trash} Supprimer ce rapport
                </button>
                <button
                  onClick={() => handleExport(selectedRpt.id)}
                  disabled={exportLoading === selectedRpt.id}
                  className="px-5 py-2 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all flex items-center gap-2 shadow disabled:opacity-60"
                >
                  {exportLoading === selectedRpt.id
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    : Icons.pdf}
                  {exportLoading === selectedRpt.id ? 'Export…' : 'Exporter en PDF'}
                </button>
              </div>
            </div>
          )}

          {/* ── MODAL SUPPRESSION ───────────────────────────────── */}
          {deleteConfirm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => setDeleteConfirm(null)}
            >
              <div
                className="glass-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                  {Icons.trash}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-2">
                  Supprimer ce rapport ?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                  Cette action est irréversible. Le rapport{' '}
                  <span className="font-mono font-semibold">{deleteConfirm}</span>{' '}
                  sera définitivement supprimé.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}