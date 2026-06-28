// import { useState, useEffect, useCallback } from 'react';
// import { X, Save, Plus, AlertCircle, CheckCircle2, Package, Car, LayoutGrid, Database, Trash2, Camera, RefreshCw, Check, XCircle, AlertTriangle } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';
// import { Part, Brand, Model, YearRange, Category } from '../types';
// import { BarcodeScanner } from './BarcodeScanner';

// interface NewPartModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (part: Partial<Part>, andAddToOrder: boolean) => Promise<void>;
//   initialData?: Partial<Part>;
//   onDeleted?: (id: number) => void;
// }

// const generateBarcode = (): string => {
//   const timestamp = Date.now().toString().slice(-8);
//   const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//   return `6281${timestamp}${random}`;
// };

// export const NewPartModal: React.FC<NewPartModalProps> = ({ isOpen, onClose, onSave, initialData, onDeleted }) => {
//   const initialForm: Partial<Part> = {
//     part_name_ar: '',
//     oem_number: '',
//     barcode: '',
//     category_id: 0,
//     brand_id: 0,
//     model_id: 0,
//     year_range_id: 0,
//     year_range_ids: [],
//     shelf_location_id: '',
//     manufacturer_code: '',
//     keywords: '',
//     notes: '',
//     quantity: 0,
//     min_stock_level: 5,
//     cost_price: 0,
//     selling_price: 0,
//     supplier_name: '',
//     supplier_id: undefined
//   };

//   const [form, setForm] = useState<Partial<Part>>(initialData || initialForm);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [brands, setBrands] = useState<Brand[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [models, setModels] = useState<Model[]>([]);
//   const [years, setYears] = useState<YearRange[]>([]);
//   const [suppliers, setSuppliers] = useState<{id: number; name: string}[]>([]);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [vehicleStep, setVehicleStep] = useState<'brand' | 'model' | 'year'>('brand');
//   const [isScannerOpen, setIsScannerOpen] = useState(false);
//   const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'checking' | 'valid' | 'duplicate'>('idle');
//   const [showToast, setShowToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

//   useEffect(() => {
//     if (isOpen) {
//       Promise.all([
//         fetch('/api/brands').then(r => r.json()),
//         fetch('/api/categories').then(r => r.json()),
//         fetch('/api/year-ranges').then(r => r.json()),
//         fetch('/api/suppliers').then(r => r.json()).catch(() => [])
//       ]).then(([brandsData, categoriesData, yearsData, suppliersData]) => {
//         setBrands(Array.isArray(brandsData) ? brandsData : []);
//         setCategories(Array.isArray(categoriesData) ? categoriesData : []);
//         setYears(Array.isArray(yearsData) ? yearsData : []);
//         setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
//       });
      
//       if (initialData) {
//         setForm({
//           ...initialData,
//           year_range_ids: initialData.year_range_ids || (initialData.year_range_id ? [initialData.year_range_id] : [])
//         });
//         if (initialData.brand_id) {
//           fetchModels(initialData.brand_id);
//           setVehicleStep('year');
//         }
//       } else {
//         setForm(initialForm);
//         setVehicleStep('brand');
//       }
//       setErrors({});
//       setBarcodeStatus('idle');
//     }
//   }, [isOpen, initialData]);

//   const fetchModels = async (brandId: number) => {
//     try {
//       const res = await fetch(`/api/models?brand_id=${brandId}`);
//       const data = await res.json();
//       setModels(Array.isArray(data) ? data : []);
//     } catch {
//       setModels([]);
//     }
//   };

//   const handleBrandSelect = async (brandId: number) => {
//     setForm({ ...form, brand_id: brandId, model_id: 0, year_range_ids: [] });
//     await fetchModels(brandId);
//     setVehicleStep('model');
//   };

//   const handleBarcodeScan = (barcode: string) => {
//     setForm({ ...form, barcode });
//     setIsScannerOpen(false);
//     validateBarcode(barcode);
//   };

//   const handleGenerateBarcode = () => {
//     const newBarcode = generateBarcode();
//     setForm({ ...form, barcode: newBarcode });
//     validateBarcode(newBarcode);
//   };

//   const validateBarcode = useCallback(async (barcode: string) => {
//     if (!barcode || barcode.length < 5) {
//       setBarcodeStatus('idle');
//       return;
//     }
//     setBarcodeStatus('checking');
//     try {
//       const res = await fetch(`/api/parts/barcode/${encodeURIComponent(barcode)}`);
//       if (res.ok) {
//         const existingPart = await res.json();
//         if (initialData && existingPart.id === initialData.id) {
//           setBarcodeStatus('valid');
//         } else {
//           setBarcodeStatus('duplicate');
//         }
//       } else if (res.status === 404) {
//         setBarcodeStatus('valid');
//       } else {
//         setBarcodeStatus('idle');
//       }
//     } catch {
//       setBarcodeStatus('idle');
//     }
//   }, [initialData]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (form.barcode) validateBarcode(form.barcode);
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [form.barcode, validateBarcode]);

//   const toggleYearSelection = (yearId: number) => {
//     const current = form.year_range_ids || [];
//     const updated = current.includes(yearId)
//       ? current.filter((id: number) => id !== yearId)
//       : [...current, yearId];
//     setForm({ ...form, year_range_ids: updated });
//   };

//   const validate = () => {
//     const e: Record<string, string> = {};
//     if (!form.part_name_ar?.trim()) e.part_name_ar = 'اسم القطعة مطلوب';
//     if (!form.category_id) e.category_id = 'القسم مطلوب';
//     if (!form.shelf_location_id?.trim()) e.shelf_location_id = 'موقع المخزن مطلوب';
//     if (form.barcode && barcodeStatus === 'duplicate') e.barcode = 'الباركود مستخدم من قبل';
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const isFormValid = () => form.part_name_ar?.trim() && form.category_id && form.shelf_location_id?.trim() && barcodeStatus !== 'duplicate';

//   const handleSave = async (andAddToOrder: boolean) => {
//     if (!validate()) {
//       setShowToast({ type: 'error', message: 'يرجى إصلاح الأخطاء قبل الحفظ' });
//       setTimeout(() => setShowToast(null), 3000);
//       return;
//     }
//     setIsSaving(true);
//     try {
//       const partData = { ...form, last_updated: new Date().toISOString() };
//       await onSave(partData, andAddToOrder);
//       setShowToast({ type: 'success', message: 'تم حفظ الصنف بنجاح' });
//       setTimeout(() => { setShowToast(null); onClose(); }, 1500);
//     } catch (err) {
//       setShowToast({ type: 'error', message: (err as Error).message || 'حدث خطأ أثناء الحفظ' });
//       setTimeout(() => setShowToast(null), 3000);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!form.id || !onDeleted) return;
//     if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف؟')) return;
//     setIsDeleting(true);
//     try {
//       const res = await fetch(`/api/parts/${form.id}`, { method: 'DELETE' });
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'فشل حذف الصنف');
//       }
//       onDeleted(form.id);
//       setShowToast({ type: 'success', message: 'تم حذف الصنف بنجاح' });
//       setTimeout(() => { setShowToast(null); onClose(); }, 1500);
//     } catch (err) {
//       setShowToast({ type: 'error', message: (err as Error).message });
//       setTimeout(() => setShowToast(null), 3000);
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const getInventoryStatus = () => {
//     const qty = form.quantity || 0;
//     const min = form.min_stock_level || 0;
//     if (qty === 0) return { status: 'out', label: 'نفذت', color: 'bg-red-100 text-red-700 border-red-200' };
//     if (qty <= min) return { status: 'low', label: 'ناقص', color: 'bg-amber-100 text-amber-700 border-amber-200' };
//     return { status: 'ok', label: 'متوفر', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
//   };

//   const inventoryStatus = getInventoryStatus();

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
//       <motion.div 
//         initial={{ opacity: 0, scale: 0.95, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
//       >
//         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-slate-50 to-white">
//           <div className="flex items-center gap-4">
//             <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
//               <Plus size={24} />
//             </div>
//             <div>
//               <h2 className="text-xl font-black text-slate-800">
//                 {form.id ? 'تعديل صنف' : 'إضافة صنف جديد للمخزن'}
//               </h2>
//               <p className="text-slate-500 text-sm">أدخل بيانات القطعة الجديدة لتسجيلها في النظام</p>
//             </div>
//           </div>
//           {form.id && (
//             <div className={`px-4 py-2 rounded-full text-sm font-bold border ${inventoryStatus.color}`}>
//               {inventoryStatus.label} • {form.quantity || 0} وحدة
//             </div>
//           )}
//           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
//             <X size={24} className="text-slate-400" />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <div className="space-y-5">
//               <div className="flex items-center gap-2 text-emerald-600 font-bold">
//                 <Database size={18} />
//                 <span>المعلومات الأساسية</span>
//               </div>
              
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-bold text-slate-600 mb-1">اسم القطعة *</label>
//                   <input 
//                     type="text" 
//                     className={`w-full px-4 py-3 bg-slate-50 border ${errors.part_name_ar ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold`}
//                     value={form.part_name_ar}
//                     onChange={(e) => setForm({ ...form, part_name_ar: e.target.value })}
//                     placeholder="مثال: فلتر زيت تويوتا"
//                   />
//                   {errors.part_name_ar && <p className="text-red-500 text-xs mt-1">{errors.part_name_ar}</p>}
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-bold text-slate-600 mb-1">رقم القطعة OEM</label>
//                     <input 
//                       type="text" 
//                       className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-sm"
//                       value={form.oem_number}
//                       onChange={(e) => setForm({ ...form, oem_number: e.target.value })}
//                       placeholder="90915-10001"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-slate-600 mb-1">موقع المخزن *</label>
//                     <input 
//                       type="text" 
//                       className={`w-full px-4 py-3 bg-slate-50 border ${errors.shelf_location_id ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none font-bold`}
//                       value={form.shelf_location_id}
//                       onChange={(e) => setForm({ ...form, shelf_location_id: e.target.value })}
//                       placeholder="مثال: A-12"
//                     />
//                     {errors.shelf_location_id && <p className="text-red-500 text-xs mt-1">{errors.shelf_location_id}</p>}
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-slate-600 mb-1">الباركود</label>
//                   <div className="flex gap-2">
//                     <div className="flex-1 relative">
//                       <input 
//                         type="text" 
//                         className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-mono text-sm pr-10 ${barcodeStatus === 'duplicate' ? 'border-red-500 bg-red-50' : barcodeStatus === 'valid' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
//                         value={form.barcode}
//                         onChange={(e) => setForm({ ...form, barcode: e.target.value })}
//                         placeholder="628123456789"
//                       />
//                       <div className="absolute left-3 top-1/2 -translate-y-1/2">
//                         {barcodeStatus === 'checking' && <RefreshCw className="animate-spin text-slate-400" size={16} />}
//                         {barcodeStatus === 'valid' && <CheckCircle2 className="text-emerald-500" size={16} />}
//                         {barcodeStatus === 'duplicate' && <XCircle className="text-red-500" size={16} />}
//                       </div>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={handleGenerateBarcode}
//                       className="px-3 py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
//                       title="توليد باركود"
//                     >
//                       <LayoutGrid size={18} />
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => setIsScannerOpen(true)}
//                       className="px-3 py-3 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
//                       title="مسح الباركود"
//                     >
//                       <Camera size={18} />
//                     </button>
//                   </div>
//                   {barcodeStatus === 'valid' && form.barcode && (
//                     <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
//                       <Check size={12} /> الباركود متاح
//                     </p>
//                   )}
//                   {barcodeStatus === 'duplicate' && (
//                     <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
//                       <AlertCircle size={12} /> الباركود مستخدم من قبل
//                     </p>
//                   )}
//                   {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-slate-600 mb-1">القسم *</label>
//                   <select 
//                     className={`w-full px-4 py-3 bg-slate-50 border ${errors.category_id ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-emerald-500`}
//                     value={form.category_id || ''}
//                     onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
//                   >
//                     <option value="">اختر القسم...</option>
//                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                   </select>
//                   {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-slate-600 mb-1">الكود الخاص بالشركة المصنعة</label>
//                   <input 
//                     type="text" 
//                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
//                     value={form.manufacturer_code}
//                     onChange={(e) => setForm({ ...form, manufacturer_code: e.target.value })}
//                     placeholder="M-12345"
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-5">
//               <div className="flex items-center gap-2 text-emerald-600 font-bold">
//                 <Package size={18} />
//                 <span>المخزون والتسعير</span>
//               </div>
              
//               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-bold text-slate-600 mb-1">الكمية</label>
//                     <input 
//                       type="number" 
//                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-lg text-center"
//                       value={form.quantity}
//                       onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
//                       min={0}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-slate-600 mb-1">الحد الأدنى</label>
//                     <input 
//                       type="number" 
//                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-center"
//                       value={form.min_stock_level}
//                       onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })}
//                       min={0}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-bold text-slate-600 mb-1">سعر التكلفة</label>
//                     <div className="relative">
//                       <input 
//                         type="number" 
//                         className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-mono"
//                         value={form.cost_price}
//                         onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
//                         min={0}
//                         step={0.01}
//                       />
//                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">د.ل</span>
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-slate-600 mb-1">سعر البيع</label>
//                     <div className="relative">
//                       <input 
//                         type="number" 
//                         className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-mono font-bold text-emerald-700"
//                         value={form.selling_price}
//                         onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })}
//                         min={0}
//                         step={0.01}
//                       />
//                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">د.ل</span>
//                     </div>
//                   </div>
//                 </div>

//                 {form.cost_price && form.selling_price && (
//                   <div className={`p-3 rounded-xl text-center font-bold ${form.selling_price > form.cost_price ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
//                     الهامش: {(((form.selling_price - form.cost_price) / form.cost_price) * 100).toFixed(1)}%
//                   </div>
//                 )}

//                 <div>
//                   <label className="block text-sm font-bold text-slate-600 mb-1">المورد</label>
//                   <select 
//                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none"
//                     value={form.supplier_id || ''}
//                     onChange={(e) => setForm({ ...form, supplier_id: e.target.value ? Number(e.target.value) : undefined })}
//                   >
//                     <option value="">اختر المورد...</option>
//                     {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//                   </select>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <div>
//                   <label className="block text-sm font-bold text-slate-600 mb-1">كلمات البحث</label>
//                   <input 
//                     type="text" 
//                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
//                     value={form.keywords}
//                     onChange={(e) => setForm({ ...form, keywords: e.target.value })}
//                     placeholder="فلتر، زيت، تويوتا، مكينة"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-bold text-slate-600 mb-1">ملاحظات</label>
//                   <textarea 
//                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm h-20 resize-none"
//                     value={form.notes}
//                     onChange={(e) => setForm({ ...form, notes: e.target.value })}
//                     placeholder="أي ملاحظات إضافية عن القطعة..."
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-5">
//               <div className="flex items-center gap-2 text-emerald-600 font-bold">
//                 <Car size={18} />
//                 <span>التوافق مع السيارات</span>
//               </div>

//               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
//                 <div className="flex gap-2">
//                   <button 
//                     onClick={() => setVehicleStep('brand')}
//                     className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${vehicleStep === 'brand' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
//                   >
//                     الشركة
//                   </button>
//                   <button 
//                     onClick={() => form.brand_id ? setVehicleStep('model') : null}
//                     className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${vehicleStep === 'model' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'} ${!form.brand_id && 'opacity-50 cursor-not-allowed'}`}
//                   >
//                     الموديل
//                   </button>
//                   <button 
//                     onClick={() => form.model_id ? setVehicleStep('year') : null}
//                     className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${vehicleStep === 'year' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'} ${!form.model_id && 'opacity-50 cursor-not-allowed'}`}
//                   >
//                     السنوات
//                   </button>
//                 </div>

//                 <div className="h-48 overflow-y-auto custom-scrollbar bg-white rounded-xl border border-slate-200 p-2">
//                   {vehicleStep === 'brand' && (
//                     <div className="grid grid-cols-2 gap-2">
//                       {brands.map(b => (
//                         <button 
//                           key={b.id}
//                           onClick={() => handleBrandSelect(b.id)}
//                           className={`p-2 text-right text-sm rounded-lg hover:bg-emerald-50 transition-colors ${form.brand_id === b.id ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-slate-600'}`}
//                         >
//                           {b.name}
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                   {vehicleStep === 'model' && (
//                     <div className="grid grid-cols-2 gap-2">
//                       {models.length === 0 ? (
//                         <p className="col-span-2 text-center text-slate-400 text-sm py-4">اختر شركة أولاً</p>
//                       ) : (
//                         models.map(m => (
//                           <button 
//                             key={m.id}
//                             onClick={() => { setForm({ ...form, model_id: m.id }); setVehicleStep('year'); }}
//                             className={`p-2 text-right text-sm rounded-lg hover:bg-emerald-50 transition-colors ${form.model_id === m.id ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-slate-600'}`}
//                           >
//                             {m.name}
//                           </button>
//                         ))
//                       )}
//                     </div>
//                   )}
//                   {vehicleStep === 'year' && (
//                     <div className="space-y-2">
//                       <p className="text-xs text-slate-500 mb-2">اختر سنوات متعددة (اضغط للتحديد)</p>
//                       <div className="grid grid-cols-2 gap-2">
//                         {years.map(y => {
//                           const isSelected = (form.year_range_ids || []).includes(y.id);
//                           return (
//                             <button 
//                               key={y.id}
//                               onClick={() => toggleYearSelection(y.id)}
//                               className={`p-2 text-right text-sm rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-emerald-100 text-emerald-700 font-bold border border-emerald-300' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'}`}
//                             >
//                               <span>{y.label}</span>
//                               {isSelected && <Check size={14} className="text-emerald-600" />}
//                             </button>
//                           );
//                         })}
//                       </div>
//                       {(form.year_range_ids || []).length > 0 && (
//                         <div className="mt-3 pt-3 border-t border-slate-200">
//                           <p className="text-xs text-emerald-600 font-bold">
//                             ✓ تم اختيار {(form.year_range_ids || []).length} سنة
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {(form.brand_id || form.model_id) && (
//                 <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
//                   <div className="flex items-center gap-2 text-blue-700 text-sm font-bold">
//                     <Car size={16} />
//                     <span>التوافق:</span>
//                   </div>
//                   <div className="mt-1 text-blue-600 text-sm">
//                     {brands.find(b => b.id === form.brand_id)?.name}
//                     {form.model_id && ` / ${models.find(m => m.id === form.model_id)?.name}`}
//                     {(form.year_range_ids?.length || 0) > 0 && ` / ${form.year_range_ids?.length} سنة`}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 flex-wrap">
//           <div>
//             {form.id && onDeleted && (
//               <button 
//                 onClick={handleDelete}
//                 disabled={isDeleting}
//                 className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-all flex items-center gap-2 disabled:opacity-50"
//               >
//                 {isDeleting ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
//                 حذف الصنف
//               </button>
//             )}
//           </div>
//           <div className="flex gap-3">
//             <button 
//               onClick={onClose}
//               className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
//             >
//               إلغاء
//             </button>
//             <button 
//               onClick={() => handleSave(false)}
//               disabled={isSaving || !isFormValid()}
//               className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
//               حفظ الصنف
//             </button>
//             <button 
//               onClick={() => handleSave(true)}
//               disabled={isSaving || !isFormValid()}
//               className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
//               حفظ وإضافة للطلب
//             </button>
//           </div>
//         </div>

//         <BarcodeScanner
//           isOpen={isScannerOpen}
//           onClose={() => setIsScannerOpen(false)}
//           onScan={handleBarcodeScan}
//         />

//         <AnimatePresence>
//           {showToast && (
//             <motion.div 
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 50 }}
//               className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[60] ${
//                 showToast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
//               }`}
//             >
//               {showToast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
//               <span className="font-bold text-lg">{showToast.message}</span>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     </div>
//   );
// };