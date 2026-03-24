/**
 * Berechtigungs-Toggles Dialog für KUNDE_MITARBEITER
 * Presets: Vollzugriff, Sachbearbeiter, Nur Lesen, Benutzerdefiniert
 */

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { UserData, KundeMitarbeiterPermissions, PermissionPreset } from '../types';
import { PERMISSION_LABELS, PERMISSION_GROUPS, PERMISSION_PRESETS, PRESET_LABELS, DEFAULT_PERMISSIONS, detectPreset } from '../constants';
import { useUpdateUser } from '../hooks/useUserMutations';

interface Props {
  open: boolean;
  user: UserData | null;
  onClose: () => void;
}

export function PermissionsDialog({ open, user, onClose }: Props) {
  const updateUser = useUpdateUser();
  const [perms, setPerms] = useState<KundeMitarbeiterPermissions>(DEFAULT_PERMISSIONS);
  const [preset, setPreset] = useState<PermissionPreset>('sachbearbeiter');

  useEffect(() => {
    if (user?.permissions) {
      setPerms(user.permissions as KundeMitarbeiterPermissions);
      setPreset(detectPreset(user.permissions as KundeMitarbeiterPermissions));
    } else {
      setPerms(DEFAULT_PERMISSIONS);
      setPreset('sachbearbeiter');
    }
  }, [user]);

  if (!open || !user) return null;

  const handlePresetChange = (p: PermissionPreset) => {
    setPreset(p);
    if (p !== 'benutzerdefiniert') {
      setPerms(PERMISSION_PRESETS[p]);
    }
  };

  const handleToggle = (key: keyof KundeMitarbeiterPermissions) => {
    const updated = { ...perms, [key]: !perms[key] };
    setPerms(updated);
    setPreset(detectPreset(updated));
  };

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({ id: user.id, permissions: perms });
      onClose();
    } catch (e: any) {
      console.error('Permissions save failed:', e);
    }
  };

  // Group permissions by category
  const groups = PERMISSION_GROUPS.map((group) => ({
    name: group,
    items: Object.entries(PERMISSION_LABELS).filter(([, v]) => v.group === group),
  }));

  return (
    <div className="up-dialog-overlay" onClick={onClose}>
      <div className="up-dialog up-dialog--wide" onClick={(e) => e.stopPropagation()}>
        <div className="up-dialog__header">
          <h3>Berechtigungen: {user.name || user.email}</h3>
          <button className="up-action-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="up-dialog__body">
          {/* Preset-Auswahl */}
          <label className="up-dialog__label">Preset</label>
          <div className="up-dialog__preset-grid">
            {(Object.keys(PRESET_LABELS) as PermissionPreset[]).map((p) => (
              <button
                key={p}
                className={`up-dialog__preset-btn ${preset === p ? 'up-dialog__preset-btn--active' : ''}`}
                onClick={() => handlePresetChange(p)}
              >
                <strong>{PRESET_LABELS[p].label}</strong>
                <span>{PRESET_LABELS[p].description}</span>
              </button>
            ))}
          </div>

          {/* Toggle-Grid */}
          <div className="up-perm-grid">
            {groups.map((group) => (
              <div key={group.name} className="up-perm-group">
                <h4 className="up-perm-group__title">{group.name}</h4>
                {group.items.map(([key, { label }]) => (
                  <label key={key} className="up-perm-toggle">
                    <span>{label}</span>
                    <button
                      className={`up-toggle ${perms[key as keyof KundeMitarbeiterPermissions] ? 'up-toggle--on' : ''}`}
                      onClick={() => handleToggle(key as keyof KundeMitarbeiterPermissions)}
                      type="button"
                    >
                      <span className="up-toggle__dot" />
                    </button>
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="up-dialog__footer">
            <button className="up-btn up-btn--ghost" onClick={onClose}>Abbrechen</button>
            <button className="up-btn up-btn--primary" onClick={handleSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
