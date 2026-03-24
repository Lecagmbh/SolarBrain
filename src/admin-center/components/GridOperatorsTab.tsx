// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - GRID OPERATORS TAB
// Netzbetreiber anlegen, bearbeiten, löschen
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useAdminCenterStore } from "../stores";
import type { GridOperator } from "../../shared/types";

export function GridOperatorsTab() {
  const { 
    gridOperators, 
    searchQuery, 
    addGridOperator, 
    updateGridOperator, 
    deleteGridOperator,
    plzMappings,
    documentRequirements,
    setActiveTab,
    setSelectedGridOperator,
  } = useAdminCenterStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<GridOperator>>({
    name: "",
    shortName: "",
    website: "",
    portalUrl: "",
    email: "",
    phone: "",
    bdewCode: "",
    active: true,
    verified: false,
  });
  
  const filteredOperators = useMemo(() => {
    if (!searchQuery) return gridOperators;
    const q = searchQuery.toLowerCase();
    return gridOperators.filter(op => 
      op.name.toLowerCase().includes(q) ||
      op.shortName?.toLowerCase().includes(q) ||
      op.bdewCode?.toLowerCase().includes(q)
    );
  }, [gridOperators, searchQuery]);
  
  const getRelatedCounts = (operatorId: string) => {
    const plzCount = plzMappings.filter(m => m.gridOperatorId === operatorId).length;
    const docCount = documentRequirements.filter(d => d.gridOperatorId === operatorId).length;
    return { plzCount, docCount };
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateGridOperator(editingId, formData);
    } else {
      addGridOperator({
        name: formData.name || "",
        shortName: formData.shortName,
        website: formData.website,
        portalUrl: formData.portalUrl,
        email: formData.email,
        phone: formData.phone,
        bdewCode: formData.bdewCode,
        active: formData.active ?? true,
        verified: formData.verified ?? false,
      });
    }
    resetForm();
  };
  
  const handleEdit = (operator: GridOperator) => {
    setFormData(operator);
    setEditingId(operator.id);
    setShowForm(true);
  };
  
  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" wirklich löschen?\n\nAlle zugehörigen PLZ-Zuordnungen und Regeln werden ebenfalls gelöscht!`)) {
      deleteGridOperator(id);
    }
  };
  
  const resetForm = () => {
    setFormData({ name: "", shortName: "", website: "", portalUrl: "", email: "", phone: "", bdewCode: "", active: true, verified: false });
    setEditingId(null);
    setShowForm(false);
  };
  
  const handleViewDetails = (operatorId: string) => {
    setSelectedGridOperator(operatorId);
    setActiveTab("documents");
  };
  
  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <div className="admin-tab__header-left">
          <h2 className="admin-tab__title">Netzbetreiber</h2>
          <span className="admin-tab__count">{filteredOperators.length} Einträge</span>
        </div>
        <button className="admin-tab__add-btn" onClick={() => setShowForm(true)}>
          <span>➕</span> Netzbetreiber hinzufügen
        </button>
      </div>
      
      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form__header">
              <h3>{editingId ? "Netzbetreiber bearbeiten" : "Neuer Netzbetreiber"}</h3>
              <button type="button" className="admin-form__close" onClick={resetForm}>×</button>
            </div>
            <div className="admin-form__body">
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Name *</label>
                  <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="z.B. Stadtwerke München" required />
                </div>
                <div className="admin-form__field">
                  <label>Kurzname</label>
                  <input type="text" value={formData.shortName || ""} onChange={(e) => setFormData({ ...formData, shortName: e.target.value })} placeholder="z.B. SWM" />
                </div>
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Website</label>
                  <input type="url" value={formData.website || ""} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://www.swm.de" />
                </div>
                <div className="admin-form__field">
                  <label>Anmeldeportal URL</label>
                  <input type="url" value={formData.portalUrl || ""} onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })} placeholder="https://portal.swm.de" />
                </div>
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>E-Mail</label>
                  <input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="netzanschluss@swm.de" />
                </div>
                <div className="admin-form__field">
                  <label>Telefon</label>
                  <input type="tel" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+49 89 123456" />
                </div>
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>BDEW Code</label>
                  <input type="text" value={formData.bdewCode || ""} onChange={(e) => setFormData({ ...formData, bdewCode: e.target.value })} placeholder="4-stelliger Code" />
                </div>
                <div className="admin-form__field admin-form__field--checkboxes">
                  <label className="admin-form__checkbox">
                    <input type="checkbox" checked={formData.active ?? true} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                    <span>Aktiv</span>
                  </label>
                  <label className="admin-form__checkbox">
                    <input type="checkbox" checked={formData.verified ?? false} onChange={(e) => setFormData({ ...formData, verified: e.target.checked })} />
                    <span>Verifiziert</span>
                  </label>
                </div>
              </div>
              <div className="admin-form__field">
                <label>Notizen</label>
                <textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Interne Notizen..." rows={3} />
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
              <th>Name</th>
              <th>Kurzname</th>
              <th>BDEW</th>
              <th>PLZ</th>
              <th>Dokumente</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredOperators.length === 0 ? (
              <tr><td colSpan={7} className="admin-table__empty">{searchQuery ? `Keine Netzbetreiber gefunden für "${searchQuery}"` : "Noch keine Netzbetreiber angelegt"}</td></tr>
            ) : (
              filteredOperators.map((op) => {
                const counts = getRelatedCounts(op.id);
                return (
                  <tr key={op.id}>
                    <td><div className="admin-table__name"><strong>{op.name}</strong>{op.website && <a href={op.website} target="_blank" rel="noopener noreferrer" className="admin-table__link">🔗</a>}</div></td>
                    <td>{op.shortName || "—"}</td>
                    <td><code>{op.bdewCode || "—"}</code></td>
                    <td><span className="admin-table__count">{counts.plzCount}</span></td>
                    <td><span className="admin-table__count">{counts.docCount}</span></td>
                    <td>
                      <div className="admin-table__status">
                        {op.active ? <span className="admin-table__badge admin-table__badge--success">Aktiv</span> : <span className="admin-table__badge admin-table__badge--muted">Inaktiv</span>}
                        {op.verified && <span className="admin-table__badge admin-table__badge--info">✓</span>}
                      </div>
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button className="admin-table__action-btn" title="Details" onClick={() => handleViewDetails(op.id)}>👁️</button>
                        <button className="admin-table__action-btn" title="Bearbeiten" onClick={() => handleEdit(op)}>✏️</button>
                        <button className="admin-table__action-btn admin-table__action-btn--danger" title="Löschen" onClick={() => handleDelete(op.id, op.name)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="admin-tab__hint">
        <span>💡</span>
        <p>Netzbetreiber werden automatisch mit PLZ-Zuordnungen verknüpft. Wenn ein Benutzer im Wizard eine PLZ eingibt und den Netzbetreiber auswählt, lernt das System diese Zuordnung automatisch.</p>
      </div>
    </div>
  );
}
