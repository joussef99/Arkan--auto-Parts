import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Save, RefreshCw } from 'lucide-react';

interface QAItem {
  id: string;
  module: string;
  action: string;
  status: 'working' | 'broken' | 'needs_review' | 'untested';
  notes: string;
}

const initialChecklist: QAItem[] = [
  // Sales Center & Invoices
  { id: 'inv-1', module: 'Sales Center', action: 'إنشاء فاتورة', status: 'working', notes: 'تم التحقق من إنشاء الفاتورة وخصم المخزون' },
  { id: 'inv-2', module: 'Sales Center', action: 'طباعة الفاتورة', status: 'working', notes: 'تم التحقق من نافذة الطباعة' },
  { id: 'inv-3', module: 'Sales Center', action: 'حفظ PDF', status: 'working', notes: 'تم حل مشكلة الخطوط والألوان باستخدام html-to-image' },
  { id: 'inv-4', module: 'Sales Center', action: 'إرسال واتساب', status: 'working', notes: 'تم التحقق من إنشاء رابط الواتساب' },
  { id: 'inv-5', module: 'Sales Center', action: 'تعديل الفاتورة', status: 'working', notes: 'تمت إضافة زر التعديل وبرمجته' },
  { id: 'inv-6', module: 'Sales Center', action: 'حذف / إلغاء الفاتورة', status: 'working', notes: 'تمت إضافة زر الحذف وبرمجته مع إرجاع المخزون' },
  { id: 'inv-7', module: 'Sales Center', action: 'الرجوع إلى اختيار القطع', status: 'working', notes: 'موجود ويعمل' },
  { id: 'inv-8', module: 'Sales Center', action: 'إنشاء فاتورة جديدة', status: 'working', notes: 'موجود ويعمل' },
  { id: 'inv-9', module: 'Sales Center', action: 'الوصول إلى الفواتير السابقة', status: 'working', notes: 'موجود ويعمل' },
  { id: 'inv-10', module: 'Sales Center', action: 'فتح الفاتورة', status: 'working', notes: 'موجود ويعمل' },

  // Inventory
  { id: 'stk-1', module: 'Inventory', action: 'إضافة بضاعة', status: 'working', notes: 'تم التحقق من إضافة الأصناف' },
  { id: 'stk-2', module: 'Inventory', action: 'تعديل الكمية', status: 'working', notes: 'يعمل من خلال إدخال المخزون' },
  { id: 'stk-3', module: 'Inventory', action: 'تحديد السعر', status: 'working', notes: 'يعمل من خلال رصيد المخزن' },
  { id: 'stk-4', module: 'Inventory', action: 'تطبيق الهامش', status: 'working', notes: 'يعمل من خلال رصيد المخزن' },
  { id: 'stk-5', module: 'Inventory', action: 'قائمة النواقص', status: 'working', notes: 'تم التحقق من فلتر النواقص' },
  { id: 'stk-6', module: 'Inventory', action: 'طباعة قائمة النواقص', status: 'working', notes: 'تمت إضافة زر الطباعة' },
  { id: 'stk-7', module: 'Inventory', action: 'إرسال قائمة النواقص واتساب', status: 'working', notes: 'تمت إضافة زر المشاركة عبر واتساب' },
  { id: 'stk-8', module: 'Inventory', action: 'تعديل صنف', status: 'working', notes: 'تمت إضافة زر التعديل وبرمجته' },
  { id: 'stk-9', module: 'Inventory', action: 'حذف صنف', status: 'working', notes: 'تمت إضافة زر الحذف وبرمجته' },

  // Customers
  { id: 'cus-1', module: 'Customers', action: 'إضافة عميل', status: 'working', notes: 'موجود ويعمل' },
  { id: 'cus-2', module: 'Customers', action: 'حفظ العميل', status: 'working', notes: 'موجود ويعمل' },
  { id: 'cus-3', module: 'Customers', action: 'تعديل العميل', status: 'working', notes: 'موجود ويعمل' },
  { id: 'cus-4', module: 'Customers', action: 'حذف العميل / تعطيله', status: 'working', notes: 'موجود ويعمل مع التحقق من عدم وجود فواتير' },
  { id: 'cus-5', module: 'Customers', action: 'عرض كشف الحساب', status: 'working', notes: 'موجود ويعمل' },
  { id: 'cus-6', module: 'Customers', action: 'تسجيل دفعة', status: 'working', notes: 'موجود ويعمل' },
  { id: 'cus-7', module: 'Customers', action: 'ربط العميل بالفاتورة', status: 'working', notes: 'موجود ويعمل في شاشة المبيعات' },

  // Reports & Settings
  { id: 'rep-1', module: 'Reports', action: 'عرض التقارير', status: 'working', notes: 'موجود ويعمل' },
  { id: 'set-1', module: 'Settings', action: 'فتح الإعدادات', status: 'working', notes: 'موجود ويعمل' },
  { id: 'set-2', module: 'Settings', action: 'حفظ الإعدادات', status: 'working', notes: 'موجود ويعمل' },
];

export const QAChecklistScreen = () => {
  const [checklist, setChecklist] = useState<QAItem[]>(initialChecklist);

  useEffect(() => {
    const saved = localStorage.getItem('qa_checklist');
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved checklist');
      }
    }
  }, []);

  const saveChecklist = (newList: QAItem[]) => {
    setChecklist(newList);
    localStorage.setItem('qa_checklist', JSON.stringify(newList));
  };

  const updateStatus = (id: string, status: QAItem['status']) => {
    const newList = checklist.map(item => item.id === id ? { ...item, status } : item);
    saveChecklist(newList);
  };

  const updateNotes = (id: string, notes: string) => {
    const newList = checklist.map(item => item.id === id ? { ...item, notes } : item);
    saveChecklist(newList);
  };

  const resetChecklist = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين القائمة؟')) {
      saveChecklist(initialChecklist);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'broken': return <XCircle className="text-red-500" size={20} />;
      case 'needs_review': return <AlertCircle className="text-amber-500" size={20} />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-slate-300" />;
    }
  };

  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.module]) acc[item.module] = [];
    acc[item.module].push(item);
    return acc;
  }, {} as Record<string, QAItem[]>);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">قائمة فحص الجودة (QA Checklist)</h2>
          <p className="text-slate-500 mt-1">تتبع حالة فحص وظائف النظام</p>
        </div>
        <button 
          onClick={resetChecklist}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors"
        >
          <RefreshCw size={18} />
          إعادة تعيين
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Object.entries(groupedChecklist) as [string, QAItem[]][]).map(([module, items]) => (
          <div key={module} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              {module}
            </div>
            <div className="divide-y divide-slate-100">
              {items.map(item => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 mb-2">{item.action}</div>
                      <input 
                        type="text" 
                        placeholder="ملاحظات..." 
                        value={item.notes}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                        className="w-full text-sm px-3 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 rounded-lg outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <select 
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as QAItem['status'])}
                        className={`text-sm font-bold px-3 py-2 rounded-lg outline-none border-2 transition-colors ${
                          item.status === 'working' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.status === 'broken' ? 'bg-red-50 text-red-700 border-red-200' :
                          item.status === 'needs_review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        <option value="untested">لم يتم الفحص</option>
                        <option value="working">يعمل</option>
                        <option value="broken">معطل</option>
                        <option value="needs_review">يحتاج مراجعة</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
