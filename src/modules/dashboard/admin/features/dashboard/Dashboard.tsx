/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Baunity SMART DASHBOARD v3.0 - COMPLETE                                        ║
 * ║  Real-time KPIs, Pipeline, Activity Feed, Quick Actions                      ║
 * ║  - Korrekter Token: baunity_token                                               ║
 * ║  - Korrektes API-Mapping für Pipeline                                        ║
 * ║  - Korrekte Routen                                                           ║
 * ║  - totalKwp/MWp Anzeige                                                      ║
 * ║  - WebSocket Live-Updates                                                    ║
 * ║  - Korrektes Status-Mapping (Nachbesserung separat)                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  ChevronRight,
  FileText,
  Send,
  HelpCircle,
  Award,
  Calendar,
  Upload,
  Mail,
  Timer,
  Flame,
  Activity,
  Bell,
  Euro,
  Sun,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertCircle,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Skeleton, Avatar, Progress } from "../../components/ui/UIComponents";
import "./dashboard.css";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DashboardData {
  kpis: {
    total: number;
    open: number;
    thisWeek: number;
    thisMonth: number;
    openInvoicesCount: number;
    openInvoicesSum: number;
    totalKwp: number;
    avgProcessingDays: number;
    completionRate: number;
  };
  pipeline: PipelineStage[];
  urgent: UrgentItem[];
  activities: ActivityItem[];
  subUsers?: SubUserStats[];
}

interface PipelineStage {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface UrgentItem {
  id: number;
  publicId: string;
  customerName: string;
  status: string;
  daysWaiting: number;
  type: "overdue" | "sla" | "query" | "nachbesserung";
}

interface ActivityItem {
  id: number;
  publicId: string;
  customerName: string;
  action: string;
  status: string;
  timestamp: string;
  user?: string;
}

interface SubUserStats {
  id: number;
  name: string;
  email: string;
  company?: string;
  count: number;
}

interface User {
  name: string;
  email: string;
  role: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG - KORRIGIERTES STATUS MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const PIPELINE_CONFIG = [
  { key: "entwurf", label: "Entwurf", color: "#525866", icon: FileText },
  { key: "eingereicht", label: "Eingereicht", color: "#3b82f6", icon: Send },
  { key: "pruefung", label: "In Prüfung", color: "#EAD068", icon: Eye },
  { key: "warten_nb", label: "Beim NB", color: "#f59e0b", icon: Clock },
  { key: "nachbesserung", label: "Rückfrage", color: "#ef4444", icon: AlertCircle }, // ✅ SEPARAT!
  { key: "genehmigt", label: "Genehmigt", color: "#22c55e", icon: CheckCircle2 },
  { key: "abgeschlossen", label: "Fertig", color: "#06b6d4", icon: Award },
];

// Mapping von API Status-Keys zu Pipeline-Keys
const STATUS_KEY_MAP: Record<string, string> = {
  "entwurf": "entwurf",
  "ENTWURF": "entwurf",
  "eingereicht": "eingereicht",
  "EINGEREICHT": "eingereicht",
  "in-pruefung": "pruefung",
  "in_pruefung": "pruefung",
  "IN_PRUEFUNG": "pruefung",
  "pruefung": "pruefung",
  "warten-auf-nb": "warten_nb",
  "warten_auf_nb": "warten_nb",
  "WARTEN_AUF_NB": "warten_nb",
  "warten_nb": "warten_nb",
  "nachbesserung": "nachbesserung",
  "NACHBESSERUNG": "nachbesserung",
  "nb-genehmigt": "genehmigt",
  "nb_genehmigt": "genehmigt",
  "NB_GENEHMIGT": "genehmigt",
  "genehmigt": "genehmigt",
  "abgeschlossen": "abgeschlossen",
  "ABGESCHLOSSEN": "abgeschlossen",
  "storniert": "storniert",
  "STORNIERT": "storniert",
};

// ✨ SCHÖNE STATUS-LABELS für Anzeige
const STATUS_LABELS: Record<string, string> = {
  // Lowercase
  "entwurf": "Entwurf",
  "eingereicht": "Eingereicht",
  "in-pruefung": "In Prüfung",
  "in_pruefung": "In Prüfung",
  "pruefung": "In Prüfung",
  "warten-auf-nb": "Beim Netzbetreiber",
  "warten_auf_nb": "Beim Netzbetreiber",
  "warten_nb": "Beim Netzbetreiber",
  "nachbesserung": "Nachbesserung",
  "nb-genehmigt": "Genehmigt",
  "nb_genehmigt": "Genehmigt",
  "genehmigt": "Genehmigt",
  "abgeschlossen": "Abgeschlossen",
  "storniert": "Storniert",
  // Uppercase (Backend)
  "ENTWURF": "Entwurf",
  "EINGEREICHT": "Eingereicht",
  "IN_PRUEFUNG": "In Prüfung",
  "WARTEN_AUF_NB": "Beim Netzbetreiber",
  "NACHBESSERUNG": "Nachbesserung",
  "NB_GENEHMIGT": "Genehmigt",
  "NB_ABGELEHNT": "Abgelehnt",
  "ABGESCHLOSSEN": "Abgeschlossen",
  "STORNIERT": "Storniert",
};

// Helper um Status schön zu formatieren
const formatStatus = (status: string): string => {
  return STATUS_LABELS[status] || status?.replace(/_/g, ' ').replace(/-/g, ' ') || "Unbekannt";
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const formatRelativeTime = (dateStr: string | Date) => {
  if (!dateStr) return "";
  
  // Handle various date formats
  let date: Date;
  if (dateStr instanceof Date) {
    date = dateStr;
  } else if (typeof dateStr === 'string') {
    // Try parsing as ISO string first
    date = new Date(dateStr);
    // If invalid, try parsing as timestamp
    if (isNaN(date.getTime()) && !isNaN(Number(dateStr))) {
      date = new Date(Number(dateStr));
    }
  } else {
    return "";
  }
  
  // Check for Invalid Date
  if (isNaN(date.getTime())) return "";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins}m`;
  if (diffHours < 24) return `vor ${diffHours}h`;
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `vor ${diffDays}d`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const formatKwp = (kwp: number) => {
  if (kwp >= 1000) {
    return `${(kwp / 1000).toFixed(1)} MWp`;
  }
  return `${kwp.toFixed(1)} kWp`;
};

const daysOld = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / 86400000);
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// KPI Card with Trend
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
  trendLabel?: string;
  onClick?: () => void;
}> = ({ label, value, icon, color, trend, trendLabel, onClick }) => (
  <div className="dash-kpi" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
    <div className="dash-kpi__icon" style={{ background: color ? `${color}20` : undefined, color }}>
      {icon}
    </div>
    <div className="dash-kpi__content">
      <span className="dash-kpi__label">{label}</span>
      <span className="dash-kpi__value">{value}</span>
      {trend !== undefined && (
        <span className={`dash-kpi__trend ${trend >= 0 ? "dash-kpi__trend--up" : "dash-kpi__trend--down"}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
          {trendLabel && <span className="dash-kpi__trend-label">{trendLabel}</span>}
        </span>
      )}
    </div>
  </div>
);

// Pipeline Stage
const PipelineStageCard: React.FC<{
  stage: typeof PIPELINE_CONFIG[0];
  count: number;
  total: number;
  onClick: () => void;
}> = ({ stage, count, total, onClick }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const Icon = stage.icon;
  
  return (
    <div className="dash-pipeline__stage" onClick={onClick}>
      <div className="dash-pipeline__stage-header">
        <Icon size={16} style={{ color: stage.color }} />
        <span className="dash-pipeline__stage-label">{stage.label}</span>
      </div>
      <div className="dash-pipeline__stage-count" style={{ color: stage.color }}>
        {count}
      </div>
      <div className="dash-pipeline__stage-bar">
        <div 
          className="dash-pipeline__stage-fill"
          style={{ width: `${percentage}%`, background: stage.color }}
        />
      </div>
    </div>
  );
};

// Urgent Item
const UrgentCard: React.FC<{ item: UrgentItem; onClick: () => void }> = ({ item, onClick }) => {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "overdue": return { label: "Überfällig", color: "#ef4444", icon: <AlertTriangle size={14} /> };
      case "sla": return { label: "SLA Warnung", color: "#f59e0b", icon: <Timer size={14} /> };
      case "query": return { label: "Rückfrage", color: "#f59e0b", icon: <HelpCircle size={14} /> };
      case "nachbesserung": return { label: "Nachbesserung", color: "#ef4444", icon: <AlertCircle size={14} /> };
      default: return { label: "Dringend", color: "#ef4444", icon: <Flame size={14} /> };
    }
  };
  
  const typeInfo = getTypeInfo(item.type);
  
  return (
    <div className="dash-urgent__item" onClick={onClick}>
      <div className="dash-urgent__icon" style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
        {typeInfo.icon}
      </div>
      <div className="dash-urgent__content">
        <span className="dash-urgent__name">{item.customerName}</span>
        <span className="dash-urgent__id">{item.publicId}</span>
      </div>
      <div className="dash-urgent__meta">
        <Badge variant={item.type === "overdue" || item.type === "nachbesserung" ? "error" : "warning"} size="sm">
          {item.daysWaiting}d
        </Badge>
      </div>
    </div>
  );
};

// Activity Item
const ActivityRow: React.FC<{ item: ActivityItem; onClick: () => void }> = ({ item, onClick }) => {
  const getStatusColor = (status: string) => {
    if (!status) return "default";
    const s = status.toLowerCase().replace(/_/g, '').replace(/-/g, '');
    if (s.includes("genehmigt") || s.includes("abgeschlossen")) return "success";
    if (s.includes("nachbesserung") || s.includes("rückfrage") || s.includes("abgelehnt")) return "error";
    if (s.includes("nb") || s.includes("warten")) return "warning";
    if (s.includes("prüfung") || s.includes("pruefung")) return "purple";
    if (s.includes("eingereicht")) return "info";
    return "default";
  };

  // Format timestamp
  const timeDisplay = item.timestamp ? formatRelativeTime(item.timestamp) : "";

  return (
    <div className="dash-activity__item" onClick={onClick}>
      <div className="dash-activity__content">
        <span className="dash-activity__name">{item.customerName}</span>
      </div>
      <div className="dash-activity__meta">
        <Badge variant={getStatusColor(item.status)} size="sm">{formatStatus(item.status)}</Badge>
        {timeDisplay && <span className="dash-activity__time">{timeDisplay}</span>}
      </div>
    </div>
  );
};

// Quick Action Button
const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, onClick, badge }) => (
  <button className="dash-quick-action" onClick={onClick}>
    <div className="dash-quick-action__icon">
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="dash-quick-action__badge">{badge}</span>
      )}
    </div>
    <span className="dash-quick-action__label">{label}</span>
  </button>
);

// SubUser Card (für Whitelabel)
const SubUserCard: React.FC<{ user: SubUserStats; onClick: () => void }> = ({ user, onClick }) => (
  <div className="dash-subuser" onClick={onClick}>
    <Avatar name={user.name} size="sm" />
    <div className="dash-subuser__info">
      <span className="dash-subuser__name">{user.name}</span>
      {user.company && <span className="dash-subuser__company">{user.company}</span>}
    </div>
    <Badge variant="default" size="sm">{user.count}</Badge>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface DashboardProps {
  user?: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user: userProp }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [user, setUser] = useState<User | undefined>(userProp);
  const wsRef = useRef<WebSocket | null>(null);

  // Load user from localStorage if not provided
  useEffect(() => {
    if (!userProp) {
      try {
        const storedUser = localStorage.getItem("baunity_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [userProp]);

  // Load Dashboard Data (Cookie + Bearer-Token Auth)
  const loadData = useCallback(async () => {
    // Auth-Header: Cookie + Bearer-Token Fallback für Kunden ohne Session-Cookie
    const authHeaders: Record<string, string> = {};
    const token = localStorage.getItem("baunity_token");
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const dashboardRes = await fetch("/api/dashboard/summary", {
        credentials: 'include',
        headers: authHeaders,
      });

      if (!dashboardRes.ok) {
        if (dashboardRes.status === 401) {
          if (!window.location.pathname.includes('/login')) {
            navigate("/login?expired=1");
          }
          return;
        }
        throw new Error("Fehler beim Laden der Daten");
      }

      const dashboardData = await dashboardRes.json();

      const installationsRes = await fetch("/api/installations?limit=500", {
        credentials: 'include',
        headers: authHeaders,
      });

      let items: any[] = [];
      if (installationsRes.ok) {
        const installationsData = await installationsRes.json();
        items = installationsData.data || installationsData || [];
      }

      // Invoice data - optional, ignore errors
      let openInvoicesCount = 0;
      let openInvoicesSum = 0;
      try {
        const invoicesRes = await fetch("/api/rechnungen?limit=500", {
          credentials: 'include',
          headers: authHeaders,
        });
        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData.data || []);
          const openInvoices = invoices.filter((inv: any) => 
            inv.status === "OFFEN" || inv.status === "UEBERFAELLIG"
          );
          openInvoicesCount = openInvoices.length;
          openInvoicesSum = openInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.betragBrutto) || 0), 0);
        }
      } catch (e) {
        // Ignore invoice errors
      }
      
      // Helper to get customer name from various possible fields
      const getCustomerName = (item: any): string => {
        return item.customerName || item.kundenname || item.kunde?.name || 
               item.anlagenbetreiberName || item.betreiberName || 
               `${item.vorname || ''} ${item.nachname || ''}`.trim() || "Unbekannt";
      };

      // Use pipeline from dashboard API if available, otherwise calculate
      // Mapping: Backend-Pipeline-Keys → Frontend-Pipeline-Keys
      const API_KEY_TO_FRONTEND: Record<string, string> = {
        eingang: "entwurf",
        beim_nb: "warten_nb",
        rueckfrage: "nachbesserung",
        genehmigt: "genehmigt",
        ibn: "abgeschlossen",
        fertig: "abgeschlossen",
      };

      let pipeline: PipelineStage[] = [];
      if (dashboardData.pipeline && Array.isArray(dashboardData.pipeline)) {
        // API-Pipeline zu Frontend-Keys mappen
        const apiCountByFrontendKey = new Map<string, number>();
        for (const p of dashboardData.pipeline) {
          const frontendKey = API_KEY_TO_FRONTEND[p.key] || p.key;
          apiCountByFrontendKey.set(frontendKey, (apiCountByFrontendKey.get(frontendKey) || 0) + (p.count || 0));
        }
        pipeline = PIPELINE_CONFIG.map(stage => ({
          ...stage,
          count: apiCountByFrontendKey.get(stage.key) || 0,
        }));
      } else {
        pipeline = PIPELINE_CONFIG.map(stage => {
          const count = items.filter((item: any) => {
            const mappedStatus = STATUS_KEY_MAP[item.status] || item.status;
            return mappedStatus === stage.key;
          }).length;
          return { ...stage, count };
        });
      }

      // Calculate this week/month
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const thisWeek = items.filter((item: any) => new Date(item.createdAt) >= weekAgo).length;
      const thisMonth = items.filter((item: any) => new Date(item.createdAt) >= monthStart).length;

      // Calculate total kWp - try different field names and parse JSON if needed
      const totalKwp = items.reduce((sum: number, item: any) => {
        // Try different possible field names
        let kwp = 0;
        
        // Direct fields
        if (item.totalKwp) kwp = Number(item.totalKwp);
        else if (item.totalPvKwPeak) kwp = Number(item.totalPvKwPeak);
        else if (item.anlagenLeistung) kwp = Number(item.anlagenLeistung);
        else if (item.leistung) kwp = Number(item.leistung);
        else if (item.pvLeistung) kwp = Number(item.pvLeistung);
        else if (item.kwp) kwp = Number(item.kwp);
        
        // Try technicalData object
        else if (item.technicalData) {
          let td = item.technicalData;
          // Parse JSON if it's a string
          if (typeof td === 'string') {
            try { td = JSON.parse(td); } catch (e) { td = null; }
          }
          if (td) {
            if (td.totalPvKwPeak) kwp = Number(td.totalPvKwPeak);
            else if (td.totalKwp) kwp = Number(td.totalKwp);
            else if (td.anlagenLeistung) kwp = Number(td.anlagenLeistung);
            else if (td.pv?.totalKwp) kwp = Number(td.pv.totalKwp);
            else if (td.pv?.count && td.pv?.powerWp) {
              kwp = (Number(td.pv.count) * Number(td.pv.powerWp)) / 1000;
            }
          }
        }
        
        // Try wizardData for older records
        else if (item.wizardData) {
          let wd = item.wizardData;
          if (typeof wd === 'string') {
            try { wd = JSON.parse(wd); } catch (e) { wd = null; }
          }
          if (wd) {
            if (wd.technicalData?.totalPvKwPeak) kwp = Number(wd.technicalData.totalPvKwPeak);
            else if (wd.anlage?.leistung) kwp = Number(wd.anlage.leistung);
          }
        }
        
        return sum + (kwp || 0);
      }, 0);

      // Calculate urgent items
      const urgent: UrgentItem[] = [];
      
      // Nachbesserung items (handle both UPPERCASE and lowercase)
      items
        .filter((item: any) => {
          const status = String(item.status || '').toUpperCase();
          return status === "NACHBESSERUNG";
        })
        .forEach((item: any) => {
          urgent.push({
            id: item.id,
            publicId: item.publicId,
            customerName: getCustomerName(item),
            status: item.status,
            daysWaiting: daysOld(item.updatedAt),
            type: "nachbesserung",
          });
        });

      // Overdue items (> 14 days at NB)
      items
        .filter((item: any) => {
          const status = String(item.status || '').toUpperCase().replace(/-/g, "_");
          return status === "WARTEN_AUF_NB" && daysOld(item.updatedAt) > 14;
        })
        .forEach((item: any) => {
          urgent.push({
            id: item.id,
            publicId: item.publicId,
            customerName: getCustomerName(item),
            status: item.status,
            daysWaiting: daysOld(item.updatedAt),
            type: "overdue",
          });
        });

      // Sort by days waiting (descending)
      urgent.sort((a, b) => b.daysWaiting - a.daysWaiting);

      // Recent activities (last 10 status changes)
      // Use activities from dashboard API if available, otherwise calculate from items
      let activities: ActivityItem[] = [];
      
      if (dashboardData.activities && Array.isArray(dashboardData.activities)) {
        // Map from dashboard API format
        // Show customerName (Anlagenbetreiber), NOT who made the change
        activities = dashboardData.activities.slice(0, 10).map((a: any) => ({
          id: a.id,
          publicId: a.publicId,
          customerName: a.customerName || getCustomerName(a),
          action: a.statusLabel || formatStatus(a.status),
          status: a.status || a.statusLabel,
          // Ensure timestamp is in a parseable format
          timestamp: a.updatedAt ? String(a.updatedAt) : (a.timestamp ? String(a.timestamp) : ""),
        }));
      } else {
        // Calculate from items
        activities = items
          .filter((item: any) => item.updatedAt !== item.createdAt)
          .sort((a: any, b: any) => {
            const dateA = new Date(b.updatedAt || 0).getTime();
            const dateB = new Date(a.updatedAt || 0).getTime();
            return dateA - dateB;
          })
          .slice(0, 10)
          .map((item: any) => ({
            id: item.id,
            publicId: item.publicId,
            customerName: item.customerName || getCustomerName(item),
            action: formatStatus(item.status),
            status: item.statusLabel || item.status,
            timestamp: item.updatedAt || "",
          }));
      }

      // Calculate completion rate
      const completed = items.filter((item: any) => 
        ["abgeschlossen", "nb-genehmigt", "nb_genehmigt", "genehmigt", "ABGESCHLOSSEN", "NB_GENEHMIGT"].includes(item.status)
      ).length;
      const completionRate = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

      // Calculate average processing time from dashboard data or items
      const avgProcessingDays = dashboardData.avgStartHours 
        ? Math.round(dashboardData.avgStartHours / 24)
        : 0;

      // SubUsers (empty for now, would come from enterprise endpoint)
      const subUsers: SubUserStats[] = [];

      setData({
        kpis: {
          total: dashboardData.totalInstallations || items.length,
          open: dashboardData.openNetRegistrations || items.filter((item: any) => 
            !["abgeschlossen", "storniert", "ABGESCHLOSSEN", "STORNIERT"].includes(item.status)
          ).length,
          thisWeek,
          thisMonth,
          openInvoicesCount,
          openInvoicesSum,
          totalKwp,
          avgProcessingDays,
          completionRate,
        },
        pipeline,
        urgent: urgent.slice(0, 5),
        activities, // Use our processed activities
        subUsers,
      });
      
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  }, [navigate]);

  // WebSocket for live updates
  useEffect(() => {
    const token = localStorage.getItem("baunity_token");
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    let wsUrl: string;
    if (baseUrl) {
      const url = new URL(baseUrl);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${url.host}/ws/installations?token=${token}`;
    } else if (window.baunityDesktop?.isDesktop) {
      wsUrl = `wss://baunity.de/ws/installations?token=${token}`;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}/ws/installations?token=${token}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "subscribe",
          channels: ["installations", "tasks", "intelligence"],
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const evt = msg.event;
          if (
            evt === "installation:created" ||
            evt === "installation:updated" ||
            evt === "installation:status_changed" ||
            evt === "task:created" ||
            evt === "stats:updated" ||
            evt === "alert:new"
          ) {
            loadData();
          }
        } catch (e) {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        // Silent fail - WebSocket is optional
      };

      return () => {
        ws.close();
      };
    } catch (e) {
      // WebSocket not available
    }
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Navigation helpers
  // Navigate to installation detail (use ?selected=id parameter)
  const goToInstallation = (id: number) => navigate(`/netzanmeldungen?selected=${id}`);
  const goToPipelineStage = (status: string) => navigate(`/netzanmeldungen?status=${status}`);

  // Loading state
  if (loading) return <DashboardSkeleton />;

  // Error state
  if (error) {
    return (
      <div className="dash-error">
        <AlertTriangle size={48} />
        <h2>Fehler beim Laden</h2>
        <p>{safeString(error)}</p>
        <Button onClick={loadData}>Erneut versuchen</Button>
      </div>
    );
  }

  if (!data) return null;

  const totalPipeline = data.pipeline.reduce((sum, s) => sum + s.count, 0);
  const isStaff = user?.role === "ADMIN" || user?.role === "MITARBEITER";
  const isKunde = user?.role === "KUNDE";

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-header__left">
          <h1 className="dash-title">{getGreeting()}, {user?.name?.split(" ")[0] || "Benutzer"}</h1>
          <p className="dash-subtitle">
            {data.kpis.open} offene Anmeldungen • Letzte Aktualisierung: {formatRelativeTime(lastUpdate.toISOString())}
          </p>
        </div>
        <div className="dash-header__right">
          <Button variant="ghost" size="sm" onClick={loadData} icon={<RefreshCw size={16} />}>
            Aktualisieren
          </Button>
          <Button variant="primary" onClick={() => window.open("/wizard", "_blank")} icon={<Plus size={16} />}>
            Neuer Lead
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="dash-kpis">
        <KpiCard
          label="Gesamt"
          value={data.kpis.total}
          icon={<Zap size={20} />}
          color="#D4A843"
          onClick={() => navigate("/netzanmeldungen")}
        />
        <KpiCard
          label="Offen"
          value={data.kpis.open}
          icon={<Clock size={20} />}
          color="#f59e0b"
          onClick={() => navigate("/netzanmeldungen?status=open")}
        />
        <KpiCard
          label="Diese Woche"
          value={data.kpis.thisWeek}
          icon={<Calendar size={20} />}
          color="#22c55e"
        />
        <KpiCard
          label="Beim NB"
          value={Array.isArray(data.pipeline) ? (data.pipeline.find(p => p.key === "warten_nb")?.count || 0) : 0}
          icon={<Send size={20} />}
          color="#f59e0b"
          onClick={() => navigate("/netzanmeldungen?status=warten_auf_nb")}
        />
        {/* ✅ NEU: Gesamt kWp/MWp */}
        <KpiCard
          label="Anlagenleistung"
          value={formatKwp(data.kpis.totalKwp)}
          icon={<Sun size={20} />}
          color="#eab308"
        />
        {/* Rechnungen nur für Staff und Kunden */}
        {(isStaff || isKunde) && (
          <KpiCard
            label="Offene Rechnungen"
            value={formatCurrency(data.kpis.openInvoicesSum)}
            icon={<Euro size={20} />}
            color="#a855f7"
            onClick={() => navigate("/rechnungen")}
          />
        )}
      </div>

      {/* Main Grid */}
      <div className="dash-grid">
        {/* Left Column */}
        <div className="dash-grid__left">
          {/* Handlungsbedarf / Urgent Items — deaktiviert */}

          {/* Pipeline */}
          <Card className="dash-card">
            <CardHeader>
              <div className="dash-card__header-left">
                <Activity size={18} />
                <CardTitle>Pipeline</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/netzanmeldungen")}>
                Details <ChevronRight size={14} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="dash-pipeline">
                {PIPELINE_CONFIG.filter(s => s.key !== "storniert").map((stage) => {
                  const pipelineStage = Array.isArray(data.pipeline) ? data.pipeline.find(p => p.key === stage.key) : undefined;
                  return (
                    <PipelineStageCard
                      key={stage.key}
                      stage={stage}
                      count={pipelineStage?.count || 0}
                      total={totalPipeline}
                      onClick={() => goToPipelineStage(stage.key)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="dash-card">
            <CardHeader>
              <div className="dash-card__header-left">
                <Zap size={18} />
                <CardTitle>Schnellaktionen</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="dash-quick-actions">
                <QuickAction icon={<Plus size={18} />} label="Neuer Lead" onClick={() => window.open("/wizard", "_blank")} />
                <QuickAction icon={<Upload size={18} />} label="Import" onClick={() => navigate("/import")} />
                <QuickAction icon={<Mail size={18} />} label="E-Mails" onClick={() => navigate("/emails")} badge={0} />
                <QuickAction icon={<FileText size={18} />} label="Dokumente" onClick={() => navigate("/dokumente")} />
              </div>
            </CardContent>
          </Card>

          {/* SubUsers (für Whitelabel-Kunden) */}
          {isKunde && data.subUsers && data.subUsers.length > 0 && (
            <Card className="dash-card">
              <CardHeader>
                <div className="dash-card__header-left">
                  <Users size={18} />
                  <CardTitle>Subunternehmer</CardTitle>
                  <Badge variant="default" size="sm">{data.subUsers.length}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/benutzer")}>
                  Verwalten <ChevronRight size={14} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="dash-subusers">
                  {data.subUsers.slice(0, 5).map((su) => (
                    <SubUserCard 
                      key={su.id} 
                      user={su} 
                      onClick={() => navigate(`/netzanmeldungen?createdBy=${su.id}`)} 
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="dash-grid__right">
          {/* Performance Summary */}
          <Card className="dash-card">
            <CardHeader>
              <div className="dash-card__header-left">
                <TrendingUp size={18} />
                <CardTitle>Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="dash-performance">
                <div className="dash-performance__stat">
                  <span className="dash-performance__label">Erfolgsquote</span>
                  <span className="dash-performance__value">{data.kpis.completionRate}%</span>
                  <Progress value={data.kpis.completionRate} variant="success" size="sm" />
                </div>
                <div className="dash-performance__divider" />
                <div className="dash-performance__stat">
                  <span className="dash-performance__label">Ø Bearbeitungszeit</span>
                  <span className="dash-performance__value">{data.kpis.avgProcessingDays} Tage</span>
                  <span className="dash-performance__sub">bis Genehmigung</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="dash-card dash-card--activity">
            <CardHeader>
              <div className="dash-card__header-left">
                <Bell size={18} />
                <CardTitle>Letzte Aktivitäten</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/netzanmeldungen")}>
                Alle <ChevronRight size={14} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="dash-activity__list">
                {data.activities.length > 0 ? (
                  data.activities.slice(0, 8).map((item) => (
                    <ActivityRow key={item.id} item={item} onClick={() => goToInstallation(item.id)} />
                  ))
                ) : (
                  <div className="dash-activity__empty">Keine Aktivitäten</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

const DashboardSkeleton: React.FC = () => (
  <div className="dash">
    <div className="dash-header">
      <div>
        <Skeleton width={200} height={32} />
        <Skeleton width={300} height={20} className="mt-2" />
      </div>
    </div>
    <div className="dash-kpis">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} height={100} />
      ))}
    </div>
    <div className="dash-grid">
      <div className="dash-grid__left">
        <Skeleton height={200} />
        <Skeleton height={300} />
        <Skeleton height={150} />
      </div>
      <div className="dash-grid__right">
        <Skeleton height={150} />
        <Skeleton height={400} />
      </div>
    </div>
  </div>
);

export default Dashboard;
