import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  CreditCard, 
  History, 
  FileText, 
  ChevronLeft,
  UserPlus,
  Edit2,
  ExternalLink,
  DollarSign,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Share2,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Payment, StatementEntry } from '../types';
import { AddCustomerModal } from './AddCustomerModal';

export const CustomersScreen = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<'all' | 'debt' | 'settled' | 'credit' | 'no_debt'>('all');
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'info' | 'invoices' | 'payments' | 'statement'>('info');
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | undefined>(undefined);

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    note: ''
  });

  const [statement, setStatement] = useState<StatementEntry[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, [search, filter]);

  const fetchCustomers = async () => {
    const res = await fetch(`/api/customers?q=${search}&filter=${filter}`);
    const data = await res.json();
    setCustomers(data);
  };

  const handleCustomerSaved = (savedCustomer: Customer) => {
    if (editingCustomer?.id) {
      // Update existing
      setCustomers(prev => prev.map(c => c.id === savedCustomer.id ? savedCustomer : c));
      if (selectedCustomer?.id === savedCustomer.id) {
        setSelectedCustomer(savedCustomer);
      }
    } else {
      // Add new
      setCustomers(prev => [savedCustomer, ...prev]);
    }
    fetchCustomers(); // Also refetch to be sure and get latest from DB
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowAddModal(true);
  };

  const openCustomerProfile = async (customer: Customer) => {
    const res = await fetch(`/api/customers/${customer.id}`);
    const data = await res.json();
    setSelectedCustomer(data);
    setActiveProfileTab('info');
    fetchStatement(customer.id);
    fetchCustomerHistory(customer.id);
  };

  const fetchCustomerHistory = async (id: number) => {
    const [invRes, payRes] = await Promise.all([
      fetch(`/api/customers/${id}/invoices`),
      fetch(`/api/customers/${id}/payments`)
    ]);
    setCustomerInvoices(await invRes.json());
    setCustomerPayments(await payRes.json());
  };

  const handleDeleteCustomer = async (id: number) => {
    console.log(`[UI] Delete clicked for customer ID: ${id}`);
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      console.log(`[UI] Delete cancelled by user for customer ID: ${id}`);
      return;
    }
    
    console.log(`[UI] Delete confirmed for customer ID: ${id}`);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        console.log(`[UI] Delete success for customer ID: ${id}`);
        handleCustomerDeleted(id);
        alert('تم حذف العميل بنجاح');
      } else {
        const err = await res.json();
        console.log(`[UI] Delete blocked for customer ID: ${id}. Reason: ${err.error}`);
        alert(err.error || 'فشل حذف الزبون');
      }
    } catch (e) {
      console.error(`[UI] Delete error for customer ID: ${id}:`, e);
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCustomerDeleted = (id: number) => {
    console.log(`[UI] Updating customer list after deletion of ID: ${id}`);
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    }
    console.log(`[UI] Customer list updated.`);
  };

  const shareToWhatsApp = () => {
    if (!selectedCustomer) return;
    const text = `*كشف حساب: ${selectedCustomer.name}*\n` +
                 `التاريخ: ${new Date().toLocaleDateString('ar-LY')}\n` +
                 `--------------------------\n` +
                 `الرصيد الحالي: ${selectedCustomer.current_balance} د.ل\n` +
                 `إجمالي المشتريات: ${selectedCustomer.stats?.total_purchases || 0} د.ل\n` +
                 `إجمالي المدفوع: ${selectedCustomer.stats?.total_paid || 0} د.ل\n` +
                 `--------------------------\n` +
                 `شكراً لتعاملكم معنا - أركان لقطع الغيار`;
    
    const url = `https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const fetchStatement = async (id: number) => {
    const res = await fetch(`/api/customers/${id}/statement`);
    const data = await res.json();
    setStatement(data);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: selectedCustomer.id,
        amount: paymentData.amount,
        note: paymentData.note
      })
    });
    
    if (res.ok) {
      setShowPaymentModal(false);
      setPaymentData({ amount: 0, note: '' });
      openCustomerProfile(selectedCustomer); // Refresh profile
      fetchCustomers(); // Refresh list
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'walk-in': 'زبون عابر',
      'workshop': 'ورشة',
      'trader': 'تاجر',
      'company': 'شركة'
    };
    return labels[type] || type;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">إدارة الزبائن</h2>
            <p className="text-sm text-slate-500">متابعة الديون والمدفوعات والنشاط</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select 
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">الكل</option>
            <option value="debt">عليهم ديون</option>
            <option value="settled">خالصين (0)</option>
            <option value="credit">لديهم رصيد (دائنين)</option>
            <option value="no_debt">خالصين أو دائنين (0 أو أقل)</option>
          </select>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الهاتف..." 
              className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
          >
            <UserPlus size={18} />
            إضافة زبون
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-250px)]">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center">
            <span>قائمة الزبائن</span>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{customers.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => openCustomerProfile(c)}
                className={`w-full text-right p-4 rounded-xl mb-2 transition-all flex flex-col gap-1 border cursor-pointer ${
                  selectedCustomer?.id === c.id 
                    ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center group">
                  <span className="font-bold text-slate-900">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      c.current_balance > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {c.current_balance > 0 ? `${c.current_balance} د.ل` : 'خالص'}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(c.id);
                      }}
                      disabled={isDeleting}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-30"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone size={12} />
                  <span>{c.phone}</span>
                  <span className="mx-1">•</span>
                  <span>{getCustomerTypeLabel(c.customer_type)}</span>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users size={48} className="mx-auto mb-2 opacity-20" />
                <p>لا يوجد زبائن</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Profile */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-250px)]">
          {selectedCustomer ? (
            <>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-slate-500">
                        <span className="flex items-center gap-1 text-sm">
                          <Phone size={14} /> {selectedCustomer.phone}
                        </span>
                        {selectedCustomer.area && (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin size={14} /> {selectedCustomer.area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700"
                    >
                      <DollarSign size={18} />
                      تسديد دفعة
                    </button>
                    <button 
                      onClick={() => handleEditCustomer(selectedCustomer)}
                      className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                      title="تعديل"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                      disabled={isDeleting}
                      className="p-2 bg-red-50 border border-red-100 text-red-500 rounded-lg hover:bg-red-100 hover:text-red-700 disabled:opacity-50 transition-colors"
                      title="حذف الزبون"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">الرصيد الحالي</p>
                    <p className={`text-xl font-black ${selectedCustomer.current_balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedCustomer.current_balance} د.ل
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">إجمالي المشتريات</p>
                    <p className="text-xl font-black text-slate-900">{selectedCustomer.stats?.total_purchases || 0} د.ل</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">إجمالي المدفوع</p>
                    <p className="text-xl font-black text-emerald-600">{selectedCustomer.stats?.total_paid || 0} د.ل</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">عدد الفواتير</p>
                    <p className="text-xl font-black text-slate-900">{selectedCustomer.stats?.total_invoices || 0}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 px-6">
                {[
                  { id: 'info', label: 'المعلومات', icon: FileText },
                  { id: 'invoices', label: 'الفواتير', icon: History },
                  { id: 'payments', label: 'المدفوعات', icon: DollarSign },
                  { id: 'statement', label: 'كشف حساب', icon: Printer },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id as any)}
                    className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all border-b-2 ${
                      activeProfileTab === tab.id 
                        ? 'border-emerald-500 text-emerald-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeProfileTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <FileText size={18} className="text-emerald-500" />
                        البيانات الأساسية
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-slate-50">
                          <span className="text-slate-500">نوع الزبون</span>
                          <span className="font-medium">{getCustomerTypeLabel(selectedCustomer.customer_type)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-50">
                          <span className="text-slate-500">الهاتف البديل</span>
                          <span className="font-medium">{selectedCustomer.alt_phone || '---'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-50">
                          <span className="text-slate-500">المنطقة / العنوان</span>
                          <span className="font-medium">{selectedCustomer.area || '---'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-50">
                          <span className="text-slate-500">سقف الائتمان</span>
                          <span className="font-medium text-red-600">{selectedCustomer.credit_limit} د.ل</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare size={18} className="text-emerald-500" />
                        ملاحظات
                      </h4>
                      <div className="p-4 bg-slate-50 rounded-xl text-slate-600 min-h-[100px]">
                        {selectedCustomer.notes || 'لا توجد ملاحظات'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-4">
                        تاريخ الإنشاء: {new Date(selectedCustomer.created_at).toLocaleString('ar-LY')}
                      </div>
                    </div>
                  </div>
                )}

                {activeProfileTab === 'statement' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-900">كشف حساب تفصيلي</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-200"
                        >
                          <Printer size={14} /> طباعة
                        </button>
                        <button 
                          onClick={shareToWhatsApp}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-200"
                        >
                          <Share2 size={14} /> واتساب
                        </button>
                      </div>
                    </div>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-3 font-bold">التاريخ</th>
                            <th className="p-3 font-bold">البيان</th>
                            <th className="p-3 font-bold">مدين (+)</th>
                            <th className="p-3 font-bold">دائن (-)</th>
                            <th className="p-3 font-bold">الرصيد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {statement.map((entry, idx) => {
                            // Calculate running balance (simplified for display)
                            let runningBalance = 0;
                            statement.slice(0, idx + 1).forEach(e => {
                              if (e.type === 'invoice') runningBalance += e.amount;
                              else runningBalance -= e.amount;
                            });

                            return (
                              <tr key={`${entry.type}-${entry.id}`} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 text-slate-500">{new Date(entry.timestamp).toLocaleDateString('ar-LY')}</td>
                                <td className="p-3 font-medium">
                                  {entry.type === 'invoice' ? `فاتورة مبيعات #${entry.ref_id}` : `دفعة نقدية #${entry.ref_id}`}
                                </td>
                                <td className="p-3 font-bold text-red-600">
                                  {entry.type === 'invoice' ? `${entry.amount} د.ل` : '---'}
                                </td>
                                <td className="p-3 font-bold text-emerald-600">
                                  {entry.type === 'payment' ? `${entry.amount} د.ل` : '---'}
                                </td>
                                <td className="p-3 font-black text-slate-900">{runningBalance} د.ل</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {activeProfileTab === 'invoices' && (
                  <div className="space-y-4">
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-3 font-bold">رقم الفاتورة</th>
                            <th className="p-3 font-bold">التاريخ</th>
                            <th className="p-3 font-bold">المبلغ الإجمالي</th>
                            <th className="p-3 font-bold">المدفوع</th>
                            <th className="p-3 font-bold">المتبقي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {customerInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-900">#{inv.invoice_number}</td>
                              <td className="p-3 text-slate-500">{new Date(inv.date).toLocaleDateString('ar-LY')}</td>
                              <td className="p-3 font-bold">{inv.total_amount} د.ل</td>
                              <td className="p-3 font-bold text-emerald-600">{inv.paid_amount} د.ل</td>
                              <td className="p-3 font-bold text-red-600">{inv.total_amount - inv.paid_amount} د.ل</td>
                            </tr>
                          ))}
                          {customerInvoices.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400">لا توجد فواتير مسجلة</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeProfileTab === 'payments' && (
                  <div className="space-y-4">
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-3 font-bold">التاريخ</th>
                            <th className="p-3 font-bold">المبلغ</th>
                            <th className="p-3 font-bold">ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {customerPayments.map((pay) => (
                            <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-slate-500">{new Date(pay.payment_date).toLocaleString('ar-LY')}</td>
                              <td className="p-3 font-bold text-emerald-600">{pay.amount} د.ل</td>
                              <td className="p-3 text-slate-600">{pay.note || '---'}</td>
                            </tr>
                          ))}
                          {customerPayments.length === 0 && (
                            <tr>
                              <td colSpan={3} className="p-8 text-center text-slate-400">لا توجد دفعات مسجلة</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Users size={48} className="opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-slate-600">اختر زبوناً للعرض</h3>
              <p className="max-w-xs mt-2">يمكنك البحث عن الزبائن من القائمة الجانبية أو إضافة زبون جديد للبدء.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddCustomerModal 
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setEditingCustomer(undefined);
            }}
            onCustomerSaved={handleCustomerSaved}
            onDeleted={handleCustomerDeleted}
            initialData={editingCustomer}
          />
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              dir="rtl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-600 text-white">
                <h3 className="text-xl font-bold">تسجيل دفعة نقدية</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-white/80 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddPayment} className="p-6 space-y-6">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 mb-1">الزبون</p>
                  <p className="font-bold text-emerald-900">{selectedCustomer?.name}</p>
                  <p className="text-xs text-emerald-600 mt-2">الرصيد الحالي</p>
                  <p className="font-black text-xl text-emerald-900">{selectedCustomer?.current_balance} د.ل</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">المبلغ المدفوع (د.ل) *</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-2xl font-black text-center"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">ملاحظة / رقم الوصل</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="مثال: وصل رقم 123"
                    value={paymentData.note}
                    onChange={(e) => setPaymentData({...paymentData, note: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                  >
                    تأكيد الدفع
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-2 text-slate-400 font-bold hover:text-slate-600"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
