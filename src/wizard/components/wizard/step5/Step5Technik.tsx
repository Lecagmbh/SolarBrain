/**
 * Step5Technik - System Builder Redesign
 *
 * Replaces the old 2-column panel layout with a vertical pipeline-based
 * energy flow: PV → WR → Speicher → Verbraucher.
 * Compact ComponentRows instead of nested cards.
 * Sticky SystemStrip with live totals at the bottom.
 * AnalyseDashboard at the end (not top).
 */

import React, { useMemo, useEffect, useCallback } from 'react';
import { useWizardStore } from '../../../stores/wizardStore';
import { styles, injectStyles, AUSRICHTUNGEN } from '../steps/shared';
import { detectSzenario, getTechnikFelder } from '../../../lib/intelligence/detector';
import { ermittleMesskonzept } from '../../../lib/intelligence/messkonzept';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Input, Select, Checkbox } from '../../ui';
import { KompatibleSpeicherVorschlaege } from '../shared/KompatibleSpeicherVorschlaege';

import { useHybridSystem } from './useHybridSystem';
import { useSystemValidierung } from './useSystemValidierung';
import { useSolarAnalyse } from './useSolarAnalyse';
import { MesskonzeptPanel } from './MesskonzeptPanel';
import { HybridSystemBanner } from './HybridSystemBanner';
import { BetriebsweisePanel } from './BetriebsweisePanel';
import { WirtschaftlichkeitPanel } from './WirtschaftlichkeitPanel';
import { SystemValidierung } from './SystemValidierung';

import { SystemBuilder } from './SystemBuilder';
import { BuilderSection } from './BuilderSection';
import { ComponentRow } from './ComponentRow';
import { VerbraucherRow } from './VerbraucherRow';
import { SystemStrip } from './SystemStrip';
import { AnalyseDashboard } from './AnalyseDashboard';

import type { DachflaecheData, Ausrichtung, SpeicherData, WechselrichterData } from '../../../types/wizard.types';
import type { ProduktDBItem } from '../shared/produktsuche/produktSuche.types';

// Safe string helper for object values
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('name' in (value as object)) return String((value as { name: unknown }).name);
    return '';
  }
  return String(value);
};

export const Step5Technik: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);

  const store = useWizardStore();
  const {
    data,
    addDachflaeche, updateDachflaeche, removeDachflaeche,
    addWechselrichter, updateWechselrichter, removeWechselrichter,
    addSpeicher, updateSpeicher, removeSpeicher,
    addWallbox, updateWallbox, removeWallbox,
    addWaermepumpe, updateWaermepumpe, removeWaermepumpe,
    updateStep5,
  } = store;

  const { step1, step5 } = data;

  const felder = useMemo(() => getTechnikFelder(data), [data]);
  const szenario = useMemo(() => detectSzenario(data), [data]);
  const mk = useMemo(() => ermittleMesskonzept(data), [data]);
  const dcAcRatio = store.getDCACRatio();
  const ertragFallback = store.getErtragPrognose();

  const solarAnalyse = useSolarAnalyse();
  const hybrid = useHybridSystem(step5, addSpeicher, updateSpeicher, updateWechselrichter);
  const { warnings } = useSystemValidierung(step5, dcAcRatio);

  // Auto-add first component when empty
  useEffect(() => {
    if (felder.pvModule && (step5.dachflaechen?.length || 0) === 0) addDachflaeche('Hauptdach');
    if (felder.wechselrichter && (step5.wechselrichter?.length || 0) === 0) addWechselrichter();
  }, [felder]);

  useEffect(() => {
    if (felder.speicher && (step5.speicher?.length || 0) === 0 && step1.komponenten?.includes('speicher')) addSpeicher();
  }, [felder, step1.komponenten]);

  useEffect(() => {
    if (felder.wallbox && (step5.wallboxen?.length || 0) === 0 && step1.komponenten?.includes('wallbox')) addWallbox();
  }, [felder, step1.komponenten]);

  useEffect(() => {
    if (felder.waermepumpe && (step5.waermepumpen?.length || 0) === 0 && step1.komponenten?.includes('waermepumpe')) addWaermepumpe();
  }, [felder, step1.komponenten]);

  // Derive Einspeiseart from Messkonzept
  const aktiveMK = (step5.messkonzept || mk?.typ || 'MK2').toUpperCase();
  useEffect(() => {
    const abgeleitet = aktiveMK === 'MK1' ? 'volleinspeisung' : aktiveMK === 'MK0' ? 'nulleinspeisung' : 'ueberschuss';
    if (step5.einspeiseart !== abgeleitet) {
      updateStep5({ einspeiseart: abgeleitet as any });
    }
  }, [aktiveMK]);

  const hatKomponenten =
    (step5.dachflaechen?.length || 0) > 0 ||
    (step5.wechselrichter?.length || 0) > 0 ||
    (step5.speicher?.length || 0) > 0 ||
    (step5.wallboxen?.length || 0) > 0 ||
    (step5.waermepumpen?.length || 0) > 0;

  const kwp = step5.gesamtleistungKwp || 0;
  const kva = step5.gesamtleistungKva || 0;
  const kwhSpeicher = step5.gesamtSpeicherKwh || 0;
  const jahresertrag = solarAnalyse.daten?.jahresertragKwh || ertragFallback;

  const verbraucherCount = (step5.wallboxen?.length || 0) + (step5.waermepumpen?.length || 0);

  // Speicher select handler for KompatibleSpeicherVorschlaege
  const handleKompatiblenSpeicherSelect = useCallback((selectedSpeicher: any) => {
    let freshSpeicher = useWizardStore.getState().data.step5.speicher;
    if (!freshSpeicher || freshSpeicher.length === 0) {
      addSpeicher();
      freshSpeicher = useWizardStore.getState().data.step5.speicher;
    }
    const speicherId = freshSpeicher?.[0]?.id;
    if (speicherId) {
      const kopplung = selectedSpeicher.kopplung === 'ac' || selectedSpeicher.kopplung === 'dc'
        ? selectedSpeicher.kopplung : 'dc';
      updateSpeicher(speicherId, {
        hersteller: selectedSpeicher.hersteller,
        modell: selectedSpeicher.modell,
        kapazitaetKwh: selectedSpeicher.kapazitaetKwh,
        kopplung: kopplung,
        produktId: selectedSpeicher.id,
      });
    }
  }, [addSpeicher, updateSpeicher]);

  return (
    <div className={styles.stepWide}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>🔧</div>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLabel}>Schritt 5</div>
          <h2 className={styles.sectionTitleLarge}>Technische Daten</h2>
          <p className={styles.sectionSubtitle}>
            {szenario.replace(/_/g, ' ')} — System Builder
          </p>
        </div>
      </div>

      {/* Messkonzept */}
      <MesskonzeptPanel
        messkonzept={step5.messkonzept}
        autoMesskonzept={mk}
        onUpdate={(val) => updateStep5({ messkonzept: val as any })}
      />

      {/* ══════════════════════════════════════════════════════════════
         SYSTEM BUILDER — Pipeline Layout
         ══════════════════════════════════════════════════════════════ */}
      <SystemBuilder>

        {/* ── PV-Module & Strings ──────────────────────────────── */}
        {felder.pvModule && (
          <BuilderSection
            type="pv"
            title="PV-Module & Strings"
            summaryValue={kwp > 0 ? `${kwp.toFixed(2)} kWp` : undefined}
          >
            {(step5.dachflaechen || []).map((dach, idx) => (
              <ComponentRow
                key={dach.id}
                icon="☀️"
                typ="pvModule"
                hersteller={dach.modulHersteller}
                modell={dach.modulModell}
                produktId={undefined}
                zerezId={undefined}
                onHerstellerChange={v => updateDachflaeche(dach.id, { modulHersteller: v })}
                onModellChange={v => updateDachflaeche(dach.id, { modulModell: v })}
                onProduktSelect={(produkt, volleDaten) => {
                  if (volleDaten?.isManual) {
                    // Manuelle Eingabe: Hersteller+Modell+Wp übernehmen
                    updateDachflaeche(dach.id, {
                      modulHersteller: volleDaten.hersteller || volleDaten.modulHersteller || '',
                      modulModell: volleDaten.modell || volleDaten.modulModell || '',
                      ...(volleDaten.modulLeistungWp ? { modulLeistungWp: volleDaten.modulLeistungWp } : {}),
                    });
                  } else if (produkt && volleDaten) {
                    updateDachflaeche(dach.id, {
                      modulHersteller: volleDaten.modulHersteller,
                      modulModell: volleDaten.modulModell,
                      modulLeistungWp: volleDaten.modulLeistungWp,
                    });
                  }
                }}
                canDelete={(step5.dachflaechen || []).length > 1}
                onDelete={() => removeDachflaeche(dach.id)}
                count={dach.modulAnzahl}
                onCountChange={v => updateDachflaeche(dach.id, { modulAnzahl: v })}
                countLabel="×"
                countWarning={dach.modulLeistungWp > 0 && dach.modulAnzahl <= 1}
                specOverrides={dach.modulLeistungWp > 0 ? [
                  { label: 'Wp', value: `${dach.modulLeistungWp}Wp`, highlight: true },
                  { label: 'kWp', value: `${((dach.modulLeistungWp * dach.modulAnzahl) / 1000).toFixed(2)} kWp` },
                ] : undefined}
                detailContent={
                  <>
                    <Input
                      label="Name"
                      value={dach.name}
                      onChange={v => updateDachflaeche(dach.id, { name: v })}
                      placeholder="Hauptdach"
                    />
                    <Select
                      label="Ausrichtung"
                      value={dach.ausrichtung}
                      onChange={v => updateDachflaeche(dach.id, { ausrichtung: v as Ausrichtung })}
                      options={AUSRICHTUNGEN.map(a => ({
                        value: a.value,
                        label: `${a.label} (${Math.round(a.faktor * 100)}%)`,
                      }))}
                    />
                    <Input
                      label="Neigung °"
                      type="number"
                      value={String(dach.neigung)}
                      onChange={v => updateDachflaeche(dach.id, { neigung: Number(v) || 0 })}
                      placeholder="35"
                    />
                    <Select
                      label="Verschattung"
                      value={dach.verschattung || 'keine'}
                      onChange={v => updateDachflaeche(dach.id, { verschattung: v as DachflaecheData['verschattung'] })}
                      options={[
                        { value: 'keine', label: 'Keine (100%)' },
                        { value: 'gering', label: 'Gering (95%)' },
                        { value: 'mittel', label: 'Mittel (85%)' },
                        { value: 'stark', label: 'Stark (70%)' },
                      ]}
                    />
                  </>
                }
              />
            ))}
            <button className={styles.addRow} onClick={() => addDachflaeche()}>
              + Dachfläche
            </button>
          </BuilderSection>
        )}

        {/* ── Wechselrichter ───────────────────────────────────── */}
        {felder.wechselrichter && (
          <BuilderSection
            type="wr"
            title="Wechselrichter"
            summaryValue={kva > 0 ? `${kva.toFixed(1)} kVA` : undefined}
          >
            {(step5.wechselrichter || []).map((wr, idx) => (
              <ComponentRow
                key={wr.id}
                icon="⚡"
                typ="wechselrichter"
                hersteller={wr.hersteller}
                modell={wr.modell}
                produktId={wr.produktId}
                zerezId={wr.zerezId}
                onHerstellerChange={v => updateWechselrichter(wr.id, { hersteller: v })}
                onModellChange={v => updateWechselrichter(wr.id, { modell: v })}
                onProduktSelect={(produkt, volleDaten) => {
                  if (volleDaten?.isManual) {
                    updateWechselrichter(wr.id, {
                      hersteller: volleDaten.hersteller || '',
                      modell: volleDaten.modell || '',
                      leistungKw: volleDaten.leistungKw || 0,
                      leistungKva: volleDaten.leistungKva || 0,
                      hybrid: volleDaten.hybrid || false,
                      produktId: undefined,
                      zerezId: volleDaten.zerezId || undefined,
                    });
                  } else if (produkt && volleDaten) {
                    updateWechselrichter(wr.id, {
                      hersteller: volleDaten.hersteller,
                      modell: volleDaten.modell,
                      leistungKw: volleDaten.leistungKw,
                      leistungKva: volleDaten.leistungKva,
                      hybrid: volleDaten.hybrid,
                      zerezId: volleDaten.zerezId,
                      produktId: volleDaten.produktId,
                    });
                  } else {
                    updateWechselrichter(wr.id, { produktId: undefined, zerezId: undefined });
                    hybrid.clearSpeicherOptions();
                  }
                }}
                onHybridDetected={(hData) => {
                  if (hData.direction === 'wr-is-hybrid') {
                    hybrid.handleWrHybridDetected(hData);
                  }
                }}
                canDelete={(step5.wechselrichter || []).length > 1}
                onDelete={() => removeWechselrichter(wr.id)}
                count={wr.anzahl}
                onCountChange={v => updateWechselrichter(wr.id, { anzahl: v })}
                countLabel="×"
                specOverrides={wr.leistungKva > 0 ? [
                  { label: 'kVA', value: `${wr.leistungKva}kVA`, highlight: true },
                  ...(wr.hybrid ? [{ label: 'Hybrid', value: 'Hybrid', status: 'success' as const }] : []),
                ] : undefined}
                extraBadges={
                  <>
                    {wr.zerezId && (
                      <span className={styles.specBadge} data-status="success">ZEREZ ✓</span>
                    )}
                    {!wr.produktId && !wr.zerezId && wr.hersteller && wr.modell && (
                      <span className={styles.specBadge} style={{ color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.2)' }}>
                        ⚠ Ohne ZEREZ
                      </span>
                    )}
                  </>
                }
              />
            ))}

            {/* Hybrid System Banner inline in WR section */}
            <HybridSystemBanner
              speicherOptions={hybrid.hybridSpeicherOptions}
              hint={hybrid.hybridHint}
              onSelectSpeicher={hybrid.selectHybridSpeicher}
              onDismissOptions={hybrid.dismissSpeicherOptions}
              onDismissHint={hybrid.dismissHint}
            />

            <button className={styles.addRow} onClick={() => addWechselrichter()}>
              + Wechselrichter
            </button>
          </BuilderSection>
        )}

        {/* ── Batteriespeicher ──────────────────────────────────── */}
        {felder.speicher && (
          <BuilderSection
            type="speicher"
            title="Batteriespeicher"
            summaryValue={kwhSpeicher > 0 ? `${kwhSpeicher.toFixed(1)} kWh` : undefined}
          >
            {(step5.speicher || []).map((sp, idx) => (
              <ComponentRow
                key={sp.id}
                icon="🔋"
                typ="speicher"
                hersteller={sp.hersteller}
                modell={sp.modell}
                produktId={sp.produktId}
                onHerstellerChange={v => updateSpeicher(sp.id, { hersteller: v })}
                onModellChange={v => updateSpeicher(sp.id, { modell: v })}
                onProduktSelect={(produkt, volleDaten) => {
                  if (volleDaten?.isManual) {
                    updateSpeicher(sp.id, {
                      hersteller: volleDaten.hersteller || '',
                      modell: volleDaten.modell || '',
                      kapazitaetKwh: volleDaten.kapazitaetKwh || 0,
                      kopplung: volleDaten.kopplung || 'dc',
                      leistungKw: volleDaten.leistungKwSpeicher || undefined,
                      notstrom: volleDaten.notstrom || false,
                      ersatzstrom: volleDaten.ersatzstrom || false,
                      produktId: undefined,
                    });
                  } else if (produkt && volleDaten) {
                    const kopplung = volleDaten.kopplung === 'ac' || volleDaten.kopplung === 'dc'
                      ? volleDaten.kopplung : 'dc';
                    updateSpeicher(sp.id, {
                      hersteller: volleDaten.hersteller,
                      modell: volleDaten.modell,
                      kapazitaetKwh: volleDaten.kapazitaetKwh,
                      kopplung: kopplung,
                      produktId: volleDaten.produktId,
                      leistungKw: volleDaten.leistungKw || undefined,
                      scheinleistungKva: volleDaten.scheinleistungKva || undefined,
                      bemessungsstromA: volleDaten.bemessungsstromA || undefined,
                      notstrom: volleDaten.notstrom,
                      ersatzstrom: volleDaten.ersatzstrom,
                      inselnetzBildend: volleDaten.inselnetzBildend,
                      allpoligeTrennung: volleDaten.allpoligeTrennung,
                      naSchutzVorhanden: volleDaten.naSchutzVorhanden,
                      anschlussPhase: volleDaten.anschlussPhase,
                    });
                  } else {
                    updateSpeicher(sp.id, { produktId: undefined });
                  }
                }}
                onHybridDetected={(hData) => {
                  if (hData.direction === 'speicher-is-hybrid') {
                    hybrid.handleSpeicherHybridDetected(hData);
                  }
                }}
                canDelete={(step5.speicher || []).length > 1}
                onDelete={() => removeSpeicher(sp.id)}
                count={sp.anzahl}
                onCountChange={v => updateSpeicher(sp.id, { anzahl: v })}
                countLabel="×"
                specOverrides={[
                  ...(sp.kopplung ? [{ label: 'Kopplung', value: sp.kopplung.toUpperCase() }] : []),
                  ...(sp.notstrom ? [{ label: 'Notstrom', value: 'Notstrom ✓', status: 'success' as const }] : []),
                ]}
                extraFields={
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingLeft: 44 }}>
                    <div style={{ width: 120 }}>
                      <Input
                        label="kWh"
                        type="number"
                        value={sp.kapazitaetKwh ? String(sp.kapazitaetKwh) : ''}
                        onChange={v => updateSpeicher(sp.id, { kapazitaetKwh: Number(v) || 0 })}
                        placeholder="10.2"
                        suffix="kWh"
                      />
                    </div>
                  </div>
                }
              />
            ))}

            {/* Kompatible Speicher Vorschläge */}
            {(step5.wechselrichter?.length || 0) > 0 && step5.wechselrichter[0]?.produktId && (
              <KompatibleSpeicherVorschlaege
                wechselrichterId={step5.wechselrichter[0].produktId}
                wechselrichterName={`${safeString(step5.wechselrichter[0].hersteller)} ${safeString(step5.wechselrichter[0].modell)}`}
                onSpeicherSelect={handleKompatiblenSpeicherSelect}
                selectedSpeicherId={(step5.speicher || [])[0]?.produktId}
              />
            )}

            <button className={styles.addRow} onClick={() => addSpeicher()}>
              + Speicher
            </button>
          </BuilderSection>
        )}

        {/* ── Weitere Verbraucher (Wallbox + Wärmepumpe) ──────── */}
        {(felder.wallbox || felder.waermepumpe) && (
          <BuilderSection
            type="verbraucher"
            title="Weitere Verbraucher"
            summaryValue={verbraucherCount > 0 ? String(verbraucherCount) : undefined}
          >
            {/* Wallboxen */}
            {felder.wallbox && (step5.wallboxen || []).map((wb) => (
              <div key={wb.id}>
                <VerbraucherRow
                  icon="🚗"
                  hersteller={wb.hersteller || ''}
                  modell={wb.modell || ''}
                  leistungKw={wb.leistungKw}
                  onHerstellerChange={v => updateWallbox(wb.id, { hersteller: v })}
                  onModellChange={v => updateWallbox(wb.id, { modell: v })}
                  onLeistungChange={v => updateWallbox(wb.id, { leistungKw: v })}
                  canDelete={(step5.wallboxen || []).length > 1}
                  onDelete={() => removeWallbox(wb.id)}
                  herstellerPlaceholder="z.B. Fronius"
                  modellPlaceholder="z.B. Wattpilot Go"
                  badges={
                    <>
                      {wb.steuerbar14a && (
                        <span className={styles.specBadge} data-status="success">§14a</span>
                      )}
                    </>
                  }
                  extraFields={
                    <div style={{ padding: '4px 12px 4px 40px' }}>
                      <Checkbox
                        label="§14a steuerbar (bis 190€/J. Netzentgelt-Ersparnis)"
                        checked={wb.steuerbar14a}
                        onChange={v => updateWallbox(wb.id, { steuerbar14a: v })}
                      />
                    </div>
                  }
                />
              </div>
            ))}

            {/* Wärmepumpen */}
            {felder.waermepumpe && (step5.waermepumpen || []).map((wp) => (
              <div key={wp.id}>
                <VerbraucherRow
                  icon="🌡️"
                  hersteller={wp.hersteller || ''}
                  modell={wp.modell || ''}
                  leistungKw={wp.leistungKw}
                  onHerstellerChange={v => updateWaermepumpe(wp.id, { hersteller: v })}
                  onModellChange={v => updateWaermepumpe(wp.id, { modell: v })}
                  onLeistungChange={v => updateWaermepumpe(wp.id, { leistungKw: v })}
                  canDelete={(step5.waermepumpen || []).length > 1}
                  onDelete={() => removeWaermepumpe(wp.id)}
                  herstellerPlaceholder="z.B. Viessmann"
                  modellPlaceholder="z.B. Vitocal 250-A"
                  badges={
                    <>
                      {wp.typ && (
                        <span className={styles.specBadge}>{wp.typ}</span>
                      )}
                      {wp.steuerbar14a && (
                        <span className={styles.specBadge} data-status="success">§14a</span>
                      )}
                    </>
                  }
                  extraFields={
                    <div style={{ padding: '4px 12px 4px 40px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Select
                        label="Wärmequelle"
                        value={wp.typ || 'Luft'}
                        onChange={v => updateWaermepumpe(wp.id, { typ: v as 'Luft' | 'Sole' | 'Wasser' })}
                        options={[
                          { value: 'Luft', label: 'Luft-Wasser' },
                          { value: 'Sole', label: 'Sole-Wasser' },
                          { value: 'Wasser', label: 'Wasser-Wasser' },
                        ]}
                      />
                      <Checkbox
                        label="§14a steuerbar (Pflicht ab 4,2 kW)"
                        checked={wp.steuerbar14a}
                        onChange={v => updateWaermepumpe(wp.id, { steuerbar14a: v })}
                      />
                    </div>
                  }
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8 }}>
              {felder.wallbox && (
                <button className={styles.addRow} onClick={() => addWallbox()}>
                  + Wallbox
                </button>
              )}
              {felder.waermepumpe && (
                <button className={styles.addRow} onClick={() => addWaermepumpe()}>
                  + Wärmepumpe
                </button>
              )}
            </div>
          </BuilderSection>
        )}

        {/* ── Netz & Betriebsweise ─────────────────────────────── */}
        {hatKomponenten && (
          <BuilderSection
            type="netz"
            title="Netz & Betriebsweise"
            collapsible
            defaultOpen={false}
          >
            <BetriebsweisePanel step5={step5} onUpdate={updateStep5} />
          </BuilderSection>
        )}

      </SystemBuilder>

      {/* ── Sticky System Strip ──────────────────────────────────── */}
      <SystemStrip
        kwp={kwp}
        kva={kva}
        kwhSpeicher={kwhSpeicher}
        ertrag={jahresertrag}
        dcAcRatio={dcAcRatio}
      />

      {/* ── System Validation Warnings ───────────────────────────── */}
      <SystemValidierung warnings={warnings} />

      {/* ── Analyse Dashboard (bottom) ───────────────────────────── */}
      {hatKomponenten && (
        <AnalyseDashboard
          solarDaten={solarAnalyse.daten}
          loading={solarAnalyse.loading}
          hatKoordinaten={solarAnalyse.hatKoordinaten}
          kwp={kwp}
          ertragFallback={ertragFallback}
          dcAcRatio={dcAcRatio}
        />
      )}

      {/* ── Investition & Wirtschaftlichkeit ──────────────────────── */}
      {hatKomponenten && solarAnalyse.daten && (
        <CollapsibleSection
          title="Investition & Wirtschaftlichkeit"
          icon="💰"
          badge="Solar-Rechner"
          defaultOpen={false}
        >
          <WirtschaftlichkeitPanel daten={solarAnalyse.daten} />
        </CollapsibleSection>
      )}
    </div>
  );
};
