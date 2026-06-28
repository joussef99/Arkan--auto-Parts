/**
 * PDF Generator
 * Creates PDFs from label images with automatic pagination
 */

import jsPDF from "jspdf";
import { LabelLayoutConfig } from "./labelLayouts";

export interface PDFGenerationOptions {
  filename?: string;
  compress?: boolean;
}

/**
 * Generate PDF from label images
 * Automatically handles pagination and layout
 */
export const generatePDFFromImages = async (
  images: string[], // Array of data URLs
  layout: LabelLayoutConfig,
  options: PDFGenerationOptions = {},
): Promise<void> => {
  const { filename = "barcode-labels.pdf", compress = true } = options;

  console.log(`Generating PDF with ${images.length} images`);
  console.log(`Layout: ${layout.id}, ${layout.width}×${layout.height}mm`);
  console.log(
    `Grid: ${layout.columnsPerPage} cols × ${layout.rowsPerPage} rows`,
  );

  if (images.length === 0) {
    throw new Error("No images to generate PDF");
  }

  // Filter out empty images
  const validImages = images.filter((img) => {
    if (!img) {
      console.warn("Empty image data found");
      return false;
    }
    return true;
  });

  console.log(`Valid images: ${validImages.length}/${images.length}`);

  if (validImages.length === 0) {
    throw new Error("No valid images to generate PDF");
  }

  // Create PDF with appropriate page size
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [layout.width, layout.height],
  });

  // Add metadata
  doc.setProperties({
    title: "Barcode Labels",
    subject: "Product Labels",
    author: "Arkan Parts System",
    keywords: "barcode,labels,inventory",
  });

  // Calculate positions
  const margin = layout.pageMarginMm;
  const gap = layout.labelGapMm;
  const imgWidth = layout.width - 2 * margin;
  const imgHeight = layout.height - 2 * margin;

  let imageIndex = 0;
  let isFirstPage = true;

  // Add images to PDF
  for (let i = 0; i < validImages.length; i++) {
    const imageData = validImages[i];

    // Add new page if needed (except for first image)
    if (
      !isFirstPage &&
      imageIndex % (layout.columnsPerPage * layout.rowsPerPage) === 0
    ) {
      console.log(`Adding new page for image ${i + 1}`);
      doc.addPage([layout.width, layout.height]);
    }

    // Calculate position on current page
    const positionOnPage =
      imageIndex % (layout.columnsPerPage * layout.rowsPerPage);
    const col = positionOnPage % layout.columnsPerPage;
    const row = Math.floor(positionOnPage / layout.columnsPerPage);

    const x = margin + col * (imgWidth + gap);
    const y = margin + row * (imgHeight + gap);

    try {
      console.log(
        `Adding image ${i + 1} at position (${x.toFixed(1)}, ${y.toFixed(1)})mm`,
      );
      // Add image to PDF
      doc.addImage(imageData, "PNG", x, y, imgWidth, imgHeight);
    } catch (error) {
      console.error(`Failed to add image ${i + 1} to PDF:`, error);
    }

    imageIndex++;
    isFirstPage = false;
  }

  console.log(`Saving PDF as ${filename}`);
  // Save PDF
  doc.save(filename);
};

/**
 * Generate PDF and return as blob
 */
export const generatePDFAsBlob = async (
  images: string[],
  layout: LabelLayoutConfig,
): Promise<Blob> => {
  if (images.length === 0) {
    throw new Error("No images to generate PDF");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [layout.width, layout.height],
  });

  doc.setProperties({
    title: "Barcode Labels",
    subject: "Product Labels",
    author: "Arkan Parts System",
  });

  const margin = layout.pageMarginMm;
  const gap = layout.labelGapMm;
  const imgWidth = layout.width - 2 * margin;
  const imgHeight = layout.height - 2 * margin;

  let imageIndex = 0;
  let isFirstPage = true;

  for (const imageData of images) {
    if (!imageData) continue;

    if (
      !isFirstPage &&
      imageIndex % (layout.columnsPerPage * layout.rowsPerPage) === 0
    ) {
      doc.addPage([layout.width, layout.height]);
    }

    const positionOnPage =
      imageIndex % (layout.columnsPerPage * layout.rowsPerPage);
    const col = positionOnPage % layout.columnsPerPage;
    const row = Math.floor(positionOnPage / layout.columnsPerPage);

    const x = margin + col * (imgWidth + gap);
    const y = margin + row * (imgHeight + gap);

    try {
      doc.addImage(imageData, "PNG", x, y, imgWidth, imgHeight);
    } catch (error) {
      console.error("Failed to add image:", error);
    }

    imageIndex++;
    isFirstPage = false;
  }

  return doc.output("blob");
};
