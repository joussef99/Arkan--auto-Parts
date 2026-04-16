import { Request, Response } from "express";
import invoiceService from "../services/invoice.service.js";

export const getInvoices = (req: Request, res: Response) => {
  try {
    const invoices = invoiceService.getAllInvoices();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getInvoice = (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const invoice = invoiceService.getInvoiceById(id);
    if (!invoice) {
      res.status(404).json({ error: "الفاتورة غير موجودة" });
      return;
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createInvoice = (req: Request, res: Response) => {
  const { customer_id, items, payment_type, discount, total_amount, paid_amount } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Items are required" });
    return;
  }

  if (!total_amount) {
    res.status(400).json({ error: "Total amount is required" });
    return;
  }

  const result = invoiceService.createInvoice({
    customer_id: customer_id ? parseInt(customer_id) : undefined,
    items: items.map((item: any) => ({
      id: parseInt(item.id),
      quantity: parseInt(item.quantity),
      selling_price: parseFloat(item.selling_price),
      discount: item.discount ? parseFloat(item.discount) : 0,
    })),
    payment_type: payment_type || 'cash',
    discount: discount ? parseFloat(discount) : 0,
    total_amount: parseFloat(total_amount),
    paid_amount: paid_amount ? parseFloat(paid_amount) : undefined,
  });

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const deleteInvoice = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = invoiceService.deleteInvoice(id);

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
};