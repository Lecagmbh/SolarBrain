/**
 * Einstellungen-Tab: WhiteLabel, Sperrung, Passwort, Portal
 */

import { Lock, Unlock, KeyRound, Globe, Trash2 } from 'lucide-react';
import type { UserData } from '../../types';

interface Props {
  user: UserData;
  onAction: (action: string, user: UserData) => void;
}

export function SettingsTab({ user, onAction }: Props) {
  return (
    <div className="ud-settings">
      {/* Account-Status */}
      <div className="ud-section">
        <h3 className="ud-section__title">Account-Status</h3>
        <div className="ud-section__body">
          <div className="ud-setting-row">
            <span>Status</span>
            <span style={{ color: user.gesperrt ? '#ef4444' : user.active ? '#22c55e' : '#6b7280' }}>
              {user.gesperrt ? `🔒 Gesperrt: ${user.gesperrtGrund || 'Kein Grund'}` : user.active ? '✓ Aktiv' : '✗ Inaktiv'}
            </span>
          </div>
          <div className="ud-setting-row">
            <span>Passwort ändern</span>
            <span>{user.mustChangePassword ? '⚠️ Muss geändert werden' : '✓ OK'}</span>
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className="ud-section">
        <h3 className="ud-section__title">Aktionen</h3>
        <div className="ud-settings-actions">
          <button className="ud-settings-btn" onClick={() => onAction('reset-password', user)}>
            <KeyRound size={14} /> Passwort zurücksetzen
          </button>
          {user.gesperrt ? (
            <button className="ud-settings-btn" onClick={() => onAction('unblock', user)}>
              <Unlock size={14} /> Entsperren
            </button>
          ) : (
            <button className="ud-settings-btn ud-settings-btn--warn" onClick={() => onAction('block', user)}>
              <Lock size={14} /> Sperren
            </button>
          )}
          {user.role === 'ENDKUNDE_PORTAL' && (
            <button className="ud-settings-btn" onClick={() => onAction('portal-toggle', user)}>
              <Globe size={14} /> Portal-Zugang verwalten
            </button>
          )}
          <button className="ud-settings-btn ud-settings-btn--danger" onClick={() => onAction('delete', user)}>
            <Trash2 size={14} /> Account löschen
          </button>
        </div>
      </div>

      {/* WhiteLabel (nur für Kunden) */}
      {user.kunde?.whiteLabelConfig && (
        <div className="ud-section">
          <h3 className="ud-section__title">WhiteLabel</h3>
          <div className="ud-section__body">
            <div className="ud-setting-row">
              <span>Aktiviert</span>
              <span>{(user.kunde.whiteLabelConfig as any)?.enabled ? '✓ Ja' : '✗ Nein'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
