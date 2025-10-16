import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash } from "lucide-react";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteTransaction } from "@/hooks/useTransactions";
import { formatCurrency, formatDateShort } from "@/shared/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

interface TransactionsTableProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

export function TransactionsTable({
  transactions,
  onRefresh,
}: TransactionsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const deleteTransaction = useDeleteTransaction();

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    await deleteTransaction.mutateAsync(transactionToDelete.id);
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
    onRefresh();
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="rounded-xl border border-border/40 bg-card shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={transaction.type === "payment" ? "success" : "destructive"}>
                    {transaction.type}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  {formatDateShort(transaction.date)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-base text-foreground">
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            </div>
            
            {transaction.notes && (
              <div className="pt-2 border-t border-border/30">
                <div className="text-xs text-muted-foreground">
                  {transaction.notes}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(transaction)}
                className="flex-1 h-8 hover:bg-destructive/10 hover:text-destructive"
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
                TYPE
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                AMOUNT
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                DATE
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                NOTES
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11 text-right">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors duration-150 border-b border-border/30">
                <TableCell className="py-5">
                  <Badge variant={transaction.type === "payment" ? "success" : "destructive"}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold py-5">
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell className="py-5">{formatDateShort(transaction.date)}</TableCell>
                <TableCell className="text-muted-foreground py-5">{transaction.notes || "-"}</TableCell>
                <TableCell className="py-5">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(transaction)}
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
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        isLoading={deleteTransaction.isPending}
      />
    </>
  );
}
