import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/posta/backend';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends session cookies cross-origin
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420', // Bypasses ngrok warning page on mobile
  },
});

export default api;