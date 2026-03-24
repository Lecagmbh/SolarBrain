import { useState } from "react";
import { apiPost } from "../modules/api/client";

export default function MyPasswordPage() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!oldPw || !newPw) return alert("Bitte altes und neues Passwort eingeben.");
    if (newPw !== newPw2) return alert("Neues Passwort stimmt nicht überein.");

    setSaving(true);
    try {
      // nutzt euren bestehenden Endpoint aus PasswordCenterPage (falls vorhanden)
      // FALLBACK: wenn ihr schon /auth/change-password habt, ist das perfekt.
      await apiPost("/auth/change-password", { currentPassword: oldPw, newPassword: newPw });
      setOldPw(""); setNewPw(""); setNewPw2("");
      alert("✅ Passwort geändert.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.error || "Passwort ändern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page" style={{ paddingTop: 12 }}>
      <div style={{
        padding: "18px 18px 16px",
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
        marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(56,189,248,0.16)", border: "1px solid rgba(56,189,248,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔑</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 850, letterSpacing: "-0.02em" }}>Passwort ändern</div>
            <div style={{ fontSize: 13, opacity: 0.88, marginTop: 3 }}>Nur dein eigenes Passwort – keine Admin/Netzbetreiber-Funktionen.</div>
          </div>
        </div>
      </div>

      <div className="dash-card" style={{ padding: 18, maxWidth: 680 }}>
        <label style={label}>Aktuelles Passwort</label>
        <input type="password" style={input} value={oldPw} onChange={(e) => setOldPw(e.target.value)} />

        <div style={{ height: 12 }} />

        <label style={label}>Neues Passwort</label>
        <input type="password" style={input} value={newPw} onChange={(e) => setNewPw(e.target.value)} />

        <div style={{ height: 12 }} />

        <label style={label}>Neues Passwort повтор (Bestätigung)</label>
        <input type="password" style={input} value={newPw2} onChange={(e) => setNewPw2(e.target.value)} />

        <div style={{ height: 16 }} />

        <button className="btn-primary" onClick={submit} disabled={saving} style={{ padding: "10px 16px", borderRadius: 14, minWidth: 180, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Speichern…" : "✅ Passwort ändern"}
        </button>
      </div>
    </div>
  );
}

const label: React.CSSProperties = { fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" };
const input: React.CSSProperties = { width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(2,6,23,0.9)", color: "#e5e7eb", padding: "10px 12px", fontSize: 13 };
