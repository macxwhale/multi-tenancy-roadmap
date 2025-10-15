import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash } from "lucide-react";
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
  onEdit: (transaction: Transaction) => void;
  onRefresh: () => void;
}

export function TransactionsTable({
  transactions,
  onEdit,
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
      <div className="rounded-lg border border-border/50 overflow-hidden shadow-google">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide min-w-[100px]">
                Type
              </TableHead>
              <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide min-w-[120px]">
                Amount
              </TableHead>
              <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide min-w-[120px]">
                Date
              </TableHead>
              <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide min-w-[200px]">
                Notes
              </TableHead>
              <TableHead className="text-right text-foreground font-semibold text-xs uppercase tracking-wide min-w-[100px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-accent/5 transition-all duration-200 border-b border-border/50">
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
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(transaction)}
                      title="Edit"
                      className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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
