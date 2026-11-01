import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('datalens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  getUsers: () => API.get('/auth/users')
};

export const datasetsApi = {
  upload: (formData, onProgress) =>
    API.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    }),
  loadSample: () => API.post('/datasets/sample'),
  list: () => API.get('/datasets'),
  getById: (id, params = {}) => API.get(`/datasets/${id}`, { params }),
  clean: (id, payload) => API.post(`/datasets/${id}/clean`, payload),
  delete: (id) => API.delete(`/datasets/${id}`),
  getExportUrl: (id) => `/api/datasets/${id}/export`
};

export default API;
