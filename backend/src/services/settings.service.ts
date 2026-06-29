import { getDatabase } from "../config/db.js";
import bcrypt from "bcryptjs";

class SettingsService {
  getAllSettings(): Record<string, string> {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM settings").all() as any[];
    const settings: Record<string, string> = {};
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  updateSettings(settings: Record<string, any>): {
    success: boolean;
    error?: string;
  } {
    const db = getDatabase();
    try {
      const upsert = db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      );
      const transaction = db.transaction(() => {
        for (const [key, value] of Object.entries(settings)) {
          upsert.run(key, String(value));
        }
      });
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  getSetting(key: string): string | null {
    const db = getDatabase();
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row?.value || null;
  }

  setSetting(key: string, value: string): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      ).run(key, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  getSubscription(): any {
    const db = getDatabase();
    return db.prepare("SELECT * FROM subscription_control WHERE id = 1").get();
  }

  extendSubscription(days: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const subscription = this.getSubscription() as
        | { subscription_end_date?: string | null }
        | undefined;
      const today = new Date().toISOString().slice(0, 10);
      const currentEnd = subscription?.subscription_end_date || null;
      const baseline = currentEnd && currentEnd >= today ? currentEnd : today;

      db.prepare(
        `
        UPDATE subscription_control
        SET subscription_end_date = date(?, ?),
            is_active = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `,
      ).run(baseline, `+${Math.max(1, days)} day`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  resetSubscription(): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      db.prepare(
        `
        UPDATE subscription_control
        SET subscription_start_date = date('now'),
            subscription_end_date = date('now'),
            is_active = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `,
      ).run();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private getControllerPasswordHash(): string | null {
    return this.getSetting("subscription_controller_password_hash");
  }

  verifyControllerPassword(password: string): boolean {
    const hash = this.getControllerPasswordHash();
    if (!hash || !password) return false;
    return bcrypt.compareSync(password, hash);
  }

  changeControllerPassword(
    currentPassword: string,
    newPassword: string,
  ): { success: boolean; error?: string } {
    if (!this.verifyControllerPassword(currentPassword)) {
      return { success: false, error: "كلمة المرور الحالية غير صحيحة" };
    }
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل",
      };
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    return this.setSetting("subscription_controller_password_hash", hash);
  }
}

export default new SettingsService();
