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
    }).finally(() => setIsLoading(false));
  }, []);

  const storeSession = (response: Awaited<ReturnType<typeof api.auth.login>>) => {
    localStorage.setItem('auth_token', response.token);
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
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>;
}
