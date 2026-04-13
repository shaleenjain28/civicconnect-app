// ─── Auth Context ───
// Provides authentication state to the entire app.
// Components use: const { user, login, signup, logout } = useAuth();

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getUser());
  const [loading, setLoading] = useState(true);

  // Check if stored session is still valid on mount
  useEffect(() => {
    const session = api.getSession();
    if (session?.access_token) {
      api.get('/auth/me')
        .then((userData) => {
          setUser(userData);
          api.saveUser(userData);
        })
        .catch(() => {
          // Token expired/invalid
          api.clearSession();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    api.saveSession(data.session);
    api.saveUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (email, password, name, role = 'citizen') => {
    const data = await api.post('/auth/signup', { email, password, name, role });
    if (data.session) {
      api.saveSession(data.session);
      api.saveUser(data.user);
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Logout even if API call fails
    }
    api.clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    const updated = await api.patch('/users/me', updates);
    api.saveUser(updated);
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
