// Extracted from PremiumOverviewTab.tsx (lines 282-960)
import type { NormalizedWizardData } from '../types';

export function parseWizardContext(wc?: string | object): any {
  if (!wc) return {};
  if (typeof wc === 'object') return wc;
  try {
    return JSON.parse(wc);
  } catch {
    return {};
  }
}

export function normalizeWizardData(wc: any, detail: any): NormalizedWizardData {
  const result: NormalizedWizardData = {
    caseType: wc?.caseType || wc?.step1?.kategorie || detail?.caseType,
    processType: wc?.processType || wc?.step1?.vorgangsart || detail?.technicalData?.vorgangsart,
    groessenklasse: wc?.groessenklasse || wc?.step1?.groessenklasse,
    registrationTargets: wc?.registrationTargets || wc?.step1?.komponenten || [],

    meterProcess: (wc?.meterProcess || wc?.step1?.zaehlerProzess) ? {
      prozessTyp: wc?.meterProcess?.processType || wc?.step1?.zaehlerProzess?.prozessTyp,
      altZaehlernummer: wc?.meterProcess?.oldMeterNumber || wc?.step1?.zaehlerProzess?.altZaehlernummer,
      neuZaehlertyp: wc?.meterProcess?.newMeterType || wc?.step1?.zaehlerProzess?.neuZaehlertyp,
      neuStandort: wc?.meterProcess?.newLocation || wc?.step1?.zaehlerProzess?.neuStandort,
      neuTarifart: wc?.meterProcess?.newTariffType || wc?.step1?.zaehlerProzess?.neuTarifart,
      antragGestellt: wc?.meterProcess?.applicationSubmitted ?? wc?.step1?.zaehlerProzess?.antragGestellt,
    } : undefined,

    completion: (wc?.completion || wc?.step1?.fertigmeldung) ? {
      installationAbgeschlossen: wc?.completion?.installationComplete ?? wc?.step1?.fertigmeldung?.installationAbgeschlossen,
      netzbetreiberMeldung: wc?.completion?.gridOperatorNotified ?? wc?.step1?.fertigmeldung?.netzbetreiberMeldung,
      mastrGemeldet: wc?.completion?.mastrRegistered ?? wc?.step1?.fertigmeldung?.mastrGemeldet,
      zaehlerGesetzt: wc?.completion?.meterInstalled ?? wc?.step1?.fertigmeldung?.zaehlerGesetzt,
    } : undefined,

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

    gridOperator: {
      id: wc?.location?.netOperator?.id || wc?.step4?.netzbetreiberId,
      name: wc?.location?.netOperator?.name || wc?.step4?.netzbetreiberName || detail?.gridOperator,
    },

    meter: {
      number: wc?.meter?.number || wc?.step4?.zaehlernummer || wc?.step4?.zaehler?.zaehlernummer || detail?.zaehlernummer,
      type: wc?.meter?.type || wc?.step4?.zaehler?.typ,
      location: wc?.meter?.location || wc?.step4?.zaehler?.standort,
      ownership: wc?.meter?.ownership || wc?.step4?.zaehler?.eigentum,
      tariffType: wc?.meter?.tariffType || wc?.step4?.zaehler?.tarifart,
      zaehlpunkt: wc?.meter?.meterPointId || wc?.meter?.zaehlpunkt || wc?.step4?.zaehlpunktbezeichnung || wc?.step4?.zaehler?.zaehlpunktbezeichnung,
      marktlokation: wc?.meter?.marketLocationId || wc?.meter?.marktlokation || wc?.step4?.marktlokationsId || wc?.step4?.zaehler?.marktlokationsId,
      fernauslesung: wc?.meter?.remoteReading ?? wc?.step4?.zaehler?.fernauslesung,
      smartMeterGateway: wc?.meter?.smartMeterGateway ?? wc?.step4?.zaehler?.smartMeterGateway,
      imsysGewuenscht: wc?.meter?.imsysRequested ?? wc?.meter?.imsysWanted ?? wc?.step4?.zaehler?.imsysGewuenscht,
      zaehlerstdBezug: wc?.meter?.readingConsumption ?? wc?.step4?.zaehler?.zaehlerstdBezug,
      zaehlerstdEinspeisung: wc?.meter?.readingFeedIn ?? wc?.step4?.zaehler?.zaehlerstdEinspeisung,
      ablesedatum: wc?.meter?.readingDate || wc?.step4?.zaehler?.ablesedatum,
      vorhanden: wc?.meter?.exists ?? wc?.step4?.zaehler?.vorhanden,
      gewuenschterTyp: wc?.meter?.desiredType || wc?.step4?.zaehler?.gewuenschterTyp,
      gewuenschterStandort: wc?.meter?.desiredLocation || wc?.step4?.zaehler?.gewuenschterStandort,
      wechselGrund: wc?.meter?.changeReason || wc?.step4?.zaehler?.wechselGrund,
      altZaehlernummer: wc?.meter?.oldMeterNumber || wc?.step4?.zaehler?.altZaehlernummer,
    },

    meterStock: normalizeMeterStock(wc),
    meterNew: normalizeNewMeter(wc),

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
      operationMode: wc?.step5?.betriebsweise,
      feedInManagement: wc?.step5?.einspeisemanagement,
      reactiveCompensation: wc?.step5?.blindleistungskompensation,
      mieterstrom: wc?.step5?.mieterstrom,
      energySharing: wc?.step5?.energySharing,
      mehrereAnlagen: wc?.step5?.mehrereAnlagen,
    },

    pvEntries: normalizePvEntries(wc, detail),
    inverterEntries: normalizeInverterEntries(wc, detail),
    batteryEntries: normalizeBatteryEntries(wc, detail),
    wallboxEntries: normalizeWallboxEntries(wc, detail),
    heatpumpEntries: normalizeHeatpumpEntries(wc, detail),
    bhkwEntries: normalizeBhkwEntries(wc),
    windEntries: normalizeWindEntries(wc),

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

    authorization: (wc?.authorization || wc?.step8 || detail?.technicalData) ? {
      powerOfAttorney: wc?.authorization?.powerOfAttorney ?? wc?.step8?.vollmachtErteilt ?? (detail?.technicalData ? true : false),
      mastrRegistration: wc?.authorization?.mastrRegistration ?? wc?.step8?.mastrVoranmeldung ?? detail?.technicalData?.mastrAnlegen ?? false,
      termsAccepted: wc?.authorization?.termsAccepted ?? wc?.step8?.agbAkzeptiert ?? (detail?.technicalData ? true : false),
      privacyAccepted: wc?.authorization?.privacyAccepted ?? wc?.step8?.datenschutzAkzeptiert ?? (detail?.technicalData ? true : false),
      signature: wc?.step8?.signatur,
      kundenportalAnlegen: wc?.authorization?.createCustomerPortal ?? wc?.authorization?.kundenportalAnlegen ?? wc?.step8?.kundenportalAnlegen,
    } : null,

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

    photos: wc?.photos || wc?.step7?.fotos || [],
    documents: wc?.step7?.dokumente || [],
    wizardVersion: wc?.wizardVersion,
    submittedAt: wc?.submittedAt,
  };

  return result;
}

function normalizePvEntries(wc: any, detail: any): any[] {
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
  if (wc?.technical?.pv) {
    const pv = wc.technical.pv;
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

function normalizeInverterEntries(wc: any, detail: any): any[] {
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

function normalizeBatteryEntries(wc: any, detail: any): any[] {
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
  if (wc?.technical?.storage) {
    const bat = wc.technical.storage;
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

function normalizeWallboxEntries(wc: any, _detail: any): any[] {
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

function normalizeHeatpumpEntries(wc: any, _detail: any): any[] {
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

function normalizeMeterStock(wc: any): any[] {
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
  if (wc?.step4?.zaehlerBestand && Array.isArray(wc.step4.zaehlerBestand)) {
    return wc.step4.zaehlerBestand;
  }
  return [];
}

function normalizeNewMeter(wc: any): any | undefined {
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
  return wc?.step4?.zaehlerNeu;
}

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
