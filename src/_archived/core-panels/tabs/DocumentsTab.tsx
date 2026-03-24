/**
 * DocumentsTab Wrapper – Bridges TanStack Query to existing DocumentsTab
 */

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DocumentsTab as LegacyDocumentsTab } from '../../../features/netzanmeldungen/components/DetailPanel/tabs/DocumentsTab';
import { useDocuments } from '../hooks/useDocuments';
import type { InstallationDetail } from '../../../features/netzanmeldungen/types';

interface Props {
  installationId: number;
  detail: InstallationDetail;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
  isSubunternehmer?: boolean;
}

export function UnifiedDocumentsTab({ installationId, detail, showToast, isKunde, isSubunternehmer }: Props) {
  const { documents, isLoading, refetch } = useDocuments(installationId, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <LegacyDocumentsTab
      documents={documents}
      installationId={installationId}
      detail={detail}
      onRefresh={() => refetch()}
      showToast={showToast}
      isKunde={isKunde}
      isSubunternehmer={isSubunternehmer}
    />
  );
}
