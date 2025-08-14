import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@googlemaps/js-api-loader';
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
  Star
} from 'lucide-react';
import { StoreService, Store, StoreDetails } from '../services/storeService';

interface MapStore extends Store {
  position: google.maps.LatLng;
}

export const FloristMap: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [stores, setStores] = useState<MapStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Google Maps APIキー（環境変数から取得）
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0 && mapRef.current) {
      initializeMap();
    }
  }, [stores]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const storeData = await StoreService.getAllStores();
      
      // 座標がある店舗のみをフィルタリング
      const storesWithCoordinates = storeData
        .filter(store => store.latitude && store.longitude)
        .map(store => ({
          ...store,
          position: new google.maps.LatLng(store.latitude!, store.longitude!)
        }));

      setStores(storesWithCoordinates);
    } catch (err: any) {
      setError('店舗情報の読み込みに失敗しました');
      console.error('店舗読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps APIキーが設定されていません');
      return;
    }

    try {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places']
      });

      await loader.load();

      if (!mapRef.current) return;

      // 日本の中心座標（東京）
      const center = { lat: 35.6762, lng: 139.6503 };

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 6,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // 店舗マーカーを追加
      addStoreMarkers(map);

      // 情報ウィンドウを初期化
      infoWindowRef.current = new google.maps.InfoWindow();

    } catch (err) {
      console.error('Google Maps初期化エラー:', err);
      setError('Google Mapsの読み込みに失敗しました');
    }
  };

  const addStoreMarkers = (map: google.maps.Map) => {
    // 既存のマーカーをクリア
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    stores.forEach(store => {
      const marker = new google.maps.Marker({
        position: store.position,
        map,
        title: store.store_name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#e91e63" stroke="#fff" stroke-width="2"/>
              <path d="M20 8l2.5 7.5h8l-6.5 4.5 2.5 7.5-6.5-4.5-6.5 4.5 2.5-7.5-6.5-4.5h8z" fill="#fff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }
      });

      marker.addListener('click', () => {
        handleMarkerClick(store);
      });

      markersRef.current.push(marker);
    });
  };

  const handleMarkerClick = async (store: MapStore) => {
    try {
      const storeDetails = await StoreService.getStoreDetails(store.id);
      setSelectedStore(storeDetails);
      
      if (infoWindowRef.current && mapInstanceRef.current) {
        const content = createInfoWindowContent(storeDetails);
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstanceRef.current, markersRef.current.find(m => 
          m.getPosition()?.equals(store.position)
        ));
      }
    } catch (err) {
      console.error('店舗詳細取得エラー:', err);
    }
  };

  const createInfoWindowContent = (store: StoreDetails) => {
    return `
      <div style="padding: 10px; max-width: 300px;">
        <h3 style="margin: 0 0 10px 0; color: #e91e63; font-size: 16px;">${store.store_name}</h3>
        <p style="margin: 5px 0; font-size: 14px;">📍 ${store.address}</p>
        ${store.phone ? `<p style="margin: 5px 0; font-size: 14px;">📞 ${store.phone}</p>` : ''}
        ${store.business_hours ? `<p style="margin: 5px 0; font-size: 14px;">🕒 ${store.business_hours}</p>` : ''}
        ${store.holiday_info ? `<p style="margin: 5px 0; font-size: 14px;">📅 定休日: ${store.holiday_info}</p>` : ''}
        <button onclick="window.open('/store/${store.id}', '_blank')" style="background: #e91e63; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
          詳細を見る
        </button>
      </div>
    `;
  };

  const closeInfoWindow = () => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    setSelectedStore(null);
  };

  const formatBusinessHours = (hours: any[]) => {
    if (!hours || hours.length === 0) return '営業時間未設定';
    
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return hours
      .filter(h => !h.is_closed)
      .map(h => `${dayNames[h.day_of_week]} ${h.open_time}-${h.close_time}`)
      .join(', ');
  };

  const getServiceLabels = (services: any[]) => {
    if (!services || services.length === 0) return [];
    
    const categories = StoreService.getServiceCategories();
    const categoryMap = new Map(categories.map(cat => [cat.value, cat.label]));
    
    return services
      .filter(s => s.is_available)
      .map(s => categoryMap.get(s.service_category) || s.service_name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/menu')}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/menu')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">全国フローリストマップ</h1>
                <p className="text-sm text-gray-600">登録された花屋を地図で確認できます</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {stores.length}件の花屋が登録されています
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* マップ */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* マップオーバーレイ */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
              <span>花屋</span>
            </div>
          </div>
        </div>

        {/* 店舗詳細パネル */}
        {selectedStore && (
          <div className="w-96 bg-white shadow-lg overflow-y-auto">
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedStore.store_name}
                  </h2>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedStore.address}
                  </div>
                </div>
                <button
                  onClick={closeInfoWindow}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 基本情報 */}
              <div className="space-y-3 mb-6">
                {selectedStore.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <a href={`tel:${selectedStore.phone}`} className="text-blue-600 hover:underline">
                      {selectedStore.phone}
                    </a>
                  </div>
                )}
                
                {selectedStore.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <a href={`mailto:${selectedStore.email}`} className="text-blue-600 hover:underline">
                      {selectedStore.email}
                    </a>
                  </div>
                )}

                {selectedStore.business_hours && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{selectedStore.business_hours}</span>
                  </div>
                )}

                {selectedStore.holiday_info && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 mr-2">定休日:</span>
                    <span>{selectedStore.holiday_info}</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Car className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedStore.parking_available ? '駐車場あり' : '駐車場なし'}</span>
                </div>
              </div>

              {/* リンク */}
              <div className="flex space-x-2 mb-6">
                {selectedStore.website_url && (
                  <a
                    href={selectedStore.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    HP
                  </a>
                )}
                
                {selectedStore.instagram_url && (
                  <a
                    href={selectedStore.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors text-sm"
                  >
                    <Instagram className="h-4 w-4 mr-1" />
                    Instagram
                  </a>
                )}
                
                {selectedStore.commerce_url && (
                  <a
                    href={selectedStore.commerce_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    オンラインショップ
                  </a>
                )}
              </div>

              {/* サービス */}
              {selectedStore.services && selectedStore.services.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Flower className="h-5 w-5 mr-2 text-pink-500" />
                    取り扱いサービス
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getServiceLabels(selectedStore.services).map((service, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* オススメの花 */}
              {selectedStore.recommended_flowers && selectedStore.recommended_flowers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    今週のおすすめ
                  </h3>
                  <div className="space-y-3">
                    {selectedStore.recommended_flowers.slice(0, 3).map((flower, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {flower.flower_image_url && (
                          <img
                            src={flower.flower_image_url}
                            alt={flower.flower_name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{flower.flower_name}</div>
                          {flower.price && (
                            <div className="text-sm text-gray-600">
                              ¥{flower.price.toLocaleString()}{flower.price_type && `/${flower.price_type}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 掲示板 */}
              {selectedStore.active_posts && selectedStore.active_posts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">お知らせ</h3>
                  <div className="space-y-3">
                    {selectedStore.active_posts.slice(0, 2).map((post, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium mb-1">{post.post_type}</div>
                        <div className="text-sm font-medium text-gray-900 mb-1">{post.title}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{post.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 説明 */}
              {selectedStore.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">店舗紹介</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedStore.description}
                  </p>
                </div>
              )}

              {/* アクションボタン */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/store/${selectedStore.id}`)}
                  className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors font-medium"
                >
                  詳細ページを見る
                </button>
                
                {selectedStore.phone && (
                  <a
                    href={`tel:${selectedStore.phone}`}
                    className="block w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium text-center"
                  >
                    電話をかける
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
