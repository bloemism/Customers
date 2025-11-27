import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import {
  ArrowLeft,
  Calendar,
  Check,
  Feather,
  Flower,
  Heart,
  MapPin,
  Phone,
  Save,
  Sparkles,
  Star,
  User,
  Wand2
} from 'lucide-react';

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
      setMessage('プロフィールをアップデートしました ✨');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
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
    points: 120,
    favoriteStyle: 'Organic Modern',
    mood: 'Fresh Bloom',
    motto: '毎日の暮らしに、草花の心地よさを。'
  };

  const profile = {
    ...fallbackProfile,
    ...customer,
    created_at: customer?.created_at || fallbackProfile.created_at,
    points: customer?.points ?? fallbackProfile.points,
    level: customer?.level ?? fallbackProfile.level,
    email: customer?.email || fallbackProfile.email,
    phone: customer?.phone || fallbackProfile.phone,
    address: customer?.address || fallbackProfile.address
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3fbf7] via-[#f7f4fb] to-[#fdf3f3] px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/90 via-teal-500/80 to-indigo-500/80 p-6 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('/background.jpg')] opacity-10 mix-blend-soft-light" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={() => navigate('/customer-menu')}
                className="mb-4 inline-flex items-center text-sm font-medium text-teal-100 transition hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                メニューへ戻る
              </button>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {profile.name} のマイプロフィール
              </h1>
              <p className="mt-2 text-sm text-teal-100 max-w-2xl leading-relaxed">
                {profile.motto}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 rounded-2xl bg-white/20 px-6 py-4 text-sm text-white shadow-lg backdrop-blur">
              <span className="text-xs uppercase tracking-widest text-emerald-50">Member since</span>
              <strong className="text-lg">{formatDate(profile.created_at)}</strong>
              <span className="text-emerald-50">ID: {profile.id?.slice(0, 8) ?? 'pending'}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 rounded-3xl bg-white/90 p-6 shadow-xl backdrop-blur lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-2xl font-semibold text-emerald-700 shadow-inner">
                  {profile.name?.charAt(0) ?? 'G'}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Profile</p>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-inner">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
                  コンタクト
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    {profile.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    {profile.address}
                  </p>
                  <p className="flex items-center gap-2">
                    {profile.birth_date ? formatDate(profile.birth_date) : '生年月日未登録'}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-inner text-sm text-gray-600">
                <p className="font-semibold text-gray-900">メンバーシップ</p>
                <p className="mt-2">ステータス: {profile.level}</p>
                <p>保有ポイント: {profile.points} pt</p>
                <p>入会日: {formatDate(profile.created_at)}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl bg-white/90 p-5 shadow-lg backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Member Status</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">{profile.level}</p>
              <p className="mt-1 text-sm text-gray-500">保有ポイント {profile.points} pt</p>
            </div>
            <div className="rounded-3xl bg-white/90 p-5 shadow-lg backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Contact</p>
              <p className="mt-3 text-sm text-gray-600">メール: {profile.email}</p>
              <p className="text-sm text-gray-600">電話: {profile.phone}</p>
            </div>
          </section>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Edit</p>
              <h3 className="text-2xl font-semibold text-gray-900">プロフィールの更新</h3>
              <p className="mt-1 text-sm text-gray-500">
                連絡先やお届け先を最新のものにアップデートしてください。
              </p>
            </div>
            {showCelebration && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <Check className="h-4 w-4" />
                保存しました
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                  <User className="h-4 w-4 text-emerald-400" />
                  お名前
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  placeholder="山田 花子"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                  <Phone className="h-4 w-4 text-emerald-400" />
                  電話番号
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  placeholder="090-1234-5678"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                <MapPin className="h-4 w-4 text-emerald-400" />
                住所（町名まで）
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                placeholder="東京都目黒区青葉台"
              />
              <p className="mt-2 text-xs text-gray-400">プライバシー保護のため、番地以降は省略してください。</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  生年月日
                </label>
                <input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                />
              </div>
            </div>

            {message && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  message.includes('失敗')
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.01] hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide">
                <Save className="h-4 w-4" />
                {saving ? '保存しています...' : 'プロフィールを保存'}
              </span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
