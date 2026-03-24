// src/modules/rechnungen/InvoiceCreateModal.tsx
// ENDLEVEL Invoice Studio - Premium Fullscreen Modal mit Glassmorphism
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Catalog,
  CompanySettings,
  KundeDetail,
  KundeListRow,
  LineItem,
  ServiceKey,
} from "./types";
import {
  fetchInstallationsForKunde,
  fetchCompanySettings,
  fetchKundeDetail,
  fetchKundePrices,
} from "./api";
import { useKundenSearch } from "./useKundenSearch";
import InvoicePreview from "./InvoicePreview";
import { getAccessToken } from "../auth/tokenStorage";

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function refPrimary(i: any) {
  return i?.publicId ? String(i.publicId) : `#${i?.id}`;
}
function refSecondary(i: any) {
  return [i?.customerName, i?.location].filter(Boolean).join(" · ");
}
function refStatus(i: any) {
  return i?.statusLabel || i?.status || "";
}

function money(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(n) ? n : 0);
}

function addDaysISO(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
}

function calc(items: LineItem[]) {
  const map = new Map<number, { net: number; vat: number; gross: number }>();
  let net = 0,
    vat = 0,
    gross = 0;

  for (const it of items) {
    const lineNet = it.qty * it.unitNet;
    const lineVat = lineNet * (it.vatRate / 100);
    const lineGross = lineNet + lineVat;
    net += lineNet;
    vat += lineVat;
    gross += lineGross;

    const cur = map.get(it.vatRate) || { net: 0, vat: 0, gross: 0 };
    cur.net += lineNet;
    cur.vat += lineVat;
    cur.gross += lineGross;
    map.set(it.vatRate, cur);
  }

  const breakdown = Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([vatRate, v]) => ({
      vatRate,
      net: Number(v.net.toFixed(2)),
      vat: Number(v.vat.toFixed(2)),
      gross: Number(v.gross.toFixed(2)),
    }));

  const allZeroVat = breakdown.length > 0 && breakdown.every((b) => b.vatRate === 0);

  return {
    net: Number(net.toFixed(2)),
    vat: Number(vat.toFixed(2)),
    gross: Number(gross.toFixed(2)),
    breakdown,
    allZeroVat,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   REFERENCE LISTBOX COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function ReferenceListbox({
  items,
  value,
  onChange,
}: {
  items: any[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = useMemo(
    () => items.find((x) => String(x.id) === String(value)) || null,
    [items, value]
  );
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const hay = [it.publicId, it.customerName, it.location, String(it.id)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [items, q]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="studio-listbox" ref={rootRef}>
      <button type="button" className="studio-listbox-btn" onClick={() => setOpen((v) => !v)}>
        <div className="studio-listbox-main">
          <span className="studio-listbox-icon">📋</span>
          <div className="studio-listbox-text">
            <span className="studio-listbox-label">
              {selected ? `Netzanmeldung ${refPrimary(selected)}` : "Netzanmeldung auswählen"}
            </span>
            <span className="studio-listbox-sub">
              {selected ? refSecondary(selected) : "Optional - für Referenz auf Vorgang"}
            </span>
          </div>
        </div>
        <span className={`studio-badge ${selected ? "studio-badge--purple" : "studio-badge--dim"}`}>
          {selected ? refStatus(selected) || "Verknüpft" : "Optional"}
        </span>
      </button>

      {open && (
        <div className="studio-listbox-dropdown">
          <div className="studio-listbox-search">
            <span>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suchen: NA25…, Name, Ort…"
              autoFocus
            />
          </div>
          <div className="studio-listbox-options">
            <button
              type="button"
              className={`studio-listbox-option ${!value ? "studio-listbox-option--active" : ""}`}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <span className="studio-listbox-option-icon">❌</span>
              <div className="studio-listbox-option-text">
                <span className="studio-listbox-option-title">Keine Referenz</span>
                <span className="studio-listbox-option-sub">Rechnung ohne Vorgangs-Verknüpfung</span>
              </div>
            </button>
            {filtered.length === 0 ? (
              <div className="studio-listbox-empty">Keine Treffer gefunden.</div>
            ) : (
              filtered.map((it: any) => (
                <button
                  key={it.id}
                  type="button"
                  className={`studio-listbox-option ${
                    String(it.id) === String(value) ? "studio-listbox-option--active" : ""
                  }`}
                  onClick={() => {
                    onChange(String(it.id));
                    setOpen(false);
                  }}
                >
                  <span className="studio-listbox-option-icon">📄</span>
                  <div className="studio-listbox-option-text">
                    <span className="studio-listbox-option-title">
                      Netzanmeldung {refPrimary(it)}
                    </span>
                    <span className="studio-listbox-option-sub">{refSecondary(it)}</span>
                  </div>
                  <span className="studio-badge studio-badge--small">{refStatus(it)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

type RightTab = "LAYOUT" | "PDF" | "CHECKS";
type ToastType = "ok" | "error" | "warn";
type Toast = { type: ToastType; msg: string } | null;

export default function InvoiceCreateModal({
  open,
  onClose,
  onCreated,
  createDraft,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (newId?: number) => void;
  createDraft: (payload: any) => Promise<any>;
}) {
  const [toast, setToast] = useState<Toast>(null);
  function showToast(type: ToastType, msg: string) {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), 3000);
  }

  // Kunde Search
  const [kundeQuery, setKundeQuery] = useState("");
  const { results: kunden, loading: kundenLoading } = useKundenSearch(kundeQuery);
  const [showKundenDropdown, setShowKundenDropdown] = useState(false);
  const kundeInputRef = useRef<HTMLInputElement>(null);

  const [selectedKundeList, setSelectedKundeList] = useState<KundeListRow | null>(null);
  const [kunde, setKunde] = useState<KundeDetail | null>(null);

  // Installations
  const [installations, setInstallations] = useState<any[]>([]);
  const [installationId, setInstallationId] = useState<string>("");

  // Catalog & Prices
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [priceMap, setPriceMap] = useState<Record<ServiceKey, { priceNet: number; vatRate: number }>>({
    NETZANMELDUNG: { priceNet: 0, vatRate: 19 },
    LAGEPLAN: { priceNet: 0, vatRate: 19 },
    SCHALTPLAN: { priceNet: 0, vatRate: 19 },
  });

  // Company
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [companyMissing, setCompanyMissing] = useState(false);

  // Invoice Data
  const [rechnungsDatum, setRechnungsDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [leistungsDatum, setLeistungsDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [faelligAm, setFaelligAm] = useState(() => addDaysISO(14));
  const [beschreibung, setBeschreibung] = useState("");
  const [steuerHinweis, setSteuerHinweis] = useState("");

  // Line Items
  const [items, setItems] = useState<LineItem[]>([]);
  const totals = useMemo(() => calc(items), [items]);

  // Preview
  const [rightTab, setRightTab] = useState<RightTab>("LAYOUT");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Derived
  const selectedAnlage = useMemo(() => {
    if (!installationId) return null;
    const idNum = Number(installationId);
    if (!Number.isFinite(idNum)) return null;
    return installations.find((a) => a.id === idNum) || null;
  }, [installationId, installations]);

  const referenzText = useMemo(() => {
    if (!selectedAnlage) return "";
    const title = selectedAnlage.bezeichnung || `Anlage #${selectedAnlage.id}`;
    const addr = selectedAnlage.adresse ? String(selectedAnlage.adresse) : "";
    return [title, addr].filter(Boolean).join(" · ");
  }, [selectedAnlage]);

  // Validation
  const blockers = useMemo(() => {
    const b: string[] = [];
    if (companyMissing) b.push("Company Settings fehlen");
    if (!selectedKundeList?.id) b.push("Kunde auswählen");
    if (items.length === 0) b.push("Mindestens 1 Position hinzufügen");
    if (!rechnungsDatum) b.push("Rechnungsdatum fehlt");
    if (!leistungsDatum) b.push("Leistungsdatum fehlt");
    if (!faelligAm) b.push("Fälligkeitsdatum fehlt");
    if (items.some((i) => !i.title.trim())) b.push("Position ohne Titel");
    if (items.some((i) => i.qty <= 0)) b.push("Menge muss > 0 sein");
    if (items.some((i) => i.unitNet < 0)) b.push("Preis muss >= 0 sein");
    if (totals.allZeroVat && !steuerHinweis.trim()) b.push("0% MwSt → Steuerhinweis erforderlich");
    return b;
  }, [selectedKundeList, items, rechnungsDatum, leistungsDatum, faelligAm, totals.allZeroVat, steuerHinweis, companyMissing]);

  // Reset Form
  function resetFormSoft() {
    setKundeQuery("");
    setSelectedKundeList(null);
    setKunde(null);
    setInstallations([]);
    setInstallationId("");
    setCatalog(null);
    setItems([]);
    setBeschreibung("");
    setSteuerHinweis("");
    setPdfPreviewUrl("");
    setPreviewError("");
    setRightTab("LAYOUT");
    setShowKundenDropdown(false);
  }

  // Load company settings
  useEffect(() => {
    if (!open) return;
    setCompany(null);
    setCompanyMissing(false);
    setPreviewError("");
    (async () => {
      try {
        const s = await fetchCompanySettings();
        const cs = s.data || null;
        setCompany(cs);
        setCompanyMissing(!cs);
        const term = Number((cs as any)?.paymentTermDays || 14);
        setFaelligAm((prev) => prev || addDaysISO(term));
      } catch {
        setCompany(null);
        setCompanyMissing(true);
      }
    })();
  }, [open]);

  // Show dropdown when typing
  useEffect(() => {
    if (kundeQuery.length >= 2 && !selectedKundeList) {
      setShowKundenDropdown(true);
    }
  }, [kundeQuery, selectedKundeList]);

  // Pick Customer
  async function pickKunde(k: KundeListRow) {
    try {
      setSelectedKundeList(k);
      setKundeQuery(k.firmenName || k.name);
      setShowKundenDropdown(false);
      setPreviewError("");
      setPdfPreviewUrl("");
      setRightTab("LAYOUT");

      const kd = await fetchKundeDetail(k.id);
      setKunde(kd);

      const a = await fetchInstallationsForKunde(k.id);
      const list = a.data || [];
      setInstallations(list);
      setInstallationId(list.length > 0 ? String(list[0].id) : "");

      const p = await fetchKundePrices(k.id);

      // Create catalog from API data or use fallback
      const catalogFromApi: Catalog = p.catalog || {
        NETZANMELDUNG: { title: "Netzanmeldung", description: "Netzanmeldung beim Netzbetreiber" },
        LAGEPLAN: { title: "Lageplan-Erstellung", description: "Erstellung eines Lageplans" },
        SCHALTPLAN: { title: "Schaltplan-Erstellung", description: "Erstellung eines Schaltplans" },
      };
      setCatalog(catalogFromApi);

      const map: any = { ...priceMap };
      for (const row of p.data || []) {
        map[row.serviceKey] = { priceNet: row.priceNet, vatRate: row.vatRate };
      }
      setPriceMap(map);
    } catch (e) {
      console.error(e);
      showToast("error", "Kunde/Anlagen/Preise konnten nicht geladen werden.");
    }
  }

  // Clear customer
  function clearKunde() {
    setSelectedKundeList(null);
    setKunde(null);
    setKundeQuery("");
    setInstallations([]);
    setInstallationId("");
    setCatalog(null);
    setItems([]);
  }

  // Add Service
  function addService(serviceKey: ServiceKey) {
    const c = catalog?.[serviceKey];
    if (!c) return;
    const p = priceMap[serviceKey] || { priceNet: 0, vatRate: 19 };
    setItems((prev) => [
      ...prev,
      {
        title: c.title,
        description: c.description,
        qty: 1,
        unitNet: Number(p.priceNet || 0),
        vatRate: Number(p.vatRate ?? 19),
      },
    ]);
  }

  // Update/Remove Items
  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveItem(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const arr = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  // Build Payload
  function buildPayload() {
    return {
      kundeId: selectedKundeList!.id,
      installationId: installationId ? Number(installationId) : undefined,
      positionen: items,
      beschreibung: beschreibung.trim() || undefined,
      rechnungsDatum,
      leistungsDatum,
      faelligAm,
      steuerHinweis: steuerHinweis.trim() || undefined,
    };
  }

  // Preview PDF
  async function previewPdf() {
    if (blockers.length > 0) {
      setRightTab("CHECKS");
      showToast("warn", "Bitte alle Fehler beheben.");
      return;
    }

    setPreviewBusy(true);
    setPreviewError("");

    try {
      const token = getAccessToken();
      const res = await fetch("/admin-api/rechnungen/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || "Preview failed: HTTP " + res.status;
        setPreviewError(msg);
        setRightTab("CHECKS");
        showToast("error", msg);
        return;
      }

      const p = data.pdf_path as string | undefined;
      if (!p) {
        setPreviewError("Kein PDF-Pfad erhalten.");
        setRightTab("CHECKS");
        showToast("error", "Kein PDF-Pfad erhalten.");
        return;
      }

      setPdfPreviewUrl(p);
      setRightTab("PDF");
      showToast("ok", "PDF Vorschau erzeugt!");
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "PDF Preview fehlgeschlagen.";
      setPreviewError(msg);
      setRightTab("CHECKS");
      showToast("error", msg);
    } finally {
      setPreviewBusy(false);
    }
  }

  // Submit
  async function submit() {
    if (blockers.length > 0) {
      setRightTab("CHECKS");
      showToast("warn", "Bitte alle Fehler beheben.");
      return;
    }

    setCreating(true);
    try {
      const r: any = await createDraft(buildPayload());
      const newId = r?.data?.id;
      showToast("ok", "Entwurf erstellt!");
      onCreated(newId ? Number(newId) : undefined);
      resetFormSoft();
    } catch (e: any) {
      console.error(e);
      showToast("error", e?.response?.data?.error || e?.message || "Entwurf erstellen fehlgeschlagen.");
    } finally {
      setCreating(false);
    }
  }

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="studio-overlay">
      <style>{studioStyles}</style>

      <div className="studio-container">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="studio-header">
          <div className="studio-header-left">
            <div className="studio-header-icon">🧾</div>
            <div>
              <h1 className="studio-title">Invoice Studio</h1>
              <p className="studio-subtitle">Neue Rechnung erstellen</p>
            </div>
          </div>

          <div className="studio-header-actions">
            <button
              className="studio-btn studio-btn--ghost"
              onClick={previewPdf}
              disabled={previewBusy || blockers.length > 0}
            >
              {previewBusy ? "⏳" : "👁️"} PDF Vorschau
            </button>
            <button
              className="studio-btn studio-btn--ghost"
              onClick={() => pdfPreviewUrl && window.open(pdfPreviewUrl, "_blank")}
              disabled={!pdfPreviewUrl}
            >
              🔗 Öffnen
            </button>
            <button
              className="studio-btn studio-btn--primary"
              onClick={submit}
              disabled={blockers.length > 0 || creating}
            >
              {creating ? "⏳" : "✅"} Entwurf erstellen
            </button>
            <button className="studio-btn studio-btn--close" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>

        {/* ═══════════════════ MAIN ═══════════════════ */}
        <div className="studio-main">
          {/* LEFT: Editor */}
          <div className="studio-editor">
            {/* Customer Selection */}
            <section className="studio-section">
              <h2 className="studio-section-title">
                <span>👤</span> Kunde
              </h2>

              {selectedKundeList ? (
                <div className="studio-customer-card">
                  <div className="studio-customer-info">
                    <div className="studio-customer-avatar">
                      {(selectedKundeList.firmenName || selectedKundeList.name || "K")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="studio-customer-name">
                        {selectedKundeList.firmenName || selectedKundeList.name}
                      </div>
                      <div className="studio-customer-meta">
                        #{selectedKundeList.id}
                        {selectedKundeList.kundenNummer && ` · ${selectedKundeList.kundenNummer}`}
                      </div>
                    </div>
                  </div>
                  <button className="studio-btn studio-btn--small studio-btn--ghost" onClick={clearKunde}>
                    ✕ Ändern
                  </button>
                </div>
              ) : (
                <div className="studio-search-wrap">
                  <span className="studio-search-icon">🔍</span>
                  <input
                    ref={kundeInputRef}
                    type="text"
                    className="studio-search-input"
                    value={kundeQuery}
                    onChange={(e) => {
                      setKundeQuery(e.target.value);
                      setShowKundenDropdown(true);
                    }}
                    onFocus={() => kundeQuery.length >= 2 && setShowKundenDropdown(true)}
                    placeholder="Kunde suchen (Name, Nummer, Firma...)"
                  />
                  {kundenLoading && <span className="studio-search-spinner">⏳</span>}

                  {showKundenDropdown && kunden.length > 0 && (
                    <div className="studio-search-dropdown">
                      {kunden.map((k) => (
                        <button key={k.id} className="studio-search-option" onClick={() => pickKunde(k)}>
                          <div className="studio-search-option-avatar">
                            {(k.firmenName || k.name || "K")[0].toUpperCase()}
                          </div>
                          <div className="studio-search-option-info">
                            <span className="studio-search-option-name">{k.firmenName || k.name}</span>
                            <span className="studio-search-option-meta">
                              #{k.id} {k.kundenNummer && `· ${k.kundenNummer}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Reference Selection */}
            {selectedKundeList && (
              <section className="studio-section">
                <h2 className="studio-section-title">
                  <span>📋</span> Referenz
                </h2>
                <ReferenceListbox items={installations} value={installationId} onChange={setInstallationId} />
              </section>
            )}

            {/* Services */}
            {selectedKundeList && (
              <section className="studio-section">
                <h2 className="studio-section-title">
                  <span>⚡</span> Leistungen hinzufügen
                </h2>
                <div className="studio-services">
                  <button
                    className="studio-service-btn"
                    onClick={() => addService("NETZANMELDUNG")}
                    disabled={!catalog}
                  >
                    <span className="studio-service-icon">📝</span>
                    <span>Netzanmeldung</span>
                    <span className="studio-service-price">{money(priceMap.NETZANMELDUNG?.priceNet || 0)}</span>
                  </button>
                  <button
                    className="studio-service-btn"
                    onClick={() => addService("LAGEPLAN")}
                    disabled={!catalog}
                  >
                    <span className="studio-service-icon">🗺️</span>
                    <span>Lageplan</span>
                    <span className="studio-service-price">{money(priceMap.LAGEPLAN?.priceNet || 0)}</span>
                  </button>
                  <button
                    className="studio-service-btn"
                    onClick={() => addService("SCHALTPLAN")}
                    disabled={!catalog}
                  >
                    <span className="studio-service-icon">⚡</span>
                    <span>Schaltplan</span>
                    <span className="studio-service-price">{money(priceMap.SCHALTPLAN?.priceNet || 0)}</span>
                  </button>
                </div>
              </section>
            )}

            {/* Positions */}
            <section className="studio-section">
              <h2 className="studio-section-title">
                <span>📦</span> Positionen
                <span className="studio-badge studio-badge--small">{items.length}</span>
              </h2>

              <div className="studio-positions">
                {items.length === 0 ? (
                  <div className="studio-positions-empty">
                    <span>📭</span>
                    <p>Noch keine Positionen hinzugefügt.</p>
                    <p className="studio-positions-empty-hint">
                      Wähle oben einen Kunden und füge Leistungen hinzu.
                    </p>
                  </div>
                ) : (
                  items.map((it, idx) => (
                    <div key={idx} className="studio-position-card">
                      <div className="studio-position-header">
                        <div className="studio-position-drag">
                          <button
                            className="studio-position-move"
                            onClick={() => moveItem(idx, -1)}
                            disabled={idx === 0}
                          >
                            ↑
                          </button>
                          <button
                            className="studio-position-move"
                            onClick={() => moveItem(idx, 1)}
                            disabled={idx === items.length - 1}
                          >
                            ↓
                          </button>
                        </div>
                        <span className="studio-position-number">#{idx + 1}</span>
                        <button className="studio-position-delete" onClick={() => removeItem(idx)}>
                          🗑️
                        </button>
                      </div>

                      <div className="studio-position-body">
                        <div className="studio-position-field studio-position-field--title">
                          <label>Bezeichnung</label>
                          <input
                            type="text"
                            value={it.title}
                            onChange={(e) => updateItem(idx, { title: e.target.value })}
                            placeholder="Leistungsbezeichnung..."
                          />
                        </div>

                        <div className="studio-position-row">
                          <div className="studio-position-field">
                            <label>Menge</label>
                            <input
                              type="number"
                              value={it.qty}
                              onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                              min="1"
                            />
                          </div>
                          <div className="studio-position-field">
                            <label>Einzelpreis (netto)</label>
                            <input
                              type="number"
                              value={it.unitNet}
                              onChange={(e) => updateItem(idx, { unitNet: Number(e.target.value) })}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="studio-position-field">
                            <label>MwSt</label>
                            <select
                              value={String(it.vatRate)}
                              onChange={(e) => updateItem(idx, { vatRate: Number(e.target.value) })}
                            >
                              <option value="19">19%</option>
                              <option value="7">7%</option>
                              <option value="0">0%</option>
                            </select>
                          </div>
                        </div>

                        <div className="studio-position-total">
                          <span>Gesamt:</span>
                          <span className="studio-position-total-value">
                            {money(it.qty * it.unitNet * (1 + it.vatRate / 100))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <button
                  className="studio-btn studio-btn--dashed"
                  onClick={() =>
                    setItems((p) => [...p, { title: "", qty: 1, unitNet: 0, vatRate: 19 }])
                  }
                >
                  ➕ Freie Position hinzufügen
                </button>
              </div>

              {/* Totals */}
              {items.length > 0 && (
                <div className="studio-totals">
                  <div className="studio-totals-row">
                    <span>Netto</span>
                    <span>{money(totals.net)}</span>
                  </div>
                  {totals.breakdown.map((b) => (
                    <div key={b.vatRate} className="studio-totals-row">
                      <span>MwSt {b.vatRate}%</span>
                      <span>{money(b.vat)}</span>
                    </div>
                  ))}
                  <div className="studio-totals-row studio-totals-row--total">
                    <span>Brutto</span>
                    <span>{money(totals.gross)}</span>
                  </div>
                </div>
              )}
            </section>

            {/* Dates */}
            <section className="studio-section">
              <h2 className="studio-section-title">
                <span>📅</span> Daten
              </h2>
              <div className="studio-dates">
                <div className="studio-date-field">
                  <label>Rechnungsdatum</label>
                  <input
                    type="date"
                    value={rechnungsDatum}
                    onChange={(e) => setRechnungsDatum(e.target.value)}
                  />
                </div>
                <div className="studio-date-field">
                  <label>Leistungsdatum</label>
                  <input
                    type="date"
                    value={leistungsDatum}
                    onChange={(e) => setLeistungsDatum(e.target.value)}
                  />
                </div>
                <div className="studio-date-field">
                  <label>Fällig am</label>
                  <input type="date" value={faelligAm} onChange={(e) => setFaelligAm(e.target.value)} />
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="studio-section">
              <h2 className="studio-section-title">
                <span>📝</span> Notizen
              </h2>
              <textarea
                className="studio-textarea"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="Optionale Beschreibung oder Anmerkungen..."
                rows={3}
              />

              {totals.allZeroVat && (
                <div className="studio-tax-notice">
                  <div className="studio-tax-notice-header">
                    <span>⚠️</span>
                    <span>Steuerhinweis erforderlich (0% MwSt)</span>
                  </div>
                  <textarea
                    className="studio-textarea"
                    value={steuerHinweis}
                    onChange={(e) => setSteuerHinweis(e.target.value)}
                    placeholder='z.B. "Umsatzsteuer 0% gem. §12 Abs. 3 UStG"'
                    rows={2}
                  />
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Preview */}
          <div className="studio-preview">
            <div className="studio-preview-tabs">
              <button
                className={`studio-preview-tab ${rightTab === "LAYOUT" ? "studio-preview-tab--active" : ""}`}
                onClick={() => setRightTab("LAYOUT")}
              >
                📄 Layout
              </button>
              <button
                className={`studio-preview-tab ${rightTab === "PDF" ? "studio-preview-tab--active" : ""}`}
                onClick={() => setRightTab("PDF")}
                disabled={!pdfPreviewUrl}
              >
                📑 PDF
              </button>
              <button
                className={`studio-preview-tab ${rightTab === "CHECKS" ? "studio-preview-tab--active" : ""}`}
                onClick={() => setRightTab("CHECKS")}
              >
                ✅ Checks
                {blockers.length > 0 && (
                  <span className="studio-badge studio-badge--danger">{blockers.length}</span>
                )}
              </button>
            </div>

            <div className="studio-preview-content">
              {rightTab === "LAYOUT" && (
                <div className="studio-preview-layout">
                  <InvoicePreview
                    company={company}
                    kunde={kunde}
                    referenz={referenzText}
                    items={items}
                    rechnungsDatum={rechnungsDatum}
                    leistungsDatum={leistungsDatum}
                    faelligAm={faelligAm}
                    beschreibung={beschreibung}
                    steuerHinweis={steuerHinweis}
                    companyMissing={companyMissing}
                  />
                </div>
              )}

              {rightTab === "PDF" && (
                <div className="studio-preview-pdf">
                  {pdfPreviewUrl ? (
                    <iframe title="PDF Preview" src={pdfPreviewUrl} />
                  ) : (
                    <div className="studio-preview-empty">
                      <span>📄</span>
                      <p>Noch keine PDF Vorschau</p>
                      <button className="studio-btn studio-btn--primary" onClick={previewPdf}>
                        PDF generieren
                      </button>
                    </div>
                  )}
                </div>
              )}

              {rightTab === "CHECKS" && (
                <div className="studio-preview-checks">
                  {previewError && (
                    <div className="studio-check-item studio-check-item--error">
                      <span>❌</span>
                      <span>{previewError}</span>
                    </div>
                  )}

                  {blockers.length === 0 ? (
                    <div className="studio-checks-success">
                      <span className="studio-checks-success-icon">✅</span>
                      <h3>Alles bereit!</h3>
                      <p>Die Rechnung kann erstellt werden.</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="studio-checks-title">
                        {blockers.length} {blockers.length === 1 ? "Problem" : "Probleme"} zu beheben
                      </h3>
                      <div className="studio-checks-list">
                        {blockers.map((b, i) => (
                          <div key={i} className="studio-check-item studio-check-item--warning">
                            <span>⚠️</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`studio-toast ${
            toast.type === "error"
              ? "studio-toast--error"
              : toast.type === "warn"
              ? "studio-toast--warn"
              : "studio-toast--ok"
          }`}
        >
          <span>{toast.type === "ok" ? "✅" : toast.type === "warn" ? "⚠️" : "❌"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const studioStyles = `
/* ═══════════════════ VARIABLES ═══════════════════ */
.studio-overlay {
  --studio-bg: rgba(10, 15, 25, 0.95);
  --studio-card: rgba(30, 41, 59, 0.6);
  --studio-border: rgba(71, 85, 105, 0.4);
  --studio-accent: #EAD068;
  --studio-accent-dim: rgba(139, 92, 246, 0.15);
  --studio-success: #10b981;
  --studio-warning: #f59e0b;
  --studio-danger: #ef4444;
  --studio-text: rgba(255, 255, 255, 0.95);
  --studio-text-dim: rgba(255, 255, 255, 0.6);
  --studio-radius: 16px;
  --studio-radius-sm: 10px;

  position: fixed;
  inset: 0;
  background: var(--studio-bg);
  backdrop-filter: blur(20px);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  color: var(--studio-text);
  animation: studioFadeIn 0.3s ease-out;
}

@keyframes studioFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.studio-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ═══════════════════ HEADER ═══════════════════ */
.studio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--studio-border);
  flex-shrink: 0;
}

.studio-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.studio-header-icon {
  font-size: 36px;
}

.studio-title {
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #fff, #f0d878);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.studio-subtitle {
  font-size: 13px;
  color: var(--studio-text-dim);
  margin: 2px 0 0;
}

.studio-header-actions {
  display: flex;
  gap: 10px;
}

/* ═══════════════════ BUTTONS ═══════════════════ */
.studio-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: var(--studio-radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.studio-btn--primary {
  background: linear-gradient(135deg, var(--studio-accent), #ec4899);
  color: white;
}

.studio-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.studio-btn--ghost {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--studio-border);
  color: var(--studio-text);
}

.studio-btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.studio-btn--close {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--studio-danger);
  font-size: 18px;
}

.studio-btn--close:hover {
  background: rgba(239, 68, 68, 0.2);
}

.studio-btn--small {
  padding: 6px 12px;
  font-size: 12px;
}

.studio-btn--dashed {
  background: transparent;
  border: 2px dashed var(--studio-border);
  color: var(--studio-text-dim);
  width: 100%;
  padding: 14px;
}

.studio-btn--dashed:hover {
  border-color: var(--studio-accent);
  color: var(--studio-accent);
  background: var(--studio-accent-dim);
}

.studio-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ═══════════════════ BADGES ═══════════════════ */
.studio-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: var(--studio-accent-dim);
  color: var(--studio-accent);
}

.studio-badge--small {
  padding: 2px 8px;
  font-size: 10px;
  margin-left: 8px;
}

.studio-badge--dim {
  background: rgba(255, 255, 255, 0.05);
  color: var(--studio-text-dim);
}

.studio-badge--purple {
  background: var(--studio-accent-dim);
  color: var(--studio-accent);
}

.studio-badge--danger {
  background: rgba(239, 68, 68, 0.15);
  color: var(--studio-danger);
}

/* ═══════════════════ MAIN ═══════════════════ */
.studio-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 1100px) {
  .studio-main {
    grid-template-columns: 1fr;
  }
}

/* ═══════════════════ EDITOR ═══════════════════ */
.studio-editor {
  padding: 24px;
  overflow-y: auto;
  border-right: 1px solid var(--studio-border);
}

.studio-section {
  margin-bottom: 28px;
}

.studio-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--studio-text-dim);
  margin: 0 0 14px;
}

.studio-section-title span:first-child {
  font-size: 18px;
}

/* ═══════════════════ CUSTOMER CARD ═══════════════════ */
.studio-customer-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--studio-accent-dim);
  border: 1px solid var(--studio-accent);
  border-radius: var(--studio-radius-sm);
}

.studio-customer-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.studio-customer-avatar {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--studio-accent);
  border-radius: 12px;
  font-size: 18px;
  font-weight: 800;
  color: white;
}

.studio-customer-name {
  font-size: 15px;
  font-weight: 700;
}

.studio-customer-meta {
  font-size: 12px;
  color: var(--studio-text-dim);
}

/* ═══════════════════ SEARCH ═══════════════════ */
.studio-search-wrap {
  position: relative;
}

.studio-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
}

.studio-search-input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  background: var(--studio-card);
  border: 1px solid var(--studio-border);
  border-radius: var(--studio-radius-sm);
  color: var(--studio-text);
  font-size: 14px;
  transition: all 0.2s;
}

.studio-search-input:focus {
  outline: none;
  border-color: var(--studio-accent);
  box-shadow: 0 0 0 3px var(--studio-accent-dim);
}

.studio-search-input::placeholder {
  color: var(--studio-text-dim);
}

.studio-search-spinner {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
}

.studio-search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: var(--studio-card);
  border: 1px solid var(--studio-border);
  border-radius: var(--studio-radius-sm);
  overflow: hidden;
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
}

.studio-search-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  color: var(--studio-text);
}

.studio-search-option:hover {
  background: var(--studio-accent-dim);
}

.studio-search-option-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}

.studio-search-option-info {
  display: flex;
  flex-direction: column;
}

.studio-search-option-name {
  font-size: 14px;
  font-weight: 600;
}

.studio-search-option-meta {
  font-size: 12px;
  color: var(--studio-text-dim);
}

/* ═══════════════════ LISTBOX ═══════════════════ */
.studio-listbox {
  position: relative;
}

.studio-listbox-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  background: var(--studio-card);
  border: 1px solid var(--studio-border);
  border-radius: var(--studio-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  color: var(--studio-text);
}

.studio-listbox-btn:hover {
  border-color: var(--studio-accent);
}

.studio-listbox-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.studio-listbox-icon {
  font-size: 20px;
}

.studio-listbox-text {
  display: flex;
  flex-direction: column;
}

.studio-listbox-label {
  font-size: 14px;
  font-weight: 600;
}

.studio-listbox-sub {
  font-size: 12px;
  color: var(--studio-text-dim);
}

.studio-listbox-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: var(--studio-card);
  border: 1px solid var(--studio-border);
  border-radius: var(--studio-radius-sm);
  overflow: hidden;
  z-index: 100;
  animation: studioSlideDown 0.2s ease-out;
}

@keyframes studioSlideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.studio-listbox-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--studio-border);
}

.studio-listbox-search input {
  flex: 1;
  background: none;
  border: none;
  color: var(--studio-text);
  font-size: 14px;
  outline: none;
}

.studio-listbox-search input::placeholder {
  color: var(--studio-text-dim);
}

.studio-listbox-options {
  max-height: 240px;
  overflow-y: auto;
}

.studio-listbox-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  color: var(--studio-text);
}

.studio-listbox-option:hover {
  background: rgba(255, 255, 255, 0.05);
}

.studio-listbox-option--active {
  background: var(--studio-accent-dim) !important;
  border-left: 3px solid var(--studio-accent);
}

.studio-listbox-option-icon {
  font-size: 16px;
}

.studio-listbox-option-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.studio-listbox-option-title {
  font-size: 13px;
  font-weight: 600;
}

.studio-listbox-option-sub {
  font-size: 11px;
  color: var(--studio-text-dim);
}

.studio-listbox-empty {
  padding: 20px;
  text-align: center;
  color: var(--studio-text-dim);
  font-size: 13px;
}

/* ═══════════════════ SERVICES ═══════════════════ */
.studio-services {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (max-width: 600px) {
  .studio-services {
    grid-template-columns: 1fr;
  }
}

.studio-service-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--studio-card);
  border: 1px solid var(--studio-border);
  border-radius: var(--studio-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--studio-text);
}

.studio-service-btn:hover:not(:disabled) {
  border-color: var(--studio-accent);
  background: var(--studio-accent-dim);
}

.studio-service-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.studio-service-icon {
  font-size: 24px;
}

.studio-service-price {
  font-size: 12px;
  font-weight: 700;
  color: var(--studio-accent);
}

/* ═══════════════════ POSITIONS ═══════════════════ */
.studio-positions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.studio-positions-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--studio-card);
  border: 2px dashed var(--studio-border);
  border-radius: var(--studio-radius-sm);
  text-align: center;
}

.studio-positions-empty span {
  font-size: 40px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.studio-positions-empty p {
  margin: 0;
  color: var(--studio-text-dim);
}

.studio-positions-empty-hint {
  font-size: 12px;
  margin-top: 8px !important;
}

.studio-position-card {
  background: var(--studio-card);
  border: 1px solid var(--studio-border);
  border-radius: var(--studio-radius-sm);
  overflow: hidden;
}

.studio-position-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--studio-border);
}

.studio-position-drag {
  display: flex;
  gap: 4px;
}

.studio-position-move {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 6px;
  color: var(--studio-text-dim);
  cursor: pointer;
  font-size: 12px;
}

.studio-position-move:hover:not(:disabled) {
  background: var(--studio-accent-dim);
  color: var(--studio-accent);
}

.studio-position-move:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.studio-position-number {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  color: var(--studio-accent);
}

.studio-position-delete {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.studio-position-delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.studio-position-body {
  padding: 14px;
}

.studio-position-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.studio-position-field label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--studio-text-dim);
}

.studio-position-field input,
.studio-position-field select {
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--studio-border);
  border-radius: 8px;
  color: var(--studio-text);
  font-size: 14px;
}

.studio-position-field input:focus,
.studio-position-field select:focus {
  outline: none;
  border-color: var(--studio-accent);
}

.studio-position-field--title {
  margin-bottom: 12px;
}

.studio-position-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 100px;
  gap: 10px;
}

.studio-position-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--studio-border);
  font-size: 13px;
  color: var(--studio-text-dim);
}

.studio-position-total-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--studio-text);
}

/* ═══════════════════ TOTALS ═══════════════════ */
.studio-totals {
  margin-top: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--studio-radius-sm);
}

.studio-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: var(--studio-text-dim);
}

.studio-totals-row--total {
  border-top: 1px solid var(--studio-border);
  margin-top: 8px;
  padding-top: 12px;
  font-size: 18px;
  font-weight: 800;
  color: var(--studio-text);
}

/* ═══════════════════ DATES ═══════════════════ */
.studio-dates {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .studio-dates {
    grid-template-columns: 1fr;
  }
}

.studio-date-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.studio-date-field label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--studio-text-dim);
}

.studio-date-field input {
  padding: 12px;
  background: var(--studio-card);
  border: 1px solid var(--studio-border);
  border-radius: 8px;
  color: var(--studio-text);
  font-size: 14px;
}

.studio-date-field input:focus {
  outline: none;
  border-color: var(--studio-accent);
}

/* ═══════════════════ TEXTAREA ═══════════════════ */
.studio-textarea {
  width: 100%;
  padding: 12px;
  background: var(--studio-card);
  border: 1px solid var(--studio-border);
  border-radius: 8px;
  color: var(--studio-text);
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.studio-textarea:focus {
  outline: none;
  border-color: var(--studio-accent);
}

.studio-textarea::placeholder {
  color: var(--studio-text-dim);
}

.studio-tax-notice {
  margin-top: 14px;
  padding: 14px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--studio-radius-sm);
}

.studio-tax-notice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--studio-warning);
}

/* ═══════════════════ PREVIEW ═══════════════════ */
.studio-preview {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.studio-preview-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--studio-border);
}

.studio-preview-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--studio-text-dim);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.studio-preview-tab:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}

.studio-preview-tab--active {
  background: var(--studio-accent-dim) !important;
  color: var(--studio-accent);
}

.studio-preview-tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.studio-preview-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.studio-preview-layout {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
}

.studio-preview-pdf {
  height: 100%;
}

.studio-preview-pdf iframe {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border: none;
  border-radius: 8px;
  background: white;
}

.studio-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  text-align: center;
}

.studio-preview-empty span {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.studio-preview-empty p {
  color: var(--studio-text-dim);
  margin: 0 0 16px;
}

/* ═══════════════════ CHECKS ═══════════════════ */
.studio-preview-checks {
  padding: 8px;
}

.studio-checks-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.studio-checks-success-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.studio-checks-success h3 {
  margin: 0 0 8px;
  font-size: 20px;
}

.studio-checks-success p {
  margin: 0;
  color: var(--studio-text-dim);
}

.studio-checks-title {
  font-size: 16px;
  margin: 0 0 16px;
}

.studio-checks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.studio-check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.studio-check-item--warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--studio-warning);
}

.studio-check-item--error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--studio-danger);
}

/* ═══════════════════ TOAST ═══════════════════ */
.studio-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid var(--studio-border);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  z-index: 100000;
  animation: studioToastIn 0.3s ease-out;
}

@keyframes studioToastIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.studio-toast--ok {
  border-color: var(--studio-success);
}

.studio-toast--warn {
  border-color: var(--studio-warning);
}

.studio-toast--error {
  border-color: var(--studio-danger);
}
`;
