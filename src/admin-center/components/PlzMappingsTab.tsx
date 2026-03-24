// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - PLZ MAPPINGS TAB
// PLZ → Netzbetreiber Zuordnungen (lernendes System)
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useAdminCenterStore } from "../stores";
import type { PlzMapping } from "../../shared/types";

export function PlzMappingsTab() {
  const { 
    plzMappings, 
    gridOperators,
    searchQuery, 
    addPlzMapping, 
    updatePlzMapping, 
    deletePlzMapping,
  } = useAdminCenterStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ plz: "", city: "", gridOperatorId: "" });
  const [filterSource, setFilterSource] = useState<"all" | "manual" | "learned" | "imported">("all");
  
  // Filter mappings
  const filteredMappings = useMemo(() => {
    let result = plzMappings;
    
    // Filter by source
    if (filterSource !== "all") {
      result = result.filter(m => m.source === filterSource);
    }
    
    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.plz.includes(q) ||
        (m.gridOperatorName?.toLowerCase() ?? "").includes(q) ||
        m.city?.toLowerCase().includes(q)
      );
    }
    
    // Sort by PLZ
    return result.sort((a, b) => a.plz.localeCompare(b.plz));
  }, [plzMappings, searchQuery, filterSource]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plz || !formData.gridOperatorId) return;
    
    if (editingId) {
      const operator = gridOperators.find(op => op.id === formData.gridOperatorId);
      updatePlzMapping(editingId, {
        plz: formData.plz,
        city: formData.city,
        gridOperatorId: formData.gridOperatorId,
        gridOperatorName: operator?.name || "Unbekannt",
        source: "manual",
        confidence: 100,
      });
    } else {
      addPlzMapping(formData.plz, formData.gridOperatorId, "manual");
      // Update city if provided
      if (formData.city) {
        const newMapping = plzMappings.find(m => m.plz === formData.plz && m.gridOperatorId === formData.gridOperatorId);
        if (newMapping) {
          updatePlzMapping(newMapping.id, { city: formData.city });
        }
      }
    }
    
    resetForm();
  };
  
  const handleEdit = (mapping: PlzMapping) => {
    setFormData({
      plz: mapping.plz,
      city: mapping.city || "",
      gridOperatorId: mapping.gridOperatorId,
    });
    setEditingId(mapping.id);
    setShowForm(true);
  };
  
  const handleDelete = (id: string, plz: string) => {
    if (confirm(`PLZ-Zuordnung "${plz}" wirklich löschen?`)) {
      deletePlzMapping(id);
    }
  };
  
  const resetForm = () => {
    setFormData({ plz: "", city: "", gridOperatorId: "" });
    setEditingId(null);
    setShowForm(false);
  };
  
  // Stats
  const stats = {
    total: plzMappings.length,
    manual: plzMappings.filter(m => m.source === "manual").length,
    learned: plzMappings.filter(m => m.source === "learned").length,
    imported: plzMappings.filter(m => m.source === "imported").length,
  };
  
  const getSourceBadge = (source: PlzMapping["source"]) => {
    switch (source) {
      case "manual": return <span className="admin-table__badge admin-table__badge--info">✏️ Manuell</span>;
      case "learned": return <span className="admin-table__badge admin-table__badge--success">🤖 Gelernt</span>;
      case "imported": return <span className="admin-table__badge admin-table__badge--muted">📥 Import</span>;
    }
  };
  
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <span className="admin-table__confidence admin-table__confidence--high">{confidence}%</span>;
    if (confidence >= 70) return <span className="admin-table__confidence admin-table__confidence--medium">{confidence}%</span>;
    return <span className="admin-table__confidence admin-table__confidence--low">{confidence}%</span>;
  };
  
  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <div className="admin-tab__header-left">
          <h2 className="admin-tab__title">PLZ-Zuordnungen</h2>
          <span className="admin-tab__count">{filteredMappings.length} von {stats.total}</span>
        </div>
        <button className="admin-tab__add-btn" onClick={() => setShowForm(true)}>
          <span>➕</span> PLZ hinzufügen
        </button>
      </div>
      
      {/* Stats */}
      <div className="admin-tab__stats">
        <button className={`admin-tab__stat-btn ${filterSource === "all" ? "active" : ""}`} onClick={() => setFilterSource("all")}>
          Alle <span>{stats.total}</span>
        </button>
        <button className={`admin-tab__stat-btn ${filterSource === "manual" ? "active" : ""}`} onClick={() => setFilterSource("manual")}>
          ✏️ Manuell <span>{stats.manual}</span>
        </button>
        <button className={`admin-tab__stat-btn ${filterSource === "learned" ? "active" : ""}`} onClick={() => setFilterSource("learned")}>
          🤖 Gelernt <span>{stats.learned}</span>
        </button>
        <button className={`admin-tab__stat-btn ${filterSource === "imported" ? "active" : ""}`} onClick={() => setFilterSource("imported")}>
          📥 Import <span>{stats.imported}</span>
        </button>
      </div>
      
      {/* Form */}
      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form__header">
              <h3>{editingId ? "PLZ-Zuordnung bearbeiten" : "Neue PLZ-Zuordnung"}</h3>
              <button type="button" className="admin-form__close" onClick={resetForm}>×</button>
            </div>
            <div className="admin-form__body">
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>PLZ *</label>
                  <input 
                    type="text" 
                    value={formData.plz} 
                    onChange={(e) => setFormData({ ...formData, plz: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                    placeholder="z.B. 80331"
                    pattern="\d{5}"
                    maxLength={5}
                    required 
                  />
                </div>
                <div className="admin-form__field">
                  <label>Ort</label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="z.B. München"
                  />
                </div>
              </div>
              <div className="admin-form__field">
                <label>Netzbetreiber *</label>
                <select 
                  value={formData.gridOperatorId} 
                  onChange={(e) => setFormData({ ...formData, gridOperatorId: e.target.value })}
                  required
                >
                  <option value="">Bitte wählen...</option>
                  {gridOperators.filter(op => op.active).map(op => (
                    <option key={op.id} value={op.id}>{op.name}</option>
                  ))}
                </select>
              </div>
              {gridOperators.length === 0 && (
                <div className="admin-form__warning">
                  ⚠️ Bitte legen Sie zuerst einen Netzbetreiber an.
                </div>
              )}
            </div>
            <div className="admin-form__footer">
              <button type="button" className="admin-form__btn admin-form__btn--secondary" onClick={resetForm}>Abbrechen</button>
              <button type="submit" className="admin-form__btn admin-form__btn--primary" disabled={gridOperators.length === 0}>
                {editingId ? "Speichern" : "Hinzufügen"}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>PLZ</th>
              <th>Ort</th>
              <th>Netzbetreiber</th>
              <th>Quelle</th>
              <th>Konfidenz</th>
              <th>Nutzungen</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredMappings.length === 0 ? (
              <tr><td colSpan={7} className="admin-table__empty">
                {searchQuery ? `Keine PLZ-Zuordnungen gefunden für "${searchQuery}"` : "Noch keine PLZ-Zuordnungen"}
              </td></tr>
            ) : (
              filteredMappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td><code className="admin-table__plz">{mapping.plz}</code></td>
                  <td>{mapping.city || "—"}</td>
                  <td><strong>{mapping.gridOperatorName}</strong></td>
                  <td>{getSourceBadge(mapping.source)}</td>
                  <td>{getConfidenceBadge(mapping.confidence ?? 0)}</td>
                  <td><span className="admin-table__count">{mapping.usageCount}</span></td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="admin-table__action-btn" title="Bearbeiten" onClick={() => handleEdit(mapping)}>✏️</button>
                      <button className="admin-table__action-btn admin-table__action-btn--danger" title="Löschen" onClick={() => handleDelete(mapping.id, mapping.plz)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Info Box */}
      <div className="admin-tab__info-box">
        <h4>🧠 Wie funktioniert das lernende System?</h4>
        <ul>
          <li><strong>Manuell:</strong> Von Ihnen direkt eingegeben (100% Konfidenz)</li>
          <li><strong>Gelernt:</strong> Automatisch erfasst, wenn ein Benutzer im Wizard PLZ + Netzbetreiber eingibt</li>
          <li><strong>Import:</strong> Aus einer externen Quelle importiert</li>
        </ul>
        <p>
          Die <strong>Konfidenz</strong> steigt mit jeder Nutzung. Bei hoher Konfidenz wird der Netzbetreiber 
          automatisch vorgeschlagen, wenn jemand die gleiche PLZ eingibt.
        </p>
      </div>
    </div>
  );
}
