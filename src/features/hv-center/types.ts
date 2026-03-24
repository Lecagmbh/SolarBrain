/**
 * HANDELSVERTRETER CENTER TYPES
 */

export type ProvisionsStatus = "OFFEN" | "FREIGEGEBEN" | "AUSGEZAHLT" | "STORNIERT";
export type AuszahlungsStatus = "AUSSTEHEND" | "AUSGEZAHLT" | "FEHLGESCHLAGEN";

export interface Handelsvertreter {
  id: number;
  userId: number;
  provisionssatz: number;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  kontoinhaber: string | null;
  steuerNr: string | null;
  ustIdNr: string | null;
  firmenName: string | null;
  aktiv: boolean;
  notizen: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; email: string; name: string | null; active: boolean; lastLoginAt: string | null };
}

export interface HvWithStats extends Handelsvertreter {
  _count?: { kunden: number; provisionen: number };
  stats?: {
    OFFEN?: { count: number; betrag: number };
    FREIGEGEBEN?: { count: number; betrag: number };
    AUSGEZAHLT?: { count: number; betrag: number };
    STORNIERT?: { count: number; betrag: number };
  };
}

export interface Provision {
  id: number;
  handelsvertreterId: number;
  rechnungId: number;
  kundeId: number;
  betragNetto: number;
  provisionssatz: number;
  provisionsBetrag: number;
  status: ProvisionsStatus;
  freigegebenAm: string | null;
  freigegebenVon: number | null;
  ausgezahltAm: string | null;
  storniertAm: string | null;
  stornoGrund: string | null;
  auszahlungId: number | null;
  notizen: string | null;
  createdAt: string;
  updatedAt: string;
  rechnung?: { id: number; rechnungsNummer: string; rechnungsDatum?: string };
  kunde?: { id: number; name: string; firmenName: string | null; kundenNummer: string | null };
  handelsvertreter?: { id: number; user?: { name: string | null; email: string } };
  auszahlung?: { id: number; auszahlungsNummer: string };
}

export interface Auszahlung {
  id: number;
  handelsvertreterId: number;
  auszahlungsNummer: string;
  gesamtBetrag: number;
  anzahlProvisionen: number;
  status: AuszahlungsStatus;
  exportFormat: string | null;
  exportPath: string | null;
  ausgezahltAm: string | null;
  zahlungsreferenz: string | null;
  erstelltVon: number | null;
  notizen: string | null;
  createdAt: string;
  updatedAt: string;
  handelsvertreter?: Handelsvertreter;
  provisionen?: Provision[];
}

export interface HvKunde {
  id: number;
  name: string;
  kundenNummer: string | null;
  email: string | null;
  telefon: string | null;
  firmenName: string | null;
  ort: string | null;
  aktiv: boolean;
  isDemo: boolean;
  vermitteltAm: string | null;
  createdAt: string;
  _count?: { installations: number; rechnungen: number };
}

export interface HvDashboardData {
  provisionen: {
    OFFEN: { count: number; betrag: number };
    FREIGEGEBEN: { count: number; betrag: number };
    AUSGEZAHLT: { count: number; betrag: number };
    STORNIERT: { count: number; betrag: number };
  };
  kundenCount: number;
  recentProvisionen: Provision[];
}

export interface ProvisionStats {
  OFFEN: { count: number; betrag: number };
  FREIGEGEBEN: { count: number; betrag: number };
  AUSGEZAHLT: { count: number; betrag: number };
  STORNIERT: { count: number; betrag: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface HvFormData {
  email: string;
  name: string;
  provisionssatz: number;
  iban: string;
  bic: string;
  bankName: string;
  kontoinhaber: string;
  steuerNr: string;
  ustIdNr: string;
  firmenName: string;
  notizen: string;
}

export interface HvProfilFormData {
  iban: string;
  bic: string;
  bankName: string;
  kontoinhaber: string;
}

export interface HvBenutzerFormData {
  email: string;
  name: string;
  role?: string;
  kunde?: {
    name: string;
    firmenName?: string;
    email?: string;
    telefon?: string;
    strasse?: string;
    hausNr?: string;
    plz?: string;
    ort?: string;
  };
}

export interface HvSubUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  kundeId: number | null;
  createdAt: string;
  lastLoginAt: string | null;
  kunde?: { id: number; name: string; firmenName: string | null };
}

// ─── Ober-HV / Team Types ──────────────────────────────────────────────────

export interface UnterHv {
  id: number;
  userId: number;
  firmenName: string | null;
  weitergabeSatz: number;
  provisionssatz: number;
  aktiv: boolean;
  createdAt: string;
  user: { id: number; email: string; name: string | null; active: boolean; lastLoginAt: string | null };
  kundenCount: number;
  provisionenGesamt: number;
  provisionenMonat: number;
  anmeldungenMonat: number;
  oberHvProvisionssatz: number;
}

export interface TeamStats {
  unterHvsCount: number;
  teamKundenGesamt: number;
  teamAnmeldungenMonat: number;
  avgWeitergabeSatz: number;
  teamProvisionenGesamt: number;
  teamProvisionenMonat: number;
}

export interface TeamProvision {
  id: number;
  datum: string;
  kunde: string;
  rechnungNetto: number;
  unterHv: { id: number; name: string } | null;
  unterHvSatz: number;
  unterHvAnteil: number;
  oberHvEigenSatz: number;
  oberHvAnteil: number;
  status: ProvisionsStatus;
}

export interface InviteUnterHvData {
  name: string;
  email: string;
  firma?: string;
  telefon?: string;
  weitergabeSatz: number;
}
