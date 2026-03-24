/**
 * ⚠️ ARCHIVIERT — Nicht mehr aktiv verwendet.
 * Ersetzt durch: CrmDetailPanel (features/netzanmeldungen/components/detail/CrmDetailPanel.tsx)
 * Siehe: features/netzanmeldungen/DETAIL_PANELS.md
 *
 * UnifiedDetailPanel – The single entry point for all installation detail panels.
 * Composes PanelShell + PanelHeader + PanelTabBar + Tab content.
 * Replaces 5 different DetailPanel implementations.
 */

import { useState, useCallback, Suspense } from 'react';
import {
  Loader2, RefreshCw, ExternalLink, Trash2, Clipboard, Check,
  Home, Building2, Clock, ChevronRight, Zap, Sun, Battery, Car, Flame,
  Users, Tag, Calendar, Globe, ArrowRightCircle, FileText,
} from 'lucide-react';
import { useAuth } from '../../pages/AuthContext';
import { useInstallationDetail } from './hooks/useInstallationDetail';
import { useInstallationMutations } from './hooks/useInstallationMutations';
import { usePanelKeyboard } from './hooks/usePanelKeyboard';
import { PanelShell } from './shell/PanelShell';

// Import existing DetailPanel styles for tab content compatibility
import '../../features/netzanmeldungen/components/DetailPanel/styles.css';
import { PanelHeader } from './shell/PanelHeader';
import { PanelTabBar } from './shell/PanelTabBar';
import type { PanelTab } from './shell/PanelTabBar';
import { PanelProgress } from './shell/PanelProgress';
import { PanelAlerts } from './shell/PanelAlerts';
import type { PanelAlert } from './shell/PanelAlerts';
import { PanelToast } from './shell/PanelToast';
import type { ToastState } from './shell/PanelToast';
import type { InstallationStatus, GridOperator, InstallationDetail } from '../../features/netzanmeldungen/types';
import {
  getStatusConfig, getAvailableTransitions, formatRelativeTime,
  computePriority, getPriorityConfig, getPermissions,
} from '../../features/netzanmeldungen/utils';
import type { BadgeConfig, HeaderAction } from './types';

// Tab components
import { UnifiedOverviewTab } from './tabs/OverviewTab';
import { UnifiedTechTab } from './tabs/TechTab';
import { UnifiedDocumentsTab } from './tabs/DocumentsTab';
import { UnifiedTimelineTab } from './tabs/TimelineTab';
import { UnifiedEmailsTab } from './tabs/EmailsTab';
import { UnifiedTasksTab } from './tabs/TasksTab';
import { UnifiedCommunicationTab } from './tabs/CommunicationTab';
import { UnifiedWhatsAppTab } from './tabs/WhatsAppTab';
import { UnifiedChatTab } from './tabs/ChatTab';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UnifiedDetailPanelProps {
  installationId: number | string;
  onClose: () => void;
  onUpdate?: () => void;
  /** Initial tab to show */
  initialTab?: string;
}

type TabId = 'overview' | 'tech' | 'documents' | 'timeline' | 'chat' | 'emails' | 'tasks' | 'kommunikation' | 'whatsapp';

const TAB_DEFS: PanelTab[] = [
  { id: 'overview', label: 'Übersicht', icon: <Home size={16} />, shortcut: '1' },
  { id: 'tech', label: 'Technik', icon: <Zap size={16} />, shortcut: '2' },
  { id: 'documents', label: 'Dokumente', icon: <FileText size={16} />, shortcut: '3' },
  { id: 'timeline', label: 'Historie', icon: <Clock size={16} />, shortcut: '4' },
  { id: 'chat', label: 'Chat', icon: <Users size={16} />, shortcut: '5' },
  { id: 'emails', label: 'E-Mails', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>, shortcut: '6' },
  { id: 'tasks', label: 'Aufgaben', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>, shortcut: '7' },
  { id: 'kommunikation', label: 'NB-Kommunikation', icon: <Building2 size={16} />, shortcut: '8' },
  // WhatsApp: Feature-Flag — nur sichtbar wenn localStorage.getItem('feature_whatsapp') === 'true'
];

const WHATSAPP_TAB: PanelTab = { id: 'whatsapp', label: 'WhatsApp', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>, shortcut: '9' };

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function generateAlerts(data: InstallationDetail): PanelAlert[] {
  const alerts: PanelAlert[] = [];
  const now = new Date();
  const updated = new Date(data.updatedAt);
  const days = Math.floor((now.getTime() - updated.getTime()) / 86400000);

  if (days > 14 && !['fertig', 'storniert'].includes(data.status)) {
    alerts.push({ id: 'overdue', type: 'warning', title: 'Keine Aktivität', message: `Seit ${days} Tagen keine Aktivität` });
  }
  if (data.status === 'rueckfrage') {
    alerts.push({ id: 'action', type: 'error', title: 'Rückfrage vom NB', message: 'Aktion erforderlich – NB hat Rückfragen!' });
  }
  if (data.status === 'beim_nb') {
    alerts.push({ id: 'waiting', type: 'info', title: 'Beim Netzbetreiber', message: 'Warten auf Antwort vom NB' });
  }
  if (data.status === 'genehmigt') {
    alerts.push({ id: 'approved', type: 'success', title: 'Genehmigt', message: 'Einspeisezusage erhalten!' });
  }
  return alerts;
}

function calculateProgress(data: InstallationDetail) {
  const steps = [
    { label: 'Anlage erstellt', done: true },
    { label: 'Daten vollständig', done: Boolean(data.customerName && (data.plz || data.zipCode)) },
    { label: 'Beim NB', done: ['beim_nb', 'rueckfrage', 'genehmigt', 'ibn', 'fertig'].includes(data.status) },
    { label: 'Genehmigt', done: ['genehmigt', 'ibn', 'fertig'].includes(data.status) },
    { label: 'Fertig', done: data.status === 'fertig' },
  ];
  const completed = steps.filter((s) => s.done).length;
  const percent = Math.round((completed / steps.length) * 100);
  const nextStep = steps.find((s) => !s.done)?.label || 'Fertig!';
  return { percent, nextStep, steps };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function UnifiedDetailPanel({ installationId, onClose, onUpdate, initialTab }: UnifiedDetailPanelProps) {
  const { user } = useAuth();
  const userRole = ((user as any)?.role || (user as any)?.rolle || '').toUpperCase();
  const isStaff = userRole === 'ADMIN' || userRole === 'MITARBEITER';
  const isKunde = userRole === 'KUNDE';
  const isSubunternehmer = userRole === 'SUBUNTERNEHMER';

  // CRM-Projekt erkennen
  const isCrmProject = typeof installationId === 'string' && String(installationId).startsWith('crm-');
  const effectiveId = isCrmProject ? 0 : Number(installationId);

  // Feature-Flag: WhatsApp-Tab nur wenn aktiviert
  const whatsappEnabled = typeof window !== 'undefined' && localStorage.getItem('feature_whatsapp') === 'true';
  const activeTabs = whatsappEnabled ? [...TAB_DEFS, WHATSAPP_TAB] : TAB_DEFS;

  // Data
  const { detail, gridOperators, isLoading, refetch } = useInstallationDetail(effectiveId);
  const mutations = useInstallationMutations(effectiveId);

  // UI state
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'overview');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Keyboard
  usePanelKeyboard({
    tabIds: activeTabs.map((t) => t.id),
    activeTab,
    onTabChange: setActiveTab,
    onClose,
    onReload: handleRefresh,
  });

  // Actions
  const handleStatusChange = async (newStatus: InstallationStatus) => {
    setStatusChanging(true);
    try {
      await mutations.updateStatus.mutateAsync(newStatus);
      showToast('Status aktualisiert', 'success');
      onUpdate?.();
    } catch (e: any) {
      showToast(e.message || 'Fehler', 'error');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleUpdate = async (data: Partial<InstallationDetail>) => {
    try {
      if (Object.keys(data).length === 0) {
        refetch();
        onUpdate?.();
        return;
      }
      await mutations.updateCustomer.mutateAsync(data as any);
      showToast('Gespeichert', 'success');
      onUpdate?.();
    } catch (e: any) {
      showToast(e.message || 'Fehler', 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mutations.deleteInstallation.mutateAsync();
      showToast('Anlage gelöscht', 'success');
      onUpdate?.();
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Fehler beim Löschen', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ─── LOADING / ERROR ───
  if (isLoading) {
    return (
      <PanelShell open onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12 }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Laden...</span>
        </div>
      </PanelShell>
    );
  }

  if (!detail) {
    return (
      <PanelShell open onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12 }}>
          <span style={{ fontSize: 48 }}>⚠️</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Installation nicht gefunden</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>ID: {installationId}</span>
          <button
            onClick={onClose}
            style={{ marginTop: 8, padding: '8px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
          >
            Schließen
          </button>
        </div>
      </PanelShell>
    );
  }

  // ─── DERIVED STATE ───
  const statusConfig = getStatusConfig(detail.status);
  const transitions = getAvailableTransitions(detail.status);
  const priority = computePriority(detail);
  const priorityConfig = getPriorityConfig(priority);
  const currentOperator = gridOperators.find((op) => op.id === detail.gridOperatorId);
  const alerts = generateAlerts(detail);
  const progress = calculateProgress(detail);
  const permissions = getPermissions(userRole);

  // Badges
  const badges: BadgeConfig[] = [
    { text: detail.caseType || 'NETZANMELDUNG', variant: 'primary' },
  ];

  // Header actions
  const headerActions: HeaderAction[] = [
    {
      id: 'copy-data',
      label: 'Daten kopieren',
      variant: 'ghost',
      icon: copiedField === 'data' ? <Check size={16} className="text-green-400" /> : <Clipboard size={16} />,
      onClick: () => {
        const lines = [
          `Installation: ${detail.publicId || detail.id}`,
          `Kunde: ${detail.customerName || ''}`,
          `Adresse: ${detail.strasse || ''} ${detail.hausNr || ''}, ${detail.plz || ''} ${detail.ort || ''}`,
          `kWp: ${detail.totalKwp || ''}`,
          `Netzbetreiber: ${detail.gridOperator || ''}`,
          `Status: ${detail.status || ''}`,
        ];
        copyToClipboard(lines.join('\n'), 'data');
      },
    },
    {
      id: 'refresh',
      label: 'Aktualisieren (R)',
      variant: 'ghost',
      icon: <RefreshCw size={16} />,
      onClick: handleRefresh,
    },
    {
      id: 'open-tab',
      label: 'In neuem Tab öffnen',
      variant: 'ghost',
      icon: <ExternalLink size={16} />,
      onClick: () => window.open(`/installations/${installationId}`, '_blank'),
    },
    {
      id: 'delete',
      label: 'Löschen',
      variant: 'danger',
      icon: <Trash2 size={16} />,
      onClick: () => setShowDeleteConfirm(true),
      hidden: !permissions.canDeleteInstallation || isKunde || isSubunternehmer,
    },
  ];

  // Subtitle
  const subtitle = (
    <>
      <span className="inline-flex items-center gap-1" style={{ color: statusConfig?.color }}>
        <span>{statusConfig?.icon || '📋'}</span>
        {statusConfig?.label || detail.status}
      </span>
      <span className="inline-flex items-center gap-1">
        <Home size={12} /> {detail.plz} {detail.ort}
      </span>
      <span className="inline-flex items-center gap-1">
        <Building2 size={12} /> {detail.gridOperator || currentOperator?.name || '–'}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock size={12} /> {formatRelativeTime(detail.updatedAt)}
      </span>
    </>
  );

  return (
    <PanelShell open onClose={onClose}>
      {/* Header */}
      <PanelHeader
        title={detail.customerName || 'Unbekannt'}
        subtitle={subtitle}
        badges={badges}
        actions={headerActions}
        onClose={onClose}
      >
        <PanelProgress percent={progress.percent} nextStep={progress.nextStep} steps={progress.steps} />
      </PanelHeader>

      {/* Alerts */}
      <PanelAlerts alerts={alerts} />

      {/* Quick Actions – Status-Buttons für Staff */}
      {isStaff && transitions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 500 }}>Status ändern:</span>
          {transitions.map((t) => {
            const cfg = getStatusConfig(t.to);
            return (
              <button
                key={t.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px',
                  fontSize: 11, fontWeight: 500, borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${cfg?.color || '#64748b'}`, color: cfg?.color || '#64748b',
                  background: 'transparent', opacity: statusChanging ? 0.4 : 1,
                }}
                onClick={() => handleStatusChange(t.to)}
                disabled={statusChanging}
              >
                <span>{cfg?.icon || '→'}</span>
                {cfg?.label || t.to}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Bar */}
      <PanelTabBar tabs={activeTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Suspense
          fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
          }
        >
          {activeTab === 'overview' && (
            <UnifiedOverviewTab
              detail={detail}
              gridOperators={gridOperators}
              onUpdate={handleUpdate}
              showToast={showToast}
              isKunde={isKunde}
              onSwitchToTab={setActiveTab}
            />
          )}
          {activeTab === 'tech' && (
            <UnifiedTechTab detail={detail} onUpdate={handleUpdate} showToast={showToast} isKunde={isKunde} />
          )}
          {activeTab === 'documents' && (
            <UnifiedDocumentsTab
              installationId={effectiveId}
              detail={detail}
              showToast={showToast}
              isKunde={isKunde}
              isSubunternehmer={isSubunternehmer}
            />
          )}
          {activeTab === 'timeline' && (
            <UnifiedTimelineTab installationId={effectiveId} showToast={showToast} isKunde={isKunde} />
          )}
          {activeTab === 'chat' && (
            <UnifiedChatTab installationId={effectiveId} showToast={showToast} isKunde={isKunde} />
          )}
          {activeTab === 'emails' && (
            <UnifiedEmailsTab installationId={effectiveId} detail={detail} showToast={showToast} isKunde={isKunde} />
          )}
          {activeTab === 'tasks' && (
            <UnifiedTasksTab installationId={effectiveId} showToast={showToast} isKunde={isKunde} />
          )}
          {activeTab === 'kommunikation' && (
            <UnifiedCommunicationTab
              detail={detail}
              gridOperator={currentOperator || null}
              installationId={effectiveId}
              onRefresh={handleRefresh}
              showToast={showToast}
              isKunde={isKunde}
            />
          )}
          {activeTab === 'whatsapp' && (
            <UnifiedWhatsAppTab installationId={effectiveId} showToast={showToast} isKunde={isKunde} />
          )}
        </Suspense>
      </div>

      {/* Toast */}
      <PanelToast toast={toast} />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 10001 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 48px rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.95)', marginBottom: 8 }}>Anlage löschen</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
              Möchten Sie <strong>{detail.customerName}</strong> wirklich löschen?
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
              Alle zugehörigen Dokumente, E-Mails und Aufgaben werden ebenfalls gelöscht.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                style={{ height: 32, padding: '0 12px', fontSize: 14, color: 'rgba(255,255,255,0.7)', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Abbrechen
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', fontSize: 14, fontWeight: 500, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: deleting ? 0.5 : 1 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelShell>
  );
}
