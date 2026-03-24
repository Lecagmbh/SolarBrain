import type { ParsedTermin, ZwcAction } from '../types';
import { getWeekdayShort, getMonthShort, getDayNumber, formatDateDE } from '../utils/dateHelpers';
import { StatusPill } from './StatusPill';
import { StepTrack } from './StepTrack';
import { InstallationMatchDropdown } from './InstallationMatchDropdown';

interface Props {
  termin: ParsedTermin;
  isSelected: boolean;
  isProcessing: boolean;
  dispatch: React.Dispatch<ZwcAction>;
}

export function TerminCard({ termin, isSelected, isProcessing, dispatch }: Props) {
  const canConfirm = termin.status === 'parsed' && !!termin.selectedInstallationId;
  const canUnconfirm = termin.status === 'confirmed';

  return (
    <div
      className={`zwc-card ${isSelected ? 'zwc-card--selected' : ''} ${termin.status === 'confirmed' ? 'zwc-card--confirmed' : ''} ${termin.status === 'notified' ? 'zwc-card--notified' : ''} ${termin.status === 'error' ? 'zwc-card--error' : ''} ${isProcessing ? 'zwc-card--processing' : ''}`}
      onClick={() => dispatch({ type: 'SELECT_TERMIN', payload: isSelected ? null : termin.id })}
    >
      {/* Date Badge */}
      <div className="zwc-date-badge">
        <div className="zwc-date-weekday">{getWeekdayShort(termin.datum)}</div>
        <div className="zwc-date-day">{getDayNumber(termin.datum)}</div>
        <div className="zwc-date-month">{getMonthShort(termin.datum)}</div>
        <div className="zwc-date-time">{termin.uhrzeit}</div>
      </div>

      {/* Body */}
      <div className="zwc-card-body">
        <div className="zwc-card-name">
          <span>{termin.customerName}</span>
          <StatusPill status={termin.status} />
        </div>

        {/* Parsed info */}
        <div className="zwc-card-meta">
          {formatDateDE(termin.datum)} um {termin.uhrzeit} Uhr
          {termin.selectedInstallationId && (
            <> · Installation <strong style={{ color: 'var(--zwc-text)' }}>#{termin.selectedInstallationId}</strong></>
          )}
        </div>

        {/* Installation Matching Dropdown — only in parsed status */}
        {termin.status === 'parsed' && (
          <div style={{ marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
            <InstallationMatchDropdown
              candidates={termin.matchCandidates}
              selectedId={termin.selectedInstallationId}
              selectedName={termin.selectedCustomerName}
              onSelect={(installationId, customerName) =>
                dispatch({
                  type: 'SELECT_MATCH',
                  payload: { terminId: termin.id, installationId, customerName },
                })
              }
            />
          </div>
        )}

        {/* Error message */}
        {termin.status === 'error' && termin.error && (
          <div className="zwc-card-meta" style={{ color: 'var(--zwc-red)' }}>
            {termin.error}
          </div>
        )}

        {/* Notification result */}
        {termin.status === 'notified' && termin.notificationResult && (
          <div className="zwc-card-meta" style={{ color: 'var(--zwc-green)' }}>
            Benachrichtigt via: {[
              termin.notificationResult.email && 'Email',
              termin.notificationResult.whatsapp && 'WhatsApp',
            ].filter(Boolean).join(' + ') || 'keine'}
          </div>
        )}

        {/* Actions + StepTrack */}
        <div className="zwc-card-actions">
          <StepTrack status={termin.status} />

          {canConfirm && (
            <button
              className="zwc-btn zwc-btn--primary zwc-btn--sm"
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'CONFIRM_TERMIN', payload: termin.id }); }}
            >
              Bestätigen
            </button>
          )}

          {canUnconfirm && (
            <button
              className="zwc-btn zwc-btn--ghost zwc-btn--sm"
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UNCONFIRM_TERMIN', payload: termin.id }); }}
            >
              Zurück
            </button>
          )}
        </div>
      </div>

      {/* Remove button */}
      {termin.status !== 'notified' && !isProcessing && (
        <button
          className="zwc-card-remove"
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_TERMIN', payload: termin.id }); }}
          title="Termin entfernen"
        >
          ×
        </button>
      )}
    </div>
  );
}
