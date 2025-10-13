import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftRight, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ClientWithDetails } from "@/pages/Clients";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;
type Invoice = Tables<"invoices">;

interface ClientTransactionsDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function ClientTransactionsDialog({ open, onClose, client }: ClientTransactionsDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && client) {
      fetchData();
    }
  }, [open, client]);

  const fetchData = async () => {
    if (!client) return;

    setLoading(true);
    try {
      const [{ data: txnData, error: txnError }, { data: invData, error: invError }] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("client_id", client.id)
          .order("date", { ascending: false }),
        supabase
          .from("invoices")
          .select("*")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false }),
      ]);

      if (txnError) throw txnError;
      if (invError) throw invError;

      setTransactions(txnData || []);
      setInvoices(invData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaid = transactions
    .filter((txn) => txn.type === "payment")
    .reduce((sum, txn) => sum + Number(txn.amount), 0);
  const balance = totalInvoiced - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded">
            <ArrowLeftRight className="h-5 w-5" />
            Transactions
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Invoice Items
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-3 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No transactions found</div>
            ) : (
              transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">
                      {new Date(txn.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 font-semibold">
                    <ArrowLeftRight className="h-4 w-4" />
                    {Number(txn.amount).toLocaleString()} ksh
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No invoices found</div>
            ) : (
              <>
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-green-600">✓</span>
                    <span className="font-medium">{invoice.invoice_number}</span>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-yellow-500">💰</span>
                      <span className="text-sm text-gray-600">Total</span>
                    </div>
                    <div className="text-lg font-bold">
                      {totalInvoiced.toLocaleString()} Ksh
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-green-600">💳</span>
                      <span className="text-sm text-gray-600">Balance</span>
                    </div>
                    <div className="text-lg font-bold text-red-600">
                      {balance.toLocaleString()} Ksh
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
