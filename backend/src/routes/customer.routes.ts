import { Router } from "express";
import * as customerController from "../controllers/customer.controller.js";

const router = Router();

router.get("/customers", customerController.getCustomers);
router.get("/customers/:id", customerController.getCustomer);
router.post("/customers", customerController.createCustomer);
router.delete("/customers/:id", customerController.deleteCustomer);
router.get("/customers/:id/invoices", customerController.getCustomerInvoices);
router.get("/customers/:id/payments", customerController.getCustomerPayments);
router.get("/customers/:id/statement", customerController.getCustomerStatement);

router.post("/payments", customerController.createPayment);

export default router;