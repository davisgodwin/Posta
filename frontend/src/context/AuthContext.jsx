import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Updated endpoint path to include /api/
      const res = await api.get('/api/auth/me.php');
      if (res.data.authenticated) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    // Updated endpoint path to include /api/
    const res = await api.post('/api/auth/login.php', credentials);
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (userData) => {
    // Updated endpoint path to include /api/
    const res = await api.post('/api/auth/register.php', userData);
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    // Updated endpoint path to include /api/
    await api.get('/api/auth/logout.php');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);