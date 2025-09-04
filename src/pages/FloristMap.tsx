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
  ZoomOut,
  Image,
  MessageSquare,
  Camera
} from 'lucide-react';
import { StoreService } from '../services/storeService';
import { supabase } from '../lib/supabase';

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
  const [isMobile, setIsMobile] = useState(false);
  
  // 住所検索関連
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 現在地マーカー
  const [userLocationMarker, setUserLocationMarker] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Google Maps JavaScript APIキー
  const GOOGLE_MAPS_API_KEY = 'AIzaSyDcJkaHDTPcgBSfr2923T6K6YT_kiL3s4g';

  useEffect(() => {
    loadStores();
    
    // モバイル判定
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // ユーザーの位置情報を取得
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          // モバイルの場合は現在地を中心に設定
          if (window.innerWidth < 768) {
            setMapCenter(location);
            // 地図が既に初期化されている場合は即座に移動
            if (map) {
              map.setCenter(location);
              map.setZoom(15);
            }
          }
        },
        (error) => {
          console.log('位置情報の取得に失敗:', error);
        }
      );
    }

    // クリーンアップ関数
    return () => {
      window.removeEventListener('resize', checkMobile);
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
        zoom: isMobile ? 15 : 13, // モバイルではより詳細に
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: !isMobile, // モバイルでは非表示
        streetViewControl: !isMobile, // モバイルでは非表示
        fullscreenControl: !isMobile, // モバイルでは非表示
        zoomControl: true,
        gestureHandling: 'greedy', // モバイルでのタッチ操作を改善
        disableDefaultUI: isMobile, // モバイルではデフォルトUIを無効化
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP
        },
        styles: [
          {
            featureType: 'poi.business',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      console.log('Map instance created successfully');
      
      // 現在地マーカーを表示
      if (userLocation) {
        addUserLocationMarker(mapInstance, userLocation);
        // モバイルの場合は現在地を中心に設定
        if (isMobile) {
          mapInstance.setCenter(userLocation);
          mapInstance.setZoom(15);
        }
      }
      
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

  // 現在地マーカーを表示
  const addUserLocationMarker = (mapInstance: any, location: { lat: number; lng: number }) => {
    if (!window.google || !window.google.maps) return;
    
    // 既存の現在地マーカーを削除
    if (userLocationMarker) {
      userLocationMarker.setMap(null);
    }
    
    // 新しい現在地マーカーを作成
    const marker = new window.google.maps.Marker({
      position: location,
      map: mapInstance,
      title: '現在地',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- シンプルな赤い丸 -->
            <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#FFFFFF" stroke-width="2"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      },
      zIndex: 1000 // 他のマーカーより前面に表示
    });
    
    setUserLocationMarker(marker);
  };

  // StoreからStoreDetailsへの変換関数
  const convertStoreToStoreDetails = (store: Store): StoreDetails => {
    return {
      id: store.id,
      store_name: store.store_name || '',
      owner_name: '', // 必要に応じて設定
      address: '', // 住所は表示しない
      latitude: store.latitude,
      longitude: store.longitude,
      phone: store.phone || null,
      email: store.email || null,
      website: store.website || null,
      instagram: null, // 必要に応じて設定
      online_shop: null, // 必要に応じて設定
      description: store.description || null,
      business_hours: store.business_hours ? JSON.stringify(store.business_hours) : null,
      business_type: null, // 必要に応じて設定
      tags: null, // 必要に応じて設定
      has_parking: false, // 必要に応じて設定
      photos: null, // 必要に応じて設定
      is_verified: true, // 必要に応じて設定
      is_active: store.is_active,
      created_at: store.created_at,
      updated_at: store.updated_at,
      bulletin_board: null, // 必要に応じて設定
      business_hours_details: [],
      services: [],
      recommended_flowers: [],
      active_posts: []
    };
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
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <!-- シンプルなオレンジ色の丸 -->
                  <circle cx="16" cy="16" r="14" fill="#f97316" stroke="#FFFFFF" stroke-width="2"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16)
            }
          });

          // InfoWindowのコンテンツを作成
          const infoWindowContent = createInfoWindowContent(store);

          // InfoWindowを作成（モバイルでは無効化）
          const infoWindow = new window.google.maps.InfoWindow({
            content: infoWindowContent,
            maxWidth: isMobile ? 0 : 250 // モバイルでは非表示
          });

          // マーカークリック時の処理
          marker.addListener('click', () => {
            // モバイルではInfoWindowを開かない
            if (!isMobile) {
              // 他のInfoWindowを閉じる
              infoWindows.forEach(iw => iw.close());
              
              // このInfoWindowを開く
              infoWindow.open(map, marker);
            }
            
            // 店舗を選択状態にする
            handleStoreClick(store);
            
            // 選択された店舗のInfoWindowを保持
            setSelectedStore(convertStoreToStoreDetails(store));
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
  }, [map, stores]);

  // InfoWindowのコンテンツを作成
  const createInfoWindowContent = (store: Store) => {
    return `
      <div style="padding: 12px; max-width: 250px; font-family: 'Google Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); border: 1px solid #dee2e6;">
        <!-- ヘッダー部分 -->
        <div style="margin-bottom: 16px;">
          <h3 style="margin: 0 0 4px 0; color: #2c3e50; font-size: 18px; font-weight: 600; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${store.store_name}</h3>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #6c757d; font-size: 12px; font-weight: 500; background: rgba(255,255,255,0.7); padding: 2px 6px; border-radius: 4px;">${store.business_type || '花屋'}</span>
          </div>
        </div>
        
        <!-- 店舗タグ（Supabaseから取得） -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${store.tags && store.tags.length > 0 ? 
              store.tags.map(tag => `
                <span style="background: #e8f0fe; color: #1a73e8; padding: 4px 8px; border-radius: 16px; font-size: 11px; font-weight: 500;">${tag}</span>
              `).join('') : 
              `<span style="background: #e8f0fe; color: #1a73e8; padding: 4px 8px; border-radius: 16px; font-size: 11px; font-weight: 500;">🏪 実店舗</span>
               <span style="background: #fce8e6; color: #d93025; padding: 4px 8px; border-radius: 16px; font-size: 11px; font-weight: 500;">🌺 アレンジメント</span>
               <span style="background: #e6f4ea; color: #137333; padding: 4px 8px; border-radius: 16px; font-size: 11px; font-weight: 500;">💐 花束</span>`
            }
          </div>
        </div>
        
        <!-- 動的画像表示（store_imagesテーブルから取得） -->
        ${store.photos && store.photos.length > 0 ? `
          <div style="margin-bottom: 16px; position: relative;">
            <div style="display: flex; gap: 8px; overflow-x: auto; padding: 4px 0; scrollbar-width: none; -ms-overflow-style: none;">
              ${store.photos.slice(0, 5).map(photo => `
                <div style="min-width: 80px; height: 80px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <img src="${photo}" alt="店舗写真" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              `).join('')}
            </div>
            ${store.photos.length > 5 ? `
              <div style="text-align: center; margin-top: 8px;">
                <span style="color: #5f6368; font-size: 11px;">← 左右にスワイプして画像を見る →</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <!-- Supabase連携の店舗情報 -->
        <div style="background: rgba(255, 255, 255, 0.8); padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #ced4da; backdrop-filter: blur(5px);">
          <h4 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 14px; font-weight: 600; border-bottom: 2px solid #3498db; padding-bottom: 4px;">店舗情報</h4>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${store.phone ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #5f6368; font-size: 12px;">📞</span>
                <a href="tel:${store.phone}" style="color: #1a73e8; text-decoration: none; font-size: 12px; font-weight: 500;">${store.phone}</a>
              </div>
            ` : ''}
            ${store.business_hours ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #5f6368; font-size: 12px;">🕒</span>
                <span style="color: #202124; font-size: 12px;">${store.business_hours}</span>
              </div>
            ` : ''}
            ${store.has_parking ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #5f6368; font-size: 12px;">🚗</span>
                <span style="color: #202124; font-size: 12px;">駐車場あり</span>
              </div>
            ` : ''}
            ${store.email ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #5f6368; font-size: 12px;">📧</span>
                <a href="mailto:${store.email}" style="color: #1a73e8; text-decoration: none; font-size: 12px; font-weight: 500;">${store.email}</a>
              </div>
            ` : ''}
            ${store.description ? `
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="color: #5f6368; font-size: 12px; margin-top: 2px;">ℹ️</span>
                <span style="color: #202124; font-size: 12px; line-height: 1.4;">${store.description}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- 外部リンクボタン（適切なサイズ） -->
        <div style="display: flex; gap: 6px; margin-bottom: 16px;">
          ${store.website ? `
            <button onclick="window.open('${store.website}', '_blank')" 
                    style="background: #1a73e8; border: none; color: white; font-size: 11px; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span style="font-size: 12px;">🌐</span>
              <span>ウェブ</span>
            </button>
          ` : ''}
          
          ${store.instagram ? `
            <button onclick="window.open('${store.instagram}', '_blank')" 
                    style="background: #e4405f; border: none; color: white; font-size: 11px; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" style="fill: white;">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Instagram</span>
            </button>
          ` : ''}
          
          ${store.online_shop ? `
            <button onclick="window.open('${store.online_shop}', '_blank')" 
                    style="background: #34a853; border: none; color: white; font-size: 11px; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span style="font-size: 12px;">🛒</span>
              <span>オンライン</span>
            </button>
          ` : ''}
        </div>
        
        <!-- アクションボタン（Google風） -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}', '_blank')" 
                  style="background: #1a73e8; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="font-size: 14px;">🗺️</span>
            <span>経路案内</span>
          </button>
          <button onclick="window.open('tel:${store.phone || ''}', '_self')" 
                  style="background: #34a853; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="font-size: 14px;">📞</span>
            <span>電話</span>
          </button>
        </div>
        
        <!-- Supabaseとリンクした掲示板（Google風） -->
        <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 16px;">📋</span>
            <h4 style="margin: 0; color: #e65100; font-size: 13px; font-weight: 500;">店舗からのお知らせ</h4>
          </div>
          <div style="background: white; padding: 10px; border-radius: 6px; border-left: 4px solid #ff9800;">
            <p style="margin: 0; color: #bf360c; font-size: 12px; line-height: 1.4;">
              ${store.bulletin_board || '🌸 春の新作アレンジメント入荷中！<br>🌺 母の日ギフトのご予約受付開始<br>💐 毎週水曜日は定休日です'}
            </p>
          </div>
        </div>
        
        <!-- お気に入り切り替えスライダー（Google風） -->
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #e8eaed;">
          <p style="margin: 0 0 8px 0; color: #202124; font-size: 13px; font-weight: 500;">お気に入り設定</p>
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button onclick="setFavoriteStatus('${store.id}', 'favorite')" 
                    style="background: #d93025; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s ease;">
              ❤️ お気に入り
            </button>
            <button onclick="setFavoriteStatus('${store.id}', 'interested')" 
                    style="background: #b06000; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s ease;">
              ⭐ 気になる
            </button>
            <button onclick="setFavoriteStatus('${store.id}', 'visited')" 
                    style="background: #137333; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s ease;">
              ✅ 行った
            </button>
          </div>
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

      // 各店舗の画像、掲示板、タグ情報を取得
      const enrichedStores = await Promise.all(
        storesWithCoordinates.map(async (store) => {
          try {
            // 店舗画像を取得
            const { data: images, error: imagesError } = await supabase
              .from('store_images')
              .select('image_url')
              .eq('store_id', store.id)
              .eq('is_active', true)
              .order('display_order');

            if (imagesError) {
              console.error(`店舗 ${store.store_name} の画像取得エラー:`, imagesError);
            }

            // 店舗掲示板を取得
            const { data: bulletins } = await supabase
              .from('store_bulletins')
              .select('title, content, is_pinned')
              .eq('store_id', store.id)
              .eq('is_active', true)
              .order('is_pinned', { ascending: false })
              .order('created_at', { ascending: false })
              .limit(3);

            // 店舗タグを取得
            const { data: tagRelations } = await supabase
              .from('store_tag_relations')
              .select(`
                store_tags (
                  name, color
                )
              `)
              .eq('store_id', store.id);

            const enrichedStore = {
              ...store,
              // 古いphotosカラムを無視して、store_imagesテーブルのデータのみを使用
              photos: images?.map((img: any) => img.image_url) || [],
              bulletin_board: bulletins?.map((b: any) => b.title).join(', ') || null,
              tags: tagRelations?.map((tr: any) => tr.store_tags?.name).filter(Boolean) || []
            };

            // デバッグ情報を出力
            console.log(`店舗 ${store.store_name} の詳細情報:`, {
              store_id: store.id,
              old_photos_from_stores: store.photos, // 古いphotosカラム
              new_images_from_store_images: images?.length || 0,
              new_image_urls: images?.map((img: any) => img.image_url) || [],
              final_photos_used: enrichedStore.photos.length,
              final_photo_urls: enrichedStore.photos,
              bulletins: bulletins?.length || 0,
              bulletin_board: enrichedStore.bulletin_board,
              tags: enrichedStore.tags.length
            });

            return enrichedStore;
          } catch (err) {
            console.error(`店舗 ${store.id} の詳細情報取得エラー:`, err);
            return store;
          }
        })
      );

      console.log('Loaded enriched stores from Supabase:', enrichedStores);
      setStores(enrichedStores);
      
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
      // 店舗詳細情報を取得（関連データ含む）
      const storeDetails = await StoreService.getStoreDetails(store.id);
      
      if (storeDetails) {
        // デバッグ情報を出力
        console.log('Selected store details:', {
          id: storeDetails.id,
          store_name: storeDetails.store_name,
          photos: storeDetails.photos,
          photos_length: storeDetails.photos?.length || 0,
          photo_urls: storeDetails.photos,
          bulletin_board: storeDetails.bulletin_board,
          description: storeDetails.description,
          has_parking: storeDetails.has_parking,
          parking: storeDetails.parking,
          parking_type: typeof storeDetails.parking
        });
        
        setSelectedStore(storeDetails);
        setShowRoute(false); // 新しい店舗選択時に経路をリセット
        
        // 地図を店舗の位置に移動
        if (map) {
          const storePosition = { lat: store.latitude, lng: store.longitude };
          map.setCenter(storePosition);
          map.setZoom(isMobile ? 17 : 16); // モバイルではより詳細に
        }
      } else {
        // フォールバック: 古い方法で取得
        const storeDetails = await StoreService.getStoreDetails(store.id);
        setSelectedStore(storeDetails);
        setShowRoute(false);
        
        // 地図を店舗の位置に移動
        if (map) {
          const storePosition = { lat: store.latitude, lng: store.longitude };
          map.setCenter(storePosition);
          map.setZoom(isMobile ? 17 : 16); // モバイルではより詳細に
        }
      }
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
      
      // 現在地マーカーが表示されていない場合は追加
      if (!userLocationMarker) {
        addUserLocationMarker(map, userLocation);
      }
    }
  };

  // 住所検索機能
  const handleSearch = async (query: string) => {
    if (!query.trim() || !window.google || !window.google.maps) return;
    
    try {
      const service = new window.google.maps.places.AutocompleteService();
      const request = {
        input: query,
        componentRestrictions: { country: 'jp' }, // 日本に限定
        types: ['geocode'] // 住所のみ
      };
      
      service.getPlacePredictions(request, (predictions: any[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSearchResults(predictions);
        } else {
          setSearchResults([]);
        }
      });
    } catch (error) {
      console.error('住所検索エラー:', error);
      setSearchResults([]);
    }
  };

  // Enterキーでの住所検索
  const handleEnterSearch = async () => {
    if (!searchQuery.trim() || !window.google || !window.google.maps) return;
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      const request = {
        address: searchQuery,
        componentRestrictions: { country: 'jp' }
      };
      
      geocoder.geocode(request, (results: any[], status: any) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          // 地図を検索した住所に移動
          if (map) {
            map.setCenter({ lat, lng });
            map.setZoom(15);
          }
          
          // 検索クエリをクリア
          setSearchQuery('');
          setShowSearchResults(false);
          setSearchResults([]);
        } else {
          alert('住所が見つかりませんでした。別の住所を試してください。');
        }
      });
    } catch (error) {
      console.error('住所検索エラー:', error);
      alert('住所検索中にエラーが発生しました。');
    }
  };

  // 検索結果を選択
  const selectSearchResult = async (result: any) => {
    if (!window.google || !window.google.maps) return;
    
    try {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        placeId: result.place_id
      };
      
      service.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
          const location = place.geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          // 地図を検索した住所に移動
          map.setCenter({ lat, lng });
          map.setZoom(15);
          
          // 検索クエリをクリア
          setSearchQuery(result.description || '');
          setShowSearchResults(false);
          setSearchResults([]);
        }
      });
    } catch (error) {
      console.error('場所詳細取得エラー:', error);
    }
  };

  // 検索をクリア
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // 検索クエリが変更された時の処理
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300); // 300msのディレイ
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // 外側クリックで検索結果を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-3'} gap-4 sm:gap-8`}>
          {/* 地図エリア */}
          <div className={`${isMobile ? 'col-span-1' : 'lg:col-span-2'}`}>
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
                    {/* 住所検索バー */}
                    <div className="absolute top-4 left-4 z-10" style={{ width: 'calc(100% - 120px)' }}>
                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="住所を入力して花屋を検索..."
                            className="flex-1 text-sm border-none outline-none bg-transparent placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSearchResults(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && searchQuery.trim()) {
                                handleEnterSearch();
                              }
                            }}
                          />
                          {searchQuery && (
                            <button
                              onClick={clearSearch}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="検索をクリア"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        
                        {/* 検索結果のドロップダウン */}
                        {showSearchResults && searchResults.length > 0 && (
                          <div className="mt-2 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                            {searchResults.map((result, index) => (
                              <button
                                key={index}
                                onClick={() => selectSearchResult(result)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                              >
                                <div className="font-medium text-gray-900">{result.main_text}</div>
                                <div className="text-xs text-gray-500">{result.secondary_text}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 動的なGoogle Maps */}
                    <div 
                      ref={mapRef} 
                      className={`w-full rounded-lg overflow-hidden bg-gray-100 ${
                        isMobile 
                          ? 'h-[85vh]' // モバイルでは画面の85%を使用
                          : 'h-[70vh] sm:h-[600px] md:h-[700px] lg:h-[800px]'
                      }`}
                      style={{ minHeight: isMobile ? '500px' : '400px' }}
                    />
                    
                    {/* デバッグ情報（開発時のみ表示） */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                        <div>Map Loaded: {mapLoaded ? 'Yes' : 'No'}</div>
                        <div>Map Instance: {map ? 'Yes' : 'No'}</div>
                        <div>Stores: {stores.length}</div>
                        <div>Markers: {markers.length}</div>
                        <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
                      </div>
                    )}
                    
                    {/* 地図コントロール（モバイルでは簡素化） */}
                    <div className={`absolute ${isMobile ? 'top-1/2 right-2 transform -translate-y-1/2' : 'top-4 right-4'} flex flex-col space-y-2`}>
                      {!isMobile && (
                        <>
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
                        </>
                      )}
                      {userLocation && (
                        <button
                          onClick={centerOnUserLocation}
                          className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} bg-blue-600 rounded-lg shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-200`}
                          title="現在地に移動"
                        >
                          <Navigation className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-white`} />
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
                
                {/* 店舗リストオーバーレイ（モバイルでは下部に配置） */}
                <div className={`absolute ${isMobile ? 'bottom-4 left-2 right-2' : 'top-2 left-2 sm:top-4 sm:left-4'} bg-white rounded-lg shadow-lg p-2 sm:p-3 ${isMobile ? 'max-w-none' : 'max-w-[280px] sm:max-w-sm'} z-10`}>
                  <h3 className={`font-semibold text-gray-900 mb-2 sm:mb-3 ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`}>店舗一覧</h3>
                  <div className={`space-y-1 sm:space-y-2 ${isMobile ? 'max-h-20' : 'max-h-32 sm:max-h-48'} overflow-y-auto`}>
                    {stores.map((store, index) => {
                      // 様々な色のパレット
                      const colors = [
                        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
                        'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500',
                        'bg-yellow-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-rose-500'
                      ];
                      const colorIndex = index % colors.length;
                      const bgColor = colors[colorIndex];
                      
                      return (
                        <button
                          key={store.id}
                          onClick={() => handleStoreSelect(store)}
                          className={`w-full text-left p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                            selectedStore?.id === store.id
                              ? 'ring-2 ring-pink-400 shadow-md transform scale-105'
                              : 'hover:shadow-sm hover:scale-102'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${bgColor}`}></div>
                            <span className="text-xs font-medium text-gray-800 truncate leading-tight">
                              {store.store_name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 店舗詳細サイドバー（PC）または下部表示（モバイル） */}
          {!isMobile ? (
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
                  {/* 店舗画像 */}
                  <div>
                    <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                      <Image className="h-4 w-4 mr-2 text-green-500" />
                      店舗写真
                    </h5>
                    

                    
                    {/* 画像表示 */}
                    {selectedStore.photos && selectedStore.photos.length > 0 ? (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">
                          表示中: {selectedStore.photos.length}枚 (最大4枚表示)
                        </div>
                                                <div className="grid grid-cols-2 gap-2">
                          {selectedStore.photos.slice(0, 4).map((photo, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-1">
                              <img
                                src={photo}
                                alt={`${selectedStore.store_name}の写真${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                                onError={(e) => console.error('画像読み込みエラー:', photo, e)}
                                onLoad={() => console.log('画像読み込み成功:', photo)}
                              />
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {photo}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-100 p-2 rounded">
                        画像がありません
                      </div>
                    )}
                  </div>

                  {/* 店舗名 */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedStore.store_name}
                    </h4>
                    
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
                  {selectedStore.bulletin_board && (
                    <div>
                      <h5 className="font-semibold text-gray-900 flex items-center mb-3">
                        <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                        お知らせ
                      </h5>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-900">{selectedStore.bulletin_board}</p>
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
          ) : (
            // モバイル用の下部店舗情報表示
            selectedStore && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 max-h-[60vh] overflow-y-auto">
                <div className="p-4 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">店舗詳細</h3>
                    <button
                      onClick={() => setSelectedStore(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* 店舗名 */}
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {selectedStore.store_name}
                  </h4>
                  
                  {/* 連絡先 */}
                  <div className="space-y-2 mb-3">
                    {selectedStore.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <a
                          href={`tel:${selectedStore.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedStore.phone}
                        </a>
                      </div>
                    )}
                    {selectedStore.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <a
                          href={`mailto:${selectedStore.email}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedStore.email}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* 営業時間 */}
                  {selectedStore.business_hours && (
                    <div className="mb-3">
                      <h5 className="font-semibold text-gray-900 flex items-center mb-1">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        営業時間
                      </h5>
                      <p className="text-sm text-gray-600">{selectedStore.business_hours}</p>
                    </div>
                  )}
                  
                  {/* アクションボタン */}
                  <div className="flex space-x-2">
                    {userLocation && (
                      <button
                        onClick={openDirections}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        <Map className="h-4 w-4" />
                        <span>経路案内</span>
                      </button>
                    )}
                    <button
                      onClick={toggleRoute}
                      className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium ${
                        showRoute 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Route className="h-4 w-4" />
                      <span>{showRoute ? '経路非表示' : '経路表示'}</span>
                    </button>
                  </div>
                  
                  {/* 距離表示 */}
                  {userLocation && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <Navigation className="h-4 w-4 inline mr-1" />
                        現在地からの距離: {calculateDistance(userLocation.lat, userLocation.lng, selectedStore.latitude, selectedStore.longitude).toFixed(1)}km
                      </p>
                    </div>
                  )}
                  
                  {/* 店舗タイプ */}
                  {selectedStore.business_type && (
                    <div className="mt-3">
                      <h5 className="font-semibold text-gray-900 flex items-center mb-1">
                        <Flower className="h-4 w-4 mr-2 text-pink-500" />
                        店舗タイプ
                      </h5>
                      <p className="text-sm text-gray-600">{selectedStore.business_type}</p>
                    </div>
                  )}
                  
                  {/* 駐車場 */}
                  <div className="mt-3">
                    <h5 className="font-semibold text-gray-900 flex items-center mb-1">
                      <Car className="h-4 w-4 mr-2 text-orange-500" />
                      駐車場
                    </h5>
                    <p className="text-sm text-gray-600">
                      {selectedStore.parking === null ? '不明' : selectedStore.parking === true ? 'あり' : selectedStore.parking === false ? 'なし' : selectedStore.parking}
                    </p>
                  </div>
                  
                  {/* リンク */}
                  <div className="mt-3">
                    <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                      <Globe className="h-4 w-4 mr-2 text-purple-500" />
                      リンク
                    </h5>
                    <div className="space-y-2">
                      {selectedStore.website && (
                        <a
                          href={selectedStore.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
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
                          className="flex items-center space-x-2 text-sm text-pink-600 hover:text-pink-800"
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
                          className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-800"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>オンラインショップ</span>
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* 説明 */}
                  {selectedStore.description && (
                    <div className="mt-3">
                      <h5 className="font-semibold text-gray-900 mb-1">店舗説明</h5>
                      <p className="text-sm text-gray-600">{selectedStore.description}</p>
                    </div>
                  )}
                  
                  {/* 画像ギャラリー */}
                  {selectedStore.photos && selectedStore.photos.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                        <Camera className="h-4 w-4 mr-2 text-green-500" />
                        店舗画像
                      </h5>
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {selectedStore.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`店舗画像 ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 掲示板 */}
                  {selectedStore.bulletin_board && (
                    <div className="mt-3">
                      <h5 className="font-semibold text-gray-900 flex items-center mb-2">
                        <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                        お知らせ
                      </h5>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-900 whitespace-pre-line">{selectedStore.bulletin_board}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
