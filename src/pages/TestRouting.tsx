import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TestRouting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ルーティングテスト</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">ページテスト</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/menu')}
                className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                メニュー画面
              </button>
              <button
                onClick={() => navigate('/customer-management')}
                className="w-full p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                顧客管理
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600"
              >
                お客様会計
              </button>
              <button
                onClick={() => navigate('/florist-map')}
                className="w-full p-3 bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                フローリストマップ
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">現在の状態</h2>
            <div className="space-y-2 text-sm">
              <p><strong>現在のパス:</strong> {window.location.pathname}</p>
              <p><strong>URL:</strong> {window.location.href}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">デバッグ情報</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              pathname: window.location.pathname,
              search: window.location.search,
              hash: window.location.hash,
              href: window.location.href,
              origin: window.location.origin,
              protocol: window.location.protocol,
              host: window.location.host,
              hostname: window.location.hostname,
              port: window.location.port
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
