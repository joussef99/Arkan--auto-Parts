/**
 * BarcodeLabel Component - Production Quality
 * Professional ERP/POS barcode label with commercial design
 * Similar to Odoo, SAP, Zoho Inventory, and Zebra Designer
 */

import React from "react";
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
 * Production-quality barcode label component
 * Optimized for thermal and laser printers
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

  // Calculate spacing proportions
  const paddingPx = 4; // Equal margins around label
  const contentWidth = layout.pxWidth - paddingPx * 2;
  const availableHeight = layout.pxHeight - paddingPx * 2;

  // Allocate space: barcode gets ~65%
  const barcodeHeight = Math.floor(availableHeight * 0.65);
  const spacingUnit = Math.floor((availableHeight - barcodeHeight) / 6);

  return (
    <div
      className="flex items-center justify-center bg-white overflow-hidden"
      style={{
        width: `${layout.pxWidth}px`,
        height: `${layout.pxHeight}px`,
        direction,
      }}
      dir={direction}
    >
      {/* Outer Border Container - 0.3mm light gray border with rounded corners */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          border: "1px solid #e5e7eb", // Light gray
          borderRadius: "2px",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Inner Content */}
        <div
          className="flex flex-col items-center justify-start bg-white"
          style={{
            width: contentWidth,
            height: availableHeight,
            padding: "0",
          }}
        >
          {/* Top Spacing */}
          <div style={{ height: spacingUnit * 0.5 }} />

          {/* Product Name - Single line, smaller, centered */}
          <div
            style={{
              fontFamily: "'Cairo', 'Segoe UI', sans-serif",
              fontSize: `${Math.max(9, layout.pxWidth / 15)}px`,
              fontWeight: 600,
              color: "#1f2937",
              textAlign: "center",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.3px",
            }}
          >
            {product.part_name_ar || product.name || "Product"}
          </div>

          {/* Spacing after product name */}
          <div style={{ height: spacingUnit * 0.8 }} />

          {/* Barcode Image - 65% of available space */}
          <div
            style={{
              height: barcodeHeight,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0,
            }}
          >
            {barcodeImage ? (
              <img
                src={barcodeImage}
                alt="barcode"
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                  imageRendering: "crisp-edges",
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: "10px",
                  color: "#d1d5db",
                }}
              >
                [Barcode]
              </div>
            )}
          </div>

          {/* Spacing after barcode */}
          <div style={{ height: spacingUnit * 0.8 }} />

          {/* Barcode Number - Monospace font, centered */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: `${Math.max(7, layout.pxWidth / 20)}px`,
              color: "#6b7280",
              textAlign: "center",
              letterSpacing: "0.5px",
              lineHeight: 1,
            }}
          >
            {product.barcode || "000000000000"}
          </div>

          {/* Spacing before price */}
          <div style={{ height: spacingUnit * 0.8 }} />

          {/* Price - Prominent, Cairo Bold, Green (#059669) */}
          {showPrice && product.selling_price !== undefined && (
            <div
              style={{
                fontFamily: "'Cairo', 'Segoe UI', sans-serif",
                fontSize: `${Math.max(11, layout.pxWidth / 12)}px`,
                fontWeight: 700,
                color: "#059669", // Professional emerald-700
                textAlign: "center",
                letterSpacing: "-0.5px",
              }}
            >
              {product.selling_price.toFixed(2)} د.ل
            </div>
          )}

          {/* Bottom Padding */}
          <div style={{ height: spacingUnit * 1.5 }} />
        </div>
      </div>
    </div>
  );
};

export default BarcodeLabel;
