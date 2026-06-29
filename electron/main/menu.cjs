const { Menu, Tray, nativeImage, app } = require("electron");
const path = require("path");

function createAppMenu({ mainWindow, backendManager }) {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Backup Database",
          click: () => mainWindow.webContents.send("menu:backup"),
        },
        {
          label: "Open Backups Folder",
          click: async () => {
            await mainWindow.webContents.send("menu:open-backups");
          },
        },
        { type: "separator" },
        { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Open Logs",
          click: async () => {
            await require("electron").shell.openPath(backendManager.logsPath);
          },
        },
        {
          label: "About",
          click: () => {
            require("electron").dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About",
              message: `${app.getName()} v${app.getVersion()}`,
              detail: "Arkan Auto Parts ERP Desktop",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray({ mainWindow }) {
  const iconPath = path.join(__dirname, "..", "assets", "icon.png");
  const image = nativeImage.createFromPath(iconPath);
  const tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image);

  tray.setToolTip("Arkan Auto Parts ERP");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: "Exit",
        click: () => {
          app.quit();
        },
      },
    ]),
  );

  tray.on("double-click", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}

module.exports = {
  createAppMenu,
  createTray,
};
