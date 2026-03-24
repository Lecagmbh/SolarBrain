/**
 * TanStack Query Hook für User-Daten
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../modules/api/client';
import type { UserData } from '../types';

interface UsersResponse {
  data: UserData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  active?: boolean | null;
  sort?: string;
  tree?: boolean;
  include?: string;
}

export function useUsers(params: UseUsersParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit ?? 200));
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.active !== undefined && params.active !== null) query.set('active', String(params.active));
  if (params.sort) query.set('sort', params.sort);
  if (params.tree) query.set('tree', 'true');
  if (params.include) query.set('include', params.include);

  const qs = query.toString();

  return useQuery<UsersResponse>({
    queryKey: ['admin-users', qs],
    queryFn: async () => {
      const res = await api.get(`/admin/users${qs ? `?${qs}` : ''}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}
