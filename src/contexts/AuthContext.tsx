// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setAccessToken, clearAccessToken, getSavedUser, saveUser } from '../lib/api';
import { supabase } from '../lib/supabase';

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
    // Fast path: authenticate directly with Supabase (1 hop instead of 4)
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message);
      }
      const u: User = {
        id: data.user.id,
        email: data.user.email!,
        fullName: data.user.user_metadata?.full_name,
      };
      setUser(u);
      setAccessToken(data.session.access_token);
      saveUser(u);
      return;
    }
    // Fallback: go through backend if Supabase isn't configured on frontend
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
    // Clear local state immediately for instant UI response
    setUser(null);
    clearAccessToken();
    // Fire-and-forget backend signout (don't block the UI)
    api.post('/api/auth/logout').catch(() => {});
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