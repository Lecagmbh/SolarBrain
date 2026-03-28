/**
 * useCapacitor — Platform Detection Hook
 * Erkennt ob die App in Capacitor (native) oder im Browser läuft.
 */

const cap = typeof (window as any).Capacitor !== "undefined" ? (window as any).Capacitor : null;

export const isCapacitor = !!cap;
export const isAndroid = cap?.getPlatform?.() === "android";
export const isIOS = cap?.getPlatform?.() === "ios";
export const isNative = isCapacitor && (isAndroid || isIOS);
export const platform = cap?.getPlatform?.() || "web";

export function useCapacitor() {
  return { isCapacitor, isAndroid, isIOS, isNative, platform };
}
