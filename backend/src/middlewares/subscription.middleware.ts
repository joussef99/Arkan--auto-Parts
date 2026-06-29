import { Request, Response, NextFunction } from "express";
import { getDatabase } from "../config/db.js";

const EXPIRED_ALLOWLIST = new Set([
  "/login",
  "/settings/subscription/status",
  "/settings/subscription/extend",
]);

function isDateExpiredUtc(endDateValue: string | null | undefined): boolean {
  if (!endDateValue) return false;
  const todayUtc = new Date().toISOString().slice(0, 10);
  return endDateValue < todayUtc;
}

export function enforceSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const normalizedPath = req.path.startsWith("/api")
    ? req.path.slice(4)
    : req.path;

  if (EXPIRED_ALLOWLIST.has(normalizedPath)) {
    next();
    return;
  }

  const db = getDatabase();
  const lockSetting = db
    .prepare(
      "SELECT value FROM settings WHERE key = 'subscription_lock_enabled'",
    )
    .get() as { value?: string } | undefined;

  if (lockSetting?.value === "0") {
    next();
    return;
  }

  const row = db
    .prepare("SELECT * FROM subscription_control WHERE id = 1")
    .get() as any;
  if (!row) {
    next();
    return;
  }

  const isExpired =
    row.is_active === 0 || isDateExpiredUtc(row.subscription_end_date);
  if (isExpired) {
    res.status(402).json({
      success: false,
      error: "Subscription expired",
      code: "SUBSCRIPTION_EXPIRED",
      data: {
        subscriptionStartDate: row.subscription_start_date,
        subscriptionEndDate: row.subscription_end_date,
      },
    });
    return;
  }
  next();
}
