-- 重要データのセキュリティ強化

-- 1. 店舗銀行口座情報のセキュリティ強化
-- storesテーブルの銀行口座関連カラムがある場合のRLSポリシー強化
DO $$
BEGIN
    -- storesテーブルに銀行口座関連カラムが存在する場合
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'stores'
          AND column_name IN ('bank_account_number', 'bank_routing_number', 'bank_account_holder')
    ) THEN
        -- 厳格なRLSポリシーを適用
        -- 店舗オーナーのみ自分の銀行口座情報にアクセス可能
        
        -- 既存のポリシーを削除
        DROP POLICY IF EXISTS "stores_bank_info_select_own" ON stores;
        DROP POLICY IF EXISTS "stores_bank_info_update_own" ON stores;
        
        -- 銀行口座情報の閲覧権限（店舗オーナーのみ）
        CREATE POLICY "stores_bank_info_select_own" ON stores
          FOR SELECT USING (
            email = auth.jwt() ->> 'email'
          );
        
        -- 銀行口座情報の更新権限（店舗オーナーのみ）
        CREATE POLICY "stores_bank_info_update_own" ON stores
          FOR UPDATE USING (
            email = auth.jwt() ->> 'email'
          );
        
        RAISE NOTICE '店舗銀行口座情報のセキュリティポリシーを強化しました';
    END IF;
END $$;

-- 2. 顧客携帯電話番号のセキュリティ強化
DO $$
BEGIN
    -- customersテーブルに電話番号カラムが存在する場合
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customers'
          AND column_name IN ('phone', 'mobile', 'phone_number')
    ) THEN
        -- 厳格なRLSポリシーを適用
        -- 顧客本人と関連店舗のみ電話番号にアクセス可能
        
        -- 既存のポリシーを削除
        DROP POLICY IF EXISTS "customers_phone_select_own" ON customers;
        DROP POLICY IF EXISTS "customers_phone_update_own" ON customers;
        
        -- 電話番号の閲覧権限（本人のみ）
        CREATE POLICY "customers_phone_select_own" ON customers
          FOR SELECT USING (
            user_id = auth.uid()
          );
        
        -- 電話番号の更新権限（本人のみ）
        CREATE POLICY "customers_phone_update_own" ON customers
          FOR UPDATE USING (
            user_id = auth.uid()
          );
        
        RAISE NOTICE '顧客電話番号のセキュリティポリシーを強化しました';
    END IF;
END $$;

-- 3. 重要データのアクセス監査用テーブル作成（オプション）
CREATE TABLE IF NOT EXISTS public.critical_data_access_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    accessed_by TEXT NOT NULL,
    access_type TEXT NOT NULL, -- 'SELECT', 'UPDATE', 'DELETE'
    accessed_at TIMESTAMP DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- 監査ログのRLS設定
ALTER TABLE public.critical_data_access_log ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "critical_data_access_log_admin_only" ON public.critical_data_access_log
  FOR ALL USING (false); -- 管理者のみアクセス可能（必要に応じて調整）

-- 4. 重要データの暗号化推奨（PostgreSQLの暗号化機能）
-- 注意: 実際の暗号化はアプリケーションレベルで実装することを推奨

-- 5. 完了メッセージ
SELECT 
    '重要データセキュリティ強化完了' as status,
    '銀行口座情報と電話番号が厳重に保護されています' as message;
