/**
 * HybridSystemBanner - Unified hybrid system UX
 * Combines the hybrid speicher options list and the hint banner
 * into a single cohesive component with proper CSS classes.
 */

import React from 'react';
import { styles } from '../steps/shared';

interface HybridSpeicherOption {
  id: number;
  hersteller: string;
  modell: string;
  kapazitaetBruttoKwh: number;
}

interface HybridSystemBannerProps {
  speicherOptions: HybridSpeicherOption[];
  hint: string | null;
  onSelectSpeicher: (sp: HybridSpeicherOption) => void;
  onDismissOptions: () => void;
  onDismissHint: () => void;
}

export const HybridSystemBanner: React.FC<HybridSystemBannerProps> = ({
  speicherOptions,
  hint,
  onSelectSpeicher,
  onDismissOptions,
  onDismissHint,
}) => {
  if (speicherOptions.length === 0 && !hint) return null;

  return (
    <>
      {/* Hybrid Speicher Options (WR -> Speicher) */}
      {speicherOptions.length > 0 && (
        <div className={styles.hybridBanner}>
          <div className={styles.hybridBannerHeader}>
            <span className={styles.hybridBannerIcon}>⚡</span>
            <span className={styles.hybridBannerTitle}>Hybrid-System erkannt — Speicher auswählen:</span>
          </div>
          <div className={styles.hybridBannerOptions}>
            {speicherOptions.map((sp) => (
              <button
                key={sp.id}
                type="button"
                className={styles.hybridBannerOption}
                onClick={() => onSelectSpeicher(sp)}
              >
                {sp.hersteller} {sp.modell} — {sp.kapazitaetBruttoKwh} kWh
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.hybridBannerDismiss}
            onClick={onDismissOptions}
          >
            ✕ Schließen
          </button>
        </div>
      )}

      {/* Hybrid Hint Banner */}
      {hint && (
        <div className={styles.hybridBannerHint}>
          <div className={styles.hybridBannerHintText}>
            <span>⚡</span>
            <span>{hint}</span>
          </div>
          <button
            type="button"
            className={styles.hybridBannerDismiss}
            onClick={onDismissHint}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};
