import axios from 'axios';

// Get base URL from env, fallback to localhost
export const getBaseURL = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
};

// Get WebSocket URL based on env fallback
export const getWebSocketURL = () => {
  return import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('http', 'ws').replace('/api/', '/') + 'ws/notifications/'
    : 'ws://localhost:8000/ws/notifications/';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseURL();
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
