import React, { useState, useCallback } from "react";
import {
  C, FONT, MONO,
  STATUS_MAP, WORKFLOW_STEPS, STATUS_ACTIONS,
  CASE_TYPE_LABELS, COMPONENT_LABELS, FEED_IN_LABELS, MESSKONZEPT_LABELS,
  formatDate, boolLabel,
} from "../constants";
import type { DashboardInstallation, DashboardEmail, NormalizedWizardData, TabId } from "../constants";
import { Box } from "../components/Box";
import { CopyField } from "../components/CopyField";
import { Btn } from "../components/Btn";
import { DocCheck } from "../components/DocCheck";
import { EmailIndicator } from "../components/EmailIndicator";

interface DatenTabProps {
  data: DashboardInstallation;
  wiz: NormalizedWizardData;
  emails: DashboardEmail[];
  onStatusChange: (status: string) => void;
  onTabChange: (tab: TabId) => void;
  onUpload?: () => void;
  isAdmin?: boolean;
}

export function DatenTab({ data, wiz, emails, onStatusChange, onTabChange, onUpload, isAdmin }: DatenTabProps) {
  const status = data.status?.toLowerCase() || "eingang";
  const actions = STATUS_ACTIONS[status] || [];

  // Portal State
  const [portalActivating, setPortalActivating] = useState(false);
  const [portalFeedback, setPortalFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [portalJustActivated, setPortalJustActivated] = useState(false);

  // Dokument-Anforderung State
  const [showDokAnfordern, setShowDokAnfordern] = useState(false);
  const [selectedDoks, setSelectedDoks] = useState<string[]>([]);
  const [dokSending, setDokSending] = useState(false);
  const [dokFeedback, setDokFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // NB-Portal State (Westnetz etc.)
  const isKnownPortalNb = (wiz.gridOperator.name || data.gridOperator || '').toLowerCase().match(/westnetz|stromnetz berlin|energis/);
  const [nbPortalEditing, setNbPortalEditing] = useState(false);
  const [nbPortalUser, setNbPortalUser] = useState((data as any).nbPortalUsername || '');
  const [nbPortalPw, setNbPortalPw] = useState((data as any).nbPortalPassword || '');
  const [nbPortalNotes, setNbPortalNotes] = useState((data as any).nbPortalNotizen || '');
  const [nbPortalShowPw, setNbPortalShowPw] = useState(false);
  const [nbPortalSaving, setNbPortalSaving] = useState(false);

  const saveNbPortal = useCallback(async () => {
    setNbPortalSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/installations/${data.id}/nb-portal-credentials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          portalUsername: nbPortalUser.trim() || null,
          portalPassword: nbPortalPw.trim() || null,
          portalHinweise: nbPortalNotes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      // Lokalen State aktualisieren damit die Anzeige sofort stimmt
      (data as any).nbPortalUsername = nbPortalUser.trim() || null;
      (data as any).nbPortalPassword = nbPortalPw.trim() || null;
      (data as any).nbPortalNotizen = nbPortalNotes.trim() || null;
      setNbPortalEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setNbPortalSaving(false);
    }
  }, [data.id, nbPortalUser, nbPortalPw, nbPortalNotes]);

  const DOK_OPTIONS = [
    "Lageplan", "Schaltplan", "Datenblatt Module", "Datenblatt Wechselrichter",
    "Datenblatt Speicher", "Grundbuchauszug", "Vollmacht",
  ];

  const toggleDok = useCallback((dok: string) => {
    setSelectedDoks(prev => prev.includes(dok) ? prev.filter(d => d !== dok) : [...prev, dok]);
  }, []);

  const activatePortal = useCallback(async () => {
    setPortalActivating(true);
    setPortalFeedback(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/portal/admin/installations/${data.id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Fehler beim Aktivieren");
      }
      const result = await res.json();
      const email = result.data?.email || result.email || data.contactEmail;
      setPortalFeedback({ type: "success", msg: result.data?.isNewUser
        ? `Portal aktiviert! Zugangsdaten an ${email} gesendet.`
        : `Installation mit User ${email} verknüpft.` });
      setPortalJustActivated(true);
    } catch (e: any) {
      setPortalFeedback({ type: "error", msg: e.message || "Fehler beim Aktivieren" });
    } finally {
      setPortalActivating(false);
    }
  }, [data.id, data.contactEmail]);

  const sendDokAnforderung = useCallback(async () => {
    if (selectedDoks.length === 0) return;
    setDokSending(true);
    setDokFeedback(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/portal/admin/${data.id}/dokument-anforderung`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dokumente: selectedDoks }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Fehler beim Senden");
      }
      setDokFeedback({ type: "success", msg: "Anforderung gesendet" });
      setSelectedDoks([]);
      setShowDokAnfordern(false);
    } catch (e: any) {
      setDokFeedback({ type: "error", msg: e.message || "Fehler beim Senden" });
    } finally {
      setDokSending(false);
    }
  }, [selectedDoks, data.id]);

  // Dynamic required documents based on components
  const requiredDocs: string[] = ["lageplan", "schaltplan"];
  if (wiz.pvEntries.length > 0) requiredDocs.push("datenblatt_module");
  if (wiz.inverterEntries.length > 0) requiredDocs.push("datenblatt_wechselrichter");
  if (wiz.batteryEntries.length > 0) requiredDocs.push("datenblatt_speicher");
  if (wiz.technical.paragraph14a?.relevant) requiredDocs.push("14a");
  if (wiz.technical.messkonzept) requiredDocs.push("messkonzept");

  // Calculate age from submittedAt or createdAt
  const ageSource = wiz.submittedAt || data.createdAt;
  const ageDays = (() => {
    if (data.daysOld != null) return data.daysOld;
    if (!ageSource) return undefined;
    try {
      const diff = Date.now() - new Date(ageSource).getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    } catch { return undefined; }
  })();

  // Check if any power summary values exist (for Anlage tiles)
  const hasPowerData = !!(
    wiz.technical.totalPvKwp || data.totalKwp ||
    wiz.technical.totalInverterKva ||
    wiz.technical.totalBatteryKwh || data.speicherKwh
  );

  // Completeness calculation
  const fields = [
    data.customerName,
    wiz.customer?.email || data.contactEmail,
    wiz.customer?.phone || data.contactPhone,
    wiz.location.street || data.strasse,
    wiz.location.zip || data.plz,
    wiz.location.city || data.ort,
    wiz.gridOperator.name || data.gridOperator,
    wiz.meter.number || data.zaehlernummer,
    wiz.technical.totalPvKwp || data.totalKwp,
  ];
  const filled = fields.filter(Boolean).length;
  const completeness = Math.round((filled / fields.length) * 100);

  // Classify meter stock into abmelden (red) and anmelden (green)
  const meterAbmelden = wiz.meterStock.filter((z: any) =>
    z.aktion === "abmelden" || z.aktion === "demontage" || z.aktion === "ausbau" || z.verwendung === "abmelden"
  );
  const meterAnmelden = wiz.meterStock.filter((z: any) =>
    z.aktion === "anmelden" || z.aktion === "einbau" || z.aktion === "montage" || z.verwendung === "anmelden"
  );
  const meterNeutral = wiz.meterStock.filter((z: any) =>
    !meterAbmelden.includes(z) && !meterAnmelden.includes(z)
  );

  return (
    <div style={{ padding: 12, fontFamily: FONT, display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ===== ROW 1: Kunde | Standort | Netzanmeldung | Workflow + Meta ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 260px", gap: 10, alignItems: "start" }}>

        {/* Kunde */}
        <Box title="Kunde">
          <CopyField label="Name" value={data.customerName || `${wiz.customer?.firstName || ""} ${wiz.customer?.lastName || ""}`.trim()} />
          <CopyField label="E-Mail" value={wiz.customer?.email || data.contactEmail} mono />
          <CopyField label="Telefon" value={wiz.customer?.phone || data.contactPhone} mono />
          <CopyField label="Kundentyp" value={wiz.customer?.type === "gewerbe" ? "Gewerbe" : wiz.customer?.type === "gbr" ? "GbR" : wiz.customer?.type === "weg" ? "WEG" : "Privat"} />
          {wiz.customer?.company && <CopyField label="Firma" value={wiz.customer.company} />}
          {wiz.customer?.mobile && <CopyField label="Mobil" value={wiz.customer.mobile} mono />}
          {wiz.customer?.birthDate && <CopyField label="Geb.datum" value={formatDate(wiz.customer.birthDate)} />}
          {(wiz.customer?.iban || wiz.customer?.bic) && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              <CopyField label="IBAN" value={wiz.customer?.iban} mono />
              <CopyField label="BIC" value={wiz.customer?.bic} mono />
              {wiz.customer?.accountHolder && <CopyField label="Kontoinhaber" value={wiz.customer.accountHolder} />}
            </>
          )}
          {wiz.customer?.rechnungGleichStandort === false && wiz.customer?.rechnungsadresse && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              <SectionLabel>Rechnungsadresse</SectionLabel>
              <CopyField label="Strasse" value={wiz.customer.rechnungsadresse.strasse} />
              <CopyField label="PLZ/Ort" value={`${wiz.customer.rechnungsadresse.plz || ""} ${wiz.customer.rechnungsadresse.ort || ""}`.trim()} />
            </>
          )}
          {(wiz.customer?.mastrNumber || wiz.customer?.eegKey) && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              {wiz.customer?.mastrNumber && <CopyField label="MaStR-Nr." value={wiz.customer.mastrNumber} mono />}
              {wiz.customer?.eegKey && <CopyField label="EEG-Schlüssel" value={wiz.customer.eegKey} mono />}
            </>
          )}
        </Box>

        {/* Standort */}
        <Box title="Standort">
          <CopyField label="Strasse" value={`${wiz.location.street || data.strasse || ""} ${wiz.location.houseNumber || data.hausNr || ""}`.trim()} />
          <CopyField label="PLZ" value={wiz.location.zip || data.plz} />
          <CopyField label="Ort" value={wiz.location.city || data.ort} />
          {wiz.location.bundesland && <CopyField label="Bundesland" value={wiz.location.bundesland} />}
          {(wiz.location.gpsLat || wiz.location.gpsLng) && (
            <CopyField
              label="GPS"
              value={`${wiz.location.gpsLat?.toFixed(5) || "—"}, ${wiz.location.gpsLng?.toFixed(5) || "—"}`}
              mono
            />
          )}
          {wiz.location.gemarkung && <CopyField label="Gemarkung" value={wiz.location.gemarkung} />}
          {wiz.location.flurstueck && <CopyField label="Flurstück" value={wiz.location.flurstueck} />}
          {wiz.location.zusatz && <CopyField label="Zusatz" value={wiz.location.zusatz} />}
          {wiz.owner && wiz.owner.isOwner === false && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              <SectionLabel>Eigentümer</SectionLabel>
              <CopyField label="Zustimmung" value={boolLabel(wiz.owner.consentGiven)} />
              {wiz.owner.ownerData?.name && <CopyField label="Name" value={wiz.owner.ownerData.name} />}
            </>
          )}
          <div style={{ padding: "4px 6px" }}>
            <Btn
              label="Adresse kopieren"
              variant="ghost"
              small
              onClick={() => {
                const addr = [
                  `${wiz.location.street || data.strasse || ""} ${wiz.location.houseNumber || data.hausNr || ""}`.trim(),
                  `${wiz.location.zip || data.plz || ""} ${wiz.location.city || data.ort || ""}`.trim(),
                ].filter(Boolean).join(", ");
                navigator.clipboard.writeText(addr);
              }}
            />
          </div>
        </Box>

        {/* Netzanmeldung */}
        <Box title="Netzanmeldung">
          <CopyField label="Netzbetreiber" value={wiz.gridOperator.name || data.gridOperator} />
          {data.nbEmail && <CopyField label="NB-E-Mail" value={data.nbEmail} mono />}
          {data.nbCaseNumber && <CopyField label="Vorgangsnr." value={data.nbCaseNumber} mono />}
          {data.nbEingereichtAm && <CopyField label="Eingereicht" value={formatDate(data.nbEingereichtAm)} />}
          {data.nbGenehmigungAm && <CopyField label="Genehmigt" value={formatDate(data.nbGenehmigungAm)} />}
          {data.daysAtNb != null && data.daysAtNb > 0 && (
            <CopyField label="Tage beim NB" value={`${data.daysAtNb} Tage`} />
          )}
          <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
          {(wiz.caseType || data.status) && <CopyField label="Kategorie" value={CASE_TYPE_LABELS[wiz.caseType || ""] || wiz.caseType} />}
          {wiz.processType && <CopyField label="Vorgangsart" value={wiz.processType} />}
          {wiz.groessenklasse && <CopyField label="Größenklasse" value={wiz.groessenklasse} />}
          {wiz.registrationTargets.length > 0 && (
            <CopyField
              label="Komponenten"
              value={wiz.registrationTargets.map((t) => COMPONENT_LABELS[t] || t).join(", ")}
            />
          )}
          {data.nbRueckfrageText && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              <SectionLabel color={C.er}>NB-Rückfrage</SectionLabel>
              <CopyField label="Datum" value={formatDate(data.nbRueckfrageAm)} />
              <div style={{ padding: "2px 6px", fontSize: 11, color: C.t2, lineHeight: 1.4 }}>
                {data.nbRueckfrageText}
              </div>
            </>
          )}
        </Box>

        {/* Anlagenbetreiber — NIVOMA (kundeId 24) */}
        {(data as any).kundeId === 24 && (
          <Box title="Anlagenbetreiber">
            <CopyField label="Firma" value="NIVOMA GmbH" />
            <CopyField label="Vertreter" value="Niklas Baumgärtner" />
            <CopyField label="Straße" value={`${data.strasse || ""} ${data.hausNr || ""}`.trim() || undefined} />
            <CopyField label="PLZ" value={data.plz} />
            <CopyField label="Ort" value={data.ort} />
            <CopyField label="Telefon" value="0721-98618238" mono />
            <CopyField label="E-Mail" value={(data as any).dedicatedEmail} mono />
          </Box>
        )}

        {/* NB-Portal Zugangsdaten — immer für Admin sichtbar */}
        {isAdmin && (
          <Box title={`Installateur-Portal${data.gridOperator ? ` · ${data.gridOperator}` : ''}`} badge={
            !nbPortalEditing ? (
              <span
                onClick={() => setNbPortalEditing(true)}
                style={{ cursor: "pointer", fontSize: 10, color: C.ac, fontWeight: 600 }}
              >
                Bearbeiten
              </span>
            ) : undefined
          }>
            {/* Portal-Link */}
            {(() => {
              const go = (wiz.gridOperator.name || data.gridOperator || '').toLowerCase();
              const url = go.includes('westnetz') ? 'https://serviceportal.westnetz.de'
                : go.includes('stromnetz berlin') ? 'https://kundenportal.stromnetz.berlin'
                : go.includes('energis') ? 'https://connect.energis.de'
                : (data as any).nbPortalUrl || null;
              return url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", margin: "4px 6px 6px", borderRadius: 5,
                  fontSize: 11, fontWeight: 600, color: C.ac, background: `${C.ac}15`,
                  textDecoration: "none", border: `1px solid ${C.ac}30`,
                }}>
                  ↗ Portal öffnen
                </a>
              ) : null;
            })()}

            {nbPortalEditing ? (
              <div style={{ padding: "4px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  type="text" value={nbPortalUser} onChange={e => setNbPortalUser(e.target.value)}
                  placeholder="Benutzername / E-Mail"
                  style={{ padding: "5px 8px", borderRadius: 5, border: `1px solid ${C.bd}`, background: C.s3, color: C.t, fontSize: 12, fontFamily: MONO, outline: "none" }}
                />
                <div style={{ position: "relative" }}>
                  <input
                    type={nbPortalShowPw ? "text" : "password"} value={nbPortalPw} onChange={e => setNbPortalPw(e.target.value)}
                    placeholder="Passwort"
                    style={{ width: "100%", padding: "5px 8px", paddingRight: 32, borderRadius: 5, border: `1px solid ${C.bd}`, background: C.s3, color: C.t, fontSize: 12, fontFamily: MONO, outline: "none" }}
                  />
                  <span
                    onClick={() => setNbPortalShowPw(!nbPortalShowPw)}
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 10, color: C.t3 }}
                  >
                    {nbPortalShowPw ? "🙈" : "👁️"}
                  </span>
                </div>
                <input
                  type="text" value={nbPortalNotes} onChange={e => setNbPortalNotes(e.target.value)}
                  placeholder="Notizen..."
                  style={{ padding: "5px 8px", borderRadius: 5, border: `1px solid ${C.bd}`, background: C.s3, color: C.t, fontSize: 12, outline: "none" }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={saveNbPortal} disabled={nbPortalSaving}
                    style={{ flex: 1, padding: "5px 0", borderRadius: 5, border: "none", background: C.ac, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {nbPortalSaving ? "..." : "Speichern"}
                  </button>
                  <button
                    onClick={() => setNbPortalEditing(false)}
                    style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.bd}`, background: "transparent", color: C.t2, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : nbPortalUser ? (
              <div style={{ padding: "2px 0" }}>
                <CopyField label="Benutzer" value={nbPortalUser} mono />
                <div style={{ display: "flex", alignItems: "center", padding: "3px 6px", gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.t3, minWidth: 70 }}>Passwort</span>
                  <span style={{ fontSize: 12, fontFamily: MONO, color: C.t }}>
                    {nbPortalShowPw ? nbPortalPw : "••••••••"}
                  </span>
                  <span onClick={() => setNbPortalShowPw(!nbPortalShowPw)} style={{ cursor: "pointer", fontSize: 10, color: C.t3, marginLeft: "auto" }}>
                    {nbPortalShowPw ? "verbergen" : "anzeigen"}
                  </span>
                </div>
                {nbPortalNotes && (
                  <div style={{ padding: "2px 6px", fontSize: 10, color: C.t3, fontStyle: "italic" }}>
                    {nbPortalNotes}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "6px", fontSize: 11, color: C.t3 }}>
                Keine Zugangsdaten hinterlegt
              </div>
            )}
          </Box>
        )}

        {/* Workflow + Meta (right 260px) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Box title="Workflow">
            <div style={{ padding: "8px 6px" }}>
              {WORKFLOW_STEPS.map((step, i) => {
                const statusCfg = STATUS_MAP[status] || STATUS_MAP.eingang;
                const currentStep = statusCfg.step;
                const isDone = i < currentStep;
                const isCurrent = i === currentStep;
                const isStorniert = status === "storniert";

                return (
                  <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: isStorniert ? C.erB : isDone ? C.ok : isCurrent ? C.ac : C.s4,
                          border: `2px solid ${isStorniert ? C.er : isDone ? C.ok : isCurrent ? C.ac : C.s4}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          color: isDone || isCurrent ? "#fff" : C.t3,
                          fontWeight: 700,
                        }}
                      >
                        {isDone ? "✓" : i + 1}
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div style={{ width: 2, height: 16, background: isDone ? C.ok : C.s4 }} />
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: isDone ? C.ok : isCurrent ? C.t : C.t3, fontWeight: isCurrent ? 600 : 400, fontFamily: FONT }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {isAdmin && (
              <div style={{ padding: "6px 6px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
                {actions.map((a) => (
                  <Btn key={a.target} label={a.label} variant={a.variant} fullWidth onClick={() => onStatusChange(a.target)} icon={<span>{"→"}</span>} />
                ))}
                {status !== "storniert" && status !== "fertig" && (
                  <Btn label="Stornieren" variant="danger" fullWidth small onClick={() => onStatusChange("storniert")} />
                )}
              </div>
            )}
          </Box>
        </div>
      </div>

      {/* ===== FLOWING GRID: Alle weiteren Boxen fließen dynamisch ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, alignItems: "start" }}>

        {/* Anlage */}
        <Box title="Anlage">
          {hasPowerData && (
            <div style={{ display: "flex", gap: 8, padding: "6px 6px 4px" }}>
              {(wiz.technical.totalPvKwp || data.totalKwp) ? (
                <AnlageTile
                  label="Ges. Leistung"
                  value={wiz.technical.totalPvKwp ? `${wiz.technical.totalPvKwp.toFixed(2)}` : `${data.totalKwp!.toFixed(2)}`}
                  unit="kWp"
                />
              ) : null}
              {wiz.technical.totalInverterKva ? (
                <AnlageTile
                  label="WR Leistung"
                  value={`${wiz.technical.totalInverterKva.toFixed(2)}`}
                  unit="kVA"
                />
              ) : null}
              {(wiz.technical.totalBatteryKwh || data.speicherKwh) ? (
                <AnlageTile
                  label="Speicher"
                  value={wiz.technical.totalBatteryKwh ? `${wiz.technical.totalBatteryKwh.toFixed(1)}` : `${data.speicherKwh!.toFixed(1)}`}
                  unit="kWh"
                />
              ) : null}
            </div>
          )}
          {wiz.technical.feedInType && (
            <CopyField label="Einspeiseart" value={FEED_IN_LABELS[wiz.technical.feedInType] || wiz.technical.feedInType} />
          )}
          {wiz.technical.messkonzept && (
            <CopyField label="Messkonzept" value={MESSKONZEPT_LABELS[wiz.technical.messkonzept] || wiz.technical.messkonzept} />
          )}
          {wiz.technical.paragraph14a?.relevant && (
            <CopyField label="§14a" value={`Modul ${wiz.technical.paragraph14a.modul || "?"}`} />
          )}
          {(wiz.technical.mieterstrom || wiz.technical.energySharing || wiz.technical.mehrereAnlagen) && (
            <div style={{ padding: "2px 6px 4px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {wiz.technical.mieterstrom && <FlagChip label="Mieterstrom" />}
              {wiz.technical.energySharing && <FlagChip label="Energy Sharing" />}
              {wiz.technical.mehrereAnlagen && <FlagChip label="Mehrere Anlagen" />}
            </div>
          )}
          {wiz.technical.operationMode && (
            <div style={{ padding: "0 6px 2px" }}>
              <SectionLabel>Betriebsweise</SectionLabel>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "0 0 2px" }}>
                {wiz.technical.operationMode.ueberschusseinspeisung && <FlagChip label="Überschuss" />}
                {wiz.technical.operationMode.volleinspeisung && <FlagChip label="Volleinsp." />}
                {wiz.technical.operationMode.inselbetrieb && <FlagChip label="Inselbetrieb" />}
                {wiz.technical.operationMode.motorischerAblauf && <FlagChip label="Motor. Ablauf" />}
              </div>
            </div>
          )}
          {wiz.technical.feedInManagement && (
            <div style={{ padding: "0 6px 2px" }}>
              <SectionLabel>Einspeisemanagement</SectionLabel>
              {wiz.technical.feedInManagement.ferngesteuert != null && <CopyField label="Ferngesteuert" value={boolLabel(wiz.technical.feedInManagement.ferngesteuert)} />}
              {wiz.technical.feedInManagement.dauerhaftBegrenzt != null && (
                <CopyField label="Begrenzt" value={wiz.technical.feedInManagement.dauerhaftBegrenzt ? `Ja (${wiz.technical.feedInManagement.begrenzungProzent || 70}%)` : "Nein"} />
              )}
            </div>
          )}
          {wiz.technical.reactiveCompensation?.vorhanden && (
            <div style={{ padding: "0 6px 4px" }}>
              <SectionLabel>Blindleistung</SectionLabel>
              <CopyField label="Stufen" value={String(wiz.technical.reactiveCompensation.anzahlStufen || "")} />
            </div>
          )}
          {(wiz.gridConnection.hakId || wiz.gridConnection.existingPowerKw || wiz.gridConnection.erdungsart) && (
            <div style={{ padding: "0 6px 4px" }}>
              <div style={{ height: 1, background: C.bd, margin: "2px 0" }} />
              <SectionLabel>Netzanschluss</SectionLabel>
              {wiz.gridConnection.hakId && <CopyField label="HAK-ID" value={wiz.gridConnection.hakId} mono />}
              {wiz.gridConnection.existingPowerKw && <CopyField label="Best. Leistung" value={`${wiz.gridConnection.existingPowerKw} kW`} />}
              {wiz.gridConnection.existingFuseA && <CopyField label="Best. Absich." value={`${wiz.gridConnection.existingFuseA} A`} />}
              {wiz.gridConnection.requestedPowerKw && <CopyField label="Neue Leistung" value={`${wiz.gridConnection.requestedPowerKw} kW`} />}
              {wiz.gridConnection.requestedFuseA && <CopyField label="Neue Absich." value={`${wiz.gridConnection.requestedFuseA} A`} />}
              {wiz.gridConnection.erdungsart && <CopyField label="Erdung" value={wiz.gridConnection.erdungsart} />}
            </div>
          )}
        </Box>

        {/* Pflichtdokumente */}
        <Box title="Pflichtdokumente" badge={<DocCheck documents={data.documents || []} requiredDocs={requiredDocs} compact />}>
          <DocCheck documents={data.documents || []} requiredDocs={requiredDocs} />
          <div style={{ padding: "6px 6px 4px" }}>
            <Btn label="+ Hochladen" variant="ghost" small onClick={onUpload} />
          </div>
          {(data.waitingForCustomer || data.needsInternalAction) && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              <SectionLabel>Wartestatus</SectionLabel>
              {data.waitingForCustomer && <CopyField label="Warte auf" value={data.waitingForCustomerReason || "Endkunde"} />}
              {data.needsInternalAction && <CopyField label="Intern nötig" value={data.needsInternalActionReason || "Ja"} />}
            </>
          )}
          {(data.zaehlerwechselDatum || data.zaehlerwechselKommentar) && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              <SectionLabel>Zählerwechsel</SectionLabel>
              <CopyField label="Datum" value={formatDate(data.zaehlerwechselDatum)} />
              {data.zaehlerwechselUhrzeit && <CopyField label="Uhrzeit" value={data.zaehlerwechselUhrzeit} />}
              {data.zaehlerwechselKommentar && <CopyField label="Kommentar" value={data.zaehlerwechselKommentar} />}
              <CopyField label="Kunde inform." value={boolLabel(data.zaehlerwechselKundeInformiert)} />
            </>
          )}
          {(data.mastrNrSolar || data.mastrNrSpeicher || wiz.commissioning?.mastrNumber) && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              <SectionLabel>MaStR</SectionLabel>
              <CopyField label="Solar Nr." value={data.mastrNrSolar || wiz.commissioning?.mastrNumber} mono />
              {(data.mastrNrSpeicher || wiz.commissioning?.mastrNumberSpeicher) && (
                <CopyField label="Speicher Nr." value={data.mastrNrSpeicher || wiz.commissioning?.mastrNumberSpeicher} mono />
              )}
              {data.mastrStatus && <CopyField label="Status" value={data.mastrStatus} />}
            </>
          )}
        </Box>

        {/* Vollständigkeit + Email (stacked) */}
        <div>
          <Box title="Vollständigkeit">
            <div style={{ padding: "6px 8px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke={C.s4} strokeWidth="3" />
                  <circle
                    cx="24" cy="24" r="20" fill="none"
                    stroke={completeness === 100 ? C.ok : C.ac}
                    strokeWidth="3"
                    strokeDasharray={`${(completeness / 100) * 125.6} 125.6`}
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: completeness === 100 ? C.ok : C.t,
                    fontFamily: FONT,
                  }}
                >
                  {completeness}%
                </div>
              </div>
              <span style={{ fontSize: 10, color: C.t3 }}>Daten</span>
            </div>
          </Box>
          <div style={{ marginTop: 10 }}>
            <EmailIndicator
              emails={emails}
              onOpenKommunikation={() => onTabChange("kommunikation")}
            />
          </div>
        </div>

        {/* === Komponenten: Nur wenn Daten vorhanden === */}

        {wiz.pvEntries.length > 0 && (
          <Box title={`PV-Module (${wiz.pvEntries.length})`}>
            {wiz.pvEntries.map((pv: any, i: number) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < wiz.pvEntries.length - 1 ? `1px solid ${C.bd}` : "none" }}>
                {pv.roofName && <CopyField label="Dachfläche" value={pv.roofName} />}
                <CopyField label="Hersteller" value={pv.manufacturer} />
                <CopyField label="Modell" value={pv.model} />
                <CopyField label="Leistung" value={pv.powerWp ? `${pv.powerWp} Wp` : undefined} />
                <CopyField label="Anzahl" value={String(pv.count || "")} />
                {pv.orientation && <CopyField label="Ausrichtung" value={pv.orientation} />}
                {pv.tilt != null && <CopyField label="Neigung" value={`${pv.tilt}°`} />}
                {pv.shading && <CopyField label="Verschattung" value={pv.shading} />}
                {pv.stringsCount && <CopyField label="Strings" value={String(pv.stringsCount)} />}
                {pv.modulesPerString && <CopyField label="Module/String" value={String(pv.modulesPerString)} />}
              </div>
            ))}
          </Box>
        )}

        {wiz.inverterEntries.length > 0 && (
          <Box title={`Wechselrichter (${wiz.inverterEntries.length})`}>
            {wiz.inverterEntries.map((inv: any, i: number) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < wiz.inverterEntries.length - 1 ? `1px solid ${C.bd}` : "none" }}>
                <CopyField label="Hersteller" value={inv.manufacturer} />
                <CopyField label="Modell" value={inv.model} />
                <CopyField label="Leistung" value={inv.powerKw ? `${inv.powerKw} kW` : undefined} />
                {inv.powerKva && <CopyField label="Scheinleist." value={`${inv.powerKva} kVA`} />}
                <CopyField label="Anzahl" value={String(inv.count || "")} />
                <CopyField label="ZEREZ-ID" value={inv.zerezId} mono />
                {inv.hybrid && <CopyField label="Hybrid" value="Ja" />}
                {inv.mpptCount && <CopyField label="MPPT" value={String(inv.mpptCount)} />}
              </div>
            ))}
          </Box>
        )}

        {wiz.batteryEntries.length > 0 && (
          <Box title={`Speicher (${wiz.batteryEntries.length})`}>
            {wiz.batteryEntries.map((bat: any, i: number) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < wiz.batteryEntries.length - 1 ? `1px solid ${C.bd}` : "none" }}>
                <CopyField label="Hersteller" value={bat.manufacturer} />
                <CopyField label="Modell" value={bat.model} />
                <CopyField label="Kapazität" value={bat.capacityKwh ? `${bat.capacityKwh} kWh` : undefined} />
                {bat.powerKw && <CopyField label="Leistung" value={`${bat.powerKw} kW`} />}
                {bat.powerKva && <CopyField label="Scheinleist." value={`${bat.powerKva} kVA`} />}
                <CopyField label="Anzahl" value={String(bat.count || "")} />
                {bat.coupling && <CopyField label="Kopplung" value={bat.coupling.toUpperCase()} />}
                {bat.emergencyPower != null && <CopyField label="Notstrom" value={boolLabel(bat.emergencyPower)} />}
                {bat.backupPower != null && <CopyField label="Ersatzstrom" value={boolLabel(bat.backupPower)} />}
                {bat.islandCapable != null && <CopyField label="Inselnetz" value={boolLabel(bat.islandCapable)} />}
                {bat.connectionPhase && <CopyField label="Anschluss" value={bat.connectionPhase} />}
                {bat.naProtection != null && <CopyField label="NA-Schutz" value={boolLabel(bat.naProtection)} />}
              </div>
            ))}
          </Box>
        )}

        {wiz.wallboxEntries.length > 0 && (
          <Box title={`Wallboxen (${wiz.wallboxEntries.length})`}>
            {wiz.wallboxEntries.map((wb: any, i: number) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < wiz.wallboxEntries.length - 1 ? `1px solid ${C.bd}` : "none" }}>
                <CopyField label="Hersteller" value={wb.manufacturer} />
                <CopyField label="Modell" value={wb.model} />
                <CopyField label="Leistung" value={wb.powerKw ? `${wb.powerKw} kW` : undefined} />
                <CopyField label="Anzahl" value={String(wb.count || "")} />
                {wb.controllable14a != null && <CopyField label="§14a" value={boolLabel(wb.controllable14a)} />}
                {wb.phases && <CopyField label="Phasen" value={String(wb.phases)} />}
              </div>
            ))}
          </Box>
        )}

        {wiz.heatpumpEntries.length > 0 && (
          <Box title={`Wärmepumpen (${wiz.heatpumpEntries.length})`}>
            {wiz.heatpumpEntries.map((hp: any, i: number) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < wiz.heatpumpEntries.length - 1 ? `1px solid ${C.bd}` : "none" }}>
                <CopyField label="Hersteller" value={hp.manufacturer} />
                <CopyField label="Modell" value={hp.model} />
                <CopyField label="Leistung" value={hp.powerKw ? `${hp.powerKw} kW` : undefined} />
                <CopyField label="Anzahl" value={String(hp.count || "")} />
                {hp.type && <CopyField label="Typ" value={hp.type} />}
                {hp.sgReady != null && <CopyField label="SG Ready" value={boolLabel(hp.sgReady)} />}
                {hp.controllable14a != null && <CopyField label="§14a" value={boolLabel(hp.controllable14a)} />}
              </div>
            ))}
          </Box>
        )}

        {wiz.bhkwEntries.length > 0 && (
          <Box title={`BHKW (${wiz.bhkwEntries.length})`}>
            {wiz.bhkwEntries.map((b: any, i: number) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < wiz.bhkwEntries.length - 1 ? `1px solid ${C.bd}` : "none" }}>
                <CopyField label="Hersteller" value={b.manufacturer} />
                <CopyField label="Modell" value={b.model} />
                {b.electricPowerKw && <CopyField label="El. Leistung" value={`${b.electricPowerKw} kW`} />}
                {b.thermalPowerKw && <CopyField label="Th. Leistung" value={`${b.thermalPowerKw} kW`} />}
                {b.fuel && <CopyField label="Brennstoff" value={b.fuel} />}
              </div>
            ))}
          </Box>
        )}

        {wiz.windEntries.length > 0 && (
          <Box title={`Windkraft (${wiz.windEntries.length})`}>
            {wiz.windEntries.map((w: any, i: number) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < wiz.windEntries.length - 1 ? `1px solid ${C.bd}` : "none" }}>
                <CopyField label="Hersteller" value={w.manufacturer} />
                <CopyField label="Modell" value={w.model} />
                {w.powerKw && <CopyField label="Leistung" value={`${w.powerKw} kW`} />}
                {w.hubHeight && <CopyField label="Nabenhöhe" value={`${w.hubHeight} m`} />}
                {w.rotorDiameter && <CopyField label="Rotor-Ø" value={`${w.rotorDiameter} m`} />}
              </div>
            ))}
          </Box>
        )}

        {/* === Zähler === */}
        <Box title={`Zähler (${wiz.meterStock.length})`}>
          {(wiz.meter.number || data.zaehlernummer) && <CopyField label="Nummer" value={wiz.meter.number || data.zaehlernummer} mono />}
          {wiz.meter.zaehlpunkt && <CopyField label="Zählpunkt" value={wiz.meter.zaehlpunkt} mono />}
          {wiz.meter.marktlokation && <CopyField label="MaLo-ID" value={wiz.meter.marktlokation} mono />}
          {wiz.meter.type && <CopyField label="Typ" value={wiz.meter.type} />}
          {wiz.meter.location && <CopyField label="Standort" value={wiz.meter.location} />}
          {wiz.meter.tariffType && <CopyField label="Tarifart" value={wiz.meter.tariffType} />}

          {(meterAbmelden.length > 0 || meterAnmelden.length > 0) && (
            <div style={{ display: "flex", gap: 8, padding: "6px 6px", flexWrap: "wrap" }}>
              {meterAbmelden.map((z: any, i: number) => (
                <MeterCard key={`ab-${i}`} meter={z} variant="abmelden" />
              ))}
              {meterAnmelden.map((z: any, i: number) => (
                <MeterCard key={`an-${i}`} meter={z} variant="anmelden" />
              ))}
            </div>
          )}

          {meterNeutral.length > 0 && (
            <div style={{ padding: "4px 6px" }}>
              {meterNeutral.map((z: any, i: number) => (
                <div key={i} style={{ padding: "2px 0", borderBottom: i < meterNeutral.length - 1 ? `1px solid ${C.bd}` : "none" }}>
                  <CopyField label="Nr." value={z.zaehlernummer} mono />
                  {z.zaehlpunktbezeichnung && <CopyField label="Zählpunkt" value={z.zaehlpunktbezeichnung} mono />}
                  {z.typ && <CopyField label="Typ" value={z.typ} />}
                  {z.standort && <CopyField label="Standort" value={z.standort} />}
                  {z.aktion && <CopyField label="Aktion" value={z.aktion} />}
                </div>
              ))}
            </div>
          )}

          {wiz.meterStock.length === 0 && !(wiz.meter.number || data.zaehlernummer) && (
            <div style={{ padding: "8px 6px", fontSize: 11, color: C.t3, textAlign: "center" }}>
              Keine Zähler erfasst
            </div>
          )}
        </Box>

        {/* === Zähler-Prozesse (jeweils eigene Box, nur wenn vorhanden) === */}
        {wiz.meterNew && (
          <Box title="Neuer Zähler">
            {wiz.meterNew.gewuenschterTyp && <CopyField label="Typ" value={wiz.meterNew.gewuenschterTyp} />}
            {wiz.meterNew.standort && <CopyField label="Standort" value={wiz.meterNew.standort} />}
            {wiz.meterNew.tarifart && <CopyField label="Tarif" value={wiz.meterNew.tarifart} />}
            {wiz.meterNew.imsysGewuenscht != null && <CopyField label="iMSys" value={boolLabel(wiz.meterNew.imsysGewuenscht)} />}
          </Box>
        )}

        {wiz.decommissioning && (
          <Box title="Demontage">
            <CopyField label="Typ" value={wiz.decommissioning.type} />
            <CopyField label="Grund" value={wiz.decommissioning.reason} />
            {wiz.decommissioning.meterNumber && <CopyField label="Zähler-Nr." value={wiz.decommissioning.meterNumber} mono />}
            {wiz.decommissioning.plannedDate && <CopyField label="Geplant" value={formatDate(wiz.decommissioning.plannedDate)} />}
            <CopyField label="NB informiert" value={boolLabel(wiz.decommissioning.gridOperatorNotified)} />
            <CopyField label="MaStR abgem." value={boolLabel(wiz.decommissioning.mastrDeregistered)} />
          </Box>
        )}

        {wiz.meterProcess && (
          <Box title="Zähler-Prozess">
            <CopyField label="Prozesstyp" value={wiz.meterProcess.prozessTyp} />
            {wiz.meterProcess.altZaehlernummer && <CopyField label="Alte Nr." value={wiz.meterProcess.altZaehlernummer} mono />}
            {wiz.meterProcess.neuZaehlertyp && <CopyField label="Neuer Typ" value={wiz.meterProcess.neuZaehlertyp} />}
          </Box>
        )}

        {wiz.completion && (
          <Box title="Fertigmeldung">
            <CopyField label="Installation" value={boolLabel(wiz.completion.installationAbgeschlossen)} />
            <CopyField label="NB-Meldung" value={boolLabel(wiz.completion.netzbetreiberMeldung)} />
            <CopyField label="MaStR gemeldet" value={boolLabel(wiz.completion.mastrGemeldet)} />
            <CopyField label="Zähler gesetzt" value={boolLabel(wiz.completion.zaehlerGesetzt)} />
          </Box>
        )}

        {/* === Kundenportal === */}
        <Box title="Kundenportal">
          <div style={{ padding: "6px 6px" }}>
            {data.portalUsers && data.portalUsers.length > 0 ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.ok }} />
                  <span style={{ fontSize: 12, color: C.ok, fontWeight: 600 }}>Aktiv</span>
                </div>
                {data.portalUsers.map((pu: any, i: number) => (
                  <CopyField key={i} label="Portal-Email" value={pu.email} mono />
                ))}
                {/* Dokumente anfordern */}
                <div style={{ marginTop: 6 }}>
                  <div
                    onClick={() => { setShowDokAnfordern(v => !v); setDokFeedback(null); }}
                    style={{
                      fontSize: 11, color: C.bl, cursor: "pointer", fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>📄</span>
                    Dokumente anfordern
                    <span style={{ fontSize: 9, transform: showDokAnfordern ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▼</span>
                  </div>
                  {showDokAnfordern && (
                    <div style={{ marginTop: 6, padding: "6px 8px", background: C.s2, borderRadius: 6 }}>
                      {DOK_OPTIONS.map(dok => (
                        <label key={dok} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer", padding: "2px 0" }}>
                          <input
                            type="checkbox"
                            checked={selectedDoks.includes(dok)}
                            onChange={() => toggleDok(dok)}
                            style={{ accentColor: C.bl, width: 13, height: 13 }}
                          />
                          {dok}
                        </label>
                      ))}
                      <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          onClick={sendDokAnforderung}
                          disabled={dokSending || selectedDoks.length === 0}
                          style={{
                            fontSize: 11, fontWeight: 600, color: "#fff",
                            background: selectedDoks.length === 0 ? C.t3 : C.bl,
                            border: "none", borderRadius: 4, padding: "4px 12px",
                            cursor: selectedDoks.length === 0 ? "not-allowed" : "pointer",
                            opacity: dokSending ? 0.6 : 1,
                          }}
                        >
                          {dokSending ? "Sende…" : "Senden"}
                        </button>
                        <button
                          onClick={() => { setShowDokAnfordern(false); setSelectedDoks([]); setDokFeedback(null); }}
                          style={{ fontSize: 11, color: C.t2, background: "none", border: "none", cursor: "pointer" }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                  {dokFeedback && (
                    <div style={{
                      marginTop: 4, fontSize: 11, fontWeight: 600,
                      color: dokFeedback.type === "success" ? C.ok : C.er,
                    }}>
                      {dokFeedback.type === "success" ? "✓ " : "✗ "}{dokFeedback.msg}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: portalJustActivated ? C.ok : C.t3 }} />
                  <span style={{ fontSize: 12, color: portalJustActivated ? C.ok : C.t3, fontWeight: 600 }}>
                    {portalJustActivated ? "Aktiv" : "Nicht angelegt"}
                  </span>
                </div>
                {data.contactEmail && !portalJustActivated && (
                  <button
                    onClick={activatePortal}
                    disabled={portalActivating}
                    style={{
                      fontSize: 11, fontWeight: 600, color: "#fff",
                      background: C.ac, border: "none", borderRadius: 4,
                      padding: "5px 14px", cursor: "pointer",
                      opacity: portalActivating ? 0.6 : 1,
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    {portalActivating ? "Aktiviere…" : "Portal aktivieren"}
                  </button>
                )}
                {!data.contactEmail && !portalJustActivated && (
                  <div style={{ fontSize: 10, color: C.t3 }}>Keine E-Mail vorhanden — Portal kann nicht aktiviert werden.</div>
                )}
                {portalFeedback && (
                  <div style={{
                    marginTop: 4, fontSize: 11, fontWeight: 600,
                    color: portalFeedback.type === "success" ? C.ok : C.er,
                  }}>
                    {portalFeedback.type === "success" ? "✓ " : "✗ "}{portalFeedback.msg}
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ height: 1, background: C.bd, margin: "0 6px" }} />
          <div style={{ padding: "6px 6px" }}>
            <div style={{ fontSize: 10, color: C.t3, marginBottom: 2 }}>NB-Weiterleitungs-Email</div>
            <div
              onClick={() => navigator.clipboard.writeText(`${data.publicId?.toLowerCase() || "unknown"}@baunity.de`)}
              style={{
                fontFamily: MONO,
                fontSize: 12,
                color: C.bl,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 4,
                background: C.blB,
                display: "inline-block",
              }}
            >
              {`${data.publicId?.toLowerCase() || "unknown"}@baunity.de`}
            </div>
          </div>
        </Box>

        {/* === Ersteller === */}
        <Box title="Ersteller">
          {data.createdByName && <CopyField label="Name" value={data.createdByName} />}
          {data.createdByRole && <CopyField label="Rolle" value={data.createdByRole} />}
          {data.createdByCompany && <CopyField label="Firma" value={data.createdByCompany} />}
          <CopyField label="Erstellt am" value={formatDate(data.createdAt)} />
          {data.assignedToName && (
            <>
              <div style={{ height: 1, background: C.bd, margin: "2px 6px" }} />
              <CopyField label="Zugewiesen" value={data.assignedToName} />
            </>
          )}
        </Box>

        {/* === Meta === */}
        <Box title="Meta">
          <CopyField label="ID" value={data.publicId} mono />
          <CopyField label="Intern" value={String(data.id)} mono />
          <CopyField label="Version" value={wiz.wizardVersion} />
          <CopyField label="Eingereicht" value={formatDate(wiz.submittedAt)} />
          <CopyField label="Alter" value={ageDays != null ? `${ageDays} Tage` : undefined} />
          {data.reminderCount != null && data.reminderCount > 0 && (
            <CopyField label="Erinnerungen" value={String(data.reminderCount)} />
          )}
        </Box>

      </div>
    </div>
  );
}

// === HELPER COMPONENTS ===

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 10, color: color || C.t3, padding: "2px 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </div>
  );
}

function AnlageTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  const hasValue = value && value !== "—";
  return (
    <div
      style={{
        background: C.s3,
        borderRadius: 8,
        padding: "10px 14px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 4, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.t }}>{hasValue ? value : "—"}</span>
        {hasValue && <span style={{ fontSize: 11, color: C.t3 }}>{unit}</span>}
      </div>
    </div>
  );
}

function FlagChip({ label, color }: { label: string; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 6,
        background: C.s4,
        color: color || C.t2,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function MeterCard({ meter, variant }: { meter: any; variant: "abmelden" | "anmelden" }) {
  const isRed = variant === "abmelden";
  const color = isRed ? C.er : C.ok;
  const bgColor = isRed ? C.erB : C.okB;
  const borderColor = color + "30";

  return (
    <div
      style={{
        flex: "1 1 200px",
        border: `1px solid ${borderColor}`,
        background: bgColor,
        borderRadius: 8,
        padding: "8px 10px",
        minWidth: 180,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            color: color,
            animation: "glowPulse 2s infinite",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {isRed ? "Abmelden" : "Anmelden"}
        </span>
      </div>
      <CopyField label="Nr." value={meter.zaehlernummer} mono />
      {meter.typ && <CopyField label="Typ" value={meter.typ} />}
      {meter.standort && <CopyField label="Standort" value={meter.standort} />}
      {meter.zaehlpunktbezeichnung && <CopyField label="Zählpunkt" value={meter.zaehlpunktbezeichnung} mono />}
    </div>
  );
}
