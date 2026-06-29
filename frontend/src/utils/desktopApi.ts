export type DesktopSaveResult = {
  canceled?: boolean;
  filePath?: string;
  success?: boolean;
  error?: string;
};

export function isDesktop(): boolean {
  return typeof window !== "undefined" && Boolean(window.desktopAPI?.isDesktop);
}

export async function printCurrentWindow(): Promise<void> {
  if (!isDesktop()) {
    window.print();
    return;
  }

  const result = await window.desktopAPI.printCurrentWindow({
    silent: false,
    printBackground: true,
  });

  if (!result?.success) {
    throw new Error(result?.error || "Desktop print failed");
  }
}

export async function saveBlobWithDialog(
  blob: Blob,
  defaultFileName: string,
  filters: Array<{ name: string; extensions: string[] }>,
): Promise<DesktopSaveResult> {
  if (!isDesktop()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = defaultFileName;
    link.click();
    URL.revokeObjectURL(url);
    return { success: true };
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());

  return window.desktopAPI.saveFile({
    defaultPath: defaultFileName,
    filters,
    data: bytes,
  });
}

export async function savePdfBytes(
  bytes: Uint8Array,
  defaultFileName: string,
): Promise<DesktopSaveResult> {
  if (!isDesktop()) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    return saveBlobWithDialog(blob, defaultFileName, [
      { name: "PDF", extensions: ["pdf"] },
    ]);
  }

  return window.desktopAPI.saveFile({
    defaultPath: defaultFileName,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
    data: bytes,
  });
}
