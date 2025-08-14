import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Instagram, 
  ShoppingCart,
  Clock,
  Car,
  Flower,
  ArrowLeft,
  ExternalLink,
  Star,
  Navigation
} from 'lucide-react';
import { StoreService } from '../services/storeService';

// Store型を直接定義
interface Store {
  id: string;
  user_id: string;
  store_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  commerce_url: string | null;
  business_hours: string | null;
  holiday_info: string | null;
  parking_available: boolean;
  parking_info: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// StoreDetails型を直接定義
interface StoreDetails {
  id: string;
  user_id: string;
  store_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  commerce_url: string | null;
  business_hours: string | null;
  holiday_info: string | null;
  parking_available: boolean;
  parking_info: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  business_hours_details: any[];
  services: any[];
  photos: any[];
  recommended_flowers: any[];
  active_posts: any[];
}

export const FloristMap: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 35.6762, lng: 139.6503 }); // 東京中心

  // Google Maps Static APIキー（環境変数から取得）
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const storeData = await StoreService.getAllStores();
      
      // 座標がある店舗のみをフィルタリング
      const storesWithCoordinates = storeData.filter(store => 
        store.latitude && store.longitude
      );

      setStores(storesWithCoordinates);
    } catch (err: any) {
      setError('店舗情報の読み込みに失敗しました');
      console.error('店舗読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  // Static Maps APIのURLを生成
  const generateStaticMapUrl = () => {
    if (!GOOGLE_MAPS_API_KEY) {
      return '';
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const size = '800x600';
    const zoom = '6';
    const mapType = 'roadmap';
    
    // 店舗のマーカーを生成
    const markers = stores.map((store, index) => {
      const color = selectedStore?.id === store.id ? 'red' : 'blue';
      return `markers=color:${color}|label:${index + 1}|${store.latitude},${store.longitude}`;
    }).join('&');

    const params = new URLSearchParams({
      center: `${mapCenter.lat},${mapCenter.lng}`,
      zoom,
      size,
      maptype: mapType,
      key: GOOGLE_MAPS_API_KEY
    });

    return `${baseUrl}?${params}&${markers}`;
  };

  const handleStoreClick = async (store: Store) => {
    try {
      const storeDetails = await StoreService.getStoreDetails(store.id);
      setSelectedStore(storeDetails);
    } catch (err) {
      console.error('店舗詳細の取得に失敗:', err);
    }
  };

  const handleMapClick = (event: React.MouseEvent<HTMLImageElement>) => {
    // 画像クリック時の座標計算（簡易版）
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 画像の中心からの相対位置を計算
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // 座標変換（簡易版）
    const latDiff = (y - centerY) / 1000; // 簡易的な変換
    const lngDiff = (x - centerX) / 1000;
    
    const clickedLat = mapCenter.lat - latDiff;
    const clickedLng = mapCenter.lng + lngDiff;
    
    // 最も近い店舗を探す
    const nearestStore = stores.find(store => {
      const distance = Math.sqrt(
        Math.pow(store.latitude! - clickedLat, 2) + 
        Math.pow(store.longitude! - clickedLng, 2)
      );
      return distance < 0.1; // 約10km以内
    });
    
    if (nearestStore) {
      handleStoreClick(nearestStore);
    }
  };

  const handleStoreSelect = (store: Store) => {
    handleStoreClick(store);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
            <p className="font-bold">エラー</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/menu')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="h-10 w-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">全国フローリストマップ</h1>
                <p className="text-sm text-gray-500">花屋の位置情報を確認</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 地図エリア */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-pink-500" />
                  全国の花屋マップ
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  地図上のマーカーをクリックして店舗詳細を確認
                </p>
              </div>
              
              <div className="relative">
                {GOOGLE_MAPS_API_KEY ? (
                  <img
                    src={generateStaticMapUrl()}
                    alt="全国フローリストマップ"
                    className="w-full h-96 object-cover cursor-pointer"
                    onClick={handleMapClick}
                    title="地図をクリックして店舗を選択"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Google Maps APIキーが設定されていません</p>
                      <p className="text-sm text-gray-500 mt-2">
                        .envファイルにVITE_GOOGLE_MAPS_API_KEYを設定してください
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 店舗リストオーバーレイ */}
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
                  <h3 className="font-semibold text-gray-900 mb-3">店舗一覧</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stores.map((store, index) => (
                      <button
                        key={store.id}
                        onClick={() => handleStoreSelect(store)}
                        className={`w-full text-left p-2 rounded-lg transition-colors duration-200 ${
                          selectedStore?.id === store.id
                            ? 'bg-pink-100 text-pink-700'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedStore?.id === store.id ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          <span className="text-sm font-medium">{store.store_name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{store.address}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 店舗詳細サイドバー */}
          <div className="lg:col-span-1">
            {selectedStore ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">店舗詳細</h3>
                  <button
                    onClick={() => setSelectedStore(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 店舗名 */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedStore.store_name}
                    </h4>
                    <p className="text-gray-600">{selectedStore.address}</p>
                  </div>

                  {/* 連絡先 */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-green-500" />
                      連絡先
                    </h5>
                    <div className="space-y-2">
                      {selectedStore.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedStore.phone}</span>
                        </div>
                      )}
                      {selectedStore.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedStore.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 営業時間 */}
                  {selectedStore.business_hours && (
                    <div>
                      <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        営業時間
                      </h5>
                      <p className="text-sm text-gray-600">{selectedStore.business_hours}</p>
                    </div>
                  )}

                  {/* 定休日 */}
                  {selectedStore.holiday_info && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">定休日</h5>
                      <p className="text-sm text-gray-600">{selectedStore.holiday_info}</p>
                    </div>
                  )}

                  {/* 駐車場 */}
                  <div>
                    <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                      <Car className="h-4 w-4 mr-2 text-orange-500" />
                      駐車場
                    </h5>
                    <p className="text-sm text-gray-600">
                      {selectedStore.parking_available ? 'あり' : 'なし'}
                      {selectedStore.parking_info && ` - ${selectedStore.parking_info}`}
                    </p>
                  </div>

                  {/* リンク */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900 flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-purple-500" />
                      リンク
                    </h5>
                    <div className="space-y-2">
                      {selectedStore.website_url && (
                        <a
                          href={selectedStore.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>公式サイト</span>
                        </a>
                      )}
                      {selectedStore.instagram_url && (
                        <a
                          href={selectedStore.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-pink-600 hover:text-pink-800 transition-colors duration-200"
                        >
                          <Instagram className="h-4 w-4" />
                          <span>Instagram</span>
                        </a>
                      )}
                      {selectedStore.commerce_url && (
                        <a
                          href={selectedStore.commerce_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-800 transition-colors duration-200"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>オンラインショップ</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* サービス */}
                  {selectedStore.services && selectedStore.services.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 flex items-center mb-3">
                        <Star className="h-4 w-4 mr-2 text-yellow-500" />
                        提供サービス
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedStore.services.map((service, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium"
                          >
                            {service.service_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* おすすめの花 */}
                  {selectedStore.recommended_flowers && selectedStore.recommended_flowers.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 flex items-center mb-3">
                        <Flower className="h-4 w-4 mr-2 text-pink-500" />
                        おすすめの花
                      </h5>
                      <div className="space-y-2">
                        {selectedStore.recommended_flowers.slice(0, 3).map((flower, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{flower.flower_name}</p>
                              <p className="text-xs text-gray-500">{flower.description}</p>
                            </div>
                            <span className="text-sm font-semibold text-pink-600">
                              ¥{flower.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 掲示板 */}
                  {selectedStore.active_posts && selectedStore.active_posts.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">掲示板</h5>
                      <div className="space-y-2">
                        {selectedStore.active_posts.slice(0, 2).map((post: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {post.post_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{post.title}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {post.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 説明 */}
                  {selectedStore.description && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">店舗説明</h5>
                      <p className="text-sm text-gray-600">{selectedStore.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">店舗を選択</h3>
                <p className="text-gray-600">
                  地図上のマーカーまたは右側の店舗リストから店舗を選択してください
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
