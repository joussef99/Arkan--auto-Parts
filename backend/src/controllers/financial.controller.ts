import { Request, Response } from "express";
import financialService from "../services/financial.service.js";

// Cashbox
export const getCashboxBalance = (req: Request, res: Response) => {
  try {
    const balance = financialService.getCashboxBalance();
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getCashboxMovements = (req: Request, res: Response) => {
  try {
    const movements = financialService.getCashboxMovements();
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createCashboxMovement = (req: Request, res: Response) => {
  const { type, amount, note, reference_id, reference_type } = req.body;

  if (!type || !amount) {
    res.status(400).json({ error: "type and amount are required" });
    return;
  }

  const result = financialService.createCashboxMovement({
    type,
    amount: parseFloat(amount),
    note,
    reference_id: reference_id ? parseInt(reference_id) : undefined,
    reference_type,
  });

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

// Bank Accounts
export const getBankAccounts = (req: Request, res: Response) => {
  try {
    const accounts = financialService.getAllBankAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createBankAccount = (req: Request, res: Response) => {
  const { account_name, bank_name, account_number, current_balance, notes } = req.body;

  if (!account_name) {
    res.status(400).json({ error: "account_name is required" });
    return;
  }

  const result = financialService.createBankAccount({
    account_name,
    bank_name,
    account_number,
    current_balance: current_balance ? parseFloat(current_balance) : undefined,
    notes,
  });

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

// Financial Center
export const getFinancialSummary = (req: Request, res: Response) => {
  try {
    const summary = financialService.getFinancialSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Dashboard
export const getDashboardData = (req: Request, res: Response) => {
  try {
    const data = financialService.getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Reports
export const getSalesDetails = (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const report = financialService.getSalesDetails(start as string, end as string);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getProfitDetails = (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const report = financialService.getProfitDetails(start as string, end as string);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getSupplierDebts = (req: Request, res: Response) => {
  try {
    const debts = financialService.getSupplierDebts();
    res.json(debts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getInventoryDetails = (req: Request, res: Response) => {
  try {
    const details = financialService.getInventoryDetails();
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getSalesReport = (req: Request, res: Response) => {
  try {
    const sales = financialService.getSalesReport();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getLowStockReport = (req: Request, res: Response) => {
  try {
    const lowStock = financialService.getLowStockReport();
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getDailySummary = (req: Request, res: Response) => {
  try {
    const summary = financialService.getDailySummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getSalesRange = (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const report = financialService.getSalesRange(start as string, end as string);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getTopSelling = (req: Request, res: Response) => {
  try {
    const topParts = financialService.getTopSelling();
    res.json(topParts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getCustomerDebts = (req: Request, res: Response) => {
  try {
    const debts = financialService.getCustomerDebts();
    res.json(debts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getRecentActivity = (req: Request, res: Response) => {
  try {
    const activity = financialService.getRecentActivity();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};