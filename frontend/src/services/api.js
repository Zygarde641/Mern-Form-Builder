import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export const api = {
  // Auth
  loginWithAirtable: () => {
    window.location.href = `${API_URL}/auth/airtable`;
  },
  
  getCurrentUser: (userId) => axiosInstance.get(`/auth/me?userId=${userId}`),
  
  refreshToken: (userId) => axiosInstance.post('/auth/refresh', { userId }),

  // Forms - Airtable data
  getBases: (userId) => axiosInstance.get(`/api/forms/bases?userId=${userId}`),
  
  getTables: (baseId, userId) => axiosInstance.get(`/api/forms/bases/${baseId}/tables?userId=${userId}`),

  // Forms - CRUD
  getForms: (userId) => axiosInstance.get(`/api/forms?userId=${userId}`),
  
  createForm: (formData) => axiosInstance.post('/api/forms', formData),
  
  getForm: (formId) => axiosInstance.get(`/api/forms/${formId}`),
  
  updateForm: (formId, formData) => axiosInstance.put(`/api/forms/${formId}`, formData),
  
  deleteForm: (formId) => axiosInstance.delete(`/api/forms/${formId}`),

  // Responses
  submitResponse: (data) => axiosInstance.post('/api/responses', data),
  
  getResponses: (formId) => axiosInstance.get(`/api/responses/forms/${formId}`),
  
  getResponse: (responseId) => axiosInstance.get(`/api/responses/${responseId}`),
};

export default api;
