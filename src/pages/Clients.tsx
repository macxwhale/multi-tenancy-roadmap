import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (client: ClientWithDetails) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClient(null);
    refetch();
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    
    const query = searchQuery.toLowerCase();
    return clients.filter(client => 
      client.name?.toLowerCase().includes(query) ||
      client.phone_number?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

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

      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      )}

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
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No clients found matching "{searchQuery}"
        </div>
      ) : (
        <ClientsTable clients={filteredClients} onEdit={handleEdit} onRefresh={() => refetch()} />
      )}
      <ClientDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        client={editingClient}
      />
    </div>
  );
}
