import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../supabaseClient';

type AuthContextValue = {
  session: import('@supabase/supabase-js').Session | null;
  user: import('@supabase/supabase-js').User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<null | string>;
  signUp: (
    params: {
      email: string;
      password: string;
      fullName: string;
      username: string;
      primaryLanguage: string;
    }
  ) => Promise<null | string>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    } finally {
      setLoading(false);
    }
  };

  const signUp: AuthContextValue['signUp'] = async ({ email, password, fullName, username, primaryLanguage }) => {
    setLoading(true);
    try {
      // Ensure unique username
      const { data: existing, error: checkErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (checkErr) return checkErr.message;
      if (existing) return 'Username is already taken';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username,
            primary_language: primaryLanguage,
          },
          emailRedirectTo: 'lingualink://auth-callback',
        },
      });
      if (error) return error.message;

      // If email confirmation is enabled, session may be null here. We will
      // only attempt to update profile fields when we have a session.
      const userId = data.user?.id;
      // The trigger will attempt to populate profile from metadata.
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, loading, signIn, signUp, signOut }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


