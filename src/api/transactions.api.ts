import { supabase } from '@/integrations/supabase/client';
import { getCurrentTenantId } from './tenant.api';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;
type TransactionInsert = TablesInsert<'transactions'>;
type TransactionUpdate = TablesUpdate<'transactions'>;

/**
 * Get all transactions for the current tenant
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get transactions for a specific client
 */
export const getTransactionsByClient = async (clientId: string): Promise<Transaction[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('client_id', clientId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get a single transaction by ID
 */
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new transaction
 */
export const createTransaction = async (
  transactionData: Omit<TransactionInsert, 'tenant_id'>
): Promise<Transaction> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...transactionData,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an existing transaction
 */
export const updateTransaction = async (
  id: string,
  updates: TransactionUpdate
): Promise<Transaction> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  const tenantId = await getCurrentTenantId();

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw error;
};

/**
 * Get transaction summary for a client
 */
export const getClientTransactionSummary = async (clientId: string) => {
  const transactions = await getTransactionsByClient(clientId);

  const totalPayments = transactions
    .filter(txn => txn.type === 'payment')
    .reduce((sum, txn) => sum + Number(txn.amount), 0);

  const totalSales = transactions
    .filter(txn => txn.type === 'sale')
    .reduce((sum, txn) => sum + Number(txn.amount), 0);

  return {
    totalPayments,
    totalSales,
    balance: totalSales - totalPayments,
    transactionCount: transactions.length,
  };
};
