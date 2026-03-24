// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - SETTINGS TAB
// Import/Export, Daten-Reset, Einstellungen
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef } from "react";
import { useAdminCenterStore, seedDefaultDocumentRequirements } from "../stores";

export function SettingsTab() {
  const store = useAdminCenterStore();
  const { exportData, importData, getStats } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  
  const stats = getStats();
  
  const handleExport = async () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const { downloadFile } = await import("@/utils/desktopDownload");
    await downloadFile({ filename: `admin-center-backup-${new Date().toISOString().split("T")[0]}.json`, blob, fileType: 'json' });
  };
  
  const handleImport = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const success = importData(text);
      setImportStatus(success ? "success" : "error");
      setTimeout(() => setImportStatus("idle"), 3000);
    } catch (err) {
      setImportStatus("error");
      setTimeout(() => setImportStatus("idle"), 3000);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleResetDefaults = () => {
    if (confirm("Standard-Dokumentanforderungen neu laden?\n\nExistierende Anforderungen bleiben erhalten.")) {
      seedDefaultDocumentRequirements(useAdminCenterStore);
      alert("Standard-Dokumentanforderungen wurden geladen.");
    }
  };
  
  const handleClearAll = () => {
    if (confirm("⚠️ ACHTUNG: Alle Daten löschen?\n\nDies löscht alle Netzbetreiber, PLZ-Zuordnungen, Dokument-Anforderungen, Felder, Regeln und Passwörter!\n\nDiese Aktion kann nicht rückgängig gemacht werden.")) {
      if (confirm("Wirklich ALLE Daten unwiderruflich löschen?")) {
        store.importData(JSON.stringify({
          gridOperators: [],
          plzMappings: [],
          documentRequirements: [],
          fieldRequirements: [],
          rules: [],
          passwords: [],
        }));
        alert("Alle Daten wurden gelöscht.");
      }
    }
  };
  
  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <h2 className="admin-tab__title">⚙️ Einstellungen</h2>
      </div>
      
      {/* Data Overview */}
      <div className="admin-settings__section">
        <h3>📊 Datenübersicht</h3>
        <div className="admin-settings__data-grid">
          <div className="admin-settings__data-item">
            <span className="admin-settings__data-label">Netzbetreiber</span>
            <span className="admin-settings__data-value">{stats.gridOperatorCount}</span>
          </div>
          <div className="admin-settings__data-item">
            <span className="admin-settings__data-label">PLZ-Zuordnungen</span>
            <span className="admin-settings__data-value">{stats.plzMappingCount}</span>
          </div>
          <div className="admin-settings__data-item">
            <span className="admin-settings__data-label">Davon gelernt</span>
            <span className="admin-settings__data-value">{stats.learnedMappingsCount}</span>
          </div>
          <div className="admin-settings__data-item">
            <span className="admin-settings__data-label">Dokument-Regeln</span>
            <span className="admin-settings__data-value">{stats.documentRequirementCount}</span>
          </div>
          <div className="admin-settings__data-item">
            <span className="admin-settings__data-label">Zusatzfelder</span>
            <span className="admin-settings__data-value">{stats.fieldRequirementCount}</span>
          </div>
          <div className="admin-settings__data-item">
            <span className="admin-settings__data-label">Regeln</span>
            <span className="admin-settings__data-value">{stats.ruleCount}</span>
          </div>
          <div className="admin-settings__data-item">
            <span className="admin-settings__data-label">Passwörter</span>
            <span className="admin-settings__data-value">{stats.passwordCount}</span>
          </div>
        </div>
      </div>
      
      {/* Import/Export */}
      <div className="admin-settings__section">
        <h3>💾 Backup & Wiederherstellung</h3>
        <p className="admin-settings__desc">
          Exportieren Sie alle Daten als JSON-Datei für Backups oder zum Übertragen auf andere Systeme.
        </p>
        <div className="admin-settings__actions">
          <button className="admin-settings__btn admin-settings__btn--primary" onClick={handleExport}>
            <span>📥</span> Daten exportieren
          </button>
          <button className="admin-settings__btn admin-settings__btn--secondary" onClick={handleImport}>
            <span>📤</span> Daten importieren
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
        {importStatus === "success" && (
          <div className="admin-settings__alert admin-settings__alert--success">
            ✅ Import erfolgreich!
          </div>
        )}
        {importStatus === "error" && (
          <div className="admin-settings__alert admin-settings__alert--error">
            ❌ Import fehlgeschlagen. Bitte prüfen Sie die Datei.
          </div>
        )}
      </div>
      
      {/* Default Data */}
      <div className="admin-settings__section">
        <h3>📋 Standard-Daten</h3>
        <p className="admin-settings__desc">
          Laden Sie die Standard-Dokumentanforderungen (Lageplan, Datenblätter, etc.), die für alle Netzbetreiber gelten.
        </p>
        <div className="admin-settings__actions">
          <button className="admin-settings__btn admin-settings__btn--secondary" onClick={handleResetDefaults}>
            <span>🔄</span> Standard-Dokumentanforderungen laden
          </button>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="admin-settings__section admin-settings__section--danger">
        <h3>⚠️ Gefahrenzone</h3>
        <p className="admin-settings__desc">
          Löscht alle gespeicherten Daten unwiderruflich. Erstellen Sie vorher ein Backup!
        </p>
        <div className="admin-settings__actions">
          <button className="admin-settings__btn admin-settings__btn--danger" onClick={handleClearAll}>
            <span>🗑️</span> Alle Daten löschen
          </button>
        </div>
      </div>
      
      {/* Info */}
      <div className="admin-settings__section">
        <h3>ℹ️ Über das Admin Center</h3>
        <div className="admin-settings__info">
          <p>
            Das Admin Center ist die zentrale Verwaltung für alle Netzanmeldungs-relevanten Daten.
          </p>
          <ul>
            <li><strong>Netzbetreiber:</strong> Verwalten Sie alle deutschen Netzbetreiber mit Kontaktdaten und Portal-URLs.</li>
            <li><strong>PLZ-Zuordnung:</strong> Das System lernt automatisch, welche PLZ zu welchem Netzbetreiber gehört.</li>
            <li><strong>Dokument-Anforderungen:</strong> Definieren Sie, welche Dokumente wann benötigt werden.</li>
            <li><strong>Zusatzfelder:</strong> NB-spezifische Felder wie Kundennummern oder Zählpunkte.</li>
            <li><strong>Regeln:</strong> Komplexe Logik für Sonderfälle (Warnungen, Weiterleitungen, etc.)</li>
            <li><strong>Passwörter:</strong> Zugangsdaten für NB-Portale, MaStR, ZEREZ.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
