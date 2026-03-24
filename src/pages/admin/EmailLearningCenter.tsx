/**
 * EmailLearningCenter — Training-UI für lokale LLM Email-Klassifikation
 * 3-Spalten-Layout: Email-Liste | Email-Vorschau | Training-Panel
 * 10 Kategorien, Stats, Rules
 */
import { useState, useEffect, useCallback } from "react";
import {
  Brain, BarChart3, Settings2, Check, PenLine, Zap,
  ChevronLeft, ChevronRight, RefreshCw, Play, X, Mail,
  Calendar, User, Hash, MapPin, FileText, AlertTriangle,
  Bolt, Shield, Gauge, Archive
} from "lucide-react";
import { api } from "../../modules/api/client";
import { useAuth } from "../../modules/auth/AuthContext";
import "./email-learning.css";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Classification {
  id: number;
  emailId: number;
  llmCategory: string;
  llmConfidence: number;
  llmExtractedData: Record<string, unknown> | null;
  llmModel: string;
  llmInferenceMs: number | null;
  // Local AI (Ollama) results
  localCategory: string | null;
  localConfidence: number | null;
  localExtractedData: Record<string, unknown> | null;
  localModel: string | null;
  localInferenceMs: number | null;
  humanCategory: string | null;
  status: "pending" | "confirmed" | "corrected";
  reviewedBy: number | null;
  reviewedAt: string | null;
  installationId: number | null;
  triggeredWorkflow: string | null;
  createdAt: string;
  email: {
    id: number;
    subject: string | null;
    fromAddress: string;
    fromName: string | null;
    receivedAt: string;
    bodyText: string | null;
    bodyHtml: string | null;
    toAddresses: string | null;
    attachments: string | null;
    installationId: number | null;
    installation?: { id: number; publicId: string; customerName: string | null; gridOperator: string | null } | null;
  };
  reviewer: { id: number; name: string | null; email: string } | null;
}

interface UnclassifiedEmail {
  id: number;
  subject: string | null;
  fromAddress: string;
  fromName: string | null;
  receivedAt: string;
  aiType: string | null;
  aiConfidence: number | null;
  installationId: number | null;
}

interface EmailRule {
  id: number;
  category: string;
  minConfidence: number;
  autoStatusChange: string | null;
  notifySachbearbeiter: boolean;
  notifyInstallateur: boolean;
  notifyKunde: boolean;
  extractData: boolean;
  generateReply: boolean;
  startOrchestration: boolean;
  saveAttachments: boolean;
  isActive: boolean;
}

interface Stats {
  daily: Array<{ date: string; totalClassified: number; confirmed: number; corrected: number; accuracy: number | null }>;
  summary: Record<string, number>;
  categories: Array<{ category: string; count: number; avgConfidence: number | null }>;
}

interface ModelInfo {
  name: string;
  available: boolean;
  sizeBytes: number;
  parameterSize: string;
  quantization: string;
}

type TabType = "training" | "stats" | "rules";

// ═══════════════════════════════════════════════════════════════════════════════
// 10 CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

const EMAIL_CATEGORIES = [
  { key: "eingangsbestaetigung", label: "Eingangsbestätigung", color: "#3B82F6" },
  { key: "rueckfrage", label: "Rückfrage NB", color: "#F97316" },
  { key: "einspeisezusage", label: "Einspeisezusage", color: "#22C55E" },
  { key: "ablehnung", label: "Ablehnung", color: "#EF4444" },
  { key: "netztechnische_stellungnahme", label: "Netztech. Stellungnahme", color: "#8B5CF6" },
  { key: "ibs_pin", label: "IBS-PIN", color: "#06B6D4" },
  { key: "zaehler", label: "Zähler/Kundendoku", color: "#EAB308" },
  { key: "fertigmeldung", label: "Fertigmeldung", color: "#15803D" },
  { key: "statusupdate", label: "Statusupdate", color: "#6B7280" },
  { key: "sonstige", label: "Sonstige/Spam", color: "#D1D5DB" },
];

const CATEGORY_MAP = new Map(EMAIL_CATEGORIES.map((c) => [c.key, c]));

function catLabel(key: string): string {
  return CATEGORY_MAP.get(key)?.label || key;
}

function catColor(key: string): string {
  return CATEGORY_MAP.get(key)?.color || "#6B7280";
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function EmailLearningCenter() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [tab, setTab] = useState<TabType>("training");
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get("/email-learning/model").then((r) => setModel(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/email-learning/classifications", { params: { status: "pending", limit: 1 } })
      .then((r) => setPendingCount(r.data.total))
      .catch(() => {});
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <div className="elc-container">
      <div className="elc-header">
        <h1>
          <Brain size={22} />
          E-Mail Learning Center
          {model && (
            <span className={`elc-model-badge ${model.available ? "" : "offline"}`}>
              <span className="elc-model-dot" />
              {model.available ? `${model.name} (${model.parameterSize})` : "Ollama Offline"}
            </span>
          )}
        </h1>
      </div>

      <div className="elc-tabs">
        <button className={`elc-tab ${tab === "training" ? "active" : ""}`} onClick={() => setTab("training")}>
          <Zap size={14} /> Training
          {pendingCount > 0 && <span className="elc-tab-badge">{pendingCount}</span>}
        </button>
        <button className={`elc-tab ${tab === "stats" ? "active" : ""}`} onClick={() => setTab("stats")}>
          <BarChart3 size={14} /> Statistiken
        </button>
        <button className={`elc-tab ${tab === "rules" ? "active" : ""}`} onClick={() => setTab("rules")}>
          <Settings2 size={14} /> Regeln
        </button>
      </div>

      {tab === "training" && (
        <TrainingView isAdmin={isAdmin} showToast={showToast} onPendingChange={setPendingCount} />
      )}
      {tab === "stats" && <StatsView />}
      {tab === "rules" && <RulesView isAdmin={isAdmin} showToast={showToast} />}

      {toast && (
        <div className={`elc-toast elc-toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING VIEW — 3-Spalten-Layout
// ═══════════════════════════════════════════════════════════════════════════════

function TrainingView({
  isAdmin,
  showToast,
  onPendingChange,
}: {
  isAdmin: boolean;
  showToast: (msg: string, type?: "success" | "error") => void;
  onPendingChange: (n: number) => void;
}) {
  const [view, setView] = useState<"classified" | "unclassified">("classified");
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [unclassified, setUnclassified] = useState<UnclassifiedEmail[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Classification | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [correctCat, setCorrectCat] = useState("");
  const [classifying, setClassifying] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "classified") {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter) params.status = statusFilter;
        if (categoryFilter) params.category = categoryFilter;
        const r = await api.get("/email-learning/classifications", { params });
        setClassifications(r.data.items);
        setTotal(r.data.total);
        setPages(r.data.pages);
        if (statusFilter === "pending" || !statusFilter) {
          onPendingChange(statusFilter === "pending" ? r.data.total : 0);
        }
      } else {
        const r = await api.get("/email-learning/unclassified", { params: { page, limit: 20 } });
        setUnclassified(r.data.items);
        setTotal(r.data.total);
        setPages(r.data.pages);
      }
    } catch {
      showToast("Fehler beim Laden", "error");
    }
    setLoading(false);
  }, [view, page, statusFilter, categoryFilter, showToast, onPendingChange]);

  useEffect(() => { load(); }, [load]);

  // Detail laden wenn Selection ändert
  const loadDetail = useCallback(async (id: number) => {
    setSelectedId(id);
    setDetailLoading(true);
    setCorrecting(false);
    try {
      const r = await api.get(`/email-learning/classifications/${id}`);
      setSelectedDetail(r.data);
    } catch {
      setSelectedDetail(null);
    }
    setDetailLoading(false);
  }, []);

  const handleConfirm = async (id: number) => {
    try {
      await api.patch(`/email-learning/classifications/${id}/review`, { action: "confirm" });
      showToast("Klassifikation bestätigt");
      load();
      if (selectedDetail?.id === id) loadDetail(id);
    } catch {
      showToast("Fehler beim Bestätigen", "error");
    }
  };

  const handleCorrectSubmit = async () => {
    if (!selectedDetail || !correctCat) return;
    try {
      await api.patch(`/email-learning/classifications/${selectedDetail.id}/review`, {
        action: "correct",
        humanCategory: correctCat,
      });
      showToast("Klassifikation korrigiert — Workflow wird aktualisiert");
      setCorrecting(false);
      setCorrectCat("");
      load();
      loadDetail(selectedDetail.id);
    } catch {
      showToast("Fehler beim Korrigieren", "error");
    }
  };

  const handleReset = async (id: number) => {
    try {
      await api.post(`/email-learning/classifications/${id}/reset`);
      showToast("Klassifikation zurückgesetzt");
      load();
      if (selectedDetail?.id === id) loadDetail(id);
    } catch {
      showToast("Fehler beim Zurücksetzen", "error");
    }
  };

  const handleClassify = async (emailId: number) => {
    setClassifying(emailId);
    try {
      await api.post(`/email-learning/classifications/${emailId}/classify`);
      showToast("Email klassifiziert");
      load();
    } catch {
      showToast("Klassifikation fehlgeschlagen", "error");
    }
    setClassifying(null);
  };

  const handleBatchClassify = async () => {
    const ids = unclassified.slice(0, 10).map((e) => e.id);
    if (ids.length === 0) return;
    try {
      await api.post("/email-learning/classifications/batch-classify", { emailIds: ids });
      showToast(`Batch-Klassifikation für ${ids.length} Emails gestartet`);
    } catch {
      showToast("Batch-Start fehlgeschlagen", "error");
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="elc-toolbar">
        <div className="elc-toolbar-left">
          <div className="elc-filter-chips">
            <button className={`elc-chip ${view === "classified" ? "active" : ""}`} onClick={() => { setView("classified"); setPage(1); setSelectedId(null); setSelectedDetail(null); }}>
              Klassifiziert
            </button>
            <button className={`elc-chip ${view === "unclassified" ? "active" : ""}`} onClick={() => { setView("unclassified"); setPage(1); setSelectedId(null); setSelectedDetail(null); }}>
              Nicht klassifiziert
            </button>
          </div>
          {view === "classified" && (
            <>
              <div className="elc-filter-chips">
                <button className={`elc-chip ${!statusFilter ? "active" : ""}`} onClick={() => { setStatusFilter(""); setPage(1); }}>Alle</button>
                <button className={`elc-chip ${statusFilter === "pending" ? "active" : ""}`} onClick={() => { setStatusFilter("pending"); setPage(1); }}>Offen</button>
                <button className={`elc-chip ${statusFilter === "confirmed" ? "active" : ""}`} onClick={() => { setStatusFilter("confirmed"); setPage(1); }}>Bestätigt</button>
                <button className={`elc-chip ${statusFilter === "corrected" ? "active" : ""}`} onClick={() => { setStatusFilter("corrected"); setPage(1); }}>Korrigiert</button>
              </div>
              <select
                className="elc-select elc-select-small"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              >
                <option value="">Alle Kategorien</option>
                {EMAIL_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="elc-btn elc-btn-classify" onClick={load}>
            <RefreshCw size={12} /> Aktualisieren
          </button>
          {view === "unclassified" && isAdmin && (
            <button className="elc-btn elc-btn-primary" onClick={handleBatchClassify}>
              <Play size={12} /> Batch (10)
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="elc-loading"><div className="elc-spinner" />Laden...</div>
      ) : view === "classified" ? (
        <div className="elc-three-col">
          {/* Spalte 1: Email-Liste */}
          <div className="elc-col-list">
            {classifications.length === 0 ? (
              <div className="elc-empty">Keine Einträge</div>
            ) : (
              classifications.map((c) => (
                <div
                  key={c.id}
                  className={`elc-list-item ${selectedId === c.id ? "selected" : ""}`}
                  onClick={() => loadDetail(c.id)}
                >
                  <div className="elc-list-item-subject">{c.email.subject || "(kein Betreff)"}</div>
                  <div className="elc-list-item-from">{c.email.fromName || c.email.fromAddress}</div>
                  <div className="elc-list-item-meta">
                    <CategoryBadge category={c.llmCategory} />
                    <ConfidenceBar value={c.llmConfidence} />
                    <span className={`elc-status elc-status-${c.status}`}>
                      {c.status === "pending" ? "Offen" : c.status === "confirmed" ? "OK" : "Korr."}
                    </span>
                  </div>
                </div>
              ))
            )}
            <Pagination page={page} pages={pages} total={total} onPage={setPage} />
          </div>

          {/* Spalte 2: Email-Vorschau */}
          <div className="elc-col-preview">
            {detailLoading ? (
              <div className="elc-loading"><div className="elc-spinner" />Laden...</div>
            ) : selectedDetail ? (
              <EmailPreview classification={selectedDetail} />
            ) : (
              <div className="elc-empty-center">
                <Mail size={32} style={{ opacity: 0.3 }} />
                <div>Email auswählen</div>
              </div>
            )}
          </div>

          {/* Spalte 3: Training-Panel */}
          <div className="elc-col-training">
            {detailLoading ? (
              <div className="elc-loading"><div className="elc-spinner" /></div>
            ) : selectedDetail ? (
              <TrainingPanel
                classification={selectedDetail}
                isAdmin={isAdmin}
                correcting={correcting}
                correctCat={correctCat}
                onConfirm={() => handleConfirm(selectedDetail.id)}
                onStartCorrect={() => { setCorrecting(true); setCorrectCat(""); }}
                onCancelCorrect={() => setCorrecting(false)}
                onCorrectCatChange={setCorrectCat}
                onCorrectSubmit={handleCorrectSubmit}
                onReset={() => handleReset(selectedDetail.id)}
              />
            ) : (
              <div className="elc-empty-center">
                <Brain size={32} style={{ opacity: 0.3 }} />
                <div>Training-Panel</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Unclassified View */
        <div className="elc-table-wrap">
          {unclassified.length === 0 ? (
            <div className="elc-empty">Alle Emails sind bereits klassifiziert</div>
          ) : (
            <>
              <table className="elc-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>OpenAI-Typ</th>
                    <th>Empfangen</th>
                    {isAdmin && <th>Aktion</th>}
                  </tr>
                </thead>
                <tbody>
                  {unclassified.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: "#e4e4e7" }}>{e.subject || "(kein Betreff)"}</div>
                        <div style={{ fontSize: 11, color: "#71717a" }}>{e.fromName || e.fromAddress}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {e.aiType ? <span style={{ color: "#a1a1aa" }}>{e.aiType} ({e.aiConfidence}%)</span> : <span style={{ color: "#52525b" }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12, color: "#a1a1aa" }}>{new Date(e.receivedAt).toLocaleDateString("de-DE")}</td>
                      {isAdmin && (
                        <td>
                          <button className="elc-btn elc-btn-classify" disabled={classifying === e.id} onClick={() => handleClassify(e.id)}>
                            {classifying === e.id ? <><div className="elc-spinner" style={{ width: 12, height: 12, margin: 0, borderWidth: 1.5 }} /> Läuft...</> : <><Brain size={12} /> Klassifizieren</>}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} pages={pages} total={total} onPage={setPage} />
            </>
          )}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL PREVIEW (Spalte 2)
// ═══════════════════════════════════════════════════════════════════════════════

function EmailPreview({ classification }: { classification: Classification }) {
  const email = classification.email;
  const attachments = parseAttachments(email.attachments);

  return (
    <div className="elc-preview">
      <div className="elc-preview-header">
        <div className="elc-preview-subject">{email.subject || "(kein Betreff)"}</div>
        <div className="elc-preview-meta">
          <span><Mail size={12} /> {email.fromName || email.fromAddress}</span>
          <span><Calendar size={12} /> {new Date(email.receivedAt).toLocaleString("de-DE")}</span>
          {email.installation && (
            <span><Hash size={12} /> {email.installation.customerName || email.installation.publicId}</span>
          )}
        </div>
      </div>
      <div className="elc-preview-body">
        {email.bodyText || "(kein Text)"}
      </div>
      {attachments.length > 0 && (
        <div className="elc-preview-attachments">
          <div className="elc-preview-att-title">Anhänge ({attachments.length})</div>
          {attachments.map((a, i) => (
            <div key={i} className="elc-preview-att-item">
              <FileText size={12} /> {a.filename || `Anhang ${i + 1}`}
              {a.size && <span className="elc-preview-att-size">{formatSize(a.size)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING PANEL (Spalte 3)
// ═══════════════════════════════════════════════════════════════════════════════

function TrainingPanel({
  classification,
  isAdmin,
  correcting,
  correctCat,
  onConfirm,
  onStartCorrect,
  onCancelCorrect,
  onCorrectCatChange,
  onCorrectSubmit,
  onReset,
}: {
  classification: Classification;
  isAdmin: boolean;
  correcting: boolean;
  correctCat: string;
  onConfirm: () => void;
  onStartCorrect: () => void;
  onCancelCorrect: () => void;
  onCorrectCatChange: (cat: string) => void;
  onCorrectSubmit: () => void;
  onReset: () => void;
}) {
  const extracted = classification.llmExtractedData as Record<string, unknown> | null;
  const hasLocal = !!classification.localCategory;
  const modelsAgree = hasLocal && classification.llmCategory === classification.localCategory;

  return (
    <div className="elc-training">
      {/* OpenAI-Ergebnis (Primary) */}
      <div className="elc-training-section" style={{ border: "1px solid #3b82f640", borderRadius: 6, padding: 8 }}>
        <div className="elc-training-label" style={{ color: "#3b82f6" }}>OpenAI (Primary)</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <CategoryBadge category={classification.llmCategory} />
          <ConfidenceBar value={classification.llmConfidence} />
        </div>
        <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>
          {classification.llmModel} {classification.llmInferenceMs ? `(${(classification.llmInferenceMs / 1000).toFixed(1)}s)` : ""}
        </div>
      </div>

      {/* Ollama-Ergebnis (Local) */}
      {hasLocal && (
        <div className="elc-training-section" style={{ border: "1px solid #52525b40", borderRadius: 6, padding: 8 }}>
          <div className="elc-training-label" style={{ color: "#71717a" }}>Ollama (Lokal)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <CategoryBadge category={classification.localCategory!} />
            <ConfidenceBar value={classification.localConfidence || 0} />
          </div>
          <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>
            {classification.localModel} {classification.localInferenceMs ? `(${(classification.localInferenceMs / 1000).toFixed(1)}s)` : ""}
          </div>
        </div>
      )}

      {/* Modell-Übereinstimmung */}
      {hasLocal && (
        <div style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, background: modelsAgree ? "#22c55e15" : "#eab30815", color: modelsAgree ? "#22c55e" : "#eab308", textAlign: "center" }}>
          {modelsAgree ? "Modelle einig" : `Abweichung: ${catLabel(classification.llmCategory)} vs ${catLabel(classification.localCategory!)}`}
        </div>
      )}

      {/* Status */}
      <div className="elc-training-section">
        <div className="elc-training-label">Status</div>
        <span className={`elc-status elc-status-${classification.status}`}>
          {classification.status === "pending" ? "Offen" : classification.status === "confirmed" ? "Bestätigt" : "Korrigiert"}
        </span>
        {classification.humanCategory && classification.humanCategory !== classification.llmCategory && (
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 12, color: "#a1a1aa" }}>Korrigiert zu: </span>
            <CategoryBadge category={classification.humanCategory} />
          </div>
        )}
        {classification.triggeredWorkflow && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#EAD068" }}>
            <Bolt size={11} /> Workflow: {classification.triggeredWorkflow}
          </div>
        )}
      </div>

      {/* Extrahierte Daten */}
      {extracted && Object.keys(extracted).length > 0 && (
        <div className="elc-training-section">
          <div className="elc-training-label">Extrahierte Daten</div>
          <div className="elc-extracted-grid">
            {!!extracted.vorgangsnummer && <ExtractedField icon={<Hash size={11} />} label="Vorgangsnr." value={String(extracted.vorgangsnummer)} />}
            {!!extracted.kundenname && <ExtractedField icon={<User size={11} />} label="Kunde" value={String(extracted.kundenname)} />}
            {!!extracted.adresse && <ExtractedField icon={<MapPin size={11} />} label="Adresse" value={String(extracted.adresse)} />}
            {!!extracted.deadline && <ExtractedField icon={<Calendar size={11} />} label="Frist" value={String(extracted.deadline)} />}
            {!!extracted.zaehlernummer && <ExtractedField icon={<Gauge size={11} />} label="Zähler" value={String(extracted.zaehlernummer)} />}
            {!!extracted.anlagennummer && <ExtractedField icon={<FileText size={11} />} label="Anlage" value={String(extracted.anlagennummer)} />}
            {!!extracted.pin && <ExtractedField icon={<Shield size={11} />} label="IBS-PIN" value={String(extracted.pin)} />}
            {!!extracted.messkonzept && <ExtractedField icon={<Settings2 size={11} />} label="Messkonzept" value={String(extracted.messkonzept)} />}
            {!!extracted.generatorleistung_kwp && <ExtractedField icon={<Zap size={11} />} label="Generator" value={`${String(extracted.generatorleistung_kwp)} kWp`} />}
            {!!extracted.wechselrichterleistung_kva && <ExtractedField icon={<Zap size={11} />} label="WR" value={`${String(extracted.wechselrichterleistung_kva)} kVA`} />}
            {!!extracted.speicher_kwh && <ExtractedField icon={<Archive size={11} />} label="Speicher" value={`${String(extracted.speicher_kwh)} kWh`} />}
            {!!extracted.bearbeiter && <ExtractedField icon={<User size={11} />} label="Bearbeiter" value={String(extracted.bearbeiter)} />}
            {!!extracted.ablehnungsgrund && <ExtractedField icon={<AlertTriangle size={11} />} label="Ablehnung" value={String(extracted.ablehnungsgrund)} />}
            {Array.isArray(extracted.fehlende_unterlagen) && extracted.fehlende_unterlagen.length > 0 && (
              <div className="elc-extracted-field elc-extracted-full">
                <FileText size={11} /> <strong>Fehlend:</strong> {(extracted.fehlende_unterlagen as string[]).join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {isAdmin && classification.status === "pending" && !correcting && (
        <div className="elc-training-actions">
          <button className="elc-btn elc-btn-confirm" onClick={onConfirm}>
            <Check size={14} /> Bestätigen
          </button>
          <button className="elc-btn elc-btn-correct" onClick={onStartCorrect}>
            <PenLine size={14} /> Korrigieren
          </button>
        </div>
      )}

      {/* Correction UI */}
      {isAdmin && correcting && (
        <div className="elc-training-section">
          <div className="elc-training-label">Richtige Kategorie</div>
          <select className="elc-select" value={correctCat} onChange={(e) => onCorrectCatChange(e.target.value)}>
            <option value="">Kategorie wählen...</option>
            {EMAIL_CATEGORIES.filter((c) => c.key !== classification.llmCategory).map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <div className="elc-training-actions" style={{ marginTop: 8 }}>
            <button className="elc-btn" style={{ color: "#a1a1aa" }} onClick={onCancelCorrect}>Abbrechen</button>
            <button className="elc-btn elc-btn-primary" disabled={!correctCat} onClick={onCorrectSubmit}>Korrigieren</button>
          </div>
        </div>
      )}

      {/* Reset */}
      {isAdmin && classification.status !== "pending" && (
        <div className="elc-training-actions" style={{ marginTop: 8 }}>
          <button className="elc-btn" style={{ color: "#71717a", fontSize: 11 }} onClick={onReset}>
            <RefreshCw size={11} /> Zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

interface ModelComparison {
  total: number;
  matching: number;
  agreementRate: number;
  categories: Record<string, { total: number; matching: number; openaiCount: number; localCount: number }>;
}

function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [comparison, setComparison] = useState<ModelComparison | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/email-learning/stats", { params: { days: 30 } }),
      api.get("/email-learning/model"),
      api.get("/email-learning/model-comparison").catch(() => ({ data: null })),
    ]).then(([statsRes, modelRes, compRes]) => {
      setStats(statsRes.data);
      setModel(modelRes.data);
      if (compRes.data) setComparison(compRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="elc-loading"><div className="elc-spinner" />Laden...</div>;
  if (!stats) return <div className="elc-empty">Keine Statistiken verfügbar</div>;

  const confirmed = stats.summary.confirmed || 0;
  const corrected = stats.summary.corrected || 0;
  const reviewed = confirmed + corrected;
  const accuracy = reviewed > 0 ? (confirmed / reviewed * 100) : 0;

  return (
    <>
      {/* Summary Cards */}
      <div className="elc-summary">
        <div className="elc-card">
          <div className="elc-card-label">Gesamt</div>
          <div className="elc-card-value">{stats.summary.total || 0}</div>
        </div>
        <div className="elc-card">
          <div className="elc-card-label">Bestätigt</div>
          <div className="elc-card-value" style={{ color: "#34d399" }}>{confirmed}</div>
        </div>
        <div className="elc-card">
          <div className="elc-card-label">Korrigiert</div>
          <div className="elc-card-value" style={{ color: "#fbbf24" }}>{corrected}</div>
        </div>
        <div className="elc-card">
          <div className="elc-card-label">Offen</div>
          <div className="elc-card-value" style={{ color: "#a1a1aa" }}>{stats.summary.pending || 0}</div>
        </div>
        <div className="elc-card">
          <div className="elc-card-label">Genauigkeit</div>
          <div className="elc-card-value">{accuracy.toFixed(1)}%</div>
        </div>
        {model && (
          <div className="elc-card">
            <div className="elc-card-label">Modell</div>
            <div className="elc-card-value" style={{ fontSize: 14, color: model.available ? "#34d399" : "#f87171" }}>
              {model.available ? "Online" : "Offline"}
            </div>
            <div className="elc-card-sub">{model.name}</div>
          </div>
        )}
      </div>

      {/* Model Comparison */}
      {comparison && comparison.total > 0 && (
        <div className="elc-chart-placeholder">
          <div className="elc-chart-title">Dual-LLM Vergleich (OpenAI vs Ollama)</div>
          <div className="elc-summary" style={{ marginBottom: 12 }}>
            <div className="elc-card">
              <div className="elc-card-label">Verglichen</div>
              <div className="elc-card-value">{comparison.total}</div>
            </div>
            <div className="elc-card">
              <div className="elc-card-label">Einig</div>
              <div className="elc-card-value" style={{ color: "#34d399" }}>{comparison.matching}</div>
            </div>
            <div className="elc-card">
              <div className="elc-card-label">Abweichend</div>
              <div className="elc-card-value" style={{ color: "#fbbf24" }}>{comparison.total - comparison.matching}</div>
            </div>
            <div className="elc-card">
              <div className="elc-card-label">Übereinstimmung</div>
              <div className="elc-card-value" style={{ color: comparison.agreementRate >= 0.8 ? "#34d399" : "#fbbf24" }}>
                {(comparison.agreementRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {stats.categories.length > 0 && (
        <div className="elc-chart-placeholder">
          <div className="elc-chart-title">Kategorien-Verteilung</div>
          <div className="elc-bar-chart">
            {stats.categories.sort((a, b) => b.count - a.count).map((c) => {
              const maxCount = Math.max(...stats.categories.map((x) => x.count), 1);
              const height = Math.max(4, (c.count / maxCount) * 100);
              return (
                <div key={c.category} className="elc-bar-col">
                  <div className="elc-bar-value">{c.count}</div>
                  <div className="elc-bar" style={{ height: `${height}px`, background: catColor(c.category) }} />
                  <div className="elc-bar-label">{catLabel(c.category)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Trend */}
      {stats.daily.length > 0 && (
        <div className="elc-chart-placeholder">
          <div className="elc-chart-title">Tägliche Klassifikationen</div>
          <div className="elc-bar-chart">
            {stats.daily.slice(-14).map((d) => {
              const maxDaily = Math.max(...stats.daily.map((x) => x.totalClassified), 1);
              const height = Math.max(4, (d.totalClassified / maxDaily) * 100);
              return (
                <div key={d.date} className="elc-bar-col">
                  <div className="elc-bar-value">{d.totalClassified}</div>
                  <div className="elc-bar" style={{ height: `${height}px` }} />
                  <div className="elc-bar-label">
                    {new Date(d.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RULES VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function RulesView({
  isAdmin,
  showToast,
}: {
  isAdmin: boolean;
  showToast: (msg: string, type?: "success" | "error") => void;
}) {
  const [rules, setRules] = useState<EmailRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/email-learning/rules")
      .then((r) => setRules(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateRule = async (id: number, data: Partial<EmailRule>) => {
    try {
      const r = await api.put(`/email-learning/rules/${id}`, data);
      setRules((prev) => prev.map((rule) => (rule.id === id ? r.data : rule)));
      showToast("Regel gespeichert");
    } catch {
      showToast("Fehler beim Speichern", "error");
    }
  };

  if (loading) return <div className="elc-loading"><div className="elc-spinner" />Laden...</div>;

  return (
    <div className="elc-rules-grid">
      {rules.map((rule) => (
        <div key={rule.id} className="elc-rule-card">
          <div className="elc-rule-header">
            <CategoryBadge category={rule.category} />
            {isAdmin && (
              <input type="checkbox" className="elc-toggle" checked={rule.isActive} onChange={(e) => updateRule(rule.id, { isActive: e.target.checked })} />
            )}
          </div>
          <div className="elc-rule-settings">
            <div className="elc-rule-row">
              <label>Min. Konfidenz</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="range" className="elc-slider" min={0.5} max={1} step={0.05} value={rule.minConfidence} disabled={!isAdmin} onChange={(e) => updateRule(rule.id, { minConfidence: parseFloat(e.target.value) })} />
                <span style={{ fontSize: 12, color: "#a1a1aa", minWidth: 32 }}>{(rule.minConfidence * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="elc-rule-row">
              <label>Auto-Status</label>
              <span style={{ fontSize: 12, color: rule.autoStatusChange ? "#EAD068" : "#52525b" }}>{rule.autoStatusChange || "—"}</span>
            </div>
            <div className="elc-rule-row">
              <label>Orchestrator starten</label>
              <input type="checkbox" className="elc-toggle" checked={rule.startOrchestration} disabled={!isAdmin} onChange={(e) => updateRule(rule.id, { startOrchestration: e.target.checked })} />
            </div>
            <div className="elc-rule-row">
              <label>Anhänge speichern</label>
              <input type="checkbox" className="elc-toggle" checked={rule.saveAttachments} disabled={!isAdmin} onChange={(e) => updateRule(rule.id, { saveAttachments: e.target.checked })} />
            </div>
            <div className="elc-rule-row">
              <label>Daten extrahieren</label>
              <input type="checkbox" className="elc-toggle" checked={rule.extractData} disabled={!isAdmin} onChange={(e) => updateRule(rule.id, { extractData: e.target.checked })} />
            </div>
            <div className="elc-rule-row">
              <label>Benachrichtigen</label>
              <input type="checkbox" className="elc-toggle" checked={rule.notifySachbearbeiter} disabled={!isAdmin} onChange={(e) => updateRule(rule.id, { notifySachbearbeiter: e.target.checked })} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function CategoryBadge({ category }: { category: string }) {
  const color = catColor(category);
  return (
    <span className="elc-cat-badge" style={{ background: `${color}20`, color, borderColor: `${color}40` }}>
      {catLabel(category)}
    </span>
  );
}

function ExtractedField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="elc-extracted-field">
      {icon} <strong>{label}:</strong> {value}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls = pct >= 80 ? "high" : pct >= 50 ? "mid" : "low";
  return (
    <div className="elc-conf">
      <div className="elc-conf-bar">
        <div className={`elc-conf-fill elc-conf-${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="elc-conf-text" style={{ color: cls === "high" ? "#34d399" : cls === "mid" ? "#fbbf24" : "#f87171" }}>
        {pct}%
      </span>
    </div>
  );
}

function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="elc-pagination">
      <span>{total} Einträge</span>
      <div className="elc-pagination-btns">
        <button className="elc-page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ padding: "4px 8px", fontSize: 12 }}>{page} / {pages || 1}</span>
        <button className="elc-page-btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function parseAttachments(raw: string | null): Array<{ filename?: string; size?: number; contentType?: string }> {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
