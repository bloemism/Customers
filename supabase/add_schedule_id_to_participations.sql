-- customer_participationsテーブルにschedule_idカラムを追加

-- schedule_idカラムが存在しない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_participations' 
        AND column_name = 'schedule_id'
    ) THEN
        ALTER TABLE customer_participations 
        ADD COLUMN schedule_id UUID;
    END IF;
END $$;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_customer_participations_schedule_id ON customer_participations(schedule_id);
