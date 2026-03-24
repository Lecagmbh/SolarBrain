export type CustomerStatus =
  | "Eingang"
  | "Beim Netzbetreiber"
  | "Rückfrage"
  | "Genehmigt"
  | "Inbetriebnahme"
  | "Fertig";

export function mapStatusForDashboard(
  internalStatus?: string
): CustomerStatus {
  const s = (internalStatus || "").toUpperCase();

  if (s === "EINGANG") return "Eingang";
  if (s === "BEIM_NB") return "Beim Netzbetreiber";
  if (s === "RUECKFRAGE") return "Rückfrage";
  if (s === "GENEHMIGT") return "Genehmigt";
  if (s === "IBN") return "Inbetriebnahme";
  if (s === "FERTIG" || s === "STORNIERT") return "Fertig";

  return "Eingang";
}
