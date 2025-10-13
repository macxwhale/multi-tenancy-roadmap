import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, MoreVertical } from "lucide-react";
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
import type { ClientWithDetails } from "@/pages/Clients";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices">;

interface ClientSalesDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function ClientSalesDialog({ open, onClose, client }: ClientSalesDialogProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && client) {
      fetchInvoices();
    }
  }, [open, client]);

  const fetchInvoices = async () => {
    if (!client) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async () => {
    if (!client) return;

    try {
      const { error } = await supabase
        .from("clients")
        .update({ status: "active" })
        .eq("id", client.id);

      if (error) throw error;
      toast.success("Client account activated");
      onClose();
    } catch (error) {
      console.error("Error activating account:", error);
      toast.error("Failed to activate account");
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-orange-500" />
            Client Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-medium">
              <span className="text-blue-600">📱</span>
              <span>{client.phone_number || client.name}</span>
            </div>
            <div className="text-sm text-gray-600">
              Acc No: {client.id.slice(0, 8).toUpperCase()}
            </div>
          </div>

          {/* Invoiced & Balances */}
          <div>
            <div className="text-sm font-medium mb-2 text-gray-600">Invoiced & Balances</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-600">💰</span>
                  <span className="font-semibold text-yellow-800">
                    {client.totalInvoiced.toLocaleString()} ksh
                  </span>
                </div>
                <div className="text-xs text-gray-600">Invoiced</div>
              </div>
              <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-600">💰</span>
                  <span className="font-semibold text-green-800">
                    {Number(client.total_balance).toLocaleString()} ksh
                  </span>
                </div>
                <div className="text-xs text-gray-600">Balance</div>
              </div>
            </div>
          </div>

          {/* Invoiced Items */}
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <span className="text-orange-500">⭐</span>
              <span className="text-orange-600">Sales Ledger</span>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e3a5f] hover:bg-[#1e3a5f]">
                    <TableHead className="text-white font-semibold">Product</TableHead>
                    <TableHead className="text-white font-semibold">Amount</TableHead>
                    <TableHead className="text-white font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">●</span>
                            <span>{invoice.invoice_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>{Number(invoice.amount).toLocaleString()} ksh</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8">
                                <MoreVertical className="h-4 w-4 mr-1" />
                                Action
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background z-50">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Download PDF</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Delete Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleActivateAccount}
              disabled={client.status === "active"}
            >
              {client.status === "active" ? "Account Active" : "Activate Client Account"}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Back to Clients
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
