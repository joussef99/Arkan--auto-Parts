import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  FileText,
  MessageSquare,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Package,
  Filter,
  ChevronDown,
  ArrowRightLeft,
  AlertTriangle,
  History,
  ShoppingCart,
  ChevronLeft,
  Settings,
  Volume2,
  VolumeX,
  QrCode,
  ScanLine,
  Zap,
  Wind,
  Disc,
  Droplet,
  Car,
  Activity,
  Thermometer,
  Wrench,
  UserPlus,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Part,
  Brand,
  Category,
  InvoiceItem,
  Model,
  YearRange,
  Customer,
} from "../types";
import { AddCustomerModal } from "./AddCustomerModal";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";

interface SalesCenterProps {
  onSave: (invoiceData: any) => Promise<void>;
}

export const SalesCenter: React.FC<SalesCenterProps> = ({ onSave }) => {
  // --- UI State ---
  const [activeView, setActiveView] = useState<
    "shopping" | "review" | "history"
  >("shopping");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previousInvoices, setPreviousInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<any | null>(null);

  // --- Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isSearching, setIsSearching] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "low" | "out"
  >("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("");

  // --- Invoice State ---
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [paymentType, setPaymentType] = useState<
    "cash" | "credit" | "transfer"
  >("cash");
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [invoiceNumber] = useState(
    `INV-${Math.floor(10000 + Math.random() * 90000)}`,
  );
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // --- Barcode Scanner State ---
  const [scannerMode, setScannerMode] = useState(false);
  const [scannerInput, setScannerInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- Refs ---
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // --- Feedback ---
  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // --- Sound Notification ---
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, [soundEnabled]);

  const playErrorBeep = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 400;
    osc.type = "square";
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, [soundEnabled]);

  // --- Barcode Handler ---
  const handleBarcodeScan = useCallback(
    async (code: string) => {
      if (!code || code.length < 3) return;
      playBeep();
      setSearchQuery(code);
      setScannerInput("");
      setScannerMode(false);

      try {
        const res = await fetch(`/api/parts?q=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const part = data[0];
          if (part.quantity > 0) {
            addToInvoice(part);
            showFeedback(`تم إضافة: ${part.part_name_ar}`, "success");
          } else {
            showFeedback(`القطعة غير متوفرة`, "error");
            playErrorBeep();
          }
        } else {
          showFeedback(`لم يتم العثور على الباركود`, "error");
          playErrorBeep();
        }
      } catch (err) {
        playErrorBeep();
      }
    },
    [playBeep, playErrorBeep],
  );

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setScannerMode((prev) => !prev);
        if (!scannerMode)
          setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
      if (e.key === "Escape" && scannerMode) {
        setScannerMode(false);
        setScannerInput("");
      }
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scannerMode]);

  // --- Data Fetching ---
  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then(setBrands)
      .catch(() => setBrands([]));
  }, []);

  const fetchParts = useCallback(async () => {
    setIsSearching(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    if (selectedBrand) params.append("brand", selectedBrand);
    params.append("availability", availabilityFilter);

    try {
      const res = await fetch(`/api/parts?${params}`);
      const data = await res.json();
      setParts(Array.isArray(data) ? data : []);
      setVisibleCount(12);
    } catch {
      setParts([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedBrand, availabilityFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchParts, 300);
    return () => clearTimeout(timer);
  }, [fetchParts]);

  useEffect(() => {
    if (customerSearchQuery.length > 1) {
      fetch(`/api/customers?q=${customerSearchQuery}`)
        .then((res) => res.json())
        .then(setCustomers);
    }
  }, [customerSearchQuery]);

  useEffect(() => {
    if (activeView === "history") {
      fetch("/api/invoices")
        .then((res) => res.json())
        .then(setPreviousInvoices);
    }
  }, [activeView]);

  // --- Calculations ---
  const subtotal = invoiceItems.reduce(
    (acc, item) =>
      acc + item.selling_price * item.quantity - (item.discount || 0),
    0,
  );
  const total = subtotal - invoiceDiscount;
  const remainingBalance = total - paidAmount;

  useEffect(() => {
    if (paymentType === "cash" || paymentType === "transfer") {
      setPaidAmount(total);
    }
  }, [total, paymentType]);

  // --- Handlers ---
  const addToInvoice = (part: Part) => {
    if (part.quantity === 0) return;
    setInvoiceItems((prev) => {
      const existing = prev.find((item) => item.id === part.id);
      if (existing) {
        return prev.map((item) =>
          item.id === part.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { ...part, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setInvoiceItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const removeItem = (id: number) => {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (invoiceItems.length === 0) return;
    if (isWalkIn && paidAmount < total) {
      alert("لا يمكن إنشاء فاتورة بآجل لزبون نقدي");
      return;
    }
    setIsSaving(true);
    try {
      const newInvoiceId = await onSave({
        customer_id: customer?.id || null,
        items: invoiceItems,
        payment_type: paymentType,
        discount: invoiceDiscount,
        total_amount: total,
        paid_amount: paidAmount,
        notes,
      });

      const res = await fetch(`/api/invoices/${newInvoiceId}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const newInvoice = await res.json();
      setCreatedInvoice(newInvoice);
      fetchParts();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("حدث خطأ أثناء إنشاء الفاتورة");
    } finally {
      setIsSaving(false);
    }
  };

  const resetNewSale = () => {
    setInvoiceItems([]);
    setActiveView("shopping");
    setCustomer(null);
    setIsWalkIn(true);
    setPaidAmount(0);
    setInvoiceDiscount(0);
    setNotes("");
    setCreatedInvoice(null);
  };

  const exportAsPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const dataUrl = await toJpeg(invoiceRef.current, {
        quality: 0.95,
        backgroundColor: "#fff",
      });
      const imgProps = doc.getImageProperties(dataUrl);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("حدث خطأ أثناء حفظ PDF");
    }
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("تعذر فتح الطباعة");
      printWindow.document.write(`
        <html dir="rtl"><head><title>طباعة الفاتورة</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 20px; color: #000; }
          * { box-sizing: border-box; }
          @media print { body { padding: 0; } @page { margin: 1cm; } }
        </style></head><body>${invoiceRef.current.innerHTML}
        <script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},500);}</script>
        </body></html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Print Error:", error);
      alert("تعذر فتح الطباعة");
    }
  };

  // --- Product Card Component (REDESIGNED & MODERN) ---
  const ProductCard = ({ part }: { part: Part }) => {
    const isLow = part.quantity <= part.min_stock_level && part.quantity > 0;
    const isOutOfStock = part.quantity === 0;

    // Stock status with emoji
    let stockIcon = "🟢";
    let stockLabel = "متوفر";
    if (isOutOfStock) {
      stockIcon = "🔴";
      stockLabel = "غير متوفر";
    } else if (isLow) {
      stockIcon = "🟡";
      stockLabel = `${part.quantity} متبقي`;
    }

    const ariaLabel = `${part.part_name_ar}, OEM: ${part.oem_number}, السعر: ${part.selling_price}, ${stockLabel}`;

    const handleCardClick = (e: React.KeyboardEvent | React.MouseEvent) => {
      if (isOutOfStock) return;
      if (e instanceof KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          addToInvoice(part);
          showFeedback(`✅ تمت إضافة: ${part.part_name_ar}`, "success");
        }
      } else {
        addToInvoice(part);
        showFeedback(`✅ تمت إضافة: ${part.part_name_ar}`, "success");
      }
    };

    return (
      <motion.article
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        onClick={handleCardClick}
        onKeyDown={handleCardClick}
        role="button"
        tabIndex={isOutOfStock ? -1 : 0}
        aria-label={ariaLabel}
        aria-pressed="false"
        aria-disabled={isOutOfStock}
        className={`relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 h-56 flex flex-col ${
          isOutOfStock
            ? "border-2 border-red-100 opacity-60 cursor-not-allowed"
            : "border-2 border-slate-100 hover:border-emerald-400 hover:-translate-y-1 cursor-pointer"
        }`}
      >
        {/* Stock Badge - with emoji */}
        <div
          className={`absolute top-3 left-3 px-2.5 py-1.5 rounded-full text-xs font-bold z-10 flex items-center gap-1 ${
            isOutOfStock
              ? "bg-red-100 text-red-700"
              : isLow
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
          }`}
          aria-label={`حالة المخزون: ${stockLabel}`}
        >
          <span>{stockIcon}</span>
          <span className="hidden sm:inline">{stockLabel}</span>
        </div>

        {/* Content - IMPROVED HIERARCHY */}
        <div className="p-4 h-full flex flex-col">
          {/* Product Name - Large & Bold */}
          <h3 className="font-bold text-slate-900 text-base line-clamp-2 mb-2 leading-snug group-hover:text-emerald-600 transition-colors">
            {part.part_name_ar}
          </h3>

          {/* OEM - Smaller, Monospace */}
          <p
            className="text-xs text-slate-500 font-mono mb-3 leading-relaxed"
            aria-label={`رقم OEM: ${part.oem_number}`}
          >
            {part.oem_number}
          </p>

          {/* Flexible Spacer */}
          <div className="flex-1" aria-hidden="true"></div>

          {/* Footer - Price & Add Button */}
          <div className="flex items-end justify-between gap-2 pt-3 border-t border-slate-100">
            <div className="flex-1">
              <p className="text-xs text-slate-400 mb-0.5">السعر</p>
              <p
                className="text-lg font-black text-emerald-600"
                aria-label={`السعر: ${part.selling_price} دينار`}
              >
                {part.selling_price}
              </p>
            </div>
            {/* Add Button - BIGGER 52x52 */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                if (!isOutOfStock) {
                  addToInvoice(part);
                  showFeedback(`✅ تمت إضافة: ${part.part_name_ar}`, "success");
                }
              }}
              aria-label={`إضافة ${part.part_name_ar} إلى السلة`}
              aria-disabled={isOutOfStock}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 font-bold text-lg ${
                isOutOfStock
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg focus:ring-emerald-500"
              }`}
            >
              <Plus size={28} aria-hidden="true" />
            </motion.button>
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-red-500/5 backdrop-blur-[1px] pointer-events-none"
            aria-hidden="true"
          >
            <div className="text-center">
              <p className="text-red-700 font-bold text-sm">غير متوفر</p>
            </div>
          </div>
        )}
      </motion.article>
    );
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-140px)] overflow-hidden font-sans relative"
      dir="rtl"
    >
      {/* Feedback Toast - IMPROVED MICRO INTERACTIONS */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-xl flex items-center gap-2.5 font-bold shadow-2xl z-50 text-sm backdrop-blur-sm ${
              feedback.type === "success"
                ? "bg-emerald-500/95 text-white"
                : "bg-red-500/95 text-white"
            }`}
          >
            {feedback.type === "success" ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle2 size={18} />
              </motion.div>
            ) : (
              <AlertTriangle size={18} />
            )}
            <span>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <AnimatePresence mode="wait">
        {activeView === "shopping" ? (
          <motion.div
            key="shopping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full overflow-hidden"
          >
            {/* Hero Search Section - COMPRESSED */}
            <div className="bg-linear-to-b from-slate-50 to-white py-3 px-4 lg:px-6 border-b border-slate-200">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-3 gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 leading-none">
                      مركز المبيعات
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ctrl+F بحث | F2 مسح
                    </p>
                  </div>
                </div>

                {/* Search Bar - MAIN FOCUS */}
                <div className="relative mb-3">
                  <Search
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500"
                    size={20}
                  />
                  <input
                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    placeholder="ابحث بالاسم، OEM، باركود، أو الشركة المصنعة..."
                    className="w-full pr-12 pl-6 py-3.5 text-base font-semibold bg-white border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 shadow-md hover:shadow-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter & Controls Bar - CLEAN & ALIGNED */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Left: Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Brand Filter */}
                    <div className="relative">
                      <select
                        className="appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all pr-7"
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                      >
                        <option value="">كل العلامات</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={14}
                      />
                    </div>

                    {/* Availability Filter */}
                    <select
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                      value={availabilityFilter}
                      onChange={(e) =>
                        setAvailabilityFilter(e.target.value as any)
                      }
                    >
                      <option value="all">كل التوفر</option>
                      <option value="available">متوفر فقط</option>
                      <option value="low">كمية قليلة</option>
                      <option value="out">غير متوفر</option>
                    </select>

                    {/* Clear Filters */}
                    {(selectedBrand || searchQuery) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedBrand("");
                        }}
                        className="px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X size={14} className="inline" />
                      </button>
                    )}
                  </div>

                  {/* Right: Scanner & Cart */}
                  <div className="flex items-center gap-2">
                    {/* Scanner Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setScannerMode(!scannerMode);
                        if (!scannerMode)
                          setTimeout(
                            () => barcodeInputRef.current?.focus(),
                            100,
                          );
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        scannerMode
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <ScanLine size={14} />
                      {scannerMode ? "مسح..." : "مسح"}
                    </motion.button>

                    {/* Sound Toggle */}
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      {soundEnabled ? (
                        <Volume2 size={14} />
                      ) : (
                        <VolumeX size={14} />
                      )}
                    </button>

                    {/* Cart Badge */}
                    {invoiceItems.length > 0 && (
                      <button
                        onClick={() => setActiveView("review")}
                        className="relative px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                      >
                        <ShoppingCart size={14} />
                        <span>{invoiceItems.length}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Barcode Scanner Input - IMPROVED */}
                {scannerMode && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2.5 bg-blue-50 border-2 border-blue-300 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="text-blue-600 shrink-0" size={20} />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="امسح الباركود..."
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center"
                        value={scannerInput}
                        onChange={(e) => setScannerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleBarcodeScan(scannerInput.trim());
                          }
                          if (e.key === "Escape") {
                            setScannerMode(false);
                            setScannerInput("");
                          }
                        }}
                      />
                      <button
                        onClick={() => setScannerMode(false)}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Main Content - LEFT CART + RIGHT PRODUCTS */}
            <div className="flex-1 overflow-hidden flex gap-4 px-4 lg:px-6 py-4">
              {/* LEFT: Cart - Modern Control Panel */}
              <div className="w-80 lg:w-96 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                {/* Header */}
                <header className="p-3.5 bg-emerald-600 border-b border-emerald-700 shrink-0">
                  <h2 className="font-black text-white flex items-center gap-2 text-lg">
                    <ShoppingCart size={20} aria-hidden="true" />
                    السلة
                    {invoiceItems.length > 0 && (
                      <span
                        className="ml-auto bg-white text-emerald-600 text-xs px-2.5 py-1 rounded-full font-bold"
                        aria-label={`عدد العناصر: ${invoiceItems.length}`}
                      >
                        {invoiceItems.length}
                      </span>
                    )}
                  </h2>
                </header>

                {/* Items List */}
                <section
                  className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-2.5"
                  aria-label="عناصر السلة"
                  role="region"
                >
                  {invoiceItems.length === 0 ? (
                    <div
                      className="h-full flex flex-col items-center justify-center text-slate-400 py-8"
                      role="status"
                      aria-live="polite"
                    >
                      <ShoppingCart
                        size={56}
                        className="mb-3 opacity-10"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-bold text-slate-500">
                        السلة فارغة
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        ابدأ بإضافة منتج
                      </p>
                    </div>
                  ) : (
                    invoiceItems.map((item) => (
                      <motion.article
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all space-y-2 focus-within:ring-2 focus-within:ring-emerald-500"
                        aria-label={`${item.part_name_ar}، كمية: ${item.quantity}، السعر: ${(item.selling_price * item.quantity).toFixed(1)}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight">
                              {item.part_name_ar}
                            </p>
                            <p className="text-xs text-slate-500 font-mono leading-relaxed mt-0.5">
                              {item.oem_number}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`إزالة ${item.part_name_ar} من السلة`}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </motion.button>
                        </div>
                        <div
                          className="flex items-center justify-between gap-2"
                          role="group"
                          aria-label="التحكم بالكمية"
                        >
                          <div className="flex items-center gap-0.5 bg-white rounded-md border border-slate-200 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="تقليل الكمية"
                              className="p-0.5 text-slate-600 hover:bg-slate-100 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-slate-300"
                            >
                              <Minus size={12} aria-hidden="true" />
                            </button>
                            <span className="w-6 text-center font-bold text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="زيادة الكمية"
                              className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-300"
                            >
                              <Plus size={12} aria-hidden="true" />
                            </button>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-emerald-600 text-sm">
                              {(item.selling_price * item.quantity).toFixed(1)}{" "}
                              د.ل
                            </p>
                          </div>
                        </div>
                      </motion.article>
                    ))
                  )}
                </section>

                {/* Footer - Always Visible */}
                {invoiceItems.length > 0 && (
                  <div className="p-3.5 border-t border-slate-200 bg-slate-50 shrink-0 space-y-2.5">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>الفرعي</span>
                        <span className="font-bold">
                          {subtotal.toFixed(1)} د.ل
                        </span>
                      </div>
                      {invoiceDiscount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>خصم</span>
                          <span className="font-bold">
                            -{invoiceDiscount.toFixed(1)} د.ل
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-slate-900 font-bold">الإجمالي</span>
                      <span className="text-lg font-black text-emerald-600">
                        {total.toFixed(1)} د.ل
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveView("review")}
                      className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-md text-sm"
                    >
                      <FileText size={16} />
                      استعراض
                    </motion.button>
                  </div>
                )}
              </div>

              {/* RIGHT: Products - Main Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"
                    ></motion.div>
                    <p className="text-sm font-semibold">جاري البحث...</p>
                  </div>
                ) : parts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <Package size={56} className="mb-3 opacity-20" />
                    <p className="text-base font-bold">لا توجد نتائج</p>
                    <p className="text-xs mt-2">جرب البحث عن قطعة أخرى</p>
                  </div>
                ) : (
                  <>
                    {/* Products Grid - LARGER & OPTIMIZED */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
                      <AnimatePresence mode="popLayout">
                        {parts.slice(0, visibleCount).map((part) => (
                          <ProductCard key={part.id} part={part} />
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Load More */}
                    {parts.length > visibleCount && (
                      <div className="flex justify-center pb-6">
                        <button
                          onClick={() => setVisibleCount((prev) => prev + 12)}
                          className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-all text-sm"
                        >
                          تحميل المزيد ({parts.length - visibleCount})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeView === "review" ? (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-6"
          >
            {createdInvoice ? (
              <div className="flex items-center justify-center min-h-full py-8">
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="text-center max-w-md"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 size={48} />
                  </motion.div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">
                    تم بنجاح!
                  </h2>
                  <p className="text-slate-500 mb-8">
                    رقم الفاتورة:{" "}
                    <span className="font-bold text-slate-900">
                      #{createdInvoice.id}
                    </span>
                  </p>

                  <div className="space-y-3 mb-8">
                    <button
                      onClick={() => {
                        setSelectedInvoice(createdInvoice);
                        setTimeout(handlePrint, 100);
                      }}
                      className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Printer size={18} />
                      طباعة
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInvoice(createdInvoice);
                        setTimeout(exportAsPDF, 100);
                      }}
                      className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      تنزيل PDF
                    </button>
                  </div>

                  <button
                    onClick={resetNewSale}
                    className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
                  >
                    بيع جديدة
                  </button>
                </motion.div>
              </div>
            ) : (
              <div className="py-8">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-2xl font-black text-slate-900 mb-6 px-4 lg:px-0">
                    مراجعة الفاتورة
                  </h2>

                  {invoiceItems.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center mx-4 lg:mx-0">
                      <ShoppingCart
                        size={64}
                        className="mx-auto mb-4 text-slate-300"
                      />
                      <p className="text-slate-400 font-semibold">
                        لا توجد أصناف في الفاتورة
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-4 lg:mx-0">
                      {/* Items Table */}
                      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-4 text-right font-bold text-slate-700 text-sm">
                                القطعة
                              </th>
                              <th className="px-6 py-4 text-center font-bold text-slate-700 text-sm">
                                الكمية
                              </th>
                              <th className="px-6 py-4 text-center font-bold text-slate-700 text-sm">
                                السعر
                              </th>
                              <th className="px-6 py-4 text-center font-bold text-slate-700 text-sm">
                                الإجمالي
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {invoiceItems.map((item) => (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-bold text-slate-900">
                                    {item.part_name_ar}
                                  </p>
                                  <p className="text-xs text-slate-500 font-mono mt-1">
                                    {item.oem_number}
                                  </p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2 bg-slate-100 rounded-lg p-1 w-fit mx-auto">
                                    <button
                                      onClick={() =>
                                        updateQuantity(item.id, -1)
                                      }
                                      className="p-1 hover:bg-white rounded"
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span className="w-6 text-center font-bold">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(item.id, 1)}
                                      className="p-1 hover:bg-white rounded"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-900">
                                  {item.selling_price} د.ل
                                </td>
                                <td className="px-6 py-4 text-center font-black text-emerald-600">
                                  {(item.selling_price * item.quantity).toFixed(
                                    1,
                                  )}{" "}
                                  د.ل
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Sidebar */}
                      <div className="space-y-6">
                        {/* Payment Info */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                          <h3 className="font-black text-slate-900 mb-4">
                            معلومات الدفع
                          </h3>

                          <div className="space-y-4 mb-6">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-2">
                                نوع الدفع
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                <button
                                  onClick={() => setPaymentType("cash")}
                                  className={`py-2 rounded-lg font-bold text-sm transition-all ${paymentType === "cash" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}
                                >
                                  نقدي
                                </button>
                                <button
                                  onClick={() => setPaymentType("credit")}
                                  className={`py-2 rounded-lg font-bold text-sm transition-all ${paymentType === "credit" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                                >
                                  آجل
                                </button>
                                <button
                                  onClick={() => setPaymentType("transfer")}
                                  className={`py-2 rounded-lg font-bold text-sm transition-all ${paymentType === "transfer" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"}`}
                                >
                                  تحويل
                                </button>
                              </div>
                            </div>

                            {/* Customer */}
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-2 mt-2">
                                العميل
                              </label>
                              <button
                                onClick={() => setShowCustomerSearch(true)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors text-right"
                              >
                                {isWalkIn ? "اختر عميل" : customer?.name}
                              </button>
                            </div>
                          </div>

                          {/* Totals */}
                          <div className="space-y-3 text-sm border-t border-slate-200 pt-4 mt-4">
                            <div className="flex justify-between text-slate-600">
                              <span>المجموع</span>
                              <span className="font-bold">
                                {subtotal.toFixed(1)} د.ل
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>خصم</span>
                              <input
                                type="number"
                                value={invoiceDiscount}
                                onChange={(e) =>
                                  setInvoiceDiscount(Number(e.target.value))
                                }
                                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right font-bold"
                              />
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 font-bold mt-3">
                              <span>الإجمالي النهائي</span>
                              <span className="text-xl text-emerald-600">
                                {total.toFixed(1)} د.ل
                              </span>
                            </div>

                            {/* Paid Amount */}
                            <div className="pt-4 border-t border-slate-200 mt-4">
                              <label className="block text-xs font-bold text-slate-500 mb-2">
                                المبلغ المدفوع
                              </label>
                              <input
                                type="number"
                                value={paidAmount}
                                onChange={(e) =>
                                  setPaidAmount(Number(e.target.value))
                                }
                                className="w-full px-4 py-3 text-lg font-black bg-emerald-50 border-2 border-emerald-300 rounded-lg outline-none focus:ring-4 focus:ring-emerald-100"
                              />
                              {remainingBalance > 0 && (
                                <p className="mt-2 text-sm font-bold text-red-600">
                                  المتبقي: {remainingBalance.toFixed(1)} د.ل
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={handleSave}
                            disabled={isSaving || invoiceItems.length === 0}
                            className="w-full mt-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                          >
                            {isSaving ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                            {isSaving ? "جاري..." : "إنشاء الفاتورة"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Back Button */}
                  <button
                    onClick={() => setActiveView("shopping")}
                    className="mt-8 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-all mx-4 lg:mx-0"
                  >
                    ← رجوع للبحث
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-6 py-8"
          >
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-black text-slate-900 mb-6">
                الفواتير السابقة
              </h2>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-right font-bold text-slate-700">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-4 text-right font-bold text-slate-700">
                        التاريخ
                      </th>
                      <th className="px-6 py-4 text-right font-bold text-slate-700">
                        العميل
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-slate-700">
                        الإجمالي
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-slate-700">
                        الدفع
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previousInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                          #{inv.id}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {new Date(inv.date).toLocaleDateString("ar-LY")}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {inv.customer_name || "نقدي"}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-emerald-600">
                          {inv.total_amount} د.ل
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              inv.payment_type === "cash"
                                ? "bg-emerald-100 text-emerald-700"
                                : inv.payment_type === "credit"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {inv.payment_type === "cash"
                              ? "نقدي"
                              : inv.payment_type === "credit"
                                ? "آجل"
                                : "تحويل"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showCustomerSearch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex justify-between items-center gap-4">
                <h3 className="font-bold text-xl">اختر عميل</h3>
                <button
                  onClick={() => setShowCustomerSearch(false)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    autoFocus
                    type="text"
                    placeholder="ابحث بالاسم أو الهاتف..."
                    className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c);
                        setIsWalkIn(false);
                        setShowCustomerSearch(false);
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200 gap-3"
                    >
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.phone}</p>
                      </div>
                      <div className="text-left">
                        <p
                          className={`font-bold ${c.current_balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                        >
                          {c.current_balance} د.ل
                        </p>
                      </div>
                    </button>
                  ))}
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
      </AnimatePresence>

      {/* Hidden Printable Invoice */}
      <div
        id="printable-invoice-container"
        className="fixed top-0 opacity-0 pointer-events-none"
        style={{ left: "-5000px" }}
      >
        <div
          ref={invoiceRef}
          id="printable-invoice"
          className="p-10 bg-white text-slate-900 font-sans"
          dir="rtl"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          <div className="border-b-4 border-emerald-600 pb-8 mb-8">
            <h1 className="text-4xl font-black mb-2">أركان لقطع الغيار</h1>
            <p className="text-slate-600">فاتورة مبيعات</p>
          </div>

          {selectedInvoice && (
            <>
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <p className="text-sm font-bold text-slate-600">
                    رقم الفاتورة:{" "}
                    <span className="text-slate-900">
                      #{selectedInvoice.id}
                    </span>
                  </p>
                  <p className="text-sm font-bold text-slate-600">
                    التاريخ:{" "}
                    <span className="text-slate-900">
                      {new Date(selectedInvoice.date).toLocaleDateString(
                        "ar-LY",
                      )}
                    </span>
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-600">
                    العميل:{" "}
                    <span className="text-slate-900">
                      {selectedInvoice.customer_name || "زبون نقدي"}
                    </span>
                  </p>
                </div>
              </div>

              <table className="w-full mb-10">
                <thead className="border-b-2 border-slate-300">
                  <tr>
                    <th className="px-4 py-2 text-right font-bold text-slate-700">
                      القطعة
                    </th>
                    <th className="px-4 py-2 text-center font-bold text-slate-700">
                      الكمية
                    </th>
                    <th className="px-4 py-2 text-center font-bold text-slate-700">
                      السعر
                    </th>
                    <th className="px-4 py-2 text-center font-bold text-slate-700">
                      الإجمالي
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="px-4 py-3 text-right">
                        {item.part_name_ar}
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        {item.unit_price} د.ل
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {(item.quantity * item.unit_price).toFixed(1)} د.ل
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>الإجمالي:</span>
                    <span className="font-bold">
                      {selectedInvoice.total_amount} د.ل
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t-2 border-slate-300 pt-2">
                    <span>الصافي:</span>
                    <span className="text-lg text-emerald-600">
                      {selectedInvoice.total_amount} د.ل
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
