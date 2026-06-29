import { Router } from "express";
import * as supplierController from "../controllers/supplier.controller.js";
import {
  authenticate,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { enforceSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

router.use(authenticate);
router.use(enforceSubscription);

// Suppliers
router.get(
  "/suppliers",
  requirePermission("suppliers_manage"),
  supplierController.getSuppliers,
);
router.get(
  "/suppliers/:id",
  requirePermission("suppliers_manage"),
  supplierController.getSupplier,
);
router.post(
  "/suppliers",
  requirePermission("suppliers_manage"),
  supplierController.createSupplier,
);
router.delete(
  "/suppliers/:id",
  requirePermission("suppliers_manage"),
  supplierController.deleteSupplier,
);

// Purchase Orders
router.get(
  "/purchase-orders",
  requirePermission("purchases_view"),
  supplierController.getPurchaseOrders,
);
router.get(
  "/purchase-orders/:id",
  requirePermission("purchases_view"),
  supplierController.getPurchaseOrder,
);
router.post(
  "/purchase-orders",
  requirePermission("purchases_create"),
  supplierController.createPurchaseOrder,
);
router.post(
  "/purchase-orders/:id/receive",
  requirePermission("purchases_create"),
  supplierController.receivePurchaseOrder,
);

// Purchase Returns
router.get(
  "/purchase-returns",
  requirePermission("purchases_view"),
  supplierController.getPurchaseReturns,
);
router.post(
  "/purchase-returns",
  requirePermission("purchases_create"),
  supplierController.createPurchaseReturn,
);

// Supplier Payments
router.get(
  "/supplier-payments",
  requirePermission("purchases_view"),
  supplierController.getSupplierPayments,
);
router.post(
  "/supplier-payments",
  requirePermission("purchases_create"),
  supplierController.createSupplierPayment,
);

export default router;
