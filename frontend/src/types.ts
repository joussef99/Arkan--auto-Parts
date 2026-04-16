export interface Brand {
  id: number;
  name: string;
  name_en?: string;
  logo_url?: string;
}

export interface Model {
  id: number;
  brand_id: number;
  name: string;
  name_en?: string;
  image_url?: string;
}

export interface YearRange {
  id: number;
  label: string;
  start_year: number;
  end_year: number;
}

export interface Category {
  id: number;
  name: string;
  icon_name: string;
  color: string;
}

export interface Part {
  id: number;
  part_name_ar: string;
  oem_number: string;
  barcode: string;
  brand_id: number;
  brand_name: string;
  model_id: number;
  model_name: string;
  category_id: number;
  category_name: string;
  year_range_id?: number;
  year_range_label?: string;
  shelf_location_id: string;
  selling_price: number;
  cost_price: number;
  last_purchase_price?: number;
  margin_percent?: number;
  price_updated_at?: string;
  quantity: number;
  min_stock_level: number;
  supplier_name?: string;
  manufacturer_code?: string;
  notes?: string;
  keywords?: string;
  image_path?: string;
}

export interface InvoiceItem extends Part {
  quantity: number;
  discount: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  alt_phone?: string;
  area?: string;
  customer_type: 'walk-in' | 'workshop' | 'trader' | 'company';
  credit_limit: number;
  current_balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  stats?: {
    total_invoices: number;
    total_purchases: number;
    total_paid: number;
    last_transaction: string | null;
  };
}

export interface Supplier {
  id: number;
  supplier_name: string;
  phone: string;
  company_name?: string;
  address?: string;
  opening_balance: number;
  current_balance: number;
  notes?: string;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier_name?: string;
  order_date: string;
  status: 'draft' | 'ordered' | 'partial' | 'completed' | 'cancelled';
  warehouse_id?: number;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  part_id: number;
  part_name_ar?: string;
  oem_number?: string;
  ordered_quantity: number;
  received_quantity: number;
  unit_price: number;
  manufacturer_code?: string;
  notes?: string;
}

export interface Payment {
  id: number;
  customer_id: number;
  payment_date: string;
  amount: number;
  note?: string;
  reference_invoice_id?: number;
}

export interface StatementEntry {
  id: number;
  timestamp: string;
  amount: number;
  type: 'invoice' | 'payment';
  ref_id: number;
}

export interface StockMovement {
  id: number;
  part_id: number;
  part_name: string;
  oem_number: string;
  type: 'opening' | 'addition' | 'sale' | 'adjustment' | 'audit';
  quantity: number;
  balance_after: number;
  reference_id?: number;
  note?: string;
  created_at: string;
}
