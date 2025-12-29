import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';

import { 
  ArrowLeft,
  Plus,
  QrCode,
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
  // const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  
  // QRコード・URL情報
  const [itemQRInfo, setItemQRInfo] = useState<{
    type: 'item' | 'receipt';
    title: string;
    qrCodeUrl: string;
    emailUrl: string;
    data: unknown;
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
            // 数量確定後、自動的に単価に移動
            setSelectedField('price');
          } else if (selectedField === 'price') {
            setNewItem(prev => ({ ...prev, unit_price: numValue }));
            // 単価確定後、自動的に使用ポイントに移動
            setSelectedField('points');
          } else if (selectedField === 'points') {
            setPointsToUse(numValue);
            // ポイント確定後、選択をクリア（品目追加の準備完了）
            setSelectedField(null);
          }
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
    
    // 店舗の最終金額（税金込み）
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

  // 5桁の決済コード生成（テーブル制約: varchar(5)）
  const generatePaymentCode = async () => {
    try {
      console.log('決済コード生成開始');
      
      // 5桁のランダムコード生成
      const code = Math.floor(10000 + Math.random() * 90000).toString();
      
      const paymentData = {
        store_name: store?.name || '不明',
        store_address: store?.address || '不明',
        store_phone: store?.phone || '不明',
        store_email: store?.email || '不明',
        store_id: store?.id || null,
        items: checkoutItems.map(item => ({
          id: item.id,
          name: flowerItemCategories.find(c => c.id === item.flower_item_category_id)?.name || '不明',
          color: colorCategories.find(c => c.id === item.color_category_id)?.name || '不明',
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total_price
        })),
        subtotal: subtotal,
        tax: tax,
        total_amount: finalTotal,
        points_used: pointsToUse,
        points_earned: pointsEarned,
        payment_method: 'payment_code',
        timestamp: new Date().toISOString()
      };

      // payment_codes テーブルに保存
      const { data, error } = await supabase
        .from('payment_codes')
        .insert({
          code: code,
          store_id: store?.id || null,
          payment_data: paymentData,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分後に期限切れ
        })
        .select()
        .single();

      if (error) {
        console.error('決済コード保存エラー:', error);
        throw error;
      }

      console.log('決済コード保存成功:', data);

      setItemQRInfo({
        type: 'receipt',
        title: '決済コード',
        qrCodeUrl: '',
        emailUrl: '',
        data: { ...paymentData, payment_code: code }
      });
      
      setShowItemQRModal(true);
      
    } catch (error) {
      console.error('決済コード生成エラー:', error);
      alert(`決済コード生成エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 6桁の遠距離クレジット決済コード生成
  const generateRemoteInvoiceCode = async () => {
    try {
      console.log('遠距離クレジット決済コード生成開始');
      
      // 6桁のランダムコード生成
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const paymentData = {
        store_name: store?.name || '不明',
        store_address: store?.address || '不明',
        store_phone: store?.phone || '不明',
        store_email: store?.email || '不明',
        store_id: store?.id || null,
        items: checkoutItems.map(item => ({
          id: item.id,
          name: flowerItemCategories.find(c => c.id === item.flower_item_category_id)?.name || '不明',
          color: colorCategories.find(c => c.id === item.color_category_id)?.name || '不明',
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total_price
        })),
        subtotal: subtotal,
        tax: tax,
        total_amount: finalTotal,
        points_used: pointsToUse,
        points_earned: pointsEarned,
        payment_method: 'remote_credit',
        timestamp: new Date().toISOString()
      };

      // remote_invoice_codes テーブルに保存
      const { data, error } = await supabase
        .from('remote_invoice_codes')
        .insert({
          code: code,
          store_id: store?.id || null,
          invoice_data: paymentData,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2週間後に期限切れ
        })
        .select()
        .single();

      if (error) {
        console.error('遠距離クレジット決済コード保存エラー:', error);
        throw error;
      }

      console.log('遠距離クレジット決済コード保存成功:', data);

      setItemQRInfo({
        type: 'receipt',
        title: '遠距離クレジット決済コード',
        qrCodeUrl: '',
        emailUrl: '',
        data: { ...paymentData, remote_invoice_code: code }
      });
      
      setShowItemQRModal(true);
      
    } catch (error) {
      console.error('遠距離クレジット決済コード生成エラー:', error);
      alert(`遠距離クレジット決済コード生成エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">店舗情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">店舗情報が見つかりません</p>
          <p className="text-sm text-gray-500">店舗登録を行ってください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="page-header-wood rounded-2xl p-6 mb-8">
          <div className="header-content flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="back-button"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="header-title text-2xl font-bold">会計画面</h1>
                <p className="header-subtitle">{store.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：品目追加・電卓 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm p-6 lg:p-4">
            <h2 className="text-xl lg:text-lg font-semibold text-gray-900 mb-6 lg:mb-4">品目追加</h2>

            {/* 品目・色選択（モバイル対応・縦並び） */}
            <div className="space-y-4 lg:space-y-2 mb-4 lg:mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">
                  品目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItem.flower_item_category_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, flower_item_category_id: e.target.value }))}
                  className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm"
                >
                  <option value="">選択してください</option>
                  {flowerItemCategories.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">
                  色
                </label>
                <select
                  value={newItem.color_category_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, color_category_id: e.target.value }))}
                  className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm"
                >
                  <option value="">選択してください</option>
                  {colorCategories.map(color => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 数量・単価・ポイント入力（モバイル対応・縦並び） */}
            <div className="space-y-4 lg:space-y-2 mb-4 lg:mb-3">
              {/* 数量入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">
                  数量 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-1">
                  <input
                    type="text"
                    value={newItem.quantity || ''}
                    placeholder="数量"
                    className={`flex-1 px-3 py-3 lg:py-2 border rounded-lg text-base lg:text-sm cursor-pointer ${
                      selectedField === 'quantity'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                    readOnly
                    onClick={() => setSelectedField('quantity')}
                  />
                  <button
                    onClick={() => setSelectedField('quantity')}
                    className={`px-3 py-3 lg:py-2 text-sm rounded-lg transition-colors whitespace-nowrap font-medium hidden sm:block ${
                      selectedField === 'quantity'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                    }`}
                  >
                    設定
                  </button>
                </div>
              </div>

              {/* 単価入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">
                  単価 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-1">
                  <input
                    type="text"
                    value={newItem.unit_price || ''}
                    placeholder="単価"
                    className={`flex-1 px-3 py-3 lg:py-2 border rounded-lg text-base lg:text-sm cursor-pointer ${
                      selectedField === 'price'
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50/50'
                    }`}
                    readOnly
                    onClick={() => setSelectedField('price')}
                  />
                  <button
                    onClick={() => setSelectedField('price')}
                    className={`px-3 py-3 lg:py-2 text-sm rounded-lg transition-colors whitespace-nowrap font-medium hidden sm:block ${
                      selectedField === 'price'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                    }`}
                  >
                    設定
                  </button>
                </div>
              </div>
            </div>

            {/* ポイント入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">
                使用ポイント
              </label>
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-1">
                <input
                  type="text"
                  value={pointsToUse || ''}
                  placeholder="使用ポイント"
                  className={`flex-1 px-3 py-3 lg:py-2 border rounded-lg text-base lg:text-sm cursor-pointer ${
                    selectedField === 'points'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                  readOnly
                  onClick={() => setSelectedField('points')}
                />
                <button
                  onClick={() => setSelectedField('points')}
                  className={`px-3 py-3 lg:py-2 text-sm rounded-lg transition-colors whitespace-nowrap font-medium hidden sm:block ${
                    selectedField === 'points'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                  }`}
                >
                  設定
                </button>
              </div>
            </div>

            {/* モバイル対応電卓 */}
            <div className="mt-4 lg:mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">
                電卓
              </label>
              <div className="bg-gray-100 p-4 lg:p-3 rounded-lg">
                <div className="bg-white p-3 lg:p-2 rounded border mb-3 lg:mb-2 text-right text-base lg:text-sm font-mono">
                  {calculatorValue || '0'}
                </div>
                <div className="grid grid-cols-3 gap-2 lg:gap-1">
                  {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, '00', '='].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleCalculatorClick(value.toString())}
                      className={`p-3 lg:p-2 rounded text-base lg:text-sm font-medium ${
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
                <div className="mt-3 lg:mt-2">
                  <button
                    onClick={() => setCalculatorValue('')}
                    className="w-full py-3 lg:py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    クリア (C)
                  </button>
                </div>
                <div className="mt-3 lg:mt-2 p-3 lg:p-2 bg-blue-50 rounded-lg">
                  <p className="text-sm lg:text-xs text-blue-800 text-center leading-relaxed">
                    <strong>使い方:</strong><br/>
                    1. 入力欄をタップして選択<br/>
                    2. 電卓で数字を入力<br/>
                    3. 「確定」ボタンを押す
                  </p>
                </div>
              </div>
            </div>

            {/* 品目追加ボタン */}
            <button
              onClick={addItem}
              disabled={!newItem.flower_item_category_id || newItem.quantity <= 0 || newItem.unit_price <= 0}
              className="w-full py-3 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4 lg:mt-3 text-base lg:text-sm"
            >
              <Plus className="w-5 h-5 lg:w-4 lg:h-4 mr-2 inline" />
              合計＋品目追加
            </button>
          </div>

          {/* 右側：品目一覧・計算結果 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm p-6 lg:p-4">
            <h2 className="text-xl lg:text-lg font-semibold text-gray-900 mb-6 lg:mb-4">会計内容</h2>

            {/* 品目一覧 */}
                {checkoutItems.length === 0 ? (
                  <div className="text-center py-8 lg:py-4 text-gray-500">
                <ShoppingCart className="w-16 h-16 lg:w-12 lg:h-12 mx-auto mb-4 lg:mb-2 text-gray-300" />
                <p className="text-base lg:text-sm">品目を追加してください</p>
                  </div>
                ) : (
              <div className="space-y-3 lg:space-y-2 mb-6 lg:mb-4">
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
                    <span>店舗最終金額:</span>
                    <span>¥{total.toLocaleString()}</span>
                  </div>
                </div>
                

                
                <div className="text-xs text-gray-500 mt-2">
                  獲得ポイント: {pointsEarned} pt
                </div>
                      </div>
                    </div>

            {/* 決済コード生成ボタン */}
            <div className="mt-6 space-y-3">
              <button 
                onClick={() => generatePaymentCode()}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-semibold"
              >
                <QrCode className="w-5 h-5 mr-2" />
                決済コード生成（5桁）
              </button>
              
                <button 
                onClick={() => generateRemoteInvoiceCode()}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold"
                >
                <QrCode className="w-5 h-5 mr-2" />
                遠距離クレジット決済コード生成（6桁）
                </button>
            </div>
                      </div>
                    </div>

        {/* 決済コードモーダル */}
        {showItemQRModal && itemQRInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {itemQRInfo.title}
              </h3>
              
              {/* 決済コード表示 */}
              {itemQRInfo.data?.payment_code && (
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">決済コード（5桁）</p>
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                    <p className="text-5xl font-bold text-green-700 tracking-widest font-mono">
                      {itemQRInfo.data.payment_code}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    このコードをお客様に伝えてください<br />
                    <span className="text-xs text-amber-600">※ 有効期限: 30分</span>
                  </p>
                </div>
              )}

              {/* 遠距離クレジット決済コード表示 */}
              {itemQRInfo.data?.remote_invoice_code && (
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">遠距離クレジット決済コード（6桁）</p>
                  <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
                    <p className="text-5xl font-bold text-blue-700 tracking-widest font-mono">
                      {itemQRInfo.data.remote_invoice_code}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    このコードをお客様に伝えてください<br />
                    <span className="text-xs text-amber-600">※ 有効期限: 2週間</span>
                  </p>
                </div>
              )}

              {/* QRコード - 従来の支払いの場合のみ表示 */}
              {itemQRInfo.type === 'receipt' && itemQRInfo.qrCodeUrl && !itemQRInfo.data?.payment_code && !itemQRInfo.data?.remote_invoice_code && (
                <div className="text-center mb-4">
                  <img 
                    src={itemQRInfo.qrCodeUrl} 
                    alt="QR Code" 
                    className="mx-auto w-48 h-48"
                    onError={(e) => {
                      console.error('QRコード画像の読み込みに失敗しました');
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('QRコード画像の読み込みに成功しました');
                    }}
                  />
                  <p className="text-sm text-gray-600 mt-2">QRコードをスキャンして支払い</p>
                </div>
              )}

              {/* 金額情報 */}
              {itemQRInfo.data && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">合計金額</span>
                    <span className="text-xl font-bold text-gray-900">
                      ¥{itemQRInfo.data.total_amount?.toLocaleString()}
                    </span>
                      </div>
                    </div>
              )}

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
