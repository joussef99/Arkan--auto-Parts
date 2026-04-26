import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Flashlight, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  onClose, 
  isOpen 
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        
        if (scannerRef.current) {
          await scannerRef.current.stop();
          scannerRef.current = null;
        }

        scannerRef.current = new Html5Qrcode('barcode-scanner-region');
        
        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777,
          },
          (decodedText: string) => {
            onScan(decodedText);
            stopScanner();
            onClose();
          },
          () => {
            // Ignore scan failures
          }
        );
        
        setError(null);
      } catch (err: any) {
        console.error('Scanner error:', err);
        if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
          setError('تم رفض إذن الكاميرا. يرجى السماح بالوصول للكاميرا.');
          setHasCamera(false);
        } else if (err.toString().includes('NotFoundError') || err.toString().includes('not found')) {
          setError('لم يتم العثور على كاميرا على الجهاز.');
          setHasCamera(false);
        } else {
          setError('حدث خطأ في تشغيل الكاميرا');
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, onScan, onClose]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {
        // Ignore stop errors
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
        >
          <X size={24} />
        </button>
        <h3 className="text-white font-bold">مسح الباركود</h3>
        <div className="w-10" />
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {error ? (
          <div className="text-center p-8">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
            <p className="text-white text-lg mb-4">{error}</p>
            {!hasCamera && (
              <p className="text-slate-400 text-sm">
                يمكنك إدخال الباركود يدوياً في حقل البحث
              </p>
            )}
          </div>
        ) : (
          <div 
            id="barcode-scanner-region" 
            ref={videoRef}
            className="w-full max-w-md aspect-video"
          />
        )}
      </div>

      {/* Instructions */}
      <div className="p-6 bg-slate-900 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
          <Camera size={20} />
          <span>وجه الكاميرا نحو الباركود</span>
        </div>
        <p className="text-slate-500 text-sm">
          سيتم البحث عن الصنف تلقائياً عند قراءة الباركود
        </p>
      </div>
    </div>
  );
};

// Manual barcode input component
interface BarcodeInputProps {
  onSearch: (barcode: string) => void;
  isSearching: boolean;
}

export const BarcodeInput: React.FC<BarcodeInputProps> = ({ onSearch, isSearching }) => {
  const [barcode, setBarcode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onSearch(barcode.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="أدخل الباركود..."
        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        dir="ltr"
      />
      <button
        type="submit"
        disabled={!barcode.trim() || isSearching}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSearching ? 'جاري البحث...' : 'بحث'}
      </button>
    </form>
  );
};

export default BarcodeScanner;