import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isDev = import.meta.env.VITE_DEV_MODE === 'true'
const isDebug = import.meta.env.VITE_DEBUG_MODE === 'true'

// 本番環境ではログを制限
if (isDev || isDebug) {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set')
}

if (!supabaseUrl || !supabaseAnonKey) {
  const error = 'Missing Supabase environment variables'
  console.error(error)
  throw new Error(error)
}

// URLの妥当性をチェック
try {
  new URL(supabaseUrl)
} catch (urlError) {
  const error = `Invalid Supabase URL: ${supabaseUrl}`
  console.error(error)
  throw new Error(error)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': '87app-flower-shop'
    }
  }
})

// 本番環境では接続確認を簡素化
if (isDev || isDebug) {
  supabase.auth.getSession().then(({ error }) => {
    if (error) {
      console.error('Supabase connection error:', error)
    } else {
      console.log('Supabase connected successfully')
    }
  })
}
