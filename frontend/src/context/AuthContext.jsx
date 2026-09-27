import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('trekmate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('trekmate_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const resp = await api.get('/auth/me');
      setUser(resp.data.user);
      localStorage.setItem('trekmate_user', JSON.stringify(resp.data.user));
    } catch (err) {
      console.error("Auth me check failed, using cached session:", err);
      const saved = localStorage.getItem('trekmate_user');
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const resp = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = resp.data;
    localStorage.setItem('trekmate_token', access_token);
    localStorage.setItem('trekmate_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, confirm_password, phone, role) => {
    const resp = await api.post('/auth/register', {
      name,
      email,
      password,
      confirm_password,
      phone,
      role
    });
    const { access_token, user: userData } = resp.data;
    localStorage.setItem('trekmate_token', access_token);
    localStorage.setItem('trekmate_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('trekmate_token');
    localStorage.removeItem('trekmate_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const newU = { ...prev, ...updatedData };
      localStorage.setItem('trekmate_user', JSON.stringify(newU));
      return newU;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
