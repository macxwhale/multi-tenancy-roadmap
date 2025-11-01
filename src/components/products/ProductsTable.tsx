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
  
  const rainbowGradients = [
    "from-emerald-500/90 via-teal-500/90 to-cyan-500/90",
    "from-orange-500/90 via-amber-500/90 to-yellow-500/90",
    "from-rose-500/90 via-pink-500/90 to-fuchsia-500/90",
    "from-blue-500/90 via-indigo-500/90 to-violet-500/90",
    "from-lime-500/90 via-green-500/90 to-emerald-500/90",
    "from-red-500/90 via-orange-500/90 to-amber-500/90",
  ];

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
        {products.map((product, index) => {
          const gradientClass = rainbowGradients[index % rainbowGradients.length];
          
          return (
            <div 
              key={product.id} 
              className={`group rounded-xl overflow-hidden bg-gradient-to-br ${gradientClass} hover:scale-[1.02] text-white transition-all duration-300 shadow-lg hover:shadow-2xl border-0 p-5 space-y-4`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-bold text-base">
                    {product.name}
                  </div>
                  {product.description && (
                    <div className="text-sm text-white/90 mt-2 bg-black/10 rounded-lg p-3 backdrop-blur-sm">
                      {product.description}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-white text-2xl">
                    {formatCurrency(product.price)}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-white/20">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="flex-1 h-9 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm font-medium"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(product)}
                  className="h-9 px-4 bg-red-500/30 hover:bg-red-500/50 text-white border-0 backdrop-blur-sm font-medium"
                >
                  <Trash className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:via-teal-500/30 hover:to-cyan-500/30 border-b border-border/30">
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12">
                NAME
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12">
                DESCRIPTION
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12">
                PRICE
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12 text-right">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {products.map((product, index) => {
              const rowGradient = rainbowGradients[index % rainbowGradients.length];
              
              return (
                <TableRow 
                  key={product.id} 
                  className={`hover:bg-gradient-to-r hover:${rowGradient} hover:text-white transition-all duration-200 border-b border-border/30 group`}
                >
                  <TableCell className="font-semibold py-5 group-hover:text-white">{product.name}</TableCell>
                  <TableCell className="py-5 group-hover:text-white/90">{product.description || "-"}</TableCell>
                  <TableCell className="font-bold py-5 text-lg group-hover:text-white">{formatCurrency(product.price)}</TableCell>
                  <TableCell className="py-5">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEdit(product)}
                        title="Edit"
                        className="h-9 w-9 hover:bg-white/20 group-hover:text-white group-hover:hover:bg-white/30"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(product)}
                        title="Delete"
                        className="h-9 w-9 hover:bg-red-500/30 group-hover:text-white group-hover:hover:bg-red-500/50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
