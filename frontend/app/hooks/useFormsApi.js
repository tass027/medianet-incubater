import { axiosAuth } from '@/app/store/slices/authSlice';
import { useCallback } from 'react';

export function useFormsApi() {
  return {
    fetchAll: async (params = {}) => {
      const { data } = await axiosAuth.get('/api/forms', { params });
      return data;
    },

    fetchStats: async () => {
      const { data } = await axiosAuth.get('/api/forms/stats');
      return data.stats ?? data;
    },

    fetchOne: async (id) => {
      const { data } = await axiosAuth.get(`/api/forms/${id}`);
      return data.form ?? data;
    },

    create: async (formData) => {
      const { data } = await axiosAuth.post('/api/forms', formData);
      return data.form ?? data;
    },

    update: async (id, formData) => {
      const { data } = await axiosAuth.put(`/api/forms/${id}`, formData);
      return data.form ?? data;
    },

    remove: async (id) => {
      // ⚠️ Ne pas try/catch ici — on laisse l'erreur remonter au composant
      const { data } = await axiosAuth.delete(`/api/forms/${id}`);
      return data;
    },

    send: async (id, recipients, message = '') => {
      const { data } = await axiosAuth.patch(`/api/forms/${id}/send`, { recipients, message });
      return data;
    },

    fetchResponses: async (id) => {
      const { data } = await axiosAuth.get(`/api/forms/${id}/responses`);
      return data;
    },

    submitResponse: async (id, responseData) => {
      const { data } = await axiosAuth.post(`/api/forms/${id}/responses`, responseData);
      return data.response ?? data;
    },

    deleteResponse: async (formId, responseId) => {
      const { data } = await axiosAuth.delete(`/api/forms/${formId}/responses/${responseId}`);
      return data;
    },
  };
}