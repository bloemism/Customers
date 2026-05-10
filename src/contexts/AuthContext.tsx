import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// 型定義
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  user_type: 'customer' | 'store_owner';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userType: 'customer' | 'store_owner') => Promise<{ error: any; user?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; user?: any }>;
  signOut: () => Promise<void>;
  signUpStoreOwner: (email: string, password: string, storeData: any) => Promise<{ error: any; user?: any }>;
  signInStoreOwner: (email: string, password: string) => Promise<{ error: any; user?: any }>;
}

console.log('🔧 環境変数チェック:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '設定済み' : '未設定 (デフォルト使用)');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定済み' : '未設定 (デフォルト使用)');

// コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // セッションの監視
  useEffect(() => {
    // 現在のセッションを取得
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔧 初期セッション取得:', session ? 'あり' : 'なし');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('❌ セッション取得エラー:', error);
        setLoading(false);
      }
    };

    getSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔧 認証状態変更:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          // ユーザープロフィールを取得
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ユーザープロフィールの取得
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔧 ユーザープロフィール取得開始:', userId);
      
      // まず顧客テーブルを確認
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (customerData) {
        console.log('✅ 顧客プロフィール取得成功');
        setUserProfile({
          id: customerData.user_id,
          email: customerData.email,
          name: customerData.name,
          user_type: 'customer',
          created_at: customerData.created_at
        });
        return;
      }

      // 顧客テーブルにない場合、店舗オーナーを確認
      const { data: storeOwnerData, error: storeOwnerError } = await supabase
        .from('store_owner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (storeOwnerData) {
        console.log('✅ 店舗オーナープロフィール取得成功');
        setUserProfile({
          id: storeOwnerData.user_id,
          email: storeOwnerData.email,
          name: storeOwnerData.owner_name,
          user_type: 'store_owner',
          created_at: storeOwnerData.created_at
        });
        return;
      }

      console.log('⚠️ プロフィールが見つかりませんでした');
      setUserProfile(null);
    } catch (error) {
      console.error('❌ ユーザープロフィール取得エラー:', error);
      setUserProfile(null);
    }
  };

  // ユーザー登録
  const signUp = async (email: string, password: string, userType: 'customer' | 'store_owner') => {
    try {
      console.log('🔧 ユーザー登録開始:', email, userType);
      
      console.log('🔧 登録データ:', { email, userType });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType
          }
        }
      });

      if (error) {
        console.error('❌ ユーザー登録エラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        return { error };
      }

      console.log('✅ ユーザー登録成功:', data.user?.id);

      // 手動でプロフィールを作成
      if (data.user) {
        try {
          if (userType === 'store_owner') {
            const { error: profileError } = await supabase
              .from('store_owner_profiles')
              .insert([
                {
                  user_id: data.user.id,
                  email: email,
                  owner_name: '',
                  phone: '',
                  created_at: new Date().toISOString()
                }
              ]);

            if (profileError) {
              console.error('❌ 店舗オーナープロフィール作成エラー:', profileError);
              // プロフィール作成に失敗してもユーザー登録は成功とする
            } else {
              console.log('✅ 店舗オーナープロフィール作成成功');
            }
          } else if (userType === 'customer') {
            const { error: profileError } = await supabase
              .from('customers')
              .insert([
                {
                  user_id: data.user.id,
                  email: email,
                  name: '',
                  phone: '',
                  address: '',
                  birth_date: null,
                  total_points: 0,
                  created_at: new Date().toISOString()
                }
              ]);

            if (profileError) {
              console.error('❌ 顧客プロフィール作成エラー:', profileError);
              // プロフィール作成に失敗してもユーザー登録は成功とする
            } else {
              console.log('✅ 顧客プロフィール作成成功');
            }
          }
        } catch (profileError) {
          console.error('❌ プロフィール作成例外:', profileError);
          // プロフィール作成に失敗してもユーザー登録は成功とする
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ ユーザー登録例外:', error);
      return { error };
    }
  };

  // ログイン
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔧 ログイン開始:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ ログインエラー:', error);
        return { error };
      }

      console.log('✅ ログイン成功:', data.user?.id);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ ログイン例外:', error);
      return { error };
    }
  };

  // ログアウト
  const signOut = async () => {
    try {
      console.log('🔧 ログアウト開始');
      await supabase.auth.signOut();
      console.log('✅ ログアウト成功');
    } catch (error) {
      console.error('❌ ログアウトエラー:', error);
    }
  };

  // 店舗オーナー登録
  const signUpStoreOwner = async (email: string, password: string, storeData: any) => {
    try {
      console.log('🔧 店舗オーナー登録開始:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'store_owner'
          }
        }
      });

      if (error) {
        console.error('❌ 店舗オーナー登録エラー:', error);
        return { error };
      }

      console.log('✅ 店舗オーナー登録成功:', data.user?.id);

      if (data.user) {
        // 店舗オーナープロフィールを作成
        const { error: profileError } = await supabase
          .from('store_owner_profiles')
          .insert([
            {
              user_id: data.user.id,
              email: email,
              store_name: storeData.storeName,
              owner_name: storeData.ownerName,
              phone: storeData.phone,
              address: storeData.address,
              business_license_number: storeData.businessLicenseNumber,
              is_verified: false,
              subscription_plan: 'free',
              created_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('❌ 店舗オーナープロフィール作成エラー:', profileError);
        } else {
          console.log('✅ 店舗オーナープロフィール作成成功');
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ 店舗オーナー登録例外:', error);
      return { error };
    }
  };

  // 店舗オーナーログイン
  const signInStoreOwner = async (email: string, password: string) => {
    return signIn(email, password);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signUpStoreOwner,
    signInStoreOwner
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 