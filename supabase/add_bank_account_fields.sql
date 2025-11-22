-- 店舗テーブルに銀行口座情報のカラムを追加
-- 87app Flower Shop Management System

-- 1. storesテーブルに銀行口座情報のカラムを追加
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT '普通',
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

-- 2. 銀行口座情報のバリデーション用の制約を追加
ALTER TABLE public.stores 
ADD CONSTRAINT check_account_type 
CHECK (account_type IN ('普通', '当座'));

-- 3. 口座番号の形式チェック（数字のみ、7桁）
ALTER TABLE public.stores 
ADD CONSTRAINT check_account_number_format 
CHECK (account_number ~ '^[0-9]{7}$');

-- 4. 銀行口座情報が完全に設定されている場合のインデックス
CREATE INDEX IF NOT EXISTS idx_stores_bank_info 
ON public.stores(bank_name, branch_name, account_number) 
WHERE bank_name IS NOT NULL AND branch_name IS NOT NULL AND account_number IS NOT NULL;

-- 5. Stripe Connect Account IDのインデックス
CREATE INDEX IF NOT EXISTS idx_stores_stripe_connect 
ON public.stores(stripe_connect_account_id) 
WHERE stripe_connect_account_id IS NOT NULL;

-- 6. 銀行口座情報の完全性チェック関数
CREATE OR REPLACE FUNCTION check_bank_account_completeness()
RETURNS TRIGGER AS $$
BEGIN
  -- 銀行口座情報のいずれかが設定されている場合、すべて必須
  IF (NEW.bank_name IS NOT NULL OR NEW.branch_name IS NOT NULL OR 
      NEW.account_number IS NOT NULL OR NEW.account_holder IS NOT NULL) THEN
    
    IF (NEW.bank_name IS NULL OR NEW.branch_name IS NULL OR 
        NEW.account_number IS NULL OR NEW.account_holder IS NULL) THEN
      RAISE EXCEPTION '銀行口座情報はすべて入力してください（銀行名、支店名、口座番号、口座名義）';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. トリガーを作成
DROP TRIGGER IF EXISTS trigger_check_bank_account ON public.stores;
CREATE TRIGGER trigger_check_bank_account
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION check_bank_account_completeness();

-- 8. 銀行口座情報のサンプルデータ（テスト用）
-- 注意：実際の運用では削除してください
INSERT INTO public.stores (
  owner_id, name, address, latitude, longitude, phone, email,
  bank_name, branch_name, account_type, account_number, account_holder
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- 既存のユーザーIDを使用
  'サンプル花店',
  '東京都渋谷区道玄坂1-2-3',
  35.6581,
  139.7016,
  '03-1234-5678',
  'sample@example.com',
  'みずほ銀行',
  '渋谷支店',
  '普通',
  '1234567',
  '株式会社サンプル花店'
) ON CONFLICT DO NOTHING;

-- 9. 完了メッセージ
SELECT '店舗テーブルに銀行口座情報のカラムが正常に追加されました。' as message;
