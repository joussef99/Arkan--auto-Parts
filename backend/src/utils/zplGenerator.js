/**
 * ZPL Label Generator
 * Generates Zebra Programming Language (ZPL) for thermal label printing
 * Optimized for 58mm x 40mm labels
 */

/**
 * Generate ZPL label for a single product
 * @param {Object} product - Product data
 * @param {string} product.name - Product name (Arabic/English)
 * @param {string} product.barcode - Barcode value
 * @param {number} product.price - Selling price (optional)
 * @param {boolean} showPrice - Whether to include price
 * @returns {string} ZPL template
 */
export function generateZPLLabel(product, showPrice = true) {
  const name = (
    product.name ||
    product.part_name_ar ||
    product.part_name_en ||
    "غير محدد"
  ).substring(0, 30);
  const barcode = product.barcode || "";
  const price = product.selling_price || product.price || 0;

  // Escape special ZPL characters
  const escapeZPL = (text) => {
    if (!text) return "";
    return text
      .replace(/\\/g, "\\\\")
      .replace(/\^/g, "\\^")
      .replace(/~/g, "\\~");
  };

  const escapedName = escapeZPL(name);
  const escapedBarcode = escapeZPL(barcode);
  const priceText = showPrice && price > 0 ? `${price.toFixed(2)} د.ل` : "";

  // ZPL template optimized for 58mm width (approximately 406 dots at 203 DPI)
  // Using ~406 dots width (58mm * 203 DPI / 25.4)
  return `^XA
^PW406
^LL280
^LH0,0

^FO20,20^A0N,25,25^FD${escapedName}^FS

^FO20,55^BY2
^BCN,60,Y,N,N
^FD${escapedBarcode}^FS

^FO20,130^A0N,18,18^FD${escapedBarcode}^FS
${priceText ? `^FO20,160^A0N,22,22^FD${escapeZPL(priceText)}^FS` : ""}^XZ
`;
}

/**
 * Generate ZPL for multiple products
 * @param {Array} products - Array of product objects
 * @param {Object} options - Options
 * @param {boolean} options.showPrice - Whether to show price
 * @returns {string} Combined ZPL for all labels
 */
export function generateZPLBatch(products, options = {}) {
  const { showPrice = true } = options;

  let zpl = "^XA";

  products.forEach((product) => {
    const printQty = product.printQty || 1;
    for (let i = 0; i < printQty; i++) {
      zpl += generateZPLLabel(product, showPrice);
    }
  });

  zpl += "^XZ";
  return zpl;
}

/**
 * Get label preview data (for debugging)
 * @param {Object} product - Product data
 * @returns {Object} Preview data
 */
export function getLabelPreview(product) {
  return {
    name: product.name || product.part_name_ar || "غير محدد",
    barcode: product.barcode || "",
    price: product.selling_price || product.price || 0,
    zpl: generateZPLLabel(product),
  };
}
