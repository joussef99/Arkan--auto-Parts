import { getDatabase } from "../config/db.js";
import { hashPassword, verifyPassword } from "../middlewares/auth.middleware.js";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserData {
  id?: number;
  username: string;
  display_name: string;
  password?: string;
  role_id: number;
  status?: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    display_name: string;
    role_id: number;
    role_name: string;
    role_label: string;
    permissions: string[];
  };
  error?: string;
}

class AuthService {
  login(credentials: LoginCredentials): AuthResult {
    const db = getDatabase();
    const { username, password } = credentials;

    try {
      const user = db.prepare(`
        SELECT u.*, r.name as role_name, r.label_ar as role_label
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.username = ? AND u.status = 'active'
      `).get(username) as any;

      if (!user) {
        return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
      }

      if (!verifyPassword(password, user.password)) {
        return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
      }

      const permissions = db.prepare(`
        SELECT p.name 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `).all(user.role_id).map((p: any) => p.name);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role_id: user.role_id,
          role_name: user.role_name,
          role_label: user.role_label,
          permissions,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  createUser(userData: UserData): { success: boolean; id?: number; error?: string } {
    const db = getDatabase();
    const { username, display_name, password, role_id } = userData;

    try {
      const hashedPassword = hashPassword(password || "password");
      const info = db.prepare(`
        INSERT INTO users (username, display_name, password, role_id)
        VALUES (?, ?, ?, ?)
      `).run(username, display_name, hashedPassword, role_id);

      return { success: true, id: info.lastInsertRowid as number };
    } catch (error) {
      console.error("Create user error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  getAllUsers(): any[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT u.id, u.username, u.display_name, u.status, r.name as role_name, r.label_ar as role_label
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `).all();
  }

  updateUser(id: number, userData: Partial<UserData>): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (userData.username) {
        updates.push("username = ?");
        values.push(userData.username);
      }
      if (userData.display_name) {
        updates.push("display_name = ?");
        values.push(userData.display_name);
      }
      if (userData.password) {
        updates.push("password = ?");
        values.push(hashPassword(userData.password));
      }
      if (userData.role_id) {
        updates.push("role_id = ?");
        values.push(userData.role_id);
      }
      if (userData.status) {
        updates.push("status = ?");
        values.push(userData.status);
      }

      if (updates.length === 0) {
        return { success: false, error: "No fields to update" };
      }

      values.push(id);
      db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  deleteUser(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new AuthService();