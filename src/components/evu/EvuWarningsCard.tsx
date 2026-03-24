/**
 * EVU WARNINGS CARD
 * =================
 * Zeigt Warnungen und Tipps basierend auf EVU/Netzbetreiber-Profil
 * vor der Einreichung beim Netzbetreiber an.
 */

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building2,
  Lightbulb,
  Shield,
  Clock,
} from "lucide-react";
import { getEvuWarnings, type EvuWarning, type EvuWarningsParams } from "../../api/evu";

// ============================================================================
// Types
// ============================================================================

interface EvuWarningsCardProps {
  /** ID des Netzbetreibers/EVU */
  evuId: number;
  /** Name des Netzbetreibers (optional, fuer Anzeige) */
  evuName?: string;
  /** Anlagenleistung in kWp */
  kwp?: number;
  /** Hat die Anlage einen Speicher? */
  hasBattery?: boolean;
  /** Hat die Anlage eine Wallbox? */
  hasWallbox?: boolean;
  /** Kompakte Darstellung */
  compact?: boolean;
  /** Zusaetzliche CSS-Klassen */
  className?: string;
}

// ============================================================================
// Severity Configuration
// ============================================================================

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: AlertTriangle,
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    iconColor: "text-red-400",
    textColor: "text-red-300",
    label: "Kritisch",
  },
  WARNING: {
    icon: AlertCircle,
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    textColor: "text-amber-300",
    label: "Warnung",
  },
  INFO: {
    icon: Info,
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    textColor: "text-blue-300",
    label: "Info",
  },
};

// ============================================================================
// Component
// ============================================================================

export function EvuWarningsCard({
  evuId,
  evuName,
  kwp,
  hasBattery,
  hasWallbox,
  compact = false,
  className = "",
}: EvuWarningsCardProps) {
  const [warnings, setWarnings] = useState<EvuWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  // Lade Warnungen
  const loadWarnings = useCallback(async () => {
    if (!evuId) {
      setWarnings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: EvuWarningsParams = {};
      if (kwp) params.kwp = kwp;
      if (hasBattery) params.hasBattery = true;
      if (hasWallbox) params.hasWallbox = true;

      const data = await getEvuWarnings(evuId, params);
      setWarnings(data);
    } catch (err) {
      console.error("[EvuWarningsCard] Fehler:", err);
      setError("Warnungen konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [evuId, kwp, hasBattery, hasWallbox]);

  useEffect(() => {
    loadWarnings();
  }, [loadWarnings]);

  // Counts nach Severity
  const criticalCount = warnings.filter((w) => w.severity === "CRITICAL").length;
  const warningCount = warnings.filter((w) => w.severity === "WARNING").length;
  const infoCount = warnings.filter((w) => w.severity === "INFO").length;

  // Loading State
  if (loading) {
    return (
      <div className={`dp-overview-card ${className}`}>
        <div className="dp-overview-card__header">
          <Shield size={18} />
          <h4>EVU-Hinweise</h4>
        </div>
        <div className="dp-overview-card__content">
          <div className="flex items-center gap-2 text-slate-400 py-4">
            <Loader2 size={16} className="animate-spin" />
            <span>Lade Hinweise...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={`dp-overview-card ${className}`}>
        <div className="dp-overview-card__header">
          <Shield size={18} />
          <h4>EVU-Hinweise</h4>
        </div>
        <div className="dp-overview-card__content">
          <div className="flex items-center gap-2 text-red-400 py-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Keine Warnungen
  if (warnings.length === 0) {
    return (
      <div className={`dp-overview-card ${className}`}>
        <div className="dp-overview-card__header">
          <Shield size={18} />
          <h4>EVU-Hinweise</h4>
          {evuName && <span className="text-xs text-slate-500 ml-auto">{evuName}</span>}
        </div>
        <div className="dp-overview-card__content">
          <div className="flex items-center gap-2 text-emerald-400 py-2">
            <Info size={16} />
            <span>Keine besonderen Hinweise fuer diesen Netzbetreiber</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dp-overview-card ${className}`}>
      {/* Header */}
      <div
        className="dp-overview-card__header cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Shield size={18} />
        <h4>EVU-Hinweise</h4>

        {/* Badge Counts */}
        <div className="flex items-center gap-1 ml-auto">
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-red-500/20 text-red-400 font-medium">
              {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 font-medium">
              {warningCount}
            </span>
          )}
          {infoCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400 font-medium">
              {infoCount}
            </span>
          )}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="dp-overview-card__content">
          {/* EVU Name */}
          {evuName && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 pb-2 border-b border-slate-700/50">
              <Building2 size={12} />
              <span>{evuName}</span>
            </div>
          )}

          {/* Warnings List */}
          <div className="space-y-2">
            {warnings.map((warning, index) => {
              const config = SEVERITY_CONFIG[warning.severity];
              const Icon = config.icon;

              return (
                <div
                  key={`${warning.category}-${index}`}
                  className={`
                    relative rounded-lg p-3 border
                    ${config.bgColor} ${config.borderColor}
                  `}
                >
                  {/* Header Row */}
                  <div className="flex items-start gap-2">
                    <Icon size={16} className={`${config.iconColor} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      {/* Category & Severity */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${config.textColor}`}>
                          {warning.category}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">
                          {config.label}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {warning.message}
                      </p>

                      {/* Recommendation */}
                      {warning.recommendation && (
                        <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-slate-700/30">
                          <Lightbulb size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-slate-400">
                            <span className="font-medium text-amber-400/80">Empfehlung:</span>{" "}
                            {warning.recommendation}
                          </p>
                        </div>
                      )}

                      {/* Based On */}
                      {warning.basedOn && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                          <Clock size={10} />
                          <span>{warning.basedOn}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Hint */}
          <div className="mt-3 pt-2 border-t border-slate-700/50 text-[10px] text-slate-500 flex items-center gap-1.5">
            <Info size={10} />
            <span>
              Basierend auf historischen Daten und Erfahrungen mit diesem Netzbetreiber
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvuWarningsCard;
