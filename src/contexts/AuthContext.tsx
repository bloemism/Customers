import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SupportedLanguage } from '../types';
import { StoreOwnerService, StoreOwnerProfile } from '../services/storeOwnerService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  globalLanguage: SupportedLanguage;
  setGlobalLanguage: (language: SupportedLanguage) => void;
  storeOwnerProfile: StoreOwnerProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signUpStoreOwner: (email: string, password: string, profileData: any) => Promise<{ error: any }>;
  signInStoreOwner: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalLanguage, setGlobalLanguage] = useState<SupportedLanguage>('ja');
  const [storeOwnerProfile, setStoreOwnerProfile] = useState<StoreOwnerProfile | null>(null);

  useEffect(() => {
    // 初期セッションを取得
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        // ユーザーの言語設定を取得
        if (session?.user) {
          const userLanguage = session.user.user_metadata?.preferred_language;
          if (userLanguage && ['ja', 'en', 'ko', 'zh'].includes(userLanguage)) {
            setGlobalLanguage(userLanguage as SupportedLanguage);
          }
        }
      }
      setLoading(false);
    };

    getInitialSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // ユーザーの言語設定を取得
        if (session?.user) {
          const userLanguage = session.user.user_metadata?.preferred_language;
          if (userLanguage && ['ja', 'en', 'ko', 'zh'].includes(userLanguage)) {
            setGlobalLanguage(userLanguage as SupportedLanguage);
          }
          
          // 店舗オーナープロフィールを取得
          try {
            const profile = await StoreOwnerService.getCurrentStoreOwner();
            setStoreOwnerProfile(profile);
          } catch (error) {
            console.log('Not a store owner or profile not found');
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            preferred_language: globalLanguage,
            user_type: 'florist',
            created_at: new Date().toISOString()
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signUpStoreOwner = async (email: string, password: string, profileData: any) => {
    try {
      const { user, profile } = await StoreOwnerService.registerStoreOwner(email, password, profileData);
      setStoreOwnerProfile(profile);
      return { error: null };
    } catch (error) {
      console.error('Store owner sign up error:', error);
      return { error };
    }
  };

  const signInStoreOwner = async (email: string, password: string) => {
    try {
      const { user, profile } = await StoreOwnerService.loginStoreOwner(email, password);
      setStoreOwnerProfile(profile);
      return { error: null };
    } catch (error) {
      console.error('Store owner sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await StoreOwnerService.logout();
      setStoreOwnerProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Google sign in error:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    globalLanguage,
    setGlobalLanguage,
    storeOwnerProfile,
    signIn,
    signUp,
    signUpStoreOwner,
    signInStoreOwner,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
