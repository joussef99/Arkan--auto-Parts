import { Request, Response } from "express";
import productsService from "../services/products.service.js";

export const getParts = (req: Request, res: Response) => {
  try {
    const { q, brand, model, year, category, availability } = req.query;
    const parts = productsService.getAllParts({
      q: q as string,
      brand: brand as string,
      model: model as string,
      year: year as string,
      category: category as string,
      availability: availability as string,
    });
    res.json(parts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getPart = (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const part = productsService.getPartById(id);
    if (!part) {
      res.status(404).json({ error: "Part not found" });
      return;
    }
    res.json(part);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createPart = (req: Request, res: Response) => {
  const { 
    part_name_ar, oem_number, barcode, brand_id, model_id, year_range_id, 
    category_id, shelf_location_id, cost_price, selling_price, 
    quantity, keywords, notes, manufacturer_code, image_path 
  } = req.body;

  const result = productsService.createPart({
    part_name_ar,
    oem_number,
    barcode,
    brand_id: brand_id ? parseInt(brand_id) : undefined,
    model_id: model_id ? parseInt(model_id) : undefined,
    year_range_id: year_range_id ? parseInt(year_range_id) : undefined,
    category_id: parseInt(category_id),
    shelf_location_id,
    cost_price: cost_price ? parseFloat(cost_price) : undefined,
    selling_price: selling_price ? parseFloat(selling_price) : undefined,
    quantity: parseInt(quantity) || 0,
    keywords,
    notes,
    manufacturer_code,
    image_path,
  });

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(400).json({ error: result.error });
  }
};

export const updatePart = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { 
    part_name_ar, oem_number, barcode, brand_id, model_id, year_range_id, 
    category_id, shelf_location_id, cost_price, selling_price, 
    quantity, keywords, notes, manufacturer_code, image_path 
  } = req.body;

  const result = productsService.updatePart(id, {
    part_name_ar,
    oem_number,
    barcode,
    brand_id: brand_id ? parseInt(brand_id) : undefined,
    model_id: model_id ? parseInt(model_id) : undefined,
    year_range_id: year_range_id ? parseInt(year_range_id) : undefined,
    category_id: category_id ? parseInt(category_id) : undefined,
    shelf_location_id,
    cost_price: cost_price ? parseFloat(cost_price) : undefined,
    selling_price: selling_price ? parseFloat(selling_price) : undefined,
    quantity: quantity ? parseInt(quantity) : undefined,
    keywords,
    notes,
    manufacturer_code,
    image_path,
  });

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const deletePart = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = productsService.deletePart(id);

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: result.error });
  }
};

export const updatePartPrice = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { selling_price, margin_percent } = req.body;

  const result = productsService.updatePrice(id, parseFloat(selling_price), margin_percent ? parseFloat(margin_percent) : undefined);

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const addQuantity = (req: Request, res: Response) => {
  const { part_id, quantity, note } = req.body;
  const result = productsService.addQuantity(parseInt(part_id), parseInt(quantity), note);

  if (result.success) {
    res.json({ success: true, new_quantity: result.new_quantity });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const auditStock = (req: Request, res: Response) => {
  const { part_id, physical_quantity, note } = req.body;
  const result = productsService.auditStock(parseInt(part_id), parseInt(physical_quantity), note);

  if (result.success) {
    res.json({ success: true, new_quantity: result.new_quantity });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const stockEntry = (req: Request, res: Response) => {
  const { items } = req.body;
  const result = productsService.stockEntry(items);

  if (result.success) {
    res.json({ success: true, added: result.added, updated: result.updated });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const importParts = (req: Request, res: Response) => {
  const { items } = req.body;
  const result = productsService.importParts(items);

  if (result.success) {
    res.json({ success: true, imported: result.imported, errors: result.errors });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const getStockMovements = (req: Request, res: Response) => {
  try {
    const { part_id, type, start_date, end_date } = req.query;
    const movements = productsService.getStockMovements({
      part_id: part_id as string,
      type: type as string,
      start_date: start_date as string,
      end_date: end_date as string,
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Brand endpoints
export const getBrands = (req: Request, res: Response) => {
  try {
    const brands = productsService.getAllBrands();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createBrand = (req: Request, res: Response) => {
  const { name, name_en, logo_url } = req.body;
  const result = productsService.createBrand(name, name_en, logo_url);

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

// Model endpoints
export const getModels = (req: Request, res: Response) => {
  try {
    const { brand_id } = req.query;
    const models = productsService.getAllModels(brand_id ? parseInt(brand_id as string) : undefined);
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createModel = (req: Request, res: Response) => {
  const { brand_id, name, name_en } = req.body;
  const result = productsService.createModel(parseInt(brand_id), name, name_en);

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

// Category endpoints
export const getCategories = (req: Request, res: Response) => {
  try {
    const categories = productsService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createCategory = (req: Request, res: Response) => {
  const { name, icon_name, color } = req.body;
  const result = productsService.createCategory(name, icon_name, color);

  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const deleteCategory = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = productsService.deleteCategory(id);

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: result.error });
  }
};

// Year ranges
export const getYearRanges = (req: Request, res: Response) => {
  try {
    const yearRanges = productsService.getAllYearRanges();
    res.json(yearRanges);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};