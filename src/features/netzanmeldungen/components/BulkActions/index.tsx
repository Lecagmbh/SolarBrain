/**
 * BULK ACTIONS - Status Change, Assignment, Grid Operator
 */

import { useState, useEffect } from "react";
import {
  X, Clock, UserPlus, Building2, Loader2, Check, AlertTriangle, Users,
} from "lucide-react";
import { api } from "../../services/api";
import { getStatusConfig, getAvailableTransitions } from "../../utils";
import type { InstallationStatus, GridOperator, TeamMember } from "../../types";

// ═══════════════════════════════════════════════════════════════════════════
// BULK STATUS CHANGE MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface BulkStatusModalProps {
  selectedIds: number[];
  currentStatuses: string[];
  onClose: () => void;
  onSuccess: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}

export function BulkStatusModal({ selectedIds, currentStatuses, onClose, onSuccess, showToast }: BulkStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<InstallationStatus | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors?: any[] } | null>(null);

  const allTransitions = new Map<string, { label: string; color: string; icon: string }>();
  currentStatuses.forEach(status => {
    const transitions = getAvailableTransitions(status as InstallationStatus);
    transitions.forEach(t => {
      if (!allTransitions.has(t.to)) {
        const cfg = getStatusConfig(t.to);
        allTransitions.set(t.to, { label: cfg.label, color: cfg.color, icon: cfg.icon });
      }
    });
  });

  const handleProcess = async () => {
    if (!selectedStatus) return;
    setProcessing(true);
    setResults(null);
    try {
      const result = await api.installations.bulkUpdateStatus(selectedIds, selectedStatus, reason || undefined);
      setResults(result);
      if (result.failed === 0) {
        showToast(`${result.success} Anmeldungen aktualisiert`, "success");
        setTimeout(() => { onSuccess(); onClose(); }, 1500);
      } else {
        showToast(`${result.success} erfolgreich, ${result.failed} fehlgeschlagen`, "error");
      }
    } catch (e: any) {
      showToast(e.message || "Fehler bei Massenänderung", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal" onClick={e => e.stopPropagation()}>
        <div className="ba-modal__header">
          <div className="ba-modal__title"><Clock size={20} /><span>Status ändern ({selectedIds.length})</span></div>
          <button className="ba-btn ba-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ba-modal__body">
          {results ? (
            <div className="ba-results">
              <div className={`ba-results__icon ${results.failed === 0 ? "ba-results__icon--success" : "ba-results__icon--warning"}`}>
                {results.failed === 0 ? <Check size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div className="ba-results__stats">
                <span className="ba-results__success">{results.success} erfolgreich</span>
                {results.failed > 0 && <span className="ba-results__failed">{results.failed} fehlgeschlagen</span>}
              </div>
            </div>
          ) : (
            <>
              <div className="ba-info"><AlertTriangle size={16} /><span>Diese Aktion ändert den Status von {selectedIds.length} Anmeldungen.</span></div>
              <div className="ba-section">
                <label className="ba-label">Neuer Status:</label>
                {allTransitions.size === 0 ? (
                  <p className="ba-hint">Keine gemeinsamen Statusübergänge möglich.</p>
                ) : (
                  <div className="ba-status-grid">
                    {Array.from(allTransitions.entries()).map(([status, cfg]) => (
                      <button key={status} className={`ba-status-option ${selectedStatus === status ? "ba-status-option--selected" : ""}`}
                        style={{ "--status-color": cfg.color } as React.CSSProperties}
                        onClick={() => setSelectedStatus(status as InstallationStatus)}>
                        <span className="ba-status-option__icon">{cfg.icon}</span>
                        <span className="ba-status-option__label">{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="ba-field">
                <label>Grund / Bemerkung (optional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Wird in der Timeline protokolliert..." rows={3} />
              </div>
            </>
          )}
        </div>
        <div className="ba-modal__footer">
          <button className="ba-btn" onClick={onClose}>{results ? "Schließen" : "Abbrechen"}</button>
          {!results && (
            <button className="ba-btn ba-btn--primary" onClick={handleProcess} disabled={!selectedStatus || processing}>
              {processing ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
              {selectedIds.length} ändern
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK ASSIGN MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface BulkAssignModalProps {
  selectedIds: number[];
  onClose: () => void;
  onSuccess: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}

export function BulkAssignModal({ selectedIds, onClose, onSuccess, showToast }: BulkAssignModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    api.team.getMembers().then(setTeamMembers).catch(() => setTeamMembers([])).finally(() => setLoading(false));
  }, []);

  const handleProcess = async () => {
    if (!selectedUserId) return;
    setProcessing(true);
    try {
      const result = await api.installations.bulkAssign(selectedIds, selectedUserId);
      setResults(result);
      showToast(`${result.success} Anmeldungen zugewiesen`, "success");
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal" onClick={e => e.stopPropagation()}>
        <div className="ba-modal__header">
          <div className="ba-modal__title"><UserPlus size={20} /><span>Zuweisen ({selectedIds.length})</span></div>
          <button className="ba-btn ba-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ba-modal__body">
          {results ? (
            <div className="ba-results">
              <div className="ba-results__icon ba-results__icon--success"><Check size={32} /></div>
              <span className="ba-results__success">{results.success} zugewiesen</span>
            </div>
          ) : (
            <>
              <div className="ba-info"><Users size={16} /><span>Wähle einen Mitarbeiter für {selectedIds.length} Anmeldungen.</span></div>
              {loading ? <div className="ba-loading"><Loader2 size={24} className="spin" /></div> : teamMembers.length === 0 ? <div className="ba-empty">Keine Mitarbeiter gefunden</div> : (
                <div className="ba-user-list">
                  {teamMembers.map(m => (
                    <button key={m.id} className={`ba-user-option ${selectedUserId === m.id ? "ba-user-option--selected" : ""}`} onClick={() => setSelectedUserId(m.id)}>
                      <div className="ba-user-option__avatar">{m.name?.charAt(0) || "?"}</div>
                      <div className="ba-user-option__content">
                        <span className="ba-user-option__name">{m.name}</span>
                        <span className="ba-user-option__email">{m.email}</span>
                      </div>
                      {selectedUserId === m.id && <Check size={18} />}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="ba-modal__footer">
          <button className="ba-btn" onClick={onClose}>{results ? "Schließen" : "Abbrechen"}</button>
          {!results && <button className="ba-btn ba-btn--primary" onClick={handleProcess} disabled={!selectedUserId || processing}>{processing ? <Loader2 size={16} className="spin" /> : <Check size={16} />}Zuweisen</button>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK GRID OPERATOR MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface BulkGridOperatorModalProps {
  selectedIds: number[];
  onClose: () => void;
  onSuccess: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}

export function BulkGridOperatorModal({ selectedIds, onClose, onSuccess, showToast }: BulkGridOperatorModalProps) {
  const [gridOperators, setGridOperators] = useState<GridOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNbId, setSelectedNbId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    api.gridOperators.getAll().then(setGridOperators).catch(() => setGridOperators([])).finally(() => setLoading(false));
  }, []);

  const filtered = gridOperators.filter(nb => nb.name.toLowerCase().includes(search.toLowerCase()) || nb.shortName?.toLowerCase().includes(search.toLowerCase()));

  const handleProcess = async () => {
    if (!selectedNbId) return;
    setProcessing(true);
    try {
      const result = await api.installations.bulkAssignGridOperator(selectedIds, selectedNbId);
      setResults(result);
      showToast(`${result.success} Anmeldungen zugewiesen`, "success");
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal ba-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="ba-modal__header">
          <div className="ba-modal__title"><Building2 size={20} /><span>Netzbetreiber ({selectedIds.length})</span></div>
          <button className="ba-btn ba-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ba-modal__body">
          {results ? (
            <div className="ba-results">
              <div className="ba-results__icon ba-results__icon--success"><Check size={32} /></div>
              <span className="ba-results__success">{results.success} zugewiesen</span>
            </div>
          ) : (
            <>
              <div className="ba-search"><input type="text" placeholder="Netzbetreiber suchen..." value={search} onChange={e => setSearch(e.target.value)} autoFocus /></div>
              {loading ? <div className="ba-loading"><Loader2 size={24} className="spin" /></div> : filtered.length === 0 ? <div className="ba-empty">Keine gefunden</div> : (
                <div className="ba-nb-list">
                  {filtered.map(nb => (
                    <button key={nb.id} className={`ba-nb-option ${selectedNbId === nb.id ? "ba-nb-option--selected" : ""}`} onClick={() => setSelectedNbId(nb.id)}>
                      <div className="ba-nb-option__icon"><Building2 size={20} /></div>
                      <div className="ba-nb-option__content">
                        <span className="ba-nb-option__name">{nb.name}</span>
                        {nb.plz && <span className="ba-nb-option__location">{nb.plz} {nb.ort}</span>}
                      </div>
                      {selectedNbId === nb.id && <Check size={18} />}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="ba-modal__footer">
          <button className="ba-btn" onClick={onClose}>{results ? "Schließen" : "Abbrechen"}</button>
          {!results && <button className="ba-btn ba-btn--primary" onClick={handleProcess} disabled={!selectedNbId || processing}>{processing ? <Loader2 size={16} className="spin" /> : <Check size={16} />}Zuweisen</button>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

export const BulkActionsStyles = `
.ba-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 1rem; }
.ba-modal { width: 100%; max-width: 500px; max-height: 80vh; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; }
.ba-modal--lg { max-width: 600px; }
.ba-modal__header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
.ba-modal__title { display: flex; align-items: center; gap: 0.75rem; font-size: 1rem; font-weight: 600; color: #fff; }
.ba-modal__body { flex: 1; overflow-y: auto; padding: 1.25rem; }
.ba-modal__footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.06); }

.ba-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e2e8f0; font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.ba-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
.ba-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ba-btn--primary { background: linear-gradient(135deg, #3b82f6, #2563eb); border-color: transparent; color: #fff; }
.ba-btn--primary:hover:not(:disabled) { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.ba-btn--icon { width: 36px; height: 36px; padding: 0; }

.ba-info { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 10px; font-size: 0.8125rem; color: #60a5fa; margin-bottom: 1.25rem; }
.ba-section { margin-bottom: 1rem; }
.ba-label { display: block; font-size: 0.75rem; font-weight: 500; color: #94a3b8; margin-bottom: 0.5rem; }
.ba-hint { font-size: 0.8125rem; color: #64748b; font-style: italic; }

.ba-status-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
.ba-status-option { display: flex; align-items: center; gap: 0.625rem; padding: 0.875rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; cursor: pointer; text-align: left; transition: all 0.2s; }
.ba-status-option:hover { background: rgba(255,255,255,0.05); }
.ba-status-option--selected { background: color-mix(in srgb, var(--status-color) 15%, transparent); border-color: var(--status-color); }
.ba-status-option__icon { font-size: 1.25rem; }
.ba-status-option__label { font-size: 0.875rem; font-weight: 500; color: #fff; }

.ba-field { margin-top: 1rem; }
.ba-field label { display: block; font-size: 0.75rem; font-weight: 500; color: #94a3b8; margin-bottom: 0.375rem; }
.ba-field textarea { width: 100%; padding: 0.625rem 0.875rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.875rem; resize: vertical; }
.ba-field textarea:focus { outline: none; border-color: #3b82f6; }

.ba-search { margin-bottom: 1rem; }
.ba-search input { width: 100%; padding: 0.75rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 0.875rem; }
.ba-search input::placeholder { color: #64748b; }
.ba-search input:focus { outline: none; border-color: #3b82f6; }

.ba-user-list, .ba-nb-list { display: flex; flex-direction: column; gap: 0.375rem; max-height: 350px; overflow-y: auto; }
.ba-user-option, .ba-nb-option { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.2s; }
.ba-user-option:hover, .ba-nb-option:hover { background: rgba(255,255,255,0.05); }
.ba-user-option--selected, .ba-nb-option--selected { background: rgba(59,130,246,0.1); border-color: #3b82f6; }
.ba-user-option__avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #EAD068); display: flex; align-items: center; justify-content: center; font-weight: 600; color: #fff; }
.ba-user-option__content, .ba-nb-option__content { flex: 1; min-width: 0; }
.ba-user-option__name, .ba-nb-option__name { display: block; font-size: 0.875rem; font-weight: 500; color: #fff; }
.ba-user-option__email { display: block; font-size: 0.75rem; color: #64748b; }
.ba-nb-option__icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 8px; color: #64748b; }
.ba-nb-option__location { display: block; font-size: 0.75rem; color: #64748b; }

.ba-loading, .ba-empty { display: flex; align-items: center; justify-content: center; padding: 2rem; color: #64748b; font-size: 0.875rem; }
.ba-results { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem; text-align: center; }
.ba-results__icon { width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.ba-results__icon--success { background: rgba(34,197,94,0.15); color: #22c55e; }
.ba-results__icon--warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
.ba-results__success { font-size: 1.125rem; font-weight: 600; color: #22c55e; }
.ba-results__failed { font-size: 0.875rem; color: #ef4444; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
