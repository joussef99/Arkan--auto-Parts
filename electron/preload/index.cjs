const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  isDesktop: true,
  appInfo: () => ipcRenderer.invoke("app:info"),
  printCurrentWindow: (options = {}) =>
    ipcRenderer.invoke("print:current-window", options),
  printHtml: (payload) => ipcRenderer.invoke("print:html", payload),
  savePdfFromHtml: (payload) => ipcRenderer.invoke("print:save-pdf", payload),
  saveFile: (payload) => ipcRenderer.invoke("file:save", payload),
  openFile: (options = {}) => ipcRenderer.invoke("file:open", options),
  openFolder: (pathToOpen) =>
    ipcRenderer.invoke("shell:open-folder", pathToOpen),
  openLogs: () => ipcRenderer.invoke("shell:open-logs"),
  backupDatabase: () => ipcRenderer.invoke("db:backup"),
  restoreDatabase: () => ipcRenderer.invoke("db:restore"),
  exportDatabase: () => ipcRenderer.invoke("db:export"),
  importDatabase: () => ipcRenderer.invoke("db:import"),
  getDesktopPaths: () => ipcRenderer.invoke("app:paths"),
});
