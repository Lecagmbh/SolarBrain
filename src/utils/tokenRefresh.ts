// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE AUTO-REFRESH SCRIPT
// ═══════════════════════════════════════════════════════════════════════════
//
// EINFACHSTE LÖSUNG: Kopiere diesen Code und importiere ihn in deiner App.tsx:
//
//   import './utils/tokenRefresh';
//
// Das startet automatisch den Refresh-Prozess wenn ein Token vorhanden ist.
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = import.meta.env?.VITE_API_URL || '';
const REFRESH_INTERVAL = 30 * 1000; // 30 Sekunden
const EXPIRY_BUFFER = 60; // Refresh wenn < 60 Sekunden verbleiben

// Storage Keys (konsistent mit config/storage.ts)
const TOKEN_KEY = 'baunity_token';
const REFRESH_TOKEN_KEY = 'baunity_refresh_token';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════════════════

function parseJwt(token: string): { exp?: number } | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function getTokenExpirySeconds(token: string): number {
  const payload = parseJwt(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}

// ═══════════════════════════════════════════════════════════════════════════
// REFRESH FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

let isRefreshing = false;

async function refreshTokens(): Promise<boolean> {
  if (isRefreshing) return false;

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      console.error('[TokenRefresh] Refresh fehlgeschlagen:', response.status);

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('user');
        window.location.href = '/app/login?expired=1';
      }
      return false;
    }

    const data = await response.json();

    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

    return true;

  } catch (error) {
    console.error('[TokenRefresh] Fehler:', error);
    return false;
  } finally {
    isRefreshing = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-REFRESH CHECK
// ═══════════════════════════════════════════════════════════════════════════

async function checkAndRefresh() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  const expirySeconds = getTokenExpirySeconds(token);

  if (expirySeconds <= EXPIRY_BUFFER) {
    await refreshTokens();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// START INTERVAL
// ═══════════════════════════════════════════════════════════════════════════

let intervalId: number | null = null;

export function startTokenRefresh() {
  if (intervalId) return;

  checkAndRefresh();

  intervalId = window.setInterval(checkAndRefresh, REFRESH_INTERVAL);
}

export function stopTokenRefresh() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-START wenn Token vorhanden
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined' && localStorage.getItem(TOKEN_KEY)) {
  setTimeout(startTokenRefresh, 1000);
}

// Event Listener für Login/Logout
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === TOKEN_KEY) {
      if (e.newValue) {
        startTokenRefresh();
      } else {
        stopTokenRefresh();
      }
    }
  });
}

export { refreshTokens };
