export type DocumentCategory =
  | "zaehlerstand"
  | "ibn_antrag"
  | "pruefprotokoll"
  | "messkonzept"
  | "genehmigung"
  | "korrektur"
  | "inbetriebsetzung"
  | "montagebericht"
  | "netzbetreiber_bescheid"
  | "kundendokument"
  | "vertrag"
  | "sonstiges";

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  zaehlerstand: "Zählerstand",
  ibn_antrag: "IBN-Antrag",
  pruefprotokoll: "Prüfprotokoll",
  messkonzept: "Messkonzept",
  genehmigung: "Genehmigung",
  korrektur: "Korrekturwunsch",
  inbetriebsetzung: "Inbetriebsetzung",
  montagebericht: "Montagebericht",
  netzbetreiber_bescheid: "NB-Bescheid",
  kundendokument: "Kundendokument",
  vertrag: "Vertrag",
  sonstiges: "Sonstiges",
};

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  zaehlerstand: "#22c55e",
  ibn_antrag: "#0ea5e9",
  pruefprotokoll: "#a855f7",
  messkonzept: "#f97316",
  genehmigung: "#D4A843",
  korrektur: "#dc2626",
  inbetriebsetzung: "#059669",
  montagebericht: "#d97706",
  netzbetreiber_bescheid: "#2563eb",
  kundendokument: "#475569",
  vertrag: "#6b7280",
  sonstiges: "#525252",
};
