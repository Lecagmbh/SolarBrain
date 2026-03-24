// HV-Center Tab: Eigenen Vertragsstatus einsehen

import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, Shield, ExternalLink } from "lucide-react";
import { fetchCurrentContract, fetchContractHistory, getContractPdfUrl, type ContractCurrentResponse } from "../../api/hv-contract.api";
import { getAccessToken } from "../../../../modules/auth/tokenStorage";

interface HistoryEntry {
  id: number;
  acceptedAt: string;
  contractVersionAtAcceptance: string;
  pdfHashAtAcceptance: string;
  ipAddress: string;
  revokedAt: string | null;
  revokeReason: string | null;
  revokedBy: { name: string | null; email: string } | null;
  contractTemplate: { version: string; title: string };
  createdAt: string;
}

const fmtDateTime = (d: string) => new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function HvVertragTab() {
  const [current, setCurrent] = useState<ContractCurrentResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, h] = await Promise.all([fetchCurrentContract(), fetchContractHistory()]);
        setCurrent(c);
        setHistory(h || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem", color: "#71717a" }}>
        Laden...
      </div>
    );
  }

  const token = getAccessToken();
  const pdfUrl = `${getContractPdfUrl()}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  return (
    <div style={{ padding: "1.5rem 2.5rem", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Current Contract Status */}
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <Shield size={20} color="#D4A843" />
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#e4e4e7" }}>Aktueller Vertragsstatus</h3>
        </div>

        {!current?.template ? (
          <p style={{ color: "#71717a", fontSize: "0.85rem" }}>Kein aktiver Vertrag vorhanden.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            <InfoItem label="Vertrag" value={current.template.title} />
            <InfoItem label="Version" value={current.template.version} />
            <InfoItem label="Gültig seit" value={fmtDateTime(current.template.effectiveFrom)} />
            <InfoItem
              label="Status"
              value={
                current.acceptance ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "#22c55e" }}>
                    <CheckCircle size={14} /> Akzeptiert am {fmtDateTime(current.acceptance.acceptedAt)}
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "#f59e0b" }}>
                    <Clock size={14} /> Nicht akzeptiert
                  </span>
                )
              }
            />
          </div>
        )}

        {current?.template && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              marginTop: "1rem", padding: "0.5rem 1rem",
              background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: "8px", color: "#EAD068", fontSize: "0.83rem", textDecoration: "none",
            }}
          >
            <ExternalLink size={14} /> Vertrag als PDF ansehen
          </a>
        )}
      </div>

      {/* History */}
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <FileText size={20} color="#D4A843" />
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#e4e4e7" }}>Vertragsverlauf</h3>
        </div>

        {history.length === 0 ? (
          <p style={{ color: "#71717a", fontSize: "0.85rem" }}>Noch keine Vertragsaktionen vorhanden.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={styles.th}>Version</th>
                  <th style={styles.th}>Titel</th>
                  <th style={styles.th}>Akzeptiert am</th>
                  <th style={styles.th}>IP</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td style={{ ...styles.td, fontFamily: "monospace" }}>{h.contractVersionAtAcceptance}</td>
                    <td style={styles.td}>{h.contractTemplate.title}</td>
                    <td style={styles.td}>{fmtDateTime(h.acceptedAt)}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "0.75rem" }}>{h.ipAddress}</td>
                    <td style={styles.td}>
                      {h.revokedAt ? (
                        <span style={{ display: "inline-flex", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.73rem", fontWeight: 600, color: "#ef4444", background: "rgba(239,68,68,0.15)" }}>
                          Widerrufen ({h.revokeReason || "—"})
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.73rem", fontWeight: 600, color: "#22c55e", background: "rgba(16,185,129,0.15)" }}>
                          Gültig
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span style={{ fontSize: "0.73rem", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 500 }}>{typeof value === "string" ? value : value}</span>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.5rem",
  },
  th: {
    padding: "10px 14px", textAlign: "left" as const, fontSize: "0.7rem",
    fontWeight: 600, color: "#71717a", textTransform: "uppercase" as const,
    letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  td: {
    padding: "10px 14px", fontSize: "0.83rem", color: "#e2e8f0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
};
