// 87app 統一テーマ・スタイルガイド

export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    danger: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },
  
  gradients: {
    primary: 'from-blue-500 to-purple-600',
    secondary: 'from-gray-500 to-gray-600',
    success: 'from-green-500 to-emerald-600',
    danger: 'from-red-500 to-pink-600',
    warning: 'from-yellow-500 to-orange-600',
    background: 'from-gray-50 to-gray-100',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // ページ固有のグラデーション
  pageGradients: {
    checkout: 'from-green-500 to-emerald-600',
    productManagement: 'from-pink-500 to-rose-600',
    customerManagement: 'from-purple-500 to-violet-600',
    storeRegistration: 'from-orange-500 to-red-600',
    flowerLessonMap: 'from-pink-500 to-rose-600',
    lessonSchoolManagement: 'from-teal-500 to-cyan-600',
    lessonScheduleManagement: 'from-cyan-500 to-blue-600',
    popularityRankings: 'from-yellow-500 to-orange-600',
    floristMap: 'from-blue-500 to-purple-600',
    subscriptionManagement: 'from-indigo-500 to-purple-600',
  }
};

// 共通スタイルクラス
export const commonStyles = {
  // カードスタイル
  card: 'bg-white rounded-lg shadow-md border border-gray-200',
  cardElevated: 'bg-white rounded-lg shadow-lg border-0',
  cardOutlined: 'bg-white rounded-lg shadow-sm border-2 border-gray-300',
  
  // ボタンスタイル
  button: 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  buttonPrimary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  buttonSecondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  buttonSuccess: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  buttonDanger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  
  // 入力フィールドスタイル
  input: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  inputError: 'w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
  
  // ラベルスタイル
  label: 'block text-sm font-medium text-gray-700 mb-2',
  
  // ページレイアウト
  pageContainer: 'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100',
  pageContent: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  
  // グリッドレイアウト
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  grid2Cols: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
  grid3Cols: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
};

// ユーティリティ関数
export const utils = {
  // クラス名を結合
  cn: (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ');
  },
  
  // 条件付きクラス名
  conditionalClass: (condition: boolean, trueClass: string, falseClass: string = '') => {
    return condition ? trueClass : falseClass;
  },
  
  // ページタイトルからグラデーションを取得
  getPageGradient: (pageName: string) => {
    return theme.pageGradients[pageName as keyof typeof theme.pageGradients] || theme.gradients.primary;
  },
};
