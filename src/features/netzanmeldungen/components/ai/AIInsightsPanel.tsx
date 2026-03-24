/**
 * AI Insights Panel v2 — Compact KPI Bar
 *
 * Kompakte Leiste mit Kernmetriken und ausklappbaren Details.
 * Nur für Admins sichtbar (Guard in NetzanmeldungenEnterprise).
 */

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Target,
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  Sparkles,
  CheckCircle,
  Calendar,
  Zap,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import {
  getWorkflowInsights,
  type WorkflowInsights,
  type AnomalyAlert,
  type PriorityItem,
  type Bottleneck,
} from '../../../../api/aiAssistant';
import './AIInsightsPanel.css';

interface AIInsightsPanelProps {
  onSelectInstallation?: (id: number) => void;
  className?: string;
}

type ExpandedSection = 'anomalies' | 'priorities' | 'bottlenecks' | null;

export function AIInsightsPanel({ onSelectInstallation, className = '' }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<WorkflowInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedSection>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadInsights = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getWorkflowInsights();
      setInsights(data);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const toggle = (section: ExpandedSection) => {
    setExpanded(prev => prev === section ? null : section);
  };

  // Loading
  if (loading) {
    return (
      <div className={`aik ${className}`}>
        <div className="aik__bar">
          <div className="aik__label">
            <Sparkles size={14} />
            <span>KI-Analyse</span>
          </div>
          <div className="aik__loading">
            <Loader2 size={14} className="aik__spin" />
            <span>Lade...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={`aik ${className}`}>
        <div className="aik__bar">
          <div className="aik__label aik__label--error">
            <AlertTriangle size={14} />
            <span>KI-Analyse fehlgeschlagen</span>
          </div>
          <button onClick={() => loadInsights()} className="aik__retry">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const { anomalies, bottlenecks, todaysPriorities, weeklyForecast } = insights;
  const criticalAnomalies = anomalies.filter(a => a.anomalyType === 'ESCALATION_NEEDED');
  const highPriorities = todaysPriorities.filter(p => p.priorityScore >= 80);

  return (
    <div className={`aik ${className}`}>
      {/* KPI Bar */}
      <div className="aik__bar">
        <div className="aik__label">
          <Sparkles size={14} />
          <span>KI-Analyse</span>
        </div>

        <div className="aik__metrics">
          {/* Anomalien Pill */}
          <button
            className={`aik__pill ${anomalies.length > 0 ? 'aik__pill--danger' : 'aik__pill--ok'} ${expanded === 'anomalies' ? 'aik__pill--active' : ''}`}
            onClick={() => toggle('anomalies')}
          >
            <ShieldAlert size={13} />
            <span className="aik__pill-count">{anomalies.length}</span>
            <span className="aik__pill-label">
              {anomalies.length === 1 ? 'Anomalie' : 'Anomalien'}
            </span>
            {criticalAnomalies.length > 0 && (
              <span className="aik__pill-badge">{criticalAnomalies.length} kritisch</span>
            )}
            <ChevronDown size={12} className={`aik__pill-chevron ${expanded === 'anomalies' ? 'aik__pill-chevron--open' : ''}`} />
          </button>

          {/* Prioritäten Pill */}
          <button
            className={`aik__pill ${highPriorities.length > 0 ? 'aik__pill--warn' : 'aik__pill--ok'} ${expanded === 'priorities' ? 'aik__pill--active' : ''}`}
            onClick={() => toggle('priorities')}
          >
            <Target size={13} />
            <span className="aik__pill-count">{todaysPriorities.length}</span>
            <span className="aik__pill-label">
              {todaysPriorities.length === 1 ? 'Priorität' : 'Prioritäten'}
            </span>
            <ChevronDown size={12} className={`aik__pill-chevron ${expanded === 'priorities' ? 'aik__pill-chevron--open' : ''}`} />
          </button>

          {/* Bottlenecks Pill */}
          <button
            className={`aik__pill ${bottlenecks.length > 0 ? 'aik__pill--warn' : 'aik__pill--ok'} ${expanded === 'bottlenecks' ? 'aik__pill--active' : ''}`}
            onClick={() => toggle('bottlenecks')}
          >
            <Clock size={13} />
            <span className="aik__pill-count">{bottlenecks.length}</span>
            <span className="aik__pill-label">
              {bottlenecks.length === 1 ? 'Engpass' : 'Engpässe'}
            </span>
            <ChevronDown size={12} className={`aik__pill-chevron ${expanded === 'bottlenecks' ? 'aik__pill-chevron--open' : ''}`} />
          </button>

          {/* Prognose — inline, not expandable */}
          <div className="aik__forecast">
            <div className="aik__fc-item aik__fc-item--green">
              <CheckCircle size={12} />
              <span>{weeklyForecast.expectedApprovals}</span>
              <span className="aik__fc-label">Genehm.</span>
            </div>
            <div className="aik__fc-item aik__fc-item--amber">
              <AlertTriangle size={12} />
              <span>{weeklyForecast.expectedRueckfragen}</span>
              <span className="aik__fc-label">Rückfr.</span>
            </div>
            <div className="aik__fc-item aik__fc-item--blue">
              <Calendar size={12} />
              <span>{weeklyForecast.upcomingDeadlines}</span>
              <span className="aik__fc-label">ZW</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadInsights(true)}
          className={`aik__refresh ${isRefreshing ? 'aik__refresh--spin' : ''}`}
          title="Aktualisieren"
          disabled={isRefreshing}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div className="aik__detail">
          {expanded === 'anomalies' && (
            <AnomalySection items={anomalies} onSelect={onSelectInstallation} />
          )}
          {expanded === 'priorities' && (
            <PrioritySection items={todaysPriorities} onSelect={onSelectInstallation} />
          )}
          {expanded === 'bottlenecks' && (
            <BottleneckSection items={bottlenecks} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Anomaly Section ──────────────────────────────────────────────────────────

function AnomalySection({ items, onSelect }: { items: AnomalyAlert[]; onSelect?: (id: number) => void }) {
  if (items.length === 0) {
    return (
      <div className="aik__empty">
        <CheckCircle size={16} />
        <span>Keine Anomalien — alles im Soll</span>
      </div>
    );
  }

  const getTypeClass = (type: AnomalyAlert['anomalyType']) => {
    switch (type) {
      case 'ESCALATION_NEEDED': return 'aik__row--critical';
      case 'STUCK': return 'aik__row--warning';
      case 'UNUSUALLY_SLOW': return 'aik__row--slow';
      default: return '';
    }
  };

  const getTypeLabel = (type: AnomalyAlert['anomalyType']) => {
    switch (type) {
      case 'ESCALATION_NEEDED': return 'Eskalation';
      case 'STUCK': return 'Blockiert';
      case 'UNUSUALLY_SLOW': return 'Langsam';
      case 'MISSING_UPDATE': return 'Kein Update';
      default: return type;
    }
  };

  return (
    <div className="aik__rows">
      {items.slice(0, 8).map((item) => (
        <button
          key={item.installationId}
          className={`aik__row ${getTypeClass(item.anomalyType)}`}
          onClick={() => onSelect?.(item.installationId)}
        >
          <span className="aik__row-id">{item.publicId}</span>
          <span className="aik__row-name">{item.customerName}</span>
          <span className="aik__row-meta">
            <Clock size={11} />
            {item.daysInStatus}d / {item.expectedDays}d erwartet
          </span>
          <span className="aik__row-tag">{getTypeLabel(item.anomalyType)}</span>
          <ChevronRight size={12} className="aik__row-arrow" />
        </button>
      ))}
      {items.length > 8 && (
        <div className="aik__more">+{items.length - 8} weitere</div>
      )}
    </div>
  );
}

// ── Priority Section ─────────────────────────────────────────────────────────

function PrioritySection({ items, onSelect }: { items: PriorityItem[]; onSelect?: (id: number) => void }) {
  if (items.length === 0) {
    return (
      <div className="aik__empty">
        <CheckCircle size={16} />
        <span>Keine offenen Prioritäten — alles im Plan</span>
      </div>
    );
  }

  return (
    <div className="aik__rows">
      {items.slice(0, 8).map((item) => (
        <button
          key={item.installationId}
          className={`aik__row ${
            item.priorityScore >= 90 ? 'aik__row--critical' :
            item.priorityScore >= 70 ? 'aik__row--warning' : ''
          }`}
          onClick={() => onSelect?.(item.installationId)}
        >
          <span className="aik__row-id">{item.publicId}</span>
          <span className="aik__row-name">{item.customerName}</span>
          <span className="aik__row-meta">
            <Zap size={11} />
            {item.reasons[0]}
          </span>
          <span className="aik__row-score">{item.priorityScore}</span>
          <ChevronRight size={12} className="aik__row-arrow" />
        </button>
      ))}
      {items.length > 8 && (
        <div className="aik__more">+{items.length - 8} weitere</div>
      )}
    </div>
  );
}

// ── Bottleneck Section ───────────────────────────────────────────────────────

function BottleneckSection({ items }: { items: Bottleneck[] }) {
  if (items.length === 0) {
    return (
      <div className="aik__empty">
        <CheckCircle size={16} />
        <span>Keine Engpässe — Workflow läuft optimal</span>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'STATUS': return <Clock size={13} />;
      case 'NETZBETREIBER': return <Building2 size={13} />;
      case 'RUECKFRAGE': return <AlertTriangle size={13} />;
      default: return <Target size={13} />;
    }
  };

  return (
    <div className="aik__rows">
      {items.map((item, idx) => (
        <div key={idx} className="aik__row aik__row--static">
          <span className="aik__row-icon">{getIcon(item.type)}</span>
          <span className="aik__row-name">{item.identifier}</span>
          <span className="aik__row-meta">
            {item.count} Anlagen · {item.avgWaitDays}d Ø Wartezeit
          </span>
          <span className="aik__row-tag">{item.type === 'STATUS' ? 'Status' : item.type === 'NETZBETREIBER' ? 'NB' : item.type === 'RUECKFRAGE' ? 'Rückfrage' : item.type}</span>
        </div>
      ))}
    </div>
  );
}

export default AIInsightsPanel;
