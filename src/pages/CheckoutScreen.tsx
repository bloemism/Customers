import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  QrCode, 
  Download,
  Flower,
  Receipt,
  User,
  Phone,
  Mail,
  Gift,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { paymentNotificationService } from '../services/paymentNotificationService';
import type { TransactionData } from '../services/paymentNotificationService';
import { PointService } from '../services/pointService';
import type { CustomerPoint } from '../services/pointService';

// CustomerPoint型はpointServiceからインポート済み

interface CheckoutItem {
  id: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [shareUrl, setShareUrl] = useState('');
  
  // 顧客情報とポイント関連
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPoints, setCustomerPoints] = useState<CustomerPoint | null>(null);
  const [usePoints, setUsePoints] = useState(0);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // 初期品目データ（サンプル）
  const sampleItems = [
    { id: '1', itemName: 'バラ（赤）', unitPrice: 300, quantity: 5, total: 1500 },
    { id: '2', itemName: 'チューリップ', unitPrice: 200, quantity: 3, total: 600 },
    { id: '3', itemName: 'カーネーション', unitPrice: 250, quantity: 2, total: 500 },
    { id: '4', itemName: 'ガーベラ', unitPrice: 180, quantity: 4, total: 720 },
    { id: '5', itemName: 'ひまわり', unitPrice: 400, quantity: 1, total: 400 },
  ];

  useEffect(() => {
    // 初期データを設定
    setItems(sampleItems);
  }, []);

  // 品目を追加
  const addItem = () => {
    const newItem: CheckoutItem = {
      id: Date.now().toString(),
      itemName: '',
      unitPrice: 0,
      quantity: 1,
      total: 0
    };
    setItems([...items, newItem]);
  };

  // 品目を削除
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // 品目データを更新
  const updateItem = (id: string, field: keyof CheckoutItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // 単価と数量が両方入力されている場合、合計を計算
        if (field === 'unitPrice' || field === 'quantity') {
          const unitPrice = field === 'unitPrice' ? Number(value) : item.unitPrice;
          const quantity = field === 'quantity' ? Number(value) : item.quantity;
          updatedItem.total = unitPrice * quantity;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // 小計を計算
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  
  // 税金（10%）
  const tax = Math.round(subtotal * 0.1);
  
  // ポイント使用分を計算
  const pointsDiscount = Math.min(usePoints, subtotal + tax);
  
  // 総合計（ポイント使用後）
  const grandTotal = subtotal + tax - pointsDiscount;
  
  // 今回獲得予定ポイント（売上の5%）
  const earnedPoints = Math.round(subtotal * 0.05);
  
  // ポイント使用可能上限（小計の50%まで）
  const maxUsablePoints = Math.min(customerPoints?.current_points || 0, Math.round(subtotal * 0.5));
  
  // ポイント使用後の最終合計
  const finalTotal = grandTotal;
  
  // ポイント使用後の獲得ポイント（ポイント使用分は除外）
  const finalEarnedPoints = Math.round((subtotal - pointsDiscount) * 0.05);

  // 取引を開始してQRコードを生成
  const startTransaction = async () => {
    if (items.filter(item => item.itemName && item.unitPrice > 0).length === 0) {
      alert('商品を追加してください');
      return;
    }

    try {
      // 取引IDを生成
      const transactionId = `TXN${Date.now()}`;
      
      // 取引データを作成
      const transactionData: TransactionData = {
        transactionId,
        totalAmount: finalTotal,
        items: items.filter(item => item.itemName && item.unitPrice > 0).map(item => ({
          name: item.itemName,
          price: item.unitPrice,
          quantity: item.quantity
        })),
        customerId: customerPoints?.customer_id,
        storeId: 'store-001', // 実際の実装では店舗IDを取得
        timestamp: new Date().toISOString(),
        // ポイント情報を追加
        pointsUsed: usePoints,
        pointsEarned: finalEarnedPoints,
        customerName: customerPoints?.customer_name || customerName
      };

      // 取引データをSupabaseに保存
      const saved = await paymentNotificationService.saveTransaction(transactionData);
      if (!saved) {
        alert('取引データの保存に失敗しました');
        return;
      }

      setCurrentTransaction(transactionData);
      setShowQR(true);
      setPaymentStatus('pending');
      
      // 共有URLを生成
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/checkout?transaction=${transactionId}&amount=${finalTotal}&points=${usePoints}&earned=${finalEarnedPoints}`;
      setShareUrl(shareUrl);

      // 決済完了通知の監視を開始
      const stopPolling = paymentNotificationService.startPolling(
        transactionId,
        (notification) => {
          if (notification) {
            setPaymentStatus('completed');
            // 顧客データを更新
            paymentNotificationService.updateCustomerData(notification);
            // 成功メッセージを表示
            setTimeout(() => {
              alert('決済が完了しました！');
              setShowQR(false);
              setCurrentTransaction(null);
              setPaymentStatus('pending');
            }, 1000);
          }
        },
        3000 // 3秒ごとにチェック
      );

      // コンポーネントのアンマウント時にポーリングを停止
      return () => stopPolling();
    } catch (error) {
      console.error('取引開始エラー:', error);
      alert('取引の開始に失敗しました');
    }
  };

  // 顧客情報を検索
  const searchCustomer = async () => {
    if (!customerPhone.trim()) return;
    
    setIsLoadingCustomer(true);
    try {
      const customer = await PointService.getCustomerPoints(customerPhone);
      if (customer) {
        setCustomerPoints(customer);
        setCustomerName(customer.customer_name);
        setCustomerEmail(customer.customer_email || '');
        setShowCustomerForm(false);
      } else {
        setShowCustomerForm(true);
        setCustomerPoints(null);
      }
    } catch (error) {
      console.error('顧客検索エラー:', error);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // 新しい顧客を作成
  const createNewCustomer = async () => {
    if (!customerName.trim() || !customerPhone.trim()) return;
    
    try {
      const newCustomer = await PointService.createCustomerPoints({
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      });
      
      if (newCustomer) {
        setCustomerPoints(newCustomer);
        setShowCustomerForm(false);
      }
    } catch (error) {
      console.error('顧客作成エラー:', error);
    }
  };

  // ポイント使用量を更新
  const updateUsePoints = (points: number) => {
    const maxPoints = Math.min(points, customerPoints?.current_points || 0, subtotal + tax);
    setUsePoints(Math.max(0, maxPoints));
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/menu')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="メニューに戻る"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">お客様会計</h1>
                  <p className="text-sm text-gray-500">品目入力・会計処理</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顧客情報入力 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-500" />
            顧客情報
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="090-1234-5678"
                />
                <button
                  onClick={searchCustomer}
                  disabled={isLoadingCustomer || !customerPhone.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoadingCustomer ? '検索中...' : '検索'}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="顧客名を入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* 新規顧客作成フォーム */}
          {showCustomerForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm mb-3">
                新しい顧客として登録しますか？
              </p>
              <button
                onClick={createNewCustomer}
                disabled={!customerName.trim() || !customerPhone.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                新規顧客として登録
              </button>
            </div>
          )}

          {/* 顧客ポイント情報 */}
          {customerPoints && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-green-800">
                    {customerPoints.customer_name} 様
                  </h3>
                  <p className="text-sm text-green-600">
                    現在のポイント: <span className="font-semibold">{customerPoints.current_points.toLocaleString()}pt</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">
                    累計獲得: {customerPoints.total_earned_points.toLocaleString()}pt
                  </p>
                  <p className="text-sm text-green-600">
                    累計使用: {customerPoints.total_used_points.toLocaleString()}pt
                  </p>
                </div>
              </div>
              
              {/* ポイント使用入力 */}
              <div className="border-t border-green-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-green-800">
                    使用ポイント
                  </label>
                  <span className="text-xs text-green-600">
                    最大 {maxUsablePoints.toLocaleString()}pt まで使用可能
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={usePoints}
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value), maxUsablePoints);
                      setUsePoints(Math.max(0, value));
                    }}
                    min="0"
                    max={maxUsablePoints}
                    className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="使用するポイント数を入力"
                  />
                  <button
                    onClick={() => setUsePoints(maxUsablePoints)}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    最大使用
                  </button>
                  <button
                    onClick={() => setUsePoints(0)}
                    className="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  >
                    クリア
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 品目テーブル */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Flower className="h-5 w-5 mr-2 text-green-500" />
              品目一覧
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    品目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    単価（円）
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    本数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    合計（円）
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="品目名を入力"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="1"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        ¥{item.total.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                        className="p-2 text-red-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                        title="品目を削除"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 品目追加ボタン */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={addItem}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              品目を追加
            </button>
          </div>
        </div>

        {/* 合計計算 */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Receipt className="h-5 w-5 mr-2 text-green-500" />
            合計計算
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">小計:</span>
              <span className="text-lg font-medium text-gray-900">¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">消費税（10%）:</span>
              <span className="text-lg font-medium text-gray-900">¥{tax.toLocaleString()}</span>
            </div>
            
            {/* ポイント使用分の割引 */}
            {usePoints > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">ポイント割引:</span>
                <span className="text-lg font-medium text-red-600">-¥{pointsDiscount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-4 border-t-2 border-gray-200">
              <span className="text-xl font-bold text-gray-900">お支払い金額:</span>
              <span className="text-2xl font-bold text-green-600">¥{finalTotal.toLocaleString()}</span>
            </div>
            
            {/* ポイント情報サマリー */}
            {customerPoints && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* ポイント使用 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Gift className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-800 font-medium">使用ポイント</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">{usePoints.toLocaleString()}pt</span>
                    <p className="text-xs text-red-600 mt-1">
                      割引: ¥{pointsDiscount.toLocaleString()}
                    </p>
                  </div>
                  
                  {/* 獲得ポイント */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Gift className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-blue-800 font-medium">獲得予定</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{finalEarnedPoints.toLocaleString()}pt</span>
                    <p className="text-xs text-blue-600 mt-1">
                      売上の5%付与
                    </p>
                  </div>
                </div>
                
                {/* ポイント残高予想 */}
                <div className="mt-3 pt-3 border-t border-blue-200 text-center">
                  <span className="text-sm text-gray-600">決済後の予想ポイント残高: </span>
                  <span className="text-lg font-bold text-green-600">
                    {((customerPoints.current_points - usePoints + finalEarnedPoints)).toLocaleString()}pt
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 取引完了・QRコード発行 */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <QrCode className="h-5 w-5 mr-2 text-blue-500" />
              QRコード発行
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={startTransaction}
                disabled={showQR}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {showQR ? '取引中...' : '取引開始'}
              </button>
            </div>
          </div>
          
          {/* QRコード表示 */}
          {showQR && currentTransaction && (
            <div className="text-center">
              <QRCodeGenerator
                transactionData={currentTransaction}
                onPaymentComplete={(transactionId) => {
                  console.log('決済完了:', transactionId);
                  setPaymentStatus('completed');
                }}
              />
              
              {/* 共有URL */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  共有URL
                </h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert('URLをクリップボードにコピーしました');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    コピー
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  このURLを顧客に送信して、決済ページにアクセスしてもらえます
                </p>
              </div>
              
              {/* 取引詳細サマリー */}
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">取引詳細</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">取引ID:</span>
                    <span className="ml-2 font-mono">{currentTransaction.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">支払い金額:</span>
                    <span className="ml-2 font-bold">¥{currentTransaction.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">使用ポイント:</span>
                    <span className="ml-2 text-red-600">{currentTransaction.pointsUsed?.toLocaleString() || 0}pt</span>
                  </div>
                  <div>
                    <span className="text-gray-600">獲得予定:</span>
                    <span className="ml-2 text-blue-600">{currentTransaction.pointsEarned?.toLocaleString() || 0}pt</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 取引開始前の説明 */}
          {!showQR && (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">取引を開始してください</h4>
              <p className="text-sm text-gray-600 mb-4">
                商品を追加して「取引開始」ボタンを押すと、87app-customers用のQRコードが生成されます
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 お客様に87app-customersアプリでQRコードを読み取ってもらい、決済を完了してください。
                  決済が完了すると自動的に顧客管理に反映されます。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
