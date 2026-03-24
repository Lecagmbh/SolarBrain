/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VENDORS TAB
 * Lieferanten verwalten
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Building2,
  Mail,
  MapPin,
  FileText,
  Loader2,
  Edit2,
  Link2,
} from "lucide-react";
import * as accountingApi from "../../../../api/accounting";

export function VendorsTab() {
  const [vendors, setVendors] = useState<accountingApi.Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<accountingApi.Vendor | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      setLoading(true);
      const data = await accountingApi.getVendors();
      setVendors(data);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredVendors = vendors.filter((v) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(s) ||
      v.email?.toLowerCase().includes(s) ||
      v.country?.toLowerCase().includes(s)
    );
  });

  const intercompanyCount = vendors.filter((v) => v.isIntercompany).length;

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
            Lieferanten
          </h2>
          <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem", margin: 0 }}>
            {vendors.length} Lieferanten ({intercompanyCount} Inter-Company)
          </p>
        </div>
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
          Neuer Lieferant
        </button>
      </div>

      {/* Search */}
      <div
        style={{
          maxWidth: "400px",
          position: "relative",
          marginBottom: "1rem",
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
          placeholder="Lieferanten suchen..."
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

      {/* Vendors Grid */}
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
      ) : filteredVendors.length === 0 ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "var(--dash-text-subtle, #71717a)",
            background: "var(--dash-card-bg, #111113)",
            borderRadius: "12px",
            border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          }}
        >
          <Building2 size={40} style={{ marginBottom: "0.75rem", opacity: 0.5 }} />
          <p style={{ margin: 0 }}>Keine Lieferanten gefunden</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1rem",
          }}
        >
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              style={{
                background: "var(--dash-card-bg, #111113)",
                border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: vendor.isIntercompany
                        ? "rgba(236, 72, 153, 0.1)"
                        : "rgba(212, 168, 67, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {vendor.isIntercompany ? (
                      <Link2 size={18} color="#ec4899" />
                    ) : (
                      <Building2 size={18} color="#D4A843" />
                    )}
                  </div>
                  <div>
                    <h4
                      style={{
                        color: "var(--dash-text, #fafafa)",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {vendor.name}
                    </h4>
                    {vendor.isIntercompany && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#ec4899",
                          fontWeight: 500,
                        }}
                      >
                        Inter-Company
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingVendor(vendor)}
                  style={{
                    padding: "0.375rem",
                    background: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    color: "var(--dash-text-subtle, #71717a)",
                    cursor: "pointer",
                  }}
                >
                  <Edit2 size={14} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {vendor.email && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "var(--dash-text-subtle, #71717a)",
                      fontSize: "0.8rem",
                    }}
                  >
                    <Mail size={14} />
                    {vendor.email}
                  </div>
                )}
                {vendor.country && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "var(--dash-text-subtle, #71717a)",
                      fontSize: "0.8rem",
                    }}
                  >
                    <MapPin size={14} />
                    {vendor.country}
                  </div>
                )}
                {vendor.defaultCategory && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "var(--dash-text-subtle, #71717a)",
                      fontSize: "0.8rem",
                    }}
                  >
                    <FileText size={14} />
                    {vendor.defaultCategory}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingVendor) && (
        <VendorModal
          vendor={editingVendor}
          onClose={() => {
            setShowCreateModal(false);
            setEditingVendor(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingVendor(null);
            loadVendors();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VENDOR MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface VendorModalProps {
  vendor: accountingApi.Vendor | null;
  onClose: () => void;
  onSuccess: () => void;
}

function VendorModal({ vendor, onClose, onSuccess }: VendorModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: vendor?.name || "",
    email: vendor?.email || "",
    taxId: vendor?.taxId || "",
    country: vendor?.country || "",
    address: vendor?.address || "",
    defaultCategory: vendor?.defaultCategory || "",
  });

  async function handleSave() {
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      if (vendor) {
        await accountingApi.updateVendor(vendor.id, formData);
      } else {
        await accountingApi.createVendor(formData);
      }
      onSuccess();
    } catch (err) {
      console.error("Failed to save vendor:", err);
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
            {vendor ? "Lieferant bearbeiten" : "Neuer Lieferant"}
          </h3>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <FormField
            label="Name *"
            value={formData.name}
            onChange={(v) => setFormData((d) => ({ ...d, name: v }))}
          />
          <FormField
            label="E-Mail"
            type="email"
            value={formData.email}
            onChange={(v) => setFormData((d) => ({ ...d, email: v }))}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField
              label="Steuernummer"
              value={formData.taxId}
              onChange={(v) => setFormData((d) => ({ ...d, taxId: v }))}
            />
            <FormField
              label="Land"
              value={formData.country}
              onChange={(v) => setFormData((d) => ({ ...d, country: v }))}
            />
          </div>
          <FormField
            label="Adresse"
            value={formData.address}
            onChange={(v) => setFormData((d) => ({ ...d, address: v }))}
          />
          <FormField
            label="Standard-Kategorie"
            value={formData.defaultCategory}
            onChange={(v) => setFormData((d) => ({ ...d, defaultCategory: v }))}
          />
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
            disabled={saving || !formData.name.trim()}
            style={{
              padding: "0.625rem 1.25rem",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: saving ? "wait" : "pointer",
              opacity: saving || !formData.name.trim() ? 0.5 : 1,
            }}
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

export default VendorsTab;
