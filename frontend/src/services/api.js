import axios from 'axios';

// ✅ Correct backend URL - this is the most important line
export const API_BASE_URL = 'https://posta-backend-4820.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// AUTHENTICATION API HELPER FUNCTIONS
// ==========================================

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register.php', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login.php', credentials);
  return response.data;
};

export default api;