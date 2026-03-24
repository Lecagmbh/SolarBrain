/**
 * BAUNITY PERMISSIONS HOOK (ZENTRAL)
 * ====================================
 * Nutzt dieselbe Permission-Matrix wie das Backend (core/auth/permissions.ts).
 * EINE Source of Truth für Frontend + Backend.
 *
 * Für KUNDE_MITARBEITER: Liest die konfigurierbaren Permissions aus user.permissions (JSON).
 */

import { useMemo } from 'react';
import { useAuth } from '../pages/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (identisch mit Backend core/auth/types.ts)
// ═══════════════════════════════════════════════════════════════════════════

type PermissionValue = boolean | 'config';

interface KundeMitarbeiterPermissions {
  seeAllInstallations: boolean;
  canCreateInstallation: boolean;
  canChangeStatus: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canGenerateVDE: boolean;
  canGenerateSchaltplan: boolean;
  canSendNetzanfrage: boolean;
  canSendEmails: boolean;
  canReadEmails: boolean;
  canWriteComments: boolean;
  canSeeRechnungen: boolean;
  canUseAI: boolean;
  canEditKundenSettings: boolean;
}

type PermissionKey =
  | 'installation.create' | 'installation.read.own' | 'installation.read.all'
  | 'installation.edit' | 'installation.delete' | 'installation.bulk_delete'
  | 'status.change' | 'status.stornieren' | 'status.abgerechnet'
  | 'document.upload' | 'document.download' | 'document.delete'
  | 'vde.generate' | 'schaltplan.generate' | 'lageplan.generate'
  | 'vollmacht.generate' | 'netzanfrage.send'
  | 'email.send.nb' | 'email.read' | 'comment.write'
  | 'comment.delete.own' | 'comment.delete.all' | 'whatsapp.send'
  | 'rechnung.read' | 'rechnung.create' | 'rechnung.stornieren'
  | 'provision.read' | 'provision.payout'
  | 'hv.leads.manage' | 'hv.subs.create' | 'hv.provision.set'
  | 'user.manage' | 'user.create.mitarbeiter'
  | 'settings.system' | 'settings.kunde' | 'backup.create'
  | 'ai.features' | 'calendar.manage' | 'zaehlerwechsel.manage'
  | 'export.csv' | 'export.sepa';

// ═══════════════════════════════════════════════════════════════════════════
// ZENTRALE PERMISSION-MATRIX (GLEICH wie Backend!)
// ═══════════════════════════════════════════════════════════════════════════

const A = 'ADMIN';
const K = 'KUNDE';
const KM = 'KUNDE_MITARBEITER';
const S = 'SUBUNTERNEHMER';
const W = 'WHITELABEL';
const H = 'HANDELSVERTRETER';
const E = 'ENDKUNDE_PORTAL';
// MITARBEITER wird wie ADMIN behandelt (Legacy-Übergang)
const M = 'MITARBEITER';

type RoleKey = typeof A | typeof K | typeof KM | typeof S | typeof W | typeof H | typeof E | typeof M;

const MATRIX: Record<PermissionKey, Record<RoleKey, PermissionValue>> = {
  'installation.create':      { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: true,  [W]: true,  [H]: false, [E]: false },
  'installation.read.own':    { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: true,  [W]: true,  [H]: true,  [E]: true  },
  'installation.read.all':    { [A]: true,  [M]: true,  [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'installation.edit':        { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: true,  [W]: true,  [H]: false, [E]: false },
  'installation.delete':      { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'installation.bulk_delete': { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'status.change':            { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: true,  [W]: true,  [H]: false, [E]: false },
  'status.stornieren':        { [A]: true,  [M]: true,  [K]: true,  [KM]: false,    [S]: false, [W]: true,  [H]: false, [E]: false },
  'status.abgerechnet':       { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'document.upload':          { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: true,  [W]: true,  [H]: false, [E]: true  },
  'document.download':        { [A]: true,  [M]: true,  [K]: true,  [KM]: true,     [S]: true,  [W]: true,  [H]: true,  [E]: true  },
  'document.delete':          { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'vde.generate':             { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'schaltplan.generate':      { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'lageplan.generate':        { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'vollmacht.generate':       { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'netzanfrage.send':         { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'email.send.nb':            { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'email.read':               { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'comment.write':            { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: true,  [W]: true,  [H]: false, [E]: true  },
  'comment.delete.own':       { [A]: true,  [M]: true,  [K]: true,  [KM]: true,     [S]: true,  [W]: true,  [H]: false, [E]: false },
  'comment.delete.all':       { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'whatsapp.send':            { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'rechnung.read':            { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'rechnung.create':          { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'rechnung.stornieren':      { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'provision.read':           { [A]: true,  [M]: true,  [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: true,  [E]: false },
  'provision.payout':         { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'hv.leads.manage':          { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: true,  [E]: false },
  'hv.subs.create':           { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: true,  [E]: false },
  'hv.provision.set':         { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: true,  [E]: false },
  'user.manage':              { [A]: true,  [M]: true,  [K]: true,  [KM]: false,    [S]: false, [W]: true,  [H]: false, [E]: false },
  'user.create.mitarbeiter':  { [A]: true,  [M]: true,  [K]: true,  [KM]: false,    [S]: false, [W]: true,  [H]: false, [E]: false },
  'settings.system':          { [A]: true,  [M]: true,  [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'settings.kunde':           { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'backup.create':            { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
  'ai.features':              { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: true,  [W]: true,  [H]: false, [E]: false },
  'calendar.manage':          { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: true,  [E]: false },
  'zaehlerwechsel.manage':    { [A]: true,  [M]: true,  [K]: true,  [KM]: 'config', [S]: false, [W]: true,  [H]: false, [E]: false },
  'export.csv':               { [A]: true,  [M]: true,  [K]: true,  [KM]: false,    [S]: false, [W]: true,  [H]: false, [E]: false },
  'export.sepa':              { [A]: true,  [M]: false, [K]: false, [KM]: false,    [S]: false, [W]: false, [H]: false, [E]: false },
};

// Config-Key Mapping (für KUNDE_MITARBEITER)
const CONFIG_MAP: Partial<Record<PermissionKey, keyof KundeMitarbeiterPermissions>> = {
  'installation.create': 'canCreateInstallation',
  'installation.read.own': 'seeAllInstallations',
  'installation.edit': 'canCreateInstallation',
  'status.change': 'canChangeStatus',
  'document.upload': 'canUploadDocuments',
  'document.delete': 'canDeleteDocuments',
  'vde.generate': 'canGenerateVDE',
  'schaltplan.generate': 'canGenerateSchaltplan',
  'lageplan.generate': 'canGenerateSchaltplan',
  'vollmacht.generate': 'canGenerateVDE',
  'netzanfrage.send': 'canSendNetzanfrage',
  'email.send.nb': 'canSendEmails',
  'email.read': 'canReadEmails',
  'comment.write': 'canWriteComments',
  'whatsapp.send': 'canSendEmails',
  'rechnung.read': 'canSeeRechnungen',
  'ai.features': 'canUseAI',
  'settings.kunde': 'canEditKundenSettings',
  'calendar.manage': 'canCreateInstallation',
  'zaehlerwechsel.manage': 'canChangeStatus',
};

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION CHECK (identisch mit Backend hasPermission())
// ═══════════════════════════════════════════════════════════════════════════

function hasPermission(
  role: string,
  permission: PermissionKey,
  mitarbeiterConfig?: KundeMitarbeiterPermissions | null,
): boolean {
  const row = MATRIX[permission];
  if (!row) return false;

  const value = row[role as RoleKey];
  if (value === undefined) return false;
  if (typeof value === 'boolean') return value;

  // 'config' → aus KundeMitarbeiterPermissions
  if (value === 'config') {
    if (!mitarbeiterConfig) return false;
    const configKey = CONFIG_MAP[permission];
    if (!configKey) return false;
    return Boolean(mitarbeiterConfig[configKey]);
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKWARD-COMPATIBLE INTERFACE (für alle bestehenden Consumer)
// ═══════════════════════════════════════════════════════════════════════════

export interface Permissions {
  // Ansehen
  canViewInstallation: boolean;
  // Status ändern
  canChangeStatus: boolean;
  canMarkAsAbgerechnet: boolean;
  canStornieren: boolean;
  // NB Daten
  canEditNbVorgangsnummer: boolean;
  // Dokumente
  canUploadDocuments: boolean;
  canViewDocuments: boolean;
  canDeleteDocuments: boolean;
  // Kommentare
  canWriteComments: boolean;
  canReadComments: boolean;
  canDeleteOwnComments: boolean;
  canDeleteAllComments: boolean;
  // Verwaltung
  canAssign: boolean;
  canDelete: boolean;
  canCreate: boolean;
  // Rollen-Flags
  isAdmin: boolean;
  isMitarbeiter: boolean;
  isSubunternehmer: boolean;
  isKunde: boolean;
  isDemo: boolean;
  // User Info
  userId: number | undefined;
  userRole: string;

  // NEU: Zentrale Permission-Checks
  has: (permission: PermissionKey) => boolean;
}

/**
 * Hook für Berechtigungs-Checks im Frontend.
 * Nutzt jetzt die ZENTRALE Permission-Matrix (gleich wie Backend).
 */
export function usePermissions(): Permissions {
  const { user } = useAuth();

  return useMemo(() => {
    const role = (user?.role || 'KUNDE').toUpperCase();
    const config = (user as any)?.permissions as KundeMitarbeiterPermissions | null;

    const has = (perm: PermissionKey) => hasPermission(role, perm, config);

    const isAdmin = role === 'ADMIN';
    const isMitarbeiter = role === 'MITARBEITER';
    const isSubunternehmer = role === 'SUBUNTERNEHMER';
    const isKunde = role === 'KUNDE';
    const isDemo = role === 'DEMO';

    return {
      // Backward-compatible Felder (abgeleitet aus zentraler Matrix)
      canViewInstallation: has('installation.read.own'),
      canChangeStatus: has('status.change'),
      canMarkAsAbgerechnet: has('status.abgerechnet'),
      canStornieren: has('status.stornieren'),
      canEditNbVorgangsnummer: has('installation.edit'),
      canUploadDocuments: has('document.upload'),
      canViewDocuments: has('document.download'),
      canDeleteDocuments: has('document.delete'),
      canWriteComments: has('comment.write'),
      canReadComments: true, // Alle können Kommentare lesen
      canDeleteOwnComments: has('comment.delete.own'),
      canDeleteAllComments: has('comment.delete.all'),
      canAssign: has('user.manage'),
      canDelete: has('installation.delete'),
      canCreate: has('installation.create'),

      // Rollen-Flags
      isAdmin,
      isMitarbeiter,
      isSubunternehmer,
      isKunde,
      isDemo,

      // User Info
      userId: user?.id,
      userRole: role,

      // Zentrale Check-Funktion
      has,
    };
  }, [user]);
}

/**
 * Prüft ob ein Status-Übergang erlaubt ist
 */
export function canTransitionToStatus(
  permissions: Permissions,
  newStatus: string,
): { allowed: boolean; reason?: string } {
  const statusUpper = newStatus.toUpperCase().replace(/-/g, '_');

  if (!permissions.canChangeStatus) {
    return { allowed: false, reason: 'Keine Berechtigung zum Ändern des Status' };
  }

  if (statusUpper === 'ABGERECHNET' && !permissions.canMarkAsAbgerechnet) {
    return { allowed: false, reason: 'Nur Admins können Anlagen als abgerechnet markieren' };
  }

  if (statusUpper === 'STORNIERT' && !permissions.canStornieren) {
    return { allowed: false, reason: 'Keine Berechtigung zum Stornieren' };
  }

  return { allowed: true };
}

export default usePermissions;
