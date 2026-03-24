import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseWizardContext, normalizeWizardData } from '../utils/normalizeWizardData';
import type { Installation, NormalizedWizardData, ApiEmail, ApiAlert, EmailTemplate } from '../types';

async function fetchEmails(installationId: number): Promise<ApiEmail[]> {
  try {
    const res = await fetch(`/api/emails/for-installation/${installationId}`, { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
}

async function fetchAlerts(installationId: number): Promise<ApiAlert[]> {
  try {
    const res = await fetch(`/api/alerts/installation/${installationId}`, { credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.alerts)) return data.alerts;
    return [];
  } catch {
    return [];
  }
}

async function fetchTemplates(): Promise<EmailTemplate[]> {
  try {
    const res = await fetch('/api/email-templates', { credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.templates)) return data.templates;
    return [];
  } catch {
    return [];
  }
}

interface DashboardData {
  wizardData: NormalizedWizardData;
  emails: ApiEmail[];
  emailsLoading: boolean;
  alerts: ApiAlert[];
  alertsLoading: boolean;
  templates: EmailTemplate[];
  openAlert: ApiAlert | undefined;
  openRueckfrageEmail: ApiEmail | undefined;
  dedicatedEmail: string;
}

export function useDashboardData(data: Installation): DashboardData {
  const rawWizardData = useMemo(() => parseWizardContext(data.wizardContext), [data.wizardContext]);
  const wizardData = useMemo(() => normalizeWizardData(rawWizardData, data), [rawWizardData, data]);

  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ['emails', data.id],
    queryFn: () => fetchEmails(data.id),
    staleTime: 30000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', data.id],
    queryFn: () => fetchAlerts(data.id),
    staleTime: 30000,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchTemplates,
    staleTime: 300000,
  });

  const openAlert = alerts.find(a => !a.isResolved && a.severity === 'critical');
  const openRueckfrageEmail = emails.find(e => {
    if (e.isRead) return false;
    const t = e.aiType?.toLowerCase() || '';
    return t.includes('rückfrage') || t.includes('rueckfrage') || t.includes('nachforderung');
  });

  const dedicatedEmail = data.dedicatedEmail || `inst-${(data.publicId || 'unknown').toLowerCase()}@baunity.de`;

  return { wizardData, emails, emailsLoading, alerts, alertsLoading, templates, openAlert, openRueckfrageEmail, dedicatedEmail };
}
