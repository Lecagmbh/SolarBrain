/**
 * SMART DASHBOARD COMPONENT
 * Unified admin dashboard with KPIs, pipeline, and activity
 * Mit Echtzeit-Updates via WebSocket
 */

import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Zap,
  Building2,
  Mail,
  Receipt,
  Users,
  Factory,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { KpiCard } from "./KpiCard";
import { WorkflowPipeline } from "./WorkflowPipeline";
// Deaktiviert – Alert-System wird überarbeitet
// import { AlertsPanel } from "./AlertsPanel";
import { ActivityFeed } from "./ActivityFeed";
import { QuickActions } from "./QuickActions";
import { LongestWaiting } from "./LongestWaiting";
import { InsightsPanel } from "./InsightsPanel";
import { PredictionsPanel } from "./PredictionsPanel";
import { useControlCenter, useSystemHealth } from "../hooks/useControlCenter";
import { useWebSocket } from "../../../hooks/useWebSocket";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

export function SmartDashboard() {
  const { data, loading, error, refresh } = useControlCenter();
  const { health } = useSystemHealth();
  const { subscribe, isConnected } = useWebSocket();

  // Echtzeit-Updates via WebSocket
  const handleInstallationUpdate = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleStatsUpdate = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleAlertNew = useCallback(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubs = [
      subscribe("installation:created", handleInstallationUpdate),
      subscribe("installation:updated", handleInstallationUpdate),
      subscribe("installation:status_changed", handleInstallationUpdate),
      subscribe("stats:updated", handleStatsUpdate),
      subscribe("alert:new", handleAlertNew),
      subscribe("email:sent", handleInstallationUpdate),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [subscribe, handleInstallationUpdate, handleStatsUpdate, handleAlertNew]);

  if (loading && !data) {
    return (
      <div className="dashboard-container">
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "1rem",
          color: "var(--dash-text-muted, #a1a1aa)",
        }}>
          <div style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(212, 168, 67, 0.2)",
            borderTopColor: "var(--dash-primary, #D4A843)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{ fontSize: "0.875rem" }}>Lade Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "0.75rem",
          color: "var(--dash-text-muted, #a1a1aa)",
        }}>
          <AlertCircle size={32} style={{ color: "var(--dash-text-subtle, #71717a)" }} />
          <span style={{ fontSize: "0.875rem" }}>Fehler: {safeString(error)}</span>
          <button
            onClick={refresh}
            className="quick-action"
            style={{ marginTop: "0.5rem" }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, pipeline, alerts = [], recentActivity = [], longestWaiting = [] } = data;

  return (
    <div className="dashboard-container">
      <motion.div
        className="dashboard-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
          },
        }}
      >
        {/* Header */}
        <motion.header
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div>
            <h1 className="dashboard-header__greeting">
              <span>Control Center</span>
            </h1>
            <p className="dashboard-header__subtitle">Unified Admin Dashboard</p>
          </div>
          <div className="dashboard-header__actions">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                background: isConnected ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${isConnected ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                borderRadius: "var(--dash-radius-sm, 12px)",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: isConnected ? "var(--dash-success, #10b981)" : "var(--dash-danger, #ef4444)",
              }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isConnected ? "var(--dash-success, #10b981)" : "var(--dash-danger, #ef4444)",
              }} />
              {isConnected ? "Live" : "Offline"}
            </div>
            {health && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  background: health.status === "ok"
                    ? "rgba(16, 185, 129, 0.1)"
                    : health.status === "warning"
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${
                    health.status === "ok"
                      ? "rgba(16, 185, 129, 0.2)"
                      : health.status === "warning"
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(239, 68, 68, 0.2)"
                  }`,
                  borderRadius: "var(--dash-radius-sm, 12px)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: health.status === "ok"
                    ? "var(--dash-success, #10b981)"
                    : health.status === "warning"
                    ? "var(--dash-warning, #f59e0b)"
                    : "var(--dash-danger, #ef4444)",
                }}
              >
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: health.status === "ok"
                    ? "var(--dash-success, #10b981)"
                    : health.status === "warning"
                    ? "var(--dash-warning, #f59e0b)"
                    : "var(--dash-danger, #ef4444)",
                }} />
                {health.status === "ok" ? "System OK" : health.status === "warning" ? "Warnung" : "Fehler"}
              </div>
            )}
            <motion.button
              className="quick-action"
              onClick={refresh}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </motion.button>
          </div>
        </motion.header>

        {/* KPI Grid */}
        <motion.div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <KpiCard
            icon={<LayoutDashboard size={16} />}
            value={kpis.totalInstallations.value}
            label={kpis.totalInstallations.label}
            trend={kpis.totalInstallations.trend}
            highlight
          />
          <KpiCard
            icon={<Zap size={16} />}
            value={kpis.activeInstallations.value}
            label={kpis.activeInstallations.label}
            showBar
            barValue={kpis.activeInstallations.value}
            barMax={kpis.totalInstallations.value || 1}
          />
          <KpiCard
            icon={<Building2 size={16} />}
            value={kpis.beimNb.value}
            label={kpis.beimNb.label}
            subtext={`Ø ${kpis.beimNb.avgWaitDays || 0} Tage Wartezeit`}
            warning={kpis.beimNb.value > 20}
          />
          <KpiCard
            icon={<Mail size={16} />}
            value={kpis.emailsToday.value}
            label={kpis.emailsToday.label}
            trend={kpis.emailsToday.trend}
          />
          <KpiCard
            icon={<Receipt size={16} />}
            value={kpis.openInvoices.value}
            label={kpis.openInvoices.label}
            subtext={
              kpis.openInvoices.overdue
                ? `${kpis.openInvoices.overdue} überfällig`
                : undefined
            }
            warning={kpis.openInvoices.overdue ? kpis.openInvoices.overdue > 0 : false}
          />
          <KpiCard
            icon={<Users size={16} />}
            value={kpis.activeUsers.value}
            label={kpis.activeUsers.label}
            subtext={`von ${kpis.activeUsers.total} Gesamt`}
          />
          <KpiCard
            icon={<Factory size={16} />}
            value={kpis.netzbetreiber.value}
            label={kpis.netzbetreiber.label}
          />
          <KpiCard
            icon={<AlertCircle size={16} />}
            value={kpis.errors.value}
            label={kpis.errors.label}
            error={kpis.errors.value > 0}
          />
        </motion.div>

        {/* Pipeline */}
        <motion.section
          className="glass-card glass-card--no-hover"
          style={{ padding: "24px" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WorkflowPipeline data={pipeline} />
        </motion.section>

        {/* Main Content Grid - Two columns */}
        <div className="dashboard-row">
          {/* Left Column */}
          <motion.div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* AlertsPanel deaktiviert – wird überarbeitet */}
            {longestWaiting.length > 0 && <LongestWaiting items={longestWaiting} />}
            <QuickActions />
          </motion.div>

          {/* Right Column */}
          <motion.div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PredictionsPanel />
            <InsightsPanel />
            <ActivityFeed activities={recentActivity} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
