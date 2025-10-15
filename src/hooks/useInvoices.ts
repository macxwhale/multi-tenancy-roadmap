import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryClient';
import * as invoicesApi from '@/api/invoices.api';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

/**
 * Get all invoices
 */
export const useInvoices = () => {
  return useQuery({
    queryKey: queryKeys.invoices,
    queryFn: invoicesApi.getInvoices,
  });
};

/**
 * Get invoices for a specific client
 */
export const useInvoicesByClient = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.invoicesByClient(clientId),
    queryFn: () => invoicesApi.getInvoicesByClient(clientId),
    enabled: !!clientId,
  });
};

/**
 * Get a single invoice by ID
 */
export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: queryKeys.invoiceById(id),
    queryFn: () => invoicesApi.getInvoiceById(id),
    enabled: !!id,
  });
};

/**
 * Generate next invoice number
 */
export const useGenerateInvoiceNumber = () => {
  return useQuery({
    queryKey: ['invoiceNumber'],
    queryFn: invoicesApi.generateInvoiceNumber,
    staleTime: 0, // Always fresh
    gcTime: 0, // Don't cache
  });
};

/**
 * Create a new invoice
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<TablesInsert<'invoices'>, 'tenant_id'>) =>
      invoicesApi.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
      console.error('Create invoice error:', error);
    },
  });
};

/**
 * Update an existing invoice
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'invoices'> }) =>
      invoicesApi.updateInvoice(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoiceById(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
      console.error('Update invoice error:', error);
    },
  });
};

/**
 * Delete an invoice with optimistic update
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.deleteInvoice,
    onMutate: async (invoiceId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices });
      const previousInvoices = queryClient.getQueryData(queryKeys.invoices);

      queryClient.setQueryData(queryKeys.invoices, (old: any) => {
        if (!old) return old;
        return old.filter((invoice: any) => invoice.id !== invoiceId);
      });

      return { previousInvoices };
    },
    onError: (error: Error, invoiceId, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(queryKeys.invoices, context.previousInvoices);
      }
      toast.error(`Failed to delete invoice: ${error.message}`);
      console.error('Delete invoice error:', error);
    },
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
};
