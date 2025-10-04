-- 両テーブルに同時にデータを保存する関数を作成

-- 1. lesson_schoolsに挿入し、自動的にlesson_schools_backupにも同期する関数
CREATE OR REPLACE FUNCTION insert_lesson_school_dual(
    p_name TEXT,
    p_prefecture TEXT,
    p_city TEXT,
    p_address TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_instructor_name TEXT,
    p_instructor_bio TEXT,
    p_lesson_content TEXT,
    p_main_days TEXT[],
    p_main_time TEXT,
    p_trial_price NUMERIC,
    p_regular_price NUMERIC,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_website_url TEXT DEFAULT NULL,
    p_instagram_url TEXT DEFAULT NULL,
    p_store_email TEXT
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    -- lesson_schoolsに挿入（トリガーでlesson_schools_backupにも自動同期）
    INSERT INTO public.lesson_schools (
        name, prefecture, city, address, email, phone,
        instructor_name, instructor_bio, lesson_content, main_days,
        main_time, trial_price, regular_price, latitude, longitude,
        website_url, instagram_url, is_active, store_email, created_at, updated_at
    ) VALUES (
        p_name, p_prefecture, p_city, p_address, p_email, p_phone,
        p_instructor_name, p_instructor_bio, p_lesson_content, p_main_days,
        p_main_time, p_trial_price, p_regular_price, p_latitude, p_longitude,
        p_website_url, p_instagram_url, true, p_store_email, NOW(), NOW()
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 2. lesson_schoolsを更新し、自動的にlesson_schools_backupにも同期する関数
CREATE OR REPLACE FUNCTION update_lesson_school_dual(
    p_id UUID,
    p_name TEXT,
    p_prefecture TEXT,
    p_city TEXT,
    p_address TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_instructor_name TEXT,
    p_instructor_bio TEXT,
    p_lesson_content TEXT,
    p_main_days TEXT[],
    p_main_time TEXT,
    p_trial_price NUMERIC,
    p_regular_price NUMERIC,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_website_url TEXT DEFAULT NULL,
    p_instagram_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- lesson_schoolsを更新（トリガーでlesson_schools_backupにも自動同期）
    UPDATE public.lesson_schools SET
        name = p_name,
        prefecture = p_prefecture,
        city = p_city,
        address = p_address,
        email = p_email,
        phone = p_phone,
        instructor_name = p_instructor_name,
        instructor_bio = p_instructor_bio,
        lesson_content = p_lesson_content,
        main_days = p_main_days,
        main_time = p_main_time,
        trial_price = p_trial_price,
        regular_price = p_regular_price,
        latitude = p_latitude,
        longitude = p_longitude,
        website_url = p_website_url,
        instagram_url = p_instagram_url,
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 3. lesson_schoolsを削除し、自動的にlesson_schools_backupからも削除する関数
CREATE OR REPLACE FUNCTION delete_lesson_school_dual(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- lesson_schoolsから削除（トリガーでlesson_schools_backupからも自動削除）
    DELETE FROM public.lesson_schools WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 4. 関数の権限設定
GRANT EXECUTE ON FUNCTION insert_lesson_school_dual TO authenticated;
GRANT EXECUTE ON FUNCTION update_lesson_school_dual TO authenticated;
GRANT EXECUTE ON FUNCTION delete_lesson_school_dual TO authenticated;

-- 5. 完了メッセージ
SELECT 
    'dual table functions created' as status,
    '両テーブル同期用の関数が作成されました' as message;
