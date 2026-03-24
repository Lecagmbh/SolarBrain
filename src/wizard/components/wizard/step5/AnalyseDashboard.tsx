/**
 * AnalyseDashboard - Analysis section at the bottom of Step 5
 * Shows KPI cards, monthly chart, CO2 badge, and economics.
 * Replaces the old AnlagenDashboard that was at the top.
 */

import React from 'react';
import { styles } from '../steps/shared';
import { ErtragsChart } from './ErtragsChart';
import type { SolarBerechnung } from '../../../lib/api/client';

interface AnalyseDashboardProps {
  solarDaten: SolarBerechnung | null;
  loading: boolean;
  hatKoordinaten: boolean;
  kwp: number;
  ertragFallback: number;
  dcAcRatio: { ratio: number; status: string; message: string } | null;
}

export const AnalyseDashboard: React.FC<AnalyseDashboardProps> = ({
  solarDaten,
  loading,
  hatKoordinaten,
  kwp,
  ertragFallback,
  dcAcRatio,
}) => {
  if (kwp <= 0 && !loading) return null;

  const jahresertrag = solarDaten?.jahresertragKwh || ertragFallback;
  const autarkie = solarDaten?.autarkiegrad ?? null;
  const ersparnis = solarDaten?.jaehrlicheErsparnis ?? null;
  const amortisation = solarDaten?.amortisationJahre ?? null;
  const co2 = solarDaten?.co2EinsparungKg ?? null;
  const baeume = solarDaten?.baeume ?? null;

  return (
    <div className={styles.analyseDashboard}>
      <div className={styles.analyseDashboardHeader}>
        <span style={{ fontSize: 16 }}>📊</span>
        <span className={styles.analyseDashboardTitle}>Analyse & Wirtschaftlichkeit</span>
        {!loading && solarDaten?.pvgisVerfuegbar && (
          <span className={styles.pvgisErtragBadge} style={{ marginLeft: 'auto' }}>PVGIS EU JRC</span>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className={styles.kpiGrid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.kpiCard}>
              <div className={styles.skeleton} style={{ width: '60%', height: 24, margin: '0 auto 8px' }} />
              <div className={styles.skeleton} style={{ width: '40%', height: 12, margin: '0 auto' }} />
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards + Chart in 2-column layout */}
      {!loading && jahresertrag > 0 && (
        <div className={styles.analyseDashboardContent}>
          <div>
            <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue}>{jahresertrag.toLocaleString()}</div>
                <div className={styles.kpiLabel}>kWh/Jahr</div>
                <div className={styles.kpiSubtext}>
                  {solarDaten?.spezifischerErtrag ? `${solarDaten.spezifischerErtrag} kWh/kWp` : 'Ertragsprognose'}
                </div>
              </div>

              {autarkie != null && (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiValue} style={{ color: autarkie >= 60 ? '#22c55e' : '#f59e0b' }}>
                    {autarkie}%
                  </div>
                  <div className={styles.kpiLabel}>Autarkie</div>
                  <div className={styles.kpiSubtext}>EV {solarDaten?.eigenverbrauchAnteil}%</div>
                </div>
              )}

              {ersparnis != null && (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiValue} style={{ color: '#22c55e' }}>
                    {ersparnis.toLocaleString()}
                  </div>
                  <div className={styles.kpiLabel}>€/Jahr</div>
                  <div className={styles.kpiSubtext}>Gesamtersparnis</div>
                </div>
              )}

              {amortisation != null ? (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiValue} style={{ color: amortisation <= 12 ? '#22c55e' : '#f59e0b' }}>
                    {amortisation}
                  </div>
                  <div className={styles.kpiLabel}>Jahre ROI</div>
                  <div className={styles.kpiSubtext}>Amortisation</div>
                </div>
              ) : ersparnis != null ? (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiValue} style={{ color: '#22c55e' }}>
                    {solarDaten?.rendite20Jahre?.toLocaleString() || '—'}
                  </div>
                  <div className={styles.kpiLabel}>€ / 20 J.</div>
                  <div className={styles.kpiSubtext}>Rendite</div>
                </div>
              ) : null}
            </div>

            {/* CO2 Badge */}
            {co2 != null && co2 > 0 && (
              <div className={styles.co2Badge}>
                <span style={{ fontSize: 20 }}>🌍</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
                    {co2.toLocaleString()} kg CO₂/Jahr eingespart
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    Entspricht {baeume} Bäumen pro Jahr
                  </div>
                </div>
              </div>
            )}

            {/* DC/AC Ratio Info */}
            {dcAcRatio && (
              <div
                className={styles.infoBox}
                data-type={dcAcRatio.status === 'optimal' ? 'success' : dcAcRatio.status === 'kritisch' ? 'error' : 'warning'}
                style={{ marginTop: 12 }}
              >
                <div className={styles.infoBoxIcon}>
                  {dcAcRatio.status === 'optimal' ? '✅' : dcAcRatio.status === 'kritisch' ? '⚠️' : 'ℹ️'}
                </div>
                <div className={styles.infoBoxContent}>
                  <div className={styles.infoBoxTitle}>DC/AC Verhältnis</div>
                  <div className={styles.infoBoxText}>{dcAcRatio.message}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Chart */}
          <div>
            {solarDaten?.monatlicheErtraege && solarDaten.monatlicheErtraege.length > 0 && (
              <ErtragsChart monatlicheErtraege={solarDaten.monatlicheErtraege} />
            )}
          </div>
        </div>
      )}

      {/* No coordinates hint */}
      {!loading && !hatKoordinaten && kwp > 0 && (
        <div className={styles.co2Badge} style={{
          background: 'rgba(245,158,11,0.08)',
          borderColor: 'rgba(245,158,11,0.2)',
          marginTop: 12,
        }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Standort-Koordinaten fehlen — Ertrag basiert auf Faustformel.
            Wählen Sie in Schritt 2 eine Adresse für exakte PVGIS-Daten.
          </div>
        </div>
      )}
    </div>
  );
};
