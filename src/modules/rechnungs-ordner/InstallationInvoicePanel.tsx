// src/modules/rechnungs-ordner/InstallationInvoicePanel.tsx
import { useCallback, useEffect, useState } from "react";
import type { AbrechnungInstallation, AbrechnungKunde, RechnungListRow } from "../rechnungen/types";
import type { DocumentListItem } from "../../services/documents.service";
import {
  loadInvoicesForInstallation,
  uploadInvoicePdf,
  deleteDocument,
  getDownloadUrl,
} from "./api";
import { getAccessToken } from "../../modules/auth/tokenStorage";
import InvoiceUploadZone from "./InvoiceUploadZone";

function authUrl(url: string | null | undefined): string {
  if (!url) return "";
  const token = getAccessToken();
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

interface InstallationInvoicePanelProps {
  installation: AbrechnungInstallation | null;
  kunde: AbrechnungKunde | null;
  onCreateInvoice: () => void;
}

function money(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    Number.isFinite(n) ? n : 0
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "BEZAHLT" || s === "PAID") return "ro-status--paid";
  if (s === "UEBERFAELLIG" || s === "OVERDUE") return "ro-status--overdue";
  if (s === "STORNIERT" || s === "CANCELLED") return "ro-status--cancelled";
  if (s === "DRAFT" || s === "ENTWURF") return "ro-status--draft";
  return "ro-status--open";
}

function getStatusLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "BEZAHLT" || s === "PAID") return "Bezahlt";
  if (s === "UEBERFAELLIG" || s === "OVERDUE") return "Überfällig";
  if (s === "STORNIERT" || s === "CANCELLED") return "Storniert";
  if (s === "DRAFT" || s === "ENTWURF") return "Entwurf";
  return "Offen";
}

export default function InstallationInvoicePanel({
  installation,
  kunde,
  onCreateInvoice,
}: InstallationInvoicePanelProps) {
  const [systemInvoices, setSystemInvoices] = useState<RechnungListRow[]>([]);
  const [uploadedInvoices, setUploadedInvoices] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!installation) return;
    setLoading(true);
    try {
      const result = await loadInvoicesForInstallation(installation.id, undefined);
      setSystemInvoices(result.systemInvoices);
      setUploadedInvoices(result.uploadedInvoices);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [installation]);

  useEffect(() => {
    if (installation) {
      loadData();
    } else {
      setSystemInvoices([]);
      setUploadedInvoices([]);
    }
  }, [installation, loadData]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!installation) return;
      await uploadInvoicePdf(installation.id, file);
      await loadData();
    },
    [installation, loadData]
  );

  const handleDelete = useCallback(
    async (docId: number) => {
      if (!confirm("Hochgeladene Rechnung wirklich löschen?")) return;
      setDeletingId(docId);
      try {
        await deleteDocument(docId);
        setUploadedInvoices((prev) => prev.filter((d) => d.id !== docId));
      } catch {
        // Silent
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  // Empty state
  if (!installation) {
    return (
      <div className="ro-detail-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ro-detail-empty-icon">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span className="ro-detail-empty-text">Installation auswählen</span>
        <span className="ro-detail-empty-hint">Wähle links eine Installation, um Rechnungen zu sehen</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div className="ro-detail-header">
        <div className="ro-detail-top">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="ro-detail-id">{installation.publicId}</span>
              <span className="ro-detail-customer">{installation.customerName}</span>
            </div>
            <div className="ro-detail-loc">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {installation.standort || "Kein Standort"}
            </div>
          </div>
          <span className={`ro-badge ${installation.rechnungGestellt ? "ro-badge--billed" : "ro-badge--open"}`}>
            {installation.rechnungGestellt ? "Abgerechnet" : "Offen"}
          </span>
        </div>
        {kunde && (
          <div className="ro-detail-meta">
            Kunde: {kunde.firmenName || kunde.kundeName}
            {installation.totalKwp ? ` · ${installation.totalKwp} kWp` : ""}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="ro-detail-content">
        {/* Upload Zone */}
        <InvoiceUploadZone onUpload={handleUpload} disabled={loading} />

        {loading ? (
          <div className="ro-loading">
            <div className="ro-spinner" />
            Lade Rechnungen...
          </div>
        ) : (
          <>
            {/* System Invoices */}
            <div>
              <div className="ro-section-title">
                System-Rechnungen
                <span className="ro-section-count">{systemInvoices.length}</span>
              </div>

              {systemInvoices.length === 0 ? (
                <div className="ro-invoice-empty">Keine System-Rechnungen</div>
              ) : (
                <div className="ro-invoice-list">
                  {systemInvoices.map((inv) => (
                    <div key={inv.id} className="ro-invoice-row">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="ro-invoice-icon">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div className="ro-invoice-info">
                        <div className="ro-invoice-name">{inv.rechnungsnummer}</div>
                        <div className="ro-invoice-meta">{formatDate(inv.rechnungs_datum)}</div>
                      </div>
                      <span className="ro-invoice-amount">{money(inv.betrag_brutto)}</span>
                      <span className={`ro-status ${getStatusClass(inv.status_label || inv.status)}`}>
                        {getStatusLabel(inv.status_label || inv.status)}
                      </span>
                      {inv.pdf_path && (
                        <a
                          href={authUrl(inv.pdf_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ro-icon-btn"
                          title="PDF ansehen"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Uploaded Invoices */}
            <div>
              <div className="ro-section-title">
                Hochgeladene Rechnungen
                <span className="ro-section-count">{uploadedInvoices.length}</span>
              </div>

              {uploadedInvoices.length === 0 ? (
                <div className="ro-invoice-empty">Keine hochgeladenen Rechnungen</div>
              ) : (
                <div className="ro-invoice-list">
                  {uploadedInvoices.map((doc) => (
                    <div key={doc.id} className="ro-invoice-row">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="ro-invoice-icon ro-invoice-icon--upload">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div className="ro-invoice-info">
                        <div className="ro-invoice-name">{doc.dateiname}</div>
                        <div className="ro-invoice-meta">
                          {formatDate(doc.createdAt)}
                          {doc.dateigroesse ? ` · ${formatSize(doc.dateigroesse)}` : ""}
                          {doc.uploadedBy ? ` · ${doc.uploadedBy}` : ""}
                        </div>
                      </div>
                      <a
                        href={authUrl(getDownloadUrl(doc.id))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ro-icon-btn"
                        title="Ansehen"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="ro-icon-btn ro-icon-btn--danger"
                        title="Löschen"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="ro-footer">
        <button className="ro-cta-btn" onClick={onCreateInvoice}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Neue Rechnung erstellen
        </button>
      </div>
    </div>
  );
}
