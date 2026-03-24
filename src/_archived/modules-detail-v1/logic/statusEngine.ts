export type InstallationStatus =
  | "entwurf"
  | "eingegangen"
  | "in_pruefung"
  | "beim_netzbetreiber"
  | "freigegeben";

export const STATUS_ORDER: InstallationStatus[] = [
  "entwurf",
  "eingegangen",
  "in_pruefung",
  "beim_netzbetreiber",
  "freigegeben",
];

export function canProgress(
  current: InstallationStatus,
  next: InstallationStatus,
  role: string
): boolean {
  const currentIndex = STATUS_ORDER.indexOf(current);
  const nextIndex = STATUS_ORDER.indexOf(next);

  if (role === "admin") return true;
  if (role === "mitarbeiter") {
    return nextIndex === currentIndex + 1; // Only forward by 1
  }

  // Kunden dürfen NICHT ändern
  return false;
}

export function nextAllowedStatus(
  current: InstallationStatus
): InstallationStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[idx + 1] ?? null;
}
