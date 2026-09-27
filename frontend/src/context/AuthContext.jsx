import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

const DEFAULT_ACCOUNTS = [
  { id: 1, name: 'TrekMate Admin', email: 'admin@trekmate.com', role: 'admin', password: 'admin123' },
  { id: 2, name: 'Himalayan Guide Tenzing', email: 'guide@trekmate.com', role: 'guide', password: 'guide123' },
  { id: 3, name: 'Alex Mercer', email: 'trekker@trekmate.com', role: 'trekker', password: 'trekker123' },
  { id: 4, name: 'Ananth', email: 'ananthrajendran142@gmail.com', role: 'trekker', password: 'trekker123' },
  { id: 5, name: 'Priya Sharma', email: 'priya@trekmate.com', role: 'trekker', password: 'trekker123' },
  { id: 6, name: 'Rohan Gupta', email: 'rohan@trekmate.com', role: 'trekker', password: 'trekker123' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('trekmate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('trekmate_token') || null);
  const [loading, setLoading] = useState(true);

  // Maintain local accounts array in localStorage for serverless fallback
  const getLocalAccounts = () => {
    try {
      const saved = localStorage.getItem('trekmate_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_ACCOUNTS, ...parsed];
      }
    } catch (e) {
      console.error("Local accounts error:", e);
    }
    return DEFAULT_ACCOUNTS;
  };

  const saveLocalAccount = (acc) => {
    try {
      const saved = localStorage.getItem('trekmate_accounts');
      let accounts = saved ? JSON.parse(saved) : [];
      const idx = accounts.findIndex(a => a.email.toLowerCase() === acc.email.toLowerCase());
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...acc };
      } else {
        accounts.push(acc);
      }
      localStorage.setItem('trekmate_accounts', JSON.stringify(accounts));
    } catch (e) {
      console.error("Save local account error:", e);
    }
  };

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
      console.warn("Auth me check failed, using cached session:", err);
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
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try server login first
    try {
      const resp = await api.post('/auth/login', { email: cleanEmail, password });
      const { access_token, user: userData } = resp.data;
      localStorage.setItem('trekmate_token', access_token);
      localStorage.setItem('trekmate_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (serverErr) {
      console.warn("Server login returned error, evaluating fallback:", serverErr);

      // If server returned 403 (account deactivated), throw exact message
      if (serverErr.response?.status === 403) {
        throw new Error(serverErr.response.data?.error || 'Account deactivated.');
      }

      // 2. Check local registered & demo accounts
      const allAccounts = getLocalAccounts();
      const match = allAccounts.find(a => a.email.toLowerCase() === cleanEmail);

      if (match && match.password === password) {
        const userData = {
          id: match.id || Date.now(),
          name: match.name,
          email: match.email,
          phone: match.phone || '',
          role: match.role || 'trekker',
          status: 'active'
        };
        const mockToken = `mock-token-${Date.now()}`;
        localStorage.setItem('trekmate_token', mockToken);
        localStorage.setItem('trekmate_user', JSON.stringify(userData));
        setToken(mockToken);
        setUser(userData);
        return userData;
      }

      const serverErrMsg = serverErr.response?.data?.error;
      throw new Error(typeof serverErrMsg === 'string' ? serverErrMsg : 'Invalid email or password.');
    }
  };

  const register = async (name, email, password, confirm_password, phone, role) => {
    const cleanEmail = email.trim().toLowerCase();

    // Store registered account locally for offline cache fallback
    const newAcc = {
      id: Date.now(),
      name,
      email: cleanEmail,
      password,
      phone,
      role: role || 'trekker'
    };
    saveLocalAccount(newAcc);

    try {
      const resp = await api.post('/auth/register', {
        name,
        email: cleanEmail,
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
    } catch (serverErr) {
      console.warn("Server register returned error:", serverErr);
      const serverErrMsg = serverErr.response?.data?.error;
      throw new Error(typeof serverErrMsg === 'string' ? serverErrMsg : 'Registration failed. Please try again.');
    }
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
