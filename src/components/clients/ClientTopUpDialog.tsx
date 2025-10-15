import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Coins, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ClientWithDetails } from "@/api/clients.api";

interface ClientTopUpDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function ClientTopUpDialog({ open, onClose, client }: ClientTopUpDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !amount) {
      toast.error("Please enter an amount");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Create a payment transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          client_id: client.id,
          tenant_id: profile.tenant_id,
          amount: Number(amount),
          type: "payment",
          date: date.toISOString(),
          notes: "Top-up payment",
        });

      if (transactionError) throw transactionError;

      // Update client balance
      const newBalance = Number(client.total_balance) - Number(amount);
      const { error: updateError } = await supabase
        .from("clients")
        .update({ total_balance: newBalance })
        .eq("id", client.id);

      if (updateError) throw updateError;

      toast.success("Top-up successful");
      setAmount("");
      setDate(new Date());
      onClose();
    } catch (error) {
      console.error("Error processing top-up:", error);
      toast.error("Failed to process top-up");
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent" />
            Client Account Top-up
          </DialogTitle>
          <DialogDescription>Add payment to client account balance</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-warning/30 rounded-lg p-4 bg-warning/5">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-5 w-5 text-warning" />
                  <span className="font-semibold text-lg">
                    KSH {client.totalInvoiced.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Total Invoiced</div>
              </div>
              <div className="border border-success/30 rounded-lg p-4 bg-success/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <span className="font-semibold text-lg">
                    KSH {(client.totalInvoiced - client.totalPaid).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Current Balance</div>
              </div>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2 font-medium">
              <CalendarIcon className="h-4 w-4" />
              Payment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2 font-medium">
              <DollarSign className="h-4 w-4" />
              Top-up Amount
            </Label>
            <Input
              type="number"
              placeholder="Enter amount in KSH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
              min="0"
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Enter the payment amount</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={loading}
            >
              {loading ? "Processing..." : "Top Up Account"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
