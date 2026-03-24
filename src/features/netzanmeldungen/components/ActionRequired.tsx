/**
 * ACTION REQUIRED v2.0 - Premium Glassmorphism Design
 * ====================================================
 * Prominent action section with horizontal scrolling cards
 *
 * Rollenbasierte Sichtbarkeit:
 * - Admin/Mitarbeiter: Alle Aktionen
 * - Kunde/Demo: Nur Rückfragen (Einreichen ist Admin-Arbeit)
 */

import { useStats, useActionRequired } from "../hooks/useEnterpriseApi";
import type { ListItem } from "../hooks/useEnterpriseApi";
import { AlertTriangle, Send, Calendar, ChevronRight, MapPin, Zap, Clock, FileQuestion } from "lucide-react";
import { useAuth } from "../../../pages/AuthContext";
import "./ActionRequired.css";

interface ActionRequiredProps {
  onItemClick: (id: number) => void;
  onShowAll: (type: "rueckfrage" | "eingang" | "zaehler") => void;
}

function ItemCard({ item, color, onItemClick }: { item: ListItem; color: string; onItemClick: (id: number) => void }) {
  return (
    <div
      className="ar-item-card"
      style={{ "--item-color": color } as React.CSSProperties}
      onClick={() => onItemClick(item.id)}
    >
      <div className="ar-item-card__glow" />
      <div className="ar-item-card__content">
        <div className="ar-item-card__name">{item.customerName}</div>
        <div className="ar-item-card__location">
          <MapPin size={12} />
          {item.plz} {item.ort}
        </div>
        <div className="ar-item-card__footer">
          {item.totalKwp > 0 && (
            <span className="ar-item-card__kwp">
              <Zap size={12} />
              {item.totalKwp.toFixed(1)} kWp
            </span>
          )}
          <span className="ar-item-card__days">
            <Clock size={12} />
            {item.daysOld}d
          </span>
        </div>
      </div>
    </div>
  );
}

function ActionSection({
  icon,
  color,
  title,
  count,
  badge,
  items,
  onItemClick,
  onShowAll,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  count: number;
  badge?: string;
  items: ListItem[];
  onItemClick: (id: number) => void;
  onShowAll: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="ar-section" style={{ "--section-color": color } as React.CSSProperties}>
      <div className="ar-section__header">
        <div className="ar-section__icon">{icon}</div>
        <div className="ar-section__info">
          <span className="ar-section__title">{title}</span>
          <span className="ar-section__count">({count})</span>
        </div>
        {badge && <span className="ar-section__badge">{badge}</span>}
        <button className="ar-section__more" onClick={onShowAll}>
          Alle <ChevronRight size={14} />
        </button>
      </div>

      <div className="ar-section__cards">
        {items.slice(0, 5).map((item) => (
          <ItemCard key={item.id} item={item} color={color} onItemClick={onItemClick} />
        ))}
        {count > 5 && (
          <button className="ar-section__see-more" onClick={onShowAll}>
            <span>+{count - 5}</span>
            <span>mehr</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function ActionRequired({ onItemClick, onShowAll }: ActionRequiredProps) {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { rueckfragen, einreichen, zaehlerTermine, isLoading: itemsLoading } = useActionRequired();

  // Rollenprüfung: Kunden sehen nur Rückfragen, nicht Admin-Aufgaben
  const isAdmin = user?.role === "ADMIN" || user?.role === "MITARBEITER";
  const isCustomer = user?.role === "KUNDE" || user?.role === "DEMO";

  const isLoading = statsLoading || itemsLoading;

  // Für Kunden nur Rückfragen zählen
  const totalActions = isCustomer
    ? (stats?.actionRequired.rueckfragen || 0)
    : (stats?.actionRequired.total || 0);

  if (isLoading) {
    return (
      <div className="ar-container ar-container--loading">
        <div className="ar-skeleton">
          <div className="ar-skeleton__header" />
          <div className="ar-skeleton__cards">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="ar-skeleton__card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (totalActions === 0) {
    return null;
  }

  // Calculate badges
  const neuHeute = rueckfragen.filter(i => {
    const created = new Date(i.createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;

  const altEinreichen = einreichen.filter(i => i.daysOld > 3).length;

  const dieseWoche = zaehlerTermine.filter(i => {
    if (!i.zaehlerwechselDatum) return false;
    const termin = new Date(i.zaehlerwechselDatum);
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return termin >= now && termin <= weekEnd;
  }).length;

  return (
    <div className="ar-container">
      {/* Header */}
      <div className="ar-header">
        <div className="ar-header__title-group">
          <div className="ar-header__icon-wrapper">
            <span className="ar-header__dot" />
          </div>
          <h2 className="ar-header__title">Aktion erforderlich</h2>
          <span className="ar-header__count">{totalActions}</span>
        </div>
      </div>

      {/* Sections - Rollenbasiert */}
      <div className="ar-sections">
        {/* Rückfragen - für alle sichtbar */}
        <ActionSection
          icon={<AlertTriangle size={18} />}
          color="#ef4444"
          title={isCustomer ? "Rückfragen beantworten" : "Rückfragen vom NB"}
          count={stats?.actionRequired.rueckfragen || 0}
          badge={neuHeute > 0 ? `${neuHeute} neu` : undefined}
          items={rueckfragen}
          onItemClick={onItemClick}
          onShowAll={() => onShowAll("rueckfrage")}
        />

        {/* Einreichen - nur für Admin/Mitarbeiter */}
        {isAdmin && (
          <ActionSection
            icon={<Send size={18} />}
            color="#3b82f6"
            title="Bereit zum Einreichen"
            count={stats?.actionRequired.zumEinreichen || 0}
            badge={altEinreichen > 0 ? `${altEinreichen} >3d` : undefined}
            items={einreichen}
            onItemClick={onItemClick}
            onShowAll={() => onShowAll("eingang")}
          />
        )}

        {/* Zählerwechsel - nur für Admin/Mitarbeiter */}
        {isAdmin && (
          <ActionSection
            icon={<Calendar size={18} />}
            color="#a855f7"
            title="Zählerwechsel anstehend"
            count={stats?.actionRequired.zaehlerTermine || 0}
            badge={dieseWoche > 0 ? `${dieseWoche} diese Woche` : undefined}
            items={zaehlerTermine}
            onItemClick={onItemClick}
            onShowAll={() => onShowAll("zaehler")}
          />
        )}
      </div>
    </div>
  );
}

export default ActionRequired;
