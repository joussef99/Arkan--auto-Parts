import React, { useState, useEffect, useMemo } from "react";
import { Printer, Package, X, Check, ChevronDown, ChevronUp, Search, Wifi, WifiOff } from "lucide-react";
import { Label } from "./Label";

interface PrintLabelsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductWithQty {
  id: number;
  part_name_ar?: string;
  name?: string;
  barcode?: string;
  selling_price?: number;
  cost_price?: number;
  quantity?: number;
  printQty?: number;
  selected?: boolean;
}

type PrintMode = "A4" | "THERMAL";

/**
 * Print Labels Page
 * Supports both A4 (browser print) and Thermal (direct ZPL print)
 */
export const PrintLabels: React.FC<PrintLabelsProps> = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState<ProductWithQty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [printMode, setPrintMode] = useState<PrintMode>("THERMAL");
  const [showPrice, setShowPrice] = useState(true);
  const [labelSize, setLabelSize] = useState<"small" | "medium" | "large">("medium");
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  
  // Printer settings
  const [printerIp, setPrinterIp] = useState(() => localStorage.getItem("printerIp") || "");
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [printerOnline, setPrinterOnline] = useState<boolean | null>(null);

  // Load products from API
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/parts");
      const data = await response.json();
      const productsWithQty = (Array.isArray(data) ? data : []).map((p: any) => ({
        ...p,
        name: p.name || p.part_name_ar,
        printQty: 1,
        selected: false,
      }));
      setProducts(productsWithQty);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Get selected products
  const selectedProducts = useMemo(
    () => products.filter((p) => p.selected),
    [products]
  );

  // Calculate total labels
  const totalLabels = useMemo(
    () => selectedProducts.reduce((sum, p) => sum + (p.printQty || 1), 0),
    [selectedProducts]
  );

  // Toggle product selection
  const toggleProduct = (id: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  // Update print quantity for a product
  const updatePrintQty = (id: number, qty: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, printQty: Math.max(1, qty) } : p))
    );
  };

  // Select all products
  const selectAll = () => {
    setProducts((prev) => prev.map((p) => ({ ...p, selected: true })));
  };

  // Deselect all products
  const deselectAll = () => {
    setProducts((prev) => prev.map((p) => ({ ...p, selected: false })));
  };

  // Save printer IP
  const savePrinterIp = (ip: string) => {
    setPrinterIp(ip);
    localStorage.setItem("printerIp", ip);
    setPrinterOnline(null);
  };

  // Check printer connection
  const checkPrinter = async () => {
    if (!printerIp) return;
    try {
      const res = await fetch(`/api/print-status/${printerIp}`);
      const data = await res.json();
      setPrinterOnline(data.online);
    } catch {
      setPrinterOnline(false);
    }
  };

  // Handle print based on mode
  const handlePrint = async () => {
    if (printMode === "A4") {
      // Browser print for A4
      window.print();
    } else {
      // Direct thermal print
      if (!printerIp) {
        setPrintStatus({ success: false, message: "يرجى إدخال عنوان الطابعة" });
        return;
      }

      if (selectedProducts.length === 0) {
        setPrintStatus({ success: false, message: "يرجى تحديد منتجات للطباعة" });
        return;
      }

      setIsPrinting(true);
      setPrintStatus(null);

      try {
        const res = await fetch("/api/print-labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            products: selectedProducts.map(p => ({
              name: p.name,
              barcode: p.barcode,
              selling_price: p.selling_price,
              printQty: p.printQty,
            })),
            printerIp,
            showPrice,
          }),
        });

        const data = await res.json();
        
        if (data.success) {
          setPrintStatus({ success: true, message: data.message });
        } else {
          setPrintStatus({ success: false, message: data.error });
        }
      } catch (error) {
        setPrintStatus({ success: false, message: "فشل الاتصال بالطابعة" });
      } finally {
        setIsPrinting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Printer className="text-emerald-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">طباعة الباركود</h2>
              <p className="text-sm text-slate-500">
                {selectedProducts.length} منتج ({totalLabels} ملصق)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b bg-white flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Print Mode Toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setPrintMode("A4")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                printMode === "A4"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              A4
            </button>
            <button
              onClick={() => setPrintMode("THERMAL")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                printMode === "THERMAL"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              حراري
            </button>
          </div>

          {/* Printer IP (Thermal mode only) */}
          {printMode === "THERMAL" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="192.168.1.100"
                  value={printerIp}
                  onChange={(e) => savePrinterIp(e.target.value)}
                  className="w-36 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                />
              </div>
              <button
                onClick={checkPrinter}
                disabled={!printerIp}
                className={`p-2 rounded-lg transition-colors ${
                  printerOnline === true
                    ? "bg-green-100 text-green-600"
                    : printerOnline === false
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title="فحص الاتصال"
              >
                {printerOnline === true ? (
                  <Wifi size={18} />
                ) : (
                  <WifiOff size={18} />
                )}
              </button>
            </div>
          )}

          {/* Label Size */}
          <select
            value={labelSize}
            onChange={(e) => setLabelSize(e.target.value as "small" | "medium" | "large")}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="small">صغير</option>
            <option value="medium">متوسط</option>
            <option value="large">كبير</option>
          </select>

          {/* Show Price Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-600">عرض السعر</span>
          </label>

          {/* Select All / Deselect All */}
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              تحديد الكل
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء التحديد
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            disabled={selectedProducts.length === 0 || isPrinting}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPrinting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Printer size={18} />
                طباعة
              </>
            )}
          </button>
        </div>

        {/* Print Status Message */}
        {printStatus && (
          <div className={`px-4 py-2 text-sm text-center ${
            printStatus.success 
              ? "bg-green-50 text-green-700 border-b border-green-200" 
              : "bg-red-50 text-red-700 border-b border-red-200"
          }`}>
            {printStatus.message}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto flex">
          {/* Product List */}
          <div className="w-1/3 border-l bg-slate-50 overflow-auto">
            <div className="p-2">
              {isLoading ? (
                <div className="p-4 text-center text-slate-400">جاري التحميل...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-slate-400">لا توجد منتجات</div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 mb-2 rounded-lg border transition-colors cursor-pointer ${
                      product.selected
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center ${
                              product.selected
                                ? "bg-emerald-600 border-emerald-600"
                                : "border-slate-300"
                            }`}
                          >
                            {product.selected && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>
                          <span className="font-medium text-sm truncate">
                            {product.name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 mr-7">
                          {product.barcode || "لا يوجد باركود"}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedProduct(
                            expandedProduct === product.id ? null : product.id
                          );
                        }}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        {expandedProduct === product.id ? (
                          <ChevronUp size={16} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Expanded Quantity Selector */}
                    {expandedProduct === product.id && (
                      <div
                        className="mt-3 pt-3 border-t border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="text-xs text-slate-500 block mb-1">
                          عدد الملصقات:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updatePrintQty(product.id, (product.printQty || 1) - 1)
                            }
                            className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={product.printQty || 1}
                            onChange={(e) =>
                              updatePrintQty(product.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 text-center py-1 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() =>
                              updatePrintQty(product.id, (product.printQty || 1) + 1)
                            }
                            className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-slate-100 p-4 overflow-auto">
            <div className="bg-white p-4 rounded-lg mb-4">
              <div className="text-sm text-slate-500 mb-2">معاينة:</div>
              <div className="text-xs text-slate-400">
                وضع {printMode === "A4" ? "A4 (3 أعمدة)" : "حراري (عمود واحد)"}
              </div>
            </div>

            {/* Labels Grid - Print Area */}
            <div
              className={`print-area ${
                printMode === "A4"
                  ? "grid grid-cols-3 gap-2"
                  : "grid grid-cols-1 gap-2"
              }`}
              style={
                printMode === "THERMAL"
                  ? { maxWidth: "58mm", margin: "0 auto" }
                  : undefined
              }
            >
              {selectedProducts.map((product) =>
                Array.from({ length: product.printQty || 1 }).map((_, index) => (
                  <div key={`${product.id}-${index}`}>
                    <Label
                      product={product}
                      showPrice={showPrice}
                      size={labelSize}
                    />
                  </div>
                ))
              )}
            </div>

            {selectedProducts.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>اختر منتجات للطباعة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintLabels;