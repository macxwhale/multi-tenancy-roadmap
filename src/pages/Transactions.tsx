import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionDialog } from "@/components/transactions/TransactionDialog";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
    fetchTransactions();
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
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No transactions yet"
          description="Record your first transaction to start tracking payments and sales."
          action={{
            label: "Add Transaction",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <TransactionsTable
          transactions={transactions}
          onEdit={handleEdit}
          onRefresh={fetchTransactions}
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
