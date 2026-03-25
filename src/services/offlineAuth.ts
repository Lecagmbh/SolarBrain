/**
 * Offline Auth Service
 * ====================
 * Cached den letzten erfolgreichen Login lokal.
 * Bei Offline-Login wird gegen den Cache geprüft.
 *
 * Sicherheit: Passwort wird als SHA-256 Hash gespeichert (nicht im Klartext).
 * Der gespeicherte Access-Token ermöglicht offline Zugriff auf gecachte Daten.
 */

const OFFLINE_AUTH_KEY = 'baunity_offline_auth';

type CachedAuth = {
  email: string;
  passwordHash: string;
  user: {
    id: number;
    email: string;
    name?: string;
    role: string;
    kundeId?: number;
    kunde?: { id: number; name: string; firmenName?: string } | null;
  };
  accessToken: string;
  cachedAt: string;
};

/**
 * SHA-256 Hash eines Strings (Web Crypto API)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Nach erfolgreichem Online-Login: Credentials + User cachen
 */
export async function cacheLoginData(
  email: string,
  password: string,
  user: CachedAuth['user'],
  accessToken: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);

  const cached: CachedAuth = {
    email: email.toLowerCase().trim(),
    passwordHash,
    user,
    accessToken,
    cachedAt: new Date().toISOString(),
  };

  localStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify(cached));
}

/**
 * Offline-Login: Prüfe Email + Passwort gegen Cache
 * Gibt User-Daten + Token zurück wenn gültig
 */
export async function tryOfflineLogin(
  email: string,
  password: string,
): Promise<{ success: true; user: CachedAuth['user']; accessToken: string } | { success: false; error: string }> {
  const raw = localStorage.getItem(OFFLINE_AUTH_KEY);
  if (!raw) {
    return { success: false, error: 'Kein Offline-Login verfügbar. Bitte einmal online einloggen.' };
  }

  let cached: CachedAuth;
  try {
    cached = JSON.parse(raw);
  } catch {
    return { success: false, error: 'Offline-Daten beschädigt. Bitte online einloggen.' };
  }

  // Check age (max 30 days)
  const age = Date.now() - new Date(cached.cachedAt).getTime();
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  if (age > maxAge) {
    localStorage.removeItem(OFFLINE_AUTH_KEY);
    return { success: false, error: 'Offline-Login abgelaufen. Bitte online einloggen.' };
  }

  // Verify email
  if (cached.email !== email.toLowerCase().trim()) {
    return { success: false, error: 'E-Mail stimmt nicht mit dem gespeicherten Offline-Login überein.' };
  }

  // Verify password hash
  const inputHash = await hashPassword(password);
  if (inputHash !== cached.passwordHash) {
    return { success: false, error: 'Falsches Passwort.' };
  }

  return {
    success: true,
    user: cached.user,
    accessToken: cached.accessToken,
  };
}

/**
 * Offline-Auth-Cache löschen (bei Logout)
 */
export function clearOfflineAuth(): void {
  localStorage.removeItem(OFFLINE_AUTH_KEY);
}

/**
 * Prüfe ob Offline-Login verfügbar ist
 */
export function hasOfflineAuth(): boolean {
  return localStorage.getItem(OFFLINE_AUTH_KEY) !== null;
}
