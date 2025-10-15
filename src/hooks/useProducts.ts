import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryClient';
import * as productsApi from '@/api/products.api';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

/**
 * Get all products
 */
export const useProducts = () => {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: productsApi.getProducts,
  });
};

/**
 * Get a single product by ID
 */
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.productById(id),
    queryFn: () => productsApi.getProductById(id),
    enabled: !!id,
  });
};

/**
 * Search products by name
 */
export const useSearchProducts = (query: string) => {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productsApi.searchProducts(query),
    enabled: query.length > 0,
    staleTime: 10000, // 10 seconds for search results
  });
};

/**
 * Create a new product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<TablesInsert<'products'>, 'tenant_id'>) =>
      productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
      console.error('Create product error:', error);
    },
  });
};

/**
 * Update an existing product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'products'> }) =>
      productsApi.updateProduct(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.productById(data.id) });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
      console.error('Update product error:', error);
    },
  });
};

/**
 * Delete a product with optimistic update
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.deleteProduct,
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products });
      const previousProducts = queryClient.getQueryData(queryKeys.products);

      queryClient.setQueryData(queryKeys.products, (old: any) => {
        if (!old) return old;
        return old.filter((product: any) => product.id !== productId);
      });

      return { previousProducts };
    },
    onError: (error: Error, productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products, context.previousProducts);
      }
      toast.error(`Failed to delete product: ${error.message}`);
      console.error('Delete product error:', error);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};
