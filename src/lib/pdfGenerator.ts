import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface InvoiceData {
  invoice_number: string;
  amount: number;
  status: string;
  notes?: string | null;
  created_at: string;
  product?: {
    name: string;
    description?: string | null;
    price: number;
  } | null;
  client?: {
    name: string;
    email?: string | null;
    phone_number?: string | null;
  };
  tenant?: {
    business_name: string;
    phone_number: string;
  };
}

export const generateInvoicePDF = (invoice: InvoiceData) => {
  const doc = new jsPDF();
  
  // Header - Tenant/Business Information
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.tenant?.business_name || "Business Name", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Phone: ${invoice.tenant?.phone_number || "N/A"}`, 14, 28);
  
  // Invoice Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("INVOICE", 14, 45);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 52;
  doc.text(`Invoice #: ${invoice.invoice_number}`, 14, yPos);
  yPos += 6;

  // Invoice details
  doc.setFontSize(10);
  doc.text(`Date: ${format(new Date(invoice.created_at), 'PPP')}`, 14, yPos);
  yPos += 6;
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, yPos);
  yPos += 10;

  // Client information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, yPos);
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.client?.name || "N/A", 14, yPos);
  yPos += 5;
  if (invoice.client?.email) {
    doc.text(invoice.client.email, 14, yPos);
    yPos += 5;
  }
  if (invoice.client?.phone_number) {
    doc.text(invoice.client.phone_number, 14, yPos);
    yPos += 5;
  }
  yPos += 5;

  // Invoice items table
  const tableBody = invoice.product 
    ? [
        [
          invoice.product.name + (invoice.product.description ? `\n${invoice.product.description}` : ''),
          '1',
          `KES ${invoice.product.price.toLocaleString()}`,
          `KES ${invoice.amount.toLocaleString()}`
        ]
      ]
    : [
        ['Custom Invoice', '1', `KES ${invoice.amount.toLocaleString()}`, `KES ${invoice.amount.toLocaleString()}`]
      ];

  autoTable(doc, {
    startY: yPos,
    head: [['Product', 'Quantity', 'Unit Price', 'Total']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || yPos;
  
  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Notes:", 14, finalY + 10);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, 180);
    doc.text(splitNotes, 14, finalY + 17);
  }
  
  // Total
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: KES ${invoice.amount.toLocaleString()}`, 14, finalY + (invoice.notes ? 35 : 15));
  
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