/**
 * TanStack Query hook for installation comments (lazy-loaded)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../../../features/netzanmeldungen/services/api';

export const commentKeys = {
  forInstallation: (id: number) => ['installations', id, 'comments'] as const,
};

export function useComments(installationId: number, enabled = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: commentKeys.forInstallation(installationId),
    queryFn: () => commentsApi.getForInstallation(installationId),
    enabled,
  });

  const addComment = useMutation({
    mutationFn: ({ text, isInternal }: { text: string; isInternal?: boolean }) =>
      commentsApi.add(installationId, text, isInternal),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: commentKeys.forInstallation(installationId) }),
  });

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    addComment,
  };
}
