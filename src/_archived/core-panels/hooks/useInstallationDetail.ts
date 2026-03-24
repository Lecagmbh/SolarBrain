/**
 * TanStack Query hook for installation detail data
 * Wraps existing api.installations.getById()
 */

import { useQuery } from '@tanstack/react-query';
import { installationsApi, gridOperatorsApi } from '../../../features/netzanmeldungen/services/api';

export const installationKeys = {
  all: ['installations'] as const,
  detail: (id: number) => ['installations', 'detail', id] as const,
  gridOperators: ['grid-operators'] as const,
};

export function useInstallationDetail(installationId: number | null) {
  const detailQuery = useQuery({
    queryKey: installationKeys.detail(installationId!),
    queryFn: () => installationsApi.getById(installationId!),
    enabled: !!installationId,
  });

  const gridOperatorsQuery = useQuery({
    queryKey: installationKeys.gridOperators,
    queryFn: () => gridOperatorsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    detail: detailQuery.data ?? null,
    gridOperators: gridOperatorsQuery.data ?? [],
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
  };
}
