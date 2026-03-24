// src/pages/RechnungsOrdnerPage.tsx
import { useCallback, useEffect, useState } from "react";
import type { AbrechnungKunde, AbrechnungInstallation } from "../modules/rechnungen/types";
import { loadCustomerFolders } from "../modules/rechnungs-ordner/api";
import { createInvoiceDraft } from "../modules/rechnungen/api";
import CustomerFolderTree from "../modules/rechnungs-ordner/CustomerFolderTree";
import InstallationInvoicePanel from "../modules/rechnungs-ordner/InstallationInvoicePanel";
import InvoiceCreateModal from "../modules/rechnungen/InvoiceCreateModal";
import "./rechnungs-ordner.css";

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

const BREAKPOINT = 860;

export default function RechnungsOrdnerPage() {
  const [customers, setCustomers] = useState<AbrechnungKunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstallation, setSelectedInstallation] = useState<AbrechnungInstallation | null>(null);
  const [selectedKunde, setSelectedKunde] = useState<AbrechnungKunde | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mobileShowPanel, setMobileShowPanel] = useState(false);

  const windowWidth = useWindowWidth();
  const isNarrow = windowWidth < BREAKPOINT;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await loadCustomerFolders();
      setCustomers(resp.customers);
    } catch {
      // Silent fail - empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectInstallation = useCallback(
    (inst: AbrechnungInstallation, kunde: AbrechnungKunde) => {
      setSelectedInstallation(inst);
      setSelectedKunde(kunde);
      setMobileShowPanel(true);
    },
    []
  );

  const handleBackToList = useCallback(() => {
    setMobileShowPanel(false);
  }, []);

  const handleCreateInvoice = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleInvoiceCreated = useCallback(() => {
    setShowCreateModal(false);
    loadData();
    if (selectedInstallation) {
      const inst = selectedInstallation;
      setSelectedInstallation(null);
      setTimeout(() => setSelectedInstallation(inst), 50);
    }
  }, [loadData, selectedInstallation]);

  // Summary stats
  const totalKunden = customers.length;
  const totalAnlagen = customers.reduce((s, k) => s + k.summary.totalInstallations, 0);
  const totalBilled = customers.reduce((s, k) => s + k.summary.billedCount, 0);
  const totalUnbilled = totalAnlagen - totalBilled;

  return (
    <div className="ro-page">
      {/* Header */}
      <div className="ro-header">
        <div className="ro-header-left">
          {isNarrow && mobileShowPanel && (
            <button className="ro-back-btn" onClick={handleBackToList} title="Zurück zur Liste">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <div className="ro-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="ro-title">
              {isNarrow && mobileShowPanel && selectedInstallation
                ? selectedInstallation.publicId
                : "Rechnungs-Ordner"}
            </h1>
            <p className="ro-subtitle">
              {isNarrow && mobileShowPanel && selectedKunde
                ? (selectedKunde.firmenName || selectedKunde.kundeName)
                : "Rechnungszuordnung nach Kunde und Installation"}
            </p>
          </div>
        </div>

        {!loading && !(isNarrow && mobileShowPanel) && (
          <div className="ro-stats">
            <div className="ro-stat-chip ro-stat-purple">
              <div className="ro-stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="ro-stat-value">{totalKunden}</span>
              <span className="ro-stat-label">Kunden</span>
            </div>
            <div className="ro-stat-chip ro-stat-success">
              <div className="ro-stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <span className="ro-stat-value">{totalBilled}</span>
              <span className="ro-stat-label">Abgerechnet</span>
            </div>
            <div className="ro-stat-chip ro-stat-warning">
              <div className="ro-stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="ro-stat-value">{totalUnbilled}</span>
              <span className="ro-stat-label">Offen</span>
            </div>
          </div>
        )}
      </div>

      {/* Layout */}
      {isNarrow ? (
        <div className="ro-layout-narrow">
          {mobileShowPanel && selectedInstallation ? (
            <div className="ro-panel" style={{ flex: 1 }}>
              <InstallationInvoicePanel
                installation={selectedInstallation}
                kunde={selectedKunde}
                onCreateInvoice={handleCreateInvoice}
              />
            </div>
          ) : (
            <div className="ro-panel" style={{ flex: 1 }}>
              <CustomerFolderTree
                customers={customers}
                selectedInstallationId={selectedInstallation?.id ?? null}
                onSelectInstallation={handleSelectInstallation}
                loading={loading}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="ro-layout">
          <div className="ro-panel">
            <CustomerFolderTree
              customers={customers}
              selectedInstallationId={selectedInstallation?.id ?? null}
              onSelectInstallation={handleSelectInstallation}
              loading={loading}
            />
          </div>
          <div className="ro-panel">
            <InstallationInvoicePanel
              installation={selectedInstallation}
              kunde={selectedKunde}
              onCreateInvoice={handleCreateInvoice}
            />
          </div>
        </div>
      )}

      {showCreateModal && (
        <InvoiceCreateModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleInvoiceCreated}
          createDraft={createInvoiceDraft}
        />
      )}
    </div>
  );
}
