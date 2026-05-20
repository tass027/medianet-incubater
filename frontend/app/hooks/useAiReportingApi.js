// app/hooks/useAiReportingApi.js
import axiosAuth from '@/app/lib/axiosAuth';

export function useAiReportingApi() {

  const generate = async (applicationId, forceRegenerate = false) => {
    console.log('[AI] generate → applicationId:', applicationId);
    const res = await axiosAuth.post('/api/admin/ai-reporting/generate', {
      applicationId,
      forceRegenerate,
    });
    return res.data;
  };

  const getReport = async (applicationId) => {
    console.log('[AI] getReport → applicationId:', applicationId);
    const res = await axiosAuth.get(`/api/admin/ai-reporting/${applicationId}`);
    return res.data;
  };

  const deleteReport = async (applicationId) => {
    console.log('[AI] deleteReport → applicationId:', applicationId);
    await axiosAuth.delete(`/api/admin/ai-reporting/${applicationId}`);
  };

  return { generate, getReport, deleteReport };
}