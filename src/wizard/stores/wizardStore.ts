/**
 * Baunity Wizard Store V1
 * ========================
 * Zustand-basierter Store mit:
 * - Multi-Komponenten Support
 * - localStorage Persistenz
 * - Automatische Berechnungen
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AUTH_TOKEN_KEY,
  LEGACY_TOKEN_KEYS,
  LEARNING_SESSION_KEY as WIZARD_LEARNING_SESSION_KEY,
} from '../lib/stubs/storage';

const WIZARD_STORE_PREFIX = 'wizard-store';
import type {
  WizardData,
  WizardStep1Data,
  WizardStep2Data,
  WizardStep3Data,
  WizardStep4Data,
  WizardStep5Data,
  WizardStep6Data,
  WizardStep7Data,
  WizardStep8Data,
  DachflaecheData,
  WechselrichterData,
  SpeicherData,
  WallboxData,
  WaermepumpeData,
  ValidationError,
  DokumentUpload,
  // Multi-Zähler Types
  ZaehlerBestandItem,
  ZaehlerNeuData,
} from '../types/wizard.types';

import {
  createDefaultDachflaeche,
  createDefaultWechselrichter,
  createDefaultSpeicher,
  createDefaultWallbox,
  createDefaultWaermepumpe,
  // NEU: Phase 1 Factory Functions
  createDefaultZaehler,
  createDefaultNetzanschluss,
  createDefaultInbetriebnahme,
  // NEU: Multi-Zähler Factory Functions
  createDefaultZaehlerBestandItem,
  createDefaultZaehlerNeu,
  GRENZWERTE,
  AUSRICHTUNG_FAKTOREN,
} from '../types/wizard.types';

import { learningSession as learningSessionManager } from '../lib/intelligence/learningEngine';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialStep5: WizardStep5Data = {
  dachflaechen: [],
  wechselrichter: [],
  speicher: [],
  wallboxen: [],
  waermepumpen: [],
  bhkw: [],
  windkraft: [],
  einspeiseart: null,
  messkonzept: null,
  paragraph14a: { relevant: false },
  
  // E.2 Betriebsweise Defaults
  betriebsweise: {
    inselbetrieb: false,
    motorischerAblauf: false,
    ueberschusseinspeisung: true,  // Standard bei PV
    volleinspeisung: false,
  },
  netzeinspeisungPhasen: '3-phasig',  // Standard
  
  // Blindleistungskompensation
  blindleistungskompensation: {
    vorhanden: false,
  },
  
  // Einspeisemanagement
  einspeisemanagement: {
    ferngesteuert: false,
    dauerhaftBegrenzt: false,
  },
};

const initialData: WizardData = {
  status: 'draft',
  step1: { kategorie: null, vorgangsart: null, komponenten: [], groessenklasse: null },
  step2: { strasse: '', hausnummer: '', plz: '', ort: '', bundesland: '', land: 'Deutschland' },
  step3: { istEigentuemer: null, zustimmungVorhanden: false },
  // NEU: Zähler & Netzanschluss (Phase 1.1)
  step4: {
    zaehler: createDefaultZaehler(),
    netzanschluss: createDefaultNetzanschluss(),
  },
  step5: initialStep5,
  step6: { kundentyp: null, vorname: '', nachname: '', email: '', telefon: '', rechnungGleichStandort: true },
  // NEU: Fotos-Array (Phase 1.4)
  step7: { dokumente: [], fotos: [] },
  // NEU: Inbetriebnahme-Daten (Phase 1.2)
  step8: {
    vollmachtErteilt: false,
    agbAkzeptiert: false,
    datenschutzAkzeptiert: false,
    mastrVoranmeldung: false,
    inbetriebnahme: createDefaultInbetriebnahme(),
  },
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface WizardStore {
  data: WizardData;
  currentStep: number;
  maxReachedStep: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  
  setCurrentStep: (step: number) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  updateStep1: (data: Partial<WizardStep1Data>) => void;
  updateStep2: (data: Partial<WizardStep2Data>) => void;
  updateStep3: (data: Partial<WizardStep3Data>) => void;
  updateStep4: (data: Partial<WizardStep4Data>) => void;
  updateStep5: (data: Partial<WizardStep5Data>) => void;
  updateStep6: (data: Partial<WizardStep6Data>) => void;
  updateStep7: (data: Partial<WizardStep7Data>) => void;
  updateStep8: (data: Partial<WizardStep8Data>) => void;
  
  // Dokumente Management
  addDokument: (dokument: DokumentUpload) => void;
  removeDokument: (id: string) => void;
  updateDokument: (id: string, data: Partial<DokumentUpload>) => void;
  
  addDachflaeche: (name?: string) => void;
  updateDachflaeche: (id: string, data: Partial<DachflaecheData>) => void;
  removeDachflaeche: (id: string) => void;
  
  addWechselrichter: () => void;
  updateWechselrichter: (id: string, data: Partial<WechselrichterData>) => void;
  removeWechselrichter: (id: string) => void;
  
  addSpeicher: () => void;
  updateSpeicher: (id: string, data: Partial<SpeicherData>) => void;
  removeSpeicher: (id: string) => void;
  
  addWallbox: () => void;
  updateWallbox: (id: string, data: Partial<WallboxData>) => void;
  removeWallbox: (id: string) => void;
  
  addWaermepumpe: () => void;
  updateWaermepumpe: (id: string, data: Partial<WaermepumpeData>) => void;
  removeWaermepumpe: (id: string) => void;

  // Multi-Zähler Management (Step 4)
  addZaehlerBestand: (nummer?: string, verwendung?: string) => void;
  updateZaehlerBestand: (id: string, data: Partial<ZaehlerBestandItem>) => void;
  removeZaehlerBestand: (id: string) => void;
  updateZaehlerNeu: (data: Partial<ZaehlerNeuData>) => void;
  setZaehlerZusammenlegung: (zaehlerIds: string[]) => void;

  recalculateTotals: () => void;
  getDCACRatio: () => { ratio: number; status: string; message: string } | null;
  getErtragPrognose: () => number;
  
  validateCurrentStep: () => boolean;
  setErrors: (errors: ValidationError[]) => void;
  setWarnings: (warnings: ValidationError[]) => void;
  
  resetWizard: () => void;
  checkUserMatch: () => void;
  
  // Learning System
  learningSessionId: string | null;
  startLearningSession: () => void;
  endLearningSession: (success: boolean) => Promise<void>;
}

// ============================================================================
// STORE
// ============================================================================

// Helper: User-ID aus localStorage holen
const getUserId = (): string => {
  try {
    // 1. Prüfe baunity_user (primärer User-Speicher)
    const baunityUser = localStorage.getItem('baunity_user');
    if (baunityUser) {
      try {
        const parsed = JSON.parse(baunityUser);
        const userId = parsed.id || parsed.userId || parsed.user_id;
        if (userId) return String(userId);
      } catch {}
    }

    // 2. Verschiedene mögliche Auth-Speicherorte prüfen
    const possibleKeys = ['auth', 'user', 'auth_user', 'currentUser', 'authState'];
    for (const key of possibleKeys) {
      const authData = localStorage.getItem(key);
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const userId = parsed.userId || parsed.id || parsed.user?.id || parsed.user?.userId || parsed.user_id;
          if (userId) return String(userId);
        } catch {}
      }
    }

    // 3. Token-basierte ID extrahieren (JWT) - alle bekannten Token-Keys
    const tokenKeys = ['baunity_token', 'access_token', 'accessToken', 'token', 'auth_token'];
    for (const tokenKey of tokenKeys) {
      const token = localStorage.getItem(tokenKey);
      if (token && token.includes('.')) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = payload.sub || payload.userId || payload.id || payload.user_id;
          if (userId) return String(userId);
        } catch {}
      }
    }
  } catch (e) {
    console.warn('Error getting user ID:', e);
  }
  return 'anonymous';
};

// Letzten bekannten User speichern um Wechsel zu erkennen
const LAST_USER_KEY = 'wizard_last_user_id';

// Storage Key mit User-ID für Isolation
const getStorageKey = (): string => {
  const userId = getUserId();
  return `${WIZARD_STORE_PREFIX}_${userId}`;
};

// Prüft ob Benutzer gewechselt wurde und gibt ggf. zurück ob Reset nötig
const checkAndHandleUserChange = (): boolean => {
  const currentUserId = getUserId();
  const lastUserId = localStorage.getItem(LAST_USER_KEY);

  // Benutzer speichern
  localStorage.setItem(LAST_USER_KEY, currentUserId);

  // Bei Benutzerwechsel (und nicht anonymous) -> alten generischen Store löschen
  if (lastUserId && lastUserId !== currentUserId && currentUserId !== 'anonymous') {
    console.log(`User changed from ${lastUserId} to ${currentUserId} - user-specific storage active`);

    // Generischen Key löschen falls vorhanden (Legacy-Migration)
    localStorage.removeItem(WIZARD_STORE_PREFIX);

    return true; // Wechsel erkannt
  }

  return false;
};

// Benutzerspezifischer Storage Adapter für Zustand persist
// Jeder Benutzer hat seinen eigenen Storage-Schlüssel
const createUserStorage = () => {
  return {
    getItem: (name: string): string | null => {
      // Ignoriere den übergebenen Namen, verwende benutzerspezifischen Schlüssel
      const userKey = getStorageKey();
      const value = localStorage.getItem(userKey);

      // Prüfe ob die Daten zum aktuellen Benutzer gehören
      if (value) {
        try {
          const parsed = JSON.parse(value);
          const storedUserId = parsed.state?.userId;
          const currentUserId = getUserId();

          // Bei User-Mismatch: Daten nicht laden
          if (storedUserId && storedUserId !== currentUserId && currentUserId !== 'anonymous') {
            console.log(`Storage mismatch: stored=${storedUserId}, current=${currentUserId}`);
            localStorage.removeItem(userKey);
            return null;
          }
        } catch (e) {
          console.warn('Error parsing stored wizard data:', e);
        }
      }

      return value;
    },
    setItem: (name: string, value: string): void => {
      // Speichere unter benutzerspezifischem Schlüssel
      const userKey = getStorageKey();
      localStorage.setItem(userKey, value);
    },
    removeItem: (name: string): void => {
      const userKey = getStorageKey();
      localStorage.removeItem(userKey);
    },
  };
};

// Beim Laden prüfen ob Benutzerwechsel
checkAndHandleUserChange();

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      data: initialData,
      currentStep: 1,
      maxReachedStep: 1,
      errors: [],
      warnings: [],
      learningSessionId: null,
      
      setCurrentStep: (step) => set((s) => ({ 
        currentStep: step,
        maxReachedStep: Math.max(s.maxReachedStep, step)
      })),
      goToStep: (step) => {
        // Erlaubt Navigation zu jedem Step (Validierung erfolgt in WizardMain)
        set((s) => ({ 
          currentStep: step,
          maxReachedStep: Math.max(s.maxReachedStep, step)
        }));
      },
      nextStep: () => set((s) => ({ 
        currentStep: Math.min(s.currentStep + 1, 8),
        maxReachedStep: Math.max(s.maxReachedStep, s.currentStep + 1)
      })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
      
      updateStep1: (u) => set((s) => ({ data: { ...s.data, step1: { ...s.data.step1, ...u } } })),
      updateStep2: (u) => set((s) => ({ data: { ...s.data, step2: { ...s.data.step2, ...u } } })),
      updateStep3: (u) => set((s) => ({ data: { ...s.data, step3: { ...s.data.step3, ...u } } })),
      updateStep4: (u) => set((s) => ({ data: { ...s.data, step4: { ...s.data.step4, ...u } } })),
      updateStep5: (u) => { set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, ...u } } })); get().recalculateTotals(); },
      updateStep6: (u) => set((s) => ({ data: { ...s.data, step6: { ...s.data.step6, ...u } } })),
      updateStep7: (u) => set((s) => ({ data: { ...s.data, step7: { ...s.data.step7, ...u } } })),
      updateStep8: (u) => set((s) => ({ data: { ...s.data, step8: { ...s.data.step8, ...u } } })),
      
      // Dokumente Management
      addDokument: (dokument) => {
        set((s) => {
          // Prüfe ob Dokument mit gleichem Namen bereits existiert - dann ersetzen
          const existingIndex = s.data.step7.dokumente.findIndex(d => d.name === dokument.name);
          let newDokumente: DokumentUpload[];
          
          if (existingIndex >= 0) {
            // Ersetze existierendes Dokument
            newDokumente = [...s.data.step7.dokumente];
            newDokumente[existingIndex] = dokument;
          } else {
            // Füge neues Dokument hinzu
            newDokumente = [...s.data.step7.dokumente, dokument];
          }
          
          return { 
            data: { 
              ...s.data, 
              step7: { 
                ...s.data.step7, 
                dokumente: newDokumente 
              } 
            } 
          };
        });
      },
      removeDokument: (id) => {
        set((s) => ({
          data: {
            ...s.data,
            step7: {
              ...s.data.step7,
              dokumente: s.data.step7.dokumente.filter(d => d.id !== id)
            }
          }
        }));
      },
      updateDokument: (id, u) => {
        set((s) => ({
          data: {
            ...s.data,
            step7: {
              ...s.data.step7,
              dokumente: s.data.step7.dokumente.map(d => d.id === id ? { ...d, ...u } : d)
            }
          }
        }));
      },
      
      // Dachflächen
      addDachflaeche: (name) => {
        const count = (get().data.step5.dachflaechen?.length || 0) + 1;
        const newD = createDefaultDachflaeche(name || `Dachfläche ${count}`);
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, dachflaechen: [...(s.data.step5.dachflaechen || []), newD] } } }));
      },
      updateDachflaeche: (id, u) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, dachflaechen: (s.data.step5.dachflaechen || []).map(d => d.id === id ? { ...d, ...u } : d) } } }));
        get().recalculateTotals();
      },
      removeDachflaeche: (id) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, dachflaechen: (s.data.step5.dachflaechen || []).filter(d => d.id !== id) } } }));
        get().recalculateTotals();
      },

      // Wechselrichter
      addWechselrichter: () => {
        const newW = createDefaultWechselrichter();
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, wechselrichter: [...(s.data.step5.wechselrichter || []), newW] } } }));
      },
      updateWechselrichter: (id, u) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, wechselrichter: (s.data.step5.wechselrichter || []).map(w => w.id === id ? { ...w, ...u } : w) } } }));
        get().recalculateTotals();
      },
      removeWechselrichter: (id) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, wechselrichter: (s.data.step5.wechselrichter || []).filter(w => w.id !== id) } } }));
        get().recalculateTotals();
      },

      // Speicher
      addSpeicher: () => {
        const newS = createDefaultSpeicher();
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, speicher: [...(s.data.step5.speicher || []), newS] } } }));
      },
      updateSpeicher: (id, u) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, speicher: (s.data.step5.speicher || []).map(sp => sp.id === id ? { ...sp, ...u } : sp) } } }));
        get().recalculateTotals();
      },
      removeSpeicher: (id) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, speicher: (s.data.step5.speicher || []).filter(sp => sp.id !== id) } } }));
        get().recalculateTotals();
      },

      // Wallboxen
      addWallbox: () => {
        const newW = createDefaultWallbox();
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, wallboxen: [...(s.data.step5.wallboxen || []), newW] } } }));
      },
      updateWallbox: (id, u) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, wallboxen: (s.data.step5.wallboxen || []).map(w => w.id === id ? { ...w, ...u } : w) } } }));
      },
      removeWallbox: (id) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, wallboxen: (s.data.step5.wallboxen || []).filter(w => w.id !== id) } } }));
      },

      // Wärmepumpen
      addWaermepumpe: () => {
        const newW = createDefaultWaermepumpe();
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, waermepumpen: [...(s.data.step5.waermepumpen || []), newW] } } }));
      },
      updateWaermepumpe: (id, u) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, waermepumpen: (s.data.step5.waermepumpen || []).map(w => w.id === id ? { ...w, ...u } : w) } } }));
      },
      removeWaermepumpe: (id) => {
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, waermepumpen: (s.data.step5.waermepumpen || []).filter(w => w.id !== id) } } }));
      },

      // Multi-Zähler Bestand (Step 4)
      addZaehlerBestand: (nummer, verwendung) => {
        const newZ = createDefaultZaehlerBestandItem(nummer, verwendung);
        set((s) => ({
          data: {
            ...s.data,
            step4: {
              ...s.data.step4,
              zaehlerBestand: [...(s.data.step4.zaehlerBestand || []), newZ],
            },
          },
        }));
      },
      updateZaehlerBestand: (id, u) => {
        set((s) => ({
          data: {
            ...s.data,
            step4: {
              ...s.data.step4,
              zaehlerBestand: (s.data.step4.zaehlerBestand || []).map((z) =>
                z.id === id ? { ...z, ...u } : z
              ),
            },
          },
        }));
      },
      removeZaehlerBestand: (id) => {
        set((s) => {
          const newBestand = (s.data.step4.zaehlerBestand || []).filter((z) => z.id !== id);
          // Auch aus zusammenlegungVon entfernen falls vorhanden
          const zaehlerNeu = s.data.step4.zaehlerNeu;
          const updatedZaehlerNeu = zaehlerNeu
            ? { ...zaehlerNeu, zusammenlegungVon: zaehlerNeu.zusammenlegungVon.filter((zId) => zId !== id) }
            : zaehlerNeu;
          return {
            data: {
              ...s.data,
              step4: {
                ...s.data.step4,
                zaehlerBestand: newBestand,
                zaehlerNeu: updatedZaehlerNeu,
              },
            },
          };
        });
      },
      updateZaehlerNeu: (u) => {
        set((s) => ({
          data: {
            ...s.data,
            step4: {
              ...s.data.step4,
              zaehlerNeu: s.data.step4.zaehlerNeu
                ? { ...s.data.step4.zaehlerNeu, ...u }
                : { ...createDefaultZaehlerNeu(), ...u },
            },
          },
        }));
      },
      setZaehlerZusammenlegung: (zaehlerIds) => {
        set((s) => {
          // Markiere ausgewählte Zähler als "zusammenlegen"
          const updatedBestand = (s.data.step4.zaehlerBestand || []).map((z) => ({
            ...z,
            aktion: zaehlerIds.includes(z.id) ? 'zusammenlegen' as const : z.aktion,
          }));
          // Update zaehlerNeu.zusammenlegungVon
          const zaehlerNeu = s.data.step4.zaehlerNeu || createDefaultZaehlerNeu();
          return {
            data: {
              ...s.data,
              step4: {
                ...s.data.step4,
                zaehlerBestand: updatedBestand,
                zaehlerNeu: { ...zaehlerNeu, zusammenlegungVon: zaehlerIds },
              },
            },
          };
        });
      },

      // Berechnungen
      recalculateTotals: () => {
        const { dachflaechen, wechselrichter, speicher } = get().data.step5;
        const gesamtleistungKwp = dachflaechen.reduce((sum, d) => sum + (d.modulLeistungWp * d.modulAnzahl) / 1000, 0);
        const gesamtleistungKva = wechselrichter.reduce((sum, w) => sum + (w.leistungKva * w.anzahl), 0);
        const gesamtSpeicherKwh = speicher.reduce((sum, s) => sum + (s.kapazitaetKwh * s.anzahl), 0);
        const dcAcRatio = gesamtleistungKva > 0 ? gesamtleistungKwp / gesamtleistungKva : 0;
        const naSchutzErforderlich = gesamtleistungKva > GRENZWERTE.NA_SCHUTZ_AB_KVA;
        const netzebene = gesamtleistungKva > GRENZWERTE.MITTELSPANNUNG_AB_KVA ? 'mittelspannung' : 'niederspannung';
        
        set((s) => ({ data: { ...s.data, step5: { ...s.data.step5, gesamtleistungKwp, gesamtleistungKva, gesamtSpeicherKwh, dcAcRatio, naSchutzErforderlich, netzebene } } }));
      },
      
      getDCACRatio: () => {
        const { gesamtleistungKwp, gesamtleistungKva } = get().data.step5;
        if (!gesamtleistungKva || !gesamtleistungKwp) return null;
        const ratio = gesamtleistungKwp / gesamtleistungKva;
        let status: string, message: string;
        if (ratio >= 1.0 && ratio <= 1.3) { status = 'optimal'; message = `DC/AC Ratio ${ratio.toFixed(2)} ist optimal`; }
        else if (ratio >= 0.8 && ratio <= 1.5) { status = 'akzeptabel'; message = `DC/AC Ratio ${ratio.toFixed(2)} ist akzeptabel`; }
        else if (ratio < 0.8) { status = 'warnung'; message = `DC/AC Ratio ${ratio.toFixed(2)} - WR überdimensioniert`; }
        else { status = 'kritisch'; message = `DC/AC Ratio ${ratio.toFixed(2)} zu hoch - Abregelung möglich`; }
        return { ratio, status, message };
      },
      
      getErtragPrognose: () => {
        const { dachflaechen } = get().data.step5;
        const plz = get().data.step2.plz;
        const basisErtrag = plz?.startsWith('7') || plz?.startsWith('8') ? 1050 : 980;
        let gesamt = 0;
        for (const d of dachflaechen) {
          const kwp = (d.modulLeistungWp * d.modulAnzahl) / 1000;
          const af = AUSRICHTUNG_FAKTOREN[d.ausrichtung] || 1;
          const nf = 1 - (Math.abs(d.neigung - 35) * 0.005);
          const vf = d.verschattung === 'keine' ? 1 : d.verschattung === 'gering' ? 0.95 : d.verschattung === 'mittel' ? 0.85 : 0.7;
          gesamt += kwp * basisErtrag * af * nf * vf;
        }
        return Math.round(gesamt);
      },
      
      validateCurrentStep: () => {
        const s = get();
        const errors: ValidationError[] = [];
        switch (s.currentStep) {
          case 1: if (!s.data.step1.kategorie) errors.push({ field: 'kategorie', message: 'Kategorie wählen', severity: 'error' }); break;
          case 2: 
            if (!s.data.step2.strasse) errors.push({ field: 'strasse', message: 'Straße erforderlich', severity: 'error' });
            if (!s.data.step2.plz || s.data.step2.plz.length !== 5) errors.push({ field: 'plz', message: 'PLZ erforderlich', severity: 'error' });
            break;
          case 6:
            if (!s.data.step6.vorname) errors.push({ field: 'vorname', message: 'Vorname erforderlich', severity: 'error' });
            if (!s.data.step6.nachname) errors.push({ field: 'nachname', message: 'Nachname erforderlich', severity: 'error' });
            break;
        }
        set({ errors });
        return errors.length === 0;
      },
      
      setErrors: (errors) => set({ errors }),
      setWarnings: (warnings) => set({ warnings }),
      
      // Learning System Methods
      startLearningSession: () => {
        const sessionId = learningSessionManager.startSession();
        set({ learningSessionId: sessionId });
        // Session ID auch im localStorage speichern für Recovery
        try {
          localStorage.setItem(WIZARD_LEARNING_SESSION_KEY, sessionId);
        } catch {}
      },
      
      endLearningSession: async (success: boolean) => {
        const { data, currentStep, learningSessionId } = get();
        if (learningSessionId) {
          await learningSessionManager.endSession(data, success, success ? undefined : currentStep);
          set({ learningSessionId: null });
          try {
            localStorage.removeItem(WIZARD_LEARNING_SESSION_KEY);
          } catch {}
        }
      },
      
      resetWizard: () => {
        // Learning Session beenden wenn aktiv
        const { learningSessionId } = get();
        if (learningSessionId) {
          learningSessionManager.endSession(get().data, false, get().currentStep);
        }
        set({ data: initialData, currentStep: 1, maxReachedStep: 1, errors: [], warnings: [], learningSessionId: null });
      },
      
      // Prüft ob gespeicherte Daten zum aktuellen User gehören
      checkUserMatch: () => {
        const userKey = getStorageKey();
        const stored = localStorage.getItem(userKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const storedUserId = parsed.state?.userId;
            const currentUserId = getUserId();
            if (storedUserId && storedUserId !== currentUserId && currentUserId !== 'anonymous') {
              console.log(`checkUserMatch: mismatch detected, resetting. stored=${storedUserId}, current=${currentUserId}`);
              localStorage.removeItem(userKey);
              get().resetWizard();
            }
          } catch {}
        }
        // Speichere aktuelle User-ID
        const currentState = get();
        set({ ...currentState, userId: getUserId() } as any);
      },
    }),
    {
      name: 'wizard-store-user', // Name wird vom benutzerdefinierten Storage ignoriert
      storage: createJSONStorage(() => createUserStorage()),
      partialize: (s) => ({
        data: {
          ...s.data,
          // Dokumente NICHT persistieren - Blob URLs funktionieren nicht nach Page Reload
          step7: {
            ...s.data.step7,
            dokumente: [] // Dokumente werden bei Reload gelöscht (Blob URLs sind session-only)
          }
        },
        currentStep: s.currentStep,
        maxReachedStep: s.maxReachedStep,
        userId: getUserId(), // User-ID mitspeichern für Validierung
      }) as any
    }
  )
);
