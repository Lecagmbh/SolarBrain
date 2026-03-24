/**
 * Desktop-Native Download Utility
 * Nutzt den OS-Speichern-Dialog auf Desktop, Browser-Fallback im Web.
 */

const isDesktop = Boolean(window.baunityDesktop?.isDesktop);

type FileType = 'pdf' | 'csv' | 'xlsx' | 'xls' | 'json' | 'png' | 'jpg' | 'svg' | 'zip' | 'xml' | 'txt';

const FILE_FILTERS: Record<FileType, Array<{ name: string; extensions: string[] }>> = {
  pdf: [{ name: 'PDF Dokumente', extensions: ['pdf'] }],
  csv: [{ name: 'CSV Tabellen', extensions: ['csv'] }],
  xlsx: [{ name: 'Excel Tabellen', extensions: ['xlsx'] }],
  xls: [{ name: 'Excel Tabellen', extensions: ['xls'] }],
  json: [{ name: 'JSON Dateien', extensions: ['json'] }],
  png: [{ name: 'PNG Bilder', extensions: ['png'] }],
  jpg: [{ name: 'JPEG Bilder', extensions: ['jpg', 'jpeg'] }],
  svg: [{ name: 'SVG Grafiken', extensions: ['svg'] }],
  zip: [{ name: 'ZIP Archive', extensions: ['zip'] }],
  xml: [{ name: 'XML Dateien', extensions: ['xml'] }],
  txt: [{ name: 'Textdateien', extensions: ['txt'] }],
};

function detectFileType(filename: string): FileType | undefined {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && ext in FILE_FILTERS) return ext as FileType;
  return undefined;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data:...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function browserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface DownloadOptions {
  filename: string;
  blob: Blob;
  fileType?: FileType;
}

/**
 * Download mit nativem OS-Dialog (Desktop) oder Browser-Fallback (Web).
 * Gibt true zurück wenn die Datei gespeichert wurde, false wenn abgebrochen.
 */
export async function downloadFile({ filename, blob, fileType }: DownloadOptions): Promise<boolean> {
  if (!isDesktop) {
    browserDownload(blob, filename);
    return true;
  }

  try {
    const base64 = await blobToBase64(blob);
    const resolvedType = fileType || detectFileType(filename);
    const filters = resolvedType ? FILE_FILTERS[resolvedType] : undefined;

    const result = await window.baunityDesktop!.dialog.saveFile({
      data: base64,
      filename,
      filters,
    });

    return result.success && !result.canceled;
  } catch (err) {
    // Fallback to browser download on error
    console.warn('[desktopDownload] Native dialog failed, falling back to browser:', err);
    browserDownload(blob, filename);
    return true;
  }
}

/**
 * Shortcut: Download aus Base64-String (ohne Blob-Konvertierung)
 */
export async function downloadBase64File(
  filename: string,
  base64Data: string,
  fileType?: FileType
): Promise<boolean> {
  if (!isDesktop) {
    // Convert base64 to blob for browser download
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes]);
    browserDownload(blob, filename);
    return true;
  }

  try {
    const resolvedType = fileType || detectFileType(filename);
    const filters = resolvedType ? FILE_FILTERS[resolvedType] : undefined;

    const result = await window.baunityDesktop!.dialog.saveFile({
      data: base64Data,
      filename,
      filters,
    });

    return result.success && !result.canceled;
  } catch (err) {
    console.warn('[desktopDownload] Native dialog failed:', err);
    return false;
  }
}
