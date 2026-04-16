import { Request, Response } from "express";
import customerService from "../services/customer.service.js";

export const getCustomers = (req: Request, res: Response) => {
  try {
    const { q, filter } = req.query;
    const customers = customerService.getAllCustomers({
      q: q as string,
      filter: filter as string,
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getCustomer = (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const customer = customerService.getCustomerById(id);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createCustomer = (req: Request, res: Response) => {
  const { id, name, phone, alt_phone, area, customer_type, credit_limit, notes } = req.body;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  if (id) {
    const result = customerService.updateCustomer(parseInt(id), {
      name,
      phone,
      alt_phone,
      area,
      customer_type,
      credit_limit: credit_limit ? parseFloat(credit_limit) : undefined,
      notes,
    });
    if (result.success) {
      res.json({ success: true, id: parseInt(id) });
    } else {
      res.status(500).json({ error: result.error });
    }
  } else {
    const result = customerService.createCustomer({
      name,
      phone,
      alt_phone,
      area,
      customer_type,
      credit_limit: credit_limit ? parseFloat(credit_limit) : undefined,
      notes,
    });
    if (result.success) {
      res.json({ success: true, id: result.id });
    } else {
      res.status(500).json({ error: result.error });
    }
  }
};

export const deleteCustomer = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = customerService.deleteCustomer(id);

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: result.error });
  }
};

export const getCustomerInvoices = (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const invoices = customerService.getCustomerInvoices(id);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getCustomerPayments = (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payments = customerService.getCustomerPayments(id);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getCustomerStatement = (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const statement = customerService.getCustomerStatement(id);
    res.json(statement);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createPayment = (req: Request, res: Response) => {
  const { customer_id, amount, note, reference_invoice_id } = req.body;

  if (!customer_id || !amount) {
    res.status(400).json({ error: "customer_id and amount are required" });
    return;
  }

  const result = customerService.createPayment(
    parseInt(customer_id),
    parseFloat(amount),
    note,
    reference_invoice_id ? parseInt(reference_invoice_id) : undefined
  );

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};