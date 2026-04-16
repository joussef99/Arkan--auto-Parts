import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productsRoutes from "./products.routes.js";
import customerRoutes from "./customer.routes.js";
import invoiceRoutes from "./invoice.routes.js";
import supplierRoutes from "./supplier.routes.js";
import financialRoutes from "./financial.routes.js";
import settingsRoutes from "./settings.routes.js";

const router = Router();

// Mount all route modules under /api
router.use("/auth", authRoutes);
router.use("/parts", productsRoutes);
router.use("/customers", customerRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/financial", financialRoutes);
router.use("/settings", settingsRoutes);

export default router;