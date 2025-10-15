import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteProduct } from "@/hooks/useProducts";
import { formatCurrency } from "@/shared/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onRefresh: () => void;
}

export function ProductsTable({ products, onEdit, onRefresh }: ProductsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const deleteProduct = useDeleteProduct();

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    await deleteProduct.mutateAsync(productToDelete.id);
    setDeleteDialogOpen(false);
    setProductToDelete(null);
    onRefresh();
  };

  return (
    <>
      <div className="rounded-lg border border-border/50 overflow-hidden shadow-google">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide min-w-[150px]">
                Name
              </TableHead>
              <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide min-w-[200px]">
                Description
              </TableHead>
              <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide min-w-[120px]">
                Price
              </TableHead>
              <TableHead className="text-right text-foreground font-semibold text-xs uppercase tracking-wide min-w-[100px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-accent/5 transition-all duration-200 border-b border-border/50">
                <TableCell className="font-medium py-5">{product.name}</TableCell>
                <TableCell className="text-muted-foreground py-5">{product.description || "-"}</TableCell>
                <TableCell className="font-semibold py-5">{formatCurrency(product.price)}</TableCell>
                <TableCell className="py-5">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(product)}
                      title="Edit"
                      className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(product)}
                      title="Delete"
                      className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteProduct.isPending}
      />
    </>
  );
}
