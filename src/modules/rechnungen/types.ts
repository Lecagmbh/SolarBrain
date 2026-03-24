export type ServiceKey = "NETZANMELDUNG" | "LAGEPLAN" | "SCHALTPLAN";

export type Catalog = Record<ServiceKey, { title: string; description: string }>;

export type PriceRow = { serviceKey: ServiceKey; priceNet: number; vatRate: number };
export type PricesResp = { catalog: Catalog; data: PriceRow[] };

export type KundeListRow = {
  id: number;
  name: string;
  firmenName?: string | null;
  kundenNummer?: string | null;
  adresse?: string | null;
};

export type KundeDetail = {
  id: number;
  name: string;
  firmenName?: string | null;
  ustIdNr?: string | null;
  email?: string | null;
  telefon?: string | null;
  strasse?: string | null;
  hausNr?: string | null;
  plz?: string | null;
  ort?: string | null;
  land?: string | null;
};

export type AnlageRow = { id: number; bezeichnung?: string | null; adresse?: string | null };

export type CompanySettings = {
  companyName: string;
  legalLine?: string | null;
  street?: string | null;
  houseNr?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  vatId?: string | null;
  taxNumber?: string | null;
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;
  paymentTermDays?: number;
  defaultFooter?: string | null;
};

export type LineItem = {
  title: string;
  description?: string;
  qty: number;
  unitNet: number;
  vatRate: number;
};

export type RechnungListRow = {
  id: number;
  rechnungsnummer: string;
  kunde_id: number;
  kunde_name: string;
  kunde_email: string | null;
  kunde_telefon: string | null;
  anlage_id: number | null;
  anlage_bezeichnung: string | null;
  installation_name: string | null;
  installation_publicId: string | null;
  installation_status: string | null;
  subcontractor_name: string | null;
  betrag_netto: number;
  mwst_satz: number;
  betrag_mwst: number;
  betrag_brutto: number;
  status: string;
  status_label: string;
  rechnungs_datum: string;
  leistungs_datum: string | null;
  faellig_am: string;
  bezahlt_am?: string | null;
  pdf_path?: string | null;
  // Mahnung Info
  mahnung_stufe?: number | null;
  mahnung_datum?: string | null;
  // Provision Info (nur für Admin/Staff)
  provision?: {
    id: number;
    betrag: number;
    satz: number;
    status: string;
    hvName: string | null;
  } | null;
};

export type RechnungDetail = {
  id: number;
  rechnungsnummer: string;
  beschreibung: string | null;
  positionen: Array<{ title: string; description?: string; qty: number; unitNet: number; vatRate: number; total?: number }>;
  mwst_breakdown: Array<{ rate: number; base: number; tax: number }>;
  betrag_netto: number;
  mwst_satz: number;
  betrag_mwst: number;
  betrag_brutto: number;
  status: string;
  status_label: string;
  rechnungs_datum: string;
  leistungs_datum: string | null;
  faellig_am: string;
  bezahlt_am?: string | null;
  steuer_hinweis?: string | null;
  pdf_path?: string | null;
  kunde: KundeDetail | null;
};

export type ListResp = {
  data: RechnungListRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type UnbilledInstallation = {
  id: number;
  publicId: string;
  customerName: string;
  status: string;
  kundeName: string;
  kundeId: number | null;
  subcontractorName: string | null;
  standort: string;
  totalKwp: number | null;
  createdAt: string;
};

export type UnbilledResp = {
  total: number;
  data: UnbilledInstallation[];
  summary: { byStatus: Record<string, number> };
};

export type BillingOverview = {
  installations: {
    total: number;
    billed: number;
    unbilled: number;
    billingRate: number;
  };
  rechnungenByStatus: Record<string, { count: number; sum: number }>;
};

// Abrechnungsübersicht
export interface AbrechnungInstallation {
  id: number;
  publicId: string;
  customerName: string;
  status: string;
  standort: string;
  totalKwp: number | null;
  rechnungGestellt: boolean;
  rechnung: {
    id: number;
    nummer: string;
    status: string;
    betragBrutto: number;
    datum: string;
    bezahltAm: string | null;
  } | null;
}

export interface AbrechnungKunde {
  kundeId: number;
  kundeName: string;
  firmenName: string | null;
  installations: AbrechnungInstallation[];
  summary: {
    totalInstallations: number;
    billedCount: number;
    unbilledCount: number;
    totalBrutto: number;
    openBrutto: number;
    paidBrutto: number;
  };
}

export interface AbrechnungOverviewResp {
  customers: AbrechnungKunde[];
  totalSummary: {
    totalCustomers: number;
    totalInstallations: number;
    billedCount: number;
    unbilledCount: number;
    totalBrutto: number;
    openBrutto: number;
    paidBrutto: number;
  };
}
