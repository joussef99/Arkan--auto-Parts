const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { spawn } = require("child_process");

const HOST = "127.0.0.1";
const PORT = Number(process.env.BACKEND_PORT || 5000);
const STARTUP_TIMEOUT_MS = 15000;

class BackendManager {
  constructor({ app, userDataPath, isDev, startupLog }) {
    this.app = app;
    this.userDataPath = userDataPath;
    this.isDev = isDev;
    this.startupLog =
      typeof startupLog === "function"
        ? startupLog
        : (message, extra) => {
            if (extra !== undefined) {
              console.log(`[Startup] ${message}`, extra);
              return;
            }
            console.log(`[Startup] ${message}`);
          };
    this.process = null;
    this.starting = false;
    this.stopped = false;
  }

  log(message, extra) {
    this.startupLog(message, extra);
  }

  get dbPath() {
    return path.join(this.userDataPath, "database.db");
  }

  get backupsPath() {
    return path.join(this.userDataPath, "Backups");
  }

  get logsPath() {
    return path.join(this.userDataPath, "Logs");
  }

  get baseUrl() {
    return `http://${HOST}:${PORT}`;
  }

  ensureStorage() {
    fs.mkdirSync(this.userDataPath, { recursive: true });
    fs.mkdirSync(this.backupsPath, { recursive: true });
    fs.mkdirSync(this.logsPath, { recursive: true });

    if (!fs.existsSync(this.dbPath)) {
      fs.closeSync(fs.openSync(this.dbPath, "w"));
    }
  }

  /**
   * Returns a stable JWT secret for this installation.
   * Generated once on first run and stored in userData.
   */
  getOrCreateJwtSecret() {
    const secretFile = path.join(this.userDataPath, ".jwt-secret");
    try {
      if (fs.existsSync(secretFile)) {
        const secret = fs.readFileSync(secretFile, "utf-8").trim();
        if (secret && secret.length >= 32) {
          return secret;
        }
      }
    } catch (_err) {
      // Fall through to generate a new one
    }

    const secret = crypto.randomBytes(48).toString("hex");
    try {
      fs.writeFileSync(secretFile, secret, { mode: 0o600 });
    } catch (err) {
      this.log("Warning: could not persist JWT secret", err?.message);
    }
    return secret;
  }

  buildBackendCommand() {
    const workspaceRoot = path.resolve(__dirname, "..", "..");
    const backendRoot = path.join(workspaceRoot, "backend");

    if (this.isDev) {
      if (process.platform === "win32") {
        return {
          command: "powershell.exe",
          args: [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "npm --prefix backend run dev",
          ],
          cwd: workspaceRoot,
        };
      }

      return {
        command: "npm",
        args: ["--prefix", "backend", "run", "dev"],
        cwd: workspaceRoot,
      };
    }

    const packagedRoot = process.resourcesPath;
    const backendPackageJson = path.join(
      packagedRoot,
      "backend",
      "package.json",
    );
    const backendNodeModules = path.join(
      packagedRoot,
      "backend",
      "node_modules",
    );
    const backendDist = path.join(packagedRoot, "backend", "dist", "server.js");
    const devBuild = path.join(backendRoot, "dist", "server.js");
    const entry = fs.existsSync(backendDist) ? backendDist : devBuild;

    if (!fs.existsSync(entry)) {
      throw new Error(
        `Packaged backend entry not found at ${backendDist} or fallback ${devBuild}`,
      );
    }

    if (!fs.existsSync(backendPackageJson)) {
      throw new Error(
        `Packaged backend package.json not found at ${backendPackageJson}`,
      );
    }

    if (!fs.existsSync(backendNodeModules)) {
      throw new Error(
        `Packaged backend node_modules not found at ${backendNodeModules}`,
      );
    }

    this.log("Using packaged backend entry", entry);

    return {
      command: process.execPath,
      args: [entry],
      cwd: path.dirname(entry),
    };
  }

  async probeEndpoints() {
    const endpoints = ["/api/health", "/health", "/"];

    for (const endpoint of endpoints) {
      const url = `${this.baseUrl}${endpoint}`;
      try {
        const response = await fetch(url, {
          method: "GET",
        });

        if (response.ok) {
          this.log(`Probe OK: ${endpoint} (${response.status})`);
          return { ok: true, endpoint, status: response.status };
        }

        this.log(`Probe responded: ${endpoint} (${response.status})`);
      } catch (error) {
        this.log(`Probe failed: ${endpoint}`);
      }
    }

    return { ok: false };
  }

  async waitForReady() {
    const timeoutMs = STARTUP_TIMEOUT_MS;
    const start = Date.now();
    this.log(`Waiting for backend readiness on ${this.baseUrl}`);

    while (Date.now() - start < timeoutMs) {
      const probe = await this.probeEndpoints();
      if (probe.ok) {
        this.log("Backend ready");
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    throw new Error(
      `Backend did not become ready within ${Math.floor(timeoutMs / 1000)} seconds on ${this.baseUrl}`,
    );
  }

  async start() {
    if (this.process || this.starting) {
      this.log("Backend start skipped: already running/starting");
      return;
    }

    this.ensureStorage();
    this.log("Storage prepared", {
      dbPath: this.dbPath,
      backupsPath: this.backupsPath,
      logsPath: this.logsPath,
    });

    this.starting = true;
    this.stopped = false;

    const logFile = path.join(this.logsPath, "backend.log");
    const logStream = fs.createWriteStream(logFile, { flags: "a" });

    const frontendDist = this.isDev
      ? ""
      : path.join(process.resourcesPath, "frontend", "dist");

    const { command, args, cwd } = this.buildBackendCommand();
    this.log("Launching backend process", {
      command,
      args,
      cwd,
      port: PORT,
      isDev: this.isDev,
    });

    this.process = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: this.isDev ? "development" : "production",
        PORT: String(PORT),
        DB_PATH: this.dbPath,
        FRONTEND_DIST: frontendDist,
        JWT_SECRET: this.getOrCreateJwtSecret(),
      },
    });

    this.process.stdout.on("data", (chunk) => {
      logStream.write(`[OUT] ${chunk.toString()}`);
    });

    this.process.stderr.on("data", (chunk) => {
      logStream.write(`[ERR] ${chunk.toString()}`);
    });

    this.process.on("exit", (code, signal) => {
      logStream.write(`\n[EXIT] code=${code} signal=${signal}\n`);
      this.log(`Backend process exited (code=${code}, signal=${signal})`);
      this.process = null;
      if (!this.stopped) {
        console.error(`Backend exited unexpectedly with code ${code}`);
      }
      logStream.end();
    });

    try {
      await this.waitForReady();
    } finally {
      this.starting = false;
    }
  }

  async stop() {
    if (!this.process) {
      this.log("Backend stop skipped: process not running");
      return;
    }

    this.log("Stopping backend process");
    this.stopped = true;
    const proc = this.process;

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch (error) {
          // ignore
        }
        resolve();
      }, 5000);

      proc.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });

      try {
        proc.kill("SIGTERM");
      } catch (error) {
        clearTimeout(timeout);
        resolve();
      }
    });

    this.process = null;
    this.log("Backend process stopped");
  }
}

module.exports = {
  BackendManager,
  HOST,
  PORT,
};
