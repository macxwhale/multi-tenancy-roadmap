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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
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
