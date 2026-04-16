import { Request, Response } from "express";
import supplierService from "../services/supplier.service.js";

export const getSuppliers = (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const suppliers = supplierService.getAllSuppliers({ q: q as string });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getSupplier = (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const supplier = supplierService.getSupplierById(id);
    if (!supplier) {
      res.status(404).json({ error: "المورد غير موجود" });
      return;
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createSupplier = (req: Request, res: Response) => {
  const { id, supplier_name, phone, company_name, address, notes, opening_balance } = req.body;

  if (!supplier_name || !phone) {
    res.status(400).json({ error: "اسم المورد ورقم الهاتف مطلوبان" });
    return;
  }

  if (id) {
    const result = supplierService.updateSupplier(parseInt(id), {
      supplier_name,
      phone,
      company_name,
      address,
      notes,
      opening_balance: opening_balance ? parseFloat(opening_balance) : undefined,
    });
    if (result.success) {
      res.json({ success: true, id: parseInt(id) });
    } else {
      res.status(500).json({ error: result.error });
    }
  } else {
    const result = supplierService.createSupplier({
      supplier_name,
      phone,
      company_name,
      address,
      notes,
      opening_balance: opening_balance ? parseFloat(opening_balance) : undefined,
    });
    if (result.success) {
      res.json({ success: true, id: result.id });
    } else {
      res.status(500).json({ error: result.error });
    }
  }
};

export const deleteSupplier = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = supplierService.deleteSupplier(id);

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: result.error });
  }
};

// Purchase Orders
export const getPurchaseOrders = (req: Request, res: Response) => {
  try {
    const orders = supplierService.getAllPurchaseOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getPurchaseOrder = (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const order = supplierService.getPurchaseOrderById(id);
    if (!order) {
      res.status(404).json({ error: "الطلب غير موجود" });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createPurchaseOrder = (req: Request, res: Response) => {
  const { id, order_number, supplier_id, order_date, status, warehouse_id, notes, items } = req.body;

  if (!order_number || !supplier_id || !items) {
    res.status(400).json({ error: "order_number, supplier_id, and items are required" });
    return;
  }

  const result = supplierService.createPurchaseOrder({
    id: id ? parseInt(id) : undefined,
    order_number,
    supplier_id: parseInt(supplier_id),
    order_date,
    status,
    warehouse_id: warehouse_id ? parseInt(warehouse_id) : undefined,
    notes,
    items: items.map((item: any) => ({
      part_id: parseInt(item.part_id),
      ordered_quantity: parseInt(item.ordered_quantity),
      unit_price: item.unit_price ? parseFloat(item.unit_price) : 0,
      manufacturer_code: item.manufacturer_code,
      notes: item.notes,
    })),
  });

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const receivePurchaseOrder = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { items, notes } = req.body;

  if (!items || !Array.isArray(items)) {
    res.status(400).json({ error: "items are required" });
    return;
  }

  const result = supplierService.receivePurchaseOrder(
    id,
    items.map((item: any) => ({
      part_id: parseInt(item.part_id),
      received_quantity: parseInt(item.received_quantity),
      selling_price: item.selling_price ? parseFloat(item.selling_price) : 0,
      margin_percent: item.margin_percent ? parseFloat(item.margin_percent) : 0,
    })),
    notes
  );

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
};

// Purchase Returns
export const getPurchaseReturns = (req: Request, res: Response) => {
  try {
    const returns = supplierService.getAllPurchaseReturns();
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createPurchaseReturn = (req: Request, res: Response) => {
  const { supplier_id, items, notes } = req.body;

  if (!supplier_id || !items || !Array.isArray(items)) {
    res.status(400).json({ error: "supplier_id and items are required" });
    return;
  }

  const result = supplierService.createPurchaseReturn(
    parseInt(supplier_id),
    items.map((item: any) => ({
      part_id: parseInt(item.part_id),
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price),
    })),
    notes
  );

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

// Supplier Payments
export const getSupplierPayments = (req: Request, res: Response) => {
  try {
    const { supplier_id } = req.query;
    const payments = supplierService.getAllSupplierPayments(supplier_id ? parseInt(supplier_id as string) : undefined);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createSupplierPayment = (req: Request, res: Response) => {
  const { supplier_id, amount, payment_method, bank_account_id, reference_number, notes } = req.body;

  if (!supplier_id || !amount || !payment_method) {
    res.status(400).json({ error: "supplier_id, amount, and payment_method are required" });
    return;
  }

  const result = supplierService.createSupplierPayment({
    supplier_id: parseInt(supplier_id),
    amount: parseFloat(amount),
    payment_method,
    bank_account_id: bank_account_id ? parseInt(bank_account_id) : undefined,
    reference_number,
    notes,
  });

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};