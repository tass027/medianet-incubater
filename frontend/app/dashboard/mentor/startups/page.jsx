'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import Link from 'next/link';
import useMentorStartups from '@/app/hooks/useMentorStartups';

// ─── Icônes ──────────────────────────────────────────────────────────────────
const Icons = {
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Search: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Users: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Calendar: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Chart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  RefreshCw: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Inbox: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  ChevronDown: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronUp: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
    </svg>
  ),
};

const STAGES = ['Idée', 'MVP', 'Amorçage', 'Croissance', 'Maturité'];

// ─── Carte startup ────────────────────────────────────────────────────────────
function StartupCard({ startup }) {
  return (
    <Link href={`/dashboard/mentor/startups/${startup._id}`}>
      <div className="glass-card rounded-xl p-5 cursor-pointer">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          {/* Gauche */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00526e] to-[#0088ba] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {(startup.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{startup.name}</h3>
                {startup.sector && <Badge variant="info"    size="sm">{startup.sector}</Badge>}
                {startup.stage  && <Badge variant="outline" size="sm">{startup.stage}</Badge>}
                <Badge variant={startup.status === 'active' ? 'success' : 'warning'} size="sm">
                  {startup.status === 'active' ? 'Active' : 'En attente'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {startup.founder && (
                  <span className="flex items-center gap-1">
                    <Icons.Users className="w-3 h-3" />{startup.founder}
                  </span>
                )}
                {startup.lastSession && (
                  <span className="flex items-center gap-1">
                    <Icons.Clock className="w-3 h-3" />
                    Dernière session : {new Date(startup.lastSession).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {startup.nextSession && (
                  <span className="flex items-center gap-1 text-[#006d94]">
                    <Icons.Calendar className="w-3 h-3" />
                    Prochaine : {new Date(startup.nextSession).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Droite */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-xl font-bold text-[#006d94] dark:text-[#0088ba]">
                {startup.feedbackCount || 0}
              </p>
              <p className="text-xs text-gray-500">Feedbacks</p>
            </div>
            <div className="w-32">
              <p className="text-xs text-gray-500 mb-1">Progression</p>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00526e] to-[#0088ba] rounded-full progress-bar"
                  style={{ width: `${startup.progress || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{startup.progress || 0}%</p>
            </div>
            <Icons.ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Section programme (collapsible) ─────────────────────────────────────────
function ProgrammeSection({ programmeName, startups, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const avg = startups.length
    ? Math.round(startups.reduce((s, x) => s + (x.progress || 0), 0) / startups.length)
    : 0;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#006d94] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}
          >
            {programmeName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-[#006d94] transition-colors">
              {programmeName}
            </p>
            <p className="text-xs text-gray-500">
              {startups.length} candidature{startups.length > 1 ? 's' : ''} · progression moy. {avg}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" size="sm">{startups.length}</Badge>
          {open
            ? <Icons.ChevronUp className="w-4 h-4 text-gray-400" />
            : <Icons.ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {open && (
        <div className="space-y-3 pl-4 border-l-2 border-[#006d94]/20">
          {startups.map((s) => <StartupCard key={s._id} startup={s} />)}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MentorStartupsPage() {
  const [mounted,         setMounted]         = useState(false);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterStage,     setFilterStage]     = useState('all');
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterProgramme, setFilterProgramme] = useState('all'); // ← remplace filterSector
  const [sortBy,          setSortBy]          = useState('name');

  const { startups, loading, error, refetch } = useMentorStartups();

  useEffect(() => { setMounted(true); }, []);

  // ── Liste dynamique des programmes disponibles ────────────────────────────
  const programmeOptions = useMemo(() => {
    const seen    = new Set();
    const options = [];
    startups.forEach((s) => {
      if (s.programmeId && s.programmeName && !seen.has(s.programmeId.toString())) {
        seen.add(s.programmeId.toString());
        options.push({ id: s.programmeId.toString(), name: s.programmeName });
      }
    });
    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [startups]);

  // ── Filtre + tri ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => startups
    .filter((s) => {
      const q           = searchTerm.toLowerCase();
      const matchSearch = !q || [s.name, s.sector, s.founder, s.stage, s.programmeName]
        .some((v) => (v || '').toLowerCase().includes(q));
      const matchStage     = filterStage     === 'all' || s.stage  === filterStage;
      const matchStatus    = filterStatus    === 'all' || s.status === filterStatus;
      const matchProgramme = filterProgramme === 'all'
        || (filterProgramme === 'spontaneous'
          ? (!s.programmeId || s.type === 'spontaneous')
          : s.programmeId?.toString() === filterProgramme);
      return matchSearch && matchStage && matchStatus && matchProgramme;
    })
    .sort((a, b) => {
      if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
      if (sortBy === 'feedback') return (b.feedbackCount || 0) - (a.feedbackCount || 0);
      if (sortBy === 'session') {
        const da = a.lastSession ? new Date(a.lastSession) : new Date(0);
        const db = b.lastSession ? new Date(b.lastSession) : new Date(0);
        return db - da;
      }
      return (a.name || '').localeCompare(b.name || '');
    }), [startups, searchTerm, filterStage, filterStatus, filterProgramme, sortBy]);

  // ── Groupement par programme ──────────────────────────────────────────────
  const { grouped, spontaneous } = useMemo(() => {
    const groups = {};
    const spont  = [];

    filtered.forEach((s) => {
      if (s.programmeId && s.type !== 'spontaneous') {
        const key = s.programmeId.toString();
        if (!groups[key]) {
          groups[key] = { id: key, name: s.programmeName || 'Programme sans nom', startups: [] };
        }
        groups[key].startups.push(s);
      } else {
        spont.push(s);
      }
    });

    return { grouped: Object.values(groups), spontaneous: spont };
  }, [filtered]);

  // ✅ Early return APRÈS tous les hooks
  if (!mounted) return null;

  const hasActiveFilters =
    searchTerm || filterStage !== 'all' || filterStatus !== 'all' || filterProgramme !== 'all';

  return (
    <ProtectedRoute allowedRoles={['mentor']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { font-family: 'Inter', sans-serif; }
          .glass-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
          }
          :global(.dark) .glass-card { background: #1e293b; border: 1px solid #334155; }
          .glass-card:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -12px rgba(0,0,0,0.12); }
          .progress-bar { transition: width 0.6s ease; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* ── Header ── */}
          <div
            className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}
          >
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Link href="/dashboard/mentor/dashboard">
                  <button className="flex items-center gap-2 text-white/80 hover:text-white transition">
                    <Icons.ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                </Link>
                <button
                  onClick={refetch}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white"
                  title="Actualiser"
                >
                  <Icons.RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">Candidatures</h1>
                {!loading && <Badge variant="info" size="lg">{startups.length}</Badge>}
              </div>
              <p className="text-blue-100 text-base max-w-2xl">
                Organisées par programme · {grouped.length} programme{grouped.length > 1 ? 's' : ''}
                {spontaneous.length > 0 && ` · ${spontaneous.length} spontanée${spontaneous.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* ── Filtres ── */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, secteur, fondateur…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#006d94] focus:border-[#006d94] transition-all dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-3">

              {/* Stades */}
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#006d94] transition-all dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="all">Tous les stades</option>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Statuts */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#006d94] transition-all dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="pending">En attente</option>
              </select>

              {/* Programmes (dynamique) ← REMPLACE "Tous les secteurs" */}
              <select
                value={filterProgramme}
                onChange={(e) => setFilterProgramme(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#006d94] transition-all dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="all">Tous les programmes</option>
                {programmeOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="spontaneous">Candidatures spontanées</option>
              </select>

              {/* Tri */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#006d94] transition-all dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="name">Trier : Nom</option>
                <option value="progress">Trier : Progression</option>
                <option value="feedback">Trier : Feedbacks</option>
                <option value="session">Trier : Dernière session</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStage('all');
                    setFilterStatus('all');
                    setFilterProgramme('all');
                  }}
                  className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-sm hover:bg-red-100 transition"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {!loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filtered.length} candidature{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
                {filtered.length !== startups.length && ` sur ${startups.length}`}
              </p>
            )}
          </div>

          {/* ── Contenu ── */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={refetch}>Réessayer</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Icons.Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {startups.length === 0 ? 'Aucune candidature assignée' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {startups.length === 0
                  ? 'Les candidatures assignées apparaîtront ici.'
                  : 'Ajustez vos filtres.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Groupes par programme */}
              {grouped.map((group) => (
                <ProgrammeSection
                  key={group.id}
                  programmeName={group.name}
                  startups={group.startups}
                  defaultOpen={true}
                />
              ))}

              {/* Candidatures spontanées */}
              {spontaneous.length > 0 && (
                <div className="space-y-3">
                  <div className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Icons.Inbox className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">
                          Candidatures spontanées
                        </p>
                        <p className="text-xs text-gray-500">
                          {spontaneous.length} candidature{spontaneous.length > 1 ? 's' : ''} hors programme
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">{spontaneous.length}</Badge>
                  </div>
                  <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    {spontaneous.map((s) => <StartupCard key={s._id} startup={s} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          {!loading && !error && startups.length > 0 && (
            <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <Icons.Chart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Suivi personnalisé</h3>
                    <p className="text-white/60 text-sm">Accédez aux rapports d'avancement détaillés</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-white font-bold">{grouped.length}</p>
                    <p className="text-white/60 text-xs">Programme{grouped.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center">
                    <p className="text-white font-bold">{startups.length}</p>
                    <p className="text-white/60 text-xs">Candidature{startups.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <Link
                    href="/dashboard/mentor/reports"
                    className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition flex items-center gap-2"
                  >
                    Voir les rapports
                    <Icons.ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}