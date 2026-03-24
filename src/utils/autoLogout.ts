// ═══════════════════════════════════════════════════════════════════════════
// AUTO-LOGOUT NACH 30 MINUTEN INAKTIVITÄT
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = import.meta.env?.VITE_API_URL || '';

// ═══════════════════════════════════════════════════════════════════════════
// KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;  // 30 Minuten
const WARNING_BEFORE = 2 * 60 * 1000;        // Warnung 2 Min vorher
const TOKEN_REFRESH_INTERVAL = 30 * 1000;    // Token-Check alle 30s

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════

let logoutTimer: number | null = null;
let warningTimer: number | null = null;
let refreshInterval: number | null = null;
let warningShown = false;

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function parseJwt(token: string): Record<string, unknown> | null {
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
  return Math.max(0, (payload.exp as number) - Math.floor(Date.now() / 1000));
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════════════

function logout(reason: string = 'Inaktivität') {
  // Auto-logout triggered
  
  if (logoutTimer) window.clearTimeout(logoutTimer);
  if (warningTimer) window.clearTimeout(warningTimer);
  if (refreshInterval) window.clearInterval(refreshInterval);
  
  localStorage.removeItem('baunity_token');
  localStorage.removeItem('baunity_refresh_token');
  localStorage.removeItem('user');

  alert(`Sie wurden automatisch abgemeldet: ${reason}`);
  window.location.href = '/app/login?expired=1';
}

// ═══════════════════════════════════════════════════════════════════════════
// WARNING DIALOG
// ═══════════════════════════════════════════════════════════════════════════

function showWarning() {
  if (warningShown) return;
  warningShown = true;
  
  // Showing logout warning
  
  const modal = document.createElement('div');
  modal.id = 'auto-logout-warning';
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
        <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 20px;">
          Session läuft ab
        </h2>
        <p style="margin: 0 0 20px 0; color: #6b7280;">
          Sie werden in <strong id="logout-countdown">120</strong> Sekunden automatisch abgemeldet.
        </p>
        <button id="stay-logged-in" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          width: 100%;
        ">
          Angemeldet bleiben
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  let seconds = 120;
  const countdownEl = document.getElementById('logout-countdown');
  const countdownInterval = window.setInterval(() => {
    seconds--;
    if (countdownEl) countdownEl.textContent = String(seconds);
    if (seconds <= 0) {
      window.clearInterval(countdownInterval);
    }
  }, 1000);
  
  document.getElementById('stay-logged-in')?.addEventListener('click', () => {
    // User chose to stay logged in
    window.clearInterval(countdownInterval);
    modal.remove();
    warningShown = false;
    resetActivity();
    void refreshTokens();
  });
}

function hideWarning() {
  const modal = document.getElementById('auto-logout-warning');
  if (modal) {
    modal.remove();
    warningShown = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY TRACKING
// ═══════════════════════════════════════════════════════════════════════════

function resetActivity() {
  if (logoutTimer) window.clearTimeout(logoutTimer);
  if (warningTimer) window.clearTimeout(warningTimer);
  
  hideWarning();
  
  warningTimer = window.setTimeout(() => {
    showWarning();
  }, INACTIVITY_TIMEOUT - WARNING_BEFORE);
  
  logoutTimer = window.setTimeout(() => {
    logout('30 Minuten Inaktivität');
  }, INACTIVITY_TIMEOUT);
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN REFRESH
// ═══════════════════════════════════════════════════════════════════════════

let isRefreshing = false;

async function refreshTokens(): Promise<boolean> {
  if (isRefreshing) return false;
  
  const refreshToken = localStorage.getItem('baunity_refresh_token');
  if (!refreshToken) return false;

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout('Token abgelaufen');
      }
      return false;
    }

    const data = await response.json();
    localStorage.setItem('baunity_token', data.access_token);
    localStorage.setItem('baunity_refresh_token', data.refresh_token);
    
    // Token renewed
    return true;

  } catch (error) {
    console.error('[AutoLogout] Token-Refresh Fehler:', error);
    return false;
  } finally {
    isRefreshing = false;
  }
}

async function checkAndRefreshToken() {
  const token = localStorage.getItem('baunity_token');
  if (!token) return;

  const expirySeconds = getTokenExpirySeconds(token);
  
  if (expirySeconds <= 60) {
    // Token expiring soon, refreshing
    await refreshTokens();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// START/STOP
// ═══════════════════════════════════════════════════════════════════════════

function start() {
  const token = localStorage.getItem('baunity_token');
  if (!token) {
    // No token - auto-logout not started
    return;
  }
  
  // Auto-logout started
  
  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  
  let lastReset = 0;
  const throttledReset = () => {
    const now = Date.now();
    if (now - lastReset > 5000) {
      lastReset = now;
      resetActivity();
    }
  };
  
  events.forEach(event => {
    document.addEventListener(event, throttledReset, { passive: true });
  });
  
  resetActivity();
  
  refreshInterval = window.setInterval(() => {
    void checkAndRefreshToken();
  }, TOKEN_REFRESH_INTERVAL);
  
  void checkAndRefreshToken();
}

function stop() {
  if (logoutTimer) window.clearTimeout(logoutTimer);
  if (warningTimer) window.clearTimeout(warningTimer);
  if (refreshInterval) window.clearInterval(refreshInterval);
  hideWarning();
  // Auto-logout stopped
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-START
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    if (localStorage.getItem('baunity_token')) {
      start();
    }
  }, 1000);
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'baunity_token') {
      if (e.newValue) {
        start();
      } else {
        stop();
      }
    }
  });
}

export { start, stop, resetActivity, refreshTokens, logout };
