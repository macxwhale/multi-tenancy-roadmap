import { Button } from "@/components/ui/button";
import { Edit, Trash, Download, Printer, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadInvoicePDF, printInvoicePDF } from "@/lib/pdfGenerator";
import { sendWhatsAppInvoice } from "@/lib/whatsapp";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices">;

interface InvoicesTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onRefresh: () => void;
}

export function InvoicesTable({ invoices, onEdit, onRefresh }: InvoicesTableProps) {
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("name, email, phone_number")
        .eq("id", invoice.client_id)
        .single();
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .single();
      
      const { data: tenant } = await supabase
        .from("tenants")
        .select("business_name, phone_number")
        .eq("id", profile?.tenant_id)
        .single();
      
      downloadInvoicePDF({ ...invoice, client: client || undefined, tenant: tenant || undefined });
      toast.success("Invoice downloaded");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  const handlePrintPDF = async (invoice: Invoice) => {
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("name, email, phone_number")
        .eq("id", invoice.client_id)
        .single();
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .single();
      
      const { data: tenant } = await supabase
        .from("tenants")
        .select("business_name, phone_number")
        .eq("id", profile?.tenant_id)
        .single();
      
      printInvoicePDF({ ...invoice, client: client || undefined, tenant: tenant || undefined });
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to print invoice");
    }
  };

  const handleSendWhatsApp = async (invoice: Invoice) => {
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("phone_number")
        .eq("id", invoice.client_id)
        .single();
      
      if (!client?.phone_number) {
        toast.error("Client phone number not found");
        return;
      }
      
      sendWhatsAppInvoice(client.phone_number, invoice.invoice_number, Number(invoice.amount));
      toast.success("Opening WhatsApp...");
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Failed to send WhatsApp message");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      toast.success("Invoice deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
            <TableCell>KES {Number(invoice.amount).toLocaleString()}</TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  invoice.status === "paid"
                    ? "bg-green-100 text-green-800"
                    : invoice.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {invoice.status}
              </span>
            </TableCell>
            <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(invoice)} title="Download PDF">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handlePrintPDF(invoice)} title="Print">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleSendWhatsApp(invoice)} title="Send via WhatsApp">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(invoice)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(invoice.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
