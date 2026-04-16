export function logger(level: "info" | "warn" | "error", message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
  
  switch (level) {
    case "info":
      console.log(`[${timestamp}] INFO: ${logMessage}`);
      break;
    case "warn":
      console.warn(`[${timestamp}] WARN: ${logMessage}`);
      break;
    case "error":
      console.error(`[${timestamp}] ERROR: ${logMessage}`);
      break;
  }
}

export default { logger };