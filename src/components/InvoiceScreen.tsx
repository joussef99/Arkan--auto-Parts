import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  PlusCircle,
  Printer, 
  FileText, 
  Share2, 
  MessageSquare, 
  Image as ImageIcon, 
  UserPlus, 
  User, 
  Search,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Save,
  PackagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InvoiceItem, Customer, Part } from '../types';
import { AddCustomerModal } from './AddCustomerModal';
import { AddPartModal } from './AddPartModal';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface InvoiceScreenProps {
  items: InvoiceItem[];
  updateQuantity: (id: number, delta: number) => void;
  updateDiscount: (id: number, discount: number) => void;
  removeItem: (id: number) => void;
  clearInvoice: () => void;
  onSave: (invoiceData: any) => Promise<void>;
  onAddItem: (part: Part) => void;
}

export const InvoiceScreen: React.FC<InvoiceScreenProps> = ({ 
  items, 
  updateQuantity, 
  updateDiscount,
  removeItem, 
  clearInvoice,
  onSave,
  onAddItem
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [partSearchResults, setPartSearchResults] = useState<Part[]>([]);
  const [isSearchingParts, setIsSearchingParts] = useState(false);
  const [notes, setNotes] = useState('');

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customerSearchQuery.length > 1) {
      fetch(`/api/customers?q=${customerSearchQuery}`)
        .then(res => res.json())
        .then(setCustomers);
    }
  }, [customerSearchQuery]);

  useEffect(() => {
    if (partSearchQuery.length > 1) {
      setIsSearchingParts(true);
      const timer = setTimeout(() => {
        fetch(`/api/parts?q=${partSearchQuery}`)
          .then(res => res.json())
          .then(data => {
            setPartSearchResults(data);
            setIsSearchingParts(false);
          })
          .catch(() => setIsSearchingParts(false));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPartSearchResults([]);
    }
  }, [partSearchQuery]);

  const subtotal = items.reduce((acc, item) => acc + (item.selling_price * item.quantity) - (item.discount || 0), 0);
  const total = subtotal - invoiceDiscount;
  const remainingBalance = total - paidAmount;

  const handleCustomerSaved = (newCustomer: Customer) => {
    setCustomer(newCustomer);
    setIsWalkIn(false);
    setShowAddModal(false);
    setShowCustomerSearch(false);
  };

  const handlePartSaved = (newPart: Part, addToInvoice: boolean) => {
    if (addToInvoice) {
      // Logic to add to invoice items
      // Since items are managed by parent, we need a way to trigger parent's addToInvoice
      // We'll add a prop for that
      onAddItem(newPart);
      console.log("تمت إضافة الصنف وإرفاقه بالفاتورة");
    }
    setShowAddPartModal(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        invoiceNumber,
        customerId: customer?.id || null,
        items,
        paymentType,
        invoiceDiscount,
        totalAmount: total,
        paidAmount,
        remainingBalance,
        notes
      });
      clearInvoice();
      setCustomer(null);
      setIsWalkIn(true);
      setPaidAmount(0);
      setInvoiceDiscount(0);
      setNotes('');
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const generateWhatsAppSummary = () => {
    const shopName = "أركان لقطع الغيار";
    const date = new Date().toLocaleDateString('ar-LY');
    
    let itemsList = items.map(item => 
      `• ${item.name} (${item.quantity} × ${item.selling_price}) = ${item.quantity * item.selling_price} د.ل`
    ).join('\n');

    const summary = `*${shopName}*\n` +
      `رقم الفاتورة: ${invoiceNumber}\n` +
      `التاريخ: ${date}\n\n` +
      `*قائمة الأصناف:*\n${itemsList}\n\n` +
      `*الإجمالي:* ${total} د.ل\n` +
      `*المدفوع:* ${paidAmount} د.ل\n` +
      `*المتبقي:* ${remainingBalance} د.ل\n\n` +
      `شكراً لتعاملكم معنا!`;

    const encodedSummary = encodeURIComponent(summary);
    window.open(`https://wa.me/${customer?.phone || ''}?text=${encodedSummary}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const exportAsPDF = () => {
    if (!invoiceRef.current) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    toJpeg(invoiceRef.current, { quality: 0.95, backgroundColor: '#fff' })
      .then((dataUrl) => {
        if (!dataUrl || dataUrl === 'data:,') {
          throw new Error('Failed to generate image');
        }
        const imgProps = doc.getImageProperties(dataUrl);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        doc.save(`${invoiceNumber}.pdf`);
      })
      .catch(err => {
        console.error('PDF Export Error:', err);
        alert('حدث خطأ أثناء تصدير ملف PDF. يرجى المحاولة مرة أخرى.');
      });
  };

  const generateImage = () => {
    if (!invoiceRef.current) return;
    toPng(invoiceRef.current, { quality: 1, backgroundColor: '#fff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${invoiceNumber}.png`;
        link.href = dataUrl;
        link.click();
      });
  };

  const handleQuickShare = async () => {
    const shopName = "أركان لقطع الغيار";
    const summary = `فاتورة من ${shopName}\nرقم: ${invoiceNumber}\nالإجمالي: ${total} د.ل`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'فاتورة أركان',
          text: summary,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(summary);
      alert('تم نسخ ملخص الفاتورة');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Section: Invoice Info & Customer Selection */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-100">
          <div className="flex gap-8">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">رقم الفاتورة</label>
              <div className="text-lg font-black text-slate-900">{invoiceNumber}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">التاريخ</label>
              <div className="text-lg font-bold text-slate-700">{new Date().toLocaleDateString('ar-LY')}</div>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ملاحظات الفاتورة</label>
            <input 
              type="text"
              placeholder="أضف ملاحظات هنا..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isWalkIn ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
              <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {isWalkIn ? 'زبون نقدي (عابر)' : customer?.name || 'اختر زبوناً'}
              </h3>
              <p className="text-sm text-slate-500">
                {isWalkIn ? 'فاتورة نقدية سريعة' : `رقم الهاتف: ${customer?.phone || '---'}`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsWalkIn(true);
                setCustomer(null);
              }}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${isWalkIn ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              زبون عابر
            </button>
            <button 
              onClick={() => setShowCustomerSearch(true)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${!isWalkIn ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {customer ? 'تغيير الزبون' : 'اختيار زبون'}
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-sm hover:bg-emerald-100 transition-all flex items-center gap-2"
            >
              <UserPlus size={16} />
              إضافة زبون
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Item Search & List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن قطعة لإضافتها (الاسم، OEM، باركود...)" 
                className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                value={partSearchQuery}
                onChange={(e) => setPartSearchQuery(e.target.value)}
              />
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {partSearchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-40 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto"
                  >
                    {partSearchResults.map(part => (
                      <button
                        key={part.id}
                        onClick={() => {
                          onAddItem(part);
                          setPartSearchQuery('');
                          setPartSearchResults([]);
                        }}
                        className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-0 group"
                      >
                        <div className="text-right">
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700">{part.part_name_ar}</div>
                          <div className="text-xs text-slate-500 font-mono">{part.oem_number}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <div className="text-xs text-slate-400">السعر</div>
                            <div className="font-bold text-emerald-600">{part.selling_price} د.ل</div>
                          </div>
                          <div className="text-left">
                            <div className="text-xs text-slate-400">المخزون</div>
                            <div className={`font-bold ${part.quantity > 0 ? 'text-slate-600' : 'text-red-600'}`}>
                              {part.quantity}
                            </div>
                          </div>
                          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={18} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={() => setShowAddPartModal(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <PackagePlus size={20} />
              إضافة صنف جديد
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <PlusCircle className="text-emerald-500" size={18} />
            قائمة الأصناف ({items.length})
          </h3>
          <button 
            onClick={clearInvoice}
            className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1"
          >
            <Trash2 size={16} />
            إفراغ الفاتورة
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm">
                <th className="px-6 py-4 font-semibold">اسم القطعة / OEM</th>
                <th className="px-6 py-4 font-semibold text-center">الكمية</th>
                <th className="px-6 py-4 font-semibold text-center">السعر</th>
                <th className="px-6 py-4 font-semibold text-center">الخصم</th>
                <th className="px-6 py-4 font-semibold text-center">الإجمالي</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={48} strokeWidth={1} className="opacity-20" />
                      <p>لا توجد أصناف مضافة حالياً</p>
                      <p className="text-xs">استخدم وحدة البحث لإضافة قطع غيار للفاتورة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{item.oem_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                      {item.selling_price} د.ل
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number"
                        value={item.discount || 0}
                        onChange={(e) => updateDiscount(item.id, Number(e.target.value))}
                        className="w-20 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                      />
                    </td>
                    <td className="px-6 py-4 text-center font-black text-emerald-600 text-lg">
                      {(item.selling_price * item.quantity) - (item.discount || 0)} د.ل
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section: Totals & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment & Totals */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <CreditCard size={18} className="text-blue-500" />
                طريقة الدفع والتحصيل
              </h4>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setPaymentType('cash')}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${paymentType === 'cash' ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <Banknote size={20} />
                  نقدي
                </button>
                <button 
                  onClick={() => setPaymentType('credit')}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${paymentType === 'credit' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <CreditCard size={20} />
                  آجل (دين)
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">المبلغ المدفوع حالياً</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">د.ل</span>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-600">المتبقي في الذمة:</span>
                  <span className={`text-xl font-black ${remainingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {remainingBalance} د.ل
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl">
              <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">ملخص الحساب</h4>
              
              <div className="flex justify-between items-center text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{subtotal} د.ل</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-600">
                <span>خصم إضافي للفاتورة:</span>
                <input 
                  type="number"
                  value={invoiceDiscount}
                  onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-center bg-white border border-slate-200 rounded-md font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">الإجمالي النهائي:</span>
                <span className="text-3xl font-black text-emerald-600">{total} د.ل</span>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSave}
                  disabled={items.length === 0 || isSaving}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : (
                    <>
                      <Save size={24} />
                      حفظ الفاتورة
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
          <h4 className="font-bold text-slate-800 mb-2">إجراءات سريعة</h4>
          
          <button 
            onClick={handlePrint}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-3 px-4 hover:bg-slate-200 transition-all"
          >
            <Printer size={20} className="text-slate-500" />
            طباعة الفاتورة
          </button>
          
          <button 
            onClick={exportAsPDF}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-3 px-4 hover:bg-slate-200 transition-all"
          >
            <FileText size={20} className="text-red-500" />
            تصدير كـ PDF
          </button>
          
          <button 
            onClick={generateWhatsAppSummary}
            className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center gap-3 px-4 hover:bg-emerald-100 transition-all"
          >
            <MessageSquare size={20} className="text-emerald-500" />
            إرسال ملخص واتساب
          </button>
          
          <button 
            onClick={generateImage}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-3 px-4 hover:bg-slate-200 transition-all"
          >
            <ImageIcon size={20} className="text-blue-500" />
            حفظ كصورة
          </button>

          <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
            <button 
              onClick={handleQuickShare}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              <Share2 size={20} />
              مشاركة سريعة
            </button>
            
            <button 
              onClick={() => {
                if (window.confirm('هل أنت متأكد من إلغاء الفاتورة؟ سيتم مسح جميع البيانات.')) {
                  clearInvoice();
                  setCustomer(null);
                  setIsWalkIn(true);
                  setNotes('');
                }
              }}
              className="w-full py-3 bg-white text-red-500 border border-red-100 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-red-50 transition-all"
            >
              <X size={20} />
              إلغاء الفاتورة
            </button>
          </div>
        </div>
      </div>

      {/* Customer Search Modal */}
      <AnimatePresence>
        {showCustomerSearch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-xl">اختيار زبون</h3>
                <button onClick={() => setShowCustomerSearch(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {customers.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => {
                        setCustomer(c);
                        setIsWalkIn(false);
                        setShowCustomerSearch(false);
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100 group"
                    >
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-sm text-slate-500">{c.phone}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-slate-400 mb-1">الرصيد الحالي</div>
                        <div className="font-bold text-red-600">{c.current_balance} د.ل</div>
                      </div>
                    </button>
                  ))}
                  
                  {customers.length === 0 && customerSearchQuery.length > 1 && (
                    <div className="text-center py-8 text-slate-400">
                      <p>لا يوجد زبون بهذا الاسم</p>
                      <button 
                        onClick={() => {
                          setShowAddModal(true);
                        }}
                        className="mt-4 text-blue-600 font-bold flex items-center gap-2 mx-auto"
                      >
                        <UserPlus size={18} />
                        إضافة زبون جديد
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Printable Layout */}
      <div className="hidden">
        <div ref={invoiceRef} id="printable-invoice" className="p-10 bg-white text-slate-900 font-sans" dir="rtl" style={{ width: '210mm', minHeight: '297mm' }}>
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-2">أركان لقطع الغيار</h1>
              <p className="text-lg text-slate-600">طرابلس، ليبيا - شارع قطع الغيار</p>
              <p className="text-lg text-slate-600">هاتف: 091-0000000 / 092-0000000</p>
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-black text-slate-400 uppercase mb-2">فاتورة مبيعات</h2>
              <div className="space-y-1 text-lg">
                <p><span className="font-bold">رقم الفاتورة:</span> {invoiceNumber}</p>
                <p><span className="font-bold">التاريخ:</span> {new Date().toLocaleDateString('ar-LY')}</p>
                <p><span className="font-bold">الوقت:</span> {new Date().toLocaleTimeString('ar-LY')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-black text-slate-900 mb-4 border-b border-slate-200 pb-2">بيانات الزبون</h3>
              <div className="space-y-2 text-lg">
                <p><span className="font-bold">الاسم:</span> {isWalkIn ? 'زبون نقدي' : customer?.name}</p>
                {!isWalkIn && (
                  <>
                    <p><span className="font-bold">الهاتف:</span> {customer?.phone}</p>
                    <p><span className="font-bold">الرصيد الحالي:</span> {customer?.current_balance} د.ل</p>
                  </>
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-black text-slate-900 mb-4 border-b border-slate-200 pb-2">تفاصيل الدفع</h3>
              <div className="space-y-2 text-lg">
                <p><span className="font-bold">طريقة الدفع:</span> {paymentType === 'cash' ? 'نقدي' : 'آجل'}</p>
                <p><span className="font-bold">حالة الفاتورة:</span> {remainingBalance <= 0 ? 'مدفوعة بالكامل' : 'متبقي ذمة'}</p>
              </div>
            </div>
          </div>

          <table className="w-full mb-10 border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-4 text-right border border-slate-900">الصنف</th>
                <th className="p-4 text-center border border-slate-900">OEM</th>
                <th className="p-4 text-center border border-slate-900">الكمية</th>
                <th className="p-4 text-center border border-slate-900">السعر</th>
                <th className="p-4 text-center border border-slate-900">الخصم</th>
                <th className="p-4 text-center border border-slate-900">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4 border border-slate-200 font-bold">{item.name}</td>
                  <td className="p-4 border border-slate-200 text-center font-mono">{item.oem_number}</td>
                  <td className="p-4 border border-slate-200 text-center">{item.quantity}</td>
                  <td className="p-4 border border-slate-200 text-center">{item.selling_price}</td>
                  <td className="p-4 border border-slate-200 text-center">{item.discount || 0}</td>
                  <td className="p-4 border border-slate-200 text-center font-bold">{(item.selling_price * item.quantity) - (item.discount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-80 space-y-3 bg-slate-900 text-white p-6 rounded-2xl">
              <div className="flex justify-between text-lg">
                <span>المجموع الفرعي:</span>
                <span>{subtotal} د.ل</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>الخصم الإضافي:</span>
                <span>{invoiceDiscount} د.ل</span>
              </div>
              <div className="flex justify-between text-2xl font-black border-t border-white/20 pt-3">
                <span>الإجمالي:</span>
                <span>{total} د.ل</span>
              </div>
              <div className="flex justify-between text-lg text-emerald-400">
                <span>المدفوع:</span>
                <span>{paidAmount} د.ل</span>
              </div>
              <div className="flex justify-between text-lg text-red-400">
                <span>المتبقي:</span>
                <span>{remainingBalance} د.ل</span>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-slate-200 text-center text-slate-400 text-sm">
            <p>شكراً لزيارتكم - أركان لقطع الغيار تتمنى لكم رحلة آمنة</p>
            <p className="mt-2 italic">صدرت هذه الفاتورة إلكترونياً بواسطة نظام أركان لإدارة المحلات</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <AnimatePresence>
        {showAddModal && (
          <AddCustomerModal 
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onCustomerSaved={handleCustomerSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddPartModal && (
          <AddPartModal 
            isOpen={showAddPartModal}
            onClose={() => setShowAddPartModal(false)}
            onPartSaved={handlePartSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
