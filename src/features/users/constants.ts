/**
 * Rollen-Badges, Farben, Permission-Presets
 */

import type { UserRole, KundeMitarbeiterPermissions, PermissionPreset } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// ROLLEN-KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; color: string }> = {
  ADMIN:              { label: 'Admin',         bg: 'rgba(239,68,68,.12)',   color: '#ef4444' },
  MANAGER:            { label: 'Manager',       bg: 'rgba(168,85,247,.12)',  color: '#a855f7' },
  MITARBEITER:        { label: 'Mitarbeiter',   bg: 'rgba(6,182,212,.12)',   color: '#06b6d4' },
  KUNDE_MITARBEITER:  { label: 'K-Mitarbeiter', bg: 'rgba(6,182,212,.12)',   color: '#06b6d4' },
  HV_LEITER:          { label: 'HV-Leiter',     bg: 'rgba(212,168,67,.12)',  color: '#D4A843' },
  HV_TEAMLEITER:      { label: 'Teamleiter',    bg: 'rgba(249,115,22,.12)',  color: '#f97316' },
  HANDELSVERTRETER:   { label: 'HV',            bg: 'rgba(249,115,22,.12)',  color: '#f97316' },
  KUNDE:              { label: 'Kunde',          bg: 'rgba(34,197,94,.12)',   color: '#22c55e' },
  SUBUNTERNEHMER:     { label: 'Sub',            bg: 'rgba(234,179,8,.12)',   color: '#eab308' },
  ENDKUNDE_PORTAL:    { label: 'Endkunde',       bg: 'rgba(59,130,246,.12)',  color: '#3b82f6' },
  DEMO:               { label: 'Demo',            bg: 'rgba(136,136,136,.12)', color: '#888888' },
};

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION PRESETS
// ═══════════════════════════════════════════════════════════════════════════

export const PERMISSION_PRESETS: Record<Exclude<PermissionPreset, 'benutzerdefiniert'>, KundeMitarbeiterPermissions> = {
  vollzugriff: {
    seeAllInstallations: true, canCreateInstallation: true, canChangeStatus: true,
    canUploadDocuments: true, canDeleteDocuments: true, canGenerateVDE: true,
    canGenerateSchaltplan: true, canSendNetzanfrage: true, canSendEmails: true,
    canReadEmails: true, canWriteComments: true, canSeeRechnungen: true,
    canUseAI: true, canEditKundenSettings: true,
  },
  sachbearbeiter: {
    seeAllInstallations: true, canCreateInstallation: true, canChangeStatus: true,
    canUploadDocuments: true, canDeleteDocuments: false, canGenerateVDE: false,
    canGenerateSchaltplan: false, canSendNetzanfrage: false, canSendEmails: false,
    canReadEmails: false, canWriteComments: true, canSeeRechnungen: false,
    canUseAI: true, canEditKundenSettings: false,
  },
  nur_lesen: {
    seeAllInstallations: true, canCreateInstallation: false, canChangeStatus: false,
    canUploadDocuments: false, canDeleteDocuments: false, canGenerateVDE: false,
    canGenerateSchaltplan: false, canSendNetzanfrage: false, canSendEmails: false,
    canReadEmails: true, canWriteComments: false, canSeeRechnungen: false,
    canUseAI: false, canEditKundenSettings: false,
  },
};

export const DEFAULT_PERMISSIONS: KundeMitarbeiterPermissions = PERMISSION_PRESETS.sachbearbeiter;

export function detectPreset(perms: KundeMitarbeiterPermissions): PermissionPreset {
  for (const [name, preset] of Object.entries(PERMISSION_PRESETS)) {
    const match = Object.keys(preset).every(
      (k) => perms[k as keyof KundeMitarbeiterPermissions] === preset[k as keyof KundeMitarbeiterPermissions]
    );
    if (match) return name as PermissionPreset;
  }
  return 'benutzerdefiniert';
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION LABELS (für UI-Toggles)
// ═══════════════════════════════════════════════════════════════════════════

export const PERMISSION_LABELS: Record<keyof KundeMitarbeiterPermissions, { label: string; group: string }> = {
  seeAllInstallations:   { label: 'Alle Installationen sehen',     group: 'Installationen' },
  canCreateInstallation: { label: 'Neue Installationen erstellen', group: 'Installationen' },
  canChangeStatus:       { label: 'Status ändern',                 group: 'Installationen' },
  canUploadDocuments:    { label: 'Hochladen',                     group: 'Dokumente' },
  canDeleteDocuments:    { label: 'Löschen',                       group: 'Dokumente' },
  canGenerateVDE:        { label: 'VDE-Formulare generieren',      group: 'Generatoren' },
  canGenerateSchaltplan: { label: 'Schaltplan generieren',         group: 'Generatoren' },
  canSendNetzanfrage:    { label: 'Netzanfrage senden',            group: 'Generatoren' },
  canSendEmails:         { label: 'Emails an NB senden',           group: 'Kommunikation' },
  canReadEmails:         { label: 'Emails lesen',                  group: 'Kommunikation' },
  canWriteComments:      { label: 'Kommentare schreiben',          group: 'Kommunikation' },
  canSeeRechnungen:      { label: 'Rechnungen sehen',              group: 'Finanzen' },
  canUseAI:              { label: 'AI-Features nutzen',             group: 'Sonstiges' },
  canEditKundenSettings: { label: 'Kunden-Einstellungen ändern',   group: 'Sonstiges' },
};

export const PERMISSION_GROUPS = ['Installationen', 'Dokumente', 'Generatoren', 'Kommunikation', 'Finanzen', 'Sonstiges'] as const;

// ═══════════════════════════════════════════════════════════════════════════
// PRESET LABELS
// ═══════════════════════════════════════════════════════════════════════════

export const PRESET_LABELS: Record<PermissionPreset, { label: string; description: string }> = {
  vollzugriff:      { label: 'Vollzugriff',      description: 'Kann alles was der Kunde kann' },
  sachbearbeiter:   { label: 'Sachbearbeiter',    description: 'Erstellen + Status + Dokumente, kein VDE/Email/Rechnung' },
  nur_lesen:        { label: 'Nur Lesen',         description: 'Kann Installationen und Dokumente sehen, nichts bearbeiten' },
  benutzerdefiniert: { label: 'Benutzerdefiniert', description: 'Alle Toggles einzeln konfiguriert' },
};
