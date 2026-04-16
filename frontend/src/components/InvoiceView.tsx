import React, { useState, useEffect, useRef } from 'react';
import { Printer, FileText, MessageSquare, ArrowRightLeft, Package, User, CreditCard } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface InvoiceViewProps {
  invoiceId: number;
  onBack: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoiceId, onBack }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();
      setInvoice(data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore React state
  };

  const exportAsPDF = () => {
    if (!invoiceRef.current) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    toJpeg(invoiceRef.current, { quality: 0.95, backgroundColor: '#fff' })
      .then((dataUrl) => {
        if (!dataUrl || dataUrl.length < 100) return;
        const imgProps = doc.getImageProperties(dataUrl);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        doc.save(`INV-${invoiceId}.pdf`);
      })
      .catch(err => console.error('PDF Export Error:', err));
  };

  const sendWhatsApp = () => {
    if (!invoice) return;
    const summary = `فاتورة مبيعات - أركان لقطع الغيار\nرقم: INV-${invoiceId}\nالإجمالي: ${invoice.total_amount} د.ل\nشكراً لتعاملكم معنا!`;
    window.open(`https://wa.me/${invoice.customer_phone || ''}?text=${encodeURIComponent(summary)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center text-red-500 p-8">الفاتورة غير موجودة</div>;
  }

  const remainingBalance = invoice.total_amount - invoice.paid_amount;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
        >
          <ArrowRightLeft size={18} />
          رجوع
        </button>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">
            <Printer size={18} />
            طباعة الفاتورة
          </button>
          <button onClick={exportAsPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">
            <FileText size={18} />
            حفظ PDF
          </button>
          <button onClick={sendWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-all">
            <MessageSquare size={18} />
            إرسال واتساب
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-slate-50">
        <div ref={invoiceRef} className="max-w-4xl mx-auto bg-white p-10 shadow-sm border border-slate-200 rounded-2xl" dir="rtl">
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
                <p><span className="font-bold text-slate-500">رقم الفاتورة:</span> <span className="font-mono font-bold">INV-{invoice.id}</span></p>
                <p><span className="font-bold text-slate-500">التاريخ:</span> <span className="font-bold">{new Date(invoice.date).toLocaleDateString('ar-LY')}</span></p>
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
                <p className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold text-slate-500">الاسم:</span> <span className="font-bold">{invoice.customer_name || 'زبون نقدي'}</span></p>
                {invoice.customer_phone && <p className="flex justify-between"><span className="font-bold text-slate-500">الهاتف:</span> <span className="font-bold">{invoice.customer_phone}</span></p>}
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-600" />
                تفاصيل الدفع
              </h3>
              <div className="space-y-3 text-lg">
                <p className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold text-slate-500">طريقة الدفع:</span> <span className="font-bold">{invoice.payment_type === 'cash' ? 'نقدي' : invoice.payment_type === 'credit' ? 'آجل' : 'تحويل'}</span></p>
                <p className="flex justify-between"><span className="font-bold text-slate-500">حالة الفاتورة:</span> <span className={`font-bold ${remainingBalance <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{remainingBalance <= 0 ? 'مدفوعة بالكامل' : 'متبقي ذمة'}</span></p>
              </div>
            </div>
          </div>

          <table className="w-full mb-10 border-collapse">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="p-4 text-right rounded-tr-xl font-bold">الصنف</th>
                <th className="p-4 text-center font-bold">OEM</th>
                <th className="p-4 text-center font-bold">الكمية</th>
                <th className="p-4 text-center font-bold">السعر</th>
                <th className="p-4 text-center rounded-tl-xl font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, idx: number) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4 border-b border-slate-200 font-bold text-slate-800">{item.part_name_ar}</td>
                  <td className="p-4 border-b border-slate-200 text-center font-mono text-slate-600">{item.oem_number}</td>
                  <td className="p-4 border-b border-slate-200 text-center font-bold">{item.quantity}</td>
                  <td className="p-4 border-b border-slate-200 text-center">{item.unit_price}</td>
                  <td className="p-4 border-b border-slate-200 text-center font-black text-emerald-600">{item.unit_price * item.quantity}</td>
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
                <span className="font-bold">{invoice.total_amount + invoice.discount} د.ل</span>
              </div>
              <div className="flex justify-between text-lg text-slate-600">
                <span>الخصم الإضافي:</span>
                <span className="font-bold">{invoice.discount} د.ل</span>
              </div>
              <div className="flex justify-between text-2xl font-black border-t border-slate-200 pt-3 text-slate-900">
                <span>الإجمالي النهائي:</span>
                <span className="text-emerald-600">{invoice.total_amount} د.ل</span>
              </div>
              <div className="flex justify-between text-lg text-slate-600 pt-2">
                <span>المدفوع:</span>
                <span className="font-bold">{invoice.paid_amount} د.ل</span>
              </div>
              <div className="flex justify-between text-lg text-slate-600">
                <span>المتبقي:</span>
                <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-slate-600'}`}>{remainingBalance} د.ل</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center text-slate-400 text-sm border-t border-slate-200 pt-8">
            <p>البضاعة المباعة لا ترد ولا تستبدل إلا بوجود الفاتورة الأصلية خلال 3 أيام من تاريخ الشراء.</p>
            <p className="mt-2">شكراً لتعاملكم معنا!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
