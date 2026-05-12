'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ── Icons ──────────────────────────────────────────────────────────────────
const StarIcon      = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const ChevronUpIcon   = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>;
const ChevronDownIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>;
const SearchIcon      = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const LockIcon        = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>;
const EyeIcon         = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const CalendarIcon    = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
const EditIcon        = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const SendIcon        = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>;
const CheckIcon       = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>;
const ArrowRightIcon  = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>;

// ── Helpers ────────────────────────────────────────────────────────────────
const getCandName = ev =>
  ev.candidatureInfo?.name      ||
  ev.startupName                ||
  ev.candidatureId?.projectName ||
  ev.candidatureId?.companyName ||
  'Candidature';
const getJuryName  = ev => ev.juryInfo?.name             || ev.juryName    || 'Jury';
const getProgramme = ev =>
  ev.candidatureInfo?.programme ||
  ev.programmeName              ||
  ev.programme                  ||
  ev.candidatureId?.programmeName ||
  '—';
const getScore = ev => {
  if (ev.computedScore != null) return +Number(ev.computedScore).toFixed(2);
  if (ev.totalScore    != null) {
    const ts = ev.totalScore;
    return ts > 10 ? +(ts / 10).toFixed(2) : +Number(ts).toFixed(2);
  }
  return null;
};

// ── Score Badge ────────────────────────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  if (score == null) return <span className="text-xs text-gray-400">—</span>;
  const cls =
    score >= 8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
    score >= 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${cls}`}>
      <StarIcon className="w-3.5 h-3.5" />
      {score.toFixed(2)}
    </span>
  );
};

// ── Recommendation Badge ───────────────────────────────────────────────────
const RecoBadge = ({ value }) => {
  const MAP = {
    accept: { label: 'Accepté',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    reject: { label: 'Refusé',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    review: { label: 'À revoir', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  };
  if (!value) return null;
  const { label, cls } = MAP[value] || { label: value, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>{label}</span>;
};

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, gradient }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
      <StarIcon className="w-5 h-5 text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────
const JuryEvaluationsPage = () => {
  const router = useRouter();

  const [mounted,     setMounted]     = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [filterProg,  setFilterProg]  = useState('');
  const [sortField,   setSortField]   = useState('submittedAt');
  const [sortDir,     setSortDir]     = useState('desc');

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosAuth.get('/api/jury-space/my-evaluations');
      setEvaluations(data.evaluations ?? []);

      const submitted = (data.evaluations ?? []).filter(e => e.status === 'submitted' || e.sentToAdmin);
      const avg = submitted.length
        ? (submitted.reduce((s, e) => s + (getScore(e) ?? 0), 0) / submitted.length).toFixed(2)
        : null;
      setStats({ total: (data.evaluations ?? []).length, submitted: submitted.length, avgScore: avg });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (mounted) load(); }, [mounted, load]);

  const programs = [...new Set(evaluations.map(e => getProgramme(e)).filter(p => p && p !== '—'))];

  const toggleSort = useCallback((field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }, [sortField]);

  const filtered = evaluations
    .filter(ev => {
      const q = search.toLowerCase();
      return (
        (!search || getCandName(ev).toLowerCase().includes(q) || getJuryName(ev).toLowerCase().includes(q)) &&
        (!filterProg || getProgramme(ev) === filterProg)
      );
    })
    .sort((a, b) => {
      let av, bv;
      if      (sortField === 'submittedAt') { av = new Date(a.submittedAt || 0); bv = new Date(b.submittedAt || 0); }
      else if (sortField === 'score')       { av = getScore(a) ?? -1;             bv = getScore(b) ?? -1; }
      else                                  { av = getCandName(a).toLowerCase();  bv = getCandName(b).toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const SortBtn = ({ field, label }) => (
    <button onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition uppercase tracking-wide">
      {label}
      {sortField === field && (sortDir === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />)}
    </button>
  );

  const globalAvg = stats?.avgScore ?? (evaluations.length
    ? (evaluations.reduce((s, e) => s + (getScore(e) ?? 0), 0) / evaluations.length).toFixed(2)
    : '—');

  const sentCount = evaluations.filter(e => e.sentToAdmin).length;

  // ── Navigation helpers ──────────────────────────────────────────────────
  const goToDetail = (ev) => {
    const id = ev._id || ev.id;
    router.push(`/dashboard/jury/evaluations/${id}`);
  };

  const goToEdit = (ev) => {
    const id = ev._id || ev.id;
    router.push(`/dashboard/jury/evaluations/${id}?mode=edit`);
  };

  const sendToAdmin = async (ev) => {
    try {
      await axiosAuth.post(`/api/jury-space/evaluations/${ev._id}/send-to-admin`);
      load();
    } catch {}
  };

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['jury', 'mentor', 'admin']}>
      <DashboardLayout>
        <div className="space-y-6 pb-12">

          {/* ── Header ── */}
          <div className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4338ca 70%,#6d28d9 100%)' }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #818cf8 0%, transparent 60%)' }} />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">Mes évaluations</h1>
                  {!loading && (
                    <span className="px-3 py-1 bg-white/20 text-white text-sm font-bold rounded-full">
                      {evaluations.length}
                    </span>
                  )}
                </div>
                <p className="text-indigo-200 text-sm">Rapports complets soumis — scores, justifications, recommandations</p>
                {!loading && (
                  <p className="text-indigo-300 text-sm mt-1">
                    Score moyen : <span className="font-bold text-white">{globalAvg}/10</span>
                    {sentCount > 0 && (
                      <span className="ml-3 text-emerald-300">
                        · {sentCount} envoyée{sentCount > 1 ? 's' : ''} à l'admin
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-xl self-start">
                <LockIcon />
                <span className="text-xs text-white/80 font-medium">Confidentiel</span>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          {!loading && !error && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total évaluations"  value={stats?.total}     gradient="from-indigo-500 to-violet-600" />
              <StatCard label="Soumises"            value={stats?.submitted} gradient="from-emerald-500 to-teal-600" />
              <StatCard label="Score moyen /10"     value={globalAvg}        gradient="from-amber-500 to-orange-600" />
              <StatCard label="Envoyées à l'admin"  value={sentCount}        gradient="from-sky-500 to-blue-600" />
            </div>
          )}

          {/* ── Filters ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Rechercher une candidature…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {programs.length > 0 && (
              <select
                value={filterProg}
                onChange={e => setFilterProg(e.target.value)}
                className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
              >
                <option value="">Tous les programmes</option>
                {programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>

          {/* ── Table ── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center">
              <p className="text-red-500 font-medium mb-4">{error}</p>
              <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition">
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <StarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {search || filterProg ? 'Aucun résultat pour ces filtres' : 'Aucune évaluation soumise pour le moment'}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

              {/* Table header */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <SortBtn field="name"        label="Candidature" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Programme</span>
                <SortBtn field="score"       label="Score" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reco</span>
                <SortBtn field="submittedAt" label="Date" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filtered.map((ev, idx) => {
                  const candName = getCandName(ev);
                  const prog     = getProgramme(ev);
                  const score    = getScore(ev);
                  const date     = ev.submittedAt ? new Date(ev.submittedAt).toLocaleDateString('fr-FR') : '—';
                  const criteriaCount = ev.scores?.length || 0;
                  const hasDetails = criteriaCount > 0 || ev.globalRemark || ev.positivePoints?.length || ev.negativePoints?.length || (ev.computedScore != null && ev.computedScore > 0);

                  return (
                    <div
                      key={ev.id || ev._id?.toString() || idx}
                      className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition group cursor-pointer"
                      onClick={() => goToDetail(ev)}
                    >
                      {/* Candidature */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {candName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                            {candName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-xs text-gray-400 md:hidden">{date}</p>
                            {criteriaCount > 0 && (
                              <span className="text-xs text-gray-400">
                                {criteriaCount} critère{criteriaCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {ev.sentToAdmin && (
                              <span className="text-xs text-emerald-500 font-medium flex items-center gap-0.5">
                                <CheckIcon />Admin
                              </span>
                            )}
                            {!hasDetails && (
                              <span className="text-xs text-amber-500 font-medium">Rapport incomplet</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Programme */}
                      <div className="hidden md:flex items-center">
                        <span className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg font-medium truncate max-w-[150px]">
                          {prog}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="hidden md:flex items-center">
                        <ScoreBadge score={score} />
                      </div>

                      {/* Recommandation */}
                      <div className="hidden md:flex items-center">
                        <RecoBadge value={ev.recommendation} />
                      </div>

                      {/* Date */}
                      <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                        <CalendarIcon />{date}
                      </div>

                      {/* Actions */}
                      <div className="hidden md:flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        {/* View detail */}
                        <button
                          onClick={() => goToDetail(ev)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                          title="Voir le rapport complet"
                        >
                          <EyeIcon />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => goToEdit(ev)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                          title="Modifier le rapport"
                        >
                          <EditIcon />
                        </button>

                        {/* Send to admin */}
                        {!ev.sentToAdmin ? (
                          <button
                            onClick={() => sendToAdmin(ev)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                            title="Envoyer à l'admin"
                          >
                            <SendIcon />
                          </button>
                        ) : (
                          <span className="p-1.5 text-emerald-500" title="Déjà envoyé à l'admin">
                            <CheckIcon />
                          </span>
                        )}

                        {/* Arrow hint */}
                        <span className="p-1.5 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition">
                          <ArrowRightIcon />
                        </span>
                      </div>

                      {/* Mobile row */}
                      <div className="md:hidden flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <span className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">{prog}</span>
                        <div className="flex items-center gap-2">
                          <RecoBadge value={ev.recommendation} />
                          <ScoreBadge score={score} />
                          <button
                            onClick={() => goToDetail(ev)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            onClick={() => goToEdit(ev)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <EditIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {filtered.length} évaluation{filtered.length !== 1 ? 's' : ''}
                  {(search || filterProg) ? ` filtrée${filtered.length !== 1 ? 's' : ''}` : ''}
                </p>
                <p className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
                  Cliquer sur une ligne pour voir le rapport complet
                </p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default JuryEvaluationsPage;