-- トリガーを一時的に無効化
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 関数は残しておく（後で再作成するため）
-- DROP FUNCTION IF EXISTS handle_new_customer() CASCADE;
