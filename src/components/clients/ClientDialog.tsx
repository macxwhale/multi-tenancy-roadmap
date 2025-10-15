import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const clientSchema = z.object({
  phone_number: z
    .string()
    .regex(/^07\d{8}$/, "Phone must be 10 digits starting with 07")
    .min(1, "Phone number is required"),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  open: boolean;
  onClose: () => void;
  client: Tables<"clients"> | null;
}

export function ClientDialog({ open, onClose, client }: ClientDialogProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      phone_number: "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        phone_number: client.phone_number || "",
      });
    } else {
      form.reset({
        phone_number: "",
      });
    }
  }, [client, form]);

  const generatePIN = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      if (client) {
        // Update existing client
        const { error } = await supabase
          .from("clients")
          .update({
            phone_number: data.phone_number,
            tenant_id: profile.tenant_id,
          })
          .eq("id", client.id);
        if (error) throw error;
        toast.success("Client updated successfully");
      } else {
        // Create new client with PIN
        const pin = generatePIN();
        
        // Create auth account for client
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: `${data.phone_number}@client.internal`,
          password: pin,
        });

        if (authError) throw authError;

        // Create client record
        const { error: clientError } = await supabase.from("clients").insert({
          phone_number: data.phone_number,
          name: data.phone_number, // Use phone as name for now
          tenant_id: profile.tenant_id,
        });

        if (clientError) throw clientError;

        toast.success(`Client created! PIN: ${pin}`, {
          duration: 10000,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Failed to save client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add Client"}</DialogTitle>
          <DialogDescription>
            {client ? "Update client information" : "Add a new client to your system"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0712345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">
                {client ? "Update Client" : "Create Client"}
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
