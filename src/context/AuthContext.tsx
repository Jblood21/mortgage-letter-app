'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Company } from '@/types/database';

interface AuthState {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<{ error?: string }>;
  updateCompany: (updates: Partial<Company>) => Promise<{ error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    company: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      let companyData = null;
      if (userData?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();
        companyData = company;
      }

      setState({
        user: userData,
        company: companyData,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error('Load user data error:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error('Session check error:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadUserData]);

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            company: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession, loadUserData]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch (_err) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<User>
  ): Promise<{ error?: string }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) return { error: authError.message };

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({ id: authData.user.id, email, ...userData });
        if (profileError) return { error: profileError.message };
      }
      return {};
    } catch (_err) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateUser = async (updates: Partial<User>): Promise<{ error?: string }> => {
    if (!state.user) return { error: 'Not authenticated' };
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', state.user.id);
      if (error) return { error: error.message };
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));
      return {};
    } catch (_err) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const updateCompany = async (updates: Partial<Company>): Promise<{ error?: string }> => {
    if (!state.company) return { error: 'No company associated' };
    try {
      const { error } = await supabase
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', state.company.id);
      if (error) return { error: error.message };
      setState(prev => ({
        ...prev,
        company: prev.company ? { ...prev.company, ...updates } : null,
      }));
      return {};
    } catch (_err) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const refreshUser = async () => {
    if (state.user) await loadUserData(state.user.id);
  };

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, updateUser, updateCompany, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const hasAccess = isAuthenticated && (!allowedRoles || (user && allowedRoles.includes(user.role)));
  return { user, isLoading, isAuthenticated, hasAccess };
}
