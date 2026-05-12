// app/hooks/useEvaluationsApi.js
// ─────────────────────────────────────────────────────────────────
// FIXES :
//   1. fetchAll()  → /api/admin/evaluations  (était /api/evaluations)
//   2. fetchStats()→ /api/admin/evaluations/stats
//   3. update()    → PATCH  (était PUT — bloqué côté backend)
//   4. fetchByApplication() → /api/admin/evaluations/by-application/:id
// ─────────────────────────────────────────────────────────────────

import axiosAuth from '@/app/lib/axiosAuth';

export function useEvaluationsApi() {
  return {
    // ── Toutes les évaluations (admin) ─────────────────────────────
    // ✅ FIX : /api/evaluations → /api/admin/evaluations
    fetchAll: async (params = {}) => {
      const { data } = await axiosAuth.get('/api/admin/evaluations', { params });
      return data; // { success, evaluations, total }
    },

    // ── Stats ───────────────────────────────────────────────────────
    // ✅ FIX : /api/evaluations/stats → /api/admin/evaluations/stats
    fetchStats: async () => {
      const { data } = await axiosAuth.get('/api/admin/evaluations/stats');
      return data.stats ?? data;
    },

    // ── Évaluations pour une candidature ───────────────────────────
    // ✅ FIX : /api/evaluations/application/:id
    //       → /api/admin/evaluations/by-application/:id
    fetchByApplication: async (applicationId) => {
      const { data } = await axiosAuth.get(
        `/api/admin/evaluations/by-application/${applicationId}`
      );
      return data; // { success, evaluations, total, avgScore }
    },

    // ── Évaluations d'un juré ───────────────────────────────────────
    fetchByJury: async (juryId) => {
      const { data } = await axiosAuth.get(`/api/evaluations/jury/${juryId}`);
      return data;
    },

    // ── Soumettre une évaluation ────────────────────────────────────
    submit: async (evaluationData) => {
      const { data } = await axiosAuth.post('/api/evaluations', evaluationData);
      return data;
    },

    // ── Mettre à jour une évaluation ────────────────────────────────
    // ✅ FIX : PUT → PATCH  (PUT est bloqué par blockWrite dans les routes admin)
    update: async (id, evaluationData) => {
      const { data } = await axiosAuth.patch(
        `/api/admin/evaluations/${id}`,
        evaluationData
      );
      return data.evaluation ?? data;
    },
  };
}