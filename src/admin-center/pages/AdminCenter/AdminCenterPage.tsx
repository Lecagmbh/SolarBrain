// pages/AdminCenter/AdminCenterPage.tsx
// Premium Admin Control Center - Liquid Glass Design
import React, { useState, useEffect } from 'react';
import {
  Shield, Activity, Bug, Bell, BarChart3, AlertTriangle, Users, Mail,
  RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Zap, Clock,
  FileText, Database, Server, Eye, ChevronRight, Sparkles,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Settings, CreditCard,
  type LucideIcon
} from 'lucide-react';
import { adminCenterApi } from '../../api/admin-center.api';
import { ActivityLogsComponent } from './components/ActivityLogsComponent';
import { BugReportsComponent } from './components/BugReportsComponent';
import { AnnouncementsComponent } from './components/AnnouncementsComponent';
import AutomationenTab from '../../components/AutomationenTab';
import BankIntegrationTab from '../../components/BankIntegrationTab';
import './AdminCenterPage.css';

interface DashboardData {
  overview: { totalUsers: number; activeUsers: number; totalInstallations: number; totalKunden: number };
  today: { logins: number; errors: number; installations: number };
  thisWeek: { newUsers: number; installations: number };
  bugs: { open: number; critical: number };
  email: { sentToday: number; failedThisWeek: number };
  recentActivity: Array<{ category: string; action: string; user?: { name: string }; userName?: string; createdAt: string }>;
  recentErrors: Array<{ action: string; createdAt: string }>;
}

type TabType = 'dashboard' | 'logs' | 'bugs' | 'announcements' | 'automations' | 'bank';

export const AdminCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await adminCenterApi.getDashboard();
      setDashboardData(data);
    } catch (error) { 
      console.error('Failed to load dashboard:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3, count: null },
    { id: 'logs' as TabType, label: 'Activity Logs', icon: Activity, count: null },
    { id: 'bugs' as TabType, label: 'Bug Reports', icon: Bug, count: dashboardData?.bugs.open || null },
    { id: 'announcements' as TabType, label: 'Announcements', icon: Bell, count: null },
    { id: 'automations' as TabType, label: 'Automatisierungen', icon: Settings, count: null },
    { id: 'bank' as TabType, label: 'Bank-Sync', icon: CreditCard, count: null },
  ];

  return (
    <div className="admin-center-page">
      {/* Header */}
      <div className="admin-center-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <Shield size={28} />
            </div>
            <div className="header-text">
              <h1>Admin Control Center</h1>
              <p>System-Monitoring, Logs & Verwaltung</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={loadDashboard} 
              className={`btn-refresh ${loading ? 'loading' : ''}`}
              title="Aktualisieren"
            >
              <RefreshCw size={18} />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="tab-badge">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="admin-center-content">
        {activeTab === 'dashboard' && (
          loading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <span>Dashboard wird geladen...</span>
            </div>
          ) : dashboardData ? (
            <DashboardView data={dashboardData} onRefresh={loadDashboard} />
          ) : (
            <div className="error-state">
              <AlertCircle size={48} />
              <p>Dashboard konnte nicht geladen werden</p>
              <button onClick={loadDashboard} className="btn-retry">Erneut versuchen</button>
            </div>
          )
        )}
        {activeTab === 'logs' && <ActivityLogsComponent />}
        {activeTab === 'bugs' && <BugReportsComponent />}
        {activeTab === 'announcements' && <AnnouncementsComponent />}
        {activeTab === 'automations' && <AutomationenTab />}
        {activeTab === 'bank' && <BankIntegrationTab />}
      </div>
    </div>
  );
};

// Dashboard View Component
const DashboardView: React.FC<{ data: DashboardData; onRefresh: () => void }> = ({ data }) => {
  return (
    <div className="dashboard-view">
      {/* Main Stats Row */}
      <div className="stats-grid">
        <StatCard
          title="Benutzer"
          value={data.overview.totalUsers}
          subtitle={`${data.overview.activeUsers} aktiv`}
          icon={Users}
          color="blue"
          trend={data.thisWeek.newUsers > 0 ? `+${data.thisWeek.newUsers} diese Woche` : undefined}
          trendUp={data.thisWeek.newUsers > 0}
        />
        <StatCard
          title="Installationen"
          value={data.overview.totalInstallations}
          subtitle={`+${data.today.installations} heute`}
          icon={Zap}
          color="emerald"
          trend={data.thisWeek.installations > 0 ? `+${data.thisWeek.installations} diese Woche` : undefined}
          trendUp={true}
        />
        <StatCard
          title="Offene Bugs"
          value={data.bugs.open}
          subtitle={`${data.bugs.critical} kritisch`}
          icon={Bug}
          color={data.bugs.critical > 0 ? 'red' : 'amber'}
          alert={data.bugs.critical > 0}
        />
        <StatCard
          title="Emails heute"
          value={data.email.sentToday}
          subtitle={`${data.email.failedThisWeek} fehlgeschlagen`}
          icon={Mail}
          color="violet"
        />
      </div>

      {/* Secondary Stats */}
      <div className="secondary-stats">
        <MiniStatCard label="Logins heute" value={data.today.logins} icon={Users} />
        <MiniStatCard label="Fehler heute" value={data.today.errors} icon={AlertTriangle} alert={data.today.errors > 0} />
        <MiniStatCard label="Kunden gesamt" value={data.overview.totalKunden} icon={FileText} />
        <MiniStatCard label="Neue User" value={data.thisWeek.newUsers} icon={TrendingUp} />
      </div>

      {/* Activity & Errors Grid */}
      <div className="activity-grid">
        {/* Recent Activity */}
        <div className="activity-card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={20} />
              <span>Letzte Aktivitäten</span>
            </div>
            <button className="btn-more">
              Alle <ChevronRight size={16} />
            </button>
          </div>
          <div className="activity-list">
            {data.recentActivity.length === 0 ? (
              <div className="empty-state">
                <Clock size={32} />
                <p>Keine Aktivitäten</p>
              </div>
            ) : (
              data.recentActivity.slice(0, 8).map((activity, idx) => (
                <ActivityItem key={idx} activity={activity} />
              ))
            )}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="activity-card errors-card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={20} />
              <span>Letzte Fehler</span>
            </div>
            {data.recentErrors.length > 0 && (
              <span className="error-count">{data.recentErrors.length}</span>
            )}
          </div>
          <div className="activity-list">
            {data.recentErrors.length === 0 ? (
              <div className="empty-state success">
                <CheckCircle2 size={40} />
                <p>Keine Fehler in letzter Zeit</p>
                <span>System läuft einwandfrei</span>
              </div>
            ) : (
              data.recentErrors.slice(0, 6).map((error, idx) => (
                <ErrorItem key={idx} error={error} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="system-health">
        <div className="card-header">
          <div className="card-title">
            <Server size={20} />
            <span>System Status</span>
          </div>
        </div>
        <div className="health-grid">
          <HealthIndicator label="API" status="online" />
          <HealthIndicator label="Datenbank" status="online" />
          <HealthIndicator label="Email Service" status={data.email.failedThisWeek > 5 ? 'warning' : 'online'} />
          <HealthIndicator label="Hintergrund-Jobs" status="online" />
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'violet';
  alert?: boolean;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color, alert, trend, trendUp }) => {
  return (
    <div className={`stat-card ${color} ${alert ? 'alert' : ''}`}>
      <div className="stat-card-content">
        <div className="stat-info">
          <span className="stat-title">{title}</span>
          <span className="stat-value">{value.toLocaleString('de-DE')}</span>
          <span className="stat-subtitle">{subtitle}</span>
          {trend && (
            <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
              {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend}
            </span>
          )}
        </div>
        <div className="stat-icon">
          <Icon size={24} />
        </div>
      </div>
      {alert && <div className="alert-pulse" />}
    </div>
  );
};

// Mini Stat Card
const MiniStatCard: React.FC<{ label: string; value: number; icon: LucideIcon; alert?: boolean }> = ({
  label, value, icon: Icon, alert
}) => (
  <div className={`mini-stat ${alert ? 'alert' : ''}`}>
    <Icon size={18} />
    <div className="mini-stat-content">
      <span className="mini-stat-value">{value.toLocaleString('de-DE')}</span>
      <span className="mini-stat-label">{label}</span>
    </div>
  </div>
);

// Activity Item
const ActivityItem: React.FC<{ activity: { category: string; action: string; user?: { name: string }; userName?: string; createdAt: string } }> = ({ activity }) => {
  const getActivityIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      AUTH: <Users size={14} />,
      USER: <Users size={14} />,
      INSTALLATION: <Zap size={14} />,
      EMAIL: <Mail size={14} />,
      ERROR: <AlertTriangle size={14} />,
      DOCUMENT: <FileText size={14} />,
    };
    return icons[category] || <Activity size={14} />;
  };

  const getCategoryClass = (category: string) => {
    const classes: Record<string, string> = {
      AUTH: 'blue',
      USER: 'emerald',
      INSTALLATION: 'violet',
      EMAIL: 'amber',
      ERROR: 'red',
      DOCUMENT: 'cyan',
    };
    return classes[category] || 'slate';
  };

  const formatTimeAgo = (date: string) => {
    const diffMins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    return `vor ${Math.floor(diffHours / 24)} Tag(en)`;
  };

  return (
    <div className="activity-item">
      <div className={`activity-icon ${getCategoryClass(activity.category)}`}>
        {getActivityIcon(activity.category)}
      </div>
      <div className="activity-content">
        <span className="activity-action">{activity.action}</span>
        <span className="activity-meta">
          {activity.user?.name || activity.userName || 'System'} • {formatTimeAgo(activity.createdAt)}
        </span>
      </div>
    </div>
  );
};

// Error Item
const ErrorItem: React.FC<{ error: { action: string; createdAt: string } }> = ({ error }) => {
  const formatTimeAgo = (date: string) => {
    const diffMins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    return `vor ${Math.floor(diffHours / 24)} Tag(en)`;
  };

  return (
    <div className="error-item">
      <AlertCircle size={16} />
      <div className="error-content">
        <span className="error-action">{error.action}</span>
        <span className="error-time">{formatTimeAgo(error.createdAt)}</span>
      </div>
    </div>
  );
};

// Health Indicator
const HealthIndicator: React.FC<{ label: string; status: 'online' | 'warning' | 'offline' }> = ({ label, status }) => (
  <div className={`health-indicator ${status}`}>
    <div className="health-dot" />
    <span className="health-label">{label}</span>
    <span className="health-status">
      {status === 'online' ? 'Online' : status === 'warning' ? 'Warnung' : 'Offline'}
    </span>
  </div>
);

export default AdminCenterPage;
