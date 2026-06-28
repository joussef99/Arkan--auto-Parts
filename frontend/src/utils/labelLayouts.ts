/**
 * Label Size Configuration
 * Defines all supported label dimensions and layout properties
 */

export interface LabelLayoutConfig {
  id: string;
  name: string;
  nameAr: string;
  // Dimensions in millimeters
  width: number;
  height: number;
  // For HTML rendering: convert mm to px (1mm ≈ 3.78px)
  pxWidth: number;
  pxHeight: number;
  // Layout grid for page
  columnsPerPage: number;
  rowsPerPage: number;
  // Margins and spacing
  pageMarginMm: number;
  labelGapMm: number;
}

// Conversion factor: 1mm ≈ 3.78px
const MM_TO_PX = 3.78;

/**
 * Available label sizes configuration
 */
export const LABEL_LAYOUTS: Record<string, LabelLayoutConfig> = {
  small: {
    id: "small",
    name: "Small (50×25mm)",
    nameAr: "صغير (50×25 مم)",
    width: 50,
    height: 25,
    pxWidth: 50 * MM_TO_PX,
    pxHeight: 25 * MM_TO_PX,
    columnsPerPage: 4,
    rowsPerPage: 10,
    pageMarginMm: 5,
    labelGapMm: 1,
  },
  medium: {
    id: "medium",
    name: "Medium (40×30mm)",
    nameAr: "متوسط (40×30 مم)",
    width: 40,
    height: 30,
    pxWidth: 40 * MM_TO_PX,
    pxHeight: 30 * MM_TO_PX,
    columnsPerPage: 5,
    rowsPerPage: 8,
    pageMarginMm: 5,
    labelGapMm: 1,
  },
  large: {
    id: "large",
    name: "Large (80×50mm)",
    nameAr: "كبير (80×50 مم)",
    width: 80,
    height: 50,
    pxWidth: 80 * MM_TO_PX,
    pxHeight: 50 * MM_TO_PX,
    columnsPerPage: 2,
    rowsPerPage: 5,
    pageMarginMm: 10,
    labelGapMm: 2,
  },
  a4: {
    id: "a4",
    name: "A4 Sheet",
    nameAr: "ورقة A4",
    width: 210,
    height: 297,
    pxWidth: 210 * MM_TO_PX,
    pxHeight: 297 * MM_TO_PX,
    columnsPerPage: 2,
    rowsPerPage: 4,
    pageMarginMm: 10,
    labelGapMm: 5,
  },
};

/**
 * Get label layout by ID
 */
export const getLabelLayout = (id: string): LabelLayoutConfig => {
  const layout = LABEL_LAYOUTS[id];
  if (!layout) {
    throw new Error(`Unknown label layout: ${id}`);
  }
  return layout;
};

/**
 * Get all available layouts
 */
export const getAvailableLayouts = (): LabelLayoutConfig[] => {
  return Object.values(LABEL_LAYOUTS);
};

/**
 * Calculate labels per page
 */
export const getLabelsPerPage = (layoutId: string): number => {
  const layout = getLabelLayout(layoutId);
  return layout.columnsPerPage * layout.rowsPerPage;
};

/**
 * Calculate total pages needed
 */
export const calculatePages = (
  totalLabels: number,
  layoutId: string,
): number => {
  const perPage = getLabelsPerPage(layoutId);
  return Math.ceil(totalLabels / perPage);
};
