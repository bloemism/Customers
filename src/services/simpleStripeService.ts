import { supabase } from '../lib/supabase';
import { SUBSCRIPTION_PRODUCTS } from '../lib/stripe';

// 条件チェック結果の型定義
export interface EligibilityCheck {
  isEligible: boolean;
  reason?: string;
  storeData?: any;
  schoolData?: any;
}

export class SimpleStripeService {
  // フローリスト登録の条件チェック
  static async checkFloristEligibility(userEmail: string): Promise<EligibilityCheck> {
    try {
      console.log('フローリスト登録条件チェック開始:', userEmail);
      
      // storesテーブルから店舗情報をチェック（実際にデータが入っているテーブル）
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, email, address, phone')
        .eq('email', userEmail)
        .single();

      if (storeError || !storeData) {
        return {
          isEligible: false,
          reason: '店舗情報が見つかりません。先に店舗登録を行ってください。'
        };
      }

      // 店舗情報がある場合は条件を満たしているとみなす（nameがNULLでもOK）
      if (storeData.id) {
        return {
          isEligible: true,
          storeData
        };
      }

      return {
        isEligible: false,
        reason: '店舗情報が不完全です。店舗情報を更新してください。',
        storeData
      };
    } catch (error) {
      console.error('フローリスト条件チェックエラー:', error);
      return {
        isEligible: false,
        reason: '条件チェック中にエラーが発生しました。'
      };
    }
  }

  // フラワースクール登録の条件チェック
  static async checkFlowerSchoolEligibility(userEmail: string): Promise<EligibilityCheck> {
    try {
      console.log('フラワースクール登録条件チェック開始:', userEmail);
      
      // lesson_schoolsテーブルからスクール名をチェック
      const { data: schoolData, error: schoolError } = await supabase
        .from('lesson_schools')
        .select('id, name, store_email')
        .eq('store_email', userEmail)
        .single();

      if (schoolError || !schoolData) {
        return {
          isEligible: false,
          reason: 'フラワースクール情報が見つかりません。先にスクール登録を行ってください。'
        };
      }

      if (!schoolData.name) {
        return {
          isEligible: false,
          reason: 'スクール名が設定されていません。スクール情報を更新してください。',
          schoolData
        };
      }

      return {
        isEligible: true,
        schoolData
      };
    } catch (error) {
      console.error('フラワースクール条件チェックエラー:', error);
      return {
        isEligible: false,
        reason: '条件チェック中にエラーが発生しました。'
      };
    }
  }

  // サブスクリプション作成（プラン別）
  static async createSubscription(customerEmail: string, planType: 'FLORIST' | 'FLOWER_SCHOOL') {
    try {
      console.log('Stripe Checkout開始:', { customerEmail, planType });
      
      console.log('Stripeインスタンス: 初期化済み');

      // プランに応じた条件チェック
      let eligibilityCheck: EligibilityCheck;
      
      if (planType === 'FLORIST') {
        eligibilityCheck = await this.checkFloristEligibility(customerEmail);
      } else {
        eligibilityCheck = await this.checkFlowerSchoolEligibility(customerEmail);
      }

      if (!eligibilityCheck.isEligible) {
        throw new Error(eligibilityCheck.reason || '条件を満たしていません');
      }

      // プランに応じたPayment Linkを取得
      const plan = SUBSCRIPTION_PRODUCTS[planType];
      const paymentLink = plan.paymentLink;
      
      console.log('Payment Linkにリダイレクト:', paymentLink);
      
      // ブラウザでPayment Linkを開く
      window.open(paymentLink, '_blank');
      
      console.log('Payment Linkリダイレクト成功');
    } catch (error) {
      console.error('サブスクリプション作成エラー:', error);
      if (error instanceof Error) {
        throw new Error(`サブスクリプション作成に失敗しました: ${error.message}`);
      } else {
        throw new Error('サブスクリプション作成に失敗しました');
      }
    }
  }

  // サブスクリプション状態の取得（簡略版）
  static async getSubscriptionStatus(userEmail: string) {
    try {
      console.log('サブスクリプション状態取得開始:', userEmail);
      
      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('ユーザーが認証されていません');
        return {
          id: 'dummy-subscription-id',
          status: 'none',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date().toISOString(),
          cancelAtPeriodEnd: false,
          planId: 'monthly',
          planName: '87app 月額プラン',
          planPrice: 5500,
        };
      }

      console.log('認証ユーザー:', user.email);

      // まず、storesテーブルが存在するかテスト
      try {
        const { data: storesTest, error: storesTestError } = await supabase
          .from('stores')
          .select('id, name')
          .limit(1);

        if (storesTestError) {
          console.log('storesテーブルエラー:', storesTestError);
          // storesテーブルが存在しない場合は、ダミーデータを返す
          return {
            id: 'dummy-subscription-id',
            status: 'none',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            cancelAtPeriodEnd: false,
            planId: 'monthly',
            planName: '87app 月額プラン',
            planPrice: 5500,
          };
        }

        console.log('storesテーブル確認OK');

        // ユーザーの店舗を取得（複数の方法を試す）
        let storeData = null;

        // 方法1: storesテーブルから直接取得（emailで検索）
        try {
          const { data: storeByEmail, error: emailError } = await supabase
            .from('stores')
            .select('id, name, email')
            .eq('email', user.email)
            .single();

          if (!emailError && storeByEmail) {
            storeData = storeByEmail;
            console.log('emailで店舗を取得:', storeData);
          } else {
            console.log('emailで店舗が見つかりません:', emailError);
          }
        } catch (emailTestError) {
          console.log('email検索エラー:', emailTestError);
        }

        // 方法2: 店舗名で検索（フォールバック）
        if (!storeData && user.email) {
          try {
            const { data: storeByName, error: nameError } = await supabase
              .from('stores')
              .select('id, name, email')
              .ilike('name', '%' + user.email.split('@')[0] + '%')
              .single();

            if (!nameError && storeByName) {
              storeData = storeByName;
              console.log('店舗名で店舗を取得:', storeData);
            } else {
              console.log('店舗名で店舗が見つかりません:', nameError);
            }
          } catch (nameTestError) {
            console.log('店舗名検索エラー:', nameTestError);
          }
        }

        // 方法3: 最初の店舗を取得（テスト用）
        if (!storeData) {
          try {
            const { data: firstStore, error: firstStoreError } = await supabase
              .from('stores')
              .select('id, name, email')
              .limit(1)
              .single();

            if (!firstStoreError && firstStore) {
              storeData = firstStore;
              console.log('最初の店舗を取得（テスト用）:', storeData);
            }
          } catch (firstStoreTestError) {
            console.log('最初の店舗取得エラー:', firstStoreTestError);
          }
        }

        if (!storeData) {
          console.log('店舗が見つかりません。ダミーデータを返します。');
          return {
            id: 'dummy-subscription-id',
            status: 'none',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            cancelAtPeriodEnd: false,
            planId: 'monthly',
            planName: '87app 月額プラン',
            planPrice: 5500,
          };
        }

        console.log('店舗情報:', storeData);

        // サブスクリプション情報を取得（テーブルが存在しない場合はダミーデータを返す）
        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select(`
              id,
              status,
              current_period_start,
              current_period_end,
              cancel_at_period_end,
              plan_id,
              plan_name,
              plan_price
            `)
            .eq('store_id', storeData.id)
            .single();

          if (error) {
            if (error.code === 'PGRST205') {
              console.log('サブスクリプションテーブルが存在しません。ダミーデータを返します。');
              return {
                id: 'dummy-subscription-id',
                status: 'none',
                currentPeriodStart: new Date().toISOString(),
                currentPeriodEnd: new Date().toISOString(),
                cancelAtPeriodEnd: false,
                planId: 'monthly',
                planName: '87app 月額プラン',
                planPrice: 5500,
              };
            }
            if (error.code === 'PGRST116') {
              console.log('サブスクリプションデータが存在しません。ダミーデータを返します。');
              return {
                id: 'dummy-subscription-id',
                status: 'none',
                currentPeriodStart: new Date().toISOString(),
                currentPeriodEnd: new Date().toISOString(),
                cancelAtPeriodEnd: false,
                planId: 'monthly',
                planName: '87app 月額プラン',
                planPrice: 5500,
              };
            }
            console.error('サブスクリプション状態取得エラー:', error);
            return null;
          }

          return {
            id: data.id,
            status: data.status,
            currentPeriodStart: data.current_period_start,
            currentPeriodEnd: data.current_period_end,
            cancelAtPeriodEnd: data.cancel_at_period_end,
            planId: data.plan_id,
            planName: data.plan_name,
            planPrice: data.plan_price,
          };
        } catch (tableError) {
          console.log('サブスクリプションテーブルが存在しません:', tableError);
          return {
            id: 'dummy-subscription-id',
            status: 'none',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            cancelAtPeriodEnd: false,
            planId: 'monthly',
            planName: '87app 月額プラン',
            planPrice: 5500,
          };
        }
      } catch (storesError) {
        console.log('storesテーブル確認エラー:', storesError);
        return {
          id: 'dummy-subscription-id',
          status: 'none',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date().toISOString(),
          cancelAtPeriodEnd: false,
          planId: 'monthly',
          planName: '87app 月額プラン',
          planPrice: 5500,
        };
      }
    } catch (error) {
      console.error('サブスクリプション状態取得エラー:', error);
      return {
        id: 'dummy-subscription-id',
        status: 'none',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date().toISOString(),
        cancelAtPeriodEnd: false,
        planId: 'monthly',
        planName: '87app 月額プラン',
        planPrice: 5500,
      };
    }
  }

  // 支払い方法の取得（簡略版）
  static async getPaymentMethods(userEmail: string) {
    try {
      console.log('支払い方法取得開始:', userEmail);
      
      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('ユーザーが認証されていません');
        return [];
      }

      // 支払い方法を取得（テーブルが存在しない場合は空配列を返す）
      try {
        const { data, error } = await supabase
          .from('payment_methods')
          .select(`
            id,
            type,
            card_brand,
            card_last4,
            card_exp_month,
            card_exp_year
          `)
          .limit(10);

        if (error) {
          if (error.code === 'PGRST205') {
            console.log('支払い方法テーブルが存在しません。空配列を返します。');
            return [];
          }
          console.error('支払い方法取得エラー:', error);
          return [];
        }

        return data?.map(method => ({
          id: method.id,
          type: method.type as 'card',
          card: {
            brand: method.card_brand,
            last4: method.card_last4,
            expMonth: method.card_exp_month,
            expYear: method.card_exp_year,
          },
        })) || [];
      } catch (tableError) {
        console.log('支払い方法テーブルが存在しません:', tableError);
        return [];
      }
    } catch (error) {
      console.error('支払い方法取得エラー:', error);
      return [];
    }
  }

  // 利用可能なプランの取得
  static getAvailablePlans() {
    return [
      {
        id: 'monthly',
        name: '87app 月額プラン',
        price: 5500,
        features: [
          '商品管理（無制限）',
          '顧客管理（高度な分析）',
          'QR決済システム',
          'フラワーレッスン管理',
          '人気ランキング',
          '詳細レポート',
          '店舗マップ掲載',
          '画像・掲示板・タグ機能',
          '優先サポート',
          '顧客決済手数料3%収益'
        ]
      }
    ];
  }
}
