/**
 * SubcontractorCard – Subunternehmer assignment dropdown
 */

import { useState, useEffect } from 'react';
import { Users, User, Edit2, X, Loader2 } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { CopyableField } from '../../primitives/CopyableField';
import { getAccessToken } from '../../../../modules/auth/tokenStorage';

interface SubcontractorCardProps {
  assignedToName?: string;
  assignedToId?: number | null;
  installationId: number;
  onAssigned: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

interface Subcontractor {
  id: number;
  name: string;
  email: string;
  companyName?: string;
}

export function SubcontractorCard({
  assignedToName,
  assignedToId,
  installationId,
  onAssigned,
  showToast,
}: SubcontractorCardProps) {
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = getAccessToken();
        const res = await fetch('/api/subcontractors', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setSubs(await res.json() || []);
      } catch { /* ignore */ }
    })();
  }, []);

  const handleAssign = async (subId: number | null) => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch('/api/subcontractors/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ installationId, subcontractorId: subId }),
      });
      if (res.ok) {
        setShowDropdown(false);
        showToast(subId ? 'Zugewiesen' : 'Entfernt', 'success');
        onAssigned();
      }
    } catch {
      showToast('Fehler', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Subunternehmer">
      <div className="flex flex-col gap-2">
        {assignedToName ? (
          <>
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-[var(--text-muted)] shrink-0" />
              <CopyableField value={assignedToName} />
            </div>
            <button
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={loading}
            >
              <Edit2 size={12} /> Ändern
            </button>
          </>
        ) : (
          <button
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
          >
            <Users size={12} /> Zuweisen
          </button>
        )}

        {showDropdown && (
          <div className="flex flex-col rounded-lg border border-[var(--panel-border)] overflow-hidden">
            {assignedToId && (
              <button
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/5 border-b border-[var(--panel-border)]"
                onClick={() => handleAssign(null)}
              >
                <X size={12} /> Entfernen
              </button>
            )}
            {subs.map((sub) => (
              <button
                key={sub.id}
                className={`flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 text-left
                  ${assignedToId === sub.id ? 'bg-blue-500/10 text-blue-400' : 'text-[var(--text-primary)]'}
                `}
                onClick={() => handleAssign(sub.id)}
              >
                <User size={12} /> {sub.name}
              </button>
            ))}
            {loading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
