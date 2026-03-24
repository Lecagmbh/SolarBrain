/**
 * Desktop-aware clipboard utilities
 * Desktop: Native IPC, Web: navigator.clipboard
 */

const isDesktop = Boolean(window.baunityDesktop?.isDesktop);

/**
 * Copy text to clipboard (native on Desktop, navigator.clipboard on Web)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (isDesktop) {
    const result = await window.baunityDesktop!.clipboard.writeText(text);
    return result.success;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy formatted installation data for email/support use
 */
export function formatInstallationData(installation: {
  id?: number | string;
  publicId?: string;
  customerName?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  totalKwp?: number;
  gridOperatorName?: string;
  status?: string;
  createdAt?: string;
}): string {
  const lines = [
    `Installation: ${installation.publicId || installation.id || ""}`,
    `Kunde: ${installation.customerName || ""}`,
    `Adresse: ${[installation.strasse, installation.hausNr].filter(Boolean).join(" ")}, ${installation.plz || ""} ${installation.ort || ""}`,
    `kWp: ${installation.totalKwp || ""}`,
    `Netzbetreiber: ${installation.gridOperatorName || ""}`,
    `Status: ${installation.status || ""}`,
    `Erstellt: ${installation.createdAt ? new Date(installation.createdAt).toLocaleDateString("de-DE") : ""}`,
  ];
  return lines.join("\n");
}

/**
 * Copy installation data to clipboard
 */
export async function copyInstallationData(installation: Parameters<typeof formatInstallationData>[0]): Promise<boolean> {
  return copyToClipboard(formatInstallationData(installation));
}
