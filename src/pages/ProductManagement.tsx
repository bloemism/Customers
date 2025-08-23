import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';

// 品目・色の組み合わせの型定義
interface ProductItem {
  id: string;
  name: string;
  category: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
}

interface Store {
  id: string;
  name: string;
  owner_id: string;
}

const ProductManagement: React.FC = () => {
  const { user } = useSimpleAuth();
  
  // 店舗情報
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  
  // デフォルトの品目・色の組み合わせ（ローカルモード用）
  const [productItems, setProductItems] = useState<ProductItem[]>([
    { id: '1', name: 'バラ', category: '花', color: '赤', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '2', name: 'バラ', category: '花', color: '白', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '3', name: 'バラ', category: '花', color: 'ピンク', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '4', name: 'アルストロメリア', category: '花', color: '白', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '5', name: 'アルストロメリア', category: '花', color: 'ピンク', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '6', name: 'アレンジメント', category: 'アレンジメント', color: 'ピンク', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '7', name: 'アレンジメント', category: 'アレンジメント', color: '白', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '8', name: '花束', category: '花束', color: '赤', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '9', name: '花束', category: '花束', color: 'ピンク', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '10', name: '鉢物', category: '鉢物', color: '緑', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' }
  ]);

  const [categories, setCategories] = useState<ProductCategory[]>([
    { id: '1', name: '花', description: '切り花' },
    { id: '2', name: 'アレンジメント', description: '花のアレンジメント' },
    { id: '3', name: '花束', description: '花束' },
    { id: '4', name: '鉢物', description: '鉢植えの花' },
    { id: '5', name: '季節の花', description: '季節限定の花' }
  ]);

  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 新規品目追加フォーム
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    color: ''
  });

  // 品目カテゴリ（30種類まで登録可能）
  const productCategories = [
    'バラ', 'アルストロメリア', 'アレンジメント', '花束', '鉢物', 
    '季節の花', 'ガラス', '資材', 'ブーケ', 'コサージュ',
    'リース', '花器', 'ラッピング', 'リボン', '花束台', '花瓶',
    '植木鉢', '肥料', '土', '種', '球根', '苗', '切り花',
    'ドライフラワー', 'プリザーブドフラワー', 'アーティフィシャルフラワー',
    '花の小物', '花の本', '花の雑誌'
  ];

  // 色の選択肢（10色程度）
  const productColors = [
    '赤', '白', 'ピンク', '黄', '青', '紫', 'オレンジ', '緑', '茶色', '黒'
  ];

  // 店舗情報を読み込み
  useEffect(() => {
    if (user) {
      loadStoreData();
    }
  }, [user]);

  const loadStoreData = async () => {
    if (!user) return;
    
    try {
      setStoreLoading(true);
      
      // 店舗データを取得
      const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.log('店舗データが見つかりません（ローカルモードで動作）:', error.message);
        setStore(null);
      } else {
        setStore(stores);
        // 店舗データがある場合は、Supabaseから商品データを読み込み
        await loadProductItemsFromSupabase(stores.id);
      }
    } catch (error) {
      console.error('店舗データ読み込みエラー:', error);
      setStore(null);
    } finally {
      setStoreLoading(false);
    }
  };

  // Supabaseから商品データを読み込み
  const loadProductItemsFromSupabase = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_items')
        .select('*')
        .eq('store_id', storeId);

      if (error) {
        console.log('商品データの読み込みに失敗（ローカルモードで動作）:', error.message);
      } else if (data && data.length > 0) {
        setProductItems(data);
      }
    } catch (error) {
      console.error('商品データ読み込みエラー:', error);
    }
  };

  // 品目追加（ローカル + Supabase）
  const addItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.color) {
      alert('全ての項目を入力してください');
      return;
    }

    // 重複チェック
    const isDuplicate = productItems.some(item => 
      item.name === newItem.name && item.color === newItem.color
    );

    if (isDuplicate) {
      alert('同じ品目・色の組み合わせは既に登録されています');
      return;
    }

    const item: ProductItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      color: newItem.color,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // ローカルに追加
    setProductItems([...productItems, item]);
    setNewItem({ name: '', category: '', color: '' });
    setShowAddForm(false);

    // Supabaseにも保存（店舗データがある場合）
    if (store) {
      try {
        const { error } = await supabase
          .from('product_items')
          .insert({
            store_id: store.id,
            name: item.name,
            category: item.category,
            color: item.color,
            is_active: item.is_active
          });

        if (error) {
          console.error('Supabase保存エラー:', error);
          alert('品目・色の組み合わせを追加しました（ローカル保存のみ）');
        } else {
          alert('品目・色の組み合わせを追加しました（Supabaseにも保存）');
        }
      } catch (error) {
        console.error('Supabase保存エラー:', error);
        alert('品目・色の組み合わせを追加しました（ローカル保存のみ）');
      }
    } else {
      alert('品目・色の組み合わせを追加しました（ローカル保存）');
    }
  };

  // 品目更新（ローカル + Supabase）
  const updateItem = async (item: ProductItem) => {
    if (!item.name || !item.category || !item.color) {
      alert('全ての項目を入力してください');
      return;
    }

    const updatedItems = productItems.map(p => 
      p.id === item.id ? { ...item, updated_at: new Date().toISOString() } : p
    );
    setProductItems(updatedItems);
    setEditingItem(null);

    // Supabaseにも更新（店舗データがある場合）
    if (store) {
      try {
        const { error } = await supabase
          .from('product_items')
          .update({
            name: item.name,
            category: item.category,
            color: item.color,
            is_active: item.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) {
          console.error('Supabase更新エラー:', error);
          alert('品目・色の組み合わせを更新しました（ローカル保存のみ）');
        } else {
          alert('品目・色の組み合わせを更新しました（Supabaseにも保存）');
        }
      } catch (error) {
        console.error('Supabase更新エラー:', error);
        alert('品目・色の組み合わせを更新しました（ローカル保存のみ）');
      }
    } else {
      alert('品目・色の組み合わせを更新しました（ローカル保存）');
    }
  };

  // 品目削除（ローカル + Supabase）
  const deleteItem = async (id: string) => {
    if (!confirm('この品目・色の組み合わせを削除しますか？')) return;

    setProductItems(productItems.filter(p => p.id !== id));

    // Supabaseからも削除（店舗データがある場合）
    if (store) {
      try {
        const { error } = await supabase
          .from('product_items')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Supabase削除エラー:', error);
          alert('品目・色の組み合わせを削除しました（ローカル保存のみ）');
        } else {
          alert('品目・色の組み合わせを削除しました（Supabaseからも削除）');
        }
      } catch (error) {
        console.error('Supabase削除エラー:', error);
        alert('品目・色の組み合わせを削除しました（ローカル保存のみ）');
      }
    } else {
      alert('品目・色の組み合わせを削除しました（ローカル保存）');
    }
  };

  // 品目状態切り替え（ローカル + Supabase）
  const toggleItemStatus = async (item: ProductItem) => {
    const updatedItems = productItems.map(p => 
      p.id === item.id ? { ...p, is_active: !p.is_active, updated_at: new Date().toISOString() } : p
    );
    setProductItems(updatedItems);

    // Supabaseにも更新（店舗データがある場合）
    if (store) {
      try {
        const { error } = await supabase
          .from('product_items')
          .update({
            is_active: !item.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) {
          console.error('Supabase状態更新エラー:', error);
        }
      } catch (error) {
        console.error('Supabase状態更新エラー:', error);
      }
    }
  };

  // 検索・フィルタリング
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const filteredItems = productItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesColor = !selectedColor || item.color === selectedColor;
    
    return matchesSearch && matchesCategory && matchesColor;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">品目管理ページにアクセスするにはログインしてください</p>
        </div>
      </div>
    );
  }

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">店舗情報を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">品目・色管理</h1>
          <p className="mt-2 text-gray-600">会計時の品目入力と色選択をスムーズにするための辞書を管理します</p>
          
          {/* 店舗情報の表示 */}
          {store ? (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                🏪 <strong>店舗: {store.name}</strong> - Supabaseと連携して動作中
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>店舗データが見つかりません</strong> - ローカルモードで動作中
              </p>
              <div className="mt-2">
                <button
                  onClick={() => window.location.href = '/store-registration'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  店舗登録へ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">検索・フィルター</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">検索</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="品目名やカテゴリで検索"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全て</option>
                {productCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全て</option>
                {productColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedColor('');
                }}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        </div>

        {/* 新規品目追加ボタン */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-2">+</span>
            {showAddForm ? 'フォームを隠す' : '新規品目・色追加'}
          </button>
        </div>

        {/* 新規品目追加フォーム */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">新規品目・色追加</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品目名</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: バラ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {productCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
                <select
                  value={newItem.color}
                  onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {productColors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={addItem}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 品目一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              品目・色一覧 ({filteredItems.length}件 / 全{productItems.length}件)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品目名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      品目が見つかりません
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingItem?.id === item.id ? (
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingItem?.id === item.id ? (
                          <select
                            value={editingItem.category}
                            onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {productCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">{item.category}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingItem?.id === item.id ? (
                          <select
                            value={editingItem.color}
                            onChange={(e) => setEditingItem({...editingItem, color: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {productColors.map(color => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">{item.color}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleItemStatus(item)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.is_active ? '有効' : '無効'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingItem?.id === item.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateItem(editingItem)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              キャンセル
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🌺</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">総品目数</p>
                <p className="text-2xl font-semibold text-gray-900">{productItems.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">有効品目</p>
                <p className="text-2xl font-semibold text-gray-900">{productItems.filter(p => p.is_active).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎨</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">カテゴリ数</p>
                <p className="text-2xl font-semibold text-gray-900">{new Set(productItems.map(p => p.category)).size}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 使用方法の説明 */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">📖 使用方法</h3>
          <div className="text-sm text-green-700 space-y-2">
            <p><strong>1. 品目・色の登録</strong></p>
            <p>• よく使う花の品目（バラ、アルストロメリアなど）と色（赤、白、ピンクなど）の組み合わせを登録</p>
            <p>• 最大30種類まで登録可能</p>
            <p><strong>2. 会計時の使用</strong></p>
            <p>• 会計画面で品目名を入力すると、登録済みの品目が候補として表示</p>
            <p>• 色も選択できるので、正確な商品特定が可能</p>
            <p>• 価格や本数は会計時にその場で入力</p>
          </div>
        </div>

        {/* 今後の予定 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">🚀 今後の開発予定</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 会計画面との連携（品目候補の自動表示）</li>
            <li>• 品目使用頻度の統計</li>
            <li>• 季節別品目の管理</li>
            <li>• データエクスポート機能</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
