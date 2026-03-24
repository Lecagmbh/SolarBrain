// src/pages/PaymentPage.tsx
// Öffentliche Zahlungsseite - erreichbar über /pay/:token (kein Login nötig)
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

interface PaymentData {
  token: string;
  status: string;
  amount: number;
  currency: string;
  reference: string;
  recipientName: string;
  recipientIban: string;
  recipientBic: string | null;
  rechnungsNummer: string;
  kundeName: string;
  rechnungsDatum: string;
  faelligAm: string;
  rechnungStatus: string;
  positionen: Array<{ title: string; qty: number; unitNet: number; vatRate: number }>;
  betragNetto: number;
  betragMwst: number;
  betragBrutto: number;
  expiresAt: string | null;
  paidAt: string | null;
  epcQrData: string;
  wisePaymentUrl: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

function money(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

// EPC QR Code als SVG generieren (simple QR using canvas-free approach via external API)
function QrCode({ data, size = 200 }: { data: string; size?: number }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=0f172a&color=e2e8f0&format=svg`;
  return (
    <img
      src={url}
      alt="QR Code für Banküberweisung"
      width={size}
      height={size}
      style={{ borderRadius: 12, background: "#0f172a", padding: 8 }}
    />
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        borderRadius: 6,
        background: copied ? "rgba(16, 185, 129, 0.15)" : "rgba(212, 168, 67, 0.1)",
        border: "none",
        color: copied ? "#34d399" : "#EAD068",
        fontSize: 11,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      title={`${label} kopieren`}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Kopiert
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Kopieren
        </>
      )}
    </button>
  );
}

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/payment-links/public/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Link nicht gefunden");
        return res.json();
      })
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const isPaid = data?.status === "PAID" || data?.rechnungStatus === "BEZAHLT";
  const isExpired = data?.status === "EXPIRED";
  const isCancelled = data?.status === "CANCELLED";

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={styles.spinner} />
            <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 16 }}>Zahlungsdetails werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: 48 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
              Zahlungslink nicht gefunden
            </h2>
            <p style={{ color: "#64748b", fontSize: 13 }}>
              Der Link ist ungültig oder abgelaufen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: 580, width: "100%", padding: "0 16px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
            background: isPaid ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #D4A843, #EAD068)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isPaid ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            )}
          </div>
          <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
            {isPaid ? "Zahlung erhalten" : isExpired ? "Link abgelaufen" : isCancelled ? "Link storniert" : "Rechnung bezahlen"}
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            {data.recipientName} · {data.rechnungsNummer}
          </p>
        </div>

        {/* Status Banner für bezahlt/abgelaufen */}
        {(isPaid || isExpired || isCancelled) && (
          <div style={{
            padding: "16px 20px", borderRadius: 12, marginBottom: 16, textAlign: "center",
            background: isPaid ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${isPaid ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
          }}>
            <p style={{ color: isPaid ? "#34d399" : "#f87171", fontSize: 14, fontWeight: 600, margin: 0 }}>
              {isPaid && `Diese Rechnung wurde am ${data.paidAt ? formatDate(data.paidAt) : ""} bezahlt.`}
              {isExpired && "Dieser Zahlungslink ist abgelaufen."}
              {isCancelled && "Dieser Zahlungslink wurde storniert."}
            </p>
          </div>
        )}

        {/* Main Card */}
        <div style={styles.card}>
          {/* Betrag */}
          <div style={{ textAlign: "center", padding: "24px 20px", borderBottom: "1px solid rgba(71, 85, 105, 0.2)" }}>
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Zu zahlen
            </div>
            <div style={{
              color: isPaid ? "#34d399" : "#f1f5f9",
              fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em",
              textDecoration: isPaid ? "line-through" : "none",
            }}>
              {money(data.betragBrutto)}
            </div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
              Netto {money(data.betragNetto)} + {money(data.betragMwst)} MwSt
            </div>
          </div>

          {/* Positionen */}
          {data.positionen.length > 0 && (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(71, 85, 105, 0.2)" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Positionen
              </div>
              {data.positionen.map((pos, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                  <span style={{ color: "#cbd5e1" }}>{pos.qty}x {pos.title}</span>
                  <span style={{ color: "#94a3b8" }}>{money(pos.qty * pos.unitNet)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rechnungsdetails */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(71, 85, 105, 0.2)" }}>
            <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Rechnungsdetails
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Rechnungsnummer</span>
              <span style={styles.detailValue}>{data.rechnungsNummer}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Rechnungsdatum</span>
              <span style={styles.detailValue}>{formatDate(data.rechnungsDatum)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Fällig am</span>
              <span style={{
                ...styles.detailValue,
                color: new Date(data.faelligAm) < new Date() && !isPaid ? "#f87171" : "#cbd5e1",
              }}>
                {formatDate(data.faelligAm)}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Kunde</span>
              <span style={styles.detailValue}>{data.kundeName}</span>
            </div>
          </div>

          {/* Bankdaten + QR Code (nur wenn nicht bezahlt) */}
          {!isPaid && !isExpired && !isCancelled && (
            <>
              <div style={{ padding: "20px", borderBottom: "1px solid rgba(71, 85, 105, 0.2)" }}>
                <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                  Bankverbindung
                </div>
                <div style={{
                  background: "rgba(15, 23, 42, 0.5)",
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748b", fontSize: 11 }}>Empfänger</span>
                      <CopyButton text={data.recipientName} label="Name" />
                    </div>
                    <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                      {data.recipientName}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748b", fontSize: 11 }}>IBAN</span>
                      <CopyButton text={data.recipientIban.replace(/\s/g, "")} label="IBAN" />
                    </div>
                    <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, fontFamily: "monospace", marginTop: 2, letterSpacing: "1px" }}>
                      {data.recipientIban}
                    </div>
                  </div>
                  {data.recipientBic && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748b", fontSize: 11 }}>BIC</span>
                        <CopyButton text={data.recipientBic} label="BIC" />
                      </div>
                      <div style={{ color: "#e2e8f0", fontSize: 14, fontFamily: "monospace", marginTop: 2 }}>
                        {data.recipientBic}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748b", fontSize: 11 }}>Verwendungszweck</span>
                      <CopyButton text={data.reference} label="Referenz" />
                    </div>
                    <div style={{ color: "#fbbf24", fontSize: 15, fontWeight: 700, fontFamily: "monospace", marginTop: 2 }}>
                      {data.reference}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748b", fontSize: 11 }}>Betrag</span>
                      <CopyButton text={data.betragBrutto.toFixed(2)} label="Betrag" />
                    </div>
                    <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                      {money(data.betragBrutto)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wise Payment Button (Karte / Apple Pay) */}
              {data.wisePaymentUrl && (
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(71, 85, 105, 0.2)", textAlign: "center" }}>
                  <a
                    href={data.wisePaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 28px",
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: 700,
                      textDecoration: "none",
                      boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
                      transition: "all 0.15s",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Per Karte / Apple Pay bezahlen
                  </a>
                  <p style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>
                    Sichere Kartenzahlung über Wise Business
                  </p>
                </div>
              )}

              {/* QR Code */}
              <div style={{ padding: "20px", textAlign: "center" }}>
                <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                  QR-Code für Banking-App
                </div>
                <div style={{
                  display: "inline-block",
                  padding: 12,
                  background: "rgba(15, 23, 42, 0.5)",
                  borderRadius: 16,
                  border: "1px solid rgba(71, 85, 105, 0.2)",
                }}>
                  <QrCode data={data.epcQrData} size={180} />
                </div>
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 8, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
                  Scannen Sie diesen QR-Code mit Ihrer Banking-App für eine sofortige SEPA-Überweisung
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0", color: "#475569", fontSize: 11 }}>
          Powered by Baunity · Sichere Zahlungsabwicklung über Wise Business
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 0",
  },
  card: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(20px)",
    borderRadius: 20,
    border: "1px solid rgba(71, 85, 105, 0.3)",
    overflow: "hidden",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(212, 168, 67, 0.2)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
  },
  detailLabel: {
    color: "#64748b",
    fontSize: 13,
  },
  detailValue: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 500,
  },
};
