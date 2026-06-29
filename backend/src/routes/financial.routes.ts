import { Router } from "express";
import * as financialController from "../controllers/financial.controller.js";
import {
  authenticate,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { enforceSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

router.use(authenticate);
router.use(enforceSubscription);

// Cashbox
router.get(
  "/cashbox/balance",
  requirePermission("financial_view"),
  financialController.getCashboxBalance,
);
router.get(
  "/cashbox/movements",
  requirePermission("financial_view"),
  financialController.getCashboxMovements,
);
router.post(
  "/cashbox/movements",
  requirePermission("cashbox_manage"),
  financialController.createCashboxMovement,
);

// Bank Accounts
router.get(
  "/bank-accounts",
  requirePermission("financial_view"),
  financialController.getBankAccounts,
);
router.post(
  "/bank-accounts",
  requirePermission("cashbox_manage"),
  financialController.createBankAccount,
);

// Financial Center
router.get(
  "/financial-center/summary",
  requirePermission("financial_view"),
  financialController.getFinancialSummary,
);

// Dashboard
router.get(
  "/reports/dashboard",
  requirePermission("financial_view"),
  financialController.getDashboardData,
);

// Reports
router.get(
  "/reports/sales-details",
  requirePermission("financial_view"),
  financialController.getSalesDetails,
);
router.get(
  "/reports/profit-details",
  requirePermission("financial_view"),
  financialController.getProfitDetails,
);
router.get(
  "/reports/supplier-debts",
  requirePermission("financial_view"),
  financialController.getSupplierDebts,
);
router.get(
  "/reports/inventory-details",
  requirePermission("financial_view"),
  financialController.getInventoryDetails,
);
router.get(
  "/reports/sales",
  requirePermission("financial_view"),
  financialController.getSalesReport,
);
router.get(
  "/reports/low-stock",
  requirePermission("financial_view"),
  financialController.getLowStockReport,
);
router.get(
  "/reports/daily-summary",
  requirePermission("financial_view"),
  financialController.getDailySummary,
);
router.get(
  "/reports/sales-range",
  requirePermission("financial_view"),
  financialController.getSalesRange,
);
router.get(
  "/reports/top-selling",
  requirePermission("financial_view"),
  financialController.getTopSelling,
);
router.get(
  "/reports/customer-debts",
  requirePermission("financial_view"),
  financialController.getCustomerDebts,
);
router.get(
  "/reports/recent-activity",
  requirePermission("financial_view"),
  financialController.getRecentActivity,
);

export default router;
