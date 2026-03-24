/**
 * ErtragsChart — Recharts BarChart mit monatlichen PVGIS-Erträgen
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { styles } from '../steps/shared';

// Recharts v3 hat Typkompatibilitätsprobleme mit React 19 strict mode
const RBarChart = BarChart as any;
const RBar = Bar as any;
const RXAxis = XAxis as any;
const RYAxis = YAxis as any;
const RTooltip = Tooltip as any;
const RResponsiveContainer = ResponsiveContainer as any;

interface ErtragsChartProps {
  monatlicheErtraege: { monat: string; kwh: number }[];
}

export const ErtragsChart: React.FC<ErtragsChartProps> = ({ monatlicheErtraege }) => {
  if (!monatlicheErtraege || monatlicheErtraege.length === 0) return null;

  return (
    <div className={styles.ertragsChart}>
      <div className={styles.ertragsChartTitle}>Monatlicher Ertrag (kWh)</div>
      <RResponsiveContainer width="100%" height={180}>
        <RBarChart data={monatlicheErtraege} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <RXAxis
            dataKey="monat"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <RYAxis
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <RTooltip
            contentStyle={{
              background: '#1a2332',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#fafafa',
            }}
            formatter={(value: any) => [`${Number(value).toLocaleString()} kWh`, 'Ertrag']}
            cursor={{ fill: 'rgba(99,139,255,0.08)' }}
          />
          <RBar
            dataKey="kwh"
            fill="#638bff"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </RBarChart>
      </RResponsiveContainer>
    </div>
  );
};
