import { Request, Response } from "express";
import bwipjs from "bwip-js";

/**
 * Generate barcode as PNG image
 * Uses Code 128 format - optimal for thermal printers
 */
export const generateBarcode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    console.log("Generating barcode for:", code);

    if (!code || code.trim() === "") {
      res.status(400).set("Content-Type", "image/png");
      res.send(Buffer.alloc(0));
      return;
    }

    // Generate Code 128 barcode - optimized for thermal printing
    // Note: bwipjs.toBuffer() returns a Promise!
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: code,
      scale: 3,
      height: 14,
      includetext: true,
      textxalign: "center",
      backgroundcolor: "FFFFFF",
      paddingwidth: 8,
      paddingheight: 8,
    });

    console.log("Barcode generated, buffer length:", barcodeBuffer.length);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.send(barcodeBuffer);
  } catch (error) {
    console.error("Barcode generation error:", error);
    res.status(500).set("Content-Type", "image/png");
    res.send(Buffer.alloc(0));
  }
};

/**
 * Generate small barcode (for compact labels)
 */
export const generateSmallBarcode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!code || code.trim() === "") {
      res.status(400).set("Content-Type", "image/png");
      res.send(Buffer.alloc(0));
      return;
    }

    // Compact barcode for small labels
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: code,
      scale: 2,
      height: 10,
      includetext: true,
      textxalign: "center",
      backgroundcolor: "FFFFFF",
      paddingwidth: 4,
      paddingheight: 4,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.send(barcodeBuffer);
  } catch (error) {
    console.error("Barcode generation error:", error);
    res.status(500).set("Content-Type", "image/png");
    res.send(Buffer.alloc(0));
  }
};

/**
 * Test barcode endpoint
 */
export const testBarcode = (req: Request, res: Response) => {
  res.redirect("/api/barcode/TEST123");
};