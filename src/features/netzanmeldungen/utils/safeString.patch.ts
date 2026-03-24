/**
 * SAFE STRING UTILITIES - PATCH für netzanmeldungen/utils/index.ts
 * =================================================================
 * Diese Funktionen HINZUFÜGEN zur bestehenden utils/index.ts
 */

// ═══════════════════════════════════════════════════════════════════════════
// SAFE STRING HELPER - Handles objects, null, undefined
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extracts a string from any value - handles objects, null, undefined
 * WICHTIG für manufacturer, model, etc. die als Objekte kommen können
 */
export function safeString(value: any, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  
  if (typeof value === 'object') {
    // Common name fields - try in order of priority
    const name = value.name || value.kurzname || value.label || value.modell || value.model;
    if (name) return String(name);
    return fallback;
  }
  
  if (typeof value === 'number') {
    return String(value);
  }
  
  return String(value) || fallback;
}

/**
 * Extracts a number safely
 */
export function safeNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return isNaN(value) ? fallback : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATED extractTechDataFromWizard - Mit safeString für alle Objekte
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ERSETZE die bestehende extractTechDataFromWizard Funktion mit dieser Version
 */
export function extractTechDataFromWizardFixed(detail: any, wizardData: any) {
  const tech = detail.technicalData || {};
  const wizTech = wizardData?.technical || {};
  const step5 = wizardData?.step5 || {};
  
  const ensureArray = (val: any): any[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object' && (val.enabled || val.manufacturer || val.hersteller || val.model || val.modell)) return [val];
    return [];
  };
  
  // PV Modules - NORMALIZE WITH SAFE STRING
  const pvRaw = tech.pvEntries || tech.pvModules || tech.pv || 
                wizTech.pvEntries || wizTech.pvModules || wizTech.pv ||
                wizardData?.pv || step5?.dachflaechen || step5?.pvModules || step5?.pv;
  const pv = ensureArray(pvRaw).map((p: any) => ({
    ...p,
    // WICHTIG: Objekte zu Strings konvertieren
    manufacturer: safeString(p.manufacturer) || safeString(p.modulHersteller) || safeString(p.hersteller),
    model: safeString(p.model) || safeString(p.modulModell) || safeString(p.modell),
    count: safeNumber(p.count) || safeNumber(p.moduleCount) || safeNumber(p.anzahl) || safeNumber(p.modulAnzahl) || 1,
    powerWp: safeNumber(p.powerWp) || safeNumber(p.power) || safeNumber(p.leistungWp) || safeNumber(p.modulLeistungWp),
  }));
  
  // Inverters - NORMALIZE WITH SAFE STRING
  const invRaw = tech.inverterEntries || tech.inverters || tech.inverter || 
                 wizTech.inverterEntries || wizTech.inverters || wizTech.inverter ||
                 wizardData?.inverter || wizardData?.inverters ||
                 step5?.wechselrichter || step5?.inverters || step5?.inverter;
  const inverters = ensureArray(invRaw).map((inv: any) => ({
    ...inv,
    // WICHTIG: Objekte zu Strings konvertieren
    manufacturer: safeString(inv.manufacturer) || safeString(inv.hersteller),
    model: safeString(inv.model) || safeString(inv.modell),
    count: safeNumber(inv.count) || safeNumber(inv.anzahl) || 1,
    powerKva: safeNumber(inv.powerKva) || safeNumber(inv.leistungKva) || safeNumber(inv.ratedPowerKva) || (safeNumber(inv.acPowerW) / 1000),
    hybridCapable: inv.hybridCapable || inv.hybrid || inv.isHybrid || false,
  }));
  
  // Storage / Battery - NORMALIZE WITH SAFE STRING
  const storageRaw = tech.batteryEntries || tech.storageEntries || tech.storage || 
                     wizTech.batteryEntries || wizTech.storageEntries || wizTech.storage ||
                     wizardData?.batteryEntries || wizardData?.storage || wizardData?.speicher ||
                     step5?.speicher || step5?.storage || step5?.batteryEntries || step5?.batteries;
  const storage = ensureArray(storageRaw).filter((s: any) => s.enabled !== false).map((s: any) => ({
    ...s,
    // WICHTIG: Objekte zu Strings konvertieren
    manufacturer: safeString(s.manufacturer) || safeString(s.hersteller),
    model: safeString(s.model) || safeString(s.modell),
    capacityKwh: safeNumber(s.capacityKwh) || safeNumber(s.capacity) || safeNumber(s.kapazitaet) || safeNumber(s.kapazitaetKwh),
    count: safeNumber(s.count) || safeNumber(s.anzahl) || 1,
  }));
  
  // Wallbox - NORMALIZE WITH SAFE STRING
  const wallboxRaw = tech.wallboxEntries || tech.wallbox || 
                     wizTech.wallboxEntries || wizTech.wallbox ||
                     wizardData?.wallbox || wizardData?.wallboxen ||
                     step5?.wallboxen || step5?.wallbox;
  const wallbox = ensureArray(wallboxRaw).filter((w: any) => w.enabled !== false).map((w: any) => ({
    ...w,
    manufacturer: safeString(w.manufacturer) || safeString(w.hersteller),
    model: safeString(w.model) || safeString(w.modell),
    powerKw: safeNumber(w.powerKw) || safeNumber(w.leistungKw),
  }));
  
  // Heat Pump - NORMALIZE WITH SAFE STRING
  const heatPumpRaw = tech.heatpumpEntries || tech.heatPumpEntries || tech.heatPump || 
                      wizTech.heatpumpEntries || wizTech.heatPumpEntries || wizTech.heatPump ||
                      wizardData?.heatpumpEntries || wizardData?.heatPump || wizardData?.waermepumpe ||
                      step5?.waermepumpe || step5?.waermepumpen || step5?.heatPump;
  const heatPump = ensureArray(heatPumpRaw).filter((h: any) => h.enabled !== false).map((h: any) => ({
    ...h,
    manufacturer: safeString(h.manufacturer) || safeString(h.hersteller),
    model: safeString(h.model) || safeString(h.modell),
    powerKw: safeNumber(h.powerKw) || safeNumber(h.leistungKw),
  }));
  
  // Calculate totals
  let totalKwp = safeNumber(tech.totalPvKwp) || safeNumber(tech.totalPvKwPeak) || 
                 safeNumber(detail.totalKwp) || safeNumber(step5?.gesamtleistungKwp) || 
                 safeNumber(wizTech.totalKwp);
  if (!totalKwp && pv.length > 0) {
    totalKwp = pv.reduce((sum: number, p: any) => {
      return sum + (p.count * p.powerWp / 1000);
    }, 0);
  }
  // Round to 2 decimal places
  totalKwp = Math.round(totalKwp * 100) / 100;
  
  let storageKwh = safeNumber(tech.totalBatteryKwh);
  if (!storageKwh && storage.length > 0) {
    storageKwh = storage.reduce((sum: number, s: any) => {
      return sum + (s.capacityKwh * s.count);
    }, 0);
  }
  storageKwh = Math.round(storageKwh * 10) / 10;
  
  const totalComponents = pv.length + inverters.length + storage.length + wallbox.length + heatPump.length;
  
  return {
    pv,
    inverters,
    storage,
    wallbox,
    heatPump,
    totalKwp,
    storageKwh,
    totalComponents,
  };
}
