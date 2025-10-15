import { supabase } from '@/integrations/supabase/client';
import { getCurrentTenantId } from './tenant.api';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type ProductInsert = TablesInsert<'products'>;
type ProductUpdate = TablesUpdate<'products'>;

/**
 * Get all products for the current tenant
 */
export const getProducts = async (): Promise<Product[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new product
 */
export const createProduct = async (
  productData: Omit<ProductInsert, 'tenant_id'>
): Promise<Product> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...productData,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an existing product
 */
export const updateProduct = async (
  id: string,
  updates: ProductUpdate
): Promise<Product> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  const tenantId = await getCurrentTenantId();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw error;
};

/**
 * Search products by name
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};
