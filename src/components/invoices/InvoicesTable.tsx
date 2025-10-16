import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Download, Printer, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadInvoicePDF, printInvoicePDF } from "@/lib/pdfGenerator";
import { sendWhatsAppInvoice } from "@/lib/whatsapp";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteInvoice } from "@/hooks/useInvoices";
import { formatCurrency, formatDateShort } from "@/shared/utils";
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
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const deleteInvoice = useDeleteInvoice();
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

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    await deleteInvoice.mutateAsync(invoiceToDelete.id);
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
    onRefresh();
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="rounded-xl border border-border/40 bg-card shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-sm text-foreground">
                  {invoice.invoice_number}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDateShort(invoice.created_at)}
                </div>
              </div>
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
            </div>
            
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground text-base">
                  {formatCurrency(invoice.amount)}
                </span>
              </div>
              {invoice.notes && (
                <div className="text-xs text-muted-foreground pt-1">
                  {invoice.notes}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDownloadPDF(invoice)} 
                className="h-8 px-2.5 hover:bg-primary/10 hover:text-primary text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                PDF
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handlePrintPDF(invoice)} 
                className="h-8 px-2.5 hover:bg-primary/10 hover:text-primary text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleSendWhatsApp(invoice)} 
                className="h-8 px-2.5 hover:bg-success/10 hover:text-success text-xs"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Send
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(invoice)}
                className="h-8 px-2.5 hover:bg-primary/10 hover:text-primary text-xs"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(invoice)}
                className="h-8 px-2.5 hover:bg-destructive/10 hover:text-destructive text-xs"
              >
                <Trash className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/30">
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                INVOICE #
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                AMOUNT
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                STATUS
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
                DATE
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11 text-right">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors duration-150 border-b border-border/30">
                <TableCell className="font-medium py-5">{invoice.invoice_number}</TableCell>
                <TableCell className="font-semibold py-5">{formatCurrency(invoice.amount)}</TableCell>
                <TableCell className="py-5">
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
                <TableCell className="py-5">{formatDateShort(invoice.created_at)}</TableCell>
                <TableCell className="py-5">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDownloadPDF(invoice)} 
                      title="Download PDF"
                      className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handlePrintPDF(invoice)} 
                      title="Print"
                      className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleSendWhatsApp(invoice)} 
                      title="Send via WhatsApp"
                      className="h-9 w-9 hover:bg-success/10 hover:text-success"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(invoice)}
                      title="Edit"
                      className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(invoice)}
                      title="Delete"
                      className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
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

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice "${invoiceToDelete?.invoice_number}"? This action cannot be undone.`}
        isLoading={deleteInvoice.isPending}
      />
    </>
  );
}
