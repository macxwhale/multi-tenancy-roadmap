import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds - data considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - cache time
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  clients: ['clients'] as const,
  clientById: (id: string) => ['clients', id] as const,
  invoices: ['invoices'] as const,
  invoiceById: (id: string) => ['invoices', id] as const,
  invoicesByClient: (clientId: string) => ['invoices', 'client', clientId] as const,
  products: ['products'] as const,
  productById: (id: string) => ['products', id] as const,
};
