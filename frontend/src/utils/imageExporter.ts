/**
 * Image Exporter
 * Converts React components (rendered as HTML) to high-resolution PNG images
 * Using html-to-image library for better Tailwind CSS support
 */

import { toPng } from "html-to-image";

export interface ExportOptions {
  pixelRatio?: number;
  quality?: number;
  backgroundColor?: string;
  scale?: number;
}

/**
 * Export HTML element to PNG image (Data URL)
 * High resolution for print quality
 */
export const exportElementToImage = async (
  element: HTMLElement,
  options: ExportOptions = {},
): Promise<string> => {
  const {
    pixelRatio = 3, // High DPI for print quality
    quality = 1,
    backgroundColor = "#ffffff",
    scale = 2,
  } = options;

  try {
    console.log(
      `Exporting element: size: ${element.offsetWidth}x${element.offsetHeight}`,
    );

    const dataUrl = await toPng(element, {
      pixelRatio,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });

    console.log(`Image data URL length: ${dataUrl.length}`);

    return dataUrl;
  } catch (error) {
    console.error("Failed to export element to image:", error);
    throw new Error(
      "Image export failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
};

/**
 * Export multiple elements to images
 */
export const exportElementsToImages = async (
  elements: HTMLElement[],
  options: ExportOptions = {},
): Promise<string[]> => {
  const images: string[] = [];

  console.log(`Exporting ${elements.length} elements to images`);

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    try {
      console.log(`Exporting element ${i + 1}/${elements.length}`);
      const image = await exportElementToImage(element, options);
      if (!image) {
        console.warn(`Empty image for element ${i + 1}`);
      }
      images.push(image);
    } catch (error) {
      console.error(`Failed to export element ${i + 1}:`, error);
      images.push(""); // Push empty string for failed exports
    }
  }

  const validCount = images.filter((i) => i).length;
  console.log(`Successfully exported ${validCount}/${elements.length} images`);
  return images;
};

/**
 * Export element to blob (for downloading)
 */
export const exportElementToBlob = async (
  element: HTMLElement,
  options: ExportOptions = {},
): Promise<Blob> => {
  const dataUrl = await exportElementToImage(element, options);

  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  return response.blob();
};
