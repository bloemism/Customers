import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  CreditCard,
  ArrowLeft,
  Search,
  User,
  Gift,
  Calculator
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const CheckoutScreen: React.FC = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');

  // サンプル商品データ
  const products: Product[] = [
    { id: '1', name: 'バラの花束', price: 3000, category: '花束', image: '/api/placeholder/100/100' },
    { id: '2', name: 'チューリップ', price: 800, category: '単品花', image: '/api/placeholder/100/100' },
    { id: '3', name: '観葉植物', price: 2500, category: '観葉植物', image: '/api/placeholder/100/100' },
    { id: '4', name: 'アレンジメント', price: 4000, category: 'アレンジメント', image: '/api/placeholder/100/100' },
    { id: '5', name: 'ギフトセット', price: 5000, category: 'ギフト', image: '/api/placeholder/100/100' }
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10%税
  const total = subtotal + tax;
  const pointsEarned = Math.floor(total * 0.01); // 1%ポイント還元

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'qr') {
      setShowQRModal(true);
    } else {
      // 通常の決済処理
      alert('決済が完了しました！');
      setCart([]);
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
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">お客様会計</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                担当: {user?.email || '開発モード'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 商品選択エリア */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">商品選択</h2>
              
              {/* 顧客選択 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  顧客選択
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="顧客名で検索..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 商品検索 */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="商品名・カテゴリーで検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 商品グリッド */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-green-300 transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <Gift className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                    <p className="text-lg font-bold text-green-600">¥{product.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* カート・決済エリア */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">カート</h2>
              
              {/* カートアイテム */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">カートが空です</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">{item.product.category}</p>
                        <p className="text-sm font-bold text-green-600">¥{item.product.price.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 合計 */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>小計:</span>
                  <span>¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>税 (10%):</span>
                  <span>¥{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>合計:</span>
                  <span>¥{total.toLocaleString()}</span>
                </div>
                <div className="text-sm text-green-600">
                  獲得ポイント: {pointsEarned}pt
                </div>
              </div>

              {/* 決済方法選択 */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">決済方法</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">現金</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">クレジットカード</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="qr"
                      checked={paymentMethod === 'qr'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">QR決済</span>
                  </label>
                </div>
              </div>

              {/* 決済ボタン */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full mt-6 btn-primary flex items-center justify-center space-x-2"
              >
                <Calculator className="h-4 w-4" />
                <span>決済完了</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QRコードモーダル */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">QRコード決済</h2>
            <div className="text-center">
              <div className="bg-gray-200 w-48 h-48 mx-auto mb-4 flex items-center justify-center">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">
                合計金額: ¥{total.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                スマートフォンでQRコードを読み取って決済を完了してください
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="btn-primary w-full"
              >
                決済完了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
