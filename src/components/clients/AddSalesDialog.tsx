import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, DollarSign } from "lucide-react";
import type { ClientWithDetails } from "@/pages/Clients";

interface AddSalesDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function AddSalesDialog({ open, onClose, client }: AddSalesDialogProps) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client) return;

    setLoading(true);
    try {
      // Get user and tenant info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Create invoice
      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          tenant_id: profile.tenant_id,
          client_id: client.id,
          invoice_number: invoiceNumber,
          amount: parseFloat(price),
          notes: productName,
          status: "pending"
        });

      if (invoiceError) throw invoiceError;

      toast.success("Sale added successfully");
      setProductName("");
      setPrice("");
      onClose();
    } catch (error) {
      console.error("Error adding sale:", error);
      toast.error("Failed to add sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-accent" />
            Add Sales
          </DialogTitle>
          <DialogDescription>Create a new invoice for this client</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="product" className="flex items-center gap-2 font-medium">
                <ShoppingCart className="h-4 w-4" />
                Product Name
              </Label>
              <Input
                id="product"
                placeholder="Enter product or service name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">What was sold to the client</p>
            </div>

            <div>
              <Label htmlFor="price" className="flex items-center gap-2 font-medium">
                <DollarSign className="h-4 w-4" />
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="Enter price in KSH"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Amount to be invoiced</p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-success hover:bg-success/90 text-success-foreground"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
