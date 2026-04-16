import { Router } from "express";
import * as financialController from "../controllers/financial.controller.js";

const router = Router();

// Cashbox
router.get("/cashbox/balance", financialController.getCashboxBalance);
router.get("/cashbox/movements", financialController.getCashboxMovements);
router.post("/cashbox/movements", financialController.createCashboxMovement);

// Bank Accounts
router.get("/bank-accounts", financialController.getBankAccounts);
router.post("/bank-accounts", financialController.createBankAccount);

// Financial Center
router.get("/financial-center/summary", financialController.getFinancialSummary);

// Dashboard
router.get("/reports/dashboard", financialController.getDashboardData);

// Reports
router.get("/reports/sales-details", financialController.getSalesDetails);
router.get("/reports/profit-details", financialController.getProfitDetails);
router.get("/reports/supplier-debts", financialController.getSupplierDebts);
router.get("/reports/inventory-details", financialController.getInventoryDetails);
router.get("/reports/sales", financialController.getSalesReport);
router.get("/reports/low-stock", financialController.getLowStockReport);
router.get("/reports/daily-summary", financialController.getDailySummary);
router.get("/reports/sales-range", financialController.getSalesRange);
router.get("/reports/top-selling", financialController.getTopSelling);
router.get("/reports/customer-debts", financialController.getCustomerDebts);
router.get("/reports/recent-activity", financialController.getRecentActivity);

export default router;