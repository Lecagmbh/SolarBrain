/**
 * PREMIUM OVERVIEW TAB
 * Fully functional with real API connections
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check, AlertTriangle, ArrowLeft, ExternalLink, ChevronRight,
  Mail, Paperclip, FileText, Send, Lightbulb, Sparkles, Loader2, Upload,
  Sun, Battery, Plug, Thermometer, Eye, Download, Camera, CheckCircle,
  Clock, Trash2, Plus, CalendarClock, Edit2, Info, X, Calendar,
  MessageSquare, Building2
} from 'lucide-react';
import './PremiumOverviewTab.css';
import { installationsApi } from '../../services/api';
import { sanitizeHtml } from '../../../../utils/sanitizeHtml';
import { usePermissions } from '../../../../hooks/usePermissions';
import AIAssistantPanel from '../../../../modules/installations/detail-v2/components/AIAssistantPanel';
import { PortalStatusCard } from '../../../../portal';

/* ═══════════════════ MASTR MATCH INLINE ═══════════════════ */
function MaStrMatchInline({ publicId, onMatched }: { publicId: string; onMatched?: () => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const handleMatch = useCallback(async () => {
    setState('loading');
    setResult(null);
    try {
      const res = await fetch(`/api/mastr/installations/${publicId}/match`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const json = await res.json();
      setResult(json);
      setState(json.found ? 'success' : 'error');
      if (json.found) onMatched?.();
    } catch (err: any) {
      setResult({ message: err?.message || 'Fehler' });
      setState('error');
    }
  }, [publicId, onMatched]);

  return (
    <div className="mastr-match-section">
      <div className="data-row" style={{ alignItems: 'center', gap: 8 }}>
        <span className="data-label">MaStR-Abgleich</span>
        <span className="data-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className={`btn-sm ${state === 'success' ? 'ghost' : 'primary'}`}
            onClick={handleMatch} disabled={state === 'loading'}
            style={state === 'success' ? { background: 'var(--success-muted)', color: 'var(--success)', borderColor: 'var(--success)' } : undefined}
          >
            {state === 'loading' ? <><Loader2 size={12} className="spin" /> Suche...</>
              : state === 'success' ? <><Check size={12} /> Verknüpft</>
              : 'Auto-Suche'}
          </button>
          {state === 'error' && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
              Kein Treffer ({result?.totalInPlz ?? 0} in PLZ durchsucht)
            </span>
          )}
        </span>
      </div>
      {result?.solar?.mastrNr && (
        <div className="data-row">
          <span className="data-label"><Sun size={12} /> Solar</span>
          <span className="data-value mono" style={{ color: 'var(--success)' }}>{result.solar.mastrNr}</span>
        </div>
      )}
      {result?.speicher?.mastrNr && (
        <div className="data-row">
          <span className="data-label"><Battery size={12} /> Speicher</span>
          <span className="data-value mono" style={{ color: 'var(--success)' }}>{result.speicher.mastrNr}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ MASTR CONFIRM INLINE ═══════════════════ */
function MaStrConfirmInline({ installId, hasStorage, onConfirmed }: { installId: number; hasStorage: boolean; onConfirmed?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    const mastrNrSolar = prompt('MaStR-Nr. Solar (SEE...):');
    if (!mastrNrSolar) return;

    if (!mastrNrSolar.trim().startsWith('SEE')) {
      alert('MaStR-Nr. Solar muss mit "SEE" beginnen.');
      return;
    }

    let mastrNrSpeicher: string | undefined;
    if (hasStorage) {
      const input = prompt('MaStR-Nr. Speicher (SSE..., optional — leer lassen wenn nicht vorhanden):');
      if (input && input.trim()) {
        if (!input.trim().startsWith('SSE')) {
          alert('MaStR-Nr. Speicher muss mit "SSE" beginnen.');
          return;
        }
        mastrNrSpeicher = input.trim();
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/installations/${installId}/confirm-mastr`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mastrNrSolar: mastrNrSolar.trim(), mastrNrSpeicher }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Fehler');
      onConfirmed?.();
    } catch (err: any) {
      alert(err?.message || 'Fehler beim Bestätigen der MaStR-Registrierung');
    } finally {
      setLoading(false);
    }
  }, [installId, hasStorage, onConfirmed]);

  return (
    <div className="data-row" style={{ alignItems: 'center', gap: 8 }}>
      <span className="data-label">MaStR bestätigen</span>
      <span className="data-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-sm primary" onClick={handleConfirm} disabled={loading}
          style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
        >
          {loading ? <><Loader2 size={12} className="spin" /> Wird bestätigt...</> : 'MaStR-Registrierung bestätigen'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Setzt IBN-Datum + MaStR-Status</span>
      </span>
    </div>
  );
}

// Types
interface StatusHistoryItem {
  id: number;
  fromStatus?: string;
  toStatus: string;
  statusLabel: string;
  changedByName: string;
  comment?: string;
  createdAt: string;
}

// Technische Komponenten
interface TechComponent {
  hersteller?: string;
  modell?: string;
  anzahl?: number;
}

interface PVDachflaeche extends TechComponent {
  modulHersteller?: string;
  modulModell?: string;
  modulAnzahl?: number;
  modulLeistungWp?: number;
  ausrichtung?: string;
  neigung?: number;
}

interface Wechselrichter extends TechComponent {
  leistungKw?: number;
  hybrid?: boolean;
}

interface Speicher extends TechComponent {
  kapazitaetKwh?: number;
  leistungKw?: number;
  kopplung?: string;
}

interface Wallbox extends TechComponent {
  leistungKw?: number;
}

interface Waermepumpe extends TechComponent {
  leistungKw?: number;
}

interface TechnicalDetails {
  messkonzept?: string;
  dachflaechen?: PVDachflaeche[];
  wechselrichter?: Wechselrichter[];
  speicher?: Speicher[];
  wallboxen?: Wallbox[];
  waermepumpen?: Waermepumpe[];
}

interface Installation {
  id: number;
  publicId?: string;
  status: string;
  customerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  birthDate?: string;
  gridOperator?: string;
  gridOperatorId?: number;
  gridOperatorPortalUrl?: string;
  nbEmail?: string;
  nbCaseNumber?: string;
  zaehlernummer?: string;
  totalKwp?: number;
  speicherKwh?: number;
  wallboxKw?: number;
  waermepumpeKw?: number;
  daysAtNb?: number;
  nbEingereichtAm?: string;
  createdAt?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  statusHistory?: StatusHistoryItem[];
  technicalDetails?: TechnicalDetails;
  // Ersteller-Infos
  createdById?: number;
  createdByName?: string;
  createdByEmail?: string;
  createdByRole?: string;
  createdByCompany?: string;
  // Abrechnungs-Infos
  rechnungGestellt?: boolean;
  rechnungNummer?: string;
  rechnungDatum?: string;
  rechnungBetrag?: number;
  rechnungBezahlt?: boolean;
  rechnungBezahltAm?: string;
  // 🔥 NEU: Wizard-Kontext für vollständige Daten
  wizardContext?: string;
  // 🔥 NEU: Technical Data (WhatsApp Bot Format)
  technicalData?: {
    // Vorgangsart
    vorgangsart?: string;
    // PV
    pvAnzahl?: number;
    pvHersteller?: string;
    pvModell?: string;
    pvLeistungWp?: number;
    // Wechselrichter
    wrAnzahl?: number;
    wrHersteller?: string;
    wrModell?: string;
    wrLeistungKw?: number;
    wrZerezId?: string;
    // Speicher
    speicherAnzahl?: number;
    speicherHersteller?: string;
    speicherModell?: string;
    speicherKwh?: number;
    speicherZerezId?: string;
    // Gesamtleistung
    anlagenLeistungKwp?: number;
    // MaStR
    mastrAnlegen?: boolean;
    // Zähler
    zaehlerAbmelden?: boolean;
    zaehlerNummern?: string[];
  };
  // Zählerwechsel
  zaehlerwechselDatum?: string;
  zaehlerwechselUhrzeit?: string;
  zaehlerwechselKommentar?: string;
  zaehlerwechselKundeInformiert?: boolean;
  // Dokumente (für Foto-Anzeige)
  documents?: Array<{
    id: number;
    dateiname?: string;
    originalName?: string;
    kategorie?: string;
    dokumentTyp?: string;
    url?: string;
    createdAt?: string;
  }>;
}

// 🔥 Helper: Wizard-Kontext parsen
function parseWizardContext(wc?: string | object): any {
  if (!wc) return {};
  // Backend gibt bereits geparsten JSON zurück (Objekt), kein String
  if (typeof wc === 'object') return wc;
  try {
    return JSON.parse(wc);
  } catch {
    return {};
  }
}

// 🔥 UNIVERSAL WIZARD DATA NORMALIZER
// Unterstützt ALLE Wizard-Formate (alt/LECA und neu/V19) und normalisiert zu einheitlicher Struktur
function normalizeWizardData(wc: any, detail: any): NormalizedWizardData {
  // LECA Format Detection: Hat pv/inverter/storage statt pvEntries/inverterEntries/batteryEntries
  const isLecaFormat = wc?.technical?.pv && !wc?.technical?.pvEntries;

  const result: NormalizedWizardData = {
    // Anmeldungsinfo
    caseType: wc?.caseType || wc?.step1?.kategorie || detail?.caseType,
    processType: wc?.processType || wc?.step1?.vorgangsart || detail?.technicalData?.vorgangsart,
    groessenklasse: wc?.groessenklasse || wc?.step1?.groessenklasse,
    registrationTargets: wc?.registrationTargets || wc?.step1?.komponenten || [],

    // Zähler-Prozess (V19: meterProcess, Step1: zaehlerProzess)
    meterProcess: (wc?.meterProcess || wc?.step1?.zaehlerProzess) ? {
      prozessTyp: wc?.meterProcess?.processType || wc?.step1?.zaehlerProzess?.prozessTyp,
      altZaehlernummer: wc?.meterProcess?.oldMeterNumber || wc?.step1?.zaehlerProzess?.altZaehlernummer,
      neuZaehlertyp: wc?.meterProcess?.newMeterType || wc?.step1?.zaehlerProzess?.neuZaehlertyp,
      neuStandort: wc?.meterProcess?.newLocation || wc?.step1?.zaehlerProzess?.neuStandort,
      neuTarifart: wc?.meterProcess?.newTariffType || wc?.step1?.zaehlerProzess?.neuTarifart,
      antragGestellt: wc?.meterProcess?.applicationSubmitted ?? wc?.step1?.zaehlerProzess?.antragGestellt,
    } : undefined,

    // Fertigmeldung (V19: completion, Step1: fertigmeldung)
    completion: (wc?.completion || wc?.step1?.fertigmeldung) ? {
      installationAbgeschlossen: wc?.completion?.installationComplete ?? wc?.step1?.fertigmeldung?.installationAbgeschlossen,
      netzbetreiberMeldung: wc?.completion?.gridOperatorNotified ?? wc?.step1?.fertigmeldung?.netzbetreiberMeldung,
      mastrGemeldet: wc?.completion?.mastrRegistered ?? wc?.step1?.fertigmeldung?.mastrGemeldet,
      zaehlerGesetzt: wc?.completion?.meterInstalled ?? wc?.step1?.fertigmeldung?.zaehlerGesetzt,
    } : undefined,

    // Standort (V19 + Step2 + LECA)
    location: {
      street: wc?.location?.siteAddress?.street || wc?.step2?.strasse || detail?.strasse,
      houseNumber: wc?.location?.siteAddress?.houseNumber || wc?.step2?.hausnummer || detail?.hausNr,
      zip: wc?.location?.siteAddress?.zip || wc?.step2?.plz || detail?.plz,
      city: wc?.location?.siteAddress?.city || wc?.step2?.ort || detail?.ort,
      bundesland: wc?.location?.siteAddress?.state || wc?.step2?.bundesland,
      gemarkung: wc?.location?.siteAddress?.gemarkung || wc?.step2?.gemarkung,
      flur: wc?.location?.siteAddress?.flur || wc?.step2?.flur,
      flurstueck: wc?.location?.siteAddress?.flurstueck || wc?.step2?.flurstueck,
      zusatz: wc?.location?.siteAddress?.additional || wc?.step2?.zusatz,
      gpsLat: wc?.location?.siteAddress?.gpsLat || wc?.step2?.gpsLat,
      gpsLng: wc?.location?.siteAddress?.gpsLng || wc?.step2?.gpsLng,
    },

    // Netzbetreiber
    gridOperator: {
      id: wc?.location?.netOperator?.id || wc?.step4?.netzbetreiberId,
      name: wc?.location?.netOperator?.name || wc?.step4?.netzbetreiberName || detail?.gridOperator,
    },

    // Zähler (V19 + Step4 + LECA Format)
    meter: {
      number: wc?.meter?.number || wc?.step4?.zaehlernummer || wc?.step4?.zaehler?.zaehlernummer || detail?.zaehlernummer,
      type: wc?.meter?.type || wc?.step4?.zaehler?.typ,
      location: wc?.meter?.location || wc?.step4?.zaehler?.standort,
      ownership: wc?.meter?.ownership || wc?.step4?.zaehler?.eigentum,
      tariffType: wc?.meter?.tariffType || wc?.step4?.zaehler?.tarifart,
      zaehlpunkt: wc?.meter?.meterPointId || wc?.meter?.zaehlpunkt || wc?.step4?.zaehlpunktbezeichnung || wc?.step4?.zaehler?.zaehlpunktbezeichnung,
      marktlokation: wc?.meter?.marketLocationId || wc?.meter?.marktlokation || wc?.step4?.marktlokationsId || wc?.step4?.zaehler?.marktlokationsId,
      // Erweiterte Zähler-Felder (V19: englische Namen, Step4: deutsche Namen)
      fernauslesung: wc?.meter?.remoteReading ?? wc?.step4?.zaehler?.fernauslesung,
      smartMeterGateway: wc?.meter?.smartMeterGateway ?? wc?.step4?.zaehler?.smartMeterGateway,
      imsysGewuenscht: wc?.meter?.imsysRequested ?? wc?.meter?.imsysWanted ?? wc?.step4?.zaehler?.imsysGewuenscht,
      zaehlerstdBezug: wc?.meter?.readingConsumption ?? wc?.step4?.zaehler?.zaehlerstdBezug,
      zaehlerstdEinspeisung: wc?.meter?.readingFeedIn ?? wc?.step4?.zaehler?.zaehlerstdEinspeisung,
      ablesedatum: wc?.meter?.readingDate || wc?.step4?.zaehler?.ablesedatum,
      // Zähler-Wechsel-Felder
      vorhanden: wc?.meter?.exists ?? wc?.step4?.zaehler?.vorhanden,
      gewuenschterTyp: wc?.meter?.desiredType || wc?.step4?.zaehler?.gewuenschterTyp,
      gewuenschterStandort: wc?.meter?.desiredLocation || wc?.step4?.zaehler?.gewuenschterStandort,
      wechselGrund: wc?.meter?.changeReason || wc?.step4?.zaehler?.wechselGrund,
      altZaehlernummer: wc?.meter?.oldMeterNumber || wc?.step4?.zaehler?.altZaehlernummer,
    },

    // Zähler-Bestand (Multi-Zähler) — V19 speichert als meterInventory mit englischen Namen
    meterStock: normalizeMeterStock(wc),

    // Neuer Zähler (bei Wechsel/Neuanmeldung) — V19 speichert als newMeter
    meterNew: normalizeNewMeter(wc),

    // Netzanschluss (V19 + Step4)
    gridConnection: {
      hakId: wc?.gridConnection?.hakId || wc?.step4?.netzanschluss?.hakId,
      existingPowerKw: wc?.gridConnection?.existingPowerKw || wc?.step4?.netzanschluss?.bestehendeLeistungKw || wc?.step4?.bestehendeAnschlussleistung,
      existingFuseA: wc?.gridConnection?.existingFuseA || wc?.step4?.netzanschluss?.bestehendeAbsicherungA,
      requestedPowerKw: wc?.gridConnection?.requestedPowerKw || wc?.step4?.netzanschluss?.gewuenschteLeistungKw,
      requestedFuseA: wc?.gridConnection?.requestedFuseA || wc?.step4?.netzanschluss?.gewuenschteAbsicherungA,
      erdungsart: wc?.gridConnection?.groundingType || wc?.step4?.netzanschluss?.erdungsart,
      kurzschlussleistungMVA: wc?.step4?.netzanschluss?.kurzschlussleistungMVA,
      netzimpedanzOhm: wc?.step4?.netzanschluss?.netzimpedanzOhm,
      hausanschlusskastenTyp: wc?.step4?.netzanschluss?.hausanschlusskastenTyp,
      leistungserhoehungGrund: wc?.step4?.netzanschluss?.leistungserhoehungGrund,
    },

    // Zählerausbau / Demontage - nur anzeigen wenn type vorhanden
    decommissioning: (wc?.decommissioning?.type || wc?.step1?.demontage?.typ) ? {
      type: wc?.decommissioning?.type || wc?.step1?.demontage?.typ,
      reason: wc?.decommissioning?.reason || wc?.step1?.demontage?.grund,
      reasonOther: wc?.step1?.demontage?.grundSonstiges,
      meterNumber: wc?.decommissioning?.meterNumber || wc?.step1?.demontage?.altZaehlernummer,
      mastrNumber: wc?.decommissioning?.mastrNumber || wc?.step1?.demontage?.mastrNummer,
      eegAnlagenId: wc?.decommissioning?.eegId || wc?.step1?.demontage?.eegAnlagenId,
      plannedDate: wc?.decommissioning?.requestedDate || wc?.decommissioning?.plannedDate || wc?.step1?.demontage?.gewuenschtesDatum,
      lastOperationDay: wc?.decommissioning?.lastOperationDay || wc?.step1?.demontage?.letzterBetriebstag,
      leistungKwp: wc?.step1?.demontage?.leistungKwp,
      leistungKva: wc?.step1?.demontage?.leistungKva,
      speicherKwh: wc?.step1?.demontage?.speicherKwh,
      gridOperatorNotified: wc?.decommissioning?.gridOperatorNotified ?? wc?.step1?.demontage?.netzbetreiberInformiert ?? false,
      mastrDeregistered: wc?.decommissioning?.mastrDeregistered ?? wc?.step1?.demontage?.mastrAbgemeldet ?? false,
      readingDone: wc?.decommissioning?.readingDone ?? wc?.step1?.demontage?.ablesungDurchgefuehrt ?? false,
      entsorgungsnachweis: wc?.step1?.demontage?.entsorgungsnachweis,
      bemerkungen: wc?.step1?.demontage?.bemerkungen,
    } : null,

    // Inbetriebnahme (V19 + Step8) — auch anzeigen wenn MaStR-Registrierung beauftragt
    commissioning: wc?.commissioning || wc?.step8?.inbetriebnahme || wc?.authorization?.mastrRegistration ? {
      plannedDate: wc?.commissioning?.plannedDate || wc?.step8?.inbetriebnahme?.geplantesIbnDatum || wc?.step5?.geplanteIBN,
      actualDate: wc?.commissioning?.actualDate || wc?.step8?.inbetriebnahme?.tatsaechlichesIbnDatum,
      eegDate: wc?.commissioning?.eegDate || wc?.step8?.inbetriebnahme?.eegInbetriebnahme,
      mastrNumber: wc?.commissioning?.mastrNumber || wc?.step8?.inbetriebnahme?.mastrNummer || wc?.step6?.mastrNummer,
      mastrNumberSpeicher: wc?.commissioning?.mastrNumberSpeicher,
      mastrRegistered: wc?.commissioning?.mastrRegistered ?? wc?.step8?.inbetriebnahme?.mastrAngemeldet ?? false,
      mastrDate: wc?.commissioning?.mastrDate || wc?.step8?.inbetriebnahme?.mastrDatum,
      gridOperatorNotified: wc?.commissioning?.gridOperatorNotified ?? wc?.step8?.inbetriebnahme?.netzbetreiberGemeldet ?? false,
      gridOperatorNotifiedDate: wc?.commissioning?.gridOperatorNotifiedDate || wc?.step8?.inbetriebnahme?.netzbetreiberMeldeDatum,
      gridOperatorConfirmed: wc?.commissioning?.gridOperatorConfirmed ?? wc?.step8?.inbetriebnahme?.netzbetreiberBestaetigung,
      status: wc?.commissioning?.status || wc?.step8?.inbetriebnahme?.ibnStatus,
    } : null,

    // Technische Daten (V19 + Step5 + LECA)
    technical: {
      feedInType: wc?.technical?.feedInType || wc?.step5?.einspeiseart,
      messkonzept: wc?.messkonzept || wc?.step5?.messkonzept || detail?.messkonzept,
      paragraph14a: wc?.step5?.paragraph14a,
      gridLevel: wc?.step5?.netzebene,
      naProtectionRequired: wc?.step5?.naSchutzErforderlich,
      gridFeedPhases: wc?.step5?.netzeinspeisungPhasen,
      totalPvKwp: wc?.technical?.totalPvKwp || wc?.technical?.totalPvKwPeak || wc?.step5?.gesamtleistungKwp || detail?.totalKwp || detail?.technicalData?.anlagenLeistungKwp,
      totalInverterKva: wc?.technical?.totalInverterKva || wc?.step5?.gesamtleistungKva || detail?.technicalData?.wrLeistungKw,
      totalBatteryKwh: wc?.technical?.totalBatteryKwh || wc?.step5?.gesamtSpeicherKwh || detail?.speicherKwh || detail?.technicalData?.speicherKwh,
      dcAcRatio: wc?.step5?.dcAcRatio,
      // Betriebsweise (E.2)
      operationMode: wc?.step5?.betriebsweise,
      // Einspeisemanagement (E.3/E.8)
      feedInManagement: wc?.step5?.einspeisemanagement,
      // Blindleistungskompensation
      reactiveCompensation: wc?.step5?.blindleistungskompensation,
      // Zusätzliche Szenarien
      mieterstrom: wc?.step5?.mieterstrom,
      energySharing: wc?.step5?.energySharing,
      mehrereAnlagen: wc?.step5?.mehrereAnlagen,
    },

    // PV-Module (V19 + Step5 + LECA)
    // LECA Format: wc.technical.pv ist ein einzelnes Objekt, nicht Array
    pvEntries: normalizePvEntries(wc, detail),

    // Wechselrichter (V19 + Step5 + LECA)
    inverterEntries: normalizeInverterEntries(wc, detail),

    // Speicher (V19 + Step5 + LECA)
    batteryEntries: normalizeBatteryEntries(wc, detail),

    // Wallboxen (V19 + Step5 + LECA)
    wallboxEntries: normalizeWallboxEntries(wc, detail),

    // Wärmepumpen (V19 + Step5 + LECA)
    heatpumpEntries: normalizeHeatpumpEntries(wc, detail),

    // BHKW (V19 + Step5)
    bhkwEntries: normalizeBhkwEntries(wc),

    // Windkraft (V19 + Step5)
    windEntries: normalizeWindEntries(wc),

    // Kunde (V19: customer mit englischen Namen, Step6: deutsche Namen)
    customer: wc?.customer || wc?.step6 ? {
      type: wc?.customer?.customerType || wc?.step6?.kundentyp,
      salutation: wc?.customer?.salutation || wc?.step6?.anrede,
      title: wc?.customer?.title || wc?.step6?.titel,
      firstName: wc?.customer?.firstName || wc?.step6?.vorname,
      lastName: wc?.customer?.lastName || wc?.step6?.nachname,
      company: wc?.customer?.companyName || wc?.step6?.firma,
      email: wc?.customer?.email || wc?.step6?.email || detail?.contactEmail,
      phone: wc?.customer?.phone || wc?.step6?.telefon || detail?.contactPhone,
      mobile: wc?.customer?.mobile || wc?.step6?.mobiltelefon,
      birthDate: wc?.customer?.birthDate || wc?.step6?.geburtsdatum || detail?.birthDate,
      iban: wc?.customer?.iban || wc?.step6?.iban,
      bic: wc?.customer?.bic || wc?.step6?.bic,
      accountHolder: wc?.customer?.accountHolder || wc?.step6?.kontoinhaber,
      mastrNumber: wc?.customer?.mastrNumber || wc?.step6?.mastrNummer,
      eegKey: wc?.customer?.eegKey || wc?.step6?.eegAnlagenschluessel,
      rechnungGleichStandort: !wc?.customer?.billingAddress && wc?.step6?.rechnungGleichStandort !== false,
      rechnungsadresse: wc?.customer?.billingAddress ? {
        strasse: wc.customer.billingAddress.street,
        hausnummer: wc.customer.billingAddress.houseNumber,
        plz: wc.customer.billingAddress.zip,
        ort: wc.customer.billingAddress.city,
      } : wc?.step6?.rechnungsadresse,
    } : null,

    // Autorisierung (auch für WhatsApp-Anlagen - dort immer akzeptiert)
    authorization: (wc?.authorization || wc?.step8 || detail?.technicalData) ? {
      // WhatsApp-Anlagen: Vollmacht, AGB, Datenschutz sind implizit akzeptiert
      powerOfAttorney: wc?.authorization?.powerOfAttorney ?? wc?.step8?.vollmachtErteilt ?? (detail?.technicalData ? true : false),
      mastrRegistration: wc?.authorization?.mastrRegistration ?? wc?.step8?.mastrVoranmeldung ?? detail?.technicalData?.mastrAnlegen ?? false,
      termsAccepted: wc?.authorization?.termsAccepted ?? wc?.step8?.agbAkzeptiert ?? (detail?.technicalData ? true : false),
      privacyAccepted: wc?.authorization?.privacyAccepted ?? wc?.step8?.datenschutzAkzeptiert ?? (detail?.technicalData ? true : false),
      signature: wc?.step8?.signatur,
      kundenportalAnlegen: wc?.authorization?.createCustomerPortal ?? wc?.authorization?.kundenportalAnlegen ?? wc?.step8?.kundenportalAnlegen,
    } : null,

    // Eigentümer (V19: ownership mit englischen Namen, Step3: deutsche Namen)
    owner: (wc?.ownership || wc?.step3) ? {
      isOwner: wc?.ownership?.isOwner ?? wc?.step3?.istEigentuemer,
      consentGiven: wc?.ownership?.consentAvailable ?? wc?.step3?.zustimmungVorhanden,
      ownerData: wc?.ownership ? {
        name: wc.ownership.ownerName,
        adresse: wc.ownership.ownerAddress,
        email: wc.ownership.ownerEmail,
        telefon: wc.ownership.ownerPhone,
      } : wc?.step3?.eigentuemer,
    } : null,

    // Fotos
    photos: wc?.photos || wc?.step7?.fotos || [],

    // Dokumente
    documents: wc?.step7?.dokumente || [],

    // Meta
    wizardVersion: wc?.wizardVersion,
    submittedAt: wc?.submittedAt,
  };

  return result;
}

// Helper: Array normalisieren
function normalizeArray<T>(arr: any[] | undefined, mapper: (item: any) => T): T[] {
  if (!arr) return [];
  if (!Array.isArray(arr)) return [];
  return arr.filter(Boolean).map(mapper);
}

// 🔥 PV Entries normalisieren (V19 + Step5 + LECA + WhatsApp Format)
function normalizePvEntries(wc: any, detail: any): any[] {
  // V19 Format: technical.pvEntries (Array)
  if (wc?.technical?.pvEntries && Array.isArray(wc.technical.pvEntries)) {
    return wc.technical.pvEntries.map((pv: any) => ({
      manufacturer: pv.manufacturer || pv.modulHersteller || pv.hersteller,
      model: pv.model || pv.modulModell || pv.modell,
      powerWp: pv.powerWp || pv.modulLeistungWp || pv.leistungWp,
      count: pv.count || pv.modulAnzahl || pv.anzahl || 1,
      orientation: pv.orientation || pv.ausrichtung,
      tilt: pv.tilt || pv.neigung,
      roofName: pv.roofName || pv.name,
      shading: pv.verschattung || pv.shading,
      stringsCount: pv.stringAnzahl || pv.stringsCount,
      modulesPerString: pv.moduleProString || pv.modulesPerString,
    }));
  }
  // Step5 Format: step5.dachflaechen (Array)
  if (wc?.step5?.dachflaechen && Array.isArray(wc.step5.dachflaechen)) {
    return wc.step5.dachflaechen.map((pv: any) => ({
      manufacturer: pv.modulHersteller || pv.hersteller,
      model: pv.modulModell || pv.modell,
      powerWp: pv.modulLeistungWp || pv.leistungWp,
      count: pv.modulAnzahl || pv.anzahl || 1,
      orientation: pv.ausrichtung,
      tilt: pv.neigung,
      roofName: pv.name,
      shading: pv.verschattung,
      stringsCount: pv.stringAnzahl,
      modulesPerString: pv.moduleProString,
    }));
  }
  // LECA Format: technical.pv ist einzelnes Objekt mit modules Array oder einzeln
  if (wc?.technical?.pv) {
    const pv = wc.technical.pv;
    // Wenn modules Array existiert (LECA Array Format)
    if (pv.modules && Array.isArray(pv.modules)) {
      return pv.modules.map((mod: any) => ({
        manufacturer: mod.manufacturer || mod.hersteller,
        model: mod.model || mod.modell,
        powerWp: mod.powerWp || mod.wattPeak,
        count: mod.count || mod.quantity || 1,
        orientation: mod.orientation || mod.ausrichtung,
        tilt: mod.tilt || mod.inclination,
        roofName: mod.roofName,
      }));
    }
    // Einzelnes PV-Objekt (LECA Single Format) - nur wenn Daten vorhanden
    if (pv.manufacturer || pv.powerWp || pv.count) {
      return [{
        manufacturer: pv.manufacturer || pv.moduleManufacturer,
        model: pv.model || pv.moduleModel,
        powerWp: pv.powerWp || pv.moduleWp || pv.wattPeak,
        count: pv.count || pv.moduleCount || pv.quantity || 1,
        orientation: pv.orientation,
        tilt: pv.tilt || pv.inclination,
      }];
    }
  }
  // 🔥 WhatsApp Format: detail.technicalData.pvAnzahl, pvHersteller, pvLeistungWp
  const td = detail?.technicalData;
  if (td && (td.pvAnzahl || td.pvHersteller)) {
    return [{
      manufacturer: td.pvHersteller,
      model: td.pvModell,
      powerWp: td.pvLeistungWp,
      count: td.pvAnzahl || 1,
    }];
  }
  return [];
}

// 🔥 Inverter Entries normalisieren (V19 + Step5 + LECA + WhatsApp Format)
function normalizeInverterEntries(wc: any, detail: any): any[] {
  // V19 Format
  if (wc?.technical?.inverterEntries && Array.isArray(wc.technical.inverterEntries)) {
    return wc.technical.inverterEntries.map((inv: any) => ({
      manufacturer: inv.manufacturer || inv.hersteller,
      model: inv.model || inv.modell,
      powerKw: inv.powerKw || inv.leistungKw,
      powerKva: inv.powerKva || inv.leistungKva,
      count: inv.count || inv.anzahl || 1,
      zerezId: inv.zerezId,
      hybrid: inv.hybrid ?? false,
      mpptCount: inv.mpptAnzahl || inv.mpptCount,
    }));
  }
  // Step5 Format
  if (wc?.step5?.wechselrichter && Array.isArray(wc.step5.wechselrichter)) {
    return wc.step5.wechselrichter.map((inv: any) => ({
      manufacturer: inv.hersteller,
      model: inv.modell,
      powerKw: inv.leistungKw,
      powerKva: inv.leistungKva,
      count: inv.anzahl || 1,
      zerezId: inv.zerezId,
      hybrid: inv.hybrid ?? false,
      mpptCount: inv.mpptAnzahl,
    }));
  }
  // LECA Format: technical.inverter
  if (wc?.technical?.inverter) {
    const inv = wc.technical.inverter;
    if (Array.isArray(inv)) {
      return inv.map((i: any) => ({
        manufacturer: i.manufacturer,
        model: i.model,
        powerKw: i.powerKw || i.acPowerKw,
        powerKva: i.powerKva || i.apparentPowerKva,
        count: i.count || i.quantity || 1,
        zerezId: i.zerezId || i.certificateId,
        hybrid: i.hybrid ?? i.isHybrid ?? false,
      }));
    }
    // Einzelnes Inverter-Objekt - nur wenn Daten vorhanden
    if (inv.manufacturer || inv.powerKw || inv.acPowerKw) {
      return [{
        manufacturer: inv.manufacturer,
        model: inv.model,
        powerKw: inv.powerKw || inv.acPowerKw,
        powerKva: inv.powerKva || inv.apparentPowerKva,
        count: inv.count || inv.quantity || 1,
        zerezId: inv.zerezId || inv.certificateId,
        hybrid: inv.hybrid ?? inv.isHybrid ?? false,
      }];
    }
  }
  // 🔥 WhatsApp Format: detail.technicalData.wrHersteller, wrModell, wrLeistungKw, wrZerezId
  const td = detail?.technicalData;
  if (td && (td.wrHersteller || td.wrModell)) {
    return [{
      manufacturer: td.wrHersteller,
      model: td.wrModell,
      powerKw: td.wrLeistungKw,
      powerKva: td.wrLeistungKw,
      count: td.wrAnzahl || 1,
      zerezId: td.wrZerezId,
      hybrid: td.wrModell?.toLowerCase().includes('hybrid') ?? false,
    }];
  }
  return [];
}

// 🔥 Battery Entries normalisieren (V19 + Step5 + LECA Format)
function normalizeBatteryEntries(wc: any, detail: any): any[] {
  // V19 Format
  if (wc?.technical?.batteryEntries && Array.isArray(wc.technical.batteryEntries)) {
    return wc.technical.batteryEntries.map((bat: any) => ({
      manufacturer: bat.manufacturer || bat.hersteller,
      model: bat.model || bat.modell,
      capacityKwh: bat.capacityKwh || bat.kapazitaetKwh,
      powerKw: bat.powerKw || bat.leistungKw,
      powerKva: bat.powerKva || bat.scheinleistungKva,
      count: bat.count || bat.anzahl || 1,
      coupling: bat.coupling || bat.kopplung,
      emergencyPower: bat.emergencyPower ?? bat.notstrom,
      backupPower: bat.backupPower ?? bat.ersatzstrom,
      islandCapable: bat.islandCapable ?? bat.inselnetzBildend,
      connectionPhase: bat.connectionPhase || bat.anschlussPhase,
      naProtection: bat.naProtection ?? bat.naSchutzVorhanden,
    }));
  }
  // Step5 Format
  if (wc?.step5?.speicher && Array.isArray(wc.step5.speicher)) {
    return wc.step5.speicher.map((bat: any) => ({
      manufacturer: bat.hersteller,
      model: bat.modell,
      capacityKwh: bat.kapazitaetKwh,
      powerKw: bat.leistungKw,
      powerKva: bat.scheinleistungKva,
      count: bat.anzahl || 1,
      coupling: bat.kopplung,
      emergencyPower: bat.notstrom,
      backupPower: bat.ersatzstrom,
      islandCapable: bat.inselnetzBildend,
      connectionPhase: bat.anschlussPhase,
      naProtection: bat.naSchutzVorhanden,
    }));
  }
  // LECA Format: technical.storage
  if (wc?.technical?.storage) {
    const bat = wc.technical.storage;
    // Prüfe ob Speicher aktiviert ist (LECA hat enabled Flag)
    if (bat.enabled === false) return [];
    if (Array.isArray(bat)) {
      return bat.map((b: any) => ({
        manufacturer: b.manufacturer,
        model: b.model,
        capacityKwh: b.capacityKwh || b.usableCapacityKwh,
        powerKw: b.powerKw || b.chargePowerKw,
        count: b.count || b.quantity || 1,
        coupling: b.coupling || (b.dcCoupled ? 'dc' : 'ac'),
      }));
    }
    // Nur wenn Daten vorhanden sind
    if (bat.manufacturer || bat.capacityKwh) {
      return [{
        manufacturer: bat.manufacturer,
        model: bat.model,
        capacityKwh: bat.capacityKwh || bat.usableCapacityKwh,
        powerKw: bat.powerKw || bat.chargePowerKw,
        count: bat.count || bat.quantity || 1,
        coupling: bat.coupling || (bat.dcCoupled ? 'dc' : 'ac'),
      }];
    }
  }
  // 🔥 WhatsApp Format: detail.technicalData.speicherHersteller, speicherModell, speicherKwh
  const td = detail?.technicalData;
  if (td && (td.speicherHersteller || td.speicherModell || td.speicherKwh)) {
    return [{
      manufacturer: td.speicherHersteller,
      model: td.speicherModell,
      capacityKwh: td.speicherKwh,
      zerezId: td.speicherZerezId,
    }];
  }
  return [];
}

// 🔥 Wallbox Entries normalisieren (V19 + Step5 + LECA Format)
function normalizeWallboxEntries(wc: any, detail: any): any[] {
  // V19 Format
  if (wc?.technical?.wallboxEntries && Array.isArray(wc.technical.wallboxEntries)) {
    return wc.technical.wallboxEntries.map((wb: any) => ({
      manufacturer: wb.manufacturer || wb.hersteller,
      model: wb.model || wb.modell,
      powerKw: wb.powerKw || wb.leistungKw,
      count: wb.count || wb.anzahl || 1,
      controllable14a: wb.controllable14a ?? wb.steuerbar14a ?? true,
      phases: wb.phases || wb.phasen,
      socket: wb.socket || wb.steckdose,
    }));
  }
  // Step5 Format
  if (wc?.step5?.wallboxen && Array.isArray(wc.step5.wallboxen)) {
    return wc.step5.wallboxen.map((wb: any) => ({
      manufacturer: wb.hersteller,
      model: wb.modell,
      powerKw: wb.leistungKw,
      count: wb.anzahl || 1,
      controllable14a: wb.steuerbar14a ?? true,
      phases: wb.phasen,
      socket: wb.steckdose,
    }));
  }
  // LECA Format: technical.wallbox
  if (wc?.technical?.wallbox) {
    const wb = wc.technical.wallbox;
    if (Array.isArray(wb)) {
      return wb.map((w: any) => ({
        manufacturer: w.manufacturer,
        model: w.model,
        powerKw: w.powerKw || w.chargePowerKw,
        count: w.count || w.quantity || 1,
        controllable14a: w.controllable ?? w.paragraph14a ?? true,
        phases: w.phases,
      }));
    }
    if (wb.manufacturer || wb.powerKw) {
      return [{
        manufacturer: wb.manufacturer,
        model: wb.model,
        powerKw: wb.powerKw || wb.chargePowerKw,
        count: wb.count || wb.quantity || 1,
        controllable14a: wb.controllable ?? wb.paragraph14a ?? true,
        phases: wb.phases,
      }];
    }
  }
  return [];
}

// 🔥 Heatpump Entries normalisieren (V19 + Step5 + LECA Format)
function normalizeHeatpumpEntries(wc: any, detail: any): any[] {
  // V19 Format
  if (wc?.technical?.heatpumpEntries && Array.isArray(wc.technical.heatpumpEntries)) {
    return wc.technical.heatpumpEntries.map((hp: any) => ({
      manufacturer: hp.manufacturer || hp.hersteller,
      model: hp.model || hp.modell,
      powerKw: hp.powerKw || hp.leistungKw,
      count: hp.count || hp.anzahl || 1,
      type: hp.type || hp.typ,
      sgReady: hp.sgReady,
      controllable14a: hp.controllable14a ?? hp.steuerbar14a ?? true,
    }));
  }
  // Step5 Format
  if (wc?.step5?.waermepumpen && Array.isArray(wc.step5.waermepumpen)) {
    return wc.step5.waermepumpen.map((hp: any) => ({
      manufacturer: hp.hersteller,
      model: hp.modell,
      powerKw: hp.leistungKw,
      count: hp.anzahl || 1,
      type: hp.typ,
      sgReady: hp.sgReady,
      controllable14a: hp.steuerbar14a ?? true,
    }));
  }
  // LECA Format: technical.heatPump
  if (wc?.technical?.heatPump) {
    const hp = wc.technical.heatPump;
    if (Array.isArray(hp)) {
      return hp.map((h: any) => ({
        manufacturer: h.manufacturer,
        model: h.model,
        powerKw: h.powerKw || h.electricPowerKw,
        count: h.count || h.quantity || 1,
        type: h.type || h.heatPumpType,
        sgReady: h.sgReady,
        controllable14a: h.controllable ?? h.paragraph14a ?? true,
      }));
    }
    if (hp.manufacturer || hp.powerKw) {
      return [{
        manufacturer: hp.manufacturer,
        model: hp.model,
        powerKw: hp.powerKw || hp.electricPowerKw,
        count: hp.count || hp.quantity || 1,
        type: hp.type || hp.heatPumpType,
        sgReady: hp.sgReady,
        controllable14a: hp.controllable ?? hp.paragraph14a ?? true,
      }];
    }
  }
  return [];
}

// Zähler-Bestand normalisieren (V19 meterInventory → deutsches Format)
function normalizeMeterStock(wc: any): any[] {
  // V19 Format: top-level meterInventory mit englischen Feldnamen
  if (wc?.meterInventory && Array.isArray(wc.meterInventory) && wc.meterInventory.length > 0) {
    return wc.meterInventory.map((z: any) => ({
      id: z.id,
      zaehlernummer: z.meterNumber || z.zaehlernummer,
      zaehlpunktbezeichnung: z.meterPointId || z.zaehlpunktbezeichnung,
      marktlokationsId: z.marketLocationId || z.marktlokationsId,
      typ: z.type || z.typ,
      standort: z.location || z.standort,
      tarifart: z.tariffType || z.tarifart,
      letzterStand: z.lastReading ?? z.letzterStand,
      letzterStandEinspeisung: z.lastReadingFeedIn ?? z.letzterStandEinspeisung,
      ablesedatum: z.readingDate || z.ablesedatum,
      verwendung: z.usage || z.verwendung,
      aktion: z.action || z.aktion,
    }));
  }
  // Step4 Format: zaehlerBestand mit deutschen Namen
  if (wc?.step4?.zaehlerBestand && Array.isArray(wc.step4.zaehlerBestand)) {
    return wc.step4.zaehlerBestand;
  }
  return [];
}

// Neuer Zähler normalisieren (V19 newMeter → deutsches Format)
function normalizeNewMeter(wc: any): any | undefined {
  // V19 Format: top-level newMeter mit englischen Feldnamen
  if (wc?.newMeter) {
    const nm = wc.newMeter;
    return {
      gewuenschterTyp: nm.type || nm.gewuenschterTyp,
      standort: nm.location || nm.standort,
      befestigung: nm.mounting || nm.befestigung,
      tarifart: nm.tariffType || nm.tarifart,
      imsysGewuenscht: nm.imsysRequested ?? nm.imsysGewuenscht,
      fuerAnlage: nm.forSystem || nm.fuerAnlage,
      fuerAnlageSonstige: nm.forSystemOther || nm.fuerAnlageSonstige,
      zusammenlegungVon: nm.mergeFrom || nm.zusammenlegungVon,
      wunschMsb: nm.preferredMsb || nm.wunschMsb,
      msbName: nm.msbName,
    };
  }
  // Step4 Format
  return wc?.step4?.zaehlerNeu;
}

// BHKW Entries normalisieren (V19 + Step5)
function normalizeBhkwEntries(wc: any): any[] {
  if (wc?.technical?.bhkwEntries && Array.isArray(wc.technical.bhkwEntries)) {
    return wc.technical.bhkwEntries.map((b: any) => ({
      manufacturer: b.manufacturer || b.hersteller,
      model: b.model || b.modell,
      electricPowerKw: b.electricPowerKw || b.leistungElektrischKw,
      thermalPowerKw: b.thermalPowerKw || b.leistungThermischKw,
      fuel: b.fuel || b.brennstoff,
    }));
  }
  if (wc?.step5?.bhkw && Array.isArray(wc.step5.bhkw)) {
    return wc.step5.bhkw.map((b: any) => ({
      manufacturer: b.hersteller,
      model: b.modell,
      electricPowerKw: b.leistungElektrischKw,
      thermalPowerKw: b.leistungThermischKw,
      fuel: b.brennstoff,
    }));
  }
  return [];
}

// Windkraft Entries normalisieren (V19 + Step5)
function normalizeWindEntries(wc: any): any[] {
  if (wc?.technical?.windEntries && Array.isArray(wc.technical.windEntries)) {
    return wc.technical.windEntries.map((w: any) => ({
      manufacturer: w.manufacturer || w.hersteller,
      model: w.model || w.modell,
      powerKw: w.powerKw || w.leistungKw,
      hubHeight: w.hubHeight || w.nabenhoehe,
      rotorDiameter: w.rotorDiameter || w.rotordurchmesser,
    }));
  }
  if (wc?.step5?.windkraft && Array.isArray(wc.step5.windkraft)) {
    return wc.step5.windkraft.map((w: any) => ({
      manufacturer: w.hersteller,
      model: w.modell,
      powerKw: w.leistungKw,
      hubHeight: w.nabenhoehe,
      rotorDiameter: w.rotordurchmesser,
    }));
  }
  return [];
}

// Normalisierte Wizard-Daten Interface (V19 + LECA kompatibel)
interface NormalizedWizardData {
  caseType?: string;
  processType?: string;
  groessenklasse?: string;
  registrationTargets: string[];
  // Zähler-Prozess (Step 1 - wenn Kategorie=zaehler)
  meterProcess?: {
    prozessTyp?: string;
    altZaehlernummer?: string;
    neuZaehlertyp?: string;
    neuStandort?: string;
    neuTarifart?: string;
    antragGestellt?: boolean;
  };
  // Fertigmeldung (Step 1 - wenn Kategorie=fertigmeldung)
  completion?: {
    installationAbgeschlossen?: boolean;
    netzbetreiberMeldung?: boolean;
    mastrGemeldet?: boolean;
    zaehlerGesetzt?: boolean;
  };
  location: {
    street?: string;
    houseNumber?: string;
    zip?: string;
    city?: string;
    bundesland?: string;
    gemarkung?: string;
    flur?: string;
    flurstueck?: string;
    zusatz?: string;
    gpsLat?: number;
    gpsLng?: number;
  };
  gridOperator: {
    id?: string;
    name?: string;
  };
  meter: {
    number?: string;
    type?: string;
    location?: string;
    ownership?: string;
    tariffType?: string;
    zaehlpunkt?: string;
    marktlokation?: string;
    // Erweiterte Felder
    fernauslesung?: boolean;
    smartMeterGateway?: boolean;
    imsysGewuenscht?: boolean;
    zaehlerstdBezug?: number;
    zaehlerstdEinspeisung?: number;
    ablesedatum?: string;
    vorhanden?: boolean;
    gewuenschterTyp?: string;
    gewuenschterStandort?: string;
    wechselGrund?: string;
    altZaehlernummer?: string;
  };
  meterStock: any[];
  meterNew?: any;
  gridConnection: {
    hakId?: string;
    existingPowerKw?: number;
    existingFuseA?: number;
    requestedPowerKw?: number;
    requestedFuseA?: number;
    erdungsart?: string;
    kurzschlussleistungMVA?: number;
    netzimpedanzOhm?: number;
    hausanschlusskastenTyp?: string;
    leistungserhoehungGrund?: string;
  };
  decommissioning: {
    type?: string;
    reason?: string;
    reasonOther?: string;
    meterNumber?: string;
    mastrNumber?: string;
    eegAnlagenId?: string;
    plannedDate?: string;
    lastOperationDay?: string;
    leistungKwp?: number;
    leistungKva?: number;
    speicherKwh?: number;
    gridOperatorNotified: boolean;
    mastrDeregistered: boolean;
    readingDone: boolean;
    entsorgungsnachweis?: boolean;
    bemerkungen?: string;
  } | null;
  commissioning: {
    plannedDate?: string;
    actualDate?: string;
    eegDate?: string;
    mastrNumber?: string;
    mastrNumberSpeicher?: string;
    mastrRegistered: boolean;
    mastrDate?: string;
    gridOperatorNotified: boolean;
    gridOperatorNotifiedDate?: string;
    gridOperatorConfirmed?: boolean;
    status?: string;
  } | null;
  technical: {
    feedInType?: string;
    messkonzept?: string;
    paragraph14a?: { relevant: boolean; modul?: string };
    gridLevel?: string;
    naProtectionRequired?: boolean;
    gridFeedPhases?: string;
    totalPvKwp?: number;
    totalInverterKva?: number;
    totalBatteryKwh?: number;
    dcAcRatio?: number;
    operationMode?: {
      inselbetrieb?: boolean;
      motorischerAblauf?: boolean;
      ueberschusseinspeisung?: boolean;
      volleinspeisung?: boolean;
    };
    feedInManagement?: {
      ferngesteuert?: boolean;
      dauerhaftBegrenzt?: boolean;
      begrenzungProzent?: number;
    };
    reactiveCompensation?: {
      vorhanden?: boolean;
      anzahlStufen?: number;
      blindleistungKleinsteKvar?: number;
      verdrosselungsgrad?: string;
    };
    mieterstrom?: boolean;
    energySharing?: boolean;
    mehrereAnlagen?: boolean;
  };
  pvEntries: any[];
  inverterEntries: any[];
  batteryEntries: any[];
  wallboxEntries: any[];
  heatpumpEntries: any[];
  bhkwEntries: any[];
  windEntries: any[];
  customer: {
    type?: string;
    salutation?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    birthDate?: string;
    iban?: string;
    bic?: string;
    accountHolder?: string;
    mastrNumber?: string;
    eegKey?: string;
    rechnungGleichStandort?: boolean;
    rechnungsadresse?: {
      strasse?: string;
      hausnummer?: string;
      plz?: string;
      ort?: string;
    };
  } | null;
  authorization: {
    powerOfAttorney: boolean;
    mastrRegistration: boolean;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    signature?: string;
    kundenportalAnlegen?: boolean;
  } | null;
  owner: {
    isOwner?: boolean;
    consentGiven?: boolean;
    ownerData?: any;
  } | null;
  photos: any[];
  documents: any[];
  wizardVersion?: string;
  submittedAt?: string;
}

// Dynamic button config based on current status
interface StatusAction {
  label: string;
  targetStatus: string;
  variant: 'primary' | 'danger' | 'secondary';
  icon: 'check' | 'alert' | 'arrow';
}

function getStatusActions(currentStatus: string): StatusAction[] {
  const status = currentStatus?.toLowerCase() || 'eingang';

  switch (status) {
    case 'eingang':
      return [
        { label: 'Beim NB eingereicht', targetStatus: 'beim_nb', variant: 'primary', icon: 'check' },
        { label: 'Stornieren', targetStatus: 'storniert', variant: 'danger', icon: 'alert' },
      ];
    case 'beim_nb':
      return [
        { label: 'Genehmigung erhalten', targetStatus: 'genehmigt', variant: 'primary', icon: 'check' },
        { label: 'Rückfrage', targetStatus: 'rueckfrage', variant: 'danger', icon: 'alert' },
        { label: 'Zurück', targetStatus: 'eingang', variant: 'secondary', icon: 'arrow' },
      ];
    case 'rueckfrage':
      return [
        { label: 'Rückfrage beantwortet', targetStatus: 'beim_nb', variant: 'primary', icon: 'check' },
        { label: 'Genehmigung erhalten', targetStatus: 'genehmigt', variant: 'primary', icon: 'check' },
      ];
    case 'genehmigt':
      return [
        { label: 'IBN durchgeführt', targetStatus: 'ibn', variant: 'primary', icon: 'check' },
        { label: 'Zurück zu Beim NB', targetStatus: 'beim_nb', variant: 'secondary', icon: 'arrow' },
      ];
    case 'ibn':
      return [
        { label: 'Fertig melden', targetStatus: 'fertig', variant: 'primary', icon: 'check' },
        { label: 'Zurück', targetStatus: 'genehmigt', variant: 'secondary', icon: 'arrow' },
      ];
    case 'fertig':
      return [
        { label: 'Abrechnen', targetStatus: 'abgerechnet', variant: 'primary', icon: 'check' },
      ];
    case 'abgerechnet':
    case 'storniert':
      return []; // No actions for final states
    default:
      return [
        { label: 'Genehmigung erhalten', targetStatus: 'genehmigt', variant: 'primary', icon: 'check' },
      ];
  }
}

interface PremiumOverviewTabProps {
  data: Installation;
  onStatusChange: (status: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onTabChange?: (tab: string) => void;
  onOpenUploadModal?: () => void;
  // Email Tab Mode - wenn true, nur Email-Detail anzeigen
  emailTabMode?: boolean;
  selectedEmailId?: number;
  onOpenEmail?: (emailId: number) => void;
  onCloseEmailTab?: () => void;
}

// Email types from API
interface EmailAiAnalysis {
  type?: string;
  summary?: string;
  requiredAction?: string;
  deadline?: string;
  confidence?: number;
  extractedData?: {
    aktenzeichen?: string;
    termin?: string;
    ansprechpartner?: string;
  };
}

interface ApiEmail {
  id: number;
  fromAddress: string;
  fromName?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead: boolean;
  aiType?: string;
  aiSummary?: string;
  aiRequiredAction?: string;
  aiDeadline?: string;
  aiConfidence?: number;
  aiAnalysis?: EmailAiAnalysis;
}

// Alert types from API
interface ApiAlert {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isResolved: boolean;
  createdAt: string;
  relatedEmailId?: number;
  requiredAction?: string;
  deadline?: string;
}

// Email template types
interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
}

// Timeline step config
const TIMELINE_STEPS = [
  { id: 1, label: 'Eingang', status: 'eingang' },
  { id: 2, label: 'Beim NB', status: 'beim_nb' },
  { id: 3, label: 'Genehmigt', status: 'genehmigt' },
  { id: 4, label: 'IBN', status: 'ibn' },
  { id: 5, label: 'Fertig', status: 'fertig' },
];

function getStepState(stepStatus: string, currentStatus: string): 'done' | 'active' | 'pending' {
  const stepOrder = ['eingang', 'beim_nb', 'genehmigt', 'ibn', 'fertig'];
  const normalizedStatus = currentStatus?.toLowerCase().replace(/_/g, '_') || 'eingang';

  const stepIndex = stepOrder.indexOf(stepStatus);
  const currentIndex = stepOrder.indexOf(normalizedStatus);

  if (currentIndex === -1) {
    return stepIndex === 0 ? 'active' : 'pending';
  }

  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

function getProgressWidth(status: string): string {
  const stepOrder = ['eingang', 'beim_nb', 'genehmigt', 'ibn', 'fertig'];
  const normalizedStatus = status?.toLowerCase() || 'eingang';
  const currentIndex = stepOrder.indexOf(normalizedStatus);
  if (currentIndex <= 0) return '0%';
  return `${(currentIndex / (stepOrder.length - 1)) * 100}%`;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '—';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—'; // Invalid date

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 0) return 'Gerade eben'; // Future date
  if (diffMins < 60) return `vor ${diffMins}m`;
  if (diffHours < 24) return `vor ${diffHours}h`;
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString('de-DE');
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getBadgeType(aiType?: string): 'rueckfrage' | 'genehmigung' | 'info' | null {
  if (!aiType) return null;
  const type = aiType.toLowerCase();
  if (type.includes('rückfrage') || type.includes('rueckfrage') || type.includes('nachforderung')) return 'rueckfrage';
  if (type.includes('genehmigung') || type.includes('zusage') || type.includes('freigabe')) return 'genehmigung';
  if (type.includes('bestätigung') || type.includes('info')) return 'info';
  return 'info';
}

function getBadgeText(aiType?: string): string | null {
  if (!aiType) return null;
  const type = aiType.toLowerCase();
  if (type.includes('rückfrage') || type.includes('rueckfrage')) return 'Rückfrage erkannt';
  if (type.includes('genehmigung')) return 'Genehmigung';
  if (type.includes('bestätigung')) return 'Bestätigung';
  return aiType;
}

// API fetch functions
async function fetchEmails(installationId: number): Promise<ApiEmail[]> {
  try {
    const res = await fetch(`/api/emails/for-installation/${installationId}`, {
      credentials: 'include'
    });
    if (!res.ok) {
      console.warn('[PremiumOverviewTab] Emails fetch failed:', res.status);
      return []; // Return empty array on any error
    }
    const json = await res.json();
    // API returns { meta: {...}, data: rows }
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json)) return json;
    console.warn('[PremiumOverviewTab] Unexpected emails response:', json);
    return [];
  } catch (err) {
    console.warn('[PremiumOverviewTab] Emails fetch error:', err);
    return []; // Return empty array on fetch error
  }
}

async function fetchAlerts(installationId: number): Promise<ApiAlert[]> {
  try {
    const res = await fetch(`/api/alerts/installation/${installationId}`, {
      credentials: 'include'
    });
    if (!res.ok) {
      return []; // Return empty array on any error
    }
    const data = await res.json();
    // Ensure we always return an array
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.alerts)) return data.alerts;
    return [];
  } catch {
    return []; // Return empty array on fetch error
  }
}

async function fetchTemplates(): Promise<EmailTemplate[]> {
  try {
    const res = await fetch('/api/email-templates', {
      credentials: 'include'
    });
    if (!res.ok) {
      return []; // Return empty array on any error
    }
    const data = await res.json();
    // Ensure we always return an array
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.templates)) return data.templates;
    return [];
  } catch {
    return []; // Return empty array on fetch error
  }
}

// Fetch single email detail (includes aiAnalysis)
async function fetchEmailDetail(emailId: number): Promise<ApiEmail | null> {
  if (!emailId) return null;
  try {
    const res = await fetch(`/api/emails/${emailId}`, {
      credentials: 'include'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}

/* ═══════════════════ KOMMUNIKATION SUMMARY CARD ═══════════════════ */

const CORR_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  erstanmeldung: { label: "Erstanmeldung", color: "#3b82f6" },
  nachfrage: { label: "Nachfrage", color: "#f59e0b" },
  antwort: { label: "NB-Antwort", color: "#10b981" },
  email: { label: "E-Mail", color: "#EAD068" },
  portal: { label: "Portal", color: "#06b6d4" },
};

function KommunikationSummaryCard({
  data,
  showToast,
  onTabChange,
}: {
  data: { id: number; nbEmail?: string; contactEmail?: string; gridOperator?: string };
  showToast: (msg: string, type: 'success' | 'error') => void;
  onTabChange?: (tab: string) => void;
}) {
  const [correspondence, setCorrespondence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await installationsApi.getCorrespondence(data.id);
        if (!cancelled) setCorrespondence((items || []).slice(0, 3));
      } catch {
        // No correspondence available
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [data.id]);

  return (
    <div className="data-card komm-summary">
      <div className="card-header">
        <span className="card-title">
          <Mail size={14} /> Kommunikation
        </span>
        {correspondence.length > 0 && (
          <span className="badge">{correspondence.length > 2 ? '3+' : correspondence.length}</span>
        )}
      </div>
      <div className="card-body">
        {/* Kontakt-Grid */}
        <div className="komm-contacts">
          {data.contactEmail && (
            <div className="data-row">
              <span className="data-label">Kunde</span>
              <span className="data-value"><a href={`mailto:${data.contactEmail}`}>{data.contactEmail}</a></span>
            </div>
          )}
          {data.nbEmail && (
            <div className="data-row">
              <span className="data-label">Einreich-Email</span>
              <span className="data-value mono"><a href={`mailto:${data.nbEmail}`}>{data.nbEmail}</a></span>
            </div>
          )}
        </div>

        {/* Mini-Timeline */}
        <div className="komm-timeline">
          {loading ? (
            <div className="data-row" style={{ justifyContent: 'center', padding: '8px 0' }}>
              <Loader2 size={14} className="nb-spin" />
              <span className="data-value" style={{ marginLeft: 6 }}>Lade Korrespondenz...</span>
            </div>
          ) : correspondence.length === 0 ? (
            <div className="data-row">
              <span className="data-value" style={{ color: 'var(--text-tertiary)' }}>Noch keine Korrespondenz</span>
            </div>
          ) : (
            correspondence.map((item: any) => {
              const config = CORR_TYPE_CONFIG[item.type] || CORR_TYPE_CONFIG.email;
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`komm-entry ${isExpanded ? 'komm-entry--expanded' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="komm-entry__header">
                    <div className="komm-entry__icon" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                      <Mail size={12} />
                    </div>
                    <div className="komm-entry__main">
                      <span className="komm-entry__subject">{item.subject || config.label}</span>
                      <span className="komm-entry__date">
                        {new Date(item.sentAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    </div>
                    <span className="komm-entry__type" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  {isExpanded && item.message && (
                    <div className="komm-entry__body">{item.message}</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="komm-actions">
          <button className="btn-sm ghost" onClick={() => onTabChange?.('emails')}>
            <Mail size={12} /> Alle E-Mails <ChevronRight size={10} />
          </button>
          <button className="btn-sm ghost" onClick={() => onTabChange?.('kommunikation')}>
            <MessageSquare size={12} /> NB-Kommunikation <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PremiumOverviewTab({
  data,
  onStatusChange,
  showToast,
  onTabChange,
  onOpenUploadModal,
  emailTabMode = false,
  selectedEmailId: propsSelectedEmailId,
  onOpenEmail,
  onCloseEmailTab
}: PremiumOverviewTabProps) {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const isAdmin = permissions.isAdmin === true;
  const [copied, setCopied] = useState(false);
  // In email tab mode, use prop; otherwise use local state
  const [localSelectedEmailId, setLocalSelectedEmailId] = useState<number | null>(null);
  const selectedEmailId = emailTabMode ? propsSelectedEmailId ?? null : localSelectedEmailId;
  const setSelectedEmailId = emailTabMode ? () => {} : setLocalSelectedEmailId;

  const [replyText, setReplyText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavingAktenzeichen, setIsSavingAktenzeichen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // NB-Daten Inline-Edit
  const [isEditingNb, setIsEditingNb] = useState(false);
  const [nbEditEmail, setNbEditEmail] = useState(data.nbEmail || '');
  const [nbEditCaseNumber, setNbEditCaseNumber] = useState(data.nbCaseNumber || '');
  const [nbSaving, setNbSaving] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Zählerwechsel-Terminmanagement
  const [isEditingZw, setIsEditingZw] = useState(false);
  const [zwDatum, setZwDatum] = useState(data.zaehlerwechselDatum ? data.zaehlerwechselDatum.split('T')[0] : '');
  const [zwUhrzeit, setZwUhrzeit] = useState(data.zaehlerwechselUhrzeit || '09:00');
  const [zwKommentar, setZwKommentar] = useState(data.zaehlerwechselKommentar || '');
  const [zwSaving, setZwSaving] = useState(false);
  const [zwAppointment, setZwAppointment] = useState<{
    id: number; status: string; scheduledAt: string;
    confirmedAt: string | null; createdAt: string; description: string | null;
  } | null>(null);

  // 🔥 Wizard-Daten parsen und normalisieren (unterstützt alle Formate)
  const rawWizardData = parseWizardContext(data.wizardContext);
  const wizardData = normalizeWizardData(rawWizardData, data);

  const emailAddress = `${data.publicId?.toLowerCase() || 'unknown'}@baunity.de`;

  const isBeimNb = data.status === 'beim_nb';
  const nbMissingEmail = !data.nbEmail;
  const nbMissingCase = !data.nbCaseNumber;
  const nbHasWarning = isBeimNb && (nbMissingEmail || nbMissingCase);

  const handleNbSave = useCallback(async () => {
    setNbSaving(true);
    try {
      const promises: Promise<any>[] = [];
      const trimmedCase = nbEditCaseNumber.trim();
      if (trimmedCase !== (data.nbCaseNumber || '')) {
        promises.push(
          fetch(`/api/installations/${data.id}/nb-tracking`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nbVorgangsnummer: trimmedCase || null }),
          })
        );
      }
      const trimmedEmail = nbEditEmail.trim();
      if (data.gridOperatorId && trimmedEmail !== (data.nbEmail || '')) {
        promises.push(
          fetch(`/api/ops/nb/${data.gridOperatorId}`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ einreichEmail: trimmedEmail || null }),
          })
        );
      }
      if (promises.length > 0) await Promise.all(promises);
      setIsEditingNb(false);
      showToast('NB-Daten gespeichert', 'success');
      queryClient.invalidateQueries({ queryKey: ['installation-detail', data.id] });
    } catch (err) {
      console.error('Fehler beim Speichern der NB-Daten:', err);
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setNbSaving(false);
    }
  }, [nbEditCaseNumber, nbEditEmail, data.nbCaseNumber, data.nbEmail, data.gridOperatorId, data.id, showToast, queryClient]);

  // Fetch emails
  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ['emails', data.id],
    queryFn: () => fetchEmails(data.id),
    staleTime: 30000,
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', data.id],
    queryFn: () => fetchAlerts(data.id),
    staleTime: 30000,
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchTemplates,
    staleTime: 300000, // 5 minutes
  });

  // Auto-select first email
  useEffect(() => {
    if (emails.length > 0 && !selectedEmailId) {
      setSelectedEmailId(emails[0].id);
    }
  }, [emails, selectedEmailId]);

  // Fetch full email details when selected (includes aiAnalysis)
  const { data: selectedEmailDetail, isLoading: emailDetailLoading } = useQuery({
    queryKey: ['email-detail', selectedEmailId],
    queryFn: () => fetchEmailDetail(selectedEmailId!),
    enabled: !!selectedEmailId,
    staleTime: 60000, // 1 minute
  });

  // Use detailed email if available, otherwise fall back to list data
  const selectedEmailFromList = emails.find(e => e.id === selectedEmailId);
  const selectedEmail = selectedEmailDetail || selectedEmailFromList;

  // Zählerwechsel-Appointment laden
  const loadZwAppointment = useCallback(async () => {
    try {
      const res = await installationsApi.getZaehlerwechselTermin(data.id);
      setZwAppointment(res.appointment);
    } catch { /* ignore */ }
  }, [data.id]);

  useEffect(() => {
    if (data.zaehlerwechselDatum) loadZwAppointment();
  }, [data.zaehlerwechselDatum, loadZwAppointment]);

  const handleScheduleZw = async () => {
    if (!zwDatum) { showToast('Bitte Datum angeben', 'error'); return; }
    setZwSaving(true);
    try {
      const res = await installationsApi.scheduleZaehlerwechsel(data.id, {
        datum: zwDatum, uhrzeit: zwUhrzeit, kommentar: zwKommentar || undefined,
      });
      const msgs: string[] = [];
      if (res.notificationsSent?.errichterEmail) msgs.push('Errichter-Email');
      if (res.notificationsSent?.endkundeEmail) msgs.push('Endkunde-Email');
      if (res.notificationsSent?.endkundeWhatsapp) msgs.push('Endkunde-WhatsApp');
      showToast(msgs.length > 0 ? `Termin geplant! Benachrichtigung: ${msgs.join(' + ')}` : 'Termin geplant', 'success');
      setIsEditingZw(false);
      loadZwAppointment();
      onStatusChange(data.status);
    } catch (err: any) {
      showToast(err.message || 'Fehler', 'error');
    } finally { setZwSaving(false); }
  };

  const handleCancelZw = async () => {
    if (!confirm('Zählerwechsel-Termin wirklich absagen?')) return;
    setZwSaving(true);
    try {
      await installationsApi.cancelZaehlerwechsel(data.id);
      showToast('Termin abgesagt', 'success');
      setZwAppointment(null);
      setZwDatum(''); setZwUhrzeit('09:00'); setZwKommentar('');
      onStatusChange(data.status);
    } catch (err: any) {
      showToast(err.message || 'Fehler', 'error');
    } finally { setZwSaving(false); }
  };

  // Find open critical alert (unresolved Rückfrage)
  const openAlert = alerts.find(a => !a.isResolved && a.severity === 'critical');

  // Or find from emails if no alert system
  const openRueckfrageEmail = emails.find(e =>
    !e.isRead && getBadgeType(e.aiType) === 'rueckfrage'
  );

  const handleCopyEmail = useCallback(() => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    showToast('Email-Adresse kopiert', 'success');
    setTimeout(() => setCopied(false), 2000);
  }, [emailAddress, showToast]);

  const handleTemplateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = parseInt(e.target.value);
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setReplyText(template.body);
        setSelectedTemplateId(templateId);
      }
    }
  }, [templates]);

  const handleSendEmail = useCallback(async () => {
    if (!replyText.trim() || !selectedEmail) {
      showToast('Bitte Text eingeben', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/installation/${data.id}/reply-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          replyToEmailId: selectedEmail.id,
          subject: `Re: ${selectedEmail.subject}`,
          body: replyText,
        })
      });

      if (!res.ok) throw new Error('Failed to send email');

      showToast('Email gesendet', 'success');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['emails', data.id] });
    } catch (err) {
      showToast('Fehler beim Senden', 'error');
    } finally {
      setIsSending(false);
    }
  }, [replyText, selectedEmail, data.id, showToast, queryClient]);

  const handleGenerateAIReply = useCallback(async () => {
    if (!selectedEmail) return;

    // User muss eine Anweisung eingeben
    if (!aiPrompt.trim()) {
      showToast('Bitte Anweisung eingeben (z.B. "Anbei der Lageplan")', 'error');
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Ensure emailId is a number
      const emailId = typeof selectedEmail.id === 'string' ? parseInt(selectedEmail.id, 10) : selectedEmail.id;

      const res = await fetch('/api/claude-code/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emailId,
          instruction: aiPrompt.trim()  // User-Anweisung verwenden!
        })
      });

      if (!res.ok) throw new Error('Failed to generate reply');

      const result = await res.json();
      // API returns { success: true, data: { response: "..." } }
      const generatedText = result.data?.response || result.response || result.reply || '';
      setReplyText(generatedText);
      showToast('KI-Antwort generiert', 'success');
    } catch (err) {
      showToast('KI-Generierung fehlgeschlagen', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [selectedEmail, showToast, aiPrompt]);

  const handleUploadDocument = useCallback(() => {
    if (onOpenUploadModal) {
      onOpenUploadModal();
    } else {
      showToast('Upload-Funktion wird geladen...', 'error');
    }
  }, [onOpenUploadModal, showToast]);

  const handleShowEmail = useCallback((emailId: number) => {
    setSelectedEmailId(emailId);
    // Scroll to sidebar email section
    const sidebar = document.querySelector('.premium-overview .sidebar');
    if (sidebar) sidebar.scrollTop = 0;
  }, []);

  const handleSaveAktenzeichen = useCallback(async (aktenzeichen: string) => {
    if (!aktenzeichen || isSavingAktenzeichen) return;

    setIsSavingAktenzeichen(true);
    try {
      const res = await fetch(`/api/installations/${data.id}/nb-case`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nbCaseNumber: aktenzeichen })
      });

      if (!res.ok) throw new Error('Failed to save');

      showToast(`Vorgangsnummer "${aktenzeichen}" übernommen`, 'success');
      // Refresh installation data
      queryClient.invalidateQueries({ queryKey: ['installation-detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['netzanmeldungen'] });
    } catch (err) {
      showToast('Fehler beim Speichern der Vorgangsnummer', 'error');
    } finally {
      setIsSavingAktenzeichen(false);
    }
  }, [data.id, showToast, queryClient, isSavingAktenzeichen]);

  const handleCreateInvoice = useCallback(async () => {
    if (isCreatingInvoice || data.rechnungGestellt) return;

    setIsCreatingInvoice(true);
    try {
      const res = await fetch(`/api/rechnungen/installation/${data.id}/create-and-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Rechnung konnte nicht erstellt werden');
      }

      showToast(`Rechnung ${result.data.rechnungsNummer} erstellt und versendet an ${result.data.sentTo}`, 'success');

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['installation-detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['netzanmeldungen'] });
    } catch (err: any) {
      showToast(err.message || 'Fehler beim Erstellen der Rechnung', 'error');
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [data.id, data.rechnungGestellt, isCreatingInvoice, showToast, queryClient]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL TAB MODE - Dedizierte Email-Ansicht (volle Breite)
  // ═══════════════════════════════════════════════════════════════════════════
  if (emailTabMode && selectedEmail) {
    return (
      <div className="premium-overview email-tab-mode">
        <div className="email-tab-container">
          {/* Email Header */}
          <div className="email-tab-header">
            <div className="email-tab-meta">
              <div className="email-tab-row">
                <span className="email-tab-label">VON:</span>
                <span className="email-tab-value">{selectedEmail.fromAddress}</span>
              </div>
              <div className="email-tab-row">
                <span className="email-tab-label">DATUM:</span>
                <span className="email-tab-value">{formatDateTime(selectedEmail.receivedAt)}</span>
              </div>
              <div className="email-tab-row">
                <span className="email-tab-label">BETREFF:</span>
                <span className="email-tab-value email-tab-subject">{selectedEmail.subject}</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="email-tab-body">
            {selectedEmail.bodyHtml ? (
              <div
                className="email-tab-html-content"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.bodyHtml) }}
              />
            ) : (
              (selectedEmail.bodyText || '').split('\n').map((line, i) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))
            )}
          </div>

          {/* KI-Analyse Box */}
          {(selectedEmail.aiType || selectedEmail.aiSummary || selectedEmail.aiAnalysis) && (
            <div className="email-tab-ai">
              <div className="email-tab-ai-header">
                <Lightbulb size={16} />
                <span>KI-Analyse</span>
              </div>
              <div className="email-tab-ai-content">
                {(selectedEmail.aiAnalysis?.type || selectedEmail.aiType) && (
                  <div className="email-tab-ai-row">
                    <span className="email-tab-ai-label">Typ:</span>
                    <span className="email-tab-ai-value highlight">{selectedEmail.aiAnalysis?.type || selectedEmail.aiType}</span>
                  </div>
                )}
                {(selectedEmail.aiAnalysis?.requiredAction || selectedEmail.aiRequiredAction) && (
                  <div className="email-tab-ai-row">
                    <span className="email-tab-ai-label">Benötigt:</span>
                    <span className="email-tab-ai-value">{selectedEmail.aiAnalysis?.requiredAction || selectedEmail.aiRequiredAction}</span>
                  </div>
                )}
                {(selectedEmail.aiAnalysis?.deadline || selectedEmail.aiDeadline) && (
                  <div className="email-tab-ai-row">
                    <span className="email-tab-ai-label">Frist:</span>
                    <span className="email-tab-ai-value">{new Date(selectedEmail.aiAnalysis?.deadline || selectedEmail.aiDeadline || '').toLocaleDateString('de-DE')}</span>
                  </div>
                )}
                {selectedEmail.aiAnalysis?.extractedData?.aktenzeichen && (
                  <div className="email-tab-ai-row">
                    <span className="email-tab-ai-label">Vorgangsnummer:</span>
                    <span className="email-tab-ai-value mono">{selectedEmail.aiAnalysis.extractedData.aktenzeichen}</span>
                  </div>
                )}
              </div>

              {/* Vorgangsnummer übernehmen Button */}
              {selectedEmail.aiAnalysis?.extractedData?.aktenzeichen && !data.nbCaseNumber && (
                <div className="email-tab-ai-action">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSaveAktenzeichen(selectedEmail.aiAnalysis!.extractedData!.aktenzeichen!)}
                    disabled={isSavingAktenzeichen}
                  >
                    {isSavingAktenzeichen ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Vorgangsnummer übernehmen: {selectedEmail.aiAnalysis.extractedData.aktenzeichen}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reply Section */}
          <div className="email-tab-reply">
            <div className="email-tab-reply-header">
              <span className="email-tab-reply-title">Antworten</span>
              <div className="email-tab-reply-tools">
                <select className="template-select" onChange={handleTemplateChange} value={selectedTemplateId || ''}>
                  <option value="">Vorlage wählen...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Prompt Input */}
            <div className="email-tab-ai-prompt">
              <div className="ai-prompt-label">
                <Sparkles size={14} />
                Was soll in der Antwort stehen?
              </div>
              <div className="ai-prompt-row">
                <input
                  type="text"
                  className="ai-prompt-input"
                  placeholder="z.B. Lageplan wird morgen nachgereicht"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateAIReply()}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerateAIReply}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Generieren
                </button>
              </div>
            </div>

            {/* Reply Textarea */}
            <textarea
              className="email-tab-reply-textarea"
              placeholder="Ihre Antwort..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={8}
            />

            {/* Reply Actions */}
            <div className="email-tab-reply-actions">
              <div className="email-tab-reply-attachments">
                <button className="btn btn-ghost" onClick={handleUploadDocument}>
                  <Paperclip size={14} />
                  Anhang
                </button>
                <button className="btn btn-ghost" onClick={() => onTabChange?.('dokumente')}>
                  <FileText size={14} />
                  Dokument
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSendEmail}
                disabled={isSending || !replyText.trim()}
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Senden
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NORMAL MODE - Übersicht mit Email-Liste in Sidebar
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="premium-overview">
      {/* Alert Banner - shows when there's an open alert or Rückfrage */}
      {(openAlert || openRueckfrageEmail) && (
        <div className="alert-banner">
          <div className="alert-banner-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="alert-banner-content">
            <div className="alert-banner-title">
              {openAlert?.title || 'Rückfrage vom Netzbetreiber'}
            </div>
            <div className="alert-banner-text">
              {openAlert?.message || (
                <>
                  {openRueckfrageEmail?.fromName || data.gridOperator || 'Netzbetreiber'} benötigt: {' '}
                  {openRueckfrageEmail?.aiRequiredAction || 'Weitere Informationen'}.
                  {openRueckfrageEmail?.aiDeadline && ` Frist: ${new Date(openRueckfrageEmail.aiDeadline).toLocaleDateString('de-DE')}`}
                </>
              )}
            </div>
          </div>
          <div className="alert-banner-actions">
            <button className="btn-sm primary" onClick={handleUploadDocument}>
              <Upload size={14} />
              Dokument hochladen
            </button>
            <button
              className="btn-sm ghost"
              onClick={() => handleShowEmail(openAlert?.relatedEmailId || openRueckfrageEmail?.id || 0)}
            >
              Email anzeigen
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="main">
        {/* Left Content */}
        <div className="content">
          {/* Workflow Section */}
          <section className="section">
            <div className="section-header">
              <span className="section-title">Workflow</span>
              {data.daysAtNb && data.daysAtNb > 0 && (
                <span className="section-badge">{data.daysAtNb} Tage Wartezeit</span>
              )}
            </div>

            {/* Timeline */}
            <div className="timeline">
              <div className="timeline-track">
                <div className="timeline-progress" style={{ width: getProgressWidth(data.status) }} />
              </div>

              {TIMELINE_STEPS.map((step) => {
                const state = getStepState(step.status, data.status);
                return (
                  <div key={step.id} className="timeline-step">
                    <div className={`step-marker ${state}`}>
                      {state === 'done' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.id}
                    </div>
                    <span className={`step-label ${state === 'active' ? 'active' : ''}`}>{step.label}</span>
                    <span className="step-date">
                      {step.status === 'eingang' && data.createdAt ? formatDate(data.createdAt) :
                       step.status === 'beim_nb' && data.nbEingereichtAm ? formatDate(data.nbEingereichtAm) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Actions - Dynamic based on current status (nur für berechtigte Benutzer) */}
          {permissions.canChangeStatus && (
            <div className="actions">
              {getStatusActions(data.status)
                .filter(action => {
                  // Stornieren nur für Admin/Mitarbeiter
                  if (action.targetStatus === 'storniert' && !permissions.canStornieren) return false;
                  // Abgerechnet nur für Admin
                  if (action.targetStatus === 'abgerechnet' && !permissions.canMarkAsAbgerechnet) return false;
                  return true;
                })
                .map((action, idx) => (
                <button
                  key={idx}
                  className={`btn btn-${action.variant}`}
                  onClick={() => onStatusChange(action.targetStatus)}
                >
                  {action.icon === 'check' && <Check size={14} />}
                  {action.icon === 'alert' && <AlertTriangle size={14} />}
                  {action.icon === 'arrow' && <ArrowLeft size={14} />}
                  {action.label}
                </button>
              ))}
              {getStatusActions(data.status).length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Keine Aktionen verfügbar (Status: {data.status})
                </span>
              )}
            </div>
          )}

          {/* Creator Info */}
          {(data.createdByCompany || data.createdByName) && (
            <div className="creator-info">
              <span className="creator-label">Erstellt von:</span>
              <span className="creator-name">{data.createdByCompany || data.createdByName}</span>
              {data.createdAt && (
                <span className="creator-date">am {new Date(data.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              )}
            </div>
          )}

          {/* Data Grid */}
          <div className="data-grid">
            {/* 🔥 Anmeldungsinfo Card - Grunddaten aus Wizard */}
            <div className="data-card">
              <div className="card-header">
                <span className="card-title">Anmeldung</span>
              </div>
              <div className="card-body">
                {wizardData?.caseType && (
                  <div className="data-row">
                    <span className="data-label">Anlagentyp</span>
                    <span className="data-value">
                      {wizardData.caseType === 'einspeiser' ? '⚡ Einspeiser' :
                       wizardData.caseType === 'verbraucher' ? '🔌 Verbraucher' :
                       wizardData.caseType === 'mischanlage' ? '⚡🔌 Mischanlage' :
                       wizardData.caseType}
                    </span>
                  </div>
                )}
                {wizardData?.processType && (
                  <div className="data-row">
                    <span className="data-label">Vorgangsart</span>
                    <span className="data-value">
                      {wizardData.processType === 'neuanmeldung' ? 'Neuanmeldung' :
                       wizardData.processType === 'aenderung' ? 'Änderung' :
                       wizardData.processType === 'erweiterung' ? 'Erweiterung' :
                       wizardData.processType}
                    </span>
                  </div>
                )}
                {wizardData?.registrationTargets && wizardData.registrationTargets.length > 0 && (
                  <div className="data-row">
                    <span className="data-label">Komponenten</span>
                    <span className="data-value">
                      {wizardData.registrationTargets.map((t: string) =>
                        t === 'pv' ? '☀️ PV' :
                        t === 'speicher' ? '🔋 Speicher' :
                        t === 'wallbox' ? '🚗 Wallbox' :
                        t === 'waermepumpe' ? '🌡️ Wärmepumpe' : t
                      ).join(', ')}
                    </span>
                  </div>
                )}
                {wizardData?.groessenklasse && (
                  <div className="data-row">
                    <span className="data-label">Größenklasse</span>
                    <span className="data-value">
                      {wizardData.groessenklasse === 'balkon' ? 'Balkonkraftwerk' :
                       wizardData.groessenklasse === 'mini' ? 'Mini (bis 600W)' :
                       wizardData.groessenklasse === 'klein' ? 'Klein (bis 10 kWp)' :
                       wizardData.groessenklasse === 'mittel' ? 'Mittel (10-30 kWp)' :
                       wizardData.groessenklasse === 'gross' ? 'Groß (30-100 kWp)' :
                       wizardData.groessenklasse === 'gewerbe' ? 'Gewerbe (>100 kWp)' :
                       wizardData.groessenklasse === 'ms' ? 'Mittelspannung' :
                       wizardData.groessenklasse === 'aenderung' ? 'Änderung/Erweiterung' :
                       wizardData.groessenklasse}
                    </span>
                  </div>
                )}
                {wizardData?.technical?.feedInType && (
                  <div className="data-row">
                    <span className="data-label">Einspeiseart</span>
                    <span className="data-value">
                      {wizardData.technical.feedInType === 'ueberschuss' ? 'Überschusseinspeisung' :
                       wizardData.technical.feedInType === 'volleinspeisung' ? 'Volleinspeisung' :
                       wizardData.technical.feedInType === 'nulleinspeisung' ? 'Nulleinspeisung' :
                       wizardData.technical.feedInType === 'insel' ? 'Inselanlage' :
                       wizardData.technical.feedInType}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Zähler-Prozess Card (Step 1 - wenn Kategorie=zaehler) */}
            {wizardData?.meterProcess && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">Zähler-Prozess</span>
                </div>
                <div className="card-body">
                  {wizardData.meterProcess.prozessTyp && (
                    <div className="data-row">
                      <span className="data-label">Prozesstyp</span>
                      <span className="data-value">
                        {wizardData.meterProcess.prozessTyp === 'neuanmeldung' ? 'Neuanmeldung' :
                         wizardData.meterProcess.prozessTyp === 'wechsel_typ' ? 'Zählerwechsel (Typ)' :
                         wizardData.meterProcess.prozessTyp === 'smart_meter' ? 'Smart Meter Einbau' :
                         wizardData.meterProcess.prozessTyp === 'abmeldung' ? 'Abmeldung' :
                         wizardData.meterProcess.prozessTyp}
                      </span>
                    </div>
                  )}
                  {wizardData.meterProcess.altZaehlernummer && (
                    <div className="data-row">
                      <span className="data-label">Alte Zählernummer</span>
                      <span className="data-value mono">{wizardData.meterProcess.altZaehlernummer}</span>
                    </div>
                  )}
                  {wizardData.meterProcess.neuZaehlertyp && (
                    <div className="data-row">
                      <span className="data-label">Neuer Zählertyp</span>
                      <span className="data-value">{wizardData.meterProcess.neuZaehlertyp}</span>
                    </div>
                  )}
                  {wizardData.meterProcess.neuStandort && (
                    <div className="data-row">
                      <span className="data-label">Neuer Standort</span>
                      <span className="data-value">{wizardData.meterProcess.neuStandort}</span>
                    </div>
                  )}
                  {wizardData.meterProcess.neuTarifart && (
                    <div className="data-row">
                      <span className="data-label">Neue Tarifart</span>
                      <span className="data-value">{wizardData.meterProcess.neuTarifart}</span>
                    </div>
                  )}
                  {wizardData.meterProcess.antragGestellt !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Antrag gestellt</span>
                      <span className={`data-value ${wizardData.meterProcess.antragGestellt ? 'highlight-success' : ''}`}>
                        {wizardData.meterProcess.antragGestellt ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fertigmeldung Card (Step 1 - wenn Kategorie=fertigmeldung) */}
            {wizardData?.completion && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">Fertigmeldung</span>
                </div>
                <div className="card-body">
                  {wizardData.completion.installationAbgeschlossen !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Installation abgeschlossen</span>
                      <span className={`data-value ${wizardData.completion.installationAbgeschlossen ? 'highlight-success' : ''}`}>
                        {wizardData.completion.installationAbgeschlossen ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {wizardData.completion.netzbetreiberMeldung !== undefined && (
                    <div className="data-row">
                      <span className="data-label">NB-Meldung</span>
                      <span className={`data-value ${wizardData.completion.netzbetreiberMeldung ? 'highlight-success' : ''}`}>
                        {wizardData.completion.netzbetreiberMeldung ? '✓ Gemeldet' : 'Ausstehend'}
                      </span>
                    </div>
                  )}
                  {wizardData.completion.mastrGemeldet !== undefined && (
                    <div className="data-row">
                      <span className="data-label">MaStR gemeldet</span>
                      <span className={`data-value ${wizardData.completion.mastrGemeldet ? 'highlight-success' : ''}`}>
                        {wizardData.completion.mastrGemeldet ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {wizardData.completion.zaehlerGesetzt !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Zähler gesetzt</span>
                      <span className={`data-value ${wizardData.completion.zaehlerGesetzt ? 'highlight-success' : ''}`}>
                        {wizardData.completion.zaehlerGesetzt ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🔥 NEU: Standort Card - Adresse und Flurstück */}
            {(wizardData.location.street || wizardData.location.zip) && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">📍 Standort</span>
                </div>
                <div className="card-body">
                  {(wizardData.location.street || wizardData.location.houseNumber) && (
                    <div className="data-row">
                      <span className="data-label">Adresse</span>
                      <span className="data-value">
                        {wizardData.location.street} {wizardData.location.houseNumber}
                      </span>
                    </div>
                  )}
                  {(wizardData.location.zip || wizardData.location.city) && (
                    <div className="data-row">
                      <span className="data-label">Ort</span>
                      <span className="data-value">
                        {wizardData.location.zip} {wizardData.location.city}
                      </span>
                    </div>
                  )}
                  {wizardData.location.bundesland && (
                    <div className="data-row">
                      <span className="data-label">Bundesland</span>
                      <span className="data-value">{wizardData.location.bundesland}</span>
                    </div>
                  )}
                  {(wizardData.location.gemarkung || wizardData.location.flur || wizardData.location.flurstueck) && (
                    <>
                      {wizardData.location.gemarkung && (
                        <div className="data-row">
                          <span className="data-label">Gemarkung</span>
                          <span className="data-value">{wizardData.location.gemarkung}</span>
                        </div>
                      )}
                      {wizardData.location.flur && (
                        <div className="data-row">
                          <span className="data-label">Flur</span>
                          <span className="data-value">{wizardData.location.flur}</span>
                        </div>
                      )}
                      {wizardData.location.flurstueck && (
                        <div className="data-row">
                          <span className="data-label">Flurstück</span>
                          <span className="data-value">{wizardData.location.flurstueck}</span>
                        </div>
                      )}
                    </>
                  )}
                  {wizardData.location.zusatz && (
                    <div className="data-row">
                      <span className="data-label">Zusatz</span>
                      <span className="data-value">{wizardData.location.zusatz}</span>
                    </div>
                  )}
                  {(wizardData.location.gpsLat && wizardData.location.gpsLng) && (
                    <div className="data-row">
                      <span className="data-label">GPS</span>
                      <span className="data-value mono" style={{ fontSize: '0.75rem' }}>
                        {wizardData.location.gpsLat.toFixed(6)}, {wizardData.location.gpsLng.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Kunde Card - erweitert mit allen Wizard-Feldern */}
            <div className="data-card">
              <div className="card-header">
                <span className="card-title">Kunde</span>
                <button className="card-action" onClick={() => onTabChange?.('kunde')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Bearbeiten
                </button>
              </div>
              <div className="card-body">
                {wizardData?.customer?.type && (
                  <div className="data-row">
                    <span className="data-label">Typ</span>
                    <span className="data-value">
                      {wizardData.customer.type === 'privat' || wizardData.customer.type === 'PRIVATE' ? '👤 Privat' :
                       wizardData.customer.type === 'gewerbe' || wizardData.customer.type === 'BUSINESS' ? '🏢 Gewerbe' :
                       wizardData.customer.type === 'gbr' ? '👥 GbR' :
                       wizardData.customer.type === 'verein' ? '🤝 Verein' :
                       wizardData.customer.type === 'kommune' ? '🏛️ Kommune' :
                       wizardData.customer.type === 'weg' ? '🏘️ WEG' :
                       wizardData.customer.type}
                    </span>
                  </div>
                )}
                {wizardData?.customer?.company && (
                  <div className="data-row">
                    <span className="data-label">Firma</span>
                    <span className="data-value">{wizardData.customer.company}</span>
                  </div>
                )}
                <div className="data-row">
                  <span className="data-label">Name</span>
                  <span className="data-value">
                    {wizardData?.customer?.salutation && (
                      <span>
                        {wizardData.customer.salutation === 'herr' ? 'Herr ' :
                         wizardData.customer.salutation === 'frau' ? 'Frau ' : ''}
                      </span>
                    )}
                    {wizardData?.customer?.title && <span>{wizardData.customer.title} </span>}
                    {data.customerName || `${wizardData?.customer?.firstName || ''} ${wizardData?.customer?.lastName || ''}`.trim() || '—'}
                  </span>
                </div>
                {wizardData?.customer?.birthDate && (
                  <div className="data-row">
                    <span className="data-label">Geburtsdatum</span>
                    <span className="data-value">{new Date(wizardData.customer.birthDate).toLocaleDateString('de-DE')}</span>
                  </div>
                )}
                <div className="data-row">
                  <span className="data-label">Telefon</span>
                  <span className="data-value">
                    {data.contactPhone || wizardData?.customer?.phone ? (
                      <a href={`tel:${data.contactPhone || wizardData?.customer?.phone}`}>{data.contactPhone || wizardData?.customer?.phone}</a>
                    ) : '—'}
                  </span>
                </div>
                {wizardData?.customer?.mobile && (
                  <div className="data-row">
                    <span className="data-label">Mobil</span>
                    <span className="data-value">
                      <a href={`tel:${wizardData.customer.mobile}`}>{wizardData.customer.mobile}</a>
                    </span>
                  </div>
                )}
                <div className="data-row">
                  <span className="data-label">Email</span>
                  <span className="data-value">
                    {data.contactEmail || wizardData?.customer?.email ? (
                      <a href={`mailto:${data.contactEmail || wizardData?.customer?.email}`}>{data.contactEmail || wizardData?.customer?.email}</a>
                    ) : '—'}
                  </span>
                </div>
                {/* Bankverbindung */}
                {wizardData?.customer?.iban && (
                  <div className="data-row">
                    <span className="data-label">IBAN</span>
                    <span className="data-value mono" style={{ fontSize: '0.75rem' }}>{wizardData.customer.iban}</span>
                  </div>
                )}
                {wizardData?.customer?.bic && (
                  <div className="data-row">
                    <span className="data-label">BIC</span>
                    <span className="data-value mono">{wizardData.customer.bic}</span>
                  </div>
                )}
                {wizardData?.customer?.accountHolder && (
                  <div className="data-row">
                    <span className="data-label">Kontoinhaber</span>
                    <span className="data-value">{wizardData.customer.accountHolder}</span>
                  </div>
                )}
                {/* Registernummern */}
                {wizardData?.customer?.mastrNumber && (
                  <div className="data-row">
                    <span className="data-label">MaStR-Nr</span>
                    <span className="data-value mono">{wizardData.customer.mastrNumber}</span>
                  </div>
                )}
                {wizardData?.customer?.eegKey && (
                  <div className="data-row">
                    <span className="data-label">EEG-Schlüssel</span>
                    <span className="data-value mono">{wizardData.customer.eegKey}</span>
                  </div>
                )}
                {/* Rechnungsadresse */}
                {wizardData?.customer?.rechnungGleichStandort === false && wizardData?.customer?.rechnungsadresse && (
                  <div className="data-row">
                    <span className="data-label">Rechnungsadresse</span>
                    <span className="data-value">
                      {wizardData.customer.rechnungsadresse.strasse} {wizardData.customer.rechnungsadresse.hausnummer}
                      {wizardData.customer.rechnungsadresse.plz && `, ${wizardData.customer.rechnungsadresse.plz} ${wizardData.customer.rechnungsadresse.ort || ''}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Netzbetreiber / Netzanmeldung Card */}
            <div className={`data-card ${nbHasWarning ? 'nb-warning' : ''}`}>
              <div className="card-header">
                <span className="card-title">Netzanmeldung</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {data.gridOperatorPortalUrl && (
                    <a href={data.gridOperatorPortalUrl} target="_blank" rel="noopener noreferrer" className="card-action">
                      <ExternalLink size={12} />
                      Portal
                    </a>
                  )}
                  {isAdmin && !isEditingNb && (
                    <button className="card-action" onClick={() => {
                      setNbEditEmail(data.nbEmail || '');
                      setNbEditCaseNumber(data.nbCaseNumber || '');
                      setIsEditingNb(true);
                    }}>
                      <Edit2 size={12} />
                      Bearbeiten
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {/* Warnungen */}
                {isBeimNb && nbMissingEmail && (
                  <div className="nb-alert nb-alert--critical">
                    <AlertTriangle size={14} />
                    <span>NB-Email fehlt – Erinnerungen können nicht versendet werden!</span>
                  </div>
                )}
                {isBeimNb && nbMissingCase && (
                  <div className="nb-alert nb-alert--warn">
                    <AlertTriangle size={14} />
                    <span>Vorgangsnummer fehlt – bitte nachtragen</span>
                  </div>
                )}

                {/* Read-Only Felder */}
                {!isEditingNb && (
                  <>
                    <div className="data-row">
                      <span className="data-label">Netzbetreiber</span>
                      <span className="data-value">{data.gridOperator || '—'}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">NB-Email (Einreich)</span>
                      <span className={`data-value mono ${!data.nbEmail ? 'text-warning' : ''}`}>{data.nbEmail || '—'}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Vorgangsnummer</span>
                      <span className={`data-value mono ${!data.nbCaseNumber ? 'text-warning' : ''}`}>{data.nbCaseNumber || '—'}</span>
                    </div>
                    {data.nbEingereichtAm && (
                      <div className="data-row">
                        <span className="data-label">Eingereicht am</span>
                        <span className="data-value">{formatDate(data.nbEingereichtAm)}</span>
                      </div>
                    )}
                    {isBeimNb && data.daysAtNb != null && (
                      <div className="data-row">
                        <span className="data-label">Tage beim NB</span>
                        <span className="data-value mono" style={{
                          color: data.daysAtNb > 30 ? 'var(--error, #f87171)' : data.daysAtNb > 14 ? 'var(--warning, #fbbf24)' : 'var(--success, #34d399)',
                          fontWeight: 700,
                        }}>
                          {data.daysAtNb} Tage
                        </span>
                      </div>
                    )}
                    {/* NB nachfragen Button */}
                    {isBeimNb && isAdmin && (
                      <div className="nb-action">
                        <button
                          className="btn-sm primary nb-action__btn"
                          disabled={isSendingReminder}
                          onClick={async () => {
                            const count = ((data as any).reminderCount ?? 0) + 1;
                            const nbEmail = data.nbEmail || 'unbekannt';
                            if (!confirm(`${count}. Nachfrage an ${nbEmail} senden?`)) return;
                            setIsSendingReminder(true);
                            try {
                              const res = await fetch(`/api/ops/cases/${data.id}/remind`, {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                              });
                              const json = await res.json();
                              if (!res.ok) throw new Error(json.error || json.message || 'Fehler');
                              showToast(`${json.data?.reminderNumber || count}. Nachfrage an ${json.data?.emailSentTo || nbEmail} gesendet`, 'success');
                              queryClient.invalidateQueries({ queryKey: ['installation-detail'] });
                            } catch (err: any) {
                              showToast(err.message || 'Erinnerung fehlgeschlagen', 'error');
                            } finally {
                              setIsSendingReminder(false);
                            }
                          }}
                        >
                          {isSendingReminder ? <><Loader2 size={12} className="nb-spin" /> Sende...</> : <><Send size={12} /> NB nachfragen</>}
                        </button>
                        {((data as any).reminderCount ?? 0) > 0 && (
                          <span className="badge badge--purple" title={`Letzte: ${(data as any).lastReminderAt ? new Date((data as any).lastReminderAt).toLocaleDateString('de-DE') : '–'}`}>
                            {(data as any).reminderCount}. Nachfrage
                          </span>
                        )}
                        <span className="nb-action__target">
                          → {data.nbEmail || 'Keine Email'}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Inline-Edit Formular */}
                {isEditingNb && (
                  <div className="nb-edit-form">
                    <div className="nb-form-group">
                      <label className="nb-form-label">NB-Email (Einreich)</label>
                      <input
                        className="nb-input"
                        type="email"
                        placeholder="email@netzbetreiber.de"
                        value={nbEditEmail}
                        onChange={(e) => setNbEditEmail(e.target.value)}
                        disabled={!data.gridOperatorId}
                      />
                      {!data.gridOperatorId && (
                        <span className="nb-hint">Kein Netzbetreiber zugeordnet – Email kann nicht gesetzt werden</span>
                      )}
                    </div>
                    <div className="nb-form-group">
                      <label className="nb-form-label">Vorgangsnummer</label>
                      <input
                        className="nb-input"
                        type="text"
                        placeholder="z.B. NB-2026-001234"
                        value={nbEditCaseNumber}
                        onChange={(e) => setNbEditCaseNumber(e.target.value)}
                      />
                    </div>
                    <div className="nb-actions">
                      <button className="btn-sm primary" onClick={handleNbSave} disabled={nbSaving}>
                        {nbSaving ? <><Loader2 size={12} className="spin" /> Speichert...</> : 'Speichern'}
                      </button>
                      <button className="btn-sm ghost" onClick={() => setIsEditingNb(false)} disabled={nbSaving}>
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kommunikation Summary Card - nur für Staff */}
            {isAdmin && (
              <KommunikationSummaryCard
                data={data}
                showToast={showToast}
                onTabChange={onTabChange}
              />
            )}

            {/* 🔥 Zähler Card - aus Wizard-Daten (mit Zählpunkt, MaLo, etc.) */}
            {(wizardData.meter.number || data.zaehlernummer || wizardData.meter.type) && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">Zähler</span>
                </div>
                <div className="card-body">
                  {(wizardData.meter.number || data.zaehlernummer) && (
                    <div className="data-row">
                      <span className="data-label">Nummer</span>
                      <span className="data-value mono">{wizardData.meter.number || data.zaehlernummer}</span>
                    </div>
                  )}
                  {wizardData.meter.zaehlpunkt && (
                    <div className="data-row">
                      <span className="data-label">Zählpunkt</span>
                      <span className="data-value mono" style={{ fontSize: '0.7rem' }}>{wizardData.meter.zaehlpunkt}</span>
                    </div>
                  )}
                  {wizardData.meter.marktlokation && (
                    <div className="data-row">
                      <span className="data-label">MaLo-ID</span>
                      <span className="data-value mono">{wizardData.meter.marktlokation}</span>
                    </div>
                  )}
                  {wizardData.meter.type && (
                    <div className="data-row">
                      <span className="data-label">Typ</span>
                      <span className="data-value">
                        {wizardData.meter.type === 'zweirichtung' ? 'Zweirichtungszähler' :
                         wizardData.meter.type === 'einrichtung' ? 'Einrichtungszähler' :
                         wizardData.meter.type === 'wandlermessung' ? 'Wandlermessung' :
                         wizardData.meter.type === 'rlm' ? 'RLM (Registrierende Leistungsmessung)' :
                         wizardData.meter.type}
                      </span>
                    </div>
                  )}
                  {wizardData.meter.location && (
                    <div className="data-row">
                      <span className="data-label">Standort</span>
                      <span className="data-value">
                        {wizardData.meter.location === 'keller' ? 'Keller' :
                         wizardData.meter.location === 'hausanschluss' ? 'Hausanschluss' :
                         wizardData.meter.location === 'technikraum' ? 'Technikraum' :
                         wizardData.meter.location === 'garage' ? 'Garage' :
                         wizardData.meter.location === 'outdoor' ? 'Außen' :
                         wizardData.meter.location === 'zaehlerplatz' ? 'Zählerplatz' :
                         wizardData.meter.location}
                      </span>
                    </div>
                  )}
                  {wizardData.meter.ownership && (
                    <div className="data-row">
                      <span className="data-label">Eigentümer</span>
                      <span className="data-value">
                        {wizardData.meter.ownership === 'netzbetreiber' ? 'Netzbetreiber' :
                         wizardData.meter.ownership === 'messstellenbetreiber' ? 'Messstellenbetreiber' :
                         wizardData.meter.ownership === 'kunde' ? 'Kunde' :
                         wizardData.meter.ownership}
                      </span>
                    </div>
                  )}
                  {wizardData.meter.tariffType && (
                    <div className="data-row">
                      <span className="data-label">Tarifart</span>
                      <span className="data-value">
                        {wizardData.meter.tariffType === 'eintarif' ? 'Eintarif' :
                         wizardData.meter.tariffType === 'zweitarif' ? 'Zweitarif (HT/NT)' :
                         wizardData.meter.tariffType === 'ht_nt_wp' ? 'HT/NT + Wärmepumpe' :
                         wizardData.meter.tariffType}
                      </span>
                    </div>
                  )}
                  {/* Erweiterte Zähler-Felder */}
                  {wizardData.meter.fernauslesung !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Fernauslesung</span>
                      <span className={`data-value ${wizardData.meter.fernauslesung ? 'highlight-success' : ''}`}>
                        {wizardData.meter.fernauslesung ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {wizardData.meter.smartMeterGateway !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Smart Meter Gateway</span>
                      <span className={`data-value ${wizardData.meter.smartMeterGateway ? 'highlight-success' : ''}`}>
                        {wizardData.meter.smartMeterGateway ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {wizardData.meter.imsysGewuenscht !== undefined && (
                    <div className="data-row">
                      <span className="data-label">iMSys gewünscht</span>
                      <span className={`data-value ${wizardData.meter.imsysGewuenscht ? 'highlight-success' : ''}`}>
                        {wizardData.meter.imsysGewuenscht ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {wizardData.meter.zaehlerstdBezug !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Stand Bezug</span>
                      <span className="data-value">{wizardData.meter.zaehlerstdBezug.toLocaleString('de-DE')} kWh</span>
                    </div>
                  )}
                  {wizardData.meter.zaehlerstdEinspeisung !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Stand Einspeisung</span>
                      <span className="data-value">{wizardData.meter.zaehlerstdEinspeisung.toLocaleString('de-DE')} kWh</span>
                    </div>
                  )}
                  {wizardData.meter.ablesedatum && (
                    <div className="data-row">
                      <span className="data-label">Ablesedatum</span>
                      <span className="data-value">{new Date(wizardData.meter.ablesedatum).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  {/* Zähler-Wechsel spezifische Felder */}
                  {wizardData.meter.altZaehlernummer && (
                    <div className="data-row">
                      <span className="data-label">Alte Zählernr.</span>
                      <span className="data-value mono">{wizardData.meter.altZaehlernummer}</span>
                    </div>
                  )}
                  {wizardData.meter.wechselGrund && (
                    <div className="data-row">
                      <span className="data-label">Wechselgrund</span>
                      <span className="data-value">{wizardData.meter.wechselGrund}</span>
                    </div>
                  )}
                  {wizardData.meter.gewuenschterTyp && (
                    <div className="data-row">
                      <span className="data-label">Gewünschter Typ</span>
                      <span className="data-value">
                        {wizardData.meter.gewuenschterTyp === 'zweirichtung' ? 'Zweirichtungszähler' :
                         wizardData.meter.gewuenschterTyp === 'einrichtung' ? 'Einrichtungszähler' :
                         wizardData.meter.gewuenschterTyp === 'wandlermessung' ? 'Wandlermessung' :
                         wizardData.meter.gewuenschterTyp}
                      </span>
                    </div>
                  )}
                  {wizardData.meter.gewuenschterStandort && (
                    <div className="data-row">
                      <span className="data-label">Gewünschter Standort</span>
                      <span className="data-value">{wizardData.meter.gewuenschterStandort}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Zähler-Bestand (abmelden / zusammenlegen) */}
            {wizardData.meterStock && wizardData.meterStock.length > 0 && (
              <div className="collapsible-section">
                <div className="section-header" style={{ background: 'var(--surface-elevated, #1e293b)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Zähler abmelden / zusammenlegen</span>
                  <span className="badge badge--purple" style={{ marginLeft: 8 }}>{wizardData.meterStock.length}</span>
                </div>
                {wizardData.meterStock.map((z: any, idx: number) => (
                  <div key={z.id || idx} style={{ background: 'var(--surface, #0f172a)', borderRadius: 8, padding: '10px 14px', marginBottom: 6, border: z.aktion === 'abmelden' ? '1px solid var(--error, #f87171)' : z.aktion === 'zusammenlegen' ? '1px solid var(--primary, #EAD068)' : '1px solid var(--border, #334155)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>Zähler {z.zaehlernummer || `#${idx + 1}`}</span>
                      {z.aktion && (
                        <span className={`badge ${z.aktion === 'abmelden' ? 'badge--red' : z.aktion === 'zusammenlegen' ? 'badge--purple' : 'badge--green'}`} style={{ fontSize: 10 }}>
                          {z.aktion === 'abmelden' ? 'Abmelden' : z.aktion === 'zusammenlegen' ? 'Zusammenlegen' : 'Behalten'}
                        </span>
                      )}
                    </div>
                    <div className="data-grid compact">
                      {z.verwendung && (
                        <div className="data-row"><span className="data-label">Verwendung</span><span className="data-value">{z.verwendung}</span></div>
                      )}
                      {z.zaehlpunktbezeichnung && (
                        <div className="data-row"><span className="data-label">Zählpunkt</span><span className="data-value mono" style={{ fontSize: '0.7rem' }}>{z.zaehlpunktbezeichnung}</span></div>
                      )}
                      {z.marktlokationsId && (
                        <div className="data-row"><span className="data-label">MaLo-ID</span><span className="data-value mono">{z.marktlokationsId}</span></div>
                      )}
                      {z.typ && (
                        <div className="data-row"><span className="data-label">Typ</span><span className="data-value">
                          {z.typ === 'zweirichtung' ? 'Zweirichtung' : z.typ === 'einrichtung' ? 'Einrichtung' : z.typ === 'wandlermessung' ? 'Wandlermessung' : z.typ === 'rlm' ? 'RLM' : z.typ}
                        </span></div>
                      )}
                      {z.standort && (
                        <div className="data-row"><span className="data-label">Standort</span><span className="data-value">{z.standort}</span></div>
                      )}
                      {z.tarifart && (
                        <div className="data-row"><span className="data-label">Tarifart</span><span className="data-value">{z.tarifart}</span></div>
                      )}
                      {z.letzterStand != null && (
                        <div className="data-row"><span className="data-label">Zählerstand Bezug</span><span className="data-value">{Number(z.letzterStand).toLocaleString('de-DE')} kWh</span></div>
                      )}
                      {z.letzterStandEinspeisung != null && (
                        <div className="data-row"><span className="data-label">Zählerstand Einsp.</span><span className="data-value">{Number(z.letzterStandEinspeisung).toLocaleString('de-DE')} kWh</span></div>
                      )}
                      {z.ablesedatum && (
                        <div className="data-row"><span className="data-label">Ablesedatum</span><span className="data-value">{new Date(z.ablesedatum).toLocaleDateString('de-DE')}</span></div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Neuer Zähler bei Zusammenlegung */}
                {wizardData.meterNew && (
                  <div style={{ background: 'var(--surface, #0f172a)', borderRadius: 8, padding: '10px 14px', marginTop: 6, border: '1px solid var(--primary, #EAD068)' }}>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: 'var(--primary, #EAD068)' }}>Neuer Zähler</div>
                    <div className="data-grid compact">
                      {wizardData.meterNew.gewuenschterTyp && (
                        <div className="data-row"><span className="data-label">Typ</span><span className="data-value">{wizardData.meterNew.gewuenschterTyp}</span></div>
                      )}
                      {wizardData.meterNew.standort && (
                        <div className="data-row"><span className="data-label">Standort</span><span className="data-value">{wizardData.meterNew.standort}</span></div>
                      )}
                      {wizardData.meterNew.befestigung && (
                        <div className="data-row"><span className="data-label">Befestigung</span><span className="data-value">{wizardData.meterNew.befestigung}</span></div>
                      )}
                      {wizardData.meterNew.tarifart && (
                        <div className="data-row"><span className="data-label">Tarifart</span><span className="data-value">
                          {wizardData.meterNew.tarifart === 'eintarif' ? 'Eintarif' :
                           wizardData.meterNew.tarifart === 'zweitarif' ? 'Zweitarif (HT/NT)' :
                           wizardData.meterNew.tarifart === 'ht_nt_wp' ? 'HT/NT + Wärmepumpe' :
                           wizardData.meterNew.tarifart}
                        </span></div>
                      )}
                      {wizardData.meterNew.fuerAnlage && (
                        <div className="data-row"><span className="data-label">Für Anlage</span><span className="data-value">
                          {wizardData.meterNew.fuerAnlage === 'pv' ? 'PV-Anlage' :
                           wizardData.meterNew.fuerAnlage === 'speicher' ? 'Speicher' :
                           wizardData.meterNew.fuerAnlage === 'wallbox' ? 'Wallbox' :
                           wizardData.meterNew.fuerAnlage === 'waermepumpe' ? 'Wärmepumpe' :
                           wizardData.meterNew.fuerAnlage === 'allgemeinstrom' ? 'Allgemeinstrom' :
                           wizardData.meterNew.fuerAnlage === 'sonstige' ? (wizardData.meterNew.fuerAnlageSonstige || 'Sonstige') :
                           wizardData.meterNew.fuerAnlage}
                        </span></div>
                      )}
                      {wizardData.meterNew.imsysGewuenscht !== undefined && (
                        <div className="data-row"><span className="data-label">iMSys gewünscht</span><span className="data-value">{wizardData.meterNew.imsysGewuenscht ? '✓ Ja' : 'Nein'}</span></div>
                      )}
                      {wizardData.meterNew.wunschMsb && (
                        <div className="data-row"><span className="data-label">MSB-Wunsch</span><span className="data-value">
                          {wizardData.meterNew.wunschMsb === 'grundzustaendig' ? 'Grundzuständig' :
                           wizardData.meterNew.wunschMsb === 'wettbewerblich' ? `Wettbewerblich${wizardData.meterNew.msbName ? ` (${wizardData.meterNew.msbName})` : ''}` :
                           wizardData.meterNew.wunschMsb}
                        </span></div>
                      )}
                      {wizardData.meterNew.zusammenlegungVon && wizardData.meterNew.zusammenlegungVon.length > 0 && (
                        <div className="data-row"><span className="data-label">Zusammenlegung von</span><span className="data-value">{wizardData.meterNew.zusammenlegungVon.length} Zähler(n)</span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Zählerwechsel-Terminmanagement */}
            <div className="zw-card">
              <div className="zw-header">
                <div className="zw-header-left">
                  <span className="zw-icon"><CalendarClock size={16} /></span>
                  <span className="zw-title">Zählerwechsel</span>
                </div>
                {!isEditingZw && (
                  zwAppointment?.status === 'CONFIRMED'
                    ? <span className="zw-status confirmed"><CheckCircle size={11} /> Bestätigt</span>
                    : data.zaehlerwechselDatum
                      ? <span className="zw-status pending"><Clock size={11} /> Ausstehend</span>
                      : <span className="zw-status none">Kein Termin</span>
                )}
              </div>
              <div className="zw-body">
                {isEditingZw ? (
                  /* ── Formular ── */
                  <div className="zw-form">
                    <div className="zw-form-row">
                      <input
                        type="date" value={zwDatum}
                        onChange={e => setZwDatum(e.target.value)}
                        className="zw-input" style={{ flex: 1 }}
                      />
                      <input
                        type="time" value={zwUhrzeit}
                        onChange={e => setZwUhrzeit(e.target.value)}
                        className="zw-input" style={{ width: '95px' }}
                      />
                    </div>
                    <input
                      type="text" value={zwKommentar}
                      onChange={e => setZwKommentar(e.target.value)}
                      placeholder="Hinweis an den Kunden (optional)"
                      className="zw-input" style={{ width: '100%' }}
                    />
                    <div className="zw-hint">
                      <Mail size={11} /> Kunde wird per Email (mit Kalender-Datei) + WhatsApp benachrichtigt
                    </div>
                    <div className="zw-form-row">
                      <button className="btn-sm primary" onClick={handleScheduleZw} disabled={zwSaving || !zwDatum} style={{ flex: 1 }}>
                        {zwSaving ? <><Loader2 size={12} className="spin" /> Sende...</> : <><Send size={12} /> Termin senden</>}
                      </button>
                      <button className="btn-sm ghost" onClick={() => {
                        setIsEditingZw(false);
                        setZwDatum(data.zaehlerwechselDatum?.split('T')[0] || '');
                        setZwUhrzeit(data.zaehlerwechselUhrzeit || '09:00');
                        setZwKommentar(data.zaehlerwechselKommentar || '');
                      }}>
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : data.zaehlerwechselDatum ? (
                  /* ── Termin geplant ── */
                  <>
                    <div className="zw-datetime">
                      <div className="zw-datetime-icon">
                        <Calendar size={18} />
                      </div>
                      <div className="zw-datetime-text">
                        <span className="zw-datetime-date">
                          {new Date(data.zaehlerwechselDatum).toLocaleDateString('de-DE', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </span>
                        {data.zaehlerwechselUhrzeit && (
                          <span className="zw-datetime-time">{data.zaehlerwechselUhrzeit} Uhr</span>
                        )}
                      </div>
                    </div>

                    {data.zaehlerwechselKommentar && (
                      <div className="zw-kommentar">
                        <FileText size={12} />
                        <span>{data.zaehlerwechselKommentar}</span>
                      </div>
                    )}

                    <div className="data-row">
                      <span className="data-label">Status</span>
                      <span className="data-value">
                        {zwAppointment?.status === 'CONFIRMED' ? (
                          <span className="zw-status confirmed">
                            <CheckCircle size={11} />
                            Bestätigt{zwAppointment.confirmedAt ? ` am ${new Date(zwAppointment.confirmedAt).toLocaleDateString('de-DE')}` : ''}
                          </span>
                        ) : data.zaehlerwechselKundeInformiert ? (
                          <span className="zw-status confirmed">
                            <CheckCircle size={11} /> Kunde informiert
                          </span>
                        ) : (
                          <span className="zw-status pending">
                            <Clock size={11} /> Warte auf Bestätigung
                          </span>
                        )}
                      </span>
                    </div>

                    {zwAppointment?.createdAt && (
                      <div className="zw-meta">
                        Benachrichtigt am {new Date(zwAppointment.createdAt).toLocaleDateString('de-DE')}
                      </div>
                    )}

                    {isAdmin && (
                      <div className="zw-actions">
                        <button className="btn-sm ghost" onClick={() => setIsEditingZw(true)} disabled={zwSaving}>
                          <Edit2 size={11} /> Verschieben
                        </button>
                        <button className="btn-sm ghost danger" onClick={handleCancelZw} disabled={zwSaving}>
                          <Trash2 size={11} /> Absagen
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Kein Termin ── */
                  <div className="zw-empty">
                    <div className="zw-empty-icon">
                      <CalendarClock size={22} />
                    </div>
                    <span className="zw-empty-text">Noch kein Termin geplant</span>
                    {isAdmin && (
                      <button className="btn-sm primary" onClick={() => setIsEditingZw(true)}>
                        <Plus size={12} /> Termin planen
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 🔥 NEU: Netzanschluss Card */}
            {(wizardData.gridConnection.hakId || wizardData.gridConnection.existingFuseA || wizardData.gridConnection.erdungsart) && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">⚡ Netzanschluss</span>
                </div>
                <div className="card-body">
                  {wizardData.gridConnection.hakId && (
                    <div className="data-row">
                      <span className="data-label">HAK-ID</span>
                      <span className="data-value mono">{wizardData.gridConnection.hakId}</span>
                    </div>
                  )}
                  {wizardData.gridConnection.hausanschlusskastenTyp && (
                    <div className="data-row">
                      <span className="data-label">HAK Typ</span>
                      <span className="data-value">{wizardData.gridConnection.hausanschlusskastenTyp}</span>
                    </div>
                  )}
                  {wizardData.gridConnection.existingPowerKw && (
                    <div className="data-row">
                      <span className="data-label">Best. Leistung</span>
                      <span className="data-value">{wizardData.gridConnection.existingPowerKw} kW</span>
                    </div>
                  )}
                  {wizardData.gridConnection.existingFuseA && (
                    <div className="data-row">
                      <span className="data-label">Best. Absicherung</span>
                      <span className="data-value">{wizardData.gridConnection.existingFuseA} A</span>
                    </div>
                  )}
                  {wizardData.gridConnection.requestedPowerKw && (
                    <div className="data-row">
                      <span className="data-label">Gew. Leistung</span>
                      <span className="data-value highlight-success">{wizardData.gridConnection.requestedPowerKw} kW</span>
                    </div>
                  )}
                  {wizardData.gridConnection.requestedFuseA && (
                    <div className="data-row">
                      <span className="data-label">Gew. Absicherung</span>
                      <span className="data-value highlight-success">{wizardData.gridConnection.requestedFuseA} A</span>
                    </div>
                  )}
                  {wizardData.gridConnection.erdungsart && (
                    <div className="data-row">
                      <span className="data-label">Erdungsart</span>
                      <span className="data-value">{wizardData.gridConnection.erdungsart}</span>
                    </div>
                  )}
                  {wizardData.gridConnection.kurzschlussleistungMVA && (
                    <div className="data-row">
                      <span className="data-label">Kurzschlussleistung</span>
                      <span className="data-value">{wizardData.gridConnection.kurzschlussleistungMVA} MVA</span>
                    </div>
                  )}
                  {wizardData.gridConnection.netzimpedanzOhm && (
                    <div className="data-row">
                      <span className="data-label">Netzimpedanz</span>
                      <span className="data-value">{wizardData.gridConnection.netzimpedanzOhm} Ω</span>
                    </div>
                  )}
                  {wizardData.gridConnection.leistungserhoehungGrund && (
                    <div className="data-row">
                      <span className="data-label">Erhöhungsgrund</span>
                      <span className="data-value">{wizardData.gridConnection.leistungserhoehungGrund}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🔥 NEU: Technische Details Card - Messkonzept, §14a, Betriebsweise, etc. */}
            {(wizardData.technical.messkonzept || wizardData.technical.paragraph14a?.relevant || wizardData.technical.feedInManagement?.ferngesteuert !== undefined) && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">🔧 Technische Details</span>
                </div>
                <div className="card-body">
                  {wizardData.technical.messkonzept && (
                    <div className="data-row">
                      <span className="data-label">Messkonzept</span>
                      <span className="data-value">
                        {wizardData.technical.messkonzept === 'zweirichtung' ? 'Zweirichtungszähler' :
                         wizardData.technical.messkonzept === 'kaskade' ? 'Kaskadenmessung' :
                         wizardData.technical.messkonzept === 'wandler' ? 'Wandlermessung' :
                         wizardData.technical.messkonzept === 'rlm' ? 'RLM' :
                         wizardData.technical.messkonzept}
                      </span>
                    </div>
                  )}
                  {wizardData.technical.gridLevel && (
                    <div className="data-row">
                      <span className="data-label">Netzebene</span>
                      <span className="data-value">
                        {wizardData.technical.gridLevel === 'niederspannung' ? 'Niederspannung' :
                         wizardData.technical.gridLevel === 'mittelspannung' ? 'Mittelspannung' :
                         wizardData.technical.gridLevel}
                      </span>
                    </div>
                  )}
                  {wizardData.technical.gridFeedPhases && (
                    <div className="data-row">
                      <span className="data-label">Netzeinspeisung</span>
                      <span className="data-value">{wizardData.technical.gridFeedPhases}</span>
                    </div>
                  )}
                  {wizardData.technical.dcAcRatio && (
                    <div className="data-row">
                      <span className="data-label">DC/AC Ratio</span>
                      <span className="data-value">{wizardData.technical.dcAcRatio.toFixed(2)}</span>
                    </div>
                  )}
                  {wizardData.technical.naProtectionRequired !== undefined && (
                    <div className="data-row">
                      <span className="data-label">NA-Schutz erforderlich</span>
                      <span className={`data-value ${wizardData.technical.naProtectionRequired ? 'highlight-success' : ''}`}>
                        {wizardData.technical.naProtectionRequired ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {/* §14a EnWG */}
                  {wizardData.technical.paragraph14a?.relevant && (
                    <>
                      <div className="data-row">
                        <span className="data-label">§14a EnWG</span>
                        <span className="data-value highlight-success">✓ Relevant</span>
                      </div>
                      {wizardData.technical.paragraph14a.modul && (
                        <div className="data-row">
                          <span className="data-label">§14a Modul</span>
                          <span className="data-value">
                            {wizardData.technical.paragraph14a.modul === 'modul1' ? 'Modul 1 (Pauschale)' :
                             wizardData.technical.paragraph14a.modul === 'modul2' ? 'Modul 2 (Zeitvariabel)' :
                             wizardData.technical.paragraph14a.modul === 'modul3' ? 'Modul 3 (Direktsteuerung)' :
                             wizardData.technical.paragraph14a.modul}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {/* Einspeisemanagement */}
                  {wizardData.technical.feedInManagement?.ferngesteuert !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Ferngesteuert</span>
                      <span className={`data-value ${wizardData.technical.feedInManagement.ferngesteuert ? 'highlight-success' : ''}`}>
                        {wizardData.technical.feedInManagement.ferngesteuert ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {wizardData.technical.feedInManagement?.dauerhaftBegrenzt && (
                    <div className="data-row">
                      <span className="data-label">Dauerhaft begrenzt</span>
                      <span className="data-value">
                        ✓ {wizardData.technical.feedInManagement.begrenzungProzent || 70}%
                      </span>
                    </div>
                  )}
                  {/* Betriebsweise */}
                  {wizardData.technical.operationMode && (
                    <>
                      {wizardData.technical.operationMode.inselbetrieb && (
                        <div className="data-row">
                          <span className="data-label">Inselbetrieb</span>
                          <span className="data-value highlight-success">✓ Vorgesehen</span>
                        </div>
                      )}
                      {wizardData.technical.operationMode.ueberschusseinspeisung && (
                        <div className="data-row">
                          <span className="data-label">Überschusseinspeisung</span>
                          <span className="data-value highlight-success">✓ Ja</span>
                        </div>
                      )}
                      {wizardData.technical.operationMode.volleinspeisung && (
                        <div className="data-row">
                          <span className="data-label">Volleinspeisung</span>
                          <span className="data-value highlight-success">✓ Ja</span>
                        </div>
                      )}
                    </>
                  )}
                  {/* Blindleistungskompensation */}
                  {wizardData.technical.reactiveCompensation?.vorhanden && (
                    <>
                      <div className="data-row">
                        <span className="data-label">Blindleistungskompensation</span>
                        <span className="data-value highlight-success">✓ Vorhanden</span>
                      </div>
                      {wizardData.technical.reactiveCompensation.anzahlStufen && (
                        <div className="data-row">
                          <span className="data-label">Stufen</span>
                          <span className="data-value">{wizardData.technical.reactiveCompensation.anzahlStufen}</span>
                        </div>
                      )}
                    </>
                  )}
                  {/* Sonderszenarien */}
                  {wizardData.technical.mieterstrom && (
                    <div className="data-row">
                      <span className="data-label">Mieterstrom</span>
                      <span className="data-value highlight-success">✓ Ja</span>
                    </div>
                  )}
                  {wizardData.technical.energySharing && (
                    <div className="data-row">
                      <span className="data-label">Energy Sharing</span>
                      <span className="data-value highlight-success">✓ Ja</span>
                    </div>
                  )}
                  {wizardData.technical.mehrereAnlagen && (
                    <div className="data-row">
                      <span className="data-label">Mehrere Anlagen</span>
                      <span className="data-value highlight-success">✓ Ja</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🔥 NEU: Eigentum Card */}
            {wizardData?.owner && (wizardData.owner.isOwner !== undefined || wizardData.owner.consentGiven !== undefined) && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">🏠 Eigentum</span>
                </div>
                <div className="card-body">
                  {wizardData.owner.isOwner !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Eigentümer</span>
                      <span className={`data-value ${wizardData.owner.isOwner ? 'highlight-success' : ''}`}>
                        {wizardData.owner.isOwner ? '✓ Ja, Antragsteller ist Eigentümer' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {!wizardData.owner.isOwner && wizardData.owner.consentGiven !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Zustimmung</span>
                      <span className={`data-value ${wizardData.owner.consentGiven ? 'highlight-success' : ''}`}>
                        {wizardData.owner.consentGiven ? '✓ Eigentümer-Zustimmung vorhanden' : 'Nicht vorhanden'}
                      </span>
                    </div>
                  )}
                  {wizardData.owner.ownerData && (
                    <>
                      {wizardData.owner.ownerData.name && (
                        <div className="data-row">
                          <span className="data-label">Eigentümer Name</span>
                          <span className="data-value">{wizardData.owner.ownerData.name}</span>
                        </div>
                      )}
                      {wizardData.owner.ownerData.adresse && (
                        <div className="data-row">
                          <span className="data-label">Eigentümer Adresse</span>
                          <span className="data-value">{wizardData.owner.ownerData.adresse}</span>
                        </div>
                      )}
                      {wizardData.owner.ownerData.email && (
                        <div className="data-row">
                          <span className="data-label">Eigentümer Email</span>
                          <span className="data-value">
                            <a href={`mailto:${wizardData.owner.ownerData.email}`}>{wizardData.owner.ownerData.email}</a>
                          </span>
                        </div>
                      )}
                      {wizardData.owner.ownerData.telefon && (
                        <div className="data-row">
                          <span className="data-label">Eigentümer Telefon</span>
                          <span className="data-value">
                            <a href={`tel:${wizardData.owner.ownerData.telefon}`}>{wizardData.owner.ownerData.telefon}</a>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 🔥 Inbetriebnahme Card - aus Wizard-Daten */}
            {wizardData?.commissioning && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">Inbetriebnahme</span>
                </div>
                <div className="card-body">
                  {wizardData.commissioning.plannedDate && (
                    <div className="data-row">
                      <span className="data-label">Geplant</span>
                      <span className="data-value">{new Date(wizardData.commissioning.plannedDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  {wizardData.commissioning.actualDate && (
                    <div className="data-row">
                      <span className="data-label">Tatsächlich</span>
                      <span className="data-value">{new Date(wizardData.commissioning.actualDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  {wizardData.commissioning.eegDate && (
                    <div className="data-row">
                      <span className="data-label">EEG-Datum</span>
                      <span className="data-value">{new Date(wizardData.commissioning.eegDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  {wizardData.commissioning.mastrNumber && (
                    <div className="data-row">
                      <span className="data-label">MaStR-Nr. Solar</span>
                      <span className="data-value mono">{wizardData.commissioning.mastrNumber}</span>
                    </div>
                  )}
                  {wizardData.commissioning.mastrNumberSpeicher && (
                    <div className="data-row">
                      <span className="data-label">MaStR-Nr. Speicher</span>
                      <span className="data-value mono">{wizardData.commissioning.mastrNumberSpeicher}</span>
                    </div>
                  )}
                  <div className="data-row">
                    <span className="data-label">MaStR registriert</span>
                    <span className={`data-value ${wizardData.commissioning.mastrRegistered ? 'highlight-success' : ''}`}>
                      {wizardData.commissioning.mastrRegistered ? '✓ Ja' : 'Nein'}
                    </span>
                  </div>
                  {wizardData.commissioning.mastrDate && (
                    <div className="data-row">
                      <span className="data-label">MaStR-Datum</span>
                      <span className="data-value">{new Date(wizardData.commissioning.mastrDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  <div className="data-row">
                    <span className="data-label">NB benachrichtigt</span>
                    <span className={`data-value ${wizardData.commissioning.gridOperatorNotified ? 'highlight-success' : ''}`}>
                      {wizardData.commissioning.gridOperatorNotified ? '✓ Ja' : 'Nein'}
                    </span>
                  </div>
                  {wizardData.commissioning.gridOperatorNotifiedDate && (
                    <div className="data-row">
                      <span className="data-label">NB-Meldedatum</span>
                      <span className="data-value">{new Date(wizardData.commissioning.gridOperatorNotifiedDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  {wizardData.commissioning.gridOperatorConfirmed !== undefined && (
                    <div className="data-row">
                      <span className="data-label">NB-Bestätigung</span>
                      <span className={`data-value ${wizardData.commissioning.gridOperatorConfirmed ? 'highlight-success' : ''}`}>
                        {wizardData.commissioning.gridOperatorConfirmed ? '✓ Bestätigt' : 'Ausstehend'}
                      </span>
                    </div>
                  )}
                  {wizardData.commissioning.status && (
                    <div className="data-row">
                      <span className="data-label">IBN-Status</span>
                      <span className="data-value">
                        {wizardData.commissioning.status === 'geplant' ? 'Geplant' :
                         wizardData.commissioning.status === 'beantragt' ? 'Beantragt' :
                         wizardData.commissioning.status === 'freigegeben' ? 'Freigegeben' :
                         wizardData.commissioning.status === 'durchgefuehrt' ? 'Durchgeführt' :
                         wizardData.commissioning.status === 'abgenommen' ? 'Abgenommen' :
                         wizardData.commissioning.status}
                      </span>
                    </div>
                  )}
                  {isAdmin && wizardData.authorization?.mastrRegistration && !wizardData.commissioning.mastrRegistered && (
                    <MaStrConfirmInline
                      installId={data.id}
                      hasStorage={(wizardData.batteryEntries?.length || 0) > 0}
                      onConfirmed={() => queryClient.invalidateQueries({ queryKey: ['installation-detail', data.id] })}
                    />
                  )}
                  {isAdmin && data.publicId && (!wizardData.commissioning.mastrNumber || !wizardData.commissioning.mastrNumberSpeicher) && (
                    <MaStrMatchInline publicId={data.publicId} onMatched={() => queryClient.invalidateQueries({ queryKey: ['installation-detail', data.id] })} />
                  )}
                </div>
              </div>
            )}

            {/* 🔥 Zählerausbau/Demontage Card - aus Wizard-Daten */}
            {wizardData?.decommissioning && wizardData.decommissioning.type && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">🔧 Zählerausbau / Demontage</span>
                </div>
                <div className="card-body">
                  <div className="data-row">
                    <span className="data-label">Art</span>
                    <span className="data-value">
                      {wizardData.decommissioning.type === 'zaehler' ? 'Zählerausbau' :
                       wizardData.decommissioning.type === 'pv_komplett' ? 'PV-Anlage komplett' :
                       wizardData.decommissioning.type === 'pv_teilweise' ? 'PV-Teildemontage' :
                       wizardData.decommissioning.type === 'speicher' ? 'Speicherdemontage' :
                       wizardData.decommissioning.type === 'wechselrichter' ? 'Wechselrichterdemontage' :
                       wizardData.decommissioning.type === 'wallbox' ? 'Wallboxdemontage' :
                       wizardData.decommissioning.type === 'waermepumpe' ? 'Wärmepumpendemontage' :
                       wizardData.decommissioning.type === 'eeg_anlage' ? 'EEG-Anlage' :
                       wizardData.decommissioning.type === 'anlage' ? 'Anlagenabbau' :
                       wizardData.decommissioning.type}
                    </span>
                  </div>
                  {/* Zählernummer: aus decommissioning ODER aus meter (bei Zählerausbau) */}
                  {(wizardData.decommissioning.meterNumber || (wizardData.decommissioning.type === 'zaehler' && wizardData.meter.number)) && (
                    <div className="data-row">
                      <span className="data-label">Zählernummer</span>
                      <span className="data-value mono">{wizardData.decommissioning.meterNumber || wizardData.meter.number}</span>
                    </div>
                  )}
                  {wizardData.decommissioning.mastrNumber && (
                    <div className="data-row">
                      <span className="data-label">MaStR-Nummer</span>
                      <span className="data-value mono">{wizardData.decommissioning.mastrNumber}</span>
                    </div>
                  )}
                  {wizardData.decommissioning.reason && (
                    <div className="data-row">
                      <span className="data-label">Grund</span>
                      <span className="data-value">
                        {wizardData.decommissioning.reason === 'stilllegung' ? 'Stilllegung' :
                         wizardData.decommissioning.reason === 'modernisierung' ? 'Modernisierung' :
                         wizardData.decommissioning.reason === 'defekt' ? 'Defekt' :
                         wizardData.decommissioning.reason === 'verkauf' ? 'Verkauf' :
                         wizardData.decommissioning.reason === 'abriss' ? 'Abriss' :
                         wizardData.decommissioning.reason === 'umbau' ? 'Umbau' :
                         wizardData.decommissioning.reason === 'wechsel' ? 'Zählerwechsel' :
                         wizardData.decommissioning.reasonOther || wizardData.decommissioning.reason}
                      </span>
                    </div>
                  )}
                  {wizardData.decommissioning.eegAnlagenId && (
                    <div className="data-row">
                      <span className="data-label">EEG-Anlagen-ID</span>
                      <span className="data-value mono">{wizardData.decommissioning.eegAnlagenId}</span>
                    </div>
                  )}
                  {wizardData.decommissioning.leistungKwp != null && (
                    <div className="data-row">
                      <span className="data-label">PV-Leistung</span>
                      <span className="data-value">{wizardData.decommissioning.leistungKwp} kWp</span>
                    </div>
                  )}
                  {wizardData.decommissioning.leistungKva != null && (
                    <div className="data-row">
                      <span className="data-label">WR-Leistung</span>
                      <span className="data-value">{wizardData.decommissioning.leistungKva} kVA</span>
                    </div>
                  )}
                  {wizardData.decommissioning.speicherKwh != null && (
                    <div className="data-row">
                      <span className="data-label">Speicher</span>
                      <span className="data-value">{wizardData.decommissioning.speicherKwh} kWh</span>
                    </div>
                  )}
                  {wizardData.decommissioning.plannedDate && (
                    <div className="data-row">
                      <span className="data-label">Geplantes Datum</span>
                      <span className="data-value">{new Date(wizardData.decommissioning.plannedDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  {wizardData.decommissioning.lastOperationDay && (
                    <div className="data-row">
                      <span className="data-label">Letzter Betriebstag</span>
                      <span className="data-value">{new Date(wizardData.decommissioning.lastOperationDay).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                  <div className="data-row">
                    <span className="data-label">NB informiert</span>
                    <span className={`data-value ${wizardData.decommissioning.gridOperatorNotified ? 'highlight-success' : ''}`}>
                      {wizardData.decommissioning.gridOperatorNotified ? '✓ Ja' : 'Nein'}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">MaStR abgemeldet</span>
                    <span className={`data-value ${wizardData.decommissioning.mastrDeregistered ? 'highlight-success' : ''}`}>
                      {wizardData.decommissioning.mastrDeregistered ? '✓ Ja' : 'Nein'}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Ablesung durchgeführt</span>
                    <span className={`data-value ${wizardData.decommissioning.readingDone ? 'highlight-success' : ''}`}>
                      {wizardData.decommissioning.readingDone ? '✓ Ja' : 'Nein'}
                    </span>
                  </div>
                  {wizardData.decommissioning.entsorgungsnachweis !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Entsorgungsnachweis</span>
                      <span className={`data-value ${wizardData.decommissioning.entsorgungsnachweis ? 'highlight-success' : ''}`}>
                        {wizardData.decommissioning.entsorgungsnachweis ? '✓ Vorhanden' : 'Nicht vorhanden'}
                      </span>
                    </div>
                  )}
                  {wizardData.decommissioning.bemerkungen && (
                    <div className="data-row">
                      <span className="data-label">Bemerkungen</span>
                      <span className="data-value">{wizardData.decommissioning.bemerkungen}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🔥 Autorisierung Card - aus Wizard-Daten */}
            {wizardData?.authorization && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">✍️ Autorisierung</span>
                </div>
                <div className="card-body">
                  <div className="data-row">
                    <span className="data-label">Vollmacht erteilt</span>
                    <span className={`data-value ${wizardData.authorization.powerOfAttorney ? 'highlight-success' : ''}`}>
                      {wizardData.authorization.powerOfAttorney ? '✓ Ja' : 'Nein'}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">MaStR-Registrierung</span>
                    <span className={`data-value ${wizardData.authorization.mastrRegistration ? 'highlight-success' : ''}`}>
                      {wizardData.authorization.mastrRegistration ? '✓ Ja, wird durchgeführt' : 'Nein, macht Kunde selbst'}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">AGB akzeptiert</span>
                    <span className={`data-value ${wizardData.authorization.termsAccepted ? 'highlight-success' : ''}`}>
                      {wizardData.authorization.termsAccepted ? '✓ Ja' : 'Nein'}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Datenschutz akzeptiert</span>
                    <span className={`data-value ${wizardData.authorization.privacyAccepted ? 'highlight-success' : ''}`}>
                      {wizardData.authorization.privacyAccepted ? '✓ Ja' : 'Nein'}
                    </span>
                  </div>
                  {wizardData.authorization.kundenportalAnlegen !== undefined && (
                    <div className="data-row">
                      <span className="data-label">Kundenportal anlegen</span>
                      <span className={`data-value ${wizardData.authorization.kundenportalAnlegen ? 'highlight-success' : ''}`}>
                        {wizardData.authorization.kundenportalAnlegen ? '✓ Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🔥 Fotos - Mit Vorschau und Download Buttons */}
            {(() => {
              // Foto-Dokumente aus data.documents filtern
              const photoDocuments = (data.documents || []).filter((doc) => {
                const dt = (doc.dokumentTyp || '').toLowerCase();
                const kat = (doc.kategorie || '').toUpperCase();
                return dt.startsWith('foto') || kat === 'FOTOS_AC' || kat === 'FOTOS_DC' || kat === 'FOTO';
              });

              if (photoDocuments.length === 0 && (!wizardData.photos || wizardData.photos.length === 0)) {
                return null;
              }

              const handlePhotoPreview = async (doc: any) => {
                try {
                  const response = await fetch(doc.url + '?view=true', { credentials: 'include' });
                  if (!response.ok) throw new Error('Fehler beim Laden');
                  const blob = await response.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  window.open(blobUrl, '_blank');
                } catch (err) {
                  showToast('Vorschau fehlgeschlagen', 'error');
                }
              };

              const handlePhotoDownload = async (doc: any) => {
                try {
                  const response = await fetch(doc.url, { credentials: 'include' });
                  if (!response.ok) throw new Error('Fehler beim Download');
                  const blob = await response.blob();
                  const { downloadFile } = await import('@/utils/desktopDownload');
                  await downloadFile({ filename: doc.originalName || doc.dateiname || 'foto', blob });
                } catch (err) {
                  showToast('Download fehlgeschlagen', 'error');
                }
              };

              const getCategoryLabel = (doc: any) => {
                const dt = (doc.dokumentTyp || '').toLowerCase();
                if (dt.includes('zaehlerschrank')) return 'Zählerschrank';
                if (dt.includes('zaehler')) return 'Zähler';
                if (dt.includes('wechselrichter')) return 'Wechselrichter';
                if (dt.includes('speicher')) return 'Speicher';
                if (dt.includes('pv') || dt.includes('modul')) return 'PV-Module';
                if (dt.includes('dach')) return 'Dach';
                if (dt.includes('ac')) return 'AC';
                if (dt.includes('dc')) return 'DC';
                return 'Foto';
              };

              return (
                <div className="data-card">
                  <div className="card-header">
                    <span className="card-title"><Camera size={16} style={{ marginRight: 6 }} />Fotos ({photoDocuments.length})</span>
                    <button className="card-action" onClick={() => onTabChange?.('dokumente')}>
                      Alle anzeigen
                    </button>
                  </div>
                  <div className="card-body">
                    {photoDocuments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {photoDocuments.map((doc: any) => (
                          <div key={doc.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {getCategoryLabel(doc)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.originalName || doc.dateiname}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                              <button
                                onClick={() => handlePhotoPreview(doc)}
                                style={{
                                  padding: '6px',
                                  background: 'var(--accent-primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Vorschau"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handlePhotoDownload(doc)}
                                style={{
                                  padding: '6px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Download"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {wizardData.photos?.length} Fotos im Wizard hochgeladen - im Tab "Dokumente" ansehen
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Dokumente Completeness Card */}
            {(() => {
              const docs = data.documents || [];
              const totalDocs = docs.length;
              const kategorien = new Set(docs.map((d: any) => (d.kategorie || '').toUpperCase()));
              const REQ_GROUPS = [
                { label: 'Lageplan', ids: ['LAGEPLAN'] },
                { label: 'Schaltplan', ids: ['SCHALTPLAN'] },
                { label: 'Datenblätter', ids: ['DATENBLATT'] },
                { label: 'Anträge / VDE', ids: ['ANTRAG'] },
              ];
              const fulfilled = REQ_GROUPS.filter(g => g.ids.some(id => kategorien.has(id)));
              const allComplete = fulfilled.length === REQ_GROUPS.length;
              const pct = Math.round((fulfilled.length / REQ_GROUPS.length) * 100);

              return (
                <div className="data-card" style={{ borderLeft: `3px solid ${allComplete ? '#22c55e' : '#f59e0b'}` }}>
                  <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={16} />
                      Dokumente
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                        {totalDocs} Datei{totalDocs !== 1 ? 'en' : ''}
                      </span>
                    </span>
                    <button className="card-action" onClick={() => onTabChange?.('dokumente')}>
                      Alle anzeigen
                    </button>
                  </div>
                  <div className="card-body">
                    {/* Progress Bar */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: allComplete ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                          Pflichtdokumente
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{fulfilled.length}/{REQ_GROUPS.length}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`, borderRadius: 3,
                          background: allComplete ? '#22c55e' : '#f59e0b',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                    {/* Checklist */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                      {REQ_GROUPS.map(g => {
                        const ok = g.ids.some(id => kategorien.has(id));
                        return (
                          <div key={g.label} style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 12, color: ok ? '#22c55e' : 'var(--text-muted)',
                          }}>
                            {ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} style={{ color: '#f59e0b' }} />}
                            <span style={{ fontWeight: ok ? 500 : 400 }}>{g.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Missing hint */}
                    {!allComplete && (
                      <div style={{
                        marginTop: 8, padding: '6px 10px', fontSize: 11, borderRadius: 4,
                        background: '#fef3c7', color: '#92400e',
                      }}>
                        {REQ_GROUPS.filter(g => !g.ids.some(id => kategorien.has(id))).map(g => g.label).join(', ')} fehlt noch
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 🔥 NEU: Wizard Meta Card */}
            {(wizardData.wizardVersion || wizardData.submittedAt) && (
              <div className="data-card">
                <div className="card-header">
                  <span className="card-title">ℹ️ Wizard Info</span>
                </div>
                <div className="card-body">
                  {wizardData.wizardVersion && (
                    <div className="data-row">
                      <span className="data-label">Version</span>
                      <span className="data-value mono">{wizardData.wizardVersion}</span>
                    </div>
                  )}
                  {wizardData.submittedAt && (
                    <div className="data-row">
                      <span className="data-label">Eingereicht</span>
                      <span className="data-value">{new Date(wizardData.submittedAt).toLocaleString('de-DE')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anlage Card - Zeilenbasiertes Layout mit ZEREZ-ID und Details */}
            <div className="data-card wide">
              <div className="card-header">
                <span className="card-title">Anlage</span>
              </div>
              <div className="card-body anlage-rows">
                {/* Photovoltaik Row - mit Ausrichtung, Neigung, Dachname */}
                <div className={`anlage-row ${!wizardData.technical.totalPvKwp && !data.totalKwp ? 'muted' : ''}`}>
                  <div className="anlage-row-header">
                    <span className="anlage-row-label">PHOTOVOLTAIK</span>
                    <span className="anlage-row-value pv">{wizardData.technical.totalPvKwp?.toFixed(1) || data.totalKwp?.toFixed(1) || '—'} kWp</span>
                  </div>
                  <div className="anlage-row-details">
                    {wizardData.pvEntries.length > 0 ? (
                      wizardData.pvEntries.map((pv: any, i: number) => (
                        <div key={i} className="anlage-row-detail">
                          <div>Module: {pv.count || 1}x {pv.manufacturer || '—'} {pv.model || ''} {pv.powerWp ? `${pv.powerWp}W` : ''}</div>
                          {(pv.roofName || pv.orientation || pv.tilt || pv.shading) && (
                            <div className="anlage-row-meta">
                              {pv.roofName && <span>📍 {pv.roofName}</span>}
                              {pv.orientation && <span> | 🧭 {pv.orientation}</span>}
                              {pv.tilt && <span> | 📐 {pv.tilt}°</span>}
                              {pv.shading && pv.shading !== 'keine' && (
                                <span> | 🌤️ Verschattung: {pv.shading === 'gering' ? 'Gering' : pv.shading === 'mittel' ? 'Mittel' : pv.shading === 'stark' ? 'Stark' : pv.shading}</span>
                              )}
                            </div>
                          )}
                          {(pv.stringsCount || pv.modulesPerString) && (
                            <div className="anlage-row-meta">
                              {pv.stringsCount && <span>Strings: {pv.stringsCount}</span>}
                              {pv.modulesPerString && <span> | Module/String: {pv.modulesPerString}</span>}
                            </div>
                          )}
                        </div>
                      ))
                    ) : data.technicalDetails?.dachflaechen && data.technicalDetails.dachflaechen.length > 0 ? (
                      data.technicalDetails.dachflaechen.map((pv, i) => (
                        <div key={i} className="anlage-row-detail">
                          Module: {pv.modulAnzahl || pv.anzahl || '—'}x {pv.modulHersteller || pv.hersteller || '—'} {pv.modulModell || pv.modell || ''} {pv.modulLeistungWp ? `${pv.modulLeistungWp}W` : ''}
                        </div>
                      ))
                    ) : (
                      <div className="anlage-row-detail muted">Keine Moduldaten</div>
                    )}
                    {/* Wechselrichter mit ZEREZ-ID */}
                    {wizardData.inverterEntries.length > 0 ? (
                      wizardData.inverterEntries.map((wr: any, i: number) => (
                        <div key={`wr-${i}`} className="anlage-row-detail">
                          <div>
                            Wechselrichter: {wr.count && wr.count > 1 ? `${wr.count}x ` : ''}{wr.manufacturer || '—'} {wr.model || ''} {wr.powerKva ? `${wr.powerKva} kVA` : wr.powerKw ? `${wr.powerKw} kW` : ''}
                            {wr.hybrid && <span className="anlage-badge hybrid">Hybrid</span>}
                          </div>
                          {(wr.zerezId || wr.mpptCount) && (
                            <div className="anlage-row-meta">
                              {wr.zerezId && <span className="zerez-id">ZEREZ: {wr.zerezId}</span>}
                              {wr.mpptCount && <span> | MPPT: {wr.mpptCount}</span>}
                            </div>
                          )}
                        </div>
                      ))
                    ) : data.technicalDetails?.wechselrichter && data.technicalDetails.wechselrichter.length > 0 && (
                      data.technicalDetails.wechselrichter.map((wr, i) => (
                        <div key={`wr-${i}`} className="anlage-row-detail">
                          Wechselrichter: {wr.anzahl && wr.anzahl > 1 ? `${wr.anzahl}x ` : ''}{wr.hersteller || '—'} {wr.modell || ''}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Speicher Row - mit Kopplung und Notstrom/Ersatzstrom */}
                <div className={`anlage-row ${!wizardData.technical.totalBatteryKwh && !data.speicherKwh ? 'muted' : ''}`}>
                  <div className="anlage-row-header">
                    <span className="anlage-row-label">SPEICHER</span>
                    <span className="anlage-row-value battery">{wizardData.technical.totalBatteryKwh?.toFixed(1) || data.speicherKwh?.toFixed(1) || '—'} kWh</span>
                  </div>
                  <div className="anlage-row-details">
                    {wizardData.batteryEntries.length > 0 ? (
                      wizardData.batteryEntries.map((sp: any, i: number) => (
                        <div key={i} className="anlage-row-detail">
                          <div>
                            {sp.count && sp.count > 1 ? `${sp.count}x ` : ''}{sp.manufacturer || '—'} {sp.model || ''} {sp.capacityKwh ? `${sp.capacityKwh} kWh` : ''}
                            {sp.powerKw && <span> ({sp.powerKw} kW)</span>}
                            {sp.powerKva && <span> / {sp.powerKva} kVA</span>}
                            {sp.coupling && (
                              <span className={`anlage-badge ${sp.coupling === 'dc' ? 'dc-coupled' : 'ac-coupled'}`}>
                                {sp.coupling.toUpperCase()}-gekoppelt
                              </span>
                            )}
                            {sp.emergencyPower && <span className="anlage-badge emergency">Notstrom</span>}
                            {sp.backupPower && <span className="anlage-badge backup">Ersatzstrom</span>}
                            {sp.islandCapable && <span className="anlage-badge emergency">Inselnetz</span>}
                          </div>
                          {(sp.connectionPhase || sp.naProtection !== undefined) && (
                            <div className="anlage-row-meta">
                              {sp.connectionPhase && <span>Phase: {sp.connectionPhase === 'drehstrom' ? 'Drehstrom' : sp.connectionPhase}</span>}
                              {sp.naProtection !== undefined && <span>{sp.connectionPhase ? ' | ' : ''}NA-Schutz: {sp.naProtection ? '✓' : '—'}</span>}
                            </div>
                          )}
                        </div>
                      ))
                    ) : data.technicalDetails?.speicher && data.technicalDetails.speicher.length > 0 ? (
                      data.technicalDetails.speicher.map((sp, i) => (
                        <div key={i} className="anlage-row-detail">
                          {sp.anzahl && sp.anzahl > 1 ? `${sp.anzahl}x ` : ''}{sp.hersteller || '—'} {sp.modell || ''}
                        </div>
                      ))
                    ) : (
                      <div className="anlage-row-detail muted">Keine</div>
                    )}
                  </div>
                </div>

                {/* Wallbox Row - mit §14a */}
                <div className={`anlage-row ${wizardData.wallboxEntries.length === 0 && !data.wallboxKw ? 'muted' : ''}`}>
                  <div className="anlage-row-header">
                    <span className="anlage-row-label">WALLBOX</span>
                    <span className="anlage-row-value wallbox">{data.wallboxKw?.toFixed(1) || '—'} kW</span>
                  </div>
                  <div className="anlage-row-details">
                    {wizardData.wallboxEntries.length > 0 ? (
                      wizardData.wallboxEntries.map((wb: any, i: number) => (
                        <div key={i} className="anlage-row-detail">
                          <div>
                            {wb.count && wb.count > 1 ? `${wb.count}x ` : ''}{wb.manufacturer || '—'} {wb.model || ''} {wb.powerKw ? `${wb.powerKw} kW` : ''}
                            {wb.controllable14a && <span className="anlage-badge controllable">§14a steuerbar</span>}
                            {wb.phases && <span className="anlage-row-meta"> | {wb.phases}-phasig</span>}
                            {wb.socket && <span className="anlage-row-meta"> | {wb.socket}</span>}
                          </div>
                        </div>
                      ))
                    ) : data.technicalDetails?.wallboxen && data.technicalDetails.wallboxen.length > 0 ? (
                      data.technicalDetails.wallboxen.map((wb, i) => (
                        <div key={i} className="anlage-row-detail">
                          {wb.anzahl && wb.anzahl > 1 ? `${wb.anzahl}x ` : ''}{wb.hersteller || '—'} {wb.modell || ''}
                        </div>
                      ))
                    ) : (
                      <div className="anlage-row-detail muted">Keine</div>
                    )}
                  </div>
                </div>

                {/* Wärmepumpe Row - mit §14a und SG Ready */}
                <div className={`anlage-row ${wizardData.heatpumpEntries.length === 0 && !data.waermepumpeKw ? 'muted' : ''} ${wizardData.bhkwEntries.length === 0 && wizardData.windEntries.length === 0 ? 'last' : ''}`}>
                  <div className="anlage-row-header">
                    <span className="anlage-row-label">WÄRMEPUMPE</span>
                    <span className="anlage-row-value heatpump">{data.waermepumpeKw?.toFixed(1) || '—'} kW</span>
                  </div>
                  <div className="anlage-row-details">
                    {wizardData.heatpumpEntries.length > 0 ? (
                      wizardData.heatpumpEntries.map((hp: any, i: number) => (
                        <div key={i} className="anlage-row-detail">
                          <div>
                            {hp.count && hp.count > 1 ? `${hp.count}x ` : ''}{hp.manufacturer || '—'} {hp.model || ''} {hp.powerKw ? `${hp.powerKw} kW` : ''}
                            {hp.type && <span className="anlage-badge type">{hp.type}</span>}
                            {hp.sgReady && <span className="anlage-badge sg-ready">SG Ready</span>}
                            {hp.controllable14a && <span className="anlage-badge controllable">§14a steuerbar</span>}
                          </div>
                        </div>
                      ))
                    ) : data.technicalDetails?.waermepumpen && data.technicalDetails.waermepumpen.length > 0 ? (
                      data.technicalDetails.waermepumpen.map((wp, i) => (
                        <div key={i} className="anlage-row-detail">
                          {wp.anzahl && wp.anzahl > 1 ? `${wp.anzahl}x ` : ''}{wp.hersteller || '—'} {wp.modell || ''}
                        </div>
                      ))
                    ) : (
                      <div className="anlage-row-detail muted">Keine</div>
                    )}
                  </div>
                </div>

                {/* BHKW Row */}
                {wizardData.bhkwEntries.length > 0 && (
                  <div className={`anlage-row ${wizardData.windEntries.length === 0 ? 'last' : ''}`}>
                    <div className="anlage-row-header">
                      <span className="anlage-row-label">BHKW</span>
                      <span className="anlage-row-value">{wizardData.bhkwEntries.reduce((sum: number, b: any) => sum + (b.electricPowerKw || 0), 0).toFixed(1)} kW<sub>el</sub></span>
                    </div>
                    <div className="anlage-row-details">
                      {wizardData.bhkwEntries.map((bh: any, i: number) => (
                        <div key={i} className="anlage-row-detail">
                          <div>
                            {bh.manufacturer || '—'} {bh.model || ''} {bh.electricPowerKw ? `${bh.electricPowerKw} kW(el)` : ''}
                            {bh.thermalPowerKw && <span> / {bh.thermalPowerKw} kW(th)</span>}
                            {bh.fuel && (
                              <span className="anlage-badge type">
                                {bh.fuel === 'erdgas' ? 'Erdgas' : bh.fuel === 'biogas' ? 'Biogas' : bh.fuel === 'oel' ? 'Öl' : bh.fuel === 'holz' ? 'Holz' : bh.fuel}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Windkraft Row */}
                {wizardData.windEntries.length > 0 && (
                  <div className="anlage-row last">
                    <div className="anlage-row-header">
                      <span className="anlage-row-label">WINDKRAFT</span>
                      <span className="anlage-row-value">{wizardData.windEntries.reduce((sum: number, w: any) => sum + (w.powerKw || 0), 0).toFixed(1)} kW</span>
                    </div>
                    <div className="anlage-row-details">
                      {wizardData.windEntries.map((wk: any, i: number) => (
                        <div key={i} className="anlage-row-detail">
                          <div>
                            {wk.manufacturer || '—'} {wk.model || ''} {wk.powerKw ? `${wk.powerKw} kW` : ''}
                          </div>
                          {(wk.hubHeight || wk.rotorDiameter) && (
                            <div className="anlage-row-meta">
                              {wk.hubHeight && <span>Nabenhöhe: {wk.hubHeight}m</span>}
                              {wk.rotorDiameter && <span>{wk.hubHeight ? ' | ' : ''}Rotor-∅: {wk.rotorDiameter}m</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billing Section - Nur für Admins sichtbar */}
          {isAdmin && (
            <div className="billing-section">
              <div className="billing-header">
                <span className="billing-icon">💰</span>
                <span className="billing-title">Abrechnung</span>
              </div>
              <div className="billing-content">
                {data.rechnungGestellt ? (
                  // Bereits abgerechnet
                  <>
                    <div className="billing-status invoiced">
                      <span className="billing-status-icon">✅</span>
                      <span className="billing-status-text">Abgerechnet</span>
                    </div>
                    <div className="billing-details">
                      <div className="billing-row">
                        <span className="billing-label">Rechnung:</span>
                        <span className="billing-value mono">{data.rechnungNummer || '—'}</span>
                      </div>
                      <div className="billing-row">
                        <span className="billing-label">Datum:</span>
                        <span className="billing-value">
                          {data.rechnungDatum ? new Date(data.rechnungDatum).toLocaleDateString('de-DE') : '—'}
                        </span>
                      </div>
                      <div className="billing-row">
                        <span className="billing-label">Betrag:</span>
                        <span className="billing-value highlight">
                          {data.rechnungBetrag ? `${Number(data.rechnungBetrag).toFixed(2).replace('.', ',')} € brutto` : '—'}
                        </span>
                      </div>
                      {data.rechnungBezahlt && (
                        <div className="billing-row">
                          <span className="billing-label">Bezahlt:</span>
                          <span className="billing-value paid">
                            ✓ {data.rechnungBezahltAm ? new Date(data.rechnungBezahltAm).toLocaleDateString('de-DE') : 'Ja'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="billing-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => window.open(`/api/rechnungen/by-number/${data.rechnungNummer}/pdf`, '_blank')}
                      >
                        📄 Rechnung anzeigen
                      </button>
                    </div>
                  </>
                ) : (
                  // Noch nicht abgerechnet
                  <>
                    <div className="billing-status pending">
                      <span className="billing-status-icon">⚪</span>
                      <span className="billing-status-text">Noch nicht abgerechnet</span>
                    </div>
                    <div className="billing-preview">
                      <div className="billing-row">
                        <span className="billing-label">Leistung:</span>
                        <span className="billing-value">
                          Netzanmeldung {data.totalKwp ? `PV-Anlage ${data.totalKwp.toFixed(1)} kWp` : 'PV-Anlage'}
                        </span>
                      </div>
                      <div className="billing-row">
                        <span className="billing-label">Betrag:</span>
                        <span className="billing-value highlight">99,00 € netto (117,81 € brutto)</span>
                      </div>
                      <div className="billing-row">
                        <span className="billing-label">Empfänger:</span>
                        <span className="billing-value">{data.createdByCompany || data.createdByName || 'Kunde'}</span>
                      </div>
                    </div>
                    <div className="billing-actions">
                      <button
                        className="btn btn-primary"
                        onClick={handleCreateInvoice}
                        disabled={isCreatingInvoice}
                      >
                        {isCreatingInvoice ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Wird erstellt...
                          </>
                        ) : (
                          <>📄 Rechnung erstellen & versenden</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Activity Section */}
          <div className="activity-section">
            <div className="activity-header">
              <span className="activity-title">Letzte Aktivitäten</span>
              <span className="activity-toggle" onClick={() => onTabChange?.('historie')}>Alle anzeigen</span>
            </div>
            <div className="activity-list">
              {/* Show status history */}
              {(data.statusHistory || []).slice(0, 3).map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-indicator status" />
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>Status</strong> — {item.fromStatus ? `${item.fromStatus} → ` : ''}{item.statusLabel}
                      {item.comment && <span style={{ color: 'var(--text-muted)' }}> "{item.comment}"</span>}
                    </div>
                    <div className="activity-time">
                      {formatRelativeTime(item.createdAt)} • {item.changedByName}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show recent emails */}
              {emails.slice(0, 2).map(email => (
                <div key={`email-${email.id}`} className="activity-item" onClick={() => handleShowEmail(email.id)}>
                  <div className="activity-indicator email" />
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>Email</strong> — {email.subject}
                    </div>
                    <div className="activity-time">{formatRelativeTime(email.receivedAt)}</div>
                  </div>
                </div>
              ))}

              {/* Erstellt-Info - IMMER anzeigen */}
              {data.createdAt && (
                <div className="activity-item created-item">
                  <div className="activity-indicator created" />
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>Erstellt</strong> — von {data.createdByCompany || data.createdByName || data.createdByEmail?.split('@')[0] || 'Unbekannt'}
                    </div>
                    <div className="activity-time">
                      {formatDateTime(data.createdAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Email Address Section */}
          <div className="email-section">
            <div className="email-header-box">
              <div className="email-header-left">
                <div className="email-icon">
                  <Mail size={16} />
                </div>
                <span className="email-label">NB-Korrespondenz</span>
              </div>
            </div>
            <div className="email-address-box">
              <span className="email-address">{emailAddress}</span>
              <button className="copy-btn" onClick={handleCopyEmail}>
                {copied ? 'Kopiert!' : 'Kopieren'}
              </button>
            </div>
          </div>

          {/* Email List - Klick öffnet Email-Tab */}
          <div className="email-list-section">
            <div className="email-list-header">
              <span className="email-list-title">Emails</span>
              <span className="email-count">{emails.length}</span>
            </div>

            <div className="email-list">
              {emailsLoading ? (
                <div className="empty-state">
                  <Loader2 className="animate-spin" size={20} />
                  Laden...
                </div>
              ) : emails.length === 0 ? (
                <div className="empty-state">Keine Emails vorhanden</div>
              ) : (
                emails.map((email) => {
                  const badge = getBadgeType(email.aiType);
                  const badgeText = getBadgeText(email.aiType);
                  const emailIdNum = typeof email.id === 'string' ? parseInt(email.id, 10) : email.id;
                  return (
                    <div
                      key={email.id}
                      className={`email-item ${!email.isRead ? 'unread' : ''}`}
                      onClick={() => onOpenEmail ? onOpenEmail(emailIdNum) : setSelectedEmailId(emailIdNum)}
                    >
                      <div className="email-item-header">
                        <span className="email-from">{email.fromName || email.fromAddress}</span>
                        <span className="email-time">{formatRelativeTime(email.receivedAt)}</span>
                      </div>
                      <div className="email-subject">{email.subject}</div>
                      {badge && (
                        <span className={`email-ai-badge ${badge}`}>
                          <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                          </svg>
                          {badgeText}
                        </span>
                      )}
                      <ChevronRight size={14} className="email-item-arrow" />
                    </div>
                  );
                })
              )}
            </div>

            {emails.length > 0 && (
              <div className="email-list-hint">
                Klicken Sie auf eine Email, um sie zu öffnen
              </div>
            )}
          </div>

          {/* Kundenportal Status */}
          <PortalStatusCard
            installationId={data.id}
            contactEmail={data.contactEmail}
            customerName={data.customerName}
            isAdmin={isAdmin}
          />

          {/* AI Assistant Panel - Admin Only */}
          {isAdmin && (
            <AIAssistantPanel
              installationId={data.id}
              publicId={data.publicId || `INST-${data.id}`}
            />
          )}

        </aside>
      </div>
    </div>
  );
}

export default PremiumOverviewTab;
