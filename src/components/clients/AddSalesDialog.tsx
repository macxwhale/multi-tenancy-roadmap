import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
            🟡 Add Sales
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="product" className="flex items-center gap-2 text-base">
                🧡 Product
              </Label>
              <Input
                id="product"
                placeholder="Provide Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="price" className="flex items-center gap-2 text-base">
                🟠 Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="Provide Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-2"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            Add Product
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
