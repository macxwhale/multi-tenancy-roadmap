import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { ProductsTable } from "@/components/products/ProductsTable";
import { ProductDialog } from "@/components/products/ProductDialog";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add products to your inventory to use them in invoices."
          action={{
            label: "Add Product",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <ProductsTable products={products} onEdit={handleEdit} onRefresh={fetchProducts} />
      )}
      <ProductDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        product={editingProduct}
      />
    </div>
  );
}
