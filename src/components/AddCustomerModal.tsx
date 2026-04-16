import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../types';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSaved: (customer: Customer) => void;
  onDeleted?: (id: number) => void;
  initialData?: Partial<Customer>;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ 
  isOpen, 
  onClose, 
  onCustomerSaved,
  onDeleted,
  initialData 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    id: undefined as number | undefined,
    name: '',
    phone: '',
    alt_phone: '',
    area: '',
    customer_type: 'walk-in' as Customer['customer_type'],
    credit_limit: 0,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name || '',
        phone: initialData.phone || '',
        alt_phone: initialData.alt_phone || '',
        area: initialData.area || '',
        customer_type: initialData.customer_type || 'walk-in',
        credit_limit: initialData.credit_limit || 0,
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        id: undefined,
        name: '',
        phone: '',
        alt_phone: '',
        area: '',
        customer_type: 'walk-in',
        credit_limit: 0,
        notes: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("save button clicked");

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'اسم الزبون مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    if (!formData.customer_type) newErrors.customer_type = 'نوع الزبون مطلوب';

    if (Object.keys(newErrors).length > 0) {
      console.log("validation failed", newErrors);
      setErrors(newErrors);
      return;
    }

    console.log("validation passed");
    setErrors({});
    setIsSaving(true);
    console.log("insert started");

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const result = await res.json();
        const createdCustomer: Customer = {
          ...formData,
          id: result.id,
          current_balance: initialData?.current_balance || 0,
          created_at: initialData?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Customer;

        console.log("insert success", createdCustomer);
        
        onCustomerSaved(createdCustomer);
        console.log("customer list updated");
        
        alert('تم حفظ العميل بنجاح');
        onClose();
        console.log("modal closed");
      } else {
        const errorData = await res.json();
        console.error("insert failed", errorData);
        alert(`حدث خطأ أثناء حفظ العميل: ${errorData.error || 'فشل العملية'}`);
      }
    } catch (error) {
      console.error("insert failed with error", error);
      alert('حدث خطأ أثناء حفظ العميل');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id || !onDeleted) return;
    console.log(`[MODAL] Delete clicked for customer ID: ${formData.id}`);
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      console.log(`[MODAL] Delete cancelled by user for customer ID: ${formData.id}`);
      return;
    }

    console.log(`[MODAL] Delete confirmed for customer ID: ${formData.id}`);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${formData.id}`, { method: 'DELETE' });
      if (res.ok) {
        console.log(`[MODAL] Delete success for customer ID: ${formData.id}`);
        onDeleted(formData.id);
        alert('تم حذف العميل بنجاح');
        onClose();
      } else {
        const err = await res.json();
        console.log(`[MODAL] Delete blocked for customer ID: ${formData.id}. Reason: ${err.error}`);
        alert(err.error || 'فشل حذف الزبون');
      }
    } catch (e) {
      console.error(`[MODAL] Delete error for customer ID: ${formData.id}:`, e);
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
              <UserPlus size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {formData.id ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">اسم الزبون *</label>
            <input 
              type="text" 
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors({...errors, name: ''});
              }}
              placeholder="أدخل اسم الزبون الكامل"
            />
            {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name}</p>}
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
            <label className="text-sm font-bold text-slate-700">نوع الزبون *</label>
            <select 
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.customer_type ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              value={formData.customer_type}
              onChange={(e) => {
                setFormData({...formData, customer_type: e.target.value as Customer['customer_type']});
                if (errors.customer_type) setErrors({...errors, customer_type: ''});
              }}
            >
              <option value="">اختر النوع...</option>
              <option value="walk-in">زبون عابر</option>
              <option value="workshop">ورشة</option>
              <option value="trader">تاجر</option>
              <option value="company">شركة</option>
            </select>
            {errors.customer_type && <p className="text-xs text-red-500 font-bold">{errors.customer_type}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">سقف الائتمان (د.ل)</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.credit_limit}
              onChange={(e) => setFormData({...formData, credit_limit: Number(e.target.value)})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">المنطقة</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.area}
              onChange={(e) => setFormData({...formData, area: e.target.value})}
              placeholder="مثلاً: طرابلس، بن عاشور"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">هاتف بديل</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.alt_phone}
              onChange={(e) => setFormData({...formData, alt_phone: e.target.value})}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-slate-700">ملاحظات</label>
            <textarea 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="أي ملاحظات إضافية عن الزبون..."
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
                  {isDeleting ? 'جاري الحذف...' : 'حذف الزبون'}
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
                    حفظ العميل
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
