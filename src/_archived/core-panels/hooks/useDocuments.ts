/**
 * TanStack Query hook for installation documents (lazy-loaded)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../../../features/netzanmeldungen/services/api';

export const documentKeys = {
  forInstallation: (id: number) => ['installations', id, 'documents'] as const,
};

export function useDocuments(installationId: number, enabled = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: documentKeys.forInstallation(installationId),
    queryFn: () => documentsApi.getForInstallation(installationId),
    enabled,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, kategorie, dokumentTyp }: { file: File; kategorie: string; dokumentTyp?: string }) =>
      documentsApi.upload(installationId, file, kategorie, dokumentTyp),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: documentKeys.forInstallation(installationId) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: number) => documentsApi.delete(installationId, documentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: documentKeys.forInstallation(installationId) }),
  });

  return {
    documents: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    upload: uploadMutation,
    remove: deleteMutation,
  };
}
