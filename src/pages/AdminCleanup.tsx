import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, BarChart3, RefreshCw, AlertTriangle } from 'lucide-react';

interface PaymentCodesStats {
  total_count: number;
  expired_count: number;
  used_count: number;
  unused_count: number;
  old_count: number;
}

export const AdminCleanup: React.FC = () => {
  const [stats, setStats] = useState<PaymentCodesStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 統計データを取得
  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_payment_codes_stats')
        .single();

      if (error) {
        console.error('統計データ取得エラー:', error);
        setError('統計データの取得に失敗しました');
        return;
      }

      setStats(data);
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      setError('統計データの取得に失敗しました');
    }
  };

  // クリーンアップ実行
  const runCleanup = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase
        .rpc('cleanup_all_payment_codes');

      if (error) {
        console.error('クリーンアップエラー:', error);
        setError('クリーンアップの実行に失敗しました');
        return;
      }

      setMessage('クリーンアップが完了しました');
      
      // 統計データを再取得
      await fetchStats();
    } catch (error) {
      console.error('クリーンアップエラー:', error);
      setError('クリーンアップの実行に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 期限切れデータのみクリーンアップ
  const runExpiredCleanup = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_payment_codes');

      if (error) {
        console.error('期限切れデータクリーンアップエラー:', error);
        setError('期限切れデータのクリーンアップに失敗しました');
        return;
      }

      setMessage('期限切れデータのクリーンアップが完了しました');
      
      // 統計データを再取得
      await fetchStats();
    } catch (error) {
      console.error('期限切れデータクリーンアップエラー:', error);
      setError('期限切れデータのクリーンアップに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trash2 className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">決済データ管理</h1>
            </div>
            <button
              onClick={fetchStats}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">データ統計</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">総データ数</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total_count.toLocaleString()}</p>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">期限切れ</p>
                <p className="text-2xl font-bold text-red-800">{stats.expired_count.toLocaleString()}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">使用済み</p>
                <p className="text-2xl font-bold text-green-800">{stats.used_count.toLocaleString()}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-medium">未使用</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.unused_count.toLocaleString()}</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">古いデータ</p>
                <p className="text-2xl font-bold text-purple-800">{stats.old_count.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* クリーンアップ操作 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">クリーンアップ操作</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-800 mb-2">削除ルール</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• 期限切れデータ: 1時間以上経過したもの</li>
                <li>• 使用済みデータ: 1週間以上経過したもの</li>
                <li>• 古いデータ: 1ヶ月半（45日）以上経過したもの</li>
              </ul>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={runExpiredCleanup}
                disabled={loading}
                className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '処理中...' : '期限切れデータのみ削除'}
              </button>
              
              <button
                onClick={runCleanup}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '処理中...' : '全クリーンアップ実行'}
              </button>
            </div>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
              <p className="text-green-800">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* 注意事項 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">注意事項</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• クリーンアップは元に戻せません</li>
            <li>• 定期的なクリーンアップを推奨します</li>
            <li>• 大量のデータがある場合は時間がかかる場合があります</li>
            <li>• 本番環境では慎重に実行してください</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

