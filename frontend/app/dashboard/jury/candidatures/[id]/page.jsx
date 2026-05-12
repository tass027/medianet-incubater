'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { axiosAuth } from '@/app/store/slices/authSlice';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  Back:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>,
  Send:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
  Check:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>,
  Star:   () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  Info:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Lock:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  User:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  File:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Target: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  Num: ({ n }) => (
    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
  ),
};

const TABS = [
  { id: 'dossier',    label: 'Dossier',             icon: <Ic.User /> },
  { id: 'formulaire', label: 'Réponses formulaire',  icon: <Ic.File /> },
  { id: 'evaluation', label: 'Évaluation',           icon: <Ic.Star /> },
];

const PROG_COLORS = {
  FinTech: 'bg-sky-500', HealthTech: 'bg-emerald-500', AgriTech: 'bg-amber-500',
  EdTech: 'bg-violet-500', CleanTech: 'bg-green-600', FoodTech: 'bg-orange-500',
  'AI/ML': 'bg-pink-600', default: 'bg-slate-500',
};
const progBg = s => PROG_COLORS[s] || PROG_COLORS.default;

export default function JuryCandidatureDetailPage() {
  const { id } = useParams();
  const [mounted,     setMounted]     = useState(false);
  const [candidature, setCandidature] = useState(null);
  const [criteria,    setCriteria]    = useState([]);
  const [existing,    setExisting]    = useState(null);
  const [programme,   setProgramme]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState('dossier');

  const [scores,     setScores]     = useState({});
  const [remarks,    setRemarks]    = useState({});
  const [globalNote, setGlobalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [formError,  setFormError]  = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !id) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [candRes, critRes, evalRes] = await Promise.all([
          axiosAuth.get(`/api/jury-space/candidatures/${id}`),
          axiosAuth.get(`/api/jury-space/candidatures/${id}/criteria`),
          axiosAuth.get(`/api/jury-space/candidatures/${id}/my-evaluation`),
        ]);
        const cand = candRes.data.candidature || candRes.data;
        setCandidature(cand);

        if (cand.programmeId || cand.programmeName) {
          try {
            const pr = await axiosAuth.get(`/api/programmes/${cand.programmeId || ''}?name=${encodeURIComponent(cand.programmeName || '')}`);
            setProgramme(pr.data.programme || pr.data);
          } catch {}
        }

        const list = critRes.data.criteria || [];
        setCriteria(list);
        const s = {}, r = {};
        list.forEach(c => { s[c._id] = 0; r[c._id] = ''; });
        setScores(s); setRemarks(r);

        if (evalRes.data.evaluation) {
          setExisting(evalRes.data.evaluation);
          const ps = {}, pr = {};
          (evalRes.data.evaluation.scores || []).forEach(sc => { ps[sc.criterionId] = sc.score; pr[sc.criterionId] = sc.remark || ''; });
          setScores(ps); setRemarks(pr);
          setGlobalNote(evalRes.data.evaluation.globalNote || '');
        }
      } catch (err) { setError(err.response?.data?.message || err.message); }
      finally { setLoading(false); }
    })();
  }, [mounted, id]);

  if (!mounted) return null;

  const totalW = criteria.reduce((s, c) => s + (c.weight || 1), 0);
  const computedScore = criteria.length
    ? criteria.reduce((s, c) => s + ((scores[c._id] || 0) / (c.maxScore || 10)) * (c.weight || 1), 0) / totalW * (criteria[0]?.maxScore || 10)
    : 0;
  const allFilled = criteria.length > 0 && criteria.every(c => (scores[c._id] || 0) > 0);

  const handleSubmit = async () => {
    if (!allFilled) return;
    setSubmitting(true); setFormError(null);
    try {
      const { data } = await axiosAuth.post(`/api/jury-space/candidatures/${id}/evaluate`, {
        scores: criteria.map(c => ({ criterionId: c._id, criterionLabel: c.label, score: scores[c._id] || 0, remark: remarks[c._id] || '', weight: c.weight || 1, maxScore: c.maxScore || 10 })),
        globalNote,
        computedScore: Number(computedScore.toFixed(2)),
      });
      setExisting(data.evaluation); setSubmitted(true);
    } catch (err) { setFormError(err.response?.data?.message || err.message); }
    finally { setSubmitting(false); }
  };

  const name     = candidature?.projectName || candidature?.companyName || 'Candidature';
  const sector   = candidature?.sector || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const already  = !!existing;
  const responses = candidature?.responses || [];

  return (
    <ProtectedRoute allowedRoles={['mentor', 'jury']}>
      <DashboardLayout>
        <div className="space-y-5 pb-12">

          {/* ── Header ── */}
          <div className="relative overflow-hidden rounded-2xl p-7"
            style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4338ca 70%,#6d28d9 100%)' }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }}/>
            <div className="relative">
              <Link href="/dashboard/jury/candidatures">
                <button className="flex items-center gap-1.5 text-white/70 hover:text-white transition text-sm mb-5">
                  <Ic.Back /> Retour aux candidatures
                </button>
              </Link>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse"/>
                  <div className="h-4 w-72 bg-white/10 rounded animate-pulse"/>
                </div>
              ) : candidature ? (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl ${progBg(sector)} flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg`}>
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-2xl lg:text-3xl font-bold text-white">{name}</h1>
                        {sector && <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${progBg(sector)}`}>{sector}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-indigo-200 text-sm flex-wrap">
                        {candidature.founderName && <span className="flex items-center gap-1"><Ic.User />{candidature.founderName}</span>}
                        {candidature.programmeName && <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-400 rounded-full"/>{candidature.programmeName}</span>}
                        {candidature.location && <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-400 rounded-full"/>{candidature.location}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {already ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-sm font-semibold">
                        <Ic.Check /> Évaluation soumise — {Number(existing?.computedScore || 0).toFixed(1)}/10
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-200 text-sm font-semibold">
                        <Ic.Star /> En attente d'évaluation
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-red-300">{error}</p>
              )}
            </div>
          </div>

          {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"/>)}</div>}

          {!loading && candidature && (
            <>
              {/* Programme context */}
              {(programme || candidature.programmeName) && (
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${progBg(sector)}`}>
                      <Ic.Target />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Programme d'accélération</p>
                      <p className="font-bold text-gray-900 dark:text-white">{programme?.titre || candidature.programmeName}</p>
                      {(programme?.description || candidature.programmeDescription) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                          {(programme?.description || candidature.programmeDescription).split('\n')[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
                {/* Tab bar */}
                <div className="flex p-2 gap-1 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm flex-1 transition font-medium ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <span className={activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : ''}>{tab.icon}</span>
                      {tab.label}
                      {tab.id === 'evaluation' && already && <span className="w-2 h-2 bg-emerald-500 rounded-full"/>}
                      {tab.id === 'formulaire' && responses.length > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">{responses.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-6">

                  {/* ── Dossier ── */}
                  {activeTab === 'dossier' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          ['Secteur',      sector                    || '—'],
                          ['Stade',        candidature.stage         || '—'],
                          ['Fondateur',    candidature.founderName   || '—'],
                          ['Email',        candidature.email         || '—'],
                          ['Localisation', candidature.location      || '—'],
                          ['Programme',    candidature.programmeName || 'Spontanée'],
                        ].map(([l, v]) => (
                          <div key={l} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{l}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{v}</p>
                          </div>
                        ))}
                      </div>

                      {candidature.description && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">{candidature.description}</p>
                        </div>
                      )}
                      {candidature.problemStatement && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Problème adressé</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">{candidature.problemStatement}</p>
                        </div>
                      )}
                      {candidature.solution && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Solution proposée</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">{candidature.solution}</p>
                        </div>
                      )}

                      {!already && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button onClick={() => setActiveTab('formulaire')}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition">
                            <Ic.File /> Voir les réponses
                          </button>
                          <button onClick={() => setActiveTab('evaluation')}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition">
                            <Ic.Star /> Commencer l'évaluation →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Formulaire ── */}
                  {activeTab === 'formulaire' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                        <span className="text-indigo-500 flex-shrink-0 mt-0.5"><Ic.Info /></span>
                        <div>
                          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Comment utiliser ces réponses ?</p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 leading-relaxed">
                            Lisez attentivement chaque réponse. Elles vous aideront à scorer précisément chaque critère dans l'onglet <strong>Évaluation</strong>.
                          </p>
                        </div>
                      </div>

                      {responses.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400"><Ic.File /></div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Aucune réponse de formulaire</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Le candidat n'a pas encore soumis ses réponses.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {responses.map((resp, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl p-4 transition">
                              <div className="flex items-start gap-3">
                                <Ic.Num n={i + 1} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1.5">{resp.question}</p>
                                  {resp.answer && resp.answer !== '—' && resp.answer !== 'null'
                                    ? <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{resp.answer}</p>
                                    : <p className="text-sm text-amber-600 dark:text-amber-400 italic">Aucune réponse fournie</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={() => setActiveTab('evaluation')}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition">
                        <Ic.Star /> Passer à l'évaluation →
                      </button>
                    </div>
                  )}

                  {/* ── Évaluation ── */}
                  {activeTab === 'evaluation' && (
                    <div className="space-y-5 max-w-2xl">

                      {already && !submitted && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                          <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0"><Ic.Check /></div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Évaluation déjà soumise</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">Score final : <strong>{Number(existing?.computedScore || 0).toFixed(2)}</strong> / {criteria[0]?.maxScore || 10}</p>
                          </div>
                        </div>
                      )}

                      {submitted && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><Ic.Check /></div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Évaluation soumise avec succès !</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Score : {computedScore.toFixed(2)}</p>
                          </div>
                        </div>
                      )}

                      {criteria.length === 0 && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                          <span className="text-amber-500 flex-shrink-0 mt-0.5"><Ic.Info /></span>
                          <p className="text-sm text-amber-700 dark:text-amber-300">La grille d'évaluation n'a pas encore été configurée par l'administrateur.</p>
                        </div>
                      )}

                      {criteria.length > 0 && (
                        <>
                          {/* Score preview */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Score pondéré</p>
                              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{computedScore.toFixed(2)}</p>
                              <p className="text-xs text-gray-400 mt-0.5">sur {criteria[0]?.maxScore || 10}</p>
                            </div>
                            <div className="flex gap-2">
                              {criteria.map(c => {
                                const pct = ((scores[c._id] || 0) / (c.maxScore || 10)) * 100;
                                return (
                                  <div key={c._id} className="flex flex-col items-center gap-1">
                                    <div className="relative w-10 h-10">
                                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700"/>
                                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4"
                                          className={pct >= 70 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-400'}
                                          strokeDasharray={`${pct} 100`} strokeLinecap="round"/>
                                      </svg>
                                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700 dark:text-gray-300">
                                        {scores[c._id] || 0}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-gray-400 text-center max-w-[36px] truncate">{c.label.split(' ')[0]}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Criteria */}
                          <div className="space-y-4">
                            {criteria.map((c, idx) => {
                              const cur = scores[c._id] || 0;
                              const max = c.maxScore || 10;
                              const pct = max > 0 ? (cur / max) * 100 : 0;
                              const readonly = already && !submitted;
                              const barColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

                              return (
                                <div key={c._id} className={`border rounded-2xl p-5 transition ${cur > 0 ? 'border-indigo-200 dark:border-indigo-700' : 'border-gray-200 dark:border-gray-700'}`}>
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-2">
                                      <Ic.Num n={idx + 1} />
                                      <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{c.label}</p>
                                        {c.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.description}</p>}
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                      <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">{cur}</span>
                                      <span className="text-xs text-gray-400">/{max}</span>
                                      <div className="text-[10px] text-indigo-500 font-semibold">×{c.weight || 1}</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 mb-3">
                                    <input type="range" min={0} max={max} step={0.5} value={cur} disabled={readonly}
                                      onChange={e => setScores(p => ({ ...p, [c._id]: Number(e.target.value) }))}
                                      className="flex-1 h-2 accent-indigo-600"/>
                                    <input type="number" min={0} max={max} step={0.5} value={cur} disabled={readonly}
                                      onChange={e => setScores(p => ({ ...p, [c._id]: Math.min(max, Math.max(0, Number(e.target.value))) }))}
                                      className="w-16 text-center text-sm font-bold border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
                                  </div>

                                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: barColor }}/>
                                  </div>

                                  <textarea rows={2} value={remarks[c._id] || ''} disabled={readonly}
                                    placeholder="Votre commentaire sur ce critère…"
                                    onChange={e => setRemarks(p => ({ ...p, [c._id]: e.target.value }))}
                                    className="w-full text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400"/>
                                </div>
                              );
                            })}
                          </div>

                          {/* Global note */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Synthèse globale</label>
                            <textarea rows={4} value={globalNote} disabled={already && !submitted}
                              placeholder="Résumez votre évaluation : points forts, points faibles, recommandation…"
                              onChange={e => setGlobalNote(e.target.value)}
                              className="w-full text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-400"/>
                          </div>

                          {/* Confidentiality */}
                          <div className="flex items-start gap-2.5 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <span className="text-gray-400 flex-shrink-0 mt-0.5"><Ic.Lock /></span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              Votre évaluation est <strong>strictement confidentielle</strong>. Les scores sont consolidés par l'administrateur avec ceux des autres jurys avant la décision finale.
                            </p>
                          </div>

                          {formError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">{formError}</div>
                          )}

                          {!(already && !submitted) && (
                            <button onClick={handleSubmit} disabled={!allFilled || submitting || submitted}
                              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition shadow-lg shadow-indigo-500/20">
                              {submitted ? <><Ic.Check /> Évaluation soumise</> : submitting ? 'Envoi…' : !allFilled ? 'Notez tous les critères pour soumettre' : <><Ic.Send /> Soumettre mon évaluation</>}
                            </button>
                          )}

                          {already && existing?.scores?.length > 0 && (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Récapitulatif soumis</p>
                              </div>
                              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {existing.scores.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{s.criterionLabel}</p>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-gray-400">×{s.weight}</span>
                                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.score}/{s.maxScore || 10}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}