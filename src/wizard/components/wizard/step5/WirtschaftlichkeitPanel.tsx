/**
 * WirtschaftlichkeitPanel — Collapsible Section für Investition & ROI
 */

import React, { useState } from 'react';
import { styles } from '../steps/shared';
import { Input } from '../../ui';
import type { SolarBerechnung } from '../../../lib/api/client';
import { useWizardStore } from '../../../stores/wizardStore';
import { solarApi } from '../../../lib/api/client';

interface WirtschaftlichkeitPanelProps {
  daten: SolarBerechnung;
  onUpdate?: (investition: number) => void;
}

export const WirtschaftlichkeitPanel: React.FC<WirtschaftlichkeitPanelProps> = ({
  daten,
  onUpdate,
}) => {
  const [investition, setInvestition] = useState<string>('');
  const [berechnet, setBerechnet] = useState(daten);

  const handleInvestitionChange = async (val: string) => {
    setInvestition(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onUpdate?.(num);
      // Neuberechnung mit Investition
      const { data } = useWizardStore.getState();
      const { step2, step5 } = data;
      const dachflaechen = (step5.dachflaechen || [])
        .filter(d => d.modulLeistungWp > 0 && d.modulAnzahl > 0)
        .map(d => ({
          kwp: (d.modulLeistungWp * d.modulAnzahl) / 1000,
          neigung: d.neigung || 30,
          ausrichtung: d.ausrichtung || 'S',
        }));

      if (dachflaechen.length > 0) {
        try {
          const speicherKwh = (step5.speicher || []).reduce((s, sp) => s + (sp.kapazitaetKwh || 0) * (sp.anzahl || 1), 0);
          const result = await solarApi.berechnung({
            lat: step2.gpsLat || 0,
            lng: step2.gpsLng || 0,
            dachflaechen,
            speicherKwh: speicherKwh > 0 ? speicherKwh : undefined,
            investition: num,
          });
          if (result.data) setBerechnet(result.data);
        } catch {}
      }
    }
  };

  const amortisation = berechnet.amortisationJahre;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelTitleIcon}>💰</div>
          <span>Wirtschaftlichkeit</span>
        </div>
      </div>

      {/* Investition Input */}
      <div style={{ marginBottom: 20 }}>
        <Input
          label="Investitionssumme (€)"
          type="number"
          value={investition}
          onChange={handleInvestitionChange}
          placeholder="z.B. 18000"
          hint="Optional — für Amortisationsberechnung"
        />
      </div>

      {/* Wirtschaftlichkeit Grid */}
      <div className={styles.wirtschaftGrid}>
        {/* Linke Spalte: Einnahmen */}
        <div>
          <div className={styles.wirtschaftRow}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Strompreis-Ersparnis</span>
            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 14 }}>
              {berechnet.strompreisErsparnis.toLocaleString()} €/Jahr
            </span>
          </div>
          <div className={styles.wirtschaftRow}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Einspeisevergütung</span>
            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 14 }}>
              {berechnet.einspeiseverguetung.toLocaleString()} €/Jahr
            </span>
          </div>
          <div className={styles.wirtschaftRow} style={{ borderBottom: 'none' }}>
            <span style={{ color: '#fafafa', fontWeight: 600, fontSize: 14 }}>Gesamt-Ersparnis</span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>
              {berechnet.jaehrlicheErsparnis.toLocaleString()} €/Jahr
            </span>
          </div>
        </div>

        {/* Rechte Spalte: ROI */}
        <div>
          <div className={styles.wirtschaftRow}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Strompreis</span>
            <span style={{ color: '#fafafa', fontSize: 14 }}>{berechnet.strompreis} ct/kWh</span>
          </div>
          <div className={styles.wirtschaftRow}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>EEG-Vergütung</span>
            <span style={{ color: '#fafafa', fontSize: 14 }}>{berechnet.eegVerguetungCtKwh} ct/kWh</span>
          </div>
          {amortisation != null && (
            <div className={styles.wirtschaftRow}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Amortisation</span>
              <span style={{ color: amortisation <= 12 ? '#22c55e' : '#f59e0b', fontWeight: 600, fontSize: 14 }}>
                {amortisation} Jahre
              </span>
            </div>
          )}
          <div className={styles.wirtschaftRow} style={{ borderBottom: 'none' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Rendite 20 Jahre</span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>
              {berechnet.rendite20Jahre.toLocaleString()} €
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
