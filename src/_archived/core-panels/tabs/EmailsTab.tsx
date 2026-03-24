/**
 * EmailsTab Wrapper – Bridges TanStack Query to existing EmailsTab
 */

import { Loader2 } from 'lucide-react';
import { EmailsTab as LegacyEmailsTab } from '../../../features/netzanmeldungen/components/DetailPanel/tabs/EmailsTab';
import { useEmails } from '../hooks/useEmails';
import type { InstallationDetail } from '../../../features/netzanmeldungen/types';

interface Props {
  installationId: number;
  detail: InstallationDetail;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
}

export function UnifiedEmailsTab({ installationId, detail, showToast, isKunde }: Props) {
  const { emails, isLoading, refetch } = useEmails(installationId, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <LegacyEmailsTab
      emails={emails as any}
      installationId={installationId}
      detail={detail}
      onRefresh={() => refetch()}
      showToast={showToast}
      isKunde={isKunde}
    />
  );
}
