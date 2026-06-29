import { Router } from "express";
import * as customerController from "../controllers/customer.controller.js";
import {
  authenticate,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { enforceSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

router.use(authenticate);
router.use(enforceSubscription);

router.get(
  "/customers",
  requirePermission("sales_view"),
  customerController.getCustomers,
);
router.get(
  "/customers/:id",
  requirePermission("sales_view"),
  customerController.getCustomer,
);
router.post(
  "/customers",
  requirePermission("sales_create"),
  customerController.createCustomer,
);
router.delete(
  "/customers/:id",
  requirePermission("sales_delete"),
  customerController.deleteCustomer,
);
router.get(
  "/customers/:id/invoices",
  requirePermission("sales_view"),
  customerController.getCustomerInvoices,
);
router.get(
  "/customers/:id/payments",
  requirePermission("sales_view"),
  customerController.getCustomerPayments,
);
router.get(
  "/customers/:id/statement",
  requirePermission("sales_view"),
  customerController.getCustomerStatement,
);

router.post(
  "/payments",
  requirePermission("sales_create"),
  customerController.createPayment,
);

export default router;
