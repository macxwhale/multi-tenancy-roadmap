import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  invoice_number: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  client?: {
    name: string;
    email: string | null;
    phone_number: string | null;
  };
  tenant?: {
    business_name: string;
    phone_number: string;
  };
}

export const generateInvoicePDF = (invoice: InvoiceData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(invoice.tenant?.business_name || "Business Name", 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Phone: ${invoice.tenant?.phone_number || "N/A"}`, 14, 28);
  
  // Invoice Details
  doc.setFontSize(16);
  doc.text("INVOICE", 14, 45);
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 55);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 14, 62);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 69);
  
  // Client Details
  doc.setFontSize(12);
  doc.text("Bill To:", 14, 85);
  doc.setFontSize(10);
  doc.text(invoice.client?.name || "N/A", 14, 92);
  if (invoice.client?.email) {
    doc.text(`Email: ${invoice.client.email}`, 14, 99);
  }
  if (invoice.client?.phone_number) {
    doc.text(`Phone: ${invoice.client.phone_number}`, 14, 106);
  }
  
  // Invoice Items Table
  autoTable(doc, {
    startY: 120,
    head: [["Description", "Amount"]],
    body: [
      ["Invoice Amount", `KES ${invoice.amount.toLocaleString()}`],
    ],
    theme: "striped",
  });
  
  // Notes
  if (invoice.notes) {
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(10);
    doc.text("Notes:", 14, finalY + 15);
    doc.text(invoice.notes, 14, finalY + 22);
  }
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  doc.setFontSize(14);
  doc.text(`Total: KES ${invoice.amount.toLocaleString()}`, 14, finalY + 35);
  
  return doc;
};

export const downloadInvoicePDF = (invoice: InvoiceData) => {
  const doc = generateInvoicePDF(invoice);
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
};

export const printInvoicePDF = (invoice: InvoiceData) => {
  const doc = generateInvoicePDF(invoice);
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
};
