/**
 * Arabic Font Loader for jsPDF
 * Simple text rendering support for jsPDF
 */

import jsPDF from "jspdf";

/**
 * Setup basic font for document
 */
export const setupArabicFont = (doc: jsPDF): void => {
  try {
    doc.setFont("Helvetica");
  } catch (error) {
    console.warn("Font setup warning:", error);
  }
};

/**
 * Render text - simple wrapper for text rendering
 */
export const renderArabicText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  align: "left" | "center" | "right" = "center",
): void => {
  try {
    setupArabicFont(doc);
    doc.setFontSize(fontSize);
    doc.text(text, x, y, {
      align: align as any,
      baseline: "middle",
    });
  } catch (error) {
    console.warn("Error rendering text:", error);
  }
};
