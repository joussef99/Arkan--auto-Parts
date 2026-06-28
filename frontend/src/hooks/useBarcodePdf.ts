/**
 * useBarcodePdf Hook
 * Handles PDF generation logic from barcode labels
 */

import { useState, useCallback } from "react";
import { exportElementsToImages } from "../utils/imageExporter";
import { generatePDFFromImages } from "../utils/pdfGenerator";
import { LabelLayoutConfig } from "../utils/labelLayouts";

export interface UseBarcodePdfOptions {
  onProgress?: (current: number, total: number) => void;
  onError?: (error: Error) => void;
  pixelRatio?: number;
}

export interface UseBarcodePdfState {
  isGenerating: boolean;
  progress: number;
  totalLabels: number;
  error: Error | null;
}

/**
 * Hook for PDF generation workflow
 */
export const useBarcodePdf = (options: UseBarcodePdfOptions = {}) => {
  const { onProgress, onError, pixelRatio = 3 } = options;
  const [state, setState] = useState<UseBarcodePdfState>({
    isGenerating: false,
    progress: 0,
    totalLabels: 0,
    error: null,
  });

  /**
   * Generate PDF from label elements
   */
  const generatePDF = useCallback(
    async (
      labelElements: HTMLElement[],
      layout: LabelLayoutConfig,
      filename?: string,
    ): Promise<void> => {
      if (labelElements.length === 0) {
        const error = new Error("No labels to generate PDF");
        setState((prev) => ({ ...prev, error }));
        onError?.(error);
        return;
      }

      setState({
        isGenerating: true,
        progress: 0,
        totalLabels: labelElements.length,
        error: null,
      });

      try {
        // Convert all labels to images
        const images = await exportElementsToImages(labelElements, {
          pixelRatio,
          backgroundColor: "#ffffff",
        });

        // Update progress
        setState((prev) => ({
          ...prev,
          progress: 50,
        }));
        onProgress?.(50, 100);

        // Generate PDF
        await generatePDFFromImages(images, layout, {
          filename:
            filename ||
            `barcode-labels-${new Date().toISOString().split("T")[0]}.pdf`,
        });

        // Complete
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          progress: 100,
        }));
        onProgress?.(100, 100);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: err,
        }));
        onError?.(err);
      }
    },
    [onProgress, onError, pixelRatio],
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      totalLabels: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    generatePDF,
    reset,
  };
};

export default useBarcodePdf;
