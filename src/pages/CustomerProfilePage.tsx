import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import {
  ArrowLeft,
  Calendar,
  Check,
  MapPin,
  Phone,
  Save,
  User
} from 'lucide-react';

// 背景画像
const BG_IMAGE = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1920&q=80';

const CustomerProfilePage: React.FC = () => {
  const { customer, loading, updateCustomerProfile } = useCustomer();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    birth_date: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        birth_date: customer.birth_date || ''
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await updateCustomerProfile(formData);
      setMessage('プロフィールを更新しました');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    } catch (error) {
      setMessage('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FAF8F5' }}
      >
        <div className="text-center">
          <div 
            className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: '#E0D6C8', borderTopColor: '#5C6B4A' }}
          />
          <p className="mt-4 text-sm" style={{ color: '#3D3A36', fontWeight: 500 }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  const fallbackProfile = {
    id: 'GUEST-CST',
    name: '87app Lover',
    email: 'guest@87app.com',
    phone: '090-0000-0000',
    address: '東京都渋谷区神宮前',
    birth_date: '',
    created_at: new Date().toISOString(),
    level: 'BASIC',
    points: 0,
  };

  const profile = {
    ...fallbackProfile,
    ...customer,
    created_at: customer?.created_at || fallbackProfile.created_at,
    points: customer?.points ?? fallbackProfile.points,
    level: customer?.level ?? fallbackProfile.level,
    email: customer?.email || fallbackProfile.email,
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '---';
    try {
      return new Date(value).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return value;
    }
  };

  const inputStyle = {
    backgroundColor: '#FDFCFA',
    border: '1px solid #E0D6C8',
    color: '#2D2A26'
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* 無地背景 */}

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer-menu')}
            className="flex items-center gap-2 text-sm transition-all duration-300 mb-6"
            style={{ color: '#2D2A26', fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" />
            メニューへ戻る
          </button>

          <div 
            className="rounded-sm p-6 md:p-8"
            style={{ 
              backgroundColor: 'rgba(92,107,74,0.9)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <p 
              className="text-xs tracking-[0.2em] mb-2"
              style={{ color: 'rgba(250,248,245,0.7)' }}
            >
              MY PROFILE
            </p>
            <h1 
              className="text-2xl md:text-3xl mb-2"
              style={{ 
                fontFamily: "'Noto Serif JP', serif",
                color: '#FAF8F5'
              }}
            >
              {profile.name}
            </h1>
            <p 
              className="text-sm"
              style={{ color: 'rgba(250,248,245,0.8)' }}
            >
              毎日の暮らしに、草花の心地よさを。
            </p>
            
            <div className="mt-6 flex flex-wrap gap-4">
              <div 
                className="px-4 py-2 rounded-sm"
                style={{ backgroundColor: 'rgba(250,248,245,0.15)' }}
              >
                <p className="text-xs" style={{ color: 'rgba(250,248,245,0.6)' }}>MEMBER SINCE</p>
                <p className="text-sm" style={{ color: '#FAF8F5' }}>{formatDate(profile.created_at)}</p>
              </div>
              <div 
                className="px-4 py-2 rounded-sm"
                style={{ backgroundColor: 'rgba(250,248,245,0.15)' }}
              >
                <p className="text-xs" style={{ color: 'rgba(250,248,245,0.6)' }}>ID</p>
                <p className="text-sm" style={{ color: '#FAF8F5' }}>{profile.id?.slice(0, 8)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* プロフィール情報 */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div 
            className="rounded-sm p-6"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: '1px solid #E0D6C8'
            }}
          >
            <p 
              className="text-xs tracking-[0.2em] mb-4"
              style={{ color: '#3D3A36', fontWeight: 500 }}
            >
              CONTACT
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                <span className="text-sm" style={{ color: '#2D2A26' }}>
                  {profile.phone || '未登録'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                <span className="text-sm" style={{ color: '#2D2A26' }}>
                  {profile.address || '未登録'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                <span className="text-sm" style={{ color: '#2D2A26' }}>
                  {profile.birth_date ? formatDate(profile.birth_date) : '未登録'}
                </span>
              </div>
            </div>
          </div>

          <div 
            className="rounded-sm p-6"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: '1px solid #E0D6C8'
            }}
          >
            <p 
              className="text-xs tracking-[0.2em] mb-4"
              style={{ color: '#3D3A36', fontWeight: 500 }}
            >
              MEMBERSHIP
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 600 }}>ステータス</span>
                <span 
                  className="text-sm font-medium px-3 py-1 rounded-sm"
                  style={{ 
                    backgroundColor: '#F5F0E8',
                    color: '#5C6B4A'
                  }}
                >
                  {profile.level}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 600 }}>保有ポイント</span>
                <span 
                  className="text-lg"
                  style={{ 
                    fontFamily: "'Cormorant Garamond', serif",
                    color: '#3D4A35',
                    fontWeight: 600
                  }}
                >
                  {profile.points} pt
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#2D2A26', fontWeight: 600 }}>メール</span>
                <span className="text-sm" style={{ color: '#2D2A26' }}>
                  {profile.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 編集フォーム */}
        <div 
          className="rounded-sm p-6 md:p-8"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid #E0D6C8'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p 
                className="text-xs tracking-[0.2em] mb-1"
                style={{ color: '#3D3A36', fontWeight: 500 }}
              >
                EDIT PROFILE
              </p>
              <h2 
                className="text-xl"
                style={{ 
                  fontFamily: "'Noto Serif JP', serif",
                  color: '#2D2A26'
                }}
              >
                プロフィールの更新
              </h2>
            </div>
            {showCelebration && (
              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm"
                style={{ 
                  backgroundColor: '#E8EDE4',
                  color: '#5C6B4A'
                }}
              >
                <Check className="w-4 h-4" />
                保存しました
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label 
                  className="flex items-center gap-2 text-xs tracking-[0.1em] mb-2"
                  style={{ color: '#2D2A26', fontWeight: 500 }}
                >
                  <User className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                  お名前
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-sm transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="山田 花子"
                />
              </div>
              <div>
                <label 
                  className="flex items-center gap-2 text-xs tracking-[0.1em] mb-2"
                  style={{ color: '#2D2A26', fontWeight: 500 }}
                >
                  <Phone className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                  電話番号
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-sm transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="090-1234-5678"
                />
              </div>
            </div>

            <div>
              <label 
                className="flex items-center gap-2 text-xs tracking-[0.1em] mb-2"
                style={{ color: '#2D2A26', fontWeight: 500 }}
              >
                <MapPin className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                住所（町名まで）
              </label>
              <input
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-sm transition-all duration-200"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5C6B4A';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E0D6C8';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="東京都目黒区青葉台"
              />
              <p className="mt-2 text-xs" style={{ color: '#8A857E' }}>
                プライバシー保護のため、番地以降は省略してください。
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label 
                  className="flex items-center gap-2 text-xs tracking-[0.1em] mb-2"
                  style={{ color: '#2D2A26', fontWeight: 500 }}
                >
                  <Calendar className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                  生年月日
                </label>
                <input
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-sm transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5C6B4A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,107,74,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0D6C8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {message && (
              <div
                className="rounded-sm px-4 py-3 text-sm"
                style={{
                  backgroundColor: message.includes('失敗') ? '#FEF2F2' : '#E8EDE4',
                  color: message.includes('失敗') ? '#DC2626' : '#5C6B4A',
                  border: `1px solid ${message.includes('失敗') ? '#FECACA' : '#D1DBC9'}`
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-sm text-sm tracking-[0.15em] transition-all duration-300 disabled:opacity-50"
              style={{ 
                backgroundColor: '#5C6B4A',
                color: '#FAF8F5'
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#4A5D4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5C6B4A';
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? '保存しています...' : 'プロフィールを保存'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
