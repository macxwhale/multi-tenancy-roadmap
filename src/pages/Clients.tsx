import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { useClients } from "@/hooks/useClients";
import type { ClientWithDetails } from "@/api/clients.api";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

export default function Clients() {
  const { data: clients = [], isLoading: loading, refetch } = useClients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleEdit = (client: ClientWithDetails) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClient(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-accent h-12 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t p-4 space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          ))}
        </div>
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
          description="Take your time. Start building lasting relationships by adding your first client—there's no rush."
          action={{
            label: "Add Client",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <ClientsTable clients={clients} onEdit={handleEdit} onRefresh={() => refetch()} />
      )}
      <ClientDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        client={editingClient}
      />
    </div>
  );
}
