/**
 * Detail Panel Live — Lädt echte Installation-Daten und rendert das V2-Panel
 * Wird als Route /netzanmeldungen/:id eingebunden
 */
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/AuthContext";

// ─── Data Loader ────────────────────────────────────────────────────────────

function useAuthFetch() {
  return useCallback(async <T = any>(url: string): Promise<T> => {
    const token = localStorage.getItem("baunity_token") || "";
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }, []);
}

interface MappedData {
  betreiber: Record<string, any>;
  eigentuemer: Record<string, any> | null;
  standort: Record<string, any>;
  anlage: Record<string, any>;
  zaehler: Record<string, any>;
  zaehlerBestand: any[];
  zaehlerNeu: Record<string, any>;
  nb: Record<string, any>;
  mastr: Record<string, any>;
  ibn: Record<string, any>;
  rechnung: Record<string, any>;
  wizard: Record<string, any>;
  factro: Record<string, any>;
  crm: Record<string, any>;
  dedicatedEmail: string;
  publicId: string;
  createdAt: string;
  createdByName: string;
  createdByRole: string;
  assignedToName: string;
  _linkedCrmId: number | null;
  _linkedCrmTitel: string | null;
  _linkedCrmStage: string | null;
  _linkedInstallationId: number | null;
  _linkedInstallationPublicId: string | null;
  _linkedFactroNumber: string | null;
  _linkedFactroTaskId: string | null;
  _raw: Record<string, any>;
}

interface MappedEmails {
  id: number; dir: string; subj: string; from: string; to: string;
  date: string; preview: string; body: string; files: string[]; attachmentIds?: (number | null)[];
}

function mapInstallationToData(d: any): MappedData {
  const wc = typeof d.wizardContext === "string" ? (() => { try { return JSON.parse(d.wizardContext); } catch { return {}; } })() : (d.wizardContext || {});
  const td = d.technicalData || d.technicalDetails || {};
  const wcTech = wc.technical || {};
  const wcCustomer = wc.customer || {};
  const wcLocation = wc.location?.siteAddress || {};
  const wcMeter = wc.meter || {};
  const wcOwnership = wc.ownership || {};
  const wcAuth = wc.authorization || {};
  const wcComm = wc.commissioning || {};

  const pvs = wcTech.pvEntries || td.dachflaechen || td.pvEntries || [];
  const wrs = wcTech.inverterEntries || td.wechselrichter || td.inverterEntries || [];
  const bats = wcTech.batteryEntries || td.speicher || td.storageEntries || td.batteryEntries || [];
  const wbs = wcTech.wallboxEntries || td.wallboxen || td.wallboxEntries || [];
  const hps = wcTech.heatpumpEntries || td.waermepumpen || td.heatpumpEntries || [];

  const crm = d.crmProjekt || {};
  const fp = (d.factroProjects || [])[0] || {};
  // Factro-Daten: Entweder aus factroProjects ODER aus CRM-Projekt
  const factroNumber = fp.factroNumber || crm.factroNumber || "";
  const factroTaskId = fp.factroTaskId || crm.factroTaskId || "";

  // Betreiber: Aus technicalData.betreiber wenn vorhanden (Factro-Projekte = NIVOMA), sonst Wizard
  const betreiberTd = td.betreiber || {};
  const hasBetreiberTd = !!betreiberTd.firma;

  return {
    betreiber: hasBetreiberTd ? {
      vorname: betreiberTd.vertreter?.split(" ")[0] || "",
      nachname: betreiberTd.vertreter?.split(" ").slice(1).join(" ") || "",
      typ: "Gewerbe",
      anrede: "",
      strasse: betreiberTd.strasse || "",
      hausnr: betreiberTd.hausnummer || "",
      plz: betreiberTd.plz || "",
      ort: betreiberTd.ort || "",
      email: betreiberTd.email || "",
      telefon: betreiberTd.telefon || "",
      geburtsdatum: "",
      firma: betreiberTd.firma || "",
      vertreter: betreiberTd.vertreter || "",
    } : {
      vorname: wcCustomer.firstName || d.customerName?.split(" ")[0] || "",
      nachname: wcCustomer.lastName || d.customerName?.split(" ").slice(1).join(" ") || "",
      typ: d.customerType === "BUSINESS" ? "Gewerbe" : "Privat",
      anrede: wcCustomer.salutation === "herr" ? "Herr" : wcCustomer.salutation === "frau" ? "Frau" : "",
      strasse: d.strasse || wcLocation.street || "",
      hausnr: d.hausNr || wcLocation.houseNumber || "",
      plz: d.plz || "", ort: d.ort || "",
      email: d.contactEmail || wcCustomer.email || "",
      telefon: d.contactPhone || wcCustomer.phone || "",
      mobil: wcCustomer.mobile || "",
      geburtsdatum: d.kundeGeburtsdatum || wcCustomer.birthDate || "",
      iban: wcCustomer.iban || "",
      firma: wcCustomer.companyName || "", vertreter: "",
    },
    // Anschluss-Eigentümer: Bei Factro aus CRM-Projekt (kundenName), bei Wizard aus Eigentümer-Daten
    eigentuemer: hasBetreiberTd ? {
      name: crm.kundenName || crm.titel?.split("—")[0]?.split(" — ")[0]?.trim() || d.customerName || "",
      email: crm.kontaktEmail || d.contactEmail || "",
      telefon: crm.kontaktTelefon || d.contactPhone || "",
      strasse: d.strasse || "",
      plz: d.plz || "",
      ort: d.ort || "",
    } : null,
    standort: {
      strasse: d.strasse || wcLocation.street || "", hausnr: d.hausNr || wcLocation.houseNumber || "",
      plz: d.plz || "", ort: d.ort || "",
      bundesland: d.bundesland || wcLocation.state || "", land: d.land || "DE",
      gemarkung: d.gemarkung || wcLocation.cadastralDistrict || "",
      flur: d.flur || wcLocation.parcel || "",
      flurstuck: d.flurstueck || wcLocation.parcelNumber || "",
      gps: d.gpsLat && d.gpsLng ? `${d.gpsLat}, ${d.gpsLng}` : (wcLocation.gpsLat && wcLocation.gpsLng ? `${wcLocation.gpsLat}, ${wcLocation.gpsLng}` : ""),
      googleMapsLink: d.gpsLat ? `https://maps.google.com/?q=${d.gpsLat},${d.gpsLng}` : (wcLocation.gpsLat ? `https://maps.google.com/?q=${wcLocation.gpsLat},${wcLocation.gpsLng}` : ""),
      istEigentuemer: d.istEigentuemer ?? wcOwnership.isOwner ?? null,
      zustimmungVorhanden: d.zustimmungVorhanden ?? wcOwnership.consentAvailable ?? null,
    },
    anlage: (() => {
      const systemTyp = td.systemTyp || "";
      const isSpeicher = systemTyp === "Schwarmspeicher" || systemTyp === "Großbatteriespeicher";

      // Leistung berechnen: Bei Speichern aus WR-Einträgen, sonst aus totalKwp
      let kwpVal = d.totalKwp || td.totalPvKwPeak || wcTech.totalPvKwp || 0;
      if (isSpeicher && (!kwpVal || kwpVal === 0)) {
        // Leistung aus WR: count * powerKw
        kwpVal = wrs.reduce((sum: number, wr: any) => sum + ((wr.count || 1) * (wr.powerKw || wr.leistungKw || 0)), 0);
      }
      const totalBatKwh = td.totalBatteryKwh || bats.reduce((sum: number, b: any) => sum + ((b.count || 1) * (b.capacityKwh || b.kapazitaetKwh || 0)), 0);
      const totalWrKva = td.totalInverterKva || wrs.reduce((sum: number, wr: any) => sum + ((wr.count || 1) * (wr.powerKva || wr.leistungKva || 0)), 0);

      return {
      systemTyp,
      kwp: kwpVal ? Number(kwpVal).toFixed(2) : "0",
      totalInverterKva: totalWrKva ? Number(totalWrKva).toFixed(2) : "0",
      totalBatteryKwh: totalBatKwh ? Number(totalBatKwh || d.speicherKwh).toFixed(2) : "0",
      pvEntries: pvs.map((pv: any) => ({
        roofName: pv.roofName || pv.name || "Dach", manufacturer: pv.manufacturer || pv.modulHersteller || "",
        model: pv.model || pv.modulModell || "", count: pv.count || pv.modulAnzahl || 0,
        powerWp: pv.powerWp || pv.modulLeistungWp || 0, orientation: pv.orientation || pv.ausrichtung || "",
        tilt: pv.tilt || pv.neigung || 0, shading: pv.shading || "", enabled: true,
      })),
      inverterEntries: wrs.map((wr: any) => ({
        manufacturer: wr.manufacturer || wr.hersteller || "", model: wr.model || wr.modell || "",
        powerKva: wr.powerKva || wr.leistungKva || 0, acPowerKw: wr.powerKw || wr.leistungKw || 0,
        count: wr.count || wr.anzahl || 1, zerezId: wr.zerezId || "", hybrid: wr.hybrid || false,
      })),
      batteryEntries: bats.map((b: any) => ({
        manufacturer: b.manufacturer || b.hersteller || "", model: b.model || b.modell || "",
        capacityKwh: b.capacityKwh || b.kapazitaetKwh || 0, count: b.count || b.anzahl || 1,
        coupling: b.coupling || b.kopplung || "", batteryType: b.batteryType || b.batterietyp || "",
        ladeleistungKw: b.powerKw || b.ladeleistungKw || 0, entladeleistungKw: b.powerKw || b.entladeleistungKw || 0,
        apparentPowerKva: b.apparentPowerKva || 0, ratedCurrentA: b.ratedCurrentA || 0,
        connectionPhase: b.connectionPhase || "",
        emergencyPower: b.emergencyPower ?? false, backupPower: b.backupPower ?? false,
        islandForming: b.islandForming ?? false, naProtectionPresent: b.naProtectionPresent ?? false,
        allPoleSeparation: b.allPoleSeparation ?? false,
        enabled: true,
      })),
      wallboxEntries: wbs.map((w: any) => ({
        manufacturer: w.manufacturer || w.hersteller || "", model: w.model || w.modell || "",
        powerKw: w.powerKw || w.leistungKw || 0, count: w.count || w.anzahl || 1,
        phasen: w.phases || w.phasen || 3, stecker: w.socketType || w.steckdose || "Typ 2",
        steuerbar14a: w.controllable14a ?? w.steuerbar14a ?? false,
      })),
      waermepumpeEntries: hps.map((h: any) => ({
        manufacturer: h.manufacturer || h.hersteller || "", model: h.model || h.modell || "",
        powerKw: h.powerKw || h.leistungKw || 0, cop: 0, count: 1,
        type: h.type || "", // Luft/Wasser/Sole
        sgReady: h.sgReady ?? false, steuerbar14a: h.controllable14a ?? h.steuerbar14a ?? false,
      })),
      einspeisung: (wcTech.feedInType || td.feedInType || d.einspeiseart || "").replace("ueberschuss", "Überschuss").replace("volleinspeisung", "Volleinspeisung") || "—",
      einspeisephasen: wcTech.feedInPhases || "",
      messkonzept: d.messkonzept || wcTech.messkonzept || "—",
      betriebsweise: wcTech.operationMode?.inselbetrieb ? "Inselbetrieb" : "Netzparallel",
      blindleistungskompensation: wcTech.reactiveCompensation?.vorhanden ? "Ja" : "",
      einspeisemanagement: wcTech.feedInManagement?.ferngesteuert ? "Ferngesteuert" : wcTech.feedInManagement?.dauerhaftBegrenzt ? "Dauerhaft begrenzt" : "",
      netzebene: wcTech.netzebene || td.gridLevel || "Niederspannung",
      begrenzungProzent: wcTech.feedInManagement?.begrenzungProzent || "",
      inselbetrieb: wcTech.operationMode?.inselbetrieb || false,
      naSchutzErforderlich: false,
      paragraph14a: wcTech.paragraph14a?.relevant || false,
    }; })(),
    zaehler: {
      nummer: d.zaehlernummer || wcMeter.number || wc.location?.meterNumber || "",
      typ: wcMeter.type ? wcMeter.type.replace("zweirichtung", "Zweirichtungszähler").replace("einrichtung", "Einrichtungszähler") : "",
      standort: wcMeter.location ? wcMeter.location.replace("keller", "Keller").replace("garage", "Garage").replace("hak", "HAK") : "",
      befestigung: wcMeter.mounting || "",
      tarif: wcMeter.tariffType ? wcMeter.tariffType.replace("eintarif", "Eintarif").replace("zweitarif", "Zweitarif") : "",
      besitzer: wcMeter.ownership ? wcMeter.ownership.replace("netzbetreiber", "Netzbetreiber").replace("eigentuemer", "Eigentümer") : "",
      zaehlpunkt: wcMeter.meterPointId || "", marktlokation: wcMeter.marketLocationId || "",
      standBezug: wcMeter.readingConsumption || "", standEinspeisung: wcMeter.readingFeedIn || "",
      ablesedatum: wcMeter.readingDate || "",
      fernauslesung: wcMeter.remoteReading ?? false, smartMeterGateway: wcMeter.smartMeterGateway ?? false,
      imsysGewuenscht: wcMeter.imsysRequested ?? false,
      wandlermessung: wcMeter.transformerMeasurement ?? false,
    },
    zaehlerBestand: wc.meterInventory || [],
    zaehlerNeu: wc.newMeter || {},
    nb: {
      name: d.gridOperator || wc.location?.netOperator?.name || "", email: d.nbEmail || "",
      portal: d.nbPortalUrl || "", az: d.nbCaseNumber || "",
      eingereichtAm: d.nbEingereichtAm ? new Date(d.nbEingereichtAm).toLocaleDateString("de-DE") : "",
      genehmigungAm: d.nbGenehmigungAm ? new Date(d.nbGenehmigungAm).toLocaleDateString("de-DE") : "",
      rueckfrageText: d.nbRueckfrageText || "",
      rueckfrageAm: d.nbRueckfrageAm ? new Date(d.nbRueckfrageAm).toLocaleDateString("de-DE") : "",
      rueckfrageBeantwortet: d.nbRueckfrageBeantwortet ?? false,
      daysAtNb: d.daysAtNb || d.daysAtCurrentStatus || 0,
    },
    mastr: { nrSolar: d.mastrNrSolar || "", nrSpeicher: d.mastrNrSpeicher || "", status: d.mastrStatus || "", syncAm: d.mastrSyncAm || "" },
    ibn: {
      erledigt: d.ibnErledigt || wcComm.commissioningStatus === "erledigt" || false,
      erledigtAm: d.ibnErledigtAm || wcComm.actualDate || "",
      geplantAm: wcComm.plannedDate || "",
      status: wcComm.commissioningStatus || "",
      eegDatum: wcComm.eegDate || "",
      protokollUrl: d.ibnProtokollUrl || "",
      mastrRegistered: wcComm.mastrRegistered ?? false,
      gridOperatorNotified: wcComm.gridOperatorNotified ?? false,
    },
    rechnung: {
      gestellt: d.rechnungGestellt || false, nummer: d.rechnungNummer || "", datum: d.rechnungDatum || "",
      betrag: d.rechnungBetrag || "", bezahlt: d.rechnungBezahlt || false, bezahltAm: d.rechnungBezahltAm || "",
    },
    wizard: {
      caseType: d.caseType || wc.caseType || "", processType: wc.processType || "",
      registrationTargets: d.registrationTargets ? JSON.parse(d.registrationTargets) : (wc.registrationTargets || []),
      createCustomerPortal: wcAuth.createCustomerPortal ?? false,
      vollmachtErteilt: wcAuth.powerOfAttorney ?? false, agbAkzeptiert: wcAuth.termsAccepted ?? false,
      datenschutzAkzeptiert: wcAuth.privacyAccepted ?? false, mastrVoranmeldung: wcAuth.mastrRegistration ?? false,
      priority: d.priority || "",
    },
    factro: {
      projectId: factroTaskId || "", number: factroNumber || "", taskState: fp.factroTaskState || crm.factroTaskState || "",
      datenraumLink: fp.datenraumLink || crm.datenraumLink || "", firmenname: fp.firmenname || crm.firmenname || "", eingangDatum: fp.eingangDatum || "",
    },
    crm: {
      id: crm.id || 0, titel: crm.titel || "", stage: crm.stage || "",
      quelle: crm.quelle || "", quelleDetail: crm.quelleDetail || "",
      geschaetzterWert: crm.geschaetzterWert ? `${Number(crm.geschaetzterWert).toLocaleString("de-DE")} €` : "",
      prioritaet: crm.prioritaet || "", tags: crm.tags || [], hvName: crm.hvName || "",
      zustaendiger: d.assignedToName || "",
    },
    dedicatedEmail: d.dedicatedEmail || "",
    publicId: d.publicId || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toLocaleString("de-DE") : "",
    createdByName: d.createdByName || "",
    createdByRole: d.createdByRole || "",
    assignedToName: d.assignedToName || "",
    // Verknüpfungen
    _linkedCrmId: crm.id || null,
    _linkedCrmTitel: crm.titel || null,
    _linkedCrmStage: crm.stage || null,
    _linkedInstallationId: null as number | null,
    _linkedInstallationPublicId: null as string | null,
    _linkedFactroNumber: factroNumber || null,
    _linkedFactroTaskId: factroTaskId || null,
    _raw: d,
  };
}

function mapEmails(data: any[]): MappedEmails[] {
  return (data || []).map((e: any) => ({
    id: e.id,
    dir: e.direction === "INBOUND" || e.direction === "INCOMING" || e.type === "received" ? "in" : "out",
    subj: e.subject || e.betreff || "E-Mail",
    from: e.from || e.fromEmail || e.fromAddress || e.von || "",
    to: e.to || e.toEmail || e.toName || e.an || "",
    date: (e.sentAt || e.receivedAt || e.createdAt) ? new Date(e.sentAt || e.receivedAt || e.createdAt).toLocaleString("de-DE") : "",
    preview: (e.bodyText || e.bodyPreview || "").substring(0, 120),
    body: e.bodyText || e.bodyPreview || e.body || "",
    files: Array.isArray(e.attachments) ? e.attachments.map((a: any) => a.filename || a.name || "Datei") : [],
    attachmentIds: Array.isArray(e.attachments) ? e.attachments.map((a: any) => a.id || a.documentId || null) : [],
  }));
}

function mapActivities(d: any): { id: number; icon: string; text: string; date: string; type: string }[] {
  const items: any[] = [];
  // StatusHistory
  (d.statusHistory || []).forEach((sh: any, i: number) => {
    items.push({ id: i + 1000, icon: "🔄", text: `Status: ${sh.fromStatus || sh.from_status} → ${sh.toStatus || sh.to_status}`, date: new Date(sh.createdAt || sh.created_at).toLocaleString("de-DE"), type: "status" });
  });
  // Comments
  (d.comments || []).forEach((c: any, i: number) => {
    const text = (c.message || c.text || "").replace(/^\[[^\]]+\]\s*/, "");
    items.push({ id: i + 2000, icon: c.isSystem ? "⚙️" : "💬", text, date: new Date(c.createdAt).toLocaleString("de-DE"), type: "comment" });
  });
  // Documents — NICHT als Kommentare/Activities zeigen, nur im Dokumente-Tab
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, 20);
}

function mapDocs(d: any): { id: number; name: string; type: string; status: string; date: string; url?: string }[] {
  return (d.documents || []).map((doc: any, i: number) => ({
    id: doc.id || i,
    name: doc.originalName || doc.dateiname || "Dokument",
    type: (doc.kategorie || "").includes("VDE") ? "vde" : "pflicht",
    status: "uploaded",
    date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("de-DE") : "",
    url: doc.url || `/api/documents/${doc.id}/download`,
  }));
}

function mapComments(d: any): { id: number; author: string; text: string; date: string; source: string }[] {
  return (d.comments || []).map((c: any, i: number) => {
    const m = (c.message || c.text || "").match(/^\[([^\]]+)\]\s*/);
    return {
      id: c.id || i,
      author: c.isSystem ? "System" : m ? m[1] : (c.authorName || "User"),
      text: m ? (c.message || c.text).replace(m[0], "") : (c.message || c.text || ""),
      date: new Date(c.createdAt).toLocaleString("de-DE"),
      source: c.isSystem ? "system" : "manual",
    };
  });
}

// ─── CRM Data Mappers ───────────────────────────────────────────────────────

function mapCrmToData(p: any): MappedData {
  const ab = p.anlagenbetreiber ? (typeof p.anlagenbetreiber === "string" ? JSON.parse(p.anlagenbetreiber) : p.anlagenbetreiber) : null;
  return {
    betreiber: {
      vorname: ab?.vorname || p.kundenName?.split(" ")[0] || "",
      nachname: ab?.nachname || p.kundenName?.split(" ").slice(1).join(" ") || "",
      typ: ab?.typ === "GEWERBE" ? "Gewerbe" : "Privat", anrede: ab?.anrede || "",
      strasse: p.strasse || ab?.adresse?.strasse || "", hausnr: p.hausNr || ab?.adresse?.hausnummer || "",
      plz: p.plz || ab?.adresse?.plz || "", ort: p.ort || ab?.adresse?.ort || "",
      email: p.kontaktEmail || ab?.kontakt?.email || "", telefon: p.kontaktTelefon || ab?.kontakt?.telefon || "",
      geburtsdatum: "", firma: ab?.firma?.name || "", vertreter: ab?.vertreter || "",
    },
    eigentuemer: null,
    standort: {
      strasse: p.strasse || "", hausnr: p.hausNr || "", plz: p.plz || "", ort: p.ort || "",
      bundesland: "", land: "DE", gemarkung: "", flur: "", flurstuck: "", gps: "",
      googleMapsLink: "", istEigentuemer: null, zustimmungVorhanden: null,
    },
    anlage: {
      kwp: p.totalKwp ? Number(p.totalKwp).toFixed(2) : "0", totalInverterKva: "0", totalBatteryKwh: p.speicherKwh ? Number(p.speicherKwh).toFixed(2) : "0",
      pvEntries: [], inverterEntries: [], batteryEntries: [], wallboxEntries: [], waermepumpeEntries: [],
      einspeisung: p.einspeiseart || "—", messkonzept: p.messkonzept || "—",
      betriebsweise: "Netzparallel", blindleistungskompensation: "", einspeisemanagement: "",
      netzebene: "Niederspannung", begrenzungProzent: "", inselbetrieb: false, naSchutzErforderlich: false, paragraph14a: false,
    },
    zaehler: { nummer: "", typ: "", standort: "", tarif: "", zaehlpunkt: "", marktlokation: "", fernauslesung: false, smartMeterGateway: false, imsysGewuenscht: false },
    zaehlerBestand: [], zaehlerNeu: {},
    nb: { name: "", email: "", portal: "", az: "", eingereichtAm: "", genehmigungAm: "", rueckfrageText: "", rueckfrageAm: "", rueckfrageBeantwortet: false, daysAtNb: 0 },
    mastr: { nrSolar: "", nrSpeicher: "", status: "", syncAm: "" },
    ibn: { erledigt: false, erledigtAm: "", protokollUrl: "" },
    rechnung: { gestellt: false, nummer: "", datum: "", betrag: "", bezahlt: false, bezahltAm: "" },
    wizard: { caseType: "", registrationTargets: [], vollmachtErteilt: false, agbAkzeptiert: false, datenschutzAkzeptiert: false, mastrVoranmeldung: false, priority: p.prioritaet || "" },
    factro: { projectId: "", number: "", taskState: "", datenraumLink: "", firmenname: "", eingangDatum: "" },
    crm: {
      id: p.id, titel: p.titel || "", stage: p.stage || "",
      quelle: p.quelle || "", quelleDetail: p.quelleDetail || "",
      geschaetzterWert: p.geschaetzterWert ? `${Number(p.geschaetzterWert).toLocaleString("de-DE")} €` : "",
      prioritaet: p.prioritaet || "", tags: p.tags || [], hvName: p.hvName || "",
      zustaendiger: p.zustaendiger || "",
    },
    dedicatedEmail: "", publicId: `CRM-${p.id}`,
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleString("de-DE") : "",
    createdByName: p.createdByName || "", createdByRole: "", assignedToName: "",
    // Verknüpfungen
    _linkedCrmId: null,
    _linkedCrmTitel: null,
    _linkedCrmStage: null,
    _linkedInstallationId: p.installationId || null,
    _linkedInstallationPublicId: p.installation?.publicId || null,
    _linkedFactroNumber: null,
    _linkedFactroTaskId: null,
    _raw: p,
  };
}

function mapCrmActivities(p: any): any[] {
  return (p.aktivitaeten || []).slice(0, 20).map((a: any, i: number) => ({
    id: i, icon: a.typ === "DOKUMENT" ? "📄" : a.typ === "STATUS" ? "🔄" : a.typ === "EMAIL" ? "📧" : "💬",
    text: a.titel || a.text || "",
    date: a.createdAt ? new Date(a.createdAt).toLocaleString("de-DE") : "",
    type: (a.typ || "").toLowerCase(),
  }));
}

function mapCrmDocs(p: any): any[] {
  return (p.aktivitaeten || []).filter((a: any) => a.typ === "DOKUMENT").map((a: any, i: number) => ({
    id: i, name: (a.titel || "").replace("📄 ", ""), type: "pflicht", status: "uploaded",
    date: a.createdAt ? new Date(a.createdAt).toLocaleDateString("de-DE") : "",
  }));
}

function mapCrmComments(p: any): any[] {
  return (p.kommentare || []).map((k: any, i: number) => {
    const m = (k.text || "").match(/^\[([^\]]+)\]\s*/);
    return {
      id: k.id || i, author: k.isSystem ? "System" : m ? m[1] : "User",
      text: m ? k.text.replace(m[0], "") : k.text || "",
      date: new Date(k.createdAt).toLocaleString("de-DE"),
      source: k.isSystem ? "system" : "manual",
    };
  });
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#060b18", minHeight: "100vh", padding: "40px 28px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center" }}>
          <div style={{ width: 120, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
          <div style={{ width: 250, height: 24, borderRadius: 8, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 80, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: `pulse 1.5s infinite ${i * 100}ms` }} />)}
        </div>
        <div style={{ height: 48, borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 16, animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 400, borderRadius: 16, background: "rgba(255,255,255,0.02)", animation: "pulse 1.5s infinite" }} />
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────

function ErrorState({ error, onBack }: { error: string; onBack: () => void }) {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#060b18", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#e2e8f0" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Projekt nicht gefunden</div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>{error}</div>
        <button onClick={onBack} style={{ background: "#D4A843", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← Zurück zur Liste</button>
      </div>
    </div>
  );
}

// ─── Main: Live Detail Panel ────────────────────────────────────────────────

export default function DetailPanelLive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const authFetch = useAuthFetch();

  const [data, setData] = useState<MappedData | null>(null);
  const [emails, setEmails] = useState<MappedEmails[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCrm = id?.startsWith("crm-") || false;
  const numericId = isCrm ? Number(id!.replace("crm-", "")) : Number(id);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    if (isCrm) {
      // CRM-Projekt → wenn Installation verknüpft → Dashboard, sonst CRM-only
      authFetch(`/api/crm/projekte/${numericId}`).then(async (crmRes) => {
        if (!crmRes) { setError("CRM-Projekt nicht gefunden"); setLoading(false); return; }

        if (crmRes.installationId) {
          // Hat Installation → Dashboard-Endpoint laden (gleicher Flow wie unten)
          const dashRes = await authFetch(`/api/installations/${crmRes.installationId}/dashboard`).catch(() => null);
          if (dashRes && !dashRes.error) {
            setData(dashRes as any);
            const rawEmails = dashRes.emails || [];
            setEmails(rawEmails.map((e: any) => ({
              id: e.id, dir: (e.direction || "").toLowerCase() === "inbound" ? "in" : "out",
              subj: e.subject || "E-Mail", from: e.fromAddress || "", to: e.toAddresses || "",
              date: e.date ? new Date(e.date).toLocaleString("de-DE") : "",
              preview: (e.bodyText || "").substring(0, 120), body: e.bodyText || e.bodyHtml || "",
              files: (e.attachments || []).map((a: any) => a.filename || "Datei"),
              attachmentIds: (e.attachments || []).map((a: any) => a.id || a.documentId || null),
              workflowType: e.aiType || undefined,
            })));
            const kommentare = (dashRes.kommentare || []).map((k: any) => ({
              id: k.id, author: k.author || "System", text: k.text || "",
              date: k.date ? new Date(k.date).toLocaleString("de-DE") : "", source: k.source || "system",
            }));
            const dokumente = (dashRes.dokumente || []).map((d: any) => ({
              id: d.id, name: d.originalName || d.name || "Dokument", type: (d.kategorie || "sonstige").toLowerCase(),
              status: "uploaded", date: d.date ? new Date(d.date).toLocaleDateString("de-DE") : "", url: d.url || "",
            }));
            const statusAct = (dashRes.statusHistory || []).map((sh: any, i: number) => ({
              id: i + 1000, type: "status", text: `${sh.statusLabel || sh.toStatus}${sh.comment ? ": " + sh.comment : ""}`,
              date: sh.date ? new Date(sh.date).toLocaleString("de-DE") : "", author: sh.changedByName || "System",
            }));
            const commentAct = kommentare.map((k: any) => ({ id: k.id + 2000, type: "comment", text: `${k.author}: ${k.text}`, date: k.date, author: k.author }));
            setActivities([...statusAct, ...commentAct].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setDocs(dokumente); setComments(kommentare); setLoading(false);
            return;
          }
        }
        // Kein Installation oder Dashboard-Fehler → CRM-only Darstellung
        setData(mapCrmToData(crmRes));
        setEmails(mapEmails(crmRes.emails || []));
        setActivities(mapCrmActivities(crmRes));
        setDocs(mapCrmDocs(crmRes));
        setComments(mapCrmComments(crmRes));
        setLoading(false);
      }).catch((e) => { setError(e.message); setLoading(false); });
    } else {
      // Dashboard-Endpoint: EIN Call für ALLE Daten (normalisiert vom Backend)
      authFetch(`/api/installations/${numericId}/dashboard`).then(async (dashRes) => {
        if (!dashRes || dashRes.error) { setError(dashRes?.error || "Installation nicht gefunden"); setLoading(false); return; }

        // Dashboard liefert alles fertig — kein mapInstallationToData() mehr nötig
        setData(dashRes as any);

        // Emails aus Dashboard extrahieren und für V3 mappen
        const rawEmails = dashRes.emails || [];
        setEmails(rawEmails.map((e: any) => ({
          id: e.id,
          dir: (e.direction || "").toLowerCase() === "inbound" ? "in" : "out",
          subj: e.subject || "E-Mail",
          from: e.fromAddress || e.fromName || "",
          to: e.toAddresses || "",
          date: e.date ? new Date(e.date).toLocaleString("de-DE") : "",
          preview: (e.bodyText || "").substring(0, 120),
          body: e.bodyText || e.bodyHtml || "",
          files: (e.attachments || []).map((a: any) => a.filename || "Datei"),
          attachmentIds: (e.attachments || []).map((a: any) => a.id || a.documentId || null),
          workflowType: e.aiType || undefined,
        })));

        // Kommentare
        const kommentare = (dashRes.kommentare || []).map((k: any) => ({
          id: k.id, author: k.author || "System", text: k.text || "",
          date: k.date ? new Date(k.date).toLocaleString("de-DE") : "",
          source: k.source || "system",
        }));

        // Dokumente
        const dokumente = (dashRes.dokumente || []).map((d: any) => ({
          id: d.id, name: d.originalName || d.name || "Dokument",
          type: (d.kategorie || "sonstige").toLowerCase(),
          status: "uploaded", date: d.date ? new Date(d.date).toLocaleDateString("de-DE") : "",
          url: d.url || "",
        }));

        // Unified Timeline: StatusHistory + Kommentare + Emails
        const statusActivities = (dashRes.statusHistory || []).map((sh: any, i: number) => ({
          id: i + 1000, type: "status",
          text: `${sh.statusLabel || sh.fromStatus + " → " + sh.toStatus}${sh.comment ? ": " + sh.comment : ""}`,
          date: sh.date ? new Date(sh.date).toLocaleString("de-DE") : "",
          author: sh.changedByName || "System",
        }));

        const commentActivities = kommentare.map((k: any) => ({
          id: k.id + 2000, type: "comment",
          text: `${k.author}: ${k.text}`,
          date: k.date,
          author: k.author,
        }));

        const emailActivities = rawEmails.map((e: any) => ({
          id: e.id + 5000,
          type: (e.direction || "").toLowerCase() === "inbound" ? "email_in" : "email_out",
          text: `${(e.direction || "").toLowerCase() === "inbound" ? "📩" : "📤"} ${e.subject || "E-Mail"}`,
          date: e.date ? new Date(e.date).toLocaleString("de-DE") : "",
          author: e.fromAddress || e.fromName || "",
        }));

        const docActivities = dokumente.map((doc: any) => ({
          id: doc.id + 8000, type: "doc",
          text: `📄 ${doc.name}`,
          date: doc.date,
          author: "System",
        }));

        const allActivities = [...statusActivities, ...commentActivities, ...emailActivities, ...docActivities]
          .sort((a, b) => {
            const da = new Date(a.date.split(",").length > 1 ? a.date.split(".").reverse().join("-") : a.date);
            const db = new Date(b.date.split(",").length > 1 ? b.date.split(".").reverse().join("-") : b.date);
            return db.getTime() - da.getTime();
          });

        setActivities(allActivities);
        setDocs(dokumente);
        setComments(kommentare);
        setLoading(false);

        // Dashboard hat bereits alles merged — keine Extra-Calls nötig
      }).catch((e: any) => { setError(e.message || "Fehler beim Laden"); setLoading(false); });
    }
  }, [id, isCrm, numericId, authFetch]);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorState error={error || "Unbekannter Fehler"} onBack={() => navigate("/netzanmeldungen")} />;

  // Lazy-import des eigentlichen Panels um die Datei klein zu halten
  return (
    <DetailPanelContent
      data={data}
      emails={emails}
      activities={activities}
      docs={docs}
      comments={comments}
      onBack={() => navigate("/netzanmeldungen")}
      isStaff={((user as any)?.role || "").toUpperCase() === "ADMIN" || ((user as any)?.role || "").toUpperCase() === "MITARBEITER"}
      installationId={Number(id)}
    />
  );
}

// ─── Content Component (nutzt die gemappten Daten) ──────────────────────────
// Importiert und re-exportiert das MockDetailPanelV2 mit echten Daten
// Wir exportieren die Daten über window.__DETAIL_DATA damit MockDetailPanelV2 sie nutzen kann

// Lazy-Load des MockDetailPanelV3 (ersetzt V2)
const LazyPanel = lazy(() => import("./MockDetailPanelV3"));

function DetailPanelContent({ data, emails, activities, docs, comments, onBack, isStaff, installationId }: {
  data: MappedData; emails: MappedEmails[]; activities: any[]; docs: any[]; comments: any[];
  onBack: () => void; isStaff: boolean; installationId: number;
}) {
  // Daten auf window setzen BEVOR das Panel rendert
  // MockDetailPanelV2 liest diese in seiner Render-Funktion via getLive()
  (window as any).__LIVE_DETAIL = { data, emails, activities, docs, comments, isStaff, installationId, isLive: true };

  // Cleanup bei Unmount
  useEffect(() => {
    return () => { delete (window as any).__LIVE_DETAIL; };
  }, []);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LazyPanel onBack={onBack} />
    </Suspense>
  );
}
