import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, RefreshCw, Plus, Trash2, Link2, CheckCircle2,
  XCircle, Clock, AlertCircle, ArrowRightLeft, Building2,
  TrendingUp, Banknote, Search,
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../api/client';

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
// TYPES
// ============================================

interface BankStats {
  activeConnections: number;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  matchRate: number;
  lastSync: string | null;
}

interface BankConnection {
  id: number;
  requisitionId: string;
  institutionId: string;
  institutionName: string | null;
  accountId: string | null;
  iban: string | null;
  status: string;
  lastSync: string | null;
  createdAt: string;
}

interface BankTransaction {
  id: number;
  bookingDate: string;
  amount: number;
  currency: string;
  remittanceInfo: string | null;
  debtorName: string | null;
  debtorIban: string | null;
  matchedRechnungId: number | null;
  matchConfidence: string | null;
  matchedAt: string | null;
  bankIban: string | null;
}

interface Institution {
  id: string;
  name: string;
  logo: string;
  countries: string[];
}

// ============================================
// STYLES - Dark theme, inline CSSProperties (same as AutomationenTab)
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
  connectionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  } as React.CSSProperties,
  connectionInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  } as React.CSSProperties,
  connectionName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#f1f5f9',
  } as React.CSSProperties,
  connectionMeta: {
    fontSize: '12px',
    color: '#94a3b8',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
    fontWeight: 600,
  } as React.CSSProperties,
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    color: '#e2e8f0',
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
  institutionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '10px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
  } as React.CSSProperties,
  institutionCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  } as React.CSSProperties,
  institutionLogo: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    objectFit: 'contain' as const,
    background: 'white',
    padding: '4px',
  } as React.CSSProperties,
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    borderRadius: '8px',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    background: 'rgba(15, 23, 42, 0.6)',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '12px',
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
// MAIN COMPONENT
// ============================================

const BankIntegrationTab: React.FC = () => {
  const [stats, setStats] = useState<BankStats | null>(null);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [featureDisabled, setFeatureDisabled] = useState(false);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        apiGet<BankStats>('/api/bank/stats'),
        apiGet<BankConnection[]>('/api/bank/connections'),
        apiGet<BankTransaction[]>('/api/bank/transactions?limit=50'),
      ]);

      if (results[0].status === 'fulfilled') {
        setStats(results[0].value);
        setFeatureDisabled(false);
      } else {
        // Check if feature is disabled (503)
        const err = results[0].reason;
        if (err?.message?.includes('503')) {
          setFeatureDisabled(true);
        }
      }
      if (results[1].status === 'fulfilled') setConnections(results[1].value);
      if (results[2].status === 'fulfilled') setTransactions(results[2].value);
    } catch (err) {
      console.error('[BankIntegrationTab] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load institutions when bank picker is opened
  const handleShowBankPicker = async () => {
    if (institutions.length === 0) {
      setActionLoading('load-banks');
      try {
        const data = await apiGet<{ institutions: Institution[] }>('/api/bank/institutions');
        setInstitutions(data.institutions || []);
      } catch (err) {
        console.error('Failed to load institutions:', err);
        showNotification('error', 'Bankliste konnte nicht geladen werden');
      } finally {
        setActionLoading(null);
      }
    }
    setShowBankPicker(!showBankPicker);
  };

  const handleConnect = async (institutionId: string) => {
    setActionLoading(`connect-${institutionId}`);
    try {
      const result = await apiPost<{ success: boolean; authUrl: string }>('/api/bank/connect', { institutionId });
      if (result.authUrl) {
        window.open(result.authUrl, '_blank');
        showNotification('info', 'Bitte die Autorisierung im neuen Fenster abschliessen. Danach Callback ausloesen.');
      }
    } catch (err) {
      console.error('Failed to connect bank:', err);
      showNotification('error', 'Bankverbindung konnte nicht gestartet werden');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConnection = async (id: number) => {
    if (!confirm('Bankverbindung wirklich loeschen?')) return;
    setActionLoading(`delete-${id}`);
    try {
      await apiDelete(`/api/bank/connections/${id}`);
      setConnections((prev) => prev.filter((c) => c.id !== id));
      showNotification('success', 'Bankverbindung geloescht');
      // Refresh stats
      try {
        const newStats = await apiGet<BankStats>('/api/bank/stats');
        setStats(newStats);
      } catch {}
    } catch (err) {
      console.error('Failed to delete connection:', err);
      showNotification('error', 'Loeschen fehlgeschlagen');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async () => {
    setActionLoading('sync');
    try {
      const result = await apiPost<{
        success: boolean;
        transactionsImported: number;
        matchesFound: number;
        invoicesPaid: number;
      }>('/api/bank/sync', {});
      showNotification(
        'success',
        `Sync abgeschlossen: ${result.transactionsImported} importiert, ${result.matchesFound} Matches, ${result.invoicesPaid} Rechnungen bezahlt`
      );
      // Reload data
      loadData();
    } catch (err) {
      console.error('Failed to sync:', err);
      showNotification('error', 'Bank-Sync fehlgeschlagen');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualMatch = async (txId: number) => {
    const rechnungId = prompt('Rechnungs-ID eingeben:');
    if (!rechnungId) return;
    setActionLoading(`match-${txId}`);
    try {
      await apiPost(`/api/bank/transactions/${txId}/match`, { rechnungId: Number(rechnungId), markAsPaid: true });
      showNotification('success', 'Transaktion zugeordnet und Rechnung als bezahlt markiert');
      loadData();
    } catch (err) {
      console.error('Failed to match transaction:', err);
      showNotification('error', 'Zuordnung fehlgeschlagen');
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Bank-Integration wird geladen...</span>
      </div>
    );
  }

  // Feature disabled state
  if (featureDisabled) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ ...styles.emptyState, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={48} style={{ color: '#f59e0b' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>
              Bank-Integration ist deaktiviert
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              Aktiviere den Feature Flag &quot;system.bank-integration&quot; unter Automatisierungen, um die Bank-Integration zu nutzen.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredInstitutions = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const formatDate = (d: string | null) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'LINKED') return styles.badge(true);
    if (status === 'ERROR' || status === 'EXPIRED') return styles.badge(false);
    return styles.warningBadge;
  };

  const getConfidenceBadge = (confidence: string | null) => {
    if (!confidence) return undefined;
    if (confidence === 'HIGH' || confidence === 'MANUAL') return styles.badge(true);
    if (confidence === 'MEDIUM') return styles.warningBadge;
    return styles.badge(false);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h1 style={styles.pageTitle}>Bank-Integration</h1>
          <p style={styles.pageSubtitle}>GoCardless Open Banking - Automatischer Bankabgleich</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{ ...styles.button, ...(actionLoading === 'sync' ? styles.buttonDisabled : {}) }}
            onClick={handleSync}
            disabled={actionLoading === 'sync'}
          >
            {actionLoading === 'sync' ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <ArrowRightLeft size={14} />
            )}
            Sync starten
          </button>
          <button
            style={styles.buttonSecondary}
            onClick={loadData}
          >
            <RefreshCw size={14} />
            Aktualisieren
          </button>
        </div>
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
      {/* STATUS OVERVIEW                            */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <TrendingUp size={20} style={{ color: '#EAD068' }} />
          Status-Uebersicht
        </div>
        {stats ? (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Aktive Verbindungen</span>
              <span style={styles.statValue}>{stats.activeConnections}</span>
              <span style={styles.statSub}>LINKED Konten</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Transaktionen</span>
              <span style={styles.statValue}>{stats.totalTransactions}</span>
              <span style={styles.statSub}>{stats.unmatchedTransactions} nicht zugeordnet</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Zugeordnet</span>
              <span style={styles.statValue}>{stats.matchedTransactions}</span>
              <span style={styles.statSub}>automatisch gematcht</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Match-Rate</span>
              <span style={styles.statValue}>{stats.matchRate}%</span>
              <span style={styles.statSub}>Letzter Sync: {stats.lastSync ? formatDate(stats.lastSync) : 'Nie'}</span>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>Statistiken konnten nicht geladen werden</div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* BANK VERBINDEN                             */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionRow}>
          <div style={styles.sectionTitle}>
            <Plus size={20} style={{ color: '#10b981' }} />
            Bank verbinden
          </div>
          <button
            style={{ ...styles.button, ...(actionLoading === 'load-banks' ? styles.buttonDisabled : {}) }}
            onClick={handleShowBankPicker}
            disabled={actionLoading === 'load-banks'}
          >
            {actionLoading === 'load-banks' ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Building2 size={14} />
            )}
            {showBankPicker ? 'Schliessen' : 'Bankliste oeffnen'}
          </button>
        </div>

        {showBankPicker && (
          <>
            <div style={{ position: 'relative', marginBottom: '4px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                style={styles.searchInput}
                placeholder="Bank suchen..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
              />
            </div>
            {filteredInstitutions.length === 0 ? (
              <div style={styles.emptyState}>
                {institutions.length === 0 ? 'Bankliste wird geladen...' : 'Keine Bank gefunden'}
              </div>
            ) : (
              <div style={styles.institutionGrid}>
                {filteredInstitutions.map((inst) => (
                  <div
                    key={inst.id}
                    style={{
                      ...styles.institutionCard,
                      ...(actionLoading === `connect-${inst.id}` ? { opacity: 0.5 } : {}),
                    }}
                    onClick={() => !actionLoading && handleConnect(inst.id)}
                  >
                    {inst.logo ? (
                      <img src={inst.logo} alt={inst.name} style={styles.institutionLogo} />
                    ) : (
                      <div style={{ ...styles.institutionLogo, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155' }}>
                        <Building2 size={18} style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#f1f5f9' }}>
                      {inst.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* VERBINDUNGEN                               */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <Link2 size={20} style={{ color: '#06b6d4' }} />
          Verbindungen
        </div>

        {connections.length === 0 ? (
          <div style={styles.emptyState}>Keine Bankverbindungen vorhanden</div>
        ) : (
          connections.map((conn, idx) => (
            <div
              key={conn.id}
              style={{
                ...styles.connectionRow,
                ...(idx === connections.length - 1 ? { borderBottom: 'none' } : {}),
              }}
            >
              <div style={styles.connectionInfo}>
                <span style={styles.connectionName}>
                  {conn.institutionName || conn.institutionId}
                  {conn.iban && ` - ${conn.iban}`}
                </span>
                <span style={styles.connectionMeta}>
                  Erstellt: {formatDate(conn.createdAt)}
                  {conn.lastSync && ` | Letzter Sync: ${formatDate(conn.lastSync)}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={getStatusBadge(conn.status)}>
                  {conn.status}
                </span>
                <button
                  style={{
                    ...styles.buttonDanger,
                    padding: '6px 12px',
                    fontSize: '12px',
                    ...(actionLoading === `delete-${conn.id}` ? styles.buttonDisabled : {}),
                  }}
                  onClick={() => handleDeleteConnection(conn.id)}
                  disabled={actionLoading === `delete-${conn.id}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* LETZTE TRANSAKTIONEN                       */}
      {/* ═══════════════════════════════════════════ */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <Banknote size={20} style={{ color: '#f59e0b' }} />
          Letzte Transaktionen
        </div>

        {transactions.length === 0 ? (
          <div style={styles.emptyState}>Keine Transaktionen vorhanden. Starte einen Sync.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Datum</th>
                  <th style={styles.th}>Betrag</th>
                  <th style={styles.th}>Auftraggeber</th>
                  <th style={styles.th}>Verwendungszweck</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={styles.td}>
                      {new Date(tx.bookingDate).toLocaleDateString('de-DE')}
                    </td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#10b981' }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td style={styles.td}>
                      <div>{tx.debtorName || '--'}</div>
                      {tx.debtorIban && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{tx.debtorIban}</div>
                      )}
                    </td>
                    <td style={{ ...styles.td, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.remittanceInfo || '--'}
                    </td>
                    <td style={styles.td}>
                      {tx.matchedRechnungId ? (
                        <span style={getConfidenceBadge(tx.matchConfidence)}>
                          <CheckCircle2 size={12} />
                          {tx.matchConfidence} (RE #{tx.matchedRechnungId})
                        </span>
                      ) : (
                        <span style={styles.warningBadge}>
                          <AlertCircle size={12} />
                          Offen
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {!tx.matchedRechnungId && (
                        <button
                          style={{
                            ...styles.buttonSecondary,
                            ...(actionLoading === `match-${tx.id}` ? styles.buttonDisabled : {}),
                          }}
                          onClick={() => handleManualMatch(tx.id)}
                          disabled={!!actionLoading}
                        >
                          <CreditCard size={12} />
                          Zuordnen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default BankIntegrationTab;
