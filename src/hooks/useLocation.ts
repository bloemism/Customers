import { useState, useEffect } from 'react';
import type { Location } from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        setError('位置情報がサポートされていません');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(newLocation);
          setLoading(false);
        },
        (error) => {
          console.error('位置情報の取得に失敗:', error);
          let errorMessage = '位置情報の取得に失敗しました';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '位置情報の許可が必要です';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置情報が利用できません';
              break;
            case error.TIMEOUT:
              errorMessage = '位置情報の取得がタイムアウトしました';
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5分
        }
      );
    };

    getCurrentLocation();
  }, []);

  const refreshLocation = () => {
    setLoading(true);
    setError(null);
    getCurrentLocation();
  };

  return {
    location,
    loading,
    error,
    refreshLocation
  };
};
