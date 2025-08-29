import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface MapContextType {
  selectedLocation: { lat: number; lng: number } | null;
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const value: MapContextType = {
    selectedLocation,
    setSelectedLocation
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};
