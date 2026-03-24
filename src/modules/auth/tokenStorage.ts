import {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  LEGACY_TOKEN_KEYS,
  getAuthToken,
  setAuthToken,
  clearAuthTokens,
} from '../../config/storage';

export function setAccessToken(token: string) {
  setAuthToken(token);
  // Legacy keys clearen falls vorhanden
  localStorage.removeItem("auth");
  localStorage.removeItem("user");
}

export function getAccessToken(): string | null {
  return getAuthToken();
}

export function clearAccessToken() {
  // Alle Token-Keys löschen (inkl. Legacy)
  clearAuthTokens();
  // Legacy keys clearen
  localStorage.removeItem("auth");
  localStorage.removeItem("user");
  // User tracking für Store-Reset
  localStorage.removeItem("netzanmeldungen-last-user");
  // All tokens cleared
}

// Re-export for backwards compatibility
export { AUTH_TOKEN_KEY as TOKEN_KEY };
