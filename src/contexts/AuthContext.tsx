// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setAccessToken, clearAccessToken, getSavedUser, saveUser } from '../lib/api';

interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserFromSession: (user: User, accessToken: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = getSavedUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const setUserFromSession = useCallback((u: User, token: string) => {
    setUser(u);
    setAccessToken(token);
    saveUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: { id: string; email: string; fullName?: string }; session: { access_token: string } }>(
      '/api/auth/login',
      { email, password }
    );
    const u = (data as { user: User; session: { access_token: string } }).user;
    const token = (data as { session: { access_token: string } }).session.access_token;
    setUser(u);
    setAccessToken(token);
    saveUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore
    } finally {
      setUser(null);
      clearAccessToken();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        setUserFromSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}