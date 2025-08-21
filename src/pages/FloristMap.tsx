import React, { useState, useEffect, useRef } from 'react';
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
  Navigation,
  Route,
  Calendar,
  Info,
  Heart,
  Share2,
  Map,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { StoreService } from '../services/storeService';

// Google Maps JavaScript APIの型定義
declare global {
  interface Window {
    google: any;
  }
}

// Store型を直接定義
interface Store {
  id: string;
  store_name: string;
  owner_name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  online_shop: string | null;
  description: string | null;
  business_hours: string | null;
  business_type: string | null;
  tags: string[] | null;
  has_parking: boolean;
  photos: string[] | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  bulletin_board: string | null;
}

// StoreDetails型を直接定義
interface StoreDetails {
  id: string;
  store_name: string;
  owner_name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  online_shop: string | null;
  description: string | null;
  business_hours: string | null;
  business_type: string | null;
  tags: string[] | null;
  has_parking: boolean;
  photos: string[] | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  bulletin_board: string | null;
  business_hours_details: any[];
  services: any[];
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Google Maps JavaScript APIキー
  const GOOGLE_MAPS_API_KEY = 'AIzaSyDcJkaHDTPcgBSfr2923T6K6YT_kiL3s4g';

  useEffect(() => {
    loadStores();
    
    // ユーザーの位置情報を取得
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('位置情報の取得に失敗:', error);
        }
      );
    }

    // クリーンアップ関数
    return () => {
      // マーカーをクリア
      markers.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      
      // 経路レンダラーをクリア
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, []);

  // Google Maps JavaScript APIの読み込み
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        console.log('Google Maps API already loaded');
        if (stores.length > 0) {
          initializeMap();
        }
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps API script already exists');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        if (stores.length > 0) {
          initializeMap();
        }
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, [GOOGLE_MAPS_API_KEY, stores.length]);

  // 店舗データが読み込まれた後に地図を初期化
  useEffect(() => {
    if (stores.length > 0 && window.google && window.google.maps && !map) {
      console.log('Stores loaded, initializing map...');
      initializeMap();
    }
  }, [stores.length, map]);

  // 地図の初期化
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      console.log('Initializing Google Maps...');
      
      let center = mapCenter;
      if (stores.length > 0) {
        const centerLat = stores.reduce((sum, store) => sum + store.latitude, 0) / stores.length;
        const centerLng = stores.reduce((sum, store) => sum + store.longitude, 0) / stores.length;
        center = { lat: centerLat, lng: centerLng };
      }
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: 10,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.business',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      console.log('Map instance created successfully');
      
      window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        console.log('Map is idle - fully loaded');
        setMapLoaded(true);
      });
      
      setMap(mapInstance);
      setDirectionsService(new window.google.maps.DirectionsService());
      setDirectionsRenderer(new window.google.maps.DirectionsRenderer({
        suppressMarkers: true
      }));
      
      console.log('Map initialization completed');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // マーカーとInfoWindowの更新
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) {
      console.log('Map or Google Maps API not ready for markers');
      return;
    }

    try {
      console.log('Updating markers and info windows...');
      
      // 既存のマーカーをクリア
      markers.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      
      const newMarkers: any[] = [];
      const infoWindows: any[] = [];

      stores.forEach((store, index) => {
        try {
          // マーカーを作成
          const marker = new window.google.maps.Marker({
            position: { lat: store.latitude, lng: store.longitude },
            map: map,
            title: store.store_name,
            label: {
              text: (index + 1).toString(),
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            },
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="12" fill="#3b82f6" stroke="white" stroke-width="2"/>
                  <text x="15" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${index + 1}</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(30, 30),
              anchor: new window.google.maps.Point(15, 15)
            }
          });

          // InfoWindowのコンテンツを作成
          const infoWindowContent = createInfoWindowContent(store);

          // InfoWindowを作成
          const infoWindow = new window.google.maps.InfoWindow({
            content: infoWindowContent,
            maxWidth: 300
          });

          // マーカークリック時にInfoWindowを開く
          marker.addListener('click', () => {
            // 他のInfoWindowを閉じる
            infoWindows.forEach(iw => iw.close());
            
            // このInfoWindowを開く
            infoWindow.open(map, marker);
            
            // 店舗を選択状態にする
            handleStoreClick(store);
          });

          newMarkers.push(marker);
          infoWindows.push(infoWindow);
        } catch (error) {
          console.error('Error creating marker for store:', store.store_name, error);
        }
      });

      setMarkers(newMarkers);
      console.log('Markers and info windows updated successfully');
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [map, stores, selectedStore]);

  // InfoWindowのコンテンツを作成
  const createInfoWindowContent = (store: Store) => {
    return `
      <div style="padding: 10px; max-width: 280px; font-family: Arial, sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
            <span style="color: white; font-size: 18px;">🌸</span>
          </div>
          <div>
            <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: bold;">${store.store_name}</h3>
            <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 12px;">${store.address}</p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px;">
          ${store.phone ? `<p style="margin: 4px 0; color: #374151; font-size: 12px;">📞 ${store.phone}</p>` : ''}
          ${store.business_hours ? `<p style="margin: 4px 0; color: #374151; font-size: 12px;">🕒 ${store.business_hours}</p>` : ''}
          ${store.has_parking ? `<p style="margin: 4px 0; color: #374151; font-size: 12px;">🚗 駐車場あり</p>` : ''}
        </div>
        
        <div style="margin-top: 8px;">
          <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}', '_blank')" 
                  style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-right: 5px;">
            経路案内
          </button>
          <button onclick="window.open('tel:${store.phone || ''}', '_self')" 
                  style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
            電話
          </button>
        </div>
      </div>
    `;
  };

  const loadStores = async () => {
    try {
      setLoading(true);
      
      // Supabaseから実際の店舗データを取得
      const storeData = await StoreService.getAllStores();
      
      // 座標がある店舗のみをフィルタリング
      const storesWithCoordinates = storeData.filter(store => 
        store.latitude && store.longitude && store.is_active
      );

      console.log('Loaded stores from Supabase:', storesWithCoordinates);
      setStores(storesWithCoordinates);
      
    } catch (err: any) {
      console.error('店舗読み込みエラー:', err);
      
      // エラーが発生した場合のフォールバック処理
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('ネットワークエラー: Supabaseに接続できません');
      } else {
        setError('店舗情報の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  // 経路表示の切り替え
  const toggleRoute = () => {
    if (!userLocation || !selectedStore || !directionsService || !directionsRenderer || !map) {
      alert('位置情報の取得に失敗しました。ブラウザの位置情報許可を確認してください。');
      return;
    }

    if (showRoute) {
      // 経路を非表示
      directionsRenderer.setMap(null);
      setShowRoute(false);
    } else {
      // 経路を表示
      const request = {
        origin: userLocation,
        destination: { lat: selectedStore.latitude, lng: selectedStore.longitude },
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          directionsRenderer.setMap(map);
          setShowRoute(true);
        } else {
          alert('経路の取得に失敗しました');
        }
      });
    }
  };

  const handleStoreClick = async (store: Store) => {
    try {
      const storeDetails = await StoreService.getStoreDetails(store.id);
      setSelectedStore(storeDetails);
      setShowRoute(false); // 新しい店舗選択時に経路をリセット
    } catch (err) {
      console.error('店舗詳細の取得に失敗:', err);
    }
  };



  // Google Mapsで経路案内を開く
  const openDirections = () => {
    if (!selectedStore || !userLocation) return;
    
    const origin = `${userLocation.lat},${userLocation.lng}`;
    const destination = `${selectedStore.latitude},${selectedStore.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // 店舗情報を共有
  const shareStore = async () => {
    if (!selectedStore) return;
    
    const shareData = {
      title: `${selectedStore.store_name} - 花屋`,
      text: `${selectedStore.store_name}の詳細情報`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('共有に失敗:', err);
      }
    } else {
      // フォールバック: URLをクリップボードにコピー
      navigator.clipboard.writeText(window.location.href);
      alert('URLをクリップボードにコピーしました');
    }
  };

  // 2点間の距離を計算（ハバーサイン公式）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 地図のズーム制御
  const zoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const zoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  // 地図を現在地に移動
  const centerOnUserLocation = () => {
    if (map && userLocation) {
      map.setCenter(userLocation);
      map.setZoom(15);
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
                  <div className="relative">
                    {/* 動的なGoogle Maps */}
                    <div 
                      ref={mapRef} 
                      className="w-full h-96 rounded-lg overflow-hidden bg-gray-100"
                      style={{ minHeight: '384px' }}
                    />
                    
                    {/* デバッグ情報 */}
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                      <div>Map Loaded: {mapLoaded ? 'Yes' : 'No'}</div>
                      <div>Map Instance: {map ? 'Yes' : 'No'}</div>
                      <div>Stores: {stores.length}</div>
                      <div>Markers: {markers.length}</div>
                    </div>
                    
                    {/* 地図コントロール */}
                    <div className="absolute top-4 right-4 flex flex-col space-y-2">
                      <button
                        onClick={zoomIn}
                        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                        title="拡大"
                      >
                        <ZoomIn className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        onClick={zoomOut}
                        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                        title="縮小"
                      >
                        <ZoomOut className="h-5 w-5 text-gray-700" />
                      </button>
                      {userLocation && (
                        <button
                          onClick={centerOnUserLocation}
                          className="w-10 h-10 bg-blue-600 rounded-lg shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
                          title="現在地に移動"
                        >
                          <Navigation className="h-5 w-5 text-white" />
                        </button>
                      )}
                    </div>
                    
                    {/* 読み込み中表示 */}
                    {!mapLoaded && (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p className="text-gray-600">地図を読み込み中...</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {stores.length > 0 ? `${stores.length}件の店舗を読み込みました` : '店舗データを読み込み中...'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* 地図読み込み失敗時のフォールバック */}
                    {!mapLoaded && stores.length > 0 && (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">地図の読み込みに時間がかかっています</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            ページを再読み込み
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Google Maps APIキーが設定されていません</p>
                      <p className="text-sm text-gray-500 mt-2">
                        APIキーを設定してください
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 店舗リストオーバーレイ */}
                <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={shareStore}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="共有"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedStore(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 店舗名 */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedStore.store_name}
                    </h4>
                    <p className="text-gray-600">{selectedStore.address}</p>
                    
                    {/* アクションボタン */}
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={toggleRoute}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          showRoute 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Route className="h-4 w-4" />
                        <span>{showRoute ? '経路非表示' : '経路表示'}</span>
                      </button>
                      
                      {userLocation && (
                        <button
                          onClick={openDirections}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                        >
                          <Map className="h-4 w-4" />
                          <span>経路案内</span>
                        </button>
                      )}
                    </div>
                    
                    {/* 距離表示 */}
                    {userLocation && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <Navigation className="h-4 w-4 inline mr-1" />
                          現在地からの距離: {calculateDistance(userLocation.lat, userLocation.lng, selectedStore.latitude, selectedStore.longitude).toFixed(1)}km
                        </p>
                      </div>
                    )}
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

                  {/* タグ */}
                  {selectedStore.tags && selectedStore.tags.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                        <Info className="h-4 w-4 mr-2 text-purple-500" />
                        特徴
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedStore.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 店舗タイプ */}
                  {selectedStore.business_type && (
                    <div>
                      <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                        <Flower className="h-4 w-4 mr-2 text-pink-500" />
                        店舗タイプ
                      </h5>
                      <p className="text-sm text-gray-600">{selectedStore.business_type}</p>
                    </div>
                  )}

                  {/* 定休日 */}
                  {selectedStore.business_hours && selectedStore.business_hours.includes('定休') && (
                    <div>
                      <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-2 text-red-500" />
                        定休日
                      </h5>
                      <p className="text-sm text-gray-600">
                        {selectedStore.business_hours.includes('定休') 
                          ? selectedStore.business_hours.split('定休')[1]?.trim() || '営業時間をご確認ください'
                          : '営業時間をご確認ください'
                        }
                      </p>
                    </div>
                  )}

                  {/* 駐車場 */}
                  <div>
                    <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                      <Car className="h-4 w-4 mr-2 text-orange-500" />
                      駐車場
                    </h5>
                    <p className="text-sm text-gray-600">
                      {selectedStore.has_parking ? 'あり' : 'なし'}
                    </p>
                  </div>

                  {/* リンク */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900 flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-purple-500" />
                      リンク
                    </h5>
                    <div className="space-y-2">
                      {selectedStore.website && (
                        <a
                          href={selectedStore.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>公式サイト</span>
                        </a>
                      )}
                      {selectedStore.instagram && (
                        <a
                          href={selectedStore.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-pink-600 hover:text-pink-800 transition-colors duration-200"
                        >
                          <Instagram className="h-4 w-4" />
                          <span>Instagram</span>
                        </a>
                      )}
                      {selectedStore.online_shop && (
                        <a
                          href={selectedStore.online_shop}
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
