export type AutoStatus =
  | "montage"
  | "korrektur"
  | "rueckfrage"
  | "dringend"
  | "freigabe"
  | "pruefung"
  | "unknown";

export interface StatusRule {
  match: RegExp;
  status: AutoStatus;
  confidence: number; // 0–100
  description: string;
}

export const STATUS_RULES: StatusRule[] = [
  {
    match: /übergabe an montage|montage übernimmt|zählermonteur/i,
    status: "montage",
    confidence: 90,
    description: "NB meldet Übergabe an Montage.",
  },
  {
    match: /korrigieren|korrekturwunsch|zur korrektur/i,
    status: "korrektur",
    confidence: 85,
    description: "NB fordert Korrektur an.",
  },
  {
    match: /rückfrage|fehlende unterlagen|unvollständig/i,
    status: "rueckfrage",
    confidence: 80,
    description: "NB stellt Rückfrage.",
  },
  {
    match: /wird gelöscht|gelöscht.*antrag|8 monaten nicht bearbeitet/i,
    status: "dringend",
    confidence: 95,
    description: "NB droht Löschung → DRINGEND.",
  },
  {
    match: /inbetriebsetzung.*erfolgreich|freigegeben|genehmigt/i,
    status: "freigabe",
    confidence: 90,
    description: "NB hat freigegeben.",
  },
  {
    match: /in prüfung|wird geprüft|prüfung läuft/i,
    status: "pruefung",
    confidence: 70,
    description: "NB befindet sich in Prüfung.",
  },
];
