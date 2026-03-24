/**
 * Installations-Übersicht — Zeigt ALLE Wizard-Daten im Premium-Layout
 * Bekommt die komplette API-Response als `data` prop.
 * Jedes im Wizard ausfüllbare Feld wird hier abgebildet.
 */
import { useState, useCallback } from "react";
import EditableField from "./EditableField";

const S = {
  card: { background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.08)", borderRadius: 12, overflow: "hidden" as const },
  head: { padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  headT: { fontSize: 12, fontWeight: 700 as const, color: "#e2e8f0", letterSpacing: 0.3 },
  body: { padding: "12px 14px" },
  row: { display: "flex" as const, justifyContent: "space-between" as const, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" },
  label: { fontSize: 11, color: "#64748b" },
  value: { fontSize: 12, color: "#e2e8f0", fontWeight: 500 as const, textAlign: "right" as const } as React.CSSProperties,
  mono: { fontFamily: "monospace", fontSize: 11, color: "#a5b4fc" },
  badge: (bg: string, c: string) => ({ fontSize: 10, fontWeight: 600 as const, padding: "3px 8px", borderRadius: 4, background: bg, color: c }),
  tag: (c: string) => ({ fontSize: 9, fontWeight: 600 as const, padding: "2px 6px", borderRadius: 3, background: c + "15", color: c, display: "inline-block" as const, marginRight: 4, marginBottom: 2 }),
  statBox: (c: string) => ({ flex: 1, background: c + "08", borderRadius: 10, padding: "12px 8px", textAlign: "center" as const }),
  statNum: (c: string) => ({ fontSize: 28, fontWeight: 800 as const, color: c, letterSpacing: -1 }),
  statUnit: (c: string) => ({ fontSize: 10, color: c, opacity: 0.7, fontWeight: 600 as const }),
  statLabel: { fontSize: 9, color: "#64748b", marginTop: 2 },
  compHead: (c: string) => ({ fontSize: 9, color: c, fontWeight: 700 as const, marginBottom: 3, textTransform: "uppercase" as const }),
  detail: { fontSize: 10, color: "#64748b", marginTop: 2 },
  sep: { height: 1, background: "rgba(255,255,255,0.04)", margin: "8px 0" },
};

const n2 = (v: any): string => {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return isNaN(n) ? String(v) : n % 1 === 0 ? String(n) : n.toFixed(2);
};

function CopyField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div style={{ ...S.row, cursor: "pointer" }} onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      <span style={S.label}>{label}</span>
      <span style={mono ? S.mono : S.value}>{copied ? "✓ Kopiert" : value}</span>
    </div>
  );
}

function BoolField({ label, value, color = "#22c55e" }: { label: string; value?: boolean | null; color?: string }) {
  if (value === null || value === undefined) return null;
  return <div style={{ fontSize: 10, color: value ? color : "#64748b", marginTop: 2 }}>{value ? "✓" : "✗"} {label}</div>;
}

interface Props { data: any; onTabChange: (tab: string) => void; isStaff?: boolean; onFieldSave?: (field: string, value: string) => Promise<void> }

export default function InstallationUebersicht({ data: d, onTabChange, isStaff = false, onFieldSave }: Props) {
  // Nutzt die spezialisierten Endpoints
  const saveField = useCallback(async (field: string, value: string) => {
    if (onFieldSave) {
      await onFieldSave(field, value);
      return;
    }
    const token = localStorage.getItem("baunity_token") || "";
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const opts = { headers, credentials: "include" as const };

    // NB-Felder → /nb-tracking Endpoint (akzeptiert nbCaseNumber, nbEmail, zaehlernummer, etc.)
    if (field === "nbCaseNumber" || field === "nbEmail" || field === "zaehlernummer") {
      await fetch(`/api/installations/${d.id}/nb-tracking`, { ...opts, method: "PATCH", body: JSON.stringify({ [field]: value }) });
    } else if (field === "contactEmail" || field === "contactPhone") {
      // Kundendaten → /customer Endpoint
      const body = field === "contactEmail" ? { email: value } : { telefon: value };
      await fetch(`/api/installations/${d.id}/customer`, { ...opts, method: "PATCH", body: JSON.stringify(body) });
    }
  }, [d.id, onFieldSave]);
  const td = d.technicalDetails || d.technicalData || {};
  const et = d.extendedTechnical || {};
  const cust = d.customer || {};
  const wc = typeof d.wizardContext === "string" ? (() => { try { return JSON.parse(d.wizardContext); } catch { return {}; }})() : (d.wizardContext || {});
  const wcTech = wc.technical || {};
  const meter = wc.meter || {};
  const ownership = wc.ownership || {};
  const commission = wc.commissioning || {};
  const auth = wc.authorization || {};
  const wcCustomer = wc.customer || {};
  const wcLocation = wc.location?.siteAddress || {};
  const gridConn = wc.gridConnection || {};
  const opMode = wcTech.operationMode || et.operationMode || {};
  const feedMgmt = wcTech.feedInManagement || et.feedInManagement || {};
  const reactComp = wcTech.reactiveCompensation || {};

  // Technische Arrays — bevorzuge wizardContext, dann technicalDetails, dann technicalData direkt
  const pvs = wcTech.pvEntries || td.dachflaechen || td.pvEntries || [];
  const wrs = wcTech.inverterEntries || td.wechselrichter || td.inverterEntries || [];
  const bats = wcTech.batteryEntries || td.speicher || td.storageEntries || [];
  const wbs = wcTech.wallboxEntries || td.wallboxen || [];
  const hps = wcTech.heatpumpEntries || td.waermepumpen || [];

  const docsTotal = (d.documents || []).length;
  const pflichtKats = ["LAGEPLAN", "SCHALTPLAN", "ANTRAG"];
  const pflichtOk = pflichtKats.filter(k => (d.documents || []).some((doc: any) => doc.kategorie === k)).length;

  const CASE_LABELS: Record<string, string> = { einspeiser: "Einspeiser", netzanschluss: "Netzanschluss", speicher: "Speicher", balkonkraftwerk: "Balkonkraftwerk" };
  const PROCESS_LABELS: Record<string, string> = { neuanmeldung: "Neuanmeldung", erweiterung: "Erweiterung", aenderung: "Änderung", abbau: "Abbau/Demontage" };
  const TARGETS: Record<string, string> = { pv: "PV", speicher: "Speicher", wallbox: "Wallbox", waermepumpe: "Wärmepumpe", bhkw: "BHKW", wind: "Wind" };

  return (
    <div>
      {/* Anlagentyp Banner */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={S.badge("rgba(212,168,67,0.12)", "#EAD068")}>{CASE_LABELS[d.caseType] || d.caseType || "—"}</span>
        {wc.processType && <span style={S.badge("rgba(34,197,94,0.1)", "#22c55e")}>{PROCESS_LABELS[wc.processType] || wc.processType}</span>}
        {(wc.registrationTargets || []).map((t: string) => <span key={t} style={S.tag("#D4A843")}>{TARGETS[t] || t}</span>)}
        {d.publicId && <span style={{ ...S.mono, marginLeft: "auto" }}>{d.publicId}</span>}
        {d.dedicatedEmail && <span style={{ ...S.mono, fontSize: 10 }}>📧 {d.dedicatedEmail}</span>}
      </div>

      {/* Anlage Gesamt-Stats */}
      {(() => {
        const crmTypen = d.crmProjekt?.anlagenTypen || [];
        const isSpeicherOnly = crmTypen.includes("GROSSSPEICHER") || crmTypen.includes("SCHWARMSPEICHER") || crmTypen.includes("SPEICHER") || (d.caseType === "speicher" && !Number(d.totalKwp));
        const pvLabel = isSpeicherOnly ? "Speicher-Leistung" : "PV-Leistung";
        const pvUnit = isSpeicherOnly ? "kW" : "kWp";
        return null; // Wird unten gerendert
      })()}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        {(() => {
          const crmTypen = d.crmProjekt?.anlagenTypen || [];
          const isSpeicherOnly = crmTypen.includes("GROSSSPEICHER") || crmTypen.includes("SCHWARMSPEICHER") || crmTypen.includes("SPEICHER") || d.caseType === "speicher";
          const hasPv = Number(d.totalKwp) > 0 && !isSpeicherOnly;
          const hasSpeicher = Number(d.speicherKwh) > 0 || isSpeicherOnly;
          return (<>
            {hasPv && <div style={{ ...S.statBox("#22c55e"), ...S.card, padding: "16px 12px" }}><div style={S.statNum("#22c55e")}>{n2(d.totalKwp) || "—"}</div><div style={S.statUnit("#22c55e")}>kWp</div><div style={S.statLabel}>PV-Leistung</div></div>}
            {isSpeicherOnly && <div style={{ ...S.statBox("#f0d878"), ...S.card, padding: "16px 12px" }}><div style={S.statNum("#f0d878")}>{n2(d.totalKwp || d.speicherKwh) || "—"}</div><div style={S.statUnit("#f0d878")}>{Number(d.totalKwp) >= 100 ? "kW" : "kWh"}</div><div style={S.statLabel}>Speicher-Leistung</div></div>}
            {!isSpeicherOnly && <div style={{ ...S.statBox("#06b6d4"), ...S.card, padding: "16px 12px" }}><div style={S.statNum("#06b6d4")}>{n2(et.totalInverterKva || wcTech.totalInverterKva) || "—"}</div><div style={S.statUnit("#06b6d4")}>kVA</div><div style={S.statLabel}>Wechselrichter</div></div>}
            {hasSpeicher && !isSpeicherOnly && Number(d.speicherKwh) > 0 && <div style={{ ...S.statBox("#f0d878"), ...S.card, padding: "16px 12px" }}><div style={S.statNum("#f0d878")}>{n2(d.speicherKwh)}</div><div style={S.statUnit("#f0d878")}>kWh</div><div style={S.statLabel}>Speicher</div></div>}
          </>);
        })()}
        {Number(d.wallboxKw) > 0 && <div style={{ ...S.statBox("#f59e0b"), ...S.card, padding: "16px 12px" }}><div style={S.statNum("#f59e0b")}>{n2(d.wallboxKw)}</div><div style={S.statUnit("#f59e0b")}>kW</div><div style={S.statLabel}>Wallbox</div></div>}
        {Number(d.waermepumpeKw) > 0 && <div style={{ ...S.statBox("#ef4444"), ...S.card, padding: "16px 12px" }}><div style={S.statNum("#ef4444")}>{n2(d.waermepumpeKw)}</div><div style={S.statUnit("#ef4444")}>kW</div><div style={S.statLabel}>Wärmepumpe</div></div>}
        {/* Einspeiseart + Messkonzept rechts */}
        <div style={{ ...S.card, padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 140 }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Einspeisung</div>
          <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{(et.feedInType || wcTech.feedInType) === "ueberschuss" ? "Überschuss" : (et.feedInType || wcTech.feedInType) === "volleinspeisung" ? "Voll" : (et.feedInType || wcTech.feedInType) || "—"}</div>
          {d.messkonzept && <div style={{ fontSize: 11, color: "#D4A843", fontWeight: 600, marginTop: 2 }}>{d.messkonzept.toUpperCase()}</div>}
          {wcTech.feedInPhases && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{wcTech.feedInPhases}</div>}
        </div>
      </div>

      {/* Komponenten-Karten */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, marginBottom: 10 }}>
        {/* PV-Module — jedes Dach eigene Karte */}
        {pvs.map((pv: any, i: number) => (
          <div key={`pv-${i}`} style={{ ...S.card, borderColor: "rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.03)" }}>
            <div style={{ ...S.head, borderColor: "rgba(34,197,94,0.1)" }}>
              <span style={{ ...S.headT, color: "#22c55e" }}>☀️ PV-Module {pvs.length > 1 ? `— ${pv.roofName || pv.name || `Dach ${i + 1}`}` : ""}</span>
              <span style={S.badge("rgba(34,197,94,0.1)", "#22c55e")}>{n2(((pv.count || pv.modulAnzahl) * (pv.powerWp || pv.modulLeistungWp)) / 1000)} kWp</span>
            </div>
            <div style={S.body}>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{pv.manufacturer || pv.modulHersteller}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{pv.model || pv.modulModell}</div>
              <CopyField label="Anzahl" value={`${pv.count || pv.modulAnzahl}× ${pv.powerWp || pv.modulLeistungWp} Wp`} />
              <CopyField label="Ausrichtung" value={`${pv.orientation || pv.ausrichtung || "—"} ${pv.tilt || pv.neigung ? `${pv.tilt || pv.neigung}°` : ""}`} />
              {pv.shading && pv.shading !== "keine" && <CopyField label="Verschattung" value={pv.shading} />}
              {(pv.stringCount || pv.stringAnzahl) ? <CopyField label="Strings" value={`${pv.stringCount || pv.stringAnzahl} × ${pv.modulesPerString || pv.moduleProString} Module`} /> : null}
            </div>
          </div>
        ))}

        {/* Wechselrichter */}
        {wrs.map((wr: any, i: number) => (
          <div key={`wr-${i}`} style={{ ...S.card, borderColor: "rgba(6,182,212,0.15)", background: "rgba(6,182,212,0.03)" }}>
            <div style={{ ...S.head, borderColor: "rgba(6,182,212,0.1)" }}>
              <span style={{ ...S.headT, color: "#06b6d4" }}>⚡ Wechselrichter {wrs.length > 1 ? `#${i + 1}` : ""}</span>
              {wr.hybrid && <span style={S.badge("rgba(6,182,212,0.1)", "#06b6d4")}>Hybrid</span>}
            </div>
            <div style={S.body}>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{wr.manufacturer || wr.hersteller}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{wr.model || wr.modell}</div>
              <CopyField label="Leistung" value={`${n2(wr.powerKw || wr.leistungKw)} kW / ${n2(wr.powerKva || wr.leistungKva)} kVA`} />
              {(wr.count || wr.anzahl) > 1 && <CopyField label="Anzahl" value={`${wr.count || wr.anzahl}×`} />}
              {(wr.mpptCount || wr.mpptAnzahl) ? <CopyField label="MPP-Tracker" value={String(wr.mpptCount || wr.mpptAnzahl)} /> : null}
              {wr.zerezId && <CopyField label="ZEREZ" value={wr.zerezId} mono />}
            </div>
          </div>
        ))}

        {/* Speicher */}
        {bats.map((sp: any, i: number) => (
          <div key={`bat-${i}`} style={{ ...S.card, borderColor: "rgba(167,139,250,0.15)", background: "rgba(167,139,250,0.03)" }}>
            <div style={{ ...S.head, borderColor: "rgba(167,139,250,0.1)" }}>
              <span style={{ ...S.headT, color: "#f0d878" }}>🔋 Speicher {bats.length > 1 ? `#${i + 1}` : ""}</span>
              <span style={S.badge("rgba(167,139,250,0.1)", "#f0d878")}>{(sp.coupling || sp.kopplung || "").toUpperCase()}</span>
            </div>
            <div style={S.body}>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{sp.manufacturer || sp.hersteller}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{sp.model || sp.modell}</div>
              <CopyField label="Kapazität" value={`${n2(sp.capacityKwh || sp.kapazitaetKwh)} kWh`} />
              {(sp.powerKw || sp.leistungKw) && <CopyField label="Leistung" value={`${n2(sp.powerKw || sp.leistungKw)} kW`} />}
              {(sp.apparentPowerKva || sp.scheinleistungKva) && <CopyField label="Scheinleistung" value={`${n2(sp.apparentPowerKva || sp.scheinleistungKva)} kVA`} />}
              {(sp.ratedCurrentA || sp.bemessungsstromA) && <CopyField label="Bemessungsstrom" value={`${n2(sp.ratedCurrentA || sp.bemessungsstromA)} A`} />}
              {(sp.count || sp.anzahl) > 1 && <CopyField label="Anzahl" value={`${sp.count || sp.anzahl}×`} />}
              <div style={S.sep} />
              <BoolField label="Notstrom" value={sp.emergencyPower ?? sp.notstrom} />
              <BoolField label="Ersatzstrom" value={sp.backupPower ?? sp.ersatzstrom} />
              <BoolField label="Inselnetzbildend" value={sp.islandForming ?? sp.inselnetzBildend} />
              <BoolField label="Allpolige Trennung" value={sp.allPoleSeparation ?? sp.allpoligeTrennung} />
              <BoolField label="NA-Schutz vorhanden" value={sp.naProtectionPresent ?? sp.naSchutzVorhanden} />
              {(sp.connectionPhase || sp.anschlussPhase) && <CopyField label="Anschlussphase" value={sp.connectionPhase || sp.anschlussPhase} />}
              {(sp.inverterManufacturer || sp.umrichterHersteller) && <CopyField label="Umrichter" value={`${sp.inverterManufacturer || sp.umrichterHersteller} ${sp.inverterType || sp.umrichterTyp || ""}`} />}
            </div>
          </div>
        ))}

        {/* Wallboxen */}
        {wbs.map((wb: any, i: number) => (
          <div key={`wb-${i}`} style={{ ...S.card, borderColor: "rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.03)" }}>
            <div style={{ ...S.head, borderColor: "rgba(245,158,11,0.1)" }}>
              <span style={{ ...S.headT, color: "#f59e0b" }}>🔌 Wallbox {wbs.length > 1 ? `#${i + 1}` : ""}</span>
            </div>
            <div style={S.body}>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{wb.manufacturer || wb.hersteller}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{wb.model || wb.modell}</div>
              <CopyField label="Leistung" value={`${n2(wb.powerKw || wb.leistungKw)} kW`} />
              {(wb.phases || wb.phasen) && <CopyField label="Phasen" value={`${wb.phases || wb.phasen}-phasig`} />}
              {(wb.socketType || wb.steckdose) && <CopyField label="Stecker" value={wb.socketType || wb.steckdose} />}
              <BoolField label="§14a steuerbar" value={wb.controllable14a ?? wb.steuerbar14a} color="#f59e0b" />
            </div>
          </div>
        ))}

        {/* Wärmepumpen */}
        {hps.map((hp: any, i: number) => (
          <div key={`hp-${i}`} style={{ ...S.card, borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.03)" }}>
            <div style={{ ...S.head, borderColor: "rgba(239,68,68,0.1)" }}>
              <span style={{ ...S.headT, color: "#ef4444" }}>🌡️ Wärmepumpe {hps.length > 1 ? `#${i + 1}` : ""}</span>
            </div>
            <div style={S.body}>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{hp.manufacturer || hp.hersteller}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{hp.model || hp.modell}</div>
              <CopyField label="Leistung" value={`${n2(hp.powerKw || hp.leistungKw)} kW`} />
              {(hp.type || hp.typ) && <CopyField label="Typ" value={hp.type || hp.typ} />}
              <BoolField label="SG Ready" value={hp.sgReady} color="#ef4444" />
              <BoolField label="§14a steuerbar" value={hp.controllable14a ?? hp.steuerbar14a} color="#ef4444" />
            </div>
          </div>
        ))}
      </div>

      {/* Row: Betreiber | Standort | NB | Zähler — responsive */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10, marginTop: 10 }}>
        {/* Anlagenbetreiber */}
        {(() => {
          const crm = d.crmProjekt;
          const crmAb = crm?.anlagenbetreiber ? (typeof crm.anlagenbetreiber === "string" ? JSON.parse(crm.anlagenbetreiber) : crm.anlagenbetreiber) : null;
          const abAdresse = crmAb?.adresse;
          const abKontakt = crmAb?.kontakt;
          return (
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>👤 Anlagenbetreiber</span>
            <span style={S.badge(d.customerType === "BUSINESS" || crmAb?.typ === "GEWERBE" ? "rgba(212,168,67,0.1)" : "rgba(34,197,94,0.1)", d.customerType === "BUSINESS" || crmAb?.typ === "GEWERBE" ? "#EAD068" : "#22c55e")}>
              {crmAb?.typ === "GEWERBE" || d.customerType === "BUSINESS" ? "Gewerbe" : "Privat"}
            </span>
          </div>
          <div style={S.body}>
            {/* CRM-Betreiberdaten (bevorzugt) */}
            {crmAb ? (
              <>
                {crmAb.firma?.name && <CopyField label="Firma" value={`${crmAb.firma.name}${crmAb.firma.rechtsform ? ` (${crmAb.firma.rechtsform})` : ""}`} />}
                {crmAb.vertreter && <CopyField label="Vertreter" value={crmAb.vertreter} />}
                {abKontakt?.telefon && <CopyField label="Telefon" value={abKontakt.telefon} />}
                {abKontakt?.email && <CopyField label="E-Mail" value={abKontakt.email} />}
                {abAdresse && (
                  <>
                    <div style={S.sep} />
                    <div style={{ fontSize: 9, color: "#D4A843", fontWeight: 700, marginBottom: 2 }}>BETREIBER-ADRESSE</div>
                    <CopyField label="Straße" value={abAdresse.strasse} />
                    {abAdresse.hausnummer && <CopyField label="Hausnr." value={abAdresse.hausnummer} />}
                    <CopyField label="PLZ" value={abAdresse.plz} />
                    <CopyField label="Ort" value={abAdresse.ort} />
                  </>
                )}
              </>
            ) : (
              <>
                {/* Fallback: Wizard/Installation-Daten */}
                {d.customerType === "BUSINESS" ? (
                  <CopyField label="Anlageneigentümer" value={d.customerName || cust.nachname} />
                ) : (
                  <>
                    {(d.salutation || wcCustomer.salutation) && <div style={{ fontSize: 10, color: "#64748b" }}>{(d.salutation || wcCustomer.salutation) === "herr" ? "Herr" : (d.salutation || wcCustomer.salutation) === "frau" ? "Frau" : d.salutation} {d.title || ""}</div>}
                    <CopyField label="Vorname" value={wcCustomer.firstName || cust.vorname} />
                    <CopyField label="Nachname" value={wcCustomer.lastName || cust.nachname} />
                  </>
                )}
                {(cust.firma || wcCustomer.companyName) && <CopyField label="Firma" value={cust.firma || wcCustomer.companyName} />}
                <div style={S.sep} />
                <EditableField label="E-Mail" value={d.contactEmail || wcCustomer.email} onSave={v => saveField("contactEmail", v)} placeholder="email@beispiel.de" />
                <EditableField label="Telefon" value={d.contactPhone || wcCustomer.phone || cust.telefon} onSave={v => saveField("contactPhone", v)} placeholder="+49 170 ..." />
                <CopyField label="Mobil" value={d.mobilePhone || wcCustomer.mobile} />
              </>
            )}
            {/* Gemeinsame Felder */}
            {!crmAb && <CopyField label="Geburtsdatum" value={d.birthDate ? new Date(d.birthDate).toLocaleDateString("de-DE") : (wcCustomer.birthDate || null)} />}
            {isStaff && (d.iban || wcCustomer.iban) && <>
              <div style={S.sep} />
              <CopyField label="IBAN" value={d.iban || wcCustomer.iban} mono />
              <CopyField label="BIC" value={d.bic || wcCustomer.bic} mono />
              <CopyField label="Kontoinhaber" value={d.accountHolder || wcCustomer.accountHolder} />
            </>}
            {d.billingSameAsSite === false && d.billingAddress && (
              <>
                <div style={S.sep} />
                <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, marginBottom: 2 }}>RECHNUNGSADRESSE</div>
                <CopyField label="Straße" value={d.billingAddress.strasse || d.billingAddress.street} />
                <CopyField label="PLZ/Ort" value={`${d.billingAddress.plz || d.billingAddress.zip || ""} ${d.billingAddress.ort || d.billingAddress.city || ""}`} />
              </>
            )}
          </div>
        </div>
          );
        })()}

        {/* Anlagen-Standort (CRM-Standort bevorzugen, dann wizardContext.location, dann Installation-Felder) */}
        {(() => {
          const crm = d.crmProjekt;
          const crmAb = crm?.anlagenbetreiber ? (typeof crm.anlagenbetreiber === "string" ? JSON.parse(crm.anlagenbetreiber) : crm.anlagenbetreiber) : null;
          // Anlagen-Standort: CRM plz/ort (= Projekt-Standort), oder wizardContext.location, oder Installation-Felder
          const siteStrasse = wcLocation.street || wcLocation.strasse || "";
          const siteHausNr = wcLocation.houseNumber || wcLocation.hausnummer || "";
          const sitePlz = crm?.plz || wcLocation.zip || wcLocation.plz || d.plz || "";
          const siteOrt = crm?.ort || wcLocation.city || wcLocation.ort || d.ort || "";
          // Fallback: Wenn CRM-Standort anders als Betreiber-Adresse, CRM bevorzugen
          const betreiberPlz = crmAb?.adresse?.plz || d.plz || "";
          const standortIstAnders = crm && sitePlz !== betreiberPlz;
          const showStrasse = siteStrasse || (standortIstAnders ? "" : d.strasse);
          const showHausNr = siteHausNr || (standortIstAnders ? "" : d.hausNr);
          return (
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>📍 Anlagen-Standort</span>
            {standortIstAnders && <span style={S.badge("rgba(249,115,22,0.1)", "#f97316")}>≠ Betreiber</span>}
          </div>
          <div style={S.body}>
            {/* Grundstückseigentümer aus CRM-Titel */}
            {crm?.titel && <CopyField label="Grundstückseigentümer" value={crm.titel} />}
            {showStrasse && <CopyField label="Straße" value={showStrasse} />}
            {showHausNr && <CopyField label="Hausnr." value={showHausNr} />}
            <CopyField label="PLZ" value={sitePlz} />
            <CopyField label="Ort" value={siteOrt} />
            <CopyField label="Bundesland" value={d.bundesland || wcLocation.state} />
            <CopyField label="Land" value={d.land && d.land !== "DE" ? d.land : null} />
            <div style={S.sep} />
            <CopyField label="Gemarkung" value={d.cadastralDistrict || wcLocation.cadastralDistrict} />
            <CopyField label="Flur" value={d.corridor || wcLocation.parcel} />
            <CopyField label="Flurstück" value={d.parcelNumber || wcLocation.parcelNumber} />
            {(d.gpsLat || wcLocation.gpsLat) && (
              <div style={S.row}>
                <span style={S.label}>GPS</span>
                <a href={`https://maps.google.com/?q=${d.gpsLat || wcLocation.gpsLat},${d.gpsLng || wcLocation.gpsLng}`} target="_blank" rel="noopener"
                  style={{ fontSize: 11, color: "#D4A843", textDecoration: "none" }}>
                  {Number(d.gpsLat || wcLocation.gpsLat).toFixed(5)}, {Number(d.gpsLng || wcLocation.gpsLng).toFixed(5)} ↗
                </a>
              </div>
            )}
            <div style={S.sep} />
            {ownership.isOwner === true && <BoolField label="Ist Eigentümer" value={true} />}
            {ownership.isOwner === false && (
              <div style={{ padding: "4px 8px", background: "rgba(249,115,22,0.08)", borderRadius: 4, fontSize: 10, color: "#f97316" }}>
                ⚠ Nicht Eigentümer {ownership.consentAvailable ? "(Zustimmung vorhanden)" : "(Zustimmung fehlt!)"}
              </div>
            )}
          </div>
        </div>
          );
        })()}

        {/* Netzbetreiber — Kernfelder editierbar */}
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>🏢 Netzbetreiber</span></div>
          <div style={S.body}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>{d.gridOperator || "—"}</div>
            <EditableField label="Aktenzeichen" value={d.nbCaseNumber} mono onSave={v => saveField("nbCaseNumber", v)} placeholder="z.B. NB-2024-12345" />
            <EditableField label="NB-Email" value={d.nbEmail} onSave={v => saveField("nbEmail", v)} placeholder="email@netzbetreiber.de" />
            <CopyField label="Portal" value={d.nbPortalUrl || d.gridOperatorPortalUrl} />
            <div style={S.sep} />
            <CopyField label="Eingereicht am" value={d.nbEingereichtAm ? new Date(d.nbEingereichtAm).toLocaleDateString("de-DE") : null} />
            <CopyField label="Genehmigt am" value={d.nbGenehmigungAm ? new Date(d.nbGenehmigungAm).toLocaleDateString("de-DE") : null} />
            {d.daysAtNb > 0 && <div style={{ marginTop: 4, padding: "4px 8px", background: "rgba(59,130,246,0.08)", borderRadius: 4, fontSize: 10, color: "#3b82f6" }}>⏳ Seit {d.daysAtNb} Tagen beim NB</div>}
            {d.reminderCount > 0 && <div style={{ fontSize: 10, color: "#f97316", marginTop: 4 }}>🔔 {d.reminderCount}× Nachfrage gesendet</div>}
            <div style={S.sep} />
            {d.assignedToName && <CopyField label="Zugewiesen an" value={d.assignedToName} />}
            {d.createdByName && <CopyField label="Erstellt von" value={`${d.createdByName}${d.createdByCompany ? ` (${d.createdByCompany})` : ""}`} />}
          </div>
        </div>

        {/* Zähler & Netzanschluss */}
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>⚡ Zähler & Netz</span></div>
          <div style={S.body}>
            <EditableField label="Zählernummer" value={d.zaehlernummer || meter.number} mono onSave={v => saveField("zaehlernummer", v)} placeholder="z.B. 1EMH0012345" />
            <CopyField label="Zählertyp" value={meter.type} />
            <CopyField label="Standort" value={meter.location} />
            <CopyField label="Eigentum" value={meter.ownership} />
            <CopyField label="Tarif" value={meter.tariffType} />
            <CopyField label="Zählpunktbez." value={d.meterPointId || meter.meterPointId} mono />
            <CopyField label="Marktlokation" value={d.marketLocationId || meter.marketLocationId} mono />
            {meter.readingConsumption != null && <CopyField label="Stand Bezug" value={`${n2(meter.readingConsumption)} kWh`} />}
            {meter.readingFeedIn != null && <CopyField label="Stand Einsp." value={`${n2(meter.readingFeedIn)} kWh`} />}
            {meter.readingDate && <CopyField label="Ablesedatum" value={meter.readingDate} />}
            <BoolField label="Fernauslesung" value={meter.remoteReading} />
            <BoolField label="Smart Meter Gateway" value={meter.smartMeterGateway} />
            <BoolField label="iMSys gewünscht" value={meter.imsysRequested} />
            {(meter.changeReason || meter.wechselGrund) && <CopyField label="Wechselgrund" value={meter.changeReason || meter.wechselGrund} />}
            {(meter.oldMeterNumber || meter.altZaehlernummer) && <CopyField label="Alter Zähler" value={meter.oldMeterNumber || meter.altZaehlernummer} mono />}
            <div style={S.sep} />
            <CopyField label="Anschlussleistung" value={d.existingConnectionPower || gridConn.existingPowerKw ? `${n2(d.existingConnectionPower || gridConn.existingPowerKw)} kW` : null} />
          </div>
        </div>
      </div>

      {/* Row: MaStR & IBN | Rechnung | Dokumente | Erw. Technik — responsive */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10, marginTop: 10 }}>
        {/* MaStR & Inbetriebnahme */}
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>🏛 MaStR & IBN</span></div>
          <div style={S.body}>
            <CopyField label="MaStR-Nr." value={d.mastrNumber || commission.mastrNumber} mono />
            <BoolField label="MaStR registriert" value={commission.mastrRegistered} />
            <BoolField label="NB gemeldet" value={commission.gridOperatorNotified} />
            <CopyField label="IBN-Status" value={commission.commissioningStatus} />
            <CopyField label="Geplante IBN" value={et.plannedCommissioning || wcTech.plannedCommissioning} />
            <div style={S.sep} />
            <BoolField label="Vollmacht erteilt" value={auth.powerOfAttorney} />
            <BoolField label="MaStR-Registrierung" value={auth.mastrRegistration} />
            <BoolField label="AGB akzeptiert" value={auth.termsAccepted} />
            <BoolField label="Datenschutz akzeptiert" value={auth.privacyAccepted} />
            <BoolField label="Kundenportal anlegen" value={auth.createCustomerPortal} />
          </div>
        </div>

        {/* Rechnung — NUR für Staff sichtbar */}
        {isStaff ? (
          <div style={S.card}>
            <div style={S.head}><span style={S.headT}>💰 Abrechnung</span>
              {d.isBilled && <span style={S.badge("rgba(34,197,94,0.1)", "#22c55e")}>Abgerechnet</span>}
            </div>
            <div style={S.body}>
              {d.invoiceNumber ? (
                <>
                  <CopyField label="Rechnungsnr." value={d.invoiceNumber} mono />
                  <CopyField label="Status" value={d.invoiceStatus} />
                  <CopyField label="Betrag" value={d.invoiceAmount ? `${n2(d.invoiceAmount)} €` : null} />
                  <CopyField label="Datum" value={d.invoiceDate ? new Date(d.invoiceDate).toLocaleDateString("de-DE") : null} />
                </>
              ) : (
                <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", padding: 12 }}>Noch nicht abgerechnet</div>
              )}
              <div style={S.sep} />
              <CopyField label="Kunde (Abr.)" value={d.kundeId ? `Kunde #${d.kundeId}` : null} />
              <CopyField label="Erstellt" value={d.createdAt ? new Date(d.createdAt).toLocaleDateString("de-DE") : null} />
              {d.daysOld != null && <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Alter: {d.daysOld} Tage</div>}
            </div>
          </div>
        ) : (
          <div style={S.card}>
            <div style={S.head}><span style={S.headT}>📋 Info</span></div>
            <div style={S.body}>
              <CopyField label="Erstellt" value={d.createdAt ? new Date(d.createdAt).toLocaleDateString("de-DE") : null} />
              <CopyField label="Erstellt von" value={d.createdByName} />
              {d.daysOld != null && <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Alter: {d.daysOld} Tage</div>}
            </div>
          </div>
        )}

        {/* Dokumente */}
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>📄 Dokumente ({docsTotal})</span>
            <span style={S.badge(pflichtOk >= 3 ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)", pflichtOk >= 3 ? "#22c55e" : "#f97316")}>{pflichtOk}/3 Pflicht</span>
          </div>
          <div style={S.body}>
            {(d.documents || []).slice(0, 6).map((doc: any) => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 10 }}>📄</span>
                <span style={{ fontSize: 10, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{doc.originalName || doc.dateiname}</span>
                <span style={{ fontSize: 9, color: "#64748b" }}>{doc.kategorie}</span>
              </div>
            ))}
            {docsTotal > 6 && <div style={{ fontSize: 10, color: "#D4A843", marginTop: 4, cursor: "pointer" }} onClick={() => onTabChange("docs")}>+{docsTotal - 6} weitere →</div>}
            {docsTotal === 0 && <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", padding: 8 }}>Keine Dokumente</div>}
          </div>
        </div>

        {/* Erweiterte Technik & Betrieb */}
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>🔧 Betrieb & Netz</span></div>
          <div style={S.body}>
            <CopyField label="Einspeiseart" value={(et.feedInType || wcTech.feedInType) === "ueberschuss" ? "Überschuss" : (et.feedInType || wcTech.feedInType) === "volleinspeisung" ? "Volleinspeisung" : (et.feedInType || wcTech.feedInType) === "nulleinspeisung" ? "Nulleinspeisung" : null} />
            <CopyField label="Messkonzept" value={d.messkonzept ? d.messkonzept.toUpperCase() : null} />
            <CopyField label="Netzebene" value={et.gridLevel} />
            <CopyField label="Einspeisephasen" value={wcTech.feedInPhases || et.gridFeedPhases} />
            {et.paragraph14a?.relevant && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 4 }}>⚠ §14a EnWG relevant {et.paragraph14a.module ? `(Modul ${et.paragraph14a.module})` : ""}</div>}
            {et.naProtectionRequired && <div style={{ fontSize: 10, color: "#ef4444" }}>⚡ NA-Schutz erforderlich</div>}
            <div style={S.sep} />
            <BoolField label="Inselbetrieb" value={opMode.inselbetrieb} />
            <BoolField label="Motorischer Ablauf" value={opMode.motorischerAblauf} />
            <BoolField label="Überschusseinspeisung" value={opMode.ueberschusseinspeisung} />
            <BoolField label="Volleinspeisung" value={opMode.volleinspeisung} />
            <div style={S.sep} />
            <BoolField label="Ferngesteuert" value={feedMgmt.ferngesteuert} />
            {feedMgmt.dauerhaftBegrenzt && <CopyField label="Begrenzt auf" value={feedMgmt.begrenzungProzent ? `${feedMgmt.begrenzungProzent}%` : "Ja"} />}
            {reactComp.vorhanden && <CopyField label="Blindleistungskomp." value={`${reactComp.anzahlStufen || "?"} Stufen`} />}
            <div style={S.sep} />
            <CopyField label="Wizard-Version" value={wc.wizardVersion} />
          </div>
        </div>
      </div>
    </div>
  );
}
