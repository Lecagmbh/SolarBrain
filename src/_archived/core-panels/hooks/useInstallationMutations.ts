/**
 * TanStack Query mutations for installation CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { installationsApi } from '../../../features/netzanmeldungen/services/api';
import type { InstallationStatus, CustomerData, TechnicalData } from '../../../features/netzanmeldungen/types';
import { installationKeys } from './useInstallationDetail';

export function useInstallationMutations(installationId: number) {
  const queryClient = useQueryClient();

  const invalidateDetail = () =>
    queryClient.invalidateQueries({ queryKey: installationKeys.detail(installationId) });

  const updateStatus = useMutation({
    mutationFn: (newStatus: InstallationStatus) =>
      installationsApi.updateStatus(installationId, newStatus),
    onSuccess: invalidateDetail,
  });

  const updateCustomer = useMutation({
    mutationFn: (data: Partial<CustomerData>) =>
      installationsApi.updateCustomer(installationId, data),
    onSuccess: invalidateDetail,
  });

  const updateTechnical = useMutation({
    mutationFn: (data: Partial<TechnicalData>) =>
      installationsApi.updateTechnical(installationId, data),
    onSuccess: invalidateDetail,
  });

  const assignGridOperator = useMutation({
    mutationFn: (gridOperatorId: number) =>
      installationsApi.assignGridOperator(installationId, gridOperatorId),
    onSuccess: invalidateDetail,
  });

  const assignTo = useMutation({
    mutationFn: (userId: number) => installationsApi.assignTo(installationId, userId),
    onSuccess: invalidateDetail,
  });

  const unassign = useMutation({
    mutationFn: () => installationsApi.unassign(installationId),
    onSuccess: invalidateDetail,
  });

  const scheduleZaehlerwechsel = useMutation({
    mutationFn: (data: { datum: string; uhrzeit: string; kommentar?: string }) =>
      installationsApi.scheduleZaehlerwechsel(installationId, data),
    onSuccess: invalidateDetail,
  });

  const cancelZaehlerwechsel = useMutation({
    mutationFn: () => installationsApi.cancelZaehlerwechsel(installationId),
    onSuccess: invalidateDetail,
  });

  const deleteInstallation = useMutation({
    mutationFn: () => installationsApi.delete(installationId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: installationKeys.detail(installationId) });
    },
  });

  return {
    updateStatus,
    updateCustomer,
    updateTechnical,
    assignGridOperator,
    assignTo,
    unassign,
    scheduleZaehlerwechsel,
    cancelZaehlerwechsel,
    deleteInstallation,
  };
}
