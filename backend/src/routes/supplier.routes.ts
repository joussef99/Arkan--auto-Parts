import { Router } from "express";
import * as supplierController from "../controllers/supplier.controller.js";

const router = Router();

// Suppliers
router.get("/suppliers", supplierController.getSuppliers);
router.get("/suppliers/:id", supplierController.getSupplier);
router.post("/suppliers", supplierController.createSupplier);
router.delete("/suppliers/:id", supplierController.deleteSupplier);

// Purchase Orders
router.get("/purchase-orders", supplierController.getPurchaseOrders);
router.get("/purchase-orders/:id", supplierController.getPurchaseOrder);
router.post("/purchase-orders", supplierController.createPurchaseOrder);
router.post("/purchase-orders/:id/receive", supplierController.receivePurchaseOrder);

// Purchase Returns
router.get("/purchase-returns", supplierController.getPurchaseReturns);
router.post("/purchase-returns", supplierController.createPurchaseReturn);

// Supplier Payments
router.get("/supplier-payments", supplierController.getSupplierPayments);
router.post("/supplier-payments", supplierController.createSupplierPayment);

export default router;