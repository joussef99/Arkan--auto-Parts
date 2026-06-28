/**
 * Printer Service
 * Handles direct TCP communication with Zebra thermal printers
 * Uses port 9100 (standard Zebra printer port)
 */

import { createConnection } from "net";

const PRINTER_PORT = 9100;
const DEFAULT_TIMEOUT = 5000; // 5 seconds

/**
 * Send ZPL data to a Zebra thermal printer
 * @param {string} zpl - ZPL commands to send
 * @param {string} printerIp - IP address of the printer
 * @param {number} port - Printer port (default 9100)
 * @param {number} timeout - Connection timeout in ms
 * @returns {Promise<{success: boolean, message: string}>}
 */
function sendToPrinter(
  zpl,
  printerIp,
  port = PRINTER_PORT,
  timeout = DEFAULT_TIMEOUT,
) {
  return new Promise((resolve) => {
    if (!printerIp || !isValidIp(printerIp)) {
      resolve({ success: false, message: "عنوان الطابعة غير صالح" });
      return;
    }

    if (!zpl || zpl.trim() === "") {
      resolve({ success: false, message: "بيانات ZPL فارغة" });
      return;
    }

    const client = createConnection();
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        client.destroy();
        resolve({ success: false, message: "انتهت مهلة الاتصال بالطابعة" });
      }
    }, timeout);

    client.connect(port, printerIp, () => {
      client.write(zpl);
      client.end();
    });

    client.on("close", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({ success: true, message: "تم إرسال البيانات بنجاح" });
      }
    });

    client.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        console.error("Printer connection error:", err.message);
        resolve({
          success: false,
          message:
            err.code === "ECONNREFUSED"
              ? "تعذر الاتصال بالطابعة - تأكد من عنوان IP"
              : `خطأ في الاتصال: ${err.message}`,
        });
      }
    });
  });
}

/**
 * Validate IP address format
 * @param {string} ip - IP address to validate
 * @returns {boolean}
 */
function isValidIp(ip) {
  if (!ip || typeof ip !== "string") return false;

  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".").map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  }

  return false;
}

/**
 * Check if printer is reachable
 * @param {string} printerIp - IP address of the printer
 * @returns {Promise<boolean>}
 */
async function checkPrinterConnection(printerIp) {
  return new Promise((resolve) => {
    const client = createConnection();

    const timeoutId = setTimeout(() => {
      client.destroy();
      resolve(false);
    }, 3000);

    client.connect(PRINTER_PORT, printerIp, () => {
      clearTimeout(timeoutId);
      client.destroy();
      resolve(true);
    });

    client.on("error", () => {
      clearTimeout(timeoutId);
      client.destroy();
      resolve(false);
    });
  });
}

export { sendToPrinter, checkPrinterConnection, isValidIp, PRINTER_PORT };
