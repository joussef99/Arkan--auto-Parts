import React, { useState, useEffect } from 'react';
import { X, Truck, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Supplier } from '../types';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierSaved: (supplier: Supplier) => void;
  onDeleted?: (id: number) => void;
  initialData?: Partial<Supplier>;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ 
  isOpen, 
  onClose, 
  onSupplierSaved,
  onDeleted,
  initialData 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    id: undefined as number | undefined,
    supplier_name: '',
    phone: '',
    company_name: '',
    address: '',
    notes: '',
    opening_balance: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        supplier_name: initialData.supplier_name || '',
        phone: initialData.phone || '',
        company_name: initialData.company_name || '',
        address: initialData.address || '',
        notes: initialData.notes || '',
        opening_balance: initialData.opening_balance || 0
      });
    } else {
      setFormData({
        id: undefined,
        supplier_name: '',
        phone: '',
        company_name: '',
        address: '',
        notes: '',
        opening_balance: 0
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("supplier save button clicked", formData);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.supplier_name.trim()) newErrors.supplier_name = 'اسم المورد مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';

    if (Object.keys(newErrors).length > 0) {
      console.log("validation failed", newErrors);
      setErrors(newErrors);
      return;
    }

    console.log("validation passed");
    setErrors({});
    setIsSaving(true);

    try {
      console.log("supplier insert started");
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const result = await res.json();
        console.log("supplier insert success", result);
        
        const savedSupplier: Supplier = {
          ...formData,
          id: result.id,
          current_balance: (formData.id ? (initialData?.current_balance || 0) : formData.opening_balance),
          is_active: initialData?.is_active || 1,
          created_at: initialData?.created_at || new Date().toISOString(),
        } as Supplier;
        
        console.log("suppliers list updated locally");
        onSupplierSaved(savedSupplier);
        alert('تمت إضافة المورد بنجاح');
        console.log("modal closed");
        onClose();
      } else {
        const errorData = await res.json();
        console.error("supplier insert failed", errorData);
        alert(`حدث خطأ أثناء حفظ المورد: ${errorData.error || 'فشل العملية'}`);
      }
    } catch (error) {
      console.error("supplier insert failed", error);
      alert('حدث خطأ أثناء حفظ المورد');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id || !onDeleted) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا المورد؟')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/suppliers/${formData.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted(formData.id);
        alert('تم حذف المورد بنجاح');
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || 'فشل حذف المورد');
      }
    } catch (e) {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
        dir="rtl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Truck size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {formData.id ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">اسم المورد *</label>
            <input 
              type="text" 
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.supplier_name ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              value={formData.supplier_name}
              onChange={(e) => {
                setFormData({...formData, supplier_name: e.target.value});
                if (errors.supplier_name) setErrors({...errors, supplier_name: ''});
              }}
              placeholder="أدخل اسم المورد"
            />
            {errors.supplier_name && <p className="text-xs text-red-500 font-bold">{errors.supplier_name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">اسم الشركة (اختياري)</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              placeholder="اسم شركة المورد"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">رقم الهاتف *</label>
            <input 
              type="text" 
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              value={formData.phone}
              onChange={(e) => {
                setFormData({...formData, phone: e.target.value});
                if (errors.phone) setErrors({...errors, phone: ''});
              }}
              placeholder="09XXXXXXXX"
            />
            {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">الرصيد الافتتاحي (اختياري)</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.opening_balance}
              onChange={(e) => setFormData({...formData, opening_balance: Number(e.target.value)})}
              placeholder="0.00"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-slate-700">العنوان</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="عنوان المورد أو الشركة"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-slate-700">ملاحظات</label>
            <textarea 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="أي ملاحظات إضافية..."
            ></textarea>
          </div>

          <div className="md:col-span-2 flex justify-between items-center mt-4">
            <div>
              {formData.id && onDeleted && (
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  <Trash2 size={18} />
                  {isDeleting ? 'جاري الحذف...' : 'حذف المورد'}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                disabled={isSaving || isDeleting}
                className="px-8 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-emerald-200"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    حفظ المورد
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
