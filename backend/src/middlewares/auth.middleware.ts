import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { getDatabase } from "../config/db.js";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    display_name: string;
    role_id: number;
    role_name: string;
    role_label: string;
    permissions: string[];
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: "No authorization header provided" });
    return;
  }

  try {
    const db = getDatabase();
    const user = db.prepare(`
      SELECT u.*, r.name as role_name, r.label_ar as role_label
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ? AND u.status = 'active'
    `).get(authHeader) as any;

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const permissions = db.prepare(`
      SELECT p.name 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).all(user.role_id).map((p: any) => p.name);

    req.user = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role_id: user.role_id,
      role_name: user.role_name,
      role_label: user.role_label,
      permissions,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }

    next();
  };
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}