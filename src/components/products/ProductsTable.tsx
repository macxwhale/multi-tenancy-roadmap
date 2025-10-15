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
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-xl border border-border/40 bg-card shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-sm text-foreground">
                  {product.name}
                </div>
                {product.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {product.description}
                  </div>
                )}
              </div>
              <div className="text-right ml-3">
                <div className="font-semibold text-base text-foreground">
                  {formatCurrency(product.price)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(product)}
                className="flex-1 h-8 hover:bg-primary/10 hover:text-primary"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(product)}
                className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/30">
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                NAME
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                DESCRIPTION
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                PRICE
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11 text-right">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-muted/50 transition-colors duration-150 border-b border-border/30">
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
