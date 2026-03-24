/**
 * CommissioningCard – Inbetriebnahme-Daten
 */

import { Calendar, Hash, CheckCircle } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { CopyableField } from '../../primitives/CopyableField';
import { StatusBadge } from '../../primitives/StatusBadge';

interface CommissioningData {
  plannedDate?: string;
  actualDate?: string;
  eegDate?: string;
  mastrNumber?: string;
  mastrRegistered?: boolean;
  mastrDate?: string;
  gridOperatorNotified?: boolean;
  gridOperatorNotificationDate?: string;
  gridOperatorConfirmation?: boolean;
  commissioningStatus?: string;
}

interface CommissioningCardProps {
  data: CommissioningData;
}

const STATUS_LABELS: Record<string, string> = {
  geplant: 'Geplant',
  beantragt: 'Beantragt',
  freigegeben: 'Freigegeben',
  durchgefuehrt: 'Durchgeführt',
  abgenommen: 'Abgenommen',
};

export function CommissioningCard({ data }: CommissioningCardProps) {
  const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE');

  return (
    <SectionCard title="Inbetriebnahme">
      <div className="flex flex-col gap-2">
        {data.plannedDate && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-muted)]">Geplant:</span>
            <span className="text-[var(--text-primary)]">{fmt(data.plannedDate)}</span>
          </div>
        )}
        {data.actualDate && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-muted)]">Tatsächlich:</span>
            <span className="text-[var(--text-primary)]">{fmt(data.actualDate)}</span>
          </div>
        )}
        {data.eegDate && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-muted)]">EEG-Datum:</span>
            <span className="text-[var(--text-primary)]">{fmt(data.eegDate)}</span>
          </div>
        )}
        {data.mastrNumber && (
          <div className="flex items-center gap-1.5">
            <Hash size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">MaStR-Nr</span>
            <CopyableField value={data.mastrNumber} mono />
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[var(--text-muted)]">MaStR registriert:</span>
          <StatusBadge
            label={data.mastrRegistered ? '✓ Ja' : 'Nein'}
            variant={data.mastrRegistered ? 'success' : 'muted'}
          />
        </div>
        {data.mastrDate && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-muted)]">MaStR-Anmeldedatum:</span>
            <span className="text-[var(--text-primary)]">{fmt(data.mastrDate)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[var(--text-muted)]">NB informiert:</span>
          <StatusBadge
            label={data.gridOperatorNotified ? '✓ Ja' : 'Nein'}
            variant={data.gridOperatorNotified ? 'success' : 'muted'}
          />
        </div>
        {data.gridOperatorNotificationDate && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-muted)]">NB-Meldedatum:</span>
            <span className="text-[var(--text-primary)]">{fmt(data.gridOperatorNotificationDate)}</span>
          </div>
        )}
        {data.gridOperatorConfirmation != null && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--text-muted)]">NB-Bestätigung:</span>
            <StatusBadge
              label={data.gridOperatorConfirmation ? '✓ Erhalten' : 'Ausstehend'}
              variant={data.gridOperatorConfirmation ? 'success' : 'warning'}
            />
          </div>
        )}
        {data.commissioningStatus && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--text-muted)]">IBN-Status:</span>
            <StatusBadge
              label={STATUS_LABELS[data.commissioningStatus] || data.commissioningStatus}
              variant={
                data.commissioningStatus === 'durchgefuehrt' || data.commissioningStatus === 'abgenommen'
                  ? 'success'
                  : 'purple'
              }
            />
          </div>
        )}
      </div>
    </SectionCard>
  );
}
