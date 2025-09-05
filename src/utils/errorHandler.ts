// エラーハンドリングユーティリティ

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class CustomError extends Error {
  public code: string;
  public details?: any;
  public timestamp: string;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// エラーコード定数
export const ERROR_CODES = {
  // 認証エラー
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // データベースエラー
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DB_CONSTRAINT_ERROR: 'DB_CONSTRAINT_ERROR',
  
  // バリデーションエラー
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // ネットワークエラー
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // 権限エラー
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // リソースエラー
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // 外部サービスエラー
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',
  GOOGLE_MAPS_ERROR: 'GOOGLE_MAPS_ERROR'
} as const;

// エラーメッセージのマッピング
export const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH_REQUIRED]: 'ログインが必要です',
  [ERROR_CODES.AUTH_INVALID]: '認証情報が無効です',
  [ERROR_CODES.AUTH_EXPIRED]: 'セッションが期限切れです',
  
  [ERROR_CODES.DB_CONNECTION_ERROR]: 'データベースに接続できません',
  [ERROR_CODES.DB_QUERY_ERROR]: 'データの取得に失敗しました',
  [ERROR_CODES.DB_CONSTRAINT_ERROR]: 'データの制約に違反しています',
  
  [ERROR_CODES.VALIDATION_ERROR]: '入力内容に問題があります',
  [ERROR_CODES.REQUIRED_FIELD]: '必須項目が入力されていません',
  [ERROR_CODES.INVALID_FORMAT]: '入力形式が正しくありません',
  
  [ERROR_CODES.NETWORK_ERROR]: 'ネットワークエラーが発生しました',
  [ERROR_CODES.TIMEOUT_ERROR]: 'タイムアウトが発生しました',
  
  [ERROR_CODES.PERMISSION_DENIED]: 'アクセス権限がありません',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: '権限が不足しています',
  
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'リソースが見つかりません',
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'リソースが既に存在します',
  
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: '外部サービスでエラーが発生しました',
  [ERROR_CODES.STRIPE_ERROR]: '決済処理でエラーが発生しました',
  [ERROR_CODES.GOOGLE_MAPS_ERROR]: '地図サービスでエラーが発生しました'
} as const;

// エラーハンドリング関数
export const handleError = (error: any): AppError => {
  console.error('Error occurred:', error);

  // カスタムエラーの場合
  if (error instanceof CustomError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp
    };
  }

  // Supabaseエラーの場合
  if (error?.code && error?.message) {
    return {
      code: `SUPABASE_${error.code}`,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString()
    };
  }

  // ネットワークエラーの場合
  if (error?.name === 'NetworkError' || !navigator.onLine) {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      details: error,
      timestamp: new Date().toISOString()
    };
  }

  // その他のエラー
  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || '不明なエラーが発生しました',
    details: error,
    timestamp: new Date().toISOString()
  };
};

// エラーメッセージの取得
export const getErrorMessage = (error: AppError): string => {
  return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message;
};

// エラーログの送信（本番環境では外部サービスに送信）
export const logError = (error: AppError, context?: string) => {
  const logData = {
    ...error,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };

  // 開発環境ではコンソールに出力
  if (import.meta.env.DEV) {
    console.error('Error logged:', logData);
  }

  // 本番環境では外部サービスに送信
  // TODO: 本番環境でのエラーログ送信を実装
};

// 非同期関数のエラーハンドリング
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<{ data?: R; error?: AppError }> => {
    try {
      const data = await fn(...args);
      return { data };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, fn.name);
      return { error: appError };
    }
  };
};

