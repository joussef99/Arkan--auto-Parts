import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productsRoutes from "./products.routes.js";
import customerRoutes from "./customer.routes.js";
import invoiceRoutes from "./invoice.routes.js";
import supplierRoutes from "./supplier.routes.js";
import financialRoutes from "./financial.routes.js";
import settingsRoutes from "./settings.routes.js";

const router = Router();

// Mount all route modules - server.ts already adds /api prefix
// So routes here should be at root: /login, /parts, /brands, etc.
router.use("/", authRoutes);           // → /api/login, /api/users
router.use("/", productsRoutes);       // → /api/parts, /api/brands, /api/models, /api/categories, /api/year-ranges, /api/inventory/*
router.use("/", customerRoutes);       // → /api/customers
router.use("/", invoiceRoutes);        // → /api/invoices
router.use("/", supplierRoutes);       // → /api/suppliers, /api/purchase-orders, etc.
router.use("/", financialRoutes);      // → /api/cashbox, /api/bank-accounts, /api/financial-center, /api/reports/*
router.use("/", settingsRoutes);       // → /api/settings

export default router;