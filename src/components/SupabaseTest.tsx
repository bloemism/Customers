import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('loading');
      
      // 1. 基本的な接続テスト
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }

      // 2. データベース接続テスト（customersテーブルへのアクセス）
      const { count, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Database access error: ${countError.message}`);
      }

      setUserCount(count || 0);
      setConnectionStatus('success');
      
    } catch (error: any) {
      console.error('Supabase connection test failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message);
    }
  };

  const testSignUp = async () => {
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      console.log('Testing sign up with:', testEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            user_type: 'test',
            created_at: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw new Error(`Sign up error: ${error.message}`);
      }

      console.log('Sign up test successful:', data);
      alert(`テストアカウント作成成功: ${testEmail}`);
      
    } catch (error: any) {
      console.error('Sign up test failed:', error);
      alert(`テストアカウント作成失敗: ${error.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Supabase接続テスト</h2>
      
      {/* 接続ステータス */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="font-medium">接続ステータス:</span>
          {connectionStatus === 'loading' && (
            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
          {connectionStatus === 'success' && (
            <span className="ml-2 text-green-600">✅ 接続成功</span>
          )}
          {connectionStatus === 'error' && (
            <span className="ml-2 text-red-600">❌ 接続エラー</span>
          )}
        </div>
        
        {connectionStatus === 'success' && (
          <p className="text-sm text-gray-600">
            ユーザー数: {userCount}
          </p>
        )}
        
        {connectionStatus === 'error' && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {errorMessage}
          </div>
        )}
      </div>

      {/* テストボタン */}
      <div className="space-y-2">
        <button
          onClick={testSupabaseConnection}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
        >
          接続テスト再実行
        </button>
        
        <button
          onClick={testSignUp}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors"
        >
          テストアカウント作成
        </button>
      </div>

      {/* 環境変数情報 */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">環境変数:</div>
        <div>URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定'}</div>
        <div>ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定'}</div>
      </div>
    </div>
  );
};
