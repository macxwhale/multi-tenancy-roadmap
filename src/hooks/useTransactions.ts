import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryClient';
import * as transactionsApi from '@/api/transactions.api';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

/**
 * Get all transactions
 */
export const useTransactions = () => {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: transactionsApi.getTransactions,
  });
};

/**
 * Get transactions for a specific client
 */
export const useTransactionsByClient = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.transactionsByClient(clientId),
    queryFn: () => transactionsApi.getTransactionsByClient(clientId),
    enabled: !!clientId,
  });
};

/**
 * Get a single transaction by ID
 */
export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: queryKeys.transactionById(id),
    queryFn: () => transactionsApi.getTransactionById(id),
    enabled: !!id,
  });
};

/**
 * Get transaction summary for a client
 */
export const useClientTransactionSummary = (clientId: string) => {
  return useQuery({
    queryKey: ['transactionSummary', clientId],
    queryFn: () => transactionsApi.getClientTransactionSummary(clientId),
    enabled: !!clientId,
  });
};

/**
 * Create a new transaction
 */
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<TablesInsert<'transactions'>, 'tenant_id'>) =>
      transactionsApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast.success('Transaction created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create transaction: ${error.message}`);
      console.error('Create transaction error:', error);
    },
  });
};

/**
 * Update an existing transaction
 */
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'transactions'> }) =>
      transactionsApi.updateTransaction(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionById(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast.success('Transaction updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update transaction: ${error.message}`);
      console.error('Update transaction error:', error);
    },
  });
};

/**
 * Delete a transaction with optimistic update
 */
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.deleteTransaction,
    onMutate: async (transactionId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions });
      const previousTransactions = queryClient.getQueryData(queryKeys.transactions);

      queryClient.setQueryData(queryKeys.transactions, (old: any) => {
        if (!old) return old;
        return old.filter((transaction: any) => transaction.id !== transactionId);
      });

      return { previousTransactions };
    },
    onError: (error: Error, transactionId, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions, context.previousTransactions);
      }
      toast.error(`Failed to delete transaction: ${error.message}`);
      console.error('Delete transaction error:', error);
    },
    onSuccess: () => {
      toast.success('Transaction deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
};
