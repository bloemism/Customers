import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MapPin, 
  Search, 
  Filter,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Star,
  Navigation
} from 'lucide-react';

interface Florist {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website: string;
  rating: number;
  specialties: string[];
  isOpen: boolean;
  distance?: number;
}

export const FloristMap: React.FC = () => {
  const { user } = useAuth();
  const [florists, setFlorists] = useState<Florist[]>([
    {
      id: '1',
      name: '花の森 渋谷店',
      address: '東京都渋谷区渋谷1-1-1',
      latitude: 35.658034,
      longitude: 139.701636,
      phone: '03-1234-5678',
      email: 'info@hananomori-shibuya.com',
      website: 'https://hananomori-shibuya.com',
      rating: 4.5,
      specialties: ['花束', 'アレンジメント', 'ウェディング'],
      isOpen: true
    },
    {
      id: '2',
      name: 'フラワーガーデン 新宿店',
      address: '東京都新宿区新宿2-2-2',
      latitude: 35.690921,
      longitude: 139.700258,
      phone: '03-2345-6789',
      email: 'info@flowergarden-shinjuku.com',
      website: 'https://flowergarden-shinjuku.com',
      rating: 4.2,
      specialties: ['観葉植物', 'ギフト', 'イベント装飾'],
      isOpen: true
    },
    {
      id: '3',
      name: '桜花店 原宿店',
      address: '東京都渋谷区神宮前3-3-3',
      latitude: 35.670168,
      longitude: 139.701636,
      phone: '03-3456-7890',
      email: 'info@sakura-harajuku.com',
      website: 'https://sakura-harajuku.com',
      rating: 4.8,
      specialties: ['和風アレンジ', '季節の花', 'プレゼント'],
      isOpen: false
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedFlorist, setSelectedFlorist] = useState<Florist | null>(null);

  const specialties = ['all', '花束', 'アレンジメント', '観葉植物', 'ギフト', 'ウェディング', 'イベント装飾', '和風アレンジ', '季節の花', 'プレゼント'];

  // 現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('位置情報の取得に失敗しました:', error);
        }
      );
    }
  }, []);

  // 距離を計算
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 距離を追加
  const floristsWithDistance = florists.map(florist => {
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        florist.latitude, florist.longitude
      );
      return { ...florist, distance };
    }
    return florist;
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const filteredFlorists = floristsWithDistance.filter(florist => {
    const matchesSearch = florist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         florist.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || 
                           florist.specialties.includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <MapPin className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">全国フローリストマップ</h1>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索・フィルター */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="店舗名・住所で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty === 'all' ? '全ジャンル' : specialty}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-right">
              <span className="text-sm text-gray-600">
                店舗数: {filteredFlorists.length}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 地図エリア */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                地図
              </h2>
              
              <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">地図機能は開発中です</p>
                  <p className="text-sm text-gray-500">Google Maps APIの実装予定</p>
                </div>
              </div>
            </div>
          </div>

          {/* 店舗リスト */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                店舗一覧
              </h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredFlorists.map((florist) => (
                  <div
                    key={florist.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedFlorist?.id === florist.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => setSelectedFlorist(florist)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{florist.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        florist.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {florist.isOpen ? '営業中' : '閉店'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{florist.address}</p>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(florist.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">{florist.rating}</span>
                    </div>
                    
                    {florist.distance && (
                      <p className="text-sm text-gray-500 mb-2">
                        距離: {florist.distance.toFixed(1)}km
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {florist.specialties.slice(0, 3).map(specialty => (
                        <span key={specialty} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 選択された店舗の詳細 */}
        {selectedFlorist && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedFlorist.name}</h2>
                <p className="text-gray-600 mt-1">{selectedFlorist.address}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(selectedFlorist.rating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">{selectedFlorist.rating}</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">連絡先</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{selectedFlorist.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{selectedFlorist.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a href={selectedFlorist.website} className="text-green-600 hover:underline">
                      {selectedFlorist.website}
                    </a>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">専門分野</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFlorist.specialties.map(specialty => (
                    <span key={specialty} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-4">
              <button className="btn-primary flex items-center space-x-2">
                <Navigation className="h-4 w-4" />
                <span>ルート案内</span>
              </button>
              <button className="btn-secondary flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>電話をかける</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
