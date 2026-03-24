/**
 * useEmailCenter — Custom Hook
 * Kapselt State-Management, API-Calls und Sidebar-Daten
 * für den 3-Spalten Email-Client.
 *
 * Daten-Pipeline (useMemo-Kette):
 *   emails (raw) → chipFiltered → sorted (server) → grouped
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { api } from "../../../../../modules/api/client";
import { groupEmails } from "./grouping";
import type {
  InboxEmail,
  EmailDetail,
  SentEmail,
  ComposeState,
  Mailbox,
  CustomerFolder,
  SidebarFilter,
  SortBy,
  SortOrder,
  GroupMode,
  FilterChipId,
  EmailGroup,
  VnbSummary,
  EscalationItem,
  AutoReplyDraft,
} from "./types";

const PAGE_SIZE = 200;

export function useEmailCenter() {
  // ─── Sidebar ──────────────────────────────────────────────
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [customerFolders, setCustomerFolders] = useState<CustomerFolder[]>([]);
  const [sidebarCounts, setSidebarCounts] = useState({
    total: 0,
    unread: 0,
    unassigned: 0,
  });

  // ─── Filter (von Sidebar gesteuert) ──────────────────────
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>({ type: "all" });
  const [search, setSearch] = useState("");

  // ─── Sort / Group / Chips ────────────────────────────────
  const [sortBy, setSortBy] = useState<SortBy>("receivedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [groupMode, setGroupMode] = useState<GroupMode>("date");
  const [activeChips, setActiveChips] = useState<Set<FilterChipId>>(new Set());

  // ─── Batch-Auswahl ──────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ─── Inbox-Emails ─────────────────────────────────────────
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ─── Sent-Emails ──────────────────────────────────────────
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);

  // ─── Detail-Ansicht ───────────────────────────────────────
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [emailDetail, setEmailDetail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // ─── VNB-Summary ─────────────────────────────────────────
  const [vnbSummaries, setVnbSummaries] = useState<VnbSummary[]>([]);

  // ─── Eskalationen ───────────────────────────────────────
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [escalationsLoading, setEscalationsLoading] = useState(false);

  // ─── Auto-Reply ─────────────────────────────────────────
  const [autoReplyDraft, setAutoReplyDraft] = useState<AutoReplyDraft | null>(null);
  const [autoReplyLoading, setAutoReplyLoading] = useState(false);

  // ─── Modals ───────────────────────────────────────────────
  const [assignTarget, setAssignTarget] = useState<InboxEmail | null>(null);
  const [compose, setCompose] = useState<ComposeState | null>(null);

  // Refs für stale-closure-sichere Zugriffe
  const filterRef = useRef(activeFilter);
  filterRef.current = activeFilter;
  const searchRef = useRef(search);
  searchRef.current = search;
  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;
  const sortOrderRef = useRef(sortOrder);
  sortOrderRef.current = sortOrder;

  // ─── Global CSS (einmalig injiziert) ───────────────────────
  useEffect(() => {
    if (!document.getElementById("comm-global-css")) {
      const el = document.createElement("style");
      el.id = "comm-global-css";
      el.textContent = `
/* Spinner */
@keyframes comm-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* ─── Scrollbar: dünn, dunkel, dezent ─── */
.comm-center *::-webkit-scrollbar{width:5px;height:5px}
.comm-center *::-webkit-scrollbar-track{background:transparent}
.comm-center *::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:3px}
.comm-center *::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.14)}

/* ─── Sidebar Items: Hover ─── */
.comm-sb-item:hover{background:rgba(255,255,255,0.04)!important}
.comm-sb-item{transition:background 0.15s,border-color 0.15s,color 0.15s}

/* ─── Header Chips: Hover ─── */
.comm-hchip{transition:background 0.15s,border-color 0.15s,transform 0.1s}
.comm-hchip:hover{background:rgba(255,255,255,0.08)!important;transform:translateY(-1px)}
.comm-hchip:active{transform:translateY(0)}

/* ─── Filter Chips: Hover + Transition ─── */
.comm-chip{transition:background 0.15s,border-color 0.15s,color 0.15s,box-shadow 0.15s}
.comm-chip:hover{box-shadow:0 0 0 1px rgba(255,255,255,0.1)}

/* ─── Buttons: Hover ─── */
.comm-btn:hover{filter:brightness(1.15)}
.comm-btn{transition:filter 0.12s,transform 0.1s}
.comm-btn:active{transform:scale(0.97)}

/* ─── Toolbar Buttons: Hover ─── */
.comm-tb-btn{transition:background 0.12s,border-color 0.12s,color 0.12s}
.comm-tb-btn:hover{background:rgba(255,255,255,0.08)!important;color:#e2e8f0!important}

/* ─── Action Bar Buttons: Hover ─── */
.comm-action-btn{transition:background 0.12s,border-color 0.12s,color 0.12s,transform 0.1s}
.comm-action-btn:hover{filter:brightness(1.2)}
.comm-action-btn:active{transform:scale(0.96)}

/* ─── Batch Buttons: Hover ─── */
.comm-batch-btn{transition:background 0.12s,filter 0.12s}
.comm-batch-btn:hover{filter:brightness(1.3)}

/* ─── Smooth select transitions for options ─── */
.comm-center select{transition:border-color 0.15s}
.comm-center select:focus{border-color:rgba(212,168,67,0.5);outline:none}

/* ─── Input focus ─── */
.comm-center input[type="text"]:focus,.comm-center input:not([type]):focus{border-color:rgba(212,168,67,0.4)!important;outline:none}
`;
      document.head.appendChild(el);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // DATEN-PIPELINE (useMemo-Kette)
  // ═══════════════════════════════════════════════════════════

  // 1. Chip-Filter (Client-seitig, OR-Logik)
  const chipFiltered = useMemo(() => {
    if (activeChips.size === 0) return emails;
    return emails.filter(e => {
      if (activeChips.has("unread") && !e.isRead) return true;
      if (activeChips.has("genehmigung") && e.aiType === "GENEHMIGUNG") return true;
      if (activeChips.has("rueckfrage") && e.aiType === "RUECKFRAGE") return true;
      if (activeChips.has("ablehnung") && e.aiType === "ABLEHNUNG") return true;
      if (activeChips.has("attachments") && e.hasAttachments) return true;
      if (activeChips.has("zaehlerantrag") && e.aiType === "ZAEHLERANTRAG") return true;
      if (activeChips.has("fristablauf") && e.aiType === "FRISTABLAUF") return true;
      if (activeChips.has("eingangsbestaetigung") && e.aiType === "EINGANGSBESTAETIGUNG") return true;
      if (activeChips.has("actionNeeded") && (e.aiType === "RUECKFRAGE" || e.aiType === "FRISTABLAUF" || e.aiType === "FEHLENDE_DATEN")) return true;
      if (activeChips.has("hasAutoReply") && e.hasAutoReplyDraft) return true;
      return false;
    });
  }, [emails, activeChips]);

  // 2. Gruppierung
  const grouped: EmailGroup[] = useMemo(
    () => groupEmails(chipFiltered, groupMode),
    [chipFiltered, groupMode]
  );

  // Flat list for keyboard navigation
  const flatFiltered = chipFiltered;

  // Chip-Counts (auf Basis aller Emails, nicht gefiltert)
  const chipCounts = useMemo(() => ({
    unread: emails.filter(e => !e.isRead).length,
    genehmigung: emails.filter(e => e.aiType === "GENEHMIGUNG").length,
    rueckfrage: emails.filter(e => e.aiType === "RUECKFRAGE").length,
    ablehnung: emails.filter(e => e.aiType === "ABLEHNUNG").length,
    attachments: emails.filter(e => e.hasAttachments).length,
    zaehlerantrag: emails.filter(e => e.aiType === "ZAEHLERANTRAG").length,
    fristablauf: emails.filter(e => e.aiType === "FRISTABLAUF").length,
    eingangsbestaetigung: emails.filter(e => e.aiType === "EINGANGSBESTAETIGUNG").length,
    actionNeeded: emails.filter(e => e.aiType === "RUECKFRAGE" || e.aiType === "FRISTABLAUF" || e.aiType === "FEHLENDE_DATEN").length,
    hasAutoReply: emails.filter(e => e.hasAutoReplyDraft).length,
  }), [emails]);

  // ═══════════════════════════════════════════════════════════
  // API: Sidebar-Daten laden
  // ═══════════════════════════════════════════════════════════

  const fetchSidebar = useCallback(async () => {
    try {
      const [mbRes, cfRes] = await Promise.all([
        api.get("/email-inbox/mailboxes"),
        api.get("/email-inbox/customer-folders"),
      ]);

      const mb = mbRes.data?.data;
      setMailboxes(mb?.mailboxes || []);
      setSidebarCounts({
        total: mb?.totalEmails || 0,
        unread: mb?.totalUnread || 0,
        unassigned: mb?.unassignedCount || 0,
      });

      const folders: CustomerFolder[] = cfRes.data?.data?.folders || [];
      folders.sort((a, b) =>
        (a.customerName || "").localeCompare(b.customerName || "", "de")
      );
      setCustomerFolders(folders);
    } catch (err) {
      console.error("[EmailCenter] Sidebar error:", err);
    }
  }, []);

  const fetchVnbSummaries = useCallback(async () => {
    try {
      const res = await api.get("/email-inbox/vnb-summary");
      const data: VnbSummary[] = res.data?.data || [];
      data.sort((a, b) => b.emailCount - a.emailCount);
      setVnbSummaries(data);
    } catch (err) {
      console.error("[EmailCenter] VNB summary error:", err);
    }
  }, []);

  const fetchEscalations = useCallback(async () => {
    setEscalationsLoading(true);
    try {
      const res = await api.get("/email-inbox/escalations");
      setEscalations(res.data?.data || []);
    } catch (err) {
      console.error("[EmailCenter] Escalations error:", err);
    } finally {
      setEscalationsLoading(false);
    }
  }, []);

  const fetchAutoReplyDraft = useCallback(async (emailId: number) => {
    setAutoReplyLoading(true);
    setAutoReplyDraft(null);
    try {
      const res = await api.get(`/email-inbox/${emailId}/autoreply-draft`);
      setAutoReplyDraft(res.data?.data || null);
    } catch {
      setAutoReplyDraft(null);
    } finally {
      setAutoReplyLoading(false);
    }
  }, []);

  const approveAutoReply = useCallback(async (emailId: number, body?: string) => {
    try {
      await api.post(`/email-inbox/${emailId}/approve-autoreply`, body ? { body } : {});
      setAutoReplyDraft(null);
      fetchEmails(filterRef.current, searchRef.current);
      fetchSidebar();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error || "Fehler beim Senden der Auto-Reply");
    }
  }, [fetchSidebar]); // eslint-disable-line react-hooks/exhaustive-deps

  const executeEscalation = useCallback(async (id: number) => {
    try {
      await api.post(`/email-inbox/escalations/${id}/execute`);
      fetchEscalations();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error || "Fehler beim Ausführen der Eskalation");
    }
  }, [fetchEscalations]);

  const skipEscalation = useCallback(async (id: number) => {
    try {
      await api.post(`/email-inbox/escalations/${id}/skip`);
      fetchEscalations();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error || "Fehler beim Überspringen");
    }
  }, [fetchEscalations]);

  // ═══════════════════════════════════════════════════════════
  // API: Emails laden (Inbox oder Sent)
  // ═══════════════════════════════════════════════════════════

  const fetchEmails = useCallback(async (
    filter: SidebarFilter,
    searchTerm: string,
    offset = 0,
    sort?: SortBy,
    order?: SortOrder,
  ) => {
    const isAppend = offset > 0;
    if (isAppend) setLoadingMore(true);
    else setLoading(true);

    try {
      // Sent-View: eigene API
      if (filter.type === "sent") {
        const res = await api.get("/email-center/logs", { params: { limit: PAGE_SIZE } });
        const data = res.data?.logs || res.data?.data || [];
        setSentEmails(Array.isArray(data) ? data : []);
        return;
      }

      // Inbox: Parameter zusammenbauen
      const params: Record<string, string | number | boolean> = {
        limit: PAGE_SIZE,
        offset,
        sortBy: sort || sortByRef.current,
        sortOrder: order || sortOrderRef.current,
      };

      if (filter.type === "mailbox" && filter.mailbox) {
        params.mailbox = filter.mailbox;
      } else if (filter.type === "installation" && filter.installationId) {
        params.installationId = filter.installationId;
      } else if (filter.type === "unassigned") {
        params.unassignedOnly = true;
      } else if (filter.type === "vnb" && filter.netzbetreiberId) {
        params.netzbetreiberId = filter.netzbetreiberId;
      }

      if (searchTerm.length >= 2) {
        params.search = searchTerm;
      }

      const res = await api.get("/email-inbox/emails", { params });
      const data: InboxEmail[] = res.data?.data || [];

      if (isAppend) {
        setEmails(prev => [...prev, ...data]);
      } else {
        setEmails(data);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error("[EmailCenter] Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Effects: Daten laden bei Änderungen
  // ═══════════════════════════════════════════════════════════

  // Sidebar + VNB + Eskalationen einmalig laden
  useEffect(() => {
    fetchSidebar();
    fetchVnbSummaries();
    fetchEscalations();
  }, [fetchSidebar, fetchVnbSummaries, fetchEscalations]);

  // Emails bei Filter-Wechsel neu laden + Selection zurücksetzen
  useEffect(() => {
    fetchEmails(activeFilter, search);
    setSelectedEmail(null);
    setEmailDetail(null);
    setSelectedIds(new Set());
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suche mit Debounce (300ms)
  useEffect(() => {
    if (activeFilter.type === "sent") return;
    const timer = setTimeout(() => {
      fetchEmails(activeFilter, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sort-Änderung: Emails neu laden (server-seitig)
  useEffect(() => {
    if (activeFilter.type === "sent") return;
    fetchEmails(activeFilter, search, 0, sortBy, sortOrder);
  }, [sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════
  // Aktionen
  // ═══════════════════════════════════════════════════════════

  const selectEmail = useCallback(async (email: InboxEmail) => {
    setSelectedEmail(email);
    setLoadingDetail(true);
    setAutoReplyDraft(null);
    try {
      const res = await api.get(`/emails/${email.id}`);
      const detail = res.data?.data || res.data;
      setEmailDetail(detail);
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
      // Auto-Reply-Draft laden bei Rückfrage/Fehlende Daten
      if (detail?.aiType === "RUECKFRAGE" || detail?.aiType === "FEHLENDE_DATEN" || email.hasAutoReplyDraft) {
        fetchAutoReplyDraft(email.id);
      }
    } catch (err) {
      console.error("[EmailCenter] Detail error:", err);
      setEmailDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [fetchAutoReplyDraft]);

  const deleteEmail = useCallback(async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Email wirklich löschen?")) return;

    setDeleting(id);
    try {
      await api.delete(`/email-inbox/${id}`);
      setEmails(prev => prev.filter(em => em.id !== id));
      setSelectedEmail(prev => {
        if (prev?.id === id) {
          setEmailDetail(null);
          return null;
        }
        return prev;
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error || "Fehler beim Löschen");
    } finally {
      setDeleting(null);
    }
  }, []);

  const archiveEmail = useCallback(async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/email-inbox/${id}/archive`);
      setEmails(prev => prev.filter(em => em.id !== id));
      setSelectedEmail(prev => {
        if (prev?.id === id) {
          setEmailDetail(null);
          return null;
        }
        return prev;
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error || "Fehler beim Archivieren");
    }
  }, []);

  const assignToInstallation = useCallback(async (emailId: number, installationId: number) => {
    await api.post(`/email-inbox/${emailId}/assign`, { installationId });
    setEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, assigned: true, installationId } : e)
    );
    setAssignTarget(null);
    fetchSidebar(); // Counts aktualisieren
  }, [fetchSidebar]);

  const reply = useCallback(() => {
    if (!emailDetail) return;
    const subj = emailDetail.subject || "";
    setCompose({
      mode: "reply",
      to: emailDetail.fromAddress,
      cc: "",
      subject: subj.startsWith("Re:") || subj.startsWith("RE:") ? subj : `Re: ${subj}`,
      body: "",
      originalEmailId: emailDetail.id,
      installationId: emailDetail.installationId,
      installationPublicId: emailDetail.installation?.publicId,
    });
  }, [emailDetail]);

  const composeNew = useCallback(() => {
    setCompose({ mode: "new", to: "", cc: "", subject: "", body: "", installationId: null });
  }, []);

  const afterSend = useCallback(() => {
    setCompose(null);
    fetchEmails(filterRef.current, searchRef.current);
    fetchSidebar();
  }, [fetchEmails, fetchSidebar]);

  const loadMore = useCallback(() => {
    fetchEmails(filterRef.current, searchRef.current, emails.length);
  }, [fetchEmails, emails.length]);

  const refresh = useCallback(() => {
    fetchSidebar();
    fetchEmails(filterRef.current, searchRef.current);
  }, [fetchSidebar, fetchEmails]);

  // ═══════════════════════════════════════════════════════════
  // Batch-Aktionen
  // ═══════════════════════════════════════════════════════════

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(chipFiltered.map(e => e.id)));
  }, [chipFiltered]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const batchArchive = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      await api.post("/email-inbox/batch-archive", { ids: Array.from(selectedIds) });
      setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      // Clear detail if selected email was archived
      setSelectedEmail(prev => {
        if (prev && selectedIds.has(prev.id)) {
          setEmailDetail(null);
          return null;
        }
        return prev;
      });
      fetchSidebar();
    } catch (err) {
      console.error("[EmailCenter] Batch archive error:", err);
    }
  }, [selectedIds, fetchSidebar]);

  const batchMarkRead = useCallback(async (read: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      await api.post("/email-inbox/batch-read", { ids: Array.from(selectedIds), read });
      setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, isRead: read } : e));
      setSelectedIds(new Set());
      fetchSidebar();
    } catch (err) {
      console.error("[EmailCenter] Batch read error:", err);
    }
  }, [selectedIds, fetchSidebar]);

  const batchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} Emails wirklich löschen?`)) return;
    try {
      await api.post("/email-inbox/batch-delete", { ids: Array.from(selectedIds) });
      setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      setSelectedEmail(prev => {
        if (prev && selectedIds.has(prev.id)) {
          setEmailDetail(null);
          return null;
        }
        return prev;
      });
      fetchSidebar();
    } catch (err) {
      console.error("[EmailCenter] Batch delete error:", err);
    }
  }, [selectedIds, fetchSidebar]);

  // Chip toggle
  const toggleChip = useCallback((chip: FilterChipId) => {
    setActiveChips(prev => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Return: Sauberes API für die Komponenten
  // ═══════════════════════════════════════════════════════════

  return {
    // Sidebar
    mailboxes,
    customerFolders,
    sidebarCounts,

    // Filter
    activeFilter,
    setActiveFilter,
    search,
    setSearch,

    // Sort / Group / Chips
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    groupMode,
    setGroupMode,
    activeChips,
    toggleChip,
    chipCounts,

    // Emails
    emails,
    sentEmails,
    loading,
    loadingMore,
    hasMore,
    isSentView: activeFilter.type === "sent",

    // Processed data
    chipFiltered,
    grouped,
    flatFiltered,

    // Batch
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    batchArchive,
    batchMarkRead,
    batchDelete,

    // Detail
    selectedEmail,
    emailDetail,
    loadingDetail,
    deleting,

    // Modals
    assignTarget,
    setAssignTarget,
    compose,
    setCompose,

    // VNB
    vnbSummaries,

    // Eskalationen
    escalations,
    escalationsLoading,
    executeEscalation,
    skipEscalation,

    // Auto-Reply
    autoReplyDraft,
    autoReplyLoading,
    fetchAutoReplyDraft,
    approveAutoReply,

    // Aktionen
    selectEmail,
    deleteEmail,
    archiveEmail,
    assignToInstallation,
    reply,
    composeNew,
    afterSend,
    loadMore,
    refresh,
  };
}
