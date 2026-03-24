import { useState, useEffect } from "react";
import { useDetail } from "../context/DetailContext";
import { DOCUMENT_CATEGORIES } from "../types";
import { getAccessToken } from "../../../../modules/auth/tokenStorage";

interface Subcontractor {
  id: number;
  name: string;
  email: string;
  companyName?: string;
  assignedCount: number;
}

export default function SmartSidebar() {
  const { detail, reload } = useDetail();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubcontractors();
  }, []);

  const loadSubcontractors = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch('/api/subcontractors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubcontractors(data || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Subunternehmer:', err);
    }
  };

  const handleAssign = async (subcontractorId: number | null) => {
    if (!detail) return;
    try {
      setLoading(true);
      const token = getAccessToken();
      await fetch('/api/subcontractors/assign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          installationId: detail.id,
          subcontractorId,
        }),
      });
      setShowDropdown(false);
      reload?.();
    } catch (err) {
      console.error('Fehler beim Zuweisen:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!detail) return null;

  // ⚠️ WICHTIG:
  // Das sind KEINE DocumentCategory-Werte,
  // sondern KEYS für DOCUMENT_CATEGORIES → daher string[]
  const REQUIRED_DOC_KEYS: string[] = [
    "lageplan",
    "schaltplan",
    "datenblatt_module",
    "datenblatt_wechselrichter",
    "messkonzept",
  ];

  const uploadedDocs =
    detail.documents?.map((d) => d.category?.toLowerCase()) || [];

  const missing = REQUIRED_DOC_KEYS.filter(
    (key) => !uploadedDocs.includes(key)
  );

  const inst = detail as any;

  return (
    <div className="ld-sidebar">
      {/* Subunternehmer-Zuweisung */}
      <div className="ld-sidebar-section">
        <h4>👷 Subunternehmer</h4>
        
        {inst.assignedToName ? (
          <div className="ld-sub-assigned">
            <div className="ld-sub-info">
              <span className="ld-sub-name">{inst.assignedToName}</span>
              {inst.suppressEmails && (
                <span className="ld-sub-badge">🔕 Keine E-Mails</span>
              )}
            </div>
            <button 
              className="ld-sub-change" 
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={loading}
            >
              Ändern
            </button>
          </div>
        ) : (
          <button 
            className="ld-sub-assign-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
          >
            ➕ Subunternehmer zuweisen
          </button>
        )}

        {showDropdown && (
          <div className="ld-sub-dropdown">
            {inst.assignedToId && (
              <button 
                className="ld-sub-option ld-sub-option--remove"
                onClick={() => handleAssign(null)}
              >
                🚫 Zuweisung entfernen
              </button>
            )}
            {subcontractors.map(sub => (
              <button
                key={sub.id}
                className={`ld-sub-option ${inst.assignedToId === sub.id ? 'selected' : ''}`}
                onClick={() => handleAssign(sub.id)}
              >
                <span className="ld-sub-option-name">{sub.name}</span>
              </button>
            ))}
            {subcontractors.length === 0 && (
              <div className="ld-sub-empty">Keine Subunternehmer verfügbar</div>
            )}
          </div>
        )}
      </div>

      {/* Pflichtdokumente */}
      <div className="ld-sidebar-section">
        <h4>📄 Pflichtdokumente</h4>

        {missing.length === 0 && (
          <div className="ld-sidebar-ok">✅ Alle Pflichtdokumente vorhanden</div>
        )}

        {missing.map((key) => {
          const config =
            DOCUMENT_CATEGORIES[key] || DOCUMENT_CATEGORIES.sonstiges;

          return (
            <div key={key} className="ld-sidebar-missing">
              <span
                className="ld-sidebar-dot"
                style={{ background: config.color }}
              />
              <div>
                <div className="ld-sidebar-title">{config.label}</div>
                <div className="ld-sidebar-desc">{config.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
