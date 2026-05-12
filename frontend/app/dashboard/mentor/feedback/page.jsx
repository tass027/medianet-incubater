'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Button from '@/app/components/common/Button';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import useMentorStartups from '@/app/hooks/useMentorStartups';
import useMentorFeedback from '@/app/hooks/useMentorFeedback';

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
  Send: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Star: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  User: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

const AXES = [
  { key: 'product', label: 'Produit',  placeholder: 'Qualité, roadmap, avancement technique…' },
  { key: 'team',    label: 'Équipe',   placeholder: 'Dynamique, compétences, recrutements…' },
  { key: 'market',  label: 'Marché',   placeholder: 'Traction, acquisition, compétition…' },
  { key: 'finance', label: 'Finance',  placeholder: 'Revenus, dépenses, runway…' },
];

export default function MentorFeedback() {
  const searchParams      = useSearchParams();
  const preselectedId     = searchParams.get('startupId') || null;

  const { startups, loading: loadingStartups } = useMentorStartups();
  const { submitFeedback }                     = useMentorFeedback();

  const [mounted,        setMounted]        = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [comment,        setComment]        = useState('');
  const [rating,         setRating]         = useState(0);
  const [hoverRating,    setHoverRating]    = useState(0);
  const [axes,           setAxes]           = useState({ product: '', team: '', market: '', finance: '' });
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [error,          setError]          = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select if startupId passed in URL
  useEffect(() => {
    if (preselectedId && startups.length > 0) {
      const found = startups.find((s) => s._id === preselectedId);
      if (found) setSelectedStartup(found);
    }
  }, [preselectedId, startups]);

  if (!mounted) return null;

  const handleSubmit = async () => {
    if (!comment.trim() || rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitFeedback({
        startupId:  selectedStartup._id,
        rating,
        comment,
        axes,
        visibility: 'startup',
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedStartup(null);
        setComment('');
        setRating(0);
        setAxes({ product: '', team: '', market: '', finance: '' });
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
          .glass-card:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -12px rgba(0,0,0,0.15); }
          .rating-star { cursor: pointer; transition: all 0.2s ease; }
          .rating-star:hover { transform: scale(1.1); }
          .input-base {
            width: 100%; padding: 0.625rem 1rem;
            border: 1px solid #e5e7eb; border-radius: 0.75rem;
            background: white; color: #111827; transition: all 0.2s;
          }
          :global(.dark) .input-base { border-color: #374151; background: #1f2937; color: #f9fafb; }
          .input-base:focus { outline: none; border-color: #006d94; box-shadow: 0 0 0 3px rgba(0,109,148,0.15); }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Link href="/dashboard/mentor/startups">
                  <button className="flex items-center gap-2 text-white/80 hover:text-white transition">
                    <Icons.ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">Feedbacks</h1>
                <Badge variant="info" size="lg">Mentor</Badge>
              </div>
              <p className="text-blue-100 text-base max-w-2xl">
                Évaluez et conseillez les startups que vous accompagnez
              </p>
            </div>
          </div>

          {/* Startup list or feedback form */}
          {!selectedStartup ? (
            <>
              {loadingStartups ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1,2,3].map((i) => <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
                </div>
              ) : startups.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Icons.Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucune startup assignée</h3>
                  <p className="text-gray-500">Les startups assignées par l'admin apparaîtront ici</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {startups.map((startup) => (
                    <div
                      key={startup._id}
                      onClick={() => setSelectedStartup(startup)}
                      className="glass-card rounded-xl p-6 cursor-pointer hover:scale-[1.02] transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                            {startup.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{startup.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{startup.sector}</p>
                          </div>
                        </div>
                        <Badge variant={startup.feedbackCount > 0 ? 'success' : 'warning'} size="sm">
                          {startup.feedbackCount > 0 ? `${startup.feedbackCount} feedback${startup.feedbackCount > 1 ? 's' : ''}` : 'En attente'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Icons.User className="w-4 h-4" />
                        <span>{startup.founder || '—'}</span>
                      </div>

                      {startup.lastSession && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                          <Icons.Clock className="w-3 h-3" />
                          <span>Dernière session: {new Date(startup.lastSession).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}

                      <Button variant="outline" className="w-full mt-4">
                        Donner un feedback
                        <Icons.ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Feedback Form
            <div className="glass-card rounded-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedStartup(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  >
                    <Icons.ArrowLeft className="w-5 h-5 text-gray-500" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedStartup.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedStartup.sector}</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Évaluation globale *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="rating-star"
                    >
                      <Icons.Star
                        className={`w-8 h-8 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {rating === 1 && 'À améliorer significativement'}
                  {rating === 2 && 'Des efforts nécessaires'}
                  {rating === 3 && 'Satisfaisant'}
                  {rating === 4 && 'Très bon travail'}
                  {rating === 5 && 'Excellent !'}
                </p>
              </div>

              {/* Global comment */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Commentaire général *
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="input-base resize-none"
                  placeholder="Points forts, axes d'amélioration, conseils…"
                />
              </div>

              {/* Axes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Analyse détaillée par axe (optionnel)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AXES.map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                        {label}
                      </label>
                      <textarea
                        value={axes[key]}
                        onChange={(e) => setAxes((prev) => ({ ...prev, [key]: e.target.value }))}
                        rows={2}
                        className="input-base resize-none text-sm"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedStartup(null)}>Annuler</Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!comment.trim() || rating === 0 || submitting || submitted}
                  className="flex items-center gap-2"
                >
                  {submitted ? (
                    <><Icons.Check className="w-4 h-4" /> Envoyé</>
                  ) : submitting ? (
                    'Envoi…'
                  ) : (
                    <><Icons.Send className="w-4 h-4" /> Envoyer le feedback</>
                  )}
                </Button>
              </div>

              {submitted && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm text-center">
                  Feedback envoyé avec succès !
                </div>
              )}
            </div>
          )}

          {/* Footer tip */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800">
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icons.Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Conseils pour un feedback efficace</h3>
                  <p className="text-white/60 text-sm">Soyez précis, constructif et bienveillant</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {['PRÉCIS', 'CONSTRUCTIF', 'BIENVEILLANT'].map((word, i) => (
                  <div key={word} className="flex items-center gap-6">
                    {i > 0 && <div className="w-px h-8 bg-white/20" />}
                    <div className="text-center">
                      <p className="text-white font-bold">{word}</p>
                    </div>
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