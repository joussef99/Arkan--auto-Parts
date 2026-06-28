/**
 * PrintLabels Component
 * Main export for barcode label printing
 * Uses new professional React-based architecture
 */

import React from "react";
import { BarcodePrintPreview } from "./barcode/BarcodePrintPreview";

export interface PrintLabelsProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Print Labels - Professional barcode label generation
 * Architecture:
 * - React components for label design
 * - Tailwind CSS for styling
 * - html-to-image for high-res export
 * - jsPDF for PDF generation
 */
export const PrintLabels: React.FC<PrintLabelsProps> = ({
  isOpen,
  onClose,
}) => {
  return <BarcodePrintPreview isOpen={isOpen} onClose={onClose} />;
};

export default PrintLabels;
