import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, X, Camera, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  points: number;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [parsedCustomer, setParsedCustomer] = useState<CustomerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      setCameraPermission('checking');
      setError(null);
      
      // カメラ権限をチェック
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      
      if (!scanning) {
        startScanner();
      }
    } catch (err: any) {
      console.error('カメラ権限エラー:', err);
      setCameraPermission('denied');
      if (err.name === 'NotAllowedError') {
        setError('カメラへのアクセスが拒否されました。ブラウザの設定でカメラ権限を許可してください。');
      } else if (err.name === 'NotFoundError') {
        setError('カメラが見つかりません。カメラが接続されているか確認してください。');
      } else {
        setError('カメラの初期化に失敗しました。');
      }
    }
  };

  const startScanner = () => {
    if (!containerRef.current || cameraPermission !== 'granted') return;

    setScanning(true);
    setError(null);
    
    try {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          useBarCodeDetectorIfSupported: true
        },
        false
      );

      scannerRef.current.render(
        (decodedText: string) => {
          handleScan(decodedText);
        },
        (error: any) => {
          // エラーは無視（継続スキャン）
          console.log('QRスキャン継続中...', error);
        }
      );
    } catch (err: any) {
      console.error('スキャナー初期化エラー:', err);
      setError('QRコードスキャナーの初期化に失敗しました。');
      setScanning(false);
    }
  };

  const handleScan = (data: string) => {
    setScannedData(data);
    try {
      // QRコードのデータを解析
      const customerData = parseCustomerData(data);
      setParsedCustomer(customerData);
    } catch (error) {
      console.error('QRデータ解析エラー:', error);
    }
  };

  const parseCustomerData = (data: string): CustomerData => {
    try {
      // JSONデータとして解析を試行
      const parsed = JSON.parse(data);
      return {
        id: parsed.id || parsed.customer_id || '',
        name: parsed.name || parsed.customer_name || '',
        email: parsed.email || '',
        phone: parsed.phone || parsed.phone_number || '',
        address: parsed.address || '',
        points: parsed.points || parsed.total_points || 0
      };
    } catch {
      // プレーンテキストの場合の処理
      const lines = data.split('\n');
      return {
        id: lines[0] || '',
        name: lines[1] || '',
        email: lines[2] || '',
        phone: lines[3] || '',
        address: lines[4] || '',
        points: parseInt(lines[5]) || 0
      };
    }
  };

  const confirmScan = () => {
    if (scannedData) {
      onScan(scannedData);
      onClose();
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setParsedCustomer(null);
    setError(null);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setScanning(false);
    startScanner();
  };

  const retryCamera = () => {
    setError(null);
    checkCameraPermission();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <QrCode className="w-5 h-5 mr-2 text-blue-600" />
            QRコード読み取り
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {cameraPermission === 'checking' ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">カメラの初期化中...</p>
          </div>
        ) : cameraPermission === 'denied' || error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              カメラアクセスエラー
            </h4>
            <p className="text-gray-600 mb-4 text-sm">
              {error || 'カメラへのアクセスが拒否されました。'}
            </p>
            <div className="space-y-2">
              <button
                onClick={retryCamera}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                再試行
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : !scannedData ? (
          <div>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                顧客のQRコードをカメラに向けてください
              </p>
              <p className="text-sm text-gray-500">
                カメラが自動的に起動します
              </p>
            </div>
            
            {/* QRコード読み取りエリア */}
            <div 
              id="qr-reader" 
              ref={containerRef}
              className="w-full max-w-md mx-auto"
            />
            
            {scanning && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center text-sm text-gray-600">
                  <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  スキャン中...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-2" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                QRコード読み取り完了
              </h4>
            </div>

            {parsedCustomer && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <h5 className="font-medium text-gray-900 mb-2">読み取られた顧客データ</h5>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">名前:</span> {parsedCustomer.name}</div>
                  <div><span className="font-medium">メール:</span> {parsedCustomer.email}</div>
                  <div><span className="font-medium">電話:</span> {parsedCustomer.phone}</div>
                  <div><span className="font-medium">住所:</span> {parsedCustomer.address}</div>
                  <div><span className="font-medium">ポイント:</span> {parsedCustomer.points}</div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 justify-center">
              <button
                onClick={confirmScan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                このデータを登録
              </button>
              <button
                onClick={resetScanner}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                再スキャン
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeScanner;

