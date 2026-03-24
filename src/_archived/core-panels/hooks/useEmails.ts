/**
 * TanStack Query hook for installation emails (lazy-loaded)
 */

import { useQuery } from '@tanstack/react-query';
import { emailApi } from '../../../features/netzanmeldungen/services/api';

export const emailKeys = {
  forInstallation: (id: number) => ['installations', id, 'emails'] as const,
};

export function useEmails(installationId: number, enabled = false) {
  const query = useQuery({
    queryKey: emailKeys.forInstallation(installationId),
    queryFn: () => emailApi.getHistory(installationId),
    enabled,
  });

  return {
    emails: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
