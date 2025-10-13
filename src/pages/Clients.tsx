import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientDialog } from "@/components/clients/ClientDialog";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

export interface ClientWithDetails extends Client {
  totalInvoiced: number;
  totalPaid: number;
}

export default function Clients() {
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch invoices and transactions for each client
      const clientsWithDetails = await Promise.all(
        (clientsData || []).map(async (client) => {
          const [{ data: invoices }, { data: transactions }] = await Promise.all([
            supabase
              .from("invoices")
              .select("amount")
              .eq("client_id", client.id),
            supabase
              .from("transactions")
              .select("amount")
              .eq("client_id", client.id)
              .eq("type", "payment"),
          ]);

          const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
          const totalPaid = transactions?.reduce((sum, txn) => sum + Number(txn.amount), 0) || 0;

          return {
            ...client,
            totalInvoiced,
            totalPaid,
          };
        })
      );

      setClients(clientsWithDetails);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: ClientWithDetails) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClient(null);
    fetchClients();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Get started by adding your first client to the system."
          action={{
            label: "Add Client",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <ClientsTable clients={clients} onEdit={handleEdit} onRefresh={fetchClients} />
      )}
      <ClientDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        client={editingClient}
      />
    </div>
  );
}
