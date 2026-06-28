import { Request, Response, NextFunction } from "express";
import { getDatabase } from "../config/db.js";

// password = arkan-control
export function enforceSubscription(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.startsWith("/api")) {
    next();
    return;
  }

  if (req.path === "/api/login" || req.path.startsWith("/api/settings/subscription")) {
    next();
    return;
  }

  const db = getDatabase();
  const row = db.prepare("SELECT * FROM subscription_control WHERE id = 1").get() as any;
  if (!row) {
    next();
    return;
  }

  const endDate = row.subscription_end_date ? new Date(row.subscription_end_date) : null;
  const now = new Date();
  const isExpired = row.is_active === 0 || (endDate !== null && endDate.getTime() < now.getTime());
  if (isExpired) {
    res.status(402).json({
      success: false,
      error: "Subscription expired",
      code: "SUBSCRIPTION_EXPIRED",
      data: {
        subscriptionStartDate: row.subscription_start_date,
        subscriptionEndDate: row.subscription_end_date
      }
    });
    return;
  }
  next();
}
