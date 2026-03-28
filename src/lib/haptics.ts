/**
 * Haptics — Native Haptic Feedback für Capacitor
 * Fallback: No-op im Browser
 */

type ImpactStyle = "LIGHT" | "MEDIUM" | "HEAVY";

function getHaptics() {
  try {
    return (window as any).Capacitor?.Plugins?.Haptics;
  } catch {
    return null;
  }
}

export function impactLight() {
  getHaptics()?.impact?.({ style: "LIGHT" });
}

export function impactMedium() {
  getHaptics()?.impact?.({ style: "MEDIUM" });
}

export function impactHeavy() {
  getHaptics()?.impact?.({ style: "HEAVY" });
}

export function notificationSuccess() {
  getHaptics()?.notification?.({ type: "SUCCESS" });
}

export function notificationWarning() {
  getHaptics()?.notification?.({ type: "WARNING" });
}

export function notificationError() {
  getHaptics()?.notification?.({ type: "ERROR" });
}

export function vibrate() {
  getHaptics()?.vibrate?.();
}
