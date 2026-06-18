import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase.ts';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInMock: (provider: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If supabase is null (development mode), create a mock session
    if (!supabase) {
      const mockUser = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        app_metadata: {},
        user_metadata: { full_name: 'Development User' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;

      const mockSession = {
        access_token: 'dev-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'dev-refresh-token',
        user: mockUser,
      } as Session;

      setSession(mockSession);
      setUser(mockUser);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Set up the auth state listener FIRST (synchronously).
    // Supabase's onAuthStateChange fires an INITIAL_SESSION event
    // immediately, which handles both fresh loads and session recovery
    // (including mobile Safari where getSession alone can race).
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Safety net: if onAuthStateChange doesn't fire within 3s
    // (e.g. network issues), fall back to getSession and stop loading.
    const fallbackTimer = setTimeout(async () => {
      if (!isMounted) return;
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Fallback session recovery failed:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signInMock = (provider: string) => {
    const mockUser = {
      id: `mock-${provider}-id`,
      email: `mock-${provider}@example.com`,
      app_metadata: {},
      user_metadata: { full_name: `Mock ${provider} User` },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    const mockSession = {
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
    } as Session;

    setSession(mockSession);
    setUser(mockUser);
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut, signInMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
