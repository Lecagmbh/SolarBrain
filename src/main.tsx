import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRouter from "./router";
import { AuthProvider } from "./pages/AuthContext";
import { WhiteLabelProvider } from "./contexts/WhiteLabelContext";
import { RealtimeProvider } from "./providers/RealtimeProvider";
import { ErrorBoundary } from "./debug/ErrorBoundary";
import { initSentry } from "./lib/sentry";

initSentry();

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL FETCH INTERCEPTOR: Bearer-Token automatisch bei /api/ Requests
// Viele Komponenten nutzen raw fetch() mit credentials:"include" (Cookies).
// Kunden die nur einen JWT-Token haben (kein Session-Cookie) brauchen
// zusätzlich den Authorization-Header.
// ═══════════════════════════════════════════════════════════════════════════
const _originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

  // Nur /api/ Requests intercepten
  if (url.includes('/api/')) {
    const token = localStorage.getItem('baunity_token');
    if (token) {
      const headers = new Headers(init?.headers);
      // Nur setzen wenn nicht schon vorhanden
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      init = { ...init, headers };
    }
  }

  return _originalFetch.call(this, input, init);
};

// Auto-Reload bei veralteten Chunks nach neuem Build
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

// Design System (must be first)
import "./styles/design-system.css";
// Legacy styles (kept for compatibility)
import "./styles/wizard-modern.css";

// React Query Client mit Enterprise-Scale Defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 Sekunden - Daten bleiben frisch
      gcTime: 5 * 60 * 1000, // 5 Minuten - Cache behalten
      retry: 1,
      refetchOnWindowFocus: false, // Nicht bei jedem Tab-Wechsel neu laden
    },
  },
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealtimeProvider>
            <WhiteLabelProvider>
              <AppRouter />
            </WhiteLabelProvider>
          </RealtimeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
