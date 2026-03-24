/**
 * ZaehlerwechselCenter - Bulk-Tool für Zählerwechsel-Termine
 *
 * Flow: Text einfügen → Parsen → Bestätigen → Benachrichtigen
 * Parser ist rein (nur Regex), kein Installation-Matching beim Parsen.
 */

import { useReducer, useMemo, useCallback } from 'react';
import type { ZwcState, ZwcAction, Stats } from './types';
import { useTerminParser } from './hooks/useTerminParser';
import { useTerminActions } from './hooks/useTerminActions';
import { useInstallationMatch } from './hooks/useInstallationMatch';
import { HeaderStats } from './components/HeaderStats';
import { TerminCard } from './components/TerminCard';
import { TerminCalendar } from './components/TerminCalendar';
import { EmailPreview } from './components/EmailPreview';
import { TermineOverview } from './components/TermineOverview';
import './ZaehlerwechselCenter.css';

// ─── Reducer ─────────────────────────────────────────────────────────────

const initialState: ZwcState = {
  termine: [],
  parseErrors: [],
  step: 'input',
  processingIndex: -1,
  rawText: '',
  selectedTerminId: null,
};

function reducer(state: ZwcState, action: ZwcAction): ZwcState {
  switch (action.type) {
    case 'SET_RAW_TEXT':
      return { ...state, rawText: action.payload };

    case 'PARSE_RESULT':
      return {
        ...state,
        termine: action.payload.termine,
        parseErrors: action.payload.errors,
        step: action.payload.termine.length > 0 ? 'review' : 'input',
      };

    case 'SET_MATCH_CANDIDATES':
      return {
        ...state,
        termine: state.termine.map(t =>
          t.id === action.payload.terminId
            ? { ...t, matchCandidates: action.payload.candidates }
            : t
        ),
      };

    case 'SELECT_MATCH':
      return {
        ...state,
        termine: state.termine.map(t =>
          t.id === action.payload.terminId
            ? {
                ...t,
                selectedInstallationId: action.payload.installationId,
                selectedCustomerName: action.payload.customerName,
              }
            : t
        ),
      };

    case 'CONFIRM_TERMIN':
      return {
        ...state,
        termine: state.termine.map(t =>
          t.id === action.payload && t.status === 'parsed'
            ? { ...t, status: 'confirmed' as const }
            : t
        ),
      };

    case 'CONFIRM_ALL':
      return {
        ...state,
        termine: state.termine.map(t =>
          t.status === 'parsed' && t.selectedInstallationId
            ? { ...t, status: 'confirmed' as const }
            : t
        ),
      };

    case 'UNCONFIRM_TERMIN':
      return {
        ...state,
        termine: state.termine.map(t =>
          t.id === action.payload && t.status === 'confirmed'
            ? { ...t, status: 'parsed' as const }
            : t
        ),
      };

    case 'START_PROCESSING':
      return { ...state, step: 'processing', processingIndex: 0 };

    case 'SET_PROCESSING_INDEX':
      return { ...state, processingIndex: action.payload };

    case 'TERMIN_NOTIFIED':
      return {
        ...state,
        termine: state.termine.map(t =>
          t.id === action.payload.terminId
            ? {
                ...t,
                status: 'notified' as const,
                notificationResult: {
                  email: action.payload.email,
                  whatsapp: action.payload.whatsapp,
                },
              }
            : t
        ),
      };

    case 'TERMIN_ERROR':
      return {
        ...state,
        termine: state.termine.map(t =>
          t.id === action.payload.terminId
            ? { ...t, status: 'error' as const, error: action.payload.error }
            : t
        ),
      };

    case 'PROCESSING_DONE':
      return { ...state, step: 'done', processingIndex: -1 };

    case 'SELECT_TERMIN':
      return { ...state, selectedTerminId: action.payload };

    case 'REMOVE_TERMIN':
      return {
        ...state,
        termine: state.termine.filter(t => t.id !== action.payload),
        selectedTerminId: state.selectedTerminId === action.payload ? null : state.selectedTerminId,
      };

    case 'SET_KOMMENTAR':
      return {
        ...state,
        termine: state.termine.map(t =>
          t.id === action.payload.terminId
            ? { ...t, kommentar: action.payload.kommentar }
            : t
        ),
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ─── Component ───────────────────────────────────────────────────────────

export function ZaehlerwechselCenter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { parse } = useTerminParser(dispatch);
  const { processAll } = useTerminActions(dispatch);
  useInstallationMatch(state.termine, dispatch);

  // Compute stats
  const stats = useMemo<Stats>(() => {
    const s: Stats = { total: 0, parsed: 0, confirmed: 0, notified: 0, errors: 0 };
    for (const t of state.termine) {
      s.total++;
      if (t.status === 'parsed') s.parsed++;
      if (t.status === 'confirmed') s.confirmed++;
      if (t.status === 'notified') s.notified++;
      if (t.status === 'error') s.errors++;
    }
    return s;
  }, [state.termine]);

  const selectedTermin = state.termine.find(t => t.id === state.selectedTerminId) ?? null;

  // Only count parsed termine that have an installation assigned as confirmable
  const confirmableCount = state.termine.filter(t => t.status === 'parsed' && t.selectedInstallationId).length;
  const parsedCount = state.termine.filter(t => t.status === 'parsed').length;
  const confirmedCount = state.termine.filter(t => t.status === 'confirmed').length;
  const isProcessing = state.step === 'processing';

  const handleParse = useCallback(() => {
    if (state.rawText.trim()) {
      parse(state.rawText);
    }
  }, [state.rawText, parse]);

  const handleProcessAll = useCallback(() => {
    processAll(state.termine);
  }, [processAll, state.termine]);

  // Processing progress
  const processingTotal = state.termine.filter(t =>
    t.status === 'confirmed' || t.status === 'notified' || t.status === 'error'
  ).length;
  const processingDone = state.termine.filter(t =>
    t.status === 'notified' || t.status === 'error'
  ).length;
  const progressPct = processingTotal > 0 ? (processingDone / processingTotal) * 100 : 0;

  return (
    <div className="zwc">
      {/* Header */}
      <div className="zwc-header">
        <div className="zwc-header-top">
          <h1 className="zwc-title">
            <div className="zwc-title-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </div>
            Zählerwechsel Center
          </h1>
          {state.step !== 'input' && (
            <button className="zwc-reset-btn" onClick={() => dispatch({ type: 'RESET' })}>
              Zurücksetzen
            </button>
          )}
        </div>

        {state.termine.length > 0 && <HeaderStats stats={stats} />}
      </div>

      {/* Layout */}
      <div className="zwc-layout">
        {/* Left Column */}
        <div className="zwc-left">
          {/* Text Input Panel */}
          <div className="zwc-panel">
            <div className="zwc-panel-title">Termine einfügen</div>
            <textarea
              className="zwc-textarea"
              value={state.rawText}
              onChange={(e) => dispatch({ type: 'SET_RAW_TEXT', payload: e.target.value })}
              placeholder={`Termine hier einfügen, z.B.:\n\nBenjamin Lenert 09.03.2026 11:30\nDaniel Bautz 10.03.2026 11:30\nLay Thomas 16.03.26 15:30`}
              disabled={isProcessing}
            />
            <div className="zwc-btn-group">
              <button
                className="zwc-btn zwc-btn--primary"
                onClick={handleParse}
                disabled={!state.rawText.trim() || isProcessing}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Parsen
              </button>
            </div>
          </div>

          {/* Parse Errors */}
          {state.parseErrors.length > 0 && (
            <div className="zwc-errors">
              <div className="zwc-errors-title">
                {state.parseErrors.length} Zeile(n) nicht erkannt
              </div>
              <ul className="zwc-errors-list">
                {state.parseErrors.map((err, i) => (
                  <li key={i} title={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bulk Actions */}
          {state.step === 'review' && (
            <div className="zwc-panel">
              <div className="zwc-panel-title">Aktionen</div>
              <div className="zwc-btn-group" style={{ flexDirection: 'column' }}>
                {confirmableCount > 0 && (
                  <button
                    className="zwc-btn zwc-btn--primary"
                    onClick={() => dispatch({ type: 'CONFIRM_ALL' })}
                  >
                    Alle bestätigen ({confirmableCount})
                  </button>
                )}
                {parsedCount > 0 && parsedCount !== confirmableCount && (
                  <div style={{ fontSize: 11, color: 'var(--zwc-text-muted)' }}>
                    {parsedCount - confirmableCount} Termin(e) ohne Zuordnung
                  </div>
                )}
                <button
                  className="zwc-btn zwc-btn--success"
                  onClick={handleProcessAll}
                  disabled={confirmedCount === 0}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                  Alle benachrichtigen ({confirmedCount})
                </button>
              </div>
            </div>
          )}

          {/* Calendar */}
          {state.termine.length > 0 && (
            <TerminCalendar termine={state.termine} />
          )}

          {/* Existing appointments overview */}
          <TermineOverview />
        </div>

        {/* Right Column */}
        <div className="zwc-right">
          {/* Processing Progress */}
          {isProcessing && (
            <div className="zwc-panel">
              <div className="zwc-panel-title">
                Verarbeitung... ({processingDone}/{processingTotal})
              </div>
              <div className="zwc-progress">
                <div className="zwc-progress-bar" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          {/* Done Summary */}
          {state.step === 'done' && (
            <div className="zwc-panel" style={{ borderColor: 'rgba(56, 217, 143, 0.3)' }}>
              <div className="zwc-panel-title" style={{ color: 'var(--zwc-green)' }}>
                Verarbeitung abgeschlossen
              </div>
              <div style={{ fontSize: 13, color: 'var(--zwc-text-muted)' }}>
                {stats.notified} von {stats.total} Terminen erfolgreich verarbeitet.
                {stats.errors > 0 && ` ${stats.errors} Fehler.`}
              </div>
            </div>
          )}

          {/* Cards or Empty State */}
          {state.termine.length > 0 ? (
            <div className="zwc-cards">
              {state.termine.map(t => (
                <TerminCard
                  key={t.id}
                  termin={t}
                  isSelected={t.id === state.selectedTerminId}
                  isProcessing={isProcessing && state.termine.filter(x => x.status === 'confirmed')[state.processingIndex]?.id === t.id}
                  dispatch={dispatch}
                />
              ))}
            </div>
          ) : (
            <div className="zwc-empty">
              <div className="zwc-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="zwc-empty-text">
                Füge links Zählerwechsel-Termine als Text ein und klicke auf &quot;Parsen&quot;
              </div>
            </div>
          )}

          {/* Email Preview */}
          {selectedTermin && selectedTermin.selectedInstallationId && (
            <EmailPreview termin={selectedTermin} />
          )}
        </div>
      </div>
    </div>
  );
}
