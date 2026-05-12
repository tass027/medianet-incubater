import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
API.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (userData) => API.post('/auth/register', userData),
  logout: () => API.post('/auth/logout'),
  refreshToken: (refreshToken) => API.post('/auth/refresh-token', { refreshToken }),
};

// ==================== USER API ====================
export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  getUsers: () => API.get('/users'),
  getUserById: (id) => API.get(`/users/${id}`),
};

// ==================== APPLICATION API ====================
export const applicationAPI = {
  create: (data) => API.post('/applications', data),
  getAll: () => API.get('/applications'),
  getById: (id) => API.get(`/applications/${id}`),
  update: (id, data) => API.put(`/applications/${id}`, data),
  uploadDocuments: (id, formData) => 
    API.post(`/applications/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ==================== STARTUP API ====================
export const startupAPI = {
  create: (data) => API.post('/startups', data),
  getAll: (filters) => API.get('/startups', { params: filters }),
  getById: (id) => API.get(`/startups/${id}`),
  update: (id, data) => API.put(`/startups/${id}`, data),
  delete: (id) => API.delete(`/startups/${id}`),
  
  // KPIs
  addKPI: (id, kpiData) => API.post(`/startups/${id}/kpis`, kpiData),
  getKPIs: (id) => API.get(`/startups/${id}/kpis`),
  updateKPI: (kpiId, data) => API.put(`/kpis/${kpiId}`, data),
  deleteKPI: (kpiId) => API.delete(`/kpis/${kpiId}`),
  
  // Milestones
  addMilestone: (id, data) => API.post(`/startups/${id}/milestones`, data),
  getMilestones: (id) => API.get(`/startups/${id}/milestones`),
};

// ==================== EVALUATION API ====================
export const evaluationAPI = {
  create: (data) => API.post('/evaluations', data),
  getById: (id) => API.get(`/evaluations/${id}`),
  getByApplication: (applicationId) => API.get(`/applications/${applicationId}/evaluation`),
};

// ==================== MATCHING API ====================
export const matchingAPI = {
  getMatches: () => API.get('/investors/me/matches'),
  getInvestorsForStartup: (startupId) => API.get(`/startups/${startupId}/investors`),
};

// ==================== MESSAGE API ====================
export const messageAPI = {
  send: (data) => API.post('/messages', data),
  getConversations: () => API.get('/conversations'),
  getMessages: (conversationId) => API.get(`/conversations/${conversationId}/messages`),
};

export default API;