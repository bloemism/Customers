import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { Store, Location } from '../types';

interface MapProps {
  stores: Store[];
  userLocation: Location | null;
  onStoreSelect: (store: Store) => void;
  className?: string;
}

export const Map: React.FC<MapProps> = ({ 
  stores, 
  userLocation, 
  onStoreSelect, 
  className = "w-full h-96" 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Google Maps APIの読み込みと地図の初期化
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        
        // APIキーのチェック
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
          throw new Error('Google Maps APIキーが設定されていません');
        }
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly'
        });

        const google = await loader.load();
        
        if (!mapRef.current) return;

        const defaultCenter = userLocation 
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : { lat: 35.6762, lng: 139.6503 }; // 東京

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoading(false);
        // エラー状態を設定
        setError(error instanceof Error ? error.message : '地図の読み込みに失敗しました');
      }
    };

    initMap();
  }, [userLocation]);

  // エラー状態の管理
  const [error, setError] = useState<string | null>(null);

  // エラーが発生した場合のフォールバック表示
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200`}>
        <div className="text-center p-6">
          <div className="text-red-500 text-4xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">地図の読み込みに失敗</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-red-500">
            <p>• 環境変数 VITE_GOOGLE_MAPS_API_KEY を設定してください</p>
            <p>• Google Cloud ConsoleでAPIキーを作成してください</p>
            <p>• Maps JavaScript APIを有効化してください</p>
          </div>
        </div>
      </div>
    );
  }

  // 店舗データが変更されたらマーカーを更新
  useEffect(() => {
    if (!map || !stores.length) return;

    // 既存のマーカーをクリア
    markers.forEach(marker => marker.setMap(null));

    // 新しいマーカーを作成
    const newMarkers = stores.map(store => {
      const marker = new google.maps.Marker({
        position: { lat: store.latitude, lng: store.longitude },
        map: map,
        title: store.store_name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24)
        }
      });

      // マーカークリック時のイベント
      marker.addListener('click', () => {
        onStoreSelect(store);
        
        // 地図の中心を選択された店舗に移動
        map.panTo({ lat: store.latitude, lng: store.longitude });
        map.setZoom(15);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, stores, onStoreSelect]);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-md" />
    </div>
  );
};
