import { useEffect } from "react";
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

const transactionSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  type: z.enum(["payment", "expense"]),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
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

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      client_id: "",
      type: "payment",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        client_id: transaction.client_id,
        type: transaction.type as "payment" | "expense",
        amount: transaction.amount.toString(),
        date: new Date(transaction.date).toISOString().split("T")[0],
        notes: transaction.notes || "",
      });
    } else {
      form.reset({
        client_id: "",
        type: "payment",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [transaction, form]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const transactionData = {
        client_id: data.client_id,
        type: data.type,
        amount: parseFloat(data.amount),
        date: new Date(data.date).toISOString(),
        notes: data.notes || null,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {transaction ? "Update" : "Create"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
