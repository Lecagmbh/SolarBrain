export type ServiceKey = "NETZANMELDUNG" | "LAGEPLAN" | "SCHALTPLAN";

export const SERVICE_CATALOG: Record<ServiceKey, { title: string; description: string }> = {
  NETZANMELDUNG: {
    title: "Netzanmeldung inkl. Fertigstellungsmeldung",
    description:
      "Leistungsumfang:\n" +
      "✔ Prüfung der technischen Unterlagen\n" +
      "Wir kontrollieren alle erforderlichen Daten und Dokumente (z. B. Schaltplan, Leistung, Zählerdaten, Anlagenspezifikationen) auf Vollständigkeit und Konformität.\n\n" +
      "✔ Erstellung und Einreichung der Netzanmeldung\n" +
      "Die Anmeldung erfolgt über die offiziellen Netzbetreibersysteme (z. B. Online-Portal). Alle Formulare und technischen Angaben werden vollständig vorbereitet.\n\n" +
      "✔ Kommunikation mit dem Netzbetreiber\n" +
      "Wir übernehmen Rückfragen, technische Abstimmungen und Klärungen bis zur finalen Genehmigung.\n\n" +
      "✔ Fertigmeldung / Inbetriebsetzungsanzeige\n" +
      "Nach Abschluss der Installation reichen wir die Fertigstellungsmeldung ein – inklusive aller benötigten Mess-, Prüf- und Inbetriebnahmeprotokolle.",
  },
  LAGEPLAN: {
    title: "Lageplan-Erstellung",
    description:
      "Erstellung eines einreichfähigen Lageplans für den Netzbetreiber auf Basis der Standort-/Projektinformationen. Enthält klare Darstellung, Markierungen, Beschriftungen und druckfähiges Layout.",
  },
  SCHALTPLAN: {
    title: "Schaltplan-Erstellung",
    description:
      "Erstellung eines vollständigen Einlinien-/Schaltplans zur Einreichung beim Netzbetreiber. Enthält strukturierte Darstellung, Schutzorgane, Messkonzept-Referenz (sofern vorhanden) und ein einreichfähiges PDF.",
  },
};
