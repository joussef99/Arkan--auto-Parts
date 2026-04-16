import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  FileText, 
  MessageSquare, 
  UserPlus, 
  User, 
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Save,
  Package,
  Filter,
  ChevronDown,
  ArrowRightLeft,
  AlertTriangle,
  History,
  ShoppingCart,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Car,
  Settings,
  Wrench,
  Zap,
  Thermometer,
  Disc,
  Wind,
  Droplet,
  Activity,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Part, Brand, Category, InvoiceItem, Model, YearRange, Customer } from '../types';
import { AddCustomerModal } from './AddCustomerModal';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface SalesCenterProps {
  onSave: (invoiceData: any) => Promise<void>;
}

export const SalesCenter: React.FC<SalesCenterProps> = ({ onSave }) => {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'catalog' | 'review' | 'history'>('catalog');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previousInvoices, setPreviousInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<any | null>(null);

  // --- Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [parts, setParts] = useState<Part[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isSearching, setIsSearching] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [years, setYears] = useState<YearRange[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // --- Catalog State ---
  type CatalogStep = 'brand' | 'model' | 'year' | 'system' | 'engine' | 'parts';
  const [catalogStep, setCatalogStep] = useState<CatalogStep>('brand');
  
  const [selectedBrandObj, setSelectedBrandObj] = useState<Brand | null>(null);
  const [selectedModelObj, setSelectedModelObj] = useState<Model | null>(null);
  const [selectedYearObj, setSelectedYearObj] = useState<YearRange | null>(null);
  const [selectedSystemObj, setSelectedSystemObj] = useState<Category | null>(null);
  const [selectedEngineObj, setSelectedEngineObj] = useState<{id: string, name: string} | null>(null);

  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');

  const SUPPORTED_BRANDS = [
    'Toyota', 'Nissan', 'Mitsubishi', 'Mazda', 'Honda', 'Suzuki', 'Subaru', 'Lexus',
    'Hyundai', 'Kia', 'Daewoo', 'Genesis'
  ];

  const filteredBrands = brands.filter(b => 
    SUPPORTED_BRANDS.some(sb => b.name_en?.toLowerCase() === sb.toLowerCase() || b.name.toLowerCase().includes(sb.toLowerCase()))
  );

  const MOCK_ENGINES = [
    { id: '1.6L', name: '1.6L' },
    { id: '1.8L', name: '1.8L' },
    { id: '2.0L', name: '2.0L' },
    { id: '2.4L', name: '2.4L' },
    { id: '3.0L', name: '3.0L' },
  ];

  const getSystemIcon = (name: string) => {
    if (name.includes('محرك')) return <Activity size={32} />;
    if (name.includes('تبريد')) return <Thermometer size={32} />;
    if (name.includes('كهرباء')) return <Zap size={32} />;
    if (name.includes('هيكل')) return <Car size={32} />;
    if (name.includes('تعليق')) return <Settings size={32} />;
    if (name.includes('فرامل')) return <Disc size={32} />;
    if (name.includes('وقود')) return <Droplet size={32} />;
    if (name.includes('تكييف')) return <Wind size={32} />;
    if (name.includes('ناقل')) return <Settings size={32} />;
    return <Wrench size={32} />;
  };

  // --- Invoice State ---
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'transfer'>('cash');
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [invoiceNumber] = useState(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const invoiceRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Data Fetching ---
  useEffect(() => {
    fetch('/api/brands').then(res => res.json()).then(setBrands).catch(() => setBrands([]));
    fetch('/api/year-ranges').then(res => res.json()).then(setYears).catch(() => setYears([]));
    fetch('/api/categories').then(res => res.json()).then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (selectedBrandObj) {
      fetch(`/api/models?brand_id=${selectedBrandObj.id}`).then(res => res.json()).then(setModels).catch(() => setModels([]));
    } else {
      setModels([]);
    }
  }, [selectedBrandObj]);

  const fetchParts = useCallback(async () => {
    setIsSearching(true);
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.append('q', searchQuery);
    } else {
      if (selectedBrandObj) params.append('brand', selectedBrandObj.id.toString());
      if (selectedModelObj) params.append('model', selectedModelObj.id.toString());
      if (selectedYearObj) params.append('year', selectedYearObj.id.toString());
      if (selectedSystemObj) params.append('category', selectedSystemObj.id.toString());
    }
    
    params.append('availability', availabilityFilter);

    try {
      const res = await fetch(`/api/parts?${params}`);
      const data = await res.json();
      setParts(Array.isArray(data) ? data : []);
      setVisibleCount(20);
    } catch (err) {
      setParts([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedBrandObj, selectedModelObj, selectedYearObj, selectedSystemObj, availabilityFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchParts, 300);
    return () => clearTimeout(timer);
  }, [fetchParts]);

  useEffect(() => {
    if (customerSearchQuery.length > 1) {
      fetch(`/api/customers?q=${customerSearchQuery}`)
        .then(res => res.json())
        .then(setCustomers);
    }
  }, [customerSearchQuery]);

  const fetchPreviousInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setPreviousInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPreviousInvoices();
    }
  }, [activeTab, fetchPreviousInvoices]);

  const fetchInvoiceDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      setSelectedInvoice(data);
    } catch (err) {
      console.error('Failed to fetch invoice details', err);
    }
  };

  // --- Calculations ---
  const subtotal = invoiceItems.reduce((acc, item) => acc + (item.selling_price * item.quantity) - (item.discount || 0), 0);
  const total = subtotal - invoiceDiscount;
  const remainingBalance = total - paidAmount;

  useEffect(() => {
    if (paymentType === 'cash' || paymentType === 'transfer') {
      setPaidAmount(total);
    }
  }, [total, paymentType]);

  // --- Handlers ---
  const addToInvoice = (part: Part) => {
    if (part.quantity === 0) return;
    setInvoiceItems(prev => {
      const existing = prev.find(item => item.id === part.id);
      if (existing) {
        return prev.map(item => 
          item.id === part.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...part, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateDiscount = (id: number, discount: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, discount };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (invoiceItems.length === 0) return;
    if (isWalkIn && paidAmount < total) {
      alert('لا يمكن إنشاء فاتورة بآجل لزبون نقدي. يرجى اختيار عميل أو دفع كامل المبلغ.');
      return;
    }
    setIsSaving(true);
    try {
      console.log("Create invoice button clicked");
      const newInvoiceId = await onSave({
        customer_id: customer?.id || null,
        items: invoiceItems,
        payment_type: paymentType,
        discount: invoiceDiscount,
        total_amount: total,
        paid_amount: paidAmount,
        notes
      });
      
      console.log("Invoice creation success, ID:", newInvoiceId);
      
      // Fetch the newly created invoice details
      const res = await fetch(`/api/invoices/${newInvoiceId}`);
      if (!res.ok) throw new Error("Failed to fetch created invoice details");
      const newInvoice = await res.json();
      
      setCreatedInvoice(newInvoice);
      
      // Refresh stock and history
      fetchParts();
      fetchPreviousInvoices();
      
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('حدث خطأ أثناء إنشاء الفاتورة');
    } finally {
      setIsSaving(false);
    }
  };

  const resetNewSale = () => {
    setInvoiceItems([]);
    setActiveTab('catalog');
    setCustomer(null);
    setIsWalkIn(true);
    setPaidAmount(0);
    setInvoiceDiscount(0);
    setNotes('');
    setCreatedInvoice(null);
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟ سيتم إرجاع المخزون وتحديث أرصدة الزبائن والصندوق.')) return;
    
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل حذف الفاتورة');
      }
      showFeedback('تم حذف الفاتورة بنجاح', 'success');
      setActiveTab('history');
      setSelectedInvoice(null);
      // Refresh previous invoices if needed, but it will fetch on mount when tab changes
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showFeedback((error as Error).message, 'error');
    }
  };

  const handleEditInvoice = async (invoice: any) => {
    if (!window.confirm('تعديل الفاتورة سيقوم بإلغاء الفاتورة الحالية وفتحها في شاشة البيع. هل تريد المتابعة؟')) return;

    try {
      // 1. Delete the old invoice
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل إلغاء الفاتورة القديمة');
      }

      // 2. Load data into state
      setInvoiceItems(invoice.items.map((item: any) => ({
        id: item.part_id,
        part_name_ar: item.part_name_ar,
        oem_number: item.oem_number,
        manufacturer_code: item.manufacturer_code,
        quantity: item.quantity,
        selling_price: item.unit_price,
        discount: item.discount || 0
      })));
      
      if (invoice.customer_id) {
        setIsWalkIn(false);
        // We need to fetch the customer object or just set the ID and name
        setCustomer({
          id: invoice.customer_id,
          name: invoice.customer_name,
          phone: invoice.customer_phone,
          current_balance: 0 // We might need to fetch the real balance if needed
        });
      } else {
        setIsWalkIn(true);
        setCustomer(null);
      }

      setPaymentType(invoice.payment_type);
      setInvoiceDiscount(invoice.discount || 0);
      setPaidAmount(invoice.paid_amount || 0);

      // 3. Switch to new sale tab
      setSelectedInvoice(null);
      setActiveTab('new');
      showFeedback('تم فتح الفاتورة للتعديل', 'success');
    } catch (error) {
      console.error('Error editing invoice:', error);
      showFeedback((error as Error).message, 'error');
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F: Focus Search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl+S: Save Sale
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+N: New Customer
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowAddCustomerModal(true);
      }
      // Delete: Remove selected item (if any logic for selection exists, otherwise just generic delete)
      // For now, we don't have a "selected" item in the table, but we could add it.
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // --- Export Helpers ---
  const exportAsPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const dataUrl = await toJpeg(invoiceRef.current, { quality: 0.95, backgroundColor: '#fff' });
      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('Invalid dataUrl generated');
      }
      const imgProps = doc.getImageProperties(dataUrl);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const fileName = selectedInvoice ? `Invoice-${String(selectedInvoice.id).padStart(6, '0')}.pdf` : `${invoiceNumber}.pdf`;
      doc.save(fileName);
      console.log("تم حفظ الفاتورة بصيغة PDF");
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('حدث خطأ أثناء حفظ PDF');
    }
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    try {
      const printContents = invoiceRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('تعذر فتح الطباعة');
      }
      
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>طباعة الفاتورة</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
              body { 
                font-family: 'Cairo', sans-serif; 
                padding: 20px;
                color: #000;
              }
              * {
                box-sizing: border-box;
              }
              @media print {
                body { padding: 0; }
                @page { margin: 1cm; }
              }
            </style>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${printContents}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Print Error:', error);
      alert('تعذر فتح الطباعة');
    }
  };

  const sendWhatsApp = () => {
    try {
      const shopName = "أركان لقطع الغيار";
      const date = new Date().toLocaleDateString('ar-LY');
      const customerName = customer?.name || 'زبون نقدي';
      
      let itemsList = invoiceItems.map(item => 
        `- ${item.part_name_ar} × ${item.quantity} = ${item.quantity * item.selling_price} د.ل`
      ).join('\n');

      const summary = `${shopName}\nفاتورة رقم: ${invoiceNumber}\nالتاريخ: ${date}\n\nالعميل: ${customerName}\n\n${itemsList}\n\nالإجمالي: ${total} د.ل\nالمدفوع: ${paidAmount} د.ل\nالمتبقي: ${total - paidAmount} د.ل\n\nشكراً لتعاملكم معنا`;
      
      window.open(`https://wa.me/${customer?.phone || ''}?text=${encodeURIComponent(summary)}`, '_blank');
      console.log("تم تجهيز الفاتورة للمشاركة عبر واتساب");
    } catch (err) {
      console.error("حدث خطأ أثناء تجهيز المشاركة", err);
      alert("حدث خطأ أثناء تجهيز المشاركة");
    }
  };

  const renderBreadcrumbs = () => {
    if (searchQuery) return null;

    return (
      <div className="flex items-center gap-2 p-4 border-b border-slate-100 bg-slate-50/50 text-sm font-bold text-slate-600 overflow-x-auto whitespace-nowrap custom-scrollbar shrink-0">
        <button onClick={() => setCatalogStep('brand')} className={`hover:text-emerald-600 ${catalogStep === 'brand' ? 'text-emerald-600' : ''}`}>اختيار السيارة</button>
        {selectedBrandObj && (
          <>
            <ChevronLeft size={16} className="text-slate-400" />
            <button onClick={() => setCatalogStep('model')} className={`hover:text-emerald-600 ${catalogStep === 'model' ? 'text-emerald-600' : ''}`}>{selectedBrandObj.name}</button>
          </>
        )}
        {selectedModelObj && (
          <>
            <ChevronLeft size={16} className="text-slate-400" />
            <button onClick={() => setCatalogStep('year')} className={`hover:text-emerald-600 ${catalogStep === 'year' ? 'text-emerald-600' : ''}`}>{selectedModelObj.name}</button>
          </>
        )}
        {selectedYearObj && (
          <>
            <ChevronLeft size={16} className="text-slate-400" />
            <button onClick={() => setCatalogStep('system')} className={`hover:text-emerald-600 ${catalogStep === 'system' ? 'text-emerald-600' : ''}`}>{selectedYearObj.label}</button>
          </>
        )}
        {selectedSystemObj && (
          <>
            <ChevronLeft size={16} className="text-slate-400" />
            <button onClick={() => setCatalogStep(selectedSystemObj.name === 'المحرك' ? 'engine' : 'parts')} className={`hover:text-emerald-600 ${catalogStep === 'engine' || (catalogStep === 'parts' && !selectedEngineObj) ? 'text-emerald-600' : ''}`}>{selectedSystemObj.name}</button>
          </>
        )}
        {selectedEngineObj && (
          <>
            <ChevronLeft size={16} className="text-slate-400" />
            <button onClick={() => setCatalogStep('parts')} className={`hover:text-emerald-600 ${catalogStep === 'parts' ? 'text-emerald-600' : ''}`}>{selectedEngineObj.name}</button>
          </>
        )}
      </div>
    );
  };

  const renderCatalog = () => {
    if (searchQuery) return null;

    switch (catalogStep) {
      case 'brand':
        return (
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <h3 className="text-xl font-black text-slate-800 mb-6">اختر العلامة التجارية</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredBrands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => {
                    setSelectedBrandObj(brand);
                    setCatalogStep('model');
                    setSelectedModelObj(null);
                    setSelectedYearObj(null);
                    setSelectedSystemObj(null);
                    setSelectedEngineObj(null);
                  }}
                  className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center gap-4 group"
                >
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="h-12 object-contain group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                  ) : (
                    <Car size={48} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  )}
                  <span className="font-bold text-slate-700 group-hover:text-emerald-600">{brand.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'model':
        return (
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <h3 className="text-xl font-black text-slate-800 mb-6">اختر الموديل</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModelObj(model);
                    setCatalogStep('year');
                    setSelectedYearObj(null);
                    setSelectedSystemObj(null);
                    setSelectedEngineObj(null);
                  }}
                  className="bg-white p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:shadow-md hover:-translate-y-1 transition-all text-center font-bold text-slate-700 hover:text-emerald-600"
                >
                  {model.name}
                </button>
              ))}
              {models.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400">لا توجد موديلات متاحة لهذه العلامة</div>
              )}
            </div>
          </div>
        );
      case 'year':
        return (
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <h3 className="text-xl font-black text-slate-800 mb-6">اختر سنة الصنع</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {years.map(year => (
                <button
                  key={year.id}
                  onClick={() => {
                    setSelectedYearObj(year);
                    setCatalogStep('system');
                    setSelectedSystemObj(null);
                    setSelectedEngineObj(null);
                  }}
                  className="bg-white p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:shadow-md hover:-translate-y-1 transition-all text-center font-black text-xl text-slate-700 hover:text-emerald-600"
                >
                  {year.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <h3 className="text-xl font-black text-slate-800 mb-6">اختر النظام</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedSystemObj(category);
                    if (category.name === 'المحرك') {
                      setCatalogStep('engine');
                    } else {
                      setCatalogStep('parts');
                    }
                    setSelectedEngineObj(null);
                  }}
                  className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center gap-4 group"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors`}>
                    {getSystemIcon(category.name)}
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-emerald-600">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'engine':
        return (
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <h3 className="text-xl font-black text-slate-800 mb-6">اختر المحرك</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {MOCK_ENGINES.map(engine => (
                <button
                  key={engine.id}
                  onClick={() => {
                    setSelectedEngineObj(engine);
                    setCatalogStep('parts');
                  }}
                  className="bg-white p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:shadow-md hover:-translate-y-1 transition-all text-center font-black text-xl text-slate-700 hover:text-emerald-600"
                >
                  {engine.name}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPartsTable = () => {
    if (!searchQuery && catalogStep !== 'parts') return null;

    return (
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col">
        {searchQuery && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Search size={18} className="text-emerald-500" />
              نتائج البحث ({parts.length})
            </h3>
          </div>
        )}
        {!searchQuery && catalogStep === 'parts' && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Package size={18} className="text-emerald-500" />
              القطع المتوفرة ({parts.length})
            </h3>
            <select 
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
            >
              <option value="all">كل التوفر</option>
              <option value="available">متوفر فقط</option>
              <option value="low">كمية قليلة</option>
              <option value="out">غير متوفر</option>
            </select>
          </div>
        )}
        
        <table className="w-full text-right border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
              <th className="px-4 py-3 font-bold">اسم القطعة</th>
              <th className="px-4 py-3 font-bold">رقم القطعة OEM</th>
              <th className="px-4 py-3 font-bold">الكود الخاص بالشركة المصنعة</th>
              <th className="px-4 py-3 font-bold text-center">الكمية المتوفرة</th>
              <th className="px-4 py-3 font-bold text-center">موقع المخزن</th>
              <th className="px-4 py-3 font-bold text-center">السعر</th>
              <th className="px-4 py-3 font-bold text-center">إضافة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isSearching ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري البحث...</span>
                  </div>
                </td>
              </tr>
            ) : parts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-slate-400 italic">
                  لا توجد نتائج تطابق البحث
                </td>
              </tr>
            ) : (
              parts.slice(0, visibleCount).map(part => (
                <tr 
                  key={part.id} 
                  onDoubleClick={() => addToInvoice(part)}
                  className="hover:bg-emerald-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{part.part_name_ar}</div>
                    <div className="text-[10px] text-slate-400">{part.brand_name} - {part.model_name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{part.oem_number}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{part.manufacturer_code || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      part.quantity > part.min_stock_level 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : part.quantity > 0 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {part.quantity} {part.quantity > part.min_stock_level ? 'متوفر' : part.quantity > 0 ? 'قليل' : 'نفذ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-bold text-slate-500">{part.shelf_location_id}</td>
                  <td className="px-4 py-3 text-center font-black text-emerald-600">{part.selling_price} د.ل</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => addToInvoice(part)}
                      disabled={part.quantity === 0}
                      className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {parts.length > visibleCount && (
              <tr>
                <td colSpan={7} className="py-6 text-center">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    عرض المزيد ({parts.length - visibleCount} متبقي)
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden font-sans relative" dir="rtl">
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl flex items-center gap-3 font-bold shadow-lg z-50 ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Level Tabs */}
      <div className="flex items-center gap-4 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'catalog' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Search size={20} />
          اختيار القطع
        </button>
        <button
          onClick={() => setActiveTab('review')}
          disabled={invoiceItems.length === 0 && activeTab !== 'review'}
          className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'review' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ShoppingCart size={20} />
          مراجعة الفاتورة
          {invoiceItems.length > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">
              {invoiceItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'history' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <History size={20} />
          الفواتير السابقة
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'catalog' ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col gap-4"
            >
              {/* ZONE A: Search & Filter Panel */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Search className="text-emerald-500" size={24} />
                      مركز المبيعات
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                        <ShoppingCart size={18} className="text-emerald-500" />
                        <span>عدد الأصناف المختارة: {invoiceItems.length}</span>
                      </div>
                      <button 
                        disabled={invoiceItems.length === 0}
                        onClick={() => setActiveTab('review')}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        متابعة إلى الفاتورة
                        <ArrowRightLeft size={18} className="rotate-180" />
                      </button>
                    </div>
                  </div>

                  {invoiceItems.length === 0 && (
                    <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 inline-block w-fit">
                      اختر صنفًا واحدًا أو أكثر للمتابعة إلى الفاتورة
                    </div>
                  )}

                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="ابحث عن قطعة (الاسم، OEM، باركود، كود المصنع، موقع الرف...)" 
                      className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ZONE B: Catalog & Search Results */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                {renderBreadcrumbs()}
                {renderCatalog()}
                {renderPartsTable()}
              </div>
            </motion.div>
          ) : activeTab === 'review' ? (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col gap-4"
            >
              {createdInvoice ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-emerald-200 p-8 text-center overflow-y-auto">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 mb-2">تم إنشاء الفاتورة بنجاح</h2>
                  <p className="text-slate-500 mb-8 text-lg">رقم الفاتورة: <span className="font-bold text-slate-900">{createdInvoice.id}</span></p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-10">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 mb-1">اسم العميل</div>
                      <div className="font-bold text-slate-800">{createdInvoice.customer_name || 'زبون نقدي'}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 mb-1">التاريخ</div>
                      <div className="font-bold text-slate-800">{new Date(createdInvoice.date).toLocaleDateString('ar-LY')}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 mb-1">الإجمالي</div>
                      <div className="font-black text-emerald-600">{createdInvoice.total_amount} د.ل</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 mb-1">طريقة الدفع</div>
                      <div className="font-bold text-slate-800">
                        {createdInvoice.payment_type === 'cash' ? 'نقدي' : createdInvoice.payment_type === 'credit' ? 'آجل' : 'تحويل'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 w-full max-w-3xl">
                    <button onClick={() => { setSelectedInvoice(createdInvoice); setTimeout(handlePrint, 100); }} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
                      <Printer size={20} />
                      طباعة الفاتورة
                    </button>
                    <button onClick={() => { setSelectedInvoice(createdInvoice); setTimeout(exportAsPDF, 100); }} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
                      <FileText size={20} />
                      حفظ PDF
                    </button>
                    <button onClick={() => {
                      try {
                        const shopName = "أركان لقطع الغيار";
                        const date = new Date(createdInvoice.date).toLocaleDateString('ar-LY');
                        const customerName = createdInvoice.customer_name || 'زبون نقدي';
                        
                        let itemsList = createdInvoice.items?.map((item: any) => 
                          `- ${item.part_name_ar} × ${item.quantity} = ${item.quantity * item.unit_price} د.ل`
                        ).join('\n') || '';

                        const summary = `${shopName}\nفاتورة رقم: ${createdInvoice.id}\nالتاريخ: ${date}\n\nالعميل: ${customerName}\n\n${itemsList}\n\nالإجمالي: ${createdInvoice.total_amount} د.ل\nالمدفوع: ${createdInvoice.paid_amount} د.ل\nالمتبقي: ${createdInvoice.total_amount - createdInvoice.paid_amount} د.ل\n\nشكراً لتعاملكم معنا`;
                        
                        window.open(`https://wa.me/${createdInvoice.customer_phone || ''}?text=${encodeURIComponent(summary)}`, '_blank');
                        console.log("تم تجهيز الفاتورة للمشاركة عبر واتساب");
                      } catch (err) {
                        console.error("حدث خطأ أثناء تجهيز المشاركة", err);
                        alert("حدث خطأ أثناء تجهيز المشاركة");
                      }
                    }} className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200 transition-colors flex items-center gap-2">
                      <MessageSquare size={20} />
                      إرسال واتساب
                    </button>
                    <button onClick={() => { setActiveTab('history'); setSelectedInvoice(createdInvoice); }} className="px-6 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors flex items-center gap-2">
                      <FileText size={20} />
                      فتح الفاتورة
                    </button>
                    <button onClick={resetNewSale} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
                      <Plus size={20} />
                      إنشاء فاتورة جديدة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex gap-4 overflow-hidden">
                  {/* Invoice Details */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">رقم الفاتورة</label>
                        <div className="text-lg font-black text-slate-900 font-mono">{invoiceNumber}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">التاريخ</label>
                        <div className="text-lg font-bold text-slate-700">{new Date().toLocaleDateString('ar-LY')}</div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">العميل</label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <User size={18} className={isWalkIn ? 'text-emerald-500' : 'text-blue-500'} />
                              <span className="font-bold">{isWalkIn ? 'زبون نقدي' : customer?.name}</span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setShowCustomerSearch(true)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><Search size={16} /></button>
                              <button onClick={() => setShowAddCustomerModal(true)} className="p-1 hover:bg-slate-200 rounded text-emerald-500"><UserPlus size={16} /></button>
                              {!isWalkIn && <button onClick={() => { setIsWalkIn(true); setCustomer(null); }} className="p-1 hover:bg-slate-200 rounded text-red-500"><X size={16} /></button>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">نوع الدفع</label>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setPaymentType('cash')}
                          className={`flex-1 py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${paymentType === 'cash' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                          <Banknote size={20} />
                          نقدي
                        </button>
                        <button 
                          onClick={() => setPaymentType('credit')}
                          className={`flex-1 py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${paymentType === 'credit' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                          <CreditCard size={20} />
                          آجل
                        </button>
                        <button 
                          onClick={() => setPaymentType('transfer')}
                          className={`flex-1 py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${paymentType === 'transfer' ? 'bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                          <ArrowRightLeft size={20} />
                          تحويل
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="font-black text-slate-700 flex items-center gap-2">
                        <ShoppingCart size={18} className="text-emerald-500" />
                        مراجعة الفاتورة
                      </h3>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                      {invoiceItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                          <ShoppingCart size={64} strokeWidth={1} className="opacity-20" />
                          <div className="text-xl font-bold">لا توجد أصناف في الفاتورة</div>
                          <button onClick={() => setActiveTab('catalog')} className="text-emerald-600 font-bold underline">رجوع لإضافة أصناف</button>
                        </div>
                      ) : (
                        <table className="w-full text-right border-collapse">
                          <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                              <th className="px-6 py-4 font-bold">اسم القطعة</th>
                              <th className="px-6 py-4 font-bold">الكمية والسعر</th>
                              <th className="px-6 py-4 font-bold">الخصم والإجمالي</th>
                              <th className="px-6 py-4 font-bold text-center">حذف</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {invoiceItems.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 align-top">
                                  <div className="font-bold text-slate-900 text-base">{item.part_name_ar}</div>
                                  <div className="text-xs text-slate-400 font-mono mt-1">{item.oem_number}</div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-slate-500 w-10">الكمية:</span>
                                      <div className="flex items-center justify-center gap-2 bg-slate-100 rounded-lg p-1 w-fit">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded shadow-sm text-slate-500 transition-all"><Minus size={14} /></button>
                                        <span className="w-8 text-center font-black text-base">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded shadow-sm text-slate-500 transition-all"><Plus size={14} /></button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-slate-500 w-10">السعر:</span>
                                      <span className="font-bold text-slate-700">{item.selling_price} د.ل</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-slate-500 w-10">الخصم:</span>
                                      <div className="relative">
                                        <input 
                                          type="number" 
                                          className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-left font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                          value={item.discount || 0}
                                          onChange={(e) => updateDiscount(item.id, Number(e.target.value))}
                                          dir="ltr"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">د.ل</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-slate-500 w-10">الصافي:</span>
                                      <span className="font-black text-emerald-600 text-lg">
                                        {(item.selling_price * item.quantity) - (item.discount || 0)} د.ل
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center align-middle">
                                  <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={20} /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Panel */}
                <div className="w-96 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-2">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-black text-slate-800 border-b border-slate-100 pb-3 mb-3">ملخص الفاتورة</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-500 text-sm">
                        <span className="font-bold">المجموع الفرعي:</span>
                        <span className="font-black">{subtotal} د.ل</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 text-sm">
                        <span className="font-bold">خصم إضافي:</span>
                        <div className="relative">
                          <input 
                            type="number" 
                            className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-emerald-500"
                            value={invoiceDiscount}
                            onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">د.ل</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-900">الإجمالي النهائي:</span>
                          <span className="text-2xl font-black text-emerald-600">{total} د.ل</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">المبلغ المدفوع</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-2xl font-black text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-500/10"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(Number(e.target.value))}
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">د.ل</span>
                        </div>
                      </div>
                      
                      {remainingBalance > 0 && (
                        <div className="p-3 bg-red-50 rounded-2xl border border-red-100 flex justify-between items-center animate-pulse">
                          <span className="font-bold text-red-600 text-sm">المتبقي (دين):</span>
                          <span className="text-lg font-black text-red-600">{remainingBalance} د.ل</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 space-y-2">
                      <button 
                        onClick={handleSave}
                        disabled={invoiceItems.length === 0 || isSaving || (isWalkIn && paidAmount < total)}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle2 size={20} />
                            إنشاء فاتورة
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => setActiveTab('catalog')}
                      className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowRightLeft size={18} />
                      رجوع إلى اختيار القطع
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('هل أنت متأكد من إلغاء الفاتورة؟')) {
                          resetNewSale();
                        }
                      }}
                      className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
                    >
                      إلغاء الفاتورة
                    </button>
                  </div>
                </div>
              </div>
              )}
            </motion.div>
          ) : activeTab === 'history' ? (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col gap-4"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-black text-slate-700 flex items-center gap-2">
                    <History size={18} className="text-emerald-500" />
                    الفواتير السابقة
                  </h3>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-right border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                      <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4 font-bold">رقم الفاتورة</th>
                        <th className="px-6 py-4 font-bold">التاريخ</th>
                        <th className="px-6 py-4 font-bold">اسم العميل</th>
                        <th className="px-6 py-4 font-bold text-center">عدد الأصناف</th>
                        <th className="px-6 py-4 font-bold text-center">الإجمالي</th>
                        <th className="px-6 py-4 font-bold text-center">نوع الدفع</th>
                        <th className="px-6 py-4 font-bold text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {previousInvoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600">{invoice.id}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-600">{new Date(invoice.date).toLocaleDateString('ar-LY')}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{invoice.customer_name || 'زبون نقدي'}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">{invoice.items_count}</td>
                          <td className="px-6 py-4 text-center font-black text-slate-900">{invoice.total_amount} د.ل</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              invoice.payment_type === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                              invoice.payment_type === 'credit' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {invoice.payment_type === 'cash' ? 'نقدي' : invoice.payment_type === 'credit' ? 'آجل' : 'تحويل'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => fetchInvoiceDetails(invoice.id)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="عرض الفاتورة">
                                <FileText size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {previousInvoices.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-20 text-center text-slate-400 font-bold">
                            لا توجد فواتير سابقة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Modals */}
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

                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
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
                        <div className={`font-bold ${c.current_balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {c.current_balance} د.ل
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {customers.length === 0 && customerSearchQuery.length > 1 && (
                    <div className="text-center py-8 text-slate-400">
                      <p>لا يوجد زبون بهذا الاسم</p>
                      <button 
                        onClick={() => {
                          setShowCustomerSearch(false);
                          setShowAddCustomerModal(true);
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

        {showAddCustomerModal && (
          <AddCustomerModal 
            isOpen={showAddCustomerModal}
            onClose={() => setShowAddCustomerModal(false)}
            onCustomerSaved={(newCustomer) => {
              setCustomer(newCustomer);
              setIsWalkIn(false);
              setShowAddCustomerModal(false);
            }}
          />
        )}

        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                  <FileText className="text-emerald-500" />
                  تفاصيل الفاتورة #{selectedInvoice.id}
                </h3>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-600 mb-1">أركان لقطع الغيار</h2>
                    <p className="text-sm text-slate-500">فاتورة مبيعات</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-700">التاريخ: {new Date(selectedInvoice.date).toLocaleDateString('ar-LY')}</p>
                    <p className="text-sm font-bold text-slate-700">العميل: {selectedInvoice.customer_name || 'زبون نقدي'}</p>
                    {selectedInvoice.customer_phone && <p className="text-sm text-slate-500">{selectedInvoice.customer_phone}</p>}
                  </div>
                </div>

                <table className="w-full text-right border-collapse mb-8">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-sm">
                      <th className="p-3 font-bold rounded-r-lg">القطعة</th>
                      <th className="p-3 font-bold">الكمية والسعر</th>
                      <th className="p-3 font-bold rounded-l-lg">الخصم والإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-3 align-top">
                          <div className="font-bold text-slate-800 text-base">{item.part_name_ar}</div>
                          <div className="text-xs text-slate-500 font-mono mt-1">{item.oem_number}</div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-10">الكمية:</span>
                              <span className="font-black text-slate-700">{item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-10">السعر:</span>
                              <span className="font-bold text-slate-700">{item.unit_price} د.ل</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-10">الخصم:</span>
                              <span className="font-bold text-slate-700">{item.discount || 0} د.ل</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-10">الصافي:</span>
                              <span className="font-black text-emerald-600 text-lg">{(item.quantity * item.unit_price) - (item.discount || 0)} د.ل</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>الإجمالي:</span>
                      <span>{selectedInvoice.total_amount + (selectedInvoice.discount || 0)} د.ل</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-red-500">
                        <span>الخصم:</span>
                        <span>{selectedInvoice.discount} د.ل</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-black text-emerald-600 pt-2 border-t border-slate-200">
                      <span>الصافي:</span>
                      <span>{selectedInvoice.total_amount} د.ل</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-600 pt-2 border-t border-slate-200">
                      <span>المدفوع ({selectedInvoice.payment_type === 'cash' ? 'نقدي' : selectedInvoice.payment_type === 'credit' ? 'آجل' : 'تحويل'}):</span>
                      <span>{selectedInvoice.paid_amount} د.ل</span>
                    </div>
                    {selectedInvoice.total_amount - selectedInvoice.paid_amount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-red-500">
                        <span>المتبقي:</span>
                        <span>{selectedInvoice.total_amount - selectedInvoice.paid_amount} د.ل</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 shrink-0">
                <div className="flex gap-3">
                  <button onClick={() => handleDeleteInvoice(selectedInvoice.id)} className="px-6 py-2.5 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors flex items-center gap-2">
                    <Trash2 size={18} />
                    حذف الفاتورة
                  </button>
                  <button onClick={() => handleEditInvoice(selectedInvoice)} className="px-6 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200 transition-colors flex items-center gap-2">
                    <Edit size={18} />
                    تعديل الفاتورة
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={handlePrint} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <Printer size={18} />
                    طباعة
                  </button>
                  <button onClick={exportAsPDF} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <FileText size={18} />
                    PDF
                  </button>
                  <button onClick={() => {
                    const summary = `فاتورة مبيعات - أركان لقطع الغيار\nرقم: ${selectedInvoice.id}\nالإجمالي: ${selectedInvoice.total_amount} د.ل\nشكراً لتعاملكم معنا!`;
                    window.open(`https://wa.me/${selectedInvoice.customer_phone || ''}?text=${encodeURIComponent(summary)}`, '_blank');
                  }} className="px-6 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200 transition-colors flex items-center gap-2">
                    <MessageSquare size={18} />
                    واتساب
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Printable Invoice (Off-screen for capture) */}
      <div id="printable-invoice-container" className="fixed -left-[5000px] top-0 opacity-0 pointer-events-none">
        <div ref={invoiceRef} id="printable-invoice" className="p-10 bg-white text-slate-900 font-sans" dir="rtl" style={{ width: '210mm', minHeight: '297mm' }}>
          <div className="flex justify-between items-start border-b-4 border-emerald-600 pb-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                <Package size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">أركان لقطع الغيار</h1>
                <p className="text-lg text-slate-600">طرابلس، ليبيا - شارع قطع الغيار</p>
                <p className="text-lg text-slate-600">هاتف: 091-0000000 / 092-0000000</p>
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-4xl font-black text-emerald-600 uppercase mb-2">فاتورة مبيعات</h2>
              <div className="space-y-1 text-lg">
                <p><span className="font-bold text-slate-500">رقم الفاتورة:</span> <span className="font-mono font-bold">{selectedInvoice ? `INV-${String(selectedInvoice.id).padStart(6, '0')}` : invoiceNumber}</span></p>
                <p><span className="font-bold text-slate-500">التاريخ:</span> <span className="font-bold">{selectedInvoice ? new Date(selectedInvoice.date).toLocaleDateString('ar-LY') : new Date().toLocaleDateString('ar-LY')}</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-emerald-600" />
                بيانات الزبون
              </h3>
              <div className="space-y-3 text-lg">
                <p className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold text-slate-500">الاسم:</span> <span className="font-bold">{selectedInvoice ? (selectedInvoice.customer_name || 'زبون نقدي') : (isWalkIn ? 'زبون نقدي' : customer?.name)}</span></p>
                {(selectedInvoice ? selectedInvoice.customer_phone : (!isWalkIn && customer?.phone)) && <p className="flex justify-between"><span className="font-bold text-slate-500">الهاتف:</span> <span className="font-bold">{selectedInvoice ? selectedInvoice.customer_phone : customer?.phone}</span></p>}
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-600" />
                تفاصيل الدفع
              </h3>
              <div className="space-y-3 text-lg">
                <p className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold text-slate-500">طريقة الدفع:</span> <span className="font-bold">{(selectedInvoice ? selectedInvoice.payment_type : paymentType) === 'cash' ? 'نقدي' : (selectedInvoice ? selectedInvoice.payment_type : paymentType) === 'credit' ? 'آجل' : 'تحويل'}</span></p>
                <p className="flex justify-between"><span className="font-bold text-slate-500">حالة الفاتورة:</span> <span className={`font-bold ${(selectedInvoice ? (selectedInvoice.total_amount - selectedInvoice.paid_amount) : remainingBalance) <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{(selectedInvoice ? (selectedInvoice.total_amount - selectedInvoice.paid_amount) : remainingBalance) <= 0 ? 'مدفوعة بالكامل' : 'متبقي ذمة'}</span></p>
              </div>
            </div>
          </div>

          <table className="w-full mb-10 border-collapse">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="p-4 text-right rounded-tr-xl font-bold">الصنف</th>
                <th className="p-4 text-right font-bold">الكمية والسعر</th>
                <th className="p-4 text-right rounded-tl-xl font-bold">الخصم والإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {(selectedInvoice ? selectedInvoice.items || [] : invoiceItems).map((item: any, idx: number) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4 border-b border-slate-200 align-top">
                    <div className="font-bold text-slate-800 text-base">{item.part_name_ar}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{item.oem_number}</div>
                  </td>
                  <td className="p-4 border-b border-slate-200 align-top">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-10">الكمية:</span>
                        <span className="font-black text-slate-700">{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-10">السعر:</span>
                        <span className="font-bold text-slate-700">{item.unit_price || item.selling_price} د.ل</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-b border-slate-200 align-top">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-10">الخصم:</span>
                        <span className="font-bold text-slate-700">{item.discount || 0} د.ل</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-10">الصافي:</span>
                        <span className="font-black text-emerald-600 text-lg">{((item.unit_price || item.selling_price) * item.quantity) - (item.discount || 0)} د.ل</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-end">
            <div className="w-1/2 pr-8">
              <div className="border-t-2 border-slate-300 pt-4 mt-20 w-64 text-center">
                <p className="font-bold text-slate-600">توقيع المستلم</p>
              </div>
            </div>
            <div className="w-96 space-y-3 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
              <div className="flex justify-between text-lg text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{selectedInvoice ? selectedInvoice.total_amount + (selectedInvoice.discount || 0) : subtotal} د.ل</span>
              </div>
              <div className="flex justify-between text-lg text-slate-600">
                <span>الخصم الإضافي:</span>
                <span className="font-bold">{selectedInvoice ? (selectedInvoice.discount || 0) : invoiceDiscount} د.ل</span>
              </div>
              <div className="flex justify-between text-2xl font-black border-t border-slate-200 pt-3 text-slate-900">
                <span>الإجمالي النهائي:</span>
                <span className="text-emerald-600">{selectedInvoice ? selectedInvoice.total_amount : total} د.ل</span>
              </div>
              <div className="flex justify-between text-lg text-slate-600 pt-2">
                <span>المدفوع:</span>
                <span className="font-bold">{selectedInvoice ? selectedInvoice.paid_amount : paidAmount} د.ل</span>
              </div>
              <div className="flex justify-between text-lg text-slate-600">
                <span>المتبقي:</span>
                <span className={`font-bold ${(selectedInvoice ? (selectedInvoice.total_amount - selectedInvoice.paid_amount) : remainingBalance) > 0 ? 'text-red-600' : 'text-slate-600'}`}>{(selectedInvoice ? (selectedInvoice.total_amount - selectedInvoice.paid_amount) : remainingBalance)} د.ل</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center text-slate-400 text-sm border-t border-slate-200 pt-8">
            <p>البضاعة المباعة لا ترد ولا تستبدل إلا بوجود الفاتورة الأصلية خلال 3 أيام من تاريخ الشراء.</p>
            <p className="mt-2">شكراً لتعاملكم معنا!</p>
          </div>
        </div>
      </div>

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        @media print {
          body * { visibility: hidden; }
          #printable-invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: relative; width: 100%; }
        }
      `}</style>
    </div>
  );
};
