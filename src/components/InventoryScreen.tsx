import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Package, 
  Car, 
  ChevronLeft, 
  Zap, 
  LayoutGrid, 
  Database, 
  X, 
  ArrowRight, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Upload,
  History,
  ClipboardCheck,
  ArrowUpCircle,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Printer,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Part, Brand, Model, YearRange, Category, StockMovement } from '../types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { NewPartModal } from './NewPartModal';

// --- Icons Mapping ---
import { 
  ThermometerSnowflake, 
  Fan, 
  CarFront, 
  ArrowDownUp, 
  CircleStop,
  Cpu
} from 'lucide-react';

const CategoryIcons: Record<string, any> = {
  ThermometerSnowflake,
  Fan,
  CarFront,
  ArrowDownUp,
  Zap,
  CircleStop,
  Cpu
};

type TabType = 'STOCK_ENTRY' | 'LOW_STOCK' | 'IMPORT' | 'BALANCE' | 'MOVEMENT' | 'AUDIT';

interface InventoryScreenProps {
  onSave: (part: Partial<Part>) => Promise<void>;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>('BALANCE');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const tabs = [
    { id: 'BALANCE', label: 'رصيد المخزن', icon: Package },
    { id: 'STOCK_ENTRY', label: 'إضافة بضاعة للمخزن', icon: Plus },
    { id: 'LOW_STOCK', label: 'قائمة النواقص', icon: AlertCircle },
    { id: 'IMPORT', label: 'استيراد من ملف', icon: FileSpreadsheet },
    { id: 'MOVEMENT', label: 'حركة المخزن', icon: History },
    { id: 'AUDIT', label: 'جرد المخزن', icon: ClipboardCheck },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12" dir="rtl">
      {/* Header & Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Database className="text-emerald-600" size={28} />
            مركز عمليات المخزن
          </h2>
          <p className="text-slate-500 text-sm mt-1">إدارة المخزون، الإدخال، الجرد، ومراقبة حركة الأصناف</p>
        </div>
        
        <div className="flex overflow-x-auto no-scrollbar bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  isActive 
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'BALANCE' && <StockBalanceSection showFeedback={showFeedback} />}
            {activeTab === 'STOCK_ENTRY' && <StockEntrySection showFeedback={showFeedback} onComplete={() => setActiveTab('BALANCE')} />}
            {activeTab === 'LOW_STOCK' && <LowStockSection showFeedback={showFeedback} />}
            {activeTab === 'IMPORT' && <ImportSection showFeedback={showFeedback} onComplete={() => setActiveTab('BALANCE')} />}
            {activeTab === 'MOVEMENT' && <StockMovementSection />}
            {activeTab === 'AUDIT' && <StockAuditSection showFeedback={showFeedback} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 ${
              feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <span className="font-bold text-lg">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Section 1: Stock Entry ---
const StockEntrySection = ({ showFeedback, onComplete }: { 
  showFeedback: (t: 'success' | 'error', m: string) => void,
  onComplete: () => void
}) => {
  const [items, setItems] = useState<any[]>([{ id: 1, part_name_ar: '', oem_number: '', quantity: 0, cost_price: 0, margin_percent: 0, selling_price: 0, shelf_location_id: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkMargin, setBulkMargin] = useState<number>(0);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), part_name_ar: '', oem_number: '', quantity: 0, cost_price: 0, margin_percent: 0, selling_price: 0, shelf_location_id: '' }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'cost_price' || field === 'margin_percent') {
          const cost = Number(updated.cost_price) || 0;
          const margin = Number(updated.margin_percent) || 0;
          updated.selling_price = cost + (cost * (margin / 100));
        }
        if (field === 'selling_price') {
          const cost = Number(updated.cost_price) || 0;
          const sell = Number(updated.selling_price) || 0;
          if (cost > 0) {
            updated.margin_percent = ((sell - cost) / cost) * 100;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const applyBulkMargin = () => {
    if (bulkMargin <= 0) return;
    setItems(items.map(item => {
      const cost = Number(item.cost_price) || 0;
      return {
        ...item,
        margin_percent: bulkMargin,
        selling_price: cost + (cost * (bulkMargin / 100))
      };
    }));
    showFeedback('success', 'تم تطبيق الهامش على الكل');
  };

  const handleSave = async () => {
    const validItems = items.filter(i => i.part_name_ar && i.oem_number);
    if (validItems.length === 0) {
      showFeedback('error', 'يرجى إدخال اسم القطعة ورقمها على الأقل');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/inventory/stock-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems })
      });
      if (res.ok) {
        showFeedback('success', 'تم إضافة البضاعة للمخزن بنجاح');
        onComplete();
      } else {
        const err = await res.json();
        showFeedback('error', err.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (e) {
      showFeedback('error', 'حدث خطأ في الاتصال');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800">إضافة بضاعة للمخزن</h3>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-sm font-bold text-slate-600">تطبيق هامش على الكل:</span>
              <input 
                type="number" 
                value={bulkMargin} 
                onChange={e => setBulkMargin(Number(e.target.value))}
                className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-center"
              />
              <span className="text-slate-500">%</span>
              <button 
                onClick={applyBulkMargin}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 font-bold text-slate-600">اسم القطعة</th>
                <th className="px-4 py-3 font-bold text-slate-600">رقم القطعة OEM</th>
                <th className="px-4 py-3 font-bold text-slate-600 w-24">الكمية</th>
                <th className="px-4 py-3 font-bold text-slate-600 w-32">سعر التكلفة</th>
                <th className="px-4 py-3 font-bold text-slate-600 w-24">هامش الربح %</th>
                <th className="px-4 py-3 font-bold text-slate-600 w-32">سعر البيع</th>
                <th className="px-4 py-3 font-bold text-slate-600">موقع المخزن</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="p-2">
                    <input type="text" value={item.part_name_ar} onChange={e => updateItem(item.id, 'part_name_ar', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="اسم القطعة..." />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.oem_number} onChange={e => updateItem(item.id, 'oem_number', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg font-mono text-sm" placeholder="OEM..." />
                  </td>
                  <td className="p-2">
                    <input type="number" value={item.quantity || ''} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-center" placeholder="0" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={item.cost_price || ''} onChange={e => updateItem(item.id, 'cost_price', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-center" placeholder="0.00" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={item.margin_percent || ''} onChange={e => updateItem(item.id, 'margin_percent', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-center" placeholder="%" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={item.selling_price || ''} onChange={e => updateItem(item.id, 'selling_price', e.target.value)} className="w-full p-2 border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-center" placeholder="0.00" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.shelf_location_id} onChange={e => updateItem(item.id, 'shelf_location_id', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="موقع..." />
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-4">
          <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl font-bold transition-colors">
            <Plus size={20} />
            إضافة سطر جديد
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            حفظ وإضافة للمخزن
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Section 2: Low Stock List ---
const LowStockSection = ({ showFeedback }: { showFeedback: (t: 'success' | 'error', m: string) => void }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/parts?q=');
      const data = await res.json();
      setParts(data.filter((p: Part) => p.quantity <= p.min_stock_level));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (parts.length === 0) {
      showFeedback('error', 'لا توجد نواقص لتصديرها');
      return;
    }
    
    const element = document.getElementById('low-stock-table-container');
    if (!element) return;
    
    try {
      showFeedback('success', 'جاري تجهيز الملف...');
      
      // Use html-to-image instead of html2canvas to avoid oklch color parsing errors
      const imgData = await toPng(element, { 
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Calculate height based on element aspect ratio
      const elementRect = element.getBoundingClientRect();
      const aspectRatio = elementRect.height / elementRect.width;
      const pdfHeight = pdfWidth * aspectRatio;
      
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save('low_stock_list.pdf');
      showFeedback('success', 'تم تصدير القائمة بنجاح');
    } catch (error) {
      console.error(error);
      showFeedback('error', 'حدث خطأ أثناء التصدير');
    }
  };

  const handleWhatsApp = () => {
    if (parts.length === 0) {
      showFeedback('error', 'لا توجد نواقص لإرسالها');
      return;
    }
    
    let message = "قائمة النواقص\n\n";
    parts.forEach(p => {
      message += `- ${p.part_name_ar} (الكمية: ${p.quantity})\n`;
    });
    message += "\nالرجاء توفير هذه النواقص.";
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    showFeedback('success', 'تم إنشاء قائمة النواقص');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            قائمة النواقص
          </h3>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors">
              <Printer size={18} />
              طباعة القائمة
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition-colors">
              <FileText size={18} />
              تصدير PDF
            </button>
            <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-200">
              <MessageCircle size={18} />
              إرسال واتساب
            </button>
          </div>
        </div>

        <div id="low-stock-table-container" className="overflow-x-auto bg-white p-4 rounded-xl">
          <div className="mb-4 text-center hidden print:block">
            <h2 className="text-2xl font-bold">قائمة النواقص</h2>
            <p className="text-slate-500">{new Date().toLocaleDateString('ar-LY')}</p>
          </div>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">اسم القطعة</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">رقم القطعة OEM</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">الكمية الحالية</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">الحد الأدنى</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">موقع المخزن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{part.part_name_ar}</td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-500">{part.oem_number}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-black">{part.quantity}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-600">{part.min_stock_level}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{part.shelf_location_id || '-'}</td>
                </tr>
              ))}
              {parts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={48} className="text-emerald-400" strokeWidth={1} />
                      <p>لا توجد نواقص في المخزن حالياً</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Section 3: Import from File ---
const ImportSection = ({ showFeedback, onComplete }: { 
  showFeedback: (t: 'success' | 'error', m: string) => void,
  onComplete: () => void
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (f.name.endsWith('.xlsx')) {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreviewData(data.slice(0, 10)); // Preview first 10
      } else if (f.name.endsWith('.csv')) {
        Papa.parse(f, {
          header: true,
          complete: (results) => {
            setPreviewData(results.data.slice(0, 10));
          }
        });
      }
    };
    if (f.name.endsWith('.xlsx')) reader.readAsBinaryString(f);
    else reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      // In a real app, we'd parse the whole file and send chunks or the whole thing
      // For this demo, let's parse the whole thing and send it
      const reader = new FileReader();
      reader.onload = async (evt) => {
        let items: any[] = [];
        const bstr = evt.target?.result;
        if (file.name.endsWith('.xlsx')) {
          const wb = XLSX.read(bstr, { type: 'binary' });
          items = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        } else {
          const results = Papa.parse(bstr as string, { header: true });
          items = results.data;
        }

        // Map fields (simple mapping for demo)
        const mappedItems = items.map(item => ({
          part_name_ar: item['اسم القطعة'] || item['name'] || item['part_name_ar'],
          oem_number: item['رقم القطعة'] || item['oem_number'],
          barcode: item['الباركود'] || item['barcode'],
          quantity: Number(item['الكمية'] || item['quantity'] || item['stock_quantity'] || 0),
          shelf_location_id: item['موقع المخزن'] || item['location'] || item['shelf_location_id'],
          manufacturer_code: item['كود المصنع'] || item['manufacturer_code'],
          category_id: categories.find(c => c.name === item['القسم'])?.id || 1
        })).filter(i => i.part_name_ar);

        const res = await fetch('/api/inventory/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: mappedItems })
        });
        const result = await res.json();
        if (result.success) {
          showFeedback('success', `تم استيراد ${result.imported} قطعة بنجاح`);
          onComplete();
        } else {
          showFeedback('error', 'حدث خطأ أثناء الاستيراد');
        }
      };
      if (file.name.endsWith('.xlsx')) reader.readAsBinaryString(file);
      else reader.readAsText(file);
    } catch (err) {
      showFeedback('error', 'حدث خطأ أثناء الاستيراد');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-900">استيراد بيانات المخزون من ملف</h3>
          <p className="text-slate-500 mt-1">يدعم ملفات Excel (.xlsx) و CSV</p>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-emerald-500 transition-all bg-slate-50/50 group">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".xlsx, .csv" 
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
              <Upload size={40} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg">{file ? file.name : 'اختر ملفاً للتحميل'}</div>
              <p className="text-slate-400 text-sm">أو قم بسحب وإفلات الملف هنا</p>
            </div>
          </label>
        </div>

        {previewData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800">معاينة البيانات (أول 10 أسطر)</h4>
              <span className="text-xs text-slate-400">تأكد من مطابقة أسماء الأعمدة</span>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      {Object.keys(previewData[0]).map(k => <th key={k} className="px-4 py-2 font-bold text-slate-600">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        {Object.values(row).map((v: any, j) => <td key={j} className="px-4 py-2 text-slate-500">{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button onClick={() => { setFile(null); setPreviewData([]); }} className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all">إلغاء</button>
          <button 
            onClick={handleImport} 
            disabled={!file || isImporting}
            className="flex-[2] py-4 bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isImporting ? <RefreshCw className="animate-spin" /> : <Download size={20} />}
            تنفيذ الاستيراد
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Section 4: Stock Balance ---
const StockBalanceSection = ({ showFeedback }: { showFeedback: (t: 'success' | 'error', m: string) => void }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ brand: '', category: '', lowStock: false });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editMargin, setEditMargin] = useState(0);
  const [editSellingPrice, setEditSellingPrice] = useState(0);
  
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [search, filters]);

  useEffect(() => {
    fetch('/api/brands').then(res => res.json()).then(setBrands);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  const handleSavePrice = async (partId: number) => {
    try {
      const res = await fetch(`/api/parts/${partId}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selling_price: editSellingPrice, margin_percent: editMargin })
      });
      if (res.ok) {
        showFeedback('success', 'تم تحديث السعر بنجاح');
        setEditingPriceId(null);
        fetchInventory();
      } else {
        showFeedback('error', 'حدث خطأ أثناء تحديث السعر');
      }
    } catch (err) {
      showFeedback('error', 'حدث خطأ في الاتصال');
    }
  };

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: search,
        brand: filters.brand,
        category: filters.category,
      });
      const res = await fetch(`/api/parts?${params}`);
      let data = await res.json();
      if (filters.lowStock) {
        data = data.filter((p: Part) => p.quantity <= p.min_stock_level);
      }
      setParts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث في رصيد المخزن..." 
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <button onClick={fetchInventory} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {filters.lowStock && (
            <>
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                title="طباعة قائمة النواقص"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">طباعة النواقص</span>
              </button>
              <button 
                onClick={() => {
                  const text = parts.map(p => `- ${p.part_name_ar} (الكمية: ${p.quantity})`).join('\n');
                  window.open(`https://wa.me/?text=${encodeURIComponent(`قائمة النواقص:\n${text}`)}`, '_blank');
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200 transition-all"
                title="مشاركة النواقص عبر واتساب"
              >
                <MessageCircle size={18} />
                <span className="hidden sm:inline">مشاركة واتساب</span>
              </button>
              <div className="w-px h-8 bg-slate-200 mx-2"></div>
            </>
          )}
          <select 
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          >
            <option value="">كل الماركات</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select 
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">كل الأقسام</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition-all">
            <input 
              type="checkbox" 
              checked={filters.lowStock} 
              onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-sm font-bold">نواقص المخزن</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">اسم القطعة</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">رقم القطعة OEM</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">القسم</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">الكمية الحالية</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">آخر سعر شراء</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">سعر البيع</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">تاريخ التحديث</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{part.part_name_ar}</td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-500">{part.oem_number}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">{part.category_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-black text-lg ${part.quantity <= part.min_stock_level ? 'text-red-600' : 'text-emerald-600'}`}>
                      {part.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-500">{part.last_purchase_price || part.cost_price || 0} د.ل</td>
                  <td className="px-6 py-4">
                    {editingPriceId === part.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">الهامش:</span>
                          <input 
                            type="number" 
                            className="w-16 p-1 border border-slate-300 rounded text-center text-sm"
                            value={editMargin}
                            onChange={e => {
                              const m = Number(e.target.value);
                              setEditMargin(m);
                              const cost = part.last_purchase_price || part.cost_price || 0;
                              setEditSellingPrice(cost + (cost * (m / 100)));
                            }}
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">السعر:</span>
                          <input 
                            type="number" 
                            className="w-20 p-1 border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold rounded text-center text-sm"
                            value={editSellingPrice}
                            onChange={e => {
                              const s = Number(e.target.value);
                              setEditSellingPrice(s);
                              const cost = part.last_purchase_price || part.cost_price || 0;
                              if (cost > 0) {
                                setEditMargin(((s - cost) / cost) * 100);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="font-black text-emerald-600">{part.selling_price || 0} د.ل</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {part.price_updated_at ? new Date(part.price_updated_at).toLocaleDateString('ar-LY') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {editingPriceId === part.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleSavePrice(part.id)} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors" title="حفظ">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditingPriceId(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="إلغاء">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingPriceId(part.id);
                            setEditMargin(part.margin_percent || 0);
                            setEditSellingPrice(part.selling_price || 0);
                          }}
                          className="px-3 py-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="تحديد السعر"
                        >
                          تحديد السعر
                        </button>
                        <button 
                          onClick={() => {
                            setEditingPart(part);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل الصنف"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {parts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={48} strokeWidth={1} />
                      <p>لا توجد نتائج في رصيد المخزن</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewPartModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPart(null);
        }}
        initialData={editingPart || undefined}
        onDeleted={(id) => {
          showFeedback('success', 'تم حذف الصنف بنجاح');
          fetchInventory();
        }}
        onSave={async (partData) => {
          try {
            const res = await fetch(`/api/parts/${editingPart?.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(partData)
            });
            if (res.ok) {
              showFeedback('success', 'تم تحديث بيانات الصنف بنجاح');
              fetchInventory();
            } else {
              const errData = await res.json();
              throw new Error(errData.error || 'حدث خطأ أثناء تحديث بيانات الصنف');
            }
          } catch (err) {
            showFeedback('error', (err as Error).message);
            throw err;
          }
        }}
      />
    </div>
  );
};

// --- Section 5: Stock Movement ---
const StockMovementSection = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: filters.type,
        start_date: filters.startDate,
        end_date: filters.endDate
      });
      const res = await fetch(`/api/inventory/movements?${params}`);
      const data = await res.json();
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const movementTypes: Record<string, { label: string, color: string }> = {
    'opening': { label: 'رصيد افتتاح', color: 'bg-blue-100 text-blue-700' },
    'addition': { label: 'إضافة كمية', color: 'bg-emerald-100 text-emerald-700' },
    'sale': { label: 'مبيعات', color: 'bg-red-100 text-red-700' },
    'adjustment': { label: 'تعديل يدوي', color: 'bg-amber-100 text-amber-700' },
    'audit': { label: 'جرد مخزني', color: 'bg-purple-100 text-purple-700' },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <select 
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">كل أنواع الحركة</option>
            {Object.entries(movementTypes).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <span className="text-slate-400">إلى</span>
            <input 
              type="date" 
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <button onClick={fetchMovements} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">التاريخ</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">اسم القطعة</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">نوع الحركة</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">الكمية</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">الرصيد بعد الحركة</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">المرجع / الملاحظة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(m.created_at).toLocaleString('ar-EG')}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{m.part_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{m.oem_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${movementTypes[m.type]?.color || 'bg-slate-100 text-slate-600'}`}>
                      {movementTypes[m.type]?.label || m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{m.balance_after}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{m.note || '-'}</td>
                </tr>
              ))}
              {movements.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <History size={48} strokeWidth={1} />
                      <p>لا توجد سجلات لحركة المخزن</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Section 6: Stock Audit ---
const StockAuditSection = ({ showFeedback }: { showFeedback: (t: 'success' | 'error', m: string) => void }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [physicalQty, setPhysicalQty] = useState(0);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async () => {
    if (!search) return;
    const res = await fetch(`/api/parts?q=${search}`);
    const data = await res.json();
    setResults(data);
  };

  const handleSave = async () => {
    if (!selectedPart) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/inventory/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part_id: selectedPart.id, physical_quantity: physicalQty, note })
      });
      if (res.ok) {
        showFeedback('success', 'تم حفظ الجرد واعتماد الفروقات بنجاح');
        setSelectedPart(null);
        setSearch('');
        setResults([]);
        setPhysicalQty(0);
        setNote('');
      } else {
        showFeedback('error', 'فشل حفظ الجرد');
      }
    } catch (err) {
      showFeedback('error', 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const diff = selectedPart ? physicalQty - selectedPart.quantity : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      {!selectedPart ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-900">جرد المخزن (مطابقة الكميات)</h3>
            <p className="text-slate-500 mt-1">اختر القطعة لمطابقة الكمية الفعلية مع كمية النظام</p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن قطعة للجرد..."
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button onClick={handleSearch} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">بحث</button>
          </div>

          <div className="space-y-3">
            {results.map(p => (
              <button 
                key={p.id} 
                onClick={() => { setSelectedPart(p); setPhysicalQty(p.quantity); }}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-purple-500 transition-all flex items-center justify-between group"
              >
                <div className="text-right">
                  <div className="font-bold text-slate-900">{p.part_name_ar}</div>
                  <div className="text-xs text-slate-500 font-mono">{p.oem_number}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="text-xs text-slate-400">الرصيد الحالي</div>
                    <div className="font-black text-slate-900">{p.quantity}</div>
                  </div>
                  <ChevronLeft className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <ClipboardCheck size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedPart.part_name_ar}</h3>
                <p className="text-slate-500 font-mono text-sm">{selectedPart.oem_number}</p>
              </div>
            </div>
            <button onClick={() => setSelectedPart(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div className="text-xs text-slate-400 mb-1">الكمية المسجلة</div>
              <div className="text-2xl font-black text-slate-900">{selectedPart.quantity}</div>
            </div>
            <div className="p-4 bg-white rounded-2xl border-2 border-purple-500 text-center">
              <div className="text-xs text-purple-600 mb-1">الكمية الفعلية</div>
              <div className="text-2xl font-black text-purple-700">{physicalQty}</div>
            </div>
            <div className={`p-4 rounded-2xl text-center border ${diff === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`text-xs mb-1 ${diff === 0 ? 'text-emerald-600' : 'text-red-600'}`}>الفرق</div>
              <div className={`text-2xl font-black ${diff === 0 ? 'text-emerald-700' : 'text-red-700'}`}>{diff > 0 ? `+${diff}` : diff}</div>
            </div>
          </div>

          {diff !== 0 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <p className="text-sm text-amber-800 font-bold">تنبيه: يوجد فرق بين الكمية المسجلة والفعلية. عند الحفظ، سيتم تعديل رصيد المخزن وتسجيل حركة "جرد مخزني".</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">أدخل الكمية الفعلية المكتشفة</label>
              <input 
                type="number" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-black text-2xl text-center"
                value={physicalQty}
                onChange={(e) => setPhysicalQty(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">ملاحظة الجرد</label>
              <input 
                type="text" 
                placeholder="مثال: جرد ربع سنوي - مستودع أ"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => setSelectedPart(null)} className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all">إلغاء</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-[2] py-4 bg-purple-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all disabled:opacity-50"
            >
              اعتماد الجرد
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
