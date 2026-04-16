import { getDatabase } from "../config/db.js";

class FinancialService {
  // Cashbox
  getCashboxBalance(): { balance: number } {
    const db = getDatabase();
    const result = db.prepare("SELECT SUM(amount) as balance FROM cashbox_movements").get() as { balance: number };
    return { balance: result.balance || 0 };
  }

  getCashboxMovements(): any[] {
    const db = getDatabase();
    return db.prepare("SELECT * FROM cashbox_movements ORDER BY movement_date DESC LIMIT 100").all();
  }

  createCashboxMovement(data: {
    type: string;
    amount: number;
    note?: string;
    reference_id?: number;
    reference_type?: string;
  }): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { type, amount, note, reference_id, reference_type } = data;
    try {
      const info = db.prepare(`
        INSERT INTO cashbox_movements (type, amount, note, reference_id, reference_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(type, amount, note, reference_id || null, reference_type || 'manual');
      return { success: true, id: info.lastInsertRowid as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Bank Accounts
  getAllBankAccounts(): any[] {
    const db = getDatabase();
    return db.prepare("SELECT * FROM bank_accounts").all();
  }

  createBankAccount(data: {
    account_name: string;
    bank_name?: string;
    account_number?: string;
    current_balance?: number;
    notes?: string;
  }): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { account_name, bank_name, account_number, current_balance, notes } = data;
    try {
      const info = db.prepare(`
        INSERT INTO bank_accounts (account_name, bank_name, account_number, current_balance, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(account_name, bank_name, account_number, current_balance || 0, notes);
      return { success: true, id: info.lastInsertRowid as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Financial Center Summary
  getFinancialSummary(): any {
    const db = getDatabase();
    const cashBalance = (db.prepare("SELECT SUM(amount) as balance FROM cashbox_movements").get() as any).balance || 0;
    const bankBalance = (db.prepare("SELECT SUM(current_balance) as balance FROM bank_accounts").get() as any).balance || 0;
    const customerDebts = (db.prepare("SELECT SUM(current_balance) as balance FROM customers").get() as any).balance || 0;
    const supplierDebts = (db.prepare("SELECT SUM(current_balance) as balance FROM suppliers").get() as any).balance || 0;
    const inventoryValue = (db.prepare("SELECT SUM(quantity * cost_price) as value FROM parts").get() as any).value || 0;

    return {
      cash_balance: cashBalance,
      bank_balance: bankBalance,
      available_cash: cashBalance + bankBalance,
      customer_debts: customerDebts,
      supplier_debts: supplierDebts,
      inventory_value: inventoryValue,
      net_worth: (cashBalance + bankBalance + customerDebts + inventoryValue) - supplierDebts
    };
  }

  // Dashboard
  getDashboardData(): any {
    const db = getDatabase();
    const salesToday = (db.prepare("SELECT SUM(total_amount) as total FROM invoices WHERE date(date) = date('now')").get() as any).total || 0;
    
    const profitToday = (db.prepare(`
      SELECT SUM(ii.quantity * (ii.unit_price - p.cost_price)) as profit
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN parts p ON ii.part_id = p.id
      WHERE date(i.date) = date('now')
    `).get() as any).profit || 0;

    const customerDebts = (db.prepare("SELECT SUM(current_balance) as balance FROM customers WHERE current_balance > 0").get() as any).balance || 0;
    const supplierDebts = (db.prepare("SELECT SUM(current_balance) as balance FROM suppliers WHERE current_balance > 0").get() as any).balance || 0;
    const cashBalance = (db.prepare("SELECT SUM(amount) as balance FROM cashbox_movements").get() as any).balance || 0;

    return {
      sales_today: salesToday,
      profit_today: profitToday,
      customer_debts: customerDebts,
      supplier_debts: supplierDebts,
      cash_balance: cashBalance
    };
  }

  // Reports
  getSalesDetails(start: string, end: string): any {
    const db = getDatabase();
    const stats = db.prepare(`
      SELECT 
        SUM(total_amount) as total_sales,
        COUNT(*) as invoice_count,
        AVG(total_amount) as avg_invoice
      FROM invoices
      WHERE date(date) BETWEEN ? AND ?
    `).get(start, end) as any;

    const topParts = db.prepare(`
      SELECT p.part_name_ar as name, SUM(ii.quantity) as total_quantity
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN parts p ON ii.part_id = p.id
      WHERE date(i.date) BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 5
    `).all(start, end);

    return { ...stats, top_parts: topParts };
  }

  getProfitDetails(start: string, end: string): any {
    const db = getDatabase();
    const report = db.prepare(`
      SELECT 
        SUM(ii.quantity * ii.unit_price) as total_sales,
        SUM(ii.quantity * p.cost_price) as cost_of_goods_sold,
        SUM(ii.quantity * (ii.unit_price - p.cost_price)) as approx_profit
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN parts p ON ii.part_id = p.id
      WHERE date(i.date) BETWEEN ? AND ?
    `).get(start, end);
    return report || { total_sales: 0, cost_of_goods_sold: 0, approx_profit: 0 };
  }

  getSupplierDebts(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT supplier_name as name, company_name as company, current_balance as debt
      FROM suppliers
      WHERE current_balance > 0
      ORDER BY current_balance DESC
    `).all();
  }

  getInventoryDetails(): any {
    const db = getDatabase();
    const itemCount = (db.prepare("SELECT COUNT(*) as count FROM parts").get() as any).count || 0;
    const lowStockCount = (db.prepare("SELECT COUNT(*) as count FROM parts WHERE quantity <= min_stock_level").get() as any).count || 0;
    const inventoryValue = (db.prepare("SELECT SUM(quantity * cost_price) as value FROM parts").get() as any).value || 0;
    
    const topSelling = db.prepare(`
      SELECT p.part_name_ar as name, SUM(ii.quantity) as total_quantity
      FROM invoice_items ii
      JOIN parts p ON ii.part_id = p.id
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 5
    `).all();

    const lowStockList = db.prepare(`
      SELECT part_name_ar as name, quantity, shelf_location_id
      FROM parts
      WHERE quantity <= min_stock_level
      ORDER BY quantity ASC
      LIMIT 20
    `).all();

    return {
      item_count: itemCount,
      low_stock_count: lowStockCount,
      inventory_value: inventoryValue,
      top_selling: topSelling,
      low_stock_list: lowStockList
    };
  }

  getSalesReport(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT date(date) as day, SUM(total_amount) as total 
      FROM invoices 
      GROUP BY day 
      ORDER BY day DESC 
      LIMIT 30
    `).all();
  }

  getLowStockReport(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT p.*, b.name as brand_name, m.name as model_name
      FROM parts p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN models m ON p.model_id = m.id
      WHERE p.quantity <= p.min_stock_level
    `).all();
  }

  getDailySummary(): any {
    const db = getDatabase();
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as invoice_count,
        SUM(total_amount) as total_sales,
        AVG(total_amount) as avg_invoice
      FROM invoices
      WHERE date(date) = date('now')
    `).get();
    return summary || { invoice_count: 0, total_sales: 0, avg_invoice: 0 };
  }

  getSalesRange(start: string, end: string): any {
    const db = getDatabase();
    const report = db.prepare(`
      SELECT 
        COUNT(*) as invoice_count,
        SUM(total_amount) as total_sales
      FROM invoices
      WHERE date(date) BETWEEN ? AND ?
    `).get(start, end);
    return report || { invoice_count: 0, total_sales: 0 };
  }

  getTopSelling(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT p.part_name_ar as name, p.oem_number, SUM(ii.quantity) as total_quantity, SUM(ii.quantity * ii.unit_price) as total_revenue
      FROM invoice_items ii
      JOIN parts p ON ii.part_id = p.id
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 10
    `).all();
  }

  getCustomerDebts(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT name, phone, current_balance as debt
      FROM customers
      WHERE current_balance > 0
      ORDER BY current_balance DESC
    `).all();
  }

  getRecentActivity(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT i.id, i.date, i.total_amount, c.name as customer_name, i.payment_type
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.date DESC
      LIMIT 10
    `).all();
  }
}

export default new FinancialService();