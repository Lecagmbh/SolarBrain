/**
 * NetzbetreiberPanel - NB selection card with PLZ-auto-detect and autocomplete.
 */

import React from 'react';
import { styles } from '../steps/shared';
import type { Netzbetreiber } from '../../../types/wizard.types';
import { safeString } from './useNetzbetreiber';

interface NetzbetreiberPanelProps {
  // Data from store
  plz: string;
  netzbetreiberName?: string;
  netzbetreiberManuell?: string;

  // From useNetzbetreiber hook
  inputValue: string;
  showSuggestions: boolean;
  apiNetzbetreiber: Netzbetreiber[];
  plzMatch: Netzbetreiber | null;
  isLoadingPlz: boolean;
  isSyncingVNB: boolean;
  isSavingNew: boolean;
  vnbSyncResult: { success: boolean; message: string } | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isExactMatch: boolean;
  suggestions: Netzbetreiber[];

  // Handlers
  handleSyncVNBdigital: () => Promise<void>;
  handleSaveNewNetzbetreiber: () => Promise<void>;
  selectFromDB: (nb: Netzbetreiber) => void;
  saveManualEntry: () => void;
  handleInputChange: (value: string) => void;
  handleBlur: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setShowSuggestions: (v: boolean) => void;
  setPlzMatch: (nb: Netzbetreiber | null) => void;
  setInputValue: (v: string) => void;
  updateStep4: (data: Record<string, any>) => void;
}

export const NetzbetreiberPanel: React.FC<NetzbetreiberPanelProps> = ({
  plz,
  netzbetreiberName,
  netzbetreiberManuell,
  inputValue,
  showSuggestions,
  apiNetzbetreiber,
  plzMatch,
  isLoadingPlz,
  isSyncingVNB,
  isSavingNew,
  vnbSyncResult,
  inputRef,
  isExactMatch,
  suggestions,
  handleSyncVNBdigital,
  handleSaveNewNetzbetreiber,
  selectFromDB,
  saveManualEntry,
  handleInputChange,
  handleBlur,
  handleKeyDown,
  setShowSuggestions,
  setPlzMatch,
  setInputValue,
  updateStep4,
}) => {
  return (
    <div className={`${styles.dataCard} ${netzbetreiberName ? styles.success : ''}`}>
      <div className={styles.dataCardHeader}>
        <div className={styles.dataCardIcon}>{'\uD83C\uDFE2'}</div>
        <div className={styles.dataCardTitle}>
          <h4>Zuständiger Netzbetreiber</h4>
          <p>Wird automatisch anhand der PLZ ermittelt</p>
        </div>
        {netzbetreiberName ? (
          <span className={`${styles.dataCardBadge} ${styles.success}`}>{'\u2713'} Ausgewählt</span>
        ) : (
          <span className={`${styles.dataCardBadge} ${styles.pending}`}>Ausstehend</span>
        )}
      </div>

      {/* CASE 1: PLZ match found and selected */}
      {isExactMatch && netzbetreiberName ? (
        <div className={styles.dataCardContent}>
          <div className={styles.nbSelectedCard}>
            <div className={styles.nbSelectedIcon}>{'\uD83C\uDFE2'}</div>
            <div className={styles.nbSelectedInfo}>
              <div className={styles.nbSelectedName}>{netzbetreiberName}</div>
              <div className={styles.nbSelectedMeta}>
                PLZ {plz} {'\u2022'} {plzMatch?.ort || plzMatch?.bundesland || 'Deutschland'}
              </div>
            </div>
            <span className={styles.nbSelectedBadge}>
              <span className={styles.dot} />
              Automatisch erkannt
            </span>
          </div>
          <div className={styles.dataCardActions}>
            <button
              onClick={() => {
                setPlzMatch(null);
                setInputValue('');
                updateStep4({ netzbetreiberId: undefined, netzbetreiberName: undefined });
              }}
              className={styles.quickActionBtn}
            >
              {'\u270F\uFE0F'} Anderen Netzbetreiber wählen
            </button>
          </div>
        </div>
      ) : (
        /* CASE 2: No match or multiple -> free input field */
        <div className={styles.dataCardContent}>
          <div className={styles.alertBox} data-type="info" style={{ marginBottom: 20 }}>
            <span>{'\uD83D\uDCA1'}</span>
            <div>
              <div className={styles.alertTitle}>Netzbetreiber eingeben</div>
              <div className={styles.alertText}>
                {isLoadingPlz
                  ? 'Suche läuft...'
                  : plz && plz.length === 5
                    ? `Kein automatischer Match für PLZ ${plz}. Bitte wählen oder neu eingeben.`
                    : 'Geben Sie den Namen des zuständigen Netzbetreibers ein.'}
              </div>
            </div>
          </div>

          {/* VNBdigital Sync Button */}
          {plz && plz.length === 5 && !netzbetreiberName && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={handleSyncVNBdigital}
                disabled={isSyncingVNB}
                className={styles.syncButton}
              >
                {isSyncingVNB ? (
                  <>
                    <span className={styles.spinIcon}>{'\u23F3'}</span>
                    <span>Synchronisiere mit VNBdigital...</span>
                  </>
                ) : (
                  <>
                    <span>{'\uD83D\uDD04'}</span>
                    <span>Von VNBdigital abrufen</span>
                  </>
                )}
              </button>
              <div className={styles.syncButtonHint}>
                Ruft den zuständigen Netzbetreiber automatisch von vnbdigital.de ab
              </div>
            </div>
          )}

          {/* Sync Result Message */}
          {vnbSyncResult && (
            <div
              className={`${styles.resultMessage} ${vnbSyncResult.success ? styles.success : styles.error}`}
            >
              {vnbSyncResult.message}
            </div>
          )}

          {/* Info about available NB */}
          {(apiNetzbetreiber?.length || 0) > 0 && (
            <div className={styles.dbCountBadge}>
              {apiNetzbetreiber?.length || 0} Netzbetreiber in der Datenbank verfügbar
            </div>
          )}

          {/* Autocomplete Input */}
          <div className={styles.nbInputWrapper}>
            <label className={styles.nbInputLabel}>
              Netzbetreiber <span className={styles.required}>*</span>
            </label>
            <input
              ref={inputRef as React.LegacyRef<HTMLInputElement>}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={apiNetzbetreiber.length > 0 ? 'Tippen zum Suchen...' : 'Name eingeben...'}
              className={`${styles.nbInput} ${netzbetreiberName ? styles.selected : ''}`}
            />

            {/* Status Badge */}
            {netzbetreiberName && (
              <div className={styles.nbInputBadge}>
                {netzbetreiberManuell ? (
                  <span className={`${styles.nbBadge} ${styles.manual}`}>{'\u26A0\uFE0F'} Manuell</span>
                ) : (
                  <span className={`${styles.nbBadge} ${styles.inDb}`}>{'\u2713'} In DB</span>
                )}
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className={styles.nbDropdown}>
                <div className={styles.nbDropdownHeader}>Vorschläge aus Datenbank</div>
                {suggestions.map((nb) => (
                  <div key={nb.id} onClick={() => selectFromDB(nb)} className={styles.nbDropdownItem}>
                    <div className={styles.nbDropdownItemName}>{safeString(nb.name)}</div>
                    <div className={styles.nbDropdownItemMeta}>
                      {safeString(nb.ort)} {'\u2022'} {safeString(nb.bundesland)}
                    </div>
                  </div>
                ))}
                {inputValue.length >= 2 &&
                  !suggestions.some(
                    (s) =>
                      String(s.name || '').toLowerCase() === String(inputValue || '').toLowerCase()
                  ) && (
                    <div onClick={saveManualEntry} className={styles.nbDropdownAdd}>
                      <div className={styles.nbDropdownAddText}>
                        + &quot;{inputValue}&quot; als neuen Netzbetreiber hinzufügen
                      </div>
                      <div className={styles.nbDropdownAddHint}>
                        Wird automatisch zur Datenbank synchronisiert
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Button: Save manual NB to DB */}
          {netzbetreiberManuell && netzbetreiberName && (
            <div>
              <button
                onClick={handleSaveNewNetzbetreiber}
                disabled={isSavingNew}
                className={styles.saveToDbBtn}
              >
                {isSavingNew ? (
                  <>
                    <span className={styles.spinIcon}>{'\u23F3'}</span>
                    <span>Speichere...</span>
                  </>
                ) : (
                  <>
                    <span>{'\uD83D\uDCBE'}</span>
                    <span>&quot;{netzbetreiberName}&quot; jetzt zur Datenbank hinzufügen</span>
                  </>
                )}
              </button>
              <div className={styles.saveToDbHint}>
                Speichert den Netzbetreiber dauerhaft mit PLZ-Zuordnung
              </div>
            </div>
          )}

          {/* Info Text */}
          <div className={styles.infoTip}>
            <span>{'\uD83D\uDCA1'}</span>
            <span>
              Neue Einträge werden automatisch mit der Netzbetreiber-Datenbank synchronisiert und für
              zukünftige PLZ-Zuordnungen gelernt.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
