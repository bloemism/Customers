-- トリガーを完全に無効化してテスト
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_customer() CASCADE;
