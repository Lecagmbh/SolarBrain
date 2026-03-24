/**
 * TanStack Query hook for installation timeline (lazy-loaded)
 */

import { useQuery } from '@tanstack/react-query';
import { timelineApi } from '../../../features/netzanmeldungen/services/api';

export const timelineKeys = {
  forInstallation: (id: number) => ['installations', id, 'timeline'] as const,
};

export function useTimeline(installationId: number, enabled = false) {
  const query = useQuery({
    queryKey: timelineKeys.forInstallation(installationId),
    queryFn: () => timelineApi.getForInstallation(installationId),
    enabled,
  });

  return {
    timeline: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
