/**
 * LabelGrid Component
 * Displays a grid of barcode labels for preview or printing
 */

import React, { useEffect, useState } from "react";
import BarcodeLabel from "./BarcodeLabel";
import { LabelLayoutConfig } from "../../utils/labelLayouts";

export interface LabelGridProps {
  labels: Array<{
    id: string;
    product: {
      id: number;
      part_name_ar?: string;
      name?: string;
      barcode?: string;
      brand?: string;
      oem?: string;
      selling_price?: number;
    };
    barcodeImage?: string;
  }>;
  layout: LabelLayoutConfig;
  showPrice?: boolean;
  showBrand?: boolean;
  showOEM?: boolean;
  isPreview?: boolean;
  onLabelRender?: (id: string, element: HTMLElement) => void;
}

/**
 * Grid of labels for pagination
 */
export const LabelGrid: React.FC<LabelGridProps> = ({
  labels,
  layout,
  showPrice = true,
  showBrand = false,
  showOEM = false,
  isPreview = false,
  onLabelRender,
}) => {
  const labelsPerPage = layout.columnsPerPage * layout.rowsPerPage;
  const pageMarginPx = layout.pageMarginMm * 3.78; // Convert mm to px
  const labelGapPx = layout.labelGapMm * 3.78;

  // Fill empty slots with placeholders
  const displayLabels = [...labels];
  while (displayLabels.length < labelsPerPage) {
    displayLabels.push({
      id: `placeholder-${displayLabels.length}`,
      product: {
        id: -1,
        name: "",
      },
    });
  }

  return (
    <div
      className="bg-white"
      style={{
        width: `${layout.pxWidth}px`,
        height: `${layout.pxHeight}px`,
        display: "grid",
        gridTemplateColumns: `repeat(${layout.columnsPerPage}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rowsPerPage}, 1fr)`,
        padding: `${pageMarginPx}px`,
        gap: `${labelGapPx}px`,
        pageBreakAfter: "always",
      }}
    >
      {displayLabels.map((item) => (
        <div
          key={item.id}
          ref={(el) => {
            if (el && item.product.id !== -1 && onLabelRender) {
              onLabelRender(item.id, el);
            }
          }}
        >
          <BarcodeLabel
            product={item.product}
            layout={layout}
            showPrice={showPrice}
            showBrand={showBrand}
            showOEM={showOEM}
            barcodeImage={item.barcodeImage}
            isPreview={isPreview}
          />
        </div>
      ))}
    </div>
  );
};

export default LabelGrid;
