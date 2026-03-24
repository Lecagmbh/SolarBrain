import React, { useState, useEffect, useCallback } from 'react';
import {
  ToggleLeft, ToggleRight, AlertTriangle, ShieldCheck, Server,
  Database, HardDrive, Cpu, RefreshCw, Play, Unlock, Globe,
  Heart, Zap, DollarSign, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { automationsApi } from '../api/automations.api';

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// ============================================
// STYLES - Dark theme, inline CSSProperties
// ============================================

const styles = {
  container: {
    padding: '24px',
    color: '#e2e8f0',
    maxWidth: '1400px',
    margin: '0 auto',
  } as React.CSSProperties,
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '4px',
  } as React.CSSProperties,
  pageSubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '32px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  card: {
    background: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '20px',
    marginBottom: '24px',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,
  statCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#f1f5f9',
  } as React.CSSProperties,
  statSub: {
    fontSize: '12px',
    color: '#64748b',
  } as React.CSSProperties,
  badge: (ok: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    background: ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
    color: ok ? '#10b981' : '#ef4444',
  }),
  warningBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
  } as React.CSSProperties,
  button: {
    padding: '8px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #EAD068, #06b6d4)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  buttonDanger: {
    padding: '8px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  buttonSecondary: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(51, 65, 85, 0.5)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  } as React.CSSProperties,
  toggleInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  } as React.CSSProperties,
  toggleName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#f1f5f9',
  } as React.CSSProperties,
  toggleDescription: {
    fontSize: '12px',
    color: '#94a3b8',
  } as React.CSSProperties,
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,
  healthItem: {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  healthDot: (status: string): React.CSSProperties => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    background: status === 'healthy' || status === 'up' || status === 'ok'
      ? '#10b981'
      : status === 'degraded' || status === 'warning'
        ? '#f59e0b'
        : '#ef4444',
    boxShadow: status === 'healthy' || status === 'up' || status === 'ok'
      ? '0 0 8px rgba(16, 185, 129, 0.4)'
      : status === 'degraded' || status === 'warning'
        ? '0 0 8px rgba(245, 158, 11, 0.4)'
        : '0 0 8px rgba(239, 68, 68, 0.4)',
  }),
  healthLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#f1f5f9',
  } as React.CSSProperties,
  healthStatus: {
    fontSize: '12px',
    color: '#94a3b8',
  } as React.CSSProperties,
  blockedUserRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  } as React.CSSProperties,
  blockedUserInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  } as React.CSSProperties,
  blockedUserName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#f1f5f9',
  } as React.CSSProperties,
  blockedUserMeta: {
    fontSize: '12px',
    color: '#94a3b8',
  } as React.CSSProperties,
  portalRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  } as React.CSSProperties,
  portalName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#f1f5f9',
  } as React.CSSProperties,
  portalUrl: {
    fontSize: '12px',
    color: '#64748b',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '32px',
    color: '#64748b',
    fontSize: '14px',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '48px',
    color: '#94a3b8',
    fontSize: '14px',
  } as React.CSSProperties,
  sectionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  } as React.CSSProperties,
  cacheGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
    marginTop: '16px',
  } as React.CSSProperties,
  cacheItem: {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  } as React.CSSProperties,
  actionRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
    marginTop: '12px',
  } as React.CSSProperties,
  notification: (type: 'success' | 'error' | 'info'): React.CSSProperties => ({
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: type === 'success'
      ? 'rgba(16, 185, 129, 0.12)'
      : type === 'error'
        ? 'rgba(239, 68, 68, 0.12)'
        : 'rgba(59, 130, 246, 0.12)',
    color: type === 'success'
      ? '#10b981'
      : type === 'error'
        ? '#ef4444'
        : '#3b82f6',
    border: `1px solid ${
      type === 'success'
        ? 'rgba(16, 185, 129, 0.2)'
        : type === 'error'
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(59, 130, 246, 0.2)'
    }`,
  }),
};

// ============================================
// TOGGLE SWITCH COMPONENT
// ============================================

const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void; disabled?: boolean }> = ({
  enabled,
  onToggle,
  disabled,
}) => (
  <div
    onClick={disabled ? undefined : onToggle}
    style={{
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      background: enabled ? '#EAD068' : '#475569',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative',
      transition: 'background 0.2s',
      opacity: disabled ? 0.5 : 1,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: '2px',
        left: enabled ? '22px' : '2px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    />
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const AutomationenTab: React.FC = () => {
  // State
  const [flags, setFlags] = useState<any[]>([]);
  const [mahnStatus, setMahnStatus] = useState<any>(null);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [nbConfigs, setNbConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Show temporary notification
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        automationsApi.getFeatureFlags(),
        automationsApi.getMahnStatus(),
        automationsApi.getBlockedUsers(),
        automationsApi.getHealthDetailed(),
        automationsApi.getCacheStats(),
        automationsApi.getNbPortalConfigs(),
      ]);

      if (results[0].status === 'fulfilled') {
        const data = results[0].value;
        setFlags(Array.isArray(data) ? data : data?.flags ?? []);
      }
      if (results[1].status === 'fulfilled') {
        setMahnStatus(results[1].value);
      }
      if (results[2].status === 'fulfilled') {
        const data = results[2].value;
        setBlockedUsers(Array.isArray(data) ? data : data?.users ?? []);
      }
      if (results[3].status === 'fulfilled') {
        setHealth(results[3].value);
      }
      if (results[4].status === 'fulfilled') {
        setCacheStats(results[4].value);
      }
      if (results[5].status === 'fulfilled') {
        const data = results[5].value;
        setNbConfigs(Array.isArray(data) ? data : data?.configs ?? []);
      }
    } catch (err) {
      console.error('[AutomationenTab] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Action handlers
  const handleToggleFlag = async (name: string, currentEnabled: boolean) => {
    setActionLoading(`flag-${name}`);
    try {
      await automationsApi.toggleFeatureFlag(name, !currentEnabled);
      setFlags((prev) =>
        prev.map((f) => (f.name === name ? { ...f, enabled: !currentEnabled } : f))
      );
      showNotification('success', `Feature Flag "${name}" ${!currentEnabled ? 'aktiviert' : 'deaktiviert'}`);
    } catch (err) {
      console.error('Failed to toggle flag:', err);
      showNotification('error', `Fehler beim Umschalten von "${name}"`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunMahnlauf = async () => {
    if (!confirm('Mahnlauf jetzt starten? Mahnungen werden erstellt und ggf. versendet.')) return;
    setActionLoading('mahnlauf');
    try {
      const result = await automationsApi.runMahnlauf();
      showNotification('success', `Mahnlauf abgeschlossen: ${result?.created ?? 0} Mahnungen erstellt`);
      // Reload mahn status
      const status = await automationsApi.getMahnStatus();
      setMahnStatus(status);
    } catch (err) {
      console.error('Failed to run Mahnlauf:', err);
      showNotification('error', 'Mahnlauf fehlgeschlagen');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: number, userName: string) => {
    if (!confirm(`Benutzer "${userName}" wirklich entsperren?`)) return;
    setActionLoading(`unblock-${userId}`);
    try {
      await automationsApi.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      showNotification('success', `Benutzer "${userName}" wurde entsperrt`);
    } catch (err) {
      console.error('Failed to unblock user:', err);
      showNotification('error', `Fehler beim Entsperren von "${userName}"`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerNbPolling = async () => {
    setActionLoading('nb-polling');
    try {
      await automationsApi.triggerNbPolling();
      showNotification('success', 'NB-Portal Polling gestartet');
    } catch (err) {
      console.error('Failed to trigger NB polling:', err);
      showNotification('error', 'NB-Portal Polling fehlgeschlagen');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerPayoutDrafts = async () => {
    setActionLoading('payout-drafts');
    try {
      const result = await automationsApi.triggerPayoutDrafts();
      showNotification('success', `Auszahlungsentwuerfe erstellt: ${result?.count ?? 'OK'}`);
    } catch (err) {
      console.error('Failed to trigger payout drafts:', err);
      showNotification('error', 'Auszahlungsentwuerfe konnten nicht erstellt werden');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerAutoRelease = async () => {
    setActionLoading('auto-release');
    try {
      const result = await automationsApi.triggerAutoRelease();
      showNotification('success', `Auto-Release ausgefuehrt: ${result?.count ?? 'OK'}`);
    } catch (err) {
      console.error('Failed to trigger auto release:', err);
      showNotification('error', 'Auto-Release fehlgeschlagen');
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Automatisierungen werden geladen...</span>
      </div>
    );
  }

  // Helpers
  const formatCurrency = (val: number | undefined | null) => {
    if (val == null) return '--';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const getHealthIcon = (key: string) => {
    const icons: Record<string, React.ReactNode> = {
      database: <Database size={18} />,
      db: <Database size={18} />,
      redis: <Server size={18} />,
      disk: <HardDrive size={18} />,
      memory: <Cpu size={18} />,
    };
    return icons[key.toLowerCase()] || <Heart size={18} />;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h1 style={styles.pageTitle}>Automatisierungen</h1>
          <p style={styles.pageSubtitle}>Alle automatischen Prozesse im Ueberblick</p>
        </div>
        <button
          style={{ ...styles.buttonSecondary, ...(loading ? styles.buttonDisabled : {}) }}
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={14} />
          Aktualisieren
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div style={styles.notification(notification.type)}>
          {notification.type === 'success' && <CheckCircle2 size={16} />}
          {notification.type === 'error' && <XCircle size={16} />}
          {notification.type === 'info' && <Clock size={16} />}
          {safeString(notification.message)}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURE FLAGS SECTION                      */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <ToggleLeft size={20} style={{ color: '#EAD068' }} />
          Feature Flags
        </div>
        {flags.length === 0 ? (
          <div style={styles.emptyState}>Keine Feature Flags konfiguriert</div>
        ) : (
          flags.map((flag, idx) => (
            <div
              key={flag.name || idx}
              style={{
                ...styles.toggleContainer,
                ...(idx === flags.length - 1 ? { borderBottom: 'none' } : {}),
              }}
            >
              <div style={styles.toggleInfo}>
                <span style={styles.toggleName}>{flag.name}</span>
                {flag.description && (
                  <span style={styles.toggleDescription}>{flag.description}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: flag.enabled ? '#10b981' : '#64748b' }}>
                  {flag.enabled ? 'Aktiv' : 'Inaktiv'}
                </span>
                <ToggleSwitch
                  enabled={flag.enabled}
                  onToggle={() => handleToggleFlag(flag.name, flag.enabled)}
                  disabled={actionLoading === `flag-${flag.name}`}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* MAHNWESEN SECTION                          */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionRow}>
          <div style={styles.sectionTitle}>
            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
            Mahnwesen
          </div>
          <button
            style={{ ...styles.button, ...(actionLoading === 'mahnlauf' ? styles.buttonDisabled : {}) }}
            onClick={handleRunMahnlauf}
            disabled={actionLoading === 'mahnlauf'}
          >
            {actionLoading === 'mahnlauf' ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Play size={14} />
            )}
            Mahnlauf starten
          </button>
        </div>

        {/* Stats */}
        {mahnStatus ? (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Stufe 1</span>
              <span style={styles.statValue}>{mahnStatus.stufe1?.count ?? 0}</span>
              <span style={styles.statSub}>{formatCurrency(mahnStatus.stufe1?.sum)}</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Stufe 2</span>
              <span style={styles.statValue}>{mahnStatus.stufe2?.count ?? 0}</span>
              <span style={styles.statSub}>{formatCurrency(mahnStatus.stufe2?.sum)}</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Stufe 3</span>
              <span style={styles.statValue}>{mahnStatus.stufe3?.count ?? 0}</span>
              <span style={styles.statSub}>{formatCurrency(mahnStatus.stufe3?.sum)}</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Gesperrte Konten</span>
              <span style={styles.statValue}>{blockedUsers.length}</span>
              <span style={styles.statSub}>Benutzer blockiert</span>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>Mahnstatus konnte nicht geladen werden</div>
        )}

        {/* Blocked Users */}
        {blockedUsers.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '10px' }}>
              Gesperrte Benutzer
            </div>
            {blockedUsers.map((user) => (
              <div key={user.id} style={styles.blockedUserRow}>
                <div style={styles.blockedUserInfo}>
                  <span style={styles.blockedUserName}>
                    {user.name || user.email || `User #${user.id}`}
                  </span>
                  <span style={styles.blockedUserMeta}>
                    {user.reason || 'Zahlungsverzug'} {user.blockedAt ? `- seit ${new Date(user.blockedAt).toLocaleDateString('de-DE')}` : ''}
                  </span>
                </div>
                <button
                  style={{
                    ...styles.buttonSecondary,
                    ...(actionLoading === `unblock-${user.id}` ? styles.buttonDisabled : {}),
                  }}
                  onClick={() => handleUnblockUser(user.id, user.name || user.email || `User #${user.id}`)}
                  disabled={actionLoading === `unblock-${user.id}`}
                >
                  <Unlock size={13} />
                  Entsperren
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PROVISIONEN AUTOMATION SECTION             */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <DollarSign size={20} style={{ color: '#10b981' }} />
          Provisionen Automatisierung
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
          Auszahlungsentwuerfe erstellen und automatisch freigeben.
        </p>
        <div style={styles.actionRow}>
          <button
            style={{ ...styles.button, ...(actionLoading === 'payout-drafts' ? styles.buttonDisabled : {}) }}
            onClick={handleTriggerPayoutDrafts}
            disabled={actionLoading === 'payout-drafts'}
          >
            {actionLoading === 'payout-drafts' ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Zap size={14} />
            )}
            Auszahlungsentwuerfe erstellen
          </button>
          <button
            style={{ ...styles.button, ...(actionLoading === 'auto-release' ? styles.buttonDisabled : {}) }}
            onClick={handleTriggerAutoRelease}
            disabled={actionLoading === 'auto-release'}
          >
            {actionLoading === 'auto-release' ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Auto-Release starten
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SYSTEM HEALTH SECTION                      */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <ShieldCheck size={20} style={{ color: '#06b6d4' }} />
          System Health
        </div>

        {health ? (
          <>
            {/* Overall status */}
            <div style={{ marginBottom: '16px' }}>
              <span style={styles.badge(health.status === 'healthy' || health.status === 'ok')}>
                {health.status === 'healthy' || health.status === 'ok' ? 'Alle Systeme OK' : 'Probleme erkannt'}
              </span>
            </div>

            {/* Health checks */}
            <div style={styles.healthGrid}>
              {health.checks
                ? Object.entries(health.checks).map(([key, check]: [string, any]) => (
                    <div key={key} style={styles.healthItem}>
                      <div style={styles.healthDot(check.status || (check.healthy ? 'healthy' : 'unhealthy'))} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        {getHealthIcon(key)}
                        <div>
                          <div style={styles.healthLabel}>{key}</div>
                          <div style={styles.healthStatus}>
                            {check.status || (check.healthy ? 'Healthy' : 'Unhealthy')}
                            {check.responseTime != null && ` - ${check.responseTime}ms`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                : health.details
                  ? Object.entries(health.details).map(([key, detail]: [string, any]) => (
                      <div key={key} style={styles.healthItem}>
                        <div style={styles.healthDot(detail.status || 'healthy')} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          {getHealthIcon(key)}
                          <div>
                            <div style={styles.healthLabel}>{key}</div>
                            <div style={styles.healthStatus}>
                              {detail.status || 'OK'}
                              {detail.responseTime != null && ` - ${detail.responseTime}ms`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : (
                      <div style={styles.emptyState}>Keine detaillierten Health-Checks verfuegbar</div>
                    )}
            </div>

            {/* Cache Stats */}
            {cacheStats && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '8px' }}>
                  Cache-Statistiken
                </div>
                <div style={styles.cacheGrid}>
                  {cacheStats.keys != null && (
                    <div style={styles.cacheItem}>
                      <span style={styles.statLabel}>Keys</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
                        {cacheStats.keys.toLocaleString('de-DE')}
                      </span>
                    </div>
                  )}
                  {cacheStats.memory != null && (
                    <div style={styles.cacheItem}>
                      <span style={styles.statLabel}>Speichernutzung</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
                        {cacheStats.memory}
                      </span>
                    </div>
                  )}
                  {cacheStats.hitRate != null && (
                    <div style={styles.cacheItem}>
                      <span style={styles.statLabel}>Hit Rate</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
                        {typeof cacheStats.hitRate === 'number'
                          ? `${(cacheStats.hitRate * 100).toFixed(1)}%`
                          : cacheStats.hitRate}
                      </span>
                    </div>
                  )}
                  {cacheStats.uptime != null && (
                    <div style={styles.cacheItem}>
                      <span style={styles.statLabel}>Uptime</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
                        {cacheStats.uptime}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyState}>Health-Daten konnten nicht geladen werden</div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* NB-PORTAL SECTION                          */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionRow}>
          <div style={styles.sectionTitle}>
            <Globe size={20} style={{ color: '#3b82f6' }} />
            NB-Portal Konfigurationen
          </div>
          <button
            style={{ ...styles.button, ...(actionLoading === 'nb-polling' ? styles.buttonDisabled : {}) }}
            onClick={handleTriggerNbPolling}
            disabled={actionLoading === 'nb-polling'}
          >
            {actionLoading === 'nb-polling' ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Play size={14} />
            )}
            Polling starten
          </button>
        </div>

        {nbConfigs.length === 0 ? (
          <div style={styles.emptyState}>Keine NB-Portal Konfigurationen vorhanden</div>
        ) : (
          nbConfigs.map((config, idx) => (
            <div
              key={config.id || idx}
              style={{
                ...styles.portalRow,
                ...(idx === nbConfigs.length - 1 ? { borderBottom: 'none' } : {}),
              }}
            >
              <div>
                <div style={styles.portalName}>{config.name || config.portalName || `Portal #${config.id}`}</div>
                {config.url && <div style={styles.portalUrl}>{config.url}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {config.lastPolledAt && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Letztes Polling: {new Date(config.lastPolledAt).toLocaleString('de-DE')}
                  </span>
                )}
                <span
                  style={
                    config.status === 'active' || config.active
                      ? styles.badge(true)
                      : config.status === 'error'
                        ? styles.badge(false)
                        : styles.warningBadge
                  }
                >
                  {config.status === 'active' || config.active
                    ? 'Aktiv'
                    : config.status === 'error'
                      ? 'Fehler'
                      : config.status || 'Inaktiv'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Keyframe for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AutomationenTab;
