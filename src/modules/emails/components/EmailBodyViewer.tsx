import { sanitizeHtml } from "../../../utils/sanitizeHtml";

type Attachment = {
  filename?: string;
  contentType?: string;
  size?: number;
  url?: string;
};

export default function EmailBodyViewer(props: {
  html?: string | null;
  text?: string | null;
  attachments?: Attachment[] | null;
}) {
  const html = String(props.html || "").trim();
  const text = String(props.text || "").trim();
  const atts = Array.isArray(props.attachments) ? props.attachments : [];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {html ? (
        <div
          style={{
            background: "rgba(0,0,0,0.18)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 14,
            overflow: "auto",
          }}
        >
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#e5e7eb",
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
          />
        </div>
      ) : text ? (
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "rgba(0,0,0,0.18)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 14,
            fontSize: 12,
            lineHeight: 1.55,
            color: "#e5e7eb",
          }}
        >
          {text}
        </pre>
      ) : (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: 0.85,
          }}
        >
          Diese E-Mail enthält keinen Text/HTML-Body (z.B. „Empty message“). Falls sie Anhänge hat: unten prüfen.
        </div>
      )}

      {atts.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Anhänge</div>
          <div style={{ display: "grid", gap: 8 }}>
            {atts.map((a, idx) => (
              <a
                key={idx}
                href={a.url || "#"}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📎 {a.filename || "Anhang"}
                </span>
                <span style={{ opacity: 0.7, fontSize: 12 }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
