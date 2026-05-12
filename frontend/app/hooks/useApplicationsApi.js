// app/hooks/useApplicationsApi.js
// ─────────────────────────────────────────────────────────────────
// Hook centralisé — candidatures admin
// Le token est injecté automatiquement par l'intercepteur axiosAuth
// ─────────────────────────────────────────────────────────────────

import { axiosAuth } from '@/app/store/slices/authSlice';
/**
 * Guard interne : lève une erreur claire si l'id est undefined/null.
 * Évite les appels à /api/.../undefined/...
 */
function requireId(id, action) {
  if (!id) throw new Error(`[useApplicationsApi] ${action} — id est undefined. Vérifiez que normalize() est appliqué sur le tableau d'applications.`);
}

export function useApplicationsApi() {
  return {
    fetchAll: async (params = {}) => {
      const { data } = await axiosAuth.get('/api/applications/admin', { params });
      return data;
    },

    // ── Stats dashboard ─────────────────────────────────────────
    fetchStats: async () => {
      const { data } = await axiosAuth.get('/api/applications/admin/stats');
      return data.stats ?? data;
    },

    // ── Détail d'une candidature ────────────────────────────────
    fetchOne: async (id) => {
      requireId(id, 'fetchOne');
      const { data } = await axiosAuth.get(`/api/applications/admin/${id}`);
      return data.application ?? data;
    },

    // ── Changer le statut + note de décision ────────────────────
    updateStatus: async (id, status, note = '') => {
      requireId(id, 'updateStatus');
      const { data } = await axiosAuth.patch(
        `/api/applications/admin/${id}/status`,
        { status, note }
      );
      return data.application ?? data;
    },

    // ── Sauvegarder scores admin ────────────────────────────────
    updateScores: async (id, scores, remarks, totalScore) => {
      requireId(id, 'updateScores');
      const { data } = await axiosAuth.patch(
        `/api/applications/admin/${id}/scores`,
        { scores, remarks, totalScore }
      );
      return data.application ?? data;
    },

    // ── Assigner des jurés ──────────────────────────────────────
    // ✅ FIX : requireId() garantit qu'on n'appelle jamais /undefined/jury
    assignJury: async (id, juryIds, juryNames) => {
      requireId(id, 'assignJury');
      const { data } = await axiosAuth.patch(
        `/api/applications/admin/${id}/jury`,
        { juryIds, juryNames }
      );
      return data.application ?? data;
    },

    // ── Marquer candidat notifié ────────────────────────────────
    markNotified: async (id) => {
      requireId(id, 'markNotified');
      const { data } = await axiosAuth.patch(
        `/api/applications/admin/${id}/notify`,
        {}
      );
      return data;
    },
  };
}