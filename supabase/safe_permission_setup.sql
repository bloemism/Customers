-- 安全な権限設定

-- 1. 存在する全てのビューに権限を設定
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- 全てのビューに対して権限を設定
    FOR view_record IN
        SELECT schemaname, viewname
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('GRANT SELECT ON %I.%I TO authenticated', 
                          view_record.schemaname, view_record.viewname);
            RAISE NOTICE '権限設定完了: %.%', view_record.schemaname, view_record.viewname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '権限設定エラー: %.% - %', 
                           view_record.schemaname, view_record.viewname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. 権限設定後の確認
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
  AND grantee = 'authenticated'
ORDER BY table_name;
