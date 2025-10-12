-- 顧客コードカラムを追加
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_code VARCHAR(5) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);

-- 顧客コード生成関数
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS VARCHAR(5) AS $$
DECLARE
  new_code VARCHAR(5);
  code_exists BOOLEAN;
  letters TEXT := 'ABCDEFGHJKLMNPRTUVWXYZ';
  letter CHAR(1);
  numbers TEXT;
BEGIN
  LOOP
    letter := substring(letters, floor(random() * 22 + 1)::int, 1);
    numbers := LPAD(floor(random() * 10000)::TEXT, 4, '0');
    new_code := letter || numbers;
    
    SELECT EXISTS(
      SELECT 1 FROM customers WHERE customer_code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 既存顧客に顧客コードを設定
UPDATE customers 
SET customer_code = generate_customer_code(),
    updated_at = NOW()
WHERE customer_code IS NULL;
