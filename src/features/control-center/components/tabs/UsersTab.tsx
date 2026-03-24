/**
 * UsersTab - Redirect to consolidated KundenPage
 */
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function UsersTab() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/kunden", { replace: true });
  }, [navigate]);

  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 16 }}>
        Die Benutzerverwaltung wurde nach <strong style={{ color: "#EAD068" }}>Kunden & Benutzer</strong> verschoben.
      </p>
      <a
        href="/kunden"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 20px", background: "rgba(212,168,67,0.15)",
          border: "1px solid rgba(212,168,67,0.3)", borderRadius: 10,
          color: "#EAD068", fontSize: 14, fontWeight: 600, textDecoration: "none",
        }}
      >
        Zur Benutzerverwaltung
      </a>
    </div>
  );
}
