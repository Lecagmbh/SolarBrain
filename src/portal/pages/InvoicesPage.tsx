/**
 * Portal Invoices Page
 * ====================
 * Rechnungsseite für Endkunden-Portal.
 * Zeigt alle Rechnungen mit Status, PDF-Download und Zahlungslinks.
 */

import { useState, useEffect } from "react";
import {
  getPortalInvoices,
  getPortalPaymentLink,
  type PortalInvoice,
  type PortalInvoiceSummary,
} from "../api";
import {
  Loader2,
  FileText,
  Wallet,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  CreditCard,
  ExternalLink,
} from "lucide-react";

type FilterTab = "alle" | "offen" | "bezahlt" | "ueberfaellig";

function money(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

function getDaysUntilDue(faelligAm: string | null): { text: string; overdue: boolean } {
  if (!faelligAm) return { text: "", overdue: false };
  const now = new Date();
  const due = new Date(faelligAm);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) {
    return { text: `Fällig seit ${Math.abs(diffDays)} Tagen`, overdue: true };
  } else if (diffDays === 0) {
    return { text: "Heute fällig", overdue: false };
  } else {
    return { text: `Fällig in ${diffDays} Tagen`, overdue: false };
  }
}

function getStatusInfo(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "OFFEN":
    case "VERSENDET":
      return { label: "Offen", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    case "BEZAHLT":
      return { label: "Bezahlt", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
    case "UEBERFAELLIG":
    case "MAHNUNG":
      return { label: "Überfällig", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    case "STORNIERT":
      return { label: "Storniert", color: "#64748b", bg: "rgba(100,116,139,0.1)" };
    default:
      return { label: status, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  }
}

export function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [summary, setSummary] = useState<PortalInvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("alle");
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      const result = await getPortalInvoices();
      setInvoices(result.data);
      setSummary(result.summary);
    } catch (err) {
      setError("Rechnungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(invoice: PortalInvoice) {
    if (invoice.paymentLink) {
      const baseUrl = import.meta.env.VITE_APP_URL || "";
      window.open(`${baseUrl}/pay/${invoice.paymentLink.token}`, "_blank");
      return;
    }

    try {
      setPayingId(invoice.id);
      const link = await getPortalPaymentLink(invoice.id);
      window.open(link.url, "_blank");
    } catch {
      // Fallback: Seite neu laden
      loadInvoices();
    } finally {
      setPayingId(null);
    }
  }

  function handleDownloadPdf(invoice: PortalInvoice) {
    if (!invoice.pdfPath) return;
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const baseApi = import.meta.env.VITE_API_BASE_URL || "";
    window.open(`${baseApi}/api/portal/rechnungen/${invoice.id}/pdf?token=${token}`, "_blank");
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === "alle") return true;
    if (filter === "offen") return ["OFFEN", "VERSENDET"].includes(inv.status);
    if (filter === "bezahlt") return inv.status === "BEZAHLT";
    if (filter === "ueberfaellig") return ["UEBERFAELLIG", "MAHNUNG"].includes(inv.status);
    return true;
  });

  const isOpenStatus = (s: string) => ["OFFEN", "VERSENDET", "UEBERFAELLIG", "MAHNUNG"].includes(s);

  if (loading) {
    return (
      <div className="pd-loading">
        <Loader2 size={32} className="pd-spin" />
        <span>Rechnungen werden geladen...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pd-error">
        <AlertTriangle size={24} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="pd-page">
      <div className="pd-page-header">
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Wallet size={22} />
          Rechnungen & Zahlung
        </h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div className="pd-card" style={{ padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>OFFEN</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: summary.offen > 0 ? "#f59e0b" : "rgba(255,255,255,0.7)" }}>
              {summary.offen}
            </div>
            {summary.offen > 0 && (
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, marginTop: 4 }}>
                {money(summary.offenerBetrag)}
              </div>
            )}
          </div>
          <div className="pd-card" style={{ padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>BEZAHLT</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>
              {summary.bezahlt}
            </div>
          </div>
          <div className="pd-card" style={{ padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>GESAMT</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
              {summary.total}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["alle", "offen", "bezahlt", "ueberfaellig"] as FilterTab[]).map((tab) => {
          const labels: Record<FilterTab, string> = {
            alle: "Alle",
            offen: "Offen",
            bezahlt: "Bezahlt",
            ueberfaellig: "Überfällig",
          };
          const isActive = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: isActive ? "rgba(212,168,67,0.5)" : "rgba(255,255,255,0.1)",
                background: isActive ? "rgba(212,168,67,0.15)" : "transparent",
                color: isActive ? "#EAD068" : "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Invoice Cards */}
      {filteredInvoices.length === 0 ? (
        <div className="pd-card" style={{ padding: 40, textAlign: "center" }}>
          <FileText size={32} style={{ color: "rgba(255,255,255,0.3)", marginBottom: 8 }} />
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            {filter === "alle" ? "Keine Rechnungen vorhanden" : "Keine Rechnungen in dieser Kategorie"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredInvoices.map((inv) => {
            const status = getStatusInfo(inv.status);
            const dueInfo = isOpenStatus(inv.status) ? getDaysUntilDue(inv.faelligAm) : null;

            return (
              <div
                key={inv.id}
                className="pd-card"
                style={{
                  padding: "16px 20px",
                  borderLeft: `3px solid ${status.color}`,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                      {inv.rechnungsNummer}
                    </div>
                    {inv.beschreibung && (
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        {inv.beschreibung.slice(0, 80)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
                      {money(inv.betragBrutto)}
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: status.bg,
                        color: status.color,
                        marginTop: 4,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                  <span>{formatDate(inv.rechnungsDatum)}</span>
                  {dueInfo && (
                    <span style={{ color: dueInfo.overdue ? "#ef4444" : "rgba(255,255,255,0.5)", fontWeight: dueInfo.overdue ? 600 : 400 }}>
                      {dueInfo.overdue ? <AlertTriangle size={11} style={{ marginRight: 3, verticalAlign: "middle" }} /> : <Clock size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />}
                      {dueInfo.text}
                    </span>
                  )}
                  {inv.status === "BEZAHLT" && inv.bezahltAm && (
                    <span style={{ color: "#10b981" }}>
                      <CheckCircle size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                      Bezahlt am {formatDate(inv.bezahltAm)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {inv.pdfPath && (
                    <button
                      onClick={() => handleDownloadPdf(inv)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <Download size={13} />
                      PDF
                    </button>
                  )}
                  {isOpenStatus(inv.status) && (
                    <button
                      onClick={() => handlePay(inv)}
                      disabled={payingId === inv.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "linear-gradient(135deg, #D4A843, #EAD068)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: payingId === inv.id ? "wait" : "pointer",
                        opacity: payingId === inv.id ? 0.7 : 1,
                      }}
                    >
                      {payingId === inv.id ? (
                        <Loader2 size={13} className="pd-spin" />
                      ) : (
                        <CreditCard size={13} />
                      )}
                      Jetzt bezahlen
                    </button>
                  )}
                  {inv.paymentLink?.wisePaymentUrl && isOpenStatus(inv.status) && (
                    <a
                      href={inv.paymentLink.wisePaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={13} />
                      Karte / Apple Pay
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
