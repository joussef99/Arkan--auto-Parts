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

export const getSubscription = (req: Request, res: Response) => {
  try {
    const data = settingsService.getSubscription();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const extendSubscription = (req: Request, res: Response) => {
  const days = Number(req.body?.days || 30);
  const password = String(req.body?.password || "");
  if (!settingsService.verifyControllerPassword(password)) {
    res
      .status(403)
      .json({ success: false, error: "كلمة مرور التحكم غير صحيحة" });
    return;
  }
  const result = settingsService.extendSubscription(days);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
};

export const changeSubscriptionControllerPassword = (
  req: Request,
  res: Response,
) => {
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  const result = settingsService.changeControllerPassword(
    currentPassword,
    newPassword,
  );
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
};

export const resetSubscription = (req: Request, res: Response) => {
  const password = String(req.body?.password || "");
  if (!settingsService.verifyControllerPassword(password)) {
    res
      .status(403)
      .json({ success: false, error: "كلمة مرور التحكم غير صحيحة" });
    return;
  }
  const result = settingsService.resetSubscription();
  if (result.success) {
    res.json({
      success: true,
      message: "تم إنهاء الاشتراك فوراً. يرجى تجديد الاشتراك لفترة جديدة.",
    });
  } else {
    res.status(500).json({ success: false, error: result.error });
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
