import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Wallet, 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  Calendar,
  Filter,
  DollarSign,
  CreditCard,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialSummary {
  cash_balance: number;
  bank_balance: number;
  available_cash: number;
  customer_debts: number;
  supplier_debts: number;
  inventory_value: number;
  net_worth: number;
}

interface Movement {
  id: number;
  movement_date: string;
  type: string;
  amount: number;
  note: string;
  reference_type: string;
}

export const FinancialScreen = () => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'cashbox' | 'banks' | 'expenses'>('summary');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchSummary();
    fetchMovements();
    fetchBankAccounts();
  }, []);

  const fetchSummary = async () => {
    const res = await fetch('/api/financial-center/summary');
    const data = await res.json();
    setSummary(data);
  };

  const fetchMovements = async () => {
    const res = await fetch('/api/cashbox/movements');
    const data = await res.json();
    setMovements(data);
  };

  const fetchBankAccounts = async () => {
    const res = await fetch('/api/bank-accounts');
    const data = await res.json();
    setBankAccounts(data);
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'sale_cash': return 'مبيعات نقدية';
      case 'purchase_cash': return 'مشتريات نقدية';
      case 'expense': return 'مصروفات';
      case 'deposit': return 'إيداع';
      case 'withdrawal': return 'سحب';
      case 'transfer_to_bank': return 'تحويل للبنك';
      case 'transfer_from_bank': return 'تحويل من البنك';
      default: return type;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-emerald-600" size={28} />
          المركز المالي والخزنة
        </h2>
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('summary')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeSubTab === 'summary' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'}`}
          >
            الملخص العام
          </button>
          <button 
            onClick={() => setActiveSubTab('cashbox')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeSubTab === 'cashbox' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'}`}
          >
            الخزنة
          </button>
          <button 
            onClick={() => setActiveSubTab('banks')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeSubTab === 'banks' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'}`}
          >
            البنوك
          </button>
          <button 
            onClick={() => setActiveSubTab('expenses')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeSubTab === 'expenses' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'}`}
          >
            المصروفات
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'summary' && summary && (
          <motion.div 
            key="summary"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Top Cards */}
            <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Wallet size={24} />
                </div>
                <TrendingUp size={20} className="opacity-50" />
              </div>
              <div>
                <div className="text-sm font-bold opacity-80 uppercase tracking-wider">السيولة المتوفرة</div>
                <div className="text-3xl font-black mt-1">{(summary.available_cash || 0).toFixed(2)} د.ل</div>
              </div>
              <div className="text-[10px] opacity-60">إجمالي النقد في الخزنة والحسابات البنكية</div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg shadow-slate-200 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <Package size={24} />
                </div>
                <PieChart size={20} className="opacity-50" />
              </div>
              <div>
                <div className="text-sm font-bold opacity-80 uppercase tracking-wider">قيمة المخزون</div>
                <div className="text-3xl font-black mt-1">{(summary.inventory_value || 0).toFixed(2)} د.ل</div>
              </div>
              <div className="text-[10px] opacity-60">محسوبة بسعر التكلفة الحالي</div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <ArrowUpRight size={24} />
                </div>
                <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">ديون لنا</div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">ديون الزبائن</div>
                <div className="text-3xl font-black mt-1 text-slate-900">{(summary.customer_debts || 0).toFixed(2)} د.ل</div>
              </div>
              <div className="text-[10px] text-slate-400">مبالغ مستحقة من فواتير الآجل</div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                  <ArrowDownLeft size={24} />
                </div>
                <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">ديون علينا</div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">ديون الموردين</div>
                <div className="text-3xl font-black mt-1 text-slate-900">{(summary.supplier_debts || 0).toFixed(2)} د.ل</div>
              </div>
              <div className="text-[10px] text-slate-400">مبالغ مستحقة لموردين القطع</div>
            </div>

            {/* Net Worth Dashboard */}
            <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={24} />
                  صافي القيمة التقديرية للنشاط
                </h3>
                <div className="text-4xl font-black text-emerald-600">{(summary.net_worth || 0).toFixed(2)} د.ل</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 mb-2 uppercase">إجمالي الأصول</div>
                  <div className="text-xl font-black text-slate-800">{((summary.available_cash || 0) + (summary.inventory_value || 0) + (summary.customer_debts || 0)).toFixed(2)} د.ل</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">نقدية:</span>
                      <span className="font-bold">{(summary.available_cash || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">بضاعة:</span>
                      <span className="font-bold">{(summary.inventory_value || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">مدينون:</span>
                      <span className="font-bold">{(summary.customer_debts || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 mb-2 uppercase">إجمالي الالتزامات</div>
                  <div className="text-xl font-black text-red-500">{(summary.supplier_debts || 0).toFixed(2)} د.ل</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">دائنون (موردين):</span>
                      <span className="font-bold">{(summary.supplier_debts || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">أخرى:</span>
                      <span className="font-bold">0.00</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <PieChart size={32} />
                  </div>
                  <div className="text-xs font-bold text-emerald-600 mb-1 uppercase">نسبة السيولة</div>
                  <div className="text-2xl font-black text-emerald-700">
                    {((summary.available_cash || 0) / ((summary.available_cash || 0) + (summary.inventory_value || 0) + (summary.customer_debts || 0) || 1) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-4">
              <h3 className="font-bold text-slate-800 mb-2">عمليات سريعة</h3>
              <button className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                <Plus size={20} />
                تسجيل مصروف
              </button>
              <button className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                <ArrowUpRight size={20} />
                إيداع بنكي
              </button>
              <button className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                <History size={20} />
                تقرير الأرباح
              </button>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'cashbox' && (
          <motion.div 
            key="cashbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={20} className="text-slate-400" />
                  آخر حركات الخزنة
                </h3>
                <div className="flex gap-2">
                  <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                    <Filter size={18} />
                  </button>
                  <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                    <Calendar size={18} />
                  </button>
                </div>
              </div>
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-bold">التاريخ</th>
                    <th className="p-4 font-bold">النوع</th>
                    <th className="p-4 font-bold">البيان</th>
                    <th className="p-4 font-bold text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-xs text-slate-500">{new Date(m.movement_date).toLocaleString('ar-LY')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          m.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {getMovementLabel(m.type)}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium">{m.note}</td>
                      <td className={`p-4 font-black text-left ${m.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.amount > 0 ? '+' : ''}{(m.amount || 0).toFixed(2)} د.ل
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-lg flex flex-col items-center justify-center text-center">
                <div className="text-sm font-bold opacity-70 mb-2">رصيد الخزنة الحالي</div>
                <div className="text-4xl font-black">{(summary?.cash_balance || 0).toFixed(2)} د.ل</div>
                <div className="mt-6 flex gap-2 w-full">
                  <button className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm backdrop-blur-sm transition-all">
                    إيداع نقد
                  </button>
                  <button className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm backdrop-blur-sm transition-all">
                    سحب نقد
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4">توزيع الحركات</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">مبيعات</span>
                      <span className="text-emerald-600">85%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[85%]"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">مصروفات</span>
                      <span className="text-red-500">12%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 w-[12%]"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">أخرى</span>
                      <span className="text-slate-400">3%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 w-[3%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'banks' && (
          <motion.div 
            key="banks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {bankAccounts.map(acc => (
              <div key={acc.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-emerald-600 transition-colors">
                    <Building2 size={32} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">الرصيد الحالي</div>
                    <div className="text-2xl font-black text-slate-900">{(acc.current_balance || 0).toFixed(2)} د.ل</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{acc.account_name}</h3>
                  <p className="text-sm text-slate-500">{acc.bank_name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{acc.account_number}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                    كشف حساب
                  </button>
                  <button className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            ))}
            <button className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-all group min-h-[250px]">
              <Plus size={48} strokeWidth={1} className="group-hover:scale-110 transition-transform" />
              <span className="mt-2 font-bold">إضافة حساب بنكي جديد</span>
            </button>
          </motion.div>
        )}

        {activeSubTab === 'expenses' && (
          <motion.div 
            key="expenses"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400"
          >
            <PieChart size={64} strokeWidth={1} />
            <p className="mt-4 font-bold">وحدة إدارة المصروفات قيد التجهيز</p>
            <button className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">
              إضافة مصروف جديد
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
