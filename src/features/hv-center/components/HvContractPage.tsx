// Full-Screen Blocking Page für HV-Vertragsannahme
// KEIN Modal, KEIN Sidebar — kein Weg am Vertrag vorbei

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckSquare, Shield, Clock, AlertTriangle } from "lucide-react";
import { useHvContract } from "../hooks/useHvContract";
import { SignatureCanvas } from "./SignatureCanvas";
import { acceptContract, getContractPdfUrl, logContractAudit } from "../api/hv-contract.api";
import { getAccessToken } from "../../../modules/auth/tokenStorage";
export function HvContractPage() {
  const navigate = useNavigate();
  const { contract, acceptance, needsAcceptance, hvProfil, loading, error, refetch } = useHvContract();
  const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>({});
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const scrollAuditSent = useRef(false);

  // If already accepted, redirect to HV Center
  useEffect(() => {
    if (!loading && !needsAcceptance && acceptance) {
      navigate("/hv-center", { replace: true });
    }
  }, [loading, needsAcceptance, acceptance, navigate]);

  // If no contract required, redirect
  useEffect(() => {
    if (!loading && !contract) {
      navigate("/hv-center", { replace: true });
    }
  }, [loading, contract, navigate]);

  // Scroll tracking for the page container
  const handleScroll = useCallback(() => {
    if (scrolledToEnd || !contract) return;
    const el = iframeContainerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setScrolledToEnd(true);
      if (!scrollAuditSent.current) {
        scrollAuditSent.current = true;
        logContractAudit("SCROLLED_TO_END", contract.id);
      }
    }
  }, [scrolledToEnd, contract]);

  const handleCheckboxToggle = (id: string, checked: boolean) => {
    setCheckboxStates((prev) => ({ ...prev, [id]: checked }));
    if (contract) {
      logContractAudit("CHECKBOX_TOGGLED", contract.id, { checkboxId: id, checked });
    }
  };

  const allRequiredChecked = contract?.requiredCheckboxes.every((cb) => checkboxStates[cb.id]) ?? false;

  const handleAccept = async () => {
    if (!contract || !allRequiredChecked || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const checkboxes = contract.requiredCheckboxes.map((cb) => ({
        id: cb.id,
        label: cb.label,
        checked: !!checkboxStates[cb.id],
        timestamp: new Date().toISOString(),
      }));

      await acceptContract({
        templateId: contract.id,
        checkboxes,
        signatureData: signatureData || undefined,
        metadata: {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          scrolledToEnd,
        },
      });

      setAccepted(true);
      setTimeout(() => {
        navigate("/hv-center", { replace: true });
      }, 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : "Fehler beim Akzeptieren des Vertrags");
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>Vertragsinformationen werden geladen...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <AlertTriangle size={40} color="#ef4444" />
        <span style={{ color: "#ef4444", fontSize: "0.9rem" }}>{error}</span>
        <button onClick={refetch} style={styles.retryButton}>Erneut versuchen</button>
      </div>
    );
  }

  if (accepted) {
    return (
      <div style={styles.loadingContainer}>
        <Shield size={48} color="#22c55e" />
        <h2 style={{ color: "#e4e4e7", margin: 0 }}>Vertrag erfolgreich angenommen</h2>
        <p style={{ color: "#a1a1aa", margin: 0 }}>Sie werden weitergeleitet...</p>
      </div>
    );
  }

  if (!contract) return null;

  // Build PDF URL with auth token for iframe
  const token = getAccessToken();
  const pdfUrl = `${getContractPdfUrl()}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileText size={24} color="#D4A843" />
            <div>
              <h1 style={styles.title}>Handelsvertretervertrag</h1>
              <span style={styles.version}>Version {contract.version}</span>
            </div>
          </div>
          <div style={styles.badge}>
            <Shield size={14} />
            <span>Rechtlich verbindlich</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.contentGrid}>
          {/* Left: HV-Stammdaten + PDF Viewer */}
          <div style={styles.pdfSection}>
            {/* Personalisierte Vertragsparteien */}
            {hvProfil && (
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(212,168,67,0.05)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Unternehmer</div>
                    <div style={{ fontSize: "0.85rem", color: "#e4e4e7", fontWeight: 600 }}>Baunity</div>
                    <div style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Südstraße 31, 47475 Kamp-Lintfort</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Handelsvertreter</div>
                    <div style={{ fontSize: "0.85rem", color: "#e4e4e7", fontWeight: 600 }}>{hvProfil.name || hvProfil.email}</div>
                    {hvProfil.firmenName && <div style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>{hvProfil.firmenName}</div>}
                    <div style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>{hvProfil.email}</div>
                    {hvProfil.steuerNr && <div style={{ fontSize: "0.78rem", color: "#71717a" }}>St.-Nr.: {hvProfil.steuerNr}</div>}
                    {hvProfil.ustIdNr && <div style={{ fontSize: "0.78rem", color: "#71717a" }}>USt-IdNr.: {hvProfil.ustIdNr}</div>}
                    <div style={{ fontSize: "0.78rem", color: "#EAD068", marginTop: "0.25rem" }}>Provisionssatz: {hvProfil.provisionssatz}%</div>
                  </div>
                </div>
              </div>
            )}

            <h3 style={styles.sectionTitle}>
              <FileText size={16} />
              Vertragsdokument
            </h3>
            <div ref={iframeContainerRef} onScroll={handleScroll} style={styles.pdfContainer}>
              <iframe
                src={pdfUrl}
                style={styles.iframe}
                title="Handelsvertretervertrag"
              />
            </div>
            {!scrolledToEnd && (
              <div style={styles.scrollHint}>
                Bitte scrollen Sie das Dokument bis zum Ende
              </div>
            )}
          </div>

          {/* Right: Acceptance */}
          <div style={styles.acceptSection}>
            {/* Contract Info */}
            <div style={styles.infoBox}>
              <h3 style={styles.sectionTitle}>{contract.title}</h3>
              {contract.description && (
                <p style={{ color: "#a1a1aa", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>{contract.description}</p>
              )}
            </div>

            {/* Clauses */}
            {contract.clauses.length > 0 && (
              <div style={styles.clausesBox}>
                <h4 style={{ color: "#e4e4e7", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>Vertragsklauseln</h4>
                {contract.clauses.map((clause) => (
                  <div key={clause.id} style={styles.clause}>
                    <div style={{ fontWeight: 600, color: "#d4d4d8", fontSize: "0.8rem" }}>{clause.title}</div>
                    <div style={{ color: "#a1a1aa", fontSize: "0.78rem", marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{clause.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Checkboxes */}
            <div style={styles.checkboxSection}>
              <h4 style={{ color: "#e4e4e7", fontSize: "0.85rem", margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckSquare size={16} color="#D4A843" />
                Einwilligungen (alle erforderlich)
              </h4>
              {contract.requiredCheckboxes.map((cb) => (
                <label key={cb.id} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!!checkboxStates[cb.id]}
                    onChange={(e) => handleCheckboxToggle(cb.id, e.target.checked)}
                    style={styles.checkbox}
                  />
                  <div>
                    <span style={{ color: "#e4e4e7", fontSize: "0.83rem" }}>{cb.label}</span>
                    {cb.legalRef && (
                      <span style={{ display: "block", color: "#71717a", fontSize: "0.75rem", marginTop: "0.125rem" }}>
                        Rechtsgrundlage: {cb.legalRef}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Signature */}
            <div style={styles.signatureSection}>
              <h4 style={{ color: "#e4e4e7", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
                Digitale Unterschrift (optional)
              </h4>
              <SignatureCanvas onSignatureChange={setSignatureData} />
            </div>

            {/* Legal Info */}
            <div style={styles.legalInfo}>
              <Clock size={14} />
              <div style={{ fontSize: "0.75rem", color: "#71717a" }}>
                <div>Zeitstempel: {new Date().toLocaleString("de-DE")}</div>
                <div>Ihre IP-Adresse und Browser-Daten werden zu Beweissicherungszwecken gespeichert.</div>
                <div>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</div>
              </div>
            </div>

            {/* Submit */}
            {submitError && (
              <div style={styles.errorBox}>
                <AlertTriangle size={14} />
                <span>{submitError}</span>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={!allRequiredChecked || submitting}
              style={{
                ...styles.acceptButton,
                opacity: !allRequiredChecked || submitting ? 0.5 : 1,
                cursor: !allRequiredChecked || submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Wird verarbeitet..." : "Vertrag verbindlich annehmen"}
            </button>

            {!allRequiredChecked && (
              <p style={{ textAlign: "center", color: "#71717a", fontSize: "0.75rem", margin: "0.5rem 0 0" }}>
                Bitte akzeptieren Sie alle Pflicht-Einwilligungen
              </p>
            )}

            <button
              onClick={() => navigate("/hv-center")}
              style={styles.laterButton}
            >
              Später unterschreiben
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#060b18",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "rgba(10, 10, 15, 0.95)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "1rem 2rem",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(16px)",
  },
  headerInner: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#e4e4e7",
    fontSize: "1.1rem",
    fontWeight: 600,
    margin: 0,
  },
  version: {
    color: "#71717a",
    fontSize: "0.8rem",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.375rem 0.75rem",
    background: "rgba(212, 168, 67, 0.1)",
    border: "1px solid rgba(212, 168, 67, 0.3)",
    borderRadius: "6px",
    color: "#EAD068",
    fontSize: "0.78rem",
    fontWeight: 500,
  },
  main: {
    flex: 1,
    padding: "1.5rem 2rem",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: "1.5rem",
    alignItems: "start",
  },
  pdfSection: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "1rem",
  },
  sectionTitle: {
    color: "#e4e4e7",
    fontSize: "0.9rem",
    fontWeight: 600,
    margin: "0 0 0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  pdfContainer: {
    height: "70vh",
    overflow: "auto",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "#fff",
  },
  scrollHint: {
    textAlign: "center" as const,
    padding: "0.5rem",
    color: "#f59e0b",
    fontSize: "0.78rem",
    background: "rgba(245, 158, 11, 0.08)",
    borderRadius: "6px",
    marginTop: "0.5rem",
  },
  acceptSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  infoBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "1rem",
  },
  clausesBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "1rem",
    maxHeight: "30vh",
    overflow: "auto",
  },
  clause: {
    padding: "0.625rem 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  checkboxSection: {
    background: "rgba(212, 168, 67, 0.04)",
    border: "1px solid rgba(212, 168, 67, 0.15)",
    borderRadius: "12px",
    padding: "1rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "0.625rem 0",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  checkbox: {
    marginTop: "0.125rem",
    width: "18px",
    height: "18px",
    accentColor: "#D4A843",
    cursor: "pointer",
    flexShrink: 0,
  },
  signatureSection: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "1rem",
  },
  legalInfo: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    padding: "0.75rem",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#71717a",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "0.83rem",
  },
  acceptButton: {
    width: "100%",
    padding: "0.875rem",
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
    transition: "all 0.2s",
  },
  loadingContainer: {
    minHeight: "100vh",
    background: "#060b18",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "2px solid rgba(212, 168, 67, 0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  retryButton: {
    padding: "0.5rem 1.25rem",
    background: "rgba(212, 168, 67, 0.1)",
    border: "1px solid rgba(212, 168, 67, 0.3)",
    borderRadius: "8px",
    color: "#EAD068",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  laterButton: {
    width: "100%",
    padding: "0.75rem",
    background: "transparent",
    color: "#71717a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

export default HvContractPage;
