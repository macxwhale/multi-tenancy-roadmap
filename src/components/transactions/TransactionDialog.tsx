import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { useClients } from "@/hooks/useClients";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/shared/utils";

const transactionSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  type: z.enum(["payment", "expense", "sale"]),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  invoice_id: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Tables<"transactions"> | null;
}

export function TransactionDialog({ open, onClose, transaction }: TransactionDialogProps) {
  const { data: clients = [] } = useClients();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      client_id: "",
      type: "payment",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      invoice_id: "",
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        client_id: transaction.client_id,
        type: transaction.type as "payment" | "expense" | "sale",
        amount: transaction.amount.toString(),
        date: new Date(transaction.date).toISOString().split("T")[0],
        notes: transaction.notes || "",
        invoice_id: transaction.invoice_id || "",
      });
    } else {
      form.reset({
        client_id: "",
        type: "payment",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        invoice_id: "",
      });
    }
  }, [transaction, form]);

  // Fetch unpaid invoices when client changes and type is payment
  useEffect(() => {
    const clientId = form.watch("client_id");
    const type = form.watch("type");
    
    if (clientId && type === "payment") {
      fetchUnpaidInvoices(clientId);
    } else {
      setInvoices([]);
      setSelectedInvoice(null);
    }
  }, [form.watch("client_id"), form.watch("type")]);

  // Update selected invoice when invoice_id changes
  useEffect(() => {
    const invoiceId = form.watch("invoice_id");
    if (invoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      setSelectedInvoice(invoice || null);
    } else {
      setSelectedInvoice(null);
    }
  }, [form.watch("invoice_id"), invoices]);

  const fetchUnpaidInvoices = async (clientId: string) => {
    setLoadingInvoices(true);
    try {
      const { data: invoicesData, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId)
        .in("status", ["pending", "partial"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate balance for each invoice
      const invoicesWithBalance = await Promise.all(
        (invoicesData || []).map(async (invoice) => {
          const { data: payments } = await supabase
            .from("transactions")
            .select("amount")
            .eq("invoice_id", invoice.id)
            .eq("type", "payment");

          const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
          const balance = Number(invoice.amount) - totalPaid;

          return {
            ...invoice,
            totalPaid,
            balance,
          };
        })
      );

      setInvoices(invoicesWithBalance.filter(inv => inv.balance > 0));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const transactionData = {
        client_id: data.client_id,
        type: data.type,
        amount: parseFloat(data.amount),
        date: new Date(data.date).toISOString(),
        notes: data.notes || null,
        invoice_id: data.invoice_id || null,
      };

      if (transaction) {
        await updateTransaction.mutateAsync({
          id: transaction.id,
          updates: transactionData,
        });
        toast.success("Transaction updated successfully");
      } else {
        await createTransaction.mutateAsync(transactionData);
        toast.success("Transaction created successfully");
      }

      // Update invoice status if it's a payment linked to an invoice
      if (data.type === "payment" && data.invoice_id) {
        const invoice = invoices.find(inv => inv.id === data.invoice_id);
        if (invoice) {
          const totalPaid = invoice.totalPaid + parseFloat(data.amount);
          const newStatus = totalPaid >= invoice.amount ? "paid" : "partial";
          
          await supabase
            .from("invoices")
            .update({ status: newStatus })
            .eq("id", data.invoice_id);
        }
      }

      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save transaction";
      toast.error(errorMessage);
    }
  };

  // Filter active clients
  const activeClients = clients.filter(c => c.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-10 text-base">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-10 text-base">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("type") === "payment" && form.watch("client_id") && (
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Invoice (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={loadingInvoices}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-10 text-base">
                          <SelectValue placeholder={loadingInvoices ? "Loading invoices..." : "Select invoice or leave blank"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific invoice</SelectItem>
                        {invoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoice_number} - Balance: {formatCurrency(invoice.balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {selectedInvoice && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Invoice Amount:</span>
                          <span className="font-medium">{formatCurrency(selectedInvoice.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Paid:</span>
                          <span className="font-medium">{formatCurrency(selectedInvoice.totalPaid)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border/50 pt-1 mt-1">
                          <span className="text-muted-foreground font-medium">Outstanding:</span>
                          <span className="font-semibold text-primary">{formatCurrency(selectedInvoice.balance)}</span>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Amount (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" className="h-11 sm:h-10 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Date</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-11 sm:h-10 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Notes</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px] text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-11 sm:h-10 text-base sm:text-sm">
              {transaction ? "Update" : "Create"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
