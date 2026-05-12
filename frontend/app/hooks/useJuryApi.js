// app/hooks/useJuryApi.js
// ─────────────────────────────────────────────────────────────────
// Hook centralisé — gestion des jurés
// Token injecté automatiquement par l'intercepteur axiosAuth
// ─────────────────────────────────────────────────────────────────

import axiosAuth from '@/app/lib/axiosAuth';

export function useJuryApi() {
  return {
    // ── Liste tous les jurés ─────────────────────────────
    fetchAll: async (params = {}) => {
      const { data } = await axiosAuth.get('/api/jury', { params });
      return data; // { success, jury, total }
    },

    // ── Stats ────────────────────────────────────────────
    fetchStats: async () => {
      const { data } = await axiosAuth.get('/api/jury/stats');
      return data.stats ?? data;
    },

    // ── Créer un juré ────────────────────────────────────
    create: async (juryData) => {
      const { data } = await axiosAuth.post('/api/jury', juryData);
      return data.jury ?? data;
    },

    // ── Modifier un juré ─────────────────────────────────
    update: async (id, juryData) => {
      const { data } = await axiosAuth.put(`/api/jury/${id}`, juryData);
      return data.jury ?? data;
    },

    // ── Supprimer un juré ────────────────────────────────
    remove: async (id) => {
      const { data } = await axiosAuth.delete(`/api/jury/${id}`);
      return data;
    },

    // ── Assigner programmes ──────────────────────────────
    assignProgrammes: async (id, programmeIds, programmeNames) => {
      const { data } = await axiosAuth.patch(
        `/api/jury/${id}/programmes`,
        { programmeIds, programmeNames }
      );
      return data.jury ?? data;
    },

    // ── Envoyer invitation ───────────────────────────────
    sendInvite: async (id, email, message) => {
      const { data } = await axiosAuth.post(`/api/jury/${id}/invite`, { email, message });
      return data;
    },

    // ── Historique évaluations d'un juré ─────────────────
    fetchEvaluations: async (id) => {
      const { data } = await axiosAuth.get(`/api/jury/${id}/evaluations`);
      return data;
    },
  };
}