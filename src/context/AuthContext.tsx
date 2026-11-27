'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
  isLoading: boolean;
  navigateTo: (view: AppView) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<AppView>('storefront');
  const [isLoading, setIsLoading] = useState(true);

  const navigateTo = useCallback(
    (view: AppView) => {
      if (view === 'admin') {
        if (!user || user.role !== 'admin') {
          showToast('Access denied. Administrator role is required.', 'error');
          setActiveView('storefront');
          return;
        }
      }

      // ✅ ต้องวงเล็บให้ชัด: (profile หรือ orders) และยังไม่ล็อกอิน
      if ((view === 'profile' || view === 'orders') && !user) {
        showToast(`Please log in to view your ${view}.`, 'error');
        setActiveView('auth');
        return;
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

  const refreshUser = useCallback(async () => {
    try {
      // ปรับ path ให้ตรงกับไฟล์ route GET ของคุณ เช่น /api/auth/me
      const { user } = await api<{ user: User }>('/api/auth/me');
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        activeView,
        isLoading,
        navigateTo,
        login,
        register,
        logout,
        refreshUser,
        updateUser
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