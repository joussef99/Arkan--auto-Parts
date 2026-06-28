/**
 * BarcodeLabel Component
 * Renders a professional barcode label with React/Tailwind
 * Can be converted to image for PDF export
 */

import React, { useEffect, useState } from "react";
import { LabelLayoutConfig } from "../../utils/labelLayouts";

export interface BarcodeLabelProps {
  product: {
    id: number;
    part_name_ar?: string;
    name?: string;
    barcode?: string;
    brand?: string;
    oem?: string;
    selling_price?: number;
  };
  layout: LabelLayoutConfig;
  showPrice?: boolean;
  showBrand?: boolean;
  showOEM?: boolean;
  barcodeImage?: string; // Data URL of barcode image
  isPreview?: boolean; // If true, add border for visual preview
}

/**
 * Professional barcode label component
 */
export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({
  product,
  layout,
  showPrice = true,
  showBrand = false,
  showOEM = false,
  barcodeImage,
  isPreview = false,
}) => {
  const isArabic = (product.part_name_ar || "").length > 0;
  const direction = isArabic ? "rtl" : "ltr";

  return (
    <div
      className="flex items-center justify-center bg-white overflow-hidden"
      style={{
        width: `${layout.pxWidth}px`,
        height: `${layout.pxHeight}px`,
        border: isPreview ? "1px solid #d1d5db" : "none",
        borderRadius: isPreview ? "4px" : "0",
        direction,
      }}
      dir={direction}
    >
      {/* Label Content Container */}
      <div
        className="w-full h-full flex flex-col items-center justify-between p-2 bg-white border border-gray-300"
        style={{
          borderRadius: "4px",
        }}
      >
        {/* Top Section: Product Info */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          {/* Brand (Optional) */}
          {showBrand && product.brand && (
            <div className="text-xs font-light text-gray-600 line-clamp-1">
              {product.brand}
            </div>
          )}

          {/* Product Name (Primary) */}
          <div className="text-sm font-bold text-gray-900 line-clamp-2 text-center leading-tight max-w-full">
            {product.part_name_ar || product.name || "Product"}
          </div>

          {/* OEM (Optional) */}
          {showOEM && product.oem && (
            <div className="text-xs text-gray-500 line-clamp-1">
              {product.oem}
            </div>
          )}
        </div>

        {/* Middle Section: Barcode (DOMINANT) */}
        <div className="flex-1 flex items-center justify-center min-h-0 py-1.5 w-full">
          {barcodeImage ? (
            <img
              src={barcodeImage}
              alt="barcode"
              className="max-h-full max-w-full object-contain"
              style={{
                filter: "drop-shadow(0 0 0 0)",
              }}
            />
          ) : (
            <div className="text-xs text-gray-400">[Barcode]</div>
          )}
        </div>

        {/* Bottom Section: Barcode Number & Price */}
        <div className="flex flex-col items-center gap-1 shrink-0 w-full">
          {/* Barcode Number */}
          <div className="text-xs font-mono text-gray-700 text-center line-clamp-1">
            {product.barcode || "000000000000"}
          </div>

          {/* Price (Prominent) */}
          {showPrice && product.selling_price && (
            <div className="text-lg font-bold text-emerald-600 text-center">
              {product.selling_price.toFixed(2)} د.ل
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeLabel;
