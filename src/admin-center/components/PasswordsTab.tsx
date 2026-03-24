// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - PASSWORDS TAB
// Passwörter für NB-Portale, MaStR, ZEREZ etc.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useAdminCenterStore } from "../stores";
import type { StoredPassword } from "../../shared/types";

export function PasswordsTab() {
  const { 
    passwords, 
    gridOperators,
    searchQuery, 
    addPassword, 
    updatePassword, 
    deletePassword,
  } = useAdminCenterStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [filterCategory, setFilterCategory] = useState<StoredPassword["category"] | "all">("all");
  const [formData, setFormData] = useState<Partial<StoredPassword>>({
    category: "nb_portal",
    name: "",
    url: "",
    username: "",
    password: "",
    notes: "",
    gridOperatorId: "",
  });
  
  const filteredPasswords = useMemo(() => {
    let result = passwords;
    if (filterCategory !== "all") {
      result = result.filter(p => p.category === filterCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => (p.name ?? "").toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || p.url?.toLowerCase().includes(q));
    }
    return result.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [passwords, filterCategory, searchQuery]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) return;
    
    const data = {
      category: formData.category as StoredPassword["category"],
      name: formData.name,
      url: formData.url,
      username: formData.username,
      password: formData.password,
      notes: formData.notes,
      gridOperatorId: formData.gridOperatorId,
    };
    
    if (editingId) {
      updatePassword(editingId, data);
    } else {
      addPassword(data);
    }
    resetForm();
  };
  
  const handleEdit = (pw: StoredPassword) => {
    setFormData(pw);
    setEditingId(pw.id);
    setShowForm(true);
  };
  
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Passwort "${name}" wirklich löschen?`)) {
      deletePassword(id);
    }
  };
  
  const resetForm = () => {
    setFormData({ category: "nb_portal", name: "", url: "", username: "", password: "", notes: "", gridOperatorId: "" });
    setEditingId(null);
    setShowForm(false);
  };
  
  const toggleShowPassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} kopiert!`);
  };
  
  const getCategoryBadge = (category: StoredPassword["category"]) => {
    switch (category) {
      case "nb_portal": return <span className="admin-table__badge admin-table__badge--info">🏢 NB-Portal</span>;
      case "mastr": return <span className="admin-table__badge admin-table__badge--success">📊 MaStR</span>;
      case "zerez": return <span className="admin-table__badge admin-table__badge--warning">📜 ZEREZ</span>;
      case "other": return <span className="admin-table__badge admin-table__badge--muted">📁 Sonstiges</span>;
    }
  };
  
  const stats = {
    total: passwords.length,
    nb_portal: passwords.filter(p => p.category === "nb_portal").length,
    mastr: passwords.filter(p => p.category === "mastr").length,
    zerez: passwords.filter(p => p.category === "zerez").length,
    other: passwords.filter(p => p.category === "other").length,
  };
  
  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <div className="admin-tab__header-left">
          <h2 className="admin-tab__title">🔐 Passwörter</h2>
          <span className="admin-tab__count">{filteredPasswords.length} Einträge</span>
        </div>
        <button className="admin-tab__add-btn" onClick={() => setShowForm(true)}>
          <span>➕</span> Passwort hinzufügen
        </button>
      </div>
      
      {/* Filter */}
      <div className="admin-tab__stats">
        <button className={`admin-tab__stat-btn ${filterCategory === "all" ? "active" : ""}`} onClick={() => setFilterCategory("all")}>
          Alle <span>{stats.total}</span>
        </button>
        <button className={`admin-tab__stat-btn ${filterCategory === "nb_portal" ? "active" : ""}`} onClick={() => setFilterCategory("nb_portal")}>
          🏢 NB-Portale <span>{stats.nb_portal}</span>
        </button>
        <button className={`admin-tab__stat-btn ${filterCategory === "mastr" ? "active" : ""}`} onClick={() => setFilterCategory("mastr")}>
          📊 MaStR <span>{stats.mastr}</span>
        </button>
        <button className={`admin-tab__stat-btn ${filterCategory === "zerez" ? "active" : ""}`} onClick={() => setFilterCategory("zerez")}>
          📜 ZEREZ <span>{stats.zerez}</span>
        </button>
        <button className={`admin-tab__stat-btn ${filterCategory === "other" ? "active" : ""}`} onClick={() => setFilterCategory("other")}>
          📁 Sonstiges <span>{stats.other}</span>
        </button>
      </div>
      
      {/* Form */}
      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form__header">
              <h3>{editingId ? "Passwort bearbeiten" : "Neues Passwort"}</h3>
              <button type="button" className="admin-form__close" onClick={resetForm}>×</button>
            </div>
            <div className="admin-form__body">
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Kategorie *</label>
                  <select value={formData.category || "nb_portal"} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}>
                    <option value="nb_portal">NB-Portal</option>
                    <option value="mastr">Marktstammdatenregister</option>
                    <option value="zerez">ZEREZ</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                <div className="admin-form__field">
                  <label>Netzbetreiber (optional)</label>
                  <select value={formData.gridOperatorId || ""} onChange={(e) => setFormData({ ...formData, gridOperatorId: e.target.value })}>
                    <option value="">Keiner</option>
                    {gridOperators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="admin-form__field">
                <label>Name / Bezeichnung *</label>
                <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="z.B. Bayernwerk Portal" required />
              </div>
              <div className="admin-form__field">
                <label>URL</label>
                <input type="url" value={formData.url || ""} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://portal.bayernwerk.de" />
              </div>
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label>Benutzername *</label>
                  <input type="text" value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                <div className="admin-form__field">
                  <label>Passwort *</label>
                  <input type="password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                </div>
              </div>
              <div className="admin-form__field">
                <label>Notizen</label>
                <textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Zusätzliche Informationen..." />
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
              <th>Name</th>
              <th>Kategorie</th>
              <th>Benutzername</th>
              <th>Passwort</th>
              <th>URL</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredPasswords.length === 0 ? (
              <tr><td colSpan={6} className="admin-table__empty">Keine Passwörter gespeichert</td></tr>
            ) : (
              filteredPasswords.map(pw => (
                <tr key={pw.id}>
                  <td><strong>{pw.name}</strong>{pw.notes && <small className="admin-table__desc">{pw.notes}</small>}</td>
                  <td>{getCategoryBadge(pw.category)}</td>
                  <td>
                    <code>{pw.username}</code>
                    <button className="admin-table__copy-btn" onClick={() => copyToClipboard(pw.username, "Benutzername")} title="Kopieren">📋</button>
                  </td>
                  <td>
                    <code>{showPassword[pw.id] ? pw.password : "••••••••"}</code>
                    <button className="admin-table__copy-btn" onClick={() => toggleShowPassword(pw.id)} title={showPassword[pw.id] ? "Verbergen" : "Anzeigen"}>
                      {showPassword[pw.id] ? "🙈" : "👁️"}
                    </button>
                    <button className="admin-table__copy-btn" onClick={() => copyToClipboard(pw.password, "Passwort")} title="Kopieren">📋</button>
                  </td>
                  <td>
                    {pw.url ? (
                      <a href={pw.url} target="_blank" rel="noopener noreferrer" className="admin-table__link">🔗 Öffnen</a>
                    ) : "—"}
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="admin-table__action-btn" onClick={() => handleEdit(pw)}>✏️</button>
                      <button className="admin-table__action-btn admin-table__action-btn--danger" onClick={() => handleDelete(pw.id, pw.name ?? "")}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="admin-tab__warning">
        <span>⚠️</span>
        <p><strong>Sicherheitshinweis:</strong> Passwörter werden im Browser-Speicher abgelegt. Für sensible Zugangsdaten empfehlen wir einen dedizierten Passwort-Manager.</p>
      </div>
    </div>
  );
}
