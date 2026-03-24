import { useState, useEffect, useRef } from "react";
import { api } from "../../../modules/api/client";

const C = {
  bg: "#06060b", bgPanel: "#0a0a12", bgCard: "rgba(12,12,20,0.85)",
  bgInput: "rgba(15,15,25,0.9)", bgHover: "rgba(18,18,30,0.95)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", green: "#34d399",
};

interface Installation {
  id: number;
  publicId: string;
  customerName?: string;
  location?: string;
  status?: string;
  gridOperator?: string;
}

interface InstallationSearchProps {
  selectedId?: number;
  onSelect: (inst: Installation) => void;
}

export function InstallationSearch({ selectedId, onSelect }: InstallationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Installation | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  // Load selected installation details on mount
  useEffect(() => {
    if (selectedId && !selected) {
      api.get(`/installations/${selectedId}`).then(res => {
        const d = res.data?.data || res.data;
        if (d) setSelected({ id: d.id, publicId: d.publicId, customerName: d.customerName, location: d.location, status: d.status, gridOperator: d.gridOperator });
      }).catch(() => {});
    }
  }, [selectedId]);

  // Search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/installations/enterprise", { params: { search: query, limit: 15 } });
        const items = (data.data || data.installations || data || []).map((d: any) => ({
          id: d.id, publicId: d.publicId, customerName: d.customerName,
          location: d.location, status: d.status, gridOperator: d.gridOperator,
        }));
        setResults(items);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }, [query]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (inst: Installation) => {
    setSelected(inst);
    setOpen(false);
    setQuery("");
    onSelect(inst);
  };

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, maxWidth: 420 }}>
      {/* Selected display or search input */}
      {selected && !open ? (
        <div
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
            background: C.bgInput, border: `1px solid ${C.borderHover}`, borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{selected.publicId}</span>
          <span style={{ fontSize: 12, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected.customerName || "—"}
          </span>
          <span style={{ fontSize: 10, color: C.textMuted }}>{selected.location}</span>
          <span style={{ fontSize: 10, color: C.textMuted, cursor: "pointer" }} onClick={e => { e.stopPropagation(); setOpen(true); }}>✎</span>
        </div>
      ) : (
        <input
          autoFocus={open}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Installation suchen... (Name, ID, PLZ, Ort)"
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 8,
            border: `1px solid ${C.borderHover}`, background: C.bgInput,
            color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
          }}
        />
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10,
          maxHeight: 350, overflowY: "auto", zIndex: 100,
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}>
          {loading && <div style={{ padding: 12, fontSize: 12, color: C.textMuted, textAlign: "center" }}>Suche...</div>}
          {!loading && query.length < 2 && (
            <div style={{ padding: 16, fontSize: 12, color: C.textMuted, textAlign: "center" }}>
              Mindestens 2 Zeichen eingeben
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: C.textMuted, textAlign: "center" }}>Keine Installationen gefunden</div>
          )}
          {results.map(inst => (
            <div
              key={inst.id}
              onClick={() => handleSelect(inst)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                cursor: "pointer", borderBottom: `1px solid ${C.border}`,
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{inst.publicId}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textBright }}>{inst.customerName || "—"}</span>
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                  {[inst.location, inst.gridOperator].filter(Boolean).join(" · ")}
                </div>
              </div>
              <StatusBadge status={inst.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    EINGANG: "#94a3b8", BEIM_NB: "#38bdf8", RUECKFRAGE: "#f87171",
    GENEHMIGT: "#34d399", IBN: "#fbbf24", FERTIG: "#22c55e", STORNIERT: "#64748b",
  };
  const color = colors[status] || "#94a3b8";
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${color}18`, color, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}
