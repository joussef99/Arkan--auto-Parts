import { getDatabase } from "../config/db.js";

export interface PartFilters {
  q?: string;
  brand?: string;
  model?: string;
  year?: string;
  category?: string;
  availability?: string;
}

export interface PartData {
  id?: number;
  part_name_ar: string;
  oem_number?: string;
  barcode?: string;
  brand_id?: number;
  model_id?: number;
  year_range_id?: number;
  category_id: number;
  supplier_id?: number;
  manufacturer_code?: string;
  shelf_location_id: string;
  cost_price?: number;
  selling_price?: number;
  quantity: number;
  keywords?: string;
  notes?: string;
  image_path?: string;
}

export interface StockMovementData {
  part_id: number;
  movement_type: string;
  quantity: number;
  note?: string;
}

class ProductsService {
  getAllParts(filters: PartFilters = {}): any[] {
    const db = getDatabase();
    const { q, brand, model, year, category, availability } = filters;

    let query = `
      SELECT p.*, b.name as brand_name, c.name as category_name, m.name as model_name
      FROM parts p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN models m ON p.model_id = m.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      query += ` AND (p.part_name_ar LIKE ? OR p.oem_number LIKE ? OR p.barcode LIKE ? OR p.keywords LIKE ? OR p.shelf_location_id LIKE ? OR p.manufacturer_code LIKE ?)`;
      const search = `%${q}%`;
      params.push(search, search, search, search, search, search);
    }
    if (brand) {
      query += ` AND p.brand_id = ?`;
      params.push(brand);
    }
    if (model) {
      query += ` AND p.model_id = ?`;
      params.push(model);
    }
    if (year) {
      query += ` AND p.year_range_id = ?`;
      params.push(year);
    }
    if (category) {
      query += ` AND p.category_id = ?`;
      params.push(category);
    }
    if (availability) {
      if (availability === 'available') {
        query += ` AND p.quantity > p.min_stock_level`;
      } else if (availability === 'low') {
        query += ` AND p.quantity > 0 AND p.quantity <= p.min_stock_level`;
      } else if (availability === 'out') {
        query += ` AND p.quantity = 0`;
      }
    }

    return db.prepare(query).all(...params);
  }

  getPartById(id: number): any {
    const db = getDatabase();
    return db.prepare(`
      SELECT p.*, b.name as brand_name, c.name as category_name, m.name as model_name
      FROM parts p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN models m ON p.model_id = m.id
      WHERE p.id = ?
    `).get(id);
  }

  createPart(partData: PartData): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { 
      part_name_ar, oem_number, barcode, brand_id, model_id, year_range_id, 
      category_id, shelf_location_id, cost_price, selling_price, 
      quantity, keywords, notes, manufacturer_code, image_path 
    } = partData;

    if (!part_name_ar || !category_id || quantity === undefined || !shelf_location_id) {
      return { success: false, error: "يرجى تعبئة جميع الحقول المطلوبة" };
    }

    try {
      const transaction = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT INTO parts (
            part_name_ar, oem_number, barcode, brand_id, model_id, year_range_id, 
            category_id, shelf_location_id, cost_price, selling_price, 
            quantity, keywords, notes, manufacturer_code, image_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
          part_name_ar, oem_number, barcode, 
          brand_id || null, model_id || null, year_range_id || null, 
          category_id, shelf_location_id, cost_price || 0, selling_price || 0, 
          quantity || 0, keywords, notes, manufacturer_code, image_path
        );

        const partId = info.lastInsertRowid;

        // Create opening stock movement
        db.prepare(`
          INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
          VALUES (?, 'opening_stock', ?, ?, 'manual_entry', 'رصيد افتتاح عند الإضافة')
        `).run(partId, quantity || 0, quantity || 0);

        return partId;
      });

      const partId = transaction();
      return { success: true, id: partId as number };
    } catch (error) {
      console.error("Create part error:", error);
      return { success: false, error: "حدث خطأ أثناء حفظ الصنف" };
    }
  }

  updatePart(id: number, partData: Partial<PartData>): { success: boolean; error?: string } {
    const db = getDatabase();
    const { 
      part_name_ar, oem_number, barcode, brand_id, model_id, year_range_id, 
      category_id, shelf_location_id, cost_price, selling_price, 
      quantity, keywords, notes, manufacturer_code, image_path 
    } = partData;

    try {
      db.prepare(`
        UPDATE parts SET 
          part_name_ar = ?, oem_number = ?, barcode = ?, brand_id = ?, model_id = ?, 
          year_range_id = ?, category_id = ?, shelf_location_id = ?, cost_price = ?, 
          selling_price = ?, quantity = ?, keywords = ?, notes = ?, 
          manufacturer_code = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        part_name_ar, oem_number, barcode, 
        brand_id || null, model_id || null, year_range_id || null, 
        category_id, shelf_location_id, cost_price || 0, selling_price || 0, 
        quantity || 0, keywords, notes, manufacturer_code, image_path, id
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  deletePart(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const hasInvoices = db.prepare("SELECT COUNT(*) as count FROM invoice_items WHERE part_id = ?").get(id) as any;
      const hasPurchaseOrders = db.prepare("SELECT COUNT(*) as count FROM purchase_order_items WHERE part_id = ?").get(id) as any;
      
      const reasons: string[] = [];
      if (hasInvoices && hasInvoices.count > 0) reasons.push(`مرتبطة بـ ${hasInvoices.count} فواتير مبيعات`);
      if (hasPurchaseOrders && hasPurchaseOrders.count > 0) reasons.push(`مرتبطة بـ ${hasPurchaseOrders.count} طلبات شراء`);

      if (reasons.length > 0) {
        return { success: false, error: `لا يمكن حذف القطعة للأسباب التالية: ${reasons.join(" - ")}` };
      }
      
      db.prepare("DELETE FROM parts WHERE id = ?").run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  updatePrice(id: number, selling_price: number, margin_percent?: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      db.prepare(`
        UPDATE parts 
        SET selling_price = ?, margin_percent = ?, price_updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(selling_price, margin_percent || 0, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  addQuantity(partId: number, quantity: number, note?: string): { success: boolean; new_quantity?: number; error?: string } {
    const db = getDatabase();
    try {
      const transaction = db.transaction(() => {
        const part = db.prepare("SELECT quantity FROM parts WHERE id = ?").get(partId) as any;
        if (!part) throw new Error("القطعة غير موجودة");

        const newQty = part.quantity + quantity;
        db.prepare("UPDATE parts SET quantity = ? WHERE id = ?").run(newQty, partId);
        
        db.prepare(`
          INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
          VALUES (?, 'addition', ?, ?, 'manual_entry', ?)
        `).run(partId, quantity, newQty, note || 'إضافة كمية يدوية');
        
        return newQty;
      });

      const newQty = transaction();
      return { success: true, new_quantity: newQty };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  auditStock(partId: number, physicalQuantity: number, note?: string): { success: boolean; new_quantity?: number; error?: string } {
    const db = getDatabase();
    try {
      const transaction = db.transaction(() => {
        const part = db.prepare("SELECT quantity FROM parts WHERE id = ?").get(partId) as any;
        if (!part) throw new Error("القطعة غير موجودة");

        const diff = physicalQuantity - part.quantity;
        db.prepare("UPDATE parts SET quantity = ? WHERE id = ?").run(physicalQuantity, partId);
        
        db.prepare(`
          INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
          VALUES (?, 'audit', ?, ?, 'manual_entry', ?)
        `).run(partId, diff, physicalQuantity, note || 'جرد مخزني');
        
        return physicalQuantity;
      });

      const newQty = transaction();
      return { success: true, new_quantity: newQty };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  stockEntry(items: any[]): { success: boolean; added?: number; updated?: number; error?: string } {
    const db = getDatabase();
    try {
      const transaction = db.transaction(() => {
        let added = 0;
        let updated = 0;

        for (const item of items) {
          if (!item.part_name_ar || !item.oem_number) continue;

          const existing = db.prepare("SELECT id, quantity FROM parts WHERE oem_number = ?").get(item.oem_number) as any;

          if (existing) {
            const newQty = existing.quantity + (Number(item.quantity) || 0);
            db.prepare(`
              UPDATE parts SET 
                quantity = ?, 
                cost_price = ?, 
                last_purchase_price = ?, 
                margin_percent = ?, 
                selling_price = ?, 
                shelf_location_id = ?,
                price_updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(
              newQty, 
              item.cost_price || 0, 
              item.cost_price || 0, 
              item.margin_percent || 0, 
              item.selling_price || 0, 
              item.shelf_location_id || '', 
              existing.id
            );

            if (Number(item.quantity) > 0) {
              db.prepare(`
                INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
                VALUES (?, 'addition', ?, ?, 'manual_entry', ?)
              `).run(existing.id, Number(item.quantity), newQty, 'إضافة بضاعة للمخزن');
            }
            updated++;
          } else {
            const info = db.prepare(`
              INSERT INTO parts (
                part_name_ar, oem_number, quantity, cost_price, last_purchase_price, 
                margin_percent, selling_price, shelf_location_id, category_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM categories LIMIT 1))
            `).run(
              item.part_name_ar, 
              item.oem_number, 
              Number(item.quantity) || 0, 
              item.cost_price || 0, 
              item.cost_price || 0, 
              item.margin_percent || 0, 
              item.selling_price || 0, 
              item.shelf_location_id || ''
            );

            if (Number(item.quantity) > 0) {
              db.prepare(`
                INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
                VALUES (?, 'opening', ?, ?, 'manual_entry', ?)
              `).run(info.lastInsertRowid, Number(item.quantity), Number(item.quantity), 'رصيد افتتاحي');
            }
            added++;
          }
        }
        return { added, updated };
      });

      const result = transaction();
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  importParts(partsList: any[]): { success: boolean; imported?: number; errors?: number; error?: string } {
    const db = getDatabase();
    try {
      const transaction = db.transaction(() => {
        const results = { imported: 0, errors: 0 };
        
        for (const item of partsList) {
          try {
            let existing: any = null;
            if (item.oem_number) {
              existing = db.prepare("SELECT id, quantity FROM parts WHERE oem_number = ?").get(item.oem_number);
            } else if (item.barcode) {
              existing = db.prepare("SELECT id, quantity FROM parts WHERE barcode = ?").get(item.barcode);
            }

            if (existing) {
              const newQty = existing.quantity + (item.quantity || 0);
              db.prepare("UPDATE parts SET quantity = ? WHERE id = ?").run(newQty, existing.id);
              db.prepare(`
                INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
                VALUES (?, 'addition', ?, ?, 'manual_entry', 'استيراد من ملف - تحديث كمية')
              `).run(existing.id, item.quantity || 0, newQty);
            } else {
              const stmt = db.prepare(`
                INSERT INTO parts (
                  part_name_ar, oem_number, barcode, category_id, shelf_location_id, 
                  cost_price, selling_price, quantity, manufacturer_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);
              const info = stmt.run(
                item.part_name_ar || item.name, item.oem_number, item.barcode, item.category_id || 1, 
                item.shelf_location_id || item.shelf_location, item.cost_price || 0, item.selling_price || 0, 
                item.quantity || item.stock_quantity || 0, item.manufacturer_code
              );
              const partId = info.lastInsertRowid;
              db.prepare(`
                INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
                VALUES (?, 'opening_stock', ?, ?, 'manual_entry', 'استيراد من ملف - قطعة جديدة')
              `).run(partId, item.quantity || item.stock_quantity || 0, item.quantity || item.stock_quantity || 0);
            }
            results.imported++;
          } catch (e) {
            console.error("Import error for item:", item, e);
            results.errors++;
          }
        }
        return results;
      });

      const results = transaction();
      return { success: true, ...results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  getStockMovements(filters: { part_id?: string; type?: string; start_date?: string; end_date?: string }): any[] {
    const db = getDatabase();
    const { part_id, type, start_date, end_date } = filters;
    
    let query = `
      SELECT sm.*, p.part_name_ar as part_name, p.oem_number
      FROM stock_movements sm
      JOIN parts p ON sm.part_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (part_id) {
      query += " AND sm.part_id = ?";
      params.push(part_id);
    }
    if (type) {
      query += " AND sm.movement_type = ?";
      params.push(type);
    }
    if (start_date) {
      query += " AND sm.movement_date >= ?";
      params.push(start_date);
    }
    if (end_date) {
      query += " AND sm.movement_date <= ?";
      params.push(end_date);
    }

    query += " ORDER BY sm.movement_date DESC LIMIT 100";
    return db.prepare(query).all(...params);
  }

  // Brand methods
  getAllBrands(): any[] {
    const db = getDatabase();
    return db.prepare("SELECT * FROM brands").all();
  }

  createBrand(name: string, name_en?: string, logo_url?: string): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    try {
      const info = db.prepare("INSERT INTO brands (name, name_en, logo_url) VALUES (?, ?, ?)").run(name, name_en, logo_url);
      return { success: true, id: info.lastInsertRowid as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Model methods
  getAllModels(brand_id?: number): any[] {
    const db = getDatabase();
    if (brand_id) {
      return db.prepare("SELECT * FROM models WHERE brand_id = ?").all(brand_id);
    }
    return db.prepare("SELECT * FROM models").all();
  }

  createModel(brand_id: number, name: string, name_en?: string): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    try {
      const info = db.prepare("INSERT INTO models (brand_id, name, name_en) VALUES (?, ?, ?)").run(brand_id, name, name_en);
      return { success: true, id: info.lastInsertRowid as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Category methods
  getAllCategories(): any[] {
    const db = getDatabase();
    return db.prepare("SELECT * FROM categories").all();
  }

  createCategory(name: string, icon_name?: string, color?: string): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    try {
      const info = db.prepare("INSERT INTO categories (name, icon_name, color) VALUES (?, ?, ?)").run(name, icon_name, color);
      return { success: true, id: info.lastInsertRowid as number };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  deleteCategory(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const hasParts = db.prepare("SELECT COUNT(*) as count FROM parts WHERE category_id = ?").get(id) as any;
      if (hasParts && hasParts.count > 0) {
        return { success: false, error: `لا يمكن حذف القسم لوجود ${hasParts.count} أصناف مرتبطة به` };
      }
      db.prepare("DELETE FROM categories WHERE id = ?").run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Year ranges
  getAllYearRanges(): any[] {
    const db = getDatabase();
    return db.prepare("SELECT * FROM year_ranges").all();
  }
}

export default new ProductsService();