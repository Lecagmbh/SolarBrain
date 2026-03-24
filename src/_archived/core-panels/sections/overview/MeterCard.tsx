/**
 * MeterCard – Zähler-Details (types, numbers, readings)
 */

import { Gauge, Hash } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { CopyableField } from '../../primitives/CopyableField';
import { StatusBadge } from '../../primitives/StatusBadge';

interface MeterData {
  number?: string;
  type?: string;
  location?: string;
  ownership?: string;
  tariffType?: string;
  readingConsumption?: number;
  readingFeedIn?: number;
  readingDate?: string;
  meterPointId?: string;
  marketLocationId?: string;
  remoteReading?: boolean;
  smartMeterGateway?: boolean;
  imsysRequested?: boolean;
  changeReason?: string;
  oldMeterNumber?: string;
}

interface MeterCardProps {
  data: MeterData;
  zaehlernummer?: string;
}

const TYPE_LABELS: Record<string, string> = {
  zweirichtung: 'Zweirichtungszähler',
  einrichtung: 'Einrichtungszähler',
};

const LOCATION_LABELS: Record<string, string> = {
  keller: 'Keller',
  hausanschluss: 'Hausanschluss',
  garage: 'Garage',
};

const OWNERSHIP_LABELS: Record<string, string> = {
  netzbetreiber: 'Netzbetreiber',
  kunde: 'Kunde',
};

const TARIFF_LABELS: Record<string, string> = {
  eintarif: 'Eintarif',
  zweitarif: 'Zweitarif (HT/NT)',
};

export function MeterCard({ data, zaehlernummer }: MeterCardProps) {
  const meterNumber = data.number || zaehlernummer;

  return (
    <SectionCard title="Zähler">
      <div className="flex flex-col gap-2">
        {meterNumber && (
          <div className="flex items-center gap-1.5">
            <Hash size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">Nummer</span>
            <CopyableField value={meterNumber} mono />
          </div>
        )}
        {data.type && (
          <Field label="Typ" value={TYPE_LABELS[data.type] || data.type} />
        )}
        {data.location && (
          <Field label="Standort" value={LOCATION_LABELS[data.location] || data.location} />
        )}
        {data.ownership && (
          <Field label="Eigentümer" value={OWNERSHIP_LABELS[data.ownership] || data.ownership} />
        )}
        {data.tariffType && (
          <Field label="Tarifart" value={TARIFF_LABELS[data.tariffType] || data.tariffType} />
        )}
        {data.readingConsumption != null && (
          <Field label="Zählerstand Bezug" value={`${data.readingConsumption.toLocaleString('de-DE')} kWh`} />
        )}
        {data.readingFeedIn != null && (
          <Field label="Zählerstand Einspeisung" value={`${data.readingFeedIn.toLocaleString('de-DE')} kWh`} />
        )}
        {data.readingDate && (
          <Field label="Ablesedatum" value={new Date(data.readingDate).toLocaleDateString('de-DE')} />
        )}
        {data.meterPointId && (
          <div className="flex items-center gap-1.5">
            <Hash size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">Zählpunkt</span>
            <CopyableField value={data.meterPointId} mono />
          </div>
        )}
        {data.marketLocationId && (
          <div className="flex items-center gap-1.5">
            <Hash size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">MaLo-ID</span>
            <CopyableField value={data.marketLocationId} mono />
          </div>
        )}
        {data.remoteReading != null && (
          <BoolField label="Fernauslesung" value={data.remoteReading} />
        )}
        {data.smartMeterGateway != null && (
          <BoolField label="Smart Meter Gateway" value={data.smartMeterGateway} />
        )}
        {data.imsysRequested != null && (
          <BoolField label="iMSys gewünscht" value={data.imsysRequested} />
        )}
        {data.changeReason && (
          <Field label="Wechselgrund" value={data.changeReason} />
        )}
        {data.oldMeterNumber && (
          <div className="flex items-center gap-1.5">
            <Hash size={14} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)]">Alte Zählernr.</span>
            <CopyableField value={data.oldMeterNumber} mono />
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function BoolField({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--text-muted)]">{label}</span>
      <StatusBadge label={value ? 'Ja' : 'Nein'} variant={value ? 'success' : 'muted'} />
    </div>
  );
}
