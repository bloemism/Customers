import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Gift,
  ShoppingBag,
  TrendingUp,
  Clock,
  MapPin,
  Edit,
  Plus,
  Filter,
  Download,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { EditCustomerModal } from '../components/EditCustomerModal';
import QRCodeScanner from '../components/QRCodeScanner';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  gender: string | null;
  total_points: number;
  total_purchase_amount: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
  purchases_last_2_months: number;
  avg_purchase_last_month: number | null;
  points_used_last_month: number | null;
  points_earned_last_month: number | null;
}

interface PurchaseItem {
  id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  purchase_date: string;
}

interface PurchaseHistory {
  id: string;
  purchase_date: string;
  total_amount: number;
  tax_amount: number;
  points_earned: number;
  points_used: number;
  payment_method: string;
  items: PurchaseItem[];
}

export const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'phone'>('email');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showQRScanner, setShowQRScanner] = useState(false);

  // QRコード読み取り処理
  const handleQRScan = async (qrData: string) => {
    try {
      setLoading(true);
      
      // QRデータを解析
      let customerData;
      try {
        customerData = JSON.parse(qrData);
      } catch {
        // プレーンテキストの場合
        const lines = qrData.split('\n');
        customerData = {
          id: lines[0] || '',
          name: lines[1] || '',
          email: lines[2] || '',
          phone: lines[3] || '',
          address: lines[4] || '',
          total_points: parseInt(lines[5]) || 0
        };
      }

      // 既存顧客との重複チェック
      const existingCustomer = customers.find(c => 
        c.email === customerData.email || c.phone === customerData.phone
      );

      if (existingCustomer) {
        setMessage('この顧客は既に登録されています。');
        setMessageType('error');
        return;
      }

      // 新規顧客として登録
      const { error } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          total_points: customerData.total_points || 0,
          first_purchase_date: new Date().toISOString(),
          last_purchase_date: new Date().toISOString()
        });

      if (error) throw error;

      setMessage('QRコードから顧客データを登録しました。');
      setMessageType('success');
      
      // 顧客一覧を再読み込み
      searchCustomers();
      
    } catch (error) {
      console.error('QRデータ登録エラー:', error);
      setMessage('顧客データの登録に失敗しました。');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // 顧客検索
  const searchCustomers = async () => {
    if (!searchQuery.trim()) {
      // 検索クエリが空の場合は全顧客を取得
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('customer_statistics')
          .select('*')
          .order('last_purchase_date', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        setCustomers(data || []);
      } catch (error) {
        console.error('顧客取得エラー:', error);
        setMessage('顧客データの取得中にエラーが発生しました。');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    setLoading(true);
    try {
      let query = supabase
        .from('customer_statistics')
        .select('*');
      
      if (searchType === 'email') {
        query = query.ilike('email', `%${searchQuery}%`);
      } else {
        query = query.ilike('phone', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setCustomers(data || []);
      
      if (data && data.length === 0) {
        setMessage('該当する顧客が見つかりませんでした。');
        setMessageType('error');
      }
    } catch (error) {
      console.error('顧客検索エラー:', error);
      setMessage('顧客検索中にエラーが発生しました。');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // 顧客詳細情報取得
  const getCustomerDetails = async (customerId: string) => {
    setLoading(true);
    try {
      // 購入履歴と品目詳細を取得
      const { data: historyData, error: historyError } = await supabase
        .from('purchase_history')
        .select(`
          *,
          purchase_items (*)
        `)
        .eq('customer_id', customerId)
        .order('purchase_date', { ascending: false })
        .limit(20);

      if (historyError) throw historyError;

      setPurchaseHistory(historyData || []);
    } catch (error) {
      console.error('顧客詳細取得エラー:', error);
      setMessage('顧客詳細の取得中にエラーが発生しました。');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // 顧客選択
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    getCustomerDetails(customer.id);
  };

  // 新規顧客追加
  const handleAddCustomer = () => {
    setShowAddCustomer(true);
  };

  // 顧客編集
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowEditCustomer(true);
  };

  // 顧客追加後の処理
  const handleCustomerAdded = () => {
    setMessage('顧客が正常に追加されました');
    setMessageType('success');
    // 検索結果を更新
    if (searchQuery.trim()) {
      searchCustomers();
    }
  };

  // 顧客更新後の処理
  const handleCustomerUpdated = () => {
    setMessage('顧客情報が正常に更新されました');
    setMessageType('success');
    // 選択中の顧客情報を更新
    if (selectedCustomer && editingCustomer) {
      setSelectedCustomer({ ...selectedCustomer, ...editingCustomer });
    }
    // 検索結果を更新
    if (searchQuery.trim()) {
      searchCustomers();
    }
  };

  // ページ読み込み時に全顧客を取得
  useEffect(() => {
    searchCustomers();
  }, []);

  // メッセージをクリア
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // データエクスポート
  const exportCustomerData = () => {
    if (!selectedCustomer) return;
    
    const data = {
      customer: selectedCustomer,
      purchaseHistory: purchaseHistory
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_${selectedCustomer.name}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/menu')}
                className="p-2 text-white hover:text-purple-100 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">顧客管理</h1>
                <p className="text-sm text-purple-100 hidden sm:block">お客様データ・ポイント・販売履歴</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => setShowQRScanner(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 transition-colors duration-200"
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR読み取り
              </button>
              <button
                onClick={handleAddCustomer}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                新規顧客
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4`}>
          <div className={`rounded-md p-4 ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {messageType === 'success' ? (
                  <div className="h-5 w-5 text-green-400">✓</div>
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${
                  messageType === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索セクション */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-purple-500" />
            顧客検索
          </h2>
          
          <div className="space-y-4">
            {/* 検索タイプ選択 */}
            <div className="flex gap-2">
              <button
                onClick={() => setSearchType('email')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  searchType === 'email'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Mail className="h-4 w-4 mr-2 inline" />
                メール検索
              </button>
              <button
                onClick={() => setSearchType('phone')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  searchType === 'phone'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Phone className="h-4 w-4 mr-2 inline" />
                電話検索
              </button>
            </div>

            {/* 検索入力とボタン */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {searchType === 'email' ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Phone className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchType === 'email' ? 'メールアドレスで検索' : '電話番号で検索'}
                    className="focus:ring-purple-500 focus:border-purple-500 block w-full rounded-md pl-10 pr-3 py-2 border-gray-300 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={searchCustomers}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  検索
                </button>
                
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchCustomers();
                  }}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  全件表示
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 顧客リスト */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">顧客一覧</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {customers.length}件の顧客が見つかりました
                </p>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                      selectedCustomer?.id === customer.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{customer.name}</h4>
                        <p className="text-sm text-gray-500">
                          {customer.email || customer.phone}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-400">
                          <span className="flex items-center">
                            <Gift className="h-3 w-3 mr-1" />
                            {customer.total_points}pt
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ¥{customer.total_purchase_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustomer(customer);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {customers.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>顧客が見つかりません</p>
                    <p className="text-sm">検索条件を変更してお試しください</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 顧客詳細 */}
          <div className="lg:col-span-2">
            {selectedCustomer ? (
              <div className="space-y-6">
                {/* 顧客基本情報 */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">顧客詳細</h3>
                    <button
                      onClick={exportCustomerData}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      エクスポート
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">基本情報</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">名前:</dt>
                          <dd className="text-gray-900">{selectedCustomer.name}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">メール:</dt>
                          <dd className="text-gray-900">{selectedCustomer.email || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">電話番号:</dt>
                          <dd className="text-gray-900">{selectedCustomer.phone || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">住所:</dt>
                          <dd className="text-gray-900">{selectedCustomer.address || '-'}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">統計情報</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">総ポイント:</dt>
                          <dd className="text-gray-900 font-medium">{selectedCustomer.total_points}pt</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">総購入額:</dt>
                          <dd className="text-gray-900 font-medium">¥{selectedCustomer.total_purchase_amount.toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">初回購入:</dt>
                          <dd className="text-gray-900">
                            {selectedCustomer.first_purchase_date ? 
                              new Date(selectedCustomer.first_purchase_date).toLocaleDateString('ja-JP') : '-'
                            }
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">最終購入:</dt>
                          <dd className="text-gray-900">
                            {selectedCustomer.last_purchase_date ? 
                              new Date(selectedCustomer.last_purchase_date).toLocaleDateString('ja-JP') : '-'
                            }
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* 月間統計 */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">月間統計</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <ShoppingBag className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                          <p className="text-sm text-blue-600">2ヶ月間の購入回数</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {selectedCustomer.purchases_last_2_months || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                          <p className="text-sm text-green-600">1ヶ月平均購入額</p>
                          <p className="text-2xl font-bold text-green-900">
                            ¥{Math.round(selectedCustomer.avg_purchase_last_month || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Gift className="h-8 w-8 text-purple-500 mr-3" />
                        <div>
                          <p className="text-sm text-purple-600">1ヶ月蓄積ポイント</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {selectedCustomer.points_earned_last_month || 0}pt
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-orange-500 mr-3" />
                        <div>
                          <p className="text-sm text-orange-600">1ヶ月使用ポイント</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {selectedCustomer.points_used_last_month || 0}pt
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 購入履歴 */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">購入履歴</h3>
                  
                  {purchaseHistory.length > 0 ? (
                    <div className="space-y-4">
                      {purchaseHistory.map((purchase) => (
                        <div key={purchase.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(purchase.purchase_date).toLocaleDateString('ja-JP')}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(purchase.purchase_date).toLocaleTimeString('ja-JP')}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ¥{purchase.total_amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">{purchase.payment_method}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">税額:</span>
                              <span className="ml-2 font-medium">¥{purchase.tax_amount.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">獲得ポイント:</span>
                              <span className="ml-2 font-medium text-green-600">+{purchase.points_earned}pt</span>
                            </div>
                            <div>
                              <span className="text-gray-500">使用ポイント:</span>
                              <span className="ml-2 font-medium text-orange-600">-{purchase.points_used}pt</span>
                            </div>
                          </div>
                          
                          {purchase.items && purchase.items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">購入品目:</h5>
                              <div className="space-y-1">
                                {purchase.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {item.item_name} × {item.quantity}
                                    </span>
                                    <span className="text-gray-900">¥{item.total_price.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>購入履歴がありません</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">顧客を選択してください</h3>
                <p className="text-gray-500">左側の顧客リストから顧客を選択すると、詳細情報が表示されます。</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* モーダル */}
      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCustomerAdded={handleCustomerAdded}
      />
      
      <EditCustomerModal
        isOpen={showEditCustomer}
        onClose={() => {
          setShowEditCustomer(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />

      {/* QRコードスキャナー */}
      <QRCodeScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};



