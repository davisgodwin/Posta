import axios from 'axios';

// 1. Force the exact canonical URL string parameters directly into the compilation layer
// Notice the intentional addition of the trailing slash right after /api/ to block 301 directory upgrades
export const API_BASE_URL = 'https://onrender.com';

// 2. Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', 
  },
  params: {
    'ngrok-skip-browser-warning': 'true', 
  },
});

// ==========================================
// AUTHENTICATION API HELPER FUNCTIONS
// ==========================================

export const registerUser = async (userData) => {
  // ✅ FIXED PATHING: Stripped leading slash to allow clean base URL resolution
  const response = await api.post('auth/register.php', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('auth/login.php', credentials);
  return response.data;
};

export default api;
