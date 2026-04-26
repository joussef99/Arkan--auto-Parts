import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Layers, Package, RefreshCw, Search } from "lucide-react";
import { Part } from "../types";
import { NewPartModal } from "./NewPartModal";

interface InventoryScreenProps {
  onSave: (part: Partial<Part>) => Promise<void>;
}

type Toast = { type: "success" | "error"; message: string } | null;

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ onSave }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [dashboard, setDashboard] = useState({ totalProducts: 0, totalInventoryValue: 0, lowStockCount: 0 });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [partsRes, dashboardRes] = await Promise.all([
        fetch(`/api/parts?q=${encodeURIComponent(query)}&availability=${encodeURIComponent(status)}`),
        fetch("/api/inventory/dashboard")
      ]);
      const partsData = await partsRes.json();
      const dashboardData = await dashboardRes.json();
      const list = (Array.isArray(partsData) ? partsData : []).filter((p: any) =>
        !location || (p.warehouseLocation || p.warehouse_location || "").includes(location)
      );
      setParts(list);
      if (dashboardData?.success) setDashboard(dashboardData.data);
    } catch {
      setToast({ type: "error", message: "فشل تحميل بيانات المخزون" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query, status, location]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const lowStock = useMemo(
    () => parts.filter((p: any) => p.status === "lowStock" || (p.quantity > 0 && p.quantity <= p.min_stock_level)),
    [parts]
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard title="إجمالي الأصناف" value={dashboard.totalProducts} icon={<Layers size={18} />} />
        <StatCard title="قيمة المخزون" value={`${dashboard.totalInventoryValue.toFixed(2)} د.ل`} icon={<Package size={18} />} />
        <StatCard title="نواقص المخزون" value={dashboard.lowStockCount} icon={<AlertTriangle size={18} />} danger={dashboard.lowStockCount > 0} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pr-9 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="بحث"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="available">متوفر</option>
          <option value="low">ناقص</option>
          <option value="out">نافد</option>
        </select>
        <input className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="الموقع" value={location} onChange={(e) => setLocation(e.target.value)} />
        <button onClick={load} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2 font-bold">
          <RefreshCw size={16} />
          تحديث
        </button>
        <a href="/api/inventory/export/csv" className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-2 font-bold">
          <Download size={16} />
          CSV
        </a>
        <a href="/api/inventory/export/xlsx" className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-2 font-bold">
          <Download size={16} />
          Excel
        </a>
        <button onClick={() => setEditingPart({} as Part)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-black">إضافة صنف</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-sm text-slate-500 border-b bg-slate-50">
              <th className="p-3">الاسم</th><th>الباركود</th><th>الموقع</th><th>الكمية</th><th>التكلفة</th><th>البيع</th><th>الحالة</th><th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part: any) => (
              <tr key={part.id} className="border-b text-sm hover:bg-slate-50 transition-colors">
                <td className="p-3 font-bold">{part.name || part.part_name_ar}</td>
                <td>{part.barcode || "-"}</td>
                <td>{part.warehouseLocation || part.warehouse_location || part.shelf_location_id || "-"}</td>
                <td>{part.quantity}</td>
                <td>{part.costPrice || part.cost_price}</td>
                <td>{part.sellingPrice || part.selling_price}</td>
                <td>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    part.status === "outOfStock" ? "bg-red-100 text-red-700" :
                    part.status === "lowStock" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>{part.status || "-"}</span>
                </td>
                <td><button onClick={() => setEditingPart(part)} className="text-emerald-600 hover:text-emerald-700 font-bold">تعديل</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!parts.length && !isLoading && <div className="p-8 text-center text-slate-400">لا توجد بيانات</div>}
      </div>

      {!!lowStock.length && (
        <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
          تنبيه: يوجد {lowStock.length} صنف تحت حد الأمان.
        </div>
      )}

      <NewPartModal
        isOpen={!!editingPart}
        initialData={editingPart || undefined}
        onClose={() => setEditingPart(null)}
        onSave={async (part) => {
          await onSave(part);
          setToast({ type: "success", message: "تم الحفظ" });
          setEditingPart(null);
          await load();
        }}
      />

      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-white ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, danger = false }: { title: string; value: string | number; icon: React.ReactNode; danger?: boolean }) => (
  <div className={`rounded-2xl border p-4 bg-white shadow-sm ${danger ? "border-red-300" : "border-slate-200"}`}>
    <div className="text-sm text-slate-500 flex items-center gap-2">{icon}{title}</div>
    <div className={`text-2xl font-black mt-1 ${danger ? "text-red-600" : "text-slate-900"}`}>{value}</div>
  </div>
);
