/**
 * KpiHeader – KPI summary bar for installation overview
 * Shows kWp, inverter kW, storage kWh, wallbox/heatpump counts
 */

import { Sun, Zap, Battery, Car, Flame } from 'lucide-react';

interface KpiHeaderProps {
  totalKwp?: number;
  inverterKw?: number;
  storageKwh?: number;
  wallboxCount?: number;
  heatPumpCount?: number;
}

interface KpiItem {
  icon: typeof Sun;
  label: string;
  value: string;
  color: string;
  show: boolean;
}

export function KpiHeader({ totalKwp, inverterKw, storageKwh, wallboxCount, heatPumpCount }: KpiHeaderProps) {
  const items: KpiItem[] = [
    {
      icon: Sun,
      label: 'PV',
      value: totalKwp ? `${totalKwp.toFixed(1)} kWp` : '–',
      color: 'text-amber-400',
      show: !!totalKwp && totalKwp > 0,
    },
    {
      icon: Zap,
      label: 'WR',
      value: inverterKw ? `${inverterKw.toFixed(1)} kW` : '–',
      color: 'text-blue-400',
      show: !!inverterKw && inverterKw > 0,
    },
    {
      icon: Battery,
      label: 'Speicher',
      value: storageKwh ? `${storageKwh.toFixed(1)} kWh` : '–',
      color: 'text-green-400',
      show: !!storageKwh && storageKwh > 0,
    },
    {
      icon: Car,
      label: 'Wallbox',
      value: wallboxCount ? `${wallboxCount}x` : '–',
      color: 'text-cyan-400',
      show: !!wallboxCount && wallboxCount > 0,
    },
    {
      icon: Flame,
      label: 'WP',
      value: heatPumpCount ? `${heatPumpCount}x` : '–',
      color: 'text-orange-400',
      show: !!heatPumpCount && heatPumpCount > 0,
    },
  ];

  const visibleItems = items.filter((i) => i.show);
  if (visibleItems.length === 0) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-[var(--panel-surface-2)] rounded-lg border border-[var(--panel-border)]">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-1.5">
            <Icon size={14} className={item.color} />
            <span className="text-[10px] text-[var(--text-muted)] uppercase">{item.label}</span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
