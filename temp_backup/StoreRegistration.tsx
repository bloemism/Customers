import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Clock,
  Camera,
  Save,
  ArrowLeft,
  Edit,
  Upload,
  Trash2
} from 'lucide-react';

interface StoreData {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  businessHours: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  specialties: string[];
  images: string[];
  isActive: boolean;
}

export const StoreRegistration: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [storeData, setStoreData] = useState<StoreData>({
    id: '1',
    name: '花の森 渋谷店',
    description: '美しい花と緑で心を癒す花屋です。バラ、チューリップ、観葉植物など、様々な花を取り揃えています。',
    address: '東京都渋谷区渋谷1-1-1',
    phone: '03-1234-5678',
    email: 'info@hananomori-shibuya.com',
    website: 'https://hananomori-shibuya.com',
    latitude: 35.658034,
    longitude: 139.701636,
    businessHours: {
      monday: { open: '09:00', close: '18:00', isClosed: false },
      tuesday: { open: '09:00', close: '18:00', isClosed: false },
      wednesday: { open: '09:00', close: '18:00', isClosed: false },
      thursday: { open: '09:00', close: '18:00', isClosed: false },
      friday: { open: '09:00', close: '18:00', isClosed: false },
      saturday: { open: '09:00', close: '17:00', isClosed: false },
      sunday: { open: '10:00', close: '16:00', isClosed: false }
    },
    specialties: ['花束', 'アレンジメント', '観葉植物', 'ギフト'],
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    isActive: true
  });

  const specialties = [
    '花束', 'アレンジメント', '観葉植物', 'ギフト', 'ウェディング', 
    'イベント装飾', '和風アレンジ', '季節の花', 'プレゼント', 'オフィス装飾'
  ];

  const days = [
    { key: 'monday', label: '月曜日' },
    { key: 'tuesday', label: '火曜日' },
    { key: 'wednesday', label: '水曜日' },
    { key: 'thursday', label: '木曜日' },
    { key: 'friday', label: '金曜日' },
    { key: 'saturday', label: '土曜日' },
    { key: 'sunday', label: '日曜日' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setStoreData(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setStoreData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day as keyof typeof prev.businessHours],
          [field]: value
        }
      }
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setStoreData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSave = () => {
    // 保存処理（実装予定）
    alert('店舗情報が保存されました');
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // 画像アップロード処理（実装予定）
      console.log('Image upload:', files);
    }
  };

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
              <Store className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">店舗データ管理</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>保存</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>編集</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* メイン情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    店舗名 *
                  </label>
                  <input
                    type="text"
                    value={storeData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    店舗説明
                  </label>
                  <textarea
                    value={storeData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!isEditing}
                    className="input-field"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    住所 *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={storeData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話番号 *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="tel"
                        value={storeData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="email"
                        value={storeData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ウェブサイト
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="url"
                      value={storeData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 営業時間 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                営業時間
              </h2>
              
              <div className="space-y-3">
                {days.map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium text-gray-700">
                      {label}
                    </div>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!storeData.businessHours[key as keyof typeof storeData.businessHours].isClosed}
                        onChange={(e) => handleBusinessHoursChange(key, 'isClosed', !e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-600">営業</span>
                    </label>
                    
                    {!storeData.businessHours[key as keyof typeof storeData.businessHours].isClosed && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={storeData.businessHours[key as keyof typeof storeData.businessHours].open}
                          onChange={(e) => handleBusinessHoursChange(key, 'open', e.target.value)}
                          disabled={!isEditing}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <span className="text-sm text-gray-500">〜</span>
                        <input
                          type="time"
                          value={storeData.businessHours[key as keyof typeof storeData.businessHours].close}
                          onChange={(e) => handleBusinessHoursChange(key, 'close', e.target.value)}
                          disabled={!isEditing}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 専門分野 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">専門分野</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specialties.map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeData.specialties.includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1 space-y-6">
            {/* 店舗画像 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-green-600" />
                店舗画像
              </h3>
              
              <div className="space-y-4">
                {storeData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400" />
                    </div>
                    {isEditing && (
                      <button className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">画像をアップロード</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="btn-secondary text-sm cursor-pointer"
                    >
                      画像を選択
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* ステータス */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ステータス</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">公開状態</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>公開中: 全国フローリストマップに表示されます</p>
                  <p>非公開: マップから非表示になります</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
