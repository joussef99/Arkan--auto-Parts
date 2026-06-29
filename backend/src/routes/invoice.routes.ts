import { Router } from "express";
import * as invoiceController from "../controllers/invoice.controller.js";
import {
  authenticate,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { enforceSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

router.use(authenticate);
router.use(enforceSubscription);

router.get(
  "/invoices",
  requirePermission("sales_view"),
  invoiceController.getInvoices,
);
router.get(
  "/invoices/:id",
  requirePermission("sales_view"),
  invoiceController.getInvoice,
);
router.post(
  "/invoices",
  requirePermission("sales_create"),
  invoiceController.createInvoice,
);
router.delete(
  "/invoices/:id",
  requirePermission("sales_delete"),
  invoiceController.deleteInvoice,
);

export default router;
