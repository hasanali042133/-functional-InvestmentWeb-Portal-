import * as accountApi from '@/api/account.api.js';
import { useApi } from './useApi.js';

/**
 * The customer's account opening status, which gates investing.
 *
 * Several screens need it and it is cheap to fetch, so each asks for it
 * directly rather than threading it through context.
 */
export function useAccountStatus() {
  const { data, error, isLoading, refetch } = useApi(() => accountApi.getStatus(), []);

  return {
    status: data?.status ?? null,
    canInvest: Boolean(data?.canInvest),
    isApproved: data?.status === 'APPROVED',
    error,
    isLoading,
    refetch,
  };
}
