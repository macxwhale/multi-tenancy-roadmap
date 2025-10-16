import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type SearchResult = {
  id: string;
  type: 'client' | 'invoice' | 'product';
  title: string;
  subtitle?: string;
  path: string;
  data: Tables<'clients'> | Tables<'invoices'> | Tables<'products'>;
};

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      try {
        const searchTerm = `%${query.trim()}%`;

        const [clientsRes, invoicesRes, productsRes] = await Promise.all([
          supabase
            .from('clients')
            .select('*')
            .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone_number.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('invoices')
            .select('*')
            .or(`invoice_number.ilike.${searchTerm},notes.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('products')
            .select('*')
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(5),
        ]);

        const searchResults: SearchResult[] = [];

        // Add clients
        if (clientsRes.data) {
          searchResults.push(
            ...clientsRes.data.map((client) => ({
              id: client.id,
              type: 'client' as const,
              title: client.name || 'Unnamed Client',
              subtitle: client.email || client.phone_number,
              path: '/clients',
              data: client,
            }))
          );
        }

        // Add invoices
        if (invoicesRes.data) {
          searchResults.push(
            ...invoicesRes.data.map((invoice) => ({
              id: invoice.id,
              type: 'invoice' as const,
              title: invoice.invoice_number,
              subtitle: `KES ${Number(invoice.amount).toLocaleString()} - ${invoice.status}`,
              path: '/invoices',
              data: invoice,
            }))
          );
        }

        // Add products
        if (productsRes.data) {
          searchResults.push(
            ...productsRes.data.map((product) => ({
              id: product.id,
              type: 'product' as const,
              title: product.name,
              subtitle: `KES ${Number(product.price).toLocaleString()}`,
              path: '/products',
              data: product,
            }))
          );
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchData, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { results, loading };
}
