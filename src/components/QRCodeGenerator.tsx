import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, RefreshCw, Copy, Check } from 'lucide-react';

interface QRCodeGeneratorProps {
  transactionData: {
    transactionId: string;
    totalAmount: number;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    customerId?: string;
    storeId: string;
  };
  onPaymentComplete?: (transactionId: string) => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  transactionData,
  onPaymentComplete
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');

  // QRコードデータの生成
  const generateQRData = () => {
    const data = {
      type: 'payment_request',
      transactionId: transactionData.transactionId,
      amount: transactionData.totalAmount,
      items: transactionData.items,
      customerId: transactionData.customerId,
      storeId: transactionData.storeId,
      timestamp: new Date().toISOString(),
      app: '87app-customers'
    };
    
    return JSON.stringify(data);
  };

  // QRコードの生成
  const generateQRCode = async () => {
    setLoading(true);
    try {
      const qrData = generateQRData();
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('QRコード生成エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // QRコードのダウンロード
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `payment-qr-${transactionData.transactionId}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 取引データのコピー
  const copyTransactionData = async () => {
    try {
      const qrData = generateQRData();
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('コピーエラー:', error);
    }
  };

  // 決済状況の監視（実際の実装ではWebSocketやポーリングを使用）
  useEffect(() => {
    const checkPaymentStatus = async () => {
      // ここでSupabaseから決済状況を確認
      // 実際の実装では定期的にチェック
    };

    const interval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(interval);
  }, [transactionData.transactionId]);

  useEffect(() => {
    generateQRCode();
  }, [transactionData]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          お支払いQRコード
        </h3>
        <p className="text-sm text-gray-600">
          お客様に87app-customersで読み取ってもらってください
        </p>
      </div>

      {/* 取引情報 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">取引ID:</span>
          <span className="text-sm text-gray-900 font-mono">
            {transactionData.transactionId.slice(0, 8)}...
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">合計金額:</span>
          <span className="text-lg font-bold text-green-600">
            ¥{transactionData.totalAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">商品数:</span>
          <span className="text-sm text-gray-900">
            {transactionData.items.length}点
          </span>
        </div>
      </div>

      {/* QRコード表示 */}
      <div className="text-center mb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : qrCodeUrl ? (
          <div className="space-y-4">
            <img 
              src={qrCodeUrl} 
              alt="Payment QR Code" 
              className="mx-auto border-2 border-gray-200 rounded-lg"
            />
            
            {/* アクションボタン */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={downloadQRCode}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Download className="h-4 w-4 mr-1" />
                保存
              </button>
              
              <button
                onClick={generateQRCode}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                更新
              </button>
              
              <button
                onClick={copyTransactionData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    コピー
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            QRコードの生成に失敗しました
          </div>
        )}
      </div>

      {/* 決済状況 */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">決済状況:</span>
          <div className="flex items-center">
            {paymentStatus === 'pending' && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500 mr-2"></div>
                <span className="text-sm text-yellow-600">待機中</span>
              </div>
            )}
            {paymentStatus === 'completed' && (
              <div className="flex items-center">
                <div className="h-4 w-4 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600">完了</span>
              </div>
            )}
            {paymentStatus === 'failed' && (
              <div className="flex items-center">
                <div className="h-4 w-4 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-red-600">失敗</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 説明 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 お客様に87app-customersアプリでQRコードを読み取ってもらい、決済を完了してください。
          決済が完了すると自動的にこの画面に反映されます。
        </p>
      </div>
    </div>
  );
};
