/**
 * D2D Wizard — Bettet den SolarBrain Wizard (solarbrain.de/wizard) 1:1 ein
 * Gleisches Design, gleiche Funktion wie die Standalone-Seite.
 */
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const WIZARD_URL = "https://solarbrain.de/wizard";

export default function D2DWizardPage() {
  const nav = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  // Listener: Wizard sendet postMessage nach Submit
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== "https://solarbrain.de") return;
      if (e.data?.type === "wizard-complete" || e.data?.type === "wizard-close") {
        nav("/leads", { replace: true });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [nav]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#F5F1EB", zIndex: 100 }}>
      {/* Back button overlay */}
      <button
        onClick={() => nav(-1)}
        style={{
          position: "absolute", top: 12, left: 12, zIndex: 110,
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#6B7280",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
      </button>

      {/* Loading */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 12, color: "#6B7280", fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}>
          <div style={{ width: 32, height: 32, border: "2px solid #E5E7EB", borderTopColor: "#22C55E", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Wizard wird geladen...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Wizard iframe — 1:1 wie solarbrain.de/wizard */}
      <iframe
        ref={iframeRef}
        src={WIZARD_URL}
        onLoad={() => setLoading(false)}
        style={{
          width: "100%", height: "100%", border: "none",
          opacity: loading ? 0 : 1, transition: "opacity .3s",
        }}
        allow="geolocation"
        title="SolarBrain Lead-Wizard"
      />
    </div>
  );
}
