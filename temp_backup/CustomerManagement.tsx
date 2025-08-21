import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Star,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  favoriteFlowers: string[];
  notes: string;
  isVIP: boolean;
  createdAt: string;
}

export const CustomerManagement: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: '田中 花子',
      email: 'tanaka@example.com',
      phone: '090-1234-5678',
      address: '東京都渋谷区渋谷1-1-1',
      totalOrders: 15,
      totalSpent: 45000,
      lastOrderDate: '2024-01-15',
      favoriteFlowers: ['バラ', 'チューリップ', 'ユリ'],
      notes: '誕生日プレゼントをよく購入',
      isVIP: true,
      createdAt: '2023-03-15'
    },
    {
      id: '2',
      name: '佐藤 太郎',
      email: 'sato@example.com',
      phone: '080-2345-6789',
      address: '東京都新宿区新宿2-2-2',
      totalOrders: 8,
      totalSpent: 28000,
      lastOrderDate: '2024-01-10',
      favoriteFlowers: ['観葉植物', '蘭'],
      notes: 'オフィス用の植物を定期的に購入',
      isVIP: false,
      createdAt: '2023-06-20'
    },
    {
      id: '3',
      name: '山田 美咲',
      email: 'yamada@example.com',
      phone: '070-3456-7890',
      address: '東京都港区六本木3-3-3',
      totalOrders: 25,
      totalSpent: 85000,
      lastOrderDate: '2024-01-18',
      favoriteFlowers: ['アレンジメント', '花束', 'ギフト'],
      notes: '高額商品を好むVIP顧客',
      isVIP: true,
      createdAt: '2022-12-01'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filters = [
    { value: 'all', label: '全顧客' },
    { value: 'vip', label: 'VIP顧客' },
    { value: 'recent', label: '最近の注文' },
    { value: 'high-value', label: '高額顧客' }
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    let matchesFilter = true;
    switch (selectedFilter) {
      case 'vip':
        matchesFilter = customer.isVIP;
        break;
      case 'recent':
        const lastOrderDate = new Date(customer.lastOrderDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchesFilter = lastOrderDate > thirtyDaysAgo;
        break;
      case 'high-value':
        matchesFilter = customer.totalSpent > 50000;
        break;
    }
    
    return matchesSearch && matchesFilter;
  });

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
              <Users className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">顧客管理</h1>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>顧客追加</span>
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索・フィルター */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="顧客名・メール・電話番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {filters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-right">
              <span className="text-sm text-gray-600">
                顧客数: {filteredCustomers.length}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 顧客リスト */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">顧客一覧</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        顧客名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        注文数
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        総購入額
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終注文
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr 
                        key={customer.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedCustomer?.id === customer.id ? 'bg-green-50' : ''
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-800">
                                  {customer.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name}
                                {customer.isVIP && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalOrders}回
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ¥{customer.totalSpent.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.lastOrderDate).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.isVIP 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {customer.isVIP ? 'VIP' : '一般'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 顧客詳細 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                顧客詳細
              </h3>
              
              {selectedCustomer ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-medium text-green-800">
                        {selectedCustomer.name.charAt(0)}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</h4>
                    {selectedCustomer.isVIP && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        VIP顧客
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{selectedCustomer.phone}</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <strong>住所:</strong> {selectedCustomer.address}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-2">購入履歴</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>総注文数:</span>
                        <span className="font-medium">{selectedCustomer.totalOrders}回</span>
                      </div>
                      <div className="flex justify-between">
                        <span>総購入額:</span>
                        <span className="font-medium">¥{selectedCustomer.totalSpent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>最終注文:</span>
                        <span className="font-medium">
                          {new Date(selectedCustomer.lastOrderDate).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-2">お気に入りの花</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedCustomer.favoriteFlowers.map(flower => (
                        <span key={flower} className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs">
                          {flower}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-2">メモ</h5>
                    <p className="text-sm text-gray-600">{selectedCustomer.notes}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="btn-primary flex-1">編集</button>
                    <button className="btn-secondary flex-1">メール送信</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">顧客を選択してください</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 顧客追加モーダル（簡易版） */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">顧客追加</h2>
            <p className="text-gray-600 mb-4">顧客追加機能は開発中です。</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="btn-primary w-full"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
