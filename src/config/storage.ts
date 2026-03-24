/**
 * Baunity Storage Keys Configuration
 * ====================================
 * Zentrale Definition aller localStorage/sessionStorage Keys.
 * WICHTIG: Diese Datei ist die EINZIGE Quelle für Storage-Keys!
 */

// ═══════════════════════════════════════════════════════════════════════════
// AUTH TOKENS
// ═══════════════════════════════════════════════════════════════════════════

export const AUTH_TOKEN_KEY = 'baunity_token';
export const REFRESH_TOKEN_KEY = 'baunity_refresh_token';
export const ACCESS_TOKEN_KEY = 'baunity_access_token';
export const USER_KEY = 'baunity_user';

// Legacy keys for backwards compatibility (migration from gridnetz)
export const LEGACY_TOKEN_KEYS = [
  'gridnetz_token',
  'gridnetz_access_token',
  'gridnetz_refresh_token',
  'leca_token',
  'leca_access_token',
  'leca_refresh_token',
  'token',
  'accessToken',
  'access_token',
  'auth_token',
  'jwt',
];

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD STORAGE
// ═══════════════════════════════════════════════════════════════════════════

export const WIZARD_STORE_PREFIX = 'baunity-wizard-v1';
export const WIZARD_LEARNING_SESSION_KEY = 'baunity-learning-session';
export const WIZARD_FAILED_SESSIONS_KEY = 'baunity-failed-sessions';
export const WIZARD_LAST_ADDRESS_KEY = 'baunity-last-address';
export const WIZARD_LAST_CUSTOMER_KEY = 'baunity-last-customer';

// ═══════════════════════════════════════════════════════════════════════════
// SESSION
// ═══════════════════════════════════════════════════════════════════════════

export const SESSION_ID_KEY = 'baunity_session_id';

// ═══════════════════════════════════════════════════════════════════════════
// APP-SPECIFIC
// ═══════════════════════════════════════════════════════════════════════════

export const DASHBOARD_PREFS_KEY = 'baunity-dashboard-prefs';
export const ADMIN_CENTER_STORE_KEY = 'baunity-admin-center';
export const NOTIFICATIONS_KEY = 'baunity_notifications';
export const UPLOAD_QUEUE_DB_NAME = 'baunity_upload_queue';

// ═══════════════════════════════════════════════════════════════════════════
// BIOMETRIC / MOBILE
// ═══════════════════════════════════════════════════════════════════════════

export const BIOMETRIC_ENABLED_KEY = 'baunity_biometric_enabled';
export const BIOMETRIC_EMAIL_KEY = 'baunity_biometric_email';
export const OFFLINE_QUEUE_KEY = '@baunity_offline_queue';
export const DATA_CACHE_KEY = '@baunity_data_cache';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL API WINDOWS
// ═══════════════════════════════════════════════════════════════════════════

export const WINDOW_API_URL_KEY = '__BAUNITY_API_URL__';
export const WINDOW_API_KEY = '__BAUNITY_API__';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Get token from any key
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sucht nach Auth-Token in localStorage, prüft zuerst neue Keys, dann Legacy-Keys
 */
export function getAuthToken(): string | null {
  // Try new key first
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) return token;

  // Fallback to legacy keys
  for (const key of LEGACY_TOKEN_KEYS) {
    const legacyToken = localStorage.getItem(key);
    if (legacyToken) {
      // Migrate to new key
      localStorage.setItem(AUTH_TOKEN_KEY, legacyToken);
      return legacyToken;
    }
  }

  return null;
}

/**
 * Speichert Auth-Token unter neuem Key
 */
export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Entfernt alle Auth-Token (neue und Legacy-Keys)
 */
export function clearAuthTokens(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Also clear legacy keys
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.removeItem(key);
  }
}
