'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AppView, User } from '@/types/voltcraft';
import { DEMO_USERS } from '@/lib/initialData';
import { useToast } from '@/context/ToastContext';

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
  const [registeredUsers, setRegisteredUsers] = useState(DEMO_USERS);
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

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const matched = registeredUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!matched) {
        showToast('Invalid email or password. Try demo credentials below.', 'error');
        return false;
      }

      const { password: _removed, ...safeUser } = matched;
      setUser(safeUser);
      showToast(`Welcome back, ${safeUser.name}!`, 'success');
      setActiveView(safeUser.role === 'admin' ? 'admin' : 'storefront');
      return true;
    },
    [registeredUsers, showToast]
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<boolean> => {
      const exists = registeredUsers.some(
        (u) => u.email.toLowerCase() === payload.email.toLowerCase()
      );
      if (exists) {
        showToast('An account with this email already exists.', 'error');
        return false;
      }

      const newUserWithPassword = {
        _id: `usr-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        role: 'customer' as const,
        addresses: [
          {
            recipient: payload.name,
            phone: payload.phone,
            line1: '123 Rama IX Rd.',
            subdistrict: 'Huai Khwang',
            district: 'Huai Khwang',
            province: 'Bangkok',
            postalCode: '10310',
          },
        ],
      };

      setRegisteredUsers((prev) => [...prev, newUserWithPassword]);
      const { password: _removed, ...safeUser } = newUserWithPassword;
      setUser(safeUser);
      showToast('Account created successfully. Welcome to VoltCraft!', 'success');
      setActiveView('storefront');
      return true;
    },
    [registeredUsers, showToast]
  );

  const logout = useCallback(() => {
    setUser(null);
    setActiveView('storefront');
    showToast('You have been signed out.', 'info');
  }, [showToast]);

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