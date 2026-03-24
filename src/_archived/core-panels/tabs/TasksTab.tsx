/**
 * TasksTab Wrapper – Bridges TanStack Query to existing TasksTab
 */

import { Loader2 } from 'lucide-react';
import { TasksTab as LegacyTasksTab } from '../../../features/netzanmeldungen/components/DetailPanel/tabs/TasksTab';
import { useTasks } from '../hooks/useTasks';

interface Props {
  installationId: number;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
}

export function UnifiedTasksTab({ installationId, showToast, isKunde }: Props) {
  const { tasks, isLoading, refetch } = useTasks(installationId, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <LegacyTasksTab
      tasks={tasks}
      installationId={installationId}
      onRefresh={() => refetch()}
      showToast={showToast}
      isKunde={isKunde}
    />
  );
}
