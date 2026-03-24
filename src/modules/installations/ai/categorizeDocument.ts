import type { DocumentCategory } from "./documentCategories";

export interface CategorizationResult {
  category: DocumentCategory;
  confidence: number;
  reason?: string;
}

export function categorizeDocument(
  filename: string,
  contentText: string | null
): CategorizationResult {
  const text = (contentText || "").toLowerCase();
  const name = filename.toLowerCase();

  if (/zählerstand|zaehlerstand|meterstand|zählerfoto/.test(text + name)) {
    return {
      category: "zaehlerstand",
      confidence: 92,
      reason: "Begriffe für Zählerstand erkannt.",
    };
  }

  if (/ibn.?antrag|inbetriebsetzung/.test(text + name)) {
    return {
      category: "ibn_antrag",
      confidence: 88,
      reason: "IBN Antrag Muster erkannt.",
    };
  }

  if (/prüf|protokoll|messprotokoll/.test(text + name)) {
    return {
      category: "pruefprotokoll",
      confidence: 86,
      reason: "Protokolltyp erkannt.",
    };
  }

  if (/messkonzept|mk.?|messkonzeptnummer/.test(text + name)) {
    return {
      category: "messkonzept",
      confidence: 84,
      reason: "Messkonzept Hinweise.",
    };
  }

  if (/antrag.*gelöscht|nb|netzbetreiber|rückfrage|korrektur/i.test(text)) {
    return {
      category: "netzbetreiber_bescheid",
      confidence: 80,
      reason: "NB typische Kommunikation.",
    };
  }

  if (/vertrag|vereinbarung/.test(text)) {
    return {
      category: "vertrag",
      confidence: 70,
      reason: "Vertragssprache erkannt.",
    };
  }

  if (/personalausweis|vollmacht|kunde/.test(text)) {
    return {
      category: "kundendokument",
      confidence: 65,
      reason: "Kundenbezug erkannt.",
    };
  }

  return {
    category: "sonstiges",
    confidence: 40,
    reason: "Keine spezifische Kategorie erkannt.",
  };
}
