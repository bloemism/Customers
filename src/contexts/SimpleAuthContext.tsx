import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface SimpleAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

export const SimpleAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッション確認
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('セッション取得エラー:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
          };
          setUser(userData);
          localStorage.setItem('simpleAuthUser', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('認証初期化エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Supabaseのセッション状態を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
          };
          setUser(userData);
          localStorage.setItem('simpleAuthUser', JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem('simpleAuthUser');
        }
        setLoading(false);
      }
    );

    // 初期セッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        };
        setUser(userData);
        localStorage.setItem('simpleAuthUser', JSON.stringify(userData));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0]
        };
        setUser(userData);
        localStorage.setItem('simpleAuthUser', JSON.stringify(userData));
        return { error: undefined };
      }

      return { error: 'ログインに失敗しました' };
    } catch (error) {
      console.error('ログインエラー:', error);
      return { error: 'ログインに失敗しました' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // ユーザー登録成功
      if (data.user) {
        return { error: undefined };
      }

      return { error: 'ユーザー登録に失敗しました' };
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      return { error: 'ユーザー登録に失敗しました' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth sign in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        return { error: `Google認証エラー: ${error.message}` };
      }

      console.log('Google OAuth initiated successfully');
      return { error: undefined };
    } catch (error) {
      console.error('Googleログインエラー:', error);
      return { error: `Googleログインに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
    setUser(null);
    localStorage.removeItem('simpleAuthUser');
  };

  return (
    <SimpleAuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};
