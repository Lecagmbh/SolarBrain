/**
 * VDE Formulare - Eigenständige Seite
 *
 * Erreichbar über /vde-formulare
 * Installationsnummer eingeben → Daten laden → Unterschreiben → Generieren → Versenden
 */

import { useSearchParams } from "react-router-dom";
import { VDEFormularWizard } from "../features/netzanmeldungen/components/VDEFormularWizard";

export default function VDEFormularePage() {
  const [searchParams] = useSearchParams();
  const installationId = searchParams.get("id") ? parseInt(searchParams.get("id")!) : undefined;

  return <VDEFormularWizard initialInstallationId={installationId} />;
}
