import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any;
try {
  console.log("Starting server initialization...");
  db = new Database("arkan_parts.db");
  db.pragma('foreign_keys = ON');

  const tables = [
    `CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      name_en TEXT,
      logo_url TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER,
      name TEXT NOT NULL,
      name_en TEXT,
      image_url TEXT,
      FOREIGN KEY(brand_id) REFERENCES brands(id)
    )`,
    `CREATE TABLE IF NOT EXISTS year_ranges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      start_year INTEGER,
      end_year INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon_name TEXT,
      color TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      company_name TEXT,
      address TEXT,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_name_ar TEXT NOT NULL,
      oem_number TEXT,
      barcode TEXT,
      brand_id INTEGER,
      model_id INTEGER,
      year_range_id INTEGER,
      category_id INTEGER,
      supplier_id INTEGER,
      manufacturer_code TEXT,
      shelf_location_id TEXT,
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      last_purchase_price REAL DEFAULT 0,
      margin_percent REAL DEFAULT 0,
      price_updated_at TEXT,
      quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 5,
      keywords TEXT,
      notes TEXT,
      image_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(brand_id) REFERENCES brands(id),
      FOREIGN KEY(model_id) REFERENCES models(id),
      FOREIGN KEY(year_range_id) REFERENCES year_ranges(id),
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      alt_phone TEXT,
      area TEXT,
      customer_type TEXT DEFAULT 'walk-in',
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      amount REAL NOT NULL,
      note TEXT,
      reference_invoice_id INTEGER,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      total_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      payment_type TEXT CHECK(payment_type IN ('cash', 'credit', 'transfer')),
      status TEXT DEFAULT 'saved',
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`,
    `CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      part_id INTEGER,
      quantity INTEGER,
      unit_price REAL,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id),
      FOREIGN KEY(part_id) REFERENCES parts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id INTEGER,
      movement_type TEXT,
      quantity INTEGER,
      balance_after INTEGER,
      reference_id INTEGER,
      reference_type TEXT,
      note TEXT,
      movement_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(part_id) REFERENCES parts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE,
      supplier_id INTEGER,
      order_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'draft', -- 'draft', 'ordered', 'partial', 'completed', 'cancelled'
      warehouse_id INTEGER,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER,
      part_id INTEGER,
      ordered_quantity INTEGER DEFAULT 0,
      received_quantity INTEGER DEFAULT 0,
      unit_price REAL DEFAULT 0,
      manufacturer_code TEXT,
      notes TEXT,
      FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY(part_id) REFERENCES parts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER,
      receipt_date TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(id)
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_receipt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_receipt_id INTEGER,
      part_id INTEGER,
      quantity_received INTEGER,
      FOREIGN KEY(purchase_receipt_id) REFERENCES purchase_receipts(id),
      FOREIGN KEY(part_id) REFERENCES parts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      amount REAL NOT NULL,
      payment_method TEXT, -- 'cash', 'bank'
      bank_account_id INTEGER,
      reference_number TEXT,
      notes TEXT,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY(bank_account_id) REFERENCES bank_accounts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER,
      return_date TEXT DEFAULT CURRENT_TIMESTAMP,
      total_amount REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )`,
    `CREATE TABLE IF NOT EXISTS purchase_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_return_id INTEGER,
      part_id INTEGER,
      quantity INTEGER,
      unit_price REAL,
      FOREIGN KEY(purchase_return_id) REFERENCES purchase_returns(id),
      FOREIGN KEY(part_id) REFERENCES parts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_name TEXT NOT NULL,
      bank_name TEXT,
      account_number TEXT,
      current_balance REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cashbox_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movement_date TEXT DEFAULT CURRENT_TIMESTAMP,
      type TEXT, -- 'sale_cash', 'purchase_cash', 'expense', 'deposit', 'withdrawal', 'transfer_to_bank', 'transfer_from_bank'
      amount REAL NOT NULL,
      reference_id INTEGER,
      reference_type TEXT,
      note TEXT,
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS bank_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_account_id INTEGER,
      movement_date TEXT DEFAULT CURRENT_TIMESTAMP,
      type TEXT, -- 'deposit', 'withdrawal', 'transfer_to_cash', 'transfer_from_cash', 'purchase_payment', 'collection'
      amount REAL NOT NULL,
      reference_id INTEGER,
      reference_type TEXT,
      note TEXT,
      user_id INTEGER,
      FOREIGN KEY(bank_account_id) REFERENCES bank_accounts(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      category TEXT,
      amount REAL NOT NULL,
      note TEXT,
      payment_source TEXT, -- 'cash', 'bank'
      bank_account_id INTEGER,
      FOREIGN KEY(bank_account_id) REFERENCES bank_accounts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password TEXT NOT NULL,
      role_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(role_id) REFERENCES roles(id)
    )`,
    `CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      label_ar TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      label_ar TEXT NOT NULL,
      module TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER,
      permission_id INTEGER,
      PRIMARY KEY(role_id, permission_id),
      FOREIGN KEY(role_id) REFERENCES roles(id),
      FOREIGN KEY(permission_id) REFERENCES permissions(id)
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`
  ];

  for (const tableSql of tables) {
    try {
      db.exec(tableSql);
    } catch (e) {
      console.error("Error creating table:", e);
    }
  }

  // Migration: Ensure new columns exist in parts table
  const partsTableInfo = db.prepare("PRAGMA table_info(parts)").all() as any[];
  if (partsTableInfo.length > 0) {
    const columnNames = partsTableInfo.map(c => c.name);
    
    if (columnNames.includes("name") && !columnNames.includes("part_name_ar")) {
      db.exec("ALTER TABLE parts RENAME COLUMN name TO part_name_ar");
    }
    if (columnNames.includes("stock_quantity") && !columnNames.includes("quantity")) {
      db.exec("ALTER TABLE parts RENAME COLUMN stock_quantity TO quantity");
    }
    if (columnNames.includes("shelf_location") && !columnNames.includes("shelf_location_id")) {
      db.exec("ALTER TABLE parts RENAME COLUMN shelf_location TO shelf_location_id");
    }
    if (columnNames.includes("image_url") && !columnNames.includes("image_path")) {
      db.exec("ALTER TABLE parts RENAME COLUMN image_url TO image_path");
    }

    // Re-fetch column names after renames
    const updatedPartsTableInfo = db.prepare("PRAGMA table_info(parts)").all() as any[];
    const updatedColumnNames = updatedPartsTableInfo.map(c => c.name);

    if (!updatedColumnNames.includes("manufacturer_code")) {
      db.exec("ALTER TABLE parts ADD COLUMN manufacturer_code TEXT");
    }
    if (!updatedColumnNames.includes("last_purchase_price")) {
      db.exec("ALTER TABLE parts ADD COLUMN last_purchase_price REAL DEFAULT 0");
    }
    if (!updatedColumnNames.includes("margin_percent")) {
      db.exec("ALTER TABLE parts ADD COLUMN margin_percent REAL DEFAULT 0");
    }
    if (!updatedColumnNames.includes("price_updated_at")) {
      db.exec("ALTER TABLE parts ADD COLUMN price_updated_at TEXT");
    }
    if (!updatedColumnNames.includes("notes")) {
      db.exec("ALTER TABLE parts ADD COLUMN notes TEXT");
    }
    if (!updatedColumnNames.includes("keywords")) {
      db.exec("ALTER TABLE parts ADD COLUMN keywords TEXT");
    }
    if (!updatedColumnNames.includes("cost_price")) {
      db.exec("ALTER TABLE parts ADD COLUMN cost_price REAL DEFAULT 0");
    }
    if (!updatedColumnNames.includes("created_at")) {
      db.exec("ALTER TABLE parts ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }
    if (!updatedColumnNames.includes("updated_at")) {
      db.exec("ALTER TABLE parts ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }
    if (!updatedColumnNames.includes("last_purchase_price")) {
      db.exec("ALTER TABLE parts ADD COLUMN last_purchase_price REAL DEFAULT 0");
    }
    if (!updatedColumnNames.includes("margin_percent")) {
      db.exec("ALTER TABLE parts ADD COLUMN margin_percent REAL DEFAULT 0");
    }
    if (!updatedColumnNames.includes("price_updated_at")) {
      db.exec("ALTER TABLE parts ADD COLUMN price_updated_at TEXT");
    }
  }

  // Migration for stock_movements
  const smTableInfo = db.prepare("PRAGMA table_info(stock_movements)").all() as any[];
  if (smTableInfo.length > 0) {
    const smColumnNames = smTableInfo.map(c => c.name);
    if (smColumnNames.includes("type") && !smColumnNames.includes("movement_type")) {
      db.exec("ALTER TABLE stock_movements RENAME COLUMN type TO movement_type");
    }
    if (smColumnNames.includes("created_at") && !smColumnNames.includes("movement_date")) {
      db.exec("ALTER TABLE stock_movements RENAME COLUMN created_at TO movement_date");
    }
    if (!smColumnNames.includes("reference_type")) {
      db.exec("ALTER TABLE stock_movements ADD COLUMN reference_type TEXT");
    }
  }

  // Migration for suppliers
  const suppliersTableInfo = db.prepare("PRAGMA table_info(suppliers)").all() as any[];
  if (suppliersTableInfo.length > 0) {
    const columnNames = suppliersTableInfo.map(c => c.name);
    if (columnNames.includes("name") && !columnNames.includes("supplier_name")) {
      db.exec("ALTER TABLE suppliers RENAME COLUMN name TO supplier_name");
    }
    if (columnNames.includes("company") && !columnNames.includes("company_name")) {
      db.exec("ALTER TABLE suppliers RENAME COLUMN company TO company_name");
    }
    if (columnNames.includes("balance") && !columnNames.includes("current_balance")) {
      db.exec("ALTER TABLE suppliers RENAME COLUMN balance TO current_balance");
    }
    
    // Re-fetch column names
    const updatedSuppliersInfo = db.prepare("PRAGMA table_info(suppliers)").all() as any[];
    const updatedColNames = updatedSuppliersInfo.map(c => c.name);
    
    if (!updatedColNames.includes("opening_balance")) {
      db.exec("ALTER TABLE suppliers ADD COLUMN opening_balance REAL DEFAULT 0");
    }
    if (!updatedColNames.includes("current_balance")) {
      db.exec("ALTER TABLE suppliers ADD COLUMN current_balance REAL DEFAULT 0");
    }
    if (!updatedColNames.includes("company_name")) {
      db.exec("ALTER TABLE suppliers ADD COLUMN company_name TEXT");
    }
    if (!updatedColNames.includes("address")) {
      db.exec("ALTER TABLE suppliers ADD COLUMN address TEXT");
    }
    if (!updatedColNames.includes("notes")) {
      db.exec("ALTER TABLE suppliers ADD COLUMN notes TEXT");
    }
    if (!updatedColNames.includes("is_active")) {
      db.exec("ALTER TABLE suppliers ADD COLUMN is_active INTEGER DEFAULT 1");
    }
    if (!updatedColNames.includes("updated_at")) {
      db.exec("ALTER TABLE suppliers ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }
  }

  // Migration for customers
  const customersTableInfo = db.prepare("PRAGMA table_info(customers)").all() as any[];
  if (customersTableInfo.length > 0) {
    const columnNames = customersTableInfo.map(c => c.name);
    if (columnNames.includes("balance") && !columnNames.includes("current_balance")) {
      db.exec("ALTER TABLE customers RENAME COLUMN balance TO current_balance");
    }
    
    // Re-fetch column names
    const updatedCustomersInfo = db.prepare("PRAGMA table_info(customers)").all() as any[];
    const updatedColNames = updatedCustomersInfo.map(c => c.name);
    
    if (!updatedColNames.includes("current_balance")) {
      db.exec("ALTER TABLE customers ADD COLUMN current_balance REAL DEFAULT 0");
    }
    if (!updatedColNames.includes("customer_type")) {
      db.exec("ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'walk-in'");
    }
    if (!updatedColNames.includes("credit_limit")) {
      db.exec("ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0");
    }
    if (!updatedColNames.includes("updated_at")) {
      db.exec("ALTER TABLE customers ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }
  }

  // Migration for categories
  const categoriesTableInfo = db.prepare("PRAGMA table_info(categories)").all() as any[];
  if (categoriesTableInfo.length > 0) {
    const columnNames = categoriesTableInfo.map(c => c.name);
    if (!columnNames.includes("default_margin")) {
      db.exec("ALTER TABLE categories ADD COLUMN default_margin REAL DEFAULT 0");
    }
  }

  // Migration for invoices payment_type constraint
  try {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='invoices'").get() as any;
    if (tableSql && tableSql.sql.includes("CHECK(payment_type IN ('cash', 'credit'))")) {
      console.log("Migrating invoices table to allow 'transfer' payment_type...");
      db.exec("PRAGMA foreign_keys=off;");
      db.exec("BEGIN TRANSACTION;");
      db.exec(`CREATE TABLE invoices_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        total_amount REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        payment_type TEXT CHECK(payment_type IN ('cash', 'credit', 'transfer')),
        status TEXT DEFAULT 'saved',
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      )`);
      db.exec("INSERT INTO invoices_new SELECT * FROM invoices;");
      db.exec("DROP TABLE invoices;");
      db.exec("ALTER TABLE invoices_new RENAME TO invoices;");
      db.exec("COMMIT;");
      db.exec("PRAGMA foreign_keys=on;");
    }
  } catch (err) {
    console.error("Error migrating invoices table:", err);
    try {
      db.exec("ROLLBACK;");
    } catch (e) {}
    db.exec("PRAGMA foreign_keys=on;");
  }

  try {
    const tableInfo = db.prepare("PRAGMA table_info(invoice_items)").all() as any[];
    if (!tableInfo.some(col => col.name === 'discount')) {
      db.exec("ALTER TABLE invoice_items ADD COLUMN discount REAL DEFAULT 0");
    }
  } catch (err) {
    console.error("Error adding discount to invoice_items:", err);
  }

  // Seed data with checks
  try {
    const categoriesCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
    if (categoriesCount.count === 0) {
      const insertCat = db.prepare("INSERT INTO categories (name, icon_name, color) VALUES (?, ?, ?)");
      const categories = [
        ["نظام التبريد", "Fan", "blue"],
        ["قطع الهيكل", "CarFront", "slate"],
        ["نظام التعليق", "ArrowDownUp", "orange"],
        ["الكهرباء", "Zap", "yellow"],
        ["الفرامل", "CircleStop", "red"],
        ["المحرك", "Cpu", "emerald"]
      ];
      categories.forEach(c => insertCat.run(...c));
    } else {
      // Ensure "المحرك" category exists
      const engineCat = db.prepare("SELECT * FROM categories WHERE name = ?").get("المحرك");
      if (!engineCat) {
        db.prepare("INSERT INTO categories (name, icon_name, color) VALUES (?, ?, ?)").run("المحرك", "Cpu", "emerald");
      }
    }

    const settingsCount = db.prepare("SELECT count(*) as count FROM settings").get() as { count: number };
    if (settingsCount.count === 0) {
      const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
      insertSetting.run("shop_name", "أركان لقطع الغيار");
      insertSetting.run("shop_phone", "0912345678");
      insertSetting.run("shop_address", "طرابلس، ليبيا");
      insertSetting.run("invoice_prefix", "ARK");
      insertSetting.run("currency", "د.ل");
      insertSetting.run("min_stock_alert", "5");
    }

    const brandCount = db.prepare("SELECT count(*) as count FROM brands").get() as { count: number };
    if (brandCount.count === 0) {
      const insertBrand = db.prepare("INSERT INTO brands (name, name_en, logo_url) VALUES (?, ?, ?)");
      const brands = [
        ["تويوتا", "Toyota", "https://www.carlogos.org/car-logos/toyota-logo.png"],
        ["هيونداي", "Hyundai", "https://www.carlogos.org/car-logos/hyundai-logo.png"],
        ["كيا", "Kia", "https://www.carlogos.org/car-logos/kia-logo.png"],
        ["نيسان", "Nissan", "https://www.carlogos.org/car-logos/nissan-logo.png"],
        ["ميتسوبيشي", "Mitsubishi", "https://www.carlogos.org/car-logos/mitsubishi-logo.png"],
        ["شيفروليه", "Chevrolet", "https://www.carlogos.org/car-logos/chevrolet-logo.png"],
        ["هوندا", "Honda", "https://www.carlogos.org/car-logos/honda-logo.png"],
        ["مازدا", "Mazda", "https://www.carlogos.org/car-logos/mazda-logo.png"],
        ["سامسونج", "Samsung", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/1200px-Samsung_Logo.svg.png"],
        ["سانج يونج", "SsangYong", "https://www.carlogos.org/car-logos/ssangyong-logo.png"],
        ["جينيسيس", "Genesis", "https://www.carlogos.org/car-logos/genesis-logo.png"],
        ["دايو", "Daewoo", "https://www.carlogos.org/car-logos/daewoo-logo.png"]
      ];
      brands.forEach(b => insertBrand.run(...b));

      const insertModel = db.prepare("INSERT INTO models (brand_id, name, name_en) VALUES (?, ?, ?)");
      insertModel.run(1, "كورولا", "Corolla");
      insertModel.run(1, "كامري", "Camry");
      insertModel.run(1, "ياريس", "Yaris");
      insertModel.run(1, "هايلوكس", "Hilux");
      insertModel.run(2, "إلنترا", "Elantra");
      insertModel.run(2, "أكسنت", "Accent");
      insertModel.run(2, "توسان", "Tucson");
      insertModel.run(3, "سبورتاج", "Sportage");
      insertModel.run(11, "G80", "G80");
      insertModel.run(11, "G90", "G90");
      insertModel.run(11, "GV80", "GV80");
      insertModel.run(12, "لانوس", "Lanos");
      insertModel.run(12, "نوبيرا", "Nubira");
      insertModel.run(12, "ليجانزا", "Leganza");

      const insertYear = db.prepare("INSERT INTO year_ranges (label, start_year, end_year) VALUES (?, ?, ?)");
      insertYear.run("2008–2011", 2008, 2011);
      insertYear.run("2012–2015", 2012, 2015);
      insertYear.run("2016–2019", 2016, 2019);
      insertYear.run("2020+", 2020, 2026);

      const insertPart = db.prepare(`
        INSERT INTO parts (part_name_ar, oem_number, brand_id, model_id, year_range_id, category_id, shelf_location_id, selling_price, quantity, image_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertPart.run("فلتر زيت", "90915-10001", 1, 1, 2, 1, "A-12", 25, 50, "https://picsum.photos/seed/oilfilter/200/200");
      insertPart.run("فحمات فرامل أمامية", "58101-1RA00", 2, 5, 3, 5, "B-05", 120, 15, "https://picsum.photos/seed/brakepads/200/200");
      insertPart.run("رادياتير مياه", "16400-21160", 1, 1, 2, 1, "C-01", 450, 8, "https://picsum.photos/seed/radiator/200/200");

      const insertCustomer = db.prepare("INSERT INTO customers (name, phone, current_balance) VALUES (?, ?, ?)");
      insertCustomer.run("أحمد محمد", "0912345678", 150);
      insertCustomer.run("سالم علي", "0923456789", 0);
      insertCustomer.run("محمود خالد", "0911112222", 450);
    }

    // Seed roles and permissions
    const rolesCount = db.prepare("SELECT count(*) as count FROM roles").get() as { count: number };
    if (rolesCount.count === 0) {
      const insertRole = db.prepare("INSERT INTO roles (name, label_ar) VALUES (?, ?)");
      insertRole.run("owner", "صاحب النشاط");
      insertRole.run("salesperson", "البائع");
      insertRole.run("accountant", "المحاسب");
      insertRole.run("purchasing", "مسؤول المشتريات");

      const insertPermission = db.prepare("INSERT INTO permissions (name, label_ar, module) VALUES (?, ?, ?)");
      const permissions = [
        ["sales_create", "إنشاء فاتورة مبيعات", "sales"],
        ["sales_view", "عرض فواتير المبيعات", "sales"],
        ["sales_delete", "حذف فاتورة مبيعات", "sales"],
        ["purchases_create", "إنشاء فاتورة مشتريات", "purchases"],
        ["purchases_view", "عرض فواتير المشتريات", "purchases"],
        ["suppliers_manage", "إدارة الموردين", "purchases"],
        ["inventory_manage", "إدارة المخزون", "inventory"],
        ["financial_view", "عرض المركز المالي", "financial"],
        ["cashbox_manage", "إدارة الخزنة", "financial"],
        ["settings_manage", "إدارة الإعدادات", "settings"],
        ["users_manage", "إدارة المستخدمين", "settings"]
      ];
      permissions.forEach(p => insertPermission.run(...p));

      // Assign all permissions to owner
      const allPermissions = db.prepare("SELECT id FROM permissions").all() as { id: number }[];
      const ownerRole = db.prepare("SELECT id FROM roles WHERE name = 'owner'").get() as { id: number };
      const insertRolePermission = db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
      allPermissions.forEach(p => insertRolePermission.run(ownerRole.id, p.id));

      // Default arkan user
      const hashedArkanPassword = bcrypt.hashSync("arkan", 10);
      db.prepare("INSERT INTO users (username, display_name, password, role_id) VALUES (?, ?, ?, ?)")
        .run("arkan", "المدير العام", hashedArkanPassword, ownerRole.id);
    }

    // Ensure arkan user exists with arkan password
    const ownerRole = db.prepare("SELECT id FROM roles WHERE name = 'owner'").get() as { id: number };
    if (ownerRole) {
      const arkanUser = db.prepare("SELECT id FROM users WHERE username = 'arkan'").get() as any;
      const hashedArkanPassword = bcrypt.hashSync("arkan", 10);
      
      if (!arkanUser) {
        const adminUser = db.prepare("SELECT id FROM users WHERE username = 'admin'").get() as any;
        if (adminUser) {
          db.prepare("UPDATE users SET username = 'arkan', password = ? WHERE id = ?").run(hashedArkanPassword, adminUser.id);
          console.log("Updated admin user to arkan");
        } else {
          db.prepare("INSERT INTO users (username, display_name, password, role_id) VALUES (?, ?, ?, ?)")
            .run("arkan", "المدير العام", hashedArkanPassword, ownerRole.id);
          console.log("Created arkan user");
        }
      } else {
        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedArkanPassword, arkanUser.id);
        console.log("Updated arkan user password");
      }
    }
    
    // Migrate existing plain text passwords
    const users = db.prepare("SELECT id, password FROM users").all() as any[];
    for (const user of users) {
      if (!user.password.startsWith("$2a$")) {
        const hashed = bcrypt.hashSync(user.password, 10);
        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, user.id);
        console.log("Migrated password for user", user.id);
      }
    }
  } catch (e) {
    console.error("Error seeding data:", e);
  }
} catch (error) {
  console.error("Database initialization failed:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/parts", (req, res) => {
    const { q, brand, model, year, category, availability } = req.query;
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

    const parts = db.prepare(query).all(...params);
    res.json(parts);
  });

  app.get("/api/brands", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM brands").all());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/models", (req, res) => {
    try {
      const { brand_id } = req.query;
      if (brand_id) {
        res.json(db.prepare("SELECT * FROM models WHERE brand_id = ?").all(brand_id));
      } else {
        res.json(db.prepare("SELECT * FROM models").all());
      }
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/year-ranges", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM year_ranges").all());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/categories", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM categories").all());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/customers", (req, res) => {
    const { q, filter } = req.query;
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
    res.json(db.prepare(query).all(...params));
  });

  app.get("/api/customers/:id", (req, res) => {
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_purchases,
        SUM(paid_amount) as total_paid,
        MAX(date) as last_transaction
      FROM invoices
      WHERE customer_id = ?
    `).get(req.params.id);

    res.json({ ...customer, stats });
  });

  app.post("/api/customers", (req, res) => {
    const { id, name, phone, alt_phone, area, customer_type, credit_limit, notes } = req.body;
    try {
      if (id) {
        db.prepare(`
          UPDATE customers SET 
            name = ?, phone = ?, alt_phone = ?, area = ?, 
            customer_type = ?, credit_limit = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(name, phone, alt_phone, area, customer_type, credit_limit, notes, id);
        res.json({ success: true, id });
      } else {
        const info = db.prepare(`
          INSERT INTO customers (name, phone, alt_phone, area, customer_type, credit_limit, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(name, phone, alt_phone, area, customer_type, credit_limit, notes);
        res.json({ success: true, id: info.lastInsertRowid });
      }
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete("/api/customers/:id", (req, res) => {
    try {
      const customerId = Number(req.params.id);
      console.log(`[DELETE] Request received for customer ID: ${customerId}`);
      
      // Check if customer exists and get balance
      const customer = db.prepare("SELECT current_balance FROM customers WHERE id = ?").get(customerId) as any;
      if (!customer) {
        console.log(`[DELETE] Customer ${customerId} not found.`);
        return res.status(404).json({ error: "الزبون غير موجود" });
      }

      console.log(`[DELETE] Checking linked invoices for customer ${customerId}...`);
      const hasInvoices = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?").get(customerId) as any;
      
      console.log(`[DELETE] Checking payments for customer ${customerId}...`);
      const hasPayments = db.prepare("SELECT COUNT(*) as count FROM payments WHERE customer_id = ?").get(customerId) as any;
      
      console.log(`[DELETE] Checking balance for customer ${customerId}: ${customer.current_balance}`);
      
      const reasons: string[] = [];
      if (hasInvoices && hasInvoices.count > 0) reasons.push(`يوجد ${hasInvoices.count} فواتير مسجلة`);
      if (hasPayments && hasPayments.count > 0) reasons.push(`يوجد ${hasPayments.count} دفعات مسجلة`);
      if (Math.abs(customer.current_balance) > 0.01) reasons.push(`الرصيد الحالي ليس صفراً (${customer.current_balance} د.ل)`);

      if (reasons.length > 0) {
        console.log(`[DELETE] Deletion blocked for customer ${customerId}. Reasons: ${reasons.join(", ")}`);
        return res.status(400).json({ 
          error: `لا يمكن حذف العميل للأسباب التالية: ${reasons.join(" - ")}` 
        });
      }
      
      console.log(`[DELETE] Safe to delete customer ${customerId}. Executing...`);
      const result = db.prepare("DELETE FROM customers WHERE id = ?").run(customerId);
      
      if (result.changes > 0) {
        console.log(`[DELETE] Success: Customer ${customerId} deleted.`);
        res.json({ success: true });
      } else {
        console.log(`[DELETE] Failed: No changes made for customer ${customerId}.`);
        res.status(500).json({ error: "فشل حذف العميل من قاعدة البيانات" });
      }
    } catch (e) {
      console.error("[DELETE] Error:", e);
      res.status(500).json({ error: "حدث خطأ أثناء محاولة حذف الزبون: " + (e as Error).message });
    }
  });

  app.get("/api/customers/:id/invoices", (req, res) => {
    res.json(db.prepare("SELECT * FROM invoices WHERE customer_id = ? ORDER BY date DESC").all(req.params.id));
  });

  app.get("/api/customers/:id/payments", (req, res) => {
    res.json(db.prepare("SELECT * FROM payments WHERE customer_id = ? ORDER BY payment_date DESC").all(req.params.id));
  });

  app.post("/api/payments", (req, res) => {
    const { customer_id, amount, note, reference_invoice_id } = req.body;
    const insertPayment = db.prepare(`
      INSERT INTO payments (customer_id, amount, note, reference_invoice_id)
      VALUES (?, ?, ?, ?)
    `);
    const updateCustomer = db.prepare(`
      UPDATE customers SET current_balance = current_balance - ? WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      const info = insertPayment.run(customer_id, amount, note, reference_invoice_id || null);
      updateCustomer.run(amount, customer_id);
      return info.lastInsertRowid;
    });

    try {
      const id = transaction();
      res.json({ success: true, id });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/customers/:id/statement", (req, res) => {
    const invoices = db.prepare(`
      SELECT id, date as timestamp, total_amount as amount, 'invoice' as type, id as ref_id
      FROM invoices WHERE customer_id = ?
    `).all(req.params.id);
    
    const payments = db.prepare(`
      SELECT id, payment_date as timestamp, amount, 'payment' as type, id as ref_id
      FROM payments WHERE customer_id = ?
    `).all(req.params.id);

    const statement = [...invoices, ...payments].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    res.json(statement);
  });

  app.post("/api/parts", (req, res) => {
    console.log("starting item save");
    const { 
      part_name_ar, oem_number, barcode, brand_id, model_id, year_range_id, 
      category_id, shelf_location_id, cost_price, selling_price, 
      quantity, keywords, notes, manufacturer_code, image_path 
    } = req.body;

    // Validation
    if (!part_name_ar || !category_id || quantity === undefined || !shelf_location_id) {
      console.log("validation failed for new item");
      return res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة" });
    }
    console.log("validation passed");

    const db_trans = db.transaction(() => {
      console.log("insert started");
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
      console.log("item saved successfully", partId);

      // Create opening stock movement
      db.prepare(`
        INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
        VALUES (?, 'opening_stock', ?, ?, 'manual_entry', 'رصيد افتتاح عند الإضافة')
      `).run(partId, quantity || 0, quantity || 0);
      console.log("stock movement created");

      return partId;
    });

    try {
      const partId = db_trans();
      res.json({ success: true, id: partId });
    } catch (error) {
      console.error("item save failed", error);
      res.status(500).json({ error: "حدث خطأ أثناء حفظ الصنف" });
    }
  });

  app.post("/api/inventory/add-quantity", (req, res) => {
    const { part_id, quantity, note } = req.body;
    
    const db_trans = db.transaction(() => {
      const part = db.prepare("SELECT quantity FROM parts WHERE id = ?").get(part_id);
      if (!part) throw new Error("القطعة غير موجودة");

      const newQty = part.quantity + quantity;
      
      db.prepare("UPDATE parts SET quantity = ? WHERE id = ?").run(newQty, part_id);
      
      db.prepare(`
        INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
        VALUES (?, 'addition', ?, ?, 'manual_entry', ?)
      `).run(part_id, quantity, newQty, note || 'إضافة كمية يدوية');
      
      return newQty;
    });

    try {
      const newQty = db_trans();
      res.json({ success: true, new_quantity: newQty });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/inventory/movements", (req, res) => {
    const { part_id, type, start_date, end_date } = req.query;
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
    
    try {
      const movements = db.prepare(query).all(...params);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/inventory/audit", (req, res) => {
    const { part_id, physical_quantity, note } = req.body;
    
    const db_trans = db.transaction(() => {
      const part = db.prepare("SELECT quantity FROM parts WHERE id = ?").get(part_id);
      if (!part) throw new Error("القطعة غير موجودة");

      const diff = physical_quantity - part.quantity;
      
      db.prepare("UPDATE parts SET quantity = ? WHERE id = ?").run(physical_quantity, part_id);
      
      db.prepare(`
        INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
        VALUES (?, 'audit', ?, ?, 'manual_entry', ?)
      `).run(part_id, diff, physical_quantity, note || 'جرد مخزني');
      
      return physical_quantity;
    });

    try {
      const newQty = db_trans();
      res.json({ success: true, new_quantity: newQty });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/inventory/stock-entry", (req, res) => {
    const { items } = req.body;
    
    const db_trans = db.transaction((entries: any[]) => {
      let added = 0;
      let updated = 0;

      for (const item of entries) {
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

    try {
      const result = db_trans(items);
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/inventory/import", (req, res) => {
    const { items } = req.body; // Array of part objects
    
    const db_trans = db.transaction((partsList: any[]) => {
      const results = { imported: 0, errors: 0 };
      
      for (const item of partsList) {
        try {
          // Check if part exists by OEM or Barcode
          let existing = null;
          if (item.oem_number) {
            existing = db.prepare("SELECT id, quantity FROM parts WHERE oem_number = ?").get(item.oem_number);
          } else if (item.barcode) {
            existing = db.prepare("SELECT id, quantity FROM parts WHERE barcode = ?").get(item.barcode);
          }

          if (existing) {
            // Update quantity
            const newQty = existing.quantity + (item.quantity || 0);
            db.prepare("UPDATE parts SET quantity = ? WHERE id = ?").run(newQty, existing.id);
            db.prepare(`
              INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_type, note)
              VALUES (?, 'addition', ?, ?, 'manual_entry', 'استيراد من ملف - تحديث كمية')
            `).run(existing.id, item.quantity || 0, newQty);
          } else {
            // Insert new
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

    try {
      const results = db_trans(items);
      res.json({ success: true, ...results });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/parts/:id/price", (req, res) => {
    const { selling_price, margin_percent } = req.body;
    try {
      db.prepare(`
        UPDATE parts 
        SET selling_price = ?, margin_percent = ?, price_updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(selling_price, margin_percent || 0, req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.put("/api/parts/:id", (req, res) => {
    const { 
      part_name_ar, oem_number, barcode, brand_id, model_id, year_range_id, 
      category_id, shelf_location_id, cost_price, selling_price, 
      quantity, keywords, notes, manufacturer_code, image_path 
    } = req.body;

    const stmt = db.prepare(`
      UPDATE parts SET 
        part_name_ar = ?, oem_number = ?, barcode = ?, brand_id = ?, model_id = ?, 
        year_range_id = ?, category_id = ?, shelf_location_id = ?, cost_price = ?, 
        selling_price = ?, quantity = ?, keywords = ?, notes = ?, 
        manufacturer_code = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    try {
      stmt.run(
        part_name_ar, oem_number, barcode, 
        brand_id || null, model_id || null, year_range_id || null, 
        category_id, shelf_location_id, cost_price || 0, selling_price || 0, 
        quantity || 0, keywords, notes, manufacturer_code, image_path, req.params.id
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/parts/:id", (req, res) => {
    try {
      const partId = Number(req.params.id);
      
      const hasInvoices = db.prepare("SELECT COUNT(*) as count FROM invoice_items WHERE part_id = ?").get(partId) as any;
      const hasPurchaseOrders = db.prepare("SELECT COUNT(*) as count FROM purchase_order_items WHERE part_id = ?").get(partId) as any;
      
      const reasons: string[] = [];
      if (hasInvoices && hasInvoices.count > 0) reasons.push(`مرتبطة بـ ${hasInvoices.count} فواتير مبيعات`);
      if (hasPurchaseOrders && hasPurchaseOrders.count > 0) reasons.push(`مرتبطة بـ ${hasPurchaseOrders.count} طلبات شراء`);

      if (reasons.length > 0) {
        return res.status(400).json({ 
          error: `لا يمكن حذف القطعة للأسباب التالية: ${reasons.join(" - ")}` 
        });
      }
      
      db.prepare("DELETE FROM parts WHERE id = ?").run(partId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/invoices", (req, res) => {
    try {
      const invoices = db.prepare(`
        SELECT i.*, c.name as customer_name,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as items_count
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY i.date DESC
        LIMIT 100
      `).all();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/invoices/:id", (req, res) => {
    try {
      const invoice = db.prepare(`
        SELECT i.*, c.name as customer_name, c.phone as customer_phone
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ?
      `).get(req.params.id);

      if (!invoice) {
        return res.status(404).json({ error: "الفاتورة غير موجودة" });
      }

      const items = db.prepare(`
        SELECT ii.*, p.part_name_ar, p.oem_number, p.manufacturer_code
        FROM invoice_items ii
        JOIN parts p ON ii.part_id = p.id
        WHERE ii.invoice_id = ?
      `).all(req.params.id);

      res.json({ ...invoice, items });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/invoices", (req, res) => {
    const { customer_id, items, payment_type, discount, total_amount, paid_amount } = req.body;
    console.log("Invoice save started:", { customer_id, itemsCount: items.length, payment_type });
    
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (customer_id, total_amount, discount, paid_amount, payment_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    
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

    const updateCustomerBalance = db.prepare(`
      UPDATE customers SET current_balance = current_balance + ? WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      const info = insertInvoice.run(customer_id || null, total_amount, discount, paid_amount || 0, payment_type);
      const invoiceId = info.lastInsertRowid;
      console.log("Invoice header saved, ID:", invoiceId);

      for (const item of items) {
        insertItem.run(invoiceId, item.id, item.quantity, item.selling_price, item.discount || 0);
        updateStock.run(item.quantity, item.id);
        insertMovement.run(item.id, -item.quantity, item.id, invoiceId, `فاتورة مبيعات رقم ${invoiceId}`);
      }
      console.log("Invoice items and stock movements saved.");

      if (customer_id) {
        const remaining = total_amount - (paid_amount !== undefined ? paid_amount : total_amount);
        if (remaining > 0) {
          updateCustomerBalance.run(remaining, customer_id);
          console.log(`Customer balance updated for ${payment_type} invoice.`);
        }
      }

      if (payment_type === 'cash' || (payment_type === 'credit' && paid_amount && paid_amount > 0)) {
        const amountToCash = paid_amount !== undefined ? paid_amount : total_amount;
        db.prepare(`
          INSERT INTO cashbox_movements (type, amount, reference_id, reference_type, note)
          VALUES ('sale_cash', ?, ?, 'invoice', ?)
        `).run(amountToCash, invoiceId, `تحصيل فاتورة مبيعات رقم ${invoiceId}`);
      } else if (payment_type === 'transfer') {
        const amountToBank = paid_amount !== undefined ? paid_amount : total_amount;
        // Get the first bank account or create a default one if none exists
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

    try {
      const id = transaction();
      console.log("Invoice save completed successfully.");
      res.json({ success: true, id });
    } catch (error) {
      console.error("Invoice save failed:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/invoices/:id", (req, res) => {
    const invoiceId = req.params.id;
    console.log("Invoice deletion started:", { invoiceId });

    try {
      const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId) as any;
      if (!invoice) {
        return res.status(404).json({ error: "الفاتورة غير موجودة" });
      }

      const items = db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?").all(invoiceId) as any[];

      const transaction = db.transaction(() => {
        // 1. Restore stock
        for (const item of items) {
          db.prepare("UPDATE parts SET quantity = quantity + ? WHERE id = ?").run(item.quantity, item.part_id);
          db.prepare(`
            INSERT INTO stock_movements (part_id, movement_type, quantity, balance_after, reference_id, reference_type, note)
            VALUES (?, 'cancellation', ?, (SELECT quantity FROM parts WHERE id = ?), ?, 'invoice', ?)
          `).run(item.part_id, item.quantity, item.part_id, invoiceId, `إلغاء فاتورة مبيعات رقم ${invoiceId}`);
        }

        // 2. Restore customer balance
        if (invoice.customer_id) {
          const remaining = invoice.total_amount - invoice.paid_amount;
          if (remaining > 0) {
            db.prepare("UPDATE customers SET current_balance = current_balance - ? WHERE id = ?").run(remaining, invoice.customer_id);
          }
        }

        // 3. Remove cashbox movements
        db.prepare("DELETE FROM cashbox_movements WHERE reference_type = 'invoice' AND reference_id = ?").run(invoiceId);

        // 4. Remove bank movements and restore bank balance
        const bankMovements = db.prepare("SELECT * FROM bank_movements WHERE reference_type = 'invoice' AND reference_id = ?").all(invoiceId) as any[];
        for (const movement of bankMovements) {
          db.prepare("UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?").run(movement.amount, movement.bank_account_id);
        }
        db.prepare("DELETE FROM bank_movements WHERE reference_type = 'invoice' AND reference_id = ?").run(invoiceId);

        // 5. Delete invoice items
        db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(invoiceId);

        // 6. Delete invoice
        db.prepare("DELETE FROM invoices WHERE id = ?").run(invoiceId);
      });

      transaction();
      console.log("Invoice deletion completed successfully.");
      res.json({ success: true });
    } catch (error) {
      console.error("Invoice deletion failed:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/reports/dashboard", (req, res) => {
    try {
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

      res.json({
        sales_today: salesToday,
        profit_today: profitToday,
        customer_debts: customerDebts,
        supplier_debts: supplierDebts,
        cash_balance: cashBalance
      });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/sales-details", (req, res) => {
    try {
      const { start, end } = req.query;
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

      res.json({ ...stats, top_parts: topParts });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });



  app.get("/api/reports/profit-details", (req, res) => {
    try {
      const { start, end } = req.query;
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
      res.json(report || { total_sales: 0, cost_of_goods_sold: 0, approx_profit: 0 });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/supplier-debts", (req, res) => {
    try {
      const debts = db.prepare(`
        SELECT supplier_name as name, company_name as company, current_balance as debt
        FROM suppliers
        WHERE current_balance > 0
        ORDER BY current_balance DESC
      `).all();
      res.json(debts);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/inventory-details", (req, res) => {
    try {
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

      res.json({
        item_count: itemCount,
        low_stock_count: lowStockCount,
        inventory_value: inventoryValue,
        top_selling: topSelling,
        low_stock_list: lowStockList
      });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/sales", (req, res) => {
    const sales = db.prepare(`
      SELECT date(date) as day, SUM(total_amount) as total 
      FROM invoices 
      GROUP BY day 
      ORDER BY day DESC 
      LIMIT 30
    `).all();
    res.json(sales);
  });

  app.get("/api/reports/low-stock", (req, res) => {
    try {
      const lowStock = db.prepare(`
        SELECT p.*, b.name as brand_name, m.name as model_name
        FROM parts p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN models m ON p.model_id = m.id
        WHERE p.quantity <= p.min_stock_level
      `).all();
      res.json(lowStock);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/daily-summary", (req, res) => {
    try {
      const summary = db.prepare(`
        SELECT 
          COUNT(*) as invoice_count,
          SUM(total_amount) as total_sales,
          AVG(total_amount) as avg_invoice
        FROM invoices
        WHERE date(date) = date('now')
      `).get();
      res.json(summary || { invoice_count: 0, total_sales: 0, avg_invoice: 0 });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/sales-range", (req, res) => {
    try {
      const { start, end } = req.query;
      const report = db.prepare(`
        SELECT 
          COUNT(*) as invoice_count,
          SUM(total_amount) as total_sales
        FROM invoices
        WHERE date(date) BETWEEN ? AND ?
      `).get(start, end);
      res.json(report || { invoice_count: 0, total_sales: 0 });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // --- Supplier Payments API ---
  app.get("/api/supplier-payments", (req, res) => {
    try {
      const { supplier_id } = req.query;
      let query = `
        SELECT sp.*, s.supplier_name, ba.account_name as bank_name
        FROM supplier_payments sp
        JOIN suppliers s ON sp.supplier_id = s.id
        LEFT JOIN bank_accounts ba ON sp.bank_account_id = ba.id
      `;
      const params: any[] = [];
      if (supplier_id) {
        query += " WHERE sp.supplier_id = ?";
        params.push(supplier_id);
      }
      query += " ORDER BY sp.payment_date DESC";
      const payments = db.prepare(query).all(...params);
      res.json(payments);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/supplier-payments", (req, res) => {
    const { supplier_id, amount, payment_method, bank_account_id, reference_number, notes } = req.body;
    try {
      const transaction = db.transaction(() => {
        // 1. Insert payment record
        const result = db.prepare(`
          INSERT INTO supplier_payments (supplier_id, amount, payment_method, bank_account_id, reference_number, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(supplier_id, amount, payment_method, bank_account_id, reference_number, notes);

        // 2. Update supplier balance
        db.prepare("UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?").run(amount, supplier_id);

        // 3. Record cashbox/bank movement
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
      res.json({ success: true, id: paymentId });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // --- Suppliers ---
  app.get("/api/suppliers", (req, res) => {
    try {
      const { q } = req.query;
      let query = "SELECT * FROM suppliers WHERE 1=1";
      const params: any[] = [];
      if (q) {
        query += " AND (supplier_name LIKE ? OR phone LIKE ? OR company_name LIKE ?)";
        const search = `%${q}%`;
        params.push(search, search, search);
      }
      query += " ORDER BY supplier_name ASC";
      res.json(db.prepare(query).all(...params));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/suppliers", (req, res) => {
    console.log("supplier save button clicked");
    const { id, supplier_name, phone, company_name, address, notes, opening_balance } = req.body;
    
    if (!supplier_name || !phone) {
      console.log("supplier insert failed: missing required fields");
      return res.status(400).json({ error: "اسم المورد ورقم الهاتف مطلوبان" });
    }
    console.log("validation passed");

    try {
      if (id) {
        db.prepare(`
          UPDATE suppliers SET 
            supplier_name = ?, phone = ?, company_name = ?, address = ?, 
            notes = ?, opening_balance = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(supplier_name, phone, company_name, address, notes, opening_balance || 0, id);
        console.log("supplier update success");
        res.json({ success: true, id });
      } else {
        console.log("supplier insert started");
        const info = db.prepare(`
          INSERT INTO suppliers (supplier_name, phone, company_name, address, notes, opening_balance, current_balance)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(supplier_name, phone, company_name, address, notes, opening_balance || 0, opening_balance || 0);
        console.log("supplier insert success", info.lastInsertRowid);
        res.json({ success: true, id: info.lastInsertRowid });
      }
    } catch (e) {
      console.error("supplier insert failed", e);
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete("/api/suppliers/:id", (req, res) => {
    try {
      const supplierId = Number(req.params.id);
      const supplier = db.prepare("SELECT current_balance FROM suppliers WHERE id = ?").get(supplierId) as any;
      
      if (!supplier) {
        return res.status(404).json({ error: "المورد غير موجود" });
      }

      const hasOrders = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?").get(supplierId) as any;
      const hasPayments = db.prepare("SELECT COUNT(*) as count FROM supplier_payments WHERE supplier_id = ?").get(supplierId) as any;
      
      const reasons: string[] = [];
      if (hasOrders && hasOrders.count > 0) reasons.push(`يوجد ${hasOrders.count} طلبات شراء مسجلة`);
      if (hasPayments && hasPayments.count > 0) reasons.push(`يوجد ${hasPayments.count} دفعات مسجلة`);
      if (Math.abs(supplier.current_balance) > 0.01) reasons.push(`الرصيد الحالي ليس صفراً (${supplier.current_balance} د.ل)`);

      if (reasons.length > 0) {
        return res.status(400).json({ 
          error: `لا يمكن حذف المورد للأسباب التالية: ${reasons.join(" - ")}` 
        });
      }

      db.prepare("DELETE FROM suppliers WHERE id = ?").run(supplierId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // --- Purchase Orders ---
  app.get("/api/purchase-orders", (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT po.*, s.supplier_name
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        ORDER BY po.created_at DESC
      `).all();
      res.json(orders);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/purchase-orders/:id", (req, res) => {
    try {
      const order = db.prepare(`
        SELECT po.*, s.supplier_name
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
      `).get(req.params.id);
      
      if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
      
      const items = db.prepare(`
        SELECT poi.*, p.part_name_ar, p.oem_number, p.selling_price, p.margin_percent, p.category_id
        FROM purchase_order_items poi
        JOIN parts p ON poi.part_id = p.id
        WHERE poi.purchase_order_id = ?
      `).all(req.params.id);
      
      res.json({ ...order, items });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/purchase-orders", (req, res) => {
    const { id, order_number, supplier_id, order_date, status, warehouse_id, notes, items } = req.body;
    
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
        orderId = info.lastInsertRowid;
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
    
    try {
      const orderId = transaction();
      res.json({ success: true, id: orderId });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/purchase-orders/:id/receive", (req, res) => {
    const { items, notes } = req.body;
    const orderId = req.params.id;
    
    const transaction = db.transaction(() => {
      // Create receipt record
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
      
      // Get supplier ID for balance update
      const order = db.prepare("SELECT supplier_id FROM purchase_orders WHERE id = ?").get(orderId) as any;

      for (const item of items) {
        if (item.received_quantity > 0) {
          insertReceiptItem.run(receiptId, item.part_id, item.received_quantity);
          updateOrderItem.run(item.received_quantity, orderId, item.part_id);
          
          // Get unit price from order item
          const orderItem = db.prepare("SELECT unit_price FROM purchase_order_items WHERE purchase_order_id = ? AND part_id = ?").get(orderId, item.part_id) as any;
          const unitPrice = orderItem?.unit_price || 0;

          const part = db.prepare("SELECT quantity FROM parts WHERE id = ?").get(item.part_id);
          const newBalance = part.quantity + item.received_quantity;
          
          // Update stock and cost price
          updateStock.run(
            item.received_quantity, 
            unitPrice, 
            unitPrice, // last_purchase_price
            item.selling_price || 0, 
            item.margin_percent || 0, 
            item.part_id
          );
          
          // Update supplier balance
          if (order) {
            updateSupplierBalance.run(item.received_quantity * unitPrice, order.supplier_id);
          }
          
          insertMovement.run(item.part_id, item.received_quantity, newBalance, orderId, `استلام من طلب شراء #${orderId}`);
        }
      }
      
      // Update order status
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
      
      return receiptId;
    });
    
    try {
      transaction();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // --- Purchase Returns ---
  app.get("/api/purchase-returns", (req, res) => {
    try {
      const returns = db.prepare(`
        SELECT pr.*, s.supplier_name 
        FROM purchase_returns pr
        LEFT JOIN suppliers s ON pr.supplier_id = s.id
        ORDER BY pr.return_date DESC
      `).all();
      res.json(returns);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/purchase-returns", (req, res) => {
    const { supplier_id, items, notes } = req.body;
    try {
      const transaction = db.transaction(() => {
        let totalAmount = 0;
        
        // 1. Create return record
        const returnInfo = db.prepare(`
          INSERT INTO purchase_returns (supplier_id, notes)
          VALUES (?, ?)
        `).run(supplier_id, notes);
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

        // Update total amount in return record
        db.prepare("UPDATE purchase_returns SET total_amount = ? WHERE id = ?").run(totalAmount, returnId);

        // Update supplier balance (decrease debt)
        db.prepare("UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?").run(totalAmount, supplier_id);

        return returnId;
      });

      const id = transaction();
      res.json({ success: true, id });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // --- Cashbox & Bank ---
  app.get("/api/cashbox/balance", (req, res) => {
    try {
      const result = db.prepare("SELECT SUM(amount) as balance FROM cashbox_movements").get() as { balance: number };
      res.json({ balance: result.balance || 0 });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/cashbox/movements", (req, res) => {
    try {
      const movements = db.prepare("SELECT * FROM cashbox_movements ORDER BY movement_date DESC LIMIT 100").all();
      res.json(movements);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/cashbox/movements", (req, res) => {
    const { type, amount, note, reference_id, reference_type } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO cashbox_movements (type, amount, note, reference_id, reference_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(type, amount, note, reference_id || null, reference_type || 'manual');
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/bank-accounts", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM bank_accounts").all());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/bank-accounts", (req, res) => {
    const { account_name, bank_name, account_number, current_balance, notes } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO bank_accounts (account_name, bank_name, account_number, current_balance, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(account_name, bank_name, account_number, current_balance || 0, notes);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/financial-center/summary", (req, res) => {
    try {
      const cashBalance = (db.prepare("SELECT SUM(amount) as balance FROM cashbox_movements").get() as any).balance || 0;
      const bankBalance = (db.prepare("SELECT SUM(current_balance) as balance FROM bank_accounts").get() as any).balance || 0;
      const customerDebts = (db.prepare("SELECT SUM(current_balance) as balance FROM customers").get() as any).balance || 0;
      const supplierDebts = (db.prepare("SELECT SUM(current_balance) as balance FROM suppliers").get() as any).balance || 0;
      const inventoryValue = (db.prepare("SELECT SUM(quantity * cost_price) as value FROM parts").get() as any).value || 0;

      res.json({
        cash_balance: cashBalance,
        bank_balance: bankBalance,
        available_cash: cashBalance + bankBalance,
        customer_debts: customerDebts,
        supplier_debts: supplierDebts,
        inventory_value: inventoryValue,
        net_worth: (cashBalance + bankBalance + customerDebts + inventoryValue) - supplierDebts
      });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // --- Users & Auth ---
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    try {
      const user = db.prepare(`
        SELECT u.*, r.name as role_name, r.label_ar as role_label
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.username = ? AND u.status = 'active'
      `).get(username) as any;

      if (user && bcrypt.compareSync(password, user.password)) {
        const permissions = db.prepare(`
          SELECT p.name 
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ?
        `).all(user.role_id).map((p: any) => p.name);

        res.json({ success: true, user: { ...user, permissions } });
      } else {
        res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/settings", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM settings").all();
      const settings: Record<string, string> = {};
      rows.forEach((row: any) => {
        settings[row.key] = row.value;
      });
      res.json(settings);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    try {
      const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
      const transaction = db.transaction(() => {
        for (const [key, value] of Object.entries(settings)) {
          upsert.run(key, String(value));
        }
      });
      transaction();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/top-selling", (req, res) => {
    try {
      const topParts = db.prepare(`
        SELECT p.part_name_ar as name, p.oem_number, SUM(ii.quantity) as total_quantity, SUM(ii.quantity * ii.unit_price) as total_revenue
        FROM invoice_items ii
        JOIN parts p ON ii.part_id = p.id
        GROUP BY p.id
        ORDER BY total_quantity DESC
        LIMIT 10
      `).all();
      res.json(topParts);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/customer-debts", (req, res) => {
    try {
      const debts = db.prepare(`
        SELECT name, phone, current_balance as debt
        FROM customers
        WHERE current_balance > 0
        ORDER BY current_balance DESC
      `).all();
      res.json(debts);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/reports/recent-activity", (req, res) => {
    try {
      const activity = db.prepare(`
        SELECT i.id, i.date, i.total_amount, c.name as customer_name, i.payment_type
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY i.date DESC
        LIMIT 10
      `).all();
      res.json(activity);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Management Endpoints
  app.post("/api/categories", (req, res) => {
    const { name, icon_name, color } = req.body;
    try {
      const info = db.prepare("INSERT INTO categories (name, icon_name, color) VALUES (?, ?, ?)").run(name, icon_name, color);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      const hasParts = db.prepare("SELECT COUNT(*) as count FROM parts WHERE category_id = ?").get(categoryId) as any;
      
      if (hasParts && hasParts.count > 0) {
        return res.status(400).json({ error: `لا يمكن حذف القسم لوجود ${hasParts.count} أصناف مرتبطة به` });
      }
      
      db.prepare("DELETE FROM categories WHERE id = ?").run(categoryId);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/brands", (req, res) => {
    const { name, name_en, logo_url } = req.body;
    try {
      const info = db.prepare("INSERT INTO brands (name, name_en, logo_url) VALUES (?, ?, ?)").run(name, name_en, logo_url);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/models", (req, res) => {
    const { brand_id, name, name_en } = req.body;
    try {
      const info = db.prepare("INSERT INTO models (brand_id, name, name_en) VALUES (?, ?, ?)").run(brand_id, name, name_en);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Global error handler for API routes
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

console.log("Calling startServer()...");
startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
