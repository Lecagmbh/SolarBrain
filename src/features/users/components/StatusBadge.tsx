/**
 * Aktiv / Inaktiv / Gesperrt Badge
 */

interface Props {
  active: boolean;
  gesperrt: boolean;
}

export function StatusBadge({ active, gesperrt }: Props) {
  if (gesperrt) {
    return <span className="up-status up-status--gesperrt">🔒 Gesperrt</span>;
  }
  if (!active) {
    return <span className="up-status up-status--inaktiv">✗ Inaktiv</span>;
  }
  return <span className="up-status up-status--aktiv">✓ Aktiv</span>;
}
