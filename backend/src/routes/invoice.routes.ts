import { Router } from "express";
import * as invoiceController from "../controllers/invoice.controller.js";

const router = Router();

router.get("/invoices", invoiceController.getInvoices);
router.get("/invoices/:id", invoiceController.getInvoice);
router.post("/invoices", invoiceController.createInvoice);
router.delete("/invoices/:id", invoiceController.deleteInvoice);

export default router;