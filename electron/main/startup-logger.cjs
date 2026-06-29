const fs = require("fs");
const path = require("path");

function formatLine(level, message, extra) {
  const timestamp = new Date().toISOString();
  if (extra === undefined) {
    return `${timestamp} [${level}] ${message}\n`;
  }

  if (typeof extra === "string") {
    return `${timestamp} [${level}] ${message} ${extra}\n`;
  }

  try {
    return `${timestamp} [${level}] ${message} ${JSON.stringify(extra)}\n`;
  } catch (_error) {
    return `${timestamp} [${level}] ${message} [unserializable-extra]\n`;
  }
}

function createStartupLogger(userDataPath) {
  const logsPath = path.join(userDataPath, "Logs");
  fs.mkdirSync(logsPath, { recursive: true });

  const logPath = path.join(logsPath, "startup.log");
  const stream = fs.createWriteStream(logPath, { flags: "a" });

  const write = (level, message, extra) => {
    stream.write(formatLine(level, message, extra));
  };

  return {
    logPath,
    info: (message, extra) => write("INFO", message, extra),
    error: (message, extra) => write("ERROR", message, extra),
    close: () => {
      try {
        stream.end();
      } catch (_error) {
        // ignore
      }
    },
  };
}

module.exports = {
  createStartupLogger,
};
