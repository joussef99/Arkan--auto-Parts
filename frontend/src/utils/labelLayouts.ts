/**
 * Professional Commercial Label Layout System
 * Dynamic calculation based on paper size, margins, label size, and gaps
 * No hardcoded rows/columns - all calculated automatically
 */

// Conversion factor: 1mm ≈ 3.78px
export const MM_TO_PX = 3.78;

/**
 * Paper size configuration
 */
export interface PaperSize {
  id: string;
  name: string;
  nameAr: string;
  width: number; // mm
  height: number; // mm
}

/**
 * Label size definition
 */
export interface LabelSize {
  id: string;
  name: string;
  nameAr: string;
  width: number; // mm
  height: number; // mm
}

/**
 * Dynamic layout configuration - calculated at runtime
 */
export interface LabelLayoutConfig {
  // Label definition
  labelId: string;
  labelName: string;
  labelNameAr: string;
  labelWidth: number; // mm
  labelHeight: number; // mm

  // Paper configuration
  paperId: string;
  paperName: string;
  paperWidth: number; // mm (e.g., 210 for A4)
  paperHeight: number; // mm (e.g., 297 for A4)

  // Layout parameters
  pageMarginMm: number; // margin on all sides (default 10mm)
  horizontalGapMm: number; // gap between labels horizontally (default 3mm)
  verticalGapMm: number; // gap between labels vertically (default 3mm)

  // Calculated values
  printableWidth: number; // mm (paperWidth - 2*margin)
  printableHeight: number; // mm (paperHeight - 2*margin)
  columnsPerPage: number; // calculated
  rowsPerPage: number; // calculated
  labelsPerPage: number; // calculated

  // Grid positioning (for centering)
  gridWidth: number; // mm - total width of label grid
  gridHeight: number; // mm - total height of label grid
  leftOffset: number; // mm - horizontal offset to center grid
  topOffset: number; // mm - vertical offset to center grid

  // For HTML rendering: convert mm to px
  pxWidth: number; // label width in pixels
  pxHeight: number; // label height in pixels
}

/**
 * Available paper sizes
 */
export const PAPER_SIZES: Record<string, PaperSize> = {
  a4: {
    id: "a4",
    name: "A4 (210×297mm)",
    nameAr: "ورقة A4",
    width: 210,
    height: 297,
  },
  a5: {
    id: "a5",
    name: "A5 (148×210mm)",
    nameAr: "ورقة A5",
    width: 148,
    height: 210,
  },
  letter: {
    id: "letter",
    name: "Letter (8.5×11 inches)",
    nameAr: "حرف",
    width: 215.9,
    height: 279.4,
  },
};

/**
 * Available label sizes
 */
export const LABEL_SIZES: Record<string, LabelSize> = {
  small: {
    id: "small",
    name: "Small (50×25mm)",
    nameAr: "صغير (50×25 مم)",
    width: 50,
    height: 25,
  },
  medium: {
    id: "medium",
    name: "Medium (40×30mm)",
    nameAr: "متوسط (40×30 مم)",
    width: 40,
    height: 30,
  },
  large: {
    id: "large",
    name: "Large (80×50mm)",
    nameAr: "كبير (80×50 مم)",
    width: 80,
    height: 50,
  },
  xlarge: {
    id: "xlarge",
    name: "Extra Large (100×60mm)",
    nameAr: "كبير جداً (100×60 مم)",
    width: 100,
    height: 60,
  },
};

/**
 * Calculate dynamic layout based on paper size, label size, margins, and gaps
 */
export const calculateLayout = (
  labelId: string,
  paperId: string = "a4",
  options: {
    pageMarginMm?: number;
    horizontalGapMm?: number;
    verticalGapMm?: number;
  } = {},
): LabelLayoutConfig => {
  const label = LABEL_SIZES[labelId];
  const paper = PAPER_SIZES[paperId];

  if (!label) {
    throw new Error(`Unknown label size: ${labelId}`);
  }
  if (!paper) {
    throw new Error(`Unknown paper size: ${paperId}`);
  }

  const pageMarginMm = options.pageMarginMm ?? 10;
  const horizontalGapMm = options.horizontalGapMm ?? 3;
  const verticalGapMm = options.verticalGapMm ?? 3;

  // Calculate printable area
  const printableWidth = paper.width - 2 * pageMarginMm;
  const printableHeight = paper.height - 2 * pageMarginMm;

  // Calculate how many labels fit horizontally and vertically
  // Formula: (printableWidth - gap * (cols - 1)) / cols = labelWidth
  // Solving for cols: printableWidth / (labelWidth + gap) rounded down, then +1 for last label without trailing gap

  let columnsPerPage = Math.floor(
    (printableWidth + horizontalGapMm) / (label.width + horizontalGapMm),
  );
  let rowsPerPage = Math.floor(
    (printableHeight + verticalGapMm) / (label.height + verticalGapMm),
  );

  // Ensure at least 1 column and row
  columnsPerPage = Math.max(1, columnsPerPage);
  rowsPerPage = Math.max(1, rowsPerPage);

  // Calculate actual grid size
  const gridWidth =
    columnsPerPage * label.width + (columnsPerPage - 1) * horizontalGapMm;
  const gridHeight =
    rowsPerPage * label.height + (rowsPerPage - 1) * verticalGapMm;

  // Calculate offsets to center the grid
  const leftOffset = pageMarginMm + (printableWidth - gridWidth) / 2;
  const topOffset = pageMarginMm + (printableHeight - gridHeight) / 2;

  const labelsPerPage = columnsPerPage * rowsPerPage;

  return {
    // Label configuration
    labelId: label.id,
    labelName: label.name,
    labelNameAr: label.nameAr,
    labelWidth: label.width,
    labelHeight: label.height,

    // Paper configuration
    paperId: paper.id,
    paperName: paper.name,
    paperWidth: paper.width,
    paperHeight: paper.height,

    // Layout parameters
    pageMarginMm,
    horizontalGapMm,
    verticalGapMm,

    // Calculated values
    printableWidth,
    printableHeight,
    columnsPerPage,
    rowsPerPage,
    labelsPerPage,

    // Grid positioning
    gridWidth,
    gridHeight,
    leftOffset,
    topOffset,

    // For HTML rendering
    pxWidth: label.width * MM_TO_PX,
    pxHeight: label.height * MM_TO_PX,
  };
};

/**
 * Legacy: Get label layout by ID (uses A4 paper, default margins/gaps)
 * @deprecated Use calculateLayout() instead
 */
export const getLabelLayout = (id: string): LabelLayoutConfig => {
  return calculateLayout(id, "a4");
};

/**
 * Get all available label sizes
 */
export const getAvailableLabelSizes = (): LabelSize[] => {
  return Object.values(LABEL_SIZES);
};

/**
 * Get all available paper sizes
 */
export const getAvailablePaperSizes = (): PaperSize[] => {
  return Object.values(PAPER_SIZES);
};

/**
 * Get all available layouts (for backward compatibility)
 */
export const getAvailableLayouts = (): LabelLayoutConfig[] => {
  return Object.keys(LABEL_SIZES).map((labelId) =>
    calculateLayout(labelId, "a4"),
  );
};

/**
 * Calculate labels per page based on layout
 */
export const getLabelsPerPage = (layout: LabelLayoutConfig): number => {
  return layout.labelsPerPage;
};

/**
 * Calculate total pages needed
 */
export const calculatePages = (
  totalLabels: number,
  layout: LabelLayoutConfig,
): number => {
  const perPage = getLabelsPerPage(layout);
  return Math.ceil(totalLabels / perPage);
};
