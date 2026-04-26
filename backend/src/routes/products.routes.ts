import { Router } from "express";
import * as productsController from "../controllers/products.controller.js";
import { validateBarcodeParam, partByBarcodeExists } from "../middlewares/barcode.middleware.js";

const router = Router();

// Parts
router.get("/parts", productsController.getParts);
router.get("/parts/:id", productsController.getPart);
router.post("/parts", productsController.createPart);
router.put("/parts/:id", productsController.updatePart);
router.delete("/parts/:id", productsController.deletePart);
router.put("/parts/:id/price", productsController.updatePartPrice);

// Barcode lookup routes
router.get("/parts/barcode/:barcode", validateBarcodeParam, partByBarcodeExists, productsController.getPartByBarcode);
router.get("/parts/barcode-search", productsController.searchPartsByBarcode);

// Inventory
router.post("/inventory/add-quantity", productsController.addQuantity);
router.post("/inventory/audit", productsController.auditStock);
router.post("/inventory/stock-entry", productsController.stockEntry);
router.post("/inventory/import", productsController.importParts);
router.get("/inventory/movements", productsController.getStockMovements);
router.get("/inventory/dashboard", productsController.getInventoryDashboard);
router.get("/inventory/transactions", productsController.getInventoryTransactions);
router.get("/inventory/export/csv", productsController.exportInventoryCsv);
router.get("/inventory/export/xlsx", productsController.exportInventoryXlsx);
router.get("/inventory/export/low-stock", productsController.exportLowStockReport);

// Brands
router.get("/brands", productsController.getBrands);
router.post("/brands", productsController.createBrand);

// Models
router.get("/models", productsController.getModels);
router.post("/models", productsController.createModel);

// Categories
router.get("/categories", productsController.getCategories);
router.post("/categories", productsController.createCategory);
router.delete("/categories/:id", productsController.deleteCategory);

// Year Ranges
router.get("/year-ranges", productsController.getYearRanges);

export default router;