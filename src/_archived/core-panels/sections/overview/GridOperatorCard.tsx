/**
 * GridOperatorCard – Netzbetreiber info with NB email editing, reminder, portal links
 */

import { useState } from 'react';
import {
  Building2, Hash, Mail, Send, Gauge, ExternalLink, Calendar,
  CheckCircle, Edit2, Save, X, Loader2,
} from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { CopyableField } from '../../primitives/CopyableField';

interface GridOperatorCardProps {
  operatorName: string;
  operatorShortName?: string;
  operatorEmail?: string;
  operatorPortalUrl?: string;
  nbCaseNumber?: string;
  zaehlernummer?: string;
  nbEmail?: string;
  nbPortalUrl?: string;
  nbEingereichtAm?: string;
  nbGenehmigungAm?: string;
  reminderCount?: number;
  lastReminderAt?: string;
  installationStatus?: string;
  isStaff?: boolean;
  onSaveNbEmail?: (email: string) => Promise<void>;
  onSendReminder?: () => Promise<void>;
}

export function GridOperatorCard({
  operatorName,
  operatorShortName,
  operatorEmail,
  operatorPortalUrl,
  nbCaseNumber,
  zaehlernummer,
  nbEmail,
  nbPortalUrl,
  nbEingereichtAm,
  nbGenehmigungAm,
  reminderCount = 0,
  installationStatus,
  isStaff,
  onSaveNbEmail,
  onSendReminder,
}: GridOperatorCardProps) {
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState(nbEmail || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const handleSaveEmail = async () => {
    if (!onSaveNbEmail) return;
    setSavingEmail(true);
    try {
      await onSaveNbEmail(emailDraft.trim());
      setEditingEmail(false);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleReminder = async () => {
    if (!onSendReminder) return;
    setSendingReminder(true);
    try {
      await onSendReminder();
    } finally {
      setSendingReminder(false);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE');

  return (
    <SectionCard
      title="Netzbetreiber"
      action={isStaff && onSaveNbEmail && !editingEmail
        ? { label: 'Email bearbeiten', onClick: () => { setEditingEmail(true); setEmailDraft(nbEmail || ''); }, icon: <Edit2 size={12} /> }
        : undefined
      }
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Building2 size={14} className="text-[var(--text-muted)] shrink-0" />
          <CopyableField value={operatorName || 'Nicht zugewiesen'} />
        </div>

        {operatorShortName && (
          <span className="text-xs text-[var(--text-tertiary)]">Kurzname: {operatorShortName}</span>
        )}

        {nbCaseNumber && (
          <div className="flex items-center gap-1.5">
            <Hash size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">Aktenzeichen</span>
            <CopyableField value={nbCaseNumber} mono />
          </div>
        )}

        {zaehlernummer && (
          <div className="flex items-center gap-1.5">
            <Gauge size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">Zählernummer</span>
            <CopyableField value={zaehlernummer} mono />
          </div>
        )}

        {operatorEmail && (
          <div className="flex items-center gap-1.5">
            <Mail size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">NB-Email</span>
            <CopyableField value={operatorEmail} />
          </div>
        )}

        {nbEmail && nbEmail !== operatorEmail && !editingEmail && (
          <div className="flex items-center gap-1.5">
            <Send size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">Einreich-Email</span>
            <CopyableField value={nbEmail} />
          </div>
        )}

        {/* NB Email inline edit */}
        {editingEmail && (
          <div className="flex flex-col gap-1.5">
            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="Einreich-Email eingeben"
              className="w-full px-2 py-1 text-xs bg-[var(--gray-800)] border border-blue-500 rounded-md text-[var(--text-primary)] outline-none"
              autoFocus
            />
            <div className="flex gap-1.5">
              <button
                className="flex items-center gap-1 h-6 px-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
                onClick={handleSaveEmail}
                disabled={savingEmail}
              >
                {savingEmail ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Speichern
              </button>
              <button
                className="flex items-center gap-1 h-6 px-2 text-xs text-[var(--text-secondary)] hover:bg-white/5 rounded-md"
                onClick={() => setEditingEmail(false)}
              >
                <X size={12} /> Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* NB tracking dates */}
        {nbEingereichtAm && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Calendar size={12} className="shrink-0" />
            <span>Eingereicht: {fmt(nbEingereichtAm)}</span>
          </div>
        )}
        {nbGenehmigungAm && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle size={12} className="shrink-0" />
            <span>Genehmigt: {fmt(nbGenehmigungAm)}</span>
          </div>
        )}

        {/* Portal links */}
        {nbPortalUrl && (
          <a href={nbPortalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
            <ExternalLink size={12} /> NB-Portal (Vorgang)
          </a>
        )}
        {operatorPortalUrl && !nbPortalUrl && (
          <a href={operatorPortalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
            <ExternalLink size={12} /> NB-Portal
          </a>
        )}

        {/* NB reminder button */}
        {isStaff && installationStatus === 'beim_nb' && onSendReminder && (
          <div className="flex items-center gap-2 mt-1 pt-2 border-t border-[var(--panel-border)]">
            <button
              className="flex items-center gap-1 h-7 px-3 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
              onClick={handleReminder}
              disabled={sendingReminder}
            >
              {sendingReminder ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              NB nachfragen
            </button>
            {reminderCount > 0 && (
              <span className="text-[10px] text-violet-400 bg-violet-500/15 px-1.5 py-0.5 rounded-full">
                {reminderCount}. Nachfrage
              </span>
            )}
            <span className="text-[10px] text-[var(--text-muted)]">
              → {nbEmail || operatorEmail || 'Keine Email'}
            </span>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
