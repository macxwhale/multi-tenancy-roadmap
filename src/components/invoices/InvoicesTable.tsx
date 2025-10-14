import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Download, Printer, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadInvoicePDF, printInvoicePDF } from "@/lib/pdfGenerator";
import { sendWhatsAppInvoice } from "@/lib/whatsapp";
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
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices">;

interface InvoicesTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onRefresh: () => void;
}

export function InvoicesTable({ invoices, onEdit, onRefresh }: InvoicesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
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

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;

    try {
      const { error } = await supabase.from("invoices").delete().eq("id", invoiceToDelete);
      if (error) throw error;
      toast.success("Invoice deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Invoice #</TableHead>
              <TableHead className="min-w-[120px]">Amount</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="text-right min-w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell className="font-semibold">KSH {Number(invoice.amount).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      invoice.status === "paid"
                        ? "success"
                        : invoice.status === "pending"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDownloadPDF(invoice)} 
                      title="Download PDF"
                      className="h-9 w-9"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handlePrintPDF(invoice)} 
                      title="Print"
                      className="h-9 w-9"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleSendWhatsApp(invoice)} 
                      title="Send via WhatsApp"
                      className="h-9 w-9"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(invoice)}
                      title="Edit"
                      className="h-9 w-9"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(invoice.id)}
                      title="Delete"
                      className="h-9 w-9 hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
