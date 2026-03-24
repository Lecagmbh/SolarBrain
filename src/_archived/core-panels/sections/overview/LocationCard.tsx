/**
 * LocationCard – Anlagenstandort with address and Google Maps link
 */

import { MapPin, Globe, ExternalLink, Copy } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { CopyableField } from '../../primitives/CopyableField';

interface LocationCardProps {
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  land?: string;
  bundesland?: string;
  gemarkung?: string;
  flur?: string;
  flurstueck?: string;
  gpsLat?: number;
  gpsLng?: number;
}

export function LocationCard({
  strasse,
  hausNr,
  plz,
  ort,
  land,
  bundesland,
  gemarkung,
  flur,
  flurstueck,
  gpsLat,
  gpsLng,
}: LocationCardProps) {
  const streetLine = `${strasse || ''} ${hausNr || ''}`.trim();
  const cityLine = `${plz || ''} ${ort || ''}`.trim();
  const fullAddress = `${streetLine}, ${cityLine}`.trim();

  const cadastralParts = [
    gemarkung && `Gemarkung: ${gemarkung}`,
    flur && `Flur: ${flur}`,
    flurstueck && `Flurstück: ${flurstueck}`,
  ].filter(Boolean);

  return (
    <SectionCard title="Anlagenstandort">
      <div className="flex flex-col gap-2">
        {streetLine && (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-[var(--text-muted)] shrink-0" />
            <CopyableField value={streetLine} />
          </div>
        )}
        {cityLine && <CopyableField value={cityLine} />}
        {land && land !== 'Deutschland' && (
          <span className="text-xs text-[var(--text-secondary)]">{land}</span>
        )}
        {/* Full address copy */}
        <div className="flex items-center gap-1.5">
          <Copy size={12} className="text-[var(--text-muted)] shrink-0" />
          <span className="text-[10px] text-[var(--text-muted)]">Vollständig</span>
          <CopyableField value={fullAddress} />
        </div>
        {bundesland && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Globe size={12} className="shrink-0" />
            <span>Bundesland: {bundesland}</span>
          </div>
        )}
        {cadastralParts.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <MapPin size={12} className="shrink-0" />
            <span>{cadastralParts.join(' · ')}</span>
          </div>
        )}
        {gpsLat && gpsLng && (
          <div className="text-xs text-[var(--text-tertiary)]">
            GPS: {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
          </div>
        )}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
        >
          <ExternalLink size={12} /> Google Maps
        </a>
      </div>
    </SectionCard>
  );
}
