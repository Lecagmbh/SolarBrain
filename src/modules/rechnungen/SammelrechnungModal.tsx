// src/modules/rechnungen/SammelrechnungModal.tsx
import { useState, useMemo } from 'react';
import { X, FileStack, Check, AlertTriangle, Loader2, Sparkles, User } from 'lucide-react';

interface RechnungItem {
  id: number;
  rechnungsnummer: string;
  kunde_name: string;
  kundeId?: number;
  installation_name?: string | null; // NEU: Installation customerName
  anlage_bezeichnung?: string | null;
  betrag_netto: number;
  betrag_brutto: number;
  status: string;
}

interface SammelrechnungModalProps {
  isOpen: boolean;
  onClose: () => void;
  rechnungen: RechnungItem[];
  onCreateSammelrechnung: (rechnungIds: number[]) => Promise<void>;
}

export default function SammelrechnungModal({ 
  isOpen, 
  onClose, 
  rechnungen,
  onCreateSammelrechnung 
}: SammelrechnungModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // Gruppiere nach Kunde - nur ENTWURF und OFFEN
  const kundenGroups = useMemo(() => {
    const groups: Record<string, { kundeId: number; kundeName: string; items: RechnungItem[] }> = {};
    
    for (const r of rechnungen) {
      if (r.status !== 'ENTWURF' && r.status !== 'OFFEN' && r.status !== 'VERSENDET') continue;
      
      const key = r.kunde_name || 'Unbekannt';
      if (!groups[key]) {
        groups[key] = { kundeId: r.kundeId || 0, kundeName: key, items: [] };
      }
      groups[key].items.push(r);
    }
    
    return Object.values(groups).filter(g => g.items.length >= 2);
  }, [rechnungen]);

  const eligibleRechnungen = useMemo(() => 
    rechnungen.filter(r => r.status === 'ENTWURF' || r.status === 'OFFEN' || r.status === 'VERSENDET'),
    [rechnungen]
  );

  const selectedRechnungen = useMemo(() => 
    rechnungen.filter(r => selectedIds.has(r.id)),
    [rechnungen, selectedIds]
  );

  const totals = useMemo(() => ({
    netto: selectedRechnungen.reduce((sum, r) => sum + (r.betrag_netto || 0), 0),
    brutto: selectedRechnungen.reduce((sum, r) => sum + (r.betrag_brutto || 0), 0),
  }), [selectedRechnungen]);

  // Eindeutige Projekt-Namen aus ausgewählten Rechnungen
  const selectedProjekte = useMemo(() => {
    const namen = new Set<string>();
    for (const r of selectedRechnungen) {
      const name = r.installation_name || r.anlage_bezeichnung;
      if (name) namen.add(name);
    }
    return Array.from(namen);
  }, [selectedRechnungen]);

  const allSameCustomer = useMemo(() => {
    if (selectedRechnungen.length < 2) return true;
    const first = selectedRechnungen[0]?.kunde_name;
    return selectedRechnungen.every(r => r.kunde_name === first);
  }, [selectedRechnungen]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectKundeGroup = (items: RechnungItem[]) => {
    setSelectedIds(new Set(items.map(i => i.id)));
  };

  const handleCreate = async () => {
    if (selectedIds.size < 2 || !allSameCustomer) return;
    
    setLoading(true);
    try {
      await onCreateSammelrechnung(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    } catch (e) {
      console.error('Sammelrechnung Fehler:', e);
    } finally {
      setLoading(false);
    }
  };

  const money = (n: number) => new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(n);

  if (!isOpen) return null;

  return (
    <div className="srm-overlay" onClick={onClose}>
      <div className="srm-modal" onClick={e => e.stopPropagation()}>
        <div className="srm-header">
          <div className="srm-header__icon">
            <FileStack size={24} />
          </div>
          <div className="srm-header__text">
            <h2>Sammelrechnung erstellen</h2>
            <p>Fasse mehrere Rechnungen eines Kunden zusammen</p>
          </div>
          <button className="srm-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="srm-content">
          {kundenGroups.length === 0 ? (
            <div className="srm-empty">
              <AlertTriangle size={48} />
              <h3>Keine Sammelrechnungen möglich</h3>
              <p>Es müssen mindestens 2 offene Rechnungen vom gleichen Kunden vorhanden sein.</p>
            </div>
          ) : (
            <>
              <div className="srm-quickselect">
                <h4>Schnellauswahl nach Kunde</h4>
                <div className="srm-customer-cards">
                  {kundenGroups.map(group => (
                    <button 
                      key={group.kundeName}
                      className={`srm-customer-card ${
                        group.items.every(i => selectedIds.has(i.id)) ? 'active' : ''
                      }`}
                      onClick={() => selectKundeGroup(group.items)}
                    >
                      <div className="srm-customer-card__name">{group.kundeName}</div>
                      <div className="srm-customer-card__count">
                        {group.items.length} Rechnungen
                      </div>
                      <div className="srm-customer-card__sum">
                        {money(group.items.reduce((s, i) => s + (i.betrag_brutto || 0), 0))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="srm-list">
                <h4>Oder einzeln auswählen</h4>
                <div className="srm-items">
                  {eligibleRechnungen.map(r => {
                    // Projekt-Name: installation_name > anlage_bezeichnung
                    const projektName = r.installation_name || r.anlage_bezeichnung;
                    
                    return (
                      <label key={r.id} className={`srm-item ${selectedIds.has(r.id) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                        />
                        <div className="srm-item__check">
                          <Check size={14} />
                        </div>
                        <div className="srm-item__info">
                          <div className="srm-item__number">{r.rechnungsnummer}</div>
                          <div className="srm-item__customer">{r.kunde_name}</div>
                          {projektName && (
                            <div className="srm-item__project">
                              <User size={12} />
                              <span>{projektName}</span>
                            </div>
                          )}
                        </div>
                        <div className="srm-item__amount">{money(r.betrag_brutto)}</div>
                        <span className={`srm-item__status srm-item__status--${r.status.toLowerCase()}`}>
                          {r.status}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="srm-footer">
            <div className="srm-summary">
              <div className="srm-summary__row">
                <span>Ausgewählt:</span>
                <strong>{selectedIds.size} Rechnungen</strong>
              </div>
              {selectedProjekte.length > 0 && (
                <div className="srm-summary__projects">
                  <span>Projekte:</span>
                  <div className="srm-project-tags">
                    {selectedProjekte.map((name, i) => (
                      <span key={i} className="srm-project-tag">
                        <User size={10} />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="srm-summary__row">
                <span>Netto:</span>
                <span>{money(totals.netto)}</span>
              </div>
              <div className="srm-summary__row srm-summary__row--total">
                <span>Brutto Gesamt:</span>
                <strong>{money(totals.brutto)}</strong>
              </div>
            </div>

            {!allSameCustomer && (
              <div className="srm-warning">
                <AlertTriangle size={16} />
                <span>Alle Rechnungen müssen vom gleichen Kunden sein!</span>
              </div>
            )}

            <div className="srm-actions">
              <button className="srm-btn srm-btn--secondary" onClick={onClose}>
                Abbrechen
              </button>
              <button 
                className="srm-btn srm-btn--primary"
                disabled={selectedIds.size < 2 || !allSameCustomer || loading}
                onClick={handleCreate}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="srm-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Sammelrechnung erstellen
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
.srm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.srm-modal {
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.srm-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05));
}

.srm-header__icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #EAD068, #06b6d4);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.srm-header__text h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
}

.srm-header__text p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.srm-close {
  margin-left: auto;
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.srm-close:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.srm-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.srm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}

.srm-empty svg { color: #f59e0b; margin-bottom: 16px; }
.srm-empty h3 { margin: 0 0 8px; color: #f8fafc; }

.srm-quickselect { margin-bottom: 24px; }
.srm-quickselect h4, .srm-list h4 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.srm-customer-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.srm-customer-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  text-align: left;
}

.srm-customer-card:hover {
  background: rgba(255,255,255,0.06);
}

.srm-customer-card.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
}

.srm-customer-card__name {
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 4px;
}

.srm-customer-card__count {
  font-size: 12px;
  color: #94a3b8;
}

.srm-customer-card__sum {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #10b981;
}

.srm-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.srm-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  cursor: pointer;
}

.srm-item:hover {
  background: rgba(255,255,255,0.05);
}

.srm-item.selected {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.srm-item input { display: none; }

.srm-item__check {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
}

.srm-item.selected .srm-item__check {
  background: #EAD068;
  border-color: #EAD068;
  color: white;
}

.srm-item__info { flex: 1; }
.srm-item__number { font-weight: 600; color: #f8fafc; }
.srm-item__customer { font-size: 12px; color: #94a3b8; }

.srm-item__project {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 100px;
  font-size: 11px;
  font-weight: 500;
  color: #f0d878;
}

.srm-item__project svg {
  opacity: 0.7;
}

.srm-item__amount {
  font-weight: 600;
  color: #10b981;
}

.srm-item__status {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 100px;
}

.srm-item__status--entwurf {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.srm-item__status--offen, .srm-item__status--versendet {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.srm-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.2);
}

.srm-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
}

.srm-summary__row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #94a3b8;
}

.srm-summary__row strong { color: #f8fafc; }

.srm-summary__row--total {
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 16px;
}

.srm-summary__row--total strong {
  color: #10b981;
}

.srm-summary__projects {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 4px;
}

.srm-summary__projects > span {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.srm-project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.srm-project-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.15));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
  color: #c4b5fd;
}

.srm-project-tag svg {
  opacity: 0.7;
}

.srm-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 16px;
}

.srm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.srm-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  border: none;
}

.srm-btn--secondary {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
}

.srm-btn--secondary:hover {
  background: rgba(255,255,255,0.1);
  color: #f8fafc;
}

.srm-btn--primary {
  background: linear-gradient(135deg, #EAD068, #D4A843);
  color: white;
}

.srm-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.srm-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.srm-spin { animation: srm-spin 1s linear infinite; }
@keyframes srm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
