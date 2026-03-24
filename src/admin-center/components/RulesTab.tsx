// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - RULES TAB
// Spezielle Regeln pro Netzbetreiber
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useAdminCenterStore } from "../stores";
import type { GridOperatorRule, Condition } from "../../shared/types";
import { CONDITION_FIELDS } from "../../shared/utils";

export function RulesTab() {
  const { 
    rules, 
    gridOperators,
    selectedGridOperatorId,
    setSelectedGridOperator,
    searchQuery, 
    addRule, 
    updateRule, 
    deleteRule,
  } = useAdminCenterStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<GridOperatorRule>>({
    gridOperatorId: "",
    name: "",
    description: "",
    conditions: [],
    effect: { type: "info", message: "" },
    priority: 0,
    active: true,
  });
  const [newCondition, setNewCondition] = useState<Partial<Condition>>({ field: "", operator: "==", value: "" });
  
  const filteredRules = useMemo(() => {
    let result = rules;
    if (selectedGridOperatorId) {
      result = result.filter(r => r.gridOperatorId === selectedGridOperatorId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
    }
    return result.sort((a, b) => b.priority - a.priority);
  }, [rules, selectedGridOperatorId, searchQuery]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gridOperatorId || !formData.name) return;
    
    const data = {
      gridOperatorId: formData.gridOperatorId,
      name: formData.name,
      description: formData.description,
      conditions: formData.conditions || [],
      effect: formData.effect || { type: "info" as const, message: "" },
      priority: formData.priority || 0,
      active: formData.active ?? true,
    };
    
    if (editingId) {
      updateRule(editingId, data);
    } else {
      addRule(data);
    }
    resetForm();
  };
  
  const handleEdit = (rule: GridOperatorRule) => {
    setFormData(rule);
    setEditingId(rule.id);
    setShowForm(true);
  };
  
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Regel "${name}" wirklich löschen?`)) {
      deleteRule(id);
    }
  };
  
  const resetForm = () => {
    setFormData({ gridOperatorId: selectedGridOperatorId || "", name: "", description: "", conditions: [], effect: { type: "info", message: "" }, priority: 0, active: true });
    setNewCondition({ field: "", operator: "==", value: "" });
    setEditingId(null);
    setShowForm(false);
  };
  
  const addCondition = () => {
    if (!newCondition.field) return;
    setFormData({ ...formData, conditions: [...(formData.conditions || []), newCondition as Condition] });
    setNewCondition({ field: "", operator: "==", value: "" });
  };
  
  const removeCondition = (index: number) => {
    const conditions = [...(formData.conditions || [])];
    conditions.splice(index, 1);
    setFormData({ ...formData, conditions });
  };
  
  const getOperatorName = (id: string) => gridOperators.find(op => op.id === id)?.name || "Unbekannt";
  
  const getEffectBadge = (type: string) => {
    switch (type) {
      case "info": return <span className="admin-table__badge admin-table__badge--info">ℹ️ Info</span>;
      case "warning": return <span className="admin-table__badge admin-table__badge--warning">⚠️ Warnung</span>;
      case "error": return <span className="admin-table__badge admin-table__badge--danger">❌ Fehler</span>;
      case "redirect": return <span className="admin-table__badge admin-table__badge--muted">↗️ Weiterleitung</span>;
      case "skip": return <span className="admin-table__badge admin-table__badge--success">⏭️ Überspringen</span>;
      case "require": return <span className="admin-table__badge admin-table__badge--warning">📋 Zusätzlich</span>;
      default: return <span className="admin-table__badge">{type}</span>;
    }
  };
  
  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <div className="admin-tab__header-left">
          <h2 className="admin-tab__title">Spezielle Regeln</h2>
          <span className="admin-tab__count">{filteredRules.length} Einträge</span>
        </div>
        <div className="admin-tab__header-right">
          <select className="admin-tab__filter-select" value={selectedGridOperatorId || ""} onChange={(e) => setSelectedGridOperator(e.target.value || null)}>
            <option value="">Alle Netzbetreiber</option>
            {gridOperators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
          </select>
          <button className="admin-tab__add-btn" onClick={() => setShowForm(true)} disabled={gridOperators.length === 0}>
            <span>➕</span> Regel hinzufügen
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-form admin-form--wide" onSubmit={handleSubmit}>
            <div className="admin-form__header">
              <h3>{editingId ? "Regel bearbeiten" : "Neue Regel"}</h3>
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
                  <label>Name *</label>
                  <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="z.B. Vereinfachtes Verfahren bis 10kWp" required />
                </div>
                <div className="admin-form__field">
                  <label>Priorität</label>
                  <input type="number" value={formData.priority || 0} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} min={0} />
                </div>
              </div>
              <div className="admin-form__field">
                <label>Beschreibung</label>
                <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>
              
              {/* Conditions */}
              <div className="admin-form__section">
                <h4>Bedingungen (wann greift die Regel?)</h4>
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
                    {Object.entries(CONDITION_FIELDS).map(([key, label]) => <option key={key} value={key}>{(typeof label === "object" ? label.label : label) as string}</option>)}
                  </select>
                  <select value={newCondition.operator || "=="} onChange={(e) => setNewCondition({ ...newCondition, operator: e.target.value as any })}>
                    <option value="==">= gleich</option>
                    <option value="!=">≠ ungleich</option>
                    <option value=">">&gt; größer</option>
                    <option value="<">&lt; kleiner</option>
                    <option value=">=">&gt;= größer/gleich</option>
                    <option value="<=">&lt;= kleiner/gleich</option>
                  </select>
                  <input type="text" value={String(newCondition.value || "")} onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })} placeholder="Wert" />
                  <button type="button" className="admin-form__btn admin-form__btn--small" onClick={addCondition}>+</button>
                </div>
              </div>
              
              {/* Effect */}
              <div className="admin-form__section">
                <h4>Effekt (was passiert wenn die Regel greift?)</h4>
                <div className="admin-form__row">
                  <div className="admin-form__field">
                    <label>Typ</label>
                    <select value={formData.effect?.type || "info"} onChange={(e) => setFormData({ ...formData, effect: { ...formData.effect!, type: e.target.value as any } })}>
                      <option value="info">Info anzeigen</option>
                      <option value="warning">Warnung anzeigen</option>
                      <option value="error">Fehler (blockiert)</option>
                      <option value="redirect">Weiterleitung</option>
                      <option value="skip">Dokumente überspringen</option>
                      <option value="require">Zusätzliche Dokumente</option>
                    </select>
                  </div>
                </div>
                <div className="admin-form__field">
                  <label>Nachricht / URL</label>
                  <textarea value={formData.effect?.message || formData.effect?.redirectUrl || ""} onChange={(e) => setFormData({ ...formData, effect: { ...formData.effect!, message: e.target.value } })} placeholder="Nachricht für den Benutzer oder Weiterleitungs-URL" rows={2} />
                </div>
              </div>
              
              <div className="admin-form__field">
                <label className="admin-form__checkbox">
                  <input type="checkbox" checked={formData.active ?? true} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                  <span>Regel aktiv</span>
                </label>
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
              <th>Prio</th>
              <th>Name</th>
              <th>Netzbetreiber</th>
              <th>Bedingungen</th>
              <th>Effekt</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.length === 0 ? (
              <tr><td colSpan={7} className="admin-table__empty">{gridOperators.length === 0 ? "Bitte legen Sie zuerst einen Netzbetreiber an" : "Keine Regeln definiert"}</td></tr>
            ) : (
              filteredRules.map(rule => (
                <tr key={rule.id} className={!rule.active ? "admin-table__row--inactive" : ""}>
                  <td><span className="admin-table__priority">{rule.priority}</span></td>
                  <td><strong>{rule.name}</strong>{rule.description && <small className="admin-table__desc">{rule.description}</small>}</td>
                  <td><span className="admin-table__badge admin-table__badge--info">{getOperatorName(rule.gridOperatorId)}</span></td>
                  <td><small className="admin-table__conditions">{rule.conditions.length > 0 ? rule.conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(", ") : "Immer"}</small></td>
                  <td>{getEffectBadge(rule.effect?.type ?? "info")}</td>
                  <td>{rule.active ? <span className="admin-table__badge admin-table__badge--success">Aktiv</span> : <span className="admin-table__badge admin-table__badge--muted">Inaktiv</span>}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="admin-table__action-btn" onClick={() => handleEdit(rule)}>✏️</button>
                      <button className="admin-table__action-btn admin-table__action-btn--danger" onClick={() => handleDelete(rule.id, rule.name)}>🗑️</button>
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
        <p>Regeln ermöglichen komplexe Logik: z.B. "Bei Anlagen &gt; 30kWp an NB X → zeige Warnung und fordere NVP-Antrag". Regeln mit höherer Priorität werden zuerst geprüft.</p>
      </div>
    </div>
  );
}
