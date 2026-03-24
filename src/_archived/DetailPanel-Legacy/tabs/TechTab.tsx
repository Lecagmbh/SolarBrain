/**
 * TECH TAB - Technische Daten
 */

import { useState } from "react";
import {
  Sun, Battery, Zap, Car, Flame, Copy, Check,
  ChevronDown, ChevronRight, Cable,
} from "lucide-react";
import type { InstallationDetail } from "../../../types";
import { parseWizardContext, extractTechDataFromWizard } from "../../../utils";

interface TechTabProps {
  detail: InstallationDetail;
  onUpdate: (data: Partial<InstallationDetail>) => Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
}

export function TechTab({ detail, onUpdate, showToast, isKunde }: TechTabProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["pv", "inverters", "storage", "wallbox", "heatPump"])
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const wizardData = parseWizardContext(detail.wizardContext);
  const tech = extractTechDataFromWizard(detail, wizardData);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyValue = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate totals
  const wallboxKw = tech.wallbox?.reduce((sum: number, w: any) => sum + (w.powerKw || w.leistungKw || 0), 0) || 0;
  const heatPumpKw = tech.heatPump?.reduce((sum: number, h: any) => sum + (h.powerKw || h.leistungKw || 0), 0) || 0;

  return (
    <div className="dp-tech">
      {/* Summary Stats */}
      <div className="dp-tech-summary">
        <div className="dp-tech-summary__item">
          <Sun size={24} />
          <div>
            <span className="dp-tech-summary__value">{Number(tech.totalKwp || 0).toFixed(2)} kWp</span>
            <span className="dp-tech-summary__label">PV-Leistung</span>
          </div>
        </div>
        {tech.storageKwh > 0 && (
          <div className="dp-tech-summary__item">
            <Battery size={24} />
            <div>
              <span className="dp-tech-summary__value">{tech.storageKwh} kWh</span>
              <span className="dp-tech-summary__label">Speicher</span>
            </div>
          </div>
        )}
        {wallboxKw > 0 && (
          <div className="dp-tech-summary__item">
            <Car size={24} />
            <div>
              <span className="dp-tech-summary__value">{wallboxKw} kW</span>
              <span className="dp-tech-summary__label">Wallbox</span>
            </div>
          </div>
        )}
        {heatPumpKw > 0 && (
          <div className="dp-tech-summary__item">
            <Flame size={24} />
            <div>
              <span className="dp-tech-summary__value">{heatPumpKw} kW</span>
              <span className="dp-tech-summary__label">Wärmepumpe</span>
            </div>
          </div>
        )}
      </div>

      {/* PV-Module */}
      <div className="dp-tech-section">
        <button 
          className="dp-tech-section__header"
          onClick={() => toggleSection("pv")}
        >
          {expandedSections.has("pv") ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Sun size={18} />
          <span>PV-Module</span>
          <span className="dp-tech-section__badge">{tech.pv?.length || 0} Einträge</span>
        </button>

        {expandedSections.has("pv") && (
          <div className="dp-tech-section__content">
            {tech.pv && tech.pv.length > 0 ? (
              tech.pv.map((pv: any, index: number) => (
                <div key={index} className="dp-tech-card">
                  <div className="dp-tech-card__header">
                    <span>{pv.manufacturer || pv.hersteller} {pv.model || pv.modell}</span>
                    <span className="dp-tech-card__badge">
                      {pv.count || pv.moduleCount || pv.anzahl || 1}x {pv.powerWp || pv.power || pv.leistungWp}W
                    </span>
                  </div>
                  <div className="dp-tech-card__grid">
                    <TechField label="Hersteller" value={pv.manufacturer || pv.hersteller} />
                    <TechField label="Modell" value={pv.model || pv.modell} />
                    <TechField label="Leistung" value={`${pv.powerWp || pv.power || pv.leistungWp} Wp`} />
                    <TechField label="Anzahl" value={pv.count || pv.moduleCount || pv.anzahl} />
                    <TechField label="Ausrichtung" value={pv.orientation || pv.ausrichtung} />
                    <TechField label="Neigung" value={pv.tilt || pv.neigung ? `${pv.tilt || pv.neigung}°` : ""} />
                  </div>
                </div>
              ))
            ) : (
              <div className="dp-tech-empty">Keine PV-Daten vorhanden</div>
            )}
          </div>
        )}
      </div>

      {/* Wechselrichter */}
      <div className="dp-tech-section">
        <button 
          className="dp-tech-section__header"
          onClick={() => toggleSection("inverters")}
        >
          {expandedSections.has("inverters") ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Zap size={18} />
          <span>Wechselrichter</span>
          <span className="dp-tech-section__badge">{tech.inverters?.length || 0}</span>
        </button>

        {expandedSections.has("inverters") && (
          <div className="dp-tech-section__content">
            {tech.inverters && tech.inverters.length > 0 ? (
              tech.inverters.map((inv: any, index: number) => (
                <div key={index} className="dp-tech-card">
                  <div className="dp-tech-card__header">
                    <span>{inv.manufacturer || inv.hersteller} {inv.model || inv.modell}</span>
                    <span className="dp-tech-card__badge">{inv.count || 1}x</span>
                  </div>
                  <div className="dp-tech-card__grid">
                    <TechField label="Hersteller" value={inv.manufacturer || inv.hersteller} />
                    <TechField label="Modell" value={inv.model || inv.modell} />
                    <TechField label="Leistung" value={inv.powerKva || inv.leistungKva || inv.ratedPowerKva ? `${inv.powerKva || inv.leistungKva || inv.ratedPowerKva} kVA` : ""} />
                    <TechField 
                      label="ZEREZ-ID" 
                      value={inv.zerezId || inv.certificateId} 
                      copyable 
                      onCopy={(v) => copyValue(v, `inv-${index}`)} 
                      copied={copiedField === `inv-${index}`} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="dp-tech-empty">Keine Wechselrichter-Daten</div>
            )}
          </div>
        )}
      </div>

      {/* Speicher */}
      {(tech.storage?.length > 0 || tech.storageKwh > 0) && (
        <div className="dp-tech-section">
          <button 
            className="dp-tech-section__header"
            onClick={() => toggleSection("storage")}
          >
            {expandedSections.has("storage") ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Battery size={18} />
            <span>Speicher</span>
            <span className="dp-tech-section__badge">{tech.storageKwh} kWh</span>
          </button>

          {expandedSections.has("storage") && (
            <div className="dp-tech-section__content">
              {tech.storage && tech.storage.length > 0 ? (
                tech.storage.map((st: any, index: number) => (
                  <div key={index} className="dp-tech-card">
                    <div className="dp-tech-card__header">
                      <span>{st.manufacturer || st.hersteller} {st.model || st.modell}</span>
                      <span className="dp-tech-card__badge">{st.count || 1}x {st.capacityKwh || st.capacity || st.kapazitaet} kWh</span>
                    </div>
                    <div className="dp-tech-card__grid">
                      <TechField label="Hersteller" value={st.manufacturer || st.hersteller} />
                      <TechField label="Modell" value={st.model || st.modell} />
                      <TechField label="Kapazität" value={`${st.capacityKwh || st.capacity || st.kapazitaet} kWh`} />
                      <TechField label="Leistung" value={st.powerKw || st.leistungKw ? `${st.powerKw || st.leistungKw} kW` : ""} />
                      <TechField label="Kopplung" value={st.coupling || st.kopplung} />
                      <TechField 
                        label="ZEREZ-ID" 
                        value={st.zerezId || st.certificateId} 
                        copyable 
                        onCopy={(v) => copyValue(v, `st-${index}`)} 
                        copied={copiedField === `st-${index}`} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="dp-tech-empty">Keine Speicher-Daten</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wallbox */}
      {(tech.wallbox?.length > 0 || wallboxKw > 0) && (
        <div className="dp-tech-section">
          <button 
            className="dp-tech-section__header"
            onClick={() => toggleSection("wallbox")}
          >
            {expandedSections.has("wallbox") ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Car size={18} />
            <span>Wallbox</span>
            <span className="dp-tech-section__badge">{wallboxKw} kW</span>
          </button>

          {expandedSections.has("wallbox") && (
            <div className="dp-tech-section__content">
              {tech.wallbox && tech.wallbox.length > 0 ? (
                tech.wallbox.map((wb: any, index: number) => (
                  <div key={index} className="dp-tech-card">
                    <div className="dp-tech-card__header">
                      <span>{wb.manufacturer || wb.hersteller} {wb.model || wb.modell}</span>
                      <span className="dp-tech-card__badge">{wb.powerKw || wb.leistungKw} kW</span>
                    </div>
                    <div className="dp-tech-card__grid">
                      <TechField label="Hersteller" value={wb.manufacturer || wb.hersteller} />
                      <TechField label="Modell" value={wb.model || wb.modell} />
                      <TechField label="Leistung" value={`${wb.powerKw || wb.leistungKw} kW`} />
                      <TechField label="§14a" value={wb.paragraph14a || wb.controllable ? "Ja" : "Nein"} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="dp-tech-empty">Keine Wallbox-Daten</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wärmepumpe */}
      {(tech.heatPump?.length > 0 || heatPumpKw > 0) && (
        <div className="dp-tech-section">
          <button 
            className="dp-tech-section__header"
            onClick={() => toggleSection("heatPump")}
          >
            {expandedSections.has("heatPump") ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Flame size={18} />
            <span>Wärmepumpe</span>
            <span className="dp-tech-section__badge">{heatPumpKw} kW</span>
          </button>

          {expandedSections.has("heatPump") && (
            <div className="dp-tech-section__content">
              {tech.heatPump && tech.heatPump.length > 0 ? (
                tech.heatPump.map((hp: any, index: number) => (
                  <div key={index} className="dp-tech-card">
                    <div className="dp-tech-card__header">
                      <span>{hp.manufacturer || hp.hersteller} {hp.model || hp.modell}</span>
                      <span className="dp-tech-card__badge">{hp.powerKw || hp.leistungKw} kW</span>
                    </div>
                    <div className="dp-tech-card__grid">
                      <TechField label="Hersteller" value={hp.manufacturer || hp.hersteller} />
                      <TechField label="Modell" value={hp.model || hp.modell} />
                      <TechField label="Leistung" value={`${hp.powerKw || hp.leistungKw} kW`} />
                      <TechField label="Typ" value={hp.type || hp.typ} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="dp-tech-empty">Keine Wärmepumpen-Daten</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Netzanschluss */}
      <div className="dp-tech-section">
        <button 
          className="dp-tech-section__header"
          onClick={() => toggleSection("netz")}
        >
          {expandedSections.has("netz") ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Cable size={18} />
          <span>Netzanschluss</span>
        </button>

        {expandedSections.has("netz") && (
          <div className="dp-tech-section__content">
            <div className="dp-tech-card">
              <div className="dp-tech-card__grid">
                <TechField 
                  label="Zählernummer" 
                  value={detail.zaehlernummer} 
                  copyable 
                  onCopy={(v) => copyValue(v, "zaehler")} 
                  copied={copiedField === "zaehler"} 
                />
                <TechField 
                  label="Messkonzept" 
                  value={wizardData?.step5?.messkonzept || detail.messkonzept} 
                />
                <TechField 
                  label="Einspeiseart" 
                  value={wizardData?.step5?.einspeiseart || detail.technicalData?.gridConnection?.feedInType} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tech Field Component
function TechField({ 
  label, 
  value, 
  copyable,
  onCopy,
  copied,
}: { 
  label: string; 
  value: string | number | undefined | null;
  copyable?: boolean;
  onCopy?: (value: string) => void;
  copied?: boolean;
}) {
  if (!value && value !== 0) return null;
  
  const strValue = String(value);

  return (
    <div className="dp-tech-field">
      <span className="dp-tech-field__label">{label}</span>
      <div className="dp-tech-field__value">
        <span>{strValue}</span>
        {copyable && onCopy && (
          <button 
            className="dp-tech-field__copy"
            onClick={() => onCopy(strValue)}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default TechTab;
