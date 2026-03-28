/**
 * Geolocation — Capacitor native oder Browser fallback
 */
import { isCapacitor } from "../hooks/useCapacitor";

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export async function getCurrentPosition(): Promise<Position> {
  // Capacitor: Native GPS (schneller + präziser)
  if (isCapacitor) {
    try {
      const geo = (window as any).Capacitor?.Plugins?.Geolocation;
      if (geo) {
        const pos = await geo.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      }
    } catch {}
  }

  // Browser Fallback
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation nicht verfügbar"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
