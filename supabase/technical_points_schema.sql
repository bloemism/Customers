-- スクール専用技術ポイントシステム
-- レッスン参加による技術向上をポイント化

-- 既存のテーブルが存在する場合は削除
DROP TABLE IF EXISTS technical_points CASCADE;

-- 技術ポイントテーブルを作成
CREATE TABLE technical_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lesson_schedule_id UUID NOT NULL REFERENCES lesson_schedule(id) ON DELETE CASCADE,
    lesson_school_id UUID NOT NULL REFERENCES lesson_schools(id) ON DELETE CASCADE,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    point_type VARCHAR(50) NOT NULL DEFAULT 'technical_skill', -- 'technical_skill', 'attendance', 'achievement'
    description TEXT,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 顧客の技術レベル管理テーブル
CREATE TABLE customer_technical_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lesson_school_id UUID NOT NULL REFERENCES lesson_schools(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_level VARCHAR(20) DEFAULT 'BEGINNER', -- 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
    level_achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 一つの顧客が同じスクールで複数のレコードを持たないように制約
    UNIQUE(customer_id, lesson_school_id)
);

-- インデックスを作成
CREATE INDEX idx_technical_points_customer_id ON technical_points(customer_id);
CREATE INDEX idx_technical_points_school_id ON technical_points(lesson_school_id);
CREATE INDEX idx_technical_points_awarded_at ON technical_points(awarded_at);
CREATE INDEX idx_customer_technical_levels_customer_id ON customer_technical_levels(customer_id);
CREATE INDEX idx_customer_technical_levels_school_id ON customer_technical_levels(lesson_school_id);

-- 技術ポイント付与時にレベルを自動更新する関数
CREATE OR REPLACE FUNCTION update_technical_level()
RETURNS TRIGGER AS $$
DECLARE
    new_total_points INTEGER;
    new_level VARCHAR(20);
BEGIN
    -- 該当スクールでの総ポイントを計算
    SELECT COALESCE(SUM(points_awarded), 0)
    INTO new_total_points
    FROM technical_points
    WHERE customer_id = NEW.customer_id 
    AND lesson_school_id = NEW.lesson_school_id;
    
    -- ポイントに基づいてレベルを決定
    IF new_total_points >= 500 THEN
        new_level := 'EXPERT';
    ELSIF new_total_points >= 300 THEN
        new_level := 'ADVANCED';
    ELSIF new_total_points >= 120 THEN
        new_level := 'INTERMEDIATE';
    ELSE
        new_level := 'BEGINNER';
    END IF;
    
    -- 技術レベルを更新または挿入
    INSERT INTO customer_technical_levels (customer_id, lesson_school_id, total_points, current_level, level_achieved_at)
    VALUES (NEW.customer_id, NEW.lesson_school_id, new_total_points, new_level, NOW())
    ON CONFLICT (customer_id, lesson_school_id)
    DO UPDATE SET
        total_points = new_total_points,
        current_level = new_level,
        level_achieved_at = CASE 
            WHEN customer_technical_levels.current_level != new_level THEN NOW()
            ELSE customer_technical_levels.level_achieved_at
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 技術ポイント付与時にレベル更新トリガーを作成
CREATE TRIGGER trigger_update_technical_level
    AFTER INSERT ON technical_points
    FOR EACH ROW
    EXECUTE FUNCTION update_technical_level();

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_customer_technical_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_technical_levels_updated_at
    BEFORE UPDATE ON customer_technical_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_technical_levels_updated_at();

-- Row Level Security (RLS) を有効化
ALTER TABLE technical_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_technical_levels ENABLE ROW LEVEL SECURITY;

-- 顧客は自分の技術ポイントのみ閲覧可能
CREATE POLICY "Customers can view own technical points" ON technical_points
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers can view own technical levels" ON customer_technical_levels
    FOR SELECT USING (customer_id = auth.uid());

-- 店舗は自分のスクールの技術ポイントを閲覧・管理可能
CREATE POLICY "Stores can view their school technical points" ON technical_points
    FOR SELECT USING (
        lesson_school_id IN (
            SELECT id FROM lesson_schools 
            WHERE store_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Stores can insert technical points for their schools" ON technical_points
    FOR INSERT WITH CHECK (
        lesson_school_id IN (
            SELECT id FROM lesson_schools 
            WHERE store_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Stores can view their school technical levels" ON customer_technical_levels
    FOR SELECT USING (
        lesson_school_id IN (
            SELECT id FROM lesson_schools 
            WHERE store_email = auth.jwt() ->> 'email'
        )
    );

