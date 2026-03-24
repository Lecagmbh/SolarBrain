/**
 * AI Validation Badge
 *
 * Zeigt den KI-Validierungsstatus einer Anlage an.
 * Zeigt Score und wichtigste Issues.
 */

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ChevronDown,
  Wrench,
} from 'lucide-react';
import { validateInstallation, type ValidationResult, type ValidationIssue } from '../../../../api/aiAssistant';

interface AIValidationBadgeProps {
  installationId: number;
  compact?: boolean;
  showDetails?: boolean;
  onAutoFix?: (field: string, value: any) => void;
  className?: string;
}

export function AIValidationBadge({
  installationId,
  compact = false,
  showDetails = false,
  onAutoFix,
  className = '',
}: AIValidationBadgeProps) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(showDetails);
  const [error, setError] = useState(false);

  useEffect(() => {
    const validate = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await validateInstallation(installationId);
        setResult(data);
      } catch (err) {
        console.error('Validation error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [installationId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-1.5 text-gray-400 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && <span className="text-xs">Prüfe...</span>}
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`flex items-center gap-1.5 text-gray-400 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        {!compact && <span className="text-xs">Fehler</span>}
      </div>
    );
  }

  const { isValid, score, issues, warnings, autoFixSuggestions } = result;

  // Score color
  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getIcon = () => {
    if (score >= 90) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (score >= 70) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'INFO': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor()} ${className}`}
        title={`Validierung: ${score}%`}
      >
        {getIcon()}
        <span>{score}%</span>
        {issues.length > 0 && (
          <span className="text-xs opacity-70">({issues.length})</span>
        )}
      </button>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors hover:bg-gray-50 ${getScoreColor()}`}
      >
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium">
            Validierung: {score}%
          </span>
          {issues.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/50">
              {issues.length} Problem{issues.length !== 1 ? 'e' : ''}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/50">
              {warnings.length} Warnung{warnings.length !== 1 ? 'en' : ''}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Details */}
      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Issues */}
          {issues.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 px-1">Probleme</div>
              {issues.map((issue: ValidationIssue, idx: number) => (
                <IssueCard key={idx} issue={issue} onAutoFix={onAutoFix} />
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 px-1">Warnungen</div>
              {warnings.map((warning: ValidationIssue, idx: number) => (
                <IssueCard key={idx} issue={warning} onAutoFix={onAutoFix} />
              ))}
            </div>
          )}

          {/* Auto-Fix Suggestions */}
          {autoFixSuggestions.length > 0 && onAutoFix && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">
                  Automatische Korrekturen verfügbar
                </span>
              </div>
              <div className="space-y-2">
                {autoFixSuggestions.map((fix: { field: string; currentValue: unknown; suggestedValue: unknown; reason: string }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white rounded-md p-2 border border-amber-100">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">{fix.field}:</span>
                      <span className="text-gray-500 mx-1">{String(fix.currentValue)}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-amber-600 mx-1">{String(fix.suggestedValue)}</span>
                    </div>
                    <button
                      onClick={() => onAutoFix?.(fix.field, fix.suggestedValue)}
                      className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                    >
                      Anwenden
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Good */}
          {issues.length === 0 && warnings.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">Alle Daten sind valide!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IssueCard({
  issue,
  onAutoFix,
}: {
  issue: ValidationIssue;
  onAutoFix?: (field: string, value: any) => void;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-700';
      case 'WARNING': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'INFO': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className={`p-2 rounded-md border ${getSeverityColor(issue.severity)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{issue.field}</span>
            <span className="text-xs opacity-70">({issue.type})</span>
          </div>
          <p className="text-xs mt-0.5">{issue.message}</p>
          {issue.currentValue !== undefined && (
            <p className="text-xs opacity-70 mt-0.5">
              Aktuell: {String(issue.currentValue)}
            </p>
          )}
        </div>
        {issue.autoFixable && issue.suggestedValue !== undefined && onAutoFix && (
          <button
            onClick={() => onAutoFix(issue.field, issue.suggestedValue)}
            className="flex-shrink-0 px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 transition-colors"
          >
            Fix
          </button>
        )}
      </div>
    </div>
  );
}

export default AIValidationBadge;
