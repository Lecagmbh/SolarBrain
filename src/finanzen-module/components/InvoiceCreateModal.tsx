// ============================================
// INVOICE CREATE MODAL - PREMIUM
// ============================================
// Mit Installation-Auswahl für Kunden
// ============================================

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  Trash2,
  Calendar,
  FileText,
  User,
  Package,
  Sparkles,
  AlertCircle,
  Check,
  Zap,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { getAccessToken } from "../../modules/auth/tokenStorage";

// ============================================
// TYPES
// ============================================

interface Customer {
  id: number;
  firma?: string;
  name?: string;
  email?: string;
}

interface Installation {
  id: number;
  publicId?: string;
  customerName?: string;
  location?: string;
  status?: string;
  statusLabel?: string;
  caseType?: string;
  registrationTargets?: string;
  plz?: string;
  ort?: string;
  strasse?: string;
  hausNr?: string;
}

interface Position {
  id: string;
  beschreibung: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
  mwst_satz: number;
}

interface InvoiceCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id?: number) => void;
  createDraft: (payload: Record<string, unknown>) => Promise<{ id: number }>;
}

// ============================================
// HELPERS
// ============================================

const generateId = () => Math.random().toString(36).substring(2, 11);

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const getInstallationLabel = (inst: Installation): string => {
  return inst.publicId || `#${inst.id}`;
};

const getInstallationSubtitle = (inst: Installation): string => {
  const parts = [inst.customerName, inst.location].filter(Boolean);
  return parts.join(" · ") || "Keine Details";
};

const getInstallationAddress = (inst: Installation): string => {
  const parts = [
    inst.strasse && inst.hausNr ? `${inst.strasse} ${inst.hausNr}` : inst.strasse,
    inst.plz && inst.ort ? `${inst.plz} ${inst.ort}` : inst.ort,
  ].filter(Boolean);
  return parts.join(", ") || "";
};

// ============================================
// COMPONENT
// ============================================

export default function InvoiceCreateModal({
  open,
  onClose,
  onCreated,
  createDraft,
}: InvoiceCreateModalProps) {
  // State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Installations
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [installationsLoading, setInstallationsLoading] = useState(false);

  // Positions
  const [positions, setPositions] = useState<Position[]>([]);

  // Dates
  const today = new Date();
  const defaultDue = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const [rechnungsDatum, setRechnungsDatum] = useState(formatDate(today));
  const [leistungsDatum, setLeistungsDatum] = useState(formatDate(today));
  const [faelligAm, setFaelligAm] = useState(formatDate(defaultDue));

  // Notes
  const [notizen, setNotizen] = useState("");

  // ============================================
  // LOAD CUSTOMERS
  // ============================================

  useEffect(() => {
    if (!open) return;

    const loadCustomers = async () => {
      setCustomersLoading(true);
      try {
        const token = getAccessToken();
        const res = await fetch("/api/kunden?limit=500", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load customers:", err);
      } finally {
        setCustomersLoading(false);
      }
    };

    loadCustomers();
  }, [open]);

  // ============================================
  // LOAD INSTALLATIONS WHEN CUSTOMER CHANGES
  // ============================================

  useEffect(() => {
    if (!selectedCustomer) {
      setInstallations([]);
      setSelectedInstallation(null);
      return;
    }

    const loadInstallations = async () => {
      setInstallationsLoading(true);
      try {
        const token = getAccessToken();
        const res = await fetch(`/api/installations?kundeId=${selectedCustomer.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.data || [];
          setInstallations(list);
          // Auto-select first installation if available
          if (list.length > 0) {
            setSelectedInstallation(list[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load installations:", err);
      } finally {
        setInstallationsLoading(false);
      }
    };

    loadInstallations();
  }, [selectedCustomer]);

  // ============================================
  // RESET ON CLOSE
  // ============================================

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedCustomer(null);
      setSelectedInstallation(null);
      setCustomerSearch("");
      setInstallations([]);
      setPositions([]);
      setNotizen("");
      setError(null);
      setRechnungsDatum(formatDate(new Date()));
      setLeistungsDatum(formatDate(new Date()));
      setFaelligAm(formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
    }
  }, [open]);

  // ============================================
  // POSITION HANDLERS
  // ============================================

  const addPosition = useCallback(() => {
    setPositions((prev) => [
      ...prev,
      {
        id: generateId(),
        beschreibung: "",
        menge: 1,
        einheit: "Stk.",
        einzelpreis: 0,
        mwst_satz: 19,
      },
    ]);
  }, []);

  const addPositionFromInstallation = useCallback(() => {
    if (!selectedInstallation) return;
    
    const addr = getInstallationAddress(selectedInstallation);
    const beschreibung = `Netzanmeldung ${selectedInstallation.publicId || `#${selectedInstallation.id}`}${addr ? ` - ${addr}` : ""}`;
    
    setPositions((prev) => [
      ...prev,
      {
        id: generateId(),
        beschreibung,
        menge: 1,
        einheit: "Pausch.",
        einzelpreis: 149,
        mwst_satz: 19,
      },
    ]);
  }, [selectedInstallation]);

  const updatePosition = useCallback((id: string, field: keyof Position, value: string | number) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }, []);

  const removePosition = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ============================================
  // CALCULATIONS
  // ============================================

  const totals = useMemo(() => {
    return positions.reduce(
      (acc, pos) => {
        const netto = pos.menge * pos.einzelpreis;
        const mwst = netto * (pos.mwst_satz / 100);
        return {
          netto: acc.netto + netto,
          mwst: acc.mwst + mwst,
          brutto: acc.brutto + netto + mwst,
        };
      },
      { netto: 0, mwst: 0, brutto: 0 }
    );
  }, [positions]);

  // ============================================
  // FILTERED CUSTOMERS
  // ============================================

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!customerSearch.trim()) return true;
      const q = customerSearch.toLowerCase();
      return (
        c.firma?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    });
  }, [customers, customerSearch]);

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      setError("Bitte wähle einen Kunden aus");
      setStep(1);
      return;
    }

    if (positions.length === 0) {
      setError("Bitte füge mindestens eine Position hinzu");
      setStep(2);
      return;
    }

    const invalidPos = positions.find((p) => !p.beschreibung.trim());
    if (invalidPos) {
      setError("Alle Positionen benötigen eine Beschreibung");
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        kunde_id: selectedCustomer.id,
        kundeId: selectedCustomer.id,
        rechnungs_datum: rechnungsDatum,
        rechnungsDatum,
        leistungsDatum,
        faellig_am: faelligAm,
        faelligAm,
        notizen: notizen || undefined,
        beschreibung: notizen || undefined,
        positionen: positions.map((p) => ({
          beschreibung: p.beschreibung,
          title: p.beschreibung,
          menge: p.menge,
          qty: p.menge,
          einheit: p.einheit,
          einzelpreis: p.einzelpreis,
          unitNet: p.einzelpreis,
          mwst_satz: p.mwst_satz,
          vatRate: p.mwst_satz,
        })),
      };

      const result = await createDraft(payload);
      onCreated(result?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // VALIDATION
  // ============================================

  const canProceedStep1 = !!selectedCustomer;
  const canProceedStep2 = positions.length > 0 && positions.every((p) => p.beschreibung.trim());
  const canSubmit = canProceedStep1 && canProceedStep2;

  // ============================================
  // RENDER
  // ============================================

  if (!open) return null;

  return (
    <div className="icm-overlay" onClick={onClose}>
      <div className="icm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="icm-header">
          <div className="icm-header__left">
            <div className="icm-header__icon">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="icm-header__title">
                Neue Rechnung
                <span className="icm-badge">Entwurf</span>
              </h2>
              <p className="icm-header__subtitle">
                Schritt {step} von 3
              </p>
            </div>
          </div>
          <button className="icm-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="icm-progress">
          <div className="icm-progress__track">
            <div
              className="icm-progress__bar"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <div className="icm-steps">
            <button
              className={`icm-step ${step >= 1 ? "icm-step--active" : ""} ${selectedCustomer ? "icm-step--done" : ""}`}
              onClick={() => setStep(1)}
            >
              <User size={16} />
              <span>Kunde</span>
            </button>
            <button
              className={`icm-step ${step >= 2 ? "icm-step--active" : ""} ${canProceedStep2 ? "icm-step--done" : ""}`}
              onClick={() => canProceedStep1 && setStep(2)}
              disabled={!canProceedStep1}
            >
              <Package size={16} />
              <span>Positionen</span>
            </button>
            <button
              className={`icm-step ${step >= 3 ? "icm-step--active" : ""}`}
              onClick={() => canProceedStep1 && canProceedStep2 && setStep(3)}
              disabled={!canProceedStep1 || !canProceedStep2}
            >
              <Check size={16} />
              <span>Übersicht</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="icm-error">
            <AlertCircle size={16} />
            <span>{safeString(error)}</span>
            <button onClick={() => setError(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="icm-content">
          {/* Step 1: Customer & Installation */}
          {step === 1 && (
            <div className="icm-step-content">
              <h3 className="icm-section-title">
                <User size={18} />
                Kunde auswählen
              </h3>

              <div className="icm-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Kunde suchen..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="icm-customer-list">
                {customersLoading ? (
                  <div className="icm-loading">Lade Kunden...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="icm-empty">Keine Kunden gefunden</div>
                ) : (
                  filteredCustomers.slice(0, 50).map((customer) => (
                    <button
                      key={customer.id}
                      className={`icm-customer ${selectedCustomer?.id === customer.id ? "icm-customer--selected" : ""}`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="icm-customer__avatar">
                        {(customer.firma || customer.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="icm-customer__info">
                        <span className="icm-customer__name">
                          {customer.firma || customer.name || "Unbekannt"}
                        </span>
                        {customer.email && (
                          <span className="icm-customer__email">{customer.email}</span>
                        )}
                      </div>
                      {selectedCustomer?.id === customer.id && (
                        <Check size={18} className="icm-customer__check" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Installation Selection */}
              {selectedCustomer && (
                <div className="icm-installations">
                  <h3 className="icm-section-title">
                    <Zap size={18} />
                    Installation auswählen (optional)
                  </h3>

                  {installationsLoading ? (
                    <div className="icm-loading">Lade Installationen...</div>
                  ) : installations.length === 0 ? (
                    <div className="icm-empty-small">
                      Keine Installationen für diesen Kunden
                    </div>
                  ) : (
                    <div className="icm-installation-list">
                      {installations.map((inst) => (
                        <button
                          key={inst.id}
                          className={`icm-installation ${selectedInstallation?.id === inst.id ? "icm-installation--selected" : ""}`}
                          onClick={() => setSelectedInstallation(
                            selectedInstallation?.id === inst.id ? null : inst
                          )}
                        >
                          <div className="icm-installation__icon">
                            <Zap size={18} />
                          </div>
                          <div className="icm-installation__info">
                            <span className="icm-installation__id">
                              {getInstallationLabel(inst)}
                            </span>
                            <span className="icm-installation__details">
                              {getInstallationSubtitle(inst)}
                            </span>
                            {getInstallationAddress(inst) && (
                              <span className="icm-installation__address">
                                <MapPin size={12} />
                                {getInstallationAddress(inst)}
                              </span>
                            )}
                          </div>
                          {inst.statusLabel && (
                            <span className="icm-installation__status">
                              {inst.statusLabel}
                            </span>
                          )}
                          {selectedInstallation?.id === inst.id && (
                            <Check size={18} className="icm-installation__check" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Positions */}
          {step === 2 && (
            <div className="icm-step-content">
              <div className="icm-section-header">
                <h3 className="icm-section-title">
                  <Package size={18} />
                  Positionen
                </h3>
                <div className="icm-section-actions">
                  {selectedInstallation && (
                    <button 
                      className="icm-btn icm-btn--sm icm-btn--accent" 
                      onClick={addPositionFromInstallation}
                    >
                      <Zap size={14} />
                      Aus Installation
                    </button>
                  )}
                  <button className="icm-btn icm-btn--sm" onClick={addPosition}>
                    <Plus size={16} />
                    Freie Position
                  </button>
                </div>
              </div>

              {/* Selected Installation Info */}
              {selectedInstallation && (
                <div className="icm-selected-installation">
                  <Zap size={16} />
                  <span>
                    Installation: <strong>{getInstallationLabel(selectedInstallation)}</strong>
                    {getInstallationAddress(selectedInstallation) && (
                      <> · {getInstallationAddress(selectedInstallation)}</>
                    )}
                  </span>
                </div>
              )}

              {positions.length === 0 ? (
                <div className="icm-positions-empty">
                  <Package size={32} />
                  <p>Noch keine Positionen</p>
                  <div className="icm-positions-empty__actions">
                    {selectedInstallation && (
                      <button 
                        className="icm-btn icm-btn--accent" 
                        onClick={addPositionFromInstallation}
                      >
                        <Zap size={16} />
                        Position aus Installation
                      </button>
                    )}
                    <button className="icm-btn icm-btn--primary" onClick={addPosition}>
                      <Plus size={16} />
                      Freie Position hinzufügen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="icm-positions">
                  {positions.map((pos, index) => (
                    <div key={pos.id} className="icm-position">
                      <div className="icm-position__header">
                        <span className="icm-position__num">#{index + 1}</span>
                        <button
                          className="icm-position__delete"
                          onClick={() => removePosition(pos.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="icm-position__row">
                        <div className="icm-field icm-field--full">
                          <label>Beschreibung</label>
                          <input
                            type="text"
                            value={pos.beschreibung}
                            onChange={(e) => updatePosition(pos.id, "beschreibung", e.target.value)}
                            placeholder="Leistung oder Produkt..."
                          />
                        </div>
                      </div>
                      <div className="icm-position__row">
                        <div className="icm-field">
                          <label>Menge</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={pos.menge}
                            onChange={(e) => updatePosition(pos.id, "menge", parseFloat(e.target.value) || 1)}
                          />
                        </div>
                        <div className="icm-field">
                          <label>Einheit</label>
                          <select
                            value={pos.einheit}
                            onChange={(e) => updatePosition(pos.id, "einheit", e.target.value)}
                          >
                            <option value="Stk.">Stk.</option>
                            <option value="Std.">Std.</option>
                            <option value="Pausch.">Pausch.</option>
                            <option value="m">m</option>
                            <option value="m²">m²</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                        <div className="icm-field">
                          <label>Einzelpreis (€)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pos.einzelpreis}
                            onChange={(e) => updatePosition(pos.id, "einzelpreis", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="icm-field">
                          <label>MwSt.</label>
                          <select
                            value={pos.mwst_satz}
                            onChange={(e) => updatePosition(pos.id, "mwst_satz", parseInt(e.target.value))}
                          >
                            <option value={19}>19%</option>
                            <option value={7}>7%</option>
                            <option value={0}>0%</option>
                          </select>
                        </div>
                      </div>
                      <div className="icm-position__total">
                        Gesamt: {formatCurrency(pos.menge * pos.einzelpreis * (1 + pos.mwst_satz / 100))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dates */}
              <div className="icm-dates">
                <h3 className="icm-section-title">
                  <Calendar size={18} />
                  Daten
                </h3>
                <div className="icm-dates__row">
                  <div className="icm-field">
                    <label>Rechnungsdatum</label>
                    <input
                      type="date"
                      value={rechnungsDatum}
                      onChange={(e) => setRechnungsDatum(e.target.value)}
                    />
                  </div>
                  <div className="icm-field">
                    <label>Leistungsdatum</label>
                    <input
                      type="date"
                      value={leistungsDatum}
                      onChange={(e) => setLeistungsDatum(e.target.value)}
                    />
                  </div>
                  <div className="icm-field">
                    <label>Fällig am</label>
                    <input
                      type="date"
                      value={faelligAm}
                      onChange={(e) => setFaelligAm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="icm-notes">
                <h3 className="icm-section-title">
                  <FileText size={18} />
                  Notizen (optional)
                </h3>
                <textarea
                  placeholder="Interne Notizen oder Beschreibung..."
                  value={notizen}
                  onChange={(e) => setNotizen(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="icm-step-content">
              <h3 className="icm-section-title">
                <Check size={18} />
                Zusammenfassung
              </h3>

              {/* Customer Summary */}
              <div className="icm-summary-card">
                <div className="icm-summary-card__header">
                  <User size={16} />
                  Kunde
                </div>
                <div className="icm-summary-card__content">
                  <strong>{selectedCustomer?.firma || selectedCustomer?.name}</strong>
                  {selectedCustomer?.email && <span>{selectedCustomer.email}</span>}
                </div>
              </div>

              {/* Installation Summary */}
              {selectedInstallation && (
                <div className="icm-summary-card">
                  <div className="icm-summary-card__header">
                    <Zap size={16} />
                    Installation
                  </div>
                  <div className="icm-summary-card__content">
                    <strong>{getInstallationLabel(selectedInstallation)}</strong>
                    <span>{getInstallationAddress(selectedInstallation) || getInstallationSubtitle(selectedInstallation)}</span>
                  </div>
                </div>
              )}

              {/* Positions Summary */}
              <div className="icm-summary-card">
                <div className="icm-summary-card__header">
                  <Package size={16} />
                  {positions.length} Position{positions.length !== 1 ? "en" : ""}
                </div>
                <div className="icm-summary-positions">
                  {positions.map((pos, i) => (
                    <div key={pos.id} className="icm-summary-position">
                      <span>{pos.beschreibung || `Position ${i + 1}`}</span>
                      <span>{formatCurrency(pos.menge * pos.einzelpreis)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="icm-totals">
                <div className="icm-total-row">
                  <span>Netto</span>
                  <span>{formatCurrency(totals.netto)}</span>
                </div>
                <div className="icm-total-row">
                  <span>MwSt.</span>
                  <span>{formatCurrency(totals.mwst)}</span>
                </div>
                <div className="icm-total-row icm-total-row--highlight">
                  <span>Gesamtbetrag</span>
                  <span>{formatCurrency(totals.brutto)}</span>
                </div>
              </div>

              {/* Dates Summary */}
              <div className="icm-summary-dates">
                <div>
                  <span>Rechnungsdatum</span>
                  <strong>{new Date(rechnungsDatum).toLocaleDateString("de-DE")}</strong>
                </div>
                <div>
                  <span>Leistungsdatum</span>
                  <strong>{new Date(leistungsDatum).toLocaleDateString("de-DE")}</strong>
                </div>
                <div>
                  <span>Fällig am</span>
                  <strong>{new Date(faelligAm).toLocaleDateString("de-DE")}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="icm-footer">
          <div className="icm-footer__left">
            {step > 1 && (
              <button className="icm-btn" onClick={() => setStep(step - 1)}>
                Zurück
              </button>
            )}
          </div>
          <div className="icm-footer__right">
            {step < 3 ? (
              <button
                className="icm-btn icm-btn--primary"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              >
                Weiter
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="icm-btn icm-btn--success"
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
              >
                {loading ? (
                  "Wird erstellt..."
                ) : (
                  <>
                    <Sparkles size={16} />
                    Entwurf erstellen
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .icm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
          animation: icm-fade-in 0.2s ease-out;
        }

        @keyframes icm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .icm-modal {
          width: 100%;
          max-width: 750px;
          max-height: 90vh;
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: icm-modal-in 0.3s ease-out;
        }

        @keyframes icm-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(-20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .icm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .icm-header__left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icm-header__icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #EAD068 0%, #D4A843 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .icm-header__title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .icm-badge {
          padding: 0.25rem 0.5rem;
          background: rgba(100, 116, 139, 0.3);
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .icm-header__subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0.25rem 0 0;
        }

        .icm-close {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 12px;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icm-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .icm-progress {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .icm-progress__track {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .icm-progress__bar {
          height: 100%;
          background: linear-gradient(90deg, #EAD068, #D4A843);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .icm-steps {
          display: flex;
          gap: 0.5rem;
        }

        .icm-step {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          color: #64748b;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icm-step:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
        }

        .icm-step:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icm-step--active {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.3);
          color: #f0d878;
        }

        .icm-step--done {
          color: #10b981;
        }

        .icm-error {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          margin: 1rem 1.5rem 0;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #f87171;
          font-size: 0.875rem;
        }

        .icm-error button {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #f87171;
          cursor: pointer;
          padding: 0.25rem;
        }

        .icm-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .icm-step-content {
          animation: icm-step-in 0.3s ease-out;
        }

        @keyframes icm-step-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .icm-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #cbd5e1;
          margin: 0 0 1rem;
        }

        .icm-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .icm-section-header .icm-section-title {
          margin: 0;
        }

        .icm-section-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icm-search {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .icm-search:focus-within {
          border-color: rgba(139, 92, 246, 0.4);
        }

        .icm-search svg {
          color: #64748b;
        }

        .icm-search input {
          flex: 1;
          background: transparent;
          border: none;
          font-size: 0.875rem;
          color: #fff;
          outline: none;
        }

        .icm-search input::placeholder {
          color: #64748b;
        }

        .icm-customer-list {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .icm-loading, .icm-empty {
          padding: 2rem;
          text-align: center;
          color: #64748b;
        }

        .icm-empty-small {
          padding: 1rem;
          text-align: center;
          color: #64748b;
          font-size: 0.875rem;
        }

        .icm-customer {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .icm-customer:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .icm-customer--selected {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .icm-customer__avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #D4A843, #EAD068);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .icm-customer__info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }

        .icm-customer__name {
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .icm-customer__email {
          font-size: 0.8125rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .icm-customer__check {
          color: #10b981;
          flex-shrink: 0;
        }

        /* Installations */
        .icm-installations {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .icm-installation-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .icm-installation {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .icm-installation:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .icm-installation--selected {
          background: rgba(250, 204, 21, 0.1);
          border-color: rgba(250, 204, 21, 0.4);
        }

        .icm-installation__icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #facc15, #f59e0b);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e293b;
          flex-shrink: 0;
        }

        .icm-installation__info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }

        .icm-installation__id {
          font-weight: 700;
          color: #facc15;
          font-size: 0.875rem;
        }

        .icm-installation__details {
          font-size: 0.8125rem;
          color: #94a3b8;
        }

        .icm-installation__address {
          font-size: 0.75rem;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .icm-installation__status {
          padding: 0.25rem 0.5rem;
          background: rgba(100, 116, 139, 0.2);
          border-radius: 6px;
          font-size: 0.6875rem;
          color: #94a3b8;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .icm-installation__check {
          color: #facc15;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }

        .icm-selected-installation {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(250, 204, 21, 0.1);
          border: 1px solid rgba(250, 204, 21, 0.3);
          border-radius: 10px;
          margin-bottom: 1rem;
          font-size: 0.8125rem;
          color: #fcd34d;
        }

        .icm-selected-installation strong {
          color: #facc15;
        }

        /* Positions */
        .icm-positions-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem;
          color: #64748b;
          gap: 1rem;
        }

        .icm-positions-empty__actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .icm-positions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .icm-position {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
        }

        .icm-position__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .icm-position__num {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
        }

        .icm-position__delete {
          width: 28px;
          height: 28px;
          background: rgba(239, 68, 68, 0.1);
          border: none;
          border-radius: 8px;
          color: #f87171;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icm-position__delete:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .icm-position__row {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .icm-position__total {
          text-align: right;
          font-weight: 600;
          color: #10b981;
          font-size: 0.875rem;
        }

        .icm-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .icm-field--full {
          flex: none;
          width: 100%;
        }

        .icm-field label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .icm-field input,
        .icm-field select,
        .icm-field textarea {
          padding: 0.625rem 0.875rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.875rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .icm-field input:focus,
        .icm-field select:focus,
        .icm-field textarea:focus {
          border-color: rgba(139, 92, 246, 0.4);
        }

        .icm-field select {
          cursor: pointer;
        }

        .icm-field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .icm-dates, .icm-notes {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .icm-dates__row {
          display: flex;
          gap: 1rem;
        }

        /* Summary */
        .icm-summary-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .icm-summary-card__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .icm-summary-card__content {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .icm-summary-card__content strong {
          color: #fff;
        }

        .icm-summary-card__content span {
          color: #64748b;
          font-size: 0.875rem;
        }

        .icm-summary-positions {
          padding: 0.5rem 0;
        }

        .icm-summary-position {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          color: #cbd5e1;
        }

        .icm-summary-position:nth-child(odd) {
          background: rgba(255, 255, 255, 0.02);
        }

        .icm-totals {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .icm-total-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .icm-total-row--highlight {
          padding-top: 0.75rem;
          margin-top: 0.5rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
          font-size: 1.125rem;
          font-weight: 700;
          color: #10b981;
        }

        .icm-summary-dates {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .icm-summary-dates > div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .icm-summary-dates span {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
        }

        .icm-summary-dates strong {
          color: #fff;
        }

        /* Footer */
        .icm-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .icm-footer__left, .icm-footer__right {
          display: flex;
          gap: 0.75rem;
        }

        /* Buttons */
        .icm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
        }

        .icm-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .icm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icm-btn--sm {
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
        }

        .icm-btn--primary {
          background: linear-gradient(135deg, #EAD068 0%, #D4A843 100%);
          border-color: transparent;
          color: white;
        }

        .icm-btn--primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }

        .icm-btn--accent {
          background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
          border-color: transparent;
          color: #1e293b;
        }

        .icm-btn--accent:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(250, 204, 21, 0.4);
        }

        .icm-btn--success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: transparent;
          color: white;
        }

        .icm-btn--success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }

        @media (max-width: 600px) {
          .icm-position__row {
            flex-wrap: wrap;
          }
          .icm-position__row .icm-field {
            min-width: 45%;
          }
          .icm-dates__row {
            flex-direction: column;
          }
          .icm-summary-dates {
            flex-direction: column;
            gap: 1rem;
          }
          .icm-section-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
