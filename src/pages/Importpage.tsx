// src/pages/ImportPage.tsx
// ENDLEVEL CSV/Excel Import Center
import { useState, useRef, useMemo } from "react";
import { api } from "../modules/api/client";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

type ColumnMapping = {
  original: string;
  mapped: string | null;
  recognized: boolean;
};

type PreviewRow = {
  rowNumber: number;
  original: Record<string, any>;
  mapped: Record<string, any>;
  errors: string[];
  valid: boolean;
};

type ImportResult = {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; error: string }[];
  installations: { id: number; publicId: string; customerName: string }[];
};

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preview Data
  const [filename, setFilename] = useState("");
  const [columns, setColumns] = useState<ColumnMapping[]>([]);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  
  // Import Options
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  
  // Import Result
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const stats = useMemo(() => ({
    valid: rows.filter(r => r.valid).length,
    invalid: rows.filter(r => !r.valid).length,
    total: rows.length,
  }), [rows]);

  /* ═══════════════════ UPLOAD & PREVIEW ═══════════════════ */

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/import/preview", formData);
      const data = res.data;

      setFilename(data.filename);
      setColumns(data.columns);
      setRows(data.allRows);
      setStep("preview");
    } catch (e: any) {
      setError(e.response?.data?.error || "Fehler beim Verarbeiten der Datei");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  /* ═══════════════════ IMPORT ═══════════════════ */

  async function executeImport() {
    setStep("importing");
    setProgress(0);
    setError(null);

    const rowsToImport = skipInvalid ? rows.filter(r => r.valid) : rows;

    try {
      // Simuliere Progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 5, 90));
      }, 200);

      const res = await api.post("/import/execute", {
        rows: rowsToImport,
        options: { skipInvalid, skipDuplicates },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setResult(res.data);
      setStep("complete");
    } catch (e: any) {
      setError(e.response?.data?.error || "Import fehlgeschlagen");
      setStep("preview");
    }
  }

  /* ═══════════════════ TEMPLATE DOWNLOAD ═══════════════════ */

  async function downloadTemplate() {
    try {
      const res = await api.get("/import/template", { responseType: "blob" });
      const blob = new Blob([res.data]);
      const { downloadFile } = await import("@/utils/desktopDownload");
      await downloadFile({ filename: "Baunity-Import-Vorlage.xlsx", blob, fileType: 'xlsx' });
    } catch (e) {
      alert("Download fehlgeschlagen");
    }
  }

  /* ═══════════════════ RESET ═══════════════════ */

  function reset() {
    setStep("upload");
    setFilename("");
    setColumns([]);
    setRows([]);
    setResult(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className="import-page">
      <style>{styles}</style>

      {/* Header */}
      <div className="import-header">
        <div className="import-header-content">
          <div className="import-header-icon">📥</div>
          <div>
            <h1 className="import-title">Import Center</h1>
            <p className="import-subtitle">
              CSV oder Excel-Dateien importieren und Installationen anlegen
            </p>
          </div>
        </div>
        <div className="import-header-actions">
          <button className="import-btn import-btn--ghost" onClick={downloadTemplate}>
            📄 Vorlage herunterladen
          </button>
          {step !== "upload" && (
            <button className="import-btn import-btn--ghost" onClick={reset}>
              ↩ Zurück
            </button>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="import-steps">
        {["upload", "preview", "importing", "complete"].map((s, i) => (
          <div 
            key={s} 
            className={`import-step ${step === s ? "import-step--active" : ""} ${
              ["upload", "preview", "importing", "complete"].indexOf(step) > i ? "import-step--done" : ""
            }`}
          >
            <div className="import-step-number">{i + 1}</div>
            <div className="import-step-label">
              {s === "upload" && "Datei hochladen"}
              {s === "preview" && "Vorschau & Prüfung"}
              {s === "importing" && "Importieren"}
              {s === "complete" && "Fertig"}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="import-error">
          <span>⚠️</span> {safeString(error)}
        </div>
      )}

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="import-upload">
          <div
            className={`import-dropzone ${dragOver ? "import-dropzone--active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {loading ? (
              <>
                <div className="import-spinner" />
                <p>Datei wird verarbeitet...</p>
              </>
            ) : (
              <>
                <div className="import-dropzone-icon">📁</div>
                <p className="import-dropzone-title">
                  Datei hierher ziehen oder klicken
                </p>
                <p className="import-dropzone-hint">
                  CSV, XLS, XLSX • Max. 10 MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          {/* Info Cards */}
          <div className="import-info-grid">
            <div className="import-info-card">
              <div className="import-info-icon">✅</div>
              <h3>Unterstützte Formate</h3>
              <p>CSV, XLS, XLSX mit Spaltenüberschriften in der ersten Zeile</p>
            </div>
            <div className="import-info-card">
              <div className="import-info-icon">🔍</div>
              <h3>Automatische Erkennung</h3>
              <p>Spalten werden automatisch erkannt und gemappt</p>
            </div>
            <div className="import-info-card">
              <div className="import-info-icon">🛡️</div>
              <h3>Duplikat-Check</h3>
              <p>Bestehende E-Mail-Adressen werden erkannt</p>
            </div>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <div className="import-preview">
          {/* Stats */}
          <div className="import-stats">
            <div className="import-stat">
              <div className="import-stat-value">{filename}</div>
              <div className="import-stat-label">Datei</div>
            </div>
            <div className="import-stat">
              <div className="import-stat-value">{stats.total}</div>
              <div className="import-stat-label">Zeilen gesamt</div>
            </div>
            <div className="import-stat import-stat--success">
              <div className="import-stat-value">{stats.valid}</div>
              <div className="import-stat-label">Gültig</div>
            </div>
            <div className="import-stat import-stat--error">
              <div className="import-stat-value">{stats.invalid}</div>
              <div className="import-stat-label">Fehlerhaft</div>
            </div>
          </div>

          {/* Column Mapping */}
          <div className="import-section">
            <h3 className="import-section-title">📊 Spalten-Mapping</h3>
            <div className="import-columns">
              {columns.map((col, i) => (
                <div key={i} className={`import-column ${col.recognized ? "import-column--mapped" : ""}`}>
                  <span className="import-column-original">{col.original}</span>
                  <span className="import-column-arrow">→</span>
                  <span className="import-column-mapped">
                    {col.mapped || <em>nicht erkannt</em>}
                  </span>
                  {col.recognized && <span className="import-column-check">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview */}
          <div className="import-section">
            <h3 className="import-section-title">👀 Daten-Vorschau</h3>
            <div className="import-table-wrapper">
              <table className="import-table">
                <thead>
                  <tr>
                    <th>Zeile</th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Adresse</th>
                    <th>System</th>
                    <th>Fehler</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((row) => (
                    <tr key={row.rowNumber} className={row.valid ? "" : "import-row--invalid"}>
                      <td>{row.rowNumber}</td>
                      <td>
                        {row.valid ? (
                          <span className="import-badge import-badge--success">✓</span>
                        ) : (
                          <span className="import-badge import-badge--error">✗</span>
                        )}
                      </td>
                      <td>{row.mapped.firstName} {row.mapped.lastName}</td>
                      <td>{row.mapped.email}</td>
                      <td>{row.mapped.street}, {row.mapped.zip} {row.mapped.city}</td>
                      <td>{row.mapped.targetSystem || row.mapped.currentSystem || "—"}</td>
                      <td className="import-errors">
                        {row.errors.length > 0 ? row.errors.join(", ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <p className="import-table-hint">Zeigt 100 von {rows.length} Zeilen</p>
            )}
          </div>

          {/* Options */}
          <div className="import-section">
            <h3 className="import-section-title">⚙️ Import-Optionen</h3>
            <div className="import-options">
              <label className="import-option">
                <input
                  type="checkbox"
                  checked={skipInvalid}
                  onChange={(e) => setSkipInvalid(e.target.checked)}
                />
                <span>Fehlerhafte Zeilen überspringen</span>
              </label>
              <label className="import-option">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                />
                <span>Duplikate überspringen</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="import-actions">
            <button className="import-btn import-btn--ghost" onClick={reset}>
              Abbrechen
            </button>
            <button
              className="import-btn import-btn--primary"
              onClick={executeImport}
              disabled={stats.valid === 0}
            >
              🚀 {stats.valid} Installationen importieren
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <div className="import-progress">
          <div className="import-progress-icon">⏳</div>
          <h2>Import läuft...</h2>
          <div className="import-progress-bar">
            <div 
              className="import-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>{progress}% abgeschlossen</p>
        </div>
      )}

      {/* Step: Complete */}
      {step === "complete" && result && (
        <div className="import-complete">
          <div className="import-complete-icon">🎉</div>
          <h2>Import abgeschlossen!</h2>
          
          <div className="import-result-stats">
            <div className="import-result-stat import-result-stat--success">
              <div className="import-result-value">{result.created}</div>
              <div className="import-result-label">Erstellt</div>
            </div>
            <div className="import-result-stat">
              <div className="import-result-value">{result.skipped}</div>
              <div className="import-result-label">Übersprungen</div>
            </div>
            <div className="import-result-stat import-result-stat--error">
              <div className="import-result-value">{result.errors.length}</div>
              <div className="import-result-label">Fehler</div>
            </div>
          </div>

          {/* Created Installations */}
          {result.installations.length > 0 && (
            <div className="import-section">
              <h3 className="import-section-title">✅ Erstellte Installationen</h3>
              <div className="import-created-list">
                {result.installations.slice(0, 20).map((inst) => (
                  <a
                    key={inst.id}
                    href={`/admin/installations/${inst.id}`}
                    className="import-created-item"
                  >
                    <span className="import-created-id">{inst.publicId}</span>
                    <span className="import-created-name">{inst.customerName}</span>
                  </a>
                ))}
                {result.installations.length > 20 && (
                  <p className="import-table-hint">
                    ...und {result.installations.length - 20} weitere
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="import-section">
              <h3 className="import-section-title">⚠️ Fehler</h3>
              <div className="import-error-list">
                {result.errors.slice(0, 10).map((err, i) => (
                  <div key={i} className="import-error-item">
                    <span>Zeile {err.row}:</span> {safeString(err.error)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="import-actions">
            <button className="import-btn import-btn--ghost" onClick={reset}>
              Neuen Import starten
            </button>
            <a href="/admin/dashboard" className="import-btn import-btn--primary">
              Zum Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const styles = `
.import-page {
  --import-bg: rgba(30, 41, 59, 0.5);
  --import-border: rgba(71, 85, 105, 0.3);
  --import-accent: #EAD068;
  --import-success: #10b981;
  --import-error: #ef4444;
  --import-text: rgba(255, 255, 255, 0.92);
  --import-muted: rgba(255, 255, 255, 0.6);
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.import-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: var(--import-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--import-border);
  border-radius: 16px;
  margin-bottom: 24px;
}

.import-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.import-header-icon {
  font-size: 40px;
}

.import-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--import-text);
  margin: 0;
}

.import-subtitle {
  font-size: 14px;
  color: var(--import-muted);
  margin: 4px 0 0;
}

.import-header-actions {
  display: flex;
  gap: 12px;
}

/* Steps */
.import-steps {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.import-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--import-border);
  border-radius: 12px;
  opacity: 0.5;
  transition: all 0.3s;
}

.import-step--active {
  opacity: 1;
  background: rgba(139, 92, 246, 0.1);
  border-color: var(--import-accent);
}

.import-step--done {
  opacity: 0.8;
}

.import-step--done .import-step-number {
  background: var(--import-success);
}

.import-step-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--import-border);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.import-step--active .import-step-number {
  background: var(--import-accent);
}

.import-step-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--import-text);
}

/* Buttons */
.import-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.import-btn--primary {
  background: linear-gradient(135deg, var(--import-accent), #ec4899);
  color: white;
}

.import-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.import-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.import-btn--ghost {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--import-border);
  color: var(--import-text);
}

.import-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Error */
.import-error {
  padding: 16px 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: var(--import-error);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Upload */
.import-upload {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.import-dropzone {
  padding: 80px 40px;
  border: 2px dashed var(--import-border);
  border-radius: 16px;
  background: var(--import-bg);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.import-dropzone:hover {
  border-color: var(--import-accent);
  background: rgba(139, 92, 246, 0.05);
}

.import-dropzone--active {
  border-color: var(--import-accent);
  background: rgba(139, 92, 246, 0.1);
  transform: scale(1.02);
}

.import-dropzone-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.import-dropzone-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--import-text);
  margin: 0 0 8px;
}

.import-dropzone-hint {
  font-size: 14px;
  color: var(--import-muted);
  margin: 0;
}

.import-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--import-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.import-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.import-info-card {
  padding: 20px;
  background: var(--import-bg);
  border: 1px solid var(--import-border);
  border-radius: 12px;
  text-align: center;
}

.import-info-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.import-info-card h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--import-text);
  margin: 0 0 8px;
}

.import-info-card p {
  font-size: 12px;
  color: var(--import-muted);
  margin: 0;
}

/* Preview */
.import-preview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.import-stats {
  display: flex;
  gap: 16px;
}

.import-stat {
  flex: 1;
  padding: 20px;
  background: var(--import-bg);
  border: 1px solid var(--import-border);
  border-radius: 12px;
  text-align: center;
}

.import-stat--success {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.05);
}

.import-stat--error {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.import-stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--import-text);
  word-break: break-all;
}

.import-stat--success .import-stat-value {
  color: var(--import-success);
}

.import-stat--error .import-stat-value {
  color: var(--import-error);
}

.import-stat-label {
  font-size: 12px;
  color: var(--import-muted);
  margin-top: 4px;
}

.import-section {
  padding: 20px;
  background: var(--import-bg);
  border: 1px solid var(--import-border);
  border-radius: 12px;
}

.import-section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--import-text);
  margin: 0 0 16px;
}

/* Columns */
.import-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.import-column {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
}

.import-column--mapped {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.05);
}

.import-column-original {
  color: var(--import-muted);
}

.import-column-arrow {
  color: var(--import-muted);
}

.import-column-mapped {
  color: var(--import-text);
  font-weight: 600;
}

.import-column-mapped em {
  color: var(--import-muted);
  font-weight: 400;
}

.import-column-check {
  color: var(--import-success);
}

/* Table */
.import-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.import-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.import-table th,
.import-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.import-table th {
  background: rgba(0, 0, 0, 0.2);
  font-weight: 600;
  color: var(--import-muted);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.import-table td {
  color: var(--import-text);
}

.import-row--invalid {
  background: rgba(239, 68, 68, 0.05);
}

.import-row--invalid td {
  color: var(--import-muted);
}

.import-errors {
  color: var(--import-error) !important;
  font-size: 11px;
}

.import-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.import-badge--success {
  background: rgba(16, 185, 129, 0.2);
  color: var(--import-success);
}

.import-badge--error {
  background: rgba(239, 68, 68, 0.2);
  color: var(--import-error);
}

.import-table-hint {
  font-size: 12px;
  color: var(--import-muted);
  text-align: center;
  margin: 12px 0 0;
}

/* Options */
.import-options {
  display: flex;
  gap: 24px;
}

.import-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--import-text);
}

.import-option input {
  width: 18px;
  height: 18px;
  accent-color: var(--import-accent);
}

/* Actions */
.import-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--import-border);
}

/* Progress */
.import-progress {
  text-align: center;
  padding: 80px 40px;
  background: var(--import-bg);
  border: 1px solid var(--import-border);
  border-radius: 16px;
}

.import-progress-icon {
  font-size: 64px;
  margin-bottom: 24px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.import-progress h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--import-text);
  margin: 0 0 24px;
}

.import-progress-bar {
  width: 100%;
  max-width: 400px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin: 0 auto 16px;
  overflow: hidden;
}

.import-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--import-accent), #ec4899);
  border-radius: 4px;
  transition: width 0.3s;
}

.import-progress p {
  font-size: 14px;
  color: var(--import-muted);
  margin: 0;
}

/* Complete */
.import-complete {
  text-align: center;
  padding: 40px;
  background: var(--import-bg);
  border: 1px solid var(--import-border);
  border-radius: 16px;
}

.import-complete-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.import-complete h2 {
  font-size: 28px;
  font-weight: 800;
  color: var(--import-text);
  margin: 0 0 32px;
}

.import-result-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.import-result-stat {
  text-align: center;
}

.import-result-value {
  font-size: 48px;
  font-weight: 800;
  color: var(--import-text);
}

.import-result-stat--success .import-result-value {
  color: var(--import-success);
}

.import-result-stat--error .import-result-value {
  color: var(--import-error);
}

.import-result-label {
  font-size: 14px;
  color: var(--import-muted);
  margin-top: 4px;
}

.import-complete .import-section {
  text-align: left;
  margin-bottom: 24px;
}

.import-created-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.import-created-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
}

.import-created-item:hover {
  background: rgba(16, 185, 129, 0.2);
  transform: translateY(-2px);
}

.import-created-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--import-accent);
  font-weight: 700;
}

.import-created-name {
  font-size: 13px;
  color: var(--import-text);
}

.import-error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.import-error-item {
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: var(--import-error);
}

.import-error-item span {
  font-weight: 600;
  margin-right: 8px;
}

.import-complete .import-actions {
  justify-content: center;
  border-top: none;
  padding-top: 0;
}

@media (max-width: 768px) {
  .import-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .import-info-grid {
    grid-template-columns: 1fr;
  }
  
  .import-stats {
    flex-direction: column;
  }
  
  .import-steps {
    flex-wrap: wrap;
  }
}
`;
