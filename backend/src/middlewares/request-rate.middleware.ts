import { NextFunction, Request, Response } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function resolveClientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    return xff.split(",")[0].trim();
  }
  return req.ip || "unknown";
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}) {
  const { windowMs, maxRequests } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${resolveClientIp(req)}:${req.path}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: "Too many requests",
        code: "RATE_LIMITED",
      });
      return;
    }

    next();
  };
}
