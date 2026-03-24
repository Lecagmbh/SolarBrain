/**
 * Storage Stubs for Wizard
 * Local versions of config/storage exports
 */

export const AUTH_TOKEN_KEY = 'baunity_token';
export const LEGACY_TOKEN_KEYS = ['baunity_auth_token', 'leca_auth_token', 'auth_token'];
export const WINDOW_API_URL_KEY = '__BAUNITY_API_URL__';
export const WINDOW_API_KEY = '__BAUNITY_API_KEY__';
export const USER_DATA_KEY = 'baunity_user_data';

// Learning engine storage keys
export const LEARNING_SESSION_KEY = 'wizard_learning_session';
export const PLZ_CACHE_KEY = 'wizard_plz_cache';
export const REGIONAL_DATA_KEY = 'wizard_regional_data';
export const USER_PATTERN_KEY = 'wizard_user_pattern';

// Wizard-specific storage keys
export const WIZARD_STORE_PREFIX = 'wizard-store';
export const WIZARD_LEARNING_SESSION_KEY = 'wizard_learning_session';
export const WIZARD_FAILED_SESSIONS_KEY = 'wizard_failed_sessions';
export const WIZARD_LAST_ADDRESS_KEY = 'wizard_last_address';
export const WIZARD_LAST_CUSTOMER_KEY = 'wizard_last_customer';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  for (const key of [AUTH_TOKEN_KEY, ...LEGACY_TOKEN_KEYS]) {
    const token = localStorage.getItem(key);
    if (token && (token.includes('.') || token.length > 20)) {
      return token;
    }
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  LEGACY_TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
}
