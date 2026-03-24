/**
 * GridNetz Wizard - Right Sidebar
 * ================================
 * Live Preview + Help + TAB-Vorschriften + Components Info
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '../../../stores/wizardStore';
import { STEP_CONFIG } from '../../../types/wizard.types';
import { getAccessToken } from '../../../lib/stubs/tokenStorage';

interface RightSidebarProps {
  currentStep: number;
}

interface TabHint {
  id: string;
  section: string;
  docName: string;
  content: string;
  score: number;
}

function useTabHints(nbName: string | undefined, step: number) {
  const [hints, setHints] = useState<TabHint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHints = useCallback(async () => {
    if (!nbName || step < 4) {
      setHints([]);
      return;
    }
    setLoading(true);
    try {
      const token = getAccessToken();
      const params = new URLSearchParams({ nb: nbName, step: String(step) });
      const res = await fetch(`/api/wizard-learning/tab-hints?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHints(data.hints || []);
      }
    } catch {
      // Silently fail - TAB hints are optional
    } finally {
      setLoading(false);
    }
  }, [nbName, step]);

  useEffect(() => { fetchHints(); }, [fetchHints]);

  return { hints, loading };
}

// Step-specific help content
const STEP_HELP: Record<number, { title: string; text: string }> = {
  1: {
    title: 'Anlagentyp wählen',
    text: 'Wählen Sie die Komponenten Ihrer Anlage. Sie können mehrere Komponenten kombinieren (z.B. PV + Speicher + Wallbox).',
  },
  2: {
    title: 'Standort angeben',
    text: 'Geben Sie die Adresse des Anlagenstandorts ein. Anhand der PLZ wird automatisch der zuständige Netzbetreiber ermittelt.',
  },
  3: {
    title: 'Eigentümer-Daten',
    text: 'Falls der Anlagenbetreiber nicht der Grundstückseigentümer ist, tragen Sie hier die Eigentümerdaten ein.',
  },
  4: {
    title: 'Netzbetreiber',
    text: 'Der Netzbetreiber wird automatisch anhand Ihrer PLZ ermittelt. Bei Bedarf können Sie ihn manuell anpassen.',
  },
  5: {
    title: 'Technische Daten',
    text: 'Geben Sie hier die technischen Details Ihrer Anlage ein: Module, Wechselrichter, Speicher und Messkonzept.',
  },
  6: {
    title: 'Kontaktdaten',
    text: 'Tragen Sie die Kontaktdaten des Anlagenbetreibers ein. Diese werden für die Netzanmeldung benötigt.',
  },
  7: {
    title: 'Dokumente',
    text: 'Laden Sie erforderliche Dokumente hoch: Personalausweis, Grundbuchauszug, technische Datenblätter etc.',
  },
  8: {
    title: 'Zusammenfassung',
    text: 'Überprüfen Sie alle Angaben. Nach dem Absenden wird Ihre Netzanmeldung eingereicht.',
  },
};

export const RightSidebar: React.FC<RightSidebarProps> = ({ currentStep }) => {
  const { data } = useWizardStore();
  const stepConfig = STEP_CONFIG[currentStep - 1];
  const help = STEP_HELP[currentStep] || { title: 'Hilfe', text: 'Keine Hilfe verfügbar.' };

  // TAB-Vorschriften Hints
  const nbName = data.step4?.netzbetreiberName;
  const { hints: tabHints, loading: tabLoading } = useTabHints(nbName, currentStep);
  const [expandedHint, setExpandedHint] = useState<string | null>(null);

  // Calculate technical values
  const komponenten = data.step1?.komponenten || [];
  const hatPV = komponenten.includes('pv');
  const hatSpeicher = komponenten.includes('speicher');
  const hatWallbox = komponenten.includes('wallbox');
  const hatWP = komponenten.includes('waermepumpe');

  const pvKwp = Number(data.step5?.gesamtleistungKwp) || 0;

  // Speicher-Kapazität aus Array berechnen
  const speicherKwh = (data.step5?.speicher || []).reduce(
    (sum, s) => sum + (Number(s.kapazitaetKwh) || 0),
    0
  );

  // Wechselrichter-Leistung aus Array berechnen
  const wechselrichterKva = (data.step5?.wechselrichter || []).reduce(
    (sum, wr) => sum + (Number(wr.leistungKva) || 0) * (wr.anzahl || 1),
    0
  );

  // Wallbox-Leistung aus Array berechnen
  const wallboxKw = (data.step5?.wallboxen || []).reduce(
    (sum, wb) => sum + (Number(wb.leistungKw) || 0) * (wb.anzahl || 1),
    0
  );

  // Module count
  const moduleCount = (data.step5?.dachflaechen || []).reduce(
    (sum: number, df: any) => sum + (Number(df?.anzahlModule) || 0),
    0
  );

  return (
    <aside className="wizard-sidebar-right">
      {/* Live Preview */}
      <div className="wizard-preview-card">
        <div className="wizard-preview-title">
          Live-Vorschau
        </div>

        <div className="wizard-preview-grid">
          {hatPV && (
            <>
              <div className="wizard-preview-item">
                <div className="wizard-preview-item-label">PV-Leistung</div>
                <div className="wizard-preview-item-value">
                  {pvKwp.toFixed(1)}
                  <span className="wizard-preview-item-unit">kWp</span>
                </div>
              </div>
              <div className="wizard-preview-item">
                <div className="wizard-preview-item-label">Module</div>
                <div className="wizard-preview-item-value">
                  {moduleCount}
                  <span className="wizard-preview-item-unit">Stk</span>
                </div>
              </div>
            </>
          )}

          {hatSpeicher && (
            <div className="wizard-preview-item">
              <div className="wizard-preview-item-label">Speicher</div>
              <div className="wizard-preview-item-value">
                {speicherKwh.toFixed(1)}
                <span className="wizard-preview-item-unit">kWh</span>
              </div>
            </div>
          )}

          {wechselrichterKva > 0 && (
            <div className="wizard-preview-item">
              <div className="wizard-preview-item-label">Wechselrichter</div>
              <div className="wizard-preview-item-value">
                {wechselrichterKva.toFixed(1)}
                <span className="wizard-preview-item-unit">kVA</span>
              </div>
            </div>
          )}

          {hatWallbox && wallboxKw > 0 && (
            <div className="wizard-preview-item">
              <div className="wizard-preview-item-label">Wallbox</div>
              <div className="wizard-preview-item-value">
                {wallboxKw}
                <span className="wizard-preview-item-unit">kW</span>
              </div>
            </div>
          )}
        </div>

        {/* Address if available */}
        {data.step2?.strasse && (
          <div style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
          }}>
            <div style={{ marginBottom: 4, color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Standort
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
              {data.step2.strasse} {data.step2.hausnummer}
            </div>
            <div>
              {data.step2.plz} {data.step2.ort}
            </div>
          </div>
        )}
      </div>

      {/* Help Box */}
      <div className="wizard-help-box">
        <motion.div
          className="wizard-help-icon"
          whileHover={{ rotate: 10, scale: 1.1 }}
        >
          💡
        </motion.div>
        <div className="wizard-help-title">{help.title}</div>
        <div className="wizard-help-text">{help.text}</div>
      </div>

      {/* TAB-Vorschriften Hints */}
      {(tabHints.length > 0 || tabLoading) && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.04))',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 16 }}>&#9888;&#65039;</span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(245, 158, 11, 0.9)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
            }}>
              TAB-Vorschriften
            </span>
            {nbName && (
              <span style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.4)',
                marginLeft: 'auto',
              }}>
                {nbName.length > 20 ? nbName.substring(0, 20) + '...' : nbName}
              </span>
            )}
          </div>

          {tabLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
            }}>
              <span style={{
                width: 12,
                height: 12,
                border: '2px solid rgba(245,158,11,0.2)',
                borderTopColor: 'rgba(245,158,11,0.8)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }} />
              Lade TAB-Hinweise...
            </div>
          )}

          <AnimatePresence>
            {tabHints.slice(0, 4).map((hint) => (
              <motion.div
                key={hint.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '8px 10px',
                  marginBottom: 6,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  borderLeft: '3px solid rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setExpandedHint(expandedHint === hint.id ? null : hint.id)}
                whileHover={{ x: 2 }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                  marginBottom: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{
                    fontSize: 8,
                    transition: 'transform 0.2s',
                    transform: expandedHint === hint.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: 'rgba(245,158,11,0.7)',
                  }}>&#9654;</span>
                  {hint.section}
                </div>
                <AnimatePresence>
                  {expandedHint === hint.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.55)',
                        lineHeight: 1.5,
                        marginTop: 6,
                        paddingTop: 6,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        whiteSpace: 'pre-wrap' as const,
                      }}>
                        {hint.content.length > 400
                          ? hint.content.substring(0, 400) + '...'
                          : hint.content}
                      </div>
                      <div style={{
                        fontSize: 9,
                        color: 'rgba(245,158,11,0.5)',
                        marginTop: 4,
                      }}>
                        {hint.docName}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {tabHints.length > 4 && (
            <div style={{
              fontSize: 10,
              color: 'rgba(245,158,11,0.6)',
              textAlign: 'center',
              paddingTop: 4,
            }}>
              +{tabHints.length - 4} weitere Hinweise
            </div>
          )}
        </div>
      )}

      {/* Component Cards */}
      <div className="wizard-component-cards">
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 8,
        }}>
          Komponenten
        </div>

        {hatPV && (
          <motion.div
            className={`wizard-component-card ${currentStep === 5 ? 'active' : ''}`}
            whileHover={{ x: -2 }}
          >
            <div className="wizard-component-header">
              <div className="wizard-component-icon">☀️</div>
              <div className="wizard-component-name">Photovoltaik</div>
              <div className={`wizard-component-status ${pvKwp > 0 ? 'active' : ''}`} />
            </div>
            {pvKwp > 0 && (
              <div className="wizard-component-details">
                {pvKwp.toFixed(2)} kWp • {moduleCount} Module
              </div>
            )}
          </motion.div>
        )}

        {hatSpeicher && (
          <motion.div
            className={`wizard-component-card ${currentStep === 5 ? 'active' : ''}`}
            whileHover={{ x: -2 }}
          >
            <div className="wizard-component-header">
              <div className="wizard-component-icon">🔋</div>
              <div className="wizard-component-name">Speicher</div>
              <div className={`wizard-component-status ${speicherKwh > 0 ? 'active' : ''}`} />
            </div>
            {speicherKwh > 0 && (
              <div className="wizard-component-details">
                {speicherKwh.toFixed(1)} kWh Kapazität
              </div>
            )}
          </motion.div>
        )}

        {hatWallbox && (
          <motion.div
            className={`wizard-component-card ${currentStep === 5 ? 'active' : ''}`}
            whileHover={{ x: -2 }}
          >
            <div className="wizard-component-header">
              <div className="wizard-component-icon">🚗</div>
              <div className="wizard-component-name">Wallbox</div>
              <div className={`wizard-component-status ${wallboxKw > 0 ? 'active' : ''}`} />
            </div>
            {wallboxKw > 0 && (
              <div className="wizard-component-details">
                {wallboxKw} kW Ladeleistung
              </div>
            )}
          </motion.div>
        )}

        {hatWP && (
          <motion.div
            className={`wizard-component-card ${currentStep === 5 ? 'active' : ''}`}
            whileHover={{ x: -2 }}
          >
            <div className="wizard-component-header">
              <div className="wizard-component-icon">🌡️</div>
              <div className="wizard-component-name">Wärmepumpe</div>
              <div className="wizard-component-status" />
            </div>
          </motion.div>
        )}

        {komponenten.length === 0 && (
          <div style={{
            padding: 16,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
          }}>
            Noch keine Komponenten gewählt
          </div>
        )}
      </div>

      {/* Current Step Info */}
      <div style={{
        marginTop: 'auto',
        padding: 16,
        background: 'rgba(99,139,255,0.05)',
        border: '1px solid rgba(99,139,255,0.15)',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 4,
        }}>
          Aktueller Schritt
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#638bff',
        }}>
          {stepConfig.icon} {stepConfig.title}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
