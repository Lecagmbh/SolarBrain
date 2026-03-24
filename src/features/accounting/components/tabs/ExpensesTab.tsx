/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EXPENSES TAB
 * Eingangsrechnungen verwalten mit KI-Upload
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Upload,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Building2,
  Loader2,
  Eye,
  CreditCard,
  Trash2,
  Sparkles,
  Receipt,
} from "lucide-react";
import * as accountingApi from "../../../../api/accounting";

type ExpenseFilter = "all" | "UNPAID" | "PAID" | "VOID";

export function ExpensesTab() {
  const [expenses, setExpenses] = useState<accountingApi.Expense[]>([]);
  const [categories, setCategories] = useState<accountingApi.ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ExpenseFilter>("all");
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<accountingApi.Expense | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      setLoading(true);
      const [expensesRes, categoriesRes] = await Promise.all([
        accountingApi.getExpenses({
          status: filter === "all" ? undefined : filter,
          limit: 100,
        }),
        accountingApi.getExpenseCategories(),
      ]);
      setExpenses(expensesRes.expenses);
      setCategories(categoriesRes);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredExpenses = expenses.filter((e) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      e.description.toLowerCase().includes(searchLower) ||
      e.vendor?.name.toLowerCase().includes(searchLower) ||
      e.invoiceNumber?.toLowerCase().includes(searchLower) ||
      e.category.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount: number, currency = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      UNPAID: { icon: Clock, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", label: "Offen" },
      PAID: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", label: "Bezahlt" },
      VOID: { icon: XCircle, color: "#71717a", bg: "rgba(113, 113, 122, 0.1)", label: "Storniert" },
    }[status] || { icon: Clock, color: "#71717a", bg: "rgba(113, 113, 122, 0.1)", label: status };

    const Icon = config.icon;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.25rem 0.625rem",
          borderRadius: "6px",
          background: config.bg,
          color: config.color,
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  async function handleMarkPaid(expense: accountingApi.Expense) {
    try {
      await accountingApi.markExpensePaid(expense.id, {
        paidAt: new Date().toISOString(),
        paidVia: "Manual",
      });
      loadData();
    } catch (err) {
      console.error("Failed to mark as paid:", err);
    }
  }

  async function handleVoid(expense: accountingApi.Expense) {
    if (!confirm("Expense wirklich stornieren?")) return;
    try {
      await accountingApi.voidExpense(expense.id);
      loadData();
    } catch (err) {
      console.error("Failed to void:", err);
    }
  }

  // Stats
  const totalUnpaid = expenses
    .filter((e) => e.status === "UNPAID")
    .reduce((sum, e) => sum + e.totalAmount, 0);
  const countUnpaid = expenses.filter((e) => e.status === "UNPAID").length;

  return (
    <div style={{ padding: "1.5rem 2.5rem", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1.25rem",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Eingangsrechnungen
          </h2>
          <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem", margin: 0 }}>
            {countUnpaid} offen ({formatCurrency(totalUnpaid)})
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              background: "linear-gradient(135deg, #EAD068 0%, #D4A843 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Sparkles size={16} />
            KI Upload
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "8px",
              color: "#10b981",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Manuell anlegen
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: 1,
            maxWidth: "400px",
            position: "relative",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--dash-text-subtle, #71717a)",
            }}
          />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem 0.625rem 2.25rem",
              background: "var(--dash-card-bg, #111113)",
              border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "8px",
              color: "var(--dash-text, #fafafa)",
              fontSize: "0.8rem",
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {[
            { value: "all", label: "Alle" },
            { value: "UNPAID", label: "Offen" },
            { value: "PAID", label: "Bezahlt" },
            { value: "VOID", label: "Storniert" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as ExpenseFilter)}
              style={{
                padding: "0.5rem 0.875rem",
                background: filter === f.value ? "rgba(16, 185, 129, 0.1)" : "transparent",
                border:
                  filter === f.value
                    ? "1px solid rgba(16, 185, 129, 0.2)"
                    : "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                borderRadius: "6px",
                color:
                  filter === f.value ? "#10b981" : "var(--dash-text-subtle, #71717a)",
                fontSize: "0.75rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--dash-card-bg, #111113)",
          border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              color: "var(--dash-text-subtle, #71717a)",
            }}
          >
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--dash-text-subtle, #71717a)",
            }}
          >
            <Receipt size={40} style={{ marginBottom: "0.75rem", opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Keine Eingangsrechnungen gefunden</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                }}
              >
                {["Datum", "Lieferant", "Beschreibung", "Kategorie", "Betrag", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "left",
                        color: "var(--dash-text-subtle, #71717a)",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  style={{
                    borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                  }}
                >
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {formatDate(expense.invoiceDate)}
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: expense.isIntercompany
                            ? "rgba(236, 72, 153, 0.1)"
                            : "rgba(212, 168, 67, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Building2
                          size={14}
                          color={expense.isIntercompany ? "#ec4899" : "#D4A843"}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            color: "var(--dash-text, #fafafa)",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                          }}
                        >
                          {expense.vendor?.name || "Unbekannt"}
                        </div>
                        {expense.invoiceNumber && (
                          <div
                            style={{
                              color: "var(--dash-text-subtle, #71717a)",
                              fontSize: "0.7rem",
                            }}
                          >
                            {expense.invoiceNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--dash-text-subtle, #71717a)",
                      fontSize: "0.8rem",
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {expense.description}
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "var(--dash-text-subtle, #71717a)",
                        fontSize: "0.7rem",
                      }}
                    >
                      {expense.category}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCurrency(expense.totalAmount, expense.currency)}
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>{getStatusBadge(expense.status)}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      {expense.documentPath && (
                        <button
                          title="Dokument ansehen"
                          style={{
                            padding: "0.375rem",
                            background: "transparent",
                            border: "none",
                            borderRadius: "4px",
                            color: "var(--dash-text-subtle, #71717a)",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {expense.status === "UNPAID" && (
                        <button
                          title="Als bezahlt markieren"
                          onClick={() => handleMarkPaid(expense)}
                          style={{
                            padding: "0.375rem",
                            background: "transparent",
                            border: "none",
                            borderRadius: "4px",
                            color: "#10b981",
                            cursor: "pointer",
                          }}
                        >
                          <CreditCard size={14} />
                        </button>
                      )}
                      {expense.status !== "VOID" && (
                        <button
                          title="Stornieren"
                          onClick={() => handleVoid(expense)}
                          style={{
                            padding: "0.375rem",
                            background: "transparent",
                            border: "none",
                            borderRadius: "4px",
                            color: "var(--dash-text-subtle, #71717a)",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* AI Upload Modal */}
      {showUploadModal && (
        <AIUploadModal
          categories={categories}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadData();
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI UPLOAD MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface AIUploadModalProps {
  categories: accountingApi.ExpenseCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

function AIUploadModal({ categories, onClose, onSuccess }: AIUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<accountingApi.ExtractedInvoiceData | null>(null);
  const [vendorMatch, setVendorMatch] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state after extraction
  const [formData, setFormData] = useState({
    vendorName: "",
    invoiceNumber: "",
    invoiceDate: "",
    description: "",
    category: "",
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    currency: "EUR",
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    // Auto-extract
    try {
      setExtracting(true);
      const result = await accountingApi.extractInvoiceData(selectedFile);
      setExtracted(result.extracted);
      setVendorMatch(result.vendor);

      // Pre-fill form
      setFormData({
        vendorName: result.extracted.vendorName || result.vendor.vendorName || "",
        invoiceNumber: result.extracted.invoiceNumber || "",
        invoiceDate: result.extracted.invoiceDate || new Date().toISOString().split("T")[0],
        description: result.extracted.lineItems?.[0]?.description || "",
        category: result.vendor.defaultCategory || result.extracted.suggestedCategory || "",
        subtotal: result.extracted.subtotal || 0,
        taxAmount: result.extracted.taxAmount || 0,
        totalAmount: result.extracted.totalAmount || 0,
        currency: result.extracted.currency || "EUR",
      });
    } catch (err) {
      console.error("Extraction failed:", err);
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      // Create vendor if new
      let vendorId = vendorMatch?.vendorId;
      if (!vendorId && formData.vendorName) {
        const newVendor = await accountingApi.createVendor({
          name: formData.vendorName,
          defaultCategory: formData.category,
        });
        vendorId = newVendor.id;
      }

      // Create expense
      await accountingApi.createExpense({
        vendorId,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceDate: formData.invoiceDate,
        description: formData.description || formData.vendorName,
        category: formData.category,
        subtotal: formData.subtotal,
        taxAmount: formData.taxAmount,
        totalAmount: formData.totalAmount,
        currency: formData.currency,
      });

      onSuccess();
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--dash-card-bg, #111113)",
          border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #EAD068 0%, #D4A843 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <h3
              style={{
                color: "var(--dash-text, #fafafa)",
                fontSize: "1rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
              KI Rechnungs-Upload
            </h3>
            <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.75rem", margin: 0 }}>
              PDF hochladen - Daten werden automatisch extrahiert
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem" }}>
          {!extracted ? (
            // Upload Area
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem 2rem",
                border: "2px dashed var(--dash-border, rgba(255, 255, 255, 0.15))",
                borderRadius: "12px",
                cursor: extracting ? "wait" : "pointer",
                transition: "all 0.2s",
              }}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={extracting}
                style={{ display: "none" }}
              />
              {extracting ? (
                <>
                  <Loader2 size={40} className="animate-spin" color="#EAD068" />
                  <p
                    style={{
                      color: "var(--dash-text, #fafafa)",
                      marginTop: "1rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    KI analysiert Rechnung...
                  </p>
                  <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem" }}>
                    {file?.name}
                  </p>
                </>
              ) : (
                <>
                  <Upload size={40} color="var(--dash-text-subtle, #71717a)" />
                  <p
                    style={{
                      color: "var(--dash-text, #fafafa)",
                      marginTop: "1rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    PDF hier ablegen oder klicken
                  </p>
                  <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem" }}>
                    Max. 20MB
                  </p>
                </>
              )}
            </label>
          ) : (
            // Extracted Data Form
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Confidence Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(139, 92, 246, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <Sparkles size={16} color="#EAD068" />
                <span style={{ color: "#EAD068", fontSize: "0.8rem" }}>
                  KI Konfidenz: {extracted.extractionConfidence}%
                </span>
              </div>

              {/* Form Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField
                  label="Lieferant"
                  value={formData.vendorName}
                  onChange={(v) => setFormData((d) => ({ ...d, vendorName: v }))}
                />
                <FormField
                  label="Rechnungsnummer"
                  value={formData.invoiceNumber}
                  onChange={(v) => setFormData((d) => ({ ...d, invoiceNumber: v }))}
                />
                <FormField
                  label="Datum"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(v) => setFormData((d) => ({ ...d, invoiceDate: v }))}
                />
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "var(--dash-text-subtle, #71717a)",
                      fontSize: "0.75rem",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Kategorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                      borderRadius: "6px",
                      color: "var(--dash-text, #fafafa)",
                      fontSize: "0.8rem",
                    }}
                  >
                    <option value="">Auswählen...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FormField
                label="Beschreibung"
                value={formData.description}
                onChange={(v) => setFormData((d) => ({ ...d, description: v }))}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <FormField
                  label="Netto"
                  type="number"
                  value={String(formData.subtotal)}
                  onChange={(v) => setFormData((d) => ({ ...d, subtotal: parseFloat(v) || 0 }))}
                />
                <FormField
                  label="MwSt"
                  type="number"
                  value={String(formData.taxAmount)}
                  onChange={(v) => setFormData((d) => ({ ...d, taxAmount: parseFloat(v) || 0 }))}
                />
                <FormField
                  label="Brutto"
                  type="number"
                  value={String(formData.totalAmount)}
                  onChange={(v) => setFormData((d) => ({ ...d, totalAmount: parseFloat(v) || 0 }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "0.625rem 1.25rem",
              background: "transparent",
              border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "8px",
              color: "var(--dash-text-subtle, #71717a)",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Abbrechen
          </button>
          {extracted && (
            <button
              onClick={handleSave}
              disabled={saving || !formData.totalAmount}
              style={{
                padding: "0.625rem 1.25rem",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: saving ? "wait" : "pointer",
                opacity: saving || !formData.totalAmount ? 0.5 : 1,
              }}
            >
              {saving ? "Speichern..." : "Expense anlegen"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE EXPENSE MODAL (Manual)
// ═══════════════════════════════════════════════════════════════════════════════

interface CreateExpenseModalProps {
  categories: accountingApi.ExpenseCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateExpenseModal({ categories, onClose, onSuccess }: CreateExpenseModalProps) {
  const [vendors, setVendors] = useState<accountingApi.Vendor[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: "",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    description: "",
    category: "",
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    currency: "EUR",
  });

  useEffect(() => {
    accountingApi.getVendors().then(setVendors).catch(console.error);
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      await accountingApi.createExpense({
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceDate: formData.invoiceDate,
        description: formData.description,
        category: formData.category,
        subtotal: formData.subtotal,
        taxAmount: formData.taxAmount,
        totalAmount: formData.totalAmount,
        currency: formData.currency,
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to create:", err);
      alert("Fehler beim Erstellen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--dash-card-bg, #111113)",
          border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "500px",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          }}
        >
          <h3
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1rem",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Neue Eingangsrechnung
          </h3>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                color: "var(--dash-text-subtle, #71717a)",
                fontSize: "0.75rem",
                marginBottom: "0.375rem",
              }}
            >
              Lieferant
            </label>
            <select
              value={formData.vendorId}
              onChange={(e) => setFormData((d) => ({ ...d, vendorId: e.target.value }))}
              style={{
                width: "100%",
                padding: "0.625rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                borderRadius: "6px",
                color: "var(--dash-text, #fafafa)",
                fontSize: "0.8rem",
              }}
            >
              <option value="">Auswählen...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField
              label="Rechnungsnr."
              value={formData.invoiceNumber}
              onChange={(v) => setFormData((d) => ({ ...d, invoiceNumber: v }))}
            />
            <FormField
              label="Datum"
              type="date"
              value={formData.invoiceDate}
              onChange={(v) => setFormData((d) => ({ ...d, invoiceDate: v }))}
            />
          </div>

          <FormField
            label="Beschreibung"
            value={formData.description}
            onChange={(v) => setFormData((d) => ({ ...d, description: v }))}
          />

          <div>
            <label
              style={{
                display: "block",
                color: "var(--dash-text-subtle, #71717a)",
                fontSize: "0.75rem",
                marginBottom: "0.375rem",
              }}
            >
              Kategorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
              style={{
                width: "100%",
                padding: "0.625rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                borderRadius: "6px",
                color: "var(--dash-text, #fafafa)",
                fontSize: "0.8rem",
              }}
            >
              <option value="">Auswählen...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <FormField
              label="Netto"
              type="number"
              value={String(formData.subtotal)}
              onChange={(v) => setFormData((d) => ({ ...d, subtotal: parseFloat(v) || 0 }))}
            />
            <FormField
              label="MwSt"
              type="number"
              value={String(formData.taxAmount)}
              onChange={(v) => setFormData((d) => ({ ...d, taxAmount: parseFloat(v) || 0 }))}
            />
            <FormField
              label="Brutto"
              type="number"
              value={String(formData.totalAmount)}
              onChange={(v) => setFormData((d) => ({ ...d, totalAmount: parseFloat(v) || 0 }))}
            />
          </div>
        </div>

        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "0.625rem 1.25rem",
              background: "transparent",
              border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "8px",
              color: "var(--dash-text-subtle, #71717a)",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.description || !formData.totalAmount}
            style={{
              padding: "0.625rem 1.25rem",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: saving ? "wait" : "pointer",
              opacity: saving || !formData.description || !formData.totalAmount ? 0.5 : 1,
            }}
          >
            {saving ? "Speichern..." : "Anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM FIELD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

function FormField({ label, value, onChange, type = "text" }: FormFieldProps) {
  return (
    <div>
      <label
        style={{
          display: "block",
          color: "var(--dash-text-subtle, #71717a)",
          fontSize: "0.75rem",
          marginBottom: "0.375rem",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "0.625rem",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "6px",
          color: "var(--dash-text, #fafafa)",
          fontSize: "0.8rem",
        }}
      />
    </div>
  );
}

export default ExpensesTab;
