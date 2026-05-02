import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';

import { 
  ArrowLeft,
  Plus,
  ShoppingCart,
  X
} from 'lucide-react';

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
  
  // 決済コード情報（5桁: 基本決済・5分間有効）
  const [paymentCode5Digit, setPaymentCode5Digit] = useState<string | null>(null);
  const [paymentCode5DigitLoading, setPaymentCode5DigitLoading] = useState(false);
  
  // 決済コード情報（6桁: 遠距離決済・1ヶ月有効）
  const [paymentCode6Digit, setPaymentCode6Digit] = useState<string | null>(null);
  const [paymentCode6DigitLoading, setPaymentCode6DigitLoading] = useState(false);
  
  // 動的決済用の金額入力（5桁コード用）
  const [dynamicPaymentAmount, setDynamicPaymentAmount] = useState<number>(0);

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
    
    // 店舗の最終金額（税金込み）
    const newTotal = afterPoints + newTax;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
    setPointsEarned(newPointsEarned);
    setFinalTotal(newTotal);
  }, [checkoutItems, pointsToUse]);

  // 決済コードをクリップボードにコピー
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('決済コードをクリップボードにコピーしました');
    } catch (error) {
      console.error('コピーエラー:', error);
    }
  };

  // 5桁決済コード生成（基本決済、5分間有効・動的決済対応）
  const generatePaymentCode5Digit = async () => {
    if (!store) {
      alert('店舗情報が不足しています');
      return;
    }

    // 動的決済の場合、金額が入力されているか確認
    const finalAmount = dynamicPaymentAmount > 0 ? dynamicPaymentAmount : total;
    if (finalAmount <= 0) {
      alert('決済金額を入力してください');
      return;
    }

    try {
      setPaymentCode5DigitLoading(true);
      console.log('5桁決済コード生成開始（基本決済・動的決済）');

      // 決済データの準備
      const paymentData = {
        type: 'payment',
        code_type: '5digit', // 5桁コードであることを示す
        is_dynamic: dynamicPaymentAmount > 0, // 動的決済かどうか
        storeId: store.id,
        storeName: store.name,
        storeAddress: store.address,
        storePhone: store.phone,
        storeEmail: store.email,
        items: checkoutItems.length > 0 ? checkoutItems.map(item => {
          const flowerItem = flowerItemCategories.find(cat => cat.id === item.flower_item_category_id);
          const color = colorCategories.find(cat => cat.id === item.color_category_id);
          return {
            id: `${item.flower_item_category_id}_${item.color_category_id}`,
            name: `${flowerItem?.name || '不明'} (${color?.name || '不明'})`,
            price: item.unit_price,
            quantity: item.quantity,
            total: item.total_price
          };
        }) : [],
        subtotal: dynamicPaymentAmount > 0 ? dynamicPaymentAmount : subtotal,
        tax: dynamicPaymentAmount > 0 ? Math.round(dynamicPaymentAmount * 0.1) : tax,
        totalAmount: finalAmount,
        pointsUsed: pointsToUse,
        pointsEarned: dynamicPaymentAmount > 0 ? Math.round(finalAmount * 0.05) : pointsEarned,
        timestamp: new Date().toISOString()
      };

      console.log('決済データ:', paymentData);

      // 5桁の決済コードを生成（10000-99999）
      const generatedCode = Math.floor(Math.random() * 90000 + 10000).toString();
      console.log('生成された5桁決済コード:', generatedCode);

      // 決済コード生成（5分間有効）
      const { data, error } = await supabase
        .from('payment_codes')
        .insert({
          code: generatedCode,
          store_id: store.id,
          payment_data: paymentData,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分後
        })
        .select('code')
        .single();

      // エラーハンドリング
      if (error) {
        console.error('5桁決済コード生成エラー:', error);
        alert(`決済コード生成エラー: ${error.message}`);
        return;
      }

      if (data && data.code) {
        setPaymentCode5Digit(data.code);
        console.log('5桁決済コード生成成功:', data.code);
        
        // クリップボードにコピー
        await copyToClipboard(data.code);
      }

    } catch (error) {
      console.error('5桁決済コード生成エラー:', error);
      alert(`決済コード生成エラー: ${error}`);
    } finally {
      setPaymentCode5DigitLoading(false);
    }
  };

  // 6桁決済コード生成（遠距離決済、1ヶ月有効）
  const generatePaymentCode6Digit = async () => {
    if (!store || checkoutItems.length === 0) {
      alert('店舗情報または商品が不足しています');
      return;
    }

    try {
      setPaymentCode5DigitLoading(true);
      console.log('5桁決済コード生成開始（遠距離決済）');

      // 決済データの準備
      const paymentData = {
        type: 'payment',
        code_type: '5digit', // 5桁コードであることを示す
        storeId: store.id,
        storeName: store.name,
        storeAddress: store.address,
        storePhone: store.phone,
        storeEmail: store.email,
        items: checkoutItems.map(item => {
          const flowerItem = flowerItemCategories.find(cat => cat.id === item.flower_item_category_id);
          const color = colorCategories.find(cat => cat.id === item.color_category_id);
          return {
            id: `${item.flower_item_category_id}_${item.color_category_id}`,
            name: `${flowerItem?.name || '不明'} (${color?.name || '不明'})`,
            price: item.unit_price,
            quantity: item.quantity,
            total: item.total_price
          };
        }),
        subtotal: subtotal,
        tax: tax,
        totalAmount: total,
        pointsUsed: pointsToUse,
        pointsEarned: pointsEarned,
        timestamp: new Date().toISOString()
      };

      console.log('決済データ:', paymentData);

      // 5桁の決済コードを生成（10000-99999）
      const generatedCode = Math.floor(Math.random() * 90000 + 10000).toString();
      console.log('生成された5桁決済コード:', generatedCode);

      // 決済コード生成（1ヶ月有効）
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      const { data, error } = await supabase
        .from('payment_codes')
        .insert({
          code: generatedCode,
          store_id: store.id,
          payment_data: paymentData,
          expires_at: oneMonthFromNow.toISOString() // 1ヶ月後
        })
        .select('code')
        .single();

      // エラーハンドリング
      if (error) {
        console.error('5桁決済コード生成エラー:', error);
        alert(`決済コード生成エラー: ${error.message}`);
        return;
      }

      if (data && data.code) {
        setPaymentCode5Digit(data.code);
        console.log('5桁決済コード生成成功:', data.code);
        
        // クリップボードにコピー
        await copyToClipboard(data.code);
      }

    } catch (error) {
      console.error('5桁決済コード生成エラー:', error);
      alert(`決済コード生成エラー: ${error}`);
    } finally {
      setPaymentCode5DigitLoading(false);
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

            {/* 品目・色選択（モバイル対応・縦並び） */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  品目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItem.flower_item_category_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, flower_item_category_id: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  色
                </label>
                <select
                  value={newItem.color_category_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, color_category_id: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
            <div className="space-y-4 mb-4">
              {/* 数量入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数量 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newItem.quantity || ''}
                    placeholder="数量"
                    className={`flex-1 px-3 py-3 border rounded-lg text-base ${
                      selectedField === 'quantity'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                    readOnly
                  />
                  <button
                    onClick={() => setSelectedField('quantity')}
                    className={`px-3 py-3 text-sm rounded-lg transition-colors whitespace-nowrap font-medium ${
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  単価 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newItem.unit_price || ''}
                    placeholder="単価"
                    className={`flex-1 px-3 py-3 border rounded-lg text-base ${
                      selectedField === 'price'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                    readOnly
                  />
                  <button
                    onClick={() => setSelectedField('price')}
                    className={`px-3 py-3 text-sm rounded-lg transition-colors whitespace-nowrap font-medium ${
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用ポイント
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={pointsToUse || ''}
                  placeholder="使用ポイント"
                  className={`flex-1 px-3 py-3 border rounded-lg text-base ${
                    selectedField === 'points'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                  readOnly
                />
                <button
                  onClick={() => setSelectedField('points')}
                  className={`px-3 py-3 text-sm rounded-lg transition-colors whitespace-nowrap font-medium ${
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
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電卓
              </label>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="bg-white p-3 rounded border mb-3 text-right text-base font-mono">
                  {calculatorValue || '0'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, '00', '='].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleCalculatorClick(value.toString())}
                      className={`p-3 rounded text-base font-medium ${
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
                <div className="mt-3">
                  <button
                    onClick={() => setCalculatorValue('')}
                    className="w-full py-3 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    クリア (C)
                  </button>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 text-center leading-relaxed">
                    <strong>使い方:</strong><br/>
                    1. 設定したい場所の「設定」ボタンを押す<br/>
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
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              品目を追加
            </button>

            {/* テストデータ追加ボタン */}
            <button
              onClick={() => {
                // テスト用の品目を追加
                if (flowerItemCategories.length > 0 && colorCategories.length > 0) {
                  const testItem: CheckoutItem = {
                    id: `test-${Date.now()}`,
                    flower_item_category_id: flowerItemCategories[0].id,
                    color_category_id: colorCategories[0].id,
                    quantity: 2,
                    unit_price: 500,
                    total_price: 1000
                  };
                  setCheckoutItems([...checkoutItems, testItem]);
                  console.log('テスト品目を追加しました:', testItem);
                }
              }}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-2"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              テスト品目追加（QRテスト用）
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

            {/* 支払い方法選択 */}
            <div className="mt-6 space-y-3">
              {/* 5桁決済コード生成（基本決済・動的決済対応） */}
              <div className="space-y-2">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-2">
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    動的決済: 金額を入力してください（¥）
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={dynamicPaymentAmount || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setDynamicPaymentAmount(value);
                    }}
                    placeholder="金額を入力（例: 5000）"
                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                  />
                  <p className="text-xs text-purple-600 mt-1">
                    {dynamicPaymentAmount > 0 ? `入力金額: ¥${dynamicPaymentAmount.toLocaleString()}` : '金額を入力すると動的決済になります'}
                  </p>
                </div>
                
                <button 
                  onClick={generatePaymentCode5Digit}
                  disabled={paymentCode5DigitLoading}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {paymentCode5DigitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <span className="text-xl mr-2">🔢</span>
                      決済コード生成（5桁・基本決済）
                    </>
                  )}
                </button>

                {/* 生成された5桁決済コード表示 */}
                {paymentCode5Digit && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm text-purple-700 mb-2">決済コード（5桁）</p>
                      <p className="text-3xl font-bold text-purple-900 mb-2">{paymentCode5Digit}</p>
                      <p className="text-xs text-purple-600">お客様にこのコードをお伝えください</p>
                      <p className="text-xs text-purple-500 mt-1">（5分間有効）</p>
                      {dynamicPaymentAmount > 0 && (
                        <p className="text-xs text-purple-600 mt-1 font-semibold">
                          動的決済: ¥{dynamicPaymentAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 6桁決済コード生成（遠距離決済） */}
              <div className="space-y-2 mt-4">
                <button 
                  onClick={generatePaymentCode6Digit}
                  disabled={paymentCode6DigitLoading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {paymentCode6DigitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <span className="text-xl mr-2">🌐</span>
                      決済コード生成（6桁・遠距離決済）
                    </>
                  )}
                </button>

                {/* 生成された6桁決済コード表示 */}
                {paymentCode6Digit && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm text-indigo-700 mb-2">決済コード（6桁）</p>
                      <p className="text-3xl font-bold text-indigo-900 mb-2">{paymentCode6Digit}</p>
                      <p className="text-xs text-indigo-600">お客様にこのコードをお伝えください</p>
                      <p className="text-xs text-indigo-500 mt-1">（1ヶ月間有効）</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
                      </div>
                    </div>
      </div>
    </div>
  );
};

export default CheckoutScreen;
