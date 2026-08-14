import axios from 'axios';

// 1. Read Base URL from Environment or default to local fallback
const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost/posta/backend';

// 2. Sanitize: Remove brackets [], parentheses (), quotes, and trailing slashes
export const API_BASE_URL = RAW_BASE_URL
  .replace(/[\[\]\(\)'"]/g, '')
  .replace(/\/+$/, '');

// 3. Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  params: {
    'ngrok-skip-browser-warning': 'true', // Query parameter fallback for mobile Safari/Chrome
  },
});

// ==========================================
// AUTHENTICATION API HELPER FUNCTIONS
// ==========================================

/**
 * Registers a new user account
 * @param {Object} userData - { name, username, email, password, confirmPassword }
 */
export const registerUser = async (userData) => {
  const response = await api.post('/api/auth/register.php', userData);
  return response.data;
};

/**
 * Logs in an existing user
 * @param {Object} credentials - { login, password }
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/login.php', credentials);
  return response.data;
};

export default api;