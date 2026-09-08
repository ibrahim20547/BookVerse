import axios from 'axios';

const getBaseUrl = () => {
  // If explicitly provided in environment variables (e.g. custom backend domain)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production (Vercel deployment), use relative '/api' endpoint
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In local development, default to local Flask server
  const hostname = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
  return `http://${hostname}:5000/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
