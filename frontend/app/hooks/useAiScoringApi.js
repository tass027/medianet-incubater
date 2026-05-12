import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchAiScore, triggerAiScore } from '../store/slices/aiScoringSlice';

export function useAiScoring(applicationId) {
  const dispatch = useDispatch();
  const score   = useSelector(s => s.aiScoring.scores[applicationId]);
  const loading = useSelector(s => s.aiScoring.loading[applicationId]);

  useEffect(() => {
    if (applicationId && applicationId !== 'undefined') {
      dispatch(fetchAiScore(applicationId));
    }
  }, [applicationId]);

  // Polling si status = pending
  useEffect(() => {
    if (score?.status !== 'pending') return;
    const interval = setInterval(() => {
      dispatch(fetchAiScore(applicationId));
    }, 4000);
    return () => clearInterval(interval);
  }, [score?.status]);

  const trigger = () => {
    if (!applicationId || applicationId === 'undefined') {
      console.error('applicationId manquant');
      return;
    }
    dispatch(triggerAiScore(applicationId));
  };

  return { score, loading, trigger };
}