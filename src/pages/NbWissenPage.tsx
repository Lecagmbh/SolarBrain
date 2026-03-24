/**
 * NB-Wissensseite
 * Zeigt Netzbetreiber-Wissen mit TAB-Zusammenfassungen, Dokument-Anforderungen,
 * Erfolgsquoten, Praxis-Tipps und historischen Daten.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Building2,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Globe,
  Loader2,
  BookOpen,
  FileText,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Clock,
  CheckCircle2,
  InboxIcon,
  Upload,
  RefreshCw,
  Trash2,
  FileCheck,
  Pencil,
  Save,
  X,
  Plus,
  Star,
  MessageSquare,
  Phone,
  User,
  StickyNote,
} from "lucide-react";
import { apiGet, apiPost, apiDelete } from "../api/client";
import {
  updateNbWorkflow,
  getFewShotExamples,
  createFewShotExample,
  updateFewShotExample,
  deleteFewShotExample,
  type NbWorkflowData,
  type FewShotExample,
  type CreateFewShotData,
} from "../api/evu";
import { useAuth } from "./AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import "./NbWissenPage.css";

// Types
interface TabSummary {
  titel: string;
  geltungsbereich: string;
  unterlagenAnmeldung: Array<{ name: string; pflicht: boolean }>;
  unterlagenIBN: Array<{ name: string; pflicht: boolean }>;
  messkonzepte: string[];
  kernregeln: string[];
  besonderheiten: string[];
  fristen: string[];
  haeufigsteUnterlagen: Array<{ name: string; kategorie: string }>;
}

interface TabDocument {
  id: number;
  originalName: string;
  summary: TabSummary | null;
  analyzedAt: string | null;
  analysisError: string | null;
}

interface NbWissenEntry {
  id: number;
  name: string;
  email: string | null;
  website: string | null;
  portalUrl: string | null;
  portalHinweise: string | null;
  avgResponseDays: number | null;
  preferredContactMethod: string | null;
  hasOnlinePortal: boolean | null;
  installationCount: number;
  statusBreakdown: Record<string, number>;
  successRate: number | null;
  avgProcessingDays: number | null;
  medianProcessingDays: number | null;
  minProcessingDays: number | null;
  maxProcessingDays: number | null;
  sofortFreigabeRate: number | null;
  rueckfrageRate: number | null;
  genehmigungsTyp: string | null;
  nachhakSchwelleTage: number | null;
  eskalationSchwelleTage: number | null;
  bestResponseDay: string | null;
  typischeRueckfragen: Record<string, number> | null;
  totalSubmissionsGlobal: number;
  documentRequirements: { required: string[]; recommended: string[]; optional: string[] } | null;
  commonIssues: Record<string, number>;
  tips: Array<{ category: string; tip: string; confidence: number }>;
  specialRequirements: string | null;
  rejectionReasons: any[];
  // Workflow / EVU-Learning
  einreichMethode: string | null;
  einreichEmail: string | null;
  einreichBetreffFormat: string | null;
  pflichtDokumente: string[] | null;
  antwortKanal: string | null;
  ibnMethode: string | null;
  ibnImGleichenPortal: boolean | null;
  ibnPortalUrl: string | null;
  ibnSchritte: string[] | null;
  ibnDokumente: string[] | null;
  zaehlerantragFormularUrl: string | null;
  zaehlerantragEinreichMethode: string | null;
  zaehlerantragEinreichAdresse: string | null;
  mastrVorIbn: boolean | null;
  tonalitaet: string | null;
  anrede: string | null;
  grussformel: string | null;
  sprachBesonderheiten: string[] | null;
  kontakte: Array<{ name: string; rolle?: string; email?: string; telefon?: string; notiz?: string }> | null;
  notizen: string | null;
  fewShotCount: number;
  // Activity
  recentCorrespondences: Array<{ type: string; sentAt: string; responseType: string | null }>;
  recentLearnings: Array<{ eventType: string; category: string; createdAt: string }>;
  tabDocuments: TabDocument[];
}

// Label-Mapping fuer technische Dokument-Codes
const DOC_LABELS: Record<string, string> = {
  vde_e1: "VDE E.1",
  vde_e2: "VDE E.2",
  vde_e3: "VDE E.3",
  vde_e5: "VDE E.5",
  vde_e8: "VDE E.8",
  lageplan: "Lageplan",
  schaltplan: "Schaltplan",
  datenblatt_module: "Datenblatt Module",
  datenblatt_wr: "Datenblatt WR",
  datenblatt_speicher: "Datenblatt Speicher",
  datenblatt_wallbox: "Datenblatt Wallbox",
  vollmacht: "Vollmacht",
  messkonzept: "Messkonzept",
  konformitaetserklaerung: "Konformitaetserkl.",
  na_schutz: "NA-Schutz",
  zertifikat: "Zertifikat",
  personalausweis: "Personalausweis",
  grundbuchauszug: "Grundbuchauszug",
  anschlussplan: "Anschlussplan",
  bestaetigung_nb: "NB-Bestaetigung",
  projektmappe: "Projektmappe",
  sonstiges: "Sonstiges",
};

function formatDocLabel(code: string): string {
  return DOC_LABELS[code] || code.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const STATUS_LABELS: Record<string, string> = {
  EINGANG: "Eingang",
  BEIM_NB: "Beim NB",
  RUECKFRAGE: "Rueckfrage",
  GENEHMIGT: "Genehmigt",
  IBN: "IBN",
  FERTIG: "Fertig",
  STORNIERT: "Storniert",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const KATEGORIE_COLORS: Record<string, string> = {
  DOKUMENT: "tab-cat-dokument",
  BILD: "tab-cat-bild",
  FORMULAR: "tab-cat-formular",
};

export default function NbWissenPage() {
  const [data, setData] = useState<NbWissenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { subscribe } = useWebSocket();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiGet<{ netzbetreiber: NbWissenEntry[] }>("/api/nb-wissen");
      setData(result.netzbetreiber);
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Echtzeit: Bei TAB-Analyse-Ergebnis sofort neu laden
  useEffect(() => {
    const unsubAnalyzed = subscribe("tab:analyzed", () => {
      loadData();
    });
    const unsubFailed = subscribe("tab:analysis_failed", () => {
      loadData();
    });
    return () => {
      unsubAnalyzed();
      unsubFailed();
    };
  }, [subscribe, loadData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(nb => nb.name.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="nb-wissen-page">
      {/* Header */}
      <div className="nb-wissen-header">
        <h1>NB-Wissen</h1>
        <p>Netzbetreiber-Wissen, TAB-Zusammenfassungen und Praxis-Tipps</p>
      </div>

      {/* TAB Info-Hinweis */}
      <div className="tab-basics">
        <div className="tab-info-hint">
          <BookOpen size={16} />
          <span>
            Die TAB-Zusammenfassungen werden pro Netzbetreiber aus hochgeladenen TAB-PDFs per KI generiert.
            Admins koennen TAB-PDFs direkt auf den NB-Cards hochladen.
          </span>
        </div>
      </div>

      {/* Search */}
      {!loading && data.length > 0 && (
        <div className="nb-wissen-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Netzbetreiber suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Error */}
      {error && <div className="nb-wissen-error"><AlertTriangle size={16} /> {error}</div>}

      {/* Loading */}
      {loading && (
        <div className="nb-wissen-loading">
          <Loader2 size={32} className="animate-spin" />
          <span>Lade NB-Wissensdaten...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data.length === 0 && (
        <div className="nb-wissen-empty">
          <InboxIcon size={48} />
          <span>Keine Netzbetreiber-Daten vorhanden</span>
          <span style={{ fontSize: "0.75rem" }}>Es wurden noch keine Installationen mit Netzbetreibern gefunden.</span>
        </div>
      )}

      {/* NB Cards */}
      {!loading && filtered.length > 0 && (
        <div className="nb-cards-grid">
          {filtered.map(nb => (
            <NbCard key={nb.id} nb={nb} onReload={loadData} />
          ))}
        </div>
      )}

      {/* No search results */}
      {!loading && data.length > 0 && filtered.length === 0 && search && (
        <div className="nb-wissen-empty">
          <Search size={32} />
          <span>Kein Netzbetreiber fuer "{search}" gefunden</span>
        </div>
      )}
    </div>
  );
}

/** TAB-Summary Anzeige */
function TabSummaryView({ summary }: { summary: TabSummary }) {
  return (
    <div className="tab-summary">
      {/* Titel & Geltungsbereich */}
      <div className="tab-summary-header">
        <div className="tab-summary-title">{summary.titel}</div>
        <div className="tab-summary-scope">{summary.geltungsbereich}</div>
      </div>

      {/* Unterlagen Anmeldung */}
      {summary.unterlagenAnmeldung.length > 0 && (
        <div className="tab-summary-section">
          <div className="tab-summary-section-title">Unterlagen Anmeldung</div>
          <table className="tab-summary-table">
            <tbody>
              {summary.unterlagenAnmeldung.map((u, i) => (
                <tr key={i}>
                  <td className="tab-doc-name">{u.name}</td>
                  <td className="tab-doc-pflicht">
                    {u.pflicht ? (
                      <span className="tab-pflicht">Pflicht</span>
                    ) : (
                      <span className="tab-optional">Optional</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Unterlagen IBN */}
      {summary.unterlagenIBN.length > 0 && (
        <div className="tab-summary-section">
          <div className="tab-summary-section-title">Unterlagen Inbetriebnahme</div>
          <table className="tab-summary-table">
            <tbody>
              {summary.unterlagenIBN.map((u, i) => (
                <tr key={i}>
                  <td className="tab-doc-name">{u.name}</td>
                  <td className="tab-doc-pflicht">
                    {u.pflicht ? (
                      <span className="tab-pflicht">Pflicht</span>
                    ) : (
                      <span className="tab-optional">Optional</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kernregeln */}
      {summary.kernregeln.length > 0 && (
        <div className="tab-summary-section">
          <div className="tab-summary-section-title">Kernregeln</div>
          <ul className="tab-rules-list">
            {summary.kernregeln.map((rule, i) => (
              <li key={i} className="tab-rule-item">{rule}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Besonderheiten */}
      {summary.besonderheiten.length > 0 && (
        <div className="tab-summary-section">
          <div className="tab-besonderheit">
            <AlertTriangle size={14} />
            <div>
              <div className="tab-summary-section-title" style={{ margin: 0 }}>Besonderheiten</div>
              <ul className="tab-besonderheit-list">
                {summary.besonderheiten.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Fristen */}
      {summary.fristen.length > 0 && (
        <div className="tab-summary-section">
          <div className="tab-summary-section-title">Fristen</div>
          <ul className="tab-rules-list">
            {summary.fristen.map((f, i) => (
              <li key={i} className="tab-rule-item">{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Messkonzepte */}
      {summary.messkonzepte.length > 0 && (
        <div className="tab-summary-section">
          <div className="tab-summary-section-title">Messkonzepte</div>
          <div className="tab-badges">
            {summary.messkonzepte.map((m, i) => (
              <span key={i} className="tab-messkonzept-badge">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Häufigste Unterlagen */}
      {summary.haeufigsteUnterlagen.length > 0 && (
        <div className="tab-summary-section">
          <div className="tab-summary-section-title">Wichtige Unterlagen</div>
          <div className="tab-badges">
            {summary.haeufigsteUnterlagen.map((u, i) => (
              <span key={i} className={`tab-doc-category ${KATEGORIE_COLORS[u.kategorie] || ""}`}>
                {u.name}
              </span>
            ))}
          </div>
          <div className="tab-cat-legend">
            <span><span className="tab-cat-dot tab-cat-dokument" /> Dokument</span>
            <span><span className="tab-cat-dot tab-cat-bild" /> Bild/Plan</span>
            <span><span className="tab-cat-dot tab-cat-formular" /> Formular</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Few-Shot Typ Labels
// ═══════════════════════════════════════════════════════════════════════════════
const FEW_SHOT_TYP_LABELS: Record<string, string> = {
  rueckfrage: "Rückfrage",
  genehmigung: "Genehmigung",
  eingangsbestaetigung: "Eingangsbestätigung",
  nachhaken: "Nachhaken",
  ablehnung: "Ablehnung",
};

const FEW_SHOT_TYP_OPTIONS = [
  { value: "rueckfrage", label: "Rückfrage" },
  { value: "genehmigung", label: "Genehmigung" },
  { value: "eingangsbestaetigung", label: "Eingangsbestätigung" },
  { value: "nachhaken", label: "Nachhaken" },
  { value: "ablehnung", label: "Ablehnung" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Tag-Input Komponente (Chips hinzufügen/entfernen)
// ═══════════════════════════════════════════════════════════════════════════════
function TagInput({
  value,
  onChange,
  placeholder,
  suggestions,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  function removeTag(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
  }

  const filteredSuggestions = suggestions?.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  ).slice(0, 5);

  return (
    <div className="wf-tag-input">
      <div className="wf-tags">
        {value.map((tag, i) => (
          <span key={i} className="wf-tag">
            {tag}
            <button type="button" onClick={() => removeTag(i)}><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="wf-tag-input-wrapper">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Eingabe + Enter"}
        />
        {input && filteredSuggestions && filteredSuggestions.length > 0 && (
          <div className="wf-tag-suggestions">
            {filteredSuggestions.map(s => (
              <button key={s} type="button" onClick={() => addTag(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Star-Rating Komponente
// ═══════════════════════════════════════════════════════════════════════════════
function StarRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="wf-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`wf-star ${n <= (value || 0) ? "active" : ""}`}
          onClick={() => onChange(n === value ? null : n)}
        >
          <Star size={14} />
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Kontakt-Editor Komponente
// ═══════════════════════════════════════════════════════════════════════════════
interface KontaktEntry {
  name: string;
  rolle?: string;
  email?: string;
  telefon?: string;
  notiz?: string;
}

function KontakteEditor({
  value,
  onChange,
}: {
  value: KontaktEntry[];
  onChange: (kontakte: KontaktEntry[]) => void;
}) {
  function updateEntry(idx: number, field: keyof KontaktEntry, val: string) {
    const updated = [...value];
    updated[idx] = { ...updated[idx], [field]: val || undefined };
    onChange(updated);
  }

  function addEntry() {
    onChange([...value, { name: "" }]);
  }

  function removeEntry(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="wf-kontakte">
      {value.map((k, i) => (
        <div key={i} className="wf-kontakt-row">
          <input placeholder="Name *" value={k.name} onChange={e => updateEntry(i, "name", e.target.value)} />
          <input placeholder="Rolle" value={k.rolle || ""} onChange={e => updateEntry(i, "rolle", e.target.value)} />
          <input placeholder="Email" value={k.email || ""} onChange={e => updateEntry(i, "email", e.target.value)} />
          <input placeholder="Telefon" value={k.telefon || ""} onChange={e => updateEntry(i, "telefon", e.target.value)} />
          <input placeholder="Notiz" value={k.notiz || ""} onChange={e => updateEntry(i, "notiz", e.target.value)} />
          <button type="button" className="wf-kontakt-remove" onClick={() => removeEntry(i)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button type="button" className="wf-add-btn" onClick={addEntry}>
        <Plus size={12} /> Kontakt hinzufügen
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Read-Only Workflow-Daten Anzeige
// ═══════════════════════════════════════════════════════════════════════════════
function WorkflowReadOnly({ nb }: { nb: NbWissenEntry }) {
  const hasEinreichung = nb.einreichMethode || nb.einreichEmail || nb.einreichBetreffFormat || nb.pflichtDokumente?.length || nb.antwortKanal;
  const hasIbn = nb.ibnMethode || nb.ibnPortalUrl || nb.ibnSchritte?.length || nb.ibnDokumente?.length || nb.zaehlerantragFormularUrl || nb.zaehlerantragEinreichMethode;
  const hasKommunikation = nb.tonalitaet || nb.anrede || nb.grussformel || nb.sprachBesonderheiten?.length || nb.kontakte?.length;
  const hasAny = hasEinreichung || hasIbn || hasKommunikation || nb.notizen || nb.fewShotCount > 0;

  if (!hasAny) return null;

  return (
    <>
      {/* Einreichung */}
      {hasEinreichung && (
        <div className="nb-section">
          <div className="nb-section-title">
            <Mail size={12} style={{ display: "inline", marginRight: 4 }} />
            Einreichung (eingelernt)
          </div>
          <div className="wf-readonly-grid">
            {nb.einreichMethode && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Methode</span>
                <span className={`wf-method-badge wf-method-${nb.einreichMethode.toLowerCase()}`}>{nb.einreichMethode}</span>
              </div>
            )}
            {nb.einreichEmail && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Email</span>
                <span className="wf-readonly-value">{nb.einreichEmail}</span>
              </div>
            )}
            {nb.einreichBetreffFormat && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Betreff-Format</span>
                <span className="wf-readonly-value wf-readonly-mono">{nb.einreichBetreffFormat}</span>
              </div>
            )}
            {nb.antwortKanal && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Antwort-Kanal</span>
                <span className="wf-readonly-value">{nb.antwortKanal}</span>
              </div>
            )}
            {nb.pflichtDokumente && nb.pflichtDokumente.length > 0 && (
              <div className="wf-readonly-item wf-readonly-full">
                <span className="wf-readonly-label">Pflichtdokumente</span>
                <div className="wf-readonly-chips">
                  {nb.pflichtDokumente.map((d, i) => (
                    <span key={i} className="wf-chip">{formatDocLabel(d)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IBN */}
      {hasIbn && (
        <div className="nb-section">
          <div className="nb-section-title">
            <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />
            Inbetriebnahme (eingelernt)
          </div>
          <div className="wf-readonly-grid">
            {nb.ibnMethode && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Methode</span>
                <span className={`wf-method-badge wf-method-${nb.ibnMethode.toLowerCase()}`}>{nb.ibnMethode}</span>
              </div>
            )}
            {nb.ibnImGleichenPortal !== null && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Im gleichen Portal</span>
                <span className="wf-readonly-value">{nb.ibnImGleichenPortal ? "Ja" : "Nein"}</span>
              </div>
            )}
            {nb.ibnPortalUrl && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Portal-URL</span>
                <a href={nb.ibnPortalUrl} target="_blank" rel="noopener noreferrer" className="wf-readonly-link">{nb.ibnPortalUrl}</a>
              </div>
            )}
            {nb.mastrVorIbn !== null && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">MaStR vor IBN</span>
                <span className="wf-readonly-value">{nb.mastrVorIbn ? "Ja" : "Nein"}</span>
              </div>
            )}
            {nb.zaehlerantragEinreichMethode && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Zählerantrag</span>
                <span className="wf-readonly-value">{nb.zaehlerantragEinreichMethode}</span>
              </div>
            )}
            {nb.zaehlerantragFormularUrl && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Zählerantrag-Formular</span>
                <a href={nb.zaehlerantragFormularUrl} target="_blank" rel="noopener noreferrer" className="wf-readonly-link">{nb.zaehlerantragFormularUrl}</a>
              </div>
            )}
            {nb.zaehlerantragEinreichAdresse && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Einreich-Adresse</span>
                <span className="wf-readonly-value">{nb.zaehlerantragEinreichAdresse}</span>
              </div>
            )}
            {nb.ibnSchritte && nb.ibnSchritte.length > 0 && (
              <div className="wf-readonly-item wf-readonly-full">
                <span className="wf-readonly-label">IBN-Schritte</span>
                <ol className="wf-readonly-steps">
                  {nb.ibnSchritte.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
            {nb.ibnDokumente && nb.ibnDokumente.length > 0 && (
              <div className="wf-readonly-item wf-readonly-full">
                <span className="wf-readonly-label">IBN-Dokumente</span>
                <div className="wf-readonly-chips">
                  {nb.ibnDokumente.map((d, i) => (
                    <span key={i} className="wf-chip">{formatDocLabel(d)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kommunikation */}
      {hasKommunikation && (
        <div className="nb-section">
          <div className="nb-section-title">
            <MessageSquare size={12} style={{ display: "inline", marginRight: 4 }} />
            Kommunikation (eingelernt)
          </div>
          <div className="wf-readonly-grid">
            {nb.tonalitaet && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Tonalität</span>
                <span className={`wf-tone-badge wf-tone-${nb.tonalitaet.toLowerCase()}`}>{nb.tonalitaet}</span>
              </div>
            )}
            {nb.anrede && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Anrede</span>
                <span className="wf-readonly-value">{nb.anrede}</span>
              </div>
            )}
            {nb.grussformel && (
              <div className="wf-readonly-item">
                <span className="wf-readonly-label">Grußformel</span>
                <span className="wf-readonly-value">{nb.grussformel}</span>
              </div>
            )}
            {nb.sprachBesonderheiten && nb.sprachBesonderheiten.length > 0 && (
              <div className="wf-readonly-item wf-readonly-full">
                <span className="wf-readonly-label">Sprachbesonderheiten</span>
                <div className="wf-readonly-chips">
                  {nb.sprachBesonderheiten.map((s, i) => (
                    <span key={i} className="wf-chip">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {nb.kontakte && nb.kontakte.length > 0 && (
              <div className="wf-readonly-item wf-readonly-full">
                <span className="wf-readonly-label">Kontakte</span>
                <div className="wf-kontakte-readonly">
                  {nb.kontakte.map((k, i) => (
                    <div key={i} className="wf-kontakt-card">
                      <div className="wf-kontakt-name"><User size={12} /> {k.name}{k.rolle ? ` (${k.rolle})` : ""}</div>
                      {k.email && <div className="wf-kontakt-detail"><Mail size={10} /> {k.email}</div>}
                      {k.telefon && <div className="wf-kontakt-detail"><Phone size={10} /> {k.telefon}</div>}
                      {k.notiz && <div className="wf-kontakt-detail"><StickyNote size={10} /> {k.notiz}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notizen */}
      {nb.notizen && (
        <div className="nb-section">
          <div className="nb-section-title">
            <StickyNote size={12} style={{ display: "inline", marginRight: 4 }} />
            Notizen
          </div>
          <div className="tip-card">
            <div className="tip-text" style={{ whiteSpace: "pre-wrap" }}>{nb.notizen}</div>
          </div>
        </div>
      )}

      {/* Few-Shot Count */}
      {nb.fewShotCount > 0 && (
        <div className="nb-section">
          <div className="nb-section-title">
            <MessageSquare size={12} style={{ display: "inline", marginRight: 4 }} />
            Few-Shot-Beispiele
          </div>
          <div className="wf-readonly-value">{nb.fewShotCount} Beispiel{nb.fewShotCount !== 1 ? "e" : ""} hinterlegt</div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Workflow Edit-Form Komponente
// ═══════════════════════════════════════════════════════════════════════════════
function WorkflowEditForm({
  nb,
  onSave,
  onCancel,
}: {
  nb: NbWissenEntry;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"einreichung" | "ibn" | "kommunikation" | "fewshot">("einreichung");

  // Einreichung
  const [einreichMethode, setEinreichMethode] = useState(nb.einreichMethode || "");
  const [einreichEmail, setEinreichEmail] = useState(nb.einreichEmail || "");
  const [einreichBetreffFormat, setEinreichBetreffFormat] = useState(nb.einreichBetreffFormat || "");
  const [pflichtDokumente, setPflichtDokumente] = useState<string[]>(nb.pflichtDokumente || []);
  const [antwortKanal, setAntwortKanal] = useState(nb.antwortKanal || "");
  const [nachhakSchwelleTage, setNachhakSchwelleTage] = useState(nb.nachhakSchwelleTage?.toString() || "");
  const [eskalationSchwelleTage, setEskalationSchwelleTage] = useState(nb.eskalationSchwelleTage?.toString() || "");

  // IBN
  const [ibnMethode, setIbnMethode] = useState(nb.ibnMethode || "");
  const [ibnImGleichenPortal, setIbnImGleichenPortal] = useState(nb.ibnImGleichenPortal || false);
  const [ibnPortalUrl, setIbnPortalUrl] = useState(nb.ibnPortalUrl || "");
  const [ibnSchritte, setIbnSchritte] = useState((nb.ibnSchritte || []).join("\n"));
  const [ibnDokumente, setIbnDokumente] = useState<string[]>(nb.ibnDokumente || []);
  const [zaehlerantragFormularUrl, setZaehlerantragFormularUrl] = useState(nb.zaehlerantragFormularUrl || "");
  const [zaehlerantragEinreichMethode, setZaehlerantragEinreichMethode] = useState(nb.zaehlerantragEinreichMethode || "");
  const [zaehlerantragEinreichAdresse, setZaehlerantragEinreichAdresse] = useState(nb.zaehlerantragEinreichAdresse || "");
  const [mastrVorIbn, setMastrVorIbn] = useState(nb.mastrVorIbn || false);

  // Kommunikation
  const [tonalitaet, setTonalitaet] = useState(nb.tonalitaet || "");
  const [anrede, setAnrede] = useState(nb.anrede || "");
  const [grussformel, setGrussformel] = useState(nb.grussformel || "");
  const [sprachBesonderheiten, setSprachBesonderheiten] = useState<string[]>(nb.sprachBesonderheiten || []);
  const [kontakte, setKontakte] = useState<KontaktEntry[]>(nb.kontakte || []);
  const [notizen, setNotizen] = useState(nb.notizen || "");

  // Few-Shot
  const [fewShotExamples, setFewShotExamples] = useState<FewShotExample[]>([]);
  const [fewShotLoading, setFewShotLoading] = useState(false);
  const [showNewFewShot, setShowNewFewShot] = useState(false);
  const [editingFewShot, setEditingFewShot] = useState<number | null>(null);
  const [newFewShot, setNewFewShot] = useState<CreateFewShotData>({ typ: "rueckfrage", eingehend: "" });

  // Few-Shot beim Tab-Wechsel laden
  useEffect(() => {
    if (activeTab === "fewshot" && fewShotExamples.length === 0 && !fewShotLoading) {
      setFewShotLoading(true);
      getFewShotExamples(nb.id)
        .then(setFewShotExamples)
        .catch(err => setError("Few-Shot laden fehlgeschlagen: " + err.message))
        .finally(() => setFewShotLoading(false));
    }
  }, [activeTab, nb.id, fewShotExamples.length, fewShotLoading]);

  const docSuggestions = Object.keys(DOC_LABELS);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const data: NbWorkflowData = {
        einreichMethode: einreichMethode || null,
        einreichEmail: einreichEmail || null,
        einreichBetreffFormat: einreichBetreffFormat || null,
        pflichtDokumente: pflichtDokumente.length > 0 ? pflichtDokumente : null,
        antwortKanal: antwortKanal || null,
        nachhakSchwelleTage: nachhakSchwelleTage ? parseInt(nachhakSchwelleTage) : null,
        eskalationSchwelleTage: eskalationSchwelleTage ? parseInt(eskalationSchwelleTage) : null,
        ibnMethode: ibnMethode || null,
        ibnImGleichenPortal: ibnImGleichenPortal || null,
        ibnPortalUrl: ibnPortalUrl || null,
        ibnSchritte: ibnSchritte.trim() ? ibnSchritte.split("\n").map(s => s.trim()).filter(Boolean) : null,
        ibnDokumente: ibnDokumente.length > 0 ? ibnDokumente : null,
        zaehlerantragFormularUrl: zaehlerantragFormularUrl || null,
        zaehlerantragEinreichMethode: zaehlerantragEinreichMethode || null,
        zaehlerantragEinreichAdresse: zaehlerantragEinreichAdresse || null,
        mastrVorIbn: mastrVorIbn || null,
        tonalitaet: tonalitaet || null,
        anrede: anrede || null,
        grussformel: grussformel || null,
        sprachBesonderheiten: sprachBesonderheiten.length > 0 ? sprachBesonderheiten : null,
        kontakte: kontakte.filter(k => k.name.trim()).length > 0 ? kontakte.filter(k => k.name.trim()) : null,
        notizen: notizen || null,
      };
      await updateNbWorkflow(nb.id, data);
      onSave();
    } catch (err: any) {
      setError(err.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFewShot() {
    if (!newFewShot.eingehend.trim()) return;
    try {
      const created = await createFewShotExample(nb.id, newFewShot);
      setFewShotExamples(prev => [created, ...prev]);
      setNewFewShot({ typ: "rueckfrage", eingehend: "" });
      setShowNewFewShot(false);
    } catch (err: any) {
      setError("Few-Shot erstellen fehlgeschlagen: " + err.message);
    }
  }

  async function handleUpdateFewShot(exId: number, data: Partial<CreateFewShotData>) {
    try {
      const updated = await updateFewShotExample(nb.id, exId, data);
      setFewShotExamples(prev => prev.map(e => e.id === exId ? updated : e));
      setEditingFewShot(null);
    } catch (err: any) {
      setError("Few-Shot aktualisieren fehlgeschlagen: " + err.message);
    }
  }

  async function handleDeleteFewShot(exId: number) {
    if (!confirm("Beispiel wirklich löschen?")) return;
    try {
      await deleteFewShotExample(nb.id, exId);
      setFewShotExamples(prev => prev.filter(e => e.id !== exId));
    } catch (err: any) {
      setError("Few-Shot löschen fehlgeschlagen: " + err.message);
    }
  }

  return (
    <div className="wf-edit-form">
      {/* Tabs */}
      <div className="wf-tabs">
        {(["einreichung", "ibn", "kommunikation", "fewshot"] as const).map(tab => (
          <button
            key={tab}
            className={`wf-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "einreichung" ? "Einreichung" : tab === "ibn" ? "IBN" : tab === "kommunikation" ? "Kommunikation" : `Few-Shot (${nb.fewShotCount})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="wf-error">
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError(null)}><X size={12} /></button>
        </div>
      )}

      {/* Einreichung Tab */}
      {activeTab === "einreichung" && (
        <div className="wf-section">
          <div className="wf-field">
            <label>Einreich-Methode</label>
            <select value={einreichMethode} onChange={e => setEinreichMethode(e.target.value)}>
              <option value="">-- nicht gesetzt --</option>
              <option value="EMAIL">EMAIL</option>
              <option value="PORTAL">PORTAL</option>
              <option value="POST">POST</option>
              <option value="FAX">FAX</option>
            </select>
          </div>
          <div className="wf-field">
            <label>Einreich-Email</label>
            <input type="email" value={einreichEmail} onChange={e => setEinreichEmail(e.target.value)} placeholder="netzanschluss@nb.de" />
          </div>
          <div className="wf-field">
            <label>Betreff-Format</label>
            <input value={einreichBetreffFormat} onChange={e => setEinreichBetreffFormat(e.target.value)} placeholder="Anmeldung PV-Anlage {kundenname}" />
          </div>
          <div className="wf-field">
            <label>Pflichtdokumente</label>
            <TagInput value={pflichtDokumente} onChange={setPflichtDokumente} suggestions={docSuggestions} placeholder="Dokument-Code eingeben..." />
          </div>
          <div className="wf-field">
            <label>Antwort-Kanal</label>
            <select value={antwortKanal} onChange={e => setAntwortKanal(e.target.value)}>
              <option value="">-- nicht gesetzt --</option>
              <option value="EMAIL">EMAIL</option>
              <option value="PORTAL">PORTAL</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div className="wf-field-row">
            <div className="wf-field">
              <label>Nachhak-Schwelle (Tage)</label>
              <input type="number" min="1" value={nachhakSchwelleTage} onChange={e => setNachhakSchwelleTage(e.target.value)} placeholder="z.B. 14" />
            </div>
            <div className="wf-field">
              <label>Eskalation-Schwelle (Tage)</label>
              <input type="number" min="1" value={eskalationSchwelleTage} onChange={e => setEskalationSchwelleTage(e.target.value)} placeholder="z.B. 30" />
            </div>
          </div>
        </div>
      )}

      {/* IBN Tab */}
      {activeTab === "ibn" && (
        <div className="wf-section">
          <div className="wf-field">
            <label>IBN-Methode</label>
            <select value={ibnMethode} onChange={e => setIbnMethode(e.target.value)}>
              <option value="">-- nicht gesetzt --</option>
              <option value="PORTAL">PORTAL</option>
              <option value="EMAIL">EMAIL</option>
              <option value="POST">POST</option>
              <option value="FORMULAR">FORMULAR</option>
            </select>
          </div>
          <div className="wf-field wf-checkbox-field">
            <label>
              <input type="checkbox" checked={ibnImGleichenPortal} onChange={e => setIbnImGleichenPortal(e.target.checked)} />
              Im gleichen Portal wie Einreichung
            </label>
          </div>
          <div className="wf-field">
            <label>IBN Portal-URL</label>
            <input value={ibnPortalUrl} onChange={e => setIbnPortalUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="wf-field">
            <label>IBN-Schritte (ein Schritt pro Zeile)</label>
            <textarea rows={4} value={ibnSchritte} onChange={e => setIbnSchritte(e.target.value)} placeholder={"1. Portal einloggen\n2. IBN-Antrag starten\n3. Zählerstand eingeben"} />
          </div>
          <div className="wf-field">
            <label>IBN-Dokumente</label>
            <TagInput value={ibnDokumente} onChange={setIbnDokumente} suggestions={docSuggestions} placeholder="Dokument-Code eingeben..." />
          </div>
          <div className="wf-field">
            <label>Zählerantrag Formular-URL</label>
            <input value={zaehlerantragFormularUrl} onChange={e => setZaehlerantragFormularUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="wf-field">
            <label>Zählerantrag Einreich-Methode</label>
            <select value={zaehlerantragEinreichMethode} onChange={e => setZaehlerantragEinreichMethode(e.target.value)}>
              <option value="">-- nicht gesetzt --</option>
              <option value="PORTAL">PORTAL</option>
              <option value="EMAIL">EMAIL</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div className="wf-field">
            <label>Zählerantrag Einreich-Adresse</label>
            <input value={zaehlerantragEinreichAdresse} onChange={e => setZaehlerantragEinreichAdresse(e.target.value)} placeholder="Email oder Postadresse" />
          </div>
          <div className="wf-field wf-checkbox-field">
            <label>
              <input type="checkbox" checked={mastrVorIbn} onChange={e => setMastrVorIbn(e.target.checked)} />
              MaStR-Eintragung vor IBN erforderlich
            </label>
          </div>
        </div>
      )}

      {/* Kommunikation Tab */}
      {activeTab === "kommunikation" && (
        <div className="wf-section">
          <div className="wf-field">
            <label>Tonalität</label>
            <select value={tonalitaet} onChange={e => setTonalitaet(e.target.value)}>
              <option value="">-- nicht gesetzt --</option>
              <option value="FORMELL">FORMELL</option>
              <option value="NEUTRAL">NEUTRAL</option>
              <option value="FREUNDLICH">FREUNDLICH</option>
            </select>
          </div>
          <div className="wf-field">
            <label>Anrede</label>
            <input value={anrede} onChange={e => setAnrede(e.target.value)} placeholder="Sehr geehrte Damen und Herren" />
          </div>
          <div className="wf-field">
            <label>Grußformel</label>
            <input value={grussformel} onChange={e => setGrussformel(e.target.value)} placeholder="Mit freundlichen Grüßen" />
          </div>
          <div className="wf-field">
            <label>Sprachbesonderheiten</label>
            <TagInput value={sprachBesonderheiten} onChange={setSprachBesonderheiten} placeholder="z.B. 'Duzen erlaubt'" />
          </div>
          <div className="wf-field">
            <label>Kontakte</label>
            <KontakteEditor value={kontakte} onChange={setKontakte} />
          </div>
          <div className="wf-field">
            <label>Notizen</label>
            <textarea rows={4} value={notizen} onChange={e => setNotizen(e.target.value)} placeholder="Freitext-Notizen zum NB..." />
          </div>
        </div>
      )}

      {/* Few-Shot Tab */}
      {activeTab === "fewshot" && (
        <div className="wf-section">
          {fewShotLoading ? (
            <div className="wf-loading"><Loader2 size={20} className="animate-spin" /> Lade Beispiele...</div>
          ) : (
            <>
              {/* Bestehende Beispiele */}
              {fewShotExamples.map(ex => (
                <div key={ex.id} className="wf-fewshot-card">
                  {editingFewShot === ex.id ? (
                    <FewShotEditInline
                      example={ex}
                      onSave={(data) => handleUpdateFewShot(ex.id, data)}
                      onCancel={() => setEditingFewShot(null)}
                    />
                  ) : (
                    <>
                      <div className="wf-fewshot-header">
                        <span className={`wf-fewshot-typ wf-fewshot-typ-${ex.typ}`}>
                          {FEW_SHOT_TYP_LABELS[ex.typ] || ex.typ}
                        </span>
                        {ex.rating && (
                          <span className="wf-fewshot-rating">
                            {Array.from({ length: ex.rating }, (_, i) => <Star key={i} size={10} className="wf-star-filled" />)}
                          </span>
                        )}
                        <div className="wf-fewshot-actions">
                          <button onClick={() => setEditingFewShot(ex.id)} title="Bearbeiten"><Pencil size={12} /></button>
                          <button onClick={() => handleDeleteFewShot(ex.id)} title="Löschen" className="wf-fewshot-delete"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="wf-fewshot-preview">
                        <div className="wf-fewshot-label">Eingehend:</div>
                        <div className="wf-fewshot-text">{ex.eingehend.length > 200 ? ex.eingehend.slice(0, 200) + "..." : ex.eingehend}</div>
                      </div>
                      {ex.analyse && (
                        <div className="wf-fewshot-preview">
                          <div className="wf-fewshot-label">Analyse:</div>
                          <div className="wf-fewshot-text">{ex.analyse}</div>
                        </div>
                      )}
                      {ex.antwort && (
                        <div className="wf-fewshot-preview">
                          <div className="wf-fewshot-label">Antwort:</div>
                          <div className="wf-fewshot-text">{ex.antwort.length > 200 ? ex.antwort.slice(0, 200) + "..." : ex.antwort}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Neues Beispiel */}
              {showNewFewShot ? (
                <div className="wf-fewshot-card wf-fewshot-new">
                  <div className="wf-field">
                    <label>Typ</label>
                    <select value={newFewShot.typ} onChange={e => setNewFewShot(prev => ({ ...prev, typ: e.target.value }))}>
                      {FEW_SHOT_TYP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="wf-field">
                    <label>Email vom NB (eingehend) *</label>
                    <textarea rows={4} value={newFewShot.eingehend} onChange={e => setNewFewShot(prev => ({ ...prev, eingehend: e.target.value }))} placeholder="Originaltext der Email vom NB..." />
                  </div>
                  <div className="wf-field">
                    <label>Analyse (Was bedeutet das?)</label>
                    <textarea rows={2} value={newFewShot.analyse || ""} onChange={e => setNewFewShot(prev => ({ ...prev, analyse: e.target.value }))} placeholder="Interpretation..." />
                  </div>
                  <div className="wf-field">
                    <label>Unsere Antwort</label>
                    <textarea rows={3} value={newFewShot.antwort || ""} onChange={e => setNewFewShot(prev => ({ ...prev, antwort: e.target.value }))} placeholder="Antwort-Vorlage..." />
                  </div>
                  <div className="wf-field">
                    <label>Bewertung</label>
                    <StarRating value={newFewShot.rating ?? null} onChange={v => setNewFewShot(prev => ({ ...prev, rating: v }))} />
                  </div>
                  <div className="wf-btn-row">
                    <button className="wf-btn wf-btn-primary" onClick={handleCreateFewShot} disabled={!newFewShot.eingehend.trim()}>
                      <Save size={14} /> Speichern
                    </button>
                    <button className="wf-btn wf-btn-secondary" onClick={() => { setShowNewFewShot(false); setNewFewShot({ typ: "rueckfrage", eingehend: "" }); }}>
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <button className="wf-add-btn" onClick={() => setShowNewFewShot(true)}>
                  <Plus size={14} /> Neues Beispiel hinzufügen
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Speichern/Abbrechen (nur für Workflow-Tabs, nicht Few-Shot) */}
      {activeTab !== "fewshot" && (
        <div className="wf-btn-row wf-btn-row-main">
          <button className="wf-btn wf-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Speichere..." : "Workflow speichern"}
          </button>
          <button className="wf-btn wf-btn-secondary" onClick={onCancel} disabled={saving}>
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
}

// Inline-Edit für bestehendes Few-Shot-Beispiel
function FewShotEditInline({
  example,
  onSave,
  onCancel,
}: {
  example: FewShotExample;
  onSave: (data: Partial<CreateFewShotData>) => void;
  onCancel: () => void;
}) {
  const [typ, setTyp] = useState(example.typ);
  const [eingehend, setEingehend] = useState(example.eingehend);
  const [analyse, setAnalyse] = useState(example.analyse || "");
  const [antwort, setAntwort] = useState(example.antwort || "");
  const [rating, setRating] = useState<number | null>(example.rating);

  return (
    <div className="wf-fewshot-edit">
      <div className="wf-field">
        <label>Typ</label>
        <select value={typ} onChange={e => setTyp(e.target.value)}>
          {FEW_SHOT_TYP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="wf-field">
        <label>Eingehend *</label>
        <textarea rows={4} value={eingehend} onChange={e => setEingehend(e.target.value)} />
      </div>
      <div className="wf-field">
        <label>Analyse</label>
        <textarea rows={2} value={analyse} onChange={e => setAnalyse(e.target.value)} />
      </div>
      <div className="wf-field">
        <label>Antwort</label>
        <textarea rows={3} value={antwort} onChange={e => setAntwort(e.target.value)} />
      </div>
      <div className="wf-field">
        <label>Bewertung</label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div className="wf-btn-row">
        <button className="wf-btn wf-btn-primary" onClick={() => onSave({ typ, eingehend, analyse, antwort, rating })} disabled={!eingehend.trim()}>
          <Save size={12} /> Speichern
        </button>
        <button className="wf-btn wf-btn-secondary" onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NB Card Komponente
// ═══════════════════════════════════════════════════════════════════════════════
function NbCard({ nb, onReload }: { nb: NbWissenEntry; onReload: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const isAdmin = (user as any)?.role?.toUpperCase() === "ADMIN";

  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const successColor = nb.successRate === null ? "" :
    nb.successRate >= 0.8 ? "success" :
    nb.successRate >= 0.5 ? "warning" : "danger";

  const maxIssueCount = Math.max(...Object.values(nb.commonIssues), 1);

  // Erstes analysiertes TAB-Dokument anzeigen
  const analyzedTab = nb.tabDocuments.find(t => t.summary !== null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiPost(`/api/nb-wissen/${nb.id}/tab-upload`, formData);
      setUploadMsg("PDF hochgeladen! Analyse laeuft... (Echtzeit-Update folgt)");
    } catch (err: any) {
      setUploadMsg("Fehler: " + (err.message || "Upload fehlgeschlagen"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleReanalyze(docId: number) {
    setUploading(true);
    setUploadMsg(null);
    try {
      await apiPost(`/api/nb-wissen/${nb.id}/tab-analyze/${docId}`, {});
      setUploadMsg("Re-Analyse erfolgreich!");
      onReload();
    } catch (err: any) {
      setUploadMsg("Fehler: " + (err.message || "Analyse fehlgeschlagen"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: number) {
    if (!confirm("TAB-Dokument wirklich loeschen?")) return;
    try {
      await apiDelete(`/api/nb-wissen/${nb.id}/tab/${docId}`);
      onReload();
    } catch (err: any) {
      setUploadMsg("Fehler: " + (err.message || "Loeschen fehlgeschlagen"));
    }
  }

  return (
    <div className={`nb-card ${expanded ? "nb-card-expanded" : ""}`}>
      {/* Header - klickbar */}
      <div className="nb-card-header" onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer" }}>
        <div className="nb-card-header-left">
          <div className="nb-card-icon"><Building2 size={18} /></div>
          <span className="nb-card-name">{nb.name}</span>
          {analyzedTab && (
            <span className="tab-has-badge" title="TAB-Zusammenfassung vorhanden">
              <FileCheck size={12} /> TAB
            </span>
          )}
        </div>
        <div className="nb-card-header-right">
          <div className="nb-card-links" onClick={e => e.stopPropagation()}>
            {nb.email && (
              <a href={`mailto:${nb.email}`} className="nb-card-link" title={nb.email}>
                <Mail size={12} /> Email
              </a>
            )}
            {nb.website && (
              <a href={nb.website} target="_blank" rel="noopener noreferrer" className="nb-card-link">
                <Globe size={12} /> Website
              </a>
            )}
            {nb.portalUrl && (
              <a href={nb.portalUrl} target="_blank" rel="noopener noreferrer" className="nb-card-link">
                <ExternalLink size={12} /> Portal
              </a>
            )}
          </div>
          <div className="nb-card-expand">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* KPI Bar - immer sichtbar */}
      <div className="nb-kpi-bar">
        <div className="nb-kpi">
          <div className="nb-kpi-value">{nb.installationCount}</div>
          <div className="nb-kpi-label">Installationen</div>
        </div>
        <div className="nb-kpi">
          <div className={`nb-kpi-value ${successColor}`}>
            {nb.successRate !== null ? `${Math.round(nb.successRate * 100)}%` : "-"}
          </div>
          <div className="nb-kpi-label">Erfolgsquote</div>
        </div>
        <div className="nb-kpi">
          <div className="nb-kpi-value">
            {nb.medianProcessingDays !== null ? `${nb.medianProcessingDays}d` : nb.avgProcessingDays !== null ? `${Math.round(nb.avgProcessingDays)}d` : "-"}
          </div>
          <div className="nb-kpi-label">{nb.medianProcessingDays !== null ? "Median Tage" : "Ø Tage"}</div>
        </div>
        <div className="nb-kpi">
          <div className={`nb-kpi-value ${nb.sofortFreigabeRate !== null ? (nb.sofortFreigabeRate >= 0.7 ? "success" : nb.sofortFreigabeRate >= 0.3 ? "warning" : "danger") : ""}`}>
            {nb.sofortFreigabeRate !== null ? `${Math.round(nb.sofortFreigabeRate * 100)}%` : "-"}
          </div>
          <div className="nb-kpi-label">Sofort-Freigabe</div>
        </div>
        <div className="nb-kpi">
          <div className="nb-kpi-value">
            {nb.rueckfrageRate !== null ? `${Math.round(nb.rueckfrageRate * 100)}%` : "-"}
          </div>
          <div className="nb-kpi-label">Rückfragequote</div>
        </div>
        {nb.genehmigungsTyp && (
          <div className="nb-kpi">
            <div className={`nb-kpi-badge ${nb.genehmigungsTyp === "SCHNELL" ? "badge-green" : nb.genehmigungsTyp === "STANDARD" ? "badge-blue" : nb.genehmigungsTyp === "LANGSAM" ? "badge-orange" : "badge-red"}`}>
              {nb.genehmigungsTyp}
            </div>
            <div className="nb-kpi-label">Typ</div>
          </div>
        )}
      </div>

      {/* Expandierter Bereich */}
      {expanded && (
        <div className="nb-card-body">
          {/* Edit Button (Admin only) */}
          {isAdmin && !editing && (
            <div className="wf-edit-header">
              <button className="wf-edit-btn" onClick={() => setEditing(true)}>
                <Pencil size={14} /> Workflow bearbeiten
              </button>
            </div>
          )}

          {/* Edit Modus */}
          {editing && (
            <WorkflowEditForm
              nb={nb}
              onSave={() => { setEditing(false); onReload(); }}
              onCancel={() => setEditing(false)}
            />
          )}

          {/* Read-Only Workflow-Daten */}
          {!editing && <WorkflowReadOnly nb={nb} />}

          {/* TAB-Zusammenfassung */}
          {!editing && analyzedTab?.summary && (
            <div className="nb-section">
              <div className="nb-section-title">
                <BookOpen size={12} style={{ display: "inline", marginRight: 4 }} />
                TAB-Zusammenfassung ({analyzedTab.originalName})
              </div>
              <TabSummaryView summary={analyzedTab.summary} />
            </div>
          )}

          {/* Admin: TAB Upload + Verwaltung */}
          {!editing && isAdmin && (
            <div className="nb-section">
              <div className="nb-section-title">
                <FileText size={12} style={{ display: "inline", marginRight: 4 }} />
                TAB-Dokumente verwalten
              </div>

              {/* Upload */}
              <div className="tab-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  style={{ display: "none" }}
                  id={`tab-upload-${nb.id}`}
                />
                <button
                  className="tab-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? "Wird verarbeitet..." : "TAB-PDF hochladen"}
                </button>
                {uploadMsg && (
                  <span className={`tab-upload-msg ${uploadMsg.startsWith("Fehler") ? "error" : ""}`}>
                    {uploadMsg}
                  </span>
                )}
              </div>

              {/* Bestehende Dokumente */}
              {nb.tabDocuments.length > 0 && (
                <div className="tab-doc-list">
                  {nb.tabDocuments.map(doc => (
                    <div key={doc.id} className="tab-doc-row">
                      <FileText size={14} />
                      <span className="tab-doc-name-text">{doc.originalName}</span>
                      {doc.analyzedAt && (
                        <span className="tab-doc-date">Analysiert: {formatDate(doc.analyzedAt)}</span>
                      )}
                      {doc.analysisError && !doc.summary && (
                        <span className="tab-doc-error" title={doc.analysisError}>Fehler</span>
                      )}
                      <button
                        className="tab-doc-action"
                        onClick={() => handleReanalyze(doc.id)}
                        title="Erneut analysieren"
                      >
                        <RefreshCw size={12} />
                      </button>
                      <button
                        className="tab-doc-action tab-doc-action-delete"
                        onClick={() => handleDelete(doc.id)}
                        title="Loeschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bearbeitungszeit-Details */}
          {!editing && (nb.medianProcessingDays !== null || nb.avgProcessingDays !== null) && (
            <div className="nb-section">
              <div className="nb-section-title">
                <Clock size={12} style={{ display: "inline", marginRight: 4 }} />
                Bearbeitungszeiten
              </div>
              <div className="nb-stats-grid">
                {nb.minProcessingDays !== null && nb.maxProcessingDays !== null && (
                  <div className="nb-stat-item">
                    <span className="nb-stat-label">Bearbeitungszeit-Range</span>
                    <span className="nb-stat-value">
                      Min {nb.minProcessingDays}d — Median {nb.medianProcessingDays ?? "-"}d — Max {nb.maxProcessingDays}d
                    </span>
                  </div>
                )}
                {nb.bestResponseDay && (
                  <div className="nb-stat-item">
                    <span className="nb-stat-label">Bester Antworttag</span>
                    <span className="nb-stat-value">{nb.bestResponseDay}</span>
                  </div>
                )}
                {nb.nachhakSchwelleTage !== null && (
                  <div className="nb-stat-item">
                    <span className="nb-stat-label">Nachhak-Empfehlung</span>
                    <span className="nb-stat-value">Nach {nb.nachhakSchwelleTage} Tagen nachhaken</span>
                  </div>
                )}
                {nb.eskalationSchwelleTage !== null && (
                  <div className="nb-stat-item">
                    <span className="nb-stat-label">Eskalation</span>
                    <span className="nb-stat-value">Nach {nb.eskalationSchwelleTage} Tagen eskalieren</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Typische Rückfragen */}
          {!editing && nb.typischeRueckfragen && Object.keys(nb.typischeRueckfragen).length > 0 && (
            <div className="nb-section">
              <div className="nb-section-title">
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 4 }} />
                Typische Rückfragen
              </div>
              <div className="issue-list">
                {Object.entries(nb.typischeRueckfragen)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="issue-item">
                      <span className="issue-category">{category}</span>
                      <span className="issue-count">{count}x</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Portal-Hinweise */}
          {!editing && nb.portalHinweise && (
            <div className="nb-section">
              <div className="nb-section-title">Portal-Hinweise</div>
              <div className="tip-card">
                <div className="tip-text">{nb.portalHinweise}</div>
              </div>
            </div>
          )}

          {/* Dokument-Anforderungen */}
          {!editing && nb.documentRequirements && (
            <div className="nb-section">
              <div className="nb-section-title"><FileText size={12} style={{ display: "inline", marginRight: 4 }} />Dokumente bei genehmigten Anlagen (gelernt aus {nb.totalSubmissionsGlobal} Einreichungen)</div>
              <div className="doc-badges">
                {(nb.documentRequirements.required || []).map(d => (
                  <span key={d} className="doc-badge required">{formatDocLabel(d)}</span>
                ))}
                {(nb.documentRequirements.recommended || []).map(d => (
                  <span key={d} className="doc-badge recommended">{formatDocLabel(d)}</span>
                ))}
                {(nb.documentRequirements.optional || []).map(d => (
                  <span key={d} className="doc-badge optional">{formatDocLabel(d)}</span>
                ))}
              </div>
              <div className="doc-legend">
                <span className="doc-legend-item"><span className="doc-legend-dot required" /> Bei {">"}95% der Genehmigungen</span>
                <span className="doc-legend-item"><span className="doc-legend-dot recommended" /> Bei {">"}70% eingereicht</span>
                <span className="doc-legend-item"><span className="doc-legend-dot optional" /> Gelegentlich ({">"}30%)</span>
              </div>
            </div>
          )}

          {/* Haeufige Probleme */}
          {!editing && Object.keys(nb.commonIssues).length > 0 && (
            <div className="nb-section">
              <div className="nb-section-title"><AlertTriangle size={12} style={{ display: "inline", marginRight: 4 }} />Haeufige Probleme</div>
              <div className="issues-list">
                {Object.entries(nb.commonIssues)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <div key={category} className="issue-row">
                      <span className="issue-label">{category}</span>
                      <div className="issue-bar-bg">
                        <div
                          className="issue-bar-fill"
                          style={{ width: `${(count / maxIssueCount) * 100}%` }}
                        />
                      </div>
                      <span className="issue-count">{count}x</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Praxis-Tipps */}
          {!editing && nb.tips.length > 0 && (
            <div className="nb-section">
              <div className="nb-section-title"><Lightbulb size={12} style={{ display: "inline", marginRight: 4 }} />Praxis-Tipps</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {nb.tips.map((tip, i) => (
                  <div key={i} className="tip-card">
                    <div className="tip-text">{tip.tip}</div>
                    <div className="tip-meta">
                      <span>{tip.category}</span>
                      <span className="tip-confidence">
                        <span className="tip-confidence-bar">
                          <div className="tip-confidence-fill" style={{ width: `${tip.confidence * 100}%` }} />
                        </span>
                        {Math.round(tip.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status-Breakdown */}
          {!editing && Object.keys(nb.statusBreakdown).length > 0 && (
            <div className="nb-section">
              <div className="nb-section-title"><BarChart3 size={12} style={{ display: "inline", marginRight: 4 }} />Status meiner Anlagen</div>
              <div className="status-breakdown">
                {Object.entries(nb.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="status-chip">
                    <span className={`dot ${status}`} />
                    {STATUS_LABELS[status] || status}: {count}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Letzter Kontakt */}
          {!editing && nb.recentCorrespondences.length > 0 && (
            <div className="nb-section">
              <div className="nb-section-title"><Clock size={12} style={{ display: "inline", marginRight: 4 }} />Letzter Kontakt</div>
              <div className="activity-list">
                {nb.recentCorrespondences.slice(0, 3).map((c, i) => (
                  <div key={i} className="activity-item">
                    <span className="activity-type">{c.type}</span>
                    <span>{formatDate(c.sentAt)}</span>
                    {c.responseType && (
                      <span style={{ color: c.responseType === "GENEHMIGT" ? "#22c55e" : "#eab308" }}>
                        <CheckCircle2 size={12} style={{ display: "inline", marginRight: 2 }} />
                        {c.responseType}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Requirements */}
          {!editing && nb.specialRequirements && (
            <div className="nb-section">
              <div className="nb-section-title">Besondere Anforderungen</div>
              <div className="tip-card">
                <div className="tip-text">{nb.specialRequirements}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
