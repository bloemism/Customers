import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Minus, Trash2, Calculator, CreditCard, DollarSign, Search, Copy, Mail } from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  color: string;
  is_active: boolean;
}

interface CheckoutItem {
  id: string;
  name: string;
  category: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const CheckoutScreen: React.FC = () => {
  const { user } = useSimpleAuth();
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 入力フィールド
  const [itemName, setItemName] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');

  // 自動変換候補
  const [suggestions, setSuggestions] = useState<ProductItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ポイント使用
  const [usedPoints, setUsedPoints] = useState(0);
  const [customerPoints, setCustomerPoints] = useState(1000); // 仮の顧客ポイント

  // 決済方法
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');

  // 会計伝票URL
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');

  // 計算結果
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const pointsEarned = Math.floor(subtotal * 0.05); // 5%ポイント
  const tax = Math.floor((subtotal - usedPoints) * 0.1); // 10%消費税（ポイント使用後）
  const finalTotal = subtotal - usedPoints + tax;

  useEffect(() => {
    loadProductItems();
  }, []);

  // 商品管理ページで登録した品目・色の組み合わせを読み込み
  const loadProductItems = async () => {
    try {
      setLoading(true);
      
      // ログインユーザーの店舗の商品を取得
      if (user) {
        const { data, error } = await supabase
          .from('product_items')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('商品読み込みエラー:', error);
        } else if (data && data.length > 0) {
          setProductItems(data);
          return;
        }
      }

      // エラーの場合やデータがない場合、デフォルトの品目・色を表示
      const defaultItems: ProductItem[] = [
        { id: '1', name: 'バラ', category: '花', color: '赤', is_active: true },
        { id: '2', name: 'バラ', category: '花', color: '白', is_active: true },
        { id: '3', name: 'アルストロメリア', category: '花', color: 'ピンク', is_active: true },
        { id: '4', name: 'アレンジメント', category: 'アレンジ', color: 'ミックス', is_active: true },
        { id: '5', name: '鉢植え', category: '鉢物', color: '緑', is_active: true },
        { id: '6', name: 'カーネーション', category: '花', color: '赤', is_active: true },
        { id: '7', name: 'カーネーション', category: '花', color: 'ピンク', is_active: true },
        { id: '8', name: 'チューリップ', category: '花', color: '黄', is_active: true },
        { id: '9', name: 'チューリップ', category: '花', color: '紫', is_active: true },
        { id: '10', name: 'ガーベラ', category: '花', color: 'オレンジ', is_active: true }
      ];
      setProductItems(defaultItems);
    } catch (error) {
      console.error('商品読み込みエラー:', error);
      // エラーの場合、デフォルトの品目・色を表示
      const defaultItems: ProductItem[] = [
        { id: '1', name: 'バラ', category: '花', color: '赤', is_active: true },
        { id: '2', name: 'バラ', category: '花', color: '白', is_active: true },
        { id: '3', name: 'アルストロメリア', category: '花', color: 'ピンク', is_active: true },
        { id: '4', name: 'アレンジメント', category: 'アレンジ', color: 'ミックス', is_active: true },
        { id: '5', name: '鉢植え', category: '鉢物', color: '緑', is_active: true }
      ];
      setProductItems(defaultItems);
    } finally {
      setLoading(false);
    }
  };

  // 品目名入力時の自動変換
  const handleItemNameChange = (value: string) => {
    setItemName(value);
    
    if (value.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 品目名で検索
    const filtered = productItems.filter(item => 
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // 品目選択
  const selectItem = (item: ProductItem) => {
    setItemName(item.name);
    setItemColor(item.color);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // 会計に追加
  const addToCheckout = () => {
    if (!itemName.trim() || !itemColor.trim() || !unitPrice.trim() || quantity <= 0) {
      alert('品目名、色、単価、数量を入力してください');
      return;
    }

    const price = Number(unitPrice);
    if (isNaN(price) || price <= 0) {
      alert('正しい価格を入力してください');
      return;
    }

    const checkoutItem: CheckoutItem = {
      id: Date.now().toString(),
      name: itemName,
      category: productItems.find(item => item.name === itemName && item.color === itemColor)?.category || 'その他',
      color: itemColor,
      quantity: quantity,
      unitPrice: price,
      totalPrice: price * quantity
    };

    setCheckoutItems([...checkoutItems, checkoutItem]);
    
    // フォームをリセット
    setItemName('');
    setItemColor('');
    setQuantity(1);
    setUnitPrice('');
  };

  // 会計から商品を削除
  const removeFromCheckout = (itemId: string) => {
    setCheckoutItems(checkoutItems.filter(item => item.id !== itemId));
  };

  // 数量を更新
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setCheckoutItems(checkoutItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    ));
  };

  // 単価を更新
  const updateUnitPrice = (itemId: string, newPrice: number) => {
    if (newPrice <= 0) return;
    
    setCheckoutItems(checkoutItems.map(item => 
      item.id === itemId 
        ? { ...item, unitPrice: newPrice, totalPrice: newPrice * item.quantity }
        : item
    ));
  };

  // ポイント使用量を更新
  const updateUsedPoints = (points: number) => {
    if (points < 0 || points > customerPoints) return;
    setUsedPoints(points);
  };

  // 会計伝票URLを生成
  const generateCheckoutUrl = () => {
    if (checkoutItems.length === 0) {
      alert('会計項目がありません');
      return;
    }

    const checkoutData = {
      items: checkoutItems,
      subtotal: subtotal,
      usedPoints: usedPoints,
      pointsEarned: pointsEarned,
      tax: tax,
      finalTotal: finalTotal,
      paymentMethod: paymentMethod,
      timestamp: new Date().toISOString()
    };

    // 会計伝票のIDを生成（実際の実装ではデータベースに保存）
    const checkoutId = `checkout_${Date.now()}`;
    const url = `${window.location.origin}/checkout/${checkoutId}`;
    
    // 会計データをローカルストレージに保存（実際の実装ではデータベース）
    localStorage.setItem(`checkout_${checkoutId}`, JSON.stringify(checkoutData));
    
    setCheckoutUrl(url);
    alert('会計伝票URLを生成しました！お客様にメールで送信してください。');
  };

  // URLをクリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      alert('URLをクリップボードにコピーしました');
    } catch (error) {
      console.error('コピーに失敗しました:', error);
      alert('コピーに失敗しました');
    }
  };

  // 決済処理
  const processPayment = async () => {
    if (checkoutItems.length === 0) {
      alert('会計項目がありません');
      return;
    }

    setLoading(true);

    try {
      // 決済方法に応じた処理
      if (paymentMethod === 'credit') {
        // クレジット決済の場合
        alert(`クレジット決済が完了しました！\n\n合計金額: ¥${finalTotal.toLocaleString()}\n使用ポイント: ${usedPoints}pt\n獲得ポイント: +${pointsEarned}pt`);
      } else {
        // 現金決済の場合
        alert(`現金決済が完了しました！\n\n合計金額: ¥${finalTotal.toLocaleString()}\n使用ポイント: ${usedPoints}pt\n獲得ポイント: +${pointsEarned}pt`);
      }
      
      // 会計項目をクリア
      setCheckoutItems([]);
      setItemName('');
      setItemColor('');
      setQuantity(1);
      setUnitPrice('');
      setUsedPoints(0);
      setCheckoutUrl('');
      
    } catch (error) {
      console.error('決済処理エラー:', error);
      alert('決済処理に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading && checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">商品情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">お客様会計</h1>
              <p className="mt-2 text-gray-600">エクセル形式で品目を入力し、会計処理を行います</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              戻る
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：商品入力 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">商品入力</h2>
                <p className="text-sm text-gray-600 mt-2">品目名を入力すると、自動変換で候補が表示されます</p>
              </div>

              <div className="p-6 space-y-4">
                {/* 品目名入力 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">品目名</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => handleItemNameChange(e.target.value)}
                      placeholder="例: バラ、アルストロメリア..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  
                  {/* 自動変換候補 */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map(item => (
                        <div
                          key={`${item.name}-${item.color}`}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectItem(item)}
                        >
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.category} - {item.color}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 色入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">色</label>
                  <input
                    type="text"
                    value={itemColor}
                    onChange={(e) => setItemColor(e.target.value)}
                    placeholder="例: 赤、白、ピンク..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 数量入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 単価入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">単価（円）</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="例: 500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 会計に追加ボタン */}
                <button
                  onClick={addToCheckout}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  会計に追加
                </button>
              </div>
            </div>
          </div>

          {/* 右側：会計表と決済 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">会計表</h2>
              </div>

              <div className="p-6">
                {checkoutItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <p>会計項目がありません</p>
                    <p className="text-sm mt-1">左側で商品を入力して追加してください</p>
                  </div>
                ) : (
                  <>
                    {/* エクセル形式の会計表 */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">品目名</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">色</th>
                            <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">数量</th>
                            <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">単価</th>
                            <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">小計</th>
                            <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {checkoutItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 text-sm">{item.name}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{item.color}</td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="px-1 py-1 text-gray-600 hover:text-gray-900"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="min-w-[2rem] text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="px-1 py-1 text-gray-600 hover:text-gray-900"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateUnitPrice(item.id, Number(e.target.value))}
                                  className="w-20 text-center border border-gray-300 rounded px-1 py-1 text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                ¥{item.totalPrice.toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                <button
                                  onClick={() => removeFromCheckout(item.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ポイント使用 */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">ポイント使用</h3>
                      <div className="flex items-center space-x-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">使用ポイント</label>
                          <input
                            type="number"
                            value={usedPoints}
                            onChange={(e) => updateUsedPoints(Number(e.target.value))}
                            min="0"
                            max={customerPoints}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          利用可能: <span className="font-medium">{customerPoints}pt</span>
                        </div>
                      </div>
                    </div>

                    {/* 合計計算 */}
                    <div className="mt-6 border-t border-gray-200 pt-4 space-y-2 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-700">小計</span>
                        <span className="font-medium">¥{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">使用ポイント</span>
                        <span className="text-red-600 font-medium">-¥{usedPoints.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">獲得ポイント（5%）</span>
                        <span className="text-green-600 font-medium">+{pointsEarned}pt</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">消費税（10%）</span>
                        <span className="font-medium">¥{tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                        <span>合計</span>
                        <span className="text-blue-600">¥{finalTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* 会計伝票URL生成 */}
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        会計伝票URL生成
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        遠隔地のお客様にメールで送信できる会計伝票のURLを生成します
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={generateCheckoutUrl}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                          URL生成
                        </button>
                        {checkoutUrl && (
                          <>
                            <input
                              type="text"
                              value={checkoutUrl}
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                            />
                            <button
                              onClick={copyToClipboard}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              コピー
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 決済方法選択 */}
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-900 mb-3">決済方法</h3>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="cash"
                            checked={paymentMethod === 'cash'}
                            onChange={() => setPaymentMethod('cash')}
                            className="mr-2"
                          />
                          <DollarSign className="w-4 h-4 mr-1" />
                          現金
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="credit"
                            checked={paymentMethod === 'credit'}
                            onChange={() => setPaymentMethod('credit')}
                            className="mr-2"
                          />
                          <CreditCard className="w-4 h-4 mr-1" />
                          クレジットカード
                        </label>
                      </div>
                    </div>

                    {/* 決済ボタン */}
                    <button
                      onClick={processPayment}
                      disabled={loading}
                      className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg font-medium"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          処理中...
                        </>
                      ) : (
                        <>
                          <Calculator className="w-5 h-5 mr-2" />
                          決済完了
                        </>
                      )}
                    </button>
                  </>
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
