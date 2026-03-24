/**
 * FILTER CHIPS — Erweitert
 * Togglebare Quick-Filter mit Live-Counts
 * OR-Logik: Email wird angezeigt wenn EIN Filter matcht
 */

import {
  MailOpen,
  CheckCircle,
  HelpCircle,
  XCircle,
  Paperclip,
  Zap,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Bot,
} from "lucide-react";
import { s } from "./styles";
import type { FilterChipId } from "./types";

interface Props {
  activeChips: Set<FilterChipId>;
  counts: Record<FilterChipId, number>;
  onToggle: (chip: FilterChipId) => void;
}

const CHIPS: { id: FilterChipId; label: string; icon: typeof MailOpen; color: string }[] = [
  { id: "unread", label: "Ungelesen", icon: MailOpen, color: "#D4A843" },
  { id: "actionNeeded", label: "Aktion nötig", icon: ShieldAlert, color: "#f43f5e" },
  { id: "genehmigung", label: "Genehmigung", icon: CheckCircle, color: "#10b981" },
  { id: "rueckfrage", label: "Rückfrage", icon: HelpCircle, color: "#f59e0b" },
  { id: "ablehnung", label: "Ablehnung", icon: XCircle, color: "#ef4444" },
  { id: "zaehlerantrag", label: "Zählerantrag", icon: Zap, color: "#06b6d4" },
  { id: "fristablauf", label: "Fristablauf", icon: AlertTriangle, color: "#f43f5e" },
  { id: "eingangsbestaetigung", label: "Bestätigung", icon: FileCheck, color: "#3b82f6" },
  { id: "hasAutoReply", label: "Auto-Reply", icon: Bot, color: "#06b6d4" },
  { id: "attachments", label: "Anhänge", icon: Paperclip, color: "#EAD068" },
];

export function FilterChips({ activeChips, counts, onToggle }: Props) {
  // Only show chips that have at least 1 email (except unread + actionNeeded which are always shown)
  const visibleChips = CHIPS.filter(chip =>
    chip.id === "unread" || chip.id === "actionNeeded" || (counts[chip.id] || 0) > 0
  );

  return (
    <div style={s.chipBar}>
      {visibleChips.map(chip => {
        const Icon = chip.icon;
        const active = activeChips.has(chip.id);
        const count = counts[chip.id] || 0;

        return (
          <button
            key={chip.id}
            className="comm-chip"
            style={{
              ...s.chip,
              ...(active ? {
                background: `${chip.color}20`,
                borderColor: `${chip.color}60`,
                color: chip.color,
              } : {}),
            }}
            onClick={() => onToggle(chip.id)}
          >
            <Icon size={11} />
            {chip.label}
            <span style={s.chipCount}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
