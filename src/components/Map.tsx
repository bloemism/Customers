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

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: 'weekly'
      });

      try {
        const google = await loader.load();
        
        if (!mapRef.current) return;

        const defaultCenter = userLocation 
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : { lat: 35.6762, lng: 139.6503 }; // 東京

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 13
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [userLocation]);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
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
