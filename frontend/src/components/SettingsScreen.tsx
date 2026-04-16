import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  FileText, 
  Package, 
  Car, 
  Languages, 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Brand, Category, Model } from '../types';

type SettingsTab = 'general' | 'invoice' | 'inventory' | 'categories' | 'vehicles' | 'users' | 'financial';

export const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<any>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', icon_name: 'Package', color: 'slate' });
  const [newBrand, setNewBrand] = useState({ name: '', name_en: '', logo_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, catRes, brandRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/categories'),
        fetch('/api/brands')
      ]);
      const settingsData = await settingsRes.json();
      const catData = await catRes.json();
      const brandData = await brandRes.json();
      
      setSettings(settingsData || {});
      setCategories(Array.isArray(catData) ? catData : []);
      setBrands(Array.isArray(brandData) ? brandData : []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setCategories([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage({ text: 'تم حفظ الإعدادات بنجاح', type: 'success' });
      } else {
        setMessage({ text: 'خطأ في حفظ الإعدادات', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'خطأ في الاتصال بالسيرفر', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        fetchData();
        setNewCategory({ name: '', icon_name: 'Package', color: 'slate' });
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.name) return;
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBrand)
      });
      if (res.ok) {
        fetchData();
        setNewBrand({ name: '', name_en: '', logo_url: '' });
      }
    } catch (error) {
      console.error('Error adding brand:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-8 pb-12">
      {/* Sidebar Navigation */}
      <div className="w-64 flex flex-col gap-2">
        <button 
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'general' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Store size={20} />
          <span>بيانات النشاط</span>
        </button>
        <button 
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'invoice' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <FileText size={20} />
          <span>إعدادات المبيعات</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'inventory' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Package size={20} />
          <span>إعدادات المخزن</span>
        </button>
        <button 
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'financial' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <CreditCard size={20} />
          <span>الخزنة والبنوك</span>
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Settings size={20} />
          <span>التصنيفات</span>
        </button>
        <button 
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'vehicles' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Car size={20} />
          <span>السيارات</span>
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Users size={20} />
          <span>المستخدمين والصلاحيات</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white p-10 rounded-3xl shadow-sm border border-slate-100 relative">
        <AnimatePresence mode="wait">
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl flex items-center gap-3 font-bold shadow-lg z-50 ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
            >
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b pb-4">إعدادات المحل العامة</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">اسم المحل</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={settings.shop_name || ''}
                  onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">رقم الهاتف</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={settings.shop_phone || ''}
                  onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-500">عنوان المحل</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={settings.shop_address || ''}
                  onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
                />
              </div>
            </div>
            <button 
              onClick={handleSaveSettings}
              disabled={saving}
              className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </motion.div>
        )}

        {activeTab === 'invoice' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b pb-4">إعدادات الفواتير</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">بادئة الفاتورة (Prefix)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={settings.invoice_prefix || ''}
                  onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">العملة الافتراضية</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={settings.currency || ''}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                />
              </div>
            </div>
            <button onClick={handleSaveSettings} className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2">
              <Save size={20} /> حفظ التغييرات
            </button>
          </motion.div>
        )}

        {activeTab === 'categories' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b pb-4">إدارة التصنيفات</h3>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-8">
              <h4 className="font-bold text-slate-700 mb-4">إضافة تصنيف جديد</h4>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="اسم التصنيف"
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <button 
                  onClick={handleAddCategory}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> إضافة
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                      <Package size={18} />
                    </div>
                    <span className="font-bold text-slate-700">{cat.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'vehicles' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b pb-4">إدارة ماركات السيارات</h3>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-8">
              <h4 className="font-bold text-slate-700 mb-4">إضافة ماركة جديدة</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input 
                  type="text" 
                  placeholder="الاسم بالعربي"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                />
                <input 
                  type="text" 
                  placeholder="الاسم بالإنجليزي"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                  value={newBrand.name_en}
                  onChange={(e) => setNewBrand({ ...newBrand, name_en: e.target.value })}
                />
              </div>
              <input 
                type="text" 
                placeholder="رابط الشعار (Logo URL)"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none mb-4"
                value={newBrand.logo_url}
                onChange={(e) => setNewBrand({ ...newBrand, logo_url: e.target.value })}
              />
              <button 
                onClick={handleAddBrand}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> إضافة ماركة
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {brands.map((brand) => (
                <div key={brand.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img src={brand.logo_url} alt={brand.name} className="max-w-full max-h-full object-contain grayscale opacity-50" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700">{brand.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{brand.name_en}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b pb-4">إدارة المستخدمين والصلاحيات</h3>
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
              <ShieldCheck size={64} strokeWidth={1} />
              <p className="mt-4 font-bold">هذه الوحدة قيد التطوير في النسخة v2.1</p>
              <p className="text-xs mt-1">يمكنك حالياً استخدام حساب arkan الافتراضي</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'financial' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b pb-4">إعدادات الخزنة والبنوك</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">اسم الخزنة الرئيسية</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={settings.main_cashbox_name || 'الخزنة المركزية'}
                  onChange={(e) => setSettings({ ...settings, main_cashbox_name: e.target.value })}
                />
              </div>
            </div>
            <button onClick={handleSaveSettings} className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2">
              <Save size={20} /> حفظ التغييرات
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
