import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
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
          console.log('✅ セッション認証成功:', userData);
        } else {
          setUser(null);
          localStorage.removeItem('simpleAuthUser');
          console.log('🔓 セッション終了');
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
        console.log('✅ 初期セッション認証成功:', userData);
      } else {
        console.log('🔓 初期セッションなし');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('🔧 Supabase新規登録開始:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name
          }
        }
      });

      if (error) {
        console.error('新規登録エラー:', error);
        return { error: error.message };
      }

      if (data.user) {
        console.log('✅ 新規登録成功:', data.user.email);
        return { error: undefined };
      }

      return { error: 'アカウント作成に失敗しました' };
    } catch (error) {
      console.error('新規登録エラー:', error);
      return { error: 'アカウント作成に失敗しました' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔧 Supabaseログイン開始:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('ログインエラー:', error);
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
        console.log('✅ ログイン成功:', userData);
        return { error: undefined };
      }

      return { error: 'ログインに失敗しました' };
    } catch (error) {
      console.error('ログインエラー:', error);
      return { error: 'ログインに失敗しました' };
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
        return { error: error.message };
      }

      return { error: undefined };
    } catch (error) {
      console.error('Googleログインエラー:', error);
      return { error: 'Googleログインに失敗しました' };
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
