import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  Download,
  Printer,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ArrowDownUp,
  DollarSign,
  LayoutDashboard,
  Truck,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ReportTab =
  | "dashboard"
  | "sales"
  | "profit"
  | "customer_debts"
  | "supplier_debts"
  | "inventory";

type PrintOrientation = "portrait" | "landscape";

export const ReportsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [reportData, setReportData] = useState<any>(null);
  const [fetchingReport, setFetchingReport] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printDate, setPrintDate] = useState("");
  const [printPreview, setPrintPreview] = useState(false);
  const [printOrientation, setPrintOrientation] =
    useState<PrintOrientation>("portrait");

  const formatPrintDate = (value: Date) =>
    new Intl.DateTimeFormat("ar-LY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);

  const getActiveTabLabel = (tab: ReportTab) => {
    const labels: Record<ReportTab, string> = {
      dashboard: "لوحة التقارير",
      sales: "تقرير المبيعات",
      profit: "تقرير الأرباح",
      customer_debts: "ديون العملاء",
      supplier_debts: "ديون الموردين",
      inventory: "تقرير المخزون",
    };

    return labels[tab];
  };

  const getPrintRangeLabel = () => {
    if (!["sales", "profit"].includes(activeTab)) {
      return "النطاق: البيانات الحالية";
    }

    return `النطاق: من ${dateRange.start} إلى ${dateRange.end}`;
  };

  const applyPrintPageStyle = (orientation: PrintOrientation) => {
    const styleId = "reports-print-page-style";
    const existing = document.getElementById(styleId);
    const css = `@page { size: A4 ${orientation}; margin: 12mm; }`;

    if (existing) {
      existing.textContent = css;
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/dashboard");
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (tab: ReportTab) => {
    setFetchingReport(true);
    try {
      let endpoint = "";
      switch (tab) {
        case "sales":
          endpoint = `/api/reports/sales-details?start=${dateRange.start}&end=${dateRange.end}`;
          break;
        case "profit":
          endpoint = `/api/reports/profit-details?start=${dateRange.start}&end=${dateRange.end}`;
          break;
        case "customer_debts":
          endpoint = "/api/reports/customer-debts";
          break;
        case "supplier_debts":
          endpoint = "/api/reports/supplier-debts";
          break;
        case "inventory":
          endpoint = "/api/reports/inventory-details";
          break;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        const data = await res.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setFetchingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "dashboard") {
      fetchReport(activeTab);
    }
  }, [activeTab, dateRange]);

  useEffect(() => {
    document.body.classList.toggle("reports-preview-mode", printPreview);

    return () => {
      document.body.classList.remove("reports-preview-mode");
    };
  }, [printPreview]);

  const handlePrint = () => window.print();

  const handleExportPdf = async () => {
    if (exportingPdf) {
      return;
    }

    setExportingPdf(true);

    try {
      applyPrintPageStyle(printOrientation);
      setPrintDate(formatPrintDate(new Date()));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      if ("fonts" in document) {
        await document.fonts.ready;
      }

      // Give charts a final paint pass before opening print dialog.
      await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
      document.body.classList.add("reports-printing");
      window.print();
    } catch (error) {
      console.error("Error preparing report print:", error);
      alert("تعذر تجهيز التقرير للطباعة. يرجى المحاولة مرة أخرى.");
    } finally {
      document.body.classList.remove("reports-printing");
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "لوحة التقارير", icon: LayoutDashboard },
    { id: "sales", label: "تقرير المبيعات", icon: ShoppingCart },
    { id: "profit", label: "تقرير الأرباح", icon: DollarSign },
    { id: "customer_debts", label: "ديون العملاء", icon: Users },
    { id: "supplier_debts", label: "ديون الموردين", icon: Truck },
    { id: "inventory", label: "تقرير المخزون", icon: Package },
  ];

  return (
    <div className="reports-print-root space-y-6 pb-12 print:p-0">
      <div className="reports-print-header">
        <div>
          <h1 className="text-xl font-black text-slate-900">تقرير الإدارة</h1>
          <p className="text-xs text-slate-500">
            نظام أركان - {getActiveTabLabel(activeTab)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{getPrintRangeLabel()}</p>
        </div>
        <div className="text-xs text-slate-600">
          التاريخ: {printDate || formatPrintDate(new Date())}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center print:hidden print-hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900">التقارير</h2>
          <p className="text-slate-500">متابعة أداء المحل والعمليات المالية</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPrintPreview((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText size={18} />
            {printPreview ? "إلغاء المعاينة" : "معاينة الطباعة"}
          </button>

          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500">اتجاه</span>
            <select
              value={printOrientation}
              onChange={(e) =>
                setPrintOrientation(e.target.value as PrintOrientation)
              }
              className="text-sm font-bold text-slate-700 bg-transparent outline-none"
            >
              <option value="portrait">A4 عمودي</option>
              <option value="landscape">A4 أفقي</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer size={18} />
            طباعة
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={18} />
            {exportingPdf ? "جاري التصدير..." : "تصدير PDF"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 print:hidden print-hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 reports-print-section"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <SummaryCard
                label="مبيعات اليوم"
                value={dashboardData.sales_today}
                icon={ShoppingCart}
                color="emerald"
                unit="د.ل"
              />

              <SummaryCard
                label="الربح التقريبي"
                value={dashboardData.profit_today}
                icon={DollarSign}
                color="emerald"
                unit="د.ل"
              />
              <SummaryCard
                label="ديون العملاء"
                value={dashboardData.customer_debts}
                icon={Users}
                color="red"
                unit="د.ل"
              />
              <SummaryCard
                label="ديون الموردين"
                value={dashboardData.supplier_debts}
                icon={Truck}
                color="orange"
                unit="د.ل"
              />
              <SummaryCard
                label="رصيد الخزنة"
                value={dashboardData.cash_balance}
                icon={History}
                color="slate"
                unit="د.ل"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sales Trend Placeholder or Top Selling */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print-avoid-break">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-500" />
                  الأكثر مبيعاً
                </h3>
                <div className="h-64">
                  <DashboardTopSelling />
                </div>
              </div>

              {/* Stock Alerts */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print-avoid-break">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-orange-500" />
                  تنبيهات المخزون
                </h3>
                <DashboardLowStock />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab !== "dashboard" && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 reports-print-section"
          >
            {/* Date Filters for specific reports */}
            {["sales", "profit"].includes(activeTab) && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 items-end print:hidden print-hidden">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      setDateRange({ start: today, end: today });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                  >
                    اليوم
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 7);
                      setDateRange({
                        start: start.toISOString().split("T")[0],
                        end: end.toISOString().split("T")[0],
                      });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                  >
                    أسبوع
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(end.getMonth() - 1);
                      setDateRange({
                        start: start.toISOString().split("T")[0],
                        end: end.toISOString().split("T")[0],
                      });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                  >
                    شهر
                  </button>
                </div>
              </div>
            )}

            {fetchingReport ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-100 print-avoid-break">
                {activeTab === "sales" && <SalesReport data={reportData} />}
                {activeTab === "profit" && <ProfitReport data={reportData} />}
                {activeTab === "customer_debts" && (
                  <CustomerDebtsReport data={reportData} />
                )}
                {activeTab === "supplier_debts" && (
                  <SupplierDebtsReport data={reportData} />
                )}
                {activeTab === "inventory" && (
                  <InventoryReport data={reportData} />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-Components ---

const SummaryCard = ({ label, value, icon: Icon, color, unit }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3"
      role="complementary"
      aria-label={`${label}: ${(value || 0).toLocaleString()} ${unit}`}
    >
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colors[color]}`}
        aria-hidden="true"
      >
        <Icon size={20} />
      </div>
      <div>
        <p
          className="text-xs font-bold text-slate-500 mb-1"
          id={`label-${label}`}
        >
          {label}
        </p>
        <h3
          className="text-xl font-black text-slate-900"
          aria-labelledby={`label-${label}`}
        >
          {(value || 0).toLocaleString()}{" "}
          <span className="text-[10px] font-bold opacity-50" aria-label={unit}>
            {unit}
          </span>
        </h3>
      </div>
    </motion.article>
  );
};

const DashboardTopSelling = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/reports/top-selling")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ right: 30, left: 40 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
          stroke="#f1f5f9"
        />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          width={100}
          tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#f8fafc" }}
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
          }}
        />
        <Bar
          dataKey="total_quantity"
          fill="#10b981"
          radius={[0, 4, 4, 0]}
          barSize={15}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

const DashboardLowStock = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/reports/low-stock")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div className="overflow-hidden">
      <table className="w-full text-right">
        <thead>
          <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-50">
            <th className="pb-3 font-bold">القطعة</th>
            <th className="pb-3 font-bold">الرف</th>
            <th className="pb-3 font-bold">المتوفر</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.slice(0, 5).map((part, idx) => (
            <tr key={idx} className="group hover:bg-slate-50 transition-colors">
              <td className="py-3">
                <div className="font-bold text-sm text-slate-700">
                  {part.part_name_ar}
                </div>
                <div className="text-[10px] text-slate-400">
                  {part.brand_name}
                </div>
              </td>
              <td className="py-3 font-mono text-[10px] text-slate-500">
                {part.shelf_location_id}
              </td>
              <td className="py-3">
                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">
                  {part.quantity}
                </span>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="py-8 text-center text-slate-400 text-xs italic"
              >
                لا توجد تنبيهات
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Report Views ---

const SalesReport = ({ data }: any) => {
  if (!data || data.error)
    return (
      <div className="text-red-500 font-bold p-4">
        خطأ في تحميل البيانات: {data?.error || "بيانات غير صالحة"}
      </div>
    );
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
          <p className="text-sm font-bold text-emerald-600 mb-1">
            إجمالي المبيعات
          </p>
          <h4 className="text-3xl font-black text-emerald-700">
            {(data.total_sales || 0).toFixed(2)} د.ل
          </h4>
        </div>
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-sm font-bold text-slate-500 mb-1">عدد الفواتير</p>
          <h4 className="text-3xl font-black text-slate-900">
            {data.invoice_count || 0}
          </h4>
        </div>
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-sm font-bold text-slate-500 mb-1">
            متوسط الفاتورة
          </p>
          <h4 className="text-3xl font-black text-slate-900">
            {(data.avg_invoice || 0).toFixed(2)} د.ل
          </h4>
        </div>
      </div>

      <div>
        <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          أكثر القطع مبيعاً في هذه الفترة
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.isArray(data.top_parts) &&
            data.top_parts.map((part: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm"
              >
                <span className="font-bold text-slate-700">{part.name}</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-black text-sm">
                  {part.total_quantity} قطعة
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const ProfitReport = ({ data }: any) => {
  if (!data || data.error)
    return (
      <div className="text-red-500 font-bold p-4">
        خطأ في تحميل البيانات: {data?.error || "بيانات غير صالحة"}
      </div>
    );
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-sm font-bold text-slate-500 mb-1">
            إجمالي المبيعات
          </p>
          <h4 className="text-3xl font-black text-slate-900">
            {(data.total_sales || 0).toFixed(2)} د.ل
          </h4>
        </div>
        <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
          <p className="text-sm font-bold text-red-600 mb-1">
            تكلفة البضاعة المباعة
          </p>
          <h4 className="text-3xl font-black text-red-700">
            {(data.cost_of_goods_sold || 0).toFixed(2)} د.ل
          </h4>
        </div>
        <div className="p-6 bg-emerald-600 text-white rounded-3xl shadow-lg shadow-emerald-100">
          <p className="text-sm font-bold opacity-80 mb-1">الربح التقريبي</p>
          <h4 className="text-3xl font-black">
            {(data.approx_profit || 0).toFixed(2)} د.ل
          </h4>
        </div>
      </div>

      <div className="p-8 bg-slate-900 text-white rounded-3xl">
        <h4 className="text-xl font-black mb-4">كيف يتم حساب الربح؟</h4>
        <p className="text-slate-400 leading-relaxed">
          يتم حساب الربح التقريبي عن طريق طرح تكلفة شراء القطع المباعة من إجمالي
          قيمة المبيعات خلال الفترة المحددة. هذا الربح لا يشمل المصروفات
          التشغيلية الأخرى مثل الإيجار والكهرباء والرواتب.
        </p>
      </div>
    </div>
  );
};

const CustomerDebtsReport = ({ data }: any) => {
  if (!data || !Array.isArray(data))
    return (
      <div className="text-red-500 font-bold p-4">
        خطأ في تحميل البيانات: {data?.error || "بيانات غير صالحة"}
      </div>
    );
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-black text-slate-900 text-xl">
          ديون العملاء المستحقة
        </h4>
        <span className="px-4 py-1 bg-red-50 text-red-600 rounded-full font-bold text-sm">
          إجمالي الديون:{" "}
          {data
            .reduce((acc: number, curr: any) => acc + (curr.debt || 0), 0)
            .toFixed(2)}{" "}
          د.ل
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-bold">اسم العميل</th>
              <th className="p-4 font-bold">رقم الهاتف</th>
              <th className="p-4 font-bold text-left">المبلغ المتبقي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((c: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{c.name}</td>
                <td className="p-4 text-slate-500 font-mono">{c.phone}</td>
                <td className="p-4 font-black text-red-600 text-left">
                  {(c.debt || 0).toFixed(2)} د.ل
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SupplierDebtsReport = ({ data }: any) => {
  if (!data || !Array.isArray(data))
    return (
      <div className="text-red-500 font-bold p-4">
        خطأ في تحميل البيانات: {data?.error || "بيانات غير صالحة"}
      </div>
    );
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-black text-slate-900 text-xl">
          ديون الموردين المستحقة
        </h4>
        <span className="px-4 py-1 bg-orange-50 text-orange-600 rounded-full font-bold text-sm">
          إجمالي المستحقات:{" "}
          {data
            .reduce((acc: number, curr: any) => acc + (curr.debt || 0), 0)
            .toFixed(2)}{" "}
          د.ل
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-bold">اسم المورد</th>
              <th className="p-4 font-bold">الشركة</th>
              <th className="p-4 font-bold text-left">المبلغ المستحق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((s: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{s.name}</td>
                <td className="p-4 text-slate-500">{s.company}</td>
                <td className="p-4 font-black text-orange-600 text-left">
                  {(s.debt || 0).toFixed(2)} د.ل
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InventoryReport = ({ data }: any) => {
  if (!data || data.error)
    return (
      <div className="text-red-500 font-bold p-4">
        خطأ في تحميل البيانات: {data?.error || "بيانات غير صالحة"}
      </div>
    );
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-1">عدد الأصناف</p>
          <h4 className="text-2xl font-black text-slate-900">
            {data.item_count || 0}
          </h4>
        </div>
        <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
          <p className="text-xs font-bold text-red-600 mb-1">أصناف منخفضة</p>
          <h4 className="text-2xl font-black text-red-700">
            {data.low_stock_count || 0}
          </h4>
        </div>
        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 mb-1">
            قيمة المخزون (تكلفة)
          </p>
          <h4 className="text-2xl font-black text-emerald-700">
            {(data.inventory_value || 0).toFixed(2)} د.ل
          </h4>
        </div>
        <div className="p-6 bg-slate-900 text-white rounded-3xl">
          <p className="text-xs font-bold opacity-70 mb-1">دقة المخزون</p>
          <h4 className="text-2xl font-black">98%</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            الأكثر مبيعاً (تاريخي)
          </h4>
          <div className="space-y-3">
            {Array.isArray(data.top_selling) &&
              data.top_selling.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center"
                >
                  <span className="font-bold text-slate-700">{p.name}</span>
                  <span className="font-black text-emerald-600">
                    {p.total_quantity} قطعة
                  </span>
                </div>
              ))}
          </div>
        </div>
        <div>
          <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            قائمة النواقص
          </h4>
          <div className="space-y-3">
            {Array.isArray(data.low_stock_list) &&
              data.low_stock_list.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-700">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      الرف: {p.shelf_location_id}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-black text-sm">
                    {p.quantity}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
