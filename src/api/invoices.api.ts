import { supabase } from '@/integrations/supabase/client';
import { getCurrentTenantId } from './tenant.api';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Invoice = Tables<'invoices'>;
type InvoiceInsert = TablesInsert<'invoices'>;
type InvoiceUpdate = TablesUpdate<'invoices'>;

/**
 * Get all invoices for the current tenant
 */
export const getInvoices = async (): Promise<Invoice[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('invoices')
    .select('*, products(id, name, price, description)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get invoices for a specific client
 */
export const getInvoicesByClient = async (clientId: string): Promise<Invoice[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('invoices')
    .select('*, products(id, name, price, description)')
    .eq('client_id', clientId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get a single invoice by ID
 */
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('invoices')
    .select('*, products(id, name, price, description)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new invoice
 */
export const createInvoice = async (
  invoiceData: Omit<InvoiceInsert, 'tenant_id'>
): Promise<Invoice> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...invoiceData,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an existing invoice
 */
export const updateInvoice = async (
  id: string,
  updates: InvoiceUpdate
): Promise<Invoice> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (id: string): Promise<void> => {
  const tenantId = await getCurrentTenantId();

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw error;
};

/**
 * Generate next invoice number
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return 'INV-0001';
  }

  const lastNumber = parseInt(data[0].invoice_number.split('-')[1] || '0');
  const nextNumber = lastNumber + 1;
  return `INV-${nextNumber.toString().padStart(4, '0')}`;
};
