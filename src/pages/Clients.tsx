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
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="h-8 sm:h-10 w-40 sm:w-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-full sm:w-96 max-w-[300px] sm:max-w-none bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-11 w-full sm:w-36 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="border border-border/50 rounded-lg overflow-hidden shadow-google">
          <div className="bg-muted/30 h-14 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border/50 p-4 sm:p-5 space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Manage your customer relationships and accounts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="default" className="gap-2 shadow-sm w-full sm:w-auto h-11 text-base sm:text-sm">
          <Plus className="h-4 w-4" />
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
