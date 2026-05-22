import axios from 'axios';

// Get base URL from env, fallback to localhost
export const getBaseURL = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
};

// Get WebSocket URL based on env fallback
export const getWebSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Replace http:// with ws:// and https:// with wss://
    const wsBase = apiUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://')
      .replace(/\/api\/?$/, '');
    return `${wsBase}/ws/notifications/`;
  }
  return 'ws://localhost:8000/ws/notifications/';
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
