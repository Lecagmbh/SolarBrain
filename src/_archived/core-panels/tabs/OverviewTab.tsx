/**
 * OverviewTab – Unified layout composition
 * Pure layout – all logic lives in section components
 */

import type { InstallationDetail, GridOperator } from '../../../features/netzanmeldungen/types';
import { parseWizardContext, extractTechDataFromWizard } from '../../../features/netzanmeldungen/utils';
import { installationsApi } from '../../../features/netzanmeldungen/services/api';
import { usePermissions } from '../../../hooks/usePermissions';

// Section components
import { KpiHeader } from '../sections/overview/KpiHeader';
import { CustomerCard } from '../sections/overview/CustomerCard';
import { LocationCard } from '../sections/overview/LocationCard';
import { GridOperatorCard } from '../sections/overview/GridOperatorCard';
import { TechComponentCards } from '../sections/overview/TechComponentCards';
import { MeterCard } from '../sections/overview/MeterCard';
import { CommissioningCard } from '../sections/overview/CommissioningCard';
import { MetaCard } from '../sections/overview/MetaCard';
import { SubcontractorCard } from '../sections/overview/SubcontractorCard';
// NbReferencesCard and CommunicationSummaryCard disabled — backend endpoints not available
// import { NbReferencesCard } from '../sections/overview/NbReferencesCard';
// import { CommunicationSummaryCard } from '../sections/overview/CommunicationSummaryCard';
import { MeterChangeScheduler } from '../sections/overview/MeterChangeScheduler';
import { WestnetzCard } from '../sections/overview/WestnetzCard';
import { getAccessToken } from '../../../modules/auth/tokenStorage';

// Helpers
const safeString = (value: any, fallback = ''): string => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value.name || value.kurzname || value.label || value.modell || fallback;
  return String(value) || fallback;
};

const safeNumber = (value: any, fallback = 0): number => {
  if (value == null) return fallback;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(n) ? fallback : n;
};

interface OverviewTabProps {
  detail: InstallationDetail;
  gridOperators: GridOperator[];
  onUpdate: (data: Partial<InstallationDetail>) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
  onSwitchToTab?: (tab: string) => void;
}

export function UnifiedOverviewTab({ detail, gridOperators, onUpdate, showToast, isKunde, onSwitchToTab }: OverviewTabProps) {
  const permissions = usePermissions();
  const isStaff = permissions.isAdmin || permissions.isMitarbeiter;

  // Parse wizard data and normalize tech
  const wizardData = parseWizardContext(detail.wizardContext);
  const techRaw = extractTechDataFromWizard(detail, wizardData);

  const tech = {
    pv: (techRaw.pv || []).map((p: any) => ({
      manufacturer: safeString(p.manufacturer) || safeString(p.modulHersteller) || safeString(p.hersteller),
      model: safeString(p.model) || safeString(p.modulModell) || safeString(p.modell),
      count: safeNumber(p.count) || safeNumber(p.moduleCount) || safeNumber(p.anzahl) || 1,
      powerWp: safeNumber(p.powerWp) || safeNumber(p.modulLeistungWp) || safeNumber(p.leistungWp),
      orientation: safeString(p.orientation) || safeString(p.ausrichtung),
      tilt: safeNumber(p.tilt) || safeNumber(p.neigung),
      roofName: safeString(p.roofName) || safeString(p.name),
      shading: p.shading || p.verschattung,
      stringCount: p.stringCount || p.stringAnzahl,
      modulesPerString: p.modulesPerString || p.moduleProString,
    })),
    inverters: (techRaw.inverters || []).map((inv: any) => ({
      manufacturer: safeString(inv.manufacturer) || safeString(inv.hersteller),
      model: safeString(inv.model) || safeString(inv.modell),
      powerKw: safeNumber(inv.powerKw) || safeNumber(inv.leistungKw) || safeNumber(inv.acLeistungKw),
      powerKva: safeNumber(inv.powerKva) || safeNumber(inv.leistungKva),
      zerezId: safeString(inv.zerezId),
      hybrid: inv.hybrid === true,
      mpptCount: inv.mpptCount || inv.mpptAnzahl,
    })),
    storage: (techRaw.storage || []).map((st: any) => ({
      manufacturer: safeString(st.manufacturer) || safeString(st.hersteller),
      model: safeString(st.model) || safeString(st.modell),
      capacityKwh: safeNumber(st.capacityKwh) || safeNumber(st.kapazitaetKwh),
      coupling: safeString(st.coupling) || safeString(st.kopplung),
      powerKw: safeNumber(st.powerKw) || safeNumber(st.leistungKw) || undefined,
      apparentPowerKva: safeNumber(st.apparentPowerKva) || undefined,
      emergencyPower: st.emergencyPower ?? st.notstrom,
      backupPower: st.backupPower ?? st.ersatzstrom,
      islandForming: st.islandForming ?? st.inselnetzBildend,
      connectionPhase: st.connectionPhase || st.anschlussPhase,
      inverterManufacturer: st.inverterManufacturer || st.umrichterHersteller,
      inverterType: st.inverterType || st.umrichterTyp,
      inverterCount: st.inverterCount || st.umrichterAnzahl,
      displacementFactorCos: st.displacementFactorCos || st.verschiebungsfaktorCos,
    })),
    wallbox: (techRaw.wallbox || []).map((wb: any) => ({
      manufacturer: safeString(wb.manufacturer) || safeString(wb.hersteller),
      model: safeString(wb.model) || safeString(wb.modell),
      powerKw: safeNumber(wb.powerKw) || safeNumber(wb.leistungKw),
      controllable14a: wb.controllable14a ?? wb.steuerbar14a,
      phases: wb.phases || wb.phasen,
      socketType: wb.socketType || wb.steckdose,
    })),
    heatPump: (techRaw.heatPump || []).map((hp: any) => ({
      manufacturer: safeString(hp.manufacturer) || safeString(hp.hersteller),
      model: safeString(hp.model) || safeString(hp.modell),
      powerKw: safeNumber(hp.powerKw) || safeNumber(hp.leistungKw),
      type: hp.type || hp.typ,
      controllable14a: hp.controllable14a ?? hp.steuerbar14a,
      sgReady: hp.sgReady,
    })),
  };

  const currentOperator = gridOperators.find((op) => op.id === detail.gridOperatorId);
  const isWestnetz = (currentOperator?.name || detail.gridOperator || '').toLowerCase().includes('westnetz');
  const customerEmail = detail.customer?.email || detail.contactEmail;
  const nbEmail = currentOperator?.email;
  const einreichEmail = detail.nbEmail && detail.nbEmail !== nbEmail ? detail.nbEmail : undefined;

  const totalKwp = techRaw.totalKwp || detail.totalKwp;
  const storageKwh = techRaw.storageKwh;
  const inverterKw = tech.inverters.reduce((s: number, inv: any) => s + (inv.powerKw || 0), 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Alerts section — EVU/AI validation disabled (endpoints not available) */}

      {/* KPI Header */}
      <KpiHeader
        totalKwp={totalKwp}
        inverterKw={inverterKw}
        storageKwh={storageKwh}
        wallboxCount={tech.wallbox.length}
        heatPumpCount={tech.heatPump.length}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <CustomerCard
          customerName={detail.customerName || ''}
          phone={detail.customer?.telefon || detail.contactPhone}
          mobile={wizardData?.customer?.mobile}
          email={customerEmail}
          birthday={detail.customer?.geburtsdatum}
          salutation={wizardData?.customer?.salutation}
          title={wizardData?.customer?.title}
        />

        <LocationCard
          strasse={detail.strasse}
          hausNr={detail.hausNr}
          plz={detail.plz || detail.zipCode}
          ort={detail.ort}
          land={detail.customer?.land || detail.locationData?.land}
          bundesland={wizardData?.location?.siteAddress?.state}
          gemarkung={wizardData?.location?.siteAddress?.cadastralDistrict}
          flur={wizardData?.location?.siteAddress?.parcel}
          flurstueck={wizardData?.location?.siteAddress?.parcelNumber}
          gpsLat={wizardData?.location?.siteAddress?.gpsLat}
          gpsLng={wizardData?.location?.siteAddress?.gpsLng}
        />

        <GridOperatorCard
          operatorName={currentOperator?.name || detail.gridOperator || ''}
          operatorShortName={currentOperator?.shortName}
          operatorEmail={nbEmail}
          operatorPortalUrl={currentOperator?.portalUrl}
          nbCaseNumber={detail.nbCaseNumber}
          zaehlernummer={detail.zaehlernummer}
          nbEmail={detail.nbEmail}
          nbPortalUrl={detail.nbPortalUrl}
          nbEingereichtAm={detail.nbEingereichtAm}
          nbGenehmigungAm={detail.nbGenehmigungAm}
          reminderCount={detail.reminderCount}
          lastReminderAt={detail.lastReminderAt}
          installationStatus={detail.status}
          isStaff={isStaff}
          onSaveNbEmail={
            isStaff
              ? async (email) => {
                  await onUpdate({ nbEmail: email || null } as any);
                  showToast('Einreich-Email gespeichert', 'success');
                }
              : undefined
          }
          onSendReminder={
            isStaff
              ? async () => {
                  const token = getAccessToken();
                  const res = await fetch(`/api/ops/cases/${detail.id}/remind`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || json.message || 'Fehler');
                  showToast(`${json.data?.reminderNumber || (detail.reminderCount ?? 0) + 1}. Nachfrage gesendet`, 'success');
                  onUpdate({});
                }
              : undefined
          }
        />

        {/* Westnetz portal */}
        {isWestnetz && !isKunde && (
          <WestnetzCard
            username={(detail as any).nbPortalUsername}
            password={(detail as any).nbPortalPassword}
            notizen={(detail as any).nbPortalNotizen}
            onSave={async (data) => {
              const token = getAccessToken();
              const res = await fetch(`/api/installations/${detail.id}/nb-portal-credentials`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ nbPortalUsername: data.username, nbPortalPassword: data.password, nbPortalNotizen: data.notizen }),
              });
              if (!res.ok) throw new Error('Speichern fehlgeschlagen');
              showToast('Westnetz-Zugangsdaten gespeichert', 'success');
              onUpdate({});
            }}
          />
        )}

        {/* Communication summary + NB References disabled — endpoints not available */}

        {/* Subcontractor */}
        {!isKunde && (
          <SubcontractorCard
            assignedToName={detail.assignedToName}
            assignedToId={detail.assignedToId}
            installationId={detail.id}
            onAssigned={() => onUpdate({})}
            showToast={showToast}
          />
        )}
      </div>

      {/* Technical data – full width */}
      <TechComponentCards
        pv={tech.pv}
        inverters={tech.inverters}
        storage={tech.storage}
        wallbox={tech.wallbox}
        heatPump={tech.heatPump}
        totalKwp={totalKwp}
        storageKwh={storageKwh}
      />

      {/* More detail sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meter */}
        {wizardData?.meter && (
          <MeterCard data={wizardData.meter} zaehlernummer={detail.zaehlernummer} />
        )}

        {/* Commissioning */}
        {wizardData?.commissioning && (
          <CommissioningCard data={wizardData.commissioning} />
        )}

        {/* Meter change scheduler */}
        {!isKunde && detail.status !== 'fertig' && (
          <MeterChangeScheduler
            installationId={detail.id}
            existingDatum={detail.zaehlerwechselDatum}
            existingUhrzeit={detail.zaehlerwechselUhrzeit}
            existingKommentar={detail.zaehlerwechselKommentar}
            onSchedule={(data) => installationsApi.scheduleZaehlerwechsel(detail.id, data)}
            onCancel={() => installationsApi.cancelZaehlerwechsel(detail.id)}
            onGetAppointment={() => installationsApi.getZaehlerwechselTermin(detail.id)}
            showToast={showToast}
            onUpdate={() => onUpdate({})}
          />
        )}

        {/* Meta */}
        <MetaCard
          createdAt={detail.createdAt}
          updatedAt={detail.updatedAt}
          createdByName={detail.createdByName}
          publicId={detail.publicId}
        />
      </div>
    </div>
  );
}
