import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, MoreVertical, Plus, Coins, TrendingUp, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddSalesDialog } from "./AddSalesDialog";
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
  const [addSalesDialogOpen, setAddSalesDialogOpen] = useState(false);

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
            <Receipt className="h-5 w-5 text-accent" />
            Client Account
          </DialogTitle>
          <DialogDescription>View client sales and invoices</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <span>{client.phone_number || client.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Acc No: {client.id.slice(0, 8).toUpperCase()}
            </div>
          </div>

          {/* Invoiced & Balances */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-warning/30 rounded-lg p-4 bg-warning/5">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-5 w-5 text-warning" />
                  <span className="font-semibold text-lg">
                    KSH {client.totalInvoiced.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Total Invoiced</div>
              </div>
              <div className="border border-success/30 rounded-lg p-4 bg-success/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <span className="font-semibold text-lg">
                    KSH {Number(client.total_balance).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Current Balance</div>
              </div>
            </div>
          </div>

          {/* Invoiced Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-accent" />
                Sales Ledger
              </h3>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => setAddSalesDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Sales
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-semibold">Product</TableHead>
                    <TableHead className="text-primary-foreground font-semibold">Amount</TableHead>
                    <TableHead className="text-primary-foreground font-semibold">Action</TableHead>
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
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium py-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>{invoice.invoice_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">KSH {Number(invoice.amount).toLocaleString()}</TableCell>
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
          <div className="flex gap-3 pt-2">
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
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
      <AddSalesDialog
        open={addSalesDialogOpen}
        onClose={() => {
          setAddSalesDialogOpen(false);
          fetchInvoices();
        }}
        client={client}
      />
    </Dialog>
  );
}
