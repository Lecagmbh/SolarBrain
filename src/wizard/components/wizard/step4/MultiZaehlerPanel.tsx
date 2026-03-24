/**
 * MultiZaehlerPanel - Multi-meter management panel.
 * Design improvement: Entire section wrapped in CollapsibleSection (default closed).
 */

import React from 'react';
import { styles } from '../steps/shared';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { ZaehlerBestandItemComponent } from './ZaehlerBestandItem';
import { ZaehlerNeuConfig } from './ZaehlerNeuConfig';
import type {
  ZaehlerBestandItem as ZaehlerBestandItemType,
  ZaehlerNeuData,
} from '../../../types/wizard.types';

interface MultiZaehlerPanelProps {
  zaehlerBestand: ZaehlerBestandItemType[] | undefined;
  zaehlerNeu: ZaehlerNeuData | undefined;
  addZaehlerBestand: (nummer?: string, verwendung?: string) => void;
  updateZaehlerBestand: (id: string, data: Partial<ZaehlerBestandItemType>) => void;
  removeZaehlerBestand: (id: string) => void;
  updateZaehlerNeu: (data: Partial<ZaehlerNeuData>) => void;
}

export const MultiZaehlerPanel: React.FC<MultiZaehlerPanelProps> = ({
  zaehlerBestand,
  zaehlerNeu,
  addZaehlerBestand,
  updateZaehlerBestand,
  removeZaehlerBestand,
  updateZaehlerNeu,
}) => {
  const hasZaehler = zaehlerBestand && zaehlerBestand.length > 0;
  const hasZusammenlegung = zaehlerBestand?.some((z) => z.aktion === 'zusammenlegen') ?? false;

  return (
    <div className={styles.card} style={{ maxWidth: 800, marginTop: 20 }}>
      <CollapsibleSection
        title="Zähler abmelden / zusammenlegen"
        badge="OPTIONAL"
        icon={'\uD83D\uDCCA'}
      >
        {/* Add button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            onClick={() => addZaehlerBestand('', 'Zähler')}
            style={{
              background: 'rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              color: '#c4b5fd',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            + Zähler hinzufügen
          </button>
        </div>

        {/* Info Box - always visible */}
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(99,139,255,0.08)',
            border: '1px solid rgba(99,139,255,0.2)',
            borderRadius: 10,
            marginBottom: hasZaehler ? 16 : 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>{'\uD83D\uDCA1'}</span>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            <strong style={{ color: '#638bff' }}>Wann ist das relevant?</strong>
            <br />
            <div style={{ marginTop: 8 }}>
              <strong>{'\u2022'} Mehrere Zähler am Standort:</strong> z.B. Haushalt + Wärmepumpe
              {' \u2192 '}können zusammengelegt werden
              <br />
              <strong>{'\u2022'} Alter Zähler abmelden:</strong> z.B. bei Umstellung auf
              Zweirichtungszähler
              <br />
              <strong>{'\u2022'} Nachtspeicher / HT-NT Tarif:</strong> oft werden diese Zähler bei
              PV-Einbau abgemeldet
            </div>
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.25)',
                borderRadius: 6,
              }}
            >
              <strong style={{ color: '#fbbf24' }}>{'\u26A0\uFE0F'} Tipp:</strong> Für einen{' '}
              <strong>einzelnen Standardzähler</strong> (ohne Abmeldung/Zusammenlegung) nutzen Sie
              die Sektion &quot;Zählerdaten&quot; weiter oben.
            </div>
          </div>
        </div>

        {/* Info when no meters */}
        {!hasZaehler && (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
            }}
          >
            Keine weiteren Zähler hinzugefügt. Klicken Sie auf &quot;+ Zähler hinzufügen&quot; wenn
            Zähler abgemeldet oder zusammengelegt werden sollen.
          </div>
        )}

        {/* List of existing meters */}
        {hasZaehler && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {zaehlerBestand!.map((zaehler, idx) => (
              <ZaehlerBestandItemComponent
                key={zaehler.id}
                zaehler={zaehler}
                index={idx}
                onUpdate={updateZaehlerBestand}
                onRemove={removeZaehlerBestand}
              />
            ))}
          </div>
        )}

        {/* New meter configuration - only when meters are being consolidated */}
        {hasZusammenlegung && (
          <ZaehlerNeuConfig
            zaehlerNeu={zaehlerNeu}
            zaehlerBestand={zaehlerBestand}
            updateZaehlerNeu={updateZaehlerNeu}
          />
        )}
      </CollapsibleSection>
    </div>
  );
};
