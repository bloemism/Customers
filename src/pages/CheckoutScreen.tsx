import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  QrCode,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Mail,
  Copy,
  Download,
  X
} from 'lucide-react';
import QRCode from 'qrcode';

// 会計アイテムの型定義
interface CheckoutItem {
  id: string;
  flower_item_category_id: string;
  color_category_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// 品目カテゴリの型定義
interface FlowerItemCategory {
  id: string;
  name: string;
  display_order: number;
}

// 色カテゴリの型定義
interface ColorCategory {
  id: string;
  name: string;
  hex_code: string;
  display_order: number;
}

// 店舗情報の型定義
interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

const CheckoutScreen: React.FC = () => {
  const { user } = useSimpleAuth();
  
  // 店舗情報
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  
  // 品目・色カテゴリ
  const [flowerItemCategories, setFlowerItemCategories] = useState<FlowerItemCategory[]>([]);
  const [colorCategories, setColorCategories] = useState<ColorCategory[]>([]);
  
  // 会計アイテム
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  
  // 計算機
  const [calculatorValue, setCalculatorValue] = useState('');
  const [selectedField, setSelectedField] = useState<'quantity' | 'price' | 'points' | null>(null);
  
  // 新規アイテム
  const [newItem, setNewItem] = useState<{
    flower_item_category_id: string;
    color_category_id: string;
    quantity: number;
    unit_price: number;
  }>({
    flower_item_category_id: '',
    color_category_id: '',
    quantity: 0,
    unit_price: 0
  });

  // 計算結果
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  
  // ポイント
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  
  // 支払い方法
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  
  // QRコード・URL情報
  const [itemQRInfo, setItemQRInfo] = useState<{
    type: 'item' | 'receipt';
    title: string;
    qrCodeUrl: string;
    emailUrl: string;
    data: any;
  } | null>(null);
  
  // モーダル表示
  const [showItemQRModal, setShowItemQRModal] = useState(false);

  // 店舗情報を読み込み
  useEffect(() => {
    const loadStoreData = async () => {
      if (!user?.email) return;
      
      try {
        setStoreLoading(true);
        const { data: stores, error } = await supabase
          .from('stores')
          .select('id, store_name, address, phone, email')
          .eq('email', user.email)
          .single();

        if (error) {
          console.log('店舗データが見つかりません:', error.message);
          setStore(null);
        } else if (stores) {
          setStore({
            id: stores.id,
            name: stores.store_name,
            address: stores.address,
            phone: stores.phone,
            email: stores.email
          });
          // 品目・色カテゴリを読み込み
          await loadCategories(stores.id);
        }
      } catch (error) {
        console.error('店舗データ読み込みエラー:', error);
      } finally {
        setStoreLoading(false);
      }
    };

    loadStoreData();
  }, [user]);

  // 品目・色カテゴリを読み込み
  const loadCategories = async (storeId: string) => {
    try {
      const { data: flowerData } = await supabase
        .from('flower_item_categories')
        .select('id, name, display_order')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order');

      const { data: colorData } = await supabase
        .from('color_categories')
        .select('id, name, hex_code, display_order')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order');

      if (flowerData) {
        setFlowerItemCategories(flowerData);
      }

      if (colorData) {
        setColorCategories(colorData);
      }
    } catch (error) {
      console.error('カテゴリ読み込みエラー:', error);
    }
  };

  // 電卓ボタンクリック
  const handleCalculatorClick = (value: string) => {
    if (value === 'C') {
      setCalculatorValue('');
    } else if (value === '=') {
      // 確定ボタンが押された場合
      if (selectedField && calculatorValue) {
        const numValue = parseInt(calculatorValue);
        if (!isNaN(numValue)) {
          if (selectedField === 'quantity') {
            setNewItem(prev => ({ ...prev, quantity: numValue }));
          } else if (selectedField === 'price') {
            setNewItem(prev => ({ ...prev, unit_price: numValue }));
          } else if (selectedField === 'points') {
            setPointsToUse(numValue);
          }
          // 値を設定したら選択をクリア
          setSelectedField(null);
          setCalculatorValue('');
        }
      }
    } else {
      setCalculatorValue(prev => prev + value);
    }
  };

  // アイテム追加
  const addItem = () => {
    if (!newItem.flower_item_category_id || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      return;
    }

    const totalPrice = newItem.quantity * newItem.unit_price;
    const item: CheckoutItem = {
      id: Date.now().toString(),
      flower_item_category_id: newItem.flower_item_category_id,
      color_category_id: newItem.color_category_id,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total_price: totalPrice
    };

    setCheckoutItems(prev => [...prev, item]);
    
    // フォームをリセット
    setNewItem({
      flower_item_category_id: '',
      color_category_id: '',
      quantity: 0,
      unit_price: 0
    });
    
    setCalculatorValue('');
  };

  // アイテム削除
  const removeItem = (id: string) => {
    setCheckoutItems(prev => prev.filter(item => item.id !== id));
  };

  // ポイント使用量の変更
  const handlePointsChange = (value: number) => {
    setPointsToUse(value);
  };

  // 計算結果を更新
  useEffect(() => {
    const newSubtotal = checkoutItems.reduce((sum, item) => sum + item.total_price, 0);
    const newPointsEarned = Math.round(newSubtotal * 0.05); // 5%ポイント還元
    
    // ポイントを引いた後の金額
    const afterPoints = Math.max(0, newSubtotal - pointsToUse);
    
    // ポイント引いた後の金額に税金を計算
    const newTax = Math.round(afterPoints * 0.1); // 10%消費税
    
    // 最終金額
    const newTotal = afterPoints + newTax;

    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
    setPointsEarned(newPointsEarned);
    setFinalTotal(newTotal);
  }, [checkoutItems, pointsToUse]);

  // URLをクリップボードにコピー
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('URLをクリップボードにコピーしました');
    } catch (error) {
      console.error('コピーエラー:', error);
    }
  };

  // 現金支払いQRコード生成
  const generateCashQRCode = async () => {
    try {
      console.log('現金支払いQRコード生成開始');
      
      const checkoutData = {
        store_name: store?.name || '不明',
        store_address: store?.address || '不明',
        store_phone: store?.phone || '不明',
        store_email: store?.email || '不明',
        items: checkoutItems.map(item => {
          const flowerItem = flowerItemCategories.find(cat => cat.id === item.flower_item_category_id);
          const color = colorCategories.find(cat => cat.id === item.color_category_id);
          return {
            flower_item_name: flowerItem?.name || '不明',
            color_name: color?.name || '不明',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          };
        }),
        subtotal: subtotal,
        tax: tax,
        total: total,
        points_used: pointsToUse,
        points_earned: pointsEarned,
        payment_method: 'cash',
        timestamp: new Date().toISOString()
      };

      console.log('現金支払いデータ:', checkoutData);

      const qrData = JSON.stringify(checkoutData);
      console.log('QRデータ:', qrData);

      const qrCodeUrl = await QRCode.toDataURL(qrData);
      console.log('QRコードURL:', qrCodeUrl);

      // encodeURIComponentを使用して日本語文字を安全にエンコード
      const emailUrl = `${window.location.origin}/checkout/${encodeURIComponent(JSON.stringify(checkoutData))}`;
      console.log('メールURL:', emailUrl);

      setItemQRInfo({
        type: 'receipt',
        title: '現金支払い',
        qrCodeUrl,
        emailUrl,
        data: checkoutData
      });
      
      console.log('itemQRInfo設定完了');
      setShowItemQRModal(true);
      console.log('モーダル表示設定完了');
      
    } catch (error) {
      console.error('現金支払いQRコード生成エラー:', error);
      alert(`QRコード生成エラー: ${error}`);
    }
  };

  // クレジットカード支払いQRコード生成
  const generateCreditCardQRCode = async () => {
    try {
      console.log('クレジットカード支払いQRコード生成開始');

    const checkoutData = {
        store_name: store?.name || '不明',
        store_address: store?.address || '不明',
        store_phone: store?.phone || '不明',
        store_email: store?.email || '不明',
        items: checkoutItems.map(item => {
          const flowerItem = flowerItemCategories.find(cat => cat.id === item.flower_item_category_id);
          const color = colorCategories.find(cat => cat.id === item.color_category_id);
          return {
            flower_item_name: flowerItem?.name || '不明',
            color_name: color?.name || '不明',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          };
        }),
      subtotal: subtotal,
      tax: tax,
        total: total,
        points_used: pointsToUse,
        points_earned: pointsEarned,
        payment_method: 'credit_card',
      timestamp: new Date().toISOString()
    };

      console.log('クレジットカード支払いデータ:', checkoutData);

      const qrData = JSON.stringify(checkoutData);
      console.log('QRデータ:', qrData);

      const qrCodeUrl = await QRCode.toDataURL(qrData);
      console.log('QRコードURL:', qrCodeUrl);

      // encodeURIComponentを使用して日本語文字を安全にエンコード
      const emailUrl = `${window.location.origin}/checkout/${encodeURIComponent(JSON.stringify(checkoutData))}`;
      console.log('メールURL:', emailUrl);

      setItemQRInfo({
        type: 'receipt',
        title: 'クレジットカード支払い',
        qrCodeUrl,
        emailUrl,
        data: checkoutData
      });
      
      console.log('itemQRInfo設定完了');
      setShowItemQRModal(true);
      console.log('モーダル表示設定完了');
      
    } catch (error) {
      console.error('クレジットカード支払いQRコード生成エラー:', error);
      alert(`QRコード生成エラー: ${error}`);
    }
  };

  // クレジットカード支払いURL生成
  const generateCreditCardUrl = async () => {
    try {
      console.log('クレジットカード支払いURL生成開始');
      
      const checkoutData = {
        store_name: store?.name || '不明',
        store_address: store?.address || '不明',
        store_phone: store?.phone || '不明',
        store_email: store?.email || '不明',
        items: checkoutItems.map(item => {
          const flowerItem = flowerItemCategories.find(cat => cat.id === item.flower_item_category_id);
          const color = colorCategories.find(cat => cat.id === item.color_category_id);
          return {
            flower_item_name: flowerItem?.name || '不明',
            color_name: color?.name || '不明',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          };
        }),
        subtotal: subtotal,
        tax: tax,
        total: total,
        points_used: pointsToUse,
        points_earned: pointsEarned,
        payment_method: 'credit_card',
        timestamp: new Date().toISOString()
      };

      console.log('クレジットカード支払いデータ:', checkoutData);

      // encodeURIComponentを使用して日本語文字を安全にエンコード
      const emailUrl = `${window.location.origin}/checkout/${encodeURIComponent(JSON.stringify(checkoutData))}`;
      console.log('メールURL:', emailUrl);

      setItemQRInfo({
        type: 'receipt',
        title: 'クレジットカード支払い',
        qrCodeUrl: '', // URL生成の場合は空
        emailUrl,
        data: checkoutData
      });
      
      console.log('itemQRInfo設定完了');
      setShowItemQRModal(true);
      console.log('モーダル表示設定完了');
      
    } catch (error) {
      console.error('クレジットカード支払いURL生成エラー:', error);
      alert(`URL生成エラー: ${error}`);
    }
  };

  // Stripe決済（開発中）
  const handleStripePayment = () => {
    alert('Stripe決済は開発中です。');
    // 実際のStripe決済ロジックをここに実装
  };

  // 伝票全体のQRコード生成
  const generateReceiptQRCode = async () => {
    try {
      console.log('伝票全体QRコード生成開始');
      
      const receiptData = {
        store_name: store?.name || '不明',
        store_address: store?.address || '不明',
        store_phone: store?.phone || '不明',
        store_email: store?.email || '不明',
        items: checkoutItems.map(item => {
          const flowerItem = flowerItemCategories.find(cat => cat.id === item.flower_item_category_id);
          const color = colorCategories.find(cat => cat.id === item.color_category_id);
          return {
            flower_item_name: flowerItem?.name || '不明',
            color_name: color?.name || '不明',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          };
        }),
        subtotal: subtotal,
        tax: tax,
        total: total,
        points_used: pointsToUse,
        points_earned: pointsEarned,
        timestamp: new Date().toISOString()
      };

      console.log('伝票データ:', receiptData);

      const qrData = JSON.stringify(receiptData);
      console.log('QRデータ:', qrData);

      const qrCodeUrl = await QRCode.toDataURL(qrData);
      console.log('QRコードURL:', qrCodeUrl);

      // encodeURIComponentを使用して日本語文字を安全にエンコード
      const emailUrl = `${window.location.origin}/checkout/${encodeURIComponent(JSON.stringify(receiptData))}`;
      console.log('メールURL:', emailUrl);

      setItemQRInfo({
        type: 'receipt',
        title: '伝票全体',
        qrCodeUrl,
        emailUrl,
        data: receiptData
      });
      
      console.log('itemQRInfo設定完了');
      setShowItemQRModal(true);
      console.log('モーダル表示設定完了');
      
    } catch (error) {
      console.error('伝票全体QRコード生成エラー:', error);
      alert(`QRコード生成エラー: ${error}`);
    }
  };

  // 伝票全体のURL生成
  const generateReceiptUrl = async () => {
    try {
      console.log('伝票全体URL生成開始');
      
      const receiptData = {
        store_name: store?.name || '不明',
        store_address: store?.address || '不明',
        store_phone: store?.phone || '不明',
        store_email: store?.email || '不明',
        items: checkoutItems.map(item => {
          const flowerItem = flowerItemCategories.find(cat => cat.id === item.flower_item_category_id);
          const color = colorCategories.find(cat => cat.id === item.color_category_id);
          return {
            flower_item_name: flowerItem?.name || '不明',
            color_name: color?.name || '不明',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          };
        }),
        subtotal: subtotal,
        tax: tax,
        total: total,
        points_used: pointsToUse,
        points_earned: pointsEarned,
        timestamp: new Date().toISOString()
      };

      console.log('伝票データ:', receiptData);

      // encodeURIComponentを使用して日本語文字を安全にエンコード
      const emailUrl = `${window.location.origin}/checkout/${encodeURIComponent(JSON.stringify(receiptData))}`;
      console.log('メールURL:', emailUrl);

      setItemQRInfo({
        type: 'receipt',
        title: '伝票全体',
        qrCodeUrl: '', // URL生成の場合は空
        emailUrl,
        data: receiptData
      });
      
      console.log('itemQRInfo設定完了');
      setShowItemQRModal(true);
      console.log('モーダル表示設定完了');
      
    } catch (error) {
      console.error('伝票全体URL生成エラー:', error);
      alert(`URL生成エラー: ${error}`);
    }
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">店舗情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">店舗情報が見つかりません</p>
          <p className="text-sm text-gray-500">店舗登録を行ってください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-white hover:text-green-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">会計画面</h1>
                <p className="text-green-100">{store.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：品目追加・電卓 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">品目追加</h2>

            {/* 品目・色選択 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  品目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItem.flower_item_category_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, flower_item_category_id: e.target.value }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">選択</option>
                  {flowerItemCategories.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  色
                </label>
                <select
                  value={newItem.color_category_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, color_category_id: e.target.value }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">選択</option>
                  {colorCategories.map(color => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
                    </div>
                </div>

            {/* 数量・単価入力（横並び） */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数量 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newItem.quantity || ''}
                    placeholder="数量"
                    className={`flex-1 px-2 py-2 border rounded-lg text-sm ${
                      selectedField === 'quantity'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                    readOnly
                  />
                    <button
                    onClick={() => setSelectedField('quantity')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedField === 'quantity'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    設定
                    </button>
                  </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  単価 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newItem.unit_price || ''}
                    placeholder="単価"
                    className={`flex-1 px-2 py-2 border rounded-lg text-sm ${
                      selectedField === 'price'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                    readOnly
                  />
                  <button
                    onClick={() => setSelectedField('price')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedField === 'price'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    設定
                  </button>
                </div>
              </div>
                </div>

            {/* ポイント入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用ポイント
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={pointsToUse || ''}
                  placeholder="使用ポイント"
                  className={`flex-1 px-2 py-2 border rounded-lg text-sm ${
                    selectedField === 'points'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                  readOnly
                />
                <button
                  onClick={() => setSelectedField('points')}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedField === 'points'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  設定
                </button>
              </div>
            </div>

            {/* コンパクトな電卓 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電卓
              </label>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="bg-white p-2 rounded border mb-2 text-right text-sm font-mono">
                  {calculatorValue || '0'}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, '00', '='].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleCalculatorClick(value.toString())}
                      className={`p-2 rounded text-sm font-medium ${
                        typeof value === 'number'
                          ? 'bg-white hover:bg-gray-50 text-gray-900'
                          : value === '='
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {value === '=' ? '確定' : value}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setCalculatorValue('')}
                    className="w-full py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    クリア (C)
                  </button>
          </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  1. 設定したい場所の「設定」ボタンを押す<br/>
                  2. 電卓で数字を入力<br/>
                  3. 「確定」ボタンを押す
                </p>
              </div>
            </div>

            {/* 品目追加ボタン */}
            <button
              onClick={addItem}
              disabled={!newItem.flower_item_category_id || newItem.quantity <= 0 || newItem.unit_price <= 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              品目を追加
            </button>
          </div>

          {/* 右側：品目一覧・計算結果 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">会計内容</h2>

            {/* 品目一覧 */}
                {checkoutItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>品目を追加してください</p>
                  </div>
                ) : (
              <div className="space-y-3 mb-6">
                {checkoutItems.map((item, index) => {
                  const flowerItem = flowerItemCategories.find(cat => cat.id === item.flower_item_category_id);
                  const color = colorCategories.find(cat => cat.id === item.color_category_id);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            {flowerItem?.name || '不明'}
                          </span>
                          {color && (
                            <span className="text-sm text-gray-600">
                              ({color.name})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.quantity}本 × ¥{item.unit_price.toLocaleString()} = ¥{item.total_price.toLocaleString()}
                        </div>
                      </div>
                                  <button
                        onClick={() => removeItem(item.id)}
                        className="ml-3 p-1 text-red-600 hover:text-red-800 transition-colors"
                                  >
                        <X className="w-4 h-4" />
                                  </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 伝票全体のQRコード・URL生成 */}
            {checkoutItems.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">伝票全体</h3>
                <div className="grid grid-cols-2 gap-3">
                                  <button
                    onClick={() => generateReceiptQRCode()}
                    className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    伝票QR生成
                                  </button>
                                <button
                    onClick={() => generateReceiptUrl()}
                    className="py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                                >
                    <Mail className="w-4 h-4 mr-2" />
                    伝票URL生成
                                </button>
                </div>
                    </div>
            )}

                    {/* ポイント使用 */}
            {checkoutItems.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">ポイント使用</h3>
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    使用ポイント
                  </label>
                  <div className="flex items-center space-x-2">
                          <input
                            type="number"
                      value={pointsToUse}
                      onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                            min="0"
                      className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                    <span className="text-sm text-gray-500">pt</span>
                        </div>
                      </div>
                    </div>
            )}

            {/* 計算結果 */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">計算結果</h3>
              <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                  <span>商品合計:</span>
                  <span>¥{subtotal.toLocaleString()}</span>
                </div>
                {pointsToUse > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>ポイント使用:</span>
                    <span>-¥{pointsToUse.toLocaleString()}</span>
                      </div>
                )}
                      <div className="flex justify-between">
                  <span>ポイント引後:</span>
                  <span>¥{Math.max(0, subtotal - pointsToUse).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                  <span>消費税 (10%):</span>
                  <span>¥{tax.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>最終金額:</span>
                    <span>¥{total.toLocaleString()}</span>
                  </div>
                      </div>
                <div className="text-xs text-gray-500 mt-2">
                  獲得ポイント: {pointsEarned} pt
                      </div>
                      </div>
                    </div>

            {/* 支払い方法選択 */}
            <div className="mt-6 space-y-3">
              <button 
                onClick={() => generateCashQRCode()}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <QrCode className="w-5 h-5 mr-2" />
                現金支払い QRコード生成
              </button>
              
              {/* クレジットカード支払いの詳細化 */}
              <div className="space-y-2">
                <button 
                  onClick={() => generateCreditCardQRCode()}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  クレジットカード QRコード生成
                </button>
                
                        <button
                  onClick={() => generateCreditCardUrl()}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center text-sm"
                        >
                  <Mail className="w-4 h-4 mr-2" />
                  クレジットカード URL生成
                        </button>
                
                            <button
                  onClick={() => handleStripePayment()}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm"
                            >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Stripe決済（開発中）
                            </button>
              </div>
            </div>
                      </div>
                    </div>

        {/* 品目別QRコードモーダル */}
        {showItemQRModal && itemQRInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {itemQRInfo.title}
              </h3>
              
              {/* QRコード - 伝票全体の場合のみ表示 */}
              {itemQRInfo.type === 'receipt' && itemQRInfo.qrCodeUrl && (
                <div className="text-center mb-4">
                  <img src={itemQRInfo.qrCodeUrl} alt="QR Code" className="mx-auto w-48 h-48" />
                  <p className="text-sm text-gray-600 mt-2">QRコードをスキャンして支払い</p>
                </div>
              )}

              {/* メール請求用URL */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メール請求用URL
                        </label>
                <div className="flex items-center space-x-2">
                          <input
                    type="text"
                    value={itemQRInfo.emailUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(itemQRInfo.emailUrl)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                      </div>
                <p className="text-xs text-gray-500 mt-1">
                  このURLを顧客にメールで送信して支払いを依頼できます
                </p>
                    </div>

              {/* ボタン */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowItemQRModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  閉じる
                </button>
                {itemQRInfo.type === 'receipt' && itemQRInfo.qrCodeUrl && (
                    <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = itemQRInfo.qrCodeUrl;
                      link.download = `receipt-qr-${new Date().toISOString().slice(0, 10)}.png`;
                      link.click();
                    }}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    QRコード保存
                    </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutScreen;
