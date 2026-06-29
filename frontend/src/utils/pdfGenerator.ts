/**
 * Professional PDF Generator
 * Generates PDFs with dynamically calculated label layouts
 * Centers label grids on pages and handles automatic pagination
 */

import jsPDF from "jspdf";
import { LabelLayoutConfig } from "./labelLayouts";
import { savePdfBytes } from "./desktopApi";

export interface PDFGenerationOptions {
  filename?: string;
  compress?: boolean;
}

/**
 * Generate PDF from label images with dynamic layout
 * Calculates positioning based on paper size, margins, label size, and gaps
 * Centers the label grid on each page
 */
export const generatePDFFromImages = async (
  images: string[], // Array of data URLs
  layout: LabelLayoutConfig,
  options: PDFGenerationOptions = {},
): Promise<void> => {
  const { filename = "barcode-labels.pdf" } = options;

  console.log(`=== PDF Generation Started ===`);
  console.log(
    `Label: ${layout.labelName} (${layout.labelWidth}×${layout.labelHeight}mm)`,
  );
  console.log(
    `Paper: ${layout.paperName} (${layout.paperWidth}×${layout.paperHeight}mm)`,
  );
  console.log(`Margins: ${layout.pageMarginMm}mm`);
  console.log(`Gaps: ${layout.horizontalGapMm}×${layout.verticalGapMm}mm`);
  console.log(
    `Grid: ${layout.columnsPerPage}×${layout.rowsPerPage} (${layout.labelsPerPage} per page)`,
  );
  console.log(
    `Grid positioning: offset (${layout.leftOffset.toFixed(1)}, ${layout.topOffset.toFixed(1)})mm`,
  );
  console.log(`Total images: ${images.length}`);

  if (images.length === 0) {
    throw new Error("No images to generate PDF");
  }

  // Filter out empty images
  const validImages = images.filter((img) => {
    if (!img) {
      console.warn("Empty image data found, skipping");
      return false;
    }
    return true;
  });

  console.log(`Valid images: ${validImages.length}/${images.length}`);

  if (validImages.length === 0) {
    throw new Error("No valid images to generate PDF");
  }

  // Create PDF with proper paper size (A4 by default)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [layout.paperWidth, layout.paperHeight],
  });

  // Add metadata
  doc.setProperties({
    title: "Barcode Labels",
    subject: `${layout.labelName} Labels on ${layout.paperName}`,
    author: "Arkan Parts System",
    keywords: "barcode,labels,inventory",
    creator: "Arkan Parts Barcode System",
  });

  let imageIndex = 0;
  let currentPage = 0;
  let isFirstPage = true;

  // Add images to PDF with dynamic positioning
  for (let i = 0; i < validImages.length; i++) {
    const imageData = validImages[i];

    // Determine position on current page
    const positionOnPage = imageIndex % layout.labelsPerPage;

    // Add new page if needed (except for first image)
    if (!isFirstPage && positionOnPage === 0) {
      console.log(`Adding page ${currentPage + 1}...`);
      doc.addPage([layout.paperWidth, layout.paperHeight]);
      currentPage++;
    }

    // Calculate column and row on current page
    const col = positionOnPage % layout.columnsPerPage;
    const row = Math.floor(positionOnPage / layout.columnsPerPage);

    // Calculate position with centering offset
    const x =
      layout.leftOffset + col * (layout.labelWidth + layout.horizontalGapMm);
    const y =
      layout.topOffset + row * (layout.labelHeight + layout.verticalGapMm);

    try {
      // Add image to PDF at calculated position
      doc.addImage(
        imageData,
        "PNG",
        x,
        y,
        layout.labelWidth,
        layout.labelHeight,
      );

      console.log(
        `Image ${i + 1} added to page ${currentPage + 1}, position (${col}, ${row}) at (${x.toFixed(1)}, ${y.toFixed(1)})mm`,
      );
    } catch (error) {
      console.error(`Failed to add image ${i + 1} to PDF:`, error);
      throw new Error(
        `Image processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    imageIndex++;
    isFirstPage = false;
  }

  console.log(
    `PDF complete: ${currentPage + 1} pages, ${validImages.length} labels`,
  );
  console.log(`Saving as: ${filename}`);

  const pdfBytes = doc.output("arraybuffer");
  await savePdfBytes(new Uint8Array(pdfBytes), filename);
};

/**
 * Generate PDF and return as blob (for future use with file upload)
 */
export const generatePDFAsBlob = async (
  images: string[],
  layout: LabelLayoutConfig,
): Promise<Blob> => {
  console.log(`Generating PDF as blob...`);

  if (images.length === 0) {
    throw new Error("No images to generate PDF");
  }

  const validImages = images.filter((img) => img);

  if (validImages.length === 0) {
    throw new Error("No valid images to generate PDF");
  }

  // Create PDF with proper paper size
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [layout.paperWidth, layout.paperHeight],
  });

  doc.setProperties({
    title: "Barcode Labels",
    subject: `${layout.labelName} Labels on ${layout.paperName}`,
    author: "Arkan Parts System",
  });

  let imageIndex = 0;
  let currentPage = 0;
  let isFirstPage = true;

  for (const imageData of validImages) {
    if (!imageData) continue;

    const positionOnPage = imageIndex % layout.labelsPerPage;

    if (!isFirstPage && positionOnPage === 0) {
      doc.addPage([layout.paperWidth, layout.paperHeight]);
      currentPage++;
    }

    const col = positionOnPage % layout.columnsPerPage;
    const row = Math.floor(positionOnPage / layout.columnsPerPage);

    const x =
      layout.leftOffset + col * (layout.labelWidth + layout.horizontalGapMm);
    const y =
      layout.topOffset + row * (layout.labelHeight + layout.verticalGapMm);

    try {
      doc.addImage(
        imageData,
        "PNG",
        x,
        y,
        layout.labelWidth,
        layout.labelHeight,
      );
    } catch (error) {
      console.error("Failed to add image to PDF:", error);
      throw error;
    }

    imageIndex++;
    isFirstPage = false;
  }

  console.log(`PDF blob generated: ${currentPage + 1} pages`);
  return doc.output("blob");
};
