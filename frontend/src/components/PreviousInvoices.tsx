import React, { useState, useEffect } from 'react';
import { Search, Eye, Printer, FileText, MessageSquare, Filter } from 'lucide-react';

interface PreviousInvoicesProps {
  onViewInvoice: (id: number) => void;
}

export const PreviousInvoices: React.FC<PreviousInvoicesProps> = ({ onViewInvoice }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.id.toString().includes(searchQuery) || 
    (inv.customer_name && inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-xl font-black text-slate-800">الفواتير السابقة</h2>
        <div className="relative w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو العميل..."
            className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-bold">رقم الفاتورة</th>
                <th className="px-6 py-4 font-bold">التاريخ</th>
                <th className="px-6 py-4 font-bold">اسم العميل</th>
                <th className="px-6 py-4 font-bold text-center">عدد الأصناف</th>
                <th className="px-6 py-4 font-bold text-center">الإجمالي</th>
                <th className="px-6 py-4 font-bold text-center">نوع الدفع</th>
                <th className="px-6 py-4 font-bold text-center">الحالة</th>
                <th className="px-6 py-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">INV-{invoice.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(invoice.date).toLocaleDateString('ar-LY')}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{invoice.customer_name || 'زبون نقدي'}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">{invoice.items_count}</td>
                  <td className="px-6 py-4 text-center font-black text-emerald-600">{invoice.total_amount} د.ل</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      invoice.payment_type === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                      invoice.payment_type === 'credit' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {invoice.payment_type === 'cash' ? 'نقدي' : invoice.payment_type === 'credit' ? 'آجل' : 'تحويل'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      (invoice.total_amount - invoice.paid_amount) <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {(invoice.total_amount - invoice.paid_amount) <= 0 ? 'مدفوعة' : 'متبقي ذمة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onViewInvoice(invoice.id)}
                      className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-all"
                      title="عرض الفاتورة"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد فواتير سابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
