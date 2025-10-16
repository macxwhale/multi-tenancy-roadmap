import { DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { useTransactions } from "@/hooks/useTransactions";

export default function Transactions() {
  const { data: transactions = [], isLoading: loading, refetch } = useTransactions();

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <Skeleton className="h-8 sm:h-10 w-44 sm:w-52 rounded-lg" />
            <Skeleton className="h-4 w-full sm:w-96 max-w-[300px] sm:max-w-none rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full sm:w-44 rounded-lg" />
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5 sm:mt-2">Track all payments and financial activities</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No transactions yet"
          description="Transactions will appear here when invoices are created or payments are recorded."
        />
      ) : (
        <TransactionsTable
          transactions={transactions}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  );
}
