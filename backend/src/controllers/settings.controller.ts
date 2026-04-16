import { Request, Response } from "express";
import settingsService from "../services/settings.service.js";

export const getSettings = (req: Request, res: Response) => {
  try {
    const settings = settingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateSettings = (req: Request, res: Response) => {
  const settings = req.body;
  const result = settingsService.updateSettings(settings);

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const getSetting = (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const value = settingsService.getSetting(key);
    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const setSetting = (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;
  const result = settingsService.setSetting(key, value);

  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
};