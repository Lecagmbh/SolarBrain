/**
 * Baunity Reference Manager
 * Komponente zum Verwalten von NB-Nummern, Aktenzeichen und anderen Referenzen
 * 
 * Wird in der Installation Detail Seite eingebunden
 */

import { useState, useEffect, useCallback } from "react";
import "./ReferenceManager.css";

const getToken = () => localStorage.getItem('baunity_token');

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Reference {
  id: number;
  referenceType: string;
  referenceValue: string;
  source: string;
  confidence: number;
  createdAt: string;
}

interface Props {
  installationId: number;
  installationPublicId?: string;
  onUpdate?: () => void;
}

const REFERENCE_TYPES = [
  { value: 'NB_NUMMER', label: 'Netzbetreiber-Nummer', icon: '🔢', description: 'Interne Nummer des Netzbetreibers' },
  { value: 'AKTENZEICHEN', label: 'Aktenzeichen', icon: '📋', description: 'Aktenzeichen/Vorgangsnummer' },
  { value: 'KUNDENNUMMER', label: 'Kundennummer', icon: '👤', description: 'Kundennummer beim NB' },
  { value: 'VORGANGSNUMMER', label: 'Vorgangsnummer', icon: '📁', description: 'Vorgangsnummer im NB-Portal' },
  { value: 'ZAEHLERNUMMER', label: 'Zählernummer', icon: '⚡', description: 'Zählpunktnummer/Zählernummer' },
  { value: 'CUSTOM', label: 'Sonstige', icon: '📝', description: 'Andere Referenz' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ReferenceManager({ installationId, installationPublicId, onUpdate }: Props) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState('NB_NUMMER');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadReferences = useCallback(async () => {
    try {
      const res = await fetch(`/api/intelligence/installations/${installationId}/references`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReferences(data.references || []);
      }
    } catch (err) {
      console.error('Error loading references:', err);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const addReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) {
      setError('Bitte einen Wert eingeben');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/intelligence/installations/${installationId}/references`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          referenceType: newType,
          referenceValue: newValue.trim()
        })
      });

      if (res.ok) {
        setNewValue('');
        setShowAddForm(false);
        await loadReferences();
        onUpdate?.();

        // Track this action
        window.dispatchEvent(new CustomEvent('baunity:track', {
          detail: {
            action: 'REFERENCE_ADDED',
            data: { installationId, referenceType: newType }
          }
        }));
      } else {
        const data = await res.json();
        setError(typeof data.error === 'string' ? data.error : (data.error?.message || 'Fehler beim Speichern'));
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  const deleteReference = async (refId: number) => {
    if (!confirm('Referenz wirklich löschen?')) return;

    try {
      await fetch(`/api/intelligence/installations/${installationId}/references/${refId}`, {
        method: 'DELETE',
        headers
      });
      await loadReferences();
      onUpdate?.();
    } catch (err) {
      console.error('Error deleting reference:', err);
    }
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    // Could show toast here
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getTypeInfo = (type: string) => {
    return REFERENCE_TYPES.find(t => t.value === type) || REFERENCE_TYPES[REFERENCE_TYPES.length - 1];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="ref-manager ref-loading">
        <div className="ref-spinner"></div>
        Lade Referenzen...
      </div>
    );
  }

  return (
    <div className="ref-manager">
      {/* Header */}
      <div className="ref-header">
        <div className="ref-title">
          <h3>🔗 Referenznummern</h3>
          <span className="ref-count">{references.length}</span>
        </div>
        <button 
          className="ref-add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Abbrechen' : '+ Hinzufügen'}
        </button>
      </div>

      {/* Info Text */}
      <p className="ref-info">
        Referenznummern ermöglichen die automatische Zuordnung von E-Mails zu dieser Installation.
      </p>

      {/* Add Form */}
      {showAddForm && (
        <form className="ref-add-form" onSubmit={addReference}>
          <div className="ref-form-grid">
            <div className="ref-form-group">
              <label>Typ</label>
              <select 
                value={newType} 
                onChange={e => setNewType(e.target.value)}
                className="ref-select"
              >
                {REFERENCE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <span className="ref-form-hint">
                {getTypeInfo(newType).description}
              </span>
            </div>

            <div className="ref-form-group">
              <label>Wert</label>
              <input
                type="text"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder={`z.B. ${newType === 'NB_NUMMER' ? 'NB-2024-12345' : newType === 'AKTENZEICHEN' ? 'AZ-456789' : '...'}`}
                className="ref-input"
                autoFocus
              />
            </div>
          </div>

          {error && <div className="ref-error">{safeString(error)}</div>}

          <div className="ref-form-actions">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="ref-btn-secondary"
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              className="ref-btn-primary"
              disabled={saving || !newValue.trim()}
            >
              {saving ? '⏳ Speichern...' : '✓ Speichern'}
            </button>
          </div>
        </form>
      )}

      {/* References List */}
      <div className="ref-list">
        {references.length === 0 ? (
          <div className="ref-empty">
            <span className="ref-empty-icon">📭</span>
            <p>Noch keine Referenznummern hinterlegt</p>
            <p className="ref-empty-hint">
              Fügen Sie NB-Nummern oder Aktenzeichen hinzu, um E-Mails automatisch zuordnen zu können.
            </p>
          </div>
        ) : (
          references.map(ref => {
            const typeInfo = getTypeInfo(ref.referenceType);
            return (
              <div key={ref.id} className="ref-item">
                <div className="ref-item-icon">{typeInfo.icon}</div>
                <div className="ref-item-content">
                  <div className="ref-item-header">
                    <span className="ref-item-type">{typeInfo.label}</span>
                    {ref.source === 'PARSED' && (
                      <span className="ref-item-badge auto">Auto</span>
                    )}
                    {ref.confidence < 1 && (
                      <span className="ref-item-badge confidence">
                        {Math.round(ref.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="ref-item-value" onClick={() => copyToClipboard(ref.referenceValue)}>
                    {ref.referenceValue}
                    <span className="ref-copy-hint">📋</span>
                  </div>
                  <div className="ref-item-meta">
                    Hinzugefügt am {formatDate(ref.createdAt)}
                    {ref.source === 'MANUAL' && ' (manuell)'}
                    {ref.source === 'PARSED' && ' (automatisch erkannt)'}
                  </div>
                </div>
                <button 
                  className="ref-item-delete"
                  onClick={() => deleteReference(ref.id)}
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Tips */}
      {references.length > 0 && (
        <div className="ref-tips">
          <strong>💡 Tipp:</strong> Je mehr Referenzen hinterlegt sind, desto besser funktioniert die automatische E-Mail-Zuordnung.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI VERSION (for sidebar/quick view)
// ═══════════════════════════════════════════════════════════════════════════

export function ReferenceManagerMini({ installationId }: { installationId: number }) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = getToken();
      const res = await fetch(`/api/intelligence/installations/${installationId}/references`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReferences(data.references || []);
      }
    };
    load();
  }, [installationId]);

  if (references.length === 0) {
    return (
      <div className="ref-mini ref-mini-empty" onClick={() => setShowFull(true)}>
        <span>🔗</span>
        <span>Keine Referenzen</span>
        <button>+ Hinzufügen</button>
      </div>
    );
  }

  return (
    <div className="ref-mini" onClick={() => setShowFull(true)}>
      <span className="ref-mini-icon">🔗</span>
      <div className="ref-mini-list">
        {references.slice(0, 2).map(ref => (
          <span key={ref.id} className="ref-mini-item">
            {ref.referenceValue}
          </span>
        ))}
        {references.length > 2 && (
          <span className="ref-mini-more">+{references.length - 2}</span>
        )}
      </div>
    </div>
  );
}
