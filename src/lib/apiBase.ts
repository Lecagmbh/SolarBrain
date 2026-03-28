/**
 * Zentrale API Base URL — funktioniert in Web + Capacitor
 */
const isCap = typeof (window as any).Capacitor !== "undefined";

export const API_BASE: string =
  import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : import.meta.env.VITE_API_BASE
      ? import.meta.env.VITE_API_BASE
      : isCap
        ? "https://solarbrain.de/api"
        : "/api";
