import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Package, Hash, Barcode, Tag, DollarSign, MapPin, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Part, Brand, Model, YearRange, Category } from '../types';

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartSaved: (part: Part, addToInvoice: boolean) => void;
}

export const AddPartModal: React.FC<AddPartModalProps> = ({ isOpen, onClose, onPartSaved }) => {
  const [formData, setFormData] = useState({
    part_name_ar: '',
    oem_number: '',
    barcode: '',
    brand_id: '',
    model_id: '',
    year_range_id: '',
    category_id: '',
    shelf_location_id: '',
    cost_price: 0,
    selling_price: 0,
    quantity: 0,
    min_stock_level: 5,
    notes: '',
    keywords: ''
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [yearRanges, setYearRanges] = useState<YearRange[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetch('/api/brands')
        .then(res => res.json())
        .then(data => setBrands(Array.isArray(data) ? data : []))
        .catch(() => setBrands([]));
      fetch('/api/year-ranges')
        .then(res => res.json())
        .then(data => setYearRanges(Array.isArray(data) ? data : []))
        .catch(() => setYearRanges([]));
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => setCategories(Array.isArray(data) ? data : []))
        .catch(() => setCategories([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.brand_id) {
      fetch(`/api/models?brand_id=${formData.brand_id}`)
        .then(res => res.json())
        .then(data => setModels(Array.isArray(data) ? data : []))
        .catch(() => setModels([]));
    } else {
      setModels([]);
    }
  }, [formData.brand_id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.part_name_ar) newErrors.part_name_ar = 'اسم الصنف مطلوب';
    if (!formData.selling_price) newErrors.selling_price = 'سعر البيع مطلوب';
    if (!formData.category_id) newErrors.category_id = 'التصنيف مطلوب';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (addToInvoice: boolean) => {
    if (!validate()) return;

    setIsSaving(true);
    console.log("Part save started:", formData);
    
    try {
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save part');
      
      const result = await res.json();
      console.log("Part saved successfully, ID:", result.id);
      
      const newPart: Part = {
        ...formData,
        id: result.id,
        brand_id: Number(formData.brand_id),
        model_id: Number(formData.model_id),
        year_range_id: Number(formData.year_range_id),
        category_id: Number(formData.category_id),
        brand_name: brands.find(b => b.id === Number(formData.brand_id))?.name || '',
        model_name: models.find(m => m.id === Number(formData.model_id))?.name || '',
        category_name: categories.find(c => c.id === Number(formData.category_id))?.name || '',
        part_name_ar: formData.part_name_ar,
        shelf_location_id: formData.shelf_location_id,
        quantity: formData.quantity
      };

      onPartSaved(newPart, addToInvoice);
      onClose();
    } catch (error) {
      console.error("Part save failed:", error);
      alert('حدث خطأ أثناء حفظ الصنف');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Plus size={24} />
            </div>
            <h3 className="font-black text-2xl text-slate-800">إضافة صنف جديد سريع</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {/* Basic Info */}
          <section className="space-y-4">
            <h4 className="font-bold text-slate-400 text-sm uppercase tracking-wider flex items-center gap-2">
              <Package size={16} />
              المعلومات الأساسية
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم الصنف *</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.part_name_ar ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none`}
                  placeholder="مثال: فلتر زيت تويوتا أصلي"
                  value={formData.part_name_ar}
                  onChange={e => setFormData({...formData, part_name_ar: e.target.value})}
                />
                {errors.part_name_ar && <p className="text-red-500 text-xs mt-1">{errors.part_name_ar}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم القطعة (OEM)</label>
                <div className="relative">
                  <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    placeholder="90915-10001"
                    value={formData.oem_number}
                    onChange={e => setFormData({...formData, oem_number: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الباركود</label>
                <div className="relative">
                  <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف *</label>
                <div className="relative">
                  <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    className={`w-full pr-10 pl-4 py-3 bg-slate-50 border ${errors.category_id ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none`}
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">اختر التصنيف</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">موقع الرف</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="A-12"
                    value={formData.shelf_location_id}
                    onChange={e => setFormData({...formData, shelf_location_id: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Pricing & Stock */}
          <section className="space-y-4">
            <h4 className="font-bold text-slate-400 text-sm uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} />
              الأسعار والمخزون
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">سعر التكلفة</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  value={formData.cost_price}
                  onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">سعر البيع *</label>
                <input 
                  type="number"
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.selling_price ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-600`}
                  value={formData.selling_price}
                  onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})}
                />
                {errors.selling_price && <p className="text-red-500 text-xs mt-1">{errors.selling_price}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الكمية المتوفرة</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                />
              </div>
            </div>
          </section>

          {/* Vehicle Compatibility */}
          <section className="space-y-4">
            <h4 className="font-bold text-slate-400 text-sm uppercase tracking-wider flex items-center gap-2">
              <Car size={16} />
              توافق المركبات
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الشركة المصنعة</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                  value={formData.brand_id}
                  onChange={e => setFormData({...formData, brand_id: e.target.value, model_id: ''})}
                >
                  <option value="">اختر الماركة</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الموديل</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none disabled:opacity-50"
                  disabled={!formData.brand_id}
                  value={formData.model_id}
                  onChange={e => setFormData({...formData, model_id: e.target.value})}
                >
                  <option value="">اختر الموديل</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">سنة الصنع</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                  value={formData.year_range_id}
                  onChange={e => setFormData({...formData, year_range_id: e.target.value})}
                >
                  <option value="">اختر السنة</option>
                  {yearRanges.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button 
            disabled={isSaving}
            onClick={() => handleSubmit(false)}
            className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            حفظ الصنف فقط
          </button>
          <button 
            disabled={isSaving}
            onClick={() => handleSubmit(true)}
            className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
          >
            {isSaving ? 'جاري الحفظ...' : (
              <>
                <Plus size={20} />
                حفظ وإضافة للفاتورة
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
