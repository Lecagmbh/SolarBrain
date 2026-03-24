/**
 * Dropdown-Menü pro User (⋮)
 * Aktionen abhängig von Rolle
 */

import { useEffect, useRef } from 'react';
import {
  Edit3, KeyRound, Lock, Unlock, Trash2, LogIn,
  Users, Settings, Shield, BarChart3, Eye, UserX,
} from 'lucide-react';
import type { UserData } from '../types';

interface Props {
  user: UserData;
  isAdmin: boolean;
  onAction: (action: string) => void;
  onClose: () => void;
}

export function UserActionMenu({ user, isAdmin, onAction, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items: { id: string; label: string; icon: typeof Edit3; danger?: boolean }[] = [];

  // Gemeinsam
  items.push({ id: 'edit', label: 'Profil bearbeiten', icon: Edit3 });
  items.push({ id: 'reset-password', label: 'Passwort zurücksetzen', icon: KeyRound });

  // Rollenspezifisch
  switch (user.role) {
    case 'ADMIN':
      break;
    case 'KUNDE':
    case 'MITARBEITER':
      items.push({ id: 'manage-staff', label: 'Mitarbeiter verwalten', icon: Users });
      if (user.gesperrt) {
        items.push({ id: 'unblock', label: 'Entsperren', icon: Unlock });
      } else {
        items.push({ id: 'block', label: 'Sperren', icon: Lock });
      }
      break;
    case 'KUNDE_MITARBEITER':
      items.push({ id: 'permissions', label: 'Berechtigungen konfigurieren', icon: Shield });
      items.push({ id: user.active ? 'deactivate' : 'activate', label: user.active ? 'Deaktivieren' : 'Aktivieren', icon: UserX });
      break;
    case 'SUBUNTERNEHMER':
      items.push({ id: 'manage-installations', label: 'Zugewiesene Installationen', icon: Settings });
      if (user.gesperrt) {
        items.push({ id: 'unblock', label: 'Entsperren', icon: Unlock });
      } else {
        items.push({ id: 'block', label: 'Sperren', icon: Lock });
      }
      break;
    case 'HANDELSVERTRETER':
      if (user.handelsvertreter?.isOberHv) {
        items.push({ id: 'remove-ober-hv', label: 'Ober-HV Status entfernen', icon: UserX });
      } else {
        items.push({ id: 'set-ober-hv', label: 'Als Ober-HV markieren', icon: Shield });
      }
      items.push({ id: 'manage-sub-hvs', label: 'Sub-HVs verwalten', icon: Users });
      items.push({ id: 'provisions', label: 'Provisionsübersicht', icon: BarChart3 });
      if (user.gesperrt) {
        items.push({ id: 'unblock', label: 'Entsperren', icon: Unlock });
      } else {
        items.push({ id: 'block', label: 'Sperren', icon: Lock });
      }
      break;
    case 'ENDKUNDE_PORTAL':
      items.push({ id: 'consent', label: 'Consent-Status ansehen', icon: Eye });
      items.push({ id: 'portal-toggle', label: 'Portal-Zugang an/aus', icon: Settings });
      break;
    case 'DEMO':
      items.push({ id: 'convert', label: 'In echten Kunden umwandeln', icon: Users });
      break;
  }

  // Impersonate für ALLE Rollen (außer sich selbst und andere Admins)
  if (isAdmin && user.role !== 'ADMIN') {
    items.push({ id: 'impersonate', label: 'Als User einloggen', icon: LogIn });
  }

  // Löschen am Ende
  if (isAdmin) {
    items.push({ id: 'delete', label: 'Löschen', icon: Trash2, danger: true });
  }

  return (
    <div className="up-action-menu" ref={ref}>
      {items.map((item, i) => {
        if (i > 0 && item.danger) {
          return (
            <div key={`sep-${item.id}`}>
              <div className="up-action-menu__sep" />
              <button
                className="up-action-menu__item up-action-menu__item--danger"
                onClick={() => onAction(item.id)}
              >
                <item.icon size={14} /> {item.label}
              </button>
            </div>
          );
        }
        return (
          <button
            key={item.id}
            className={`up-action-menu__item ${item.danger ? 'up-action-menu__item--danger' : ''}`}
            onClick={() => onAction(item.id)}
          >
            <item.icon size={14} /> {item.label}
          </button>
        );
      })}
    </div>
  );
}
