import { useQuery } from '@tanstack/react-query';
import { getCurrentTenantId, getCurrentUser } from '@/api/tenant.api';

/**
 * Hook to get the current tenant ID
 */
export const useTenantId = () => {
  return useQuery({
    queryKey: ['tenantId'],
    queryFn: getCurrentTenantId,
    staleTime: Infinity, // Tenant ID never changes during session
    gcTime: Infinity,
  });
};

/**
 * Hook to get the current authenticated user
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
