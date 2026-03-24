/**
 * ZaehlerwechselCenter - Type Definitions
 *
 * Flow: parsed → confirmed → notified | error
 * Installation-Zuordnung ist optional und separat vom Parsen.
 */

export type TerminStatus = 'parsed' | 'confirmed' | 'notified' | 'error';

export interface MatchCandidate {
  installationId: number;
  customerName: string;
  status: string;
  plz?: string;
  ort?: string;
  score: number;
}

export interface ParsedTermin {
  id: string;
  rawLine: string;
  customerName: string;
  datum: string;       // YYYY-MM-DD
  uhrzeit: string;     // HH:MM
  status: TerminStatus;
  // Installation-Zuordnung (optional, separat vom Parsen)
  matchCandidates: MatchCandidate[];
  selectedInstallationId: number | null;
  selectedCustomerName: string | null;
  kommentar?: string;
  error?: string;
  notificationResult?: {
    email: boolean;
    whatsapp: boolean;
  };
}

export interface Stats {
  total: number;
  parsed: number;
  confirmed: number;
  notified: number;
  errors: number;
}

export type Step = 'input' | 'review' | 'processing' | 'done';

export interface ZwcState {
  termine: ParsedTermin[];
  parseErrors: string[];
  step: Step;
  processingIndex: number;
  rawText: string;
  selectedTerminId: string | null;
}

export type ZwcAction =
  | { type: 'SET_RAW_TEXT'; payload: string }
  | { type: 'PARSE_RESULT'; payload: { termine: ParsedTermin[]; errors: string[] } }
  | { type: 'SET_MATCH_CANDIDATES'; payload: { terminId: string; candidates: MatchCandidate[] } }
  | { type: 'SELECT_MATCH'; payload: { terminId: string; installationId: number; customerName: string } }
  | { type: 'CONFIRM_TERMIN'; payload: string }
  | { type: 'CONFIRM_ALL' }
  | { type: 'UNCONFIRM_TERMIN'; payload: string }
  | { type: 'START_PROCESSING' }
  | { type: 'TERMIN_NOTIFIED'; payload: { terminId: string; email: boolean; whatsapp: boolean } }
  | { type: 'TERMIN_ERROR'; payload: { terminId: string; error: string } }
  | { type: 'SET_PROCESSING_INDEX'; payload: number }
  | { type: 'PROCESSING_DONE' }
  | { type: 'SELECT_TERMIN'; payload: string | null }
  | { type: 'RESET' }
  | { type: 'REMOVE_TERMIN'; payload: string }
  | { type: 'SET_KOMMENTAR'; payload: { terminId: string; kommentar: string } };
