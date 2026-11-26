'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AppView, User } from '@/types/voltcraft';
import { useToast } from '@/context/ToastContext';

import { api } from '@/lib/apiClient';

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  activeView: AppView;
  navigateTo: (view: AppView) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<AppView>('storefront');

  const navigateTo = useCallback(
    (view: AppView) => {
      if (view === 'admin') {
        if (!user || user.role !== 'admin') {
          showToast('Access denied. Administrator role is required.', 'error');
          setActiveView('storefront');
          return;
        }
      }
      setActiveView(view);
    },
    [user, showToast]
  );

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { user } = await api<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setUser(user);
      showToast(`Hello, ${user.name}!`, 'success');
      setActiveView(user.role === 'admin' ? 'admin' : 'storefront');
      return true
    } catch (e) {
      showToast((e as Error).message, 'error');
      return false
    }
  }, [showToast]);

  const register = useCallback(async (payload: RegisterPayload): Promise<boolean> => {
    try {
      const { user } = await api<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setUser(user)
      showToast("Accout created successfully, Welcome!", 'success');
      setActiveView('storefront');
      return true;
    } catch (e) {
      showToast((e as Error).message, 'error');
      return false;
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    await api('api/auth/logout', {method: 'POST'});
    setUser(null);
    setActiveView('storefront');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        activeView,
        navigateTo,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}