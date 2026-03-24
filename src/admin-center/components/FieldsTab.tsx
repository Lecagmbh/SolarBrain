// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - FIELDS TAB
// Zusätzliche Felder pro Netzbetreiber
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useAdminCenterStore } from "../stores";
import type { FieldRequirement, FieldType } from "../../shared/types";

export function FieldsTab() {
  const { 
    fieldRequirements, 
    gridOperators,
    selectedGridOperatorId,
    setSelectedGridOperator,
    searchQuery, 
    addFieldRequirement, 
    updateFieldRequirement, 
    deleteFieldRequirement,
  } = useAdminCenterStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FieldRequirement>>({
    gridOperatorId: "",
    fieldName: "",
    label: "",
    type: "text",
    required: false,
    conditions: [],
    sortOrder: 0,
  });
  
  const filteredFields = useMemo(() => {
    let result = fieldRequirements;
    if (selectedGridOperatorId) {
      result = result.filter(f => f.gridOperatorId === selectedGridOperatorId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => (f.label ?? "").toLowerCase().includes(q) || (f.fieldName ?? "").toLowerCase().includes(q));
    }
    return result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [fieldRequirements, selectedGridOperatorId, searchQuery]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gridOperatorId || !formData.fieldName || !formData.label) return;
    
    const data = {
      gridOperatorId: formData.gridOperatorId,
      fieldName: formData.fieldName,
      label: formData.label,
      type: formData.type as FieldType,
      required: formData.required ?? false,
      conditions: formData.conditions || [],
      placeholder: formData.placeholder,
      helpText: formData.helpText,
      sortOrder: formData.sortOrder || 0,
    };
    
    if (editingId) {
      updateFieldRequirement(editingId, data);
    } else {
      addFieldRequirement(data);
    }
    resetForm();
  };
  
  const handleEdit = (field: FieldRequirement) => {
    setFormData(field);
    setEditingId(field.id);
    setShowForm(true);
  };
  
  const handleDelete = (id: string, label: string) => {
    if (confirm(`Feld "${label}" wirklich löschen?`)) {
      deleteFieldRequirement(id);
    }
  };
  
  const resetForm = () => {
    setFormData({ gridOperatorId: selectedGridOperatorId || "", fieldName: "", label: "", type: "text", required: false, conditions: [], sortOrder: 0 });
    setEditingId(null);
    setShowForm(false);
  };
  
  const getOperatorName = (id: string) => gridOperators.find(op => op.id === id)?.name || "Unbekannt";
  
  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <div className="admin-tab__header-left">
          <h2 className="admin-tab__title">Zusätzliche Felder</h2>
          <span className="admin-tab__count">{filteredFields.length} Einträge</span>
        </div>
        <div className="admin-tab__header-right">
          <select className="admin-tab__filter-select" value={selectedGridOperatorId || ""} onChange={(e) => setSelectedGridOperator(e.target.value || null)}>
            <option value="">Alle Netzbetreiber</option>
            {gridOperators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
          </select>
          <button className="admin-tab__add-btn" onClick={() => setShowForm(true)} disabled={gridOperators.length === 0}>
            <span>➕</span> Feld hinzufügen
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form__header">
              <h3>{editingId ? "Feld bearbeiten" : "Neues Feld"}</h3>
              <button type="button" className="admin-form__close" onClick={resetForm}>×</button>
            </div>
            <div className="admin-form__body">
              <div className="admin-form__field">
                <label>Netzbetreiber *</label>
                <select value={formData.gridOperatorId || ""} onChange={(e) => setFormData({ ...formData, gridOperatorId: e.target.value })} required>
                  <option value="">Bitte wählen...</option>
                  {gridOperators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                </select>
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Technischer Name *</label>
                  <input type="text" value={formData.fieldName || ""} onChange={(e) => setFormData({ ...formData, fieldName: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })} placeholder="z.B. kundennummer" required />
                </div>
                <div className="admin-form__field">
                  <label>Anzeigename *</label>
                  <input type="text" value={formData.label || ""} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="z.B. Kundennummer" required />
                </div>
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Feldtyp</label>
                  <select value={formData.type || "text"} onChange={(e) => setFormData({ ...formData, type: e.target.value as FieldType })}>
                    <option value="text">Text</option>
                    <option value="number">Zahl</option>
                    <option value="date">Datum</option>
                    <option value="select">Auswahl</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="textarea">Textbereich</option>
                  </select>
                </div>
                <div className="admin-form__field">
                  <label>Sortierung</label>
                  <input type="number" value={formData.sortOrder || 0} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} min={0} />
                </div>
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Platzhalter</label>
                  <input type="text" value={formData.placeholder || ""} onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })} />
                </div>
                <div className="admin-form__field">
                  <label className="admin-form__checkbox">
                    <input type="checkbox" checked={formData.required ?? false} onChange={(e) => setFormData({ ...formData, required: e.target.checked })} />
                    <span>Pflichtfeld</span>
                  </label>
                </div>
              </div>
              <div className="admin-form__field">
                <label>Hilfetext</label>
                <input type="text" value={formData.helpText || ""} onChange={(e) => setFormData({ ...formData, helpText: e.target.value })} />
              </div>
            </div>
            <div className="admin-form__footer">
              <button type="button" className="admin-form__btn admin-form__btn--secondary" onClick={resetForm}>Abbrechen</button>
              <button type="submit" className="admin-form__btn admin-form__btn--primary">{editingId ? "Speichern" : "Hinzufügen"}</button>
            </div>
          </form>
        </div>
      )}
      
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Label</th>
              <th>Feldname</th>
              <th>Typ</th>
              <th>Netzbetreiber</th>
              <th>Pflicht</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredFields.length === 0 ? (
              <tr><td colSpan={7} className="admin-table__empty">{gridOperators.length === 0 ? "Bitte legen Sie zuerst einen Netzbetreiber an" : "Keine Zusatzfelder definiert"}</td></tr>
            ) : (
              filteredFields.map(field => (
                <tr key={field.id}>
                  <td><span className="admin-table__sort">{field.sortOrder}</span></td>
                  <td><strong>{field.label}</strong></td>
                  <td><code>{field.fieldName}</code></td>
                  <td><span className="admin-table__badge">{field.type}</span></td>
                  <td><span className="admin-table__badge admin-table__badge--info">{getOperatorName(field.gridOperatorId ?? "")}</span></td>
                  <td>{field.required ? <span className="admin-table__badge admin-table__badge--warning">Ja</span> : <span className="admin-table__badge admin-table__badge--muted">Nein</span>}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="admin-table__action-btn" onClick={() => handleEdit(field)}>✏️</button>
                      <button className="admin-table__action-btn admin-table__action-btn--danger" onClick={() => handleDelete(field.id, field.label ?? "")}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="admin-tab__hint">
        <span>💡</span>
        <p>Zusatzfelder werden im Wizard angezeigt, wenn der entsprechende Netzbetreiber ausgewählt ist. Nutzen Sie diese für NB-spezifische Angaben wie Kundennummern oder Zählpunktbezeichnungen.</p>
      </div>
    </div>
  );
}
