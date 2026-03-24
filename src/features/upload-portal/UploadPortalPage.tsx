import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";

// Only these types are relevant for customer uploads — everything else is our job
const CUSTOMER_DOC_TYPES = new Set([
  "fertigstellungsanzeige", "foto_module", "foto_wechselrichter", "foto_zaehlerschrank",
  "foto_speicher", "einspeiseverguetung", "mastr_pv", "mastr_speicher",
  "messkonzept", "inbetriebnahmeprotokoll", "sonstige",
]);

const DOC_ICONS: Record<string, string> = {
  fertigstellungsanzeige: "\u{1F4DD}", foto_module: "\u{1F4F7}", foto_wechselrichter: "\u{1F4F7}",
  foto_zaehlerschrank: "\u{1F4F7}", foto_speicher: "\u{1F4F7}", einspeiseverguetung: "\u{1F4B6}",
  mastr_pv: "\u{1F3DB}", mastr_speicher: "\u{1F50B}", messkonzept: "\u{1F4CA}",
  inbetriebnahmeprotokoll: "\u{1F4CB}", sonstige: "\u{1F4CE}",
};

interface Doc { type: string; label: string; required?: boolean; uploaded: boolean; uploadedAt?: string; fileName?: string; downloadUrl?: string; }
interface Info { name: string; address: string; nb: string; kwp?: number; docs: Doc[]; }

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{background:#060a14;color:#e2e8f0;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0)}50%{box-shadow:0 0 20px 0 rgba(99,102,241,0.15)}}
@keyframes checkPop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
@keyframes progressShine{0%{background-position:-200% 0}100%{background-position:200% 0}}
.up-page{min-height:100vh;background:#060a14;position:relative;overflow:hidden}
.up-page::before{content:'';position:fixed;top:-40%;left:-20%;width:80%;height:80%;background:radial-gradient(ellipse,rgba(99,102,241,0.04),transparent 70%);pointer-events:none}
.up-page::after{content:'';position:fixed;bottom:-30%;right:-20%;width:60%;height:60%;background:radial-gradient(ellipse,rgba(34,197,94,0.03),transparent 70%);pointer-events:none}
.up-wrap{max-width:520px;margin:0 auto;padding:32px 16px 60px;position:relative;z-index:1}
.up-header{text-align:center;margin-bottom:32px;animation:fadeUp .5s ease both}
.up-logo{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#6366f1;margin-bottom:12px}
.up-title{font-size:24px;font-weight:900;color:#f1f5f9;letter-spacing:-0.03em;line-height:1.2}
.up-sub{font-size:13px;color:#64748b;margin-top:8px}
.up-info{display:flex;flex-direction:column;gap:6px;padding:18px 20px;background:rgba(15,23,42,0.5);border:1px solid rgba(99,102,241,0.08);border-radius:14px;margin-bottom:24px;animation:fadeUp .5s ease .1s both}
.up-info-row{display:flex;align-items:center;gap:10px;font-size:13px;color:#94a3b8}
.up-info-row strong{color:#e2e8f0;font-weight:600}
.up-progress{padding:16px 20px;background:rgba(15,23,42,0.5);border:1px solid rgba(99,102,241,0.08);border-radius:14px;margin-bottom:24px;animation:fadeUp .5s ease .15s both}
.up-progress-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.up-progress-label{font-size:14px;font-weight:700;color:#f1f5f9}
.up-progress-count{font-size:12px;font-weight:700;color:#6366f1;background:rgba(99,102,241,0.1);padding:3px 12px;border-radius:20px}
.up-bar{height:6px;background:rgba(99,102,241,0.1);border-radius:3px;overflow:hidden}
.up-bar-fill{height:100%;border-radius:3px;transition:width .6s cubic-bezier(.4,0,.2,1);background:linear-gradient(90deg,#6366f1,#818cf8);background-size:200% 100%;animation:progressShine 2s linear infinite}
.up-bar-fill.done{background:#22c55e;animation:none}
.up-done{text-align:center;padding:24px 20px;background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.15);border-radius:14px;margin-bottom:24px;animation:fadeUp .4s ease both}
.up-done-icon{font-size:40px;margin-bottom:8px;animation:checkPop .5s ease both}
.up-done-text{font-size:16px;font-weight:700;color:#22c55e}
.up-done-sub{font-size:12px;color:#64748b;margin-top:4px}
.up-list{display:flex;flex-direction:column;gap:12px;margin-bottom:32px}
.up-item{background:rgba(15,23,42,0.5);border:1px solid rgba(99,102,241,0.06);border-radius:14px;overflow:hidden;animation:fadeUp .4s ease both}
.up-item-head{display:flex;align-items:center;gap:12px;padding:16px 18px}
.up-item-icon{font-size:22px;flex-shrink:0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:rgba(99,102,241,0.06)}
.up-item-icon.done{background:rgba(34,197,94,0.08)}
.up-item-label{font-size:14px;font-weight:700;color:#f1f5f9;flex:1}
.up-item-badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:12px;letter-spacing:.02em}
.up-item-badge.pending{color:#f59e0b;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.15)}
.up-item-badge.uploaded{color:#22c55e;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15)}
.up-item-body{padding:0 18px 16px}
.up-item-uploaded{font-size:12px;color:#22c55e;display:flex;align-items:center;gap:6px;padding:0 18px 14px}
.up-item-uploaded span{color:#64748b;font-weight:400}
.up-dl{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#818cf8;text-decoration:none;font-weight:600;padding:6px 14px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.12);border-radius:8px;margin-bottom:10px;transition:all .15s}
.up-dl:hover{background:rgba(99,102,241,0.12);border-color:rgba(99,102,241,0.25)}
.up-drop{border:2px dashed rgba(99,102,241,0.15);border-radius:12px;padding:28px 16px;text-align:center;cursor:pointer;transition:all .2s;background:rgba(6,10,20,0.5)}
.up-drop:hover,.up-drop.active{border-color:rgba(99,102,241,0.4);background:rgba(99,102,241,0.04)}
.up-drop-icon{font-size:28px;color:#475569;margin-bottom:6px;transition:transform .2s}
.up-drop:hover .up-drop-icon{transform:translateY(-2px)}
.up-drop-text{font-size:13px;color:#64748b}
.up-drop-hint{font-size:11px;color:#475569;margin-top:4px}
.up-uploading{padding:12px 0}
.up-uploading-bar{height:4px;background:rgba(99,102,241,0.1);border-radius:2px;overflow:hidden;margin-bottom:6px}
.up-uploading-fill{height:100%;background:linear-gradient(90deg,#6366f1,#a78bfa);border-radius:2px;transition:width .3s}
.up-uploading-text{font-size:11px;color:#64748b}
.up-success{padding:10px 14px;background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.12);border-radius:8px;font-size:12px;color:#22c55e;font-weight:500}
.up-error{padding:10px 14px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);border-radius:8px;font-size:12px;color:#ef4444;font-weight:500}
.up-footer{text-align:center;padding:20px 0;border-top:1px solid rgba(99,102,241,0.06);font-size:12px;color:#475569}
.up-footer a{color:#64748b;text-decoration:none;font-weight:500}
.up-spinner{width:32px;height:32px;border:3px solid rgba(99,102,241,0.15);border-top-color:#6366f1;border-radius:50%;animation:spin .7s linear infinite}
.up-center{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;gap:14px;text-align:center}
`;

// ─── DropZone ──────────────────────────────────────────────────────────────

function DropZone({ documentType, token, onUploaded }: { documentType: string; token: string; onUploaded: (t: string, f: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (file.size > 25 * 1024 * 1024) { setError("Datei zu groß (max. 25 MB)"); return; }
    setUploading(true); setProgress(0); setError(null); setSuccess(null);
    const fd = new FormData(); fd.append("file", file); fd.append("documentType", documentType);
    try {
      await new Promise<void>((ok, fail) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => xhr.status < 300 ? ok() : fail(new Error(JSON.parse(xhr.responseText)?.error || "Fehler"));
        xhr.onerror = () => fail(new Error("Netzwerkfehler"));
        xhr.open("POST", `${API}/api/upload-portal/${token}/upload`); xhr.send(fd);
      });
      setSuccess(file.name); onUploaded(documentType, file.name);
    } catch (e: any) { setError(e.message); } finally { setUploading(false); }
  }, [documentType, token, onUploaded]);

  if (success) return <div className="up-success">Hochgeladen: {success}</div>;
  if (uploading) return (
    <div className="up-uploading">
      <div className="up-uploading-bar"><div className="up-uploading-fill" style={{ width: `${progress}%` }} /></div>
      <div className="up-uploading-text">{progress < 100 ? `${progress}%` : "Verarbeite..."}</div>
    </div>
  );

  return (
    <>
      <div className={`up-drop ${dragging ? "active" : ""}`}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => ref.current?.click()}>
        <div className="up-drop-icon">{dragging ? "\u{1F4E5}" : "\u{1F4F1}"}</div>
        <div className="up-drop-text">{dragging ? "Loslassen zum Hochladen" : "Datei auswaehlen oder hierher ziehen"}</div>
        <div className="up-drop-hint">PDF, JPG, PNG — max. 25 MB</div>
      </div>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      {error && <div className="up-error" style={{ marginTop: 8 }}>{error}</div>}
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export default function UploadPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    if (!token) { setError("Kein Token"); setLoading(false); return; }
    fetch(`${API}/api/upload-portal/${token}`)
      .then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Fehler ${r.status}`); return r.json(); })
      .then(data => {
        const loc = (data.location || "").split(",").map((s: string) => s.trim());
        const allDocs: Doc[] = (data.requiredDocuments || data.documents || []).map((d: any) => ({
          type: d.type, label: d.label, required: d.required ?? true,
          uploaded: d.uploaded ?? false, uploadedAt: d.uploadedAt, fileName: d.fileName, downloadUrl: d.downloadUrl,
        }));
        // Only customer-relevant docs
        const customerDocs = allDocs.filter(d => CUSTOMER_DOC_TYPES.has(d.type));
        setInfo({
          name: data.customerName || "",
          address: `${loc[0] || ""}, ${loc[1] || ""}`.replace(/^,\s*|,\s*$/g, ""),
          nb: data.gridOperator || "",
          kwp: data.kwp,
          docs: customerDocs,
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const onUploaded = useCallback((type: string, fileName: string) => {
    setInfo(p => p ? { ...p, docs: p.docs.map(d => d.type === type ? { ...d, uploaded: true, uploadedAt: new Date().toISOString(), fileName } : d) } : p);
  }, []);

  if (loading) return (
    <div className="up-page"><style>{CSS}</style><div className="up-wrap"><div className="up-center"><div className="up-spinner" /><div style={{ fontSize: 13, color: "#64748b" }}>Laden...</div></div></div></div>
  );

  if (error || !info) return (
    <div className="up-page"><style>{CSS}</style><div className="up-wrap"><div className="up-center">
      <div style={{ fontSize: 48 }}>{"\u{1F50C}"}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>Link nicht gefunden</div>
      <div style={{ fontSize: 13, color: "#64748b", maxWidth: 320 }}>{error || "Dieser Link ist ungueltig. Bitte kontaktieren Sie uns."}</div>
      <a href="tel:072198618238" style={{ color: "#6366f1", fontSize: 14, fontWeight: 600, textDecoration: "none", marginTop: 8 }}>0721-98618238</a>
    </div></div></div>
  );

  const pending = info.docs.filter(d => !d.uploaded);
  const done = info.docs.filter(d => d.uploaded);
  const total = info.docs.length;
  const doneCount = done.length;
  const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
  const allDone = pending.length === 0 && total > 0;

  return (
    <div className="up-page">
      <style>{CSS}</style>
      <div className="up-wrap">
        {/* Header */}
        <div className="up-header">
          <div className="up-logo">GridNetz</div>
          <div className="up-title">Unterlagen hochladen</div>
          <div className="up-sub">Bitte laden Sie die folgenden Dokumente fuer Ihre PV-Anlage hoch.</div>
        </div>

        {/* Info */}
        <div className="up-info">
          <div className="up-info-row"><span style={{ width: 18, textAlign: "center" }}>{"\u{1F464}"}</span> <strong>{info.name}</strong></div>
          <div className="up-info-row"><span style={{ width: 18, textAlign: "center" }}>{"\u{1F4CD}"}</span> {info.address}</div>
          <div className="up-info-row"><span style={{ width: 18, textAlign: "center" }}>{"\u26A1"}</span> {info.nb}</div>
        </div>

        {/* All done */}
        {allDone && (
          <div className="up-done">
            <div className="up-done-icon">{"\u2705"}</div>
            <div className="up-done-text">Alle Unterlagen hochgeladen!</div>
            <div className="up-done-sub">Vielen Dank. Wir melden uns bei Ihnen.</div>
          </div>
        )}

        {/* Progress */}
        {!allDone && (
          <div className="up-progress">
            <div className="up-progress-head">
              <div className="up-progress-label">Fortschritt</div>
              <div className="up-progress-count">{doneCount} / {total}</div>
            </div>
            <div className="up-bar"><div className={`up-bar-fill ${allDone ? "done" : ""}`} style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        {/* Pending docs */}
        <div className="up-list">
          {pending.map((doc, i) => (
            <div key={doc.type} className="up-item" style={{ animationDelay: `${0.2 + i * 0.06}s` }}>
              <div className="up-item-head">
                <div className="up-item-icon">{DOC_ICONS[doc.type] || "\u{1F4CE}"}</div>
                <div className="up-item-label">{doc.label}</div>
                <div className="up-item-badge pending">Ausstehend</div>
              </div>
              <div className="up-item-body">
                {doc.downloadUrl && (
                  <a href={doc.downloadUrl} target="_blank" rel="noreferrer" className="up-dl">
                    {"\u{1F4C4}"} Formular herunterladen
                  </a>
                )}
                <DropZone documentType={doc.type} token={token!} onUploaded={onUploaded} />
              </div>
            </div>
          ))}

          {/* Done docs */}
          {done.map((doc, i) => (
            <div key={doc.type} className="up-item" style={{ animationDelay: `${0.2 + (pending.length + i) * 0.06}s`, opacity: 0.7 }}>
              <div className="up-item-head">
                <div className="up-item-icon done">{DOC_ICONS[doc.type] || "\u2705"}</div>
                <div className="up-item-label" style={{ color: "#94a3b8" }}>{doc.label}</div>
                <div className="up-item-badge uploaded">Hochgeladen</div>
              </div>
              {doc.uploadedAt && (
                <div className="up-item-uploaded">
                  {"\u2714"} {new Date(doc.uploadedAt).toLocaleDateString("de-DE")}
                  {doc.fileName && <span>({doc.fileName})</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="up-footer">
          <div>GridNetz {"\u00B7"} <a href="tel:072198618238">0721-98618238</a></div>
          <div style={{ marginTop: 4 }}>Bei Fragen stehen wir Ihnen gerne zur Verfuegung.</div>
        </div>
      </div>
    </div>
  );
}
