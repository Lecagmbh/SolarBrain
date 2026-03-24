import type { EmailEntry } from "../types";
import { STATUS_RULES } from "./statusRules";
import type { AutoStatus } from "./statusRules";

export interface AutoStatusResult {
  status: AutoStatus;
  confidence: number;
  rule?: string;
}

export function detectStatusFromEmail(email: EmailEntry): AutoStatusResult {
  const text = `${email.subject}\n${email.bodyText ?? ""}`.toLowerCase();

  let best: AutoStatusResult = {
    status: "unknown",
    confidence: 0,
  };

  for (const rule of STATUS_RULES) {
    if (rule.match.test(text)) {
      if (rule.confidence > best.confidence) {
        best = {
          status: rule.status,
          confidence: rule.confidence,
          rule: rule.description,
        };
      }
    }
  }

  return best;
}
