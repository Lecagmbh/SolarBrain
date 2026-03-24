/**
 * NETZBETREIBER VERWALTUNG - V2 MIT ECHTER DB
 * - CRUD aus /api/netzbetreiber
 * - PLZ-Bereiche verwalten
 * - Statistiken aus Installationen
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import api, { apiGet } from "../../modules/api/client";
import "./netzbetreiber.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Netzbetreiber {
  id: number;
  name: string;
  kurzname?: string;
  bdewCode?: string;
  email?: string;
  telefon?: string;
  website?: string;
  portalUrl?: string;
  portalHinweise?: string;
  plzBereiche?: string[];
  aktiv: boolean;
  // Stats (berechnet)
  installationsCount?: number;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Building: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Globe: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Phone: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Loader: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nb-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  ExternalLink: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NetzbetreiberPage() {
  const [netzbetreiber, setNetzbetreiber] = useState<Netzbetreiber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNB, setEditingNB] = useState<Netzbetreiber | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [installationStats, setInstallationStats] = useState<Record<string, number>>({});

  // Toast Helper
  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = `t-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Load Netzbetreiber
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Lade NB aus DB
      const nbRes = await apiGet("/netzbetreiber?limit=500");
      const nbList = nbRes.data || nbRes || [];

      // Lade Installations für Stats
      const instRes = await apiGet("/installations");
      const installations = instRes.data || instRes || [];

      // Zähle Installationen pro NB
      const stats: Record<string, number> = {};
      installations.forEach((inst: any) => {
        const nbName = inst.gridOperator || inst.netzbetreiber;
        if (nbName) {
          stats[nbName] = (stats[nbName] || 0) + 1;
        }
      });
      setInstallationStats(stats);

      // Merge Stats in NB
      const enriched = nbList.map((nb: Netzbetreiber) => ({
        ...nb,
        installationsCount: stats[nb.name] || 0
      }));

      setNetzbetreiber(enriched);
    } catch (e) {
      console.error("[NB] Load error:", e);
      addToast("error", "Fehler beim Laden der Netzbetreiber");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter
  const filtered = useMemo(() => {
    if (!search) return netzbetreiber;
    const q = search.toLowerCase();
    return netzbetreiber.filter(nb => 
      nb.name.toLowerCase().includes(q) ||
      nb.kurzname?.toLowerCase().includes(q) ||
      nb.bdewCode?.toLowerCase().includes(q)
    );
  }, [netzbetreiber, search]);

  // Handlers
  const handleEdit = (nb: Netzbetreiber) => {
    setEditingNB(nb);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingNB(null);
    setShowModal(true);
  };

  const handleDelete = async (nb: Netzbetreiber) => {
    if (!confirm(`"${nb.name}" wirklich löschen?`)) return;
    
    try {
      await api.delete(`/netzbetreiber/${nb.id}`);
      addToast("success", "Netzbetreiber gelöscht");
      loadData();
    } catch (e: any) {
      addToast("error", e.response?.data?.message || "Fehler beim Löschen");
    }
  };

  const handleSave = async (data: Partial<Netzbetreiber>) => {
    try {
      if (editingNB) {
        await api.put(`/netzbetreiber/${editingNB.id}`, data);
        addToast("success", "Netzbetreiber aktualisiert");
      } else {
        await api.post("/netzbetreiber", data);
        addToast("success", "Netzbetreiber erstellt");
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      addToast("error", e.response?.data?.message || "Fehler beim Speichern");
    }
  };

  // Stats
  const totalInstallations = Object.values(installationStats).reduce((a, b) => a + b, 0);
  const activeNB = netzbetreiber.filter(nb => nb.aktiv).length;

  return (
    <div className="nb-page">
      {/* Background */}
      <div className="nb-bg">
        <div className="nb-bg__orb nb-bg__orb--1" />
        <div className="nb-bg__orb nb-bg__orb--2" />
        <div className="nb-bg__grid" />
      </div>

      {/* Toasts */}
      <div className="nb-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`nb-toast nb-toast--${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="nb-header">
        <div className="nb-header__left">
          <div className="nb-header__icon"><Icons.Building /></div>
          <div>
            <h1 className="nb-header__title">Netzbetreiber</h1>
            <p className="nb-header__subtitle">{netzbetreiber.length} Netzbetreiber • {totalInstallations} Vorgänge</p>
          </div>
        </div>
        <button className="nb-btn nb-btn--primary" onClick={handleNew}>
          <Icons.Plus /> Neuer Netzbetreiber
        </button>
      </header>

      {/* Stats Bar */}
      <div className="nb-stats-bar">
        <div className="nb-stat-card">
          <div className="nb-stat-card__value">{netzbetreiber.length}</div>
          <div className="nb-stat-card__label">Gesamt</div>
        </div>
        <div className="nb-stat-card">
          <div className="nb-stat-card__value">{activeNB}</div>
          <div className="nb-stat-card__label">Aktiv</div>
        </div>
        <div className="nb-stat-card">
          <div className="nb-stat-card__value">{totalInstallations}</div>
          <div className="nb-stat-card__label">Vorgänge</div>
        </div>
      </div>

      {/* Search */}
      <div className="nb-toolbar">
        <div className="nb-search">
          <Icons.Search />
          <input 
            type="text" 
            placeholder="Netzbetreiber suchen..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="nb-content">
        {loading ? (
          <div className="nb-loading">
            <Icons.Loader />
            <span>Lade Netzbetreiber...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="nb-empty">
            <Icons.Building />
            <h3>Keine Netzbetreiber gefunden</h3>
            <p>Erstellen Sie einen neuen Netzbetreiber</p>
            <button className="nb-btn nb-btn--primary" onClick={handleNew}>
              <Icons.Plus /> Neuer Netzbetreiber
            </button>
          </div>
        ) : (
          <div className="nb-grid">
            {filtered.map(nb => (
              <NetzbetreiberCard 
                key={nb.id} 
                nb={nb} 
                onEdit={() => handleEdit(nb)}
                onDelete={() => handleDelete(nb)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NetzbetreiberModal 
          nb={editingNB}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NETZBETREIBER CARD
// ═══════════════════════════════════════════════════════════════════════════

function NetzbetreiberCard({ nb, onEdit, onDelete }: { 
  nb: Netzbetreiber; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`nb-card ${!nb.aktiv ? "nb-card--inactive" : ""}`}>
      <div className="nb-card__header">
        <div className="nb-card__icon">
          <Icons.Zap />
        </div>
        <div className="nb-card__info">
          <h3 className="nb-card__name">{nb.name}</h3>
          {nb.kurzname && <span className="nb-card__short">{nb.kurzname}</span>}
        </div>
        <div className="nb-card__actions">
          <button className="nb-card__action" onClick={onEdit} title="Bearbeiten">
            <Icons.Edit />
          </button>
          <button className="nb-card__action nb-card__action--danger" onClick={onDelete} title="Löschen">
            <Icons.Trash />
          </button>
        </div>
      </div>
      
      <div className="nb-card__body">
        {nb.bdewCode && (
          <div className="nb-card__row">
            <span className="nb-card__label">BDEW-Code</span>
            <span className="nb-card__value">{nb.bdewCode}</span>
          </div>
        )}
        
        {nb.email && (
          <div className="nb-card__row">
            <Icons.Mail />
            <a href={`mailto:${nb.email}`} className="nb-card__link">{nb.email}</a>
          </div>
        )}
        
        {nb.telefon && (
          <div className="nb-card__row">
            <Icons.Phone />
            <span>{nb.telefon}</span>
          </div>
        )}
        
        {nb.portalUrl && (
          <div className="nb-card__row">
            <Icons.Globe />
            <a href={nb.portalUrl} target="_blank" rel="noopener noreferrer" className="nb-card__link">
              Portal <Icons.ExternalLink />
            </a>
          </div>
        )}
      </div>
      
      <div className="nb-card__footer">
        <div className="nb-card__stat">
          <span className="nb-card__stat-value">{nb.installationsCount || 0}</span>
          <span className="nb-card__stat-label">Vorgänge</span>
        </div>
        <div className={`nb-card__status ${nb.aktiv ? "nb-card__status--active" : "nb-card__status--inactive"}`}>
          {nb.aktiv ? "Aktiv" : "Inaktiv"}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NETZBETREIBER MODAL (Create/Edit)
// ═══════════════════════════════════════════════════════════════════════════

function NetzbetreiberModal({ nb, onClose, onSave }: {
  nb: Netzbetreiber | null;
  onClose: () => void;
  onSave: (data: Partial<Netzbetreiber>) => void;
}) {
  const [form, setForm] = useState({
    name: nb?.name || "",
    kurzname: nb?.kurzname || "",
    bdewCode: nb?.bdewCode || "",
    email: nb?.email || "",
    telefon: nb?.telefon || "",
    website: nb?.website || "",
    portalUrl: nb?.portalUrl || "",
    portalHinweise: nb?.portalHinweise || "",
    plzBereiche: nb?.plzBereiche?.join(", ") || "",
    aktiv: nb?.aktiv ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    setSaving(true);
    
    // Parse PLZ-Bereiche
    const plzBereiche = form.plzBereiche
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    
    await onSave({
      name: form.name.trim(),
      kurzname: form.kurzname.trim() || undefined,
      bdewCode: form.bdewCode.trim() || undefined,
      email: form.email.trim() || undefined,
      telefon: form.telefon.trim() || undefined,
      website: form.website.trim() || undefined,
      portalUrl: form.portalUrl.trim() || undefined,
      portalHinweise: form.portalHinweise.trim() || undefined,
      plzBereiche: plzBereiche.length > 0 ? plzBereiche : undefined,
      aktiv: form.aktiv,
    });
    
    setSaving(false);
  };

  return (
    <div className="nb-modal-overlay" onClick={onClose}>
      <div className="nb-modal" onClick={e => e.stopPropagation()}>
        <div className="nb-modal__header">
          <h2>{nb ? "Netzbetreiber bearbeiten" : "Neuer Netzbetreiber"}</h2>
          <button className="nb-modal__close" onClick={onClose}><Icons.X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="nb-modal__body">
          <div className="nb-form-grid">
            <div className="nb-form-group nb-form-group--full">
              <label>Name *</label>
              <input 
                type="text" 
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="z.B. Stromnetz Berlin GmbH"
                required
                autoFocus
              />
            </div>
            
            <div className="nb-form-group">
              <label>Kurzname</label>
              <input 
                type="text" 
                value={form.kurzname}
                onChange={e => setForm(f => ({ ...f, kurzname: e.target.value }))}
                placeholder="z.B. SNB"
              />
            </div>
            
            <div className="nb-form-group">
              <label>BDEW-Code</label>
              <input 
                type="text" 
                value={form.bdewCode}
                onChange={e => setForm(f => ({ ...f, bdewCode: e.target.value }))}
                placeholder="z.B. 9900123456789"
              />
            </div>
            
            <div className="nb-form-group">
              <label>E-Mail</label>
              <input 
                type="email" 
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="netzanschluss@example.de"
              />
            </div>
            
            <div className="nb-form-group">
              <label>Telefon</label>
              <input 
                type="text" 
                value={form.telefon}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                placeholder="+49 30 123456"
              />
            </div>
            
            <div className="nb-form-group">
              <label>Website</label>
              <input 
                type="url" 
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://www.example.de"
              />
            </div>
            
            <div className="nb-form-group">
              <label>Portal-URL</label>
              <input 
                type="url" 
                value={form.portalUrl}
                onChange={e => setForm(f => ({ ...f, portalUrl: e.target.value }))}
                placeholder="https://portal.example.de"
              />
            </div>
            
            <div className="nb-form-group nb-form-group--full">
              <label>PLZ-Bereiche <span className="nb-form-hint">(kommagetrennt, z.B. 10115, 10000-10999, 12*)</span></label>
              <input 
                type="text" 
                value={form.plzBereiche}
                onChange={e => setForm(f => ({ ...f, plzBereiche: e.target.value }))}
                placeholder="10115, 10000-10999, 12*"
              />
            </div>
            
            <div className="nb-form-group nb-form-group--full">
              <label>Portal-Hinweise</label>
              <textarea 
                value={form.portalHinweise}
                onChange={e => setForm(f => ({ ...f, portalHinweise: e.target.value }))}
                placeholder="Hinweise zur Nutzung des Portals, Zugangsdaten etc."
                rows={3}
              />
            </div>
            
            <div className="nb-form-group nb-form-group--full">
              <label className="nb-checkbox">
                <input 
                  type="checkbox" 
                  checked={form.aktiv}
                  onChange={e => setForm(f => ({ ...f, aktiv: e.target.checked }))}
                />
                <span>Aktiv</span>
              </label>
            </div>
          </div>
        </form>
        
        <div className="nb-modal__footer">
          <button type="button" className="nb-btn nb-btn--secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button 
            type="submit" 
            className="nb-btn nb-btn--primary"
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
          >
            {saving ? <Icons.Loader /> : <Icons.Check />}
            {nb ? "Speichern" : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
