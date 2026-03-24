/**
 * CommunicationSummaryCard – NB communication summary with mini-timeline
 */

import { useState, useEffect } from 'react';
import { Mail, User, Building2, Send, Globe, MessageSquare, ChevronRight, Loader2, Info } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { CopyableField } from '../../primitives/CopyableField';

const CORR_TYPES: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  erstanmeldung: { label: 'Erstanmeldung', icon: Send, color: '#3b82f6' },
  nachfrage: { label: 'Nachfrage', icon: MessageSquare, color: '#f59e0b' },
  antwort: { label: 'NB-Antwort', icon: Mail, color: '#10b981' },
  email: { label: 'E-Mail', icon: Mail, color: '#EAD068' },
  portal: { label: 'Portal', icon: Globe, color: '#06b6d4' },
};

interface CommunicationSummaryCardProps {
  customerEmail?: string;
  nbEmail?: string;
  einreichEmail?: string;
  installationId: number;
  loadCorrespondence: (id: number) => Promise<any[]>;
  onSwitchToTab?: (tab: string) => void;
}

export function CommunicationSummaryCard({
  customerEmail,
  nbEmail,
  einreichEmail,
  installationId,
  loadCorrespondence,
  onSwitchToTab,
}: CommunicationSummaryCardProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadCorrespondence(installationId);
        if (!cancelled) setItems((data || []).slice(0, 3));
      } catch { /* silence */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [installationId, loadCorrespondence]);

  return (
    <SectionCard
      title="Kommunikation"
      badge={items.length > 2 ? '3+' : items.length || undefined}
      className="col-span-full"
    >
      <div className="flex flex-col gap-3">
        {/* Contact grid */}
        <div className="flex flex-col gap-1.5">
          {customerEmail && (
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-[10px] text-[var(--text-muted)]">Kunde</span>
              <CopyableField value={customerEmail} />
            </div>
          )}
          {nbEmail && (
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-[10px] text-[var(--text-muted)]">Netzbetreiber</span>
              <CopyableField value={nbEmail} />
            </div>
          )}
          {einreichEmail && (
            <div className="flex items-center gap-1.5">
              <Send size={12} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-[10px] text-[var(--text-muted)]">Einreich-Email</span>
              <CopyableField value={einreichEmail} />
            </div>
          )}
        </div>

        {/* Mini-timeline */}
        <div className="flex flex-col gap-1">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Loader2 size={14} className="animate-spin" /> Lade Korrespondenz...
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Info size={12} /> Noch keine Korrespondenz
            </div>
          ) : (
            items.map((item: any) => {
              const config = CORR_TYPES[item.type] || CORR_TYPES.email;
              const TypeIcon = config.icon;
              const expanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-md border border-[var(--panel-border)] overflow-hidden cursor-pointer hover:border-[var(--gray-600)]"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                >
                  <div className="flex items-center gap-2 px-2.5 py-1.5">
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded"
                      style={{ backgroundColor: `${config.color}15`, color: config.color }}
                    >
                      <TypeIcon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[var(--text-primary)] truncate block">
                        {item.subject || config.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                      {new Date(item.sentAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                    <span className="text-[10px] shrink-0" style={{ color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                  {expanded && item.message && (
                    <div className="px-2.5 pb-2 text-xs text-[var(--text-secondary)] border-t border-[var(--panel-border)] pt-1.5">
                      {item.message}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-1">
          <button
            className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-blue-400 transition-colors"
            onClick={() => onSwitchToTab?.('emails')}
          >
            <Mail size={12} /> Alle E-Mails <ChevronRight size={10} />
          </button>
          <button
            className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-blue-400 transition-colors"
            onClick={() => onSwitchToTab?.('kommunikation')}
          >
            <MessageSquare size={12} /> NB-Kommunikation <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
