export type RuleConditionType =
  | "email_contains"
  | "email_subject"
  | "document_category"
  | "document_name"
  | "status_change";

export interface RuleCondition {
  type: RuleConditionType;
  pattern: string;
  confidence: number;
}

export type RuleAction =
  | "set_status"
  | "set_category"
  | "notify_admin"
  | "assign_installation";

export interface RuleActionDefinition {
  action: RuleAction;
  value: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  conditions: RuleCondition[];
  actions: RuleActionDefinition[];
  enabled: boolean;
  priority: number;
}
