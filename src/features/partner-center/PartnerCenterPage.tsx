/**
 * PARTNER CENTER PAGE
 * 1:1 replica of the mock design, wired to real API.
 * Upload ZIP → Scan → Extract → Review → Approve
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../modules/api/client";

// ═══════════════════════════════════════════════════════════════
// COLORS — exact copy from mock
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#0a0e1a", surface: "#111827", surfaceAlt: "#0f1520",
  border: "#1e293b", borderLight: "#2a3a52",
  text: "#e2e8f0", textMuted: "#8896ab", textDim: "#5a6a80",
  accent: "#3b82f6", accentGlow: "rgba(59,130,246,0.12)",
  green: "#22c55e", greenBg: "rgba(34,197,94,0.08)", greenBorder: "rgba(34,197,94,0.2)",
  orange: "#f59e0b", orangeBg: "rgba(245,158,11,0.08)", orangeBorder: "rgba(245,158,11,0.2)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.06)",
  purple: "#f0d878", purpleBg: "rgba(167,139,250,0.08)",
  cyan: "#06b6d4",
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type JobStatus = "RECEIVED" | "EXTRACTING" | "PARSING" | "MERGING" | "REVIEW_REQUIRED" | "BILLING" | "COMPLETED" | "FAILED" | "REJECTED";
type BadgeColor = "blue" | "green" | "orange" | "red" | "purple" | "gray";

interface ApiJob {
  id: number;
  installationNumber: string | null;
  source: string;
  senderEmail: string | null;
  zipFilename: string;
  status: JobStatus;
  billingType: string | null;
  billingAmount: number | null;
  billingBasis: string | null;
  billingStatus: string;
  projectType: string | null;
  anlagentyp: string | null;
  leistungKw: number | null;
  documentsFound: number;
  documentsParsed: number;
  fieldsExtracted: number;
  confidenceScore: number | null;
  extractedData: Record<string, any> | null;
  errorMessage: string | null;
  deadlineAt: string | null;
  receivedAt: string;
  completedAt: string | null;
  documents: ApiFile[];
  comments: ApiComment[];
  factroComments: FactroComment[];
  factroProjectId: number | null;
}

interface FactroComment {
  id: number;
  creatorName: string | null;
  textPlain: string | null;
  text: string | null;
  factroCreatedAt: string;
  parentCommentId: string | null;
}

interface ApiFile {
  id: number;
  filename: string;
  documentType: string | null;
  isDuplicate: boolean;
  fieldsExtracted: number;
  status: string;
  classificationConfidence: number | null;
  extractedData: Record<string, any> | null;
}

interface ApiComment {
  id: number;
  step: string;
  category: string;
  message: string;
  authorType: string;
  authorName: string;
  createdAt: string;
  metadata: Record<string, any> | null;
}

interface ApiJobListItem {
  id: number;
  installationNumber: string | null;
  source: string;
  senderName: string | null;
  zipFilename: string;
  status: JobStatus;
  senderEmail: string | null;
  documentsFound: number;
  confidenceScore: number | null;
  billingAmount: number | null;
  receivedAt: string;
  fileCount: number;
  commentCount: number;
  anlagentyp: string | null;
  projectType: string | null;
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS — exact copy from mock
// ═══════════════════════════════════════════════════════════════

const Badge = ({ children, color = "blue" }: { children: React.ReactNode; color?: BadgeColor }) => {
  const styles: Record<BadgeColor, { bg: string; color: string; border: string }> = {
    blue: { bg: C.accentGlow, color: C.accent, border: `1px solid rgba(59,130,246,0.25)` },
    green: { bg: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` },
    orange: { bg: C.orangeBg, color: C.orange, border: `1px solid ${C.orangeBorder}` },
    red: { bg: C.redBg, color: C.red, border: `1px solid rgba(239,68,68,0.2)` },
    purple: { bg: C.purpleBg, color: C.purple, border: `1px solid rgba(167,139,250,0.2)` },
    gray: { bg: "rgba(100,116,139,0.08)", color: C.textMuted, border: "1px solid rgba(100,116,139,0.15)" },
  };
  const s = styles[color];
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", fontSize:11, fontWeight:600, letterSpacing:"0.02em", borderRadius:6, background:s.bg, color:s.color, border:s.border, whiteSpace:"nowrap" }}>{children}</span>;
};

const Field = ({ label, value, mono, accent, confidence }: { label: string; value: string | number | undefined; mono?: boolean; accent?: boolean; confidence?: number }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"5px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:12, color:C.textDim, minWidth:120 }}>{label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {confidence !== undefined && confidence < 95 && (
          <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:C.orangeBg, color:C.orange, border:`1px solid ${C.orangeBorder}` }}>{confidence}%</span>
        )}
        <span style={{ fontSize:13, fontWeight:500, color: accent ? C.accent : C.text, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", textAlign:"right" }}>{value}</span>
      </div>
    </div>
  );
};

const Card = ({ title, badge, children, glow }: { title: string; badge?: React.ReactNode; children: React.ReactNode; glow?: boolean }) => (
  <div style={{
    background: C.surface, border: `1px solid ${glow ? C.accent : C.border}`,
    borderRadius: 12, overflow: "hidden",
    boxShadow: glow ? `0 0 20px ${C.accentGlow}` : "none",
  }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px 12px", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:C.textMuted, textTransform:"uppercase" }}>{title}</span>
      {badge}
    </div>
    <div style={{ padding:"14px 18px 16px" }}>{children}</div>
  </div>
);

const FontLink = () => (
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
);

// ═══════════════════════════════════════════════════════════════
// PHASES — exact copy from mock
// ═══════════════════════════════════════════════════════════════

const PHASES = [
  { id: "upload", label: "Upload", icon: "↑" },
  { id: "scan", label: "Scanning", icon: "⊙" },
  { id: "extract", label: "Extracting", icon: "◈" },
  { id: "review", label: "Review", icon: "✓" },
];

const STATUS_TO_PHASE: Record<JobStatus, string> = {
  RECEIVED: "scan", EXTRACTING: "scan", PARSING: "extract", MERGING: "extract",
  REVIEW_REQUIRED: "review", BILLING: "review",
  COMPLETED: "review", FAILED: "review", REJECTED: "review",
};

const STATUS_TO_PROGRESS: Record<JobStatus, number> = {
  RECEIVED: 10, EXTRACTING: 30, PARSING: 50, MERGING: 70,
  REVIEW_REQUIRED: 100, BILLING: 85,
  COMPLETED: 100, FAILED: 100, REJECTED: 100,
};

const STATUS_LABELS: Record<JobStatus, string> = {
  RECEIVED: "Scanning documents...", EXTRACTING: "Scanning documents...",
  PARSING: "Extracting data...", MERGING: "Extracting data...",
  REVIEW_REQUIRED: "Review Required", BILLING: "Billing...",
  COMPLETED: "Completed", FAILED: "Failed", REJECTED: "Rejected",
};

const PROCESSING_STATUSES: JobStatus[] = ["RECEIVED", "EXTRACTING", "PARSING", "MERGING", "BILLING"];

// ═══════════════════════════════════════════════════════════════
// HELPERS: Map API data → Mock data shape
// ═══════════════════════════════════════════════════════════════

function mapDocuments(docs: ApiFile[]) {
  const TYPE_LABELS: Record<string, string> = {
    portaldaten: "Netzanfrage-Zusammenfassung",
    vollmacht_netzanfrage: "Vollmacht Netzanfrage",
    vollmacht_grundbuch: "Vollmacht Grundbuch",
    datenblatt_speicher: "Datenblatt Speicher",
    datenblatt_wr: "Datenblatt Wechselrichter",
    lageplan: "Lageplan",
    standortkarte: "Standortkarte",
    begleitmail: "Begleitmail",
  };
  return docs.map(d => ({
    id: d.id,
    name: d.filename,
    type: d.isDuplicate ? `${TYPE_LABELS[d.documentType || ""] || d.documentType || "Unbekannt"} (Duplikat)` : (TYPE_LABELS[d.documentType || ""] || d.documentType || "Unbekannt"),
    status: d.isDuplicate ? "duplicate" : (d.status === "parsed" ? "parsed" : d.status === "error" ? "error" : "parsed"),
    fields: d.fieldsExtracted || 0,
  }));
}

interface HistoryEntry {
  date: string | null;
  title: string;
  detail: string;
  status: "done" | "waiting" | "pending";
}

function buildProjectHistory(ed: Record<string, any> | null, documents: ApiFile[], job: ApiJob): HistoryEntry[] {
  const history: HistoryEntry[] = [];
  if (!ed) return history;

  // 1. Unterlagen erhalten
  const receivedDate = new Date(job.receivedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  history.push({
    date: receivedDate,
    title: "Unterlagen erhalten",
    detail: job.senderEmail ? `Per E-Mail von ${job.senderEmail}` : "Manueller Upload",
    status: "done",
  });

  // 2. Vollmachten aus Dokumenten
  const vollmachten = documents.filter(d => d.documentType?.startsWith("vollmacht"));
  for (const v of vollmachten) {
    const vData = v.extractedData || {};
    const datum = vData.unterschriftDatum || vData.datum || null;
    const ort = vData.unterschriftOrt || vData.ort || "";
    const name = ed.eigentuemerName || ed.betreiberName || "";
    const typLabel = v.documentType === "vollmacht_netzanfrage" ? "Vollmacht Netzanfrage" : v.documentType === "vollmacht_grundbuch" ? "Vollmacht Grundbuch" : "Vollmacht";
    history.push({
      date: datum,
      title: `${typLabel} unterzeichnet`,
      detail: name ? `Unterzeichnet von ${name}${ort ? ` in ${ort}` : ""}` : (ort || ""),
      status: "done",
    });
  }

  // 3. Lagepläne
  const lageplaene = documents.filter(d => d.documentType === "lageplan");
  if (lageplaene.length > 0) {
    history.push({
      date: null,
      title: "Lageplan erstellt",
      detail: "Lageplan-Export",
      status: "done",
    });
  }

  // 4. Netzanfrage gestellt (aus Portaldaten/vorgangsId ODER netzanfrageGestellt-Flag)
  const naGestellt = ed.vorgangsId || ed.netzanfrageGestellt === true || ed.netzanfrageGestellt === "true" || job.projectType === "takeover";
  if (naGestellt) {
    const nbName = ed.netzbetreiber || "NB";
    const naDetail = ed.vorgangsId
      ? `${nbName} — ${ed.vorgangsId}`
      : `Beim ${nbName} eingereicht`;
    history.push({
      date: null,
      title: "Netzanfrage gestellt",
      detail: naDetail,
      status: "done",
    });

    // Antrag eingereicht (nur wenn vorgangsId bekannt)
    if (ed.vorgangsId) {
      history.push({
        date: null,
        title: "Antrag vollständig eingereicht",
        detail: `Über ${ed.portal || "NB-Portal"}`,
        status: "done",
      });
    }
  }

  // 5. Zukünftige Schritte
  const nbName = ed.netzbetreiber || "Netzbetreiber";
  if (naGestellt) {
    history.push({
      date: null,
      title: "Netzverträglichkeitsprüfung",
      detail: `Warte auf Rückmeldung — ${nbName}`,
      status: "waiting",
    });
  }

  history.push({
    date: null,
    title: "Netzanschlusszusage",
    detail: "Ausstehend",
    status: "pending",
  });

  history.push({
    date: null,
    title: "Inbetriebnahme",
    detail: "Ausstehend",
    status: "pending",
  });

  return history;
}

function mapSystemLog(comments: ApiComment[]) {
  return comments.map(c => ({
    date: new Date(c.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    action: c.step.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    detail: c.message,
    status: c.category === "success" ? "done" : c.category === "error" ? "error" : c.category === "warning" ? "waiting" : "done",
    authorType: c.authorType,
    authorName: c.authorName,
  }));
}

function mapInstallation(ed: Record<string, any>) {
  const wrs = Array.isArray(ed.wechselrichter) ? ed.wechselrichter : [];
  const wr0 = wrs[0] || {};
  // If wechselrichter is a string (from Factro comments), use it directly
  const wrIsString = typeof ed.wechselrichter === "string";
  return {
    kunde: {
      name: (ed.eigentuemerName || "").replace(/\s*\(.*\)/, ""),
      firma: ed.eigentuemerFirma || "",
      geburtsdatum: ed.betreiberGeburtsdatum || "",
      adresse: ed.eigentuemerAdresse || [ed.eigentuemerStrasse, ed.eigentuemerPlz ? `${ed.eigentuemerPlz} ${ed.eigentuemerOrt || ""}` : ed.eigentuemerOrt].filter(Boolean).join(", ") || "",
    },
    betreiber: {
      name: ed.betreiberName || "",
      firma: ed.betreiberFirma || "",
      vertreter: ed.betreiberVertreter || "",
      adresse: [ed.betreiberStrasse, ed.betreiberPlz ? `${ed.betreiberPlz} ${ed.betreiberOrt || ""}` : ed.betreiberOrt].filter(Boolean).join(", ") || ed.betreiberAdresse || "",
      email: ed.betreiberEmail || "",
      telefon: ed.betreiberTelefon || "",
      hrb: ed.betreiberHrb || "",
    },
    standort: {
      strasse: ed.standortAdresse || ed.standortStrasse || "",
      plz: ed.standortPlz || "",
      ort: ed.standortOrt || "",
      ortsteil: ed.standortOrtsteil || "",
      bundesland: ed.standortBundesland || "",
      gemarkung: ed.gemarkung || "",
      flur: ed.flur || "",
      flurstueck: ed.flurstueck || "",
    },
    netzbetreiber: {
      name: ed.netzbetreiber || "",
      vorgangsId: ed.vorgangsId || "",
      portal: ed.portal || "",
    },
    anlage: {
      typ: ed.anlagentyp || "",
      modulleistung: ed.modulleistungKwp ? `${ed.modulleistungKwp} kWp` : "",
      modulTyp: ed.modulTyp || "",
      modulAnzahl: ed.modulAnzahl || "",
      einspeiseart: ed.einspeiseart || "",
      messkonzept: ed.messkonzept || "",
    },
    wechselrichter: {
      hersteller: wr0.hersteller || ed.wrHersteller || "",
      modell: wrIsString ? String(ed.wechselrichter) : (wr0.modell || wr0.typ || ed.wrModell || ""),
      zerezId: wr0.zerezId || "",
      anzahl: wr0.anzahl || ed["wechselrichter[0].anzahl"] || "",
      nennscheinleistung: wr0.nennscheinleistungKva ? `${wr0.nennscheinleistungKva} kVA` : "",
      gesamtscheinleistung: wr0.gesamtscheinleistungKva ? `${wr0.gesamtscheinleistungKva} kVA` : "",
      leistungKw: wr0.leistungKw ? `${wr0.leistungKw} kW` : "",
    },
    speicher: {
      hersteller: ed.speicherHersteller || "",
      modell: ed.speicherModell || "",
      typ: ed.speicherTyp || "",
      leistung: ed.speicherLeistungKw ? `${ed.speicherLeistungKw} kW` : "",
      kapazitaet: ed.speicherKapazitaetKwh ? `${ed.speicherKapazitaetKwh} kWh` : "",
      ausgangsleistung: ed.speicherLeistungKva ? `${ed.speicherLeistungKva} kVA` : (ed.speicherMaxLadeleistungKw ? `${ed.speicherMaxLadeleistungKw} kW` : ""),
      kopplung: ed.speicherKopplung || "",
    },
    // Factro-specific data
    netzanfrage: {
      gestellt: ed.netzanfrageGestellt || false,
      kannGestelltWerden: ed.netzanfrageKannGestelltWerden || false,
      hinweis: ed.netzanfrageHinweis || "",
      datum: ed.netzanfrageHinweisDatum || "",
    },
    grundbuch: {
      status: ed.grundbuchStatus || "",
    },
    datenraum: ed.datenraumLink || "",
    aktionen: Array.isArray(ed.aktionen) ? ed.aktionen : [],
  };
}

function mapConfidence(ed: Record<string, any>, overall: number | null) {
  const conf = ed.confidence || {};
  return {
    overall: conf.overall ?? overall ?? 0,
    fields: {
      standort: conf.standort ?? 0,
      betreiber: conf.betreiber ?? 0,
      anlage: conf.anlage ?? 0,
      speicher: conf.speicher ?? 0,
    },
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function relativeTime(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  return `vor ${Math.floor(h / 24)} Tagen`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// INBOX TYPES
// ═══════════════════════════════════════════════════════════════

interface InboxAttachment {
  id: number;
  filename: string;
  contentType: string;
  fileSize: number;
  isZip: boolean;
}

interface InboxEmail {
  id: number;
  fromAddress: string;
  fromName: string | null;
  subject: string;
  receivedAt: string;
  isProcessed: boolean;
  projectId: number | null;
  partnerId: number | null;
  attachments: InboxAttachment[];
}

type ViewMode = "list" | "inbox" | "upload" | "processing" | "review";

export function PartnerCenterPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [jobs, setJobs] = useState<ApiJobListItem[]>([]);
  const [job, setJob] = useState<ApiJob | null>(null);
  const [phase, setPhase] = useState("upload");
  const [progress, setProgress] = useState(0);
  const [activeDocIdx, setActiveDocIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inbox state
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxTotal, setInboxTotal] = useState(0);
  const [inboxSearch, setInboxSearch] = useState("");
  const [commentTab, setCommentTab] = useState<"all" | "notes" | "factro">("all");
  const [commentInput, setCommentInput] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  // NB-Nachfrage Draft
  const [showNbDraft, setShowNbDraft] = useState(false);
  const [nbDraft, setNbDraft] = useState<{ projektName: string; nbName: string; vorgangsId: string; standort: string; betreff: string; body: string } | null>(null);

  // Dokument-Vorschau
  const [previewDoc, setPreviewDoc] = useState<{ id: number; name: string; type: string } | null>(null);

  // ── Load list ──
  const loadJobs = useCallback(async () => {
    try {
      const res = await api.get("/partner/projects", { params: { limit: "200" } });
      setJobs(res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const loadInbox = useCallback(async (search?: string) => {
    setInboxLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (search) params.search = search;
      const res = await api.get("/partner/inbox", { params });
      setInboxEmails(res.data.data || []);
      setInboxTotal(res.data.pagination?.total || 0);
    } catch { /* silent */ }
    setInboxLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Auto-refresh list every 15s
  useEffect(() => {
    if (view !== "list") return;
    const iv = setInterval(loadJobs, 15000);
    return () => clearInterval(iv);
  }, [view, loadJobs]);

  // Load inbox when switching to inbox view
  useEffect(() => {
    if (view === "inbox") loadInbox(inboxSearch || undefined);
  }, [view, loadInbox]);

  // Auto-refresh inbox every 30s
  useEffect(() => {
    if (view !== "inbox") return;
    const iv = setInterval(() => loadInbox(inboxSearch || undefined), 30000);
    return () => clearInterval(iv);
  }, [view, loadInbox, inboxSearch]);

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Upload real file ──
  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) return;
    setView("processing");
    setPhase("scan");
    setProgress(0);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/partner/projects/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const jobId = res.data.data?.jobId;
      if (jobId) startPolling(jobId);
      else { setView("list"); loadJobs(); }
    } catch {
      setView("list"); loadJobs();
    }
    setUploading(false);
  };

  // ── Poll job status ──
  const startPolling = (jobId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/partner/projects/${jobId}`);
        const j: ApiJob = res.data.data;
        setPhase(STATUS_TO_PHASE[j.status] || "scan");
        setProgress(STATUS_TO_PROGRESS[j.status] || 0);

        if (!PROCESSING_STATUSES.includes(j.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setJob(j);
          setView("review");
          loadJobs();
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setView("list"); loadJobs();
      }
    }, 2000);
  };

  // ── Open existing job ──
  const openJob = async (jobId: number) => {
    try {
      const res = await api.get(`/partner/projects/${jobId}`);
      const j: ApiJob = res.data.data;
      if (PROCESSING_STATUSES.includes(j.status)) {
        setView("processing");
        setPhase(STATUS_TO_PHASE[j.status]);
        setProgress(STATUS_TO_PROGRESS[j.status]);
        startPolling(jobId);
      } else {
        setJob(j);
        setView("review");
      }
    } catch { /* silent */ }
  };

  // ── Approve ──
  const approveJob = async () => {
    if (!job) return;
    try {
      await api.post(`/partner/projects/${job.id}/approve`);
      const res = await api.get(`/partner/projects/${job.id}`);
      setJob(res.data.data);
      loadJobs();
    } catch { /* silent */ }
  };

  const handleSendComment = async () => {
    if (!job || !commentInput.trim() || commentSending) return;
    setCommentSending(true);
    try {
      await api.post(`/partner/projects/${job.id}/comments`, { message: commentInput.trim() });
      setCommentInput("");
      // Reload job to get fresh comments
      const res = await api.get(`/partner/projects/${job.id}`);
      setJob(res.data.data);
      setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { /* silent */ }
    setCommentSending(false);
  };

  const phaseIdx = PHASES.findIndex(p => p.id === phase);

  // ═══════════════════════════════════════════════════════════════
  // SHARED HEADER with TABS
  // ═══════════════════════════════════════════════════════════════

  const TabHeader = ({ activeTab }: { activeTab: "projekte" | "inbox" }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
      <div>
        <h1 style={{ fontSize:28, fontWeight:700, marginBottom:8 }}>Partner Center</h1>
        <div style={{ display:"flex", gap:4 }}>
          {([["projekte", "Projekte"], ["inbox", "Posteingang"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setView(key === "projekte" ? "list" : "inbox")} style={{
              padding:"6px 16px", fontSize:12, fontWeight:600,
              background: activeTab === key ? C.accent : "transparent",
              color: activeTab === key ? "#fff" : C.textMuted,
              border: `1px solid ${activeTab === key ? C.accent : C.border}`,
              borderRadius:6, cursor:"pointer", transition:"all 0.15s",
            }}>{label}</button>
          ))}
        </div>
      </div>
      <button onClick={() => setView("upload")} style={{
        padding:"10px 24px", fontSize:13, fontWeight:600,
        background:`linear-gradient(135deg, ${C.accent}, ${C.purple})`,
        color:"#fff", border:"none", borderRadius:10, cursor:"pointer",
      }}>↑ ZIP Upload</button>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // INBOX VIEW — Alle eingehenden Emails mit Anhängen
  // ═══════════════════════════════════════════════════════════════

  if (view === "inbox") {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans', system-ui, sans-serif", color:C.text }}>
        <FontLink />
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"40px 28px" }}>
          <TabHeader activeTab="inbox" />

          {/* Search */}
          <div style={{ marginBottom:20, display:"flex", gap:12, alignItems:"center" }}>
            <input
              type="text"
              placeholder="Suche nach Absender, Betreff..."
              value={inboxSearch}
              onChange={e => setInboxSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") loadInbox(inboxSearch || undefined); }}
              style={{
                flex:1, padding:"10px 14px", fontSize:13,
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                color:C.text, outline:"none",
              }}
            />
            <button onClick={() => loadInbox(inboxSearch || undefined)} style={{
              padding:"10px 20px", fontSize:12, fontWeight:600,
              background:C.accent, color:"#fff", border:"none", borderRadius:8, cursor:"pointer",
            }}>Suchen</button>
            <span style={{ fontSize:12, color:C.textDim, whiteSpace:"nowrap" }}>{inboxTotal} Emails</span>
          </div>

          {inboxLoading && <div style={{ textAlign:"center", padding:60, color:C.textDim }}>Lade Posteingang...</div>}

          {!inboxLoading && inboxEmails.length === 0 && (
            <div style={{ textAlign:"center", padding:80 }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Keine Emails vorhanden</div>
              <div style={{ fontSize:13, color:C.textDim }}>Eingehende Emails an intake@baunity.de erscheinen hier automatisch.</div>
            </div>
          )}

          {!inboxLoading && inboxEmails.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {inboxEmails.map(email => (
                <div key={email.id} style={{
                  background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
                  padding:"16px 20px", transition:"border-color 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderLight; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
                >
                  {/* Email Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:C.text }}>
                          {email.fromName || email.fromAddress}
                        </span>
                        {email.fromName && (
                          <span style={{ fontSize:11, color:C.textDim }}>&lt;{email.fromAddress}&gt;</span>
                        )}
                        {email.isProcessed && email.projectId && (
                          <Badge color="green">Projekt #{email.projectId}</Badge>
                        )}
                        {email.partnerId && <Badge color="purple">Partner</Badge>}
                      </div>
                      <div style={{ fontSize:13, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {email.subject}
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:C.textDim, whiteSpace:"nowrap", marginLeft:16 }}>
                      {relativeTime(email.receivedAt)}
                    </span>
                  </div>

                  {/* Attachments */}
                  {email.attachments.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {email.attachments.map(att => (
                        <div key={att.id} style={{
                          display:"inline-flex", alignItems:"center", gap:6,
                          padding:"4px 10px", fontSize:11, fontWeight:500,
                          background: att.isZip ? C.accentGlow : "rgba(100,116,139,0.08)",
                          color: att.isZip ? C.accent : C.textMuted,
                          border: `1px solid ${att.isZip ? "rgba(59,130,246,0.25)" : "rgba(100,116,139,0.15)"}`,
                          borderRadius:6,
                        }}>
                          <span>{att.isZip ? "📦" : "📎"}</span>
                          <span style={{ maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{att.filename}</span>
                          <span style={{ color:C.textDim }}>({formatSize(att.fileSize)})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {email.attachments.length === 0 && (
                    <div style={{ fontSize:11, color:C.textDim, fontStyle:"italic" }}>Keine Anhänge</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════

  if (view === "list") {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans', system-ui, sans-serif", color:C.text }}>
        <FontLink />
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"40px 28px" }}>
          <TabHeader activeTab="projekte" />

          {loading && <div style={{ textAlign:"center", padding:60, color:C.textDim }}>Lade...</div>}

          {!loading && jobs.length === 0 && (
            <div style={{ textAlign:"center", padding:80 }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📁</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Keine Partner-Projekte vorhanden</div>
              <div style={{ fontSize:13, color:C.textDim, marginBottom:24 }}>Laden Sie eine ZIP-Datei hoch oder warten Sie auf eingehende E-Mails.</div>
              <button onClick={() => setView("upload")} style={{ padding:"10px 24px", fontSize:13, fontWeight:600, background:C.accent, color:"#fff", border:"none", borderRadius:10, cursor:"pointer" }}>↑ Erste ZIP hochladen</button>
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    {["Nr.", "Status", "Kunde / Projekt", "Dok.", "Confidence", "Abrechnung", "Eingang", ""].map((h,i) => (
                      <th key={i} style={{ padding:"12px 16px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => {
                    const isProcessing = PROCESSING_STATUSES.includes(j.status);
                    const statusColor: BadgeColor = j.status === "COMPLETED" ? "green" : j.status === "FAILED" || j.status === "REJECTED" ? "red" : j.status === "REVIEW_REQUIRED" ? "orange" : isProcessing ? "blue" : "gray";
                    return (
                      <tr key={j.id} onClick={() => openJob(j.id)} style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:C.accent, fontFamily:"'JetBrains Mono', monospace" }}>{j.installationNumber || `#${j.id}`}</td>
                        <td style={{ padding:"12px 16px" }}><Badge color={statusColor}>{STATUS_LABELS[j.status]}</Badge></td>
                        <td style={{ padding:"12px 16px", fontSize:12, color:C.text, maxWidth:250, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.source === "factro_import" ? (j.senderName || j.zipFilename) : j.zipFilename.replace(/\.zip$/i, "")}</td>
                        <td style={{ padding:"12px 16px", fontSize:12, color:C.textMuted, textAlign:"center" }}>{j.documentsFound}</td>
                        <td style={{ padding:"12px 16px", fontSize:12 }}>
                          {j.confidenceScore != null ? <span style={{ color: j.confidenceScore >= 85 ? C.green : j.confidenceScore >= 60 ? C.orange : C.red, fontWeight:600 }}>{j.confidenceScore}%</span> : "—"}
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:12, color:C.textMuted }}>{j.billingAmount != null ? `€${j.billingAmount}` : "—"}</td>
                        <td style={{ padding:"12px 16px", fontSize:11, color:C.textDim }}>{relativeTime(j.receivedAt)}</td>
                        <td style={{ padding:"12px 16px", fontSize:12, color:C.accent, fontWeight:600 }}>→</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // UPLOAD PHASE — exact copy from mock (with real file input)
  // ═══════════════════════════════════════════════════════════════

  if (view === "upload") {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans', system-ui, sans-serif", color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <FontLink />
        <input ref={fileRef} type="file" accept=".zip" style={{ display:"none" }} onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
        <div style={{ textAlign:"center", maxWidth:480 }}>
          <div style={{ width:80, height:80, margin:"0 auto 24px", borderRadius:20, background:`linear-gradient(135deg, ${C.accent} 0%, ${C.purple} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>📁</div>
          <h1 style={{ fontSize:28, fontWeight:700, marginBottom:8 }}>Partner Center</h1>
          <p style={{ fontSize:14, color:C.textMuted, marginBottom:32, lineHeight:1.6 }}>
            Drop a project folder (ZIP) and we'll extract all data, identify documents, and create a ready-to-review project.
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentGlow; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.background = C.surfaceAlt; }}
            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.background = C.surfaceAlt; if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]); }}
            style={{
              border:`2px dashed ${C.borderLight}`, borderRadius:16, padding:"48px 32px",
              cursor:"pointer", transition:"all 0.2s",
              background: C.surfaceAlt,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentGlow; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.background = C.surfaceAlt; }}
          >
            <div style={{ fontSize:40, marginBottom:12 }}>↑</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>Click to upload or drag & drop</div>
            <div style={{ fontSize:12, color:C.textDim }}>.zip files containing PDFs, images, documents</div>
          </div>
          <button onClick={() => setView("list")} style={{ marginTop:24, padding:"8px 20px", fontSize:12, fontWeight:600, background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer" }}>
            ← Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SCANNING / EXTRACTING PHASE — exact copy from mock (real status)
  // ═══════════════════════════════════════════════════════════════

  if (view === "processing") {
    const docsProcessed = Math.max(1, Math.round(progress / 15));
    return (
      <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans', system-ui, sans-serif", color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <FontLink />
        <div style={{ textAlign:"center", maxWidth:500, width:"100%" }}>
          {/* Phase indicators */}
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:40 }}>
            {PHASES.map((p, i) => (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{
                  width:32, height:32, borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:14, fontWeight:700,
                  background: i < phaseIdx ? C.greenBg : i === phaseIdx ? C.accentGlow : "transparent",
                  border: `2px solid ${i < phaseIdx ? C.green : i === phaseIdx ? C.accent : C.textDim}`,
                  color: i < phaseIdx ? C.green : i === phaseIdx ? C.accent : C.textDim,
                  transition: "all 0.3s",
                }}>{i < phaseIdx ? "✓" : p.icon}</div>
                <span style={{ fontSize:12, fontWeight: i === phaseIdx ? 600 : 400, color: i <= phaseIdx ? C.text : C.textDim }}>{p.label}</span>
                {i < PHASES.length - 1 && <div style={{ width:24, height:1, background: i < phaseIdx ? C.green : C.border }} />}
              </div>
            ))}
          </div>

          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>
            {phase === "scan" ? "Scanning documents..." : "Extracting data..."}
          </h2>
          <p style={{ fontSize:13, color:C.textMuted, marginBottom:32 }}>
            {phase === "scan" ? "Identifying document types and structure" : "Parsing fields, matching patterns, validating data"}
          </p>

          {/* Progress bar */}
          <div style={{ background:C.surface, borderRadius:8, height:8, overflow:"hidden", marginBottom:16 }}>
            <div style={{
              height:"100%", borderRadius:8,
              background:`linear-gradient(90deg, ${C.accent}, ${C.purple})`,
              width:`${progress}%`, transition:"width 0.4s ease",
            }} />
          </div>
          <div style={{ fontSize:12, color:C.textDim, fontFamily:"'JetBrains Mono', monospace" }}>{progress}% — {docsProcessed} documents processed</div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // REVIEW PHASE — exact copy from mock (with real data)
  // ═══════════════════════════════════════════════════════════════

  if (view === "review" && job) {
    const ed = job.extractedData || {};
    const d = mapInstallation(ed);
    const documents = mapDocuments(job.documents);
    const history = buildProjectHistory(ed, job.documents, job);
    const systemLog = mapSystemLog(job.comments);
    const confidence = mapConfidence(ed, job.confidenceScore);

    // Derive title from ZIP filename (strip .zip)
    const title = job.zipFilename.replace(/\.zip$/i, "");
    const anlagenLabel = job.anlagentyp === "kleinspeicher" ? "Kleinspeicher" : job.anlagentyp === "grossspeicher" ? "Großspeicher" : job.anlagentyp === "pv" ? "PV-Anlage" : job.anlagentyp || "";
    const leistungLabel = job.leistungKw ? `${job.leistungKw} kW` : "";
    const statusIsReview = job.status === "REVIEW_REQUIRED";
    const statusIsCompleted = job.status === "COMPLETED";
    const statusIsFailed = job.status === "FAILED" || job.status === "REJECTED";

    return (
      <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans', system-ui, sans-serif", color:C.text }}>
        <FontLink />

        {/* Header — exact from mock */}
        <div style={{ background:"rgba(10,14,26,0.9)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:50 }}>
          <div style={{ maxWidth:1400, margin:"0 auto", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg, ${C.accent}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📁</div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {job.installationNumber && <span style={{ fontSize:14, fontWeight:700, color:C.accent, fontFamily:"'JetBrains Mono', monospace", background:"rgba(59,130,246,0.1)", padding:"2px 8px", borderRadius:6 }}>{job.installationNumber}</span>}
                  <span style={{ fontSize:16, fontWeight:700 }}>{title}</span>
                  {anlagenLabel && <Badge color="blue">{anlagenLabel} {leistungLabel}</Badge>}
                  <Badge color={confidence.overall >= 85 ? "green" : confidence.overall >= 60 ? "orange" : "red"}>{confidence.overall}% Confidence</Badge>
                  {statusIsReview && <Badge color="orange">● Review Required</Badge>}
                  {statusIsCompleted && <Badge color="green">✓ Completed</Badge>}
                  {statusIsFailed && <Badge color="red">✕ {job.status}</Badge>}
                </div>
                <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>{documents.length} documents processed · {job.fieldsExtracted} fields extracted · {job.zipFilename}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setJob(null); setView("list"); loadJobs(); }} style={{ padding:"8px 20px", fontSize:12, fontWeight:600, background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer" }}>← Zurück</button>
              {job.projectType === "takeover" && <button onClick={async () => {
                try {
                  const res = await api.post(`/partner/projects/${job.id}/nb-inquiry`);
                  const d = res.data.draft;
                  setNbDraft(d);
                  setShowNbDraft(true);
                } catch { /* silent */ }
              }} style={{ padding:"8px 20px", fontSize:12, fontWeight:600, background:"rgba(245,158,11,0.1)", color:C.orange, border:`1px solid ${C.orangeBorder}`, borderRadius:8, cursor:"pointer" }}>✉ NB anfragen</button>}
              {statusIsReview && <button onClick={approveJob} style={{ padding:"8px 20px", fontSize:12, fontWeight:600, background:C.accent, color:"#fff", border:"none", borderRadius:8, cursor:"pointer" }}>Genehmigen →</button>}
              {statusIsFailed && <button onClick={async () => { await api.post(`/partner/projects/${job.id}/reprocess`); setView("processing"); setPhase("scan"); setProgress(0); startPolling(job.id); }} style={{ padding:"8px 20px", fontSize:12, fontWeight:600, background:C.accent, color:"#fff", border:"none", borderRadius:8, cursor:"pointer" }}>Erneut verarbeiten</button>}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1400, margin:"0 auto", padding:"24px 28px" }}>
          {/* Abrechnung — prominent oben */}
          {job.billingType && (
            <div style={{
              marginBottom:16, padding:"16px 24px", borderRadius:12,
              background: job.projectType === "takeover" ? "rgba(245,158,11,0.06)" : C.greenBg,
              border: `1px solid ${job.projectType === "takeover" ? C.orangeBorder : C.greenBorder}`,
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ fontSize:28, fontWeight:700, color: job.projectType === "takeover" ? C.orange : C.green }}>
                  {job.billingAmount != null ? `${job.billingAmount.toFixed(2)} €` : "—"}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>
                    {job.billingType === "flat_99" ? "Pauschal — Übernahme/Nachhaken" : "Vertragsbasiert — Neueinreichung"}
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{job.billingBasis || ""}</div>
                </div>
              </div>
              <Badge color={job.billingStatus === "billed" ? "green" : "orange"}>{job.billingStatus === "billed" ? "Abgerechnet" : "Offen"}</Badge>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>

            {/* Documents Found — exact from mock */}
            <Card title="Documents Analyzed" badge={<Badge color="blue">{documents.length} files</Badge>}>
              {documents.map((doc, i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 0",
                  borderBottom: i < documents.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <div onClick={() => setPreviewDoc({ id: doc.id, name: doc.name, type: doc.type })} style={{
                    display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0, cursor:"pointer",
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:4, flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:10,
                      background: doc.status === "parsed" ? C.greenBg : doc.status === "duplicate" ? C.orangeBg : C.redBg,
                      border: `1px solid ${doc.status === "parsed" ? C.greenBorder : doc.status === "duplicate" ? C.orangeBorder : "rgba(239,68,68,0.2)"}`,
                      color: doc.status === "parsed" ? C.green : doc.status === "duplicate" ? C.orange : C.red,
                    }}>{doc.status === "parsed" ? "✓" : doc.status === "duplicate" ? "D" : "✕"}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:C.accent, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", textDecoration:"underline", textDecorationColor:"rgba(59,130,246,0.3)" }}>{doc.name}</div>
                      <div style={{ fontSize:11, color:C.textDim }}>{doc.type}{doc.fields > 0 ? ` · ${doc.fields} fields` : ""}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(`/api/partner/projects/${job.id}/documents/${doc.id}/download`, "_blank"); }}
                    title="Herunterladen"
                    style={{
                      width:28, height:28, borderRadius:6, flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      background:"transparent", border:`1px solid ${C.border}`, color:C.textMuted,
                      cursor:"pointer", fontSize:12, transition:"all 0.15s",
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = C.accent; (e.target as HTMLElement).style.color = C.accent; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = C.border; (e.target as HTMLElement).style.color = C.textMuted; }}
                  >↓</button>
                </div>
              ))}
            </Card>

            {/* Standort & Grundstück — exact from mock */}
            <Card title="Standort & Grundstück" badge={<Badge color={confidence.fields.standort >= 90 ? "green" : "orange"}>{confidence.fields.standort}%</Badge>} glow={confidence.fields.standort >= 90}>
              <Field label="Straße" value={d.standort.strasse} confidence={confidence.fields.standort} />
              <Field label="PLZ / Ort" value={[d.standort.plz, d.standort.ort].filter(Boolean).join(" ")} confidence={confidence.fields.standort} />
              {d.standort.ortsteil && <Field label="Ortsteil" value={d.standort.ortsteil} />}
              <Field label="Bundesland" value={d.standort.bundesland} />
              <Field label="Gemarkung" value={d.standort.gemarkung} confidence={confidence.fields.standort} />
              <Field label="Flur" value={d.standort.flur} mono />
              <Field label="Flurstück" value={d.standort.flurstueck} mono />
              {ed.sources && (
                <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, background:C.accentGlow, border:`1px solid rgba(59,130,246,0.15)`, fontSize:12, color:C.accent }}>
                  📍 Source: {[...new Set(Object.values(ed.sources as Record<string, string>).filter((v: string) => v.includes("portaldaten") || v.includes("vollmacht")).map((v: string) => v.split(":")[0]))].join(" + ")}
                </div>
              )}
            </Card>

            {/* Netzbetreiber & Vorgang */}
            <Card title="Netzbetreiber & Vorgang" badge={d.netzanfrage.gestellt ? <Badge color="green">NA gestellt</Badge> : d.netzanfrage.kannGestelltWerden ? <Badge color="orange">NA kann gestellt werden</Badge> : undefined}>
              <Field label="Netzbetreiber" value={d.netzbetreiber.name} />
              <Field label="Vorgangs-ID" value={d.netzbetreiber.vorgangsId} mono accent />
              <Field label="Portal" value={d.netzbetreiber.portal} />
              <Field label="Einspeiseart" value={d.anlage.einspeiseart} />
              <Field label="Messkonzept" value={d.anlage.messkonzept} />
              {d.netzanfrage.hinweis && <Field label="Hinweis" value={d.netzanfrage.hinweis} />}
              {d.grundbuch.status && <Field label="Grundbuch" value={d.grundbuch.status} />}
            </Card>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16, marginBottom:16 }}>

            {/* Eigentümer */}
            <Card title="Eigentümer" badge={<Badge color="gray">Vollmacht ✓</Badge>}>
              <Field label="Name" value={d.kunde.name} />
              {d.kunde.firma && <Field label="Firma" value={d.kunde.firma} />}
              <Field label="Geb.-Datum" value={d.kunde.geburtsdatum} />
              <Field label="Adresse" value={d.kunde.adresse} />
            </Card>

            {/* Betreiber */}
            <Card title="Anlagenbetreiber" badge={<Badge color="blue">{d.betreiber.firma || d.betreiber.name || "Betreiber"}</Badge>}>
              {d.betreiber.name && <Field label="Name" value={d.betreiber.name} />}
              {d.betreiber.firma && <Field label="Firma" value={d.betreiber.firma} />}
              {d.betreiber.vertreter && <Field label="Vertreter" value={d.betreiber.vertreter} />}
              <Field label="Adresse" value={d.betreiber.adresse} />
              <Field label="E-Mail" value={d.betreiber.email} accent />
              <Field label="Telefon" value={d.betreiber.telefon} mono />
              <Field label="HRB" value={d.betreiber.hrb} mono />
            </Card>

            {/* Anlage & Wechselrichter */}
            <Card title="Anlage & Wechselrichter" badge={d.anlage.modulleistung ? <Badge color="blue">{d.anlage.modulleistung}</Badge> : undefined}>
              {d.anlage.modulleistung && <Field label="Gesamtleistung" value={d.anlage.modulleistung} />}
              {d.anlage.modulTyp && <Field label="Modultyp" value={d.anlage.modulTyp} />}
              {d.anlage.modulAnzahl && <Field label="Modulanzahl" value={`${d.anlage.modulAnzahl} Stück`} />}
              {d.wechselrichter.modell && <Field label="Wechselrichter" value={d.wechselrichter.modell} />}
              {d.wechselrichter.hersteller && <Field label="WR-Hersteller" value={d.wechselrichter.hersteller} />}
              {d.wechselrichter.zerezId && <Field label="ZEREZ-ID" value={d.wechselrichter.zerezId} mono />}
              {d.wechselrichter.anzahl && <Field label="WR-Anzahl" value={d.wechselrichter.anzahl} />}
              {d.wechselrichter.leistungKw && <Field label="WR-Leistung" value={d.wechselrichter.leistungKw} />}
              {d.anlage.einspeiseart && <Field label="Einspeiseart" value={d.anlage.einspeiseart} />}
              {d.anlage.messkonzept && <Field label="Messkonzept" value={d.anlage.messkonzept} />}
            </Card>

            {/* Speicher */}
            <Card title="Batteriespeicher" badge={d.speicher.leistung || d.speicher.typ ? <Badge color="purple">{d.speicher.typ || "Speicher"} {d.speicher.leistung}</Badge> : <Badge color="gray">Speicher</Badge>}>
              {d.speicher.typ && <Field label="Typ" value={d.speicher.typ} />}
              {d.speicher.leistung && <Field label="Leistung" value={d.speicher.leistung} />}
              {d.speicher.hersteller && <Field label="Hersteller" value={d.speicher.hersteller} />}
              {d.speicher.modell && <Field label="Modell" value={d.speicher.modell} />}
              {d.speicher.kapazitaet && <Field label="Kapazität" value={d.speicher.kapazitaet} />}
              {d.speicher.ausgangsleistung && <Field label="Ausgangsleist." value={d.speicher.ausgangsleistung} />}
              {d.speicher.kopplung && <Field label="Kopplung" value={d.speicher.kopplung} />}
              {!d.speicher.leistung && !d.speicher.hersteller && !d.speicher.modell && !d.speicher.typ && (
                <div style={{ fontSize:11, color:C.textDim, fontStyle:"italic" }}>Keine Speicherdaten vorhanden</div>
              )}
            </Card>
          </div>

          {/* Aktionen/TODOs aus Factro-Kommentaren */}
          {d.aktionen.length > 0 && (
            <div style={{ marginBottom:16, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
                Aktionen & Hinweise
                <Badge color="orange">{d.aktionen.length}</Badge>
              </div>
              {d.aktionen.map((a: string, i: number) => (
                <div key={i} style={{ fontSize:12, color:C.text, padding:"6px 0", borderBottom: i < d.aktionen.length - 1 ? `1px solid ${C.border}` : "none", lineHeight:1.5 }}>
                  {a}
                </div>
              ))}
            </div>
          )}

          {/* Datenraum-Link */}
          {d.datenraum && (
            <div style={{ marginBottom:16, background:"rgba(59,130,246,0.05)", border:`1px solid rgba(59,130,246,0.15)`, borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.accent }}>Datenraum:</span>
              <a href={d.datenraum} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.accent, textDecoration:"underline", wordBreak:"break-all" }}>{d.datenraum}</a>
            </div>
          )}

          {/* Projekt-Historie — Geschäftsprozess-Schritte */}
          <Card title="Projekt-Historie" badge={<Badge color="blue">Rekonstruiert aus Dokumenten</Badge>}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:0 }}>
              {history.map((h, i) => (
                <div key={i} style={{ display:"flex", gap:16, padding:"12px 0", borderBottom: i < history.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width:80, flexShrink:0, fontFamily:"'JetBrains Mono', monospace", fontSize:11, color: h.status === "done" ? C.textMuted : C.textDim, textAlign:"right", paddingTop:2 }}>
                    {h.date || "—"}
                  </div>
                  <div style={{
                    width:24, height:24, borderRadius:"50%", flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:700,
                    background: h.status === "done" ? C.greenBg : h.status === "waiting" ? C.orangeBg : "transparent",
                    border: `2px solid ${h.status === "done" ? C.green : h.status === "waiting" ? C.orange : C.textDim}`,
                    color: h.status === "done" ? C.green : h.status === "waiting" ? C.orange : C.textDim,
                  }}>{h.status === "done" ? "✓" : h.status === "waiting" ? "⏳" : (i + 1)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: h.status === "done" ? C.text : h.status === "waiting" ? C.orange : C.textDim }}>{h.title}</div>
                    <div style={{ fontSize:12, color:C.textDim, marginTop:1 }}>{h.detail}</div>
                  </div>
                  <Badge color={h.status === "done" ? "green" : h.status === "waiting" ? "orange" : "gray"}>
                    {h.status === "done" ? "Erledigt" : h.status === "waiting" ? "Wartend" : "Ausstehend"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Verarbeitungslog (System) — einklappbar */}
          <details style={{ marginTop:16 }}>
            <summary style={{
              cursor:"pointer", fontSize:12, fontWeight:600, color:C.textDim,
              padding:"10px 16px", background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:10, listStyle:"none", display:"flex", alignItems:"center", gap:8,
              userSelect:"none",
            }}>
              <span style={{ fontSize:10 }}>▶</span> Verarbeitungslog (System) · {systemLog.length} Einträge
            </summary>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 10px 10px", padding:"12px 16px" }}>
              {systemLog.map((s, i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"6px 0", borderBottom: i < systemLog.length - 1 ? `1px solid ${C.border}` : "none", fontSize:11 }}>
                  <span style={{ width:120, flexShrink:0, fontFamily:"'JetBrains Mono', monospace", color:C.textDim }}>{s.date}</span>
                  <span style={{ color: s.status === "done" ? C.green : s.status === "error" ? C.red : s.status === "waiting" ? C.orange : C.textMuted, fontWeight:600, width:16 }}>
                    {s.status === "done" ? "✓" : s.status === "error" ? "✕" : s.status === "waiting" ? "!" : "·"}
                  </span>
                  <span style={{ color:C.textMuted, flex:1 }}>{s.detail}</span>
                </div>
              ))}
            </div>
          </details>

          {/* Confidence Summary — exact from mock */}
          <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:16 }}>
            {[
              { label: "Overall", value: confidence.overall, color: confidence.overall >= 85 ? C.green : C.orange },
              { label: "Standort", value: confidence.fields.standort, color: confidence.fields.standort >= 85 ? C.green : C.orange },
              { label: "Betreiber", value: confidence.fields.betreiber, color: confidence.fields.betreiber >= 85 ? C.green : C.orange },
              { label: "Anlage", value: confidence.fields.anlage, color: confidence.fields.anlage >= 85 ? C.green : C.orange },
              { label: "Speicher", value: confidence.fields.speicher, color: confidence.fields.speicher >= 85 ? C.green : C.orange },
            ].map((c, i) => (
              <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{c.label}</div>
                <div style={{ fontSize:28, fontWeight:700, color:c.color }}>{c.value}%</div>
                <div style={{ fontSize:10, color:C.textDim, marginTop:2 }}>confidence</div>
              </div>
            ))}
          </div>

          {/* ═══════ KOMMENTAR-PANEL ═══════ */}
          <div style={{ marginTop:16, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}` }}>
              {(["all", "notes", ...(job.factroComments?.length ? ["factro" as const] : [])] as const).map(tab => (
                <button key={tab} onClick={() => setCommentTab(tab as any)} style={{
                  flex:1, padding:"12px 18px", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
                  background: commentTab === tab ? C.accentGlow : "transparent",
                  color: commentTab === tab ? C.accent : C.textDim,
                  border:"none", borderBottom: commentTab === tab ? `2px solid ${C.accent}` : "2px solid transparent",
                  cursor:"pointer", transition:"all 0.15s",
                }}>{tab === "all" ? `System (${job.comments.length})` : tab === "notes" ? `Notizen (${job.comments.filter(c => c.authorType === "user" || c.authorType === "partner").length})` : `Factro (${job.factroComments?.length || 0})`}</button>
              ))}
            </div>

            {/* Timeline */}
            <div style={{ maxHeight:500, overflowY:"auto", padding:"12px 16px" }}>
              {/* Factro Comments Tab */}
              {commentTab === "factro" && job.factroComments?.map((fc, i, arr) => {
                const dt = new Date(fc.factroCreatedAt);
                const ts = `${dt.toLocaleDateString("de-DE")} ${dt.toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit" })}`;
                const isReply = !!fc.parentCommentId;
                const plainText = fc.textPlain || fc.text?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";
                return (
                  <div key={fc.id} style={{
                    display:"flex", gap:10, padding:"8px 0",
                    borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                    marginLeft: isReply ? 24 : 0,
                  }}>
                    <div style={{
                      width:28, height:28, borderRadius:"50%", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:700,
                      background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:C.orange,
                    }}>{(fc.creatorName || "?").substring(0, 2).toUpperCase()}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:11, fontWeight:600, color:C.orange }}>{fc.creatorName || "Factro"}</span>
                        {isReply && <span style={{ fontSize:9, padding:"1px 6px", borderRadius:4, background:"rgba(100,116,139,0.08)", color:C.textDim }}>Antwort</span>}
                        <span style={{ fontSize:10, color:C.textDim, marginLeft:"auto", flexShrink:0, fontFamily:"'JetBrains Mono', monospace" }}>{ts}</span>
                      </div>
                      <div style={{ fontSize:12, color:C.text, marginTop:2, lineHeight:1.5, whiteSpace:"pre-wrap" }}>{plainText}</div>
                    </div>
                  </div>
                );
              })}

              {/* System/Notes Comments */}
              {commentTab !== "factro" && job.comments
                .filter(c => commentTab === "all" || c.authorType === "user" || c.authorType === "partner")
                .map((c, i, arr) => {
                  const isAi = c.authorType === "ai";
                  const isUser = c.authorType === "user";
                  const isPartner = c.authorType === "partner";
                  const isSystem = !isAi && !isUser && !isPartner;
                  const catColor = c.category === "success" ? C.green : c.category === "warning" ? C.orange : c.category === "error" ? C.red : c.category === "action" ? C.purple : C.accent;
                  const dt = new Date(c.createdAt);
                  const ts = `${dt.toLocaleDateString("de-DE")} ${dt.toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit" })}`;

                  return (
                    <div key={c.id} style={{
                      display:"flex", gap:10, padding: isSystem ? "4px 0" : "8px 0",
                      borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                      background: isAi ? "rgba(167,139,250,0.04)" : isPartner ? "rgba(245,158,11,0.04)" : "transparent",
                      borderRadius:6, marginBottom:2,
                      ...(isAi || isUser || isPartner ? { padding:"8px 8px" } : {}),
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: isSystem ? 20 : 28, height: isSystem ? 20 : 28, borderRadius:"50%", flexShrink:0,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize: isSystem ? 9 : 11, fontWeight:700,
                        background: isAi ? C.purpleBg : isUser ? C.accentGlow : isPartner ? C.orangeBg : "rgba(100,116,139,0.1)",
                        border: `1px solid ${isAi ? "rgba(167,139,250,0.3)" : isUser ? "rgba(59,130,246,0.3)" : isPartner ? C.orangeBorder : "rgba(100,116,139,0.2)"}`,
                        color: isAi ? C.purple : isUser ? C.accent : isPartner ? C.orange : C.textDim,
                      }}>{isSystem ? "\u2699" : isAi ? "\u{1F916}" : isPartner ? "\u{1F3E2}" : (c.authorName || "U").substring(0, 2).toUpperCase()}</div>

                      <div style={{ flex:1, minWidth:0 }}>
                        {/* Header */}
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          <span style={{ fontSize: isSystem ? 10 : 11, fontWeight:600, color: isAi ? C.purple : isUser ? C.accent : isPartner ? C.orange : C.textDim }}>{c.authorName || "System"}</span>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:catColor, flexShrink:0 }} />
                          <span style={{ fontSize:9, padding:"1px 6px", borderRadius:4, background:"rgba(100,116,139,0.08)", color:C.textDim, fontFamily:"'JetBrains Mono', monospace" }}>{c.step.replace(/_/g, " ")}</span>
                          <span style={{ fontSize:10, color:C.textDim, marginLeft:"auto", flexShrink:0, fontFamily:"'JetBrains Mono', monospace" }}>{ts}</span>
                        </div>
                        {/* Message */}
                        <div style={{ fontSize: isSystem ? 11 : 12, color: isSystem ? C.textDim : C.text, marginTop:2, lineHeight:1.4 }}>{c.message}</div>
                        {/* Metadata (collapsible for AI) */}
                        {isAi && c.metadata && Object.keys(c.metadata).length > 0 && (
                          <details style={{ marginTop:4 }}>
                            <summary style={{ fontSize:10, color:C.textDim, cursor:"pointer", userSelect:"none" }}>Metadata</summary>
                            <pre style={{ fontSize:9, color:C.textDim, background:"rgba(0,0,0,0.2)", padding:6, borderRadius:4, marginTop:4, overflow:"auto", maxHeight:120 }}>{JSON.stringify(c.metadata, null, 2)}</pre>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              <div ref={commentEndRef} />
            </div>

            {/* Eingabe */}
            <div style={{ display:"flex", gap:8, padding:"12px 16px", borderTop:`1px solid ${C.border}`, background:C.surfaceAlt }}>
              <input
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && commentInput.trim()) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                placeholder="Kommentar schreiben..."
                style={{
                  flex:1, padding:"8px 12px", fontSize:12, background:C.bg, color:C.text,
                  border:`1px solid ${C.border}`, borderRadius:8, outline:"none",
                }}
              />
              <button
                onClick={handleSendComment}
                disabled={!commentInput.trim() || commentSending}
                style={{
                  padding:"8px 16px", fontSize:11, fontWeight:600, borderRadius:8,
                  background: commentInput.trim() ? C.accent : C.border, color:"#fff",
                  border:"none", cursor: commentInput.trim() ? "pointer" : "default", opacity: commentSending ? 0.5 : 1,
                }}
              >{commentSending ? "..." : "Senden"}</button>
            </div>
          </div>

          {/* Action Bar — exact from mock */}
          {statusIsReview && (
            <div style={{
              marginTop:24, padding:"20px 24px", background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Projekt genehmigen?</div>
                <div style={{ fontSize:12, color:C.textDim }}>Alle extrahierten Daten werden gespeichert und das Projekt als abgeschlossen markiert.</div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => { setJob(null); setView("list"); }} style={{ padding:"10px 24px", fontSize:13, fontWeight:600, background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer" }}>
                  Edit Before Saving
                </button>
                <button onClick={approveJob} style={{
                  padding:"10px 28px", fontSize:13, fontWeight:600,
                  background:`linear-gradient(135deg, ${C.green} 0%, #16a34a 100%)`,
                  color:"#fff", border:"none", borderRadius:8, cursor:"pointer",
                }}>
                  ✓ Genehmigen
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Dokument-Vorschau Modal */}
        {previewDoc && job && (
          <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)" }} onClick={() => setPreviewDoc(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, width:"90vw", height:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{previewDoc.name}</span>
                  <Badge color="blue">{previewDoc.type}</Badge>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => window.open(`/api/partner/projects/${job.id}/documents/${previewDoc.id}/download`, "_blank")} style={{ padding:"6px 14px", fontSize:11, fontWeight:600, background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer" }}>↓ Download</button>
                  <button onClick={() => setPreviewDoc(null)} style={{ background:"none", border:"none", color:C.textDim, fontSize:20, cursor:"pointer", padding:"0 4px" }}>✕</button>
                </div>
              </div>
              <div style={{ flex:1, overflow:"hidden", background:"#1a1a2e" }}>
                {previewDoc.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                  <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                    <img src={`/api/partner/projects/${job.id}/documents/${previewDoc.id}/preview`} alt={previewDoc.name} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", borderRadius:8 }} />
                  </div>
                ) : (
                  <iframe src={`/api/partner/projects/${job.id}/documents/${previewDoc.id}/preview`} style={{ width:"100%", height:"100%", border:"none" }} title={previewDoc.name} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* NB-Nachfrage Draft Modal */}
        {showNbDraft && nbDraft && (
          <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} onClick={() => setShowNbDraft(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, maxWidth:700, width:"95%", maxHeight:"85vh", overflow:"auto", padding:0 }}>
              <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text }}>NB-Nachfrage — {nbDraft.projektName}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>An: {nbDraft.nbName} {nbDraft.vorgangsId ? `· ${nbDraft.vorgangsId}` : ""}</div>
                </div>
                <button onClick={() => setShowNbDraft(false)} style={{ background:"none", border:"none", color:C.textDim, fontSize:20, cursor:"pointer" }}>✕</button>
              </div>
              <div style={{ padding:"16px 24px" }}>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Betreff</div>
                  <div style={{ fontSize:13, color:C.text, padding:"8px 12px", background:C.surfaceAlt, borderRadius:8, border:`1px solid ${C.border}` }}>{nbDraft.betreff}</div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Von</div>
                  <div style={{ fontSize:12, color:C.accent }}>netzanmeldung@lecagmbh.de</div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Nachricht</div>
                  <pre style={{ fontSize:12, color:C.text, lineHeight:1.6, padding:"12px 16px", background:C.surfaceAlt, borderRadius:8, border:`1px solid ${C.border}`, whiteSpace:"pre-wrap", fontFamily:"'DM Sans', sans-serif", margin:0 }}>{nbDraft.body}</pre>
                </div>
              </div>
              <div style={{ padding:"12px 24px 20px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"flex-end", gap:10 }}>
                <button onClick={() => setShowNbDraft(false)} style={{ padding:"8px 20px", fontSize:12, fontWeight:600, background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer" }}>Abbrechen</button>
                <button onClick={() => { navigator.clipboard.writeText(nbDraft.body); }} style={{ padding:"8px 20px", fontSize:12, fontWeight:600, background:"rgba(59,130,246,0.1)", color:C.accent, border:`1px solid rgba(59,130,246,0.25)`, borderRadius:8, cursor:"pointer" }}>Kopieren</button>
                <button onClick={() => { window.open(`mailto:?subject=${encodeURIComponent(nbDraft.betreff)}&body=${encodeURIComponent(nbDraft.body)}`); }} style={{ padding:"8px 20px", fontSize:12, fontWeight:600, background:`linear-gradient(135deg, ${C.orange}, #ea580c)`, color:"#fff", border:"none", borderRadius:8, cursor:"pointer" }}>✉ In Mail-Client öffnen</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return null;
}

export default PartnerCenterPage;
