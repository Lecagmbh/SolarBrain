/**
 * Token Storage Stubs for Wizard
 * Local version of modules/auth/tokenStorage
 */

import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEYS, getAuthToken, setAuthToken, clearAuthToken } from './storage';

export function setAccessToken(token: string): void {
  setAuthToken(token);
  // Clear legacy keys if present
  if (typeof window !== 'undefined') {
    LEGACY_TOKEN_KEYS.forEach(key => localStorage.removeItem(key));
  }
}

export function getAccessToken(): string | null {
  return getAuthToken();
}

export function clearAccessToken(): void {
  clearAuthToken();
}

export function hasValidToken(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  // Basic JWT validation (check if it has 3 parts)
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  // Check expiry
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

export { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEYS };
