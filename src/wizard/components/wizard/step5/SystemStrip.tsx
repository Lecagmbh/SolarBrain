/**
 * SystemStrip - Sticky bottom bar showing live system totals
 * Shows: kWp | kVA | DC/AC ratio | kWh Speicher | estimated yield
 */

import React from 'react';
import { styles } from '../steps/shared';

interface SystemStripProps {
  kwp: number;
  kva: number;
  kwhSpeicher: number;
  ertrag: number;
  dcAcRatio: { ratio: number; status: string; message: string } | null;
}

export const SystemStrip: React.FC<SystemStripProps> = ({
  kwp,
  kva,
  kwhSpeicher,
  ertrag,
  dcAcRatio,
}) => {
  if (kwp <= 0 && kva <= 0) return null;

  return (
    <div className={styles.systemStrip}>
      <div className={styles.systemStripItem}>
        <span className={styles.systemStripIcon}>☀️</span>
        <span className={styles.systemStripValue}>{kwp.toFixed(1)}</span>
        <span className={styles.systemStripLabel}>kWp</span>
      </div>

      <div className={styles.systemStripDivider} />

      <div className={styles.systemStripItem}>
        <span className={styles.systemStripIcon}>⚡</span>
        <span className={styles.systemStripValue}>{kva.toFixed(1)}</span>
        <span className={styles.systemStripLabel}>kVA</span>
      </div>

      {dcAcRatio && dcAcRatio.ratio > 0 && (
        <>
          <div className={styles.systemStripDivider} />
          <span className={styles.systemStripDcAc} data-status={dcAcRatio.status}>
            DC/AC {dcAcRatio.ratio.toFixed(2)}
          </span>
        </>
      )}

      {kwhSpeicher > 0 && (
        <>
          <div className={styles.systemStripDivider} />
          <div className={styles.systemStripItem}>
            <span className={styles.systemStripIcon}>🔋</span>
            <span className={styles.systemStripValue}>{kwhSpeicher.toFixed(1)}</span>
            <span className={styles.systemStripLabel}>kWh</span>
          </div>
        </>
      )}

      {ertrag > 0 && (
        <>
          <div className={styles.systemStripDivider} />
          <div className={styles.systemStripItem}>
            <span className={styles.systemStripIcon}>🏠</span>
            <span className={styles.systemStripValue}>~{ertrag.toLocaleString()}</span>
            <span className={styles.systemStripLabel}>kWh/a</span>
          </div>
        </>
      )}
    </div>
  );
};
