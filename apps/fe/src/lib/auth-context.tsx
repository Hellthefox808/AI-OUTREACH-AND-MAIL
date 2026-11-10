'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, UserProfile, ApiError } from './api';

interface AuthContextValue {
  user: UserProfile | null;
  currentWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; name: string; workspaceName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await api.auth.getMe();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(credentials);
      setUser(res.user);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Login failed. Please check credentials.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    workspaceName?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.register(data);
      setUser(res.user);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Registration failed.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  };

  const currentWorkspaceId = user?.workspaceIds?.[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentWorkspaceId,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

