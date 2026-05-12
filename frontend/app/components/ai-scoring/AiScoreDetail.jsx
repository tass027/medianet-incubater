'use client';
import { useAiScoring } from '../../hooks/useAiScoringApi';

const CRITERIA = [
  { key: 'problem',  label: 'Problème',  color: 'bg-blue-500' },
  { key: 'market',   label: 'Marché',    color: 'bg-purple-500' },
  { key: 'team',     label: 'Équipe',    color: 'bg-green-500' },
  { key: 'solution', label: 'Solution',  color: 'bg-orange-500' },
  { key: 'traction', label: 'Traction',  color: 'bg-pink-500' },
];

export default function AiScoreDetail({ applicationId }) {
  const { score, loading, trigger } = useAiScoring(applicationId);

  if (!score) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-purple-900">🤖 Score IA</h3>
            <p className="text-sm text-purple-600 mt-1">Analysez cette candidature avec l'IA</p>
          </div>
          <button
            onClick={trigger}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {loading ? 'Lancement...' : '✨ Lancer le scoring'}
          </button>
        </div>
      </div>
    );
  }

  if (score.status === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-yellow-700 text-sm animate-pulse">⏳ Analyse IA en cours... (30-60 sec)</p>
      </div>
    );
  }

  if (score.status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <p className="text-red-700 text-sm">❌ Le scoring a échoué</p>
          <button onClick={trigger} className="text-sm text-red-700 underline">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-semibold text-gray-900">Score IA</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">aide à la décision</span>
        </div>
        <span className={`text-2xl font-bold ${
          score.total >= 70 ? 'text-green-600'
          : score.total >= 50 ? 'text-yellow-600'
          : 'text-red-600'
        }`}>
          {score.total}/100
        </span>
      </div>

      {/* Barres des 5 critères */}
      <div className="space-y-2 mb-4">
        {CRITERIA.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className={`${color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${(score.scores?.[key] / 20) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-8 text-right">
              {score.scores?.[key]}/20
            </span>
          </div>
        ))}
      </div>

      {score.criteriaJustification && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Analyse par critère
          </p>
          {CRITERIA.map(({ key, label }) => (
            score.criteriaJustification[key] && (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {score.criteriaJustification[key]}
                </p>
              </div>
            )
          ))}
        </div>
      )}
      
      {/* Résumé */}
      {score.summary && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">{score.summary}</p>
      )}

      {/* Points forts / faibles */}
      <div className="grid grid-cols-2 gap-3">
        {score.strengths?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-green-700 mb-1">✅ Points forts</p>
            <ul className="space-y-1">
              {score.strengths.map((s, i) => (
                <li key={i} className="text-xs text-gray-600">• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {score.weaknesses?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-red-700 mb-1">⚠️ Points faibles</p>
            <ul className="space-y-1">
              {score.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-gray-600">• {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={trigger}
        className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
      >
        🔄 Re-scorer
      </button>
    </div>
  );
}