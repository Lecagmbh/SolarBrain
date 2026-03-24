/**
 * TechComponentCards – PV, Inverter, Storage, Wallbox, Heatpump cards
 */

import { Sun, Zap, Battery, Car, Flame } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';

// Normalized tech data types
interface PvModule {
  manufacturer: string; model: string; count: number; powerWp: number;
  orientation?: string; tilt?: number; roofName?: string; shading?: string;
  stringCount?: number; modulesPerString?: number;
}

interface Inverter {
  manufacturer: string; model: string; powerKw?: number; powerKva?: number;
  zerezId?: string; hybrid?: boolean; mpptCount?: number;
}

interface Storage {
  manufacturer: string; model: string; capacityKwh: number; coupling?: string;
  powerKw?: number; apparentPowerKva?: number; ratedCurrentA?: number;
  emergencyPower?: boolean; backupPower?: boolean; islandForming?: boolean;
  connectionPhase?: string; allPoleSeparation?: boolean; naProtectionPresent?: boolean;
  inverterManufacturer?: string; inverterType?: string; inverterCount?: number;
  displacementFactorCos?: number;
}

interface Wallbox {
  manufacturer: string; model: string; powerKw: number;
  controllable14a?: boolean; phases?: number; socketType?: string;
}

interface HeatPump {
  manufacturer: string; model: string; powerKw: number;
  type?: string; controllable14a?: boolean; sgReady?: boolean;
}

interface TechComponentCardsProps {
  pv?: PvModule[];
  inverters?: Inverter[];
  storage?: Storage[];
  wallbox?: Wallbox[];
  heatPump?: HeatPump[];
  totalKwp?: number;
  storageKwh?: number;
}

export function TechComponentCards({
  pv = [], inverters = [], storage = [], wallbox = [], heatPump = [],
  totalKwp, storageKwh,
}: TechComponentCardsProps) {
  const hasAny = pv.length > 0 || inverters.length > 0 || storage.length > 0 || wallbox.length > 0 || heatPump.length > 0;
  if (!hasAny) return null;

  return (
    <SectionCard title="Technische Daten" className="col-span-full">
      <div className="grid grid-cols-1 gap-4">
        {/* PV */}
        {pv.length > 0 && (
          <TechGroup icon={<Sun size={16} />} label="PV" color="text-amber-400" bgColor="bg-amber-500/10">
            {pv.map((p, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-[var(--text-primary)]">{p.manufacturer} {p.model}</span>
                <span className="text-xs text-[var(--text-secondary)]">{p.count}x {p.powerWp}Wp</span>
                {(p.roofName || p.orientation || p.tilt) && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {[p.roofName, p.orientation, p.tilt && `${p.tilt}°`, p.shading && p.shading !== 'keine' && `Verschattung: ${p.shading}`].filter(Boolean).join(' · ')}
                  </span>
                )}
                {(p.stringCount || p.modulesPerString) && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {[p.stringCount && `${p.stringCount} Strings`, p.modulesPerString && `${p.modulesPerString} Module/String`].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            ))}
            {totalKwp && <span className="text-xs font-semibold text-amber-400">{totalKwp.toFixed(2)} kWp</span>}
          </TechGroup>
        )}

        {/* Inverter */}
        {inverters.length > 0 && (
          <TechGroup icon={<Zap size={16} />} label="Wechselrichter" color="text-blue-400" bgColor="bg-blue-500/10">
            {inverters.map((inv, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-[var(--text-primary)]">{inv.manufacturer} {inv.model}</span>
                <span className="text-xs text-[var(--text-secondary)]">{inv.powerKva || inv.powerKw} kVA{inv.powerKw ? ` / ${inv.powerKw} kW` : ''}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {inv.zerezId && <span className="text-[10px] text-[var(--text-muted)] font-mono">ZEREZ: {inv.zerezId}</span>}
                  {inv.hybrid && <Badge label="Hybrid" />}
                  {inv.mpptCount && <span className="text-[10px] text-[var(--text-muted)]">{inv.mpptCount} MPPT</span>}
                </div>
              </div>
            ))}
          </TechGroup>
        )}

        {/* Storage */}
        {storage.length > 0 && (
          <TechGroup icon={<Battery size={16} />} label="Speicher" color="text-green-400" bgColor="bg-green-500/10">
            {storage.map((st, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-[var(--text-primary)]">{st.manufacturer} {st.model}</span>
                <span className="text-xs text-[var(--text-secondary)]">{st.capacityKwh} kWh</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {st.coupling && <Badge label={st.coupling === 'dc' ? 'DC-gekoppelt' : 'AC-gekoppelt'} />}
                  {st.powerKw && <span className="text-[10px] text-[var(--text-muted)]">{st.powerKw} kW</span>}
                  {st.apparentPowerKva && <span className="text-[10px] text-[var(--text-muted)]">SSmax: {st.apparentPowerKva} kVA</span>}
                  {st.emergencyPower && <Badge label="Notstrom" />}
                  {st.backupPower && <Badge label="Ersatzstrom" />}
                  {st.islandForming && <Badge label="Inselnetz" />}
                </div>
                {st.inverterManufacturer && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Umrichter: {st.inverterManufacturer} {st.inverterType || ''}{st.inverterCount ? ` (${st.inverterCount}x)` : ''}
                  </span>
                )}
              </div>
            ))}
            {storageKwh && <span className="text-xs font-semibold text-green-400">{storageKwh} kWh</span>}
          </TechGroup>
        )}

        {/* Wallbox */}
        {wallbox.length > 0 && (
          <TechGroup icon={<Car size={16} />} label="Wallbox" color="text-cyan-400" bgColor="bg-cyan-500/10">
            {wallbox.map((wb, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-[var(--text-primary)]">{wb.manufacturer} {wb.model}</span>
                <span className="text-xs text-[var(--text-secondary)]">{wb.powerKw} kW</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {wb.controllable14a && <Badge label="§14a" />}
                  {wb.phases && <span className="text-[10px] text-[var(--text-muted)]">{wb.phases}-phasig</span>}
                  {wb.socketType && <span className="text-[10px] text-[var(--text-muted)]">{wb.socketType}</span>}
                </div>
              </div>
            ))}
          </TechGroup>
        )}

        {/* Heat Pump */}
        {heatPump.length > 0 && (
          <TechGroup icon={<Flame size={16} />} label="Wärmepumpe" color="text-orange-400" bgColor="bg-orange-500/10">
            {heatPump.map((hp, i) => {
              const typeLabel = hp.type === 'Luft' ? 'Luft-Wasser' : hp.type === 'Sole' ? 'Sole-Wasser' : hp.type === 'Wasser' ? 'Wasser-Wasser' : hp.type;
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-[var(--text-primary)]">{hp.manufacturer} {hp.model}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{hp.powerKw} kW</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {typeLabel && <span className="text-[10px] text-[var(--text-muted)]">{typeLabel}</span>}
                    {hp.controllable14a && <Badge label="§14a" />}
                    {hp.sgReady && <Badge label="SG Ready" />}
                  </div>
                </div>
              );
            })}
          </TechGroup>
        )}
      </div>
    </SectionCard>
  );
}

function TechGroup({ icon, label, color, bgColor, children }: {
  icon: React.ReactNode; label: string; color: string; bgColor: string; children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${bgColor} ${color}`}>
        {icon}
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
        {children}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-4 px-1.5 text-[10px] font-medium bg-[var(--gray-800)] text-[var(--text-secondary)] rounded">
      {label}
    </span>
  );
}
