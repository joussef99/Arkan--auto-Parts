import { getDatabase } from "../config/db.js";

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

  updateSettings(settings: Record<string, any>): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
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
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value || null;
  }

  setSetting(key: string, value: string): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new SettingsService();