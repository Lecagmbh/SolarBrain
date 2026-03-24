import { useEffect, useRef, useState } from "react";
import "../styles/password-center.css";

import { apiGet, apiPost, apiDelete, apiPatch } from "../modules/api/client";
import { useAuth } from "./AuthContext";

import {
  KeyRound,
  Plus,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Shield,
  Users,
  Search,
} from "lucide-react";

const INSTALLATEUR_PORTAL_URL = "/portal";
const DEFAULT_LABEL = "default"; // intern nur noch 1 Credential pro NB

type Netzbetreiber = {
  id: number;
  name: string;
  kurzname?: string | null;
  email?: string | null;
  telefon?: string | null;
  website?: string | null;
  portalUrl?: string | null;
  aktiv?: boolean;
};

type Credential = {
  id: number;
  netzbetreiberId: number;
  netzbetreiberName?: string;
  label: string;
  username?: string | null;
  notes?: string | null;
};

type ToastState = { type: "ok" | "error"; msg: string } | null;

function safeString(v: any) {
  return typeof v === "string" ? v : "";
}

function initials(name: string) {
  const s = (name || "").trim();
  if (!s) return "NB";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function normName(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function copyToClipboard(text: string) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.focus();
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

function openExternal(url: string) {
  const u = url.startsWith("http") ? url : url.startsWith("/") ? url : `https://${url}`;
  window.open(u, "_blank", "noopener,noreferrer");
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="pc-modalOverlay" onMouseDown={onClose}>
      <div className="pc-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pc-modalHead">
          <div className="h">{title}</div>
          <button className="pc-btn" onClick={onClose}>
            Schließen
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PasswordCenterPage() {
  const { user } = useAuth();
  const role = (user?.role || "mitarbeiter").toLowerCase();
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(true);
  const [netzbetreiber, setNetzbetreiber] = useState<Netzbetreiber[]>([]);
  const [counts, setCounts] = useState<Map<number, number>>(new Map());
  const [selectedNbId, setSelectedNbId] = useState<number | null>(null);

  const [credsLoading, setCredsLoading] = useState(false);
  const [creds, setCreds] = useState<Credential[]>([]);

  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const revealTimers = useRef<Record<number, number>>({});

  const [toast, setToast] = useState<ToastState>(null);

  const [query, setQuery] = useState("");

  // Modal
  const [createOpen, setCreateOpen] = useState(false);

  // Modal NB input (separat vom ausgewählten NB!)
  const [mNbName, setMNbName] = useState("");
  const [mNbId, setMNbId] = useState<number | null>(null);
  const [mNbKurz, setMNbKurz] = useState("");
  const [mNbPortalUrl, setMNbPortalUrl] = useState("");
  const [mNbWebsite, setMNbWebsite] = useState("");

  const [mNbSuggestions, setMNbSuggestions] = useState<Netzbetreiber[]>([]);
  const [mNbSuggestLoading, setMNbSuggestLoading] = useState(false);

  // Credential fields (kein Label mehr)
  const [mUser, setMUser] = useState("");
  const [mPass, setMPass] = useState("");
  const [mNotes, setMNotes] = useState("");

  const selected = selectedNbId ? netzbetreiber.find((n) => n.id === selectedNbId) || null : null;

  function showToast(type: "ok" | "error", msg: string) {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), 2400);
  }

  async function copyValue(v: string, okMsg: string) {
    const ok = await copyToClipboard(v);
    if (!ok) return showToast("error", "Kopieren fehlgeschlagen (Browser Rechte).");
    showToast("ok", okMsg);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [nbRaw, cRaw] = await Promise.all([
        apiGet("/netzbetreiber?limit=1000"),
        apiGet("/credentials"),
      ]);

      const nbList: Netzbetreiber[] = Array.isArray(nbRaw)
        ? nbRaw
        : Array.isArray(nbRaw?.data)
          ? nbRaw.data
          : [];

      const cListAny: any[] = Array.isArray(cRaw)
        ? cRaw
        : Array.isArray(cRaw?.data)
          ? cRaw.data
          : [];

      const cList: Credential[] = cListAny
        .map((c) => ({
          id: Number(c.id),
          netzbetreiberId: Number(c.netzbetreiberId ?? c.netzbetreiber_id),
          netzbetreiberName: c.netzbetreiberName ?? c.netzbetreiber_name,
          label: safeString(c.label),
          username: c.username ?? null,
          notes: c.notes ?? null,
        }))
        .filter((c) => Number.isFinite(c.id) && Number.isFinite(c.netzbetreiberId));

      // Count pro NB (0/1 bei DEFAULT_LABEL)
      const map = new Map<number, number>();
      for (const c of cList) {
        map.set(c.netzbetreiberId, (map.get(c.netzbetreiberId) || 0) + 1);
      }

      setNetzbetreiber(nbList);
      setCounts(map);

      const saved = Number(localStorage.getItem("pc.selectedNbId") || "");
      const pick =
        (Number.isFinite(saved) && nbList.some((n) => n.id === saved) && saved) ||
        nbList[0]?.id ||
        null;

      setSelectedNbId(pick);
      if (pick) localStorage.setItem("pc.selectedNbId", String(pick));
    } catch (e) {
      console.error(e);
      showToast("error", "Daten konnten nicht geladen werden (API /netzbetreiber /credentials).");
      setNetzbetreiber([]);
      setCounts(new Map());
      setSelectedNbId(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadCredsFor(nbId: number) {
    setCredsLoading(true);
    try {
      const raw = await apiGet(`/credentials?netzbetreiberId=${nbId}`);
      const listAny: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const list: Credential[] = listAny
        .map((c) => ({
          id: Number(c.id),
          netzbetreiberId: Number(c.netzbetreiberId ?? c.netzbetreiber_id ?? nbId),
          netzbetreiberName: c.netzbetreiberName ?? c.netzbetreiber_name,
          label: safeString(c.label),
          username: c.username ?? null,
          notes: c.notes ?? null,
        }))
        .filter((c) => Number.isFinite(c.id));

      // Wir zeigen nur das DEFAULT Credential (1 pro NB)
      const one = list.find((x) => (x.label || "").trim() === DEFAULT_LABEL) || list[0];
      setCreds(one ? [one] : []);
    } catch (e) {
      console.error(e);
      showToast("error", "Credentials konnten nicht geladen werden.");
      setCreds([]);
    } finally {
      setCredsLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedNbId) return;
    localStorage.setItem("pc.selectedNbId", String(selectedNbId));
    loadCredsFor(selectedNbId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNbId]);

  // Live-Suche im Modal (API search)
  useEffect(() => {
    const s = mNbName.trim();
    if (s.length < 2) {
      setMNbSuggestions([]);
      setMNbSuggestLoading(false);
      return;
    }

    setMNbSuggestLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const raw = await apiGet(`/netzbetreiber?search=${encodeURIComponent(s)}&limit=6`);
        const list: Netzbetreiber[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setMNbSuggestions(list);
      } catch {
        setMNbSuggestions([]);
      } finally {
        setMNbSuggestLoading(false);
      }
    }, 240);

    return () => window.clearTimeout(t);
  }, [mNbName]);

  function pickModalNb(nb: Netzbetreiber) {
    setMNbId(nb.id);
    setMNbName(nb.name);
    setMNbKurz(nb.kurzname || "");
    setMNbPortalUrl(nb.portalUrl || "");
    setMNbWebsite(nb.website || "");
    setMNbSuggestions([]);
    showToast("ok", "Netzbetreiber übernommen.");
  }

  function openSelectedPortal() {
    const url = selected?.portalUrl || selected?.website;
    if (!url) return showToast("error", "Kein Portal-Link/Website hinterlegt.");
    openExternal(url);
  }

  async function revealPassword(credId: number) {
    if (!isAdmin) return showToast("error", "Nur Admin kann Passwörter anzeigen.");
    try {
      const r = await apiGet(`/credentials/${credId}/reveal`);
      const pwd = safeString(r?.password ?? r?.data?.password);
      if (!pwd) return showToast("error", "Reveal hat kein Passwort geliefert.");
      setRevealed((prev) => ({ ...prev, [credId]: pwd }));

      if (revealTimers.current[credId]) window.clearTimeout(revealTimers.current[credId]);
      revealTimers.current[credId] = window.setTimeout(() => {
        setRevealed((prev) => {
          const n = { ...prev };
          delete n[credId];
          return n;
        });
      }, 30000);

      showToast("ok", "Passwort angezeigt (auto-hide in 30s).");
    } catch (e) {
      console.error(e);
      showToast("error", "Reveal fehlgeschlagen.");
    }
  }

  function hidePassword(credId: number) {
    setRevealed((prev) => {
      const n = { ...prev };
      delete n[credId];
      return n;
    });
    if (revealTimers.current[credId]) window.clearTimeout(revealTimers.current[credId]);
  }

  async function handleDelete(credId: number) {
    if (!isAdmin) return showToast("error", "Nur Admin kann löschen.");
    if (!confirm("Credential wirklich löschen?")) return;
    try {
      await apiDelete(`/credentials/${credId}`);
      showToast("ok", "Credential gelöscht.");
      if (selectedNbId) await loadCredsFor(selectedNbId);
      await loadAll();
    } catch (e) {
      console.error(e);
      showToast("error", "Löschen fehlgeschlagen.");
    }
  }

  async function findExactNbIdByName(name: string): Promise<number | null> {
    const q = name.trim();
    if (!q) return null;

    // kleine Suche, dann exaktes Match
    const raw = await apiGet(`/netzbetreiber?search=${encodeURIComponent(q)}&limit=20`);
    const list: Netzbetreiber[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    const exact = list.find((n) => normName(n.name) === normName(q));
    return exact ? exact.id : null;
  }

  async function ensureModalNbId(): Promise<number | null> {
    // wenn Modal NB übernommen
    if (mNbId) return mNbId;

    const name = mNbName.trim();
    if (!name) {
      showToast("error", "Bitte Netzbetreiber-Name eintragen.");
      return null;
    }

    // erst exakt suchen → verhindert doppelte Anlage
    try {
      const found = await findExactNbIdByName(name);
      if (found) {
        setMNbId(found);
        return found;
      }
    } catch {
      // ignore (wir versuchen dann create, falls admin)
    }

    if (!isAdmin) {
      showToast("error", "Nur Admin kann neue Netzbetreiber anlegen. Bitte existierenden übernehmen.");
      return null;
    }

    // anlegen (Admin)
    try {
      const created = await apiPost("/netzbetreiber", {
        name,
        kurzname: mNbKurz.trim() || undefined,
        website: mNbWebsite.trim() || undefined,
        portalUrl: mNbPortalUrl.trim() || undefined,
      });

      const newId = Number(created?.id) || Number(created?.data?.id);
      if (!Number.isFinite(newId)) {
        showToast("error", "Netzbetreiber angelegt, aber keine ID erhalten.");
        return null;
      }

      await loadAll();
      setMNbId(newId);
      return newId;
    } catch (e) {
      console.error(e);
      showToast("error", "Netzbetreiber anlegen fehlgeschlagen.");
      return null;
    }
  }

  async function maybeUpdateNbLinks(nbId: number) {
    // optional: portalUrl/website beim Speichern setzen – nur Admin, weil PUT requireAdmin
    if (!isAdmin) return;

    const portalUrl = mNbPortalUrl.trim();
    const website = mNbWebsite.trim();

    if (!portalUrl && !website) return;

    try {
      await apiPatch(`/netzbetreiber/${nbId}`, {
        portalUrl: portalUrl || undefined,
        website: website || undefined,
        kurzname: mNbKurz.trim() || undefined,
      });
    } catch (e) {
      // nicht blockieren – Credential speichern ist wichtiger
      console.warn("NB update failed (ignored)", e);
    }
  }

  async function handleSave() {
    const username = mUser.trim();
    const password = mPass.trim();
    if (!username) return showToast("error", "Username fehlt.");
    if (!password) return showToast("error", "Passwort fehlt.");

    const nbId = await ensureModalNbId();
    if (!nbId) return;

    await maybeUpdateNbLinks(nbId);

    try {
      // Label intern fix "default" → 1 Credential pro NB
      await apiPost("/credentials", {
        netzbetreiberId: nbId,
        label: DEFAULT_LABEL,
        username,
        password,
        notes: mNotes || "",
      });

      showToast("ok", "Zugangsdaten gespeichert.");

      // UI: automatisch auf diesen NB wechseln + reload
      setSelectedNbId(nbId);
      await loadAll();
      await loadCredsFor(nbId);

      // Modal reset
      setCreateOpen(false);
      setMNbName("");
      setMNbId(null);
      setMNbKurz("");
      setMNbPortalUrl("");
      setMNbWebsite("");
      setMNbSuggestions([]);
      setMUser("");
      setMPass("");
      setMNotes("");
    } catch (e) {
      console.error(e);
      showToast("error", "Speichern fehlgeschlagen (API /credentials).");
    }
  }

  const leftFiltered = query.trim()
    ? netzbetreiber.filter(
        (n) =>
          (n.name || "").toLowerCase().includes(query.trim().toLowerCase()) ||
          (n.kurzname || "").toLowerCase().includes(query.trim().toLowerCase())
      )
    : netzbetreiber;

  return (
    <div className="pc-page">
      <div className="pc-header">
        <div className="pc-title">
          <h1>Passwort-Center</h1>
          <p>
            Netzbetreiber suchen/anlegen → Portal öffnen → Zugangsdaten speichern.{" "}
            <span style={{ opacity: 0.85 }}>
              Reveal nur Admin <Shield size={14} style={{ verticalAlign: "-2px" }} />
            </span>
          </p>
        </div>

        <div className="pc-actions">
          <button className="pc-btn" onClick={() => openExternal(INSTALLATEUR_PORTAL_URL)}>
            <Users size={16} /> Installateur-Portal
          </button>
          <button className="pc-btn" onClick={() => copyValue(INSTALLATEUR_PORTAL_URL, "Installateur-Portal Link kopiert.")}>
            <Copy size={16} /> Link kopieren
          </button>

          <button className="pc-btn" onClick={loadAll} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>

          <button type="button" className="pc-btn pc-btn--primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Neues Credential
          </button>
        </div>
      </div>

      <div className="pc-shell">
        {/* LEFT */}
        <div className="pc-card">
          <div className="pc-card__header">
            <h2>Netzbetreiber</h2>
            <div className="pc-pill">{netzbetreiber.length}</div>
          </div>

          <div className="pc-search">
            <input
              className="pc-input"
              placeholder="Suchen (Name / Kurzname)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="pc-list">
            {loading ? (
              <div style={{ padding: 14, display: "grid", gap: 10 }}>
                <div className="pc-skel" style={{ height: 54 }} />
                <div className="pc-skel" style={{ height: 54 }} />
                <div className="pc-skel" style={{ height: 54 }} />
              </div>
            ) : leftFiltered.length === 0 ? (
              <div className="pc-empty">
                <div className="big">🏢</div>
                <div className="h">Noch keine Netzbetreiber</div>
                <div className="t">
                  Klicke „Neues Credential“ und lege einen Netzbetreiber an (Admin) oder übernimm ihn via Suche.
                </div>
              </div>
            ) : (
              leftFiltered.map((n) => {
                const active = n.id === selectedNbId;
                const c = counts.get(n.id) || 0;
                return (
                  <div
                    key={n.id}
                    className={"pc-item" + (active ? " pc-item--active" : "")}
                    onClick={() => setSelectedNbId(n.id)}
                  >
                    <div className="pc-item__left">
                      <div className="pc-badge">{initials(n.kurzname || n.name)}</div>
                      <div className="pc-item__meta">
                        <div className="pc-item__name">{n.name}</div>
                        <div className="pc-item__sub">
                          {(n.kurzname ? `${n.kurzname} · ` : "") + (n.portalUrl || n.website || "kein Link")}
                        </div>
                      </div>
                    </div>
                    <div className="pc-pill">{c ? "gespeichert" : "leer"}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="pc-card">
          <div className="pc-card__header">
            <h2>Details</h2>
            <div className="pc-pill">{selected ? "ausgewählt" : "—"}</div>
          </div>

          <div className="pc-card__body">
            {!selected ? (
              <div className="pc-empty">
                <div className="big">🔑</div>
                <div className="h">Wähle links einen Netzbetreiber</div>
                <div className="t">Oder erstelle direkt ein Credential – danach springt die Ansicht automatisch.</div>
              </div>
            ) : (
              <>
                <div className="pc-detailTop">
                  <div className="pc-detailTitle">
                    <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <KeyRound size={18} />
                      {selected.name}
                    </h2>
                    <div className="pc-muted">
                      {selected.kurzname ? <span>({selected.kurzname})</span> : null}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button className="pc-btn pc-btn--primary" onClick={openSelectedPortal} disabled={!(selected.portalUrl || selected.website)}>
                      <ExternalLink size={16} /> Portal öffnen
                    </button>
                    <button
                      className="pc-btn"
                      onClick={() => copyValue(selected.portalUrl || selected.website || "", "Link kopiert.")}
                      disabled={!(selected.portalUrl || selected.website)}
                    >
                      <Copy size={16} /> Link kopieren
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 1000 }}>Zugangsdaten</div>
                  <div className="pc-pill">{credsLoading ? "lädt…" : `${creds.length ? 1 : 0} gespeichert`}</div>
                </div>

                {credsLoading ? (
                  <div className="pc-grid">
                    <div className="pc-skel" style={{ height: 170 }} />
                  </div>
                ) : creds.length === 0 ? (
                  <div className="pc-empty" style={{ marginTop: 10 }}>
                    <div className="big">🗝️</div>
                    <div className="h">Keine Zugangsdaten gespeichert</div>
                    <div className="t">Klicke oben auf „Neues Credential“ und hinterlege Username/Passwort.</div>
                  </div>
                ) : (
                  <div className="pc-grid">
                    {creds.map((c) => {
                      const pwd = revealed[c.id];
                      const masked = "•".repeat(12);
                      return (
                        <div key={c.id} className="pc-cred">
                          <div className="pc-credTop">
                            <div>
                              <div className="pc-credLabel">Zugang</div>
                              <div className="pc-credMeta">ID #{c.id}</div>
                            </div>

                            {isAdmin ? (
                              <button className="pc-btn pc-btn--danger" onClick={() => handleDelete(c.id)}>
                                <Trash2 size={16} /> Löschen
                              </button>
                            ) : null}
                          </div>

                          <div className="pc-credRow">
                            <div className="left">
                              <div className="k">Username</div>
                              <div className="v" title={c.username || ""}>{c.username || "—"}</div>
                            </div>
                            <button className="pc-btn" onClick={() => copyValue(c.username || "", "Username kopiert.")} disabled={!c.username}>
                              <Copy size={16} /> Copy
                            </button>
                          </div>

                          <div className="pc-credRow">
                            <div className="left">
                              <div className="k">Passwort</div>
                              <div className="v" title={pwd ? pwd : ""}>
                                {pwd ? pwd : masked}
                              </div>
                            </div>

                            {pwd ? (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button className="pc-btn" onClick={() => copyValue(pwd, "Passwort kopiert.")}>
                                  <Copy size={16} /> Copy
                                </button>
                                <button className="pc-btn" onClick={() => hidePassword(c.id)}>
                                  <EyeOff size={16} /> Hide
                                </button>
                              </div>
                            ) : (
                              <button className="pc-btn" onClick={() => revealPassword(c.id)} disabled={!isAdmin}>
                                <Eye size={16} /> Reveal
                              </button>
                            )}
                          </div>

                          {c.notes ? <div className="pc-note">{c.notes}</div> : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={createOpen} title="Neues Credential (Netzbetreiber + Zugangsdaten)" onClose={() => setCreateOpen(false)}>
        <div className="pc-modalBody">
          <div className="pc-field">
            <label>Netzbetreiber (Name)</label>
            <input
              className="pc-input"
              value={mNbName}
              onChange={(e) => {
                setMNbName(e.target.value);
                setMNbId(null); // wichtig: wenn Name geändert, ID reset
              }}
              placeholder="z.B. Westnetz, Netze BW, Bayernwerk…"
            />

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, fontSize: 12, opacity: 0.78 }}>
              <Search size={14} />
              Live-Suche über API (/netzbetreiber?search=...)
              {mNbSuggestLoading ? " · lädt…" : ""}
              {mNbId ? <span style={{ marginLeft: 8, fontWeight: 900 }}>· übernommen (ID {mNbId})</span> : null}
            </div>

            {mNbSuggestions.length > 0 ? (
              <div className="pc-suggest">
                {mNbSuggestions.map((nb) => (
                  <div key={nb.id} className="pc-suggestItem" onClick={() => pickModalNb(nb)}>
                    <div className="l">
                      <div className="n">{nb.name}</div>
                      <div className="s">{(nb.kurzname ? nb.kurzname + " · " : "") + (nb.portalUrl || nb.website || "kein Link")}</div>
                    </div>
                    <div className="pc-pill">übernehmen</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="pc-formGrid">
            <div className="pc-field">
              <label>Kurzname (optional)</label>
              <input className="pc-input" value={mNbKurz} onChange={(e) => setMNbKurz(e.target.value)} placeholder="z.B. WN / NBW" />
            </div>
            <div className="pc-field">
              <label>Portal-URL (optional)</label>
              <input className="pc-input" value={mNbPortalUrl} onChange={(e) => setMNbPortalUrl(e.target.value)} placeholder="https://… oder portal.domain.de" />
            </div>
          </div>

          <div className="pc-field">
            <label>Website (optional)</label>
            <input className="pc-input" value={mNbWebsite} onChange={(e) => setMNbWebsite(e.target.value)} placeholder="https://…" />
          </div>

          {!isAdmin ? (
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Hinweis: Du bist <b>{role}</b>. Neue Netzbetreiber können nur <b>Admin</b> anlegen. Bitte über die Trefferliste übernehmen.
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Admin: Wenn kein exakter Match existiert, wird der Netzbetreiber automatisch <b>einmalig</b> angelegt.
            </div>
          )}

          <div className="pc-formGrid" style={{ marginTop: 12 }}>
            <div className="pc-field">
              <label>Username</label>
              <input className="pc-input" value={mUser} onChange={(e) => setMUser(e.target.value)} placeholder="z.B. info@…" />
            </div>
            <div className="pc-field">
              <label>Passwort</label>
              <input className="pc-input" value={mPass} onChange={(e) => setMPass(e.target.value)} placeholder="Passwort" />
            </div>
          </div>

          <div className="pc-field">
            <label>Notizen</label>
            <textarea className="pc-textarea" value={mNotes} onChange={(e) => setMNotes(e.target.value)} placeholder="2FA Hinweis, Mandanten-ID, Deep-Link etc." />
          </div>
        </div>

        <div className="pc-modalFoot">
          <button className="pc-btn" onClick={() => setCreateOpen(false)}>Abbrechen</button>
          <button className="pc-btn pc-btn--primary" onClick={handleSave}>
            Speichern
          </button>
        </div>
      </Modal>

      {toast ? (
        <div className={"pc-toast " + (toast.type === "error" ? "pc-toast--error" : "pc-toast--ok")}>
          <div className="dot" />
          <div className="msg">{toast.msg}</div>
        </div>
      ) : null}
    </div>
  );
}
