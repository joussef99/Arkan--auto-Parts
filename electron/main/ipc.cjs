const fs = require("fs");
const path = require("path");
const { ipcMain, dialog, shell, BrowserWindow } = require("electron");

function getTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

async function writeBinary(filePath, data) {
  const bytes = Buffer.from(data);
  await fs.promises.writeFile(filePath, bytes);
}

function registerIpc({ app, backendManager, getMainWindow }) {
  ipcMain.handle("app:info", () => ({
    version: app.getVersion(),
    name: app.getName(),
    desktop: true,
  }));

  ipcMain.handle("app:paths", () => ({
    userData: app.getPath("userData"),
    logs: backendManager.logsPath,
    backups: backendManager.backupsPath,
    database: backendManager.dbPath,
  }));

  ipcMain.handle("file:open", async (_event, options) => {
    const win = getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      ...options,
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const selectedPath = result.filePaths[0];
    const bytes = await fs.promises.readFile(selectedPath);
    return {
      canceled: false,
      filePath: selectedPath,
      fileName: path.basename(selectedPath),
      data: bytes,
    };
  });

  ipcMain.handle("file:save", async (_event, payload = {}) => {
    const win = getMainWindow();
    const { defaultPath, filters, data } = payload;

    const result = await dialog.showSaveDialog(win, {
      defaultPath,
      filters,
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    await writeBinary(result.filePath, data);
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle("shell:open-folder", async (_event, targetPath) => {
    if (!targetPath) {
      return { success: false };
    }
    await fs.promises.mkdir(targetPath, { recursive: true });
    await shell.openPath(targetPath);
    return { success: true };
  });

  ipcMain.handle("shell:open-logs", async () => {
    await fs.promises.mkdir(backendManager.logsPath, { recursive: true });
    await shell.openPath(backendManager.logsPath);
    return { success: true };
  });

  ipcMain.handle("db:backup", async () => {
    await fs.promises.mkdir(backendManager.backupsPath, { recursive: true });
    const backupName = `backup-${getTimestamp()}.db`;
    const backupPath = path.join(backendManager.backupsPath, backupName);
    await fs.promises.copyFile(backendManager.dbPath, backupPath);
    return { success: true, backupPath };
  });

  ipcMain.handle("db:export", async () => {
    const win = getMainWindow();
    const result = await dialog.showSaveDialog(win, {
      defaultPath: `arkan-database-${getTimestamp()}.db`,
      filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    await fs.promises.copyFile(backendManager.dbPath, result.filePath);
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle("db:import", async () => {
    const win = getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const sourcePath = result.filePaths[0];
    await backendManager.stop();
    await fs.promises.copyFile(sourcePath, backendManager.dbPath);
    await backendManager.start();

    return { canceled: false, importedFrom: sourcePath };
  });

  ipcMain.handle("db:restore", async () => {
    const win = getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      defaultPath: backendManager.backupsPath,
      filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const backupPath = result.filePaths[0];
    await backendManager.stop();
    await fs.promises.copyFile(backupPath, backendManager.dbPath);
    await backendManager.start();

    return { canceled: false, restoredFrom: backupPath };
  });

  ipcMain.handle("print:current-window", async (_event, options = {}) => {
    const win = getMainWindow();
    if (!win) return { success: false, error: "Window not available" };

    return new Promise((resolve) => {
      win.webContents.print(
        {
          silent: false,
          printBackground: true,
          ...options,
        },
        (success, failureReason) => {
          if (!success) {
            resolve({ success: false, error: failureReason || "Print failed" });
            return;
          }
          resolve({ success: true });
        },
      );
    });
  });

  ipcMain.handle("print:html", async (_event, payload = {}) => {
    const { html = "", options = {} } = payload;
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
      },
    });

    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );

    const result = await new Promise((resolve) => {
      win.webContents.print(
        {
          silent: false,
          printBackground: true,
          ...options,
        },
        (success, failureReason) => {
          if (!success) {
            resolve({ success: false, error: failureReason || "Print failed" });
            return;
          }
          resolve({ success: true });
        },
      );
    });

    win.destroy();
    return result;
  });

  ipcMain.handle("print:save-pdf", async (_event, payload = {}) => {
    const win = getMainWindow();
    const { html = "", defaultFileName = `report-${getTimestamp()}.pdf` } =
      payload;

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
      },
    });

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );

    const pdfData = await printWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
    });
    printWindow.destroy();

    const saveResult = await dialog.showSaveDialog(win, {
      defaultPath: defaultFileName,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true };
    }

    await fs.promises.writeFile(saveResult.filePath, pdfData);
    return { canceled: false, filePath: saveResult.filePath };
  });
}

module.exports = {
  registerIpc,
};
