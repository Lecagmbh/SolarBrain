/**
 * useHybridSystem - Custom Hook for hybrid WR/Speicher auto-linking
 * Detects hybrid inverters and automatically suggests compatible battery storage,
 * or auto-fills inverter data when a hybrid-capable battery is selected.
 */

import { useState } from 'react';
import { api } from '../../../lib/api/client';
import { useWizardStore } from '../../../stores/wizardStore';
import type { ProduktDBItem } from '../shared/ProduktAutocomplete';
import type { WizardStep5Data, SpeicherData, WechselrichterData } from '../../../types/wizard.types';

interface HybridSpeicherOption {
  id: number;
  hersteller: string;
  modell: string;
  kapazitaetBruttoKwh: number;
  ladeleistungMaxKw?: number;
  kopplung?: string;
  notstromfaehig?: boolean;
  ersatzstromfaehig?: boolean;
}

interface HybridAutoWr {
  zerezId: string;
  model: string;
  manufacturer: string;
  powerKw: number;
}

export function useHybridSystem(
  step5: WizardStep5Data,
  addSpeicher: () => void,
  updateSpeicher: (id: string, data: Partial<SpeicherData>) => void,
  updateWechselrichter: (id: string, data: Partial<WechselrichterData>) => void,
) {
  const [hybridSpeicherOptions, setHybridSpeicherOptions] = useState<HybridSpeicherOption[]>([]);
  const [hybridAutoWr, setHybridAutoWr] = useState<HybridAutoWr | null>(null);
  const [hybridHint, setHybridHint] = useState<string | null>(null);

  // WR -> Speicher: When STORAGE_INVERTER selected, load compatible batteries
  const handleWrHybridDetected = async (wrData: { produkt: ProduktDBItem; wizardData: any }) => {
    const brand = wrData.produkt.hersteller?.name || '';
    const kw = (wrData.produkt.acLeistungW || 0) / 1000;
    const model = wrData.produkt.modell || '';
    if (!brand && !model) return;

    try {
      const res = await api.get<{ found: boolean; speicher: HybridSpeicherOption[] }>(
        `/produkte/hybrid-link?direction=wr-to-speicher&zerezModel=${encodeURIComponent(model)}&hersteller=${encodeURIComponent(brand)}&leistungKw=${kw}`
      );
      if (res.data?.found && res.data.speicher?.length > 0) {
        setHybridSpeicherOptions(res.data.speicher);
      } else {
        setHybridSpeicherOptions([]);
      }
    } catch {
      setHybridSpeicherOptions([]);
    }
  };

  // Speicher -> WR: When battery with power is selected, auto-assign ZEREZ inverter
  const handleSpeicherHybridDetected = async (spData: { produkt: ProduktDBItem; wizardData: any }) => {
    const brand = spData.produkt.hersteller?.name || '';
    const kw = spData.wizardData?.leistungKw || spData.produkt.ladeleistungMaxKw || 0;
    if (!brand || kw <= 0) return;

    // Only auto-fill if first WR is empty
    const firstWr = step5.wechselrichter?.[0];
    if (firstWr?.hersteller && firstWr?.modell) return;

    try {
      const res = await api.get<{ found: boolean; wechselrichter: any }>(
        `/produkte/hybrid-link?direction=speicher-to-wr&hersteller=${encodeURIComponent(brand)}&leistungKw=${kw}`
      );
      if (res.data?.found && res.data.wechselrichter) {
        const wr = res.data.wechselrichter;
        const wrKw = wr.maxActivePowerKw || kw;
        const wrKva = Math.round(wrKw / 0.9 * 10) / 10;

        if (firstWr) {
          updateWechselrichter(firstWr.id, {
            hersteller: wr.manufacturerName || brand,
            modell: wr.modelName,
            leistungKw: wrKw,
            leistungKva: wrKva,
            hybrid: true,
            zerezId: wr.zerezId,
          });
        }
        setHybridHint(`Hybrid erkannt — WR automatisch zugeordnet: ${wr.modelName} (ZEREZ: ${wr.zerezId})`);
      }
    } catch { /* silent */ }
  };

  // Select a hybrid battery from WR->Speicher suggestions
  const selectHybridSpeicher = (sp: HybridSpeicherOption) => {
    if ((step5.speicher?.length || 0) === 0) {
      addSpeicher();
    }
    // Short delay so addSpeicher updates the array
    setTimeout(() => {
      const speicherList = useWizardStore.getState().data.step5.speicher;
      const speicherId = speicherList?.[0]?.id;
      if (speicherId) {
        const kopp = sp.kopplung === 'ac' || sp.kopplung === 'dc' ? sp.kopplung : 'dc';
        updateSpeicher(speicherId, {
          hersteller: sp.hersteller,
          modell: sp.modell,
          kapazitaetKwh: sp.kapazitaetBruttoKwh,
          kopplung: kopp as 'ac' | 'dc',
          produktId: sp.id,
          leistungKw: sp.ladeleistungMaxKw || undefined,
          notstrom: sp.notstromfaehig || false,
          ersatzstrom: sp.ersatzstromfaehig || false,
        });
      }
      setHybridSpeicherOptions([]);
      setHybridHint(`Hybrid-Speicher zugeordnet: ${sp.hersteller} ${sp.modell} — ${sp.kapazitaetBruttoKwh} kWh`);
    }, 50);
  };

  const dismissHint = () => setHybridHint(null);
  const dismissSpeicherOptions = () => setHybridSpeicherOptions([]);
  const clearSpeicherOptions = () => setHybridSpeicherOptions([]);

  return {
    hybridSpeicherOptions,
    hybridAutoWr,
    hybridHint,
    handleWrHybridDetected,
    handleSpeicherHybridDetected,
    selectHybridSpeicher,
    dismissHint,
    dismissSpeicherOptions,
    clearSpeicherOptions,
  };
}
