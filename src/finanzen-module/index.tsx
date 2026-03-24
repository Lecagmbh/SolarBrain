// ============================================
// FINANZEN PAGE - PREMIUM EDITION
// ============================================
// Komplettes Rechnungsmanagement mit:
// - PDF Vorschau mit Auth
// - Alle Actions (Finalisieren, Versenden, Bezahlt, Löschen, Stornieren)
// - Premium Design
// - Responsive
// - Keyboard Shortcuts (Cmd+K Command Palette)
// ============================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  MoreVertical,
  Euro,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
  Ban,
  FileCheck,
  Mail,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Receipt,
  Loader2,
  Check,
  Command,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { getAccessToken } from "../modules/auth/tokenStorage";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// ============================================
// TYPES
// ============================================

type InvoiceStatus = "ENTWURF" | "OFFEN" | "VERSENDET" | "BEZAHLT" | "UEBERFAELLIG" | "STORNIERT" | "MAHNUNG";

interface Invoice {
  id: number;
  rechnungsnummer: string;
  kunde_id: number;
  kunde_name: string;
  betrag_netto: number;
  betrag_mwst: number;
  betrag_brutto: number;
  status: InvoiceStatus;
  status_label: string;
  rechnungs_datum: string;
  faellig_am: string;
  bezahlt_am?: string;
  pdf_path?: string;
  erstellt_am: string;
}

interface InvoiceDetail extends Invoice {
  beschreibung?: string;
  positionen: Array<{
    title: string;
    qty: number;
    unitNet: number;
    vatRate: number;
  }>;
  kunde?: {
    id: number;
    name: string;
    firmenName?: string;
    email?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
  };
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

// ============================================
// API HELPERS
// ============================================

const apiRequest = async <T,>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAccessToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }

  return res.json();
};

const fetchInvoices = async (): Promise<{ data: Invoice[] }> => {
  return apiRequest("/api/rechnungen?limit=500");
};

const fetchInvoiceDetail = async (id: number): Promise<InvoiceDetail> => {
  return apiRequest(`/api/rechnungen/${id}`);
};

const createInvoice = async (data: Record<string, unknown>): Promise<{ data: { id: number } }> => {
  return apiRequest("/api/rechnungen", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

const finalizeInvoice = async (id: number): Promise<unknown> => {
  return apiRequest(`/api/rechnungen/${id}/finalize`, { method: "POST" });
};

const sendInvoice = async (id: number): Promise<unknown> => {
  return apiRequest(`/api/rechnungen/${id}/send`, { method: "POST" });
};

const markPaid = async (id: number): Promise<unknown> => {
  return apiRequest(`/api/rechnungen/${id}/mark-paid`, { method: "POST" });
};

const deleteInvoice = async (id: number): Promise<unknown> => {
  return apiRequest(`/api/rechnungen/${id}`, { method: "DELETE" });
};

const stornoInvoice = async (id: number): Promise<unknown> => {
  return apiRequest(`/api/rechnungen/${id}/storno`, { method: "POST" });
};

const fetchPdfBlob = async (id: number): Promise<Blob> => {
  const token = getAccessToken();
  const res = await fetch(`/api/rechnungen/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("PDF konnte nicht geladen werden");
  return res.blob();
};

// ============================================
// HELPERS
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("de-DE");
};

const getStatusColor = (status: InvoiceStatus): string => {
  const colors: Record<InvoiceStatus, string> = {
    ENTWURF: "var(--status-draft)",
    OFFEN: "var(--status-open)",
    VERSENDET: "var(--status-sent)",
    BEZAHLT: "var(--status-paid)",
    UEBERFAELLIG: "var(--status-overdue)",
    STORNIERT: "var(--status-cancelled)",
    MAHNUNG: "var(--status-reminder)",
  };
  return colors[status] || "#64748b";
};

const getStatusIcon = (status: InvoiceStatus) => {
  const icons: Record<InvoiceStatus, React.FC<any>> = {
    ENTWURF: FileText,
    OFFEN: Clock,
    VERSENDET: Send,
    BEZAHLT: CheckCircle,
    UEBERFAELLIG: AlertTriangle,
    STORNIERT: Ban,
    MAHNUNG: AlertTriangle,
  };
  return icons[status] || FileText;
};

// ============================================
// TOAST HOOK
// ============================================

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage["type"], message: string) => {
    const id = Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function FinanzenPage() {
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast
  const { toasts, addToast, removeToast } = useToast();

  // Refs
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const dropdownAnchors = useRef<Map<number, HTMLButtonElement>>(new Map());

  // ============================================
  // LOAD DATA
  // ============================================

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInvoices();
      setInvoices(res.data || []);
    } catch (err) {
      addToast("error", "Rechnungen konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // ============================================
  // LOAD DETAIL
  // ============================================

  const loadInvoiceDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await fetchInvoiceDetail(id);
      setSelectedInvoice(detail);
    } catch (err) {
      addToast("error", "Rechnung konnte nicht geladen werden");
    } finally {
      setDetailLoading(false);
    }
  }, [addToast]);

  // ============================================
  // PDF PREVIEW
  // ============================================

  const openPdfPreview = useCallback(async (id: number) => {
    setPdfLoading(true);
    setShowPdfModal(true);
    try {
      const blob = await fetchPdfBlob(id);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      addToast("error", "PDF konnte nicht geladen werden");
      setShowPdfModal(false);
    } finally {
      setPdfLoading(false);
    }
  }, [addToast]);

  const closePdfModal = useCallback(() => {
    setShowPdfModal(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [pdfBlobUrl]);

  // ============================================
  // ACTIONS
  // ============================================

  const handleFinalize = useCallback(async (id: number) => {
    setActionLoading(`finalize-${id}`);
    try {
      await finalizeInvoice(id);
      addToast("success", "Rechnung finalisiert");
      loadInvoices();
      if (selectedInvoice?.id === id) loadInvoiceDetail(id);
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Fehler beim Finalisieren");
    } finally {
      setActionLoading(null);
      setShowActionsMenu(null);
    }
  }, [addToast, loadInvoices, loadInvoiceDetail, selectedInvoice]);

  const handleSend = useCallback(async (id: number) => {
    setActionLoading(`send-${id}`);
    try {
      await sendInvoice(id);
      addToast("success", "Rechnung versendet");
      loadInvoices();
      if (selectedInvoice?.id === id) loadInvoiceDetail(id);
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Fehler beim Versenden");
    } finally {
      setActionLoading(null);
      setShowActionsMenu(null);
    }
  }, [addToast, loadInvoices, loadInvoiceDetail, selectedInvoice]);

  const handleMarkPaid = useCallback(async (id: number) => {
    setActionLoading(`paid-${id}`);
    try {
      await markPaid(id);
      addToast("success", "Als bezahlt markiert");
      loadInvoices();
      if (selectedInvoice?.id === id) loadInvoiceDetail(id);
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Fehler");
    } finally {
      setActionLoading(null);
      setShowActionsMenu(null);
    }
  }, [addToast, loadInvoices, loadInvoiceDetail, selectedInvoice]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Rechnung wirklich löschen?")) return;
    setActionLoading(`delete-${id}`);
    try {
      await deleteInvoice(id);
      addToast("success", "Rechnung gelöscht");
      loadInvoices();
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Fehler beim Löschen");
    } finally {
      setActionLoading(null);
      setShowActionsMenu(null);
    }
  }, [addToast, loadInvoices, selectedInvoice]);

  const handleStorno = useCallback(async (id: number) => {
    if (!confirm("Rechnung wirklich stornieren?")) return;
    setActionLoading(`storno-${id}`);
    try {
      await stornoInvoice(id);
      addToast("success", "Rechnung storniert");
      loadInvoices();
      if (selectedInvoice?.id === id) loadInvoiceDetail(id);
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Fehler beim Stornieren");
    } finally {
      setActionLoading(null);
      setShowActionsMenu(null);
    }
  }, [addToast, loadInvoices, loadInvoiceDetail, selectedInvoice]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
        setShowActionsMenu(null);
        if (showPdfModal) closePdfModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPdfModal, closePdfModal]);

  // Close actions menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside dropdown AND outside anchor buttons
      const target = e.target as Node;
      const isInsideDropdown = actionsMenuRef.current?.contains(target);
      const isAnchorButton = Array.from(dropdownAnchors.current.values()).some(btn => btn?.contains(target));

      if (!isInsideDropdown && !isAnchorButton) {
        setShowActionsMenu(null);
      }
    };
    // Use click instead of mousedown to prevent race condition with button clicks
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ============================================
  // FILTERED DATA
  // ============================================

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          inv.rechnungsnummer.toLowerCase().includes(q) ||
          inv.kunde_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  // ============================================
  // KPIs
  // ============================================

  const kpis = useMemo(() => {
    const total = invoices.reduce((sum, i) => sum + i.betrag_brutto, 0);
    const paid = invoices.filter((i) => i.status === "BEZAHLT").reduce((sum, i) => sum + i.betrag_brutto, 0);
    const open = invoices.filter((i) => ["OFFEN", "VERSENDET", "UEBERFAELLIG", "MAHNUNG"].includes(i.status)).reduce((sum, i) => sum + i.betrag_brutto, 0);
    const overdue = invoices.filter((i) => i.status === "UEBERFAELLIG").reduce((sum, i) => sum + i.betrag_brutto, 0);

    return { total, paid, open, overdue, count: invoices.length };
  }, [invoices]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fin-page">
      {/* Header */}
      <header className="fin-header">
        <div className="fin-header__left">
          <div className="fin-header__icon">
            <Receipt size={24} />
          </div>
          <div>
            <h1 className="fin-header__title">Finanzen</h1>
            <p className="fin-header__subtitle">
              {invoices.length} Rechnungen · {formatCurrency(kpis.total)} Gesamt
            </p>
          </div>
        </div>
        <div className="fin-header__actions">
          <button className="fin-btn fin-btn--ghost" onClick={loadInvoices} disabled={loading}>
            <RefreshCw size={16} className={loading ? "fin-spin" : ""} />
          </button>
          <button className="fin-btn fin-btn--ghost" onClick={() => setShowCommandPalette(true)}>
            <Command size={16} />
            <span>⌘K</span>
          </button>
          <button className="fin-btn fin-btn--primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Neue Rechnung
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="fin-kpis">
        <div className="fin-kpi">
          <div className="fin-kpi__icon fin-kpi__icon--total">
            <Euro size={20} />
          </div>
          <div className="fin-kpi__content">
            <span className="fin-kpi__label">Gesamt</span>
            <span className="fin-kpi__value">{formatCurrency(kpis.total)}</span>
          </div>
        </div>
        <div className="fin-kpi">
          <div className="fin-kpi__icon fin-kpi__icon--paid">
            <TrendingUp size={20} />
          </div>
          <div className="fin-kpi__content">
            <span className="fin-kpi__label">Bezahlt</span>
            <span className="fin-kpi__value">{formatCurrency(kpis.paid)}</span>
          </div>
        </div>
        <div className="fin-kpi">
          <div className="fin-kpi__icon fin-kpi__icon--open">
            <Clock size={20} />
          </div>
          <div className="fin-kpi__content">
            <span className="fin-kpi__label">Offen</span>
            <span className="fin-kpi__value">{formatCurrency(kpis.open)}</span>
          </div>
        </div>
        <div className="fin-kpi">
          <div className="fin-kpi__icon fin-kpi__icon--overdue">
            <TrendingDown size={20} />
          </div>
          <div className="fin-kpi__content">
            <span className="fin-kpi__label">Überfällig</span>
            <span className="fin-kpi__value">{formatCurrency(kpis.overdue)}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="fin-toolbar">
        <div className="fin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Suche nach Rechnungsnummer oder Kunde..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="fin-search__clear" onClick={() => setSearchQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="fin-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="fin-select"
          >
            <option value="all">Alle Status</option>
            <option value="ENTWURF">Entwurf</option>
            <option value="OFFEN">Offen</option>
            <option value="VERSENDET">Versendet</option>
            <option value="BEZAHLT">Bezahlt</option>
            <option value="UEBERFAELLIG">Überfällig</option>
            <option value="STORNIERT">Storniert</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="fin-content">
        {/* Invoice List */}
        <div className="fin-list">
          {loading ? (
            <div className="fin-loading">
              <Loader2 size={32} className="fin-spin" />
              <span>Lade Rechnungen...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="fin-empty">
              <FileText size={48} />
              <h3>Keine Rechnungen gefunden</h3>
              <p>
                {searchQuery || statusFilter !== "all"
                  ? "Versuche andere Filterkriterien"
                  : "Erstelle deine erste Rechnung"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button className="fin-btn fin-btn--primary" onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} />
                  Neue Rechnung
                </button>
              )}
            </div>
          ) : (
            <>
            <div className="fin-table-wrapper">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Rechnung</th>
                    <th>Kunde</th>
                    <th>Datum</th>
                    <th>Fällig</th>
                    <th>Betrag</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv) => {
                    const StatusIcon = getStatusIcon(inv.status);
                    const isSelected = selectedInvoice?.id === inv.id;

                    return (
                      <tr
                        key={inv.id}
                        className={isSelected ? "fin-table__row--selected" : ""}
                        onClick={() => loadInvoiceDetail(inv.id)}
                      >
                        <td>
                          <div className="fin-table__primary">{inv.rechnungsnummer}</div>
                        </td>
                        <td>
                          <div className="fin-table__customer">
                            <span className="fin-avatar">{inv.kunde_name[0]}</span>
                            {inv.kunde_name}
                          </div>
                        </td>
                        <td>{formatDate(inv.rechnungs_datum)}</td>
                        <td>{formatDate(inv.faellig_am)}</td>
                        <td>
                          <span className="fin-table__amount">{formatCurrency(inv.betrag_brutto)}</span>
                        </td>
                        <td>
                          <span
                            className="fin-status"
                            style={{ "--status-color": getStatusColor(inv.status) } as any}
                          >
                            <StatusIcon size={14} />
                            {inv.status_label}
                          </span>
                        </td>
                        <td>
                          <div className="fin-table__actions">
                            <button
                              ref={(el) => { if (el) dropdownAnchors.current.set(inv.id, el); }}
                              className="fin-btn fin-btn--icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                const btn = dropdownAnchors.current.get(inv.id);
                                if (btn) {
                                  const rect = btn.getBoundingClientRect();
                                  setDropdownPosition({ top: rect.bottom + 4, left: rect.right - 200 });
                                }
                                setShowActionsMenu(showActionsMenu === inv.id ? null : inv.id);
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {showActionsMenu === inv.id && createPortal(
                              <div 
                                ref={actionsMenuRef}
                                className="fin-dropdown-portal"
                                style={{ position: 'fixed', top: dropdownPosition.top, left: dropdownPosition.left, zIndex: 99999 }}
                              >
                                <div className="fin-dropdown">
                                  <button onClick={(e) => { e.stopPropagation(); openPdfPreview(inv.id); setShowActionsMenu(null); }}>
                                    <Eye size={14} />
                                    PDF anzeigen
                                  </button>

                                  {inv.status === "ENTWURF" && (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleFinalize(inv.id); }}
                                        disabled={actionLoading === `finalize-${inv.id}`}
                                      >
                                        <FileCheck size={14} />
                                        {actionLoading === `finalize-${inv.id}` ? "..." : "Finalisieren"}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(inv.id); }}
                                        disabled={actionLoading === `delete-${inv.id}`}
                                        className="fin-dropdown__danger"
                                      >
                                        <Trash2 size={14} />
                                        {actionLoading === `delete-${inv.id}` ? "..." : "Löschen"}
                                      </button>
                                    </>
                                  )}

                                  {inv.status === "OFFEN" && (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleSend(inv.id); }}
                                        disabled={actionLoading === `send-${inv.id}`}
                                      >
                                        <Mail size={14} />
                                        {actionLoading === `send-${inv.id}` ? "..." : "Per E-Mail senden"}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMarkPaid(inv.id); }}
                                        disabled={actionLoading === `paid-${inv.id}`}
                                      >
                                        <CreditCard size={14} />
                                        {actionLoading === `paid-${inv.id}` ? "..." : "Als bezahlt markieren"}
                                      </button>
                                    </>
                                  )}

                                  {inv.status === "VERSENDET" && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleMarkPaid(inv.id); }}
                                      disabled={actionLoading === `paid-${inv.id}`}
                                    >
                                      <CreditCard size={14} />
                                      {actionLoading === `paid-${inv.id}` ? "..." : "Als bezahlt markieren"}
                                    </button>
                                  )}

                                  {["OFFEN", "VERSENDET", "UEBERFAELLIG"].includes(inv.status) && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleStorno(inv.id); }}
                                      disabled={actionLoading === `storno-${inv.id}`}
                                      className="fin-dropdown__danger"
                                    >
                                      <Ban size={14} />
                                      {actionLoading === `storno-${inv.id}` ? "..." : "Stornieren"}
                                    </button>
                                  )}
                                </div>
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredInvoices.length > itemsPerPage && (
              <div className="fin-pagination">
                <div className="fin-pagination__info">
                  <span>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredInvoices.length)} von {filteredInvoices.length}</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="fin-pagination__select"
                  >
                    <option value={25}>25 pro Seite</option>
                    <option value={50}>50 pro Seite</option>
                    <option value={100}>100 pro Seite</option>
                    <option value={250}>250 pro Seite</option>
                  </select>
                </div>
                <div className="fin-pagination__controls">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="fin-pagination__btn" title="Erste Seite"><ChevronsLeft size={16} /></button>
                  <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="fin-pagination__btn" title="Vorherige"><ChevronLeft size={16} /></button>
                  <span className="fin-pagination__current">Seite {currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="fin-pagination__btn" title="Nächste"><ChevronRight size={16} /></button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="fin-pagination__btn" title="Letzte Seite"><ChevronsRight size={16} /></button>
                </div>
              </div>
            )}
          </>
          )}
        </div>

        {/* Detail Panel */}
        {selectedInvoice && (
          <div className="fin-detail">
            <div className="fin-detail__header">
              <div className="fin-detail__title">
                <h2>{selectedInvoice.rechnungsnummer}</h2>
                <span
                  className="fin-status"
                  style={{ "--status-color": getStatusColor(selectedInvoice.status) } as any}
                >
                  {selectedInvoice.status_label}
                </span>
              </div>
              <button className="fin-btn fin-btn--icon" onClick={() => setSelectedInvoice(null)}>
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="fin-detail__loading">
                <Loader2 size={24} className="fin-spin" />
              </div>
            ) : (
              <>
                <div className="fin-detail__section">
                  <h3>Kunde</h3>
                  <div className="fin-detail__customer">
                    <span className="fin-avatar fin-avatar--lg">
                      {(selectedInvoice.kunde?.firmenName || selectedInvoice.kunde?.name || "K")[0]}
                    </span>
                    <div>
                      <strong>{selectedInvoice.kunde?.firmenName || selectedInvoice.kunde?.name}</strong>
                      {selectedInvoice.kunde?.email && <span>{selectedInvoice.kunde.email}</span>}
                      {selectedInvoice.kunde?.strasse && (
                        <span>
                          {selectedInvoice.kunde.strasse}, {selectedInvoice.kunde.plz} {selectedInvoice.kunde.ort}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="fin-detail__section">
                  <h3>Details</h3>
                  <div className="fin-detail__grid">
                    <div>
                      <span className="fin-detail__label">Rechnungsdatum</span>
                      <span>{formatDate(selectedInvoice.rechnungs_datum)}</span>
                    </div>
                    <div>
                      <span className="fin-detail__label">Fällig am</span>
                      <span>{formatDate(selectedInvoice.faellig_am)}</span>
                    </div>
                    {selectedInvoice.bezahlt_am && (
                      <div>
                        <span className="fin-detail__label">Bezahlt am</span>
                        <span>{formatDate(selectedInvoice.bezahlt_am)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="fin-detail__section">
                  <h3>Positionen</h3>
                  <div className="fin-detail__positions">
                    {selectedInvoice.positionen?.map((pos, idx) => (
                      <div key={idx} className="fin-detail__position">
                        <span>{pos.title}</span>
                        <span>
                          {pos.qty} × {formatCurrency(pos.unitNet)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fin-detail__totals">
                  <div>
                    <span>Netto</span>
                    <span>{formatCurrency(selectedInvoice.betrag_netto)}</span>
                  </div>
                  <div>
                    <span>MwSt.</span>
                    <span>{formatCurrency(selectedInvoice.betrag_mwst)}</span>
                  </div>
                  <div className="fin-detail__total">
                    <span>Gesamt</span>
                    <span>{formatCurrency(selectedInvoice.betrag_brutto)}</span>
                  </div>
                </div>

                <div className="fin-detail__actions">
                  <button className="fin-btn fin-btn--primary" onClick={() => openPdfPreview(selectedInvoice.id)}>
                    <Eye size={16} />
                    PDF anzeigen
                  </button>

                  {selectedInvoice.status === "ENTWURF" && (
                    <button
                      className="fin-btn"
                      onClick={() => handleFinalize(selectedInvoice.id)}
                      disabled={actionLoading === `finalize-${selectedInvoice.id}`}
                    >
                      <FileCheck size={16} />
                      Finalisieren
                    </button>
                  )}

                  {selectedInvoice.status === "OFFEN" && (
                    <button
                      className="fin-btn"
                      onClick={() => handleSend(selectedInvoice.id)}
                      disabled={actionLoading === `send-${selectedInvoice.id}`}
                    >
                      <Mail size={16} />
                      Versenden
                    </button>
                  )}

                  {["OFFEN", "VERSENDET"].includes(selectedInvoice.status) && (
                    <button
                      className="fin-btn fin-btn--success"
                      onClick={() => handleMarkPaid(selectedInvoice.id)}
                      disabled={actionLoading === `paid-${selectedInvoice.id}`}
                    >
                      <CreditCard size={16} />
                      Bezahlt
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <div className="fin-modal-overlay" onClick={closePdfModal}>
          <div className="fin-modal fin-modal--pdf" onClick={(e) => e.stopPropagation()}>
            <div className="fin-modal__header">
              <h2>PDF Vorschau</h2>
              <div className="fin-modal__header-actions">
                {pdfBlobUrl && (
                  <a
                    href={pdfBlobUrl}
                    download={`${selectedInvoice?.rechnungsnummer || "Rechnung"}.pdf`}
                    className="fin-btn fin-btn--ghost"
                  >
                    <Download size={16} />
                  </a>
                )}
                {pdfBlobUrl && (
                  <a
                    href={pdfBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fin-btn fin-btn--ghost"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button className="fin-btn fin-btn--icon" onClick={closePdfModal}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="fin-modal__body">
              {pdfLoading ? (
                <div className="fin-pdf-loading">
                  <Loader2 size={32} className="fin-spin" />
                  <span>Lade PDF...</span>
                </div>
              ) : pdfBlobUrl ? (
                <iframe src={pdfBlobUrl} className="fin-pdf-frame" title="PDF Preview" />
              ) : (
                <div className="fin-pdf-error">PDF konnte nicht geladen werden</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <InvoiceCreateModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            loadInvoices();
            if (id) loadInvoiceDetail(id);
            addToast("success", "Rechnung erstellt");
          }}
          createDraft={async (data) => {
            const res = await createInvoice(data);
            return res.data;
          }}
        />
      )}

      {/* Command Palette */}
      {showCommandPalette && (
        <div className="fin-modal-overlay" onClick={() => setShowCommandPalette(false)}>
          <div className="fin-command" onClick={(e) => e.stopPropagation()}>
            <div className="fin-command__header">
              <Search size={18} />
              <input type="text" placeholder="Suche nach Aktionen..." autoFocus />
            </div>
            <div className="fin-command__list">
              <button onClick={() => { setShowCreateModal(true); setShowCommandPalette(false); }}>
                <Plus size={16} />
                Neue Rechnung erstellen
              </button>
              <button onClick={() => { loadInvoices(); setShowCommandPalette(false); }}>
                <RefreshCw size={16} />
                Daten aktualisieren
              </button>
              <button onClick={() => { setStatusFilter("OFFEN"); setShowCommandPalette(false); }}>
                <Filter size={16} />
                Offene Rechnungen anzeigen
              </button>
              <button onClick={() => { setStatusFilter("BEZAHLT"); setShowCommandPalette(false); }}>
                <CheckCircle size={16} />
                Bezahlte Rechnungen anzeigen
              </button>
              <button onClick={() => { setStatusFilter("all"); setShowCommandPalette(false); }}>
                <FileText size={16} />
                Alle Rechnungen anzeigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fin-toasts">
        {toasts.map((toast) => (
          <div key={toast.id} className={`fin-toast fin-toast--${toast.type}`}>
            {toast.type === "success" && <Check size={16} />}
            {toast.type === "error" && <XCircle size={16} />}
            {toast.type === "warning" && <AlertTriangle size={16} />}
            {toast.type === "info" && <FileText size={16} />}
            <span>{safeString(toast.message)}</span>
            <button onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Styles */}
      <style>{`
        :root {
          --status-draft: #64748b;
          --status-open: #3b82f6;
          --status-sent: #EAD068;
          --status-paid: #10b981;
          --status-overdue: #ef4444;
          --status-cancelled: #6b7280;
          --status-reminder: #f59e0b;
        }

        .fin-page {
          padding: 1.5rem;
          max-width: 1600px;
          margin: 0 auto;
          min-height: 100vh;
          background: #0f172a;
        }

        /* Header */
        .fin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .fin-header__left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .fin-header__icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #EAD068, #D4A843);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .fin-header__title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .fin-header__subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .fin-header__actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Buttons */
        .fin-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fin-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
        }

        .fin-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fin-btn--primary {
          background: linear-gradient(135deg, #EAD068, #D4A843);
          border: none;
          color: white;
        }

        .fin-btn--primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .fin-btn--success {
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          color: white;
        }

        .fin-btn--ghost {
          background: transparent;
          border: none;
        }

        .fin-btn--icon {
          padding: 0.5rem;
        }

        /* KPIs */
        .fin-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .fin-kpi {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .fin-kpi__icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fin-kpi__icon--total { background: rgba(139, 92, 246, 0.15); color: #f0d878; }
        .fin-kpi__icon--paid { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .fin-kpi__icon--open { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .fin-kpi__icon--overdue { background: rgba(239, 68, 68, 0.15); color: #f87171; }

        .fin-kpi__content {
          display: flex;
          flex-direction: column;
        }

        .fin-kpi__label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .fin-kpi__value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
        }

        /* Toolbar */
        .fin-toolbar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .fin-search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
        }

        .fin-search:focus-within {
          border-color: rgba(139, 92, 246, 0.4);
        }

        .fin-search svg {
          color: #64748b;
          flex-shrink: 0;
        }

        .fin-search input {
          flex: 1;
          background: transparent;
          border: none;
          font-size: 0.875rem;
          color: #fff;
          outline: none;
        }

        .fin-search input::placeholder {
          color: #64748b;
        }

        .fin-search__clear {
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 6px;
          padding: 0.25rem;
          color: #94a3b8;
          cursor: pointer;
        }

        .fin-select {
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #e2e8f0;
          font-size: 0.875rem;
          cursor: pointer;
          min-width: 150px;
        }

        /* Content Layout */
        .fin-content {
          display: flex;
          gap: 1.5rem;
        }

        .fin-list {
          flex: 1;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }

        /* Loading & Empty */
        .fin-loading, .fin-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: #64748b;
          gap: 1rem;
        }

        .fin-empty h3 {
          color: #fff;
          margin: 0;
        }

        .fin-empty p {
          margin: 0;
        }

        .fin-spin {
          animation: fin-spin 1s linear infinite;
        }

        @keyframes fin-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Table */
        .fin-table-wrapper {
          overflow-x: auto;
        }

        .fin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .fin-table th {
          text-align: left;
          padding: 0.875rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .fin-table td {
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
          color: #e2e8f0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .fin-table tbody tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .fin-table tbody tr:hover {
          background: rgba(255,255,255,0.03);
        }

        .fin-table__row--selected {
          background: rgba(139, 92, 246, 0.1) !important;
        }

        .fin-table__primary {
          font-weight: 600;
          color: #fff;
        }

        .fin-table__customer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .fin-table__amount {
          font-weight: 600;
          font-family: monospace;
        }

        .fin-table__actions {
          position: relative;
        }

        /* Avatar */
        .fin-avatar {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #D4A843, #EAD068);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .fin-avatar--lg {
          width: 40px;
          height: 40px;
          font-size: 1rem;
        }

        /* Status Badge */
        .fin-status {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          background: color-mix(in srgb, var(--status-color) 15%, transparent);
          color: var(--status-color);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Dropdown Portal */
        .fin-dropdown-portal {
          animation: fin-dropdown-in 0.15s ease-out;
        }

        @keyframes fin-dropdown-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Dropdown */
        .fin-dropdown {
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          min-width: 200px;
          padding: 0.5rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .fin-dropdown button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-size: 0.8125rem;
          cursor: pointer;
          border-radius: 8px;
          text-align: left;
        }

        .fin-dropdown button:hover:not(:disabled) {
          background: rgba(255,255,255,0.05);
        }

        .fin-dropdown button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fin-dropdown__danger {
          color: #f87171 !important;
        }

        /* Pagination */
        .fin-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }

        .fin-pagination__info {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.8125rem;
          color: #64748b;
        }

        .fin-pagination__select {
          padding: 0.375rem 0.625rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .fin-pagination__controls {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .fin-pagination__btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fin-pagination__btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
        }

        .fin-pagination__btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .fin-pagination__current {
          padding: 0 0.75rem;
          font-size: 0.8125rem;
          color: #e2e8f0;
        }

        /* Detail Panel */
        .fin-detail {
          width: 380px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .fin-detail__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .fin-detail__title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .fin-detail__title h2 {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .fin-detail__loading {
          display: flex;
          justify-content: center;
          padding: 3rem;
        }

        .fin-detail__section {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .fin-detail__section h3 {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          margin: 0 0 0.75rem;
        }

        .fin-detail__customer {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .fin-detail__customer > div {
          display: flex;
          flex-direction: column;
        }

        .fin-detail__customer strong {
          color: #fff;
        }

        .fin-detail__customer span {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .fin-detail__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .fin-detail__grid > div {
          display: flex;
          flex-direction: column;
        }

        .fin-detail__label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .fin-detail__positions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .fin-detail__position {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
        }

        .fin-detail__position span:first-child {
          color: #e2e8f0;
        }

        .fin-detail__position span:last-child {
          color: #64748b;
        }

        .fin-detail__totals {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .fin-detail__totals > div {
          display: flex;
          justify-content: space-between;
          padding: 0.375rem 0;
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .fin-detail__total {
          border-top: 1px dashed rgba(255,255,255,0.1);
          margin-top: 0.5rem;
          padding-top: 0.75rem !important;
          font-weight: 700;
          color: #10b981 !important;
          font-size: 1rem !important;
        }

        .fin-detail__actions {
          padding: 1rem 1.25rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        /* Modals */
        .fin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .fin-modal {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .fin-modal--pdf {
          max-width: 900px;
          height: 90vh;
        }

        .fin-modal__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .fin-modal__header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .fin-modal__header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .fin-modal__body {
          flex: 1;
          overflow: auto;
          padding: 1.5rem;
        }

        .fin-pdf-frame {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 8px;
          background: #fff;
        }

        .fin-pdf-loading, .fin-pdf-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 1rem;
          color: #64748b;
        }

        /* Command Palette */
        .fin-command {
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          overflow: hidden;
        }

        .fin-command__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .fin-command__header svg {
          color: #64748b;
        }

        .fin-command__header input {
          flex: 1;
          background: transparent;
          border: none;
          font-size: 1rem;
          color: #fff;
          outline: none;
        }

        .fin-command__list {
          padding: 0.5rem;
        }

        .fin-command__list button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-size: 0.875rem;
          cursor: pointer;
          border-radius: 8px;
          text-align: left;
        }

        .fin-command__list button:hover {
          background: rgba(255,255,255,0.05);
        }

        .fin-command__list svg {
          color: #64748b;
        }

        /* Toasts */
        .fin-toasts {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 2000;
        }

        .fin-toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #e2e8f0;
          font-size: 0.875rem;
          animation: fin-toast-in 0.3s ease-out;
          min-width: 280px;
        }

        @keyframes fin-toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fin-toast--success svg { color: #10b981; }
        .fin-toast--error svg { color: #ef4444; }
        .fin-toast--warning svg { color: #f59e0b; }
        .fin-toast--info svg { color: #3b82f6; }

        .fin-toast button {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.25rem;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .fin-content {
            flex-direction: column;
          }
          .fin-detail {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .fin-kpis {
            grid-template-columns: repeat(2, 1fr);
          }
          .fin-toolbar {
            flex-direction: column;
          }
          .fin-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================
// INVOICE CREATE MODAL (INLINE)
// ============================================

interface InvoiceCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id?: number) => void;
  createDraft: (payload: Record<string, unknown>) => Promise<{ id: number }>;
}

function InvoiceCreateModal({ open, onClose, onCreated, createDraft }: InvoiceCreateModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer
  const [customers, setCustomers] = useState<Array<{ id: number; firma?: string; name?: string; email?: string }>>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; firma?: string; name?: string; email?: string } | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Installations
  const [installations, setInstallations] = useState<Array<{ id: number; publicId?: string; strasse?: string; hausNr?: string; plz?: string; ort?: string; customerName?: string; location?: string }>>([]);
  const [selectedInstallation, setSelectedInstallation] = useState<{ id: number; publicId?: string; strasse?: string; hausNr?: string; plz?: string; ort?: string; customerName?: string; location?: string } | null>(null);
  const [installationsLoading, setInstallationsLoading] = useState(false);

  // Positions
  const [positions, setPositions] = useState<Array<{ id: string; beschreibung: string; menge: number; einheit: string; einzelpreis: number; mwst_satz: number }>>([]);

  // Dates
  const today = new Date();
  const defaultDue = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const formatDateLocal = (d: Date) => d.toISOString().split("T")[0];
  const [rechnungsDatum, setRechnungsDatum] = useState(formatDateLocal(today));
  const [leistungsDatum, setLeistungsDatum] = useState(formatDateLocal(today));
  const [faelligAm, setFaelligAm] = useState(formatDateLocal(defaultDue));
  const [notizen, setNotizen] = useState("");

  // Load customers
  useEffect(() => {
    if (!open) return;
    const load = async () => {
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
      } catch {}
      setCustomersLoading(false);
    };
    load();
  }, [open]);

  // Load installations when customer changes
  useEffect(() => {
    if (!selectedCustomer) {
      setInstallations([]);
      setSelectedInstallation(null);
      return;
    }
    const load = async () => {
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
          if (list.length > 0) setSelectedInstallation(list[0]);
        }
      } catch {}
      setInstallationsLoading(false);
    };
    load();
  }, [selectedCustomer]);

  // Reset on close
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
    }
  }, [open]);

  const addPosition = () => {
    setPositions([...positions, {
      id: Math.random().toString(36).substring(2),
      beschreibung: "",
      menge: 1,
      einheit: "Stk.",
      einzelpreis: 0,
      mwst_satz: 19,
    }]);
  };

  const addPositionFromInstallation = () => {
    if (!selectedInstallation) return;
    const addr = [selectedInstallation.strasse, selectedInstallation.hausNr, selectedInstallation.plz, selectedInstallation.ort].filter(Boolean).join(" ");
    setPositions([...positions, {
      id: Math.random().toString(36).substring(2),
      beschreibung: `Netzanmeldung ${selectedInstallation.publicId || "#" + selectedInstallation.id}${addr ? " - " + addr : ""}`,
      menge: 1,
      einheit: "Pausch.",
      einzelpreis: 149,
      mwst_satz: 19,
    }]);
  };

  const updatePosition = (id: string, field: string, value: string | number) => {
    setPositions(positions.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  const totals = positions.reduce((acc, pos) => {
    const netto = pos.menge * pos.einzelpreis;
    const mwst = netto * (pos.mwst_satz / 100);
    return { netto: acc.netto + netto, mwst: acc.mwst + mwst, brutto: acc.brutto + netto + mwst };
  }, { netto: 0, mwst: 0, brutto: 0 });

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return c.firma?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const canProceedStep1 = !!selectedCustomer;
  const canProceedStep2 = positions.length > 0 && positions.every(p => p.beschreibung.trim());

  const handleSubmit = async () => {
    if (!selectedCustomer) { setError("Kunde auswählen"); setStep(1); return; }
    if (positions.length === 0) { setError("Position hinzufügen"); setStep(2); return; }

    setLoading(true);
    setError(null);

    try {
      const result = await createDraft({
        kundeId: selectedCustomer.id,
        rechnungsDatum,
        leistungsDatum,
        faelligAm,
        beschreibung: notizen || undefined,
        positionen: positions.map(p => ({
          title: p.beschreibung,
          qty: p.menge,
          unitNet: p.einzelpreis,
          vatRate: p.mwst_satz,
        })),
      });
      onCreated(result?.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fin-modal-overlay" onClick={onClose}>
      <div className="fin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="fin-modal__header">
          <h2>Neue Rechnung - Schritt {step}/3</h2>
          <button className="fin-btn fin-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ margin: "1rem 1.5rem 0", padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#f87171", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={16} />
            {safeString(error)}
            <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer" }}><X size={14} /></button>
          </div>
        )}

        <div className="fin-modal__body">
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "1rem" }}>Kunde auswählen</h3>
              <div className="fin-search" style={{ marginBottom: "1rem" }}>
                <Search size={18} />
                <input placeholder="Kunde suchen..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} autoFocus />
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {customersLoading ? <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Lade...</div> :
                  filteredCustomers.slice(0, 50).map(c => (
                    <button key={c.id} onClick={() => setSelectedCustomer(c)} style={{
                      display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem",
                      background: selectedCustomer?.id === c.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedCustomer?.id === c.id ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 12, cursor: "pointer", width: "100%", textAlign: "left"
                    }}>
                      <span className="fin-avatar">{(c.firma || c.name || "?")[0].toUpperCase()}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{c.firma || c.name}</div>
                        {c.email && <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>{c.email}</div>}
                      </div>
                      {selectedCustomer?.id === c.id && <Check size={18} style={{ color: "#10b981" }} />}
                    </button>
                  ))}
              </div>

              {selectedCustomer && installations.length > 0 && (
                <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 style={{ fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "1rem" }}>Installation (optional)</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 150, overflowY: "auto" }}>
                    {installationsLoading ? <div style={{ padding: "1rem", textAlign: "center", color: "#64748b" }}>Lade...</div> :
                      installations.map(inst => (
                        <button key={inst.id} onClick={() => setSelectedInstallation(selectedInstallation?.id === inst.id ? null : inst)} style={{
                          display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem",
                          background: selectedInstallation?.id === inst.id ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${selectedInstallation?.id === inst.id ? "rgba(250,204,21,0.4)" : "rgba(255,255,255,0.06)"}`,
                          borderRadius: 12, cursor: "pointer", width: "100%", textAlign: "left"
                        }}>
                          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #facc15, #f59e0b)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#1e293b" }}>
                            <FileText size={18} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: "#facc15", fontSize: "0.875rem" }}>{inst.publicId || `#${inst.id}`}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{inst.customerName} · {inst.location}</div>
                          </div>
                          {selectedInstallation?.id === inst.id && <Check size={18} style={{ color: "#facc15" }} />}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.875rem", color: "#cbd5e1", margin: 0 }}>Positionen</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {selectedInstallation && (
                    <button className="fin-btn" onClick={addPositionFromInstallation} style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)", color: "#1e293b", border: "none" }}>
                      <FileText size={14} /> Aus Installation
                    </button>
                  )}
                  <button className="fin-btn" onClick={addPosition}><Plus size={14} /> Position</button>
                </div>
              </div>

              {positions.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                  <FileText size={32} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                  <p>Keine Positionen</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {positions.map((pos, idx) => (
                    <div key={pos.id} style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>#{idx + 1}</span>
                        <button onClick={() => removePosition(pos.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 8, padding: "0.375rem", color: "#f87171", cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Beschreibung..."
                        value={pos.beschreibung}
                        onChange={e => updatePosition(pos.id, "beschreibung", e.target.value)}
                        style={{ width: "100%", padding: "0.625rem 0.875rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: "0.875rem", marginBottom: "0.75rem" }}
                      />
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <input type="number" min="1" value={pos.menge} onChange={e => updatePosition(pos.id, "menge", parseFloat(e.target.value) || 1)} style={{ width: 80, padding: "0.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                        <input type="number" min="0" step="0.01" value={pos.einzelpreis} onChange={e => updatePosition(pos.id, "einzelpreis", parseFloat(e.target.value) || 0)} placeholder="Preis" style={{ flex: 1, padding: "0.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                        <select value={pos.mwst_satz} onChange={e => updatePosition(pos.id, "mwst_satz", parseInt(e.target.value))} style={{ padding: "0.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}>
                          <option value={19}>19%</option>
                          <option value={7}>7%</option>
                          <option value={0}>0%</option>
                        </select>
                      </div>
                      <div style={{ textAlign: "right", marginTop: "0.5rem", fontWeight: 600, color: "#10b981", fontSize: "0.875rem" }}>
                        {formatCurrency(pos.menge * pos.einzelpreis * (1 + pos.mwst_satz / 100))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "1rem" }}>Daten</h3>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: "0.375rem" }}>Rechnungsdatum</label>
                    <input type="date" value={rechnungsDatum} onChange={e => setRechnungsDatum(e.target.value)} style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: "0.375rem" }}>Leistungsdatum</label>
                    <input type="date" value={leistungsDatum} onChange={e => setLeistungsDatum(e.target.value)} style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: "0.375rem" }}>Fällig am</label>
                    <input type="date" value={faelligAm} onChange={e => setFaelligAm(e.target.value)} style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "1rem" }}>Zusammenfassung</h3>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, marginBottom: "1rem", overflow: "hidden" }}>
                <div style={{ padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>Kunde</div>
                <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span className="fin-avatar">{(selectedCustomer?.firma || selectedCustomer?.name || "K")[0]}</span>
                  <div>
                    <strong style={{ color: "#fff" }}>{selectedCustomer?.firma || selectedCustomer?.name}</strong>
                    {selectedCustomer?.email && <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>{selectedCustomer.email}</div>}
                  </div>
                </div>
              </div>

              {selectedInstallation && (
                <div style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 14, marginBottom: "1rem", padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FileText size={20} style={{ color: "#facc15" }} />
                  <div>
                    <strong style={{ color: "#facc15" }}>{selectedInstallation.publicId}</strong>
                    <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>{selectedInstallation.location}</div>
                  </div>
                </div>
              )}

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, marginBottom: "1rem", overflow: "hidden" }}>
                <div style={{ padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>{positions.length} Position{positions.length !== 1 ? "en" : ""}</div>
                {positions.map((pos, i) => (
                  <div key={pos.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 1rem", borderBottom: i < positions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", fontSize: "0.875rem" }}>
                    <span style={{ color: "#e2e8f0" }}>{pos.beschreibung || `Position ${i + 1}`}</span>
                    <span style={{ color: "#64748b" }}>{formatCurrency(pos.menge * pos.einzelpreis)}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", color: "#94a3b8" }}><span>Netto</span><span>{formatCurrency(totals.netto)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", color: "#94a3b8" }}><span>MwSt.</span><span>{formatCurrency(totals.mwst)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", marginTop: "0.5rem", borderTop: "1px dashed rgba(255,255,255,0.1)", fontWeight: 700, fontSize: "1.125rem", color: "#10b981" }}><span>Gesamt</span><span>{formatCurrency(totals.brutto)}</span></div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            {step > 1 && <button className="fin-btn" onClick={() => setStep(step - 1)}>Zurück</button>}
          </div>
          <div>
            {step < 3 ? (
              <button className="fin-btn fin-btn--primary" onClick={() => setStep(step + 1)} disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}>
                Weiter
              </button>
            ) : (
              <button className="fin-btn fin-btn--success" onClick={handleSubmit} disabled={loading}>
                {loading ? "Wird erstellt..." : "Entwurf erstellen"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
