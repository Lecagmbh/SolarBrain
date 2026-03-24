/**
 * NbReferencesCard – NB-Referenzen CRUD (Aktenzeichen, Antragsnummer, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { Brain, Plus, Check, X, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { StatusBadge } from '../../primitives/StatusBadge';
import { getAccessToken } from '../../../../modules/auth/tokenStorage';

const REFERENCE_TYPES = [
  { value: 'AKTENZEICHEN', label: 'Aktenzeichen', icon: '\uD83D\uDCCB' },
  { value: 'ANTRAGSNUMMER', label: 'Antragsnummer', icon: '\uD83D\uDCDD' },
  { value: 'KUNDENNUMMER', label: 'Kundennummer', icon: '\uD83D\uDC64' },
  { value: 'VERTRAGSNUMMER', label: 'Vertragsnummer', icon: '\uD83D\uDCC4' },
  { value: 'ZAEHLERNUMMER', label: 'Zählernummer', icon: '\u26A1' },
  { value: 'CUSTOM', label: 'Sonstige', icon: '\uD83C\uDFF7\uFE0F' },
] as const;

interface NBReference {
  id: number;
  referenceType: string;
  referenceValue: string;
  source: string;
  confidence: number;
  createdAt: string;
}

interface NbReferencesCardProps {
  installationId: number;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function NbReferencesCard({ installationId, showToast }: NbReferencesCardProps) {
  const [references, setReferences] = useState<NBReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRef, setNewRef] = useState({ type: 'AKTENZEICHEN', value: '' });
  const [saving, setSaving] = useState(false);

  const loadRefs = useCallback(async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/intelligence/installations/${installationId}/references`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReferences(data.references || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Referenzen:', err);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  const handleAdd = async () => {
    if (!newRef.value.trim()) {
      showToast('Bitte Wert eingeben', 'error');
      return;
    }
    setSaving(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/intelligence/installations/${installationId}/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referenceType: newRef.type, referenceValue: newRef.value.trim() }),
      });
      if (res.ok) {
        showToast('Referenz hinzugefügt', 'success');
        setNewRef({ type: 'AKTENZEICHEN', value: '' });
        setShowForm(false);
        loadRefs();
      }
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (refId: number) => {
    if (!confirm('Referenz wirklich löschen?')) return;
    try {
      const token = getAccessToken();
      await fetch(`/api/intelligence/installations/${installationId}/references/${refId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast('Referenz gelöscht', 'success');
      loadRefs();
    } catch {
      showToast('Fehler beim Löschen', 'error');
    }
  };

  const getTypeConfig = (type: string) =>
    REFERENCE_TYPES.find((t) => t.value === type) || REFERENCE_TYPES[5];

  return (
    <SectionCard
      title="NB-Referenzen"
      badge={references.length || undefined}
      action={{ label: 'KI', onClick: () => {}, icon: <StatusBadge label="KI" variant="purple" /> }}
    >
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 size={14} className="animate-spin" /> Lade...
          </div>
        ) : (
          <>
            {references.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {references.map((ref) => {
                  const config = getTypeConfig(ref.referenceType);
                  return (
                    <div
                      key={ref.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--panel-surface-2)] group"
                    >
                      <span className="text-sm">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-[var(--text-muted)]">{config.label}</span>
                        <p className="text-xs text-[var(--text-primary)] truncate">{ref.referenceValue}</p>
                      </div>
                      <button
                        className="shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                        onClick={() => handleDelete(ref.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {showForm ? (
              <div className="flex flex-col gap-1.5">
                <select
                  value={newRef.type}
                  onChange={(e) => setNewRef({ ...newRef, type: e.target.value })}
                  className="w-full px-2 py-1 text-xs bg-[var(--gray-800)] border border-[var(--panel-border)] rounded-md text-[var(--text-primary)] outline-none"
                >
                  {REFERENCE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newRef.value}
                    onChange={(e) => setNewRef({ ...newRef, value: e.target.value })}
                    placeholder="Referenznummer"
                    autoFocus
                    className="flex-1 px-2 py-1 text-xs bg-[var(--gray-800)] border border-[var(--panel-border)] rounded-md text-[var(--text-primary)] outline-none focus:border-blue-500"
                  />
                  <button
                    className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
                    onClick={handleAdd}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  </button>
                  <button
                    className="flex items-center justify-center w-7 h-7 text-[var(--text-muted)] hover:bg-white/5 rounded-md"
                    onClick={() => setShowForm(false)}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                onClick={() => setShowForm(true)}
              >
                <Plus size={12} /> Referenz hinzufügen
              </button>
            )}

            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <AlertCircle size={10} />
              <span>E-Mails mit diesen Nummern werden automatisch zugeordnet</span>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}
