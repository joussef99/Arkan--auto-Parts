import React, { useState, useEffect } from 'react';
import { X, Save, Plus, AlertCircle, CheckCircle2, Package, Car, LayoutGrid, Database, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Part, Brand, Model, YearRange, Category } from '../types';

interface NewPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: Partial<Part>, andAddToOrder: boolean) => Promise<void>;
  initialData?: Partial<Part>;
  onDeleted?: (id: number) => void;
}

export const NewPartModal: React.FC<NewPartModalProps> = ({ isOpen, onClose, onSave, initialData, onDeleted }) => {
  const initialForm: Partial<Part> = {
    part_name_ar: '',
    oem_number: '',
    barcode: '',
    category_id: 0,
    brand_id: 0,
    model_id: 0,
    year_range_id: 0,
    shelf_location_id: '',
    manufacturer_code: '',
    keywords: '',
    notes: '',
    quantity: 0, // Stock should not increase, so default to 0
    cost_price: 0,
    selling_price: 0
  };

  const [form, setForm] = useState<Partial<Part>>(initialData || initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [years, setYears] = useState<YearRange[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vehicleStep, setVehicleStep] = useState<'brand' | 'model' | 'year'>('brand');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/brands').then(res => res.json()).then(data => setBrands(Array.isArray(data) ? data : []));
      fetch('/api/categories').then(res => res.json()).then(data => setCategories(Array.isArray(data) ? data : []));
      fetch('/api/year-ranges').then(res => res.json()).then(data => setYears(Array.isArray(data) ? data : []));
      
      if (initialData) {
        setForm(initialData);
        if (initialData.brand_id) {
          fetchModels(initialData.brand_id);
          setVehicleStep('year');
        }
      } else {
        setForm(initialForm);
        setVehicleStep('brand');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const fetchModels = async (brandId: number) => {
    try {
      const res = await fetch(`/api/models?brand_id=${brandId}`);
      const data = await res.json();
      setModels(Array.isArray(data) ? data : []);
    } catch (err) {
      setModels([]);
    }
  };

  const handleBrandSelect = async (brandId: number) => {
    setForm({ ...form, brand_id: brandId, model_id: 0 });
    await fetchModels(brandId);
    setVehicleStep('model');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.part_name_ar) e.part_name_ar = 'اسم القطعة مطلوب';
    if (!form.category_id) e.category_id = 'القسم مطلوب';
    if (!form.shelf_location_id) e.shelf_location_id = 'موقع المخزن مطلوب';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (andAddToOrder: boolean) => {
    console.log("new part modal: save initiated", { andAddToOrder });
    if (!validate()) {
      console.log("new part modal: validation failed");
      return;
    }
    console.log("new part modal: validation passed");
    
    setIsSaving(true);
    try {
      console.log("new part modal: insert part started");
      await onSave(form, andAddToOrder);
      console.log("new part modal: insert part success");
      console.log("new part modal: modal closed");
      onClose();
    } catch (err) {
      console.error("new part modal: insert part failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id || !onDeleted) return;
    
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف؟')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/parts/${form.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل حذف الصنف');
      }
      onDeleted(form.id);
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">إضافة صنف جديد للمخزن</h2>
              <p className="text-slate-500 text-sm">أدخل بيانات القطعة الجديدة لتسجيلها في النظام</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Right Column: Basic Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2">
                <Database size={18} />
                <span>المعلومات الأساسية</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">اسم القطعة *</label>
                  <input 
                    type="text" 
                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.part_name_ar ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold`}
                    value={form.part_name_ar}
                    onChange={(e) => setForm({ ...form, part_name_ar: e.target.value })}
                    placeholder="مثال: فلتر زيت تويوتا"
                  />
                  {errors.part_name_ar && <p className="text-red-500 text-xs mt-1">{errors.part_name_ar}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">رقم القطعة OEM</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-sm"
                      value={form.oem_number}
                      onChange={(e) => setForm({ ...form, oem_number: e.target.value })}
                      placeholder="90915-10001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">الباركود</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-sm"
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                      placeholder="628123456789"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">القسم *</label>
                    <select 
                      className={`w-full px-4 py-3 bg-slate-50 border ${errors.category_id ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-emerald-500`}
                      value={form.category_id || ''}
                      onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                    >
                      <option value="">اختر القسم...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">موقع المخزن *</label>
                    <input 
                      type="text" 
                      className={`w-full px-4 py-3 bg-slate-50 border ${errors.shelf_location_id ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none font-bold`}
                      value={form.shelf_location_id}
                      onChange={(e) => setForm({ ...form, shelf_location_id: e.target.value })}
                      placeholder="مثال: A-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">الكود الخاص بالشركة المصنعة</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={form.manufacturer_code}
                    onChange={(e) => setForm({ ...form, manufacturer_code: e.target.value })}
                    placeholder="M-12345"
                  />
                </div>
              </div>
            </div>

            {/* Left Column: Vehicle & Additional */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2">
                <Car size={18} />
                <span>السيارة المتوافقة</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setVehicleStep('brand')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${vehicleStep === 'brand' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
                  >الشركة</button>
                  <button 
                    onClick={() => form.brand_id ? setVehicleStep('model') : null}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${vehicleStep === 'model' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'} ${!form.brand_id && 'opacity-50 cursor-not-allowed'}`}
                  >الموديل</button>
                  <button 
                    onClick={() => form.model_id ? setVehicleStep('year') : null}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${vehicleStep === 'year' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'} ${!form.model_id && 'opacity-50 cursor-not-allowed'}`}
                  >السنة</button>
                </div>

                <div className="h-40 overflow-y-auto custom-scrollbar bg-white rounded-xl border border-slate-200 p-2">
                  {vehicleStep === 'brand' && (
                    <div className="grid grid-cols-2 gap-2">
                      {brands.map(b => (
                        <button 
                          key={b.id}
                          onClick={() => handleBrandSelect(b.id)}
                          className={`p-2 text-right text-sm rounded-lg hover:bg-emerald-50 transition-colors ${form.brand_id === b.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'}`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {vehicleStep === 'model' && (
                    <div className="grid grid-cols-2 gap-2">
                      {models.map(m => (
                        <button 
                          key={m.id}
                          onClick={() => { setForm({ ...form, model_id: m.id }); setVehicleStep('year'); }}
                          className={`p-2 text-right text-sm rounded-lg hover:bg-emerald-50 transition-colors ${form.model_id === m.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'}`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {vehicleStep === 'year' && (
                    <div className="grid grid-cols-2 gap-2">
                      {years.map(y => (
                        <button 
                          key={y.id}
                          onClick={() => setForm({ ...form, year_range_id: y.id })}
                          className={`p-2 text-right text-sm rounded-lg hover:bg-emerald-50 transition-colors ${form.year_range_id === y.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'}`}
                        >
                          {y.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">كلمات البحث (للتسهيل)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="مثال: فلتر، زيت، تويوتا، مكينة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">ملاحظات</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm h-20"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="أي ملاحظات إضافية عن القطعة..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
          <div>
            {form.id && onDeleted && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-all flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                حذف الصنف
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
            >
              إلغاء
            </button>
            <button 
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              حفظ الصنف
            </button>
            <button 
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              حفظ وإضافة إلى الطلب
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
