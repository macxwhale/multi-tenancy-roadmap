import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, ArrowUpCircle, Receipt, ArrowLeftRight, XCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ClientTopUpDialog } from "./ClientTopUpDialog";
import { ClientSalesDialog } from "./ClientSalesDialog";
import { ClientTransactionsDialog } from "./ClientTransactionsDialog";
import type { ClientWithDetails } from "@/api/clients.api";

interface ClientsTableProps {
  clients: ClientWithDetails[];
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
}

export function ClientsTable({ clients, onEdit, onRefresh }: ClientsTableProps) {
  const [topUpClient, setTopUpClient] = useState<ClientWithDetails | null>(null);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [salesClient, setSalesClient] = useState<ClientWithDetails | null>(null);
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [transactionsClient, setTransactionsClient] = useState<ClientWithDetails | null>(null);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  const [deleteClient, setDeleteClient] = useState<ClientWithDetails | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!deleteClient) return;

    try {
      const { error } = await supabase.from("clients").delete().eq("id", deleteClient.id);
      if (error) throw error;
      toast.success("Client deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteClient(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    }
  };

  const handleTopUp = (client: ClientWithDetails) => {
    setTopUpClient(client);
    setTopUpDialogOpen(true);
  };

  const handleTopUpClose = () => {
    setTopUpDialogOpen(false);
    setTopUpClient(null);
    onRefresh();
  };

  const handleViewSales = (client: ClientWithDetails) => {
    setSalesClient(client);
    setSalesDialogOpen(true);
  };

  const handleSalesClose = () => {
    setSalesDialogOpen(false);
    setSalesClient(null);
    onRefresh();
  };

  const handleViewTransactions = (client: ClientWithDetails) => {
    setTransactionsClient(client);
    setTransactionsDialogOpen(true);
  };

  const handleTransactionsClose = () => {
    setTransactionsDialogOpen(false);
    setTransactionsClient(null);
    onRefresh();
  };

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow className="bg-accent hover:bg-accent">
          <TableHead className="text-accent-foreground font-semibold">Client</TableHead>
          <TableHead className="text-accent-foreground font-semibold">Details</TableHead>
          <TableHead className="text-accent-foreground font-semibold">Status</TableHead>
          <TableHead className="text-accent-foreground font-semibold">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
            <TableCell className="py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-medium">{client.phone_number || client.name}</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  Joined {new Date(client.created_at).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="py-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-warning/20 text-warning-foreground border-warning/30">
                  Invoiced KSH {client.totalInvoiced.toLocaleString()}
                </Badge>
                <Badge className="bg-success/20 text-success-foreground border-success/30">
                  Paid KSH {client.totalPaid.toLocaleString()}
                </Badge>
                <Badge className="bg-info/20 text-info-foreground border-info/30">
                  Balance KSH {Number(client.total_balance).toLocaleString()}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="py-4">
              <Badge 
                variant="outline" 
                className={
                  client.status === "active"
                    ? "bg-success/10 text-success border-success/30"
                    : "bg-muted text-muted-foreground border-border"
                }
              >
                {client.status === "active" ? "OPEN" : "CLOSED"}
              </Badge>
            </TableCell>
            <TableCell className="py-4">
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
                    onClick={() => handleTopUp(client)}
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Top Up
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-success cursor-pointer"
                    onClick={() => handleViewSales(client)}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    View Sales
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-info cursor-pointer"
                    onClick={() => handleViewTransactions(client)}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    View Transactions
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setDeleteClient(client);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Drop Invoice Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <ClientTopUpDialog
      open={topUpDialogOpen}
      onClose={handleTopUpClose}
      client={topUpClient}
    />
    <ClientSalesDialog
      open={salesDialogOpen}
      onClose={handleSalesClose}
      client={salesClient}
    />
    <ClientTransactionsDialog
      open={transactionsDialogOpen}
      onClose={handleTransactionsClose}
      client={transactionsClient}
    />
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the client "{deleteClient?.name}" and all associated records. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete Client
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
