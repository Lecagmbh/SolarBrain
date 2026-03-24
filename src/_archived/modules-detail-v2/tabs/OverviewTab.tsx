import { useMemo, useState, useEffect, useCallback } from "react";
import { useDetail } from "../context/DetailContext";
import { apiGet, apiPost, apiPatch } from "../../../api/client";
import { useIsAdmin } from "../../../../pages/AuthContext";
import AIAssistantPanel from "../components/AIAssistantPanel";

const DEBUG = true;

/* ═══════════════════ CASE TYPE LABELS ═══════════════════ */
const CASE_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  PV_PRIVATE: { label: "PV-Anlage (Privat)", icon: "☀️", color: "#fbbf24" },
  PV_COMMERCIAL: { label: "PV-Anlage (Gewerbe)", icon: "🏭", color: "#f59e0b" },
  PV_WITH_STORAGE: { label: "PV + Speicher", icon: "🔋", color: "#10b981" },
  PV_MOD_EXPANSION: { label: "PV Modul-Erweiterung", icon: "⚡", color: "#EAD068" },
  STORAGE_RETROFIT: { label: "Speicher-Nachrüstung", icon: "🔌", color: "#06b6d4" },
  WALLBOX: { label: "Wallbox", icon: "🚗", color: "#ec4899" },
  HEAT_PUMP: { label: "Wärmepumpe", icon: "🌡️", color: "#f97316" },
  FULL_SYSTEM: { label: "Komplettsystem", icon: "🏠", color: "#a855f7" },
};

function getCaseTypeInfo(caseType?: string) {
  if (!caseType) return { label: "Unbekannt", icon: "❓", color: "#64748b" };
  return CASE_TYPE_LABELS[caseType] || { label: caseType, icon: "📋", color: "#64748b" };
}

/* ═══════════════════ ICONS ═══════════════════ */
const Icons = {
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  MapPin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Sun: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Battery: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="13" x2="23" y2="11"/></svg>,
  Car: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  Thermometer: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  Grid: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Compass: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  Calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  MessageCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  Meter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Plug: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22v-5"/><path d="M9 7V2"/><path d="M15 7V2"/><rect x="6" y="7" width="12" height="5" rx="2"/><path d="M8 12v5a4 4 0 0 0 8 0v-5"/></svg>,
  Globe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

/* ═══════════════════ STYLES ═══════════════════ */
const styles = `
.ov-root{--ov-card-bg:rgba(30,41,59,0.5);--ov-card-border:rgba(71,85,105,0.3);--ov-accent:rgb(56,189,248);--ov-accent-dim:rgba(56,189,248,0.12);--ov-success:rgb(34,197,94);--ov-success-dim:rgba(34,197,94,0.12);--ov-warning:rgb(251,191,36);--ov-warning-dim:rgba(251,191,36,0.12);--ov-purple:rgb(168,85,247);--ov-purple-dim:rgba(168,85,247,0.12);--ov-text:rgba(255,255,255,0.92);--ov-text-muted:rgba(255,255,255,0.6);--ov-text-dim:rgba(255,255,255,0.4);--ov-radius:16px;--ov-radius-sm:10px;padding:0}
.ov-debug{margin:-20px -24px 20px;padding:16px 20px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);font-family:monospace;font-size:11px;color:rgba(255,255,255,0.8);overflow:auto;max-height:300px}
.ov-debug summary{cursor:pointer;font-weight:600;color:rgb(239,68,68);margin-bottom:8px}
.ov-debug pre{margin:0;white-space:pre-wrap;word-break:break-all}
.ov-kpi-header{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;padding:20px;background:linear-gradient(135deg,rgba(56,189,248,0.06),rgba(139,92,246,0.04),rgba(236,72,153,0.03));border-bottom:1px solid var(--ov-card-border);margin:-20px -24px 20px}
.ov-kpi{display:flex;flex-direction:column;gap:6px;padding:14px 16px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:var(--ov-radius-sm);transition:0.2s}
.ov-kpi:hover{background:rgba(0,0,0,0.25);transform:translateY(-2px)}
.ov-kpi-icon{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;margin-bottom:4px}
.ov-kpi-icon--pv{background:var(--ov-warning-dim);color:var(--ov-warning)}
.ov-kpi-icon--wr{background:var(--ov-accent-dim);color:var(--ov-accent)}
.ov-kpi-icon--storage{background:var(--ov-success-dim);color:var(--ov-success)}
.ov-kpi-icon--hybrid{background:var(--ov-purple-dim);color:var(--ov-purple)}
.ov-kpi-icon--wallbox{background:rgba(236,72,153,0.12);color:rgb(236,72,153)}
.ov-kpi-icon--heatpump{background:rgba(249,115,22,0.12);color:rgb(249,115,22)}
.ov-kpi-label{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;color:var(--ov-text-dim)}
.ov-kpi-value{font-size:20px;font-weight:800;font-family:monospace;color:var(--ov-text)}
.ov-kpi-value--small{font-size:15px}
.ov-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
@media(max-width:1100px){.ov-grid{grid-template-columns:1fr}}
.ov-card{background:var(--ov-card-bg);border:1px solid var(--ov-card-border);border-radius:var(--ov-radius);overflow:hidden;transition:0.2s}
.ov-card:hover{border-color:rgba(71,85,105,0.5);box-shadow:0 8px 32px rgba(0,0,0,0.15)}
.ov-card--wide{grid-column:1/-1}
.ov-card-header{display:flex;align-items:center;gap:10px;padding:14px 18px;background:rgba(0,0,0,0.15);border-bottom:1px solid rgba(255,255,255,0.05)}
.ov-card-icon{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:var(--ov-accent-dim);color:var(--ov-accent)}
.ov-card-icon--warning{background:var(--ov-warning-dim);color:var(--ov-warning)}
.ov-card-icon--success{background:var(--ov-success-dim);color:var(--ov-success)}
.ov-card-icon--purple{background:var(--ov-purple-dim);color:var(--ov-purple)}
.ov-card-title{flex:1;font-size:14px;font-weight:700;color:var(--ov-text);margin:0}
.ov-card-badge{min-width:22px;height:22px;padding:0 7px;background:var(--ov-accent-dim);border:1px solid rgba(56,189,248,0.25);border-radius:11px;font-size:11px;font-weight:700;color:var(--ov-accent);display:flex;align-items:center;justify-content:center}
.ov-card-body{padding:16px 18px}
.ov-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.ov-field{display:flex;flex-direction:column;gap:4px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.ov-field:last-child{border-bottom:none}
.ov-field--wide{grid-column:1/-1}
.ov-field-label{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;color:var(--ov-text-dim)}
.ov-field-value{font-size:14px;font-weight:500;color:var(--ov-text);word-break:break-word}
.ov-field-value--mono{font-family:monospace}
.ov-field-value--muted{color:var(--ov-text-muted);font-style:italic}
.ov-field-value--link{color:var(--ov-accent);text-decoration:none}
.ov-field-value--link:hover{text-decoration:underline}
.ov-entries{list-style:none;margin:0;padding:0}
.ov-entry{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;margin:0 -18px;background:rgba(0,0,0,0.1);border-bottom:1px solid rgba(255,255,255,0.03)}
.ov-entry:first-child{margin-top:-16px}
.ov-entry:last-child{margin-bottom:-16px;border-bottom:none}
.ov-entry:hover{background:rgba(0,0,0,0.15)}
.ov-entry-main{flex:1;min-width:0}
.ov-entry-name{display:block;font-size:13px;font-weight:600;color:var(--ov-text)}
.ov-entry-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.ov-entry-tag{padding:2px 8px;background:rgba(255,255,255,0.05);border-radius:4px;font-size:11px;font-weight:500;color:var(--ov-text-muted)}
.ov-entry-tag--accent{background:var(--ov-accent-dim);color:var(--ov-accent)}
.ov-entry-tag--hybrid{background:var(--ov-purple-dim);color:var(--ov-purple)}
.ov-entry-tag--success{background:var(--ov-success-dim);color:var(--ov-success)}
.ov-entry-value{padding:6px 12px;background:linear-gradient(135deg,rgba(56,189,248,0.1),rgba(139,92,246,0.08));border:1px solid rgba(56,189,248,0.2);border-radius:8px;font-size:13px;font-weight:700;font-family:monospace;color:var(--ov-accent)}
.ov-pill{display:inline-flex;padding:4px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-size:12px;font-weight:500;color:var(--ov-text-muted)}
.ov-pill--accent{background:var(--ov-accent-dim);border-color:rgba(56,189,248,0.25);color:var(--ov-accent)}
.ov-pill--success{background:var(--ov-success-dim);border-color:rgba(34,197,94,0.25);color:var(--ov-success)}
.ov-casetype-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(0,0,0,0.2);border:1px solid;border-radius:10px;font-size:13px;font-weight:600}
.ov-casetype-icon{font-size:18px;line-height:1}
.ov-subcontractor-notice{padding:8px 12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:8px;font-size:12px;color:#fbbf24;margin-top:8px}
.ov-subcontractor-empty{padding:16px;text-align:center;color:var(--ov-text-dim);font-size:13px}
.ov-chat-section{margin-top:8px}
.ov-chat-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.ov-chat-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:var(--ov-text)}
.ov-chat-phone{font-size:12px;font-weight:400;color:var(--ov-accent);font-family:monospace}
.ov-chat-no-phone{font-size:12px;color:var(--ov-warning)}
.ov-chat-messages{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;margin-bottom:14px;padding:12px;background:rgba(0,0,0,0.15);border-radius:10px;border:1px solid rgba(255,255,255,0.04)}
.ov-chat-empty{text-align:center;padding:24px;color:var(--ov-text-dim);font-size:13px}
.ov-chat-msg{padding:10px 14px;border-radius:10px;max-width:85%;font-size:13px;line-height:1.45}
.ov-chat-msg--out{align-self:flex-end;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.25)}
.ov-chat-msg--in{align-self:flex-start;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)}
.ov-chat-msg--system{align-self:flex-end;background:rgba(100,116,139,0.15);border:1px solid rgba(100,116,139,0.25)}
.ov-chat-msg-meta{display:flex;justify-content:space-between;gap:12px;font-size:10px;color:var(--ov-text-dim);margin-bottom:4px}
.ov-chat-msg-content{white-space:pre-wrap;word-break:break-word;color:var(--ov-text)}
.ov-chat-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.ov-chat-action{padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:12px;font-weight:500;color:var(--ov-text-muted);cursor:pointer;transition:0.15s}
.ov-chat-action:hover:not(:disabled){background:rgba(56,189,248,0.1);border-color:rgba(56,189,248,0.3);color:var(--ov-accent)}
.ov-chat-action:disabled{opacity:0.5;cursor:not-allowed}
.ov-chat-input{display:flex;gap:10px}
.ov-chat-input textarea{flex:1;resize:none;padding:10px 14px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:var(--ov-text);font-size:13px;line-height:1.4}
.ov-chat-input textarea:focus{outline:none;border-color:rgba(56,189,248,0.4)}
.ov-chat-input textarea::placeholder{color:var(--ov-text-dim)}
.ov-chat-send{padding:10px 16px;background:var(--ov-accent);border:none;border-radius:10px;color:#000;font-size:13px;font-weight:600;cursor:pointer;transition:0.15s;align-self:flex-end}
.ov-chat-send:hover:not(:disabled){filter:brightness(1.1)}
.ov-chat-send:disabled{opacity:0.5;cursor:not-allowed}
.ov-chat-link{font-size:12px;color:var(--ov-accent);cursor:pointer;text-decoration:none}
.ov-chat-link:hover{text-decoration:underline}
.ov-layout{display:flex;gap:20px;align-items:flex-start}
.ov-main{flex:1;min-width:0}
.ov-sidebar{width:380px;flex-shrink:0;position:sticky;top:16px;max-height:calc(100vh - 32px);overflow-y:auto}
.ov-sidebar::-webkit-scrollbar{width:4px}
.ov-sidebar::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:2px}
.ov-sidebar-toggle{display:none;align-items:center;gap:6px;padding:8px 14px;background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(56,189,248,0.08));border:1px solid rgba(139,92,246,0.3);border-radius:10px;color:#f0d878;font-size:12px;font-weight:600;cursor:pointer;transition:0.15s;margin-bottom:12px}
.ov-sidebar-toggle:hover{background:rgba(139,92,246,0.2)}
.ov-sidebar-toggle svg{flex-shrink:0}
@media(max-width:1400px){.ov-layout{flex-direction:column}.ov-sidebar{width:100%;position:static;max-height:none}.ov-sidebar-toggle{display:flex}}
.ov-card--warning{border-color:rgba(251,191,36,0.5);box-shadow:0 0 20px rgba(251,191,36,0.08)}
.ov-card--warning:hover{border-color:rgba(251,191,36,0.6);box-shadow:0 0 28px rgba(251,191,36,0.12)}
.ov-nb-alert{display:flex;align-items:flex-start;gap:8px;padding:10px 14px;border-radius:var(--ov-radius-sm);font-size:12px;font-weight:500;line-height:1.5;margin-bottom:12px}
.ov-nb-alert--warn{background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);color:#fbbf24}
.ov-nb-alert--critical{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171}
.ov-nb-edit-form{padding:14px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.08);border-radius:var(--ov-radius-sm);margin-top:12px}
.ov-nb-input{width:100%;padding:9px 12px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--ov-text);font-size:13px;font-family:inherit;transition:border-color 0.15s}
.ov-nb-input:focus{outline:none;border-color:rgba(56,189,248,0.5)}
.ov-nb-input::placeholder{color:var(--ov-text-dim)}
.ov-nb-form-group{margin-bottom:12px}
.ov-nb-form-label{display:block;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;color:var(--ov-text-dim);margin-bottom:6px}
.ov-nb-actions{display:flex;gap:8px;margin-top:14px}
.ov-nb-btn{padding:8px 16px;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:0.15s}
.ov-nb-btn--save{background:var(--ov-accent);color:#000}
.ov-nb-btn--save:hover:not(:disabled){filter:brightness(1.1)}
.ov-nb-btn--save:disabled{opacity:0.5;cursor:not-allowed}
.ov-nb-btn--cancel{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:var(--ov-text-muted)}
.ov-nb-btn--cancel:hover{background:rgba(255,255,255,0.1)}
.ov-nb-edit-trigger{padding:4px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-size:11px;font-weight:600;color:var(--ov-text-muted);cursor:pointer;transition:0.15s}
.ov-nb-edit-trigger:hover{background:rgba(56,189,248,0.1);border-color:rgba(56,189,248,0.3);color:var(--ov-accent)}
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.ov-card{animation:fadeSlideIn 0.35s ease-out backwards}
.ov-card:nth-child(1){animation-delay:0.02s}.ov-card:nth-child(2){animation-delay:0.04s}.ov-card:nth-child(3){animation-delay:0.06s}.ov-card:nth-child(4){animation-delay:0.08s}.ov-card:nth-child(5){animation-delay:0.1s}.ov-card:nth-child(6){animation-delay:0.12s}.ov-card:nth-child(7){animation-delay:0.14s}.ov-card:nth-child(8){animation-delay:0.16s}
`;

/* ═══════════════════ COMPONENTS ═══════════════════ */
function Field({ label, value, mono, wide }: { label: string; value?: React.ReactNode; mono?: boolean; wide?: boolean }) {
  const isEmpty = value === undefined || value === null || value === "";
  return (
    <div className={`ov-field ${wide ? "ov-field--wide" : ""}`}>
      <div className="ov-field-label">{label}</div>
      <div className={`ov-field-value ${mono ? "ov-field-value--mono" : ""} ${isEmpty ? "ov-field-value--muted" : ""}`}>
        {isEmpty ? "—" : value}
      </div>
    </div>
  );
}

function Card({ title, icon, iconVariant, badge, wide, className, headerRight, children }: {
  title: string;
  icon?: React.ReactNode;
  iconVariant?: "warning" | "success" | "purple";
  badge?: number | string;
  wide?: boolean;
  className?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`ov-card ${wide ? "ov-card--wide" : ""} ${className || ""}`}>
      <div className="ov-card-header">
        {icon && <div className={`ov-card-icon ${iconVariant ? `ov-card-icon--${iconVariant}` : ""}`}>{icon}</div>}
        <h3 className="ov-card-title">{title}</h3>
        {badge !== undefined && <div className="ov-card-badge">{badge}</div>}
        {headerRight}
      </div>
      <div className="ov-card-body">{children}</div>
    </div>
  );
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateString;
  }
}

/* ═══════════════════ BETREIBER CHAT SECTION ═══════════════════ */

type ChatMessage = {
  id: number;
  content: string;
  direction: "INBOUND" | "OUTBOUND";
  senderType: "BETREIBER" | "MITARBEITER" | "SYSTEM";
  createdAt: string;
};

type ChatTemplate = {
  id: number;
  key: string;
  name: string;
  description?: string;
};

function formatChatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Heute ${time}`;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + " " + time;
}

function formatPhoneDisplay(phone: string | undefined) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("49") && cleaned.length > 10) {
    return `+49 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.startsWith("0") && cleaned.length > 4) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return phone;
}

function BetreiberChatSection({ installationId, setActiveTab }: { installationId: number; setActiveTab: (tab: any) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [templates, setTemplates] = useState<ChatTemplate[]>([]);
  const [contactPhone, setContactPhone] = useState<string | undefined>();
  const [hasPhone, setHasPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [msgRes, tmplRes] = await Promise.all([
        apiGet(`/whatsapp/betreiber/${installationId}/messages?limit=5`),
        apiGet("/whatsapp/betreiber/templates?triggerType=MANUAL"),
      ]);
      if (msgRes?.success && msgRes.data) {
        setMessages(msgRes.data.messages || []);
        setHasPhone(msgRes.data.hasPhone || false);
        setContactPhone(msgRes.data.contactPhone);
      }
      if (tmplRes?.success && tmplRes.data) {
        setTemplates(tmplRes.data.slice(0, 4)); // Max 4 quick actions
      }
    } catch (err) {
      console.error("[BetreiberChat] loadData failed", err);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !hasPhone) return;
    setSending(true);
    try {
      const res = await apiPost(`/whatsapp/betreiber/${installationId}/messages`, {
        message: newMessage.trim(),
      });
      if (res?.success) {
        setNewMessage("");
        await loadData();
      }
    } catch (err) {
      console.error("[BetreiberChat] sendMessage failed", err);
    } finally {
      setSending(false);
    }
  };

  const sendTemplate = async (templateKey: string) => {
    if (sending || !hasPhone) return;
    setSending(true);
    try {
      const res = await apiPost(`/whatsapp/betreiber/${installationId}/messages/template`, {
        templateKey,
      });
      if (res?.success) {
        await loadData();
      }
    } catch (err) {
      console.error("[BetreiberChat] sendTemplate failed", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.direction === "INBOUND") return "Betreiber";
    if (msg.senderType === "SYSTEM") return "System";
    return "Mitarbeiter";
  };

  return (
    <div className="ov-chat-section">
      {/* Header */}
      <div className="ov-chat-header">
        <div className="ov-chat-title">
          <span>Kommunikation mit Betreiber</span>
          {hasPhone && contactPhone && (
            <span className="ov-chat-phone">{formatPhoneDisplay(contactPhone)}</span>
          )}
          {!hasPhone && (
            <span className="ov-chat-no-phone">Keine Telefonnummer</span>
          )}
        </div>
        {messages.length > 0 && (
          <span className="ov-chat-link" onClick={() => setActiveTab("communication")}>
            Alle anzeigen →
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="ov-chat-messages">
        {loading ? (
          <div className="ov-chat-empty">Lade...</div>
        ) : messages.length === 0 ? (
          <div className="ov-chat-empty">
            Noch keine Nachrichten.
            {hasPhone && " Senden Sie eine Nachricht an den Betreiber."}
          </div>
        ) : (
          [...messages].reverse().map((msg) => (
            <div
              key={msg.id}
              className={`ov-chat-msg ${
                msg.direction === "INBOUND"
                  ? "ov-chat-msg--in"
                  : msg.senderType === "SYSTEM"
                    ? "ov-chat-msg--system"
                    : "ov-chat-msg--out"
              }`}
            >
              <div className="ov-chat-msg-meta">
                <span>{getSenderLabel(msg)}</span>
                <span>{formatChatTime(msg.createdAt)}</span>
              </div>
              <div className="ov-chat-msg-content">
                {msg.content.length > 150 ? msg.content.slice(0, 150) + "..." : msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {hasPhone && templates.length > 0 && (
        <div className="ov-chat-actions">
          {templates.map((tmpl) => (
            <button
              key={tmpl.key}
              className="ov-chat-action"
              onClick={() => sendTemplate(tmpl.key)}
              disabled={sending}
              title={tmpl.description}
            >
              {tmpl.key === "REQUEST_LAGEPLAN" && "📍 "}
              {tmpl.key === "REQUEST_ZAEHLER" && "📷 "}
              {tmpl.key === "REQUEST_DATENBLATT" && "📄 "}
              {tmpl.key === "GENERAL_STATUS" && "ℹ️ "}
              {tmpl.name}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {hasPhone ? (
        <div className="ov-chat-input">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben... (Enter zum Senden)"
            rows={2}
            disabled={sending}
          />
          <button
            className="ov-chat-send"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? "..." : "Senden"}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--ov-text-dim)", textAlign: "center", padding: "8px 0" }}>
          Um Nachrichten zu senden, muss eine Telefonnummer hinterlegt sein.
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ MASTR MATCH RESULT ROW ═══════════════════ */
function MaStrResultRow({ label, entry }: { label: string; entry: any }) {
  if (!entry) return null;
  return (
    <div style={{ marginTop: 6, fontSize: 12, color: "#374151" }}>
      <span style={{ color: "#6b7280", marginRight: 6 }}>{label}:</span>
      <strong style={{ fontFamily: "monospace" }}>{entry.mastrNr}</strong>
      {entry.mastrName && <> &mdash; {entry.mastrName}</>}
      {entry.bruttoleistungKw ? <> ({entry.bruttoleistungKw} kW)</> : null}
      {entry.matchType === "name" && <span style={{ marginLeft: 6, padding: "1px 6px", background: "#dbeafe", borderRadius: 4, fontSize: 11 }}>Name-Match</span>}
      {entry.matchType === "kwp" && <span style={{ marginLeft: 6, padding: "1px 6px", background: "#fef3c7", borderRadius: 4, fontSize: 11 }}>kWp-Match</span>}
    </div>
  );
}

/* ═══════════════════ MASTR CONFIRM BUTTON ═══════════════════ */
function MaStrConfirmButton({ installId, hasStorage }: { installId: number; hasStorage: boolean }) {
  const [loading, setLoading] = useState(false);
  const { reload } = useDetail();

  const handleConfirm = useCallback(async () => {
    const mastrNrSolar = prompt("MaStR-Nr. Solar (SEE...):");
    if (!mastrNrSolar) return;

    if (!mastrNrSolar.trim().startsWith("SEE")) {
      alert("MaStR-Nr. Solar muss mit 'SEE' beginnen.");
      return;
    }

    let mastrNrSpeicher: string | undefined;
    if (hasStorage) {
      const input = prompt("MaStR-Nr. Speicher (SSE..., optional — leer lassen wenn nicht vorhanden):");
      if (input && input.trim()) {
        if (!input.trim().startsWith("SSE")) {
          alert("MaStR-Nr. Speicher muss mit 'SSE' beginnen.");
          return;
        }
        mastrNrSpeicher = input.trim();
      }
    }

    setLoading(true);
    try {
      await apiPost(`/installations/${installId}/confirm-mastr`, {
        mastrNrSolar: mastrNrSolar.trim(),
        mastrNrSpeicher,
      });
      reload?.();
    } catch (err: any) {
      alert(err?.message || "Fehler beim Bestätigen der MaStR-Registrierung");
    } finally {
      setLoading(false);
    }
  }, [installId, hasStorage, reload]);

  return (
    <div style={{ marginTop: 12, padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
      <button
        onClick={handleConfirm}
        disabled={loading}
        style={{
          padding: "7px 14px",
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          borderRadius: 6,
          cursor: loading ? "wait" : "pointer",
          background: "#16a34a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Wird bestätigt...
          </>
        ) : (
          "MaStR-Registrierung bestätigen"
        )}
      </button>
      <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
        Bestätigt die manuelle MaStR-Eintragung und setzt das IBN-Datum.
      </div>
    </div>
  );
}

/* ═══════════════════ MASTR MATCH BUTTON ═══════════════════ */
function MaStrMatchButton({ publicId }: { publicId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const { reload } = useDetail();

  const handleMatch = useCallback(async () => {
    setState("loading");
    setResult(null);
    try {
      const res = await apiPost(`/mastr/installations/${publicId}/match`, {});
      setResult(res);
      if (res.found) {
        setState("success");
        reload?.();
      } else {
        setState("error");
      }
    } catch (err: any) {
      setResult({ message: err?.message || "Unbekannter Fehler" });
      setState("error");
    }
  }, [publicId, reload]);

  const hasSolarResult = result?.solar?.mastrNr;
  const hasSpeicherResult = result?.speicher?.mastrNr;

  return (
    <div style={{ marginTop: 12, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={handleMatch}
          disabled={state === "loading"}
          style={{
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderRadius: 6,
            cursor: state === "loading" ? "wait" : "pointer",
            background: state === "success" ? "#10b981" : "#3b82f6",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: state === "loading" ? 0.7 : 1,
          }}
        >
          {state === "loading" ? (
            <>
              <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Suche in MaStR...
            </>
          ) : state === "success" ? (
            "MaStR verknüpft"
          ) : (
            "MaStR abgleichen"
          )}
        </button>
        {result?.message && (
          <span style={{ fontSize: 12, color: result.found ? "#059669" : "#dc2626", maxWidth: 400 }}>
            {result.message}
          </span>
        )}
        {result && !result.found && (
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            ({result.solarTotalInPlz ?? result.totalInPlz ?? 0} Solar / {result.speicherTotalInPlz ?? 0} Speicher in PLZ durchsucht)
          </span>
        )}
      </div>
      {(hasSolarResult || hasSpeicherResult) && (
        <div>
          <MaStrResultRow label="Solar" entry={result.solar} />
          <MaStrResultRow label="Speicher" entry={result.speicher} />
        </div>
      )}
      {/* Legacy-Fallback für alte API-Responses */}
      {!hasSolarResult && !hasSpeicherResult && result?.mastrNr && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
          <strong>{result.mastrNr}</strong>
          {result.mastrName && <> &mdash; {result.mastrName}</>}
          {result.bruttoleistungKw && <> ({result.bruttoleistungKw} kW)</>}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

/* ═══════════════════ NETZANMELDUNG CARD ═══════════════════ */
function NetzanmeldungCard({ install, isAdmin, reload }: {
  install: any;
  isAdmin: boolean;
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editCaseNumber, setEditCaseNumber] = useState("");

  // Support both flat (install.field) and nested (install.data.field) response shapes
  const d = install?.data || install;
  const nbEmail = d?.nbEmail || null;
  const nbCaseNumber = d?.nbCaseNumber || null;
  const gridOperator = d?.gridOperator || null;
  const gridOperatorId = d?.gridOperatorId || null;
  const nbEingereichtAm = d?.nbEingereichtAm || null;
  const rawStatus = d?.status || install?.status || "";
  const daysAtNb = d?.daysAtNb || null;

  const missingEmail = !nbEmail;
  const missingCaseNumber = !nbCaseNumber;
  const hasWarning = missingEmail || missingCaseNumber;
  // Status kann "beim_nb" (lowercase vom Backend) oder "BEIM_NB" (raw DB) sein
  const isBeimNb = rawStatus.toLowerCase() === "beim_nb";

  const startEdit = useCallback(() => {
    setEditEmail(nbEmail || "");
    setEditCaseNumber(nbCaseNumber || "");
    setEditing(true);
  }, [nbEmail, nbCaseNumber]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];

      // Vorgangsnummer update
      const trimmedCase = editCaseNumber.trim();
      if (trimmedCase !== (nbCaseNumber || "")) {
        promises.push(
          apiPatch(`installations/${d?.id || install?.id}/nb-tracking`, {
            nbVorgangsnummer: trimmedCase || null,
          })
        );
      }

      // NB-Email update (nur wenn gridOperatorId vorhanden und Email geändert)
      const trimmedEmail = editEmail.trim();
      if (gridOperatorId && trimmedEmail !== (nbEmail || "")) {
        promises.push(
          apiPatch(`ops/nb/${gridOperatorId}`, {
            einreichEmail: trimmedEmail || null,
          })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      setEditing(false);
      await reload();
    } catch (err) {
      console.error("Fehler beim Speichern der NB-Daten:", err);
    } finally {
      setSaving(false);
    }
  }, [editCaseNumber, editEmail, nbCaseNumber, nbEmail, gridOperatorId, d?.id, install?.id, reload]);

  return (
    <Card
      title="Netzanmeldung"
      icon={<Icons.Globe />}
      iconVariant="warning"
      className={hasWarning && isBeimNb ? "ov-card--warning" : ""}
      headerRight={
        isAdmin && !editing ? (
          <button className="ov-nb-edit-trigger" onClick={startEdit}>
            <Icons.Edit /> Bearbeiten
          </button>
        ) : undefined
      }
    >
      {/* Warnungen */}
      {isBeimNb && missingEmail && (
        <div className="ov-nb-alert ov-nb-alert--critical">
          ⚠️ NB-Email fehlt – Erinnerungen können nicht versendet werden!
        </div>
      )}
      {isBeimNb && missingCaseNumber && (
        <div className="ov-nb-alert ov-nb-alert--warn">
          ⚠️ Vorgangsnummer fehlt – bitte nachtragen
        </div>
      )}

      {/* Felder (Read-Only) */}
      {!editing && (
        <div className="ov-fields">
          <Field label="Netzbetreiber" value={gridOperator} wide />
          <Field label="NB-Email (Einreich)" value={nbEmail} mono />
          <Field label="Vorgangsnummer" value={nbCaseNumber} mono />
          <Field label="Eingereicht am" value={formatDate(nbEingereichtAm)} />
          {isBeimNb && daysAtNb !== null && (
            <Field
              label="Tage beim NB"
              value={
                <span style={{ color: daysAtNb > 30 ? "#f87171" : daysAtNb > 14 ? "#fbbf24" : "#34d399", fontWeight: 700, fontFamily: "monospace" }}>
                  {daysAtNb} Tage
                </span>
              }
            />
          )}
        </div>
      )}

      {/* Inline-Edit-Formular */}
      {editing && (
        <div className="ov-nb-edit-form">
          <div className="ov-nb-form-group">
            <label className="ov-nb-form-label">NB-Email (Einreich)</label>
            <input
              className="ov-nb-input"
              type="email"
              placeholder="email@netzbetreiber.de"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={!gridOperatorId}
            />
            {!gridOperatorId && (
              <div style={{ fontSize: 11, color: "var(--ov-text-dim)", marginTop: 4 }}>
                Kein Netzbetreiber zugeordnet – Email kann nicht gesetzt werden
              </div>
            )}
          </div>
          <div className="ov-nb-form-group">
            <label className="ov-nb-form-label">Vorgangsnummer</label>
            <input
              className="ov-nb-input"
              type="text"
              placeholder="z.B. NB-2026-001234"
              value={editCaseNumber}
              onChange={(e) => setEditCaseNumber(e.target.value)}
            />
          </div>
          <div className="ov-nb-actions">
            <button className="ov-nb-btn ov-nb-btn--save" onClick={handleSave} disabled={saving}>
              {saving ? "Speichert..." : "Speichern"}
            </button>
            <button className="ov-nb-btn ov-nb-btn--cancel" onClick={cancelEdit} disabled={saving}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════ NB-PORTAL CARD (Westnetz etc.) ═══════════════════ */

const NB_PORTAL_LIST = [
  { match: "Westnetz", url: "https://serviceportal.westnetz.de" },
  { match: "Stromnetz Berlin", url: "https://kundenportal.stromnetz.berlin" },
  { match: "energis-Netzgesellschaft", url: "https://connect.energis.de" },
  { match: "energis", url: "https://connect.energis.de" },
];

function getPortalUrl(gridOperator: string): string | null {
  const go = gridOperator.toLowerCase();
  const entry = NB_PORTAL_LIST.find(e => go.includes(e.match.toLowerCase()));
  return entry?.url || null;
}

function isKnownPortalNb(gridOperator: string): boolean {
  const go = gridOperator.toLowerCase();
  return NB_PORTAL_LIST.some(e => go.includes(e.match.toLowerCase()));
}

function NbPortalCard({ install, isAdmin, reload }: {
  install: any;
  isAdmin: boolean;
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notizen, setNotizen] = useState("");
  const [showPw, setShowPw] = useState(false);

  const d = install?.data || install;
  const gridOperator = d?.gridOperator || "";
  const portalUrl = d?.nbPortalUrl || getPortalUrl(gridOperator);
  const currentUsername = d?.nbPortalUsername || null;
  const currentPassword = d?.nbPortalPassword || null;
  const currentNotizen = d?.nbPortalNotizen || null;

  const startEdit = useCallback(() => {
    setUsername(currentUsername || "");
    setPassword(currentPassword || "");
    setNotizen(currentNotizen || "");
    setEditing(true);
  }, [currentUsername, currentPassword, currentNotizen]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiPatch(`installations/${d?.id || install?.id}/nb-portal-credentials`, {
        nbPortalUsername: username.trim() || null,
        nbPortalPassword: password.trim() || null,
        nbPortalNotizen: notizen.trim() || null,
      });
      setEditing(false);
      await reload();
    } catch (err) {
      console.error("Fehler beim Speichern der Portal-Daten:", err);
    } finally {
      setSaving(false);
    }
  }, [username, password, notizen, d?.id, install?.id, reload]);

  const portalStyle: Record<string, React.CSSProperties> = {
    badge: {
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: currentUsername ? "rgba(16,185,129,0.1)" : "rgba(251,191,36,0.1)",
      color: currentUsername ? "#059669" : "#d97706",
    },
    urlBtn: {
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer",
      textDecoration: "none", transition: "background 0.2s",
    },
    pwToggle: {
      background: "none", border: "none", cursor: "pointer",
      padding: "4px 8px", fontSize: 12, color: "#64748b",
    },
    credsBox: {
      background: "rgba(15,23,42,0.4)", borderRadius: 8, padding: "10px 14px",
      fontFamily: "monospace", fontSize: 13, border: "1px solid rgba(255,255,255,0.08)",
    },
  };

  return (
    <Card
      title={`NB-Portal${gridOperator ? ` — ${gridOperator}` : ""}`}
      icon={<Icons.Globe />}
      iconVariant={currentUsername ? "success" : "warning"}
      headerRight={
        isAdmin && !editing ? (
          <button className="ov-nb-edit-trigger" onClick={startEdit}>
            <Icons.Edit /> Bearbeiten
          </button>
        ) : undefined
      }
    >
      {!editing && (
        <>
          {/* Portal-Link */}
          {portalUrl && (
            <div style={{ marginBottom: 12 }}>
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={portalStyle.urlBtn}
                onMouseOver={(e) => (e.currentTarget.style.background = "#2563eb")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#3b82f6")}
              >
                <Icons.Globe /> Portal öffnen ↗
              </a>
            </div>
          )}

          {/* Credentials */}
          {currentUsername ? (
            <div style={portalStyle.credsBox}>
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: "#94a3b8", fontSize: 11 }}>Benutzername:</span>{" "}
                <span style={{ fontWeight: 600 }}>{currentUsername}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#94a3b8", fontSize: 11 }}>Passwort:</span>{" "}
                <span style={{ fontWeight: 600 }}>
                  {showPw ? currentPassword : "••••••••"}
                </span>
                <button style={portalStyle.pwToggle} onClick={() => setShowPw(!showPw)}>
                  {showPw ? "verbergen" : "anzeigen"}
                </button>
              </div>
              {currentNotizen && (
                <div style={{ marginTop: 8, color: "#94a3b8", fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                  {currentNotizen}
                </div>
              )}
            </div>
          ) : (
            <div style={portalStyle.badge}>
              ⚠️ Keine Zugangsdaten hinterlegt
            </div>
          )}

          {/* Status-Badge */}
          <div style={{ marginTop: 10 }}>
            <span style={portalStyle.badge}>
              {currentUsername ? "✓ Zugangsdaten vorhanden" : "Noch nicht eingerichtet"}
            </span>
          </div>
        </>
      )}

      {/* Edit-Formular */}
      {editing && (
        <div className="ov-nb-edit-form">
          <div className="ov-nb-form-group">
            <label className="ov-nb-form-label">Benutzername / E-Mail</label>
            <input
              className="ov-nb-input"
              type="text"
              placeholder="z.B. kunde@email.de"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="ov-nb-form-group">
            <label className="ov-nb-form-label">Passwort</label>
            <input
              className="ov-nb-input"
              type="text"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="ov-nb-form-group">
            <label className="ov-nb-form-label">Notizen</label>
            <input
              className="ov-nb-input"
              type="text"
              placeholder="z.B. Erstregistrierung am..."
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
            />
          </div>
          <div className="ov-nb-actions">
            <button className="ov-nb-btn ov-nb-btn--save" onClick={handleSave} disabled={saving}>
              {saving ? "Speichert..." : "Speichern"}
            </button>
            <button className="ov-nb-btn ov-nb-btn--cancel" onClick={() => setEditing(false)} disabled={saving}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
export default function OverviewTab() {
  const { detail, loading, setActiveTab, reload } = useDetail();
  const install = detail;
  const isAdmin = useIsAdmin();

  // Loading State
  if (loading || !detail) {
    return (
      <div className="ov-root">
        <style>{styles}</style>
        <div className="ov-loading">
          <div className="ov-loading-spinner" />
          <p>Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  const customer = useMemo(() => {
    const ctx = install?.wizardContext?.customer || {};
    // Auch DB-Felder berücksichtigen falls wizardContext leer
    return {
      ...ctx,
      firstName: ctx.firstName || null,
      lastName: ctx.lastName || null,
      companyName: ctx.companyName || (install as any)?.customerName,
      email: ctx.email || (install as any)?.contactEmail,
      phone: ctx.phone || (install as any)?.contactPhone,
      birthDate: ctx.birthDate || (install as any)?.kundeGeburtsdatum,
      customerType: ctx.customerType || (install as any)?.customerType,
    };
  }, [install?.wizardContext, install]);
  const location = useMemo(() => install?.wizardContext?.location || {}, [install?.wizardContext]);
  const meter = useMemo(() => install?.wizardContext?.meter || {}, [install?.wizardContext]);
  const commissioning = useMemo(() => install?.wizardContext?.commissioning || {}, [install?.wizardContext]);
  const authorization = useMemo(() => install?.wizardContext?.authorization || {}, [install?.wizardContext]);
  const photos = useMemo(() => install?.wizardContext?.photos || [], [install?.wizardContext]);
  const gridConnection = useMemo(() => install?.wizardContext?.gridConnection || {}, [install?.wizardContext]);
  const decommissioning = useMemo(() => install?.wizardContext?.decommissioning || {}, [install?.wizardContext]);
  const processType = install?.wizardContext?.processType;
  const registrationTargets = install?.wizardContext?.registrationTargets || [];
  const technical = useMemo(() => {
    const td = install?.technicalData || install?.wizardContext?.technical || {};

    // Unterstütze DREI Formate:
    // 1. Neu (Wizard): pvEntries[], inverterEntries[]
    // 2. Alt: pv, inverter Objects
    // 3. WhatsApp: pvAnzahl, pvHersteller, pvModell, pvLeistungWp

    let pvEntries: any[] = [];
    if (Array.isArray(td.pvEntries) && td.pvEntries.length > 0) {
      pvEntries = td.pvEntries;
    } else if (td.pv) {
      pvEntries = [td.pv];
    } else if (td.pvAnzahl || td.pvHersteller) {
      // WhatsApp-Format
      pvEntries = [{
        manufacturer: td.pvHersteller,
        model: td.pvModell,
        count: td.pvAnzahl,
        powerWp: td.pvLeistungWp,
      }];
    }

    let inverterEntries: any[] = [];
    if (Array.isArray(td.inverterEntries) && td.inverterEntries.length > 0) {
      inverterEntries = td.inverterEntries;
    } else if (td.inverter) {
      inverterEntries = [td.inverter];
    } else if (td.wrHersteller || td.wrModell) {
      // WhatsApp-Format
      inverterEntries = [{
        manufacturer: td.wrHersteller,
        model: td.wrModell,
        powerKva: td.wrLeistungKw,
        acPowerKw: td.wrLeistungKw,
        count: td.wrAnzahl || 1,
        zerezId: td.wrZerezId,
      }];
    }

    // Speicher: batteryEntries (Wizard) oder storageEntries (alt) oder WhatsApp
    let storageEntries: any[] = [];
    if (Array.isArray(td.batteryEntries) && td.batteryEntries.length > 0) {
      storageEntries = td.batteryEntries;
    } else if (Array.isArray(td.storageEntries) && td.storageEntries.length > 0) {
      storageEntries = td.storageEntries;
    } else if (td.storage && td.storage.enabled !== false) {
      storageEntries = [td.storage];
    } else if (td.speicherHersteller || td.speicherModell || td.speicherKwh) {
      // WhatsApp-Format
      storageEntries = [{
        manufacturer: td.speicherHersteller,
        model: td.speicherModell,
        capacityKwh: td.speicherKwh,
      }];
    }

    const wallboxEntries = Array.isArray(td.wallboxEntries) && td.wallboxEntries.length > 0
      ? td.wallboxEntries
      : (td.wallbox && td.wallbox.enabled !== false) ? [td.wallbox] : [];

    // heatpumpEntries (lowercase) oder heatPumpEntries (camelCase)
    const heatPumpEntries = Array.isArray(td.heatpumpEntries) && td.heatpumpEntries.length > 0
      ? td.heatpumpEntries
      : Array.isArray(td.heatPumpEntries) && td.heatPumpEntries.length > 0
        ? td.heatPumpEntries
        : (td.heatPump && td.heatPump.enabled !== false) ? [td.heatPump] : [];

    return {
      pvEntries,
      inverterEntries,
      storageEntries,
      wallboxEntries,
      heatPumpEntries,
      feedInType: td.feedInType,
      totalPvKwp: td.totalPvKwp || td.anlagenLeistungKwp,
      totalInverterKva: td.totalInverterKva,
      totalBatteryKwh: td.totalBatteryKwh,
      // WhatsApp-spezifisch
      zaehlerNummern: td.zaehlerNummern,
      zaehlerAbmelden: td.zaehlerAbmelden,
    };
  }, [install?.technicalData, install?.wizardContext]);

  const pvEntries = technical.pvEntries;
  const inverterEntries = technical.inverterEntries;
  const storageEntries = technical.storageEntries;
  const wallboxEntries = technical.wallboxEntries;
  const heatPumpEntries = technical.heatPumpEntries;

  // KPI Berechnungen - Nutze gespeicherte Totals falls vorhanden
  const totalPvKwp = useMemo(() =>
    technical.totalPvKwp || pvEntries.reduce((sum: number, pv: any) => sum + ((pv.count || 0) * (pv.powerWp || 0)) / 1000, 0)
  , [pvEntries, technical.totalPvKwp]);

  const totalInverterKw = useMemo(() =>
    technical.totalInverterKva || inverterEntries.reduce((sum: number, inv: any) => sum + ((inv.count || 1) * (inv.powerKva || inv.acPowerKw || 0)), 0)
  , [inverterEntries, technical.totalInverterKva]);

  const totalStorageKwh = useMemo(() =>
    technical.totalBatteryKwh || storageEntries.reduce((sum: number, st: any) => sum + (st.capacityKwh || 0), 0)
  , [storageEntries, technical.totalBatteryKwh]);

  const hasHybrid = useMemo(() =>
    inverterEntries.some((inv: any) => inv.hybrid)
  , [inverterEntries]);

  const caseTypeInfo = getCaseTypeInfo((install as any)?.caseType || install?.wizardContext?.caseType);

  return (
    <div className="ov-root">
      <style>{styles}</style>

      {DEBUG && (
        <details className="ov-debug" open>
          <summary>DEBUG DATA</summary>
          <pre>{JSON.stringify({
            hasInstall: !!install,
            hasWizardContext: !!install?.wizardContext,
            wizardContextKeys: install?.wizardContext ? Object.keys(install.wizardContext) : [],
            customer,
            location,
            meter,
            commissioning,
            technical,
            photos,
            authorization,
          }, null, 2)}</pre>
        </details>
      )}

      {/* KPI Header */}
      <div className="ov-kpi-header">
        {totalPvKwp > 0 && (
          <div className="ov-kpi">
            <div className="ov-kpi-icon ov-kpi-icon--pv"><Icons.Sun /></div>
            <div className="ov-kpi-label">PV-Leistung</div>
            <div className="ov-kpi-value">{totalPvKwp.toFixed(2)} kWp</div>
          </div>
        )}
        {totalInverterKw > 0 && (
          <div className="ov-kpi">
            <div className="ov-kpi-icon ov-kpi-icon--wr"><Icons.Activity /></div>
            <div className="ov-kpi-label">Wechselrichter</div>
            <div className="ov-kpi-value">{totalInverterKw.toFixed(2)} kW</div>
          </div>
        )}
        {totalStorageKwh > 0 && (
          <div className="ov-kpi">
            <div className="ov-kpi-icon ov-kpi-icon--storage"><Icons.Battery /></div>
            <div className="ov-kpi-label">Speicher</div>
            <div className="ov-kpi-value">{totalStorageKwh.toFixed(1)} kWh</div>
          </div>
        )}
        {hasHybrid && (
          <div className="ov-kpi">
            <div className="ov-kpi-icon ov-kpi-icon--hybrid"><Icons.Zap /></div>
            <div className="ov-kpi-label">System</div>
            <div className="ov-kpi-value ov-kpi-value--small">Hybrid</div>
          </div>
        )}
        {wallboxEntries.length > 0 && (
          <div className="ov-kpi">
            <div className="ov-kpi-icon ov-kpi-icon--wallbox"><Icons.Car /></div>
            <div className="ov-kpi-label">Wallbox</div>
            <div className="ov-kpi-value ov-kpi-value--small">{wallboxEntries.length}×</div>
          </div>
        )}
        {heatPumpEntries.length > 0 && (
          <div className="ov-kpi">
            <div className="ov-kpi-icon ov-kpi-icon--heatpump"><Icons.Thermometer /></div>
            <div className="ov-kpi-label">Wärmepumpe</div>
            <div className="ov-kpi-value ov-kpi-value--small">{heatPumpEntries.length}×</div>
          </div>
        )}
      </div>

      <div className="ov-layout">
      {/* Main Content */}
      <div className="ov-main">
      <div className="ov-grid">
        {/* Kunde */}
        <Card title="Kunde" icon={<Icons.User />}>
          <div className="ov-fields">
            <Field label="Name / Firma" value={customer.companyName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim()} />
            <Field label="Kundentyp" value={customer.customerType === "PRIVATE" ? "Privat" : "Gewerbe"} />
            <Field label="E-Mail" value={customer.email} />
            <Field label="Telefon" value={customer.phone} mono />
            {customer.birthDate && (
              <Field label="Geburtsdatum" value={formatDate(customer.birthDate)} />
            )}
          </div>
        </Card>

        {/* Subunternehmer-Zuweisung */}
        <Card title="Subunternehmer" icon={<Icons.User />}>
          <div className="ov-fields">
            {(install as any)?.assignedToName ? (
              <>
                <Field label="Zugewiesen an" value={(install as any).assignedToName} />
                <Field label="Zugewiesen am" value={formatDate((install as any).assignedAt)} />
                {(install as any).suppressEmails && (
                  <div className="ov-subcontractor-notice">
                    ⚠️ E-Mails werden für diese Installation unterdrückt
                  </div>
                )}
              </>
            ) : (
              <div className="ov-subcontractor-empty">
                Kein Subunternehmer zugewiesen
              </div>
            )}
          </div>
        </Card>

        {/* Standort */}
        <Card title="Standort" icon={<Icons.MapPin />}>
          <div className="ov-fields">
            <Field label="Adresse" value={`${location?.siteAddress?.street || ""} ${location?.siteAddress?.houseNumber || ""}`.trim()} wide />
            <Field label="PLZ / Ort" value={`${location?.siteAddress?.zip || ""} ${location?.siteAddress?.city || ""}`.trim()} />
            <Field label="Flurstück" value={location?.cadastralNumber} mono />
            <Field label="Netzbetreiber" value={location?.netOperator?.name} wide />
          </div>
        </Card>

        {/* Netzanmeldung – nur wenn NB zugeordnet oder Status beim_nb */}
        {(() => {
          const dd = (install as any)?.data || install;
          const st = (dd?.status || "").toLowerCase();
          return dd?.gridOperatorId || st === "beim_nb";
        })() && (
          <NetzanmeldungCard
            install={install}
            isAdmin={isAdmin}
            reload={reload}
          />
        )}

        {/* NB-Portal — siehe features/netzanmeldungen OverviewTab */}

        {/* Zähler */}
        <Card title="Zähler" icon={<Icons.Meter />}>
          <div className="ov-fields">
            <Field label="Zählernummer" value={meter?.number || location?.meterNumber} mono />
            <Field label="Zählertyp" value={
              meter?.type === 'zweirichtung' ? 'Zweirichtungszähler' :
              meter?.type === 'einrichtung' ? 'Einrichtungszähler' :
              meter?.type
            } />
            <Field label="Standort" value={
              meter?.location === 'keller' ? 'Keller' :
              meter?.location === 'hausanschluss' ? 'Hausanschluss' :
              meter?.location === 'garage' ? 'Garage' :
              meter?.location
            } />
            <Field label="Eigentümer" value={
              meter?.ownership === 'netzbetreiber' ? 'Netzbetreiber' :
              meter?.ownership === 'kunde' ? 'Kunde' :
              meter?.ownership
            } />
            <Field label="Tarifart" value={
              meter?.tariffType === 'eintarif' ? 'Eintarif' :
              meter?.tariffType === 'zweitarif' ? 'Zweitarif (HT/NT)' :
              meter?.tariffType
            } />
            {technical.zaehlerAbmelden && technical.zaehlerNummern && technical.zaehlerNummern.length > 0 && (
              <Field label="Zähler abmelden" value={
                <span style={{ color: '#f59e0b' }}>
                  {technical.zaehlerNummern.length}× abzumelden: {technical.zaehlerNummern.join(', ')}
                </span>
              } wide />
            )}
          </div>
        </Card>

        {/* Anlagentyp & Einspeisung */}
        <Card title="Anlagentyp & Einspeisung" icon={<Icons.FileText />}>
          <div className="ov-fields">
            <Field label="Anlagentyp" value={
              <div className="ov-casetype-badge" style={{
                borderColor: `${caseTypeInfo.color}40`,
                color: caseTypeInfo.color
              }}>
                <span className="ov-casetype-icon">{caseTypeInfo.icon}</span>
                <span>{caseTypeInfo.label}</span>
              </div>
            } wide />
            <Field label="Vorgangsart" value={
              processType === 'neuanmeldung' ? 'Neuanmeldung' :
              processType === 'erweiterung' ? 'Erweiterung' :
              processType === 'aenderung' ? 'Änderung' :
              processType === 'inbetriebnahme' ? 'Inbetriebnahme' :
              processType
            } />
            <Field label="Komponenten" value={
              registrationTargets.length > 0 ?
                registrationTargets.map((t: string) =>
                  t === 'pv' ? 'PV' :
                  t === 'speicher' ? 'Speicher' :
                  t === 'wallbox' ? 'Wallbox' :
                  t === 'waermepumpe' ? 'Wärmepumpe' : t
                ).join(', ') : undefined
            } />
            <Field label="Einspeiseart" value={
              technical.feedInType === 'ueberschuss' ? 'Überschusseinspeisung' :
              technical.feedInType === 'volleinspeisung' ? 'Volleinspeisung' :
              technical.feedInType === 'nulleinspeisung' ? 'Nulleinspeisung (Eigenverbrauch)' :
              technical.feedInType
            } />
            <Field label="Messkonzept" value={(install as any)?.messkonzept === "MK2" ? "Kaskadenmessung (MK2)" : (install as any)?.messkonzept} />
          </div>
        </Card>

        {/* Netzanschluss (falls Daten vorhanden) */}
        {(gridConnection?.existingPowerKw || gridConnection?.existingFuseA || gridConnection?.groundingType) && (
          <Card title="Netzanschluss" icon={<Icons.Plug />}>
            <div className="ov-fields">
              <Field label="HAK-ID" value={gridConnection?.hakId} mono />
              <Field label="Bestehende Leistung" value={gridConnection?.existingPowerKw ? `${gridConnection.existingPowerKw} kW` : undefined} />
              <Field label="Bestehende Absicherung" value={gridConnection?.existingFuseA ? `${gridConnection.existingFuseA} A` : undefined} />
              <Field label="Erdungsart" value={gridConnection?.groundingType} />
              <Field label="Gewünschte Leistung" value={gridConnection?.requestedPowerKw ? `${gridConnection.requestedPowerKw} kW` : undefined} />
              <Field label="Gewünschte Absicherung" value={gridConnection?.requestedFuseA ? `${gridConnection.requestedFuseA} A` : undefined} />
            </div>
          </Card>
        )}

        {/* Inbetriebnahme */}
        <Card title="Inbetriebnahme" icon={<Icons.Calendar />}>
          <div className="ov-fields">
            <Field label="Geplantes IBN-Datum" value={formatDate(commissioning?.plannedDate)} />
            <Field label="Tatsächliches IBN-Datum" value={formatDate(commissioning?.actualDate)} />
            <Field label="EEG-Inbetriebnahme" value={formatDate(commissioning?.eegDate)} />
            <Field label="MaStR-Nr. Solar" value={commissioning?.mastrNumber} mono />
            <Field label="MaStR-Nr. Speicher" value={commissioning?.mastrNumberSpeicher} mono />
            <Field label="MaStR registriert" value={
              commissioning?.mastrRegistered ?
                <span className="ov-pill ov-pill--success">✓ Ja</span> :
                <span className="ov-pill">Nein</span>
            } />
            {commissioning?.mastrSyncAm && (
              <Field label="Letzter MaStR-Sync" value={formatDate(commissioning.mastrSyncAm)} />
            )}
            <Field label="Netzbetreiber informiert" value={
              commissioning?.gridOperatorNotified ?
                <span className="ov-pill ov-pill--success">✓ Ja</span> :
                <span className="ov-pill">Nein</span>
            } />
          </div>
          {isAdmin && authorization?.mastrRegistration && !commissioning?.mastrRegistered && (
            <MaStrConfirmButton installId={install!.id} hasStorage={storageEntries.length > 0} />
          )}
          {isAdmin && (!commissioning?.mastrNumber || !commissioning?.mastrNumberSpeicher) && (
            <MaStrMatchButton publicId={(install as any).publicId} />
          )}
        </Card>

        {/* Stilllegung/Demontage (falls Daten vorhanden) */}
        {(decommissioning?.type || decommissioning?.reason) && (
          <Card title="Stilllegung / Demontage" icon={<Icons.Activity />} iconVariant="warning">
            <div className="ov-fields">
              <Field label="Demontage-Typ" value={
                decommissioning?.type === 'zaehler' ? 'Zähler' :
                decommissioning?.type === 'pv_komplett' ? 'PV-Anlage komplett' :
                decommissioning?.type === 'speicher' ? 'Speicher' :
                decommissioning?.type === 'wechselrichter' ? 'Wechselrichter' :
                decommissioning?.type
              } />
              <Field label="Grund" value={
                decommissioning?.reason === 'stilllegung' ? 'Stilllegung' :
                decommissioning?.reason === 'modernisierung' ? 'Modernisierung' :
                decommissioning?.reason === 'defekt' ? 'Defekt' :
                decommissioning?.reason === 'verkauf' ? 'Verkauf' :
                decommissioning?.reason
              } />
              <Field label="MaStR-Nummer" value={decommissioning?.mastrNumber} mono />
              <Field label="Gewünschtes Datum" value={formatDate(decommissioning?.requestedDate)} />
              <Field label="Netzbetreiber informiert" value={
                decommissioning?.gridOperatorNotified ?
                  <span className="ov-pill ov-pill--success">✓ Ja</span> :
                  <span className="ov-pill">Nein</span>
              } />
              <Field label="MaStR abgemeldet" value={
                decommissioning?.mastrDeregistered ?
                  <span className="ov-pill ov-pill--success">✓ Ja</span> :
                  <span className="ov-pill">Nein</span>
              } />
            </div>
          </Card>
        )}

        {/* PV-Module */}
        {pvEntries.length > 0 && (
          <Card title="PV-Module" icon={<Icons.Sun />} iconVariant="warning" badge={pvEntries.length}>
            <ul className="ov-entries">
              {pvEntries.map((pv: any, idx: number) => {
                const kwp = ((pv.count || 0) * (pv.powerWp || 0)) / 1000;
                const orientationMap: Record<string, string> = {
                  'N': 'Nord', 'NE': 'Nordost', 'E': 'Ost', 'SE': 'Südost',
                  'S': 'Süd', 'SW': 'Südwest', 'W': 'West', 'NW': 'Nordwest'
                };
                const orientationLabel = orientationMap[pv.orientation] || pv.orientation;
                return (
                  <li key={pv.id || idx} className="ov-entry">
                    <div className="ov-entry-main">
                      <span className="ov-entry-name">{pv.manufacturer || "Unbekannt"} {pv.model || ""}</span>
                      <div className="ov-entry-meta">
                        {pv.count && <span className="ov-entry-tag">{pv.count}× {pv.powerWp} Wp</span>}
                        {pv.orientation && <span className="ov-entry-tag">🧭 {orientationLabel}</span>}
                        {pv.tilt && <span className="ov-entry-tag">📐 {pv.tilt}°</span>}
                        {pv.roofName && <span className="ov-entry-tag ov-entry-tag--accent">{pv.roofName}</span>}
                      </div>
                    </div>
                    {kwp > 0 && <span className="ov-entry-value">{kwp.toFixed(2)} kWp</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {/* Wechselrichter */}
        {inverterEntries.length > 0 && (
          <Card title="Wechselrichter" icon={<Icons.Activity />} badge={inverterEntries.length}>
            <ul className="ov-entries">
              {inverterEntries.map((inv: any, idx: number) => (
                <li key={inv.id || idx} className="ov-entry">
                  <div className="ov-entry-main">
                    <span className="ov-entry-name">{inv.manufacturer || "Unbekannt"} {inv.model || ""}</span>
                    <div className="ov-entry-meta">
                      {(inv.powerKva || inv.acPowerKw) && (
                        <span className="ov-entry-tag">{inv.powerKva || inv.acPowerKw} kVA</span>
                      )}
                      {inv.count > 1 && <span className="ov-entry-tag">{inv.count}×</span>}
                      {inv.hybrid && <span className="ov-entry-tag ov-entry-tag--hybrid">Hybrid</span>}
                      {inv.zerezId && (
                        <span className="ov-entry-tag ov-entry-tag--accent" title="ZEREZ Zertifikat">
                          🏷️ {inv.zerezId}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Batteriespeicher */}
        {storageEntries.length > 0 && (
          <Card title="Batteriespeicher" icon={<Icons.Battery />} iconVariant="success" badge={storageEntries.length}>
            <ul className="ov-entries">
              {storageEntries.map((st: any, idx: number) => (
                <li key={st.id || idx} className="ov-entry">
                  <div className="ov-entry-main">
                    <span className="ov-entry-name">{st.manufacturer || "Unbekannt"} {st.model || ""}</span>
                    <div className="ov-entry-meta">
                      {st.capacityKwh && <span className="ov-entry-tag ov-entry-tag--success">{st.capacityKwh} kWh</span>}
                      {st.count > 1 && <span className="ov-entry-tag">{st.count}×</span>}
                      {st.coupling && (
                        <span className={`ov-entry-tag ${st.coupling === 'dc' ? 'ov-entry-tag--hybrid' : ''}`}>
                          {st.coupling === 'dc' ? 'DC-gekoppelt' : 'AC-gekoppelt'}
                        </span>
                      )}
                      {st.powerKw && <span className="ov-entry-tag">{st.powerKw} kW</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Wallbox */}
        {wallboxEntries.length > 0 && (
          <Card title="Wallbox" icon={<Icons.Car />} badge={wallboxEntries.length}>
            <ul className="ov-entries">
              {wallboxEntries.map((wb: any, idx: number) => (
                <li key={wb.id || idx} className="ov-entry">
                  <div className="ov-entry-main">
                    <span className="ov-entry-name">{wb.manufacturer || "Unbekannt"}</span>
                    <div className="ov-entry-meta">
                      {wb.model && <span className="ov-entry-tag ov-entry-tag--accent">{wb.model}</span>}
                      {wb.powerKw && <span className="ov-entry-tag">{wb.powerKw} kW</span>}
                      {wb.chargePoints > 1 && <span className="ov-entry-tag">{wb.chargePoints} LP</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Wärmepumpe */}
        {heatPumpEntries.length > 0 && (
          <Card title="Wärmepumpe" icon={<Icons.Thermometer />} badge={heatPumpEntries.length}>
            <ul className="ov-entries">
              {heatPumpEntries.map((hp: any, idx: number) => (
                <li key={hp.id || idx} className="ov-entry">
                  <div className="ov-entry-main">
                    <span className="ov-entry-name">{hp.manufacturer || "Unbekannt"}</span>
                    <div className="ov-entry-meta">
                      {hp.model && <span className="ov-entry-tag ov-entry-tag--accent">{hp.model}</span>}
                      {hp.powerKw && <span className="ov-entry-tag">{hp.powerKw} kW</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Netzanschluss */}
        <Card title="Netzanschluss" icon={<Icons.Grid />}>
          <div className="ov-fields">
            <Field label="Anschlussleistung" value={install?.wizardContext?.technical?.connectionPowerKw ? `${install.wizardContext.technical.connectionPowerKw} kW` : undefined} />
            <Field label="Absicherung" value={install?.wizardContext?.technical?.connectionFuseA ? `${install.wizardContext.technical.connectionFuseA} A` : undefined} />
            <Field label="Hinweise" value={install?.wizardContext?.technical?.connectionNotes} wide />
          </div>
        </Card>

        {/* Fotos */}
        {photos.length > 0 && (
          <Card title="Hochgeladene Fotos" icon={<Icons.Camera />} badge={photos.length}>
            <div className="ov-fields">
              {photos.map((photo: any, idx: number) => (
                <Field
                  key={idx}
                  label={
                    photo.category === 'zaehlerschrank' ? 'Zählerschrank' :
                    photo.category === 'zaehler_nahaufnahme' ? 'Zähler (Nahaufnahme)' :
                    photo.category === 'wechselrichter' ? 'Wechselrichter' :
                    photo.category === 'dach' ? 'Dach' :
                    photo.category === 'hausanschluss' ? 'Hausanschluss' :
                    photo.category || 'Foto'
                  }
                  value={photo.filename}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Autorisierungen */}
        <Card title="Autorisierungen" icon={<Icons.Check />} iconVariant="success">
          <div className="ov-fields">
            <Field label="Vollmacht erteilt" value={
              authorization?.powerOfAttorney ?
                <span className="ov-pill ov-pill--success">✓ Ja</span> :
                <span className="ov-pill">Nein</span>
            } />
            <Field label="MaStR-Registrierung" value={
              authorization?.mastrRegistration ?
                <span className="ov-pill ov-pill--success">✓ Beauftragt</span> :
                <span className="ov-pill">Selbst</span>
            } />
            <Field label="AGB akzeptiert" value={
              authorization?.termsAccepted ?
                <span className="ov-pill ov-pill--success">✓ Ja</span> :
                <span className="ov-pill">Nein</span>
            } />
            <Field label="Datenschutz akzeptiert" value={
              authorization?.privacyAccepted ?
                <span className="ov-pill ov-pill--success">✓ Ja</span> :
                <span className="ov-pill">Nein</span>
            } />
          </div>
        </Card>

        {/* Betreiber-Kommunikation */}
        {install && (
          <Card title="Betreiber-Kommunikation" icon={<Icons.MessageCircle />} wide>
            <BetreiberChatSection installationId={install.id} setActiveTab={setActiveTab} />
          </Card>
        )}
      </div>
      </div>{/* /ov-main */}

      {/* AI Assistant Sidebar - Admin Only */}
      {install && isAdmin && (
        <div className="ov-sidebar">
          <AIAssistantPanel
            installationId={install.id}
            publicId={(install as any).publicId || `INST-${install.id}`}
          />
        </div>
      )}
      </div>{/* /ov-layout */}
    </div>
  );
}
