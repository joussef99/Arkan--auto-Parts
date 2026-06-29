import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productsRoutes from "./products.routes.js";
import customerRoutes from "./customer.routes.js";
import invoiceRoutes from "./invoice.routes.js";
import supplierRoutes from "./supplier.routes.js";
import financialRoutes from "./financial.routes.js";
import settingsRoutes from "./settings.routes.js";
import * as barcodeController from "../controllers/barcode.controller.js";
import * as printController from "../controllers/print.controller.js";
import {
  authenticate,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { enforceSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

// Mount all route modules - server.ts already adds /api prefix
// So routes here should be at root: /login, /parts, /brands, etc.
router.use("/", authRoutes); // → /api/login, /api/users
router.use("/", productsRoutes); // → /api/parts, /api/brands, /api/models, /api/categories, /api/year-ranges, /api/inventory/*
router.use("/", customerRoutes); // → /api/customers
router.use("/", invoiceRoutes); // → /api/invoices
router.use("/", supplierRoutes); // → /api/suppliers, /api/purchase-orders, etc.
router.use("/", financialRoutes); // → /api/cashbox, /api/bank-accounts, /api/financial-center, /api/reports/*
router.use("/", settingsRoutes); // → /api/settings

// Barcode generation endpoints
router.get(
  "/barcode/:code",
  authenticate,
  enforceSubscription,
  requirePermission("inventory_manage"),
  barcodeController.generateBarcode,
);
router.get(
  "/barcode-small/:code",
  authenticate,
  enforceSubscription,
  requirePermission("inventory_manage"),
  barcodeController.generateSmallBarcode,
);
router.get(
  "/test-barcode",
  authenticate,
  enforceSubscription,
  requirePermission("inventory_manage"),
  barcodeController.testBarcode,
);

// Print endpoints (ZPL direct thermal printing)
router.post(
  "/print-labels",
  authenticate,
  enforceSubscription,
  requirePermission("inventory_manage"),
  printController.printLabels,
);
router.get(
  "/print-status/:printerIp",
  authenticate,
  enforceSubscription,
  requirePermission("inventory_manage"),
  printController.checkPrinter,
);
router.post(
  "/print-preview",
  authenticate,
  enforceSubscription,
  requirePermission("inventory_manage"),
  printController.previewLabels,
);

export default router;
