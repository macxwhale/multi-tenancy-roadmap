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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

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
  const [clients, setClients] = useState<Tables<"clients">[]>([]);

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
    fetchClients();
  }, []);

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

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").eq("status", "active");
    setClients(data || []);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const invoiceData = {
        client_id: data.client_id,
        amount: parseFloat(data.amount),
        status: data.status,
        notes: data.notes || null,
        tenant_id: profile.tenant_id,
        invoice_number: invoice?.invoice_number || `INV-${Date.now()}`,
      };

      if (invoice) {
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", invoice.id);
        if (error) throw error;
        toast.success("Invoice updated successfully");
      } else {
        const { error } = await supabase.from("invoices").insert(invoiceData);
        if (error) throw error;
        toast.success("Invoice created successfully");
      }

      onClose();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
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
                      {clients.map((client) => (
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {invoice ? "Update" : "Create"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
