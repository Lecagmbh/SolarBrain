/**
 * Step4Netzbetreiber - Main orchestrator for Step 4 (Netzbetreiber & Netzanschluss).
 * Composes all sub-components and the useNetzbetreiber hook.
 */

import React, { useEffect } from 'react';
import { useWizardStore } from '../../../stores/wizardStore';
import { injectStyles, styles } from '../steps/shared';
import { useNetzbetreiber } from './useNetzbetreiber';
import { NetzbetreiberPanel } from './NetzbetreiberPanel';
import { ZaehlerPanel } from './ZaehlerPanel';
import { NetzanschlussPanel } from './NetzanschlussPanel';
import { MultiZaehlerPanel } from './MultiZaehlerPanel';

export const Step4Netzbetreiber: React.FC = () => {
  useEffect(() => {
    injectStyles();
  }, []);

  const {
    data,
    updateStep4,
    addZaehlerBestand,
    updateZaehlerBestand,
    removeZaehlerBestand,
    updateZaehlerNeu,
  } = useWizardStore();

  const { step2, step4 } = data;

  const nb = useNetzbetreiber(step2.plz || '', step4.netzbetreiberName, updateStep4);

  return (
    <div className={styles.stepWide}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>{'\u26A1'}</div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Schritt 4</div>
          <h2 className={styles.sectionTitleLarge}>Netzbetreiber & Netzanschluss</h2>
          <p className={styles.sectionSubtitle}>
            Informationen zum zuständigen Verteilnetzbetreiber und technische Anschlussdaten
          </p>
        </div>
      </div>

      {/* Loading / Warning Alerts */}
      {(nb.isLoadingApi || nb.isLoadingPlz) && (
        <div className={styles.alertBox} data-type="info" style={{ marginBottom: 20 }}>
          <span>{'\u23F3'}</span>
          <div>
            <div className={styles.alertTitle}>
              {nb.isLoadingPlz ? 'Suche Netzbetreiber...' : 'Lade Netzbetreiber-Datenbank...'}
            </div>
            <div className={styles.alertText}>Bitte warten</div>
          </div>
        </div>
      )}

      {nb.showNBWarning && (
        <div className={styles.alertBox} data-type="error" style={{ marginBottom: 20 }}>
          <span>{'\u26A0\uFE0F'}</span>
          <div>
            <div className={styles.alertTitle}>Keine Netzbetreiber in der Datenbank</div>
            <div className={styles.alertText}>
              Bitte öffnen Sie die Netzbetreiber-Seite im Admin-Portal und pflegen Sie die Daten.
            </div>
          </div>
        </div>
      )}

      <NetzbetreiberPanel
        plz={step2.plz || ''}
        netzbetreiberName={step4.netzbetreiberName}
        netzbetreiberManuell={step4.netzbetreiberManuell}
        inputValue={nb.inputValue}
        showSuggestions={nb.showSuggestions}
        apiNetzbetreiber={nb.apiNetzbetreiber}
        plzMatch={nb.plzMatch}
        isLoadingPlz={nb.isLoadingPlz}
        isSyncingVNB={nb.isSyncingVNB}
        isSavingNew={nb.isSavingNew}
        vnbSyncResult={nb.vnbSyncResult}
        inputRef={nb.inputRef}
        isExactMatch={nb.isExactMatch}
        suggestions={nb.suggestions}
        handleSyncVNBdigital={nb.handleSyncVNBdigital}
        handleSaveNewNetzbetreiber={nb.handleSaveNewNetzbetreiber}
        selectFromDB={nb.selectFromDB}
        saveManualEntry={nb.saveManualEntry}
        handleInputChange={nb.handleInputChange}
        handleBlur={nb.handleBlur}
        handleKeyDown={nb.handleKeyDown}
        setShowSuggestions={nb.setShowSuggestions}
        setPlzMatch={nb.setPlzMatch}
        setInputValue={nb.setInputValue}
        updateStep4={updateStep4}
      />

      <ZaehlerPanel zaehler={step4.zaehler} updateStep4={updateStep4} />

      <NetzanschlussPanel netzanschluss={step4.netzanschluss} updateStep4={updateStep4} />

      <MultiZaehlerPanel
        zaehlerBestand={step4.zaehlerBestand}
        zaehlerNeu={step4.zaehlerNeu}
        addZaehlerBestand={addZaehlerBestand}
        updateZaehlerBestand={updateZaehlerBestand}
        removeZaehlerBestand={removeZaehlerBestand}
        updateZaehlerNeu={updateZaehlerNeu}
      />
    </div>
  );
};
