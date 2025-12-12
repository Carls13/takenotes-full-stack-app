'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp } from '@/src/lib/mockApi';

type AuthUser = {
  id: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage (mock session)
  useEffect(() => {
    try {
      const u = getCurrentUser();
      setUser(u as AuthUser | null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      loading,
      async signIn(email: string, password: string) {
        const u = await apiSignIn(email, password);
        setUser(u as AuthUser);
      },
      async signUp(email: string, password: string) {
        const u = await apiSignUp(email, password);
        setUser(u as AuthUser);
      },
      signOut() {
        apiSignOut();
        setUser(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
