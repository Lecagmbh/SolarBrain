/**
 * Baunity AI Assistent - Premium Floating Panel
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '../../../stores/wizardStore';
import { analyzeWizardComplete } from '../../../lib/intelligence';

const injectAIStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('baunity-ai-styles')) return;

  const style = document.createElement('style');
  style.id = 'baunity-ai-styles';
  style.textContent = `
    .ai-toggle { position: fixed; bottom: 100px; left: 24px; z-index: 1000; width: 60px; height: 60px; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4); transition: all 0.3s; }
    .ai-toggle:hover { transform: scale(1.08) rotate(5deg); }
    .ai-toggle .badge { position: absolute; top: -5px; right: -5px; width: 24px; height: 24px; background: #ef4444; border-radius: 50%; font-size: 12px; font-weight: 700; color: white; display: flex; align-items: center; justify-content: center; }
    .ai-panel { position: fixed; bottom: 180px; left: 24px; z-index: 999; width: 380px; max-height: calc(100vh - 220px); background: rgba(10, 15, 26, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
    .ai-panel-header { padding: 20px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1)); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; gap: 12px; }
    .ai-panel-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #10b981, #06b6d4); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .ai-panel-title { font-size: 18px; font-weight: 700; color: white; margin: 0; }
    .ai-panel-subtitle { font-size: 12px; color: rgba(255, 255, 255, 0.5); margin: 2px 0 0 0; }
    .ai-panel-close { margin-left: auto; width: 32px; height: 32px; background: rgba(255, 255, 255, 0.1); border: none; border-radius: 10px; color: white; font-size: 18px; cursor: pointer; }
    .ai-panel-content { padding: 16px; overflow-y: auto; max-height: calc(100vh - 350px); }
    .ai-szenario { background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 16px; margin-bottom: 16px; }
    .ai-szenario-badge { display: inline-flex; padding: 4px 10px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 100px; font-size: 11px; font-weight: 600; color: #6ee7b7; margin-bottom: 8px; }
    .ai-szenario-name { font-size: 16px; font-weight: 700; color: white; margin: 0 0 4px 0; }
    .ai-szenario-desc { font-size: 13px; color: rgba(255, 255, 255, 0.6); margin: 0; }
    .ai-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
    .ai-stat { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px; }
    .ai-stat-label { font-size: 11px; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; }
    .ai-stat-value { font-size: 18px; font-weight: 700; color: white; }
    .ai-stat-value.highlight { background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .ai-section { margin-bottom: 16px; }
    .ai-section-title { font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; margin-bottom: 10px; }
    .ai-tipp { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px; margin-bottom: 8px; display: flex; gap: 10px; }
    .ai-tipp.success { border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05); }
    .ai-tipp.warning { border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05); }
    .ai-tipp.info { border-color: rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.05); }
    .ai-tipp.error { border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }
    .ai-tipp-icon { font-size: 18px; flex-shrink: 0; }
    .ai-tipp-text { font-size: 13px; color: rgba(255, 255, 255, 0.8); line-height: 1.4; }
    .ai-finance { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 16px; }
    .ai-finance-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .ai-finance-row:last-child { border-bottom: none; }
    .ai-finance-label { font-size: 13px; color: rgba(255, 255, 255, 0.6); }
    .ai-finance-value { font-size: 14px; font-weight: 600; color: #6ee7b7; }
    .ai-progress-ring { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; margin-bottom: 16px; }
    .ai-ring { width: 48px; height: 48px; position: relative; }
    .ai-ring svg { transform: rotate(-90deg); }
    .ai-ring-bg { fill: none; stroke: rgba(255, 255, 255, 0.1); stroke-width: 4; }
    .ai-ring-progress { fill: none; stroke: url(#ai-gradient); stroke-width: 4; stroke-linecap: round; }
    .ai-ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; }
    .ai-progress-title { font-size: 14px; font-weight: 600; color: white; margin: 0; }
    .ai-progress-subtitle { font-size: 12px; color: rgba(255, 255, 255, 0.5); margin: 2px 0 0 0; }
    @media (max-width: 480px) { .ai-panel { left: 12px; right: 12px; width: auto; } .ai-toggle { bottom: 80px; left: 16px; width: 52px; height: 52px; } }
  `;
  document.head.appendChild(style);
};

export const AIAssistent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data, currentStep } = useWizardStore();

  useEffect(() => { injectAIStyles(); }, []);

  const analysis = useMemo(() => analyzeWizardComplete(data, currentStep), [data, currentStep]);

  const { szenarioName, szenarioBeschreibung, berechnet, tipps, hinweise, warnungen, verfahren, ertrag, wirtschaftlichkeit, prognose, messkonzept } = analysis;

  const alertCount = (tipps?.length || 0) + (warnungen?.length || 0);

  const progress = useMemo(() => {
    let filled = 0;
    if (data.step1.kategorie) filled++;
    if (data.step2.strasse && data.step2.plz) filled++;
    if (data.step3.istEigentuemer !== null) filled++;
    if (data.step4.netzbetreiberName) filled++;
    if (data.step6.vorname && data.step6.email) filled++;
    if (data.step8.agbAkzeptiert) filled++;
    return Math.round((filled / 6) * 100);
  }, [data]);

  return (
    <>
      <motion.button className="ai-toggle" onClick={() => setIsOpen(!isOpen)} whileHover={{ scale: 1.08, rotate: 5 }} whileTap={{ scale: 0.95 }}>
        🤖
        {alertCount > 0 && !isOpen && <span className="badge">{alertCount}</span>}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div className="ai-panel" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}>
            <svg width="0" height="0"><defs><linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs></svg>

            <div className="ai-panel-header">
              <div className="ai-panel-icon">🤖</div>
              <div><h3 className="ai-panel-title">AI Assistent</h3><p className="ai-panel-subtitle">Live-Analyse</p></div>
              <button className="ai-panel-close" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="ai-panel-content">
              <div className="ai-progress-ring">
                <div className="ai-ring">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle className="ai-ring-bg" cx="24" cy="24" r="20" />
                    <circle className="ai-ring-progress" cx="24" cy="24" r="20" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * progress / 100)} />
                  </svg>
                  <span className="ai-ring-text">{progress}%</span>
                </div>
                <div><p className="ai-progress-title">Anmeldung {progress}% komplett</p><p className="ai-progress-subtitle">Step {currentStep} von 8</p></div>
              </div>

              <div className="ai-szenario">
                <div className="ai-szenario-badge">⚡ {verfahren?.typ || 'standard'}</div>
                <h4 className="ai-szenario-name">{szenarioName}</h4>
                <p className="ai-szenario-desc">{szenarioBeschreibung}</p>
              </div>

              {(berechnet.gesamtleistungKwp > 0 || berechnet.wallboxKw > 0 || berechnet.waermepumpeKw > 0) && (
                <div className="ai-stats">
                  {berechnet.gesamtleistungKwp > 0 && <div className="ai-stat"><div className="ai-stat-label">PV-Leistung</div><div className="ai-stat-value highlight">{berechnet.pvString}</div></div>}
                  {berechnet.speicherKwh > 0 && <div className="ai-stat"><div className="ai-stat-label">Speicher</div><div className="ai-stat-value">{berechnet.speicherString}</div></div>}
                  {berechnet.wallboxKw > 0 && <div className="ai-stat"><div className="ai-stat-label">Wallbox</div><div className="ai-stat-value">{berechnet.wallboxKw} kW</div></div>}
                  {berechnet.waermepumpeKw > 0 && <div className="ai-stat"><div className="ai-stat-label">Wärmepumpe</div><div className="ai-stat-value">{berechnet.waermepumpeKw} kW</div></div>}
                </div>
              )}

              {ertrag && (
                <div className="ai-section">
                  <div className="ai-section-title">☀️ Ertragsprognose</div>
                  <div className="ai-stats">
                    <div className="ai-stat"><div className="ai-stat-label">Jahresertrag</div><div className="ai-stat-value highlight">~{ertrag.jahresertragKwh?.toLocaleString()} kWh</div></div>
                    <div className="ai-stat"><div className="ai-stat-label">Eigenverbrauch</div><div className="ai-stat-value">{ertrag.eigenverbrauchMitSpeicher || ertrag.eigenverbrauchOhneSpeicher}%</div></div>
                  </div>
                </div>
              )}

              {wirtschaftlichkeit && (
                <div className="ai-section">
                  <div className="ai-section-title">💰 Wirtschaftlichkeit</div>
                  <div className="ai-finance">
                    <div className="ai-finance-row"><span className="ai-finance-label">Amortisation</span><span className="ai-finance-value">{wirtschaftlichkeit.amortisationJahre} Jahre</span></div>
                    <div className="ai-finance-row"><span className="ai-finance-label">25-Jahres-Ersparnis</span><span className="ai-finance-value">+{wirtschaftlichkeit.ersparnis25Jahre?.toLocaleString()}€</span></div>
                    {berechnet.eegVerguetungCent > 0 && <div className="ai-finance-row"><span className="ai-finance-label">EEG-Vergütung</span><span className="ai-finance-value">{berechnet.eegVerguetungCent} ct/kWh</span></div>}
                    {berechnet.paragraph14aErsparnis > 0 && <div className="ai-finance-row"><span className="ai-finance-label">§14a Ersparnis</span><span className="ai-finance-value">{berechnet.paragraph14aErsparnis}€/Jahr</span></div>}
                  </div>
                </div>
              )}

              {messkonzept && messkonzept.typ !== 'MK0' && (
                <div className="ai-section">
                  <div className="ai-section-title">📊 Messkonzept</div>
                  <div className="ai-tipp info"><span className="ai-tipp-icon">📊</span><span className="ai-tipp-text">{messkonzept.typ}: {messkonzept.name}</span></div>
                </div>
              )}

              {prognose && (
                <div className="ai-section">
                  <div className="ai-section-title">⏱️ Bearbeitung</div>
                  <div className="ai-tipp info"><span className="ai-tipp-icon">⏱️</span><span className="ai-tipp-text">Geschätzt: {prognose.erwarteteBearbeitungTage} Werktage ({prognose.konfidenzbereich?.min}-{prognose.konfidenzbereich?.max})</span></div>
                </div>
              )}

              {hinweise && hinweise.length > 0 && (
                <div className="ai-section">
                  <div className="ai-section-title">💡 Hinweise</div>
                  {hinweise.map((h: string, i: number) => (
                    <div key={i} className={`ai-tipp ${h.startsWith('✅') ? 'success' : 'info'}`}>
                      <span className="ai-tipp-icon">{h.startsWith('✅') ? '✅' : '💡'}</span>
                      <span className="ai-tipp-text">{h.replace(/^[✅💡⚠️]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              )}

              {warnungen && warnungen.length > 0 && (
                <div className="ai-section">
                  <div className="ai-section-title">⚠️ Wichtig</div>
                  {warnungen.map((w: string, i: number) => (
                    <div key={i} className="ai-tipp warning"><span className="ai-tipp-icon">⚠️</span><span className="ai-tipp-text">{w.replace(/^⚠️\s*/, '')}</span></div>
                  ))}
                </div>
              )}

              {(berechnet.istNaSchutzPflichtig || berechnet.istDirektvermarktungPflichtig || berechnet.istAnlagenzertifikatPflichtig) && (
                <div className="ai-section">
                  <div className="ai-section-title">🚨 Grenzwerte</div>
                  {berechnet.istNaSchutzPflichtig && <div className="ai-tipp warning"><span className="ai-tipp-icon">⚡</span><span className="ai-tipp-text">{"NA-Schutz erforderlich (>30 kVA)"}</span></div>}
                  {berechnet.istDirektvermarktungPflichtig && <div className="ai-tipp warning"><span className="ai-tipp-icon">📈</span><span className="ai-tipp-text">{"Direktvermarktung Pflicht (>100 kWp)"}</span></div>}
                  {berechnet.istAnlagenzertifikatPflichtig && <div className="ai-tipp error"><span className="ai-tipp-icon">📋</span><span className="ai-tipp-text">{"Anlagenzertifikat Typ B nötig (>135 kVA)"}</span></div>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistent;
