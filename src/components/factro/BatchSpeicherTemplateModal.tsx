/**
 * BatchSpeicherTemplateModal – Speicher-Templates auf alle Projekte anwenden
 *
 * 3 Phasen: Preview laden → Bestätigen → Ergebnis
 */

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "../../modules/api/client";
import {
  X, Loader2, CheckCircle2, AlertTriangle,
  Database, Zap, Package, Play,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PreviewProject {
  id: number;
  title: string;
  hasInstallation: boolean;
  hasTechnicalData: boolean;
  installationId: number | null;
  status: "needs_installation" | "needs_template" | "complete";
}

interface PreviewConfig {
  configId: number;
  configName: string;
  templateTyp: string;
  projects: PreviewProject[];
}

interface PreviewResult {
  configs: PreviewConfig[];
  summary: {
    totalProjects: number;
    needsInstallation: number;
    needsTemplate: number;
    complete: number;
  };
}

interface ApplyResultItem {
  projectId: number;
  title: string;
  templateTyp: string;
  action: "created" | "updated" | "skipped";
  installationId?: number;
  error?: string;
}

interface ApplyResult {
  success: boolean;
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  results: ApplyResultItem[];
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onComplete?: () => void;
}

type Phase = "loading" | "preview" | "applying" | "result";

export default function BatchSpeicherTemplateModal({ onClose, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [expandedConfig, setExpandedConfig] = useState<number | null>(null);

  const loadPreview = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const data = await apiGet("/factro/batch-template/preview") as PreviewResult;
      setPreview(data);
      setPhase("preview");
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Vorschau");
      setPhase("preview");
    }
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleApply = async () => {
    setPhase("applying");
    setError(null);
    try {
      const data = await apiPost("/factro/batch-template/apply", { overwrite }) as ApplyResult;
      setResult(data);
      setPhase("result");
      onComplete?.();
    } catch (err: any) {
      setError(err.message || "Fehler beim Anwenden");
      setPhase("result");
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "needs_installation": return <AlertTriangle size={14} className="text-amber-400" />;
      case "needs_template": return <Database size={14} className="text-blue-400" />;
      case "complete": return <CheckCircle2 size={14} className="text-emerald-400" />;
      default: return null;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "needs_installation": return "Keine Installation";
      case "needs_template": return "Braucht Template";
      case "complete": return "Vollständig";
      default: return status;
    }
  };

  const actionIcon = (action: string) => {
    switch (action) {
      case "created": return <CheckCircle2 size={14} className="text-emerald-400" />;
      case "updated": return <Database size={14} className="text-blue-400" />;
      case "skipped": return <AlertTriangle size={14} className="text-zinc-500" />;
      default: return null;
    }
  };

  const actionLabel = (action: string, error?: string) => {
    if (error) return `Übersprungen: ${error}`;
    switch (action) {
      case "created": return "Installation + Template erstellt";
      case "updated": return "Template eingefügt";
      case "skipped": return "Übersprungen (bereits vorhanden)";
      default: return action;
    }
  };

  const todoCount = preview
    ? preview.summary.needsInstallation + preview.summary.needsTemplate
    : 0;

  return (
    <div className="factro-batch-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="factro-batch-modal"
        style={{ maxWidth: 680 }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={18} className="text-purple-400" />
            <h3 style={{ margin: 0, fontSize: 16, color: "#e2e8f0" }}>Speicher-Templates anwenden</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", overflowY: "auto", maxHeight: "calc(85vh - 70px)" }}>
          {/* Loading */}
          {phase === "loading" && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Loader2 size={32} className="spin text-purple-400" />
              <p style={{ marginTop: 12, color: "#94a3b8" }}>Lade Projektübersicht...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,.1)",
              border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Preview Phase */}
          {phase === "preview" && preview && (
            <>
              {/* Summary Cards */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 20,
              }}>
                <SummaryCard label="Gesamt" value={preview.summary.totalProjects} color="#94a3b8" />
                <SummaryCard label="Braucht Installation" value={preview.summary.needsInstallation} color="#f59e0b" />
                <SummaryCard label="Braucht Template" value={preview.summary.needsTemplate} color="#60a5fa" />
                <SummaryCard label="Vollständig" value={preview.summary.complete} color="#34d399" />
              </div>

              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
                {todoCount > 0
                  ? `${todoCount} Projekte werden mit Speicher-Template-Daten (WR, Batterie, Betreiber) befüllt.`
                  : "Alle Projekte sind bereits vollständig."}
              </p>

              {/* Config Groups */}
              {preview.configs.map((config) => {
                const isExpanded = expandedConfig === config.configId;
                const needsAction = config.projects.filter(p => p.status !== "complete").length;
                return (
                  <div key={config.configId} style={{
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 8,
                    marginBottom: 12,
                    overflow: "hidden",
                  }}>
                    <button
                      onClick={() => setExpandedConfig(isExpanded ? null : config.configId)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 16px",
                        background: "rgba(255,255,255,.03)",
                        border: "none",
                        color: "#e2e8f0",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <Zap size={15} className={config.templateTyp === "GROSSSPEICHER" ? "text-amber-400" : "text-purple-400"} />
                      <span style={{ fontWeight: 600, flex: 1, textAlign: "left" }}>{config.configName}</span>
                      <span style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: needsAction > 0 ? "rgba(245,158,11,.15)" : "rgba(52,211,153,.15)",
                        color: needsAction > 0 ? "#f59e0b" : "#34d399",
                      }}>
                        {needsAction > 0 ? `${needsAction} offen` : "alle OK"}
                      </span>
                      <span style={{ color: "#64748b", fontSize: 12 }}>{config.projects.length} Projekte</span>
                      <span style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", color: "#64748b" }}>▸</span>
                    </button>

                    {isExpanded && (
                      <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        {config.projects.map((p) => (
                          <div key={p.id} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 16px",
                            borderTop: "1px solid rgba(255,255,255,.04)",
                            fontSize: 13,
                          }}>
                            {statusIcon(p.status)}
                            <span style={{ flex: 1, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.title}
                            </span>
                            <span style={{
                              fontSize: 11,
                              color: p.status === "complete" ? "#34d399" : p.status === "needs_template" ? "#60a5fa" : "#f59e0b",
                            }}>
                              {statusLabel(p.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Overwrite Option */}
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 0",
                color: "#94a3b8",
                fontSize: 13,
                cursor: "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  style={{ accentColor: "#a855f7" }}
                />
                Bestehende technische Daten überschreiben
              </label>

              {/* Apply Button */}
              <button
                onClick={handleApply}
                disabled={todoCount === 0 && !overwrite}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  border: "none",
                  borderRadius: 8,
                  background: todoCount > 0 || overwrite ? "rgba(168,85,247,.2)" : "rgba(255,255,255,.05)",
                  color: todoCount > 0 || overwrite ? "#c084fc" : "#64748b",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: todoCount > 0 || overwrite ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <Play size={16} />
                {todoCount > 0
                  ? `${todoCount} Projekte befüllen`
                  : overwrite
                    ? `Alle ${preview.summary.totalProjects} Projekte neu befüllen`
                    : "Alle Projekte sind vollständig"
                }
              </button>
            </>
          )}

          {/* Applying Phase */}
          {phase === "applying" && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Loader2 size={32} className="spin text-purple-400" />
              <p style={{ marginTop: 12, color: "#94a3b8" }}>
                Templates werden angewendet...
              </p>
              <p style={{ color: "#64748b", fontSize: 12 }}>
                Dies kann bei vielen Projekten etwas dauern.
              </p>
            </div>
          )}

          {/* Result Phase */}
          {phase === "result" && result && (
            <>
              {/* Result Summary */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 20,
              }}>
                <SummaryCard label="Erstellt" value={result.summary.created} color="#34d399" />
                <SummaryCard label="Aktualisiert" value={result.summary.updated} color="#60a5fa" />
                <SummaryCard label="Übersprungen" value={result.summary.skipped} color="#94a3b8" />
                <SummaryCard label="Fehler" value={result.summary.errors} color={result.summary.errors > 0 ? "#f87171" : "#94a3b8"} />
              </div>

              {/* Result List */}
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {result.results
                  .filter(r => r.action !== "skipped" || r.error)
                  .map((r) => (
                    <div key={r.projectId} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                      fontSize: 13,
                    }}>
                      {actionIcon(r.action)}
                      <span style={{
                        flex: 1,
                        color: "#cbd5e1",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {r.title}
                      </span>
                      <span style={{
                        fontSize: 11,
                        color: r.action === "created" ? "#34d399" : r.action === "updated" ? "#60a5fa" : "#94a3b8",
                      }}>
                        {actionLabel(r.action, r.error)}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  border: "none",
                  borderRadius: 8,
                  background: "rgba(168,85,247,.15)",
                  color: "#c084fc",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  marginTop: 16,
                }}
              >
                Schließen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.03)",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 8,
      padding: "12px 16px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</div>
    </div>
  );
}
