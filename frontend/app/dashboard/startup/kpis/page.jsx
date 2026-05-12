'use client';

// /app/dashboard/startup/kpis/page.jsx
// KPIs & Performance — Mode Fondateur uniquement
// ✅ Données réelles depuis GET /api/startup/kpis + GET /api/startup/me

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

const BASE     = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE = `${BASE}/api`;

// ─── Icons ─────────────────────────────────────────────────────────────────
const Ic = {
  trend:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  users:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  chart:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  download: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  rocket:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  refresh:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  timeIc:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  plus:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  check:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  x:        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
};

const TIMEFRAME_LABELS = { week: 'Semaine', month: 'Mois', quarter: 'Trimestre', year: 'Année' };

const METRIC_CONFIG = {
  revenue:  { label: 'Revenue (TND)',       color: '#0088ba', unit: 'TND', icon: 'trend',    bgClass: 'bg-blue-100 dark:bg-blue-900/30',    iconClass: 'text-blue-600 dark:text-blue-400'     },
  mrr:      { label: 'MRR (TND)',           color: '#6366f1', unit: 'TND', icon: 'chart',    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30', iconClass: 'text-indigo-600 dark:text-indigo-400' },
  users:    { label: 'Utilisateurs actifs', color: '#10b981', unit: '',    icon: 'users',    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',iconClass: 'text-emerald-600 dark:text-emerald-400'},
  teamSize: { label: 'Taille équipe',       color: '#f59e0b', unit: '',    icon: 'calendar', bgClass: 'bg-amber-100 dark:bg-amber-900/30',   iconClass: 'text-amber-600 dark:text-amber-400'   },
};

// ─── Tooltip recharts ──────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-white">{p.value?.toLocaleString('fr-FR')}</span>
        </div>
      ))}
    </div>
  );
};

const Skeleton = ({ h = 'h-32', className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl ${h} ${className}`} />
);

// ─── Écran vide ────────────────────────────────────────────────────────────
function EmptyKPIs({ onAdd }) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(0,136,186,0.1)' }}>
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Aucun KPI enregistré</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
        Commencez à suivre vos performances en ajoutant votre premier rapport mensuel.
      </p>
      <button onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
        style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
        {Ic.plus} Ajouter mon premier KPI
      </button>
    </div>
  );
}

// ─── Écran verrouillé ──────────────────────────────────────────────────────
function LockedKPIs() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center text-gray-400"
        style={{ background: 'rgba(0,82,110,.08)' }}>
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Fonctionnalité Fondateur</h2>
      <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
        Le tableau de bord KPIs est disponible uniquement après qu'au moins une de vos candidatures
        a été acceptée dans un programme MEDIANET.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/startup/apply"
          className="flex items-center gap-2 justify-center px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
          {Ic.rocket} Déposer une candidature
        </Link>
        <Link href="/dashboard/startup/dashboard"
          className="flex items-center gap-2 justify-center px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 font-semibold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

// ─── Modal Ajout/Mise à jour KPI — CORRIGÉ ────────────────────────────────
// FIX: Remplacement de glass-card (rgba semi-transparent) par un fond opaque solide
//      pour éviter l'effet de transparence causé par le backdrop-filter de l'overlay.
function AddKPIModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ month: '', revenue: '', mrr: '', users: '', teamSize: '', note: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    // OVERLAY : z-[9999] pour être au-dessus de tout, fond sombre opaque
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* MODAL : fond blanc/dark solide et opaque — plus de glass-card ici */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--modal-bg, #ffffff)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Barre colorée en haut */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#00526e,#0088ba)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h3 className="font-bold text-gray-900" style={{ fontSize: '15px' }}>
            Ajouter / Mettre à jour KPI
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {Ic.x}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4" style={{ backgroundColor: '#ffffff' }}>
          {/* Champ Mois */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Mois <span className="text-red-400">*</span>
            </label>
            <input
              type="month"
              value={form.month}
              onChange={e => set('month', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm text-gray-900 transition-colors"
              style={{
                border: '1.5px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = '#0088ba')}
              onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Grille 2×2 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'revenue',  label: 'Revenue (TND)',       placeholder: 'ex: 45000' },
              { key: 'mrr',      label: 'MRR (TND)',           placeholder: 'ex: 9000'  },
              { key: 'users',    label: 'Utilisateurs actifs', placeholder: 'ex: 500'   },
              { key: 'teamSize', label: 'Taille équipe',       placeholder: 'ex: 5'     },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-900 transition-colors"
                  style={{
                    border: '1.5px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#0088ba')}
                  onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
            ))}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Note <span className="text-gray-300">(optionnel)</span>
            </label>
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              rows={2}
              placeholder="Commentaire sur ce mois..."
              className="w-full px-3 py-2 rounded-xl text-sm text-gray-900 resize-none transition-colors"
              style={{
                border: '1.5px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = '#0088ba')}
              onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 pb-6"
          style={{ backgroundColor: '#ffffff' }}
        >
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 transition-colors"
            style={{ border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc' }}
            onMouseEnter={e => (e.target.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={e => (e.target.style.backgroundColor = '#f8fafc')}
          >
            Annuler
          </button>
          <button
            onClick={() => onSave({
              month:    form.month,
              revenue:  form.revenue  ? Number(form.revenue)  : undefined,
              mrr:      form.mrr      ? Number(form.mrr)      : undefined,
              users:    form.users    ? Number(form.users)    : undefined,
              teamSize: form.teamSize ? Number(form.teamSize) : undefined,
              note:     form.note     || undefined,
            })}
            disabled={!form.month || saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}
          >
            {saving
              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              : Ic.check}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* CSS pour le mode sombre */}
      <style jsx global>{`
        @media (prefers-color-scheme: dark) {
          :root { --modal-bg: #1e293b; }
        }
        .dark { --modal-bg: #1e293b; }
        .dark [data-modal-body] {
          background-color: #1e293b !important;
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function StartupKPIsPage() {
  const { user, accessToken } = useSelector(s => s.auth);

  const [mounted,        setMounted]        = useState(false);
  const [time,           setTime]           = useState(new Date());
  const [timeframe,      setTimeframe]      = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [loading,        setLoading]        = useState(true);
  const [kpis,           setKpis]           = useState([]);
  const [error,          setError]          = useState(null);
  const [showModal,      setShowModal]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [toast,          setToast]          = useState(null);

  const isFounder = user?.isFounder === true;

  // ── Horloge ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch KPIs ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !isFounder) { setLoading(false); return; }

    const headers = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/startup/kpis`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then(json => {
        setKpis(json.kpis ?? []);
      })
      .catch(err => {
        console.error('[KPIs fetch]', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [accessToken, isFounder]);

  // ── Sauvegarder KPI ────────────────────────────────────────────────────────
  const handleSaveKPI = async (data) => {
    if (!data.month) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/startup/kpis`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setKpis(json.kpis ?? []);
      setShowModal(false);
      showToast('✅ KPI enregistré avec succès !', 'success');
    } catch (err) {
      console.error('[saveKPI]', err);
      showToast(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  if (!mounted) return null;

  // ── Données graphique ──────────────────────────────────────────────────────
  const sortedKpis = [...kpis].sort((a, b) => (a.month ?? '').localeCompare(b.month ?? ''));
  const last6      = sortedKpis.slice(-6);
  const lastKpi    = sortedKpis[sortedKpis.length - 1];

  const chartData  = last6.map(k => ({
    month: k.month ?? '',
    value: k[selectedMetric] ?? 0,
  }));

  const allValues  = chartData.map(d => d.value).filter(v => v > 0);
  const currentVal = allValues[allValues.length - 1] ?? 0;
  const prevVal    = allValues[allValues.length - 2] ?? 0;
  const growth     = prevVal > 0 ? Math.round(((currentVal - prevVal) / prevVal) * 100) : 0;
  const avgVal     = allValues.length ? Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length) : 0;
  const maxVal     = allValues.length ? Math.max(...allValues) : 0;
  const projYear   = Math.round(currentVal * 1.2 * 2);

  const cfg        = METRIC_CONFIG[selectedMetric] ?? METRIC_CONFIG.revenue;

  return (
    <ProtectedRoute allowedRoles={['startup']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Space Grotesk', sans-serif; }
          .mono { font-family: 'JetBrains Mono', monospace; }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .fade-up   { animation: fadeUp 0.5s ease-out forwards; }
          .fade-up-1 { animation: fadeUp 0.5s 0.05s ease-out both; }
          .fade-up-2 { animation: fadeUp 0.5s 0.10s ease-out both; }
          .fade-up-3 { animation: fadeUp 0.5s 0.15s ease-out both; }
          .fade-up-4 { animation: fadeUp 0.5s 0.20s ease-out both; }
          .glass-card {
            background: rgba(255,255,255,0.96);
            border: 1px solid rgba(0,0,0,0.05);
            backdrop-filter: blur(12px);
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          }
          :global(.dark) .glass-card { background:#1e293b; border-color:#334155; }
          .metric-tab { padding:8px 16px; border-radius:10px; font-size:12px; font-weight:600; cursor:pointer; border:0.5px solid; transition:all 0.15s; display:flex; align-items:center; gap:7px; }
          .metric-tab.active { color:#fff; border-color:transparent; }
          .metric-tab:not(.active) { color:#64748b; background:rgba(255,255,255,.96); border-color:rgba(0,0,0,.06); }
          :global(.dark) .metric-tab:not(.active) { background:#1e293b; border-color:#334155; color:#94a3b8; }
          .kpi-card { cursor:pointer; transition:all 0.2s; }
          .kpi-card.active-kpi { box-shadow:0 0 0 2px var(--kpi-color); }
          .kpi-card:not(.active-kpi):hover { transform:translateY(-2px); }
          .tab-btn { padding:5px 13px; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer; border:none; background:transparent; transition:all 0.15s; }
          .tab-btn.active { background:rgba(255,255,255,.18); color:#fff; }
          .tab-btn:not(.active) { color:rgba(255,255,255,.6); }
          .tab-btn:not(.active):hover { color:rgba(255,255,255,.9); }
          .prog-bar { border-radius:4px; transition:width 0.8s ease; }
        `}</style>

        {/* ── MODAL — rendu hors du flux normal via portal-like fixed positioning ── */}
        {showModal && (
          <AddKPIModal
            onClose={() => setShowModal(false)}
            onSave={handleSaveKPI}
            saving={saving}
          />
        )}

        {/* ── TOAST ── */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[10000] px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg transition-all
            ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
            {toast.msg}
          </div>
        )}

        <div className="space-y-5 min-h-screen pb-10">

          {/* ── HEADER ── */}
          <div className="relative overflow-hidden rounded-2xl p-8 fade-up"
            style={{ background: 'linear-gradient(135deg,#003d52 0%,#00526e 40%,#006d94 70%,#0088ba 100%)' }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px)' }} />
            <div className="absolute top-0 right-32 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle,#00a3e0,transparent)' }} />

            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-white/90 tracking-widest mb-3">
                  KEY PERFORMANCE INDICATORS
                </span>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-1">KPIs & Performance</h1>
                <p className="text-blue-200 text-sm max-w-xl">
                  {user?.name ?? 'Startup'} · Programme MEDIANET Incubation 2026
                </p>
                <div className="flex items-center gap-4 mt-4 text-blue-200/70 text-xs">
                  <span className="flex items-center gap-1.5">
                    {Ic.timeIc}
                    <span className="mono">{time.toLocaleTimeString('fr-FR')}</span>
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                  <span>{time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  {kpis.length > 0 && (
                    <>
                      <span className="w-px h-3 bg-white/20" />
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        {kpis.length} rapport{kpis.length > 1 ? 's' : ''} enregistré{kpis.length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {isFounder && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex bg-black/25 rounded-lg p-1 gap-1">
                    {Object.entries(TIMEFRAME_LABELS).map(([key, label]) => (
                      <button key={key} onClick={() => setTimeframe(key)}
                        className={`tab-btn ${timeframe === key ? 'active' : ''}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-white text-xs font-semibold transition-all">
                    {Ic.plus} Ajouter KPI
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-semibold transition-all">
                    {Ic.download} Exporter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── CONTENU CONDITIONNEL ── */}
          {!isFounder ? (
            <div className="glass-card rounded-2xl"><LockedKPIs /></div>

          ) : loading ? (
            <div className="grid grid-cols-1 gap-4">
              <Skeleton h="h-24" />
              <Skeleton h="h-64" />
              <Skeleton h="h-48" />
            </div>

          ) : error ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-red-500 font-semibold mb-2">Erreur de chargement</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                Réessayer
              </button>
            </div>

          ) : kpis.length === 0 ? (
            <EmptyKPIs onAdd={() => setShowModal(true)} />

          ) : (
            <>
              {/* ── SÉLECTEUR MÉTRIQUE ── */}
              <div className="flex flex-wrap gap-2 fade-up-1">
                {Object.entries(METRIC_CONFIG).map(([key, m]) => (
                  <button key={key} onClick={() => setSelectedMetric(key)}
                    className={`metric-tab ${selectedMetric === key ? 'active' : ''}`}
                    style={selectedMetric === key ? { background: m.color } : {}}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: m.color, opacity: selectedMetric === key ? 1 : 0.6 }} />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* ── KPI CARDS ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up-1">
                {Object.entries(METRIC_CONFIG).map(([key, m]) => {
                  const val      = lastKpi?.[key];
                  const prevKpi  = sortedKpis[sortedKpis.length - 2];
                  const prevVal2 = prevKpi?.[key];
                  const isActive = key === selectedMetric;
                  if (val === undefined || val === null) return null;
                  const g = (prevVal2 && prevVal2 > 0) ? Math.round(((val - prevVal2) / prevVal2) * 100) : null;
                  return (
                    <div key={key} onClick={() => setSelectedMetric(key)}
                      className={`kpi-card glass-card rounded-2xl p-5 ${isActive ? 'active-kpi' : ''}`}
                      style={{ '--kpi-color': m.color }}>
                      <div className="h-1 -mx-5 -mt-5 mb-4 rounded-t-2xl"
                        style={{ background: isActive ? m.color : 'transparent' }} />
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.bgClass}`}>
                          <span className={m.iconClass}>
                            {m.icon === 'trend' ? Ic.trend : m.icon === 'users' ? Ic.users : m.icon === 'chart' ? Ic.chart : Ic.calendar}
                          </span>
                        </div>
                        {g !== null && (
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                            ${g >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                     : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                            {g >= 0 ? '↑' : '↓'} {Math.abs(g)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
                      <p className="text-xl font-bold mono" style={{ color: isActive ? m.color : undefined }}>
                        {new Intl.NumberFormat('fr-FR').format(val)}{m.unit ? ` ${m.unit}` : ''}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">{lastKpi?.month}</p>
                    </div>
                  );
                })}
              </div>

              {/* ── GRAPHIQUE PRINCIPAL + SIDEBAR ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 fade-up-2">

                {/* Graphique */}
                <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {cfg.label} — Évolution mensuelle
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {last6.length} dernier{last6.length > 1 ? 's' : ''} mois · données réelles
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="p-6">
                    {chartData.every(d => d.value === 0) ? (
                      <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10"/>
                        </svg>
                        <p className="text-sm">Aucune donnée pour "{cfg.label}"</p>
                        <button onClick={() => setShowModal(true)}
                          className="text-xs px-3 py-1.5 rounded-lg text-white"
                          style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                          Ajouter des données
                        </button>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad_${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={cfg.color} stopOpacity={0}   />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="value" name={cfg.label}
                            stroke={cfg.color} fill={`url(#grad_${selectedMetric})`}
                            strokeWidth={2.5} dot={{ r: 4, fill: cfg.color }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}

                    {/* Stats résumé */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                      {[
                        { label: 'Valeur actuelle',   value: `${new Intl.NumberFormat('fr-FR').format(currentVal)}${cfg.unit ? ` ${cfg.unit}` : ''}` },
                        { label: 'Croissance M/M',    value: `${growth >= 0 ? '+' : ''}${growth}%`, color: growth >= 0 ? '#10b981' : '#ef4444' },
                        { label: 'Moyenne mensuelle', value: `${new Intl.NumberFormat('fr-FR').format(avgVal)}${cfg.unit ? ` ${cfg.unit}` : ''}` },
                        { label: 'Meilleur mois',     value: `${new Intl.NumberFormat('fr-FR').format(maxVal)}${cfg.unit ? ` ${cfg.unit}` : ''}`, color: cfg.color },
                      ].map((s, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
                          <p className="text-base font-bold mono" style={{ color: s.color }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-5">

                  {/* Projection */}
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Projection fin 2026</h3>
                    <p className="text-2xl font-bold mono mb-1" style={{ color: cfg.color }}>
                      {new Intl.NumberFormat('fr-FR').format(projYear)}{cfg.unit ? ` ${cfg.unit}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      Basée sur la croissance actuelle ({growth >= 0 ? '+' : ''}{growth}%/mois)
                    </p>
                    <div className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-semibold
                      ${growth >= 10 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                       : growth >= 0  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                       :                'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {growth >= 10 ? '✅ Excellente croissance'
                       : growth >= 0  ? '⚠️ Croissance modérée'
                       :                '❗ Tendance négative'}
                    </div>
                  </div>

                  {/* Historique */}
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Historique</h3>
                      <span className="text-xs text-gray-400">{kpis.length} entrée{kpis.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-56 overflow-y-auto">
                      {[...sortedKpis].reverse().map((k, i) => {
                        const val = k[selectedMetric];
                        return (
                          <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div>
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mono">{k.month}</p>
                              {k.note && <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-28">{k.note}</p>}
                            </div>
                            <p className="text-sm font-bold mono" style={{ color: cfg.color }}>
                              {val !== undefined && val !== null
                                ? `${new Intl.NumberFormat('fr-FR').format(val)}${cfg.unit ? ` ${cfg.unit}` : ''}`
                                : '—'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bouton ajout */}
                  <button onClick={() => setShowModal(true)}
                    className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all w-full text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                      {Ic.plus}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Nouveau rapport mensuel</p>
                      <p className="text-xs text-gray-400">Ajouter les KPIs du mois</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── VUE D'ENSEMBLE ── */}
              <div className="glass-card rounded-2xl overflow-hidden fade-up-3">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Dernier rapport — {lastKpi?.month}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Toutes les métriques</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Données réelles
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(METRIC_CONFIG).map(([key, m]) => {
                      const val  = lastKpi?.[key];
                      const prev = sortedKpis[sortedKpis.length - 2]?.[key];
                      if (val === undefined || val === null) return null;
                      const pct = (prev && prev > 0) ? Math.min(200, Math.round((val / prev) * 100)) : null;
                      return (
                        <div key={key} onClick={() => setSelectedMetric(key)} className="cursor-pointer group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                              {m.label}
                            </span>
                            <span className="text-xs font-bold mono" style={{ color: m.color }}>
                              {new Intl.NumberFormat('fr-FR').format(val)}{m.unit ? ` ${m.unit}` : ''}
                            </span>
                          </div>
                          {pct !== null && (
                            <>
                              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                                <div className="prog-bar h-full" style={{ width: `${Math.min(100, pct)}%`, background: m.color }} />
                              </div>
                              <p className="text-[10px] text-gray-400">vs mois précédent : {pct}%</p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── ACTIONS ── */}
              <div className="flex justify-end gap-3 fade-up-4">
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                  {Ic.plus} Nouveau KPI
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)' }}>
                  {Ic.download} Exporter les données
                </button>
              </div>
            </>
          )}

          {/* ── FOOTER ── */}
          <div className="relative overflow-hidden rounded-2xl p-6 fade-up"
            style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 10px)' }} />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
                  {Ic.chart}
                </div>
                <div>
                  <h3 className="text-white font-bold">MEDIANET Analytics</h3>
                  <p className="text-white/50 text-xs">
                    Données réelles · {kpis.length} rapport{kpis.length > 1 ? 's' : ''} enregistré{kpis.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { value: '99.9%', label: 'Uptime'   },
                  { value: 'LIVE',  label: 'Données'  },
                  { value: 'SSL',   label: 'Sécurisé' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-white font-bold text-base mono">{s.value}</p>
                    <p className="text-white/40 text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}