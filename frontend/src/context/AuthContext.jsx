import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('crr_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('crr_token');
    if (token) {
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('crr_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('crr_token');
          localStorage.removeItem('crr_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { token, user: userData } = res.data;
    localStorage.setItem('crr_token', token);
    localStorage.setItem('crr_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user: userData } = res.data;
    localStorage.setItem('crr_token', token);
    localStorage.setItem('crr_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crr_token');
    localStorage.removeItem('crr_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isContributor = user?.role === 'contributor';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAdmin, isContributor, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
