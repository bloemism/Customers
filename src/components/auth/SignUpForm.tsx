import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  MapPin, 
  Phone, 
  Globe,
  Upload,
  ArrowLeft
} from 'lucide-react';

interface StoreData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  businessHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  specialties: string[];
  imageUrl: string;
}

export const SignUpForm: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });
  
  const [storeData, setStoreData] = useState<StoreData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    latitude: 0,
    longitude: 0,
    businessHours: {
      monday: '09:00-18:00',
      tuesday: '09:00-18:00',
      wednesday: '09:00-18:00',
      thursday: '09:00-18:00',
      friday: '09:00-18:00',
      saturday: '09:00-17:00',
      sunday: '10:00-16:00'
    },
    specialties: [],
    imageUrl: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const specialties = [
    '花束', 'アレンジメント', '観葉植物', 'ギフト', 'ウェディング', 
    'イベント装飾', '和風アレンジ', '季節の花', 'プレゼント', 'オフィス装飾'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStoreDataChange = (field: string, value: any) => {
    setStoreData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setStoreData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp(formData.email, formData.password, {
        ...storeData,
        userType: 'store_owner',
        createdAt: new Date().toISOString()
      });
      
      if (result.error) {
        setError('アカウント登録に失敗しました。');
      } else {
        // 登録成功時はメニュー画面に遷移
        navigate('/menu');
      }
    } catch (error) {
      setError('アカウント登録中にエラーが発生しました。');
    }
    
    setIsLoading(false);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <button 
            onClick={() => navigate('/login')}
            className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <Store className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">店舗アカウント登録</h2>
          <p className="mt-2 text-sm text-gray-600">
            花屋の店舗情報を登録して、全国フローリストマップに掲載しましょう
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* ステップ1: 基本情報 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店舗名 *
                </label>
                <input
                  type="text"
                  value={storeData.name}
                  onChange={(e) => handleStoreDataChange('name', e.target.value)}
                  className="input-field"
                  placeholder="花の森 渋谷店"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店舗説明
                </label>
                <textarea
                  value={storeData.description}
                  onChange={(e) => handleStoreDataChange('description', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="店舗の特徴やサービスについて説明してください"
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
                    onChange={(e) => handleStoreDataChange('address', e.target.value)}
                    className="input-field pl-10"
                    placeholder="東京都渋谷区渋谷1-1-1"
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
                      onChange={(e) => handleStoreDataChange('phone', e.target.value)}
                      className="input-field pl-10"
                      placeholder="03-1234-5678"
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
                      onChange={(e) => handleStoreDataChange('email', e.target.value)}
                      className="input-field pl-10"
                      placeholder="info@example.com"
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
                    onChange={(e) => handleStoreDataChange('website', e.target.value)}
                    className="input-field pl-10"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ステップ2: 専門分野 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">専門分野</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  取り扱い商品・サービス（複数選択可）
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specialties.map((specialty) => (
                    <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storeData.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店舗画像
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    店舗の外観や商品の写真をアップロードしてください
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 hidden"
                    onChange={(e) => {
                      // 画像アップロード処理（実装予定）
                      console.log('Image upload:', e.target.files?.[0]);
                    }}
                  />
                  <button
                    type="button"
                    className="mt-2 btn-secondary"
                    onClick={() => document.querySelector('input[type="file"]')?.click()}
                  >
                    画像を選択
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ステップ3: アカウント情報 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">アカウント情報</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス（ログイン用） *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input-field pl-10"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={formData.showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="パスワードを入力"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange('showPassword', !formData.showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {formData.showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード確認 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={formData.showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="パスワードを再入力"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange('showConfirmPassword', !formData.showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {formData.showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary"
              >
                前へ
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary ml-auto"
              >
                次へ
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary ml-auto flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : null}
                <span>アカウント登録</span>
              </button>
            )}
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-green-600 hover:text-green-500 font-medium"
            >
              ログイン
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
