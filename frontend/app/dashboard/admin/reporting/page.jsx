'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import useTranslation from '@/app/hooks/useTranslation';

// ─── Mock Data Programmes ─────────────────────────────────────
const MOCK_PROGRAMMES = [
  {
    id: 1,
    titre: 'FoodStart 2024',
    sector: 'FoodTech',
    status: 'closed',
    dateDebut: '2024-01-15',
    dateFin: '2024-07-15',
    quota: 12,
    candidatures: 87,
    startups: 24,
    financement: 1850000,
    tauxReussite: 87,
    progression: [
      { mois: 'M1', candidatures: 12, startups: 2,  kpi: 15 },
      { mois: 'M2', candidatures: 28, startups: 8,  kpi: 32 },
      { mois: 'M3', candidatures: 51, startups: 14, kpi: 48 },
      { mois: 'M4', candidatures: 70, startups: 19, kpi: 61 },
      { mois: 'M5', candidatures: 82, startups: 22, kpi: 74 },
      { mois: 'M6', candidatures: 87, startups: 24, kpi: 87 },
    ],
    secteurs: [
      { nom: 'FoodTech',   pct: 28, color: '#185FA5' },
      { nom: 'FinTech',    pct: 22, color: '#1D9E75' },
      { nom: 'EdTech',     pct: 18, color: '#EF9F27' },
      { nom: 'HealthTech', pct: 16, color: '#E24B4A' },
      { nom: 'AgriTech',   pct: 10, color: '#534AB7' },
      { nom: 'Autre',      pct:  6, color: '#888780' },
    ],
    candidaturesData: [
      { statut: 'Acceptées',    count: 24, color: '#1D9E75' },
      { statut: 'Rejetées',     count: 38, color: '#E24B4A' },
      { statut: 'En révision',  count: 15, color: '#EF9F27' },
      { statut: 'En attente',   count: 10, color: '#888780' },
    ],
    topStartups: [
      { nom: 'PayTunis',   secteur: 'FinTech',    score: 92, financement: 320000, statut: 'Incubée' },
      { nom: 'FinEdge',    secteur: 'FinTech',    score: 88, financement: 280000, statut: 'Incubée' },
      { nom: 'EduLearn',   secteur: 'EdTech',     score: 85, financement: 250000, statut: 'Graduée' },
      { nom: 'DabaDoc',    secteur: 'HealthTech', score: 90, financement: 300000, statut: 'Incubée' },
      { nom: 'AgriSmart',  secteur: 'AgriTech',   score: 78, financement: 180000, statut: 'Incubée' },
    ],
    iaInsights: [
      { type: 'success', titre: 'Taux d\'acceptation en hausse', detail: 'Le programme affiche un taux d\'acceptation de 27.6%, soit +5% vs la cohorte précédente. Le secteur FinTech domine avec 3 startups sur les 5 les mieux notées.' },
      { type: 'warning', titre: 'Délai moyen de traitement élevé', detail: 'Le délai moyen entre soumission et décision est de 18 jours. Recommandation : assigner les jurys dès J+3 pour réduire ce délai à 10 jours.' },
      { type: 'info',    titre: 'Potentiel de matching investisseurs', detail: '8 startups incubées correspondent au profil de 3 investisseurs du catalogue. Mise en relation recommandée pour PayTunis, FinEdge et DabaDoc.' },
      { type: 'success', titre: 'Engagement mentor élevé', detail: '92% des startups ont eu au moins 3 sessions de mentorat. Le mentor Sonia Mrad a le meilleur taux de satisfaction (4.9/5).' },
    ],
  },
  {
    id: 2,
    titre: 'Startup Village S1',
    sector: 'Multi-secteur',
    status: 'published',
    dateDebut: '2024-06-01',
    dateFin: '2024-12-01',
    quota: 15,
    candidatures: 63,
    startups: 11,
    financement: 920000,
    tauxReussite: 73,
    progression: [
      { mois: 'M1', candidatures: 8,  startups: 1, kpi: 10 },
      { mois: 'M2', candidatures: 22, startups: 4, kpi: 25 },
      { mois: 'M3', candidatures: 40, startups: 7, kpi: 44 },
      { mois: 'M4', candidatures: 55, startups: 9, kpi: 58 },
      { mois: 'M5', candidatures: 60, startups: 10,kpi: 66 },
      { mois: 'M6', candidatures: 63, startups: 11,kpi: 73 },
    ],
    secteurs: [
      { nom: 'HealthTech', pct: 30, color: '#1D9E75' },
      { nom: 'FinTech',    pct: 25, color: '#185FA5' },
      { nom: 'CleanTech',  pct: 20, color: '#0F6E56' },
      { nom: 'EdTech',     pct: 15, color: '#EF9F27' },
      { nom: 'Autre',      pct: 10, color: '#888780' },
    ],
    candidaturesData: [
      { statut: 'Acceptées',   count: 11, color: '#1D9E75' },
      { statut: 'Rejetées',    count: 27, color: '#E24B4A' },
      { statut: 'En révision', count: 18, color: '#EF9F27' },
      { statut: 'En attente',  count:  7, color: '#888780' },
    ],
    topStartups: [
      { nom: 'MedConnect', secteur: 'HealthTech', score: 89, financement: 200000, statut: 'Incubée' },
      { nom: 'GreenPay',   secteur: 'FinTech',    score: 84, financement: 150000, statut: 'Incubée' },
    ],
    iaInsights: [
      { type: 'info',    titre: 'Programme en cours — données partielles', detail: 'Le programme est encore actif. Les métriques sont basées sur les 6 premiers mois. Taux de complétion : 73%.' },
      { type: 'warning', titre: 'Secteur CleanTech sous-représenté', detail: 'Seulement 2 candidatures CleanTech alors que 3 places sont réservées. Recommandation : relancer le sourcing dans ce secteur.' },
    ],
  },
  {
    id: 3,
    titre: 'FinTech Boost',
    sector: 'FinTech',
    status: 'published',
    dateDebut: '2024-09-01',
    dateFin: '2025-03-01',
    quota: 8,
    candidatures: 41,
    startups: 6,
    financement: 640000,
    tauxReussite: 75,
    progression: [
      { mois: 'M1', candidatures: 5,  startups: 1, kpi: 12 },
      { mois: 'M2', candidatures: 18, startups: 3, kpi: 35 },
      { mois: 'M3', candidatures: 30, startups: 5, kpi: 52 },
      { mois: 'M4', candidatures: 38, startups: 6, kpi: 68 },
      { mois: 'M5', candidatures: 40, startups: 6, kpi: 72 },
      { mois: 'M6', candidatures: 41, startups: 6, kpi: 75 },
    ],
    secteurs: [
      { nom: 'FinTech',   pct: 70, color: '#185FA5' },
      { nom: 'InsurTech', pct: 20, color: '#534AB7' },
      { nom: 'Autre',     pct: 10, color: '#888780' },
    ],
    candidaturesData: [
      { statut: 'Acceptées',   count:  6, color: '#1D9E75' },
      { statut: 'Rejetées',    count: 22, color: '#E24B4A' },
      { statut: 'En révision', count:  8, color: '#EF9F27' },
      { statut: 'En attente',  count:  5, color: '#888780' },
    ],
    topStartups: [
      { nom: 'CryptoTN',  secteur: 'FinTech', score: 86, financement: 120000, statut: 'Incubée' },
    ],
    iaInsights: [
      { type: 'success', titre: 'Spécialisation sectorielle forte', detail: 'Programme 100% FinTech avec un taux de conversion de 14.6%. Profil des candidatures cohérent avec les attentes du programme.' },
    ],
  },
  {
    id: 4,
    titre: 'EdTech Launch',
    sector: 'EdTech',
    status: 'scheduled',
    dateDebut: '2025-01-15',
    dateFin: '2025-07-15',
    quota: 10,
    candidatures: 12,
    startups: 0,
    financement: 0,
    tauxReussite: 0,
    progression: [
      { mois: 'M1', candidatures: 5,  startups: 0, kpi: 0 },
      { mois: 'M2', candidatures: 12, startups: 0, kpi: 0 },
    ],
    secteurs: [
      { nom: 'EdTech', pct: 100, color: '#EF9F27' },
    ],
    candidaturesData: [
      { statut: 'En attente',  count: 12, color: '#888780' },
    ],
    topStartups: [],
    iaInsights: [
      { type: 'info', titre: 'Programme en phase de sourcing', detail: '12 candidatures reçues, phase de sélection non encore démarrée. Recommandation : accélérer la publication du formulaire spécifique EdTech.' },
    ],
  },
];

const SECTOR_COLORS = {
  'FinTech':       '#185FA5',
  'HealthTech':    '#1D9E75',
  'AgriTech':      '#BA7517',
  'EdTech':        '#EF9F27',
  'CleanTech':     '#0F6E56',
  'FoodTech':      '#D85A30',
  'Multi-secteur': '#534AB7',
};

// ─── Icons ────────────────────────────────────────────────────
const Icons = {
  ia: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
    </svg>
  ),
  pdf: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
  trend_up: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
    </svg>
  ),
  sparkle: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm0 16l.75 2.25L15 21l-2.25.75L12 24l-.75-2.25L9 21l2.25-.75L12 18z"/>
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  particle: null,
};

// ─── Mini SVG Chart : Ligne ───────────────────────────────────
function LineChart({ data, width = 320, height = 160 }) {
  if (!data || data.length === 0) return null;
  const maxCand   = Math.max(...data.map(d => d.candidatures), 1);
  const maxStart  = Math.max(...data.map(d => d.startups), 1);
  const maxKpi    = Math.max(...data.map(d => d.kpi), 1);
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const xStep = W / (data.length - 1 || 1);

  const pointsFor = (key, maxVal) =>
    data.map((d, i) => `${pad.left + i * xStep},${pad.top + H - (d[key] / maxVal) * H}`).join(' ');

  const areaFor = (key, maxVal) => {
    const pts = data.map((d, i) => `${pad.left + i * xStep},${pad.top + H - (d[key] / maxVal) * H}`);
    return `M${pts[0]} L${pts.join(' L')} L${pad.left + (data.length - 1) * xStep},${pad.top + H} L${pad.left},${pad.top + H} Z`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="overflow-visible">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line
            x1={pad.left} y1={pad.top + H - (v / 100) * H}
            x2={pad.left + W} y2={pad.top + H - (v / 100) * H}
            stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.8}
          />
          <text x={pad.left - 6} y={pad.top + H - (v / 100) * H + 4} textAnchor="end"
            fontSize={9} fill="currentColor" fillOpacity={0.45}>{v}</text>
        </g>
      ))}

      {/* Areas */}
      <path d={areaFor('candidatures', maxCand)} fill="#185FA5" fillOpacity={0.08} />
      <path d={areaFor('startups', maxStart)}     fill="#1D9E75" fillOpacity={0.08} />

      {/* Lines */}
      <polyline points={pointsFor('candidatures', maxCand)} fill="none"
        stroke="#185FA5" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pointsFor('startups', maxStart)}     fill="none"
        stroke="#1D9E75" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pointsFor('kpi', maxKpi)}            fill="none"
        stroke="#EF9F27" strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round" />

      {/* Dots */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={pad.left + i * xStep} cy={pad.top + H - (d.candidatures / maxCand) * H} r={3} fill="#185FA5" />
          <circle cx={pad.left + i * xStep} cy={pad.top + H - (d.startups / maxStart) * H}     r={3} fill="#1D9E75" />
        </g>
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={pad.left + i * xStep} y={height - 4}
          textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.5}>{d.mois}</text>
      ))}
    </svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────
function DonutChart({ data, size = 140 }) {
  const total  = data.reduce((s, d) => s + d.pct, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size * 0.38, innerR = size * 0.24;
  let cumul = -90;

  const polarToXY = (angle, radius) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  });

  const slices = data.map(d => {
    const startAngle = cumul;
    const sweep = (d.pct / total) * 360;
    cumul += sweep;
    const endAngle = cumul;
    const largeArc = sweep > 180 ? 1 : 0;
    const s = polarToXY(startAngle, r);
    const e = polarToXY(endAngle,   r);
    const si = polarToXY(startAngle, innerR);
    const ei = polarToXY(endAngle,   innerR);
    return { ...d, path: `M${s.x} ${s.y} A${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} L${ei.x} ${ei.y} A${innerR} ${innerR} 0 ${largeArc} 0 ${si.x} ${si.y} Z` };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.9}
          className="transition-opacity hover:opacity-100" />
      ))}
      <circle cx={cx} cy={cy} r={innerR - 2} fill="var(--donut-bg, white)" />
    </svg>
  );
}

// ─── Bar Chart Horizontal ─────────────────────────────────────
function HBarChart({ data, width = 280, barHeight = 20 }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const H   = data.length * (barHeight + 8) + 4;
  return (
    <svg viewBox={`0 0 ${width} ${H}`} width="100%">
      {data.map((d, i) => {
        const barW = (d.count / max) * (width - 80);
        const y    = i * (barHeight + 8);
        return (
          <g key={i}>
            <text x={0} y={y + barHeight / 2 + 4} fontSize={11} fill="currentColor" fillOpacity={0.65}>{d.statut}</text>
            <rect x={80} y={y + 2} width={Math.max(barW, 4)} height={barHeight - 4} rx={4} fill={d.color} opacity={0.85} />
            <text x={80 + Math.max(barW, 4) + 6} y={y + barHeight / 2 + 4} fontSize={11} fontWeight={600} fill={d.color}>{d.count}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function AdminReportingPage() {
  const { user: currentUser } = useSelector(s => s.auth);
  const { t } = useTranslation();
  const [mounted,  setMounted]  = useState(false);
  const [time,     setTime]     = useState(new Date());
  const [selectedProg,   setSelectedProg]   = useState(MOCK_PROGRAMMES[0]);
  const [activeTab,      setActiveTab]      = useState('overview');
  const [iaLoading,      setIaLoading]      = useState(false);
  const [iaTriggered,    setIaTriggered]    = useState(false);
  const [exportLoading,  setExportLoading]  = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnalyseIA = () => {
    setIaLoading(true);
    setIaTriggered(false);
    setTimeout(() => { setIaLoading(false); setIaTriggered(true); setActiveTab('ia'); }, 1800);
  };

  const handleExport = () => {
    setExportLoading(true);
    setTimeout(() => setExportLoading(false), 1200);
  };

  const prog = selectedProg;

  const getStatusLabel = s => ({ published:'En cours', closed:'Terminé', draft:'Brouillon', scheduled:'Planifié' }[s] || s);
  const getStatusCls   = s => ({
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    draft:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }[s] || 'bg-gray-100 text-gray-500');

  const TABS = [
    { id: 'overview',     label: 'Vue d\'ensemble' },
    { id: 'candidatures', label: 'Candidatures'    },
    { id: 'startups',     label: 'Startups'        },
    { id: 'ia',           label: 'Analyse IA'      },
  ];

  const sectorColor = SECTOR_COLORS[prog.sector] || '#185FA5';

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
          @keyframes slideInUp{ from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scaleIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
          @keyframes holographic-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
          @keyframes pulse-ia { 0%,100%{opacity:1} 50%{opacity:0.5} }
          .animate-slide-up   { animation:slideInUp 0.55s cubic-bezier(.22,1,.36,1) forwards }
          .animate-scale-in   { animation:scaleIn 0.4s ease-out forwards }
          .animate-fade-in    { animation:fadeIn 0.35s ease forwards }
          .pulse-ia           { animation:pulse-ia 1.5s ease-in-out infinite }
          .glass-card  { background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border:1px solid rgba(0,0,0,0.05) }
          :global(.dark) .glass-card { background:#1e293b;border:1px solid #334155 }
          .dark-glass  { background:linear-gradient(135deg,rgba(0,82,110,0.9),rgba(0,109,148,0.9));backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1) }
          .holographic { background:linear-gradient(135deg,rgba(0,186,255,0.1) 0%,rgba(255,191,0,0.1) 50%,rgba(0,186,255,0.1) 100%);background-size:200% 200%;animation:holographic-shift 3s ease infinite }
          .cyber-grid  { background-image:linear-gradient(rgba(0,186,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,191,0,0.05) 1px,transparent 1px);background-size:50px 50px }
          .particle    { position:absolute;width:4px;height:4px;background:rgba(255,255,255,0.3);border-radius:50%;animation:float 6s ease-in-out infinite }
          .stat-card   { transition:all 0.3s ease }
          .stat-card:hover { transform:translateY(-3px);box-shadow:0 16px 24px -8px rgba(0,82,110,0.2) }
          :global(.dark) .stat-card:hover { box-shadow:0 16px 24px -8px rgba(0,0,0,0.5) }
          .prog-card   { transition:all 0.25s ease;cursor:pointer }
          .prog-card:hover { transform:translateY(-2px) }
          .mono { font-family:'JetBrains Mono',monospace }
          svg { --donut-bg: white }
          :global(.dark) svg { --donut-bg: #1e293b }
          :global(.dark) .text-gray-900 { color:#f1f5f9 }
          :global(.dark) .text-gray-700 { color:#cbd5e1 }
          :global(.dark) .text-gray-600 { color:#94a3b8 }
          :global(.dark) .text-gray-500 { color:#64748b }
          :global(.dark) .bg-white      { background-color:#1e293b }
          :global(.dark) .border-gray-100 { border-color:#334155 }
          :global(.dark) .border-gray-200 { border-color:#2d3748 }
        `}</style>

        <div className="space-y-6 cyber-grid min-h-screen pb-12">

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden rounded-3xl p-10 animate-slide-up"
            style={{ background: 'linear-gradient(135deg, #00526e 0%, #006d94 50%, #0088ba 100%)' }}
          >
            <div className="particle" style={{ top:'12%', left:'18%', animationDelay:'0s'   }}></div>
            <div className="particle" style={{ top:'62%', left:'78%', animationDelay:'1.2s' }}></div>
            <div className="particle" style={{ top:'35%', left:'55%', animationDelay:'2.3s' }}></div>
            <div className="absolute inset-0 holographic opacity-30"></div>

            <div className="relative flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Reporting & Analyse</h1>
                <p className="text-blue-200 text-lg font-medium mb-4">Rapport de programme avec insights IA et export PDF</p>
                <div className="flex items-center gap-6 text-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">System Online</span>
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

              <div className="flex flex-col items-end gap-3">
                {/* Admin card */}
                <div className="dark-glass rounded-2xl p-4 min-w-[220px]">
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
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyseIA}
                    disabled={iaLoading}
                    className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {iaLoading
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      : Icons.ia
                    }
                    {iaLoading ? 'Analyse…' : 'Analyser avec IA'}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exportLoading}
                    className="px-5 py-2.5 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg disabled:opacity-60"
                  >
                    {exportLoading
                      ? <span className="w-4 h-4 border-2 border-primary-400 border-t-primary-700 rounded-full animate-spin"></span>
                      : Icons.pdf
                    }
                    {exportLoading ? 'Export…' : 'Exporter PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── SÉLECTION PROGRAMME ─────────────────────────────────── */}
          <div className="glass-card rounded-2xl p-5 dark:!bg-[#1e293b] animate-scale-in">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
              Sélectionner un programme
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MOCK_PROGRAMMES.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProg(p); setIaTriggered(false); setActiveTab('overview'); }}
                  className={`prog-card rounded-xl p-4 text-left border-2 transition-all ${
                    selectedProg.id === p.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-transparent bg-gray-50 dark:bg-gray-900/30 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{p.titre}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${getStatusCls(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.sector}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mono mt-0.5">
                    {p.dateDebut} → {p.dateFin}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── KPI STATS ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label:    'Candidatures reçues',
                value:    prog.candidatures,
                sub:      'ce programme',
                delta:    '+12%',
                color:    'text-blue-600 dark:text-blue-400',
                bg:       'bg-blue-50 dark:bg-blue-900/20',
                delay:    '0.05s',
              },
              {
                label:    'Startups incubées',
                value:    prog.startups,
                sub:      `taux ${prog.quota ? Math.round((prog.startups/prog.quota)*100) : 0}%`,
                delta:    '+5%',
                color:    'text-green-600 dark:text-green-400',
                bg:       'bg-green-50 dark:bg-green-900/20',
                delay:    '0.1s',
              },
              {
                label:    'Financement total',
                value:    prog.financement > 0
                  ? prog.financement.toLocaleString('fr-FR') + ' DT'
                  : '—',
                sub:      'toutes sources',
                delta:    null,
                color:    'text-amber-600 dark:text-amber-400',
                bg:       'bg-amber-50 dark:bg-amber-900/20',
                delay:    '0.15s',
              },
              {
                label:    'Taux de réussite',
                value:    prog.tauxReussite > 0 ? prog.tauxReussite + '%' : '—',
                sub:      'startups actives',
                delta:    '+3%',
                color:    'text-purple-600 dark:text-purple-400',
                bg:       'bg-purple-50 dark:bg-purple-900/20',
                delay:    '0.2s',
              },
            ].map((s, i) => (
              <div
                key={i}
                className="stat-card glass-card rounded-2xl p-5 animate-scale-in dark:!bg-[#1e293b]"
                style={{ animationDelay: s.delay }}
              >
                <p className={`text-sm font-medium mb-1 ${s.color}`}>{s.label}</p>
                <p className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{s.sub}</span>
                  {s.delta && (
                    <span className="flex items-center gap-0.5 text-green-500 font-semibold">
                      {Icons.trend_up} {s.delta}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── TABS + CONTENU ──────────────────────────────────────── */}
          <div className="glass-card rounded-2xl overflow-hidden dark:!bg-[#1e293b]">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.id === 'ia' && (
                    <span className="inline-flex items-center gap-1.5">
                      {Icons.sparkle}
                      {tab.label}
                      {iaTriggered && <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>}
                    </span>
                  )}
                  {tab.id !== 'ia' && tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* ══ TAB : VUE D'ENSEMBLE ══════════════════════════════ */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Graphique progression */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Progression du Programme</h3>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded"></span>Candidatures</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-500 inline-block rounded"></span>Startups</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded border-dashed border-t border-amber-400"></span>KPI</span>
                        </div>
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        <LineChart data={prog.progression} width={400} height={180} />
                      </div>
                    </div>

                    {/* Répartition sectorielle */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Répartition Sectorielle</h3>
                      <div className="flex items-center gap-6">
                        <div className="flex-shrink-0">
                          <DonutChart data={prog.secteurs} size={140} />
                        </div>
                        <div className="flex-1 space-y-2">
                          {prog.secteurs.map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }}></span>
                                <span className="text-gray-700 dark:text-gray-300">{s.nom}</span>
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white mono">{s.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Infos clés */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Quota',        value: prog.quota ? `${prog.quota} places` : 'Illimité' },
                      { label: 'Secteur',      value: prog.sector },
                      { label: 'Statut',       value: getStatusLabel(prog.status) },
                      { label: 'Durée',        value: (() => {
                          const d = Math.round((new Date(prog.dateFin) - new Date(prog.dateDebut)) / (1000*60*60*24*30));
                          return `${d} mois`;
                        })()
                      },
                    ].map((info, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{info.label}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{info.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ TAB : CANDIDATURES ════════════════════════════════ */}
              {activeTab === 'candidatures' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Bar chart statuts */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Répartition par statut</h3>
                      <div className="text-gray-600 dark:text-gray-300">
                        <HBarChart data={prog.candidaturesData} width={300} barHeight={22} />
                      </div>
                    </div>

                    {/* Métriques */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Métriques clés</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Taux d\'acceptation',  value: prog.candidatures > 0 ? Math.round((prog.startups / prog.candidatures) * 100) + '%' : '—', color: 'text-green-600 dark:text-green-400' },
                          { label: 'Taux de rejet',        value: prog.candidatures > 0 ? Math.round(((prog.candidaturesData.find(d=>d.statut==='Rejetées')?.count||0)/prog.candidatures)*100)+'%' : '—', color: 'text-red-500' },
                          { label: 'En cours de révision', value: prog.candidaturesData.find(d=>d.statut==='En révision')?.count || 0, color: 'text-amber-600 dark:text-amber-400' },
                          { label: 'Total candidatures',   value: prog.candidatures, color: 'text-blue-600 dark:text-blue-400' },
                        ].map((m, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{m.label}</span>
                            <span className={`text-sm font-bold mono ${m.color}`}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Donut candidatures */}
                  <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Vue circulaire</h3>
                    <div className="flex items-center gap-8 flex-wrap">
                      <DonutChart data={prog.candidaturesData.map(d => ({ nom: d.statut, pct: d.count, color: d.color }))} size={120} />
                      <div className="space-y-2">
                        {prog.candidaturesData.map((d, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }}></span>
                            <span className="text-gray-700 dark:text-gray-300">{d.statut}</span>
                            <span className="font-bold mono text-gray-900 dark:text-white">{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ TAB : STARTUPS ════════════════════════════════════ */}
              {activeTab === 'startups' && (
                <div className="animate-fade-in">
                  {prog.topStartups.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p className="text-sm font-medium">Aucune startup incubée pour l'instant</p>
                      <p className="text-xs mt-1">Les startups apparaîtront ici une fois acceptées.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Top startups — {prog.titre}
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                              {['Startup', 'Secteur', 'Score', 'Financement', 'Statut'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {prog.topStartups.map((s, i) => (
                              <tr key={i} className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-900/10'}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: sectorColor }}>
                                      {s.nom.slice(0,2).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.nom}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                    {s.secteur}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${s.score >= 85 ? 'bg-green-500' : s.score >= 70 ? 'bg-amber-500' : 'bg-red-400'}`}
                                        style={{ width: `${s.score}%` }}
                                      ></div>
                                    </div>
                                    <span className={`text-xs font-bold mono ${s.score >= 85 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                      {s.score}/100
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white mono">
                                  {s.financement.toLocaleString('fr-FR')} DT
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                    s.statut === 'Incubée' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    s.statut === 'Graduée' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  }`}>
                                    {s.statut}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Résumé financement */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {[
                          { label: 'Total financé',    value: prog.financement.toLocaleString('fr-FR') + ' DT', color: 'text-green-600 dark:text-green-400' },
                          { label: 'Moy. par startup', value: prog.startups > 0 ? Math.round(prog.financement / prog.startups).toLocaleString('fr-FR') + ' DT' : '—', color: 'text-amber-600 dark:text-amber-400' },
                          { label: 'Startups totales', value: prog.startups, color: 'text-blue-600 dark:text-blue-400' },
                        ].map((info, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{info.label}</p>
                            <p className={`text-lg font-bold mono ${info.color}`}>{info.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ TAB : ANALYSE IA ══════════════════════════════════ */}
              {activeTab === 'ia' && (
                <div className="animate-fade-in">
                  {!iaTriggered ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                        {Icons.ia}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                        Analyse IA non encore lancée
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                        Cliquez sur "Analyser avec IA" pour générer des insights automatiques sur ce programme.
                      </p>
                      <button
                        onClick={handleAnalyseIA}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                      >
                        {Icons.ia} Lancer l'analyse
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                          {Icons.sparkle}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {prog.iaInsights.length} insights générés pour <span className="text-primary-600 dark:text-primary-400">{prog.titre}</span>
                        </p>
                      </div>

                      {prog.iaInsights.map((insight, i) => (
                        <div
                          key={i}
                          className={`rounded-xl p-4 border flex items-start gap-3 animate-scale-in ${
                            insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' :
                            insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' :
                            'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50'
                          }`}
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            insight.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                            insight.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}>
                            {insight.type === 'success' ? Icons.check : insight.type === 'warning' ? Icons.warning : Icons.info}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold mb-1 ${
                              insight.type === 'success' ? 'text-green-800 dark:text-green-300' :
                              insight.type === 'warning' ? 'text-amber-800 dark:text-amber-300' :
                              'text-blue-800 dark:text-blue-300'
                            }`}>{insight.titre}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{insight.detail}</p>
                          </div>
                        </div>
                      ))}

                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Insights générés par l'algorithme MEDIANET IA · Basé sur les données de {prog.candidatures} candidatures
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}