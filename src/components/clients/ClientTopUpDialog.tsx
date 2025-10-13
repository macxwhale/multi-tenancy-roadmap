import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Coins } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ClientWithDetails } from "@/pages/Clients";

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
            <Coins className="h-5 w-5 text-orange-500" />
            Client Account Topup
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-orange-600 flex items-center gap-2 mb-3">
              <span className="text-sm">💰</span>
              Provide Top-up amount
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-600">💰</span>
                  <span className="font-semibold text-yellow-800">
                    {client.totalInvoiced.toLocaleString()} ksh
                  </span>
                </div>
                <div className="text-xs text-gray-600">Invoiced</div>
              </div>
              <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-600">💰</span>
                  <span className="font-semibold text-green-800">
                    {Number(client.total_balance).toLocaleString()} ksh
                  </span>
                </div>
                <div className="text-xs text-gray-600">Balance</div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-orange-600 flex items-center gap-2 mb-2">
              <span className="text-sm">📅</span>
              AddedOn
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
            <Label className="text-orange-600 flex items-center gap-2 mb-2">
              <span className="text-sm">💵</span>
              Top up Amount
            </Label>
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              Top Up Account
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Back to List
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
