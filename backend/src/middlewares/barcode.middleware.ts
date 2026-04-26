import { Request, Response, NextFunction } from "express";
import {
  isValidBarcodeFormat,
  barcodeExists,
} from "../services/barcode.service.js";

export interface BarcodeRequest extends Request {
  validatedBarcode?: string;
}

/**
 * Middleware to validate barcode in request body
 * Validates:
 * - Barcode format
 * - Barcode uniqueness (for create operations)
 */
export function validateBarcode(req: BarcodeRequest, res: Response, next: NextFunction): void {
  const { barcode, id } = req.body;
  
  // Skip validation if no barcode provided (will be auto-generated)
  if (!barcode || barcode.trim() === "") {
    return next();
  }
  
  // Validate format
  if (!isValidBarcodeFormat(barcode)) {
    res.status(400).json({
      error: "تنسيق الباركود غير صالح. يجب أن يكون الباركود أقل من 50 حرف",
    });
    return;
  }
  
  // Check uniqueness (exclude current part if updating)
  const excludePartId = id ? parseInt(id) : undefined;
  if (barcodeExists(barcode, excludePartId)) {
    res.status(400).json({
      error: "الباركود مستخدم بالفعل لصنف آخر",
    });
    return;
  }
  
  // Store validated barcode for use in controller
  req.validatedBarcode = barcode;
  next();
}

/**
 * Middleware to validate barcode in URL params (for lookup operations)
 */
export function validateBarcodeParam(
  req: BarcodeRequest,
  res: Response,
  next: NextFunction
): void {
  const { barcode } = req.params;
  
  if (!barcode) {
    res.status(400).json({
      error: "الباركود مطلوب",
    });
    return;
  }
  
  if (!isValidBarcodeFormat(barcode)) {
    res.status(400).json({
      error: "تنسيق الباركود غير صالح",
    });
    return;
  }
  
  next();
}

/**
 * Middleware to check if part exists by barcode
 */
export function partByBarcodeExists(
  req: BarcodeRequest,
  res: Response,
  next: NextFunction
): void {
  const { barcode } = req.params;
  
  if (!barcodeExists(barcode)) {
    res.status(404).json({
      error: "الصنف غير موجود",
    });
    return;
  }
  
  next();
}