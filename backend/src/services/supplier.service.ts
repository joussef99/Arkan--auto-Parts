import { getDatabase } from "../config/db.js";

export interface SupplierFilters {
  q?: string;
}

export interface SupplierData {
  id?: number;
  supplier_name: string;
  phone: string;
  company_name?: string;
  address?: string;
  notes?: string;
  opening_balance?: number;
}

class SupplierService {
  getAllSuppliers(filters: SupplierFilters = {}): any[] {
    const db = getDatabase();
    const { q } = filters;

    let query = "SELECT * FROM suppliers WHERE 1=1";
    const params: any[] = [];
    if (q) {
      query += " AND (supplier_name LIKE ? OR phone LIKE ? OR company_name LIKE ?)";
      const search = `%${q}%`;
      params.push(search, search, search);
    }
    query += " ORDER BY supplier_name ASC";
    return db.prepare(query).all(...params);
  }

  getSupplierById(id: number): any {
    const db = getDatabase();
    return db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
  }

  createSupplier(supplierData: SupplierData): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { supplier_name, phone, company_name, address, notes, opening_balance } = supplierData;

    if (!supplier_name || !phone) {
      return { success: false, error: "اسم المورد ورقم الهاتف مطلوبان" };
    }

    try {
      const info = db.prepare(`
        INSERT INTO suppliers (supplier_name, phone, company_name, address, notes, opening_balance, current_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(supplier_name, phone, company_name, address, notes, opening_balance || 0, opening_balance || 0);

      return { success: true, id: info.lastInsertRowid as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  updateSupplier(id: number, supplierData: SupplierData): { success: boolean; error?: string } {
    const db = getDatabase();
    const { supplier_name, phone, company_name, address, notes, opening_balance } = supplierData;

    try {
      db.prepare(`
        UPDATE suppliers SET 
          supplier_name = ?, phone = ?, company_name = ?, address = ?, 
          notes = ?, opening_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(supplier_name, phone, company_name, address, notes, opening_balance || 0, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  deleteSupplier(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const supplier = db.prepare("SELECT current_balance FROM suppliers WHERE id = ?").get(id) as any;
      if (!supplier) {
        return { success: false, error: "المورد غير موجود" };
      }

      const hasOrders = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?").get(id) as any;
      const hasPayments = db.prepare("SELECT COUNT(*) as count FROM supplier_payments WHERE supplier_id = ?").get(id) as any;

      const reasons: string[] = [];
      if (hasOrders && hasOrders.count > 0) reasons.push(`يوجد ${hasOrders.count} طلبات شراء مسجلة`);
      if (hasPayments && hasPayments.count > 0) reasons.push(`يوجد ${hasPayments.count} دفعات مسجلة`);
      if (Math.abs(supplier.current_balance) > 0.01) reasons.push(`الرصيد الحالي ليس صفراً (${supplier.current_balance} د.ل)`);

      if (reasons.length > 0) {
        return { success: false, error: `لا يمكن حذف المورد للأسباب التالية: ${reasons.join(" - ")}` };
      }

      db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Purchase Orders
  getAllPurchaseOrders(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT po.*, s.supplier_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.created_at DESC
    `).all();
  }

  getPurchaseOrderById(id: number): any {
    const db = getDatabase();
    const order = db.prepare(`
      SELECT po.*, s.supplier_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `).get(id);
    
    if (!order) return null;
    
    const items = db.prepare(`
      SELECT poi.*, p.part_name_ar, p.oem_number, p.selling_price, p.margin_percent, p.category_id
      FROM purchase_order_items poi
      JOIN parts p ON poi.part_id = p.id
      WHERE poi.purchase_order_id = ?
    `).all(id);
    
    return { ...order, items };
  }

  createPurchaseOrder(data: {
    id?: number;
    order_number: string;
    supplier_id: number;
    order_date?: string;
    status?: string;
    warehouse_id?: number;
    notes?: string;
    items: any[];
  }): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { id, order_number, supplier_id, order_date, status, warehouse_id, notes, items } = data;

    try {
      const transaction = db.transaction(() => {
        let orderId = id;
        if (id) {
          db.prepare(`
            UPDATE purchase_orders SET 
              order_number = ?, supplier_id = ?, order_date = ?, 
              status = ?, warehouse_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(order_number, supplier_id, order_date, status, warehouse_id, notes, id);
          
          db.prepare("DELETE FROM purchase_order_items WHERE purchase_order_id = ?").run(id);
        } else {
          const info = db.prepare(`
            INSERT INTO purchase_orders (order_number, supplier_id, order_date, status, warehouse_id, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(order_number, supplier_id, order_date, status || 'draft', warehouse_id, notes);
          orderId = Number(info.lastInsertRowid);
        }
        
        const insertItem = db.prepare(`
          INSERT INTO purchase_order_items (purchase_order_id, part_id, ordered_quantity, unit_price, manufacturer_code, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const item of items) {
          insertItem.run(orderId, item.part_id, item.ordered_quantity, item.unit_price || 0, item.manufacturer_code, item.notes);
        }
        
        return orderId;
      });
      
      const orderId = transaction();
      return { success: true, id: orderId as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  receivePurchaseOrder(orderId: number, items: any[], notes?: string): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const transaction = db.transaction(() => {
        const receiptInfo = db.prepare(`
          INSERT INTO purchase_receipts (purchase_order_id, notes)
          VALUES (?, ?)
        `).run(orderId, notes);
        const receiptId = receiptInfo.lastInsertRowid;
        
        const insertReceiptItem = db.prepare(`
          INSERT INTO purchase_receipt_items (purchase_receipt_id, part_id, quantity_received)
          VALUES (?, ?, ?)
        `);
        
        const updateOrderItem = db.prepare(`
          UPDATE purchase_order_items 
          SET received_quantity = received_quantity + ? 
          WHERE purchase_order_id = ? AND part_id = ?
        `);
        
        const updateStock = db.prepare(`
          UPDATE parts 
          SET quantity = quantity + ?, 
              cost_price = ?,
              last_purchase_price = ?,
              selling_price = ?,
              margin_percent = ?,
              price_updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        
        const updateSupplierBalance = db.prepare(`
          UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?
        `);
        
        const insertMovement = db.prepare(`
          INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_id, reference_type, note)
          VALUES (?, 'purchase_receipt', ?, ?, ?, 'purchase_order', ?)
        `);
        
        const order = db.prepare("SELECT supplier_id FROM purchase_orders WHERE id = ?").get(orderId) as any;

        for (const item of items) {
          if (item.received_quantity > 0) {
            insertReceiptItem.run(receiptId, item.part_id, item.received_quantity);
            updateOrderItem.run(item.received_quantity, orderId, item.part_id);
            
            const orderItem = db.prepare("SELECT unit_price FROM purchase_order_items WHERE purchase_order_id = ? AND part_id = ?").get(orderId, item.part_id) as any;
            const unitPrice = orderItem?.unit_price || 0;

            const part = db.prepare("SELECT quantity FROM parts WHERE id = ?").get(item.part_id) as any;
            const newBalance = part.quantity + item.received_quantity;
            
            updateStock.run(
              item.received_quantity, 
              unitPrice, 
              unitPrice,
              item.selling_price || 0, 
              item.margin_percent || 0, 
              item.part_id
            );
            
            if (order) {
              updateSupplierBalance.run(item.received_quantity * unitPrice, order.supplier_id);
            }
            
            insertMovement.run(item.part_id, item.received_quantity, newBalance, orderId, `استلام من طلب شراء #${orderId}`);
          }
        }
        
        const allItems = db.prepare("SELECT ordered_quantity, received_quantity FROM purchase_order_items WHERE purchase_order_id = ?").all() as any[];
        let totalOrdered = 0;
        let totalReceived = 0;
        for (const item of allItems) {
          totalOrdered += item.ordered_quantity;
          totalReceived += item.received_quantity;
        }
        
        let newStatus = 'ordered';
        if (totalReceived === 0) {
          newStatus = 'ordered';
        } else if (totalReceived < totalOrdered) {
          newStatus = 'partial';
        } else {
          newStatus = 'completed';
        }
        
        db.prepare("UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newStatus, orderId);
      });
      
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Purchase Returns
  getAllPurchaseReturns(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT pr.*, s.supplier_name 
      FROM purchase_returns pr
      LEFT JOIN suppliers s ON pr.supplier_id = s.id
      ORDER BY pr.return_date DESC
    `).all();
  }

  createPurchaseReturn(supplierId: number, items: any[], notes?: string): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    try {
      const transaction = db.transaction(() => {
        let totalAmount = 0;
        
        const returnInfo = db.prepare(`
          INSERT INTO purchase_returns (supplier_id, notes)
          VALUES (?, ?)
        `).run(supplierId, notes);
        const returnId = returnInfo.lastInsertRowid;

        const insertReturnItem = db.prepare(`
          INSERT INTO purchase_return_items (purchase_return_id, part_id, quantity, unit_price)
          VALUES (?, ?, ?, ?)
        `);

        const updateStock = db.prepare(`
          UPDATE parts SET quantity = quantity - ? WHERE id = ?
        `);

        const insertMovement = db.prepare(`
          INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_id, reference_type, note)
          VALUES (?, 'purchase_return', ?, ?, ?, 'purchase_return', ?)
        `);

        for (const item of items) {
          if (item.quantity > 0) {
            const itemTotal = item.quantity * item.unit_price;
            totalAmount += itemTotal;

            insertReturnItem.run(returnId, item.part_id, item.quantity, item.unit_price);
            
            const part = db.prepare("SELECT quantity FROM parts WHERE id = ?").get(item.part_id) as any;
            const newBalance = part.quantity - item.quantity;
            
            updateStock.run(item.quantity, item.part_id);
            insertMovement.run(item.part_id, -item.quantity, newBalance, returnId, `مرتجع مشتريات #${returnId}`);
          }
        }

        db.prepare("UPDATE purchase_returns SET total_amount = ? WHERE id = ?").run(totalAmount, returnId);
        db.prepare("UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?").run(totalAmount, supplierId);

        return returnId;
      });

      const id = transaction();
      return { success: true, id: id as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Supplier Payments
  getAllSupplierPayments(supplierId?: number): any[] {
    const db = getDatabase();
    let query = `
      SELECT sp.*, s.supplier_name, ba.account_name as bank_name
      FROM supplier_payments sp
      JOIN suppliers s ON sp.supplier_id = s.id
      LEFT JOIN bank_accounts ba ON sp.bank_account_id = ba.id
    `;
    const params: any[] = [];
    if (supplierId) {
      query += " WHERE sp.supplier_id = ?";
      params.push(supplierId);
    }
    query += " ORDER BY sp.payment_date DESC";
    return db.prepare(query).all(...params);
  }

  createSupplierPayment(data: {
    supplier_id: number;
    amount: number;
    payment_method: string;
    bank_account_id?: number;
    reference_number?: string;
    notes?: string;
  }): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { supplier_id, amount, payment_method, bank_account_id, reference_number, notes } = data;

    try {
      const transaction = db.transaction(() => {
        const result = db.prepare(`
          INSERT INTO supplier_payments (supplier_id, amount, payment_method, bank_account_id, reference_number, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(supplier_id, amount, payment_method, bank_account_id, reference_number, notes);

        db.prepare("UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?").run(amount, supplier_id);

        if (payment_method === 'cash') {
          db.prepare(`
            INSERT INTO cashbox_movements (movement_date, type, amount, note, reference_type, reference_id)
            VALUES (CURRENT_TIMESTAMP, 'purchase_payment', ?, ?, 'supplier_payment', ?)
          `).run(-amount, `سداد للمورد: ${notes || ''}`, result.lastInsertRowid);
        } else if (payment_method === 'bank' && bank_account_id) {
          db.prepare("UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?").run(amount, bank_account_id);
          db.prepare(`
            INSERT INTO bank_movements (bank_account_id, movement_date, type, amount, note, reference_type, reference_id)
            VALUES (?, CURRENT_TIMESTAMP, 'purchase_payment', ?, ?, 'supplier_payment', ?)
          `).run(bank_account_id, -amount, `سداد للمورد: ${notes || ''}`, result.lastInsertRowid);
        }

        return result.lastInsertRowid;
      });

      const paymentId = transaction();
      return { success: true, id: paymentId as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new SupplierService();