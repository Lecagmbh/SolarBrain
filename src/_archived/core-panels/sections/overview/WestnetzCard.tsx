/**
 * WestnetzCard – Westnetz portal credentials management
 */

import { useState } from 'react';
import { KeyRound, User, ExternalLink, Edit2, Save, X, Eye, EyeOff, Info, Loader2 } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { CopyableField } from '../../primitives/CopyableField';

interface WestnetzCardProps {
  username?: string;
  password?: string;
  notizen?: string;
  onSave: (data: { username: string; password: string; notizen: string }) => Promise<void>;
}

export function WestnetzCard({ username, password, notizen, onSave }: WestnetzCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ username: username || '', password: password || '', notizen: notizen || '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Westnetz-Portal"
      action={!editing ? { label: 'Bearbeiten', onClick: () => setEditing(true), icon: <Edit2 size={12} /> } : undefined}
    >
      <div className="flex flex-col gap-2">
        <a
          href="https://serviceportal.westnetz.de"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mb-1"
        >
          <ExternalLink size={12} /> Westnetz-Portal öffnen
        </a>

        {editing ? (
          <>
            <input
              type="text"
              value={draft.username}
              onChange={(e) => setDraft({ ...draft, username: e.target.value })}
              placeholder="Benutzername / E-Mail"
              className="w-full px-2 py-1 text-xs bg-[var(--gray-800)] border border-[var(--panel-border)] rounded-md text-[var(--text-primary)] outline-none focus:border-blue-500"
            />
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={draft.password}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                placeholder="Passwort"
                className="w-full px-2 py-1 pr-8 text-xs bg-[var(--gray-800)] border border-[var(--panel-border)] rounded-md text-[var(--text-primary)] outline-none focus:border-blue-500"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <input
              type="text"
              value={draft.notizen}
              onChange={(e) => setDraft({ ...draft, notizen: e.target.value })}
              placeholder="Notizen"
              className="w-full px-2 py-1 text-xs bg-[var(--gray-800)] border border-[var(--panel-border)] rounded-md text-[var(--text-primary)] outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1 h-7 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Speichern
              </button>
              <button
                className="flex items-center gap-1 h-7 px-2 text-xs text-[var(--text-secondary)] hover:bg-white/5 rounded-md"
                onClick={() => {
                  setEditing(false);
                  setDraft({ username: username || '', password: password || '', notizen: notizen || '' });
                }}
              >
                <X size={12} /> Abbrechen
              </button>
            </div>
          </>
        ) : username ? (
          <>
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-[10px] text-[var(--text-muted)]">Benutzer</span>
              <CopyableField value={username} />
            </div>
            <div className="flex items-center gap-1.5">
              <KeyRound size={14} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-[10px] text-[var(--text-muted)]">Passwort</span>
              <span className="text-xs text-[var(--text-primary)] font-mono">
                {showPw ? password : '••••••••'}
              </span>
              <button
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            {notizen && (
              <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                <Info size={12} /> {notizen}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">Keine Zugangsdaten hinterlegt</span>
        )}
      </div>
    </SectionCard>
  );
}
