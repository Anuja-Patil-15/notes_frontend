import axios from 'axios';

const api = axios.create({
  baseURL: 'https://notes-backend-70vb.onrender.com/api',
  withCredentials: true, // Server cookies accept sathi garjeche aahe
});

// Request Interceptor: Jar local token asel tar header madhe pathvnyasathi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Break loop on login page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // FIX: Fakt tevhach login var redirection kara jeva user aadhich login page var NAHIYE!
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token'); // clear stale session data
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
