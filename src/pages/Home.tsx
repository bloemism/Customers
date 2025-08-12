import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { StoreService } from '../services/storeService';
import { Map } from '../components/Map';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MapPin, Search, Flower, ShoppingCart, User, LogOut } from 'lucide-react';
import type { Store, Location } from '../types';

export const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 現在地周辺の店舗を検索
  useEffect(() => {
    if (!location) return;

    const searchStores = async () => {
      setLoading(true);
      const result = await StoreService.searchNearbyStores({
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 10,
        keyword: searchKeyword
      });

      if (result.success && result.data) {
        setStores(result.data);
      }
      setLoading(false);
    };

    searchStores();
  }, [location, searchKeyword]);

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (locationLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Flower className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">87花屋</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>ログアウト</span>
                  </button>
                </>
              ) : (
                <a href="/login" className="btn-primary text-sm">
                  ログイン
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 検索バー */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="花屋を検索..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 位置情報エラー */}
        {locationError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{locationError}</p>
            <p className="text-sm text-red-600 mt-1">
              位置情報の許可が必要です。ブラウザの設定で位置情報を許可してください。
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 地図 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                近くの花屋
              </h2>
              
              {loading ? (
                <div className="h-96 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <Map
                  stores={stores}
                  userLocation={location}
                  onStoreSelect={handleStoreSelect}
                  className="h-96"
                />
              )}
            </div>
          </div>

          {/* 店舗リスト */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                店舗一覧 ({stores.length})
              </h3>
              
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : stores.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  近くに花屋が見つかりませんでした
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStore?.id === store.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => handleStoreSelect(store)}
                    >
                      <h4 className="font-medium text-gray-900">{store.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{store.address}</p>
                      {store.phone && (
                        <p className="text-sm text-gray-500 mt-1">📞 {store.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 選択された店舗の詳細 */}
        {selectedStore && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedStore.name}</h2>
                <p className="text-gray-600 mt-1">{selectedStore.address}</p>
              </div>
              <a
                href={`/store/${selectedStore.id}`}
                className="btn-primary flex items-center space-x-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>商品を見る</span>
              </a>
            </div>
            
            {selectedStore.description && (
              <p className="text-gray-700 mb-4">{selectedStore.description}</p>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {selectedStore.phone && (
                <div>
                  <span className="font-medium">電話番号:</span> {selectedStore.phone}
                </div>
              )}
              {selectedStore.email && (
                <div>
                  <span className="font-medium">メール:</span> {selectedStore.email}
                </div>
              )}
              {selectedStore.website && (
                <div>
                  <span className="font-medium">ウェブサイト:</span>{' '}
                  <a href={selectedStore.website} className="text-green-600 hover:underline">
                    {selectedStore.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
