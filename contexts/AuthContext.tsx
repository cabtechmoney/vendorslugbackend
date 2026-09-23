'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { LoginData, SignupData, User } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setAuthCookie(token: string) {
  document.cookie = `auth_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

function clearAuthCookie() {
  document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      const timeoutId = window.setTimeout(() => setIsLoading(false), 0);
      return () => window.clearTimeout(timeoutId);
    }

    api.auth.me().then(setUser).catch(() => {
      localStorage.removeItem('auth_token');
      clearAuthCookie();
    }).finally(() => setIsLoading(false));
  }, []);

  const storeSession = (response: Awaited<ReturnType<typeof api.auth.login>>) => {
    localStorage.setItem('auth_token', response.token);
    setAuthCookie(response.token);
    setUser(response.user);
  };

  const login = async (email: string, password: string) => {
    storeSession(await api.auth.login({ email, password } satisfies LoginData));
  };

  const signup = async (data: SignupData) => {
    await api.auth.signup(data);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    clearAuthCookie();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>;
}
