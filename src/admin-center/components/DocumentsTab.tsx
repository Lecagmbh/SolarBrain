// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - DOCUMENTS TAB
// Dokument-Anforderungen pro Netzbetreiber verwalten
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useAdminCenterStore } from "../stores";
import type { DocumentRequirement, DocumentType, Condition } from "../../shared/types";
import { DOCUMENT_TYPE_LABELS, CONDITION_FIELDS } from "../../shared/utils";

export function DocumentsTab() {
  const { 
    documentRequirements, 
    gridOperators,
    selectedGridOperatorId,
    setSelectedGridOperator,
    searchQuery, 
    addDocumentRequirement, 
    updateDocumentRequirement, 
    deleteDocumentRequirement,
  } = useAdminCenterStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DocumentRequirement>>({
    gridOperatorId: "",
    documentType: "lageplan",
    name: "",
    description: "",
    conditions: [],
    required: true,
    helpText: "",
    sortOrder: 0,
  });
  
  // Condition builder state
  const [newCondition, setNewCondition] = useState<Partial<Condition>>({
    field: "",
    operator: "==",
    value: "",
  });
  
  // Filter documents
  const filteredDocuments = useMemo(() => {
    let result = documentRequirements;
    
    // Filter by selected grid operator
    if (selectedGridOperatorId) {
      result = result.filter(d => d.gridOperatorId === selectedGridOperatorId || !d.gridOperatorId);
    }
    
    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) ||
        (d.documentType?.toLowerCase() ?? "").includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }
    
    return result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [documentRequirements, selectedGridOperatorId, searchQuery]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.documentType) return;
    
    const data = {
      gridOperatorId: formData.gridOperatorId || "",
      documentType: formData.documentType as DocumentType,
      name: formData.name,
      description: formData.description,
      conditions: formData.conditions || [],
      required: formData.required ?? true,
      helpText: formData.helpText,
      templateUrl: formData.templateUrl,
      maxFileSizeMb: formData.maxFileSizeMb,
      sortOrder: formData.sortOrder || 0,
    };
    
    if (editingId) {
      updateDocumentRequirement(editingId, data);
    } else {
      addDocumentRequirement(data);
    }
    
    resetForm();
  };
  
  const handleEdit = (doc: DocumentRequirement) => {
    setFormData(doc);
    setEditingId(doc.id);
    setShowForm(true);
  };
  
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Dokument-Anforderung "${name}" wirklich löschen?`)) {
      deleteDocumentRequirement(id);
    }
  };
  
  const resetForm = () => {
    setFormData({
      gridOperatorId: selectedGridOperatorId || "",
      documentType: "lageplan",
      name: "",
      description: "",
      conditions: [],
      required: true,
      helpText: "",
      sortOrder: 0,
    });
    setNewCondition({ field: "", operator: "==", value: "" });
    setEditingId(null);
    setShowForm(false);
  };
  
  const addCondition = () => {
    if (!newCondition.field || !newCondition.operator) return;
    const conditions = [...(formData.conditions || []), newCondition as Condition];
    setFormData({ ...formData, conditions });
    setNewCondition({ field: "", operator: "==", value: "" });
  };
  
  const removeCondition = (index: number) => {
    const conditions = [...(formData.conditions || [])];
    conditions.splice(index, 1);
    setFormData({ ...formData, conditions });
  };
  
  const getOperatorLabel = (operatorId: string) => {
    if (!operatorId) return "Alle Netzbetreiber";
    const op = gridOperators.find(o => o.id === operatorId);
    return op?.name || "Unbekannt";
  };
  
  const formatConditions = (conditions: Condition[]) => {
    if (!conditions || conditions.length === 0) return "Immer";
    return conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(" UND ");
  };
  
  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <div className="admin-tab__header-left">
          <h2 className="admin-tab__title">Dokument-Anforderungen</h2>
          <span className="admin-tab__count">{filteredDocuments.length} Einträge</span>
        </div>
        <div className="admin-tab__header-right">
          <select 
            className="admin-tab__filter-select"
            value={selectedGridOperatorId || ""}
            onChange={(e) => setSelectedGridOperator(e.target.value || null)}
          >
            <option value="">Alle Netzbetreiber</option>
            {gridOperators.map(op => (
              <option key={op.id} value={op.id}>{op.name}</option>
            ))}
          </select>
          <button className="admin-tab__add-btn" onClick={() => setShowForm(true)}>
            <span>➕</span> Anforderung hinzufügen
          </button>
        </div>
      </div>
      
      {/* Form */}
      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-form admin-form--wide" onSubmit={handleSubmit}>
            <div className="admin-form__header">
              <h3>{editingId ? "Anforderung bearbeiten" : "Neue Dokument-Anforderung"}</h3>
              <button type="button" className="admin-form__close" onClick={resetForm}>×</button>
            </div>
            <div className="admin-form__body">
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Netzbetreiber</label>
                  <select value={formData.gridOperatorId || ""} onChange={(e) => setFormData({ ...formData, gridOperatorId: e.target.value })}>
                    <option value="">Alle (Standard-Anforderung)</option>
                    {gridOperators.map(op => (
                      <option key={op.id} value={op.id}>{op.name}</option>
                    ))}
                  </select>
                  <small>Leer = gilt für alle Netzbetreiber</small>
                </div>
                <div className="admin-form__field">
                  <label>Dokumenttyp *</label>
                  <select value={formData.documentType} onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })} required>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Name / Bezeichnung *</label>
                  <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="z.B. Lageplan mit Modulbelegung" required />
                </div>
                <div className="admin-form__field">
                  <label>Sortierung</label>
                  <input type="number" value={formData.sortOrder || 0} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} min={0} />
                </div>
              </div>
              
              <div className="admin-form__field">
                <label>Beschreibung</label>
                <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detaillierte Beschreibung..." rows={2} />
              </div>
              
              <div className="admin-form__field">
                <label>Hilfetext für Benutzer</label>
                <textarea value={formData.helpText || ""} onChange={(e) => setFormData({ ...formData, helpText: e.target.value })} placeholder="Tipps für den Benutzer..." rows={2} />
              </div>
              
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Vorlage URL</label>
                  <input type="url" value={formData.templateUrl || ""} onChange={(e) => setFormData({ ...formData, templateUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="admin-form__field">
                  <label>Max. Dateigröße (MB)</label>
                  <input type="number" value={formData.maxFileSizeMb || ""} onChange={(e) => setFormData({ ...formData, maxFileSizeMb: parseInt(e.target.value) || undefined })} min={1} max={100} />
                </div>
              </div>
              
              <div className="admin-form__field">
                <label className="admin-form__checkbox">
                  <input type="checkbox" checked={formData.required ?? true} onChange={(e) => setFormData({ ...formData, required: e.target.checked })} />
                  <span>Pflichtdokument</span>
                </label>
              </div>
              
              {/* Conditions Builder */}
              <div className="admin-form__section">
                <h4>Bedingungen (wann wird das Dokument benötigt?)</h4>
                
                {(formData.conditions || []).length > 0 && (
                  <div className="admin-form__conditions">
                    {formData.conditions?.map((c, i) => (
                      <div key={i} className="admin-form__condition-tag">
                        <code>{c.field} {c.operator} {String(c.value)}</code>
                        <button type="button" onClick={() => removeCondition(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="admin-form__condition-builder">
                  <select value={newCondition.field || ""} onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value })}>
                    <option value="">Feld wählen...</option>
                    {Object.entries(CONDITION_FIELDS).map(([key, label]) => (
                      <option key={key} value={key}>{(typeof label === "object" ? label.label : label) as string}</option>
                    ))}
                  </select>
                  <select value={newCondition.operator || "=="} onChange={(e) => setNewCondition({ ...newCondition, operator: e.target.value as any })}>
                    <option value="==">= gleich</option>
                    <option value="!=">≠ ungleich</option>
                    <option value=">">&gt; größer</option>
                    <option value="<">&lt; kleiner</option>
                    <option value=">=">&gt;= größer/gleich</option>
                    <option value="<=">&lt;= kleiner/gleich</option>
                    <option value="in">in Liste</option>
                    <option value="exists">existiert</option>
                  </select>
                  <input type="text" value={String(newCondition.value || "")} onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })} placeholder="Wert" />
                  <button type="button" className="admin-form__btn admin-form__btn--small" onClick={addCondition}>+</button>
                </div>
                <small>Keine Bedingungen = Dokument wird immer angefordert</small>
              </div>
            </div>
            
            <div className="admin-form__footer">
              <button type="button" className="admin-form__btn admin-form__btn--secondary" onClick={resetForm}>Abbrechen</button>
              <button type="submit" className="admin-form__btn admin-form__btn--primary">{editingId ? "Speichern" : "Hinzufügen"}</button>
            </div>
          </form>
        </div>
      )}
      
      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Typ</th>
              <th>Netzbetreiber</th>
              <th>Bedingungen</th>
              <th>Pflicht</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr><td colSpan={7} className="admin-table__empty">Keine Dokument-Anforderungen gefunden</td></tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td><span className="admin-table__sort">{doc.sortOrder}</span></td>
                  <td>
                    <div>
                      <strong>{doc.name}</strong>
                      {doc.description && <small className="admin-table__desc">{doc.description}</small>}
                    </div>
                  </td>
                  <td><code>{DOCUMENT_TYPE_LABELS[doc.documentType ?? "sonstiges"] || doc.documentType}</code></td>
                  <td>
                    {doc.gridOperatorId ? (
                      <span className="admin-table__badge admin-table__badge--info">{getOperatorLabel(doc.gridOperatorId)}</span>
                    ) : (
                      <span className="admin-table__badge admin-table__badge--muted">Alle</span>
                    )}
                  </td>
                  <td><small className="admin-table__conditions">{formatConditions(doc.conditions ?? [])}</small></td>
                  <td>
                    {doc.required ? (
                      <span className="admin-table__badge admin-table__badge--warning">Pflicht</span>
                    ) : (
                      <span className="admin-table__badge admin-table__badge--muted">Optional</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="admin-table__action-btn" title="Bearbeiten" onClick={() => handleEdit(doc)}>✏️</button>
                      <button className="admin-table__action-btn admin-table__action-btn--danger" title="Löschen" onClick={() => handleDelete(doc.id, doc.name)}>🗑️</button>
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
        <p>
          <strong>Bedingungen</strong> steuern, wann ein Dokument angefordert wird. 
          Beispiel: "pv.kwp &gt; 10" bedeutet, das Dokument wird nur bei PV-Anlagen über 10 kWp benötigt.
          Anforderungen ohne Netzbetreiber gelten als Standard für alle.
        </p>
      </div>
    </div>
  );
}
