import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, AlertCircle, CheckCircle, Store, DollarSign } from 'lucide-react';
import jsQR from 'jsqr';

interface StoreQRScannerProps {
  onClose: () => void;
}

interface StoreQRData {
  type: 'store_payment';
  storeId: string;
  storeName: string;
  amount: number;
  description: string;
  timestamp: number;
  signature?: string;
}

export const StoreQRScanner: React.FC<StoreQRScannerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<StoreQRData | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsScanning(true);
        scanQRCode();
      }
    } catch (err) {
      console.error('カメラアクセスエラー:', err);
      setError('カメラにアクセスできません。カメラの許可を確認してください。');
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setIsScanning(false);
          handleQRCodeData(code.data);
        } else if (isScanning) {
          requestAnimationFrame(scan);
        }
      } else if (isScanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  const handleQRCodeData = (data: string) => {
    try {
      // QRコードのデータを解析
      const qrData: StoreQRData = JSON.parse(data);
      
      // 店舗決済用QRコードかチェック
      if (qrData.type === 'store_payment' && qrData.storeId && qrData.amount) {
        setScannedData(qrData);
        
        // 決済確認ページに遷移
        navigate('/payment-confirmation', {
          state: {
            storeData: qrData,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        setError('有効な店舗決済QRコードではありません。');
      }
    } catch (err) {
      setError('QRコードの形式が正しくありません。');
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Camera className="h-5 w-5 mr-2 text-blue-500" />
            店舗QRコードスキャン
          </h3>
          <button
            onClick={stopScanning}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* カメラビュー */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* スキャン枠 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
              </div>
            </div>
          </div>

          {/* ステータス表示 */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {scannedData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">店舗QRコードを読み取りました</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">店舗名:</span>
                  <span className="font-medium">{scannedData.storeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">金額:</span>
                  <span className="font-bold text-green-700">{formatAmount(scannedData.amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 説明テキスト */}
          <div className="text-center text-sm text-gray-600">
            <p>店舗が表示した決済QRコードを読み取ってください</p>
            <p className="mt-1">QRコードを枠内に合わせてください</p>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-3">
            <button
              onClick={stopScanning}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={startCamera}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              再スキャン
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


