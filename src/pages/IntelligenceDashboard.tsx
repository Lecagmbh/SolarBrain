/**
 * Baunity INTELLIGENCE CENTER
 * Hochintelligente Zentrale für KI-gestütztes Monitoring
 * ENDLEVEL VERSION
 */

import { useState, useEffect, useCallback, useRef } from "react";
import "./IntelligenceDashboard.css";

// Token aus localStorage
const getToken = () => localStorage.getItem('baunity_token');

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DashboardData {
  metrics: {
    activeUsers24h: number;
    totalInstallations: number;
    openInstallations: number;
    completedThisWeek: number;
    avgProcessingDays: number;
    pendingActions: number;
  };
  emailQueue: {
    stats: { pending: number; scheduled: number; sent: number; failed: number; cancelled: number };
    pendingCount: number;
  };
  incomingEmails: {
    unmatchedCount: number;
    recent: Array<{
      id: number;
      fromEmail: string;
      subject: string;
      status: string;
      matchConfidence: number | null;
      receivedAt: string;
    }>;
  };
  automations: {
    pendingCount: number;
    recent: Array<{
      id: number;
      status: string;
      ruleName: string;
      actionType: string;
      createdAt: string;
    }>;
  };
  alerts: Array<{
    id: number;
    alertType: string;
    severity: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
  activityFeed: Array<{
    id: number;
    activityType: string;
    title: string;
    description: string;
    userName: string;
    entityName: string;
    createdAt: string;
    isSystemAction: boolean;
  }>;
  suggestions: Array<{
    type: string;
    title: string;
    description: string;
    actionUrl?: string;
    priority: string;
  }>;
  stuckInstallations: Array<{
    id: number;
    publicId: string;
    customerName: string;
    days: number;
    netzbetreiberName: string;
  }>;
}

interface EmailQueueItem {
  id: number;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  status: string;
  createdAt: string;
  template?: { name: string; slug: string };
  installationId: number | null;
}

interface AutomationRule {
  id: number;
  name: string;
  description: string;
  triggerType: string;
  actionType: string;
  isActive: boolean;
  executionCount: number;
  successCount: number;
}

type TabKey = "overview" | "queue" | "incoming" | "automations" | "learning" | "settings";

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function IntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [emailQueue, setEmailQueue] = useState<EmailQueueItem[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState("");
  const [showRuleModal, setShowRuleModal] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const token = getToken();
  const headers: Record<string, string> = { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence/dashboard", { headers });
      if (res.ok) {
        setDashboard(await res.json());
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  }, [token]);

  const loadEmailQueue = useCallback(async () => {
    const url = queueFilter 
      ? `/api/intelligence/emails/queue?status=${queueFilter}`
      : "/api/intelligence/emails/queue";
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setEmailQueue(data.items || []);
      }
    } catch (error) {
      console.error("Queue load error:", error);
    }
  }, [token, queueFilter]);

  const loadAutomationRules = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence/automation/rules", { headers });
      if (res.ok) {
        const data = await res.json();
        setAutomationRules(data.rules || []);
      }
    } catch (error) {
      console.error("Rules load error:", error);
    }
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadDashboard(),
      activeTab === "queue" && loadEmailQueue(),
      activeTab === "automations" && loadAutomationRules(),
    ]);
    setLoading(false);
  }, [loadDashboard, loadEmailQueue, loadAutomationRules, activeTab]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [loadAll, loadDashboard]);

  useEffect(() => {
    if (activeTab === "queue") loadEmailQueue();
    if (activeTab === "automations") loadAutomationRules();
  }, [activeTab, loadEmailQueue, loadAutomationRules]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const approveEmail = async (id: number) => {
    setActionLoading(`approve-${id}`);
    await fetch(`/api/intelligence/emails/queue/${id}/approve`, { method: "POST", headers });
    await loadEmailQueue();
    await loadDashboard();
    setActionLoading(null);
  };

  const rejectEmail = async (id: number) => {
    const reason = prompt("Grund für Ablehnung:");
    if (!reason) return;
    setActionLoading(`reject-${id}`);
    await fetch(`/api/intelligence/emails/queue/${id}/reject`, { 
      method: "POST", 
      headers,
      body: JSON.stringify({ reason })
    });
    await loadEmailQueue();
    await loadDashboard();
    setActionLoading(null);
  };

  const approveAllEmails = async () => {
    if (!confirm(`Alle ${dashboard?.emailQueue.pendingCount || 0} E-Mails freigeben?`)) return;
    setActionLoading("approve-all");
    await fetch("/api/intelligence/emails/queue/approve-all", { method: "POST", headers });
    await loadEmailQueue();
    await loadDashboard();
    setActionLoading(null);
  };

  const toggleRule = async (id: number, isActive: boolean) => {
    await fetch(`/api/intelligence/automation/rules/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ isActive: !isActive })
    });
    await loadAutomationRules();
  };

  const acknowledgeAlert = async (id: number) => {
    await fetch(`/api/intelligence/alerts/${id}/acknowledge`, { method: "POST", headers });
    await loadDashboard();
  };

  const calculateStats = async () => {
    setActionLoading("calculate");
    await fetch("/api/intelligence/learn/calculate-stats", { method: "POST", headers });
    setActionLoading(null);
    alert("Statistiken werden berechnet...");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return d.toLocaleDateString("de-DE");
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      INFO: "bg-blue-500",
      WARNING: "bg-yellow-500",
      ERROR: "bg-red-500",
      CRITICAL: "bg-red-700"
    };
    return colors[severity] || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "text-gray-400",
      MEDIUM: "text-blue-400",
      HIGH: "text-orange-400",
      URGENT: "text-red-400"
    };
    return colors[priority] || "text-gray-400";
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const m = dashboard?.metrics;
  const alerts = dashboard?.alerts || [];
  const activity = dashboard?.activityFeed || [];
  const suggestions = dashboard?.suggestions || [];
  const stuck = dashboard?.stuckInstallations || [];

  return (
    <div className="intel-center">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="intel-header">
        <div className="intel-header-left">
          <div className="intel-logo">
            <span className="intel-logo-icon">🧠</span>
            <div>
              <h1>Intelligence Center</h1>
              <p>KI-gestützte Automatisierung & Analyse</p>
            </div>
          </div>
        </div>
        <div className="intel-header-right">
          {dashboard?.metrics.pendingActions ? (
            <div className="intel-pending-badge">
              <span className="pulse"></span>
              {dashboard.metrics.pendingActions} ausstehend
            </div>
          ) : null}
          <button onClick={loadAll} className="intel-btn-icon" disabled={loading}>
            {loading ? "⏳" : "🔄"}
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <nav className="intel-nav">
        {[
          { key: "overview", icon: "📊", label: "Übersicht" },
          { key: "queue", icon: "📤", label: "E-Mail Queue", badge: dashboard?.emailQueue.pendingCount },
          { key: "incoming", icon: "📥", label: "Eingehend", badge: dashboard?.incomingEmails.unmatchedCount },
          { key: "automations", icon: "⚡", label: "Automatisierung", badge: dashboard?.automations.pendingCount },
          { key: "learning", icon: "🎓", label: "Learning" },
          { key: "settings", icon: "⚙️", label: "Einstellungen" },
        ].map(tab => (
          <button
            key={tab.key}
            className={`intel-nav-item ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key as TabKey)}
          >
            <span className="intel-nav-icon">{tab.icon}</span>
            <span className="intel-nav-label">{tab.label}</span>
            {tab.badge ? <span className="intel-nav-badge">{tab.badge}</span> : null}
          </button>
        ))}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <main className="intel-content">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="intel-overview">
            {/* Alerts Banner */}
            {alerts.length > 0 && (
              <div className="intel-alerts-banner">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className={`intel-alert ${alert.severity.toLowerCase()}`}>
                    <div className="intel-alert-content">
                      <span className="intel-alert-icon">
                        {alert.severity === 'CRITICAL' ? '🚨' : alert.severity === 'ERROR' ? '❌' : '⚠️'}
                      </span>
                      <div>
                        <strong>{alert.title}</strong>
                        <p>{alert.message}</p>
                      </div>
                    </div>
                    <button onClick={() => acknowledgeAlert(alert.id)} className="intel-alert-dismiss">
                      ✓ Bestätigen
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* KPI Grid */}
            <div className="intel-kpi-grid">
              <div className="intel-kpi-card">
                <div className="intel-kpi-header">
                  <span className="intel-kpi-icon">📋</span>
                  <span className="intel-kpi-trend up">+{m?.completedThisWeek || 0} diese Woche</span>
                </div>
                <div className="intel-kpi-value">{m?.openInstallations || 0}</div>
                <div className="intel-kpi-label">Offene Installationen</div>
                <div className="intel-kpi-bar">
                  <div 
                    className="intel-kpi-bar-fill" 
                    style={{ width: `${((m?.openInstallations || 0) / (m?.totalInstallations || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="intel-kpi-card highlight">
                <div className="intel-kpi-header">
                  <span className="intel-kpi-icon">⏳</span>
                  <span className="intel-kpi-trend">{dashboard?.emailQueue.pendingCount || 0} wartend</span>
                </div>
                <div className="intel-kpi-value">{dashboard?.emailQueue.stats.sent || 0}</div>
                <div className="intel-kpi-label">E-Mails gesendet</div>
                <div className="intel-kpi-subtext">
                  {dashboard?.emailQueue.stats.failed || 0} fehlgeschlagen
                </div>
              </div>

              <div className="intel-kpi-card">
                <div className="intel-kpi-header">
                  <span className="intel-kpi-icon">📥</span>
                </div>
                <div className="intel-kpi-value">{dashboard?.incomingEmails.unmatchedCount || 0}</div>
                <div className="intel-kpi-label">E-Mails ohne Zuordnung</div>
                <div className="intel-kpi-subtext">Warten auf Review</div>
              </div>

              <div className="intel-kpi-card">
                <div className="intel-kpi-header">
                  <span className="intel-kpi-icon">⚡</span>
                </div>
                <div className="intel-kpi-value">{dashboard?.automations.pendingCount || 0}</div>
                <div className="intel-kpi-label">Ausstehende Automationen</div>
                <div className="intel-kpi-subtext">Warten auf Freigabe</div>
              </div>

              <div className="intel-kpi-card">
                <div className="intel-kpi-header">
                  <span className="intel-kpi-icon">⏱️</span>
                </div>
                <div className="intel-kpi-value">{m?.avgProcessingDays || 0}<small>d</small></div>
                <div className="intel-kpi-label">Ø Bearbeitungszeit</div>
                <div className="intel-kpi-subtext">Letzte 30 Tage</div>
              </div>

              <div className="intel-kpi-card">
                <div className="intel-kpi-header">
                  <span className="intel-kpi-icon">👥</span>
                </div>
                <div className="intel-kpi-value">{m?.activeUsers24h || 0}</div>
                <div className="intel-kpi-label">Aktive Benutzer</div>
                <div className="intel-kpi-subtext">Letzte 24 Stunden</div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="intel-main-grid">
              {/* Left Column */}
              <div className="intel-column">
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="intel-card">
                    <div className="intel-card-header">
                      <h3>💡 Vorschläge für dich</h3>
                    </div>
                    <div className="intel-suggestions">
                      {suggestions.map((s, i) => (
                        <div key={i} className="intel-suggestion">
                          <div className={`intel-suggestion-priority ${getPriorityColor(s.priority)}`}>
                            {s.priority === 'URGENT' ? '🔥' : s.priority === 'HIGH' ? '⚡' : '💡'}
                          </div>
                          <div className="intel-suggestion-content">
                            <strong>{s.title}</strong>
                            <p>{s.description}</p>
                          </div>
                          {s.actionUrl && (
                            <a href={s.actionUrl} className="intel-suggestion-action">→</a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stuck Installations */}
                {stuck.length > 0 && (
                  <div className="intel-card warning">
                    <div className="intel-card-header">
                      <h3>⚠️ Lange Wartezeiten</h3>
                      <span className="intel-card-badge">{stuck.length}</span>
                    </div>
                    <div className="intel-stuck-list">
                      {stuck.map(inst => (
                        <div key={inst.id} className="intel-stuck-item">
                          <div className="intel-stuck-info">
                            <strong>{inst.publicId}</strong>
                            <span>{inst.customerName}</span>
                          </div>
                          <div className="intel-stuck-meta">
                            <span className="intel-stuck-nb">{inst.netzbetreiberName}</span>
                            <span className={`intel-stuck-days ${inst.days > 30 ? 'critical' : ''}`}>
                              {inst.days} Tage
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="intel-card">
                  <div className="intel-card-header">
                    <h3>⚡ Schnellaktionen</h3>
                  </div>
                  <div className="intel-quick-actions">
                    {(dashboard?.emailQueue.pendingCount || 0) > 0 && (
                      <button onClick={approveAllEmails} className="intel-quick-btn success">
                        ✅ Alle {dashboard?.emailQueue.pendingCount} E-Mails freigeben
                      </button>
                    )}
                    <button onClick={() => setActiveTab("incoming")} className="intel-quick-btn">
                      📥 Eingehende E-Mails prüfen
                    </button>
                    <button onClick={() => setActiveTab("automations")} className="intel-quick-btn">
                      ⚡ Automationen verwalten
                    </button>
                    <button onClick={calculateStats} className="intel-quick-btn" disabled={actionLoading === "calculate"}>
                      🎓 NB-Statistiken aktualisieren
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Activity Feed */}
              <div className="intel-column">
                <div className="intel-card">
                  <div className="intel-card-header">
                    <h3>📜 Aktivitäten</h3>
                    <span className="intel-card-time">Live</span>
                  </div>
                  <div className="intel-activity-feed">
                    {activity.length === 0 ? (
                      <div className="intel-empty">Keine Aktivitäten</div>
                    ) : (
                      activity.map(a => (
                        <div key={a.id} className={`intel-activity ${a.isSystemAction ? 'system' : ''}`}>
                          <div className="intel-activity-icon">
                            {a.activityType === 'STATUS_CHANGED' ? '🔄' :
                             a.activityType === 'EMAIL_SENT' ? '📤' :
                             a.activityType === 'EMAIL_RECEIVED' ? '📥' :
                             a.activityType === 'DOCUMENT_UPLOADED' ? '📄' :
                             a.activityType === 'APPROVAL_GRANTED' ? '✅' :
                             a.activityType === 'USER_LOGIN' ? '👤' : '📌'}
                          </div>
                          <div className="intel-activity-content">
                            <div className="intel-activity-title">{a.title}</div>
                            {a.description && (
                              <div className="intel-activity-desc">{a.description}</div>
                            )}
                            <div className="intel-activity-meta">
                              {a.userName && <span>{a.userName}</span>}
                              {a.entityName && <span>• {a.entityName}</span>}
                              <span>• {formatDate(a.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* EMAIL QUEUE TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "queue" && (
          <div className="intel-queue-tab">
            <div className="intel-tab-header">
              <h2>📤 Ausgehende E-Mails</h2>
              <div className="intel-tab-actions">
                <select value={queueFilter} onChange={e => setQueueFilter(e.target.value)} className="intel-select">
                  <option value="">Alle Status</option>
                  <option value="PENDING">Wartend</option>
                  <option value="SCHEDULED">Geplant</option>
                  <option value="SENT">Gesendet</option>
                  <option value="FAILED">Fehlgeschlagen</option>
                </select>
                {(dashboard?.emailQueue.pendingCount || 0) > 0 && (
                  <button onClick={approveAllEmails} className="intel-btn success" disabled={actionLoading === "approve-all"}>
                    ✅ Alle freigeben ({dashboard?.emailQueue.pendingCount})
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="intel-queue-stats">
              {Object.entries(dashboard?.emailQueue.stats || {}).map(([status, count]) => (
                <div key={status} className={`intel-queue-stat ${status.toLowerCase()}`}>
                  <span className="intel-queue-stat-value">{count}</span>
                  <span className="intel-queue-stat-label">{status}</span>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="intel-table-container">
              <table className="intel-table">
                <thead>
                  <tr>
                    <th>Empfänger</th>
                    <th>Betreff</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Erstellt</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {emailQueue.map(item => (
                    <tr key={item.id} className={item.status === "PENDING" ? "highlight" : ""}>
                      <td>
                        <div className="intel-email-recipient">
                          <span className="email">{item.recipientEmail}</span>
                          {item.recipientName && <span className="name">{item.recipientName}</span>}
                        </div>
                      </td>
                      <td className="intel-email-subject">
                        {item.subject}
                        {item.installationId && (
                          <span className="intel-email-ref">Installation #{item.installationId}</span>
                        )}
                      </td>
                      <td>
                        {item.template ? (
                          <span className="intel-badge">{item.template.name || item.template.slug}</span>
                        ) : "-"}
                      </td>
                      <td>
                        <span className={`intel-status ${item.status.toLowerCase()}`}>{item.status}</span>
                      </td>
                      <td className="intel-date">{formatDate(item.createdAt)}</td>
                      <td>
                        {item.status === "PENDING" && (
                          <div className="intel-actions">
                            <button 
                              onClick={() => approveEmail(item.id)} 
                              className="intel-btn-sm success"
                              disabled={actionLoading === `approve-${item.id}`}
                            >
                              ✅
                            </button>
                            <button 
                              onClick={() => rejectEmail(item.id)} 
                              className="intel-btn-sm danger"
                            >
                              ❌
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* INCOMING TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "incoming" && (
          <div className="intel-incoming-tab">
            <div className="intel-tab-header">
              <h2>📥 Eingehende E-Mails</h2>
              <p>E-Mails von Netzbetreibern automatisch oder manuell zuordnen</p>
            </div>

            <div className="intel-incoming-info">
              <div className="intel-info-card">
                <h4>🔄 Automatische Zuordnung</h4>
                <p>Das System erkennt automatisch:</p>
                <ul>
                  <li>Absender-Domain → Netzbetreiber</li>
                  <li>Aktenzeichen im Betreff → Installation</li>
                  <li>INST-Nummer → Installation</li>
                </ul>
              </div>
              <div className="intel-info-card">
                <h4>📝 Manuelle Zuordnung</h4>
                <p>Bei unklaren E-Mails:</p>
                <ul>
                  <li>Installation auswählen</li>
                  <li>Referenznummer hinzufügen</li>
                  <li>System lernt daraus</li>
                </ul>
              </div>
            </div>

            <div className="intel-incoming-list">
              {(dashboard?.incomingEmails.recent || []).map(email => (
                <div key={email.id} className={`intel-incoming-item ${email.status.toLowerCase()}`}>
                  <div className="intel-incoming-header">
                    <span className="intel-incoming-from">{email.fromEmail}</span>
                    <span className={`intel-status ${email.status.toLowerCase()}`}>{email.status}</span>
                  </div>
                  <div className="intel-incoming-subject">{email.subject}</div>
                  <div className="intel-incoming-footer">
                    <span>{formatDate(email.receivedAt)}</span>
                    {email.matchConfidence !== null && (
                      <span className="intel-confidence">
                        Konfidenz: {Math.round(email.matchConfidence * 100)}%
                      </span>
                    )}
                    {email.status !== 'PROCESSED' && email.status !== 'MATCHED' && (
                      <button className="intel-btn-sm">Zuordnen</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* AUTOMATIONS TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "automations" && (
          <div className="intel-automations-tab">
            <div className="intel-tab-header">
              <h2>⚡ Automatisierungen</h2>
              <button onClick={() => setShowRuleModal(true)} className="intel-btn primary">
                + Neue Regel
              </button>
            </div>

            {/* Pending Executions */}
            {(dashboard?.automations.pendingCount || 0) > 0 && (
              <div className="intel-card warning">
                <div className="intel-card-header">
                  <h3>⏳ Ausstehende Automationen</h3>
                  <span className="intel-card-badge">{dashboard?.automations.pendingCount}</span>
                </div>
                <div className="intel-pending-automations">
                  {(dashboard?.automations.recent || []).filter(a => a.status === 'PENDING').map(auto => (
                    <div key={auto.id} className="intel-pending-auto">
                      <div className="intel-pending-info">
                        <strong>{auto.ruleName}</strong>
                        <span>{auto.actionType}</span>
                      </div>
                      <div className="intel-pending-actions">
                        <button className="intel-btn-sm success">✅ Ausführen</button>
                        <button className="intel-btn-sm danger">❌ Ablehnen</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules List */}
            <div className="intel-rules-grid">
              {automationRules.map(rule => (
                <div key={rule.id} className={`intel-rule-card ${rule.isActive ? '' : 'inactive'}`}>
                  <div className="intel-rule-header">
                    <h4>{rule.name}</h4>
                    <label className="intel-toggle">
                      <input 
                        type="checkbox" 
                        checked={rule.isActive} 
                        onChange={() => toggleRule(rule.id, rule.isActive)}
                      />
                      <span className="intel-toggle-slider"></span>
                    </label>
                  </div>
                  <p className="intel-rule-desc">{rule.description}</p>
                  <div className="intel-rule-meta">
                    <span className="intel-rule-trigger">{rule.triggerType}</span>
                    <span className="intel-rule-arrow">→</span>
                    <span className="intel-rule-action">{rule.actionType}</span>
                  </div>
                  <div className="intel-rule-stats">
                    <span>{rule.executionCount} ausgeführt</span>
                    <span>{rule.successCount} erfolgreich</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LEARNING TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "learning" && (
          <div className="intel-learning-tab">
            <div className="intel-tab-header">
              <h2>🎓 Learning & Analyse</h2>
              <p>Das System lernt kontinuierlich aus euren Daten</p>
            </div>

            <div className="intel-learning-grid">
              <div className="intel-learning-card">
                <div className="intel-learning-icon">📊</div>
                <h3>Netzbetreiber-Analyse</h3>
                <p>Analysiert Bearbeitungszeiten, Erfolgsquoten und typische Dokumentanforderungen für jeden Netzbetreiber.</p>
                <button onClick={calculateStats} className="intel-btn" disabled={actionLoading === "calculate"}>
                  {actionLoading === "calculate" ? "⏳ Berechne..." : "🔄 Neu berechnen"}
                </button>
              </div>

              <div className="intel-learning-card">
                <div className="intel-learning-icon">📧</div>
                <h3>E-Mail-Matching</h3>
                <p>Lernt aus manuellen Zuordnungen und verbessert automatisch die Erkennung von E-Mails.</p>
                <div className="intel-learning-stat">
                  <span>Zuordnungsrate:</span>
                  <span className="intel-learning-value">87%</span>
                </div>
              </div>

              <div className="intel-learning-card">
                <div className="intel-learning-icon">🔮</div>
                <h3>Prognosen</h3>
                <p>Berechnet Genehmigungswahrscheinlichkeiten und prognostiziert Bearbeitungszeiten.</p>
                <div className="intel-learning-stat">
                  <span>Genauigkeit:</span>
                  <span className="intel-learning-value">92%</span>
                </div>
              </div>

              <div className="intel-learning-card">
                <div className="intel-learning-icon">👤</div>
                <h3>Benutzerverhalten</h3>
                <p>Trackt Aktionen und generiert personalisierte Vorschläge zur Effizienzsteigerung.</p>
                <div className="intel-learning-stat">
                  <span>Aktionen heute:</span>
                  <span className="intel-learning-value">1,234</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SETTINGS TAB */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="intel-settings-tab">
            <div className="intel-tab-header">
              <h2>⚙️ Einstellungen</h2>
            </div>

            <div className="intel-settings-grid">
              <div className="intel-settings-section">
                <h3>📧 E-Mail Einstellungen</h3>
                <div className="intel-setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    E-Mails vor dem Senden freigeben
                  </label>
                  <p>Alle automatisch generierten E-Mails müssen manuell freigegeben werden.</p>
                </div>
                <div className="intel-setting-item">
                  <label>
                    <input type="checkbox" />
                    Auto-Freigabe für Standard-E-Mails
                  </label>
                  <p>Status-Benachrichtigungen automatisch senden ohne Freigabe.</p>
                </div>
              </div>

              <div className="intel-settings-section">
                <h3>⚡ Automatisierung</h3>
                <div className="intel-setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Automatisierungen aktivieren
                  </label>
                  <p>Erlaubt dem System automatische Aktionen basierend auf Regeln.</p>
                </div>
                <div className="intel-setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Kritische Aktionen freigeben
                  </label>
                  <p>Status-Änderungen und E-Mails an Kunden erfordern Freigabe.</p>
                </div>
              </div>

              <div className="intel-settings-section">
                <h3>🔔 Benachrichtigungen</h3>
                <div className="intel-setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Browser-Benachrichtigungen
                  </label>
                  <p>Push-Benachrichtigungen bei wichtigen Events.</p>
                </div>
                <div className="intel-setting-item">
                  <label>
                    <input type="checkbox" />
                    E-Mail-Zusammenfassung
                  </label>
                  <p>Tägliche Zusammenfassung per E-Mail.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
