/**
 * TanStack Query hook for installation tasks (lazy-loaded)
 */

import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../../../features/netzanmeldungen/services/api';

export const taskKeys = {
  forInstallation: (id: number) => ['installations', id, 'tasks'] as const,
};

export function useTasks(installationId: number, enabled = false) {
  const query = useQuery({
    queryKey: taskKeys.forInstallation(installationId),
    queryFn: () => tasksApi.getAll({ installationId }),
    enabled,
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
