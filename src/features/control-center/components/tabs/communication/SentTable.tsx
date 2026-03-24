/**
 * SENT TABLE
 * Gesendete Emails mit Status, Empfänger, Betreff, Typ, Datum
 */

import { useState } from "react";
import { Send, Calendar, Loader2 } from "lucide-react";
import { s } from "./styles";
import type { SentEmail } from "./types";
import { SENT_STATUS_CONFIG, formatDate } from "./types";

interface SentTableProps {
  emails: SentEmail[];
  loading: boolean;
}

export function SentTable({ emails, loading }: SentTableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <div style={s.tableCard}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Status</th>
            <th style={s.th}>Empfänger</th>
            <th style={s.th}>Betreff</th>
            <th style={s.th}>Typ</th>
            <th style={s.th}>Gesendet</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} style={s.loading}>
                <Loader2 size={20} style={{ animation: "comm-spin 1s linear infinite" }} />
                Lade Emails...
              </td>
            </tr>
          ) : emails.length === 0 ? (
            <tr>
              <td colSpan={5} style={s.empty}>
                <Send size={32} />
                <span>Keine gesendeten Emails</span>
              </td>
            </tr>
          ) : (
            emails.map((email) => {
              const statusConfig =
                SENT_STATUS_CONFIG[email.status] || SENT_STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const isHovered = hoveredRow === email.id;

              return (
                <tr
                  key={email.id}
                  style={{
                    ...s.row,
                    ...(isHovered ? s.rowHover : {}),
                  }}
                  onMouseEnter={() => setHoveredRow(email.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={s.td}>
                    <span
                      style={{
                        ...s.typeBadge,
                        color: statusConfig.color,
                        background: `${statusConfig.color}20`,
                      }}
                    >
                      <StatusIcon size={10} />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td style={s.td}>{email.to}</td>
                  <td style={{ ...s.td, ...s.subjectCell }}>{email.subject}</td>
                  <td style={s.td}>
                    <span
                      style={{
                        background: "rgba(212, 168, 67, 0.15)",
                        color: "#a5b4fc",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                      }}
                    >
                      {email.templateSlug || email.type || "EMAIL"}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={s.dateCell}>
                      <Calendar size={10} />
                      {formatDate(email.sentAt)}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
