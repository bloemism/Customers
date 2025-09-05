import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string; // Supabase auth.users.id (UUID)
  email: string;
  name: string;
  alphabet?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  points: number;
  level: 'BASIC' | 'REGULAR' | 'PRO' | 'EXPERT';
  created_at: string;
  updated_at: string;
}

interface SchoolRegistration {
  id: string;
  lesson_school_id: string;
  lesson_school_name: string;
  store_name: string;
  registered_at: string;
  is_active: boolean;
}

interface TechnicalLevel {
  id: string;
  customer_id: string;
  lesson_school_id: string;
  lesson_school_name: string;
  total_points: number;
  current_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  level_achieved_at: string;
}

interface TechnicalPoint {
  id: string;
  customer_id: string;
  lesson_schedule_id: string;
  lesson_school_id: string;
  points_awarded: number;
  point_type: string;
  description: string;
  awarded_at: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; user?: any }>;
  registerCustomerData: (name: string, alphabet?: string, address?: string, birth_date?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  getRegisteredSchools: () => Promise<SchoolRegistration[]>;
  registerToSchool: (schoolId: string) => Promise<{ error?: string }>;
  unregisterFromSchool: (registrationId: string) => Promise<{ error?: string }>;
  getTechnicalLevels: () => Promise<TechnicalLevel[]>;
  getTechnicalPointsHistory: (schoolId?: string) => Promise<TechnicalPoint[]>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

export const CustomerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabaseのセッション状態を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Customer Auth state changed:', event, session);
        
        if (session?.user) {
          // ユーザータイプがcustomerかどうか確認
          if (session.user.user_metadata?.user_type === 'customer') {
            // ログイン時は顧客データを取得せず、メニュー画面で判定
            console.log('顧客認証成功、メニュー画面で顧客データを確認');
            setCustomer(null); // 一旦nullに設定
          } else {
            // 店舗ユーザーの場合はログアウト
            await supabase.auth.signOut();
            setCustomer(null);
          }
        } else {
          setCustomer(null);
          localStorage.removeItem('customerAuth');
        }
        setLoading(false);
      }
    );

    // 初期セッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && session.user.user_metadata?.user_type === 'customer') {
        // 初期セッションでも顧客データを取得せず、メニュー画面で判定
        console.log('初期セッション: 顧客認証済み、メニュー画面で顧客データを確認');
        setCustomer(null); // 一旦nullに設定
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCustomerData = async (userId: string) => {
    try {
      console.log('顧客データ取得開始:', userId);
      
      console.log('customersテーブルからデータを取得中...');
      const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', userId)
          .single();
      
      console.log('customersテーブル取得結果:', { data, error });

      if (error) {
        console.error('顧客データ取得エラー:', error);
        if (error.code === 'PGRST116') {
          console.log('顧客データが見つかりません。新規作成を試行します。');
          // 顧客データが存在しない場合は、auth.usersから情報を取得して作成
          const { data: authUser } = await supabase.auth.getUser();
          console.log('authUser取得結果:', authUser);
          
          if (authUser.user) {
            console.log('顧客データ挿入開始:', {
              user_id: authUser.user.id,
              email: authUser.user.email,
              name: authUser.user.user_metadata?.name || '未設定',
              phone: authUser.user.user_metadata?.phone || null,
              points: 0,
              level: 'BASIC'
            });
            
            const { error: insertError } = await supabase
              .from('customers')
              .insert({
                id: authUser.user.id,
                email: authUser.user.email!,
                name: authUser.user.user_metadata?.name || '未設定',
                alphabet: null,
                phone: authUser.user.user_metadata?.phone || null,
                points: 0,
                level: 'BASIC'
              });
            
            if (insertError) {
              console.error('顧客データ自動作成エラー:', insertError);
              setCustomer(null);
              return;
            }
            
            console.log('顧客データ挿入成功、再取得開始');
            // 再取得
            const { data: newData } = await supabase
              .from('customers')
              .select('*')
              .eq('id', userId)
              .single();
            
            console.log('再取得結果:', newData);
            if (newData) {
              setCustomer(newData);
              localStorage.setItem('customerAuth', JSON.stringify(newData));
            }
          } else {
            console.log('authUser.userが存在しません');
          }
        } else {
          setCustomer(null);
        }
        return;
      }

      if (data) {
        console.log('顧客データ取得成功:', data);
        setCustomer(data);
        localStorage.setItem('customerAuth', JSON.stringify(data));
      }
    } catch (error) {
      console.error('顧客データ取得エラー:', error);
      setCustomer(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('顧客ログイン試行:', email);
      
      // Supabaseでログイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('認証エラー:', error);
        return { error: error.message };
      }

      if (data.user) {
        console.log('認証成功、ユーザータイプ確認:', data.user.user_metadata?.user_type);
        
        // ユーザータイプがcustomerかどうか確認
        if (data.user.user_metadata?.user_type !== 'customer') {
          console.log('店舗ユーザーが顧客ログインを試行、ログアウト');
          await supabase.auth.signOut();
          return { error: 'このアカウントは顧客アカウントではありません。店舗ログインをご利用ください。' };
        }

        // 認証成功、メニュー画面に遷移（顧客データの存在チェックは削除）
        console.log('認証成功、メニュー画面に遷移');
        return { error: undefined };
      }

      return { error: 'ログインに失敗しました' };
    } catch (error) {
      console.error('ログインエラー:', error);
      return { error: `ログインに失敗しました: ${error}` };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('顧客登録開始:', { email, name });
      
      // 新規登録なので既存ユーザーチェックは不要
      
      console.log('Supabase signUp開始');
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              user_type: 'customer'
            }
          }
        });
        
        console.log('認証レスポンス:', { authData, authError });
        
        if (authError) {
          console.error('認証エラー:', authError);
          return { error: authError.message };
        }

        if (authData.user) {
          console.log('認証成功、顧客データ登録画面に遷移');
          console.log('返却するユーザー:', authData.user);
          return { error: undefined, user: authData.user };
        }

        return { error: 'ユーザー登録に失敗しました' };
      } catch (signUpError) {
        console.error('signUp実行エラー:', signUpError);
        return { error: `登録エラー: ${signUpError}` };
      }
    } catch (error: any) {
      console.error('ユーザー登録エラー:', error);
      return { error: `ユーザー登録に失敗しました: ${error.message}` };
    }
  };

  // 日本語形式の日付をISO形式に変換する関数
  const convertJapaneseDateToISO = (japaneseDate: string): string | null => {
    if (!japaneseDate) return null;
    
    // 「1972年12月15日」形式を「1972-12-15」形式に変換
    const match = japaneseDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return null;
  };

  // ISO形式の日付を日本語形式に変換する関数
  const convertISODateToJapanese = (isoDate: string): string | null => {
    if (!isoDate) return null;
    
    // 「1972-12-15」形式を「1972年12月15日」形式に変換
    const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      return `${year}年${month}月${day}日`;
    }
    
    return null;
  };

  const registerCustomerData = async (name: string, alphabet?: string, address?: string, birth_date?: string) => {
    try {
      console.log('顧客データ登録開始:', { name, alphabet, address, birth_date });
      
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        return { error: '認証されていません' };
      }

      // 誕生日をISO形式に変換
      const isoBirthDate = convertJapaneseDateToISO(birth_date || '');
      console.log('誕生日変換:', { original: birth_date, converted: isoBirthDate });

      // まず既存のレコードがあるかチェック
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', authUser.user.id)
        .single();

      let error;
      if (existingCustomer) {
        // 既存のレコードがある場合は更新
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            name,
            alphabet: alphabet || null,
            address: address || null,
            birth_date: isoBirthDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUser.user.id);
        error = updateError;
      } else {
        // 新規レコードの場合は挿入
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            id: authUser.user.id,
            email: authUser.user.email!,
            name,
            alphabet: alphabet || null,
            address: address || null,
            birth_date: isoBirthDate,
            points: 0,
            level: 'BASIC'
          });
        error = insertError;
      }

      if (error) {
        console.error('顧客データ保存エラー:', error);
        return { error: `顧客データの保存に失敗しました: ${error.message}` };
      }

      console.log('顧客データ登録成功');
      // 顧客データを取得して状態を更新
      await fetchCustomerData(authUser.user.id);
      return { error: undefined };
    } catch (error: any) {
      console.error('顧客データ登録エラー:', error);
      return { error: `顧客データ登録に失敗しました: ${error.message}` };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
    setCustomer(null);
    localStorage.removeItem('customerAuth');
  };

  const refreshCustomer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchCustomerData(user.id);
    }
  };

  // 登録済みスクール一覧を取得
  const getRegisteredSchools = async (): Promise<SchoolRegistration[]> => {
    if (!customer?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('customer_school_registrations')
        .select(`
          id,
          lesson_school_id,
          registered_at,
          is_active,
          lesson_schools!inner(name, store_name)
        `)
        .eq('customer_id', customer.id)
        .eq('is_active', true);

      if (error) {
        console.error('登録スクール取得エラー:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        lesson_school_id: item.lesson_school_id,
        lesson_school_name: item.lesson_schools?.name || '不明',
        store_name: item.lesson_schools?.store_name || '不明',
        registered_at: item.registered_at,
        is_active: item.is_active
      })) || [];
    } catch (error) {
      console.error('登録スクール取得エラー:', error);
      return [];
    }
  };

  // スクールに登録
  const registerToSchool = async (schoolId: string): Promise<{ error?: string }> => {
    if (!customer?.id) {
      return { error: 'ログインが必要です' };
    }

    try {
      const { error } = await supabase
        .from('customer_school_registrations')
        .insert({
          customer_id: customer.id,
          lesson_school_id: schoolId
        });

      if (error) {
        console.error('スクール登録エラー:', error);
        return { error: 'スクール登録に失敗しました' };
      }

      return {};
    } catch (error) {
      console.error('スクール登録エラー:', error);
      return { error: 'スクール登録に失敗しました' };
    }
  };

  // スクール登録を解除
  const unregisterFromSchool = async (registrationId: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase
        .from('customer_school_registrations')
        .update({ is_active: false })
        .eq('id', registrationId);

      if (error) {
        console.error('スクール登録解除エラー:', error);
        return { error: 'スクール登録解除に失敗しました' };
      }

      return {};
    } catch (error) {
      console.error('スクール登録解除エラー:', error);
      return { error: 'スクール登録解除に失敗しました' };
    }
  };

  // 技術レベル一覧を取得
  const getTechnicalLevels = async (): Promise<TechnicalLevel[]> => {
    if (!customer?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('customer_technical_levels')
        .select(`
          *,
          lesson_schools!inner(name)
        `)
        .eq('customer_id', customer.id);

      if (error) {
        console.error('技術レベル取得エラー:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        customer_id: item.customer_id,
        lesson_school_id: item.lesson_school_id,
        lesson_school_name: item.lesson_schools?.name || '不明',
        total_points: item.total_points,
        current_level: item.current_level,
        level_achieved_at: item.level_achieved_at
      })) || [];
    } catch (error) {
      console.error('技術レベル取得エラー:', error);
      return [];
    }
  };

  // 技術ポイント履歴を取得
  const getTechnicalPointsHistory = async (schoolId?: string): Promise<TechnicalPoint[]> => {
    if (!customer?.id) return [];
    
    try {
      let query = supabase
        .from('technical_points')
        .select('*')
        .eq('customer_id', customer.id)
        .order('awarded_at', { ascending: false });

      if (schoolId) {
        query = query.eq('lesson_school_id', schoolId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('技術ポイント履歴取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('技術ポイント履歴取得エラー:', error);
      return [];
    }
  };

  return (
    <CustomerAuthContext.Provider value={{ 
      customer, 
      loading, 
      signIn, 
      signUp, 
      registerCustomerData,
      signOut, 
      refreshCustomer,
      getRegisteredSchools,
      registerToSchool,
      unregisterFromSchool,
      getTechnicalLevels,
      getTechnicalPointsHistory
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};
