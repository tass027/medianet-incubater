'use client';

import { useState } from 'react';
import Modal from '@/app/components/common/Modal';

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE DATA
// ─────────────────────────────────────────────────────────────────────────────
const FORMATION_TYPES = [
  { id: 'onboarding',         label: 'Onboarding',          color: '#0284c7' },
  { id: 'monthly_report',     label: 'Rapport mensuel',     color: '#0891b2' },
  { id: 'kpi_update',         label: 'Mise à jour KPIs',    color: '#0d9488' },
  { id: 'mentoring_feedback', label: 'Feedback mentoring',  color: '#7c3aed' },
  { id: 'investor_readiness', label: 'Investor Readiness',  color: '#b45309' },
  { id: 'custom',             label: 'Personnalisée',       color: '#475569' },
];

const WORKSHOP_CATEGORIES = [
  { id: 'pitching',    label: 'Pitching & Demo',      color: '#0284c7' },
  { id: 'finance',     label: 'Finance & Modelling',  color: '#059669' },
  { id: 'marketing',   label: 'Growth & Marketing',   color: '#d97706' },
  { id: 'tech',        label: 'Tech & Product',       color: '#7c3aed' },
  { id: 'legal',       label: 'Legal & Compliance',   color: '#dc2626' },
  { id: 'fundraising', label: 'Fundraising',          color: '#0891b2' },
  { id: 'operations',  label: 'Opérations & Scaling', color: '#475569' },
];

const MOCK_SPEAKERS = [
  { id: 'sp-1', name: 'Karim Oueslati', role: 'Sawari Ventures',    initials: 'KO' },
  { id: 'sp-2', name: 'Amira Hamdani',  role: 'Finance & Strategy', initials: 'AH' },
  { id: 'sp-3', name: 'Rania Souissi',  role: 'Growth Advisor',     initials: 'RS' },
  { id: 'sp-4', name: 'Yassine Khelif', role: 'CTO Mentor',         initials: 'YK' },
  { id: 'sp-5', name: 'Sonia Trabelsi', role: 'Legal Expert',       initials: 'ST' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS — zero emojis
// ─────────────────────────────────────────────────────────────────────────────
const Ic = {
  formation:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h12v2H4zM4 9h8M4 13h6M13 11l2 2 3-3"/></svg>,
  workshop:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="2.5"/><circle cx="14" cy="6" r="2.5"/><path d="M2 17c0-2.761 2.239-5 5-5h1M11 12h1c2.761 0 5 2.239 5 5"/></svg>,
  plus:        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>,
  calendar:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2v4M13 2v4"/></svg>,
  clock:       <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 2.5"/></svg>,
  users:       <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 12c1.657 0 3 1.343 3 3v1H3v-1c0-1.657 1.343-3 3-3"/><circle cx="10" cy="7" r="3"/></svg>,
  globe:       <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><path d="M10 3c-2 2-3 4.5-3 7s1 5 3 7M10 3c2 2 3 4.5 3 7s-1 5-3 7M3 10h14"/></svg>,
  location:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/></svg>,
  trash:       <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h14M8 5V3h4v2M6 5l1 11h6l1-11"/></svg>,
  send:        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3L3 9l6 2 2 6 6-14z"/></svg>,
  check:       <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l5 5 7-8"/></svg>,
  chevronDown: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 5 5-5"/></svg>,
  x:           <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>,
  target:      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3"/><path d="M10 3v2M10 15v2M3 10h2M15 10h2"/></svg>,
  filter:      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h14M6 10h8M9 15h2"/></svg>,
  copy:        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="9" height="9" rx="1.5"/><path d="M4 13V5a2 2 0 012-2h8"/></svg>,
};

const iCls = 'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
const lCls = 'block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5';

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    active:   { l: 'Actif',     c: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800', dot: 'bg-emerald-500' },
    closed:   { l: 'Clôturé',   c: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
    draft:    { l: 'Brouillon', c: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
    upcoming: { l: 'À venir',   c: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800' },
    live:     { l: 'En direct', c: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800', dot: 'bg-rose-500 animate-pulse' },
    done:     { l: 'Terminé',   c: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  };
  const { l, c, dot } = cfg[status] || cfg.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border rounded-full flex-shrink-0 ${c}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {l}
    </span>
  );
}

function ProgressArc({ value, total, color = '#0284c7', size = 52 }) {
  const r = 20; const circ = 2 * Math.PI * r;
  const offset = circ * (1 - (total > 0 ? value / total : 0));
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-gray-800" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{value}</span>
        <span className="text-[9px] text-gray-400 leading-none">/{total}</span>
      </div>
    </div>
  );
}

function TypeBar({ typeId }) {
  const t = FORMATION_TYPES.find(x => x.id === typeId);
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: t?.color || '#64748b' }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t?.color || '#64748b' }} />
      {t?.label || typeId}
    </span>
  );
}

function SpeakerAvatar({ speaker }) {
  const colors = ['#0284c7', '#7c3aed', '#059669', '#d97706', '#dc2626'];
  const sp = MOCK_SPEAKERS.find(s => s.id === speaker || s.name === speaker);
  if (!sp) return (
    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-[10px] font-semibold flex-shrink-0">
      {(speaker || '?').slice(0, 2).toUpperCase()}
    </div>
  );
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
      style={{ background: colors[MOCK_SPEAKERS.indexOf(sp) % colors.length] }}
      title={`${sp.name} · ${sp.role}`}>{sp.initials}</div>
  );
}

function StatsBar({ items, isFormation }) {
  const stats = isFormation ? [
    { l: 'Total',           v: items.length },
    { l: 'Actives',         v: items.filter(i => i.status === 'active').length },
    { l: 'Taux de réponse', v: `${items.length ? Math.round(items.reduce((a, i) => a + (i.total > 0 ? i.responses / i.total * 100 : 0), 0) / items.length) : 0}%` },
  ] : [
    { l: 'Total',    v: items.length },
    { l: 'À venir',  v: items.filter(i => i.status === 'upcoming').length },
    { l: 'Inscrits', v: items.reduce((a, i) => a + i.enrolled, 0) },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {stats.map(s => (
        <div key={s.l} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{s.v}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-0.5">{s.l}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATION CARD
// ─────────────────────────────────────────────────────────────────────────────
function FormationCard({ item, onDelete, onDuplicate }) {
  const [exp, setExp] = useState(false);
  const t = FORMATION_TYPES.find(x => x.id === item.type);
  const pct = item.total > 0 ? (item.responses / item.total) * 100 : 0;
  return (
    <div className="group relative border border-gray-200 dark:border-gray-700/80 rounded-xl bg-white dark:bg-gray-900 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: t?.color || '#94a3b8' }} />
      <div className="pl-4 pr-4 py-4">
        <div className="flex items-start gap-4">
          <ProgressArc value={item.responses} total={item.total} color={t?.color || '#94a3b8'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug truncate pr-2">{item.title}</h4>
              <StatusPill status={item.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <TypeBar typeId={item.type} />
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-3.5 h-3.5 opacity-60">{Ic.target}</span>{item.targetLabel}
              </span>
              {item.deadline && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-3.5 h-3.5 opacity-60">{Ic.calendar}</span>
                  {new Date(item.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            {item.description && exp && (
              <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-2.5">{item.description}</p>
            )}
          </div>
        </div>
        <div className="mt-3 ml-[68px]">
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 font-medium">
            <span>{item.responses} réponses reçues</span><span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: t?.color || '#94a3b8' }} />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 bg-gray-50/60 dark:bg-gray-800/30 flex items-center justify-between">
        <button onClick={() => setExp(x => !x)} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors">
          <span className={`w-3.5 h-3.5 transition-transform ${exp ? 'rotate-180' : ''}`}>{Ic.chevronDown}</span>
          {exp ? 'Réduire' : 'Voir détails'}
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onDuplicate(item)} title="Dupliquer" className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all">
            <span className="w-4 h-4 block">{Ic.copy}</span>
          </button>
          <button onClick={() => onDelete(item.id)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all">
            <span className="w-4 h-4 block">{Ic.trash}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKSHOP CARD
// ─────────────────────────────────────────────────────────────────────────────
function WorkshopCard({ item, onDelete, onDuplicate }) {
  const [exp, setExp] = useState(false);
  const cat  = WORKSHOP_CATEGORIES.find(c => c.id === item.category);
  const pct  = item.capacity > 0 ? Math.round((item.enrolled / item.capacity) * 100) : 0;
  const full = pct >= 100;
  return (
    <div className="group relative border border-gray-200 dark:border-gray-700/80 rounded-xl bg-white dark:bg-gray-900 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-sm">
      <div className="h-[3px] w-full" style={{ background: cat?.color || '#94a3b8' }} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white" style={{ background: cat?.color || '#94a3b8' }}>
            <span className="w-5 h-5 block">{Ic.workshop}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">{item.title}</h4>
              <StatusPill status={item.status} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: cat?.color }}>{cat?.label}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 opacity-50">{Ic.calendar}</span>{item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 opacity-50">{Ic.clock}</span>{item.time || '—'} · {item.duration}min</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 opacity-50">{item.online ? Ic.globe : Ic.location}</span>{item.online ? 'En ligne' : 'Présentiel'}</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 opacity-50">{Ic.target}</span>{item.targetLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SpeakerAvatar speaker={item.speaker} />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-none">{item.speaker || 'Intervenant non défini'}</p>
              {item.speaker && <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{MOCK_SPEAKERS.find(s => s.id === item.speaker || s.name === item.speaker)?.role || ''}</p>}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-1.5 justify-end mb-1">
              <span className="w-3.5 h-3.5 text-gray-400 opacity-70">{Ic.users}</span>
              <span className={`text-xs font-semibold ${full ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>{item.enrolled}/{item.capacity}</span>
            </div>
            <div className="w-24 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: full ? '#dc2626' : cat?.color || '#94a3b8' }} />
            </div>
          </div>
        </div>
        {item.description && exp && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">{item.description}</p>
        )}
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 bg-gray-50/60 dark:bg-gray-800/30 flex items-center justify-between">
        <button onClick={() => setExp(x => !x)} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors">
          <span className={`w-3.5 h-3.5 transition-transform ${exp ? 'rotate-180' : ''}`}>{Ic.chevronDown}</span>
          {exp ? 'Réduire' : 'Description'}
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onDuplicate(item)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"><span className="w-4 h-4 block">{Ic.copy}</span></button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"><span className="w-4 h-4 block">{Ic.trash}</span></button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE FORMATION FORM
// ─────────────────────────────────────────────────────────────────────────────
function CreateFormationForm({ startups, uniqueProgs, onSubmit, onCancel }) {
  const [data, setData] = useState({ type: 'monthly_report', title: '', target: 'all', targetId: '', deadline: '', description: '', sendReminder: false });
  const s = (k, v) => setData(p => ({ ...p, [k]: v }));
  const count = data.target === 'all' ? startups.length : data.target === 'programme' ? startups.filter(x => x.programmeName === data.targetId).length : data.targetId ? 1 : 0;
  const ok = data.title && (data.target === 'all' || data.targetId);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Nouvelle formation</span>
        <button onClick={onCancel} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"><span className="w-4 h-4 block">{Ic.x}</span></button>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lCls}>Type</label><select value={data.type} onChange={e => s('type', e.target.value)} className={iCls}>{FORMATION_TYPES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
          <div><label className={lCls}>Titre <span className="text-red-400 normal-case tracking-normal">*</span></label><input value={data.title} onChange={e => s('title', e.target.value)} placeholder="Ex. Rapport Mensuel Avril 2025" className={iCls} /></div>
        </div>
        <div>
          <label className={lCls}>Destinataires</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: 'all', l: 'Toutes les startups' }, { v: 'programme', l: 'Par programme' }, { v: 'startup', l: 'Startup spécifique' }].map(o => (
              <button key={o.v} onClick={() => s('target', o.v)} className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center gap-2 ${data.target === o.v ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <span className="w-3.5 h-3.5 flex-shrink-0">{data.target === o.v ? Ic.check : Ic.target}</span>{o.l}
              </button>
            ))}
          </div>
        </div>
        {data.target === 'programme' && <div><label className={lCls}>Programme cible</label><select value={data.targetId} onChange={e => s('targetId', e.target.value)} className={iCls}><option value="">— Sélectionner —</option>{uniqueProgs.map(p => <option key={p} value={p}>{p}</option>)}</select></div>}
        {data.target === 'startup'   && <div><label className={lCls}>Startup cible</label><select value={data.targetId} onChange={e => s('targetId', e.target.value)} className={iCls}><option value="">— Sélectionner —</option>{startups.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lCls}>Date limite</label><input type="date" value={data.deadline} onChange={e => s('deadline', e.target.value)} className={iCls} /></div>
          <div className="flex flex-col justify-end pb-0.5">
            <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => s('sendReminder', !data.sendReminder)}>
              <div className={`w-9 h-5 rounded-full border relative flex-shrink-0 transition-all ${data.sendReminder ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-700'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${data.sendReminder ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Rappel automatique</span>
            </div>
          </div>
        </div>
        <div><label className={lCls}>Instructions & description</label><textarea value={data.description} onChange={e => s('description', e.target.value)} rows={3} className={`${iCls} resize-none`} placeholder="Détails, contexte, instructions pour les startups…" /></div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><span className="w-4 h-4 opacity-60">{Ic.users}</span>{count > 0 ? <><span className="font-semibold text-gray-700 dark:text-gray-200">{count}</span> startup{count > 1 ? 's' : ''} concernée{count > 1 ? 's' : ''}</> : 'Sélectionnez une cible'}</span>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Annuler</button>
            <button onClick={() => ok && onSubmit(data)} disabled={!ok} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><span className="w-3.5 h-3.5">{Ic.send}</span>Créer et envoyer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE WORKSHOP FORM
// ─────────────────────────────────────────────────────────────────────────────
function CreateWorkshopForm({ startups, uniqueProgs, onSubmit, onCancel }) {
  const [data, setData] = useState({ title: '', category: 'pitching', date: '', time: '', duration: 90, speaker: '', target: 'all', targetId: '', online: true, capacity: 20, description: '' });
  const s = (k, v) => setData(p => ({ ...p, [k]: v }));
  const cat = WORKSHOP_CATEGORIES.find(c => c.id === data.category);
  const ok  = data.title && data.date && (data.target === 'all' || data.targetId);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between" style={{ background: cat ? `${cat.color}12` : undefined }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white" style={{ background: cat?.color || '#64748b' }}><span className="w-4 h-4 block">{Ic.workshop}</span></div>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Nouveau workshop</span>
        </div>
        <button onClick={onCancel} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-all"><span className="w-4 h-4 block">{Ic.x}</span></button>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2"><label className={lCls}>Titre <span className="text-red-400 normal-case tracking-normal">*</span></label><input value={data.title} onChange={e => s('title', e.target.value)} placeholder="Ex. Pitch Clinic — Session 3" className={iCls} /></div>
          <div><label className={lCls}>Catégorie</label><select value={data.category} onChange={e => s('category', e.target.value)} className={iCls}>{WORKSHOP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className={lCls}>Date <span className="text-red-400 normal-case tracking-normal">*</span></label><input type="date" value={data.date} onChange={e => s('date', e.target.value)} className={iCls} /></div>
          <div><label className={lCls}>Heure</label><input type="time" value={data.time} onChange={e => s('time', e.target.value)} className={iCls} /></div>
          <div><label className={lCls}>Durée (min)</label><input type="number" value={data.duration} onChange={e => s('duration', parseInt(e.target.value))} min={15} step={15} className={iCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lCls}>Intervenant</label><select value={data.speaker} onChange={e => s('speaker', e.target.value)} className={iCls}><option value="">— Sélectionner —</option>{MOCK_SPEAKERS.map(sp => <option key={sp.id} value={sp.name}>{sp.name} · {sp.role}</option>)}</select></div>
          <div><label className={lCls}>Capacité</label><input type="number" value={data.capacity} onChange={e => s('capacity', parseInt(e.target.value))} min={1} className={iCls} /></div>
        </div>
        <div>
          <label className={lCls}>Format</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: true, l: 'En ligne', ic: Ic.globe }, { v: false, l: 'Présentiel', ic: Ic.location }].map(o => (
              <button key={String(o.v)} onClick={() => s('online', o.v)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${data.online === o.v ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                <span className="w-4 h-4 flex-shrink-0">{o.ic}</span>{o.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lCls}>Participants cibles</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: 'all', l: 'Toutes les startups' }, { v: 'programme', l: 'Par programme' }, { v: 'startup', l: 'Startup spécifique' }].map(o => (
              <button key={o.v} onClick={() => s('target', o.v)} className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center gap-2 ${data.target === o.v ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                <span className="w-3.5 h-3.5 flex-shrink-0">{data.target === o.v ? Ic.check : Ic.target}</span>{o.l}
              </button>
            ))}
          </div>
        </div>
        {data.target === 'programme' && <div><label className={lCls}>Programme</label><select value={data.targetId} onChange={e => s('targetId', e.target.value)} className={iCls}><option value="">— Sélectionner —</option>{uniqueProgs.map(p => <option key={p} value={p}>{p}</option>)}</select></div>}
        {data.target === 'startup'   && <div><label className={lCls}>Startup</label><select value={data.targetId} onChange={e => s('targetId', e.target.value)} className={iCls}><option value="">— Sélectionner —</option>{startups.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>}
        <div><label className={lCls}>Description</label><textarea value={data.description} onChange={e => s('description', e.target.value)} rows={3} className={`${iCls} resize-none`} placeholder="Objectifs, contenu, déroulé du workshop…" /></div>
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Annuler</button>
          <button onClick={() => ok && onSubmit(data)} disabled={!ok} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all" style={{ background: cat?.color || '#0284c7' }}>
            <span className="w-3.5 h-3.5">{Ic.calendar}</span>Planifier le workshop
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// Place at: app/components/common/FormsWorkshopsManagerModal.jsx
// Import:   import FormsWorkshopsManagerModal from '@/app/components/common/FormsWorkshopsManagerModal';
// ─────────────────────────────────────────────────────────────────────────────
export default function FormsWorkshopsManagerModal({ isOpen, onClose, startups = [] }) {
  const [section,      setSection]      = useState('formations');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat,    setFilterCat]    = useState('all');
  const [showCreateF,  setShowCreateF]  = useState(false);
  const [showCreateWS, setShowCreateWS] = useState(false);

  const uniqueProgs = [...new Set(startups.map(s => s.programmeName).filter(Boolean))];

  const [formations, setFormations] = useState([
    { id: 'f1', type: 'monthly_report',     title: 'Rapport Mensuel — Avril 2025',    target: 'programme', targetLabel: 'Programme Printemps 2025', deadline: '2025-04-30', status: 'active',  responses: 4,  total: 7,  description: 'Remplir avant la réunion de suivi mensuelle.' },
    { id: 'f2', type: 'kpi_update',         title: 'KPIs Q1 2025',                    target: 'all',       targetLabel: 'Toutes les startups',      deadline: '2025-03-31', status: 'closed',  responses: 12, total: 12, description: 'Bilan trimestriel des indicateurs clés.' },
    { id: 'f3', type: 'investor_readiness', title: 'Investor Readiness — Évaluation', target: 'programme', targetLabel: 'Cohorte IA/ML 2025',        deadline: '2025-05-15', status: 'active',  responses: 2,  total: 5,  description: 'Préparez votre deck et répondez aux questions de due diligence.' },
    { id: 'f4', type: 'mentoring_feedback', title: 'Feedback Session Mentoring Mars',  target: 'all',       targetLabel: 'Toutes les startups',       deadline: '2025-03-20', status: 'closed',  responses: 9,  total: 10, description: '' },
  ]);

  const [workshops, setWorkshops] = useState([
    { id: 'w1', title: 'Pitch Clinic — Session 4',      category: 'pitching',    date: '2025-05-05', time: '14:00', duration: 120, speaker: 'Karim Oueslati', target: 'all',       targetLabel: 'Toutes les startups', online: true,  enrolled: 8,  capacity: 20, status: 'upcoming', description: "Session intensive sur le pitch investisseur." },
    { id: 'w2', title: 'Financial Modelling 101',        category: 'finance',     date: '2025-04-15', time: '10:00', duration: 90,  speaker: 'Amira Hamdani',  target: 'programme', targetLabel: 'Programme Printemps', online: false, enrolled: 6,  capacity: 10, status: 'done',     description: 'P&L, cash flow, unit economics sur 3 ans.' },
    { id: 'w3', title: 'Growth Hacking Masterclass',     category: 'marketing',   date: '2025-05-12', time: '09:30', duration: 180, speaker: 'Rania Souissi',  target: 'all',       targetLabel: 'Toutes les startups', online: true,  enrolled: 14, capacity: 25, status: 'upcoming', description: 'Acquisition organique, paid media, retention loops.' },
    { id: 'w4', title: 'Legal Essentials for Startups',  category: 'legal',       date: '2025-04-28', time: '11:00', duration: 60,  speaker: 'Sonia Trabelsi', target: 'programme', targetLabel: 'Cohorte IA/ML 2025',  online: false, enrolled: 5,  capacity: 12, status: 'upcoming', description: 'GDPR, term sheets, cap table.' },
    { id: 'w5', title: 'Fundraising Strategy Deep Dive', category: 'fundraising', date: '2025-06-02', time: '14:30', duration: 150, speaker: 'Karim Oueslati', target: 'all',       targetLabel: 'Toutes les startups', online: true,  enrolled: 3,  capacity: 15, status: 'upcoming', description: 'Seed to Series A : valorisation, data room, closing.' },
  ]);

  const create = (setter) => (d) => {
    const targetLabel =
      d.target === 'all'       ? 'Toutes les startups'
      : d.target === 'programme' ? d.targetId
      : startups.find(s => s.id === d.targetId)?.name || d.targetId;
    setter(prev => [{ id: `item${Date.now()}`, ...d, targetLabel, status: d.date ? 'upcoming' : 'active', responses: 0, enrolled: 0, total: d.target === 'all' ? startups.length : d.target === 'programme' ? startups.filter(s => s.programmeName === d.targetId).length : 1 }, ...prev]);
    setShowCreateF(false); setShowCreateWS(false);
  };

  const switchSection = (id) => { setSection(id); setFilterStatus('all'); setFilterCat('all'); setShowCreateF(false); setShowCreateWS(false); };

  const filteredFormations = formations.filter(f => filterStatus === 'all' || f.status === filterStatus);
  const filteredWorkshops  = workshops.filter(w => (filterStatus === 'all' || w.status === filterStatus) && (filterCat === 'all' || w.category === filterCat));

  const FILTER_PILL = (v, l, active, onClick) => (
    <button key={v} onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${active ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
      {l}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Formations & Workshops" size="xl">

      {/* SWITCHER */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        {[{ id: 'formations', label: 'Formations', count: formations.length, icon: Ic.formation }, { id: 'workshops', label: 'Workshops', count: workshops.length, icon: Ic.workshop }].map(tab => (
          <button key={tab.id} onClick={() => switchSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${section === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <span className="w-4 h-4 flex-shrink-0">{tab.icon}</span>
            {tab.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${section === tab.id ? 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* FORMATIONS */}
      {section === 'formations' && (
        <div className="space-y-4">
          <StatsBar items={formations} isFormation />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 text-gray-400 flex-shrink-0">{Ic.filter}</span>
              <div className="flex gap-1">
                {[['all','Tous'],['active','Actifs'],['closed','Clôturés'],['draft','Brouillons']].map(([v, l]) => FILTER_PILL(v, l, filterStatus === v, () => setFilterStatus(v)))}
              </div>
            </div>
            <button onClick={() => { setShowCreateF(x => !x); setShowCreateWS(false); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold rounded-lg hover:opacity-90 transition-all">
              <span className="w-3.5 h-3.5">{showCreateF ? Ic.x : Ic.plus}</span>
              {showCreateF ? 'Annuler' : 'Nouvelle formation'}
            </button>
          </div>
          {showCreateF && <CreateFormationForm startups={startups} uniqueProgs={uniqueProgs} onSubmit={create(setFormations)} onCancel={() => setShowCreateF(false)} />}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredFormations.length === 0
              ? <div className="py-14 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600"><span className="w-10 h-10 opacity-30">{Ic.formation}</span><p className="text-sm font-medium">Aucune formation correspondante</p></div>
              : filteredFormations.map(f => <FormationCard key={f.id} item={f} onDelete={id => setFormations(p => p.filter(x => x.id !== id))} onDuplicate={item => setFormations(p => [{ ...item, id: `f${Date.now()}`, title: `${item.title} (copie)`, status: 'draft', responses: 0 }, ...p])} />)}
          </div>
        </div>
      )}

      {/* WORKSHOPS */}
      {section === 'workshops' && (
        <div className="space-y-4">
          <StatsBar items={workshops} isFormation={false} />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 text-gray-400 flex-shrink-0">{Ic.filter}</span>
                <div className="flex gap-1">
                  {[['all','Tous'],['upcoming','À venir'],['live','En direct'],['done','Terminés']].map(([v, l]) => FILTER_PILL(v, l, filterStatus === v, () => setFilterStatus(v)))}
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setFilterCat('all')} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${filterCat === 'all' ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Toutes</button>
                {WORKSHOP_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setFilterCat(c.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${filterCat === c.id ? 'text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                    style={filterCat === c.id ? { background: c.color } : {}}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: filterCat === c.id ? '#fff' : c.color }} />{c.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { setShowCreateWS(x => !x); setShowCreateF(false); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold rounded-lg hover:opacity-90 transition-all flex-shrink-0">
              <span className="w-3.5 h-3.5">{showCreateWS ? Ic.x : Ic.plus}</span>
              {showCreateWS ? 'Annuler' : 'Nouveau workshop'}
            </button>
          </div>
          {showCreateWS && <CreateWorkshopForm startups={startups} uniqueProgs={uniqueProgs} onSubmit={create(setWorkshops)} onCancel={() => setShowCreateWS(false)} />}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredWorkshops.length === 0
              ? <div className="py-14 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600"><span className="w-10 h-10 opacity-30">{Ic.workshop}</span><p className="text-sm font-medium">Aucun workshop correspondant</p></div>
              : filteredWorkshops.map(w => <WorkshopCard key={w.id} item={w} onDelete={id => setWorkshops(p => p.filter(x => x.id !== id))} onDuplicate={item => setWorkshops(p => [{ ...item, id: `w${Date.now()}`, title: `${item.title} (copie)`, status: 'upcoming', enrolled: 0 }, ...p])} />)}
          </div>
        </div>
      )}
    </Modal>
  );
}