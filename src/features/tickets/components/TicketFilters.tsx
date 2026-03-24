import { CONTEXTS, STATUSES, PRIORITIES } from "../constants";

const C = {
  bgInput: "rgba(15,15,25,0.9)", border: "rgba(212,168,67,0.08)",
  borderHover: "rgba(212,168,67,0.2)", text: "#e2e8f0", textMuted: "#64748b",
  primary: "#D4A843", primaryGlow: "rgba(212,168,67,0.15)",
};

interface TicketFiltersProps {
  status: string;
  context: string;
  priority: string;
  onStatusChange: (v: string) => void;
  onContextChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
}

export function TicketFilters({ status, context, priority, onStatusChange, onContextChange, onPriorityChange }: TicketFiltersProps) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <FilterSelect label="Status" value={status} onChange={onStatusChange} options={[{ value: "", label: "Alle" }, ...STATUSES.map(s => ({ value: s.value, label: s.label }))]} />
      <FilterSelect label="Kontext" value={context} onChange={onContextChange} options={[{ value: "", label: "Alle" }, ...CONTEXTS.map(c => ({ value: c.value, label: c.label }))]} />
      <FilterSelect label="Priorität" value={priority} onChange={onPriorityChange} options={[{ value: "", label: "Alle" }, ...PRIORITIES.map(p => ({ value: p.value, label: p.label }))]} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 6,
        color: C.text, fontSize: 12, padding: "6px 10px", outline: "none",
        cursor: "pointer", minWidth: 100,
      }}
      title={label}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
