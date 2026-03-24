/**
 * AI Assistant Panel - Admin Only
 * ================================
 * Intelligentes KI-Tool fuer Installationsanalyse und Befehlsausfuehrung
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { apiGet, apiPost } from "../../../api/client";

// ============================================
// TYPES
// ============================================

type AlertSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
type AlertType = "DEADLINE" | "STUCK" | "RUECKFRAGE" | "MISSING_DOCS" | "QUALITY" | "URGENT";

interface Alert {
  installationId: number;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggestedAction?: string;
}

interface SummaryTimeline {
  date: string;
  event: string;
  importance: "LOW" | "MEDIUM" | "HIGH";
}

interface Summary {
  success: boolean;
  currentStatus: string;
  statusSummary: string;
  timeline: SummaryTimeline[];
  nextSteps: string[];
  blockers: string[];
  healthScore: number;
  alerts: Array<{ type: string; message: string; action?: string }>;
}

interface QualityIssue {
  field: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  suggestion?: string;
}

interface Quality {
  success: boolean;
  score: number;
  issues: QualityIssue[];
  missingData: string[];
  readyForSubmission: boolean;
}

interface ErstellerInfo {
  name?: string;
  phone?: string;
  hasWhatsApp: boolean;
}

interface Insights {
  summary: Summary | null;
  quality: Quality | null;
  alerts: Alert[];
  erstellerInfo: ErstellerInfo;
}

interface AssistantAction {
  type: string;
  message?: string;
  whatsappMessage?: string;
}

interface ExecutedAction {
  type: string;
  success: boolean;
  result?: string;
  error?: string;
}

interface AssistantResponse {
  success: boolean;
  interpretation: string;
  actions: AssistantAction[];
  response: string;
  executedActions?: ExecutedAction[];
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
  executedActions?: ExecutedAction[];
  timestamp: Date;
}

// ============================================
// ICONS (inline SVGs, 18x18, stroke)
// ============================================

const AipIcons = {
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  ),
  BarChart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  MessageSquare: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  ClipboardList: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="12" y1="11" x2="16" y2="11" />
      <line x1="12" y1="16" x2="16" y2="16" />
      <line x1="8" y1="11" x2="8.01" y2="11" />
      <line x1="8" y1="16" x2="8.01" y2="16" />
    </svg>
  ),
  ShieldAlert: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  AlertOctagon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  XCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  Info: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Smartphone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Lightbulb: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  ),
  RefreshCw: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

// ============================================
// STYLES (formatted)
// ============================================

const styles = `
/* === Panel Container === */
.aip-panel {
  background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(56,189,248,0.06));
  border: 2px solid rgba(139,92,246,0.4);
  border-radius: 16px;
  overflow: hidden;
  min-height: 200px;
  box-shadow: 0 0 20px rgba(139,92,246,0.2);
}

/* === Header === */
.aip-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(139,92,246,0.15);
}
.aip-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(56,189,248,0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0d878;
}
.aip-header-title {
  flex: 1;
}
.aip-header-title h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
}
.aip-header-title p {
  margin: 4px 0 0;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
}

/* === Tabs === */
.aip-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(0,0,0,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.aip-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  transition: 0.15s;
}
.aip-tab:hover {
  color: rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.04);
}
.aip-tab--active {
  background: rgba(139,92,246,0.15);
  border-color: rgba(139,92,246,0.3);
  color: #f0d878;
}

/* === Body === */
.aip-body {
  padding: 16px 18px;
}

/* === Loading === */
.aip-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(255,255,255,0.5);
}
.aip-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(139,92,246,0.2);
  border-top-color: #f0d878;
  border-radius: 50%;
  animation: aip-spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes aip-spin {
  to { transform: rotate(360deg); }
}

/* === Sections === */
.aip-section {
  margin-bottom: 20px;
}
.aip-section:last-child {
  margin-bottom: 0;
}
.aip-section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === Score === */
.aip-score {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  margin-bottom: 16px;
}
.aip-score-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  font-family: monospace;
  position: relative;
}
.aip-score-circle::before {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 3px solid transparent;
}
.aip-score--good {
  background: rgba(34,197,94,0.15);
  color: #22c55e;
}
.aip-score--good::before {
  border-color: rgba(34,197,94,0.3);
}
.aip-score--medium {
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
}
.aip-score--medium::before {
  border-color: rgba(251,191,36,0.3);
}
.aip-score--bad {
  background: rgba(239,68,68,0.15);
  color: #ef4444;
}
.aip-score--bad::before {
  border-color: rgba(239,68,68,0.3);
}
.aip-score-info {
  flex: 1;
}
.aip-score-label {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 4px;
}
.aip-score-text {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
}

/* === Alerts === */
.aip-alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.aip-alert {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid;
}
.aip-alert--critical {
  background: rgba(239,68,68,0.1);
  border-color: rgba(239,68,68,0.3);
}
.aip-alert--error {
  background: rgba(249,115,22,0.1);
  border-color: rgba(249,115,22,0.3);
}
.aip-alert--warning {
  background: rgba(251,191,36,0.1);
  border-color: rgba(251,191,36,0.3);
}
.aip-alert--info {
  background: rgba(56,189,248,0.1);
  border-color: rgba(56,189,248,0.3);
}
.aip-alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.aip-alert-icon {
  display: flex;
  align-items: center;
}
.aip-alert-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
}
.aip-alert-message {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  line-height: 1.4;
}
.aip-alert-action {
  font-size: 11px;
  color: #f0d878;
  margin-top: 6px;
  font-weight: 500;
}

/* === Lists === */
.aip-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.aip-list li {
  padding: 8px 12px;
  background: rgba(0,0,0,0.15);
  border-radius: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  color: rgba(255,255,255,0.85);
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.aip-list li:last-child {
  margin-bottom: 0;
}
.aip-list-icon {
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
}

/* === Timeline === */
.aip-timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.aip-timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.aip-timeline-item:last-child {
  border-bottom: none;
}
.aip-timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}
.aip-timeline-dot--high {
  background: #ef4444;
}
.aip-timeline-dot--medium {
  background: #fbbf24;
}
.aip-timeline-dot--low {
  background: #22c55e;
}
.aip-timeline-content {
  flex: 1;
  min-width: 0;
}
.aip-timeline-date {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  font-family: monospace;
}
.aip-timeline-event {
  font-size: 13px;
  color: rgba(255,255,255,0.85);
  margin-top: 2px;
}

/* === Chat === */
.aip-chat {
  display: flex;
  flex-direction: column;
  height: 400px;
}
.aip-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(0,0,0,0.15);
  border-radius: 10px;
  margin-bottom: 12px;
}
.aip-chat-empty {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255,255,255,0.4);
}
.aip-chat-empty-icon {
  margin-bottom: 8px;
  opacity: 0.5;
  display: flex;
  justify-content: center;
}
.aip-chat-msg {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 85%;
}
.aip-chat-msg--user {
  align-self: flex-end;
  background: rgba(139,92,246,0.15);
  border: 1px solid rgba(139,92,246,0.25);
}
.aip-chat-msg--assistant {
  align-self: flex-start;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
}
.aip-chat-msg-role {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.4);
  margin-bottom: 6px;
}
.aip-chat-msg-content {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255,255,255,0.9);
  white-space: pre-wrap;
  word-break: break-word;
}
.aip-chat-msg-actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.aip-chat-msg-action {
  padding: 8px 12px;
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}
.aip-chat-msg-action-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.aip-chat-msg-action-type {
  font-weight: 600;
  color: #f0d878;
  display: flex;
  align-items: center;
  gap: 4px;
}
.aip-chat-msg-action-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.aip-chat-msg-action-status--success {
  background: rgba(34,197,94,0.2);
  color: #22c55e;
}
.aip-chat-msg-action-status--pending {
  background: rgba(251,191,36,0.2);
  color: #fbbf24;
}
.aip-chat-msg-action-status--error {
  background: rgba(239,68,68,0.2);
  color: #ef4444;
}
.aip-chat-msg-action-message {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
}
.aip-chat-msg-action-whatsapp {
  background: rgba(37,211,102,0.1);
  border: 1px solid rgba(37,211,102,0.2);
  padding: 10px;
  border-radius: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.85);
  white-space: pre-wrap;
}

/* === Chat Input === */
.aip-chat-input {
  display: flex;
  gap: 10px;
}
.aip-chat-textarea {
  flex: 1;
  resize: none;
  padding: 12px 16px;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 12px;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  line-height: 1.4;
  min-height: 60px;
}
.aip-chat-textarea:focus {
  outline: none;
  border-color: rgba(139,92,246,0.5);
}
.aip-chat-textarea::placeholder {
  color: rgba(255,255,255,0.3);
}
.aip-chat-submit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #EAD068, #D4A843);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
  align-self: flex-end;
}
.aip-chat-submit:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
.aip-chat-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.aip-chat-execute {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 8px;
  font-size: 12px;
  color: #22c55e;
  cursor: pointer;
  transition: 0.15s;
  margin-top: 8px;
}
.aip-chat-execute:hover {
  background: rgba(34,197,94,0.2);
}

/* === Ersteller === */
.aip-ersteller {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(0,0,0,0.15);
  border-radius: 10px;
  margin-bottom: 12px;
}
.aip-ersteller-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(37,211,102,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #25d366;
}
.aip-ersteller-info {
  flex: 1;
}
.aip-ersteller-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
}
.aip-ersteller-phone {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  font-family: monospace;
}
.aip-ersteller-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.aip-ersteller-badge--connected {
  background: rgba(37,211,102,0.15);
  color: #25d366;
  border: 1px solid rgba(37,211,102,0.3);
}
.aip-ersteller-badge--disconnected {
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
  border: 1px solid rgba(251,191,36,0.3);
}

/* === Suggestions === */
.aip-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.aip-suggestion {
  padding: 8px 12px;
  background: rgba(139,92,246,0.08);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  transition: 0.15s;
}
.aip-suggestion:hover {
  background: rgba(139,92,246,0.15);
  border-color: rgba(139,92,246,0.35);
  color: #f0d878;
}

/* === Empty State === */
.aip-empty {
  text-align: center;
  padding: 32px 20px;
  color: rgba(255,255,255,0.4);
}

/* === Quality Issues === */
.aip-quality-issues {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.aip-quality-issue {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0,0,0,0.15);
  border-radius: 8px;
}
.aip-quality-issue-severity {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.aip-quality-issue-severity--critical {
  background: #ef4444;
}
.aip-quality-issue-severity--high {
  background: #f97316;
}
.aip-quality-issue-severity--medium {
  background: #fbbf24;
}
.aip-quality-issue-severity--low {
  background: #22c55e;
}
.aip-quality-issue-content {
  flex: 1;
}
.aip-quality-issue-field {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  margin-bottom: 2px;
}
.aip-quality-issue-message {
  font-size: 12px;
  color: rgba(255,255,255,0.85);
}
.aip-quality-issue-suggestion {
  font-size: 11px;
  color: #f0d878;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* === Refresh Button === */
.aip-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(139,92,246,0.3);
  border-radius: 8px;
  color: #f0d878;
  font-size: 12px;
  cursor: pointer;
  transition: 0.15s;
}
.aip-refresh:hover {
  background: rgba(139,92,246,0.1);
}
`;

// ============================================
// MAIN COMPONENT
// ============================================

interface AIAssistantPanelProps {
  installationId: number;
  publicId: string;
}

export default function AIAssistantPanel({ installationId, publicId }: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "assistant">("overview");
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assistant State
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingActions, setPendingActions] = useState<AssistantAction[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Insights
  const loadInsights = useCallback(async () => {
    if (!installationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/claude-ai/installation/${installationId}/insights`);
      if (res?.success && res.data) {
        setInsights(res.data);
      } else {
        setError("Insights konnten nicht geladen werden");
      }
    } catch (err) {
      console.error("[AIAssistantPanel] loadInsights failed", err);
      setError("Fehler beim Laden der KI-Insights");
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  // Send Command
  const sendCommand = async (execute: boolean = false) => {
    if (!input.trim() || sending) return;

    const userMsg: ConversationMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setPendingActions([]);

    try {
      const res = await apiPost(`/claude-ai/installation/${installationId}/assistant`, {
        command: userMsg.content,
        execute,
      });

      if (res?.success && res.data) {
        const data = res.data as AssistantResponse;
        const assistantMsg: ConversationMessage = {
          role: "assistant",
          content: data.response,
          actions: data.actions,
          executedActions: data.executedActions,
          timestamp: new Date(),
        };
        setConversation((prev) => [...prev, assistantMsg]);

        // Store pending actions for execution
        if (!execute && data.actions?.length > 0) {
          setPendingActions(data.actions);
        }
      } else {
        setConversation((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Entschuldigung, bei der Verarbeitung ist ein Fehler aufgetreten.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error("[AIAssistantPanel] sendCommand failed", err);
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Verbindungsfehler. Bitte versuche es erneut.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Execute Pending Actions
  const executePendingActions = async () => {
    if (pendingActions.length === 0 || sending) return;

    const lastUserMsg = [...conversation].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    setSending(true);
    try {
      const res = await apiPost(`/claude-ai/installation/${installationId}/assistant`, {
        command: lastUserMsg.content,
        execute: true,
      });

      if (res?.success && res.data) {
        const data = res.data as AssistantResponse;
        const executionMsg: ConversationMessage = {
          role: "assistant",
          content: "Aktionen wurden ausgeführt.",
          executedActions: data.executedActions,
          timestamp: new Date(),
        };
        setConversation((prev) => [...prev, executionMsg]);
        setPendingActions([]);

        // Refresh insights after execution
        loadInsights();
      }
    } catch (err) {
      console.error("[AIAssistantPanel] executePendingActions failed", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCommand(false);
    }
  };

  const useSuggestion = (text: string) => {
    setInput(text);
  };

  // Helpers
  const getScoreClass = (score: number) => {
    if (score >= 70) return "aip-score--good";
    if (score >= 40) return "aip-score--medium";
    return "aip-score--bad";
  };

  const getAlertIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "CRITICAL": return <AipIcons.AlertOctagon />;
      case "ERROR": return <AipIcons.XCircle />;
      case "WARNING": return <AipIcons.AlertTriangle />;
      default: return <AipIcons.Info />;
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("49") && cleaned.length > 10) {
      return `+49 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  // Command Suggestions
  const suggestions = [
    "Fasse den aktuellen Status zusammen",
    "Was fehlt noch für die Genehmigung?",
    "Kontaktiere den Ersteller: Wir brauchen die Zählernummer",
    "Welche Dokumente fehlen?",
    "Erstelle eine WhatsApp-Nachricht für fehlende Unterlagen",
  ];

  return (
    <div className="aip-panel">
      <style>{styles}</style>

      {/* Header */}
      <div className="aip-header">
        <div className="aip-header-icon"><AipIcons.Sparkles /></div>
        <div className="aip-header-title">
          <h3>KI-Assistent</h3>
          <p>Installation {publicId} &bull; Nur für Admins</p>
        </div>
        <button className="aip-refresh" onClick={loadInsights} disabled={loading}>
          {loading ? "..." : <><AipIcons.RefreshCw /> Aktualisieren</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="aip-tabs">
        <button
          className={`aip-tab ${activeTab === "overview" ? "aip-tab--active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <AipIcons.BarChart /> Übersicht
        </button>
        <button
          className={`aip-tab ${activeTab === "assistant" ? "aip-tab--active" : ""}`}
          onClick={() => setActiveTab("assistant")}
        >
          <AipIcons.MessageSquare /> Assistent
        </button>
      </div>

      {/* Body */}
      <div className="aip-body">
        {loading && !insights ? (
          <div className="aip-loading">
            <div className="aip-loading-spinner" />
            <span>KI analysiert Installation...</span>
          </div>
        ) : error ? (
          <div className="aip-empty">
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
              <AipIcons.AlertTriangle />
            </div>
            <div>{error}</div>
          </div>
        ) : activeTab === "overview" ? (
          // ============================================
          // OVERVIEW TAB
          // ============================================
          <>
            {/* Ersteller Info */}
            {insights?.erstellerInfo && (
              <div className="aip-ersteller">
                <div className="aip-ersteller-icon"><AipIcons.User /></div>
                <div className="aip-ersteller-info">
                  <div className="aip-ersteller-name">
                    {insights.erstellerInfo.name || "Ersteller"}
                  </div>
                  <div className="aip-ersteller-phone">
                    {formatPhone(insights.erstellerInfo.phone) || "Keine Telefonnummer"}
                  </div>
                </div>
                <span
                  className={`aip-ersteller-badge ${
                    insights.erstellerInfo.hasWhatsApp
                      ? "aip-ersteller-badge--connected"
                      : "aip-ersteller-badge--disconnected"
                  }`}
                >
                  {insights.erstellerInfo.hasWhatsApp ? (
                    <><AipIcons.CheckCircle /> WhatsApp</>
                  ) : (
                    "Kein WhatsApp"
                  )}
                </span>
              </div>
            )}

            {/* Scores */}
            <div className="aip-score">
              <div className={`aip-score-circle ${getScoreClass(insights?.summary?.healthScore || 0)}`}>
                {insights?.summary?.healthScore || 0}
              </div>
              <div className="aip-score-info">
                <div className="aip-score-label">Health Score</div>
                <div className="aip-score-text">
                  {insights?.summary?.statusSummary || "Keine Zusammenfassung verfügbar"}
                </div>
              </div>
            </div>

            {insights?.quality && (
              <div className="aip-score" style={{ marginTop: -8 }}>
                <div className={`aip-score-circle ${getScoreClass(insights.quality.score)}`}>
                  {insights.quality.score}
                </div>
                <div className="aip-score-info">
                  <div className="aip-score-label">Qualitätsscore</div>
                  <div className="aip-score-text">
                    {insights.quality.readyForSubmission
                      ? "Bereit zur Einreichung"
                      : `${insights.quality.issues.length} Probleme gefunden`}
                  </div>
                </div>
              </div>
            )}

            {/* Alerts */}
            {insights?.alerts && insights.alerts.length > 0 && (
              <div className="aip-section">
                <div className="aip-section-title">
                  <AipIcons.Bell /> Alerts ({insights.alerts.length})
                </div>
                <div className="aip-alerts">
                  {insights.alerts.slice(0, 5).map((alert, idx) => (
                    <div
                      key={idx}
                      className={`aip-alert aip-alert--${alert.severity.toLowerCase()}`}
                    >
                      <div className="aip-alert-header">
                        <span className="aip-alert-icon">{getAlertIcon(alert.severity)}</span>
                        <span className="aip-alert-title">{alert.title}</span>
                      </div>
                      <div className="aip-alert-message">{alert.message}</div>
                      {alert.suggestedAction && (
                        <div className="aip-alert-action">&rarr; {alert.suggestedAction}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {insights?.summary?.nextSteps && insights.summary.nextSteps.length > 0 && (
              <div className="aip-section">
                <div className="aip-section-title">
                  <AipIcons.ClipboardList /> Nächste Schritte
                </div>
                <ul className="aip-list">
                  {insights.summary.nextSteps.map((step, idx) => (
                    <li key={idx}>
                      <span className="aip-list-icon">&bull;</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Blockers */}
            {insights?.summary?.blockers && insights.summary.blockers.length > 0 && (
              <div className="aip-section">
                <div className="aip-section-title">
                  <AipIcons.ShieldAlert /> Blockaden
                </div>
                <ul className="aip-list">
                  {insights.summary.blockers.map((blocker, idx) => (
                    <li key={idx} style={{ background: "rgba(239,68,68,0.1)" }}>
                      <span className="aip-list-icon"><AipIcons.AlertTriangle /></span>
                      {blocker}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quality Issues */}
            {insights?.quality?.issues && insights.quality.issues.length > 0 && (
              <div className="aip-section">
                <div className="aip-section-title">
                  <AipIcons.Search /> Qualitätsprobleme
                </div>
                <div className="aip-quality-issues">
                  {insights.quality.issues.slice(0, 5).map((issue, idx) => (
                    <div key={idx} className="aip-quality-issue">
                      <div
                        className={`aip-quality-issue-severity aip-quality-issue-severity--${issue.severity.toLowerCase()}`}
                      />
                      <div className="aip-quality-issue-content">
                        <div className="aip-quality-issue-field">{issue.field}</div>
                        <div className="aip-quality-issue-message">{issue.message}</div>
                        {issue.suggestion && (
                          <div className="aip-quality-issue-suggestion">
                            <AipIcons.Lightbulb /> {issue.suggestion}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {insights?.summary?.timeline && insights.summary.timeline.length > 0 && (
              <div className="aip-section">
                <div className="aip-section-title">
                  <AipIcons.Clock /> Timeline
                </div>
                <div className="aip-timeline">
                  {insights.summary.timeline.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="aip-timeline-item">
                      <div className={`aip-timeline-dot aip-timeline-dot--${item.importance.toLowerCase()}`} />
                      <div className="aip-timeline-content">
                        <div className="aip-timeline-date">{item.date}</div>
                        <div className="aip-timeline-event">{item.event}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // ============================================
          // ASSISTANT TAB
          // ============================================
          <div className="aip-chat">
            {/* Suggestions */}
            {conversation.length === 0 && (
              <div className="aip-suggestions">
                {suggestions.map((s, idx) => (
                  <button key={idx} className="aip-suggestion" onClick={() => useSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="aip-chat-messages">
              {conversation.length === 0 ? (
                <div className="aip-chat-empty">
                  <div className="aip-chat-empty-icon"><AipIcons.MessageSquare /></div>
                  <div>Stelle eine Frage oder gib einen Befehl ein.</div>
                  <div style={{ fontSize: 11, marginTop: 8 }}>
                    Beispiel: "Kontaktiere den Ersteller: Wir brauchen die Zählernummer"
                  </div>
                </div>
              ) : (
                conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`aip-chat-msg aip-chat-msg--${msg.role}`}
                  >
                    <div className="aip-chat-msg-role">
                      {msg.role === "user" ? "Du" : "KI-Assistent"}
                    </div>
                    <div className="aip-chat-msg-content">{msg.content}</div>

                    {/* Actions */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="aip-chat-msg-actions">
                        {msg.actions.map((action, aidx) => (
                          <div key={aidx} className="aip-chat-msg-action">
                            <div className="aip-chat-msg-action-header">
                              <span className="aip-chat-msg-action-type">
                                {action.type === "SEND_WHATSAPP" && <AipIcons.Smartphone />}
                                {action.type}
                              </span>
                              {!msg.executedActions && (
                                <span className="aip-chat-msg-action-status aip-chat-msg-action-status--pending">
                                  Ausstehend
                                </span>
                              )}
                            </div>
                            {action.message && (
                              <div className="aip-chat-msg-action-message">{action.message}</div>
                            )}
                            {action.whatsappMessage && (
                              <div className="aip-chat-msg-action-whatsapp">
                                <strong>WhatsApp-Nachricht:</strong>
                                <br />
                                {action.whatsappMessage}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Executed Actions */}
                    {msg.executedActions && msg.executedActions.length > 0 && (
                      <div className="aip-chat-msg-actions">
                        {msg.executedActions.map((ea, eaidx) => (
                          <div key={eaidx} className="aip-chat-msg-action">
                            <div className="aip-chat-msg-action-header">
                              <span className="aip-chat-msg-action-type">{ea.type}</span>
                              <span
                                className={`aip-chat-msg-action-status aip-chat-msg-action-status--${
                                  ea.success ? "success" : "error"
                                }`}
                              >
                                {ea.success ? "Erfolgreich" : "Fehlgeschlagen"}
                              </span>
                            </div>
                            {ea.result && (
                              <div className="aip-chat-msg-action-message">{ea.result}</div>
                            )}
                            {ea.error && (
                              <div className="aip-chat-msg-action-message" style={{ color: "#ef4444" }}>
                                {ea.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Execute Button */}
            {pendingActions.length > 0 && (
              <button
                className="aip-chat-execute"
                onClick={executePendingActions}
                disabled={sending}
              >
                <AipIcons.Play />
                <span>
                  {pendingActions.length} Aktion{pendingActions.length > 1 ? "en" : ""} ausführen
                </span>
              </button>
            )}

            {/* Input */}
            <div className="aip-chat-input">
              <textarea
                className="aip-chat-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Befehl eingeben... (z.B. 'Kontaktiere den Ersteller wegen Zählernummer')"
                disabled={sending}
              />
              <button
                className="aip-chat-submit"
                onClick={() => sendCommand(false)}
                disabled={!input.trim() || sending}
              >
                {sending ? "..." : <><AipIcons.Send /> Senden</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
