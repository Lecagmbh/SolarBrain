// ============================================
// FINANZEN MODULE - KPI CARDS
// ============================================

import { Euro, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { KPICardsProps } from "../types";
import { AnimatedNumber, ProgressRing, Trend, Skeleton } from "./common";
import { clsx } from "../utils";

// ============================================
// COMPONENT
// ============================================

export function KPICards({ data, loading, onFilterChange }: KPICardsProps) {
  if (loading) {
    return (
      <section className="fin-kpis">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fin-kpi">
            <div className="fin-kpi__header">
              <Skeleton width={48} height={48} rounded={14} />
              <Skeleton width={60} height={24} rounded={8} />
            </div>
            <Skeleton width="80%" height={32} />
            <Skeleton width="50%" height={16} />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="fin-kpis">
      {/* Total Revenue - Featured Card */}
      <div className="fin-kpi fin-kpi--featured">
        <div className="fin-kpi__header">
          <div className="fin-kpi__icon fin-kpi__icon--purple">
            <Euro size={24} />
          </div>
          <Trend value={data.total.trend} />
        </div>
        <div className="fin-kpi__value">
          <AnimatedNumber value={data.total.sum} format="currency" />
        </div>
        <div className="fin-kpi__label">Gesamtumsatz</div>
        <div className="fin-kpi__meta">
          <span>{data.total.count} Rechnungen</span>
          <ProgressRing 
            progress={data.paid.percent} 
            size={32} 
            strokeWidth={3}
            color="#10b981" 
          />
        </div>
        <div className="fin-kpi__shine" />
      </div>

      {/* Open Invoices */}
      <div 
        className="fin-kpi fin-kpi--clickable"
        onClick={() => onFilterChange?.("OFFEN")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onFilterChange?.("OFFEN")}
      >
        <div className="fin-kpi__header">
          <div className="fin-kpi__icon fin-kpi__icon--orange">
            <Clock size={24} />
          </div>
          {data.open.count > 0 && (
            <span className="fin-kpi__badge">{data.open.count}</span>
          )}
        </div>
        <div className="fin-kpi__value fin-kpi__value--orange">
          <AnimatedNumber value={data.open.sum} format="currency" />
        </div>
        <div className="fin-kpi__label">Offen</div>
      </div>

      {/* Paid Invoices */}
      <div 
        className="fin-kpi fin-kpi--clickable"
        onClick={() => onFilterChange?.("BEZAHLT")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onFilterChange?.("BEZAHLT")}
      >
        <div className="fin-kpi__header">
          <div className="fin-kpi__icon fin-kpi__icon--green">
            <CheckCircle2 size={24} />
          </div>
          <Trend value={data.paid.trend} />
        </div>
        <div className="fin-kpi__value fin-kpi__value--green">
          <AnimatedNumber value={data.paid.sum} format="currency" />
        </div>
        <div className="fin-kpi__label">Bezahlt</div>
        <div className="fin-kpi__meta">
          <span>{data.paid.count} Rechnungen</span>
        </div>
      </div>

      {/* Overdue Invoices */}
      <div 
        className={clsx(
          "fin-kpi",
          data.overdue.count > 0 && "fin-kpi--alert"
        )}
      >
        <div className="fin-kpi__header">
          <div className="fin-kpi__icon fin-kpi__icon--red">
            <AlertTriangle size={24} />
          </div>
          {data.overdue.count > 0 && (
            <span className="fin-kpi__badge fin-kpi__badge--urgent fin-pulse">
              {data.overdue.count}
            </span>
          )}
        </div>
        <div className="fin-kpi__value fin-kpi__value--red">
          <AnimatedNumber value={data.overdue.sum} format="currency" />
        </div>
        <div className="fin-kpi__label">Überfällig</div>
        {data.overdue.count > 0 && (
          <div className="fin-kpi__alert-indicator" />
        )}
      </div>
    </section>
  );
}
