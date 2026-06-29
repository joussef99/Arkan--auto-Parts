const path = require("path");
const fs = require("fs");
const {
  app,
  BrowserWindow,
  dialog,
  nativeImage,
  screen,
  session,
} = require("electron");
const { BackendManager } = require("./backend-manager.cjs");
const { createStartupLogger } = require("./startup-logger.cjs");
const { registerIpc } = require("./ipc.cjs");
const { createAppMenu, createTray } = require("./menu.cjs");

let mainWindow = null;
let splashWindow = null;
let tray = null;
let isQuitting = false;
let startupLogger = null;

const isDev = !app.isPackaged;
app.setName("Arkan Auto Parts ERP");

function startupLog(message, extra) {
  if (startupLogger) {
    startupLogger.info(message, extra);
  }

  if (extra !== undefined) {
    console.log(`[Startup] ${message}`, extra);
    return;
  }
  console.log(`[Startup] ${message}`);
}

function startupError(message, error) {
  if (startupLogger) {
    if (error !== undefined) {
      startupLogger.error(message, {
        error: error?.message || String(error),
        stack: error?.stack,
      });
    } else {
      startupLogger.error(message);
    }
  }

  if (error !== undefined) {
    console.error(`[Startup] ${message}`, error);
    return;
  }

  console.error(`[Startup] ${message}`);
}

function getStateFile(userDataPath) {
  return path.join(userDataPath, "window-state.json");
}

function readWindowState(userDataPath) {
  const stateFile = getStateFile(userDataPath);
  const defaults = { width: 1440, height: 900 };

  try {
    if (fs.existsSync(stateFile)) {
      const raw = fs.readFileSync(stateFile, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch (error) {
    console.error("Failed to read window state", error);
  }

  return defaults;
}

function writeWindowState(userDataPath, state) {
  const stateFile = getStateFile(userDataPath);
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Failed to write window state", error);
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    resizable: false,
    show: false,
    backgroundColor: "#0f172a",
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
    },
  });

  const splashHtml = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { margin:0; background:#0f172a; color:#fff; display:flex; align-items:center; justify-content:center; font-family:Segoe UI, sans-serif; }
          .card { text-align:center; }
          .title { font-size:28px; font-weight:700; margin-bottom:8px; }
          .sub { color:#94a3b8; margin-bottom:20px; }
          .spinner { width:36px; height:36px; border:4px solid rgba(255,255,255,.2); border-top-color:#10b981; border-radius:50%; margin: 0 auto; animation:spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">Arkan Auto Parts ERP</div>
          <div class="sub">Initializing desktop workspace...</div>
          <div class="spinner"></div>
        </div>
      </body>
    </html>
  `;

  splashWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`,
  );
  splashWindow.once("ready-to-show", () => splashWindow.show());
}

function normalizeBounds(bounds) {
  const displays = screen.getAllDisplays();
  const isVisible = displays.some((display) => {
    const area = display.workArea;
    return (
      bounds.x >= area.x - bounds.width &&
      bounds.x <= area.x + area.width &&
      bounds.y >= area.y - bounds.height &&
      bounds.y <= area.y + area.height
    );
  });

  if (isVisible) {
    return bounds;
  }

  const primary = screen.getPrimaryDisplay().workArea;
  return {
    width: 1440,
    height: 900,
    x: primary.x + Math.max(0, Math.floor((primary.width - 1440) / 2)),
    y: primary.y + Math.max(0, Math.floor((primary.height - 900) / 2)),
  };
}

async function bootstrap() {
  startupLog("Bootstrap started", { isDev, isPackaged: app.isPackaged });
  const userDataPath = app.getPath("userData");
  const backendManager = new BackendManager({
    app,
    userDataPath,
    isDev,
    startupLog,
  });

  registerIpc({
    app,
    backendManager,
    getMainWindow: () => mainWindow,
  });

  createSplashWindow();
  startupLog("Splash window created");

  startupLog("Launching backend...");
  await backendManager.start();
  startupLog("Backend ready");

  const savedState = normalizeBounds(readWindowState(userDataPath));
  startupLog("Window state loaded", savedState);

  const iconPath = path.join(__dirname, "..", "assets", "icon.png");
  const iconImage = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    show: false,
    minWidth: 1200,
    minHeight: 760,
    icon: iconImage.isEmpty() ? undefined : iconImage,
    title: "Arkan Auto Parts ERP",
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  startupLog("Main window created");

  createAppMenu({ mainWindow, backendManager });
  tray = createTray({ mainWindow });
  startupLog("Menu and tray initialized");

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("moved", () => {
    if (!mainWindow || mainWindow.isMinimized() || mainWindow.isMaximized())
      return;
    writeWindowState(userDataPath, mainWindow.getBounds());
  });

  mainWindow.on("resized", () => {
    if (!mainWindow || mainWindow.isMinimized() || mainWindow.isMaximized())
      return;
    writeWindowState(userDataPath, mainWindow.getBounds());
  });

  let didShowMainWindow = false;
  const showMainWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed() || didShowMainWindow) {
      return;
    }

    didShowMainWindow = true;
    startupLog("Opening main window...");
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
      startupLog("Splash closed");
    }
    mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once("ready-to-show", showMainWindow);
  mainWindow.webContents.once("did-finish-load", () => {
    startupLog("Renderer did-finish-load");
    showMainWindow();
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      startupError(
        `Main window failed to load (${errorCode}) ${errorDescription} at ${validatedURL}`,
      );
    },
  );

  const loadTimeout = setTimeout(() => {
    if (!didShowMainWindow) {
      startupError(
        "Main window did not become ready in 15 seconds. Showing fallback window.",
      );
      showMainWindow();
      void dialog.showMessageBox({
        type: "warning",
        title: "Startup Delay",
        message: "The application is taking longer than expected to load.",
        detail:
          "Backend started, but the main window was delayed. Please check logs if loading issues continue.",
      });
    }
  }, 15000);

  const startUrl =
    process.env.ELECTRON_START_URL || `${backendManager.baseUrl}/`;
  startupLog("Loading renderer URL", startUrl);
  await mainWindow.loadURL(startUrl);
  clearTimeout(loadTimeout);
  startupLog("Main window URL loaded");

  app.on("before-quit", async () => {
    isQuitting = true;
    startupLog("before-quit received");
    await backendManager.stop();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

app.whenReady().then(async () => {
  try {
    startupLogger = createStartupLogger(app.getPath("userData"));
    startupLog("Startup logger initialized", { path: startupLogger.logPath });
    startupLog("App ready event received");
    await session.defaultSession.clearCache();
    startupLog("Session cache cleared");
    await bootstrap();
  } catch (error) {
    startupError("Fatal startup error", error);

    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }

    await dialog.showMessageBox({
      type: "error",
      title: "Startup Failed",
      message: "Failed to initialize Arkan Auto Parts ERP.",
      detail: error?.stack || String(error),
    });

    if (startupLogger) {
      startupLogger.close();
      startupLogger = null;
    }

    app.quit();
  }
});

app.on("will-quit", () => {
  if (startupLogger) {
    startupLogger.info("Application will quit");
    startupLogger.close();
    startupLogger = null;
  }
});

app.on("activate", () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});
