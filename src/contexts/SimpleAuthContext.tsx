import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface SimpleAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
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
    // ローカルストレージからユーザー情報を復元
    const savedUser = localStorage.getItem('simpleAuthUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('ユーザー情報の復元に失敗:', error);
        localStorage.removeItem('simpleAuthUser');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // 簡単な認証（実際のプロジェクトではSupabaseを使用）
    if (email && password) {
      const userData: User = {
        id: '1',
        email: email,
        name: email.split('@')[0]
      };
      setUser(userData);
      localStorage.setItem('simpleAuthUser', JSON.stringify(userData));
      return { error: undefined };
    }
    return { error: 'メールアドレスとパスワードを入力してください' };
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('simpleAuthUser');
  };

  return (
    <SimpleAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};
