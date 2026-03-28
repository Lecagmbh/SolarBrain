/**
 * Biometric Auth — Fingerabdruck / Face ID / PIN
 * Speichert Credentials sicher nach erstem Login,
 * bietet beim nächsten Start Biometrie-Login an.
 */
import { isCapacitor } from "../hooks/useCapacitor";

const STORAGE_KEY = "baunity_biometric_enabled";
const CRED_EMAIL_KEY = "baunity_biometric_email";
const CRED_TOKEN_KEY = "baunity_biometric_token";

function getBioPlugin() {
  try {
    return (window as any).Capacitor?.Plugins?.BiometricAuth;
  } catch { return null; }
}

/** Prüft ob Biometrie verfügbar ist (Hardware + eingerichtet) */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isCapacitor) return false;
  const bio = getBioPlugin();
  if (!bio) return false;
  try {
    const result = await bio.checkBiometry();
    return result.isAvailable === true;
  } catch { return false; }
}

/** Prüft ob Biometrie aktiviert ist (User hat zugestimmt) */
export function isBiometricEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

/** Aktiviert Biometrie und speichert Credentials */
export function enableBiometric(email: string, token: string) {
  localStorage.setItem(STORAGE_KEY, "true");
  localStorage.setItem(CRED_EMAIL_KEY, email);
  localStorage.setItem(CRED_TOKEN_KEY, token);
}

/** Deaktiviert Biometrie */
export function disableBiometric() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CRED_EMAIL_KEY);
  localStorage.removeItem(CRED_TOKEN_KEY);
}

/** Gespeicherte Credentials abrufen */
export function getBiometricCredentials(): { email: string; token: string } | null {
  const email = localStorage.getItem(CRED_EMAIL_KEY);
  const token = localStorage.getItem(CRED_TOKEN_KEY);
  if (!email || !token) return null;
  return { email, token };
}

/** Biometrie-Authentifizierung durchführen */
export async function authenticateWithBiometric(): Promise<boolean> {
  const bio = getBioPlugin();
  if (!bio) return false;
  try {
    await bio.authenticate({
      reason: "Anmelden bei SolarBrain",
      cancelTitle: "Abbrechen",
      allowDeviceCredential: true, // PIN/Muster als Fallback
    });
    return true;
  } catch {
    return false;
  }
}
