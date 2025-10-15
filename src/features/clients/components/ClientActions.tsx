import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, ArrowUpCircle, Receipt, ArrowLeftRight, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientTopUpDialog } from "@/components/clients/ClientTopUpDialog";
import { ClientSalesDialog } from "@/components/clients/ClientSalesDialog";
import { ClientTransactionsDialog } from "@/components/clients/ClientTransactionsDialog";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteClient } from "@/hooks/useClients";
import type { ClientWithDetails } from "@/api/clients.api";

interface ClientActionsProps {
  client: ClientWithDetails;
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
}

export function ClientActions({ client, onEdit, onRefresh }: ClientActionsProps) {
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    await deleteClient.mutateAsync(client.id);
    setDeleteDialogOpen(false);
    onRefresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10">
            <MoreVertical className="h-4 w-4 mr-1" />
            Action
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover z-50">
          <DropdownMenuItem
            className="text-accent cursor-pointer"
            onClick={() => setTopUpDialogOpen(true)}
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Top Up
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-success cursor-pointer"
            onClick={() => setSalesDialogOpen(true)}
          >
            <Receipt className="h-4 w-4 mr-2" />
            View Sales
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-info cursor-pointer"
            onClick={() => setTransactionsDialogOpen(true)}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            View Transactions
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive cursor-pointer"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Drop Invoice Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ClientTopUpDialog
        open={topUpDialogOpen}
        onClose={() => {
          setTopUpDialogOpen(false);
          onRefresh();
        }}
        client={client}
      />
      <ClientSalesDialog
        open={salesDialogOpen}
        onClose={() => {
          setSalesDialogOpen(false);
          onRefresh();
        }}
        client={client}
      />
      <ClientTransactionsDialog
        open={transactionsDialogOpen}
        onClose={() => {
          setTransactionsDialogOpen(false);
          onRefresh();
        }}
        client={client}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Are you sure?"
        description={`This will permanently delete the client "${client.name}" and all associated records. This action cannot be undone.`}
        isLoading={deleteClient.isPending}
      />
    </>
  );
}
