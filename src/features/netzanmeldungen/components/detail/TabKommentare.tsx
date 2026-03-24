/**
 * Kommentare-Tab — Vereint CRM-Kommentare + Installation-Comments
 * Schreibt an Installation UND CRM, synct automatisch zu Factro
 */
import { useState, useEffect } from "react";

interface Props {
  crmId: number;
  installationId?: number;
}

interface Kommentar {
  id: number;
  text: string;
  isSystem: boolean;
  userId?: number;
  authorName?: string;
  createdAt: string;
  source: "crm" | "installation";
  isInternal?: boolean;
}

export default function TabKommentare({ crmId, installationId }: Props) {
  const [items, setItems] = useState<Kommentar[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = () => {
    const token = localStorage.getItem("baunity_token") || "";
    const headers = { Authorization: `Bearer ${token}` };
    const opts = { headers, credentials: "include" as const };

    const fetches: Promise<Kommentar[]>[] = [];

    // CRM-Kommentare (inkl. Factro-importierte)
    if (crmId > 0) {
      fetches.push(
        fetch(`/api/crm/projekte/${crmId}/kommentare`, opts)
          .then(r => r.ok ? r.json() : [])
          .then((data: any[]) => (data || []).map(k => ({
            id: k.id,
            text: k.text,
            isSystem: k.isSystem || false,
            userId: k.userId,
            authorName: k.authorName,
            createdAt: k.createdAt,
            source: "crm" as const,
            isInternal: false,
          })))
          .catch(() => [])
      );
    }

    // Installation-Comments
    if (installationId && installationId > 0) {
      fetches.push(
        fetch(`/api/installations/${installationId}/comments`, opts)
          .then(r => r.ok ? r.json() : { data: [] })
          .then(res => {
            const comments = res?.data || res || [];
            return (Array.isArray(comments) ? comments : []).map((c: any) => ({
              id: c.id + 500000, // Offset um ID-Kollision zu vermeiden
              text: c.message || c.text || "",
              isSystem: (c.authorName || "").toLowerCase() === "system" || (c.message || "").startsWith("[System]"),
              userId: c.authorId,
              authorName: c.authorName || c.author?.name,
              createdAt: c.createdAt,
              source: "installation" as const,
              isInternal: c.isInternal || false,
            }));
          })
          .catch(() => [])
      );
    }

    Promise.all(fetches).then(results => {
      const all = results.flat();
      // Deduplizierung: gleicher Text + ähnliche Zeit = Skip
      const seen = new Set<string>();
      const deduped = all.filter(k => {
        const key = `${getText(k).substring(0, 40)}-${new Date(k.createdAt).toISOString().substring(0, 16)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      deduped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(deduped);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [crmId, installationId]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const token = localStorage.getItem("baunity_token") || "";
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const opts = { headers, credentials: "include" as const };

    try {
      const promises: Promise<any>[] = [];

      // An Installation schreiben (+ automatischer Factro-Sync via Backend)
      if (installationId && installationId > 0) {
        promises.push(
          fetch(`/api/installations/${installationId}/comments`, {
            ...opts, method: "POST",
            body: JSON.stringify({ message: input.trim() }),
          })
        );
      }

      // An CRM schreiben (falls verknüpft)
      if (crmId > 0) {
        promises.push(
          fetch(`/api/crm/projekte/${crmId}/kommentare`, {
            ...opts, method: "POST",
            body: JSON.stringify({ text: input.trim(), organisationId: 1 }),
          })
        );
      }

      await Promise.allSettled(promises);
      setInput("");
      load();
    } finally {
      setSending(false);
    }
  };

  const getAuthor = (k: Kommentar) => {
    if (k.isSystem) return { name: "System", color: "#f97316", icon: "⚙" };
    // Factro-Kommentare
    if (k.source === "crm" && k.text.includes("Factro")) return { name: k.authorName || "Factro", color: "#fb923c", icon: "🔄" };
    // [Author] prefix
    const m = k.text.match(/^\[([^\]]+)\]\s*/);
    if (m) return { name: m[1], color: k.source === "crm" ? "#D4A843" : "#EAD068", icon: "💬" };
    if (k.authorName) return { name: k.authorName, color: k.source === "crm" ? "#D4A843" : "#EAD068", icon: "💬" };
    return { name: `User #${k.userId || "?"}`, color: "#D4A843", icon: "💬" };
  };

  const getText = (k: Kommentar) => {
    const m = k.text.match(/^\[([^\]]+)\]\s*/);
    return m ? k.text.replace(m[0], "") : k.text.replace(/^↳\s*\[[^\]]+\]\s*/, "");
  };

  const getSourceBadge = (k: Kommentar) => {
    if (k.source === "crm" && k.text.includes("Factro")) return { label: "Factro", color: "#fb923c" };
    if (k.source === "crm") return { label: "CRM", color: "#D4A843" };
    if (k.isInternal) return { label: "Intern", color: "#fbbf24" };
    if (k.text.includes("📤") || k.text.includes("📨") || k.text.includes("📎") || k.text.includes("⚡"))
      return { label: "Auto", color: "#64748b" };
    return null;
  };

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Laden...</div>;

  return (
    <div>
      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Kommentar schreiben... (wird automatisch zu Factro gesynct)"
          style={{ flex: 1, background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.08)", borderRadius: 10, padding: "12px 16px", color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        <button onClick={send} disabled={!input.trim() || sending}
          style={{ background: input.trim() && !sending ? "#D4A843" : "rgba(30,30,58,0.5)", color: input.trim() && !sending ? "#fff" : "#475569", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: input.trim() && !sending ? "pointer" : "default" }}>
          {sending ? "..." : "Senden"}
        </button>
      </div>

      {/* Info-Banner */}
      {installationId && installationId > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, fontSize: 10, color: "#64748b", alignItems: "center" }}>
          <span style={{ fontSize: 12 }}>🔄</span>
          Kommentare werden automatisch zu Factro gesynct (wenn verknüpft)
          {crmId > 0 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#EAD068", fontWeight: 600 }}>CRM #{crmId} verknüpft</span>}
        </div>
      )}

      {/* Thread */}
      {items.map(k => {
        const a = getAuthor(k);
        const isReply = k.text.startsWith("↳");
        const srcBadge = getSourceBadge(k);
        return (
          <div key={`${k.source}-${k.id}`} style={{ display: "flex", gap: 10, marginBottom: 8, marginLeft: isReply ? 40 : 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: a.color + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
            <div style={{ flex: 1, background: "rgba(17,20,35,0.95)", border: `1px solid ${k.isInternal ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)"}`, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.name}</span>
                  {srcBadge && (
                    <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: srcBadge.color + "15", color: srcBadge.color }}>{srcBadge.label}</span>
                  )}
                </div>
                <span style={{ fontSize: 10, color: "#475569" }}>{new Date(k.createdAt).toLocaleString("de-DE")}</span>
              </div>
              <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{getText(k)}</div>
            </div>
          </div>
        );
      })}
      {items.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 13 }}>Noch keine Kommentare. Schreibe den ersten!</div>}
    </div>
  );
}
