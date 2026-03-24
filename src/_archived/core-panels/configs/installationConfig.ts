/**
 * Installation Panel Configuration
 * Defines header, tabs, and data fetching for installation detail panels
 */

import { createElement, lazy } from 'react';
import {
  Home, Zap, FileText, Clock, Users, Mail,
  CheckSquare, Building2, MessageCircle,
} from 'lucide-react';
import type { PanelConfig, TabConfig } from '../types';
import { installationsApi } from '../../../features/netzanmeldungen/services/api';

// Lazy-load tab components for code splitting
const OverviewTab = lazy(() =>
  import('../tabs/OverviewTab').then((m) => ({ default: m.UnifiedOverviewTab as any }))
);
const TechTab = lazy(() =>
  import('../../../features/netzanmeldungen/components/DetailPanel/tabs/TechTab').then((m) => ({ default: m.TechTab as any }))
);
const DocumentsTab = lazy(() =>
  import('../../../features/netzanmeldungen/components/DetailPanel/tabs/DocumentsTab').then((m) => ({ default: m.DocumentsTab as any }))
);
const TimelineTab = lazy(() =>
  import('../../../features/netzanmeldungen/components/DetailPanel/tabs/TimelineTab').then((m) => ({ default: m.TimelineTab as any }))
);
const ChatTab = lazy(() =>
  import('../../../features/netzanmeldungen/components/DetailPanel/tabs/ChatTab').then((m) => ({ default: m.ChatTab as any }))
);
const EmailsTab = lazy(() =>
  import('../../../features/netzanmeldungen/components/DetailPanel/tabs/EmailsTab').then((m) => ({ default: m.EmailsTab as any }))
);
const TasksTab = lazy(() =>
  import('../../../features/netzanmeldungen/components/DetailPanel/tabs/TasksTab').then((m) => ({ default: m.TasksTab as any }))
);
const KommunikationTab = lazy(() =>
  import('../../../features/netzanmeldungen/components/DetailPanel/tabs/KommunikationTab').then((m) => ({ default: m.KommunikationTab as any }))
);
const WhatsAppTab = lazy(() =>
  import('../../../features/netzanmeldungen/components/DetailPanel/tabs/WhatsAppTab').then((m) => ({ default: m.WhatsAppTab as any }))
);

export const INSTALLATION_TABS: TabConfig[] = [
  { id: 'overview', label: 'Übersicht', icon: createElement(Home, { size: 16 }), shortcut: '1', component: OverviewTab },
  { id: 'tech', label: 'Technik', icon: createElement(Zap, { size: 16 }), shortcut: '2', component: TechTab },
  { id: 'documents', label: 'Dokumente', icon: createElement(FileText, { size: 16 }), shortcut: '3', component: DocumentsTab },
  { id: 'timeline', label: 'Historie', icon: createElement(Clock, { size: 16 }), shortcut: '4', component: TimelineTab },
  { id: 'chat', label: 'Chat', icon: createElement(Users, { size: 16 }), shortcut: '5', component: ChatTab },
  { id: 'emails', label: 'E-Mails', icon: createElement(Mail, { size: 16 }), shortcut: '6', component: EmailsTab },
  { id: 'tasks', label: 'Aufgaben', icon: createElement(CheckSquare, { size: 16 }), shortcut: '7', component: TasksTab },
  { id: 'kommunikation', label: 'NB-Kommunikation', icon: createElement(Building2, { size: 16 }), shortcut: '8', component: KommunikationTab },
  { id: 'whatsapp', label: 'WhatsApp', icon: createElement(MessageCircle, { size: 16 }), shortcut: '9', component: WhatsAppTab },
];

export const installationConfig: PanelConfig = {
  entityType: 'installation',
  shellType: 'slide-over',
  width: '1400px',

  header: {
    title: (data: any) => data.customerName || 'Unbekannt',
    badges: (data: any) => [
      { text: data.caseType || 'NETZANMELDUNG', variant: 'primary' as const },
      ...(data.status === 'rueckfrage' ? [{ text: 'Rückfrage', variant: 'danger' as const, dot: true }] : []),
      ...(data.status === 'genehmigt' ? [{ text: 'Genehmigt', variant: 'success' as const, dot: true }] : []),
    ],
    actions: (_data: any, { close, reload }) => [
      {
        id: 'refresh',
        label: 'Aktualisieren (R)',
        variant: 'ghost' as const,
        onClick: reload,
      },
      {
        id: 'open-new-tab',
        label: 'In neuem Tab öffnen',
        variant: 'ghost' as const,
        onClick: () => window.open(`/installations/${_data.id}`, '_blank'),
      },
    ],
  },

  tabs: INSTALLATION_TABS,

  fetchData: async (id) => {
    const detail = await installationsApi.getById(Number(id));
    return detail as unknown as Record<string, unknown>;
  },
};
