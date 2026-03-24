/**
 * BATCH TOOLBAR
 * Sticky Aktionsleiste bei Mehrfach-Auswahl
 */

import {
  CheckSquare,
  Archive,
  Trash2,
  X,
  MailOpen,
} from "lucide-react";
import { s } from "./styles";

interface Props {
  count: number;
  onMarkRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BatchToolbar({ count, onMarkRead, onArchive, onDelete, onClear }: Props) {
  return (
    <div style={s.batchBar}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <CheckSquare size={14} style={{ color: "#a5b4fc" }} />
        <span style={s.batchCount}>{count} ausgewählt</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button className="comm-batch-btn" style={s.batchBtn} onClick={onMarkRead} title="Als gelesen markieren">
          <MailOpen size={13} />
          Gelesen
        </button>
        <button className="comm-batch-btn" style={s.batchBtn} onClick={onArchive} title="Archivieren">
          <Archive size={13} />
          Archiv
        </button>
        <button className="comm-batch-btn" style={s.batchBtnDanger} onClick={onDelete} title="Löschen">
          <Trash2 size={13} />
          Löschen
        </button>
        <button style={s.batchClose} onClick={onClear} title="Auswahl aufheben">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
