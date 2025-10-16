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
import { useCreateInvoice, useUpdateInvoice, useGenerateInvoiceNumber } from "@/hooks/useInvoices";

const invoiceSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  amount: z.string().min(1, "Amount is required"),
  status: z.enum(["pending", "paid", "overdue"]),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Tables<"invoices"> | null;
}

export function InvoiceDialog({ open, onClose, invoice }: InvoiceDialogProps) {
  const { data: clients = [] } = useClients();
  const { data: nextInvoiceNumber } = useGenerateInvoiceNumber();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: "",
      amount: "",
      status: "pending",
      notes: "",
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        client_id: invoice.client_id,
        amount: invoice.amount.toString(),
        status: invoice.status as "pending" | "paid" | "overdue",
        notes: invoice.notes || "",
      });
    } else {
      form.reset({
        client_id: "",
        amount: "",
        status: "pending",
        notes: "",
      });
    }
  }, [invoice, form]);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const invoiceData = {
        client_id: data.client_id,
        amount: parseFloat(data.amount),
        status: data.status,
        notes: data.notes || null,
        invoice_number: invoice?.invoice_number || nextInvoiceNumber || `INV-${Date.now()}`,
      };

      if (invoice) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          updates: invoiceData,
        });
        toast.success("Invoice updated successfully");
      } else {
        await createInvoice.mutateAsync(invoiceData);
        toast.success("Invoice created successfully");
      }

      onClose();
    } catch (error) {
      console.error("Error saving invoice:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save invoice";
      toast.error(errorMessage);
    }
  };

  // Filter active clients
  const activeClients = clients.filter(c => c.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <div className="w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{invoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
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
                     <SelectContent position="popper" sideOffset={4} className="max-h-[200px]">
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-10 text-base">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                     <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
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
              {invoice ? "Update" : "Create"}
            </Button>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
