import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../../../api/client";
import { useAuth } from "../../../../pages/AuthContext";

type EmailListRow = {
  id: string;
  subject?: string | null;
  from?: string | null;
  fromName?: string | null;
  date?: string | null;
  direction?: "INBOUND" | "OUTBOUND" | string;
  assigned?: boolean;
  installationId?: number | null;
  matchScore?: number | null;
  isRead?: boolean;
  isArchived?: boolean;
  hasAttachments?: boolean;
};

type EmailAttachment = {
  filename?: string;
  contentType?: string;
  size?: number;
  url?: string;
  path?: string;
  relativePath?: string;
};

type EmailDetail = EmailListRow & {
  bodyHtml?: string | null;
  bodyText?: string | null;
  attachments?: EmailAttachment[];
  installationPublicId?: string | null;
  customerName?: string | null;
};

function fmtDate(iso?: string | null) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeText(s?: string | null) {
  return (s || "").toString().trim();
}

function normalizeAttachmentUrl(a: any): EmailAttachment {
  if (!a || typeof a !== "object") return a;
  if (a.url) return a;

  const candidates = [a.relativePath, a.relative_path, a.path, a.filePath, a.file_path].filter(Boolean);
  for (const c of candidates) {
    const s = String(c);
    if (!s) continue;

    if (s.startsWith("/uploads/")) return { ...a, url: s };
    if (s.startsWith("uploads/")) return { ...a, url: `/${s}` };

    const idx = s.indexOf("/uploads/");
    if (idx >= 0) return { ...a, url: s.slice(idx) };

    const idx2 = s.indexOf("uploads/");
    if (idx2 >= 0) return { ...a, url: `/${s.slice(idx2)}` };
  }
  return a;
}

export default function EmailsTab(props: any) {
  const params = useParams();

  const installationId: number | null =
    typeof props?.installationId === "number"
      ? props.installationId
      : typeof props?.installation?.id === "number"
        ? props.installation.id
        : params?.id
          ? Number(params.id)
          : null;

  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const isKunde = role === "kunde";

  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<EmailListRow[]>([]);
  const [unassigned, setUnassigned] = useState<EmailListRow[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(false);

  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, EmailDetail | null>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const [publicId, setPublicId] = useState<string>("");
  const [nbCaseNumber, setNbCaseNumber] = useState<string>("");
  const [nbSaving, setNbSaving] = useState(false);
  const [autoAssignBusy, setAutoAssignBusy] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);

  const listUrl = useMemo(() => {
    if (!installationId || !Number.isFinite(installationId)) return null;
    const qs = new URLSearchParams();
    qs.set("folder", "all");
    qs.set("limit", "300");
    return `/emails/for-installation/${installationId}?${qs.toString()}`;
  }, [installationId]);

  async function loadList() {
    if (!listUrl) {
      setEmails([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await apiGet(listUrl);
      const rows = Array.isArray(r?.data) ? (r.data as EmailListRow[]) : [];
      setEmails(rows);

      const meta = r?.meta || {};
      setPublicId(String(meta.publicId || ""));
      setNbCaseNumber(String(meta.nbCaseNumber || ""));
    } catch (e) {
      console.error("[EmailsTab] loadList failed", e);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnassigned() {
    if (isKunde) {
      setUnassigned([]);
      return;
    }
    try {
      const r = await apiGet(`/emails/unassigned?limit=250`);
      const rows = Array.isArray(r) ? (r as EmailListRow[]) : Array.isArray(r?.data) ? (r.data as EmailListRow[]) : [];
      setUnassigned(rows);
    } catch (e) {
      console.error("[EmailsTab] loadUnassigned failed", e);
      setUnassigned([]);
    }
  }

  async function loadDetail(emailId: string) {
    if (!emailId) return;
    if (detailMap[emailId]) return;

    setDetailLoadingId(emailId);
    try {
      const d = await apiGet(`/emails/${emailId}`);
      const fixed: EmailDetail = {
        ...(d as any),
        attachments: Array.isArray((d as any)?.attachments) ? (d as any).attachments.map(normalizeAttachmentUrl) : [],
      };
      setDetailMap((p) => ({ ...p, [emailId]: fixed }));
    } catch (e) {
      console.error("[EmailsTab] loadDetail failed", e);
      setDetailMap((p) => ({ ...p, [emailId]: null }));
    } finally {
      setDetailLoadingId(null);
    }
  }

  async function saveNbCase() {
    if (!installationId) return;
    setNbSaving(true);
    try {
      await apiPatch(`installations/${installationId}/nb-case`, { nbCaseNumber: nbCaseNumber.trim() || null });
      await loadList();
      if (showUnassigned) await loadUnassigned();
    } catch (e) {
      console.error("[EmailsTab] saveNbCase failed", e);
    } finally {
      setNbSaving(false);
    }
  }

  async function autoAssignByRef() {
    if (!installationId) return;
    setAutoAssignBusy(true);
    try {
      await apiPost(`/emails/auto-assign`, { installationId });
      await loadList();
      if (showUnassigned) await loadUnassigned();
    } catch (e) {
      console.error("[EmailsTab] autoAssign failed", e);
    } finally {
      setAutoAssignBusy(false);
    }
  }

  async function assignSelected(emailId: string) {
    if (!installationId) return;
    setManualBusy(true);
    try {
      await apiPost(`/emails/${emailId}/assign`, { installationId });
      setDetailMap({});
      setExpandedEmail(null);
      await loadList();
      if (showUnassigned) await loadUnassigned();
    } catch (e) {
      console.error("[EmailsTab] manual assign failed", e);
    } finally {
      setManualBusy(false);
    }
  }

  async function unassignSelected(emailId: string) {
    setManualBusy(true);
    try {
      await apiPost(`/emails/${emailId}/unassign`, {});
      setDetailMap({});
      setExpandedEmail(null);
      await loadList();
      if (showUnassigned) await loadUnassigned();
    } catch (e) {
      console.error("[EmailsTab] manual unassign failed", e);
    } finally {
      setManualBusy(false);
    }
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl]);

  useEffect(() => {
    if (!showUnassigned) {
      setUnassigned([]);
      return;
    }
    loadUnassigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnassigned, installationId]);

  const displayEmails = useMemo(() => {
    const byId = new Map<string, EmailListRow>();

    // primary: assigned+matches
    for (const e of emails) byId.set(e.id, e);

    // optional: global unassigned (so it matches EmailCenter view)
    if (showUnassigned && !isKunde) {
      for (const e of unassigned) if (!byId.has(e.id)) byId.set(e.id, e);
    }

    const arr = Array.from(byId.values());

    // customer: only assigned
    const filtered = isKunde
      ? arr.filter((e) => typeof e.installationId === "number" && Boolean(e.installationId))
      : arr;

    // sort by date desc
    filtered.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    return filtered;
  }, [emails, unassigned, showUnassigned, isKunde]);

  const activeDetail = expandedEmail ? detailMap[expandedEmail] : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14, alignItems: "start" }}>
      <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900 }}>E-Mails</div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!isKunde && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, opacity: 0.9, cursor: "pointer" }}>
                  <input type="checkbox" checked={showUnassigned} onChange={(e) => setShowUnassigned(e.target.checked)} />
                  Nicht zugeordnete anzeigen
                </label>
              )}

              <button
                className="btn-ghost"
                style={{ padding: "6px 10px", fontSize: 12 }}
                onClick={() => {
                  setDetailMap({});
                  setExpandedEmail(null);
                  loadList();
                  if (showUnassigned) loadUnassigned();
                }}
              >
                ↻
              </button>
            </div>
          </div>

          {!isKunde && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center" }}>
              <input
                value={nbCaseNumber}
                onChange={(e) => setNbCaseNumber(e.target.value)}
                placeholder="NB-Vorgangsnummer / Aktenzeichen (Auto-Match)"
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(2,6,23,0.9)",
                  color: "#e5e7eb",
                  padding: "10px 12px",
                  fontSize: 13,
                }}
              />
              <button className="btn-ghost" disabled={nbSaving || !installationId} onClick={saveNbCase} style={{ padding: "10px 12px" }}>
                {nbSaving ? "…" : "Speichern"}
              </button>
              <button className="btn-primary" disabled={autoAssignBusy || !installationId} onClick={autoAssignByRef} style={{ padding: "10px 12px" }}>
                {autoAssignBusy ? "…" : "Auto-zuordnen"}
              </button>
            </div>
          )}

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Referenz: <strong>{publicId || "–"}</strong> {nbCaseNumber ? <> • NB: <strong>{nbCaseNumber}</strong></> : null}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 18, opacity: 0.7 }}>Lade…</div>
        ) : displayEmails.length === 0 ? (
          <div style={{ padding: 18, opacity: 0.7 }}>
            Keine E-Mails gefunden.
            {!isKunde && (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
                Tipp: Checkbox „Nicht zugeordnete anzeigen“ aktivieren oder NB‑Vorgangsnummer speichern und „Auto‑zuordnen“.
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxHeight: "calc(100vh - 320px)", overflowY: "auto" }}>
            {displayEmails.map((e) => {
              const active = expandedEmail === e.id;
              const isAssignedHere = typeof e.installationId === "number" && e.installationId === installationId;
              const isAssignedSomewhere = typeof e.installationId === "number" && !isAssignedHere;
              const isMatch = !isAssignedHere && !isAssignedSomewhere && e.matchScore != null;

              let badge = "🟦 Nicht zugeordnet";
              if (isAssignedHere) badge = "✅ Zugeordnet";
              else if (isAssignedSomewhere) badge = "↗ Andere Installation";
              else if (isMatch) badge = "✨ Match";

              return (
                <div
                  key={e.id}
                  onClick={() => {
                    const next = active ? null : e.id;
                    setExpandedEmail(next);
                    if (next) loadDetail(next);
                  }}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    background: active ? "rgba(56,189,248,0.07)" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.subject || "(ohne Betreff)"}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.65, whiteSpace: "nowrap" }}>{fmtDate(e.date || undefined)}</div>
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.fromName ? `${e.fromName} <${e.from || ""}>` : (e.from || "–")}
                  </div>

                  {!isKunde && (
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>
                      {badge}
                      {e.direction ? <span style={{ marginLeft: 8, opacity: 0.7 }}>{e.direction}</span> : null}
                      {e.hasAttachments ? <span style={{ marginLeft: 8, opacity: 0.7 }}>📎</span> : null}
                      {e.matchScore != null ? <span style={{ marginLeft: 8, opacity: 0.7 }}>Score: {e.matchScore}</span> : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dash-card" style={{ padding: 16 }}>
        {!expandedEmail ? (
          <div style={{ padding: 18, opacity: 0.75 }}>Wähle links eine E-Mail aus.</div>
        ) : detailLoadingId === expandedEmail && !activeDetail ? (
          <div style={{ padding: 18, opacity: 0.75 }}>Lade Inhalt…</div>
        ) : (
          (() => {
            const d = activeDetail || null;
            if (!d) return <div style={{ padding: 18, opacity: 0.75 }}>Inhalt konnte nicht geladen werden.</div>;

            const html = safeText(d.bodyHtml);
            const text = safeText(d.bodyText);

            const isAssignedHere = typeof d.installationId === "number" && d.installationId === installationId;
            const isUnassigned = d.installationId == null;

            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>{d.subject || "(ohne Betreff)"}</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>
                      Von: {d.fromName ? `${d.fromName} <${d.from || ""}>` : (d.from || "–")}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Datum: {fmtDate(d.date || undefined)}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {!isKunde && installationId && (
                      <>
                        {isUnassigned && (
                          <button className="btn-primary" disabled={manualBusy} onClick={() => assignSelected(String(d.id))} style={{ padding: "8px 10px" }}>
                            {manualBusy ? "…" : "Zuordnen"}
                          </button>
                        )}
                        {isAssignedHere && (
                          <button className="btn-ghost" disabled={manualBusy} onClick={() => unassignSelected(String(d.id))} style={{ padding: "8px 10px" }}>
                            {manualBusy ? "…" : "Zuordnung lösen"}
                          </button>
                        )}
                      </>
                    )}
                    <button className="btn-ghost" style={{ padding: "8px 10px" }} onClick={() => setExpandedEmail(null)}>✕</button>
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  {html ? (
                    <iframe
                      title="email-html"
                      sandbox=""
                      referrerPolicy="no-referrer"
                      style={{
                        width: "100%",
                        minHeight: 520,
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        background: "rgba(0,0,0,0.18)",
                      }}
                      srcDoc={html}
                    />
                  ) : text ? (
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14, fontSize: 12, lineHeight: 1.55 }}>
                      {text}
                    </pre>
                  ) : (
                    <div style={{ padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", opacity: 0.75 }}>
                      Diese E-Mail hat keinen Text/HTML-Body.
                    </div>
                  )}
                </div>

                {Array.isArray(d.attachments) && d.attachments.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Anhänge</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {d.attachments.map((a, idx) => {
                        const url = a?.url ? String(a.url) : "";
                        return (
                          <a
                            key={idx}
                            href={url || "#"}
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
                              pointerEvents: url ? "auto" : "none",
                              opacity: url ? 1 : 0.5,
                            }}
                            title={url ? url : "Kein URL im Attachment-JSON"}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📎 {a.filename || "Anhang"}</span>
                            <span style={{ opacity: 0.7, fontSize: 12 }}>↗</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
