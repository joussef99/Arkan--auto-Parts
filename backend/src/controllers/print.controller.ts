import { Request, Response } from "express";
import { generateZPLBatch } from "../utils/zplGenerator.js";
import { sendToPrinter, checkPrinterConnection, isValidIp } from "../services/printerService.js";

/**
 * Print labels to thermal printer
 * POST /api/print-labels
 */
export const printLabels = async (req: Request, res: Response) => {
  try {
    const { products, printerIp, showPrice = true } = req.body;

    // Validate required fields
    if (!printerIp) {
      res.status(400).json({ 
        success: false, 
        error: "عنوان الطابعة مطلوب" 
      });
      return;
    }

    if (!isValidIp(printerIp)) {
      res.status(400).json({ 
        success: false, 
        error: "عنوان الطابعة غير صالح" 
      });
      return;
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      res.status(400).json({ 
        success: false, 
        error: "قائمة المنتجات فارغة" 
      });
      return;
    }

    // Filter valid products
    const validProducts = products.filter(p => p.barcode);
    
    if (validProducts.length === 0) {
      res.status(400).json({ 
        success: false, 
        error: "لا توجد منتجات باركود صالح للطباعة" 
      });
      return;
    }

    // Generate ZPL for all labels
    const zpl = generateZPLBatch(validProducts, { showPrice });

    // Send to printer
    const result = await sendToPrinter(zpl, printerIp);

    if (result.success) {
      // Count total labels
      const totalLabels = validProducts.reduce(
        (sum, p) => sum + (p.printQty || 1), 
        0
      );

      res.json({
        success: true,
        message: `تم طباعة ${totalLabels} ملصق بنجاح`,
        details: {
          totalLabels,
          printerIp,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Print labels error:", error);
    res.status(500).json({ 
      success: false, 
      error: "فشل إرسال البيانات للطابعة" 
    });
  }
};

/**
 * Check printer connection status
 * GET /api/print-status/:printerIp
 */
export const checkPrinter = async (req: Request, res: Response) => {
  try {
    const { printerIp } = req.params;

    if (!isValidIp(printerIp)) {
      res.status(400).json({ 
        success: false, 
        error: "عنوان الطابعة غير صالح" 
      });
      return;
    }

    const isOnline = await checkPrinterConnection(printerIp);

    res.json({
      success: true,
      online: isOnline,
      printerIp,
    });
  } catch (error) {
    console.error("Check printer error:", error);
    res.status(500).json({ 
      success: false, 
      error: "فشل التحقق من حالة الطابعة" 
    });
  }
};

/**
 * Preview ZPL (for debugging)
 * POST /api/print-preview
 */
export const previewLabels = (req: Request, res: Response) => {
  try {
    const { products, showPrice = true } = req.body;

    if (!products || !Array.isArray(products)) {
      res.status(400).json({ 
        success: false, 
        error: "قائمة المنتجات مطلوبة" 
      });
      return;
    }

    const zpl = generateZPLBatch(products, { showPrice });

    res.json({
      success: true,
      zpl,
      labelCount: products.reduce((sum, p) => sum + (p.printQty || 1), 0),
    });
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({ 
      success: false, 
      error: "فشل إنشاء المعاينة" 
    });
  }
};