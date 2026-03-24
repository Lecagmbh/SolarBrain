/**
 * React Query Client Configuration
 * Zentrale Konfiguration für alle Queries
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 Minute
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
