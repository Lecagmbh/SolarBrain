/**
 * AI Quick Actions
 *
 * Zeigt KI-generierte Quick Actions für eine Rückfrage.
 * Analysiert den Rückfrage-Text und schlägt Aktionen vor.
 */

import { useState, useEffect } from 'react';
import {
  Zap,
  Mail,
  FileText,
  Phone,
  Clock,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { analyzeRueckfrage, getQuickActions, type RueckfrageAnalysis } from '../../../../api/aiAssistant';

interface AIQuickActionsProps {
  installationId: number;
  rueckfrageText?: string;
  installationData?: any;
  onAction?: (actionType: string, data: any) => void;
  className?: string;
}

export function AIQuickActions({
  installationId,
  rueckfrageText,
  installationData,
  onAction,
  className = '',
}: AIQuickActionsProps) {
  const [analysis, setAnalysis] = useState<RueckfrageAnalysis | null>(null);
  const [actions, setActions] = useState<Array<{
    type: string;
    label: string;
    description: string;
    priority: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!rueckfrageText) return;

    const analyze = async () => {
      setLoading(true);
      try {
        // Parallel: Analyse und Quick Actions
        const [analysisResult, actionsResult] = await Promise.all([
          analyzeRueckfrage({
            emailSubject: 'Rückfrage',
            emailBody: rueckfrageText,
            installationData,
          }),
          getQuickActions(installationId, rueckfrageText),
        ]);

        setAnalysis(analysisResult);
        setActions(actionsResult.actions || []);
      } catch (err) {
        console.error('AI Analysis Error:', err);
      } finally {
        setLoading(false);
      }
    };

    analyze();
  }, [installationId, rueckfrageText, installationData]);

  if (!rueckfrageText) return null;

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-amber-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span className="text-sm text-amber-600">KI analysiert Rückfrage...</span>
        </div>
      </div>
    );
  }

  if (!analysis && actions.length === 0) return null;

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'REPLY_EMAIL': return <Mail className="w-4 h-4" />;
      case 'SEND_DOCUMENT': return <FileText className="w-4 h-4" />;
      case 'CALL_NB': return <Phone className="w-4 h-4" />;
      case 'WAIT': return <Clock className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'HOCH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MITTEL': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'NIEDRIG': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-amber-50 rounded-lg border border-amber-100 overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-amber-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-md">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <span className="font-medium text-gray-900 text-sm">KI-Analyse</span>
          {analysis && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getUrgencyColor(analysis.urgencyLevel)}`}>
              {analysis.urgencyLevel}
            </span>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Classification */}
          {analysis?.classification && (
            <div className="bg-white rounded-md p-3 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Kategorie</div>
              <div className="font-medium text-gray-900">
                {analysis.classification.category}
                {analysis.classification.subCategory && (
                  <span className="text-gray-500"> / {analysis.classification.subCategory}</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(analysis.classification.confidence * 100)}% Konfidenz
              </div>
            </div>
          )}

          {/* Required Actions */}
          {analysis?.requiredActions && analysis.requiredActions.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Erforderliche Aktionen</div>
              <div className="space-y-2">
                {analysis.requiredActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-md p-2 border border-gray-100 flex items-start gap-2"
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      action.priority === 1 ? 'bg-red-100 text-red-700' :
                      action.priority === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {action.priority}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{action.type}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {actions.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
              <div className="flex flex-wrap gap-2">
                {actions.map((action: { type: string; label: string; description: string; priority: number }, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => onAction?.(action.type, action)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    {getActionIcon(action.type)}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Response */}
          {analysis?.suggestedResponse && (
            <div className="bg-white rounded-md p-3 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Antwortvorschlag</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {analysis.suggestedResponse}
              </p>
              <button
                onClick={() => onAction?.('USE_SUGGESTED_RESPONSE', { text: analysis.suggestedResponse })}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Vorschlag verwenden <ChevronRight className="w-3 h-3 inline" />
              </button>
            </div>
          )}

          {/* Estimated Effort */}
          {analysis?.estimatedEffort && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Geschätzter Aufwand: {analysis.estimatedEffort}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIQuickActions;
