/// <reference types="vite/client" />

declare module "*.css";

declare module "react-dom/client";

type DesktopSavePayload = {
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  data: Uint8Array;
};

type DesktopFileOpenOptions = {
  properties?: string[];
  filters?: Array<{ name: string; extensions: string[] }>;
};

type DesktopPrintResult = {
  success: boolean;
  error?: string;
};

interface DesktopAPI {
  isDesktop: boolean;
  appInfo: () => Promise<{ version: string; name: string; desktop: boolean }>;
  printCurrentWindow: (
    options?: Record<string, unknown>,
  ) => Promise<DesktopPrintResult>;
  printHtml: (payload: {
    html: string;
    options?: Record<string, unknown>;
  }) => Promise<DesktopPrintResult>;
  savePdfFromHtml: (payload: {
    html: string;
    defaultFileName?: string;
  }) => Promise<{ canceled?: boolean; filePath?: string }>;
  saveFile: (
    payload: DesktopSavePayload,
  ) => Promise<{ canceled?: boolean; filePath?: string }>;
  openFile: (
    options?: DesktopFileOpenOptions,
  ) => Promise<{
    canceled?: boolean;
    filePath?: string;
    fileName?: string;
    data?: Uint8Array;
  }>;
  openFolder: (pathToOpen: string) => Promise<{ success: boolean }>;
  openLogs: () => Promise<{ success: boolean }>;
  backupDatabase: () => Promise<{ success: boolean; backupPath?: string }>;
  restoreDatabase: () => Promise<{ canceled?: boolean; restoredFrom?: string }>;
  exportDatabase: () => Promise<{ canceled?: boolean; filePath?: string }>;
  importDatabase: () => Promise<{ canceled?: boolean; importedFrom?: string }>;
  getDesktopPaths: () => Promise<{
    userData: string;
    logs: string;
    backups: string;
    database: string;
  }>;
}

interface Window {
  desktopAPI?: DesktopAPI;
}
