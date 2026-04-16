import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

let db: Database.Database;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export function initDatabase(): Database.Database {
  if (db) {
    return db;
  }

  console.log("Starting database initialization...");
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
      discount REAL DEFAULT 0,
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
      status TEXT DEFAULT 'draft',
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
      payment_method TEXT,
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
      type TEXT,
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
      type TEXT,
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
      payment_source TEXT,
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

  runMigrations(db);
  seedData(db);

  return db;
}

function runMigrations(database: Database.Database): void {
  // Migration: Ensure new columns exist in parts table
  const partsTableInfo = database.prepare("PRAGMA table_info(parts)").all() as any[];
  if (partsTableInfo.length > 0) {
    const columnNames = partsTableInfo.map(c => c.name);
    
    if (columnNames.includes("name") && !columnNames.includes("part_name_ar")) {
      database.exec("ALTER TABLE parts RENAME COLUMN name TO part_name_ar");
    }
    if (columnNames.includes("stock_quantity") && !columnNames.includes("quantity")) {
      database.exec("ALTER TABLE parts RENAME COLUMN stock_quantity TO quantity");
    }
    if (columnNames.includes("shelf_location") && !columnNames.includes("shelf_location_id")) {
      database.exec("ALTER TABLE parts RENAME COLUMN shelf_location TO shelf_location_id");
    }
    if (columnNames.includes("image_url") && !columnNames.includes("image_path")) {
      database.exec("ALTER TABLE parts RENAME COLUMN image_url TO image_path");
    }

    const updatedPartsTableInfo = database.prepare("PRAGMA table_info(parts)").all() as any[];
    const updatedColumnNames = updatedPartsTableInfo.map(c => c.name);

    if (!updatedColumnNames.includes("manufacturer_code")) {
      database.exec("ALTER TABLE parts ADD COLUMN manufacturer_code TEXT");
    }
    if (!updatedColumnNames.includes("last_purchase_price")) {
      database.exec("ALTER TABLE parts ADD COLUMN last_purchase_price REAL DEFAULT 0");
    }
    if (!updatedColumnNames.includes("margin_percent")) {
      database.exec("ALTER TABLE parts ADD COLUMN margin_percent REAL DEFAULT 0");
    }
    if (!updatedColumnNames.includes("price_updated_at")) {
      database.exec("ALTER TABLE parts ADD COLUMN price_updated_at TEXT");
    }
    if (!updatedColumnNames.includes("notes")) {
      database.exec("ALTER TABLE parts ADD COLUMN notes TEXT");
    }
    if (!updatedColumnNames.includes("keywords")) {
      database.exec("ALTER TABLE parts ADD COLUMN keywords TEXT");
    }
    if (!updatedColumnNames.includes("cost_price")) {
      database.exec("ALTER TABLE parts ADD COLUMN cost_price REAL DEFAULT 0");
    }
    if (!updatedColumnNames.includes("created_at")) {
      database.exec("ALTER TABLE parts ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }
    if (!updatedColumnNames.includes("updated_at")) {
      database.exec("ALTER TABLE parts ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }
  }

  // Migration for stock_movements
  const smTableInfo = database.prepare("PRAGMA table_info(stock_movements)").all() as any[];
  if (smTableInfo.length > 0) {
    const smColumnNames = smTableInfo.map(c => c.name);
    if (smColumnNames.includes("type") && !smColumnNames.includes("movement_type")) {
      database.exec("ALTER TABLE stock_movements RENAME COLUMN type TO movement_type");
    }
    if (smColumnNames.includes("created_at") && !smColumnNames.includes("movement_date")) {
      database.exec("ALTER TABLE stock_movements RENAME COLUMN created_at TO movement_date");
    }
    if (!smColumnNames.includes("reference_type")) {
      database.exec("ALTER TABLE stock_movements ADD COLUMN reference_type TEXT");
    }
  }

  // Migration for suppliers
  const suppliersTableInfo = database.prepare("PRAGMA table_info(suppliers)").all() as any[];
  if (suppliersTableInfo.length > 0) {
    const columnNames = suppliersTableInfo.map(c => c.name);
    if (columnNames.includes("name") && !columnNames.includes("supplier_name")) {
      database.exec("ALTER TABLE suppliers RENAME COLUMN name TO supplier_name");
    }
    if (columnNames.includes("company") && !columnNames.includes("company_name")) {
      database.exec("ALTER TABLE suppliers RENAME COLUMN company TO company_name");
    }
    if (columnNames.includes("balance") && !columnNames.includes("current_balance")) {
      database.exec("ALTER TABLE suppliers RENAME COLUMN balance TO current_balance");
    }
    
    const updatedSuppliersInfo = database.prepare("PRAGMA table_info(suppliers)").all() as any[];
    const updatedColNames = updatedSuppliersInfo.map(c => c.name);
    
    if (!updatedColNames.includes("opening_balance")) {
      database.exec("ALTER TABLE suppliers ADD COLUMN opening_balance REAL DEFAULT 0");
    }
    if (!updatedColNames.includes("current_balance")) {
      database.exec("ALTER TABLE suppliers ADD COLUMN current_balance REAL DEFAULT 0");
    }
    if (!updatedColNames.includes("company_name")) {
      database.exec("ALTER TABLE suppliers ADD COLUMN company_name TEXT");
    }
    if (!updatedColNames.includes("address")) {
      database.exec("ALTER TABLE suppliers ADD COLUMN address TEXT");
    }
    if (!updatedColNames.includes("notes")) {
      database.exec("ALTER TABLE suppliers ADD COLUMN notes TEXT");
    }
    if (!updatedColNames.includes("is_active")) {
      database.exec("ALTER TABLE suppliers ADD COLUMN is_active INTEGER DEFAULT 1");
    }
    if (!updatedColNames.includes("updated_at")) {
      database.exec("ALTER TABLE suppliers ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }
  }

  // Migration for customers
  const customersTableInfo = database.prepare("PRAGMA table_info(customers)").all() as any[];
  if (customersTableInfo.length > 0) {
    const columnNames = customersTableInfo.map(c => c.name);
    if (columnNames.includes("balance") && !columnNames.includes("current_balance")) {
      database.exec("ALTER TABLE customers RENAME COLUMN balance TO current_balance");
    }
    
    const updatedCustomersInfo = database.prepare("PRAGMA table_info(customers)").all() as any[];
    const updatedColNames = updatedCustomersInfo.map(c => c.name);
    
    if (!updatedColNames.includes("current_balance")) {
      database.exec("ALTER TABLE customers ADD COLUMN current_balance REAL DEFAULT 0");
    }
    if (!updatedColNames.includes("customer_type")) {
      database.exec("ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'walk-in'");
    }
    if (!updatedColNames.includes("credit_limit")) {
      database.exec("ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0");
    }
    if (!updatedColNames.includes("updated_at")) {
      database.exec("ALTER TABLE customers ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }
  }

  // Migration for categories
  const categoriesTableInfo = database.prepare("PRAGMA table_info(categories)").all() as any[];
  if (categoriesTableInfo.length > 0) {
    const columnNames = categoriesTableInfo.map(c => c.name);
    if (!columnNames.includes("default_margin")) {
      database.exec("ALTER TABLE categories ADD COLUMN default_margin REAL DEFAULT 0");
    }
  }

  // Migration for invoices payment_type constraint
  try {
    const tableSql = database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='invoices'").get() as any;
    if (tableSql && tableSql.sql.includes("CHECK(payment_type IN ('cash', 'credit'))")) {
      console.log("Migrating invoices table to allow 'transfer' payment_type...");
      database.exec("PRAGMA foreign_keys=off;");
      database.exec("BEGIN TRANSACTION;");
      database.exec(`CREATE TABLE invoices_new (
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
      database.exec("INSERT INTO invoices_new SELECT * FROM invoices;");
      database.exec("DROP TABLE invoices;");
      database.exec("ALTER TABLE invoices_new RENAME TO invoices;");
      database.exec("COMMIT;");
      database.exec("PRAGMA foreign_keys=on;");
    }
  } catch (err) {
    console.error("Error migrating invoices table:", err);
    try {
      database.exec("ROLLBACK;");
    } catch (e) {}
    database.exec("PRAGMA foreign_keys=on;");
  }

  try {
    const tableInfo = database.prepare("PRAGMA table_info(invoice_items)").all() as any[];
    if (!tableInfo.some(col => col.name === 'discount')) {
      database.exec("ALTER TABLE invoice_items ADD COLUMN discount REAL DEFAULT 0");
    }
  } catch (err) {
    console.error("Error adding discount to invoice_items:", err);
  }
}

function seedData(database: Database.Database): void {
  try {
    const categoriesCount = database.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
    if (categoriesCount.count === 0) {
      const insertCat = database.prepare("INSERT INTO categories (name, icon_name, color) VALUES (?, ?, ?)");
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
      const engineCat = database.prepare("SELECT * FROM categories WHERE name = ?").get("المحرك");
      if (!engineCat) {
        database.prepare("INSERT INTO categories (name, icon_name, color) VALUES (?, ?, ?)").run("المحرك", "Cpu", "emerald");
      }
    }

    const settingsCount = database.prepare("SELECT count(*) as count FROM settings").get() as { count: number };
    if (settingsCount.count === 0) {
      const insertSetting = database.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
      insertSetting.run("shop_name", "أركان لقطع الغيار");
      insertSetting.run("shop_phone", "0912345678");
      insertSetting.run("shop_address", "طرابلس، ليبيا");
      insertSetting.run("invoice_prefix", "ARK");
      insertSetting.run("currency", "د.ل");
      insertSetting.run("min_stock_alert", "5");
    }

    const brandCount = database.prepare("SELECT count(*) as count FROM brands").get() as { count: number };
    if (brandCount.count === 0) {
      const insertBrand = database.prepare("INSERT INTO brands (name, name_en, logo_url) VALUES (?, ?, ?)");
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

      const insertModel = database.prepare("INSERT INTO models (brand_id, name, name_en) VALUES (?, ?, ?)");
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

      const insertYear = database.prepare("INSERT INTO year_ranges (label, start_year, end_year) VALUES (?, ?, ?)");
      insertYear.run("2008–2011", 2008, 2011);
      insertYear.run("2012–2015", 2012, 2015);
      insertYear.run("2016–2019", 2016, 2019);
      insertYear.run("2020+", 2020, 2026);

      const insertPart = database.prepare(`
        INSERT INTO parts (part_name_ar, oem_number, brand_id, model_id, year_range_id, category_id, shelf_location_id, selling_price, quantity, image_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertPart.run("فلتر زيت", "90915-10001", 1, 1, 2, 1, "A-12", 25, 50, "https://picsum.photos/seed/oilfilter/200/200");
      insertPart.run("فحمات فرامل أمامية", "58101-1RA00", 2, 5, 3, 5, "B-05", 120, 15, "https://picsum.photos/seed/brakepads/200/200");
      insertPart.run("رادياتير مياه", "16400-21160", 1, 1, 2, 1, "C-01", 450, 8, "https://picsum.photos/seed/radiator/200/200");

      const insertCustomer = database.prepare("INSERT INTO customers (name, phone, current_balance) VALUES (?, ?, ?)");
      insertCustomer.run("أحمد محمد", "0912345678", 150);
      insertCustomer.run("سالم علي", "0923456789", 0);
      insertCustomer.run("محمود خالد", "0911112222", 450);
    }

    // Seed roles and permissions
    const rolesCount = database.prepare("SELECT count(*) as count FROM roles").get() as { count: number };
    if (rolesCount.count === 0) {
      const insertRole = database.prepare("INSERT INTO roles (name, label_ar) VALUES (?, ?)");
      insertRole.run("owner", "صاحب النشاط");
      insertRole.run("salesperson", "البائع");
      insertRole.run("accountant", "المحاسب");
      insertRole.run("purchasing", "مسؤول المشتريات");

      const insertPermission = database.prepare("INSERT INTO permissions (name, label_ar, module) VALUES (?, ?, ?)");
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

      const allPermissions = database.prepare("SELECT id FROM permissions").all() as { id: number }[];
      const ownerRole = database.prepare("SELECT id FROM roles WHERE name = 'owner'").get() as { id: number };
      const insertRolePermission = database.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
      allPermissions.forEach(p => insertRolePermission.run(ownerRole.id, p.id));

      const hashedArkanPassword = bcrypt.hashSync("arkan", 10);
      database.prepare("INSERT INTO users (username, display_name, password, role_id) VALUES (?, ?, ?, ?)")
        .run("arkan", "المدير العام", hashedArkanPassword, ownerRole.id);
    }

    // Ensure arkan user exists with arkan password
    const ownerRole = database.prepare("SELECT id FROM roles WHERE name = 'owner'").get() as { id: number };
    if (ownerRole) {
      const arkanUser = database.prepare("SELECT id FROM users WHERE username = 'arkan'").get() as any;
      const hashedArkanPassword = bcrypt.hashSync("arkan", 10);
      
      if (!arkanUser) {
        const adminUser = database.prepare("SELECT id FROM users WHERE username = 'admin'").get() as any;
        if (adminUser) {
          database.prepare("UPDATE users SET username = 'arkan', password = ? WHERE id = ?").run(hashedArkanPassword, adminUser.id);
          console.log("Updated admin user to arkan");
        } else {
          database.prepare("INSERT INTO users (username, display_name, password, role_id) VALUES (?, ?, ?, ?)")
            .run("arkan", "المدير العام", hashedArkanPassword, ownerRole.id);
          console.log("Created arkan user");
        }
      } else {
        database.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedArkanPassword, arkanUser.id);
        console.log("Updated arkan user password");
      }
    }
    
    // Migrate existing plain text passwords
    const users = database.prepare("SELECT id, password FROM users").all() as any[];
    for (const user of users) {
      if (!user.password.startsWith("$2a$")) {
        const hashed = bcrypt.hashSync(user.password, 10);
        database.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, user.id);
        console.log("Migrated password for user", user.id);
      }
    }
  } catch (e) {
    console.error("Error seeding data:", e);
  }
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export default { getDatabase: getDb };