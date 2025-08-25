import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Database, Download, Upload } from 'lucide-react';

// 品目カテゴリの型定義
interface FlowerItemCategory {
  id: string;
  store_id: string; // 文字列として扱う
  name: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 色カテゴリの型定義
interface ColorCategory {
  id: string;
  store_id: string; // 文字列として扱う
  name: string;
  hex_code: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 店舗情報の型定義
interface Store {
  id: string;
  name: string; // 表示用の店舗名
  owner_id: string;
}

const ProductManagement: React.FC = () => {
  const { user } = useSimpleAuth();
  
  // 店舗情報
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  
  // 品目カテゴリ（最大30個）
  const [flowerItemCategories, setFlowerItemCategories] = useState<FlowerItemCategory[]>([]);
  
  // 色カテゴリ（最大10個）
  const [colorCategories, setColorCategories] = useState<ColorCategory[]>([]);

  // 編集状態
  const [editingFlowerItem, setEditingFlowerItem] = useState<FlowerItemCategory | null>(null);
  const [editingColor, setEditingColor] = useState<ColorCategory | null>(null);
  const [showAddFlowerItem, setShowAddFlowerItem] = useState(false);
  const [showAddColor, setShowAddColor] = useState(false);

  // 新規追加フォーム
  const [newFlowerItem, setNewFlowerItem] = useState({
    name: '',
    display_order: 1 // sort_orderからdisplay_orderに変更
  });

  const [newColor, setNewColor] = useState({
    name: '',
    hex_code: '#000000',
    display_order: 1 // sort_orderからdisplay_orderに変更
  });

  // 保存状態
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // 店舗情報を読み込み
  useEffect(() => {
    if (user) {
      loadStoreData();
    }
  }, [user]);

  // 店舗データを読み込み
  const loadStoreData = async () => {
    if (!user) return;
    
    try {
      setStoreLoading(true);
      
      // 既存のstoresテーブル構造に合わせて、emailフィールドで店舗データを取得
      const { data: stores, error } = await supabase
        .from('stores')
        .select('id, store_name, email') // nameではなくstore_name
        .eq('email', user.email)
        .single();

      if (error) {
        console.log('店舗データが見つかりません:', error.message);
        setStore(null);
      } else {
        setStore({
          id: stores.id,
          name: stores.store_name, // store_nameフィールドから取得
          owner_id: stores.email
        });
        // 店舗データがある場合は、カテゴリデータを読み込み
        await loadCategoriesFromSupabase(stores.id);
      }
    } catch (error) {
      console.error('店舗データ読み込みエラー:', error);
      setStore(null);
    } finally {
      setStoreLoading(false);
    }
  };

  // Supabaseからカテゴリデータを読み込み
  const loadCategoriesFromSupabase = async (storeId: string) => {
    try {
      setStoreLoading(true);
      
      // 品目カテゴリを読み込み
      const { data: flowerItems, error: flowerError } = await supabase
        .from('flower_item_categories')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order');

      if (flowerError) {
        console.error('品目カテゴリ読み込みエラー:', flowerError);
      } else {
        setFlowerItemCategories(flowerItems || []);
      }

      // 色カテゴリを読み込み
      const { data: colors, error: colorError } = await supabase
        .from('color_categories')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order');

      if (colorError) {
        console.error('色カテゴリ読み込みエラー:', colorError);
      } else {
        setColorCategories(colors || []);
      }
    } catch (error) {
      console.error('カテゴリデータ読み込みエラー:', error);
    } finally {
      setStoreLoading(false);
    }
  };

  // 品目カテゴリの追加
  const addFlowerItemCategory = async () => {
    if (!store) {
      alert('店舗情報が見つかりません');
      return;
    }

    if (flowerItemCategories.length >= 30) {
      alert('品目カテゴリは最大30個まで登録できます');
      return;
    }

    if (!newFlowerItem.name.trim()) {
      alert('品目名を入力してください');
      return;
    }

    const newItem: Omit<FlowerItemCategory, 'id' | 'created_at' | 'updated_at'> = {
      store_id: store.id,
      name: newFlowerItem.name.trim(),
      display_order: flowerItemCategories.length + 1, // 新しいアイテムは最後に追加
      is_active: true
    };

    try {
      const { data, error } = await supabase
        .from('flower_item_categories')
        .insert([newItem])
        .select()
        .single();

        if (error) {
        console.error('品目カテゴリ追加エラー:', error);
        alert('品目カテゴリの追加に失敗しました');
        return;
      }

      setFlowerItemCategories([...flowerItemCategories, data]);
      setNewFlowerItem({ name: '', display_order: flowerItemCategories.length + 2 });
      setShowAddFlowerItem(false);
      
      // 保存完了を記録
      setLastSaved(new Date().toLocaleString());
    } catch (error) {
      console.error('品目カテゴリ追加エラー:', error);
      alert('品目カテゴリの追加に失敗しました');
    }
  };

  // 色カテゴリの追加
  const addColorCategory = async () => {
    if (!store) {
      alert('店舗情報が見つかりません');
      return;
    }

    if (colorCategories.length >= 10) {
      alert('色カテゴリは最大10個まで登録できます');
      return;
    }

    if (!newColor.name.trim()) {
      alert('色名を入力してください');
      return;
    }

    const newColorItem: Omit<ColorCategory, 'id' | 'created_at' | 'updated_at'> = {
      store_id: store.id,
      name: newColor.name.trim(),
      hex_code: newColor.hex_code,
      display_order: colorCategories.length + 1, // 新しいカラーは最後に追加
      is_active: true
    };

    try {
      const { data, error } = await supabase
        .from('color_categories')
        .insert([newColorItem])
        .select()
        .single();

      if (error) {
        console.error('色カテゴリ追加エラー:', error);
        alert('色カテゴリの追加に失敗しました');
        return;
      }

      setColorCategories([...colorCategories, data]);
      setNewColor({ name: '', hex_code: '#000000', display_order: colorCategories.length + 2 });
      setShowAddColor(false);
      
      // 保存完了を記録
      setLastSaved(new Date().toLocaleString());
    } catch (error) {
      console.error('色カテゴリ追加エラー:', error);
      alert('色カテゴリの追加に失敗しました');
    }
  };

  // 品目カテゴリの編集
  const editFlowerItemCategory = (item: FlowerItemCategory) => {
    setEditingFlowerItem(item);
  };

  // 色カテゴリの編集
  const editColorCategory = (color: ColorCategory) => {
    setEditingColor(color);
  };

  // 品目カテゴリの保存
  const saveFlowerItemCategory = async () => {
    if (!editingFlowerItem) return;

    try {
      setSaving(true);
      
        const { error } = await supabase
        .from('flower_item_categories')
          .update({
          name: editingFlowerItem.name,
          display_order: editingFlowerItem.display_order // display_orderも更新
        })
        .eq('id', editingFlowerItem.id);

        if (error) {
        console.error('品目カテゴリ更新エラー:', error);
        alert('品目カテゴリの更新に失敗しました');
        return;
      }

      setFlowerItemCategories(flowerItemCategories.map(item =>
        item.id === editingFlowerItem.id ? editingFlowerItem : item
      ));
      setEditingFlowerItem(null);
      
      // 保存完了を記録
      setLastSaved(new Date().toLocaleString());
      } catch (error) {
      console.error('品目カテゴリ更新エラー:', error);
      alert('品目カテゴリの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 色カテゴリの保存
  const saveColorCategory = async () => {
    if (!editingColor) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('color_categories')
        .update({
          name: editingColor.name,
          hex_code: editingColor.hex_code,
          display_order: editingColor.display_order // display_orderも更新
        })
        .eq('id', editingColor.id);

      if (error) {
        console.error('色カテゴリ更新エラー:', error);
        alert('色カテゴリの更新に失敗しました');
        return;
      }

      setColorCategories(colorCategories.map(color =>
        color.id === editingColor.id ? editingColor : color
      ));
      setEditingColor(null);
      
      // 保存完了を記録
      setLastSaved(new Date().toLocaleString());
    } catch (error) {
      console.error('色カテゴリ更新エラー:', error);
      alert('色カテゴリの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 品目カテゴリの削除
  const deleteFlowerItemCategory = async (id: string) => {
    if (!confirm('この品目カテゴリを削除しますか？')) return;

      try {
        const { error } = await supabase
        .from('flower_item_categories')
        .update({ is_active: false })
          .eq('id', id);

        if (error) {
        console.error('品目カテゴリ削除エラー:', error);
        alert('品目カテゴリの削除に失敗しました');
        return;
      }

      setFlowerItemCategories(flowerItemCategories.filter(item => item.id !== id));
      
      // 保存完了を記録
      setLastSaved(new Date().toLocaleString());
    } catch (error) {
      console.error('品目カテゴリ削除エラー:', error);
      alert('品目カテゴリの削除に失敗しました');
    }
  };

  // 色カテゴリの削除
  const deleteColorCategory = async (id: string) => {
    if (!confirm('この色カテゴリを削除しますか？')) return;

      try {
        const { error } = await supabase
        .from('color_categories')
        .update({ is_active: false })
        .eq('id', id);

        if (error) {
        console.error('色カテゴリ削除エラー:', error);
        alert('色カテゴリの削除に失敗しました');
        return;
      }

      setColorCategories(colorCategories.filter(color => color.id !== id));
      
      // 保存完了を記録
      setLastSaved(new Date().toLocaleString());
    } catch (error) {
      console.error('色カテゴリ削除エラー:', error);
      alert('色カテゴリの削除に失敗しました');
    }
  };

  // 全データをSupabaseに保存
  const saveAllData = async () => {
    if (!store) {
      alert('店舗情報が見つかりません');
      return;
    }

    try {
      setSaving(true);
      
      // 品目カテゴリの一括更新
      for (const item of flowerItemCategories) {
        if (item.id.startsWith('temp_')) {
          // 新規アイテムの場合
          const { error } = await supabase
            .from('flower_item_categories')
            .insert({
              store_id: store.id,
              name: item.name,
              display_order: item.display_order, // display_orderも保存
              is_active: true
            });

          if (error) {
            console.error('品目カテゴリ保存エラー:', error);
            alert('品目カテゴリの保存に失敗しました');
            return;
          }
        }
      }

      // 色カテゴリの一括更新
      for (const color of colorCategories) {
        if (color.id.startsWith('temp_')) {
          // 新規カラーの場合
          const { error } = await supabase
            .from('color_categories')
            .insert({
              store_id: store.id,
              name: color.name,
              hex_code: color.hex_code,
              display_order: color.display_order, // display_orderも保存
              is_active: true
            });

          if (error) {
            console.error('色カテゴリ保存エラー:', error);
            alert('色カテゴリの保存に失敗しました');
            return;
          }
        }
      }

      // 保存完了を記録
      setLastSaved(new Date().toLocaleString());
      alert('全データが保存されました！');
      
      // データを再読み込み
      await loadCategoriesFromSupabase(store.id);
    } catch (error) {
      console.error('全データ保存エラー:', error);
      alert('データの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // ローディング中
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

  // 店舗情報がない場合
  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">店舗情報が見つかりません</h2>
          <p className="text-gray-600 mb-6">商品管理ページにアクセスするには店舗登録が必要です</p>
          <button
            onClick={() => window.location.href = '/store-registration'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            店舗登録へ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">商品管理</h1>
              <p className="mt-2 text-pink-100">品目・色の管理でお客様会計を効率化</p>
              {store && (
                <p className="mt-1 text-sm text-pink-200">
                  🏪 店舗: {store.name}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={saveAllData}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-white text-pink-600 rounded-lg hover:bg-pink-50 disabled:opacity-50 transition-colors"
              >
                <Database className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '全データ保存'}
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex items-center px-4 py-2 text-white hover:text-pink-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                戻る
              </button>
            </div>
          </div>
          
          {/* 保存状態表示 */}
          {lastSaved && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ 最終保存: {lastSaved}
              </p>
        </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 品目カテゴリ管理 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                品目カテゴリ管理
                <span className="ml-2 text-sm text-gray-500">
                  ({flowerItemCategories.length}/30)
                </span>
              </h2>
              {flowerItemCategories.length < 30 && (
                <button
                  onClick={() => setShowAddFlowerItem(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  追加
                </button>
              )}
            </div>

            {/* 品目カテゴリリスト */}
            <div className="space-y-3">
              {flowerItemCategories.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingFlowerItem?.id === item.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                        value={editingFlowerItem.name}
                        onChange={(e) => setEditingFlowerItem({...editingFlowerItem, name: e.target.value})}
                        className="flex-1 px-2 py-1 border rounded"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {editingFlowerItem?.id === item.id ? (
                      <>
                        <button
                          onClick={saveFlowerItemCategory}
                          disabled={saving}
                          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingFlowerItem(null)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => editFlowerItemCategory(item)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFlowerItemCategory(item.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 新規追加フォーム */}
            {showAddFlowerItem && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">新規品目カテゴリ追加</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newFlowerItem.name}
                    onChange={(e) => setNewFlowerItem({...newFlowerItem, name: e.target.value})}
                    placeholder="品目名"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                          <div className="flex space-x-2">
                            <button
                      onClick={addFlowerItemCategory}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                      追加
                            </button>
                            <button
                      onClick={() => setShowAddFlowerItem(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                              キャンセル
                            </button>
                          </div>
                </div>
              </div>
            )}
          </div>

          {/* 色カテゴリ管理 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                色カテゴリ管理
                <span className="ml-2 text-sm text-gray-500">
                  ({colorCategories.length}/10)
                </span>
              </h2>
              {colorCategories.length < 10 && (
                <button
                  onClick={() => setShowAddColor(true)}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  追加
                </button>
              )}
            </div>

            {/* 色カテゴリリスト */}
            <div className="space-y-3">
              {colorCategories.map((color) => (
                <div key={color.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingColor?.id === color.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingColor.name}
                        onChange={(e) => setEditingColor({...editingColor, name: e.target.value})}
                        className="flex-1 px-2 py-1 border rounded"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{color.name}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {editingColor?.id === color.id ? (
                      <>
                        <button
                          onClick={saveColorCategory}
                          disabled={saving}
                          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingColor(null)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => editColorCategory(color)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteColorCategory(color.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 新規追加フォーム */}
            {showAddColor && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">新規色カテゴリ追加</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newColor.name}
                    onChange={(e) => setNewColor({...newColor, name: e.target.value})}
                    placeholder="色名"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">色:</span>
                    <input
                      type="color"
                      value={newColor.hex_code}
                      onChange={(e) => setNewColor({...newColor, hex_code: e.target.value})}
                      className="w-12 h-10 border rounded"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={addColorCategory}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => setShowAddColor(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      キャンセル
                    </button>
          </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 説明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">このページについて</h3>
          <div className="text-gray-700 space-y-2">
            <p>• 品目カテゴリは最大30個まで登録できます</p>
            <p>• 色カテゴリは最大10個まで登録できます</p>
            <p>• 登録した品目・色は、お客様会計ページで自動変換の候補として表示されます</p>
            <p>• 品目名や色名を入力すると、登録済みのデータから自動的に候補が表示されます</p>
            <p>• データは店舗ごとに管理され、Supabaseに保存されます</p>
            <p>• 「全データ保存」ボタンで、変更内容を確実に保存できます</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
