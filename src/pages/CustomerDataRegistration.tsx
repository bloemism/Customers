import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { supabase } from '../lib/supabase';
import { selectCustomerByAuthUserId } from '../utils/customerRowQuery';
import { User, Mail, MapPin, Calendar, ArrowLeft, Edit3, Check } from 'lucide-react';

const CustomerDataRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    alphabet: '',
    address: '',
    birth_date: ''
  });
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [registeredData, setRegisteredData] = useState<any>(null);
  const { registerCustomerData, customer } = useCustomerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 認証済みユーザーのメールアドレスを取得
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();

    // 登録済みデータがあるかチェック
    if (customer) {
      setRegisteredData(customer);
      setFormData({
        name: customer.name || '',
        alphabet: customer.alphabet || '',
        address: customer.address || '',
        birth_date: customer.birth_date || ''
      });
    } else {
      // customerデータがない場合は直接データベースから取得
      const fetchCustomerData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('顧客データを直接取得中:', user.id);
          const { data: customerData, error } = await selectCustomerByAuthUserId(user.id);
          
          console.log('取得した顧客データ:', customerData, error);
          
          if (customerData) {
            setRegisteredData(customerData);
            setFormData({
              name: customerData.name || '',
              alphabet: customerData.alphabet || '',
              address: customerData.address || '',
              birth_date: customerData.birth_date || ''
            });
          }
        }
      };
      fetchCustomerData();
    }
  }, [customer]);

  // ISO形式の日付を日本語形式に変換する関数
  const convertISODateToJapanese = (isoDate: string): string | null => {
    if (!isoDate) return null;
    
    // 「1972-12-15」形式を「1972年12月15日」形式に変換
    const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      return `${year}年${month}月${day}日`;
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerCustomerData(
        formData.name, 
        formData.alphabet, 
        formData.address, 
        formData.birth_date
      );
      
      if (result.error) {
        setError(result.error);
      } else {
        // 顧客データ登録/更新成功
        setIsEditing(false);
        // データを再取得
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: updatedCustomer } = await selectCustomerByAuthUserId(user.id);
          if (updatedCustomer) {
            setRegisteredData(updatedCustomer);
          }
        }
      }
    } catch (err) {
      setError('登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-indigo-300 relative overflow-hidden">
      {/* アニメーション背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/40 to-rose-400/40 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/40 to-violet-400/40 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-400/35 to-orange-400/35 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-gradient-to-tr from-amber-400/35 to-yellow-400/35 rounded-full animate-pulse delay-700"></div>
      </div>

      {/* ヘッダー */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/customer-menu')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </button>
            <h1 className="text-lg font-semibold text-gray-800">マイプロフィール</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">マイプロフィール</h2>
            {registeredData ? (
              <>
                <p className="text-gray-600">登録済みのプロフィール情報</p>
                <p className="text-gray-500 text-sm">編集ボタンから情報を更新できます</p>
              </>
            ) : (
              <>
                <p className="text-gray-600">アカウント認証が完了しました</p>
                <p className="text-gray-600">顧客情報を入力してください</p>
              </>
            )}
          </div>

          {/* 入力ガイド */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">入力ガイド</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• 各項目の入力例を参考にしてください</li>
                  <li>• アルファベット名は「taro yamada」の形式で入力</li>
                  <li>• 誕生日は「1990年3月3日」の形式で入力</li>
                  <li>• 住所は町名までで大丈夫です</li>
                  <li>• 必須項目（*）は必ず入力してください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 登録済みデータ表示 */}
          {registeredData && !isEditing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-800 flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  登録済み情報
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-800 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-sm">編集</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">お名前</p>
                    <p className="font-medium text-green-800">{registeredData.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">メールアドレス</p>
                    <p className="font-medium text-green-800">{registeredData.email}</p>
                  </div>
                </div>
                
                {registeredData.alphabet && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">アルファベット名</p>
                      <p className="font-medium text-green-800">{registeredData.alphabet}</p>
                    </div>
                  </div>
                )}
                
                {registeredData.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">住所</p>
                      <p className="font-medium text-green-800">{registeredData.address}</p>
                    </div>
                  </div>
                )}
                
                {registeredData.birth_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">誕生日</p>
                      <p className="font-medium text-green-800">
                        {convertISODateToJapanese(registeredData.birth_date) || registeredData.birth_date}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <span className="text-green-600 text-sm">📊</span>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">ポイント</p>
                    <p className="font-medium text-green-800">{registeredData.points || 0} pt</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <span className="text-green-600 text-sm">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">レベル</p>
                    <p className="font-medium text-green-800">{registeredData.level || 'BASIC'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 登録済み情報の簡易表示 */}
          {registeredData && !isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">📋 登録済み情報</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• お名前: {registeredData.name}</p>
                <p>• メール: {registeredData.email}</p>
                {registeredData.alphabet && <p>• アルファベット名: {registeredData.alphabet}</p>}
                {registeredData.address && <p>• 住所: {registeredData.address}</p>}
                {registeredData.birth_date && <p>• 誕生日: {convertISODateToJapanese(registeredData.birth_date) || registeredData.birth_date}</p>}
                <p>• ポイント: {registeredData.points || 0} pt</p>
                <p>• レベル: {registeredData.level || 'BASIC'}</p>
              </div>
            </div>
          )}

          {/* 入力フォーム */}
          {(!registeredData || isEditing) && (
            <>
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* メールアドレス（読み取り専用） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2 text-indigo-600" />
                メールアドレス
              </label>
              <input
                type="email"
                value={registeredData?.email || userEmail}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                placeholder="認証済みメールアドレス"
              />
              <p className="text-xs text-gray-500 mt-1">※ 認証時に使用したメールアドレス</p>
            </div>

            {/* お名前 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2 text-indigo-600" />
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={registeredData?.name || "山田太郎"}
                maxLength={30}
              />
              <div className="mt-2 text-xs text-gray-500">
                <p className="mb-1">📝 入力例：</p>
                <div className="bg-gray-50 rounded p-2 space-y-1">
                  <p>• 山田太郎</p>
                  <p>• 佐藤花子</p>
                  <p>• 田中一郎</p>
                </div>
                <p className="mt-2 text-gray-400">※ 姓名を続けて入力してください</p>
              </div>
            </div>

            {/* アルファベット名 */}
            <div>
              <label htmlFor="alphabet" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2 text-indigo-600" />
                アルファベット名
              </label>
              <input
                type="text"
                id="alphabet"
                name="alphabet"
                value={formData.alphabet}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={registeredData?.alphabet || "taro yamada"}
                maxLength={50}
              />
              <div className="mt-2 text-xs text-gray-500">
                <p className="mb-1">📝 入力例：</p>
                <div className="bg-gray-50 rounded p-2 space-y-1">
                  <p>• taro yamada</p>
                  <p>• hanako sato</p>
                  <p>• ichiro tanaka</p>
                </div>
                <p className="mt-2 text-gray-400">※ 姓名を小文字で入力してください</p>
              </div>
            </div>

            {/* 住所 */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-2 text-indigo-600" />
                住所（町名まで）
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={registeredData?.address || "東京都渋谷区恵比寿"}
                maxLength={50}
              />
              <div className="mt-2 text-xs text-gray-500">
                <p className="mb-1">📝 入力例：</p>
                <div className="bg-gray-50 rounded p-2 space-y-1">
                  <p>• 東京都渋谷区恵比寿</p>
                  <p>• 大阪府大阪市北区梅田</p>
                  <p>• 神奈川県横浜市西区みなとみらい</p>
                </div>
                <p className="mt-2 text-gray-400">※ プライバシー保護のため町名まで</p>
              </div>
            </div>

            {/* 誕生日 */}
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2 text-indigo-600" />
                誕生日
              </label>
              <input
                type="text"
                id="birth_date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={registeredData?.birth_date ? convertISODateToJapanese(registeredData.birth_date) || registeredData.birth_date : "1990年3月3日"}
                maxLength={20}
              />
              <div className="mt-2 text-xs text-gray-500">
                <p className="mb-1">📝 入力例：</p>
                <div className="bg-gray-50 rounded p-2 space-y-1">
                  <p>• 1990年3月3日</p>
                  <p>• 1985年12月25日</p>
                  <p>• 2000年1月1日</p>
                </div>
                <p className="mt-2 text-gray-400">※ 年は西暦で入力してください</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  キャンセル
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className={`${isEditing ? 'flex-1' : 'w-full'} bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
              >
                {loading ? '保存中...' : (isEditing ? '更新' : 'プロフィールを登録')}
              </button>
            </div>
          </form>
          </>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/customer-menu')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              メニュー画面に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDataRegistration;
