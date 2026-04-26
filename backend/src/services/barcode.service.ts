import { getDatabase } from "../config/db.js";

/**
 * Barcode generation and validation utilities
 * Separated into service layer as per MVC pattern
 */

const BARCODE_PREFIX = "ARK";
const BARCODE_LENGTH = 12;

/**
 * Generate a unique barcode
 * Format: ARK + timestamp(6) + random(3) = 12 chars
 */
export function generateBarcode(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${BARCODE_PREFIX}${timestamp}${random}`;
}

/**
 * Generate a barcode with custom prefix
 */
export function generateBarcodeWithPrefix(prefix: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
}

/**
 * Validate barcode format
 * Valid barcodes: ARKXXXXXXXXXX (12 chars, starts with ARK)
 * Or any string up to 50 chars
 */
export function isValidBarcodeFormat(barcode: string): boolean {
  if (!barcode || typeof barcode !== "string") {
    return false;
  }
  
  const trimmed = barcode.trim();
  
  // Allow empty for auto-generation
  if (trimmed === "") {
    return true;
  }
  
  // Max length 50 chars
  if (trimmed.length > 50) {
    return false;
  }
  
  return true;
}

/**
 * Check if barcode already exists in database
 * Returns true if barcode exists, false otherwise
 */
export function barcodeExists(barcode: string, excludePartId?: number): boolean {
  const db = getDatabase();
  
  if (excludePartId) {
    const existing = db.prepare(
      "SELECT id FROM parts WHERE barcode = ? AND id != ?"
    ).get(barcode, excludePartId);
    return !!existing;
  }
  
  const existing = db.prepare(
    "SELECT id FROM parts WHERE barcode = ?"
  ).get(barcode);
  return !!existing;
}

/**
 * Get part by barcode
 */
export function getPartByBarcode(barcode: string): any {
  const db = getDatabase();
  return db.prepare(`
    SELECT p.*, b.name as brand_name, c.name as category_name, m.name as model_name
    FROM parts p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN models m ON p.model_id = m.id
    WHERE p.barcode = ?
  `).get(barcode);
}

/**
 * Search parts by barcode (partial match)
 */
export function searchPartsByBarcode(barcode: string): any[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT p.*, b.name as brand_name, c.name as category_name, m.name as model_name
    FROM parts p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN models m ON p.model_id = m.id
    WHERE p.barcode LIKE ?
    LIMIT 20
  `).all(`%${barcode}%`);
}

/**
 * Ensure a barcode is unique, generate new one if needed
 * Returns a unique barcode
 */
export function ensureUniqueBarcode(preferredBarcode?: string): string {
  if (!preferredBarcode || preferredBarcode.trim() === "") {
    return generateBarcode();
  }
  
  if (!barcodeExists(preferredBarcode)) {
    return preferredBarcode;
  }
  
  // Generate new barcode with suffix
  let counter = 1;
  let newBarcode = preferredBarcode;
  
  while (barcodeExists(newBarcode)) {
    newBarcode = `${preferredBarcode.slice(0, 8)}${counter.toString().padStart(3, "0")}`;
    counter++;
    
    if (counter > 999) {
      // Fallback to generated barcode
      return generateBarcode();
    }
  }
  
  return newBarcode;
}