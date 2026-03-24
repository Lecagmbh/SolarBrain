/**
 * MOCK V4 — Detail-Panel Tabs, Premium Edition
 * /mock/detail-tabs
 */
import { useState } from "react";

// ─── Design System ───────────────────────────────────────────────────────────

const C = {
  bg: "#0a0a0f", card: "rgba(17,20,35,0.95)", panel: "#0c0c18",
  border: "rgba(212,168,67,0.08)", borderLight: "rgba(255,255,255,0.05)",
  text: "#e2e8f0", dim: "#64748b", muted: "#94a3b8", bright: "#f8fafc",
  accent: "#D4A843", accentLight: "#a5b4fc",
  blue: "#3b82f6", green: "#22c55e", orange: "#f97316", red: "#ef4444",
  cyan: "#06b6d4", purple: "#f0d878", pink: "#ec4899",
};

const css = `
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalIn{from{opacity:0;transform:scale(0.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes backdropIn{from{opacity:0}to{opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes checkPop{0%{transform:scale(0)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
.fade-in{animation:fadeIn .25s ease both}
.slide-up{animation:slideUp .3s ease both}
.card-hover{transition:all .18s ease}.card-hover:hover{border-color:rgba(212,168,67,0.2)!important;transform:translateY(-1px);box-shadow:0 4px 24px rgba(0,0,0,0.35)}
.row-hover{transition:background .1s}.row-hover:hover{background:rgba(212,168,67,0.03)!important}
.email-row{transition:all .15s ease;cursor:pointer;border-radius:10px}.email-row:hover{background:rgba(212,168,67,0.05)!important;transform:translateX(2px)}
.doc-card-hover{transition:all .2s ease;cursor:pointer}.doc-card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.4)!important;border-color:rgba(212,168,67,0.25)!important}
.attach-card{transition:all .15s ease;cursor:pointer}.attach-card:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.3);border-color:rgba(212,168,67,0.2)!important}
.btn-hover{transition:all .15s ease}.btn-hover:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.3)}
`;

const cardS: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" };
const badge = (bg: string, c: string): React.CSSProperties => ({ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: bg, color: c, display: "inline-flex", alignItems: "center", gap: 3 });

// ─── Reusable Components ─────────────────────────────────────────────────────

function CopyBtn({ value, label, size = "sm" }: { value: string; label?: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="btn-hover"
      style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(212,168,67,0.06)", border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : C.border}`, borderRadius: 6, padding: size === "md" ? "5px 14px" : "3px 10px", fontSize: size === "md" ? 11 : 9, color: copied ? C.green : C.accentLight, cursor: "pointer", fontWeight: 600, transition: "all .15s", flexShrink: 0, letterSpacing: 0.2 }}>
      {copied ? "✓ Kopiert" : label || "Kopieren"}
    </button>
  );
}

/** Copy-Row with always-visible copy button for each field */
function CopyRow({ label, value, mono, important }: { label: string; value: string; mono?: boolean; important?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value || value === "—") return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderBottom: `1px solid ${C.borderLight}` }}>
      <span style={{ fontSize: 11, color: C.dim }}>{label}</span><span style={{ fontSize: 11, color: "#374151" }}>—</span>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "5px 10px", borderBottom: `1px solid ${C.borderLight}`, gap: 8, transition: "background .1s", borderRadius: 4, ...(copied ? { background: "rgba(34,197,94,0.04)" } : {}) }}>
      <span style={{ fontSize: 11, color: C.dim, flexShrink: 0, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 12, color: copied ? C.green : (important ? C.bright : C.text), fontWeight: important ? 600 : 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color .15s", ...(mono ? { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: copied ? C.green : C.accentLight } : {}) }}>
        {copied ? "✓ Kopiert" : value}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{
          background: copied ? "rgba(34,197,94,0.12)" : "rgba(212,168,67,0.06)",
          border: `1px solid ${copied ? "rgba(34,197,94,0.2)" : "rgba(212,168,67,0.08)"}`,
          borderRadius: 4, padding: "2px 6px", fontSize: 9, fontWeight: 600,
          color: copied ? C.green : C.accentLight,
          cursor: "pointer", transition: "all .15s", flexShrink: 0,
          opacity: copied ? 1 : 0.7,
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={e => { if (!copied) (e.target as HTMLElement).style.opacity = "0.7"; }}
      >
        {copied ? "✓" : "📋"}
      </button>
    </div>
  );
}

/** Premium Modal with backdrop blur + gradient border glow */
function Modal({ open, onClose, title, width = 800, subtitle, headerActions, children }: {
  open: boolean; onClose: () => void; title: string; width?: number;
  subtitle?: string; headerActions?: React.ReactNode; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", animation: "backdropIn .2s ease both" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width, maxWidth: "95vw", maxHeight: "85vh",
        background: "linear-gradient(180deg, #141828 0%, #0f1220 100%)",
        border: `1px solid ${C.accent}20`,
        borderRadius: 20,
        boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,168,67,0.08), inset 0 1px 0 rgba(255,255,255,0.03)`,
        overflow: "hidden", display: "flex", flexDirection: "column",
        animation: "modalIn .3s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
          background: "rgba(255,255,255,0.01)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.bright, letterSpacing: -0.3 }}>{title}</span>
            {subtitle && <span style={{ fontSize: 11, color: C.dim }}>{subtitle}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {headerActions}
            <button onClick={onClose} className="btn-hover" style={{
              background: "rgba(239,68,68,0.06)", color: C.red,
              border: `1px solid rgba(239,68,68,0.12)`, borderRadius: 8,
              padding: "7px 16px", fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}>
              Schließen
            </button>
          </div>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Premium Email Preview Modal — Gmail/Outlook-style */
function EmailPreviewModal({ msg, open, onClose }: {
  msg: { dir: string; subj: string; from: string; to: string; date: string; body: string; files: string[] } | null;
  open: boolean; onClose: () => void;
}) {
  const [copiedBody, setCopiedBody] = useState(false);
  if (!open || !msg) return null;
  const isIn = msg.dir === "in";
  const senderName = msg.from.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const senderDomain = msg.from.split("@")[1] || "";
  const initials = senderName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Modal open={open} onClose={onClose} title={msg.subj} width={780}
      subtitle={`${isIn ? "Eingehend" : "Gesendet"} · ${msg.date}`}
      headerActions={
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-hover" style={{ background: "rgba(212,168,67,0.06)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, color: C.accentLight, cursor: "pointer", fontWeight: 600 }}>
            ↩ Antworten
          </button>
          <button className="btn-hover" style={{ background: "rgba(212,168,67,0.06)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, color: C.accentLight, cursor: "pointer", fontWeight: 600 }}>
            ↪ Weiterleiten
          </button>
        </div>
      }
    >
      <div style={{ padding: "20px 24px" }}>
        {/* Sender Card */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: isIn ? `linear-gradient(135deg, ${C.cyan}30, ${C.blue}20)` : `linear-gradient(135deg, ${C.accent}30, ${C.purple}20)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: isIn ? C.cyan : C.accentLight,
            border: `1px solid ${isIn ? C.cyan : C.accent}15`, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.bright }}>{senderName}</span>
              <span style={badge(isIn ? C.cyan + "15" : C.accent + "15", isIn ? C.cyan : C.accent)}>
                {isIn ? "Eingang" : "Gesendet"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.dim, display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.muted, minWidth: 28 }}>Von</span>
                <span style={{ color: C.text, fontFamily: "monospace", fontSize: 11 }}>{msg.from}</span>
                <CopyBtn value={msg.from} size="sm" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.muted, minWidth: 28 }}>An</span>
                <span style={{ color: C.text, fontFamily: "monospace", fontSize: 11 }}>{msg.to}</span>
                <CopyBtn value={msg.to} size="sm" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.muted, minWidth: 28 }}>Am</span>
                <span style={{ color: C.muted }}>{msg.date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Body — styled like a real email */}
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Top toolbar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 16px", background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <span style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Nachricht</span>
            <button
              className="btn-hover"
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(msg.body); setCopiedBody(true); setTimeout(() => setCopiedBody(false), 2000); }}
              style={{
                background: copiedBody ? "rgba(34,197,94,0.12)" : "rgba(212,168,67,0.06)",
                border: `1px solid ${copiedBody ? "rgba(34,197,94,0.2)" : C.border}`,
                borderRadius: 6, padding: "4px 12px", fontSize: 10, fontWeight: 600,
                color: copiedBody ? C.green : C.accentLight, cursor: "pointer",
              }}
            >
              {copiedBody ? "✓ Text kopiert" : "Gesamten Text kopieren"}
            </button>
          </div>
          {/* Body content */}
          <div style={{
            padding: "24px 28px",
            background: "linear-gradient(180deg, #fefefe 0%, #f8f9fa 100%)",
            color: "#1a1a2e", fontSize: 13.5, lineHeight: 1.85,
            whiteSpace: "pre-wrap",
            fontFamily: "'Segoe UI', 'SF Pro Text', -apple-system, sans-serif",
            minHeight: 160, maxHeight: 420, overflowY: "auto",
          }}>
            {msg.body}
          </div>
        </div>

        {/* Attachments */}
        {msg.files.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.bright, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>📎</span> Anhänge
              <span style={badge(C.accent + "15", C.accentLight)}>{msg.files.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 }}>
              {msg.files.map(f => {
                const ext = f.split(".").pop()?.toUpperCase() || "";
                const isImg = ["JPG", "PNG", "JPEG"].includes(ext);
                return (
                  <div key={f} className="attach-card" style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${C.border}`, borderRadius: 10,
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: isImg ? `${C.orange}10` : `${C.red}10`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {isImg ? "🖼" : "📄"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</div>
                      <div style={{ fontSize: 9, color: C.dim, marginTop: 1 }}>{ext} · ~200 KB</div>
                    </div>
                    <div style={{ fontSize: 10, color: C.accentLight, opacity: 0.6 }}>↓</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Premium Document Viewer Modal */
function DocViewerModal({ doc, open, onClose }: {
  doc: { name: string; ext: string; size: string; pages?: number; date?: string; cat?: string } | null;
  open: boolean; onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  if (!open || !doc) return null;
  const isImg = ["JPG", "PNG", "JPEG"].includes(doc.ext);
  const totalPages = doc.pages || 1;
  const extColor: Record<string, string> = { PDF: C.red, JPG: C.orange, PNG: C.orange, DWG: C.blue };
  const ec = extColor[doc.ext] || C.dim;

  return (
    <Modal open={open} onClose={onClose}
      title={`${doc.name}.${doc.ext.toLowerCase()}`}
      subtitle={[doc.ext, doc.size, doc.pages && doc.pages > 0 ? `${doc.pages} Seiten` : null, doc.date].filter(Boolean).join(" · ")}
      width={950}
      headerActions={
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-hover" style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            ↓ Download
          </button>
          <button className="btn-hover" style={{ background: "rgba(255,255,255,0.04)", color: C.accentLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 16px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
            🖨 Drucken
          </button>
        </div>
      }
    >
      {/* Toolbar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 20px",
        background: "rgba(255,255,255,0.015)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={badge(ec + "15", ec)}>{doc.ext}</span>
          {doc.cat && <span style={{ fontSize: 10, color: C.dim }}>{doc.cat}</span>}
        </div>
        {!isImg && totalPages > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: page <= 1 ? C.dim : C.accentLight, cursor: page <= 1 ? "default" : "pointer" }}>
              ‹
            </button>
            <span style={{ fontSize: 11, color: C.muted, minWidth: 60, textAlign: "center" }}>
              Seite {page} / {totalPages}
            </span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: page >= totalPages ? C.dim : C.accentLight, cursor: page >= totalPages ? "default" : "pointer" }}>
              ›
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: C.muted, cursor: "pointer" }}>
            ⊖ 100% ⊕
          </button>
        </div>
      </div>

      {/* Document Preview Area */}
      <div style={{
        height: 560, display: "flex", alignItems: "center", justifyContent: "center",
        background: isImg ? "radial-gradient(circle at center, #1a1a24 0%, #0c0c14 100%)" : "linear-gradient(180deg, #e4e4e8 0%, #d8d8dc 100%)",
        position: "relative",
      }}>
        {/* Checkerboard pattern for images */}
        {isImg ? (
          <div style={{
            width: "75%", height: "85%", borderRadius: 8,
            background: `linear-gradient(135deg, ${C.orange}08, ${C.orange}02)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.orange}15`,
            boxShadow: `0 8px 40px rgba(0,0,0,0.4)`,
            position: "relative",
          }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 80, opacity: 0.15, display: "block" }}>🖼</span>
              <div style={{ fontSize: 13, color: C.dim, fontWeight: 600, marginTop: 8 }}>{doc.name}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 4, opacity: 0.6 }}>Bild-Vorschau</div>
            </div>
            {/* Image info overlay */}
            <div style={{
              position: "absolute", bottom: 12, left: 12, right: 12,
              display: "flex", justifyContent: "space-between",
              padding: "8px 12px", background: "rgba(0,0,0,0.5)", borderRadius: 8,
              backdropFilter: "blur(8px)",
            }}>
              <span style={{ fontSize: 10, color: C.muted }}>{doc.size}</span>
              <span style={{ fontSize: 10, color: C.muted }}>{doc.date}</span>
            </div>
          </div>
        ) : (
          <div style={{
            width: "55%", height: "92%",
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 4px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)",
            display: "flex", flexDirection: "column",
            position: "relative", overflow: "hidden",
          }}>
            {/* PDF page header bar */}
            <div style={{
              padding: "16px 24px 12px",
              borderBottom: "1px solid #e8e8e8",
              background: "#fafafa",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                {doc.cat || "Dokument"}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{doc.name}</div>
            </div>
            {/* Simulated content lines */}
            <div style={{ flex: 1, padding: "20px 24px", overflow: "hidden" }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} style={{
                  height: i === 0 ? 10 : i % 5 === 0 ? 0 : 8,
                  width: i === 0 ? "40%" : i % 7 === 0 ? "60%" : i % 3 === 0 ? "85%" : "95%",
                  background: i % 5 === 0 ? "transparent" : "#e8e8ec",
                  borderRadius: 4,
                  marginBottom: i % 5 === 0 ? 12 : 8,
                  opacity: 1 - (i * 0.03),
                }} />
              ))}
            </div>
            {/* Page number */}
            <div style={{ padding: "8px 24px", borderTop: "1px solid #eee", textAlign: "center" }}>
              <span style={{ fontSize: 10, color: "#999" }}>— {page} —</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK = {
  betreiber: { vorname: "Max", nachname: "Müller", typ: "Privat", anrede: "Herr", strasse: "Hauptstraße", hausnr: "15", plz: "79100", ort: "Freiburg", email: "max.mueller@gmail.com", telefon: "+49 761 12345678", geburtsdatum: "15.03.1985" },
  anlage: { kwp: "12.40", module: "JA Solar JAM54S30-460/MR", modulAnzahl: "28", modulWp: "460", wr: "Huawei SUN2000-12KTL-M5", wrAnzahl: "1", wrKw: "12", wrKva: "13.2", speicher: "Huawei LUNA2000-10-S0", spKwh: "10", spKopplung: "DC", wallbox: "ABL eMH3 (11 kW)", wallboxKw: "11", wp: "", wpKw: "", einspeisung: "Überschuss", messkonzept: "ZR2", ausrichtung: "Süd, 30°" },
  standort: { strasse: "Hauptstraße", hausnr: "15", plz: "79100", ort: "Freiburg", bundesland: "Baden-Württemberg", gemarkung: "Freiburg", flur: "12", flurstuck: "1234/5", gps: "47.99590, 7.84961" },
  zaehler: { nummer: "1EMH0012345678", typ: "Drehstromzähler", standort: "Keller, HAK links", zaehlpunkt: "DE000561234560000000000000012345", marktlokation: "DE00056123456000000000000001234500" },
  nb: { name: "Stadtwerke Freiburg", email: "netzanschluss@sw-freiburg.de", portal: "https://netze.sw-freiburg.de", az: "SNB-2026-14832" },
  dedicatedEmail: "inst-2186@na.lecagmbh.de",
  publicId: "INST-2186",
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ADMIN-SCHNELLZUGRIFF
// ═══════════════════════════════════════════════════════════════════════════════

function TabAdmin() {
  const [copiedAll, setCopiedAll] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const d = MOCK;

  const nbEmailSubject = `Netzanschlussantrag PV ${d.anlage.kwp} kWp — ${d.betreiber.vorname} ${d.betreiber.nachname}, ${d.standort.strasse} ${d.standort.hausnr}, ${d.standort.plz} ${d.standort.ort}`;

  const nbEmailText = `Sehr geehrte Damen und Herren,

hiermit stellen wir den Netzanschlussantrag für folgende Anlage:

ANLAGENBETREIBER:
${d.betreiber.anrede} ${d.betreiber.vorname} ${d.betreiber.nachname}
${d.betreiber.strasse} ${d.betreiber.hausnr}, ${d.betreiber.plz} ${d.betreiber.ort}
E-Mail: ${d.betreiber.email}
Tel: ${d.betreiber.telefon}

ANLAGENSTANDORT:
${d.standort.strasse} ${d.standort.hausnr}, ${d.standort.plz} ${d.standort.ort}
Gemarkung: ${d.standort.gemarkung}, Flurstück: ${d.standort.flurstuck}

ANLAGENDATEN:
PV-Leistung: ${d.anlage.kwp} kWp
Module: ${d.anlage.modulAnzahl}× ${d.anlage.module} (${d.anlage.modulWp} Wp)
Wechselrichter: ${d.anlage.wrAnzahl}× ${d.anlage.wr} (${d.anlage.wrKw} kW / ${d.anlage.wrKva} kVA)
Speicher: ${d.anlage.speicher} (${d.anlage.spKwh} kWh, ${d.anlage.spKopplung}-gekoppelt)${d.anlage.wallbox ? `\nWallbox: ${d.anlage.wallbox}` : ""}${d.anlage.wp ? `\nWärmepumpe: ${d.anlage.wp}` : ""}
Einspeiseart: ${d.anlage.einspeisung}
Messkonzept: ${d.anlage.messkonzept}

ZÄHLER:
Zählernummer: ${d.zaehler.nummer}
Zählpunktbezeichnung: ${d.zaehler.zaehlpunkt}

Im Anhang finden Sie:
- E.1 Antragstellung (VDE-AR-N 4105)
- E.2 Datenblatt EZE
- Lageplan
- Übersichtsschaltplan

Mit freundlichen Grüßen
LeCa GmbH & Co. KG
Vogesenblick 21, 77933 Lahr

Antwort-Email: ${d.dedicatedEmail}`;

  const copyAll = () => {
    const lines = [
      `ANLAGENBETREIBER:`,
      `${d.betreiber.anrede} ${d.betreiber.vorname} ${d.betreiber.nachname}`,
      `${d.betreiber.strasse} ${d.betreiber.hausnr}, ${d.betreiber.plz} ${d.betreiber.ort}`,
      `E-Mail: ${d.betreiber.email} | Tel: ${d.betreiber.telefon} | Geb: ${d.betreiber.geburtsdatum}`,
      ``,
      `ANLAGENSTANDORT:`,
      `${d.standort.strasse} ${d.standort.hausnr}, ${d.standort.plz} ${d.standort.ort}`,
      `${d.standort.bundesland} | Gemarkung: ${d.standort.gemarkung} | Flur: ${d.standort.flur} | Flurstück: ${d.standort.flurstuck}`,
      `GPS: ${d.standort.gps}`,
      ``,
      `ANLAGE: ${d.anlage.kwp} kWp`,
      `Module: ${d.anlage.modulAnzahl}× ${d.anlage.module} (${d.anlage.modulWp} Wp) | Ausrichtung: ${d.anlage.ausrichtung}`,
      `WR: ${d.anlage.wrAnzahl}× ${d.anlage.wr} (${d.anlage.wrKw} kW / ${d.anlage.wrKva} kVA)`,
      `Speicher: ${d.anlage.speicher} (${d.anlage.spKwh} kWh, ${d.anlage.spKopplung})`,
      d.anlage.wallbox ? `Wallbox: ${d.anlage.wallbox} (${d.anlage.wallboxKw} kW)` : "",
      d.anlage.wp ? `Wärmepumpe: ${d.anlage.wp} (${d.anlage.wpKw} kW)` : "",
      `Einspeisung: ${d.anlage.einspeisung} | Messkonzept: ${d.anlage.messkonzept}`,
      ``,
      `ZÄHLER:`,
      `Nr: ${d.zaehler.nummer} | Typ: ${d.zaehler.typ} | Standort: ${d.zaehler.standort}`,
      `ZPB: ${d.zaehler.zaehlpunkt}`,
      `MLO: ${d.zaehler.marktlokation}`,
      ``,
      `NETZBETREIBER: ${d.nb.name}`,
      `Email: ${d.nb.email} | Az: ${d.nb.az}`,
      `Installations-Email: ${d.dedicatedEmail}`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  return (
    <div className="fade-in">
      {/* Quick-Action Bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={copyAll} style={{ background: copiedAll ? C.green : C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
          {copiedAll ? "✓ Alles kopiert!" : "📋 Alle Daten kopieren"}
        </button>
        <button onClick={() => setEmailModal(true)} style={{ background: "rgba(255,255,255,0.04)", color: C.blue, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          📧 NB-Email Vorschau
        </button>
        {d.nb.portal && (
          <a href={d.nb.portal} target="_blank" rel="noopener" style={{ background: "rgba(255,255,255,0.04)", color: C.cyan, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
            🌐 NB-Portal öffnen
          </a>
        )}
      </div>

      {/* NB-Email Preview — Premium Modal */}
      <EmailPreviewModal
        msg={emailModal ? {
          dir: "out", subj: nbEmailSubject, from: "netzanmeldung@lecagmbh.de", to: d.nb.email,
          date: "02.03.2026 09:14", body: nbEmailText,
          files: ["E1_Antrag.pdf", "E2_Datenblatt.pdf", "Lageplan.pdf", "Schaltplan.pdf"],
        } : null}
        open={emailModal} onClose={() => setEmailModal(false)}
      />

      {/* Data Cards — 2×2 Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Betreiber */}
        <div style={cardS} className="card-hover">
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.bright }}>👤 Anlagenbetreiber</span>
            <span style={badge(C.green + "15", C.green)}>{d.betreiber.typ}</span>
          </div>
          <div style={{ padding: "4px 6px" }}>
            <CopyRow label="Vorname" value={d.betreiber.vorname} important />
            <CopyRow label="Nachname" value={d.betreiber.nachname} important />
            <CopyRow label="Straße" value={d.betreiber.strasse} important />
            <CopyRow label="Hausnr." value={d.betreiber.hausnr} important />
            <CopyRow label="PLZ" value={d.betreiber.plz} important />
            <CopyRow label="Ort" value={d.betreiber.ort} important />
            <CopyRow label="E-Mail" value={d.betreiber.email} />
            <CopyRow label="Telefon" value={d.betreiber.telefon} />
            <CopyRow label="Geburtsdatum" value={d.betreiber.geburtsdatum} />
          </div>
        </div>

        {/* Standort */}
        <div style={cardS} className="card-hover">
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.bright }}>📍 Anlagenstandort</span>
            <a href={`https://maps.google.com/?q=${d.standort.gps}`} target="_blank" rel="noopener" style={{ fontSize: 10, color: C.accentLight, textDecoration: "none" }}>🗺 Maps ↗</a>
          </div>
          <div style={{ padding: "4px 6px" }}>
            <CopyRow label="Straße" value={d.standort.strasse} important />
            <CopyRow label="Hausnr." value={d.standort.hausnr} important />
            <CopyRow label="PLZ" value={d.standort.plz} important />
            <CopyRow label="Ort" value={d.standort.ort} important />
            <CopyRow label="Bundesland" value={d.standort.bundesland} />
            <CopyRow label="Gemarkung" value={d.standort.gemarkung} />
            <CopyRow label="Flur" value={d.standort.flur} />
            <CopyRow label="Flurstück" value={d.standort.flurstuck} />
            <CopyRow label="GPS" value={d.standort.gps} mono />
          </div>
        </div>

        {/* Anlage */}
        <div style={cardS} className="card-hover">
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.bright }}>⚡ Anlagendaten</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.green, letterSpacing: -1 }}>{d.anlage.kwp} <span style={{ fontSize: 11, fontWeight: 600 }}>kWp</span></span>
          </div>
          <div style={{ padding: "4px 6px" }}>
            <div style={{ display: "flex", gap: 4, padding: "6px 8px" }}>
              {[
                { v: d.anlage.kwp, u: "kWp", c: C.green },
                { v: d.anlage.wrKva, u: "kVA", c: C.cyan },
                { v: d.anlage.spKwh, u: "kWh", c: C.purple },
                ...(d.anlage.wallboxKw ? [{ v: d.anlage.wallboxKw, u: "kW WB", c: C.orange }] : []),
              ].map(x => (
                <div key={x.u} style={{ flex: 1, background: x.c + "08", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: x.c }}>{x.v}</div>
                  <div style={{ fontSize: 9, color: x.c, opacity: 0.7 }}>{x.u}</div>
                </div>
              ))}
            </div>
            <CopyRow label="Module" value={`${d.anlage.modulAnzahl}× ${d.anlage.module}`} important />
            <CopyRow label="Modul-Leistung" value={`${d.anlage.modulWp} Wp`} />
            <CopyRow label="Wechselrichter" value={`${d.anlage.wrAnzahl}× ${d.anlage.wr}`} important />
            <CopyRow label="WR-Leistung" value={`${d.anlage.wrKw} kW / ${d.anlage.wrKva} kVA`} />
            <CopyRow label="Speicher" value={d.anlage.speicher} important />
            <CopyRow label="Sp.-Kapazität" value={`${d.anlage.spKwh} kWh (${d.anlage.spKopplung})`} />
            {d.anlage.wallbox && <CopyRow label="Wallbox" value={d.anlage.wallbox} important />}
            {d.anlage.wp && <CopyRow label="Wärmepumpe" value={d.anlage.wp} important />}
            <CopyRow label="Ausrichtung" value={d.anlage.ausrichtung} />
            <CopyRow label="Einspeisung" value={d.anlage.einspeisung} />
            <CopyRow label="Messkonzept" value={d.anlage.messkonzept} />
          </div>
        </div>

        {/* Zähler + NB + Inst-Email */}
        <div style={cardS} className="card-hover">
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.bright }}>🔌 Zähler, NB & Kommunikation</span>
          </div>
          <div style={{ padding: "4px 6px" }}>
            <CopyRow label="Zählernr." value={d.zaehler.nummer} mono important />
            <CopyRow label="Typ" value={d.zaehler.typ} />
            <CopyRow label="Standort" value={d.zaehler.standort} />
            <CopyRow label="Zählpunkt" value={d.zaehler.zaehlpunkt} mono />
            <CopyRow label="Marktlokation" value={d.zaehler.marktlokation} mono />
            <div style={{ height: 1, background: C.accent + "15", margin: "6px 8px" }} />
            <div style={{ padding: "6px 8px", display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blue + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.bright }}>{d.nb.name}</div>
                {d.nb.az && <div style={{ fontSize: 10, color: C.dim }}>Az: {d.nb.az}</div>}
              </div>
            </div>
            <CopyRow label="NB-Email" value={d.nb.email} />
            <CopyRow label="Portal" value={d.nb.portal} />
            <div style={{ height: 1, background: C.green + "15", margin: "6px 8px" }} />
            <CopyRow label="Installations-Email" value={d.dedicatedEmail} mono important />
            <CopyRow label="Public-ID" value={d.publicId} mono />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: NB-KOMM (unverändert, nur Email-Preview als Modal)
// ═══════════════════════════════════════════════════════════════════════════════

function TabNbKomm() {
  const [expanded, setExpanded] = useState<number | null>(1);
  const [previewMsg, setPreviewMsg] = useState<any>(null);

  const threads = [
    { id: 1, nb: "Stadtwerke Freiburg", status: "rueckfrage", unread: 1, lastDate: "15.03.2026", msgs: [
      { id: 1, dir: "out", subj: "Netzanschlussantrag PV 12,4 kWp — Müller", date: "02.03.2026 09:14", from: "netzanmeldung@lecagmbh.de", to: "netzanschluss@sw-freiburg.de", body: "Sehr geehrte Damen und Herren,\n\nhiermit stellen wir den Netzanschlussantrag für die oben genannte PV-Anlage.\n\nIm Anhang finden Sie:\n- E.1 Antragstellung\n- E.2 Datenblatt\n- Lageplan\n- Übersichtsschaltplan\n\nMit freundlichen Grüßen\nLeCa GmbH", files: ["E1_Antrag.pdf", "E2_Datenblatt.pdf", "Lageplan.pdf", "Schaltplan.pdf"] },
      { id: 2, dir: "in", subj: "RE: Rückfrage Zählerplatz", date: "08.03.2026 14:22", from: "m.weber@sw-freiburg.de", to: "netzanmeldung@lecagmbh.de", body: "Sehr geehrte Damen und Herren,\n\nwir benötigen noch:\n1. Foto des vorhandenen Zählerplatzes\n2. Bestätigung der Wandlermessung\n\nBitte innerhalb 14 Tagen nachreichen.\n\nM. Weber, Netzanschlüsse", files: [] },
      { id: 3, dir: "out", subj: "RE: Unterlagen nachgereicht", date: "15.03.2026 10:45", from: "netzanmeldung@lecagmbh.de", to: "m.weber@sw-freiburg.de", body: "Sehr geehrter Herr Weber,\n\nim Anhang die angeforderten Unterlagen.\n\nMit freundlichen Grüßen", files: ["Zaehlerplatz.jpg", "Wandlermessung.pdf"] },
    ]},
    { id: 2, nb: "Netze BW", status: "genehmigt", unread: 0, lastDate: "10.03.2026", msgs: [
      { id: 4, dir: "out", subj: "Netzanschlussantrag PV+Speicher 8,28 kWp", date: "20.02.2026 11:30", from: "netzanmeldung@lecagmbh.de", to: "einspeiser@netze-bw.de", body: "Antrag mit allen Anlagen...", files: ["E1_Antrag.pdf", "E2_Datenblatt.pdf"] },
      { id: 5, dir: "in", subj: "Genehmigung — Az: SNB-2026-14832", date: "10.03.2026 08:15", from: "genehmigung@netze-bw.de", to: "netzanmeldung@lecagmbh.de", body: "Hiermit genehmigen wir den Netzanschluss.\n\nAktenzeichen: SNB-2026-14832\nGültigkeit: 12 Monate\n\nBitte Zählertermin vereinbaren.", files: ["Genehmigung_SNB-2026-14832.pdf"] },
    ]},
  ];

  const stBadge = (s: string) => { const m: Record<string, [string, string]> = { rueckfrage: ["Rückfrage", C.red], genehmigt: ["Genehmigt", C.green] }; const [l, c] = m[s] || [s, C.dim]; return <span style={badge(c + "15", c)}>{l}</span>; };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>📧</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>NB-Kommunikation</span>
        <span style={badge(C.accent + "15", C.accentLight)}>{threads.reduce((s, t) => s + t.msgs.length, 0)}</span>
      </div>

      {/* Premium Email Preview Modal */}
      <EmailPreviewModal msg={previewMsg} open={!!previewMsg} onClose={() => setPreviewMsg(null)} />

      {threads.map(t => (
        <div key={t.id} style={{ ...cardS, marginBottom: 10 }} className="card-hover">
          <div style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: expanded === t.id ? `1px solid ${C.borderLight}` : "none" }}
            onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}15, ${C.accent}10)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.bright }}>{t.nb}</div>
                <div style={{ fontSize: 10, color: C.dim }}>{t.msgs.length} Nachrichten · {t.lastDate}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {t.unread > 0 && <div style={{ width: 20, height: 20, borderRadius: 10, background: C.red, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.unread}</div>}
              {stBadge(t.status)}
              <span style={{ fontSize: 18, color: C.dim, transition: "transform .2s", transform: expanded === t.id ? "rotate(180deg)" : "" }}>▾</span>
            </div>
          </div>
          {expanded === t.id && (
            <div style={{ padding: "6px 10px 10px" }}>
              {t.msgs.map((msg, i) => {
                const isIn = msg.dir === "in";
                return (
                  <div key={msg.id} className="fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="row-hover" onClick={() => setPreviewMsg(msg)}
                      style={{ display: "flex", gap: 10, padding: "10px 10px", borderRadius: 8, cursor: "pointer", borderLeft: `3px solid ${isIn ? C.cyan : C.accent}`, marginBottom: 4 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0, paddingTop: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: isIn ? C.cyan : C.accent, boxShadow: `0 0 6px ${isIn ? C.cyan : C.accent}30` }} />
                        {i < t.msgs.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4, minHeight: 16 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                            <span style={badge(isIn ? C.cyan + "15" : C.accent + "15", isIn ? C.cyan : C.accent)}>{isIn ? "📨 Eingang" : "📤 Gesendet"}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.subj}</span>
                          </div>
                          <span style={{ fontSize: 10, color: C.dim, flexShrink: 0, fontFamily: "monospace" }}>{msg.date}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.dim }}>{isIn ? `Von: ${msg.from}` : `An: ${msg.to}`}</div>
                        {msg.files.length > 0 && (
                          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                            {msg.files.map((f, j) => <span key={j} style={{ fontSize: 9, padding: "2px 8px", background: "rgba(212,168,67,0.06)", border: `1px solid ${C.border}`, borderRadius: 4, color: C.accentLight }}>📎 {f}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: DOKUMENTE (Preview als Modal)
// ═══════════════════════════════════════════════════════════════════════════════

function TabDokumente() {
  const [filter, setFilter] = useState("alle");
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const cats = [
    { key: "vde", label: "VDE", icon: "📋", color: C.accent, docs: [
      { id: 1, name: "E.1 Antragstellung NS", ext: "PDF", size: "245 KB", pages: 3, date: "02.03.2026", status: "ok" },
      { id: 2, name: "E.2 Datenblatt EZE", ext: "PDF", size: "189 KB", pages: 5, date: "02.03.2026", status: "ok" },
      { id: 3, name: "E.9 IBN-Protokoll", ext: "PDF", size: "—", pages: 0, date: "—", status: "entwurf" },
    ]},
    { key: "plan", label: "Pläne", icon: "📐", color: C.blue, docs: [
      { id: 4, name: "Lageplan Hauptstr. 15", ext: "PDF", size: "1.2 MB", pages: 1, date: "28.02.2026", status: "ok" },
      { id: 5, name: "Übersichtsschaltplan", ext: "PDF", size: "890 KB", pages: 2, date: "28.02.2026", status: "ok" },
    ]},
    { key: "nb", label: "NB-Docs", icon: "🏢", color: C.green, docs: [
      { id: 7, name: "Genehmigung SNB-2026-14832", ext: "PDF", size: "156 KB", pages: 2, date: "10.03.2026", status: "ok" },
    ]},
    { key: "foto", label: "Fotos", icon: "📷", color: C.orange, docs: [
      { id: 8, name: "Zählerplatz vorne", ext: "JPG", size: "2.1 MB", pages: 0, date: "14.03.2026", status: "ok" },
      { id: 9, name: "Dach Südseite", ext: "JPG", size: "3.2 MB", pages: 0, date: "25.02.2026", status: "ok" },
    ]},
  ];

  const all = cats.flatMap(c => c.docs.map(d => ({ ...d, cat: c.label, catColor: c.color })));
  const shown = filter === "alle" ? all : all.filter(d => d.cat === cats.find(c => c.key === filter)?.label);
  const extColor: Record<string, string> = { PDF: C.red, JPG: C.orange, DWG: C.blue };

  return (
    <div className="fade-in">
      {/* Premium Document Viewer */}
      <DocViewerModal doc={viewDoc} open={!!viewDoc} onClose={() => setViewDoc(null)} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📄</span><span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Dokumente</span><span style={badge(C.accent + "15", C.accentLight)}>{all.length}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: 2 }}>
            {(["grid", "list"] as const).map(m => <button key={m} onClick={() => setViewMode(m)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", fontSize: 10, cursor: "pointer", background: viewMode === m ? C.accent + "15" : "transparent", color: viewMode === m ? C.accentLight : C.dim, fontWeight: 600 }}>{m === "grid" ? "▦" : "☰"}</button>)}
          </div>
          <button style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Upload</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("alle")} style={{ padding: "5px 12px", borderRadius: 20, border: "none", fontSize: 11, cursor: "pointer", background: filter === "alle" ? C.accent + "20" : "rgba(255,255,255,0.03)", color: filter === "alle" ? C.accentLight : C.dim, fontWeight: 600 }}>Alle ({all.length})</button>
        {cats.map(c => <button key={c.key} onClick={() => setFilter(c.key)} style={{ padding: "5px 12px", borderRadius: 20, border: "none", fontSize: 11, cursor: "pointer", background: filter === c.key ? c.color + "20" : "rgba(255,255,255,0.03)", color: filter === c.key ? c.color : C.dim, fontWeight: 600 }}>{c.icon} {c.label} ({c.docs.length})</button>)}
      </div>

      {viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
          {shown.map((doc, i) => (
            <div key={doc.id} className="doc-card-hover fade-in" onClick={() => setViewDoc(doc)}
              style={{ ...cardS, cursor: "pointer", animationDelay: `${i * 40}ms` }}>
              <div style={{ height: 80, background: `linear-gradient(135deg, ${doc.catColor}08, ${doc.catColor}03)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontSize: 32, opacity: 0.2 }}>{doc.ext === "JPG" ? "🖼" : "📄"}</span>
                <span style={{ position: "absolute", top: 8, right: 8, fontSize: 12 }}>{doc.status === "ok" ? "✅" : "📝"}</span>
                <span style={{ position: "absolute", bottom: 8, left: 8, fontSize: 8, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: (extColor[doc.ext] || C.dim) + "20", color: extColor[doc.ext] || C.dim }}>{doc.ext}</span>
                {doc.pages > 0 && <span style={{ position: "absolute", bottom: 8, right: 8, fontSize: 9, color: C.dim }}>{doc.pages} S.</span>}
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 3 }}>{doc.size} · {doc.date}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>{shown.map(doc => (
          <div key={doc.id} className="row-hover" onClick={() => setViewDoc(doc)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer" }}>
            <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 8px", borderRadius: 3, background: (extColor[doc.ext] || C.dim) + "20", color: extColor[doc.ext] || C.dim, width: 32, textAlign: "center" }}>{doc.ext}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1 }}>{doc.name}</span>
            <span style={{ fontSize: 10, color: C.dim }}>{doc.cat}</span>
            <span style={{ fontSize: 10, color: C.dim, width: 60, textAlign: "right" }}>{doc.size}</span>
            <span style={{ fontSize: 10, color: C.dim, width: 80, textAlign: "right" }}>{doc.date}</span>
            <span>{doc.status === "ok" ? "✅" : "📝"}</span>
          </div>
        ))}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: UNTERLAGEN (Preview als Modal)
// ═══════════════════════════════════════════════════════════════════════════════

function TabUnterlagen() {
  const [previewDoc, setPreviewDoc] = useState<{ name: string; ext: string; size: string; pages?: number; date?: string; cat?: string } | null>(null);

  const groups = [
    { label: "Pflicht", color: C.red, icon: "🔴", items: [
      { name: "E.1 Antragstellung", st: "ok" as string, file: "E1_Antrag.pdf" as string | null, date: "02.03.2026" as string | null, auto: true, size: "245 KB", pages: 3 },
      { name: "E.2 Datenblatt", st: "ok" as string, file: "E2_Datenblatt.pdf" as string | null, date: "02.03.2026" as string | null, auto: true, size: "189 KB", pages: 5 },
      { name: "Lageplan", st: "ok" as string, file: "Lageplan_Hauptstr15.pdf" as string | null, date: "28.02.2026" as string | null, auto: true, size: "1.2 MB", pages: 1 },
      { name: "Übersichtsschaltplan", st: "ok" as string, file: "Uebersichtsschaltplan.pdf" as string | null, date: "28.02.2026" as string | null, auto: true, size: "890 KB", pages: 2 },
    ]},
    { label: "NB-spezifisch (Stadtwerke Freiburg)", color: C.orange, icon: "🟠", items: [
      { name: "Foto Zählerplatz", st: "ok" as string, file: "Zaehlerplatz_vorne.jpg" as string | null, date: "14.03.2026" as string | null, auto: true, size: "2.1 MB", pages: 0 },
      { name: "Bestätigung Wandlermessung", st: "ok" as string, file: "Wandlermessung.pdf" as string | null, date: "15.03.2026" as string | null, auto: false, size: "340 KB", pages: 1 },
      { name: "Datenblatt Speicher", st: "fehlt" as string, file: null, date: null, auto: false, size: "", pages: 0 },
    ]},
    { label: "Optional", color: C.dim, icon: "⚪", items: [
      { name: "Vollmacht", st: "ok" as string, file: "Vollmacht_unterschrieben.pdf" as string | null, date: "26.02.2026" as string | null, auto: true, size: "120 KB", pages: 1 },
      { name: "E.9 IBN-Protokoll", st: "entwurf" as string, file: null, date: null, auto: false, size: "", pages: 0 },
      { name: "Stringplan", st: "ok" as string, file: "Stringplan_Dach.dwg" as string | null, date: "28.02.2026" as string | null, auto: true, size: "450 KB", pages: 0 },
    ]},
  ];

  const all = groups.flatMap(g => g.items);
  const ok = all.filter(i => i.st === "ok").length;
  const pct = Math.round((ok / all.length) * 100);

  return (
    <div className="fade-in">
      {/* Premium Document Viewer */}
      <DocViewerModal doc={previewDoc} open={!!previewDoc} onClose={() => setPreviewDoc(null)} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>✅</span><span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Unterlagen-Checkliste</span>
      </div>

      <div style={{ ...cardS, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div><span style={{ fontSize: 28, fontWeight: 900, color: pct >= 80 ? C.green : pct >= 50 ? C.orange : C.red, letterSpacing: -1 }}>{pct}%</span><span style={{ fontSize: 12, color: C.dim, marginLeft: 8 }}>{ok} von {all.length}</span></div>
          <div style={{ display: "flex", gap: 12 }}>{groups.map(g => { const gOk = g.items.filter(i => i.st === "ok").length; return <span key={g.label} style={{ fontSize: 10, color: g.color }}>{g.icon} {gOk}/{g.items.length}</span>; })}</div>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.green}, ${C.cyan})`, borderRadius: 4, transition: "width .8s" }} /></div>
      </div>

      {groups.map(g => (
        <div key={g.label} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: g.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            {g.icon} {g.label} <span style={{ fontSize: 10, color: C.dim, fontWeight: 400, textTransform: "none" }}>({g.items.filter(i => i.st === "ok").length}/{g.items.length})</span>
          </div>
          {g.items.map((item, i) => (
            <div key={i} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.card, border: `1px solid ${item.st === "fehlt" ? C.red + "20" : C.border}`, borderRadius: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{item.st === "ok" ? "✅" : item.st === "entwurf" ? "📝" : "❌"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: item.st === "fehlt" ? C.red : C.text }}>{item.name}</div>
                {item.file && <div style={{ fontSize: 10, color: C.dim, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>{item.auto && <span style={{ fontSize: 8, padding: "1px 4px", background: C.green + "15", color: C.green, borderRadius: 3 }}>Auto</span>}→ {item.file} · {item.date}</div>}
              </div>
              {item.st === "fehlt" && <button className="btn-hover" style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>↑ Upload</button>}
              {item.st === "ok" && item.file && <button className="btn-hover" onClick={() => {
                const ext = item.file!.split(".").pop()?.toUpperCase() || "PDF";
                setPreviewDoc({ name: item.name, ext, size: item.size, pages: item.pages, date: item.date || undefined, cat: g.label });
              }} style={{ background: "rgba(212,168,67,0.06)", color: C.accentLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 14px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Ansehen →</button>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: VERLAUF (gleich wie V2)
// ═══════════════════════════════════════════════════════════════════════════════

function TabVerlauf() {
  const [filter, setFilter] = useState("alle");
  const [compact, setCompact] = useState(false);

  const days = [
    { date: "15.03.2026", label: "Heute", items: [
      { time: "10:45", icon: "📤", type: "email", who: "System", text: "Unterlagen nachgereicht an Stadtwerke Freiburg", detail: "Zaehlerplatz.jpg, Wandlermessung.pdf", color: C.accent },
      { time: "10:44", icon: "💬", type: "comment", who: "Admin", text: "Rückfrage beantwortet — Foto + Wandlermessung angehängt", detail: "", color: C.purple },
    ]},
    { date: "08.03.2026", label: "Vor 7 Tagen", items: [
      { time: "14:23", icon: "🤖", type: "ki", who: "KI", text: "Email klassifiziert → Rückfrage (fehlende_unterlagen)", detail: "Confidence: 94%", color: C.pink },
      { time: "14:22", icon: "📨", type: "email", who: "SW Freiburg", text: "Rückfrage: Foto Zählerplatz + Wandlermessung fehlt", detail: "", color: C.red },
      { time: "14:23", icon: "🔄", type: "status", who: "System", text: "Status: Beim NB → Rückfrage", detail: "Automatisch durch KI", color: C.orange },
    ]},
    { date: "02.03.2026", label: "Vor 13 Tagen", items: [
      { time: "09:14", icon: "📤", type: "email", who: "System", text: "Netzanschlussantrag gesendet", detail: "An: sw-freiburg.de · 4 Anhänge", color: C.accent },
      { time: "09:14", icon: "🔄", type: "status", who: "System", text: "Status: Eingang → Beim NB", detail: "", color: C.blue },
      { time: "09:13", icon: "⚡", type: "document", who: "VDE Center", text: "E.1 + E.2 generiert", detail: "", color: C.cyan },
    ]},
    { date: "28.02.2026", label: "Vor 15 Tagen", items: [{ time: "16:30", icon: "📎", type: "document", who: "Upload", text: "3 Dokumente hochgeladen", detail: "Lageplan, Schaltplan, Stringplan", color: C.cyan }] },
    { date: "26.02.2026", label: "Vor 17 Tagen", items: [{ time: "11:00", icon: "📥", type: "status", who: "Fabian Kulla", text: "Netzanmeldung erstellt", detail: "12.4 kWp PV + 10 kWh Speicher", color: C.green }] },
  ];

  const types = [{ key: "alle", label: "Alle" }, { key: "email", label: "Emails", color: C.accent }, { key: "status", label: "Status", color: C.orange }, { key: "document", label: "Docs", color: C.cyan }, { key: "comment", label: "Kommentare", color: C.purple }, { key: "ki", label: "KI", color: C.pink }];
  const total = days.flatMap(d => d.items).length;
  const filteredDays = days.map(d => ({ ...d, items: filter === "alle" ? d.items : d.items.filter(i => i.type === filter) })).filter(d => d.items.length > 0);

  return (
    <div className="fade-in">
      <div style={{ ...cardS, padding: "14px 18px", marginBottom: 14, borderColor: C.accent + "20", background: `linear-gradient(135deg, ${C.accent}04, transparent)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accent + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🤖</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.bright, marginBottom: 4 }}>KI-Zusammenfassung</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Antrag am <b style={{ color: C.text }}>02.03.</b> an Stadtwerke Freiburg gesendet. <b style={{ color: C.red }}>Rückfrage</b> am <b style={{ color: C.text }}>08.03.</b> (Foto + Wandlermessung). Nachgereicht am <b style={{ color: C.text }}>15.03.</b>
              <span style={{ color: C.orange }}> → Warte auf NB-Antwort</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📜</span><span style={{ fontSize: 15, fontWeight: 700, color: C.bright }}>Verlauf</span><span style={badge(C.accent + "15", C.accentLight)}>{total}</span>
        </div>
        <button onClick={() => setCompact(!compact)} style={{ background: "rgba(255,255,255,0.04)", color: C.dim, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>{compact ? "Detailliert" : "Kompakt"}</button>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {types.map(t => <button key={t.key} onClick={() => setFilter(t.key)} style={{ padding: "5px 12px", borderRadius: 20, border: "none", fontSize: 11, cursor: "pointer", background: filter === t.key ? (t.color || C.accent) + "20" : "rgba(255,255,255,0.03)", color: filter === t.key ? (t.color || C.accentLight) : C.dim, fontWeight: 600 }}>{t.label}</button>)}
      </div>

      {filteredDays.map((day, di) => (
        <div key={di} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, position: "sticky", top: 56, background: C.bg, zIndex: 1, padding: "4px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{day.date}</div>
            <div style={{ fontSize: 10, color: C.dim }}>{day.label}</div>
            <div style={{ flex: 1, height: 1, background: C.borderLight }} />
          </div>
          {day.items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: compact ? 8 : 10, padding: compact ? "4px 0" : "6px 0", marginLeft: 8, borderLeft: `2px solid ${item.color}15`, paddingLeft: 14, position: "relative" }}>
              <div style={{ position: "absolute", left: -5, top: compact ? 8 : 10, width: 8, height: 8, borderRadius: "50%", background: item.color, boxShadow: `0 0 6px ${item.color}30` }} />
              <div style={{ width: 42, flexShrink: 0, fontSize: 11, fontFamily: "monospace", color: C.muted, paddingTop: 1 }}>{item.time}</div>
              {!compact && <div style={{ width: 26, height: 26, borderRadius: 6, background: item.color + "10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{item.icon}</div>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: compact ? 11 : 12, color: C.text }}><span style={{ fontWeight: 600, color: item.color }}>{item.who}</span> — {item.text}</div>
                {!compact && item.detail && <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{item.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function MockDetailTabs() {
  const [tab, setTab] = useState("admin");
  const tabs = [
    { k: "admin", l: "Schnellzugriff", i: "⚡" },
    { k: "nb", l: "NB-Komm.", i: "📧", b: "1" },
    { k: "docs", l: "Dokumente", i: "📄", b: "8" },
    { k: "check", l: "Unterlagen", i: "✅", b: "9/10" },
    { k: "verlauf", l: "Verlauf", i: "📜" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{css}</style>
      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.bright, letterSpacing: -0.5 }}>Detail-Panel Mock V4</div>
        <span style={badge(C.green + "15", C.green)}>Premium</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: C.dim }}>{MOCK.betreiber.vorname} {MOCK.betreiber.nachname} · {MOCK.publicId} · {MOCK.anlage.kwp} kWp · {MOCK.standort.ort}</span>
        <span style={badge(C.red + "15", C.red)}>Rückfrage</span>
      </div>
      <div style={{ padding: "6px 24px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 2, position: "sticky", top: 0, zIndex: 10, background: "rgba(10,10,15,0.97)", backdropFilter: "blur(12px)" }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "8px 14px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: tab === t.k ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans'", background: tab === t.k ? "rgba(212,168,67,0.12)" : "transparent", color: tab === t.k ? C.accentLight : "#475569", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", transition: "all .15s" }}>
            <span style={{ fontSize: 14 }}>{t.i}</span>{t.l}
            {(t as any).b && <span style={{ minWidth: 18, height: 18, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: tab === t.k ? C.accent + "25" : "rgba(255,255,255,0.06)", color: tab === t.k ? C.accentLight : C.dim }}>{(t as any).b}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {tab === "admin" && <TabAdmin />}
        {tab === "nb" && <TabNbKomm />}
        {tab === "docs" && <TabDokumente />}
        {tab === "check" && <TabUnterlagen />}
        {tab === "verlauf" && <TabVerlauf />}
      </div>
    </div>
  );
}
