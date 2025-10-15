import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionDialog } from "@/components/transactions/TransactionDialog";
import { useTransactions } from "@/hooks/useTransactions";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

export default function Transactions() {
  const { data: transactions = [], isLoading: loading, refetch } = useTransactions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-52 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-44 rounded-lg" />
        </div>
        <div className="border border-border/50 rounded-lg overflow-hidden shadow-google">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-20 w-full mt-2" />
          <Skeleton className="h-20 w-full mt-2" />
          <Skeleton className="h-20 w-full mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-2">Track all payments and financial activities</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2 w-full sm:w-auto">
          <Plus className="h-5 w-5" />
          Add Transaction
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No transactions yet"
          description="Take it easy. Your transaction history will build naturally over time."
          action={{
            label: "Add Transaction",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <TransactionsTable
          transactions={transactions}
          onEdit={handleEdit}
          onRefresh={() => refetch()}
        />
      )}
      <TransactionDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        transaction={editingTransaction}
      />
    </div>
  );
}
