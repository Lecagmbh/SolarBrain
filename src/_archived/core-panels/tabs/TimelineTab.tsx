/**
 * TimelineTab Wrapper – Bridges TanStack Query to existing TimelineTab
 */

import { Loader2 } from 'lucide-react';
import { TimelineTab as LegacyTimelineTab } from '../../../features/netzanmeldungen/components/DetailPanel/tabs/TimelineTab';
import { useTimeline } from '../hooks/useTimeline';

interface Props {
  installationId: number;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
}

export function UnifiedTimelineTab({ installationId, showToast, isKunde }: Props) {
  const { timeline, isLoading, refetch } = useTimeline(installationId, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <LegacyTimelineTab
      timeline={timeline}
      installationId={installationId}
      onRefresh={() => refetch()}
      showToast={showToast}
      isKunde={isKunde}
    />
  );
}
