import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { supabase } from '../lib/supabase';
import { BankAccountValidator } from '../utils/bankAccountValidation';
import { 
  ArrowLeft,
  Save,
  Flower,
  Image,
  MessageSquare,
  Tag,
  Plus,
  X,
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// 店舗情報の型定義
interface Store {
  id: string;
  store_name: string; // nameではなくstore_name
  address: string; // 住所
  phone: string | null; // 電話番号
  email: string | null; // メールアドレス
  website: string | null; // ウェブサイト
  instagram: string | null; // Instagram
  business_hours: string | null; // 営業時間
  parking: boolean; // 駐車場
  description: string | null; // 店舗説明
  is_active: boolean; // 有効/無効
  created_at: string;
  updated_at: string;
}

// 店舗画像の型定義
interface StoreImage {
  id: string;
  store_id: string;
  image_url: string;
  image_type: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

// 店舗掲示板の型定義
interface StoreBulletin {
  id: string;
  store_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 店舗タグの型定義
interface StoreTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

// 銀行口座情報の型定義
interface BankAccount {
  id: string;
  store_id: string;
  bank_name: string;
  branch_name: string;
  account_type: string; // '普通' | '当座'
  account_number: string;
  account_holder: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// フォームデータの型定義
interface StoreFormData {
  store_name: string; // nameではなくstore_name
  address: string; // 住所
  phone: string; // 電話番号
  email: string; // メールアドレス
  website: string; // ウェブサイト
  instagram: string; // Instagram
  online_shop: string; // オンラインショップ
  business_hours: string; // 営業時間
  parking: boolean; // 駐車場
  description: string; // 店舗説明
  // 銀行口座情報
  bank_name: string;
  branch_name: string;
  account_type: string;
  account_number: string;
  account_holder: string;
}

export const StoreRegistration: React.FC = () => {
  // const navigate = useNavigate();
  const { user } = useSimpleAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingStore, setExistingStore] = useState<Store | null>(null);
  const [bankValidation, setBankValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: false, errors: [], warnings: [] });
  // const [storeImages, setStoreImages] = useState<StoreImage[]>([]);
  // const [storeBulletins, setStoreBulletins] = useState<StoreBulletin[]>([]);
  // const [storeTags, setStoreTags] = useState<StoreTag[]>([]);
  // const [availableTags, setAvailableTags] = useState<StoreTag[]>([]);
  // const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 掲示板作成用の状態
  // const [showBulletinModal, setShowBulletinModal] = useState(false);
  // const [newBulletin, setNewBulletin] = useState({
  //   title: '',
  //   content: '',
  //   is_pinned: false
  // });

  // フォームデータ
  const [formData, setFormData] = useState<StoreFormData>({
    store_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    online_shop: '',
    business_hours: '',
    parking: false,
    description: '',
    // 銀行口座情報
    bank_name: '',
    branch_name: '',
    account_type: '普通',
    account_number: '',
    account_holder: ''
  });

  // 既存の店舗情報を読み込み
  useEffect(() => {
    if (user) {
      loadExistingStore();
      loadAvailableTags();
    }
  }, [user]);

  const loadExistingStore = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('店舗データ読み込み開始:', user.email);
      
      // 既存のstoresテーブル構造に合わせて、emailフィールドで店舗データを取得
      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('email', user.email) // owner_idではなくemailフィールドを使用
        .single();

      if (error) {
        console.log('店舗データが見つかりません:', error.message);
        setExistingStore(null);
        // 新規作成の場合は、ユーザーのメールアドレスをフォームに設定
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }));
      } else {
        console.log('既存店舗データ取得成功:', stores);
        setExistingStore(stores);
        setFormData({
          store_name: stores.store_name || stores.name || '',
          address: stores.address || '',
          phone: stores.phone || '',
          email: stores.email || user.email || '',
          website: stores.website || '',
          instagram: stores.instagram || '',
          online_shop: stores.online_shop || '',
          business_hours: stores.business_hours || '',
          parking: stores.parking || false,
          description: stores.description || '',
          // 銀行口座情報（既存データがない場合は空文字）
          bank_name: stores.bank_name || '',
          branch_name: stores.branch_name || '',
          account_type: stores.account_type || '普通',
          account_number: stores.account_number || '',
          account_holder: stores.account_holder || ''
        });

        // 店舗画像、掲示板、タグ、銀行口座情報を読み込み
        await loadStoreImages(stores.id);
        await loadStoreBulletins(stores.id);
        await loadStoreTags(stores.id);
        await loadBankAccountInfo(stores.id);
      }
    } catch (err) {
      console.error('店舗情報読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTags = async () => {
    try {
      console.log('タグ読み込み開始...');
      const { data, error } = await supabase
        .from('store_tags')
        .select('*')
        .order('name');

      if (error) {
        console.error('タグ読み込みエラー:', error);
        console.log('デフォルトタグを設定します...');
        // テーブルが存在しない場合はデフォルトタグを設定
        setAvailableTags([
          { id: '1', name: '切花', color: '#FF6B6B', created_at: new Date().toISOString() },
          { id: '2', name: '鉢花', color: '#4ECDC4', created_at: new Date().toISOString() },
          { id: '3', name: '観葉植物', color: '#45B7D1', created_at: new Date().toISOString() },
          { id: '4', name: '苗もの', color: '#96CEB4', created_at: new Date().toISOString() },
          { id: '5', name: 'ラン鉢', color: '#FFEAA7', created_at: new Date().toISOString() },
          { id: '6', name: '花束', color: '#DDA0DD', created_at: new Date().toISOString() },
          { id: '7', name: 'アレンジメント', color: '#98D8C8', created_at: new Date().toISOString() },
          { id: '8', name: 'ウエディングブーケ', color: '#F7DC6F', created_at: new Date().toISOString() },
          { id: '9', name: 'ブライダル', color: '#BB8FCE', created_at: new Date().toISOString() },
          { id: '10', name: 'コサージュ', color: '#85C1E9', created_at: new Date().toISOString() },
          { id: '11', name: 'スタンド花', color: '#F8C471', created_at: new Date().toISOString() },
          { id: '12', name: '定期装花', color: '#82E0AA', created_at: new Date().toISOString() },
          { id: '13', name: '配送', color: '#F1948A', created_at: new Date().toISOString() },
          { id: '14', name: 'お届け', color: '#85C1E9', created_at: new Date().toISOString() },
          { id: '15', name: '造花', color: '#D7BDE2', created_at: new Date().toISOString() },
          { id: '16', name: 'プリザーブド', color: '#FAD7A0', created_at: new Date().toISOString() },
          { id: '17', name: '仏花', color: '#A9CCE3', created_at: new Date().toISOString() },
          { id: '18', name: '葬儀', color: '#7FB3D3', created_at: new Date().toISOString() },
          { id: '19', name: 'ガーデニング', color: '#82E0AA', created_at: new Date().toISOString() },
          { id: '20', name: '花器', color: '#F8C471', created_at: new Date().toISOString() },
          { id: '21', name: 'ガーデン資材', color: '#F7DC6F', created_at: new Date().toISOString() }
        ]);
      } else {
        console.log('タグ読み込み成功:', data?.length || 0, '個のタグ');
        setAvailableTags(data || []);
      }
    } catch (err) {
      console.error('タグ読み込みエラー:', err);
      console.log('デフォルトタグを設定します...');
      // エラー時もデフォルトタグを設定
      setAvailableTags([
        { id: '1', name: '切花', color: '#FF6B6B', created_at: new Date().toISOString() },
        { id: '2', name: '鉢花', color: '#4ECDC4', created_at: new Date().toISOString() },
        { id: '3', name: '観葉植物', color: '#45B7D1', created_at: new Date().toISOString() },
        { id: '4', name: '苗もの', color: '#96CEB4', created_at: new Date().toISOString() },
        { id: '5', name: 'ラン鉢', color: '#FFEAA7', created_at: new Date().toISOString() },
        { id: '6', name: '花束', color: '#DDA0DD', created_at: new Date().toISOString() },
        { id: '7', name: 'アレンジメント', color: '#98D8C8', created_at: new Date().toISOString() },
        { id: '8', name: 'ウエディングブーケ', color: '#F7DC6F', created_at: new Date().toISOString() },
        { id: '9', name: 'ブライダル', color: '#BB8FCE', created_at: new Date().toISOString() },
        { id: '10', name: 'コサージュ', color: '#85C1E9', created_at: new Date().toISOString() },
        { id: '11', name: 'スタンド花', color: '#F8C471', created_at: new Date().toISOString() },
        { id: '12', name: '定期装花', color: '#82E0AA', created_at: new Date().toISOString() },
        { id: '13', name: '配送', color: '#F1948A', created_at: new Date().toISOString() },
        { id: '14', name: 'お届け', color: '#85C1E9', created_at: new Date().toISOString() },
        { id: '15', name: '造花', color: '#D7BDE2', created_at: new Date().toISOString() },
        { id: '16', name: 'プリザーブド', color: '#FAD7A0', created_at: new Date().toISOString() },
        { id: '17', name: '仏花', color: '#A9CCE3', created_at: new Date().toISOString() },
        { id: '18', name: '葬儀', color: '#7FB3D3', created_at: new Date().toISOString() },
        { id: '19', name: 'ガーデニング', color: '#82E0AA', created_at: new Date().toISOString() },
        { id: '20', name: '花器', color: '#F8C471', created_at: new Date().toISOString() },
        { id: '21', name: 'ガーデン資材', color: '#F7DC6F', created_at: new Date().toISOString() }
      ]);
    }
  };

  const loadStoreImages = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_images')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order');

      if (error) {
        console.error('店舗画像読み込みエラー:', error);
      } else {
        setStoreImages(data || []);
      }
    } catch (err) {
      console.error('店舗画像読み込みエラー:', err);
    }
  };

  const loadStoreBulletins = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_bulletins')
        .select('*')
        .eq('store_id', storeId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('店舗掲示板読み込みエラー:', error);
        // テーブルが存在しない場合は空配列を設定
        setStoreBulletins([]);
      } else {
        setStoreBulletins(data || []);
      }
    } catch (err) {
      console.error('店舗掲示板読み込みエラー:', err);
      setStoreBulletins([]);
    }
  };

  const loadStoreTags = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_tag_relations')
        .select(`
          tag_id,
          store_tags (
            id,
            name,
            color
          )
        `)
        .eq('store_id', storeId);

      if (error) {
        console.error('店舗タグ読み込みエラー:', error);
        // テーブルが存在しない場合は空配列を設定
        setStoreTags([]);
        setSelectedTags([]);
      } else {
        const tags = data?.map(item => item.store_tags).filter(Boolean) || [];
        setStoreTags(tags as unknown as StoreTag[]);
        setSelectedTags(tags.map((tag: any) => tag.id));
      }
    } catch (err) {
      console.error('店舗タグ読み込みエラー:', err);
      setStoreTags([]);
      setSelectedTags([]);
    }
  };

  // 銀行口座情報を読み込み
  const loadBankAccountInfo = async (storeId: string) => {
    try {
      console.log('銀行口座情報読み込み開始:', storeId);
      
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('store_id', storeId)
        .eq('card_type', 'bank_account')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合（新規作成時）
          console.log('銀行口座情報が見つかりません（新規作成時）');
          return;
        }
        console.error('銀行口座情報読み込みエラー:', error);
        return;
      }

      console.log('銀行口座情報読み込み成功:', data);
      
      // フォームデータに銀行口座情報を設定
      // credit_cardsテーブルのデータをフォームフィールドにマッピング
      const updatedFormData = {
        bank_name: data.bank_name || '',
        branch_name: data.branch_name || '',
        account_type: data.account_type || '普通',
        account_number: data.account_number || '',
        account_holder: data.card_holder_name || '' // card_holder_nameフィールドを使用
      };
      
      console.log('更新する銀行口座情報:', updatedFormData);
      
      setFormData(prev => {
        const newFormData = {
          ...prev,
          ...updatedFormData
        };
        console.log('更新後のフォームデータ:', newFormData);
        return newFormData;
      });
    } catch (err) {
      console.error('銀行口座情報読み込みエラー:', err);
    }
  };

  const handleInputChange = (field: keyof StoreFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');

    // 銀行口座情報の変更時はバリデーションを実行
    if (['bank_name', 'branch_name', 'account_type', 'account_number', 'account_holder'].includes(field)) {
      validateBankAccount();
    }
  };

  // 銀行口座情報のバリデーション
  const validateBankAccount = () => {
    const bankInfo = {
      bank_name: formData.bank_name,
      branch_name: formData.branch_name,
      account_type: formData.account_type,
      account_number: formData.account_number,
      account_holder: formData.account_holder
    };

    const validation = BankAccountValidator.validate(bankInfo);
    setBankValidation(validation);
  };

  const validateForm = (): boolean => {
    if (!formData.store_name.trim()) {
      setError('店舗名を入力してください');
      return false;
    }
    if (!formData.address.trim()) {
      setError('住所を入力してください');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('電話番号を入力してください');
      return false;
    }
    if (!formData.email.trim()) {
      setError('メールアドレスを入力してください');
      return false;
    }
    // 銀行口座情報の必須チェック
    if (!formData.bank_name.trim()) {
      setError('銀行名を入力してください');
      return false;
    }
    if (!formData.branch_name.trim()) {
      setError('支店名を入力してください');
      return false;
    }
    if (!formData.account_number.trim()) {
      setError('口座番号を入力してください');
      return false;
    }
    if (!formData.account_holder.trim()) {
      setError('口座名義を入力してください');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user) {
      setError('ユーザー情報が見つかりません');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (existingStore) {
        // 既存店舗の更新
        console.log('既存店舗更新開始:', existingStore.id);
        const updateData: any = {
          store_name: formData.store_name,
          name: formData.store_name, // 互換性のため
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          instagram: formData.instagram || null,
          online_shop: formData.online_shop || null,
          business_hours: formData.business_hours || null,
          description: formData.description || null,
          updated_at: new Date().toISOString(),
          // 銀行口座情報
          bank_name: formData.bank_name,
          branch_name: formData.branch_name,
          account_type: formData.account_type,
          account_number: formData.account_number,
          account_holder: formData.account_holder
        };

        // parkingカラムを追加（SQL実行後に有効化）
        updateData.parking = formData.parking;
        
        console.log('更新データ:', updateData);
        
        const { data: updatedStore, error } = await supabase
          .from('stores')
          .update(updateData)
          .eq('id', existingStore.id)
          .select()
          .single();

        if (error) {
          console.error('店舗更新エラー:', error);
          setError('店舗情報の更新に失敗しました');
          return;
        }

        console.log('店舗更新成功:', updatedStore);
        setExistingStore(updatedStore);
        setSuccess('店舗情報を更新しました');
        
        // タグも更新
        await updateStoreTags(existingStore.id);
      } else {
        // 新規店舗の作成
        console.log('新規店舗作成開始');
        const createData: any = {
          store_name: formData.store_name,
          name: formData.store_name, // 互換性のため
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          instagram: formData.instagram || null,
          online_shop: formData.online_shop || null,
          business_hours: formData.business_hours || null,
          description: formData.description || null,
          is_active: true,
          // 銀行口座情報
          bank_name: formData.bank_name,
          branch_name: formData.branch_name,
          account_type: formData.account_type,
          account_number: formData.account_number,
          account_holder: formData.account_holder
        };

        // parkingカラムを追加（SQL実行後に有効化）
        createData.parking = formData.parking;
        
        console.log('作成データ:', createData);
        
        const { data, error } = await supabase
          .from('stores')
          .insert([createData])
          .select()
          .single();

        if (error) {
          console.error('店舗作成エラー:', error);
          setError('店舗の登録に失敗しました');
          return;
        }

        console.log('店舗作成成功:', data);
        setExistingStore(data);
        setSuccess('店舗を登録しました');
        
        // 新規作成時はタグを更新
        await updateStoreTags(data.id);
      }
    } catch (err: any) {
      console.error('保存エラー:', err);
      setError(err.message || '保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const updateStoreTags = async (storeId: string) => {
    try {
      console.log('タグ更新開始:', storeId, selectedTags);
      
      // テーブルが存在しない場合はスキップ
      if (selectedTags.length === 0) {
        console.log('タグが選択されていないため、タグ更新をスキップ');
        return;
      }

      // 既存のタグ関連を削除
      const { error: deleteError } = await supabase
        .from('store_tag_relations')
        .delete()
        .eq('store_id', storeId);

      if (deleteError) {
        console.error('タグ削除エラー:', deleteError);
        // テーブルが存在しない場合はスキップ
        if (deleteError.code === 'PGRST205') {
          console.log('store_tag_relationsテーブルが存在しないため、タグ更新をスキップ');
          return;
        }
      }

      // 新しいタグ関連を追加
      if (selectedTags.length > 0) {
        const tagRelations = selectedTags.map(tagId => ({
          store_id: storeId,
          tag_id: tagId
        }));

        console.log('追加するタグ関連:', tagRelations);

        const { error: insertError } = await supabase
          .from('store_tag_relations')
          .insert(tagRelations);

        if (insertError) {
          console.error('タグ追加エラー:', insertError);
          // テーブルが存在しない場合はスキップ
          if (insertError.code === 'PGRST205') {
            console.log('store_tag_relationsテーブルが存在しないため、タグ更新をスキップ');
            return;
          }
        } else {
          console.log('タグ更新成功');
        }
      }
    } catch (err) {
      console.error('タグ更新エラー:', err);
    }
  };

  // 銀行口座情報をcredit_cardsテーブルに保存
  // const saveBankAccountInfo = async (storeId: string) => {
    try {
      console.log('銀行口座情報保存開始:', storeId);
      
      // 既存の銀行口座情報を確認
      const { data: existingCards, error: selectError } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (selectError) {
        console.error('銀行口座情報確認エラー:', selectError);
        return;
      }

      // 既存のカードを無効化
      if (existingCards && existingCards.length > 0) {
        const { error: updateError } = await supabase
          .from('credit_cards')
          .update({ is_active: false })
          .eq('store_id', storeId);

        if (updateError) {
          console.error('既存カード無効化エラー:', updateError);
        }
      }

      // 新しい銀行口座情報を追加
      const bankAccountData = {
        store_id: storeId,
        card_type: 'bank_account', // 銀行口座として識別
        last_four_digits: formData.account_number.slice(-4), // 口座番号の最後4桁
        expiry_month: 12, // 銀行口座なので有効期限は設定しない
        expiry_year: 2099, // 銀行口座なので有効期限は設定しない
        card_holder_name: formData.account_holder,
        // 銀行口座の詳細情報を追加
        bank_name: formData.bank_name,
        branch_name: formData.branch_name,
        account_number: formData.account_number,
        account_type: formData.account_type,
        is_default: true,
        is_active: true
      };

      const { error: insertError } = await supabase
        .from('credit_cards')
        .insert([bankAccountData]);

      if (insertError) {
        console.error('銀行口座情報保存エラー:', insertError);
        setError('銀行口座情報の保存に失敗しました');
      } else {
        console.log('銀行口座情報保存成功');
      }
    } catch (err) {
      console.error('銀行口座情報保存エラー:', err);
      setError('銀行口座情報の保存に失敗しました');
    }
  };

  // 画像アップロード機能
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !existingStore) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${existingStore.id}/${Date.now()}-${i}.${fileExt}`;

        // Supabase Storageにアップロード
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('store-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('画像アップロードエラー:', uploadError);
          continue;
        }

        // 公開URLを取得
        const { data: urlData } = supabase.storage
          .from('store-images')
          .getPublicUrl(fileName);

        // データベースに画像情報を保存
        const { error: insertError } = await supabase
          .from('store_images')
          .insert({
            store_id: existingStore.id,
            image_url: urlData.publicUrl,
            alt_text: file.name,
            display_order: storeImages.length + i
          });

        if (insertError) {
          console.error('画像情報保存エラー:', insertError);
        }
      }

      // 画像リストを再読み込み
      await loadStoreImages(existingStore.id);
      setSuccess('画像をアップロードしました');
    } catch (err) {
      console.error('画像アップロードエラー:', err);
      setError('画像のアップロードに失敗しました');
    }
  };

  // 画像削除機能
  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!existingStore) return;

    try {
      // データベースから画像情報を削除
      const { error: deleteError } = await supabase
        .from('store_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.error('画像削除エラー:', deleteError);
        setError('画像の削除に失敗しました');
        return;
      }

      // Storageからファイルを削除（オプション）
      // URLからファイル名を抽出
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('store-images')
          .remove([`${existingStore.id}/${fileName}`]);

        if (storageError) {
          console.error('Storage削除エラー:', storageError);
        }
      }

      // 画像リストを再読み込み
      await loadStoreImages(existingStore.id);
      setSuccess('画像を削除しました');
    } catch (err) {
      console.error('画像削除エラー:', err);
      setError('画像の削除に失敗しました');
    }
  };

  // 掲示板削除機能
  const handleDeleteBulletin = async (bulletinId: string) => {
    if (!existingStore) return;

    // 削除確認
    if (!confirm('この掲示板を削除しますか？')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('store_bulletins')
        .delete()
        .eq('id', bulletinId);

      if (error) {
        console.error('掲示板削除エラー:', error);
        setError('掲示板の削除に失敗しました');
        return;
      }

      // 掲示板一覧を再読み込み
      await loadStoreBulletins(existingStore.id);
      setSuccess('掲示板を削除しました');
    } catch (err) {
      console.error('掲示板削除エラー:', err);
      setError('掲示板の削除に失敗しました');
    }
  };

  // 掲示板作成機能
  const handleCreateBulletin = async () => {
    if (!existingStore || !newBulletin.title.trim() || !newBulletin.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('store_bulletins')
        .insert([{
          store_id: existingStore.id,
          title: newBulletin.title,
          content: newBulletin.content,
          is_pinned: newBulletin.is_pinned,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('掲示板作成エラー:', error);
        alert('掲示板の作成に失敗しました');
        return;
      }

      console.log('掲示板作成成功:', data);
      
      // 掲示板一覧を再読み込み
      await loadStoreBulletins(existingStore.id);
      
      // モーダルを閉じてフォームをリセット
      setShowBulletinModal(false);
      setNewBulletin({
      title: '',
      content: '',
        is_pinned: false
      });
      
      setSuccess('掲示板を作成しました');
    } catch (err) {
      console.error('掲示板作成エラー:', err);
      alert('掲示板の作成に失敗しました');
    }
  };

  if (loading) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ヘッダー */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
              <div>
              <h1 className="text-3xl font-bold text-white">店舗データ管理</h1>
              <p className="mt-2 text-orange-100">店舗情報の登録・編集</p>
              {existingStore && (
                <p className="mt-1 text-sm text-orange-200">
                  ✅ 店舗情報が登録されています
                </p>
              )}
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center px-4 py-2 text-white hover:text-orange-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              戻る
            </button>
        </div>
      </div>

        {/* エラー・成功メッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* フォーム */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本情報 */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Flower className="w-5 h-5 mr-2 text-pink-500" />
                  基本情報
                </h2>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => handleInputChange('store_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="花屋の名前"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="〒123-4567 東京都渋谷区..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="03-1234-5678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="info@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ウェブサイト
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                    <input
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  オンラインショップ
                </label>
                <input
                  type="url"
                  value={formData.online_shop}
                  onChange={(e) => handleInputChange('online_shop', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/shop..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  営業時間
                </label>
                <input
                  type="text"
                  value={formData.business_hours}
                  onChange={(e) => handleInputChange('business_hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9:00-18:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  駐車場
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                <input
                      type="radio"
                      checked={formData.parking === true}
                      onChange={() => handleInputChange('parking', true)}
                      className="mr-2"
                    />
                    あり
                </label>
                  <label className="flex items-center">
                <input
                      type="radio"
                      checked={formData.parking === false}
                      onChange={() => handleInputChange('parking', false)}
                      className="mr-2"
                    />
                    なし
                </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店舗説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="店舗の特徴やサービスについて..."
                />
              </div>

              {/* 銀行口座情報 */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-green-600 mr-2">🏦</span>
                  銀行口座情報 <span className="text-red-500 text-sm">（必須）</span>
                  {bankValidation.isValid && (
                    <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                  )}
                </h3>
                
                {/* バリデーション結果表示 */}
                {bankValidation.errors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800">入力エラー</h4>
                        <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                          {bankValidation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {bankValidation.warnings.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">確認事項</h4>
                        <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                          {bankValidation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  銀行名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：みずほ銀行"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支店名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) => handleInputChange('branch_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：渋谷支店"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  口座種別 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => handleInputChange('account_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  口座番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：1234567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  口座名義 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account_holder}
                  onChange={(e) => handleInputChange('account_holder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：株式会社○○花店"
                  required
                />
              </div>

              {/* 店舗タグ */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  店舗タグ
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTags([...selectedTags, tag.id]);
                            } else {
                              setSelectedTags(selectedTags.filter(id => id !== tag.id));
                            }
                          }}
                      className="mr-2"
                    />
                        <span 
                          className="px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      </label>
                    ))}
                </div>
                  {selectedTags.length === 0 && (
                    <p className="text-sm text-gray-500">タグを選択してください</p>
              )}
            </div>
          </div>
            </div>

                        {/* 保存ボタン */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? '保存中...' : (existingStore ? '更新' : '登録')}
              </button>
            </div>
          </form>

          {/* 店舗画像管理 */}
          {existingStore && (
            <div className="mt-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2" />
                店舗画像管理
              </h3>
            <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label 
                    htmlFor="image-upload"
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    画像をアップロード
                  </label>
                  <p className="text-sm text-gray-600">店舗の写真をアップロードできます</p>
                </div>
                {storeImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {storeImages.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.image_url}
                          alt="店舗画像"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                  <button
                          onClick={() => handleDeleteImage(image.id, image.image_url)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                          <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
                </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">画像がありません</p>
              )}
            </div>
          </div>
        )}

          {/* 店舗掲示板管理 */}
          <div className="mt-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              店舗掲示板管理
            </h3>
            <div className="space-y-4">
              {!existingStore ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">掲示板を使用するには、まず店舗情報を保存してください</p>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    店舗情報を保存
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowBulletinModal(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新規投稿
                    </button>
                    <p className="text-sm text-gray-600">お客様へのお知らせを投稿できます</p>
                  </div>
                  {storeBulletins.length > 0 ? (
                    <div className="space-y-3">
                      {storeBulletins.map((bulletin) => (
                        <div key={bulletin.id} className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{bulletin.title}</h4>
                            <div className="flex items-center space-x-2">
                              {bulletin.is_pinned && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">ピン留め</span>
                              )}
                              <button
                                onClick={() => handleDeleteBulletin(bulletin.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{bulletin.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(bulletin.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">掲示板の投稿がありません</p>
                  )}
                </>
              )}
            </div>
          </div>
            </div>

        {/* 掲示板作成モーダル */}
        {showBulletinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">新規掲示板投稿</h3>

            <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                    value={newBulletin.title}
                    onChange={(e) => setNewBulletin(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="お知らせのタイトル"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容 <span className="text-red-500">*</span>
                      </label>
                  <textarea
                    value={newBulletin.content}
                    onChange={(e) => setNewBulletin(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="お知らせの詳細内容"
                      />
                    </div>

                <div className="flex items-center">
                        <input
                          type="checkbox"
                    checked={newBulletin.is_pinned}
                    onChange={(e) => setNewBulletin(prev => ({ ...prev, is_pinned: e.target.checked }))}
                          className="mr-2"
                        />
                  <label className="text-sm text-gray-700">ピン留めする</label>
                    </div>
                  </div>
              
              <div className="flex justify-end space-x-3 mt-6">
              <button
                  onClick={() => setShowBulletinModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                  キャンセル
              </button>
                      <button
                  onClick={handleCreateBulletin}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                  投稿する
                      </button>
                    </div>
                  </div>
                </div>
        )}

        {/* デバッグ情報 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">デバッグ情報</h3>
            <div className="text-gray-700 space-y-2 text-sm">
              <p><strong>ユーザー:</strong> {user?.email}</p>
              <p><strong>既存店舗:</strong> {existingStore ? 'あり' : 'なし'}</p>
              {existingStore && (
                <p><strong>店舗ID:</strong> {existingStore.id}</p>
              )}
              <p><strong>選択タグ数:</strong> {selectedTags.length}</p>
              <p><strong>利用可能タグ数:</strong> {availableTags.length}</p>
              <p><strong>店舗画像数:</strong> {storeImages.length}</p>
              <p><strong>掲示板投稿数:</strong> {storeBulletins.length}</p>
            </div>
          </div>
        )}

        {/* 説明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">このページについて</h3>
          <div className="text-gray-700 space-y-2">
            <p>• 店舗の基本情報を登録・編集できます</p>
            <p>• 必須項目（店舗名、住所、電話番号、メールアドレス、銀行口座情報）を入力してください</p>
            <p>• 銀行口座情報は振り込み決済に必要です</p>
            <p>• 店舗タグを選択して、店舗の特徴を表現できます</p>
            <p>• 店舗画像を5枚までアップロードして、お客様に店舗の雰囲気を伝えられます</p>
            <p>• 店舗掲示板でお客様へのお知らせを投稿できます</p>
            <p>• 登録した店舗情報は、商品管理やお客様会計で使用されます</p>
            <p>• データはSupabaseに保存され、店舗ごとに管理されます</p>
          </div>
        </div>
      </div>
    </div>
  );
};
