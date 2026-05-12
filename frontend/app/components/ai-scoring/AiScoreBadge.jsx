'use client';
import { useAiScoring } from '../../hooks/useAiScoringApi';

export default function AiScoreBadge({ applicationId }) {
  const { score, loading, trigger } = useAiScoring(applicationId);

  if (loading && !score) {
    return <span className="text-xs text-gray-400 animate-pulse">Chargement...</span>;
  }

  if (!score) {
    return (
      <button
        onClick={trigger}
        className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
      >
        ✨ Scorer avec IA
      </button>
    );
  }

  if (score.status === 'pending') {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 animate-pulse">
        ⏳ Scoring en cours...
      </span>
    );
  }

  if (score.status === 'failed') {
    return (
      <button
        onClick={trigger}
        className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
      >
        ⚠️ Réessayer
      </button>
    );
  }

  const color = score.total >= 70 ? 'text-green-700 bg-green-100'
              : score.total >= 50 ? 'text-yellow-700 bg-yellow-100'
              : 'text-red-700 bg-red-100';

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
      🤖 {score.total}/100
    </span>
  );
}