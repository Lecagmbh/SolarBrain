// CRM TypeScript Types — shared across all CRM components

export type CrmStage = "ANFRAGE" | "HV_VERMITTELT" | "AUFTRAG" | "NB_ANFRAGE" | "NB_KOMMUNIKATION" | "NB_GENEHMIGT" | "ABGESCHLOSSEN";
export type CrmAnlagenTyp = "PV_DACH" | "PV_FREIFLAECHE" | "GROSSSPEICHER" | "SCHWARMSPEICHER" | "WALLBOX" | "WAERMEPUMPE" | "BHKW" | "WIND";
export type CrmPrioritaet = "DRINGEND" | "NORMAL" | "NIEDRIG";
export type CrmQuelle = "FACEBOOK" | "WEBSITE" | "EMPFEHLUNG" | "KALTAKQUISE" | "WHATSAPP" | "PARTNER" | "API" | "MANUELL";

export interface CrmAnlagenbetreiber {
  typ: "PRIVAT" | "GEWERBE";
  firma?: { name: string; rechtsform?: string; registernummer?: string; ustId?: string };
  vertreter?: string;
  kontakt?: { email?: string; telefon?: string };
  adresse?: { strasse: string; hausnummer?: string; plz: string; ort: string };
}

export interface CrmProjekt {
  id: number;
  organisationId: number;
  titel: string;
  beschreibung?: string;
  stage: CrmStage;
  anlagenTypen: CrmAnlagenTyp[];
  kundenName?: string;
  ansprechpartner?: string;
  kontaktEmail?: string;
  kontaktTelefon?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  totalKwp?: number;
  netzbetreiberId?: number;
  nbVorgangsnummer?: string;
  nbAnfrageGestelltAm?: string;
  nbGenehmigungAm?: string;
  geplantIbnTermin?: string;
  nvpErwartetBis?: string;
  nabErwartetBis?: string;
  handelsvertreterId?: number;
  zustaendigerId?: number;
  geschaetzterWert?: number;
  prioritaet: CrmPrioritaet;
  naechsterKontakt?: string;
  quelle: CrmQuelle;
  anlagenbetreiber?: CrmAnlagenbetreiber;
  installationId?: number;
  factroProjectId?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  abgeschlossenAm?: string;
  _count?: { kommentare: number; emails: number; dokumente?: number };
}

export interface CrmAktivitaet {
  id: number;
  projektId: number;
  userId?: number;
  typ: string;
  titel: string;
  beschreibung?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CrmKommentar {
  id: number;
  projektId: number;
  userId?: number;
  text: string;
  isSystem: boolean;
  createdAt: string;
}

export interface CrmAngebot {
  id: number;
  angebotNummer: string;
  titel: string;
  positionen: AngebotPosition[];
  nettoGesamt: number;
  mwstGesamt: number;
  bruttoGesamt: number;
  status: string;
  gueltigBis?: string;
  createdAt: string;
}

export interface AngebotPosition {
  bezeichnung: string;
  beschreibung?: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
  mwstSatz: number;
  rabatt?: number;
}

export interface PipelineStats {
  stages: { stage: CrmStage; count: number; wert: number }[];
  summary: {
    total: number;
    aktiv: number;
    pipelineWert: number;
    gewonnen: number;
    gewonnenWert: number;
    conversionRate: number;
    avgCycleDays: number;
    nbAktiv: number;
  };
}

export interface ChecklisteItem {
  id: number;
  phase: number;
  bezeichnung: string;
  beschreibung?: string;
  vdeNummer?: string;
  erforderlich: boolean;
  status: string;
  dokumentPfad?: string;
}

export interface CrmDokument {
  id: number;
  projektId: number;
  dateiname: string;
  originalName: string;
  dateityp: string;
  dateigroesse: number;
  kategorie: string;
  dokumentTyp?: string;
  kiKategorie?: string;
  kiConfidence?: number;
  kiZusammenfassung?: string;
  uploadedById?: number;
  uploadedByName?: string;
  url?: string;
  createdAt: string;
}

export interface ReadinessStatus {
  total: number;
  vorAnfrageTotal: number;
  vorAnfrageFulfilled: number;
  ready: boolean;
  missing: string[];
}

// Constants
export const FLOW_STAGES: { key: CrmStage; label: string; icon: string; color: string }[] = [
  { key: "ANFRAGE", label: "Anfrage", icon: "📥", color: "#38bdf8" },
  { key: "HV_VERMITTELT", label: "HV vermittelt", icon: "🤝", color: "#f0d878" },
  { key: "AUFTRAG", label: "Auftrag", icon: "✅", color: "#34d399" },
  { key: "NB_ANFRAGE", label: "NB-Anfrage", icon: "⚡", color: "#fbbf24" },
  { key: "NB_KOMMUNIKATION", label: "NB-Komm.", icon: "🤖", color: "#fb923c" },
  { key: "NB_GENEHMIGT", label: "NB genehmigt", icon: "🏆", color: "#34d399" },
  { key: "ABGESCHLOSSEN", label: "Fertig", icon: "🎉", color: "#EAD068" },
];

export const ANLAGEN_TYPEN: { key: CrmAnlagenTyp; label: string; icon: string; color: string }[] = [
  { key: "PV_DACH", label: "PV Dachanlage", icon: "🏠", color: "#38bdf8" },
  { key: "PV_FREIFLAECHE", label: "PV Freifläche", icon: "🌾", color: "#34d399" },
  { key: "GROSSSPEICHER", label: "Großspeicher (BESS)", icon: "🔋", color: "#fb923c" },
  { key: "SCHWARMSPEICHER", label: "Schwarmspeicher", icon: "⚡", color: "#fbbf24" },
  { key: "WALLBOX", label: "Wallbox", icon: "🔌", color: "#f0d878" },
  { key: "WAERMEPUMPE", label: "Wärmepumpe", icon: "♨️", color: "#f87171" },
  { key: "BHKW", label: "BHKW", icon: "⚙️", color: "#94a3b8" },
  { key: "WIND", label: "Windkraft", icon: "💨", color: "#38bdf8" },
];

export const stageInfo = (stage: CrmStage) => FLOW_STAGES.find(s => s.key === stage) || { label: stage, icon: "•", color: "#94a3b8" };
export const anlagenTypInfo = (key: CrmAnlagenTyp) => ANLAGEN_TYPEN.find(t => t.key === key) || { label: key, icon: "•", color: "#94a3b8" };
