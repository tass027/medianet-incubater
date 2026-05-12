'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  Back: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  Clock: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Star: () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  Chevron: ({ open }) => <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
  Check: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>,
  Arrow: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7"/></svg>,
  Alert: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
  FileText: () => <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
};

// Avatar color palette – deterministic from first char
const AVATAR_PALETTES = [
  { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-sky-100 dark:bg-sky-900/40',       text: 'text-sky-700 dark:text-sky-300' },
  { bg: 'bg-teal-100 dark:bg-teal-900/40',     text: 'text-teal-700 dark:text-teal-300' },
  { bg: 'bg-rose-100 dark:bg-rose-900/40',     text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300' },
];
const avatarPalette = name => AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ evaluated, total, showLabel = false }) {
  const pct = total > 0 ? Math.round((evaluated / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold whitespace-nowrap ${pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
        {showLabel ? `${evaluated}/${total} évaluées` : `${evaluated}/${total}`}
      </span>
    </div>
  );
}

// ─── Deadline banner ──────────────────────────────────────────────────────────
function DeadlineBanner({ deadline, pendingCount }) {
  if (!deadline || pendingCount === 0) return null;
  const diffDays = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (diffDays < 0) return null;
  const isUrgent = diffDays <= 3, isWarn = diffDays <= 7;
  return (
    <div className={`flex items-center gap-3 rounded-xl px-5 py-3.5 border ${isUrgent ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40' : isWarn ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40'}`}>
      <span className={isUrgent ? 'text-red-500' : isWarn ? 'text-amber-500' : 'text-blue-500'}><Icons.Alert /></span>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${isUrgent ? 'text-red-700 dark:text-red-400' : isWarn ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'}`}>
          Délai d'évaluation — {new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-600 dark:text-red-400' : isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
          {pendingCount} candidature{pendingCount > 1 ? 's' : ''} en attente · {diffDays} jour{diffDays > 1 ? 's' : ''} restant{diffDays > 1 ? 's' : ''}
        </p>
      </div>
      <span className={`text-2xl font-bold ${isUrgent ? 'text-red-600 dark:text-red-400' : isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>J-{diffDays}</span>
    </div>
  );
}

// ─── Candidature card ──────────────────────────────────────────────────────────
function CandidatureCard({ c }) {
  const name    = c.projectName || c.companyName || 'Candidature';
  const score   = c.myScore != null ? Number(c.myScore).toFixed(1) : null;
  const palette = avatarPalette(name);
  const borderAccent = c.juryEvaluated
    ? 'border-l-[3px] border-l-emerald-500'
    : 'border-l-[3px] border-l-amber-400';

  return (
    <Link href={`/dashboard/jury/candidatures/${c._id}`}>
      <div className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${borderAccent} rounded-xl p-4 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${palette.bg} ${palette.text}`}>
            {name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                {name}
              </p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${c.juryEvaluated ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                {c.juryEvaluated ? 'Évaluée' : 'En attente'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              {c.founderName && (
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.founderName}</span>
              )}
              {c.submittedAt && (
                <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                  <Icons.Clock />
                  {new Date(c.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            {c.sector && (
              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">{c.sector}</span>
            )}
            {score !== null && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                <Icons.Star />{score}/10
              </span>
            )}
            {c.juryEvaluated && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Icons.Check />Noté
              </span>
            )}
          </div>
          <span className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition"><Icons.Arrow /></span>
        </div>
      </div>
    </Link>
  );
}

// ─── Programme section ────────────────────────────────────────────────────────
function ProgrammeSection({ group, searchTerm, globalFilter, isSpontan }) {
  const [open,      setOpen]      = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setActiveTab(globalFilter !== 'all' ? globalFilter : 'all');
  }, [globalFilter]);

  const filtered = group.candidatures.filter(c => {
    const name = (c.projectName || c.companyName || '').toLowerCase();
    const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'evaluated' &&  c.juryEvaluated) ||
      (activeTab === 'pending'   && !c.juryEvaluated);
    return matchSearch && matchTab;
  });

  const pct = group.candidatures.length > 0 ? Math.round((group.evaluated / group.candidatures.length) * 100) : 0;
  const dotColor = isSpontan ? 'bg-teal-500' : 'bg-indigo-500';

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{group.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{group.candidatures.length} candidature{group.candidatures.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-[10px] text-gray-400">Progression</span>
            <ProgressBar evaluated={group.evaluated} total={group.candidatures.length} />
          </div>
          {group.pending > 0 && (
            <span className="text-[10px] font-semibold px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full whitespace-nowrap">
              {group.pending} en attente
            </span>
          )}
          {pct === 100 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
              <Icons.Check />Complété
            </span>
          )}
          <Icons.Chevron open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20">
          {/* Mobile progress */}
          <div className="sm:hidden flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-xs text-gray-400">Progression</span>
            <ProgressBar evaluated={group.evaluated} total={group.candidatures.length} />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 p-3 border-b border-gray-100 dark:border-gray-700/50">
            {[
              { value: 'all',       label: 'Toutes',      count: null },
              { value: 'pending',   label: 'En attente',  count: group.pending,   countCls: 'bg-amber-400/20 text-amber-700 dark:text-amber-400' },
              { value: 'evaluated', label: 'Évaluées',    count: group.evaluated, countCls: 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-400' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-[9px] rounded-full ${activeTab === tab.value ? 'bg-white/20 text-white' : tab.countCls}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          <div className="p-3">
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">Aucune candidature pour ce filtre</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {filtered.map(c => <CandidatureCard key={c._id} c={c} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function JuryCandidaturesPage() {
  const [mounted,      setMounted]      = useState(false);
  const [programmes,   setProgrammes]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [globalFilter, setGlobalFilter] = useState('all');
  const [deadline,     setDeadline]     = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const { data } = await axiosAuth.get('/api/jury-space/candidatures');
        if (data.programmes?.length) {
          setProgrammes(data.programmes);
        } else if (data.candidatures?.length) {
          const map = new Map();
          data.candidatures.forEach(c => {
            const key = c.programmeName || 'Candidatures spontanées';
            if (!map.has(key)) map.set(key, { name: key, candidatures: [], pending: 0, evaluated: 0 });
            const g = map.get(key);
            g.candidatures.push(c);
            if (c.juryEvaluated) g.evaluated++; else g.pending++;
          });
          setProgrammes([...map.values()]);
        }
        if (data.deadline) setDeadline(data.deadline);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted]);

  if (!mounted) return null;

  const totalCandidatures = programmes.reduce((s, g) => s + g.candidatures.length, 0);
  const totalPending      = programmes.reduce((s, g) => s + g.pending, 0);
  const totalEvaluated    = programmes.reduce((s, g) => s + g.evaluated, 0);
  const globalPct         = totalCandidatures > 0 ? Math.round((totalEvaluated / totalCandidatures) * 100) : 0;

  const visibleProgrammes = !searchTerm
    ? programmes
    : programmes.filter(g =>
        g.candidatures.some(c =>
          (c.projectName || c.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

  return (
    <ProtectedRoute allowedRoles={['mentor', 'jury']}>
      <DashboardLayout>
        <div className="space-y-5 pb-10">

          {/* ── Header ── */}
          <div className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg,#312e81 0%,#4f46e5 50%,#7c3aed 100%)' }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }}/>
            <div className="relative">
              <Link href="/dashboard/jury">
                <button className="flex items-center gap-1.5 text-white/70 hover:text-white transition mb-5 text-sm">
                  <Icons.Back /> Retour
                </button>
              </Link>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">Candidatures</h1>
                    {!loading && (
                      <span className="px-3 py-1 bg-white/20 text-white text-sm font-bold rounded-full">{totalCandidatures}</span>
                    )}
                  </div>
                  <p className="text-indigo-200 text-sm">Évaluez les dossiers qui vous ont été assignés</p>
                  {!loading && (
                    <div className="flex items-center gap-5 mt-3">
                      <span className="flex items-center gap-2 text-sm text-indigo-100"><span className="w-2 h-2 bg-amber-400 rounded-full"/>{totalPending} en attente</span>
                      <span className="flex items-center gap-2 text-sm text-indigo-100"><span className="w-2 h-2 bg-emerald-400 rounded-full"/>{totalEvaluated} évaluées</span>
                      <span className="flex items-center gap-2 text-sm text-indigo-100"><span className="w-2 h-2 bg-blue-300 rounded-full"/>{programmes.length} programme{programmes.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Global progress ring */}
                {!loading && totalCandidatures > 0 && (
                  <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3.5 border border-white/20 flex items-center gap-4 flex-shrink-0">
                    <div>
                      <p className="text-xs text-indigo-200 mb-0.5">Progression globale</p>
                      <p className="text-2xl font-bold text-white">{globalPct}%</p>
                    </div>
                    <div className="w-16 h-16 relative">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5"/>
                        <circle cx="28" cy="28" r="22" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${(globalPct / 100) * 138.2} 138.2`}
                          style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                        {totalEvaluated}/{totalCandidatures}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Deadline banner ── */}
          {!loading && deadline && <DeadlineBanner deadline={deadline} pendingCount={totalPending} />}

          {/* ── Stat cards ── */}
          {!loading && totalCandidatures > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total',       value: totalCandidatures, bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300' },
                { label: 'En attente',  value: totalPending,      bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-300' },
                { label: 'Évaluées',    value: totalEvaluated,    bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                  <p className={`text-xs font-medium mt-0.5 ${s.text} opacity-70`}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Search + Global filter ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Icons.Search /></span>
              <input
                type="text"
                placeholder="Rechercher une candidature…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>

            {/* Global filter chips */}
            <div className="flex items-center gap-2">
              {[
                { value: 'all',       label: 'Toutes',      cls: 'bg-indigo-600 text-white' },
                { value: 'pending',   label: 'En attente',  cls: 'bg-amber-500 text-white' },
                { value: 'evaluated', label: 'Évaluées',    cls: 'bg-emerald-500 text-white' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setGlobalFilter(f.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${globalFilter === f.value ? f.cls : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>)}
            </div>
          ) : error ? (
            <div className="rounded-xl p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">{error}</div>
          ) : visibleProgrammes.length === 0 ? (
            <div className="rounded-2xl p-12 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-center mb-4 text-gray-300 dark:text-gray-600"><Icons.FileText /></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucune candidature</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {searchTerm ? 'Aucun résultat pour cette recherche' : "L'administrateur vous assignera des candidatures"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleProgrammes.map(group => (
                <ProgrammeSection
                  key={group.name}
                  group={group}
                  searchTerm={searchTerm}
                  globalFilter={globalFilter}
                  isSpontan={group.name === 'Candidatures spontanées'}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}