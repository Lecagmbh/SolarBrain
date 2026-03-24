/**
 * NB-DATEN KOPIEREN MODAL
 * Dark-theme modal matching DashboardV2 design system.
 * All NB registration data in one copyable popup.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  MapPin, User, Gauge, Sun, Zap, Battery, Car, FileText,
  ClipboardList, Copy, Check, ChevronDown, ChevronRight, X,
  CheckCircle, XCircle, Download,
} from "lucide-react";
import { C, FONT, MONO, formatDate, DOC_CATEGORIES } from "../constants";
import type { DashboardInstallation, NormalizedWizardData } from "../constants";

/* ── Types ── */

interface NbDataModalProps {
  data: DashboardInstallation;
  wiz: NormalizedWizardData;
  onClose: () => void;
}

/* ── Copy Hook ── */

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((prev) => (prev === id ? null : prev)), 1800);
  }, []);
  return { copied, copy };
}

/* ── Helpers ── */

const sv = (val: unknown): string =>
  val != null && val !== "" ? String(val) : "";

const line = (label: string, value: unknown): string => {
  const s = sv(value);
  return s ? `${label}: ${s}` : "";
};

/* ── CopyField ── */

function CopyField({
  label, value, copyFn, copiedId,
}: {
  label: string;
  value?: string | number | null;
  copyFn: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const display = sv(value);
  if (!display) return null;
  const id = `${label}-${display}`;
  const isCopied = copiedId === id;

  return (
    <div
      onClick={() => copyFn(display, id)}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 10px", borderRadius: 6, cursor: "pointer",
        transition: "all 0.15s",
        background: isCopied ? `${C.ok}15` : "transparent",
        border: `1px solid ${isCopied ? `${C.ok}40` : "transparent"}`,
        fontFamily: FONT,
      }}
      onMouseEnter={(e) => { if (!isCopied) e.currentTarget.style.background = C.acG; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isCopied ? `${C.ok}15` : "transparent"; }}
    >
      <div>
        <div style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 13, color: isCopied ? C.ok : C.t, fontWeight: 500, fontFamily: MONO, letterSpacing: "-0.01em" }}>
          {isCopied ? "✓ Kopiert" : display}
        </div>
      </div>
      {isCopied ? <Check size={14} color={C.ok} /> : <Copy size={13} color={C.t3} />}
    </div>
  );
}

/* ── Section ── */

function Section({
  title, icon: Icon, color, sectionKey, children, copyFn, copiedId, buildText,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  sectionKey: string;
  children: React.ReactNode;
  copyFn: (text: string, id: string) => void;
  copiedId: string | null;
  buildText: () => string;
}) {
  const [open, setOpen] = useState(true);
  const sectionCopied = copiedId === `section-${sectionKey}`;

  return (
    <div style={{ border: `1px solid ${C.bd}`, borderRadius: 10, overflow: "hidden", marginBottom: 10, background: C.s2 }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: C.s1,
          borderBottom: open ? `1px solid ${C.bd}` : "none", cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: `${color}18`, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={14} color={color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.t, fontFamily: FONT }}>{title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); copyFn(buildText(), `section-${sectionKey}`); }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px", borderRadius: 5,
              border: `1px solid ${sectionCopied ? `${C.ok}40` : C.bd}`,
              background: sectionCopied ? `${C.ok}15` : C.s3,
              color: sectionCopied ? C.ok : C.t3,
              fontSize: 11, fontWeight: 500, cursor: "pointer",
              transition: "all 0.15s", fontFamily: FONT,
            }}
          >
            {sectionCopied ? <><Check size={11} /> Kopiert</> : <><Copy size={11} /> Kopieren</>}
          </button>
          {open ? <ChevronDown size={16} color={C.t3} /> : <ChevronRight size={16} color={C.t3} />}
        </div>
      </div>
      {open && <div style={{ padding: "8px 10px" }}>{children}</div>}
    </div>
  );
}

/* ── ComponentRow ── */

function ComponentRow({
  items, fields, copyFn, copiedId,
}: {
  items: any[];
  fields: [string, string][];
  copyFn: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  return (
    <>
      {items.map((item: any, i: number) => (
        <div key={i} style={{
          padding: "8px 10px",
          background: i % 2 === 0 ? C.s1 : "transparent",
          borderRadius: 6, marginBottom: 4,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 4 }}>
            {fields.map(([key, label]) => (
              <CopyField key={`${i}-${key}`} label={label} value={item[key]} copyFn={copyFn} copiedId={copiedId} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ── DokStatus ── */

interface DokFile {
  id: number;
  originalName?: string;
  dateiname?: string;
  url?: string;
}

function DokStatus({ label, vorhanden, files }: { label: string; vorhanden: boolean; files: DokFile[] }) {
  const handleDownload = (file: DokFile, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = file.url || `/api/documents/${file.id}/download`;
    window.open(url, "_blank");
  };

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      padding: "7px 10px", borderRadius: 6, fontFamily: FONT,
      background: vorhanden ? `${C.ok}08` : "transparent",
    }}>
      {vorhanden
        ? <CheckCircle size={15} color={C.ok} style={{ flexShrink: 0, marginTop: 1 }} />
        : <XCircle size={15} color={C.er} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: vorhanden ? C.t : C.er }}>
          {label}
        </span>
        {vorhanden && files.length > 0 && (
          <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {files.map((file) => (
              <button
                key={file.id}
                onClick={(e) => handleDownload(file, e)}
                title={file.originalName || file.dateiname || `Dokument ${file.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 4,
                  border: `1px solid ${C.bd}`, background: C.s1,
                  color: C.ac, fontSize: 11, fontFamily: MONO,
                  cursor: "pointer", transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.s3; e.currentTarget.style.borderColor = `${C.ac}60`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.s1; e.currentTarget.style.borderColor = C.bd; }}
              >
                <Download size={10} style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                  {file.originalName || file.dateiname || `Dokument ${file.id}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Text Builders ── */

function buildStandortText(data: DashboardInstallation, wiz: NormalizedWizardData): string {
  return [
    line("Straße", wiz.location.street || data.strasse),
    line("Hausnummer", wiz.location.houseNumber || data.hausNr),
    line("PLZ", wiz.location.zip || data.plz),
    line("Ort", wiz.location.city || data.ort),
    line("Bundesland", wiz.location.bundesland),
    line("Flurstück", wiz.location.flurstueck),
    line("Gemarkung", wiz.location.gemarkung),
  ].filter(Boolean).join("\n");
}

function buildBetreiberText(data: DashboardInstallation, wiz: NormalizedWizardData): string {
  const nbEmail = `${data.publicId?.toLowerCase() || "unknown"}@baunity.de`;
  return [
    line("Anrede", wiz.customer?.salutation),
    line("Vorname", wiz.customer?.firstName),
    line("Nachname", wiz.customer?.lastName),
    wiz.customer?.company ? line("Firma", wiz.customer.company) : "",
    line("E-Mail (NB)", nbEmail),
    line("E-Mail (privat)", wiz.customer?.email || data.contactEmail),
    line("Telefon", wiz.customer?.phone || data.contactPhone),
    line("Geburtsdatum", wiz.customer?.birthDate ? formatDate(wiz.customer.birthDate) : ""),
  ].filter(Boolean).join("\n");
}

function buildZaehlerText(data: DashboardInstallation, wiz: NormalizedWizardData): string {
  return [
    line("Zählernummer", wiz.meter.number || data.zaehlernummer),
    line("Zählpunkt", wiz.meter.zaehlpunkt),
    line("MaLo-ID", wiz.meter.marktlokation),
    line("Typ", wiz.meter.type),
    line("Standort", wiz.meter.location),
  ].filter(Boolean).join("\n");
}

function buildPvText(wiz: NormalizedWizardData): string {
  const lines = wiz.pvEntries.map((pv: any, i: number) => {
    const parts = [
      pv.roofName ? `Dachfläche: ${pv.roofName}` : "",
      `Hersteller: ${pv.manufacturer || "—"}`,
      `Modell: ${pv.model || "—"}`,
      pv.powerWp ? `Leistung: ${pv.powerWp} Wp` : "",
      pv.count ? `Anzahl: ${pv.count}` : "",
      pv.orientation ? `Ausrichtung: ${pv.orientation}` : "",
      pv.tilt != null ? `Neigung: ${pv.tilt}°` : "",
    ].filter(Boolean).join("\n");
    return wiz.pvEntries.length > 1 ? `#${i + 1}\n${parts}` : parts;
  }).join("\n\n");
  const totalModules = wiz.pvEntries.reduce((s: number, p: any) => s + (p.count || 0), 0);
  const totalWp = wiz.pvEntries.reduce((s: number, p: any) => s + ((p.powerWp || 0) * (p.count || 0)), 0);
  return `${lines}\nGesamt: ${totalModules} Module, ${totalWp} Wp (${(totalWp / 1000).toFixed(2)} kWp)`;
}

function buildWrText(wiz: NormalizedWizardData): string {
  return wiz.inverterEntries.map((inv: any, i: number) => {
    const parts = [
      `Hersteller: ${inv.manufacturer || "—"}`,
      `Modell: ${inv.model || "—"}`,
      inv.powerKw ? `Leistung: ${inv.powerKw} kW` : "",
      inv.powerKva ? `Scheinleistung: ${inv.powerKva} kVA` : "",
      inv.zerezId ? `ZEREZ-ID: ${inv.zerezId}` : "",
      inv.count ? `Anzahl: ${inv.count}` : "",
    ].filter(Boolean).join("\n");
    return wiz.inverterEntries.length > 1 ? `#${i + 1}\n${parts}` : parts;
  }).join("\n\n");
}

function buildSpeicherText(wiz: NormalizedWizardData): string {
  return wiz.batteryEntries.map((bat: any, i: number) => {
    const parts = [
      `Hersteller: ${bat.manufacturer || "—"}`,
      `Modell: ${bat.model || "—"}`,
      bat.capacityKwh ? `Kapazität: ${bat.capacityKwh} kWh` : "",
      bat.powerKw ? `Leistung: ${bat.powerKw} kW` : "",
      bat.coupling ? `Kopplung: ${bat.coupling}` : "",
    ].filter(Boolean).join("\n");
    return wiz.batteryEntries.length > 1 ? `#${i + 1}\n${parts}` : parts;
  }).join("\n\n");
}

function buildWallboxText(wiz: NormalizedWizardData): string {
  if (wiz.wallboxEntries.length === 0) return "Keine Wallbox vorhanden";
  return wiz.wallboxEntries.map((wb: any) => [
    `Hersteller: ${wb.manufacturer || "—"}`,
    `Modell: ${wb.model || "—"}`,
    wb.powerKw ? `Leistung: ${wb.powerKw} kW` : "",
    wb.controllable14a != null ? `§14a EnWG: ${wb.controllable14a ? "Ja — steuerbar" : "Nein"}` : "",
  ].filter(Boolean).join("\n")).join("\n\n");
}

function buildDokText(docs: DashboardInstallation["documents"]): string {
  const DOK_CATS: [string, string][] = [
    ["lageplan", "Lageplan"],
    ["schaltplan", "Übersichtsschaltplan"],
    ["datenblatt_module", "Datenblatt Module"],
    ["datenblatt_wechselrichter", "Datenblatt WR"],
    ["datenblatt_speicher", "Datenblatt Speicher"],
  ];
  return DOK_CATS.map(([cat, label]) => {
    const count = (docs || []).filter((d) => {
      const k = (d.kategorie || "").toLowerCase();
      const dt = (d.dokumentTyp || "").toLowerCase();
      return k === cat || dt === cat;
    }).length;
    return `${count > 0 ? "✓" : "✗"} ${label}${count > 1 ? ` (${count})` : ""}`;
  }).join("\n");
}

/* ── Main Component ── */

export function NbDataModal({ data, wiz, onClose }: NbDataModalProps) {
  const { copied, copy } = useCopy();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Derived values
  const nbEmail = `${data.publicId?.toLowerCase() || "unknown"}@baunity.de`;
  const street = wiz.location.street || data.strasse || "";
  const houseNr = wiz.location.houseNumber || data.hausNr || "";
  const zip = wiz.location.zip || data.plz || "";
  const city = wiz.location.city || data.ort || "";
  const kwp = wiz.technical.totalPvKwp || data.totalKwp;

  const totalModules = wiz.pvEntries.reduce((s: number, p: any) => s + (p.count || 0), 0);
  const totalWp = wiz.pvEntries.reduce((s: number, p: any) => s + ((p.powerWp || 0) * (p.count || 0)), 0);
  const gesamtKwp = (totalWp / 1000).toFixed(2);

  // Document matching from actual documents array
  // Backend sends kategorie in UPPERCASE (Prisma enum: LAGEPLAN, SCHALTPLAN, DATENBLATT)
  // Specific types (datenblatt_module etc.) are in dokumentTyp field
  const docs = data.documents || [];
  const dokMatch = (cat: string) => docs.filter((d) => {
    const k = (d.kategorie || "").toLowerCase();
    const dt = (d.dokumentTyp || "").toLowerCase();
    return k === cat || dt === cat;
  });
  const dokCount = (cat: string) => dokMatch(cat).length;

  // Build full text
  const buildFullText = useCallback(() => {
    const sep = "\n\n─────────────────────────\n\n";
    return [
      "Standort / Adresse\n" + buildStandortText(data, wiz),
      "Anlagenbetreiber\n" + buildBetreiberText(data, wiz),
      "Zähler\n" + buildZaehlerText(data, wiz),
      wiz.pvEntries.length > 0 ? "PV-Module\n" + buildPvText(wiz) : "",
      wiz.inverterEntries.length > 0 ? "Wechselrichter\n" + buildWrText(wiz) : "",
      wiz.batteryEntries.length > 0 ? "Speicher\n" + buildSpeicherText(wiz) : "",
      "Wallbox\n" + buildWallboxText(wiz),
      "Dokumente\n" + buildDokText(data.documents),
    ].filter(Boolean).join(sep);
  }, [data, wiz]);

  const allCopied = copied === "all";

  // Map wiz entries for ComponentRow
  const pvItems = wiz.pvEntries.map((pv: any) => ({
    hersteller: pv.manufacturer, modell: pv.model,
    leistungWp: pv.powerWp ? `${pv.powerWp}` : "",
    anzahl: pv.count ? `${pv.count}` : "",
    ausrichtung: pv.orientation, neigung: pv.tilt != null ? `${pv.tilt}°` : "",
  }));
  const wrItems = wiz.inverterEntries.map((inv: any) => ({
    hersteller: inv.manufacturer, modell: inv.model,
    leistungKw: inv.powerKw ? `${inv.powerKw}` : "",
    leistungKva: inv.powerKva ? `${inv.powerKva}` : "",
    zerezId: inv.zerezId, anzahl: inv.count ? `${inv.count}` : "",
  }));
  const batItems = wiz.batteryEntries.map((bat: any) => ({
    hersteller: bat.manufacturer, modell: bat.model,
    kapazitaetKwh: bat.capacityKwh ? `${bat.capacityKwh}` : "",
    leistungKw: bat.powerKw ? `${bat.powerKw}` : "",
    kopplung: bat.coupling ? bat.coupling.toUpperCase() : "",
  }));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 2000 }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 820, maxWidth: "95vw", maxHeight: "90vh",
        background: C.bg, border: `1px solid ${C.ba}`,
        borderRadius: 14, zIndex: 2001,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: FONT,
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${C.bd}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0, background: C.s1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.ac}, ${C.bl})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ClipboardList size={16} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.t, margin: 0, fontFamily: FONT }}>NB-Daten kopieren</h2>
              <div style={{ fontSize: 12, color: C.t3, fontFamily: FONT }}>
                {`${street} ${houseNr}`.trim()}, {`${zip} ${city}`.trim()}
                {kwp ? ` · ${Number(kwp).toFixed(2)} kWp` : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => copy(buildFullText(), "all")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 16px", borderRadius: 7, border: "none",
                background: allCopied ? C.ok : C.ac,
                color: "#fff", fontSize: 12.5, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s", fontFamily: FONT,
              }}
            >
              {allCopied ? <><Check size={14} /> Alles kopiert!</> : <><Copy size={14} /> Alles kopieren</>}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.t3 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>

          {/* 1. Standort */}
          <Section title="Standort / Adresse" icon={MapPin} color="#3B82F6" sectionKey="standort" copyFn={copy} copiedId={copied} buildText={() => buildStandortText(data, wiz)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <CopyField label="Straße" value={street} copyFn={copy} copiedId={copied} />
              <CopyField label="Hausnummer" value={houseNr} copyFn={copy} copiedId={copied} />
              <CopyField label="PLZ" value={zip} copyFn={copy} copiedId={copied} />
              <CopyField label="Ort" value={city} copyFn={copy} copiedId={copied} />
              <CopyField label="Bundesland" value={wiz.location.bundesland} copyFn={copy} copiedId={copied} />
              <CopyField label="Flurstück" value={wiz.location.flurstueck} copyFn={copy} copiedId={copied} />
              <CopyField label="Gemarkung" value={wiz.location.gemarkung} copyFn={copy} copiedId={copied} />
            </div>
          </Section>

          {/* 2. Anlagenbetreiber */}
          <Section title="Anlagenbetreiber" icon={User} color="#8B5CF6" sectionKey="betreiber" copyFn={copy} copiedId={copied} buildText={() => buildBetreiberText(data, wiz)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <CopyField label="Anrede" value={wiz.customer?.salutation} copyFn={copy} copiedId={copied} />
              <CopyField label="Vorname" value={wiz.customer?.firstName} copyFn={copy} copiedId={copied} />
              <CopyField label="Nachname" value={wiz.customer?.lastName} copyFn={copy} copiedId={copied} />
              <CopyField label="Firma" value={wiz.customer?.company} copyFn={copy} copiedId={copied} />
              <CopyField label="E-Mail (NB)" value={nbEmail} copyFn={copy} copiedId={copied} />
              <CopyField label="E-Mail (privat)" value={wiz.customer?.email || data.contactEmail} copyFn={copy} copiedId={copied} />
              <CopyField label="Telefon" value={wiz.customer?.phone || data.contactPhone} copyFn={copy} copiedId={copied} />
              <CopyField label="Geburtsdatum" value={wiz.customer?.birthDate ? formatDate(wiz.customer.birthDate) : undefined} copyFn={copy} copiedId={copied} />
            </div>
          </Section>

          {/* 3. Zähler */}
          <Section title="Zähler" icon={Gauge} color="#F59E0B" sectionKey="zaehler" copyFn={copy} copiedId={copied} buildText={() => buildZaehlerText(data, wiz)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <CopyField label="Zählernummer" value={wiz.meter.number || data.zaehlernummer} copyFn={copy} copiedId={copied} />
              <CopyField label="Zählpunkt" value={wiz.meter.zaehlpunkt} copyFn={copy} copiedId={copied} />
              <CopyField label="MaLo-ID" value={wiz.meter.marktlokation} copyFn={copy} copiedId={copied} />
              <CopyField label="Typ" value={wiz.meter.type} copyFn={copy} copiedId={copied} />
              <CopyField label="Standort" value={wiz.meter.location} copyFn={copy} copiedId={copied} />
            </div>
          </Section>

          {/* 4. PV-Module */}
          {wiz.pvEntries.length > 0 && (
            <Section title={`PV-Module — ${gesamtKwp} kWp gesamt`} icon={Sun} color="#F97316" sectionKey="pv" copyFn={copy} copiedId={copied} buildText={() => buildPvText(wiz)}>
              <ComponentRow
                items={pvItems}
                fields={[
                  ["hersteller", "Hersteller"], ["modell", "Modell"], ["leistungWp", "Leistung (Wp)"],
                  ["anzahl", "Anzahl"], ["ausrichtung", "Ausrichtung"], ["neigung", "Neigung (°)"],
                ]}
                copyFn={copy} copiedId={copied}
              />
              <div style={{
                padding: "6px 10px", marginTop: 4, borderRadius: 6,
                background: `${C.wr}15`, border: `1px solid ${C.wr}30`,
                fontSize: 12.5, fontWeight: 600, color: C.wr, fontFamily: MONO,
              }}>
                Gesamt: {totalModules} Module · {totalWp.toLocaleString("de-DE")} Wp · {gesamtKwp} kWp
              </div>
            </Section>
          )}

          {/* 5. Wechselrichter */}
          {wiz.inverterEntries.length > 0 && (
            <Section title="Wechselrichter" icon={Zap} color="#10B981" sectionKey="wr" copyFn={copy} copiedId={copied} buildText={() => buildWrText(wiz)}>
              <ComponentRow
                items={wrItems}
                fields={[
                  ["hersteller", "Hersteller"], ["modell", "Modell"], ["leistungKw", "Leistung (kW)"],
                  ["leistungKva", "Leistung (kVA)"], ["zerezId", "ZEREZ-ID"], ["anzahl", "Anzahl"],
                ]}
                copyFn={copy} copiedId={copied}
              />
            </Section>
          )}

          {/* 6. Speicher */}
          {wiz.batteryEntries.length > 0 && (
            <Section title="Speicher" icon={Battery} color="#6366F1" sectionKey="speicher" copyFn={copy} copiedId={copied} buildText={() => buildSpeicherText(wiz)}>
              <ComponentRow
                items={batItems}
                fields={[
                  ["hersteller", "Hersteller"], ["modell", "Modell"], ["kapazitaetKwh", "Kapazität (kWh)"],
                  ["leistungKw", "Leistung (kW)"], ["kopplung", "Kopplung"],
                ]}
                copyFn={copy} copiedId={copied}
              />
            </Section>
          )}

          {/* 7. Wallbox */}
          <Section title="Wallbox" icon={Car} color="#EC4899" sectionKey="wallbox" copyFn={copy} copiedId={copied} buildText={() => buildWallboxText(wiz)}>
            {wiz.wallboxEntries.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {wiz.wallboxEntries.map((wb: any, i: number) => (
                  <React.Fragment key={i}>
                    <CopyField label="Hersteller" value={wb.manufacturer} copyFn={copy} copiedId={copied} />
                    <CopyField label="Modell" value={wb.model} copyFn={copy} copiedId={copied} />
                    <CopyField label="Leistung (kW)" value={wb.powerKw} copyFn={copy} copiedId={copied} />
                    <CopyField label="§14a EnWG" value={wb.controllable14a != null ? (wb.controllable14a ? "Ja — steuerbar" : "Nein") : undefined} copyFn={copy} copiedId={copied} />
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div style={{ padding: "12px 10px", fontSize: 13, color: C.t3, fontFamily: FONT }}>Keine Wallbox vorhanden</div>
            )}
          </Section>

          {/* 8. Dokumente — aus data.documents geladen, mit Download */}
          <Section title="Dokumente" icon={FileText} color="#6B7280" sectionKey="dokumente" copyFn={copy} copiedId={copied} buildText={() => buildDokText(data.documents)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <DokStatus label="Lageplan" vorhanden={dokCount("lageplan") > 0} files={dokMatch("lageplan")} />
              <DokStatus label="Übersichtsschaltplan" vorhanden={dokCount("schaltplan") > 0} files={dokMatch("schaltplan")} />
              <DokStatus label="Datenblatt Module" vorhanden={dokCount("datenblatt_module") > 0} files={dokMatch("datenblatt_module")} />
              <DokStatus label="Datenblatt WR" vorhanden={dokCount("datenblatt_wechselrichter") > 0} files={dokMatch("datenblatt_wechselrichter")} />
              <DokStatus label="Datenblatt Speicher" vorhanden={dokCount("datenblatt_speicher") > 0} files={dokMatch("datenblatt_speicher")} />
            </div>
          </Section>

        </div>
      </div>
    </>
  );
}
