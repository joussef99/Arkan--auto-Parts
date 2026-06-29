/**
 * BarcodePrintPreview Component
 * Main UI for selecting products, configuring labels, and generating PDFs
 * Uses dynamic layout calculation system
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Package,
  X,
  Loader,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import BarcodeLabel from "./BarcodeLabel";
import LabelGrid from "./LabelGrid";
import {
  LabelLayoutConfig,
  calculateLayout,
  getAvailableLabelSizes,
} from "../../utils/labelLayouts";
import { useBarcodePdf } from "../../hooks/useBarcodePdf";

interface Product {
  id: number;
  part_name_ar?: string;
  name?: string;
  barcode?: string;
  brand?: string;
  oem?: string;
  selling_price?: number;
  quantity?: number;
}

interface SelectedProduct {
  product: Product;
  copies: number;
  barcodeImage?: string;
}

export interface BarcodePrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Professional barcode label print preview and generation
 */
export const BarcodePrintPreview: React.FC<BarcodePrintPreviewProps> = ({
  isOpen,
  onClose,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [labelSize, setLabelSize] = useState<string>("medium");
  const [showPrice, setShowPrice] = useState(true);
  const [showBrand, setShowBrand] = useState(false);
  const [showOEM, setShowOEM] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const previewGridRef = useRef<HTMLDivElement>(null);
  const labelRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  const { isGenerating, progress, error, generatePDF, reset } = useBarcodePdf();

  // Load products on mount
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  /**
   * Load products from API
   */
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/parts");
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch barcode image for a product
   */
  const fetchBarcode = async (barcode: string): Promise<string> => {
    try {
      const response = await fetch(
        `/api/barcode/${encodeURIComponent(barcode)}`,
      );
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to fetch barcode:", error);
      return "";
    }
  };

  /**
   * Add product to selection
   */
  const addProduct = async (product: Product, copies: number = 1) => {
    if (copies <= 0) return;

    const barcodeImage = product.barcode
      ? await fetchBarcode(product.barcode)
      : undefined;

    const existingIndex = selectedProducts.findIndex(
      (sp) => sp.product.id === product.id,
    );

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...selectedProducts];
      updated[existingIndex].copies += copies;
      setSelectedProducts(updated);
    } else {
      // Add new
      setSelectedProducts([
        ...selectedProducts,
        { product, copies, barcodeImage },
      ]);
    }

    setExpandedProduct(null);
  };

  /**
   * Remove product from selection
   */
  const removeProduct = (productId: number) => {
    setSelectedProducts(
      selectedProducts.filter((sp) => sp.product.id !== productId),
    );
  };

  /**
   * Update product copies
   */
  const updateCopies = async (productId: number, copies: number) => {
    if (copies <= 0) {
      removeProduct(productId);
      return;
    }

    const updated = selectedProducts.map((sp) =>
      sp.product.id === productId ? { ...sp, copies } : sp,
    );
    setSelectedProducts(updated);
  };

  /**
   * Generate all labels for preview/export
   */
  const generateLabels = () => {
    const labels: Array<{
      id: string;
      product: Product;
      barcodeImage?: string;
    }> = [];

    for (const selected of selectedProducts) {
      for (let i = 0; i < selected.copies; i++) {
        labels.push({
          id: `${selected.product.id}-${i}`,
          product: selected.product,
          barcodeImage: selected.barcodeImage,
        });
      }
    }

    return labels;
  };

  /**
   * Generate PDF with dynamic layout
   */
  const handleGeneratePDF = async () => {
    reset();

    const labelElements = Array.from(labelRefsMap.current.values());
    console.log(`Collected ${labelElements.length} label elements from map`);

    if (labelElements.length === 0) {
      console.warn("No label elements found in map");
      return;
    }

    // Log element details
    labelElements.forEach((el, i) => {
      console.log(
        `Label ${i}: ${el.offsetWidth}x${el.offsetHeight}px, classes: ${el.className}`,
      );
    });

    // Use dynamic layout calculation
    const layout = calculateLayout(labelSize, "a4", {
      pageMarginMm: 10,
      horizontalGapMm: 3,
      verticalGapMm: 3,
    });

    await generatePDF(labelElements, layout);
  };

  /**
   * Filter products by search
   */
  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.part_name_ar?.includes(searchQuery),
  );

  if (!isOpen) return null;

  const layout = calculateLayout(labelSize, "a4", {
    pageMarginMm: 10,
    horizontalGapMm: 3,
    verticalGapMm: 3,
  });
  const allLabels = generateLabels();
  const totalLabels = allLabels.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold">طباعة الملصقات</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Products Selection */}
          <div className="w-96 border-r flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded text-sm"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  جاري التحميل...
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="border rounded bg-gray-50">
                      <button
                        onClick={() =>
                          setExpandedProduct(
                            expandedProduct === product.id ? null : product.id,
                          )
                        }
                        className="w-full p-2 text-sm font-medium text-right flex items-center justify-between hover:bg-gray-100"
                      >
                        <span>{product.part_name_ar || product.name}</span>
                        {expandedProduct === product.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {expandedProduct === product.id && (
                        <div className="p-2 bg-white border-t space-y-2">
                          <div className="text-xs text-gray-600">
                            {product.barcode}
                          </div>
                          {product.selling_price && (
                            <div className="text-sm font-bold text-emerald-600">
                              {product.selling_price.toFixed(2)} د.ل
                            </div>
                          )}
                          <button
                            onClick={() => addProduct(product, 1)}
                            className="w-full py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                          >
                            أضف
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Products */}
            <div className="p-3 border-t bg-gray-50">
              <h3 className="font-semibold text-sm mb-2">
                المنتجات المختارة ({selectedProducts.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedProducts.map((sp) => (
                  <div
                    key={sp.product.id}
                    className="flex items-center justify-between bg-white p-2 rounded text-sm"
                  >
                    <span>{sp.product.part_name_ar}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={sp.copies}
                        onChange={(e) =>
                          updateCopies(
                            sp.product.id,
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-10 px-1 py-0.5 border rounded text-xs text-center"
                      />
                      <button
                        onClick={() => removeProduct(sp.product.id)}
                        className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Preview & Controls */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Controls */}
            <div className="p-4 border-b space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Label Size */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    حجم الملصق
                  </label>
                  <select
                    value={labelSize}
                    onChange={(e) => setLabelSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    {getAvailableLabelSizes().map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="rounded"
                    />
                    عرض السعر
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBrand}
                      onChange={(e) => setShowBrand(e.target.checked)}
                      className="rounded"
                    />
                    عرض العلامة
                  </label>
                </div>
              </div>

              {/* Stats */}
              <div className="text-sm text-gray-600">
                {totalLabels} ملصق /{" "}
                {Math.ceil(totalLabels / layout.labelsPerPage)} صفحة
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error.message}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGeneratePDF}
                disabled={totalLabels === 0 || isGenerating}
                className="w-full py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    توليد PDF
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="w-full bg-gray-200 rounded overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Preview */}
            <div
              ref={previewGridRef}
              className="flex-1 overflow-auto bg-gray-100 p-4"
            >
              {totalLabels === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  اختر المنتجات لمعاينتها
                </div>
              ) : (
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, ${layout.pxWidth}px)`,
                    justifyContent: "start",
                  }}
                >
                  {/* Render label grids for preview */}
                  {allLabels.map((label, index) => (
                    <div
                      key={label.id}
                      ref={(el) => {
                        if (el) {
                          labelRefsMap.current.set(label.id, el);
                          console.log(`Stored ref for label ${label.id}`, el);
                        }
                      }}
                      className="bg-white border border-gray-300 overflow-hidden"
                      style={{
                        width: `${layout.pxWidth}px`,
                        height: `${layout.pxHeight}px`,
                      }}
                    >
                      <BarcodeLabel
                        product={label.product}
                        layout={layout}
                        showPrice={showPrice}
                        showBrand={showBrand}
                        showOEM={showOEM}
                        barcodeImage={label.barcodeImage}
                        isPreview={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodePrintPreview;
