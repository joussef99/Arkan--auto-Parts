import { Router } from "express";
import * as productsController from "../controllers/products.controller.js";
import {
  validateBarcodeParam,
  partByBarcodeExists,
} from "../middlewares/barcode.middleware.js";
import {
  authenticate,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { enforceSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

router.use(authenticate);
router.use(enforceSubscription);

// Parts
router.get(
  "/parts",
  requirePermission("inventory_manage"),
  productsController.getParts,
);
router.get(
  "/parts/:id",
  requirePermission("inventory_manage"),
  productsController.getPart,
);
router.post(
  "/parts",
  requirePermission("inventory_manage"),
  productsController.createPart,
);
router.put(
  "/parts/:id",
  requirePermission("inventory_manage"),
  productsController.updatePart,
);
router.delete(
  "/parts/:id",
  requirePermission("inventory_manage"),
  productsController.deletePart,
);
router.put(
  "/parts/:id/price",
  requirePermission("inventory_manage"),
  productsController.updatePartPrice,
);

// Barcode lookup routes
router.get(
  "/parts/barcode/:barcode",
  requirePermission("inventory_manage"),
  validateBarcodeParam,
  partByBarcodeExists,
  productsController.getPartByBarcode,
);
router.get(
  "/parts/barcode-search",
  requirePermission("inventory_manage"),
  productsController.searchPartsByBarcode,
);

// Inventory
router.post(
  "/inventory/add-quantity",
  requirePermission("inventory_manage"),
  productsController.addQuantity,
);
router.post(
  "/inventory/audit",
  requirePermission("inventory_manage"),
  productsController.auditStock,
);
router.post(
  "/inventory/stock-entry",
  requirePermission("inventory_manage"),
  productsController.stockEntry,
);
router.post(
  "/inventory/import",
  requirePermission("inventory_manage"),
  productsController.importParts,
);
router.get(
  "/inventory/movements",
  requirePermission("inventory_manage"),
  productsController.getStockMovements,
);
router.get(
  "/inventory/dashboard",
  requirePermission("inventory_manage"),
  productsController.getInventoryDashboard,
);
router.get(
  "/inventory/transactions",
  requirePermission("inventory_manage"),
  productsController.getInventoryTransactions,
);
router.get(
  "/inventory/export/csv",
  requirePermission("inventory_manage"),
  productsController.exportInventoryCsv,
);
router.get(
  "/inventory/export/xlsx",
  requirePermission("inventory_manage"),
  productsController.exportInventoryXlsx,
);
router.get(
  "/inventory/export/low-stock",
  requirePermission("inventory_manage"),
  productsController.exportLowStockReport,
);

// Brands
router.get(
  "/brands",
  requirePermission("inventory_manage"),
  productsController.getBrands,
);
router.post(
  "/brands",
  requirePermission("inventory_manage"),
  productsController.createBrand,
);

// Models
router.get(
  "/models",
  requirePermission("inventory_manage"),
  productsController.getModels,
);
router.post(
  "/models",
  requirePermission("inventory_manage"),
  productsController.createModel,
);

// Categories
router.get(
  "/categories",
  requirePermission("inventory_manage"),
  productsController.getCategories,
);
router.post(
  "/categories",
  requirePermission("inventory_manage"),
  productsController.createCategory,
);
router.delete(
  "/categories/:id",
  requirePermission("inventory_manage"),
  productsController.deleteCategory,
);

// Year Ranges
router.get(
  "/year-ranges",
  requirePermission("inventory_manage"),
  productsController.getYearRanges,
);

export default router;
