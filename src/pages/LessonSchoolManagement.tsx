import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  BookOpen
} from 'lucide-react';
import { useScrollToTopOnMount } from '../hooks/useScrollToTop';

// レッスンスクールの型定義
interface LessonSchool {
  id: string;
  name: string;
  prefecture: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  instructor_name: string;
  instructor_bio: string;
  lesson_content: string;
  main_days: string[];
  main_time: string;
  trial_price: number;
  regular_price: number;
  latitude: number;
  longitude: number;
  website_url?: string;
  instagram_url?: string;
  is_active: boolean;
  created_at: string;
}

// 新規作成用の型定義
interface NewLessonSchool {
  name: string;
  prefecture: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  instructor_name: string;
  instructor_bio: string;
  lesson_content: string;
  main_days: string[];
  main_time: string;
  trial_price: number;
  regular_price: number;
  latitude: number;
  longitude: number;
  website_url?: string;
  instagram_url?: string;
}

const LessonSchoolManagement: React.FC = () => {
  const { user } = useSimpleAuth();
  
  // ページマウント時にスクロール位置をトップにリセット
  useScrollToTopOnMount();
  
  // レッスンスクール一覧
  const [lessonSchools, setLessonSchools] = useState<LessonSchool[]>([]);
  
  // 新規作成・編集モード
  const [isEditing, setIsEditing] = useState(false);
  const [editingSchool, setEditingSchool] = useState<LessonSchool | null>(null);
  
  // 新規作成フォーム
  const [newSchool, setNewSchool] = useState<NewLessonSchool>({
    name: '',
    prefecture: '',
    city: '',
    address: '',
    email: '',
    phone: '',
    instructor_name: '',
    instructor_bio: '',
    lesson_content: '',
    main_days: [],
    main_time: '',
    trial_price: 0,
    regular_price: 0,
    latitude: 0,
    longitude: 0,
    website_url: '',
    instagram_url: ''
  });
  
  // ローディング状態
  const [loading, setLoading] = useState(true);
  
  // 成功・エラーメッセージ
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // レッスンスクールを読み込み
  useEffect(() => {
    const loadLessonSchools = async () => {
      if (!user?.email) {
        console.log('ユーザー情報が取得できません:', user);
        return;
      }
      
      try {
        setLoading(true);
        console.log('レッスンスクールを読み込み中... ユーザーEmail:', user.email);
        
        const { data, error } = await supabase
          .from('lesson_schools')
          .select('*')
          .eq('store_email', user.email)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('レッスンスクール読み込みエラー:', error);
          setMessage({ type: 'error', text: `レッスンスクールの読み込みに失敗しました: ${error.message}` });
        } else if (data) {
          console.log('読み込まれたレッスンスクール:', data);
          console.log('レッスンスクール数:', data.length);
          setLessonSchools(data);
        }
      } catch (error) {
        console.error('レッスンスクール読み込みエラー:', error);
        setMessage({ type: 'error', text: 'レッスンスクールの読み込みに失敗しました' });
      } finally {
        setLoading(false);
      }
    };

    loadLessonSchools();
  }, [user]);

  // 新規作成モードを開始
  const startCreate = () => {
    setIsEditing(true);
    setEditingSchool(null);
    setNewSchool({
      name: '',
      prefecture: '',
      city: '',
      address: '',
      email: '',
      phone: '',
      instructor_name: '',
      instructor_bio: '',
      lesson_content: '',
      main_days: [],
      main_time: '',
      trial_price: 0,
      regular_price: 0,
      latitude: 0,
      longitude: 0
    });
  };

  // 編集モードを開始
  const startEdit = (school: LessonSchool) => {
    setIsEditing(true);
    setEditingSchool(school);
    setNewSchool({
      name: school.name,
      prefecture: school.prefecture,
      city: school.city,
      address: school.address,
      email: school.email,
      phone: school.phone,
      instructor_name: school.instructor_name,
      instructor_bio: school.instructor_bio,
      lesson_content: school.lesson_content,
      main_days: school.main_days,
      main_time: school.main_time,
      trial_price: school.trial_price,
      regular_price: school.regular_price,
      latitude: school.latitude,
      longitude: school.longitude,
      website_url: school.website_url || '',
      instagram_url: school.instagram_url || ''
    });
  };

  // 編集・作成をキャンセル
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingSchool(null);
    setNewSchool({
      name: '',
      prefecture: '',
      city: '',
      address: '',
      email: '',
      phone: '',
      instructor_name: '',
      instructor_bio: '',
      lesson_content: '',
      main_days: [],
      main_time: '',
      trial_price: 0,
      regular_price: 0,
      latitude: 0,
      longitude: 0,
      website_url: '',
      instagram_url: ''
    });
  };

  // 曜日の選択を切り替え
  const toggleDay = (day: string) => {
    setNewSchool(prev => ({
      ...prev,
      main_days: prev.main_days.includes(day)
        ? prev.main_days.filter(d => d !== day)
        : [...prev.main_days, day]
    }));
  };

  // 保存処理
  const handleSave = async () => {
    if (!user?.email) {
      setMessage({ type: 'error', text: 'ユーザー情報が取得できません' });
      return;
    }

    // バリデーション
    if (!newSchool.name || !newSchool.prefecture || !newSchool.city) {
      setMessage({ type: 'error', text: '必須項目を入力してください' });
      return;
    }

    try {
      if (editingSchool) {
        // 更新処理（両テーブルに保存）
        const { error } = await supabase
          .from('lesson_schools')
          .update({
            ...newSchool,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSchool.id);

        if (error) {
          throw error;
        }

        setMessage({ type: 'success', text: 'レッスンスクールを更新しました' });
      } else {
        // 新規作成処理（両テーブルに保存）
        const { data: insertData, error } = await supabase
          .from('lesson_schools')
          .insert({
            ...newSchool,
            store_email: user.email,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error('詳細なエラー情報:', error);
          throw new Error(`データベースエラー: ${error.message} (コード: ${error.code})`);
        }

        console.log('挿入されたデータ:', insertData);

        setMessage({ type: 'success', text: 'レッスンスクールを作成しました' });
      }

      // 一覧を再読み込み
      const { data } = await supabase
        .from('lesson_schools')
        .select('*')
        .eq('store_email', user.email)
        .order('created_at', { ascending: false });

      if (data) {
        setLessonSchools(data);
      }

      // 編集モードを終了
      cancelEdit();
    } catch (error) {
      console.error('保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '保存に失敗しました';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    if (!confirm('このレッスンスクールを削除しますか？')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_schools')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'レッスンスクールを削除しました' });
      
      // 一覧から削除
      setLessonSchools(prev => prev.filter(school => school.id !== id));
    } catch (error) {
      console.error('削除エラー:', error);
      setMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">レッスンスクール情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-white hover:text-teal-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">レッスンスクール管理</h1>
                <p className="text-teal-100 text-sm sm:text-base hidden sm:block">フラワーレッスンスクールの情報を管理</p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={startCreate}
                className="w-full sm:w-auto px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                新規作成
              </button>
            )}
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 編集・作成フォーム */}
        {isEditing && (
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm p-4 sm:p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSchool ? 'レッスンスクール編集' : '新規レッスンスクール作成'}
            </h2>
            
            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    スクール名（店舗名のみ） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="店舗名のみを入力（講座名は含めない）"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      都道府県 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSchool.prefecture}
                      onChange={(e) => setNewSchool(prev => ({ ...prev, prefecture: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="都道府県"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      市区町村 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSchool.city}
                      onChange={(e) => setNewSchool(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="市区町村"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    住所（町名まで）
                  </label>
                  <input
                    type="text"
                    value={newSchool.address}
                    onChange={(e) => setNewSchool(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="町名まで入力"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={newSchool.email}
                      onChange={(e) => setNewSchool(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="メールアドレス"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      value={newSchool.phone}
                      onChange={(e) => setNewSchool(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="電話番号"
                    />
                  </div>
                </div>

                {/* URL情報 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🌐 ウェブサイトURL
                    </label>
                    <input
                      type="url"
                      value={newSchool.website_url || ''}
                      onChange={(e) => setNewSchool(prev => ({ ...prev, website_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📸 Instagram URL
                    </label>
                    <input
                      type="url"
                      value={newSchool.instagram_url || ''}
                      onChange={(e) => setNewSchool(prev => ({ ...prev, instagram_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://instagram.com/your_account"
                    />
                  </div>
                </div>
              </div>

              {/* レッスン情報 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    先生のお名前
                  </label>
                  <input
                    type="text"
                    value={newSchool.instructor_name}
                    onChange={(e) => setNewSchool(prev => ({ ...prev, instructor_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="先生のお名前"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    先生の経歴
                  </label>
                  <textarea
                    value={newSchool.instructor_bio}
                    onChange={(e) => setNewSchool(prev => ({ ...prev, instructor_bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="先生の経歴や資格などを入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    レッスン内容
                  </label>
                  <textarea
                    value={newSchool.lesson_content}
                    onChange={(e) => setNewSchool(prev => ({ ...prev, lesson_content: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="レッスンの内容や特徴を入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    主な開催曜日
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {['月', '火', '水', '木', '金', '土', '日'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          newSchool.main_days.includes(day)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    主な開催時間
                  </label>
                  <input
                    type="text"
                    value={newSchool.main_time}
                    onChange={(e) => setNewSchool(prev => ({ ...prev, main_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 10:00-12:00"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      体験料金
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                      <input
                        type="number"
                        value={newSchool.trial_price}
                        onChange={(e) => setNewSchool(prev => ({ ...prev, trial_price: parseInt(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      通常料金
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                      <input
                        type="number"
                        value={newSchool.regular_price}
                        onChange={(e) => setNewSchool(prev => ({ ...prev, regular_price: parseInt(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={cancelEdit}
                className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingSchool ? '更新' : '作成'}
              </button>
            </div>
          </div>
        )}

        {/* レッスンスクール一覧 */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">登録済みレッスンスクール</h2>
          
          {lessonSchools.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>登録されたレッスンスクールがありません</p>
              <p className="text-sm mt-2">新規作成ボタンから追加してください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessonSchools.map((school) => (
                <div
                  key={school.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {school.name}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{school.prefecture} {school.city}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{school.instructor_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{school.main_days.join(', ')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{school.main_time}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        {school.lesson_content.length > 100
                          ? `${school.lesson_content.substring(0, 100)}...`
                          : school.lesson_content
                        }
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm">
                        <span className="text-green-600 font-medium">
                          体験料金: ¥{school.trial_price.toLocaleString()}
                        </span>
                        <span className="text-blue-600 font-medium">
                          通常料金: ¥{school.regular_price.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* URL情報の表示 */}
                      {(school.website_url || school.instagram_url) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {school.website_url && (
                            <a
                              href={school.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors"
                            >
                              🌐 ウェブサイト
                            </a>
                          )}
                          {school.instagram_url && (
                            <a
                              href={school.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs rounded-full hover:from-purple-200 hover:to-pink-200 transition-colors"
                            >
                              📸 Instagram
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4">
                      <button
                        onClick={() => startEdit(school)}
                        className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(school.id)}
                        className="w-full sm:w-auto px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonSchoolManagement;

