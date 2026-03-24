import { useState } from "react";
import { apiPatch } from "../../../api/client";
import { useDetail } from "../context/DetailContext";
import { useAuth } from "../../../../pages/AuthContext";

/* =========================
   UI PRIMITIVES (ENDLVL)
========================= */

function Section({ title, icon, children }: any) {
  return (
    <div className="dash-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 15 }}>{title}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function Tile({ label, value, edit, onChange }: any) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>{label}</div>
      {edit ? (
        <input
          className="admin-input"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div style={{ fontSize: 15, fontWeight: 600 }}>{value || "—"}</div>
      )}
    </div>
  );
}

/* =========================
   DATA TAB
========================= */

export default function DataTab() {
  const detailCtx = useDetail();
  const { user } = useAuth();

  const detail = detailCtx.detail;
  const reload = detailCtx.reload;

  if (!detail) {
    return <div style={{ padding: 24 }}>Keine Daten</div>;
  }

  // ✅ TS-SICHER: ID EINMAL FESTHALTEN
  const installationId = detail.id;

  const isAdmin =
    ["admin", "mitarbeiter"].includes((user?.role || "").toLowerCase());

  const rawData = (detail as any).rawData;
  const wizard = rawData ? JSON.parse(rawData) : {};

  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    customer: wizard.customer || {},
    location: wizard.location || {},
    inverter: wizard.technical?.inverter || {},
  });

  function set(path: string[], value: any) {
    setForm((p: any) => {
      const copy = structuredClone(p);
      let ref = copy;
      for (let i = 0; i < path.length - 1; i++) {
        ref[path[i]] ||= {};
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = value;
      return copy;
    });
  }

  async function save() {
    if (!isAdmin) return;

    setSaving(true);
    try {
      await apiPatch(`/installations/${installationId}`, {
        rawData: JSON.stringify({
          ...wizard,
          customer: form.customer,
          location: form.location,
          technical: {
            ...wizard.technical,
            inverter: form.inverter,
          },
        }),
        customerName:
          `${form.customer.firstName || ""} ${form.customer.lastName || ""}`.trim(),
        location:
          `${form.location.siteAddress?.street || ""} ${form.location.siteAddress?.houseNumber || ""}, ${form.location.siteAddress?.zip || ""} ${form.location.siteAddress?.city || ""}`.trim(),
      });

      await reload();
      setEdit(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Daten</h2>
        {isAdmin && (
          <button className="btn-ghost" onClick={() => setEdit(!edit)}>
            {edit ? "Abbrechen" : "Bearbeiten"}
          </button>
        )}
      </div>

      <Section title="Betreiber & Kunde" icon="👤">
        <Tile label="Vorname" value={form.customer.firstName} edit={edit}
          onChange={(v: string) => set(["customer", "firstName"], v)} />
        <Tile label="Nachname" value={form.customer.lastName} edit={edit}
          onChange={(v: string) => set(["customer", "lastName"], v)} />
        <Tile label="E-Mail" value={form.customer.email} edit={edit}
          onChange={(v: string) => set(["customer", "email"], v)} />
        <Tile label="Telefon" value={form.customer.phone} edit={edit}
          onChange={(v: string) => set(["customer", "phone"], v)} />
      </Section>

      <Section title="Standort" icon="📍">
        <Tile label="Straße" value={form.location.siteAddress?.street} edit={edit}
          onChange={(v: string) => set(["location", "siteAddress", "street"], v)} />
        <Tile label="Hausnummer" value={form.location.siteAddress?.houseNumber} edit={edit}
          onChange={(v: string) => set(["location", "siteAddress", "houseNumber"], v)} />
        <Tile label="PLZ" value={form.location.siteAddress?.zip} edit={edit}
          onChange={(v: string) => set(["location", "siteAddress", "zip"], v)} />
        <Tile label="Ort" value={form.location.siteAddress?.city} edit={edit}
          onChange={(v: string) => set(["location", "siteAddress", "city"], v)} />
      </Section>

      <Section title="Wechselrichter" icon="🔌">
        <Tile label="Hersteller" value={form.inverter.manufacturer} edit={edit}
          onChange={(v: string) => set(["inverter", "manufacturer"], v)} />
        <Tile label="Modell" value={form.inverter.model} edit={edit}
          onChange={(v: string) => set(["inverter", "model"], v)} />
        <Tile label="Leistung (kW)" value={form.inverter.acPowerKw} edit={edit}
          onChange={(v: string) => set(["inverter", "acPowerKw"], v)} />
      </Section>

      {edit && isAdmin && (
        <button className="btn-primary" disabled={saving} onClick={save}>
          {saving ? "Speichern…" : "Änderungen speichern"}
        </button>
      )}
    </div>
  );
}
