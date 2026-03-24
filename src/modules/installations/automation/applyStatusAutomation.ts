import { detectStatusFromEmail } from "./detectStatusFromEmail";
import type { ToastType } from "../../ui/toast/ToastContext";

type PushFn = (message: string, type?: ToastType) => void;

// Platzhalter: wendet nur die Logik an und zeigt einen Hinweis-Toast.
// Keine Backend-Calls, bis InstallationService existiert.
export async function applyStatusAutomation(
  email: any,
  installationId: number,
  push: PushFn
) {
  const result = detectStatusFromEmail(email);

  if (result.confidence < 75 || result.status === "unknown") {
    return;
  }

  push(
    `Automatische Status-Erkennung für Anlage ${installationId}: ${result.status.toUpperCase()} (${result.confidence}%) – ${result.rule ?? ""}`,
    "warning"
  );

  // Status update is handled via the backend API
}
