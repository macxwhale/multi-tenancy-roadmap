import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { useInvoices } from "@/hooks/useInvoices";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices">;

export default function Invoices() {
  const { data: invoices = [], isLoading: loading, refetch } = useInvoices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingInvoice(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <Skeleton className="h-8 sm:h-10 w-40 sm:w-48 rounded-lg" />
            <Skeleton className="h-4 w-full sm:w-96 max-w-[300px] sm:max-w-none rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full sm:w-40 rounded-lg" />
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5 sm:mt-2">Create and manage customer invoices</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2 w-full sm:w-auto h-11 text-base">
          <Plus className="h-5 w-5" />
          Create Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="When you're ready, create your first invoice. Every journey starts with a single step."
          action={{
            label: "Create Invoice",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <InvoicesTable invoices={invoices} onEdit={handleEdit} onRefresh={() => refetch()} />
      )}
      <InvoiceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        invoice={editingInvoice}
      />
    </div>
  );
}
