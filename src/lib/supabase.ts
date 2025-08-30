import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': '87app-customer'
    }
  }
})

// 接続テスト（より詳細なログ付き）
console.log('🔌 Supabase接続テスト開始...')
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase接続エラー:', error)
  } else {
    console.log('✅ Supabase接続成功')
    console.log('📊 セッション情報:', data.session ? '認証済み' : '未認証')
  }
}).catch(err => {
  console.error('❌ Supabase接続テスト失敗:', err)
})

// 基本的なテーブル存在確認
export const testConnection = async () => {
  try {
    console.log('🔍 テーブル存在確認開始...')
    const { data, error } = await supabase
      .from('stores')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ テーブル確認エラー:', error)
      return false
    }
    
    console.log('✅ テーブル確認成功:', data)
    return true
  } catch (err) {
    console.error('❌ テーブル確認失敗:', err)
    return false
  }
}
