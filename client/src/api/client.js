import axios from 'axios';

// Single axios instance; the dev server proxies /api to the backend.
const api = axios.create({ baseURL: '/api' });

// Attach JWT from localStorage to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('hrms_token')) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
