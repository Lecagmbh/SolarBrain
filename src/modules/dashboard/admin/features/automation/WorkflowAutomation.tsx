/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  WORKFLOW AUTOMATION                                                         ║
 * ║  Visual Rules Engine für automatische Aktionen                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  ChevronRight,
  ChevronDown,
  Clock,
  Mail,
  Bell,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Settings,
  ArrowRight,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Select } from "../../components/ui/UIComponents";
import "./automation.css";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type TriggerType = "status_change" | "time_based" | "document_upload" | "email_received" | "manual";
type ActionType = "send_email" | "send_notification" | "change_status" | "create_task" | "webhook";
type ConditionOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "contains";

interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: string;
}

interface WorkflowTrigger {
  type: TriggerType;
  config: Record<string, any>;
}

interface WorkflowAction {
  type: ActionType;
  config: Record<string, any>;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
  executionCount: number;
  lastExecuted?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TRIGGER_OPTIONS = [
  { value: "status_change", label: "Status geändert", icon: <CheckCircle2 size={16} /> },
  { value: "time_based", label: "Zeitbasiert", icon: <Clock size={16} /> },
  { value: "document_upload", label: "Dokument hochgeladen", icon: <FileText size={16} /> },
  { value: "email_received", label: "E-Mail empfangen", icon: <Mail size={16} /> },
  { value: "manual", label: "Manuell", icon: <Play size={16} /> },
];

const ACTION_OPTIONS = [
  { value: "send_email", label: "E-Mail senden", icon: <Mail size={16} /> },
  { value: "send_notification", label: "Benachrichtigung", icon: <Bell size={16} /> },
  { value: "change_status", label: "Status ändern", icon: <CheckCircle2 size={16} /> },
  { value: "create_task", label: "Aufgabe erstellen", icon: <FileText size={16} /> },
  { value: "webhook", label: "Webhook aufrufen", icon: <Zap size={16} /> },
];

const STATUS_OPTIONS = [
  { value: "entwurf", label: "Entwurf" },
  { value: "eingereicht", label: "Eingereicht" },
  { value: "warten_auf_nb", label: "Beim Netzbetreiber" },
  { value: "nachbesserung", label: "Rückfrage" },
  { value: "nb_genehmigt", label: "Genehmigt" },
  { value: "abgeschlossen", label: "Abgeschlossen" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULE CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface RuleCardProps {
  rule: WorkflowRule;
  onToggle: (id: string) => void;
  onEdit: (rule: WorkflowRule) => void;
  onDelete: (id: string) => void;
  onDuplicate: (rule: WorkflowRule) => void;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, onToggle, onEdit, onDelete, onDuplicate }) => {
  const [expanded, setExpanded] = useState(false);
  const triggerInfo = TRIGGER_OPTIONS.find((t) => t.value === rule.trigger.type);

  return (
    <div className={`rule-card ${rule.enabled ? "" : "rule-card--disabled"}`}>
      <div className="rule-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="rule-card__toggle">
          <button
            className={`rule-toggle ${rule.enabled ? "rule-toggle--on" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(rule.id);
            }}
          >
            {rule.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
        
        <div className="rule-card__info">
          <div className="rule-card__title">
            <span className="rule-card__name">{rule.name}</span>
            {rule.enabled ? (
              <Badge variant="success" size="sm">Aktiv</Badge>
            ) : (
              <Badge variant="default" size="sm">Inaktiv</Badge>
            )}
          </div>
          <p className="rule-card__description">{rule.description}</p>
        </div>

        <div className="rule-card__meta">
          <span className="rule-card__stat">
            <Zap size={14} />
            {rule.executionCount}x ausgeführt
          </span>
          {rule.lastExecuted && (
            <span className="rule-card__stat">
              <Clock size={14} />
              {formatRelativeTime(rule.lastExecuted)}
            </span>
          )}
        </div>

        <div className="rule-card__chevron">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="rule-card__details">
          {/* Trigger */}
          <div className="rule-card__section">
            <div className="rule-card__section-header">
              <span className="rule-card__section-label">WENN</span>
            </div>
            <div className="rule-card__trigger">
              <span className="rule-card__trigger-icon">{triggerInfo?.icon}</span>
              <span>{triggerInfo?.label}</span>
              {rule.trigger.type === "status_change" && rule.trigger.config.toStatus && (
                <span className="rule-card__trigger-detail">
                  → Status wird <Badge variant="info" size="sm">{rule.trigger.config.toStatus}</Badge>
                </span>
              )}
              {rule.trigger.type === "time_based" && (
                <span className="rule-card__trigger-detail">
                  nach {rule.trigger.config.days} Tagen
                </span>
              )}
            </div>
          </div>

          {/* Conditions */}
          {rule.conditions.length > 0 && (
            <div className="rule-card__section">
              <div className="rule-card__section-header">
                <span className="rule-card__section-label">UND</span>
              </div>
              <div className="rule-card__conditions">
                {rule.conditions.map((cond, i) => (
                  <div key={i} className="rule-card__condition">
                    {cond.field} {cond.operator} "{cond.value}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rule-card__section">
            <div className="rule-card__section-header">
              <span className="rule-card__section-label">DANN</span>
            </div>
            <div className="rule-card__actions-list">
              {rule.actions.map((action, i) => {
                const actionInfo = ACTION_OPTIONS.find((a) => a.value === action.type);
                return (
                  <div key={i} className="rule-card__action">
                    <span className="rule-card__action-icon">{actionInfo?.icon}</span>
                    <span>{actionInfo?.label}</span>
                    {action.type === "send_email" && action.config.template && (
                      <Badge variant="purple" size="sm">{action.config.template}</Badge>
                    )}
                    {action.type === "change_status" && action.config.newStatus && (
                      <Badge variant="info" size="sm">{action.config.newStatus}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions Buttons */}
          <div className="rule-card__buttons">
            <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => onEdit(rule)}>
              Bearbeiten
            </Button>
            <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={() => onDuplicate(rule)}>
              Duplizieren
            </Button>
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => onDelete(rule.id)} className="text-error">
              Löschen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RULE EDITOR MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface RuleEditorProps {
  rule?: WorkflowRule;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Partial<WorkflowRule>) => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(rule?.name || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [triggerType, setTriggerType] = useState<TriggerType>(rule?.trigger?.type || "status_change");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>(rule?.trigger?.config || {});
  const [actionType, setActionType] = useState<ActionType>(rule?.actions?.[0]?.type || "send_email");
  const [actionConfig, setActionConfig] = useState<Record<string, any>>(rule?.actions?.[0]?.config || {});

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description);
      setTriggerType(rule.trigger.type);
      setTriggerConfig(rule.trigger.config);
      setActionType(rule.actions[0]?.type || "send_email");
      setActionConfig(rule.actions[0]?.config || {});
    } else {
      setName("");
      setDescription("");
      setTriggerType("status_change");
      setTriggerConfig({});
      setActionType("send_email");
      setActionConfig({});
    }
  }, [rule, isOpen]);

  const handleSave = () => {
    onSave({
      id: rule?.id,
      name,
      description,
      enabled: rule?.enabled ?? true,
      trigger: { type: triggerType, config: triggerConfig },
      actions: [{ type: actionType, config: actionConfig }],
      conditions: [],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal rule-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{rule ? "Regel bearbeiten" : "Neue Regel erstellen"}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Basic Info */}
          <div className="rule-editor__section">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. E-Mail bei Genehmigung"
            />
            <Input
              label="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was macht diese Regel?"
            />
          </div>

          {/* Trigger */}
          <div className="rule-editor__section">
            <h3 className="rule-editor__section-title">
              <span className="rule-editor__section-badge">WENN</span>
              Auslöser
            </h3>
            <Select
              label="Trigger-Typ"
              options={TRIGGER_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
              value={triggerType}
              onChange={(v) => {
                setTriggerType(v as TriggerType);
                setTriggerConfig({});
              }}
            />
            
            {triggerType === "status_change" && (
              <Select
                label="Wenn Status wird"
                options={STATUS_OPTIONS}
                value={triggerConfig.toStatus || ""}
                onChange={(v) => setTriggerConfig({ ...triggerConfig, toStatus: v })}
              />
            )}
            
            {triggerType === "time_based" && (
              <Input
                label="Tage warten"
                type="number"
                value={triggerConfig.days || ""}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, days: parseInt(e.target.value) })}
                placeholder="z.B. 5"
              />
            )}
          </div>

          {/* Action */}
          <div className="rule-editor__section">
            <h3 className="rule-editor__section-title">
              <span className="rule-editor__section-badge">DANN</span>
              Aktion
            </h3>
            <Select
              label="Aktion"
              options={ACTION_OPTIONS.map((a) => ({ value: a.value, label: a.label }))}
              value={actionType}
              onChange={(v) => {
                setActionType(v as ActionType);
                setActionConfig({});
              }}
            />
            
            {actionType === "send_email" && (
              <Select
                label="E-Mail Template"
                options={[
                  { value: "genehmigung", label: "Genehmigung erhalten" },
                  { value: "rueckfrage", label: "Rückfrage vom Netzbetreiber" },
                  { value: "erinnerung", label: "Erinnerung" },
                  { value: "willkommen", label: "Willkommen" },
                ]}
                value={actionConfig.template || ""}
                onChange={(v) => setActionConfig({ ...actionConfig, template: v })}
              />
            )}
            
            {actionType === "change_status" && (
              <Select
                label="Neuer Status"
                options={STATUS_OPTIONS}
                value={actionConfig.newStatus || ""}
                onChange={(v) => setActionConfig({ ...actionConfig, newStatus: v })}
              />
            )}
            
            {actionType === "send_notification" && (
              <Input
                label="Nachricht"
                value={actionConfig.message || ""}
                onChange={(e) => setActionConfig({ ...actionConfig, message: e.target.value })}
                placeholder="Benachrichtigungstext"
              />
            )}
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" icon={<Save size={16} />} onClick={handleSave}>
            Speichern
          </Button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const WorkflowAutomation: React.FC = () => {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | undefined>();

  useEffect(() => {
    // Load rules
    const loadRules = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.warn("Automation: Keine Daten"); setRules([]);
      setLoading(false);
    };
    loadRules();
  }, []);

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleEdit = (rule: WorkflowRule) => {
    setEditingRule(rule);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(undefined);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Regel wirklich löschen?")) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleDuplicate = (rule: WorkflowRule) => {
    const newRule: WorkflowRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Kopie)`,
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      lastExecuted: undefined,
    };
    setRules((prev) => [...prev, newRule]);
  };

  const handleSave = (ruleData: Partial<WorkflowRule>) => {
    if (ruleData.id) {
      // Update existing
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleData.id
            ? { ...r, ...ruleData, updatedAt: new Date().toISOString() }
            : r
        )
      );
    } else {
      // Create new
      const newRule: WorkflowRule = {
        id: `rule-${Date.now()}`,
        name: ruleData.name || "Neue Regel",
        description: ruleData.description || "",
        enabled: true,
        trigger: ruleData.trigger!,
        conditions: ruleData.conditions || [],
        actions: ruleData.actions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: 0,
      };
      setRules((prev) => [...prev, newRule]);
    }
    setEditorOpen(false);
    setEditingRule(undefined);
  };

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="automation">
      {/* Header */}
      <div className="automation-header">
        <div className="automation-header__left">
          <h1 className="automation-title">Workflow Automation</h1>
          <p className="automation-subtitle">
            Automatische Regeln für Netzanmeldungen
          </p>
        </div>
        <div className="automation-header__right">
          <Badge variant="success">{activeCount} aktiv</Badge>
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Neue Regel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="automation-stats">
        <Card className="automation-stat">
          <div className="automation-stat__icon" style={{ background: "rgba(212, 168, 67, 0.15)", color: "#D4A843" }}>
            <Zap size={20} />
          </div>
          <div className="automation-stat__content">
            <span className="automation-stat__value">{rules.length}</span>
            <span className="automation-stat__label">Regeln gesamt</span>
          </div>
        </Card>
        <Card className="automation-stat">
          <div className="automation-stat__icon" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>
            <Play size={20} />
          </div>
          <div className="automation-stat__content">
            <span className="automation-stat__value">{activeCount}</span>
            <span className="automation-stat__label">Aktiv</span>
          </div>
        </Card>
        <Card className="automation-stat">
          <div className="automation-stat__icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
            <Clock size={20} />
          </div>
          <div className="automation-stat__content">
            <span className="automation-stat__value">
              {rules.reduce((sum, r) => sum + r.executionCount, 0)}
            </span>
            <span className="automation-stat__label">Ausführungen</span>
          </div>
        </Card>
      </div>

      {/* Rules List */}
      <div className="automation-rules">
        {loading ? (
          <div className="automation-loading">Laden...</div>
        ) : rules.length === 0 ? (
          <div className="automation-empty">
            <Zap size={48} />
            <h3>Noch keine Regeln</h3>
            <p>Erstelle deine erste Automatisierungsregel</p>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Regel erstellen
            </Button>
          </div>
        ) : (
          rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))
        )}
      </div>

      {/* Editor Modal */}
      <RuleEditor
        rule={editingRule}
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingRule(undefined);
        }}
        onSave={handleSave}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins}m`;
  if (diffHours < 24) return `vor ${diffHours}h`;
  if (diffDays === 1) return "Gestern";
  return `vor ${diffDays}d`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const getMockRules = (): WorkflowRule[] => [
  {
    id: "rule-1",
    name: "E-Mail bei Genehmigung",
    description: "Sendet automatisch eine E-Mail an den Kunden wenn die Netzanmeldung genehmigt wird",
    enabled: true,
    trigger: { type: "status_change", config: { toStatus: "nb_genehmigt" } },
    conditions: [],
    actions: [{ type: "send_email", config: { template: "genehmigung" } }],
    createdAt: "2024-12-01",
    updatedAt: "2024-12-20",
    executionCount: 47,
    lastExecuted: "2024-12-23T14:30:00",
  },
  {
    id: "rule-2",
    name: "SLA-Warnung",
    description: "Benachrichtigt Admin wenn eine Netzanmeldung länger als 5 Tage auf Antwort wartet",
    enabled: true,
    trigger: { type: "time_based", config: { days: 5, status: "warten_auf_nb" } },
    conditions: [],
    actions: [{ type: "send_notification", config: { message: "SLA-Warnung: Anmeldung wartet seit 5 Tagen" } }],
    createdAt: "2024-12-05",
    updatedAt: "2024-12-18",
    executionCount: 12,
    lastExecuted: "2024-12-22T09:00:00",
  },
  {
    id: "rule-3",
    name: "Auto-Reminder bei Rückfrage",
    description: "Sendet nach 3 Tagen eine Erinnerung wenn Rückfrage unbeantwortet bleibt",
    enabled: true,
    trigger: { type: "time_based", config: { days: 3, status: "nachbesserung" } },
    conditions: [],
    actions: [{ type: "send_email", config: { template: "erinnerung" } }],
    createdAt: "2024-12-10",
    updatedAt: "2024-12-15",
    executionCount: 8,
    lastExecuted: "2024-12-21T10:00:00",
  },
  {
    id: "rule-4",
    name: "Dokument-Benachrichtigung",
    description: "Benachrichtigt Team wenn ein neues Dokument hochgeladen wird",
    enabled: false,
    trigger: { type: "document_upload", config: {} },
    conditions: [],
    actions: [{ type: "send_notification", config: { message: "Neues Dokument hochgeladen" } }],
    createdAt: "2024-12-15",
    updatedAt: "2024-12-15",
    executionCount: 0,
  },
];

export default WorkflowAutomation;
