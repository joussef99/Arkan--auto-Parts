import { getDatabase } from "../config/db.js";

export interface InvoiceItem {
  id: number;
  quantity: number;
  selling_price: number;
  discount?: number;
}

export interface InvoiceData {
  customer_id?: number;
  items: InvoiceItem[];
  payment_type: string;
  discount?: number;
  total_amount: number;
  paid_amount?: number;
}

class InvoiceService {
  getAllInvoices(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT i.*, c.name as customer_name,
      (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as items_count
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.date DESC
      LIMIT 100
    `).all();
  }

  getInvoiceById(id: number): any {
    const db = getDatabase();
    const invoice = db.prepare(`
      SELECT i.*, c.name as customer_name, c.phone as customer_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(id);

    if (!invoice) return null;

    const items = db.prepare(`
      SELECT ii.*, p.part_name_ar, p.oem_number, p.manufacturer_code
      FROM invoice_items ii
      JOIN parts p ON ii.part_id = p.id
      WHERE ii.invoice_id = ?
    `).all(id);

    return { ...invoice, items };
  }

  createInvoice(invoiceData: InvoiceData): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { customer_id, items, payment_type, discount, total_amount, paid_amount } = invoiceData;

    try {
      const transaction = db.transaction(() => {
        const info = db.prepare(`
          INSERT INTO invoices (customer_id, total_amount, discount, paid_amount, payment_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(customer_id || null, total_amount, discount, paid_amount || 0, payment_type);
        
        const invoiceId = info.lastInsertRowid;

        const insertItem = db.prepare(`
          INSERT INTO invoice_items (invoice_id, part_id, quantity, unit_price, discount)
          VALUES (?, ?, ?, ?, ?)
        `);

        const updateStock = db.prepare(`
          UPDATE parts SET quantity = quantity - ? WHERE id = ?
        `);

        const insertMovement = db.prepare(`
          INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_id, reference_type, note)
          VALUES (?, 'sale', ?, (SELECT quantity FROM parts WHERE id = ?), ?, 'invoice', ?)
        `);

        for (const item of items) {
          insertItem.run(invoiceId, item.id, item.quantity, item.selling_price, item.discount || 0);
          updateStock.run(item.quantity, item.id);
          insertMovement.run(item.id, -item.quantity, item.id, invoiceId, `فاتورة مبيعات رقم ${invoiceId}`);
        }

        // Update customer balance for credit invoices
        if (customer_id) {
          const remaining = total_amount - (paid_amount !== undefined ? paid_amount : total_amount);
          if (remaining > 0) {
            db.prepare("UPDATE customers SET current_balance = current_balance + ? WHERE id = ?").run(remaining, customer_id);
          }
        }

        // Handle cashbox/bank movements
        if (payment_type === 'cash' || (payment_type === 'credit' && paid_amount && paid_amount > 0)) {
          const amountToCash = paid_amount !== undefined ? paid_amount : total_amount;
          db.prepare(`
            INSERT INTO cashbox_movements (type, amount, reference_id, reference_type, note)
            VALUES ('sale_cash', ?, ?, 'invoice', ?)
          `).run(amountToCash, invoiceId, `تحصيل فاتورة مبيعات رقم ${invoiceId}`);
        } else if (payment_type === 'transfer') {
          const amountToBank = paid_amount !== undefined ? paid_amount : total_amount;
          let bankAccount = db.prepare("SELECT id FROM bank_accounts LIMIT 1").get() as { id: number } | undefined;
          if (!bankAccount) {
            const info = db.prepare("INSERT INTO bank_accounts (account_name, bank_name) VALUES ('الحساب الافتراضي', 'المصرف')").run();
            bankAccount = { id: info.lastInsertRowid as number };
          }
          
          db.prepare("UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?").run(amountToBank, bankAccount.id);
          db.prepare(`
            INSERT INTO bank_movements (bank_account_id, movement_date, type, amount, note, reference_type, reference_id)
            VALUES (?, CURRENT_TIMESTAMP, 'sale_transfer', ?, ?, 'invoice', ?)
          `).run(bankAccount.id, amountToBank, `تحصيل فاتورة مبيعات رقم ${invoiceId}`, invoiceId);
        }

        return invoiceId;
      });

      const id = transaction();
      return { success: true, id: id as number };
    } catch (error) {
      console.error("Invoice save failed:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  deleteInvoice(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as any;
      if (!invoice) {
        return { success: false, error: "الفاتورة غير موجودة" };
      }

      const items = db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?").all(id) as any[];

      const transaction = db.transaction(() => {
        // 1. Restore stock
        for (const item of items) {
          db.prepare("UPDATE parts SET quantity = quantity + ? WHERE id = ?").run(item.quantity, item.part_id);
          db.prepare(`
            INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_id, reference_type, note)
            VALUES (?, 'cancellation', ?, (SELECT quantity FROM parts WHERE id = ?), ?, 'invoice', ?)
          `).run(item.part_id, item.quantity, item.part_id, id, `إلغاء فاتورة مبيعات رقم ${id}`);
        }

        // 2. Restore customer balance
        if (invoice.customer_id) {
          const remaining = invoice.total_amount - invoice.paid_amount;
          if (remaining > 0) {
            db.prepare("UPDATE customers SET current_balance = current_balance - ? WHERE id = ?").run(remaining, invoice.customer_id);
          }
        }

        // 3. Remove cashbox movements
        db.prepare("DELETE FROM cashbox_movements WHERE reference_type = 'invoice' AND reference_id = ?").run(id);

        // 4. Remove bank movements and restore bank balance
        const bankMovements = db.prepare("SELECT * FROM bank_movements WHERE reference_type = 'invoice' AND reference_id = ?").all(id) as any[];
        for (const movement of bankMovements) {
          db.prepare("UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?").run(movement.amount, movement.bank_account_id);
        }
        db.prepare("DELETE FROM bank_movements WHERE reference_type = 'invoice' AND reference_id = ?").run(id);

        // 5. Delete invoice items
        db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);

        // 6. Delete invoice
        db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
      });

      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new InvoiceService();