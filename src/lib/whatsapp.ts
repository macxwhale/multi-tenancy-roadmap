export const sendWhatsAppInvoice = (phoneNumber: string, invoiceNumber: string, amount: number) => {
  // Format phone number for WhatsApp (remove spaces, add country code if needed)
  const formattedPhone = phoneNumber.replace(/\s+/g, "");
  const phone = formattedPhone.startsWith("+") ? formattedPhone : `+254${formattedPhone.replace(/^0/, "")}`;
  
  const message = encodeURIComponent(
    `Hello! Here is your invoice:\n\n` +
    `Invoice #: ${invoiceNumber}\n` +
    `Amount: KES ${amount.toLocaleString()}\n\n` +
    `Thank you for your business!`
  );
  
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  window.open(whatsappUrl, "_blank");
};

export const sendWhatsAppMessage = (phoneNumber: string, message: string) => {
  const formattedPhone = phoneNumber.replace(/\s+/g, "");
  const phone = formattedPhone.startsWith("+") ? formattedPhone : `+254${formattedPhone.replace(/^0/, "")}`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
};
