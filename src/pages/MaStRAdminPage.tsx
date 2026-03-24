/**
 * MaStR Admin Page
 *
 * Eigenständige Admin-Seite für das Marktstammdatenregister:
 * - Kontingent-Anzeige + Verbindungsstatus
 * - MaStR-Nummer Suche
 * - Eigene Einheiten-Übersicht
 * - Sync-Steuerung + Historie
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiGet, apiPost } from "../api/client";
import "./mastr-admin.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncLog {
  id: number;
  startedAt: string;
  finishedAt?: string;
  status: string;
  trigger: string;
  einheitenTotal: number;
  matchedSolar: number;
  matchedSpeicher: number;
  newMatches: number;
  updatedMatches: number;
  unmatchedEinheiten: number;
  kontingentVorher?: number;
  kontingentNachher?: number;
  errorMessage?: string;
}

interface MaStrEinheit {
  EinheitMastrNummer?: string;
  Postleitzahl?: string;
  Ort?: string;
  Bruttoleistung?: string;
  Nettonennleistung?: string;
  EinheitBetriebsstatus?: string;
  Inbetriebnahmedatum?: string;
  DatumRegistrierung?: string;
  Energietraeger?: string;
  AnzahlModule?: string;
  Lage?: string;
  Hauptausrichtung?: string;
  NutzbareSpeicherkapazitaet?: string;
  Batterietechnologie?: string;
  [key: string]: unknown;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MaStRAdminPage() {
  // State
  const [kontingent, setKontingent] = useState<number | null>(null);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [einheiten, setEinheiten] = useState<MaStrEinheit[]>([]);
  const [einheitenLoading, setEinheitenLoading] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [searchNr, setSearchNr] = useState("");
  const [searchResult, setSearchResult] = useState<MaStrEinheit | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"einheiten" | "sync" | "suche">("einheiten");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = `t-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ─── Data Loading ─────────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    try {
      const status = await apiGet<any>("/api/mastr/status");
      setApiConfigured(status.apiKeyConfigured && status.marktakteurConfigured);
    } catch {
      setApiConfigured(false);
    }
  }, []);

  const loadKontingent = useCallback(async () => {
    try {
      const res = await apiGet<any>("/api/mastr/kontingent");
      setKontingent(res.kontingent);
    } catch {
      setKontingent(null);
    }
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const res = await apiGet<any>("/api/mastr/test");
      setConnectionOk(res.success);
    } catch {
      setConnectionOk(false);
    }
  }, []);

  const loadEinheiten = useCallback(async () => {
    setEinheitenLoading(true);
    try {
      const res = await apiGet<any>("/api/mastr/meine-einheiten");
      setEinheiten(res.einheiten || []);
    } catch (e: any) {
      addToast("error", "Einheiten konnten nicht geladen werden");
    } finally {
      setEinheitenLoading(false);
    }
  }, [addToast]);

  const loadSyncHistory = useCallback(async () => {
    try {
      const res = await apiGet<any>("/api/mastr/sync/history");
      setSyncHistory(res.history || []);
    } catch {
      // nicht kritisch
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadKontingent();
    testConnection();
    loadSyncHistory();
  }, [loadStatus, loadKontingent, testConnection, loadSyncHistory]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleLoadEinheiten = useCallback(async () => {
    await loadEinheiten();
  }, [loadEinheiten]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await apiPost<any>("/api/mastr/sync", {});
      if (res.status === "ok") {
        addToast("success", `Sync abgeschlossen: ${res.newMatches} neue Matches, ${res.updatedMatches} Updates`);
      } else if (res.status === "skipped") {
        addToast("info", `Sync übersprungen: ${res.errorMessage}`);
      } else {
        addToast("error", `Sync fehlgeschlagen: ${res.errorMessage}`);
      }
      await loadSyncHistory();
      await loadKontingent();
    } catch (e: any) {
      addToast("error", "Sync konnte nicht gestartet werden");
    } finally {
      setSyncing(false);
    }
  }, [addToast, loadSyncHistory, loadKontingent]);

  const handleSearch = useCallback(async () => {
    if (!searchNr.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    const nr = searchNr.trim().toUpperCase();
    try {
      if (nr.startsWith("SEE")) {
        const res = await apiGet<any>(`/api/mastr/einheit/solar/${nr}`);
        setSearchResult(res.einheit);
      } else if (nr.startsWith("SSE")) {
        const res = await apiGet<any>(`/api/mastr/einheit/speicher/${nr}`);
        setSearchResult(res.einheit);
      } else {
        setSearchError("MaStR-Nummer muss mit 'SEE' (Solar) oder 'SSE' (Speicher) beginnen");
      }
    } catch (e: any) {
      setSearchError(e.message || "Suche fehlgeschlagen");
    } finally {
      setSearchLoading(false);
    }
  }, [searchNr]);

  // ─── Einheiten splitten ───────────────────────────────────────────────────

  const { solarEinheiten, speicherEinheiten } = useMemo(() => {
    const solar: MaStrEinheit[] = [];
    const speicher: MaStrEinheit[] = [];
    for (const e of einheiten) {
      const nr = (e.EinheitMastrNummer || "") as string;
      if (nr.startsWith("SEE")) solar.push(e);
      else if (nr.startsWith("SSE")) speicher.push(e);
    }
    return { solarEinheiten: solar, speicherEinheiten: speicher };
  }, [einheiten]);

  // ─── Kontingent-Farbe ────────────────────────────────────────────────────

  const kontingentColor = useMemo(() => {
    if (kontingent === null || kontingent === -1) return "blue";
    if (kontingent > 50) return "green";
    if (kontingent > 10) return "yellow";
    return "red";
  }, [kontingent]);

  const kontingentLabel = useMemo(() => {
    if (kontingent === null) return "...";
    if (kontingent === -1) return "Unbegrenzt";
    return String(kontingent);
  }, [kontingent]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mastr-page">
      {/* Toast Container */}
      <div className="mastr-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`mastr-toast mastr-toast--${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="mastr-header">
        <div className="mastr-header__left">
          <h1 className="mastr-header__title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/>
              <line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/><line x1="2" y1="18" x2="22" y2="18"/>
            </svg>
            Marktstammdatenregister
          </h1>
          <p className="mastr-header__subtitle">
            MaStR-Einheiten verwalten, Projekte verknüpfen, Sync-Status überwachen
          </p>
        </div>
        <div className="mastr-header__right">
          <button
            className="mastr-btn mastr-btn--primary"
            onClick={handleSync}
            disabled={syncing || !apiConfigured}
          >
            {syncing ? (
              <>
                <span className="mastr-spinner" /> Sync läuft...
              </>
            ) : (
              "Sync starten"
            )}
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="mastr-stats">
        <div className={`mastr-stat mastr-stat--${kontingentColor}`}>
          <span className="mastr-stat__label">Tageskontingent</span>
          <span className="mastr-stat__value">{kontingentLabel}</span>
        </div>
        <div className={`mastr-stat mastr-stat--${connectionOk === true ? "green" : connectionOk === false ? "red" : "blue"}`}>
          <span className="mastr-stat__label">Verbindung</span>
          <span className="mastr-stat__value">
            {connectionOk === null ? "..." : connectionOk ? "OK" : "Fehler"}
          </span>
        </div>
        <div className={`mastr-stat mastr-stat--${apiConfigured ? "green" : "red"}`}>
          <span className="mastr-stat__label">API-Config</span>
          <span className="mastr-stat__value">{apiConfigured ? "Aktiv" : "Fehlt"}</span>
        </div>
        <div className="mastr-stat mastr-stat--blue">
          <span className="mastr-stat__label">Einheiten</span>
          <span className="mastr-stat__value">{einheiten.length || "—"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mastr-tabs">
        <button
          className={`mastr-tab ${activeTab === "einheiten" ? "mastr-tab--active" : ""}`}
          onClick={() => { setActiveTab("einheiten"); if (einheiten.length === 0) handleLoadEinheiten(); }}
        >
          Eigene Einheiten
        </button>
        <button
          className={`mastr-tab ${activeTab === "suche" ? "mastr-tab--active" : ""}`}
          onClick={() => setActiveTab("suche")}
        >
          MaStR Suche
        </button>
        <button
          className={`mastr-tab ${activeTab === "sync" ? "mastr-tab--active" : ""}`}
          onClick={() => setActiveTab("sync")}
        >
          Sync-Historie
        </button>
      </div>

      {/* Tab Content */}
      <div className="mastr-content">
        {activeTab === "einheiten" && (
          <EinheitenTab
            solar={solarEinheiten}
            speicher={speicherEinheiten}
            loading={einheitenLoading}
            onLoad={handleLoadEinheiten}
          />
        )}
        {activeTab === "suche" && (
          <SucheTab
            searchNr={searchNr}
            onSearchNrChange={setSearchNr}
            onSearch={handleSearch}
            result={searchResult}
            loading={searchLoading}
            error={searchError}
          />
        )}
        {activeTab === "sync" && (
          <SyncHistoryTab history={syncHistory} />
        )}
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function EinheitenTab({
  solar,
  speicher,
  loading,
  onLoad,
}: {
  solar: MaStrEinheit[];
  speicher: MaStrEinheit[];
  loading: boolean;
  onLoad: () => void;
}) {
  if (loading) {
    return (
      <div className="mastr-loading">
        <span className="mastr-spinner" /> Lade Einheiten aus MaStR...
      </div>
    );
  }

  if (solar.length === 0 && speicher.length === 0) {
    return (
      <div className="mastr-empty">
        <p>Noch keine Einheiten geladen.</p>
        <button className="mastr-btn mastr-btn--secondary" onClick={onLoad}>
          Einheiten laden
        </button>
      </div>
    );
  }

  return (
    <div className="mastr-einheiten">
      {solar.length > 0 && (
        <div className="mastr-section">
          <h3 className="mastr-section__title">
            Solar-Einheiten ({solar.length})
          </h3>
          <div className="mastr-table-wrap">
            <table className="mastr-table">
              <thead>
                <tr>
                  <th>MaStR-Nr.</th>
                  <th>PLZ / Ort</th>
                  <th>Leistung (kW)</th>
                  <th>Module</th>
                  <th>Status</th>
                  <th>IBN-Datum</th>
                </tr>
              </thead>
              <tbody>
                {solar.map((e) => (
                  <tr key={e.EinheitMastrNummer}>
                    <td className="mastr-mono">{e.EinheitMastrNummer}</td>
                    <td>{e.Postleitzahl} {e.Ort}</td>
                    <td>{formatLeistung(e.Bruttoleistung)}</td>
                    <td>{e.AnzahlModule || "—"}</td>
                    <td>
                      <StatusBadge status={e.EinheitBetriebsstatus} />
                    </td>
                    <td>{formatDate(e.Inbetriebnahmedatum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {speicher.length > 0 && (
        <div className="mastr-section">
          <h3 className="mastr-section__title">
            Speicher-Einheiten ({speicher.length})
          </h3>
          <div className="mastr-table-wrap">
            <table className="mastr-table">
              <thead>
                <tr>
                  <th>MaStR-Nr.</th>
                  <th>PLZ / Ort</th>
                  <th>Leistung (kW)</th>
                  <th>Kapazität</th>
                  <th>Technologie</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {speicher.map((e) => (
                  <tr key={e.EinheitMastrNummer}>
                    <td className="mastr-mono">{e.EinheitMastrNummer}</td>
                    <td>{e.Postleitzahl} {e.Ort}</td>
                    <td>{formatLeistung(e.Bruttoleistung)}</td>
                    <td>{e.NutzbareSpeicherkapazitaet ? `${e.NutzbareSpeicherkapazitaet} kWh` : "—"}</td>
                    <td>{e.Batterietechnologie || "—"}</td>
                    <td>
                      <StatusBadge status={e.EinheitBetriebsstatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SucheTab({
  searchNr,
  onSearchNrChange,
  onSearch,
  result,
  loading,
  error,
}: {
  searchNr: string;
  onSearchNrChange: (v: string) => void;
  onSearch: () => void;
  result: MaStrEinheit | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="mastr-suche">
      <div className="mastr-suche__form">
        <input
          type="text"
          className="mastr-input"
          placeholder="SEE123456789 oder SSE123456789"
          value={searchNr}
          onChange={(e) => onSearchNrChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        <button
          className="mastr-btn mastr-btn--primary"
          onClick={onSearch}
          disabled={loading || !searchNr.trim()}
        >
          {loading ? <span className="mastr-spinner" /> : "Suchen"}
        </button>
      </div>

      {error && (
        <div className="mastr-suche__error">{error}</div>
      )}

      {result && (
        <div className="mastr-suche__result">
          <h3 className="mastr-section__title">Ergebnis</h3>
          <div className="mastr-detail-grid">
            <DetailRow label="MaStR-Nr." value={result.EinheitMastrNummer} mono />
            <DetailRow label="Status" value={result.EinheitBetriebsstatus} badge />
            <DetailRow label="PLZ / Ort" value={`${result.Postleitzahl || ""} ${result.Ort || ""}`} />
            <DetailRow label="Bruttoleistung" value={result.Bruttoleistung ? `${formatLeistung(String(result.Bruttoleistung))} kW` : undefined} />
            <DetailRow label="Nettonennleistung" value={result.Nettonennleistung ? `${formatLeistung(String(result.Nettonennleistung))} kW` : undefined} />
            <DetailRow label="Module" value={result.AnzahlModule ? String(result.AnzahlModule) : undefined} />
            <DetailRow label="Lage" value={result.Lage ? String(result.Lage) : undefined} />
            <DetailRow label="Ausrichtung" value={result.Hauptausrichtung ? String(result.Hauptausrichtung) : undefined} />
            <DetailRow label="Batterietechnologie" value={result.Batterietechnologie ? String(result.Batterietechnologie) : undefined} />
            <DetailRow label="Speicherkapazität" value={result.NutzbareSpeicherkapazitaet ? `${result.NutzbareSpeicherkapazitaet} kWh` : undefined} />
            <DetailRow label="Inbetriebnahme" value={formatDate(result.Inbetriebnahmedatum ? String(result.Inbetriebnahmedatum) : undefined)} />
            <DetailRow label="Registrierung" value={formatDate(result.DatumRegistrierung ? String(result.DatumRegistrierung) : undefined)} />
          </div>
        </div>
      )}
    </div>
  );
}

function SyncHistoryTab({ history }: { history: SyncLog[] }) {
  if (history.length === 0) {
    return (
      <div className="mastr-empty">
        <p>Noch keine Syncs durchgeführt.</p>
      </div>
    );
  }

  return (
    <div className="mastr-sync-history">
      <div className="mastr-table-wrap">
        <table className="mastr-table">
          <thead>
            <tr>
              <th>Zeitpunkt</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Einheiten</th>
              <th>Neue Matches</th>
              <th>Updates</th>
              <th>Unmatched</th>
              <th>Kontingent</th>
              <th>Fehler</th>
            </tr>
          </thead>
          <tbody>
            {history.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.startedAt)}</td>
                <td>
                  <span className={`mastr-badge mastr-badge--${s.trigger === "manual" ? "blue" : "gray"}`}>
                    {s.trigger === "manual" ? "Manuell" : "Cron"}
                  </span>
                </td>
                <td>
                  <span className={`mastr-badge mastr-badge--${s.status === "ok" ? "green" : s.status === "skipped" ? "yellow" : s.status === "running" ? "blue" : "red"}`}>
                    {s.status}
                  </span>
                </td>
                <td>{s.einheitenTotal}</td>
                <td className={s.newMatches > 0 ? "mastr-highlight" : ""}>{s.newMatches}</td>
                <td>{s.updatedMatches}</td>
                <td>{s.unmatchedEinheiten}</td>
                <td>
                  {s.kontingentVorher != null && s.kontingentNachher != null
                    ? `${s.kontingentVorher} → ${s.kontingentNachher}`
                    : "—"}
                </td>
                <td className="mastr-error-cell" title={s.errorMessage || ""}>
                  {s.errorMessage ? s.errorMessage.substring(0, 50) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const color = status === "InBetrieb" || status === "35" ? "green"
    : status === "InPlanung" || status === "31" ? "blue"
    : status === "Stillgelegt" || status === "37" ? "red"
    : "gray";
  return <span className={`mastr-badge mastr-badge--${color}`}>{status || "—"}</span>;
}

function DetailRow({ label, value, mono, badge }: { label: string; value?: string; mono?: boolean; badge?: boolean }) {
  if (!value || value.trim() === "") return null;
  return (
    <div className="mastr-detail-row">
      <span className="mastr-detail-row__label">{label}</span>
      {badge ? (
        <StatusBadge status={value} />
      ) : (
        <span className={`mastr-detail-row__value ${mono ? "mastr-mono" : ""}`}>{value}</span>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLeistung(val?: string): string {
  if (!val) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return (n / 1000).toFixed(2);
}

function formatDate(val?: string): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("de-DE");
  } catch {
    return val;
  }
}

function formatDateTime(val?: string): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return val;
  }
}
