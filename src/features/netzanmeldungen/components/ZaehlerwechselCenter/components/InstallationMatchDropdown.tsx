import { useState, useRef, useEffect } from 'react';
import type { MatchCandidate } from '../types';

interface Props {
  candidates: MatchCandidate[];
  selectedId: number | null;
  selectedName: string | null;
  onSelect: (installationId: number, customerName: string) => void;
}

function scoreClass(score: number): string {
  if (score >= 0.7) return 'zwc-match-score--high';
  if (score >= 0.5) return 'zwc-match-score--medium';
  return 'zwc-match-score--low';
}

export function InstallationMatchDropdown({ candidates, selectedId, selectedName, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (candidates.length === 0) {
    return (
      <span style={{ fontSize: 11, color: 'var(--zwc-red)', fontStyle: 'italic' }}>
        Kein Match gefunden
      </span>
    );
  }

  const selected = candidates.find(c => c.installationId === selectedId);

  return (
    <div className="zwc-match-dropdown" ref={ref}>
      <button
        className="zwc-match-trigger"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        type="button"
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedName || 'Zuordnung wählen...'}
        </span>
        {selected && (
          <span className={`zwc-match-score ${scoreClass(selected.score)}`}>
            {Math.round(selected.score * 100)}%
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}>
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {open && (
        <div className="zwc-match-menu">
          {candidates.map(c => (
            <div
              key={c.installationId}
              className="zwc-match-option"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(c.installationId, c.customerName);
                setOpen(false);
              }}
            >
              <div>
                <div className="zwc-match-option-name">{c.customerName}</div>
                <div className="zwc-match-option-detail">
                  #{c.installationId} · {c.status}{c.plz ? ` · ${c.plz}` : ''}{c.ort ? ` ${c.ort}` : ''}
                </div>
              </div>
              <span className={`zwc-match-score ${scoreClass(c.score)}`}>
                {Math.round(c.score * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
