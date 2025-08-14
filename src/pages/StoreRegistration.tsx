import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Clock,
  Flower,
  Star,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  ShoppingCart,
  Car
} from 'lucide-react';
import { StoreService, Store, StoreDetails } from '../services/storeService';

interface StoreFormData {
  store_name: string;
  address: string;
  phone: string;
  email: string;
  website_url: string;
  instagram_url: string;
  commerce_url: string;
  business_hours: string;
  holiday_info: string;
  parking_available: boolean;
  parking_info: string;
  description: string;
}

interface BusinessHoursData {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  special_hours: string;
}

interface ServiceData {
  service_name: string;
  service_category: string;
  description: string;
  is_available: boolean;
}

interface PhotoData {
  photo_url: string;
  photo_title: string;
  photo_description: string;
  display_order: number;
  is_main_photo: boolean;
}

interface FlowerData {
  flower_name: string;
  flower_image_url: string;
  price: number;
  price_type: string;
  description: string;
  is_available: boolean;
  display_order: number;
}

interface PostData {
  post_type: string;
  title: string;
  content: string;
  is_active: boolean;
  expires_at: string;
}

export const StoreRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingStore, setExistingStore] = useState<Store | null>(null);

  // フォームデータ
  const [formData, setFormData] = useState<StoreFormData>({
    store_name: '',
    address: '',
    phone: '',
    email: '',
    website_url: '',
    instagram_url: '',
    commerce_url: '',
    business_hours: '',
    holiday_info: '',
    parking_available: false,
    parking_info: '',
    description: ''
  });

  const [businessHours, setBusinessHours] = useState<BusinessHoursData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [flowers, setFlowers] = useState<FlowerData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);

  useEffect(() => {
    loadExistingStore();
  }, []);

  const loadExistingStore = async () => {
    try {
      setLoading(true);
      const store = await StoreService.getUserStore();
      if (store) {
        setExistingStore(store);
        setFormData({
          store_name: store.store_name,
          address: store.address,
          phone: store.phone || '',
          email: store.email || '',
          website_url: store.website_url || '',
          instagram_url: store.instagram_url || '',
          commerce_url: store.commerce_url || '',
          business_hours: store.business_hours || '',
          holiday_info: store.holiday_info || '',
          parking_available: store.parking_available,
          parking_info: store.parking_info || '',
          description: store.description || ''
        });
      }
    } catch (err) {
      console.error('店舗情報取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StoreFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    if (!formData.store_name.trim()) {
      setError('店舗名を入力してください');
      return false;
    }
    if (!formData.address.trim()) {
      setError('住所を入力してください');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (existingStore) {
        // 既存店舗の更新
        await StoreService.updateStore(existingStore.id, formData);
        setSuccess('店舗情報を更新しました');
      } else {
        // 新規店舗の作成
        const coordinates = await StoreService.getCoordinatesFromAddress(formData.address);
        const newStore = await StoreService.createStore({
          ...formData,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude
        });
        setExistingStore(newStore);
        setSuccess('店舗を登録しました');
      }
    } catch (err: any) {
      setError(err.message || '保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const addBusinessHours = () => {
    setBusinessHours(prev => [...prev, {
      day_of_week: 0,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: false,
      special_hours: ''
    }]);
  };

  const updateBusinessHours = (index: number, field: keyof BusinessHoursData, value: any) => {
    setBusinessHours(prev => prev.map((hours, i) => 
      i === index ? { ...hours, [field]: value } : hours
    ));
  };

  const removeBusinessHours = (index: number) => {
    setBusinessHours(prev => prev.filter((_, i) => i !== index));
  };

  const addService = () => {
    setServices(prev => [...prev, {
      service_name: '',
      service_category: '',
      description: '',
      is_available: true
    }]);
  };

  const updateService = (index: number, field: keyof ServiceData, value: any) => {
    setServices(prev => prev.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    ));
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const addPhoto = () => {
    setPhotos(prev => [...prev, {
      photo_url: '',
      photo_title: '',
      photo_description: '',
      display_order: prev.length,
      is_main_photo: prev.length === 0
    }]);
  };

  const updatePhoto = (index: number, field: keyof PhotoData, value: any) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, [field]: value } : photo
    ));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const addFlower = () => {
    setFlowers(prev => [...prev, {
      flower_name: '',
      flower_image_url: '',
      price: 0,
      price_type: '本',
      description: '',
      is_available: true,
      display_order: prev.length
    }]);
  };

  const updateFlower = (index: number, field: keyof FlowerData, value: any) => {
    setFlowers(prev => prev.map((flower, i) => 
      i === index ? { ...flower, [field]: value } : flower
    ));
  };

  const removeFlower = (index: number) => {
    setFlowers(prev => prev.filter((_, i) => i !== index));
  };

  const addPost = () => {
    setPosts(prev => [...prev, {
      post_type: 'announcement',
      title: '',
      content: '',
      is_active: true,
      expires_at: ''
    }]);
  };

  const updatePost = (index: number, field: keyof PostData, value: any) => {
    setPosts(prev => prev.map((post, i) => 
      i === index ? { ...post, [field]: value } : post
    ));
  };

  const removePost = (index: number) => {
    setPosts(prev => prev.filter((_, i) => i !== index));
  };

  const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const serviceCategories = StoreService.getServiceCategories();
  const postTypes = StoreService.getPostTypes();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">店舗情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/menu')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {existingStore ? '店舗情報編集' : '店舗登録'}
                </h1>
                <p className="text-sm text-gray-600">
                  {existingStore ? '店舗情報を更新できます' : '新しい店舗を登録できます'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>

      {/* ステップナビゲーション */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex space-x-8">
            {[
              { step: 1, title: '基本情報', icon: MapPin },
              { step: 2, title: '営業時間', icon: Clock },
              { step: 3, title: 'サービス', icon: Flower },
              { step: 4, title: '写真', icon: Upload },
              { step: 5, title: 'オススメの花', icon: Star },
              { step: 6, title: '掲示板', icon: MessageSquare }
            ].map(({ step, title, icon: Icon }) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentStep === step
                    ? 'bg-pink-100 text-pink-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* ステップ1: 基本情報 */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => handleInputChange('store_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="花のアトリエ サクラ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="03-1234-5678"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="東京都渋谷区1-1-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  営業時間
                </label>
                <input
                  type="text"
                  value={formData.business_hours}
                  onChange={(e) => handleInputChange('business_hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="9:00-18:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  定休日
                </label>
                <input
                  type="text"
                  value={formData.holiday_info}
                  onChange={(e) => handleInputChange('holiday_info', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="月曜日"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  駐車場
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.parking_available}
                      onChange={(e) => handleInputChange('parking_available', e.target.checked)}
                      className="mr-2"
                    />
                    駐車場あり
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  駐車場詳細
                </label>
                <input
                  type="text"
                  value={formData.parking_info}
                  onChange={(e) => handleInputChange('parking_info', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="店舗前に2台分駐車場あり"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HPのURL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  InstagramのURL
                </label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  オンラインショップのURL
                </label>
                <input
                  type="url"
                  value={formData.commerce_url}
                  onChange={(e) => handleInputChange('commerce_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="https://shop.example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="店舗の特徴や得意分野を記載してください"
                />
              </div>
            </div>
          </div>
        )}

        {/* ステップ2: 営業時間 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">営業時間設定</h2>
              <button
                onClick={addBusinessHours}
                className="flex items-center px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                追加
              </button>
            </div>

            <div className="space-y-4">
              {businessHours.map((hours, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <select
                    value={hours.day_of_week}
                    onChange={(e) => updateBusinessHours(index, 'day_of_week', parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    {dayNames.map((day, dayIndex) => (
                      <option key={dayIndex} value={dayIndex}>{day}</option>
                    ))}
                  </select>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hours.is_closed}
                      onChange={(e) => updateBusinessHours(index, 'is_closed', e.target.checked)}
                      className="mr-2"
                    />
                    定休日
                  </label>

                  {!hours.is_closed && (
                    <>
                      <input
                        type="time"
                        value={hours.open_time}
                        onChange={(e) => updateBusinessHours(index, 'open_time', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <span>〜</span>
                      <input
                        type="time"
                        value={hours.close_time}
                        onChange={(e) => updateBusinessHours(index, 'close_time', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </>
                  )}

                  <input
                    type="text"
                    value={hours.special_hours}
                    onChange={(e) => updateBusinessHours(index, 'special_hours', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="特別営業時間（例: 祝日は休み）"
                  />

                  <button
                    onClick={() => removeBusinessHours(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {businessHours.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  営業時間が設定されていません
                </div>
              )}
            </div>
          </div>
        )}

        {/* ステップ3: サービス */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">取り扱いサービス</h2>
              <button
                onClick={addService}
                className="flex items-center px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                追加
              </button>
            </div>

            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    value={service.service_name}
                    onChange={(e) => updateService(index, 'service_name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="サービス名"
                  />

                  <select
                    value={service.service_category}
                    onChange={(e) => updateService(index, 'service_category', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">カテゴリを選択</option>
                    {serviceCategories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={service.is_available}
                      onChange={(e) => updateService(index, 'is_available', e.target.checked)}
                      className="mr-2"
                    />
                    提供中
                  </label>

                  <button
                    onClick={() => removeService(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {services.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  サービスが設定されていません
                </div>
              )}
            </div>
          </div>
        )}

        {/* ステップ4: 写真 */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">店舗写真</h2>
              <button
                onClick={addPhoto}
                className="flex items-center px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                追加
              </button>
            </div>

            <div className="space-y-4">
              {photos.map((photo, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        写真URL
                      </label>
                      <input
                        type="url"
                        value={photo.photo_url}
                        onChange={(e) => updatePhoto(index, 'photo_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        タイトル
                      </label>
                      <input
                        type="text"
                        value={photo.photo_title}
                        onChange={(e) => updatePhoto(index, 'photo_title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="店舗外観"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        説明
                      </label>
                      <input
                        type="text"
                        value={photo.photo_description}
                        onChange={(e) => updatePhoto(index, 'photo_description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="写真の説明"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={photo.is_main_photo}
                          onChange={(e) => updatePhoto(index, 'is_main_photo', e.target.checked)}
                          className="mr-2"
                        />
                        メイン写真
                      </label>

                      <button
                        onClick={() => removePhoto(index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {photos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  写真が設定されていません
                </div>
              )}
            </div>
          </div>
        )}

        {/* ステップ5: オススメの花 */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">今週のおすすめ</h2>
              <button
                onClick={addFlower}
                className="flex items-center px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                追加
              </button>
            </div>

            <div className="space-y-4">
              {flowers.map((flower, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        花の名前
                      </label>
                      <input
                        type="text"
                        value={flower.flower_name}
                        onChange={(e) => updateFlower(index, 'flower_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="ピンクのバラ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        価格
                      </label>
                      <input
                        type="number"
                        value={flower.price}
                        onChange={(e) => updateFlower(index, 'price', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        価格単位
                      </label>
                      <select
                        value={flower.price_type}
                        onChange={(e) => updateFlower(index, 'price_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="本">本</option>
                        <option value="束">束</option>
                        <option value="アレンジメント">アレンジメント</option>
                        <option value="鉢">鉢</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        写真URL
                      </label>
                      <input
                        type="url"
                        value={flower.flower_image_url}
                        onChange={(e) => updateFlower(index, 'flower_image_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="https://example.com/flower.jpg"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        説明
                      </label>
                      <input
                        type="text"
                        value={flower.description}
                        onChange={(e) => updateFlower(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="花の説明"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={flower.is_available}
                          onChange={(e) => updateFlower(index, 'is_available', e.target.checked)}
                          className="mr-2"
                        />
                        在庫あり
                      </label>

                      <button
                        onClick={() => removeFlower(index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {flowers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  おすすめの花が設定されていません
                </div>
              )}
            </div>
          </div>
        )}

        {/* ステップ6: 掲示板 */}
        {currentStep === 6 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">掲示板</h2>
              <button
                onClick={addPost}
                className="flex items-center px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                追加
              </button>
            </div>

            <div className="space-y-4">
              {posts.map((post, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        投稿タイプ
                      </label>
                      <select
                        value={post.post_type}
                        onChange={(e) => updatePost(index, 'post_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        {postTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        タイトル
                      </label>
                      <input
                        type="text"
                        value={post.title}
                        onChange={(e) => updatePost(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="投稿タイトル"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        内容
                      </label>
                      <textarea
                        value={post.content}
                        onChange={(e) => updatePost(index, 'content', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="投稿内容"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        掲載期限
                      </label>
                      <input
                        type="datetime-local"
                        value={post.expires_at}
                        onChange={(e) => updatePost(index, 'expires_at', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={post.is_active}
                          onChange={(e) => updatePost(index, 'is_active', e.target.checked)}
                          className="mr-2"
                        />
                        公開中
                      </label>

                      <button
                        onClick={() => removePost(index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {posts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  掲示板投稿が設定されていません
                </div>
              )}
            </div>
          </div>
        )}

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            前へ
          </button>

          <button
            onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
            disabled={currentStep === 6}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
};
