import { getDatabase } from "../config/db.js";

export interface CustomerFilters {
  q?: string;
  filter?: string;
}

export interface CustomerData {
  id?: number;
  name: string;
  phone?: string;
  alt_phone?: string;
  area?: string;
  customer_type?: string;
  credit_limit?: number;
  notes?: string;
}

class CustomerService {
  getAllCustomers(filters: CustomerFilters = {}): any[] {
    const db = getDatabase();
    const { q, filter } = filters;

    let query = "SELECT * FROM customers WHERE 1=1";
    const params: any[] = [];

    if (q) {
      query += " AND (name LIKE ? OR phone LIKE ?)";
      const search = `%${q}%`;
      params.push(search, search);
    }

    if (filter === 'debt') {
      query += " AND current_balance > 0";
    } else if (filter === 'settled') {
      query += " AND current_balance = 0";
    } else if (filter === 'credit') {
      query += " AND current_balance < 0";
    } else if (filter === 'no_debt') {
      query += " AND current_balance <= 0";
    }

    query += " ORDER BY name ASC";
    return db.prepare(query).all(...params);
  }

  getCustomerById(id: number): any {
    const db = getDatabase();
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    if (!customer) return null;

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_purchases,
        SUM(paid_amount) as total_paid,
        MAX(date) as last_transaction
      FROM invoices
      WHERE customer_id = ?
    `).get(id);

    return { ...customer, stats };
  }

  createCustomer(customerData: CustomerData): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { name, phone, alt_phone, area, customer_type, credit_limit, notes } = customerData;

    try {
      const info = db.prepare(`
        INSERT INTO customers (name, phone, alt_phone, area, customer_type, credit_limit, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, phone, alt_phone, area, customer_type || 'walk-in', credit_limit || 0, notes);

      return { success: true, id: info.lastInsertRowid as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  updateCustomer(id: number, customerData: CustomerData): { success: boolean; error?: string } {
    const db = getDatabase();
    const { name, phone, alt_phone, area, customer_type, credit_limit, notes } = customerData;

    try {
      db.prepare(`
        UPDATE customers SET 
          name = ?, phone = ?, alt_phone = ?, area = ?, 
          customer_type = ?, credit_limit = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, phone, alt_phone, area, customer_type, credit_limit, notes, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  deleteCustomer(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const customer = db.prepare("SELECT current_balance FROM customers WHERE id = ?").get(id) as any;
      if (!customer) {
        return { success: false, error: "الزبون غير موجود" };
      }

      const hasInvoices = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?").get(id) as any;
      const hasPayments = db.prepare("SELECT COUNT(*) as count FROM payments WHERE customer_id = ?").get(id) as any;

      const reasons: string[] = [];
      if (hasInvoices && hasInvoices.count > 0) reasons.push(`يوجد ${hasInvoices.count} فواتير مسجلة`);
      if (hasPayments && hasPayments.count > 0) reasons.push(`يوجد ${hasPayments.count} دفعات مسجلة`);
      if (Math.abs(customer.current_balance) > 0.01) reasons.push(`الرصيد الحالي ليس صفراً (${customer.current_balance} د.ل)`);

      if (reasons.length > 0) {
        return { success: false, error: `لا يمكن حذف العميل للأسباب التالية: ${reasons.join(" - ")}` };
      }

      db.prepare("DELETE FROM customers WHERE id = ?").run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  getCustomerInvoices(customerId: number): any[] {
    const db = getDatabase();
    return db.prepare("SELECT * FROM invoices WHERE customer_id = ? ORDER BY date DESC").all(customerId);
  }

  getCustomerPayments(customerId: number): any[] {
    const db = getDatabase();
    return db.prepare("SELECT * FROM payments WHERE customer_id = ? ORDER BY payment_date DESC").all(customerId);
  }

  getCustomerStatement(customerId: number): any[] {
    const db = getDatabase();
    const invoices = db.prepare(`
      SELECT id, date as timestamp, total_amount as amount, 'invoice' as type, id as ref_id
      FROM invoices WHERE customer_id = ?
    `).all(customerId);
    
    const payments = db.prepare(`
      SELECT id, payment_date as timestamp, amount, 'payment' as type, id as ref_id
      FROM payments WHERE customer_id = ?
    `).all(customerId);

    const statement = [...invoices, ...payments].sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return statement;
  }

  createPayment(customerId: number, amount: number, note?: string, referenceInvoiceId?: number): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    try {
      const transaction = db.transaction(() => {
        const info = db.prepare(`
          INSERT INTO payments (customer_id, amount, note, reference_invoice_id)
          VALUES (?, ?, ?, ?)
        `).run(customerId, amount, note, referenceInvoiceId || null);

        db.prepare(`
          UPDATE customers SET current_balance = current_balance - ? WHERE id = ?
        `).run(amount, customerId);

        return info.lastInsertRowid;
      });

      const id = transaction();
      return { success: true, id: id as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new CustomerService();