import { supabase } from '../lib/supabase';

export interface StoreOwnerProfile {
  id: string;
  user_id: string;
  email: string;
  store_name: string | null;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  business_license_number: string | null;
  business_type: string;
  is_verified: boolean;
  is_active: boolean;
  subscription_plan: string;
  subscription_expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreOwnerSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface StoreOwnerDashboard {
  owner_id: string;
  email: string;
  store_name: string | null;
  owner_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  subscription_plan: string;
  subscription_expires_at: string | null;
  last_login_at: string | null;
  registration_date: string;
  store_id: string | null;
  actual_store_name: string | null;
  store_address: string | null;
  latitude: number | null;
  longitude: number | null;
  service_count: number;
  photo_count: number;
  flower_count: number;
  active_posts_count: number;
}

export class StoreOwnerService {
  // 店舗オーナー登録
  static async registerStoreOwner(email: string, password: string, profileData: {
    store_name?: string;
    owner_name?: string;
    phone?: string;
    address?: string;
    business_license_number?: string;
  }): Promise<{ user: any; profile: StoreOwnerProfile }> {
    try {
      // 1. Supabaseでユーザー作成
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'store_owner',
            ...profileData
          }
        }
      });

      if (authError) throw authError;
      if (!user) throw new Error('ユーザー作成に失敗しました');

      // 2. プロフィール情報を更新
      const { data: profile, error: profileError } = await supabase
        .from('store_owner_profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      return { user, profile };
    } catch (error) {
      console.error('店舗オーナー登録エラー:', error);
      throw new Error('店舗オーナーの登録中にエラーが発生しました');
    }
  }

  // 店舗オーナーログイン
  static async loginStoreOwner(email: string, password: string): Promise<{ user: any; profile: StoreOwnerProfile }> {
    try {
      // 1. Supabaseでログイン
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      if (!user) throw new Error('ログインに失敗しました');

      // 2. プロフィール情報を取得
      const { data: profile, error: profileError } = await supabase
        .from('store_owner_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('プロフィールが見つかりません');

      // 3. アカウントが有効かチェック
      if (!profile.is_active) {
        throw new Error('アカウントが無効になっています');
      }

      // 4. セッションを作成
      await this.createSession(user.id);

      return { user, profile };
    } catch (error) {
      console.error('店舗オーナーログインエラー:', error);
      throw error;
    }
  }

  // セッション作成
  static async createSession(userId: string): Promise<void> {
    try {
      const sessionToken = this.generateSessionToken();
      const deviceInfo = this.getDeviceInfo();

      const { error } = await supabase
        .from('store_owner_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          device_info: deviceInfo,
          ip_address: '127.0.0.1', // 実際の実装ではクライアントIPを取得
          user_agent: navigator.userAgent,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7日後
        });

      if (error) throw error;
    } catch (error) {
      console.error('セッション作成エラー:', error);
    }
  }

  // セッショントークン生成
  private static generateSessionToken(): string {
    return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // デバイス情報取得
  private static getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows';
    return 'Unknown';
  }

  // 現在の店舗オーナー情報取得
  static async getCurrentStoreOwner(): Promise<StoreOwnerProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('store_owner_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return profile;
    } catch (error) {
      console.error('店舗オーナー情報取得エラー:', error);
      return null;
    }
  }

  // ダッシュボード情報取得
  static async getDashboardInfo(): Promise<StoreOwnerDashboard | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: dashboard, error } = await supabase
        .from('store_owner_dashboard')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      return dashboard;
    } catch (error) {
      console.error('ダッシュボード情報取得エラー:', error);
      return null;
    }
  }

  // プロフィール更新
  static async updateProfile(updateData: {
    store_name?: string;
    owner_name?: string;
    phone?: string;
    address?: string;
    business_license_number?: string;
  }): Promise<StoreOwnerProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('認証ユーザーが見つかりません');
      }

      const { data: profile, error } = await supabase
        .from('store_owner_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return profile;
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw new Error('プロフィールの更新中にエラーが発生しました');
    }
  }

  // アカウント検証
  static async verifyAccount(verificationCode: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('認証ユーザーが見つかりません');
      }

      const { data, error } = await supabase.rpc('verify_store_owner', {
        owner_email: user.email,
        verification_code: verificationCode
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('アカウント検証エラー:', error);
      throw new Error('アカウントの検証中にエラーが発生しました');
    }
  }

  // サブスクリプション更新
  static async updateSubscription(plan: string, expiresAt: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('認証ユーザーが見つかりません');
      }

      const { data, error } = await supabase.rpc('update_store_owner_subscription', {
        owner_email: user.email,
        new_plan: plan,
        expires_at: expiresAt
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('サブスクリプション更新エラー:', error);
      throw new Error('サブスクリプションの更新中にエラーが発生しました');
    }
  }

  // ログアウト
  static async logout(): Promise<void> {
    try {
      // アクティブなセッションを無効化
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('store_owner_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }

      // Supabaseからログアウト
      await supabase.auth.signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  }

  // パスワード変更
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      throw new Error('パスワードの変更中にエラーが発生しました');
    }
  }

  // アカウント削除
  static async deleteAccount(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('認証ユーザーが見つかりません');
      }

      // プロフィールを無効化
      await supabase
        .from('store_owner_profiles')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // セッションを無効化
      await supabase
        .from('store_owner_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // ユーザーアカウントを削除
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      throw new Error('アカウントの削除中にエラーが発生しました');
    }
  }

  // メールアドレス変更
  static async changeEmail(newEmail: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;
    } catch (error) {
      console.error('メールアドレス変更エラー:', error);
      throw new Error('メールアドレスの変更中にエラーが発生しました');
    }
  }

  // アクティブセッション一覧取得
  static async getActiveSessions(): Promise<StoreOwnerSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data: sessions, error } = await supabase
        .from('store_owner_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return sessions || [];
    } catch (error) {
      console.error('セッション取得エラー:', error);
      return [];
    }
  }

  // 特定のセッションを無効化
  static async invalidateSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('store_owner_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('セッション無効化エラー:', error);
      throw new Error('セッションの無効化中にエラーが発生しました');
    }
  }

  // サブスクリプションプラン一覧
  static getSubscriptionPlans(): Array<{ value: string; label: string; price: number; features: string[] }> {
    return [
      {
        value: 'free',
        label: '無料プラン',
        price: 0,
        features: [
          '基本的な店舗情報登録',
          '最大3枚の写真',
          '基本的なサービス登録'
        ]
      },
      {
        value: 'basic',
        label: 'ベーシックプラン',
        price: 1000,
        features: [
          '無料プランの全機能',
          '最大10枚の写真',
          'オススメの花の登録',
          '掲示板機能',
          '基本的な分析レポート'
        ]
      },
      {
        value: 'premium',
        label: 'プレミアムプラン',
        price: 3000,
        features: [
          'ベーシックプランの全機能',
          '無制限の写真',
          '優先表示',
          '詳細な分析レポート',
          'カスタムドメイン対応',
          '専任サポート'
        ]
      }
    ];
  }

  // パスワードリセット
  static async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      throw new Error('パスワードリセットの送信中にエラーが発生しました');
    }
  }
}
