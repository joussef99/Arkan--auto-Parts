import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  LayoutDashboard,
  ArrowDownUp,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Part, Brand, Category, InvoiceItem, Model, YearRange } from './types';
import { SalesCenter } from './components/SalesCenter';
import { InventoryScreen } from './components/InventoryScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { FinancialScreen } from './components/FinancialScreen';
import { QAChecklistScreen } from './components/QAChecklistScreen';
import { PrintLabels } from './components/PrintLabels';
import { ClipboardCheck } from 'lucide-react';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user, isExpanded, setIsExpanded, innerRef }: { activeTab: string, setActiveTab: (t: string) => void, user: any, isExpanded: boolean, setIsExpanded: (v: boolean) => void, innerRef: React.RefObject<HTMLDivElement> }) => {
  const menuItems = [
    { id: 'sales-center', label: 'مركز المبيعات', icon: ShoppingCart, roles: ['owner', 'salesperson'] },
    { id: 'inventory', label: 'المخزون', icon: Package, roles: ['owner', 'purchasing', 'salesperson'] },
    { id: 'financial', label: 'الخزنة والمالية', icon: BarChart3, roles: ['owner', 'accountant'] },
    { id: 'reports', label: 'التقارير', icon: LayoutDashboard, roles: ['owner'] },
    { id: 'customers', label: 'الزبائن', icon: Users, roles: ['owner', 'salesperson'] },
    { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['owner'] },
    { id: 'qa-checklist', label: 'فحص الجودة', icon: ClipboardCheck, roles: ['owner'] },
  ];

  const filteredItems = menuItems.filter(item => 
    !user || item.roles.includes(user.role_name)
  );

  return (
    <div 
      ref={innerRef}
      className={`h-screen bg-slate-900 text-white flex flex-col fixed right-0 top-0 z-20 transition-all duration-300 overflow-hidden ${isExpanded ? 'w-64' : 'w-20 cursor-pointer'}`}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >
      <div className="p-6 border-b border-slate-800 flex items-center justify-between min-h-22">
        {isExpanded ? (
          <div>
            <h1 className="text-xl font-bold text-emerald-400">أركان لقطع الغيار</h1>
            <p className="text-xs text-slate-400 mt-1">Arkan Parts Desk v2.0</p>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center font-bold">أ</div>
          </div>
        )}
      </div>
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab(item.id);
            }}
            className={`w-full flex items-center gap-3 py-4 transition-colors ${isExpanded ? 'px-6' : 'px-0 justify-center'} ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white border-r-4 border-emerald-400' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title={!isExpanded ? item.label : undefined}
          >
            <item.icon size={20} className="shrink-0" />
            {isExpanded && <span className="font-medium whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>
      {user && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
              {user.display_name[0]}
            </div>
            {isExpanded && (
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold truncate">{user.display_name}</div>
                <div className="text-[10px] text-slate-500">{user.role_label}</div>
              </div>
            )}
          </div>
        </div>
      )}
      {isExpanded && (
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center whitespace-nowrap">
          v2.0.0 - ليبيا - 2026
        </div>
      )}
    </div>
  );
};


// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales-center');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ subscriptionStartDate?: string; subscriptionEndDate?: string } | null>(null);
  const [showPrintLabels, setShowPrintLabels] = useState(false);

  // Auto-login with default 'arkan' account
  useEffect(() => {
    const autoLogin = async () => {
      const savedUser = localStorage.getItem('arkan_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'arkan', password: 'arkan' })
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('arkan_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.error('Auto-login failed:', err);
      } finally {
        setLoading(false);
      }
    };
    
    autoLogin();
  }, []);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch('/api/settings/subscription/status');
        const data = await res.json();
        if (data?.success && data.data) {
          const endDate = data.data.subscription_end_date ? new Date(data.data.subscription_end_date).getTime() : 0;
          const isExpired = !data.data.is_active || (endDate > 0 && endDate < Date.now());
          setSubscriptionExpired(isExpired);
          setSubscriptionInfo({
            subscriptionStartDate: data.data.subscription_start_date,
            subscriptionEndDate: data.data.subscription_end_date
          });
        }
      } catch {
        // no-op
      }
    };
    checkSubscription();
    const timer = setInterval(checkSubscription, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('arkan_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('arkan_user');
  };

  const handleSaveInvoice = async (invoiceData: any) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    if (res.ok) {
      const data = await res.json();
      return data.id;
    } else {
      throw new Error('فشل حفظ الفاتورة');
    }
  };

  const handleSavePart = async (partData: Partial<Part>) => {
    const isUpdate = !!partData.id;
    const url = isUpdate ? `/api/parts/${partData.id}` : '/api/parts';
    const method = isUpdate ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partData)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || (isUpdate ? 'فشل تحديث القطعة' : 'فشل إضافة القطعة'));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'sales-center': return <SalesCenter onSave={handleSaveInvoice} />;
      case 'inventory': return <InventoryScreen onSave={handleSavePart} />;
      case 'customers': return <CustomersScreen />;
      case 'financial': return <FinancialScreen />;
      case 'reports': return <ReportsScreen />;
      case 'settings': return <SettingsScreen />;
      case 'qa-checklist': return <QAChecklistScreen />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <LayoutDashboard size={64} strokeWidth={1} />
          <p className="mt-4">هذه الوحدة قيد التطوير في النسخة التجريبية</p>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans" dir="rtl">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded}
        innerRef={sidebarRef as any}
      />
      
      <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarExpanded ? 'mr-64' : 'mr-20'}`}>
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-slate-500 text-sm font-medium">مرحباً {user?.display_name || 'بك'} في نظام أركان</h1>
            <div className="text-slate-900 font-bold">
              {new Date().toLocaleDateString('ar-LY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowPrintLabels(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              title="طباعة الباركود"
            >
              <Package size={18} />
              طباعة الباركود
            </button>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold hover:bg-emerald-200 transition-colors"
              title="تسجيل الخروج"
            >
              {user?.display_name?.[0] || 'م'}
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {/* Print Labels Modal */}
        <PrintLabels 
          isOpen={showPrintLabels} 
          onClose={() => setShowPrintLabels(false)} 
        />
      </main>

      <AnimatePresence>
        {subscriptionExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-red-700 mb-3">انتهى الاشتراك</h3>
              <p className="text-slate-600 mb-4">
                يجب تمديد الاشتراك للمتابعة واستخدام النظام بشكل كامل.
              </p>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">بداية الاشتراك</span><span className="font-bold text-slate-900">{subscriptionInfo?.subscriptionStartDate || '-'}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">نهاية الاشتراك</span><span className="font-bold text-slate-900">{subscriptionInfo?.subscriptionEndDate || '-'}</span></div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                >
                  الذهاب لإعدادات الاشتراك
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  تسجيل الخروج
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
