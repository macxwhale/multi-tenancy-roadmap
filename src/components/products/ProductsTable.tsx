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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[200px]">Description</TableHead>
              <TableHead className="min-w-[120px]">Price</TableHead>
              <TableHead className="text-right min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.description || "-"}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(product.price)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(product)}
                      title="Edit"
                      className="h-9 w-9"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(product)}
                      title="Delete"
                      className="h-9 w-9 hover:text-destructive"
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
