/**
 * Types für das Kunden & Benutzer Feature
 */

export interface UserData {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  active: boolean;
  kundeId: number | null;
  parentUserId: number | null;
  permissions: KundeMitarbeiterPermissions | null;
  kunde: KundeData | null;
  handelsvertreter: HvData | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  gesperrt: boolean;
  gesperrtGrund: string | null;
  // Populated by backend with ?include=installations
  _count?: { installations?: number; assignedInstallations?: number };
  subUsers?: UserData[];
  // Endkunden-specific
  portalInstallations?: PortalInstallation[];
  endkundenConsent?: EndkundenConsent | null;
}

export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'MITARBEITER'
  | 'KUNDE_MITARBEITER'
  | 'HV_LEITER'
  | 'HV_TEAMLEITER'
  | 'HANDELSVERTRETER'
  | 'KUNDE'
  | 'SUBUNTERNEHMER'
  | 'DEMO'
  | 'ENDKUNDE_PORTAL';

export interface KundeData {
  id: number;
  name: string;
  firmenName: string | null;
  email: string | null;
  telefon: string | null;
  ansprechpartner: string | null;
  strasse: string | null;
  hausNr: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
  ustIdNr: string | null;
  steuernummer: string | null;
  whiteLabelConfig: Record<string, unknown> | null;
  handelsvertreterId: number | null;
}

export interface HvData {
  id: number;
  provisionssatz: number;
  firmenName: string | null;
  aktiv: boolean;
  isOberHv?: boolean;
  oberHvId?: number | null;
  weitergabeSatz?: number | null;
  hvLevel?: number; // 1=Leiter, 2=Teamleiter, 3=HV
  overrideSatz?: number | null;
  managerId?: number | null;
  kunden?: { id: number; name: string; firmenName: string | null }[];
  unterHvs?: { id: number; userId: number; firmenName: string | null; provisionssatz: number; user: { name: string | null; email: string } }[];
}

export interface PortalInstallation {
  installationId: number;
  isPrimary: boolean;
  installation?: {
    id: number;
    publicId: string;
    customerName: string | null;
    status: string;
    totalKwp: number;
  };
}

export interface EndkundenConsent {
  emailConsent: boolean;
  emailConsentAt: string | null;
  whatsappConsent: boolean;
  whatsappConsentAt: string | null;
  whatsappNumber: string | null;
  firstLoginAt: string | null;
  portalActivatedAt: string | null;
  lastPortalVisit: string | null;
}

export interface KundeMitarbeiterPermissions {
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

export type PermissionPreset = 'vollzugriff' | 'sachbearbeiter' | 'nur_lesen' | 'benutzerdefiniert';

export type ViewMode = 'alle' | 'hierarchie' | 'hv' | 'endkunden';
export type SortField = 'name' | 'email' | 'role' | 'lastLoginAt' | 'createdAt';
export type SortDir = 'asc' | 'desc';
