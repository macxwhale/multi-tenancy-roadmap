import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, ArrowUpCircle, Receipt, ArrowLeftRight, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import type { ClientWithDetails } from "@/pages/Clients";

interface ClientsTableProps {
  clients: ClientWithDetails[];
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
}

export function ClientsTable({ clients, onEdit, onRefresh }: ClientsTableProps) {
  const [topUpClient, setTopUpClient] = useState<ClientWithDetails | null>(null);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      toast.success("Client deleted successfully");
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

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow className="bg-orange-500 hover:bg-orange-500">
          <TableHead className="text-white font-semibold">Client</TableHead>
          <TableHead className="text-white font-semibold">Details</TableHead>
          <TableHead className="text-white font-semibold">Status</TableHead>
          <TableHead className="text-white font-semibold">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="text-green-600">●</span>
                <span className="font-medium">{client.phone_number || client.name}</span>
              </div>
              <div className="mt-1">
                <Badge variant="secondary" className="text-xs">
                  Joined {new Date(client.created_at).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  Invoiced {client.totalInvoiced.toLocaleString()} ksh
                </Badge>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Paid {client.totalPaid.toLocaleString()} ksh
                </Badge>
                <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
                  Balance {Number(client.total_balance).toLocaleString()}ksh
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                variant="outline" 
                className={
                  client.status === "active"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }
              >
                {client.status === "active" ? "OPEN" : "CLOSED"}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50">
                    <MoreVertical className="h-4 w-4 mr-1" />
                    Action
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuItem 
                    className="text-orange-600"
                    onClick={() => handleTopUp(client)}
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Top Up
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-green-600">
                    <Receipt className="h-4 w-4 mr-2" />
                    View Sales
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-green-600">
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    View Transactions
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600"
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
  </>
  );
}
