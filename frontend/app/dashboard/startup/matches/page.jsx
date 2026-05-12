'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const Icons = {
  Star: ({ className }) => (<svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>),
  ArrowRight: ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>),
  ArrowLeft: ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>),
  Search: ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>),
  Check: ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>),
  Lock: ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>),
  Rocket: ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
  AlertCircle: ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  RefreshCw: ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>),
};

const STATUS_CFG = {
  pending_founder_validation: { label: 'En attente',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  founder_validated:          { label: 'Accepté',           color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  founder_rejected:           { label: 'Refusé',            color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  session_proposed:           { label: 'Session proposée',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  session_confirmed:          { label: 'Session confirmée', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  session_refused:            { label: 'Session refusée',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

const scoreColor = (s) => s >= 85 ? '#10b981' : s >= 70 ? '#f59e0b' : '#3b82f6';

function LockedMatches() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00526e22,#0088ba22)' }}>
        <Icons.Lock className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Fonctionnalité Fondateur</h2>
      <p className="text-slate-400 max-w-md mb-6">L'accès aux investisseurs est réservé aux startups dont la candidature a été acceptée dans un programme MEDIANET.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/startup/apply" className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 justify-center" style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
          <Icons.Rocket className="w-4 h-4" /> Déposer une candidature
        </Link>
        <Link href="/dashboard/startup/dashboard" className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}

function InvestorCard({ match, idx }) {
  const investor = match;
  const score    = match.match || 0;
  const sc       = scoreColor(score);
  const status   = match.status;
  const cfg      = STATUS_CFG[status] || { label: status, color: '#64748b', bg: 'rgba(100,116,139,0.12)' };
  const isSessionScheduled = ['session_proposed', 'session_confirmed'].includes(status);

  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: `${idx * 0.05}s` }}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
              {investor.logo ? <img src={investor.logo} alt={investor.name} className="w-full h-full object-cover" /> : (investor.name || 'IN').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{investor.name || 'Investisseur'}</h3>
              <div className="flex items-center gap-2 mt-1">
                {investor.location && (<span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#e0f2fe', color: '#0369a1' }}>{investor.location}</span>)}
                {investor.founded && (<span className="text-xs text-gray-400">Founded {investor.founded}</span>)}
              </div>
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${sc}22`, border: `2px solid ${sc}` }}>
              <span className="font-black text-lg" style={{ color: sc }}>{score}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Match</p>
          </div>
        </div>

        {investor.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{investor.description}</p>}

        {investor.focus?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {investor.focus.slice(0, 4).map((f, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>{f}</span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
          {investor.investmentRange && (<div><p className="text-xs text-gray-500 mb-0.5">Investment Range</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{investor.investmentRange}</p></div>)}
          {investor.stage?.length > 0 && (<div><p className="text-xs text-gray-500 mb-0.5">Preferred Stages</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{Array.isArray(investor.stage) ? investor.stage.join(', ') : investor.stage}</p></div>)}
        </div>

        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
            {(status === 'founder_validated' || status === 'session_confirmed') ? <Icons.Check className="w-3.5 h-3.5" /> : null}
            {cfg.label}
          </span>
        </div>

        {isSessionScheduled && match.sessionDate && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Icons.Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-sm text-emerald-700 dark:text-emerald-400">Session le {new Date(match.sessionDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Link href={`/dashboard/startup/matches/${match.id}`} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
              Voir le profil <Icons.ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          {status === 'pending_founder_validation' && (
            <Link href={`/dashboard/startup/matches/${match.id}`}>
              <button className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                Décider
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-xl p-6 animate-pulse" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0' }}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
        <div className="w-16 h-16 rounded-full bg-gray-200" />
      </div>
      <div className="space-y-2 mb-4"><div className="h-3 bg-gray-100 rounded" /><div className="h-3 bg-gray-100 rounded w-4/5" /></div>
      <div className="flex gap-2 mb-4">{[1,2,3].map(i => <div key={i} className="h-6 w-16 bg-gray-100 rounded-lg" />)}</div>
      <div className="h-10 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function FounderMatches() {
  // ✅ FIX: accessToken (pas "token")
  const { user, accessToken: token } = useSelector((state) => state.auth);

  const [mounted,    setMounted]    = useState(false);
  const [matches,    setMatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // ✅ FIX: accepte aussi le rôle "startup" en plus du flag isFounder
  const isFounder =
    user?.isFounder === true ||
    ['founder', 'startup', 'Startup', 'Founder'].includes(user?.role);

  const fetchMatches = useCallback(async () => {
    if (!token || !isFounder) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/startup/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Erreur de chargement');
      setMatches(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isFounder]);

  useEffect(() => { if (mounted) fetchMatches(); }, [mounted, fetchMatches]);

  const filteredMatches = matches.filter(m => {
    if (filter === 'pending')   return m.status === 'pending_founder_validation';
    if (filter === 'accepted')  return ['founder_validated','session_proposed','session_confirmed'].includes(m.status);
    if (filter === 'rejected')  return ['founder_rejected','session_refused'].includes(m.status);
    if (filter === 'session')   return ['session_proposed','session_confirmed'].includes(m.status);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return m.name?.toLowerCase().includes(s) || m.focus?.some(f => f.toLowerCase().includes(s)) || m.location?.toLowerCase().includes(s);
    }
    return true;
  });

  const cnt = (fn) => matches.filter(fn).length;

  if (!mounted) return null;

  return (
    <ProtectedRoute allowedRoles={['startup', 'founder', 'applicant']}>
      <DashboardLayout>
        <style jsx>{`
          @keyframes slideInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scaleIn   { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          .animate-slide-in-up { animation:slideInUp 0.5s ease-out forwards; }
          .animate-scale-in    { animation:scaleIn 0.4s ease-out forwards; }
          .glass-card { background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border:1px solid rgba(0,0,0,0.05);transition:all 0.3s ease; }
          :global(.dark) .glass-card { background:#1e293b;border:1px solid #334155; }
          .glass-card:hover { box-shadow:0 20px 25px -12px rgba(0,0,0,0.15); }
          .filter-btn { transition:all 0.2s ease; }
          .filter-btn:hover { opacity:0.85; }
          .line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up" style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide inline-block mb-3">INVESTOR MATCHING</div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">Recommended Investors</h1>
                <p className="text-blue-100 text-base max-w-2xl">Discover investors that best match your profile</p>
                {!loading && matches.length > 0 && <p className="text-white/60 text-sm mt-1">{matches.length} match{matches.length > 1 ? 'es' : ''} trouvé{matches.length > 1 ? 's' : ''}</p>}
              </div>
              {isFounder && (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setFilter('all'); }} className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm" />
                  </div>
                  <button onClick={fetchMatches} className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all" title="Rafraîchir">
                    <Icons.RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isFounder ? (
            <div className="glass-card rounded-xl"><LockedMatches /></div>
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all',      label: `Tous (${matches.length})` },
                  { key: 'pending',  label: `En attente (${cnt(m => m.status === 'pending_founder_validation')})` },
                  { key: 'accepted', label: `Acceptés (${cnt(m => ['founder_validated','session_proposed','session_confirmed'].includes(m.status))})` },
                  { key: 'session',  label: `Sessions (${cnt(m => ['session_proposed','session_confirmed'].includes(m.status))})` },
                  { key: 'rejected', label: `Refusés (${cnt(m => ['founder_rejected','session_refused'].includes(m.status))})` },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => { setFilter(key); setSearchTerm(''); }} className="filter-btn px-4 py-2 rounded-lg text-sm font-medium"
                    style={filter === key ? { background: 'linear-gradient(135deg,#00526e,#0088ba)', color: 'white' } : { background: 'rgba(0,0,0,0.04)', color: '#64748b', border: '1px solid #e2e8f0' }}>
                    {label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Icons.AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-600 flex-1">{error}</p>
                  <button onClick={fetchMatches} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: '#ef4444' }}>Réessayer</button>
                </div>
              )}

              {loading && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1,2,3,4].map(i => <Skeleton key={i} />)}</div>)}

              {!loading && !error && filteredMatches.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredMatches.map((match, idx) => <InvestorCard key={match.id} match={match} idx={idx} />)}
                </div>
              )}

              {!loading && !error && filteredMatches.length === 0 && (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Icons.Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {matches.length === 0 ? 'Aucun match disponible pour le moment' : 'Aucun résultat pour ce filtre'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    {matches.length === 0 ? "L'équipe MEDIANET va bientôt vous proposer des investisseurs correspondant à votre profil." : "Essayez un autre filtre ou effacez votre recherche."}
                  </p>
                  {filter !== 'all' && (
                    <button onClick={() => { setFilter('all'); setSearchTerm(''); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#00526e,#0088ba)' }}>
                      Voir tous les matches
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-start">
                <Link href="/dashboard/startup/dashboard" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors" style={{ borderColor: '#e2e8f0', color: '#64748b' }}>
                  <Icons.ArrowLeft className="w-4 h-4" /> Retour au dashboard
                </Link>
              </div>

              {!loading && matches.length > 0 && (
                <div className="relative overflow-hidden rounded-xl p-6" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Icons.Star className="w-6 h-6 text-white" /></div>
                      <div><h3 className="text-white font-semibold">Matching Program</h3><p className="text-white/60 text-sm">Complétez votre profil pour améliorer vos scores</p></div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center"><p className="text-white font-bold text-xl">IA</p><p className="text-white/60 text-xs">Recommandations</p></div>
                      <div className="w-px h-8 bg-white/20" />
                      <div className="text-center"><p className="text-white font-bold text-xl">{matches.length}</p><p className="text-white/60 text-xs">Matches actifs</p></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}