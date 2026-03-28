/**
 * MobileLayout — Layout für Capacitor Native App
 * Kein Sidebar, nur Content + BottomTabNav
 */
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import BottomTabNav from "./BottomTabNav";

export default function MobileLayout() {
  // StatusBar styling
  useEffect(() => {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.StatusBar) {
        cap.Plugins.StatusBar.setStyle({ style: "DARK" });
        cap.Plugins.StatusBar.setBackgroundColor({ color: "#060b18" });
      }
    } catch {}
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <Outlet />
      </div>
      <BottomTabNav />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#060b18",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    paddingBottom: 72, // Platz für BottomTabNav
    paddingTop: `env(safe-area-inset-top)` as any,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch" as any,
    // Feste Höhe damit Leaflet Map korrekt rendert
    height: "calc(100vh - 72px)",
  },
};
