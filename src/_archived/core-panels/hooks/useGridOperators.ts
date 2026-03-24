/**
 * TanStack Query hook for grid operators (heavily cached)
 */

import { useQuery } from '@tanstack/react-query';
import { gridOperatorsApi } from '../../../features/netzanmeldungen/services/api';

export function useGridOperators() {
  const query = useQuery({
    queryKey: ['grid-operators'],
    queryFn: () => gridOperatorsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    gridOperators: query.data ?? [],
    isLoading: query.isLoading,
  };
}
