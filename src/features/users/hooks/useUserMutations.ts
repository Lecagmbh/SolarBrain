/**
 * Mutations für User CRUD + Aktionen
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../modules/api/client';

function useInvalidateUsers() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['admin-users'] });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/admin/users', data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      api.patch(`/admin/users/${id}`, data).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/admin/users/${id}/reset-password`).then((r) => r.data as { tempPassword: string }),
  });
}

export function useBlockUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, grund }: { id: number; grund: string }) =>
      api.post(`/admin/users/${id}/block`, { grund }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUnblockUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: number) => api.post(`/admin/users/${id}/unblock`).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/admin/users/${id}/impersonate`).then((r) => r.data as { token: string; url: string }),
  });
}
