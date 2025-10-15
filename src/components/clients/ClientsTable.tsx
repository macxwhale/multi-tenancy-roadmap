import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientRow } from "@/features/clients/components/ClientRow";
import type { ClientWithDetails } from "@/api/clients.api";

interface ClientsTableProps {
  clients: ClientWithDetails[];
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
}

export function ClientsTable({ clients, onEdit, onRefresh }: ClientsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-accent hover:bg-accent">
          <TableHead className="text-accent-foreground font-semibold">Client</TableHead>
          <TableHead className="text-accent-foreground font-semibold">Details</TableHead>
          <TableHead className="text-accent-foreground font-semibold">Status</TableHead>
          <TableHead className="text-accent-foreground font-semibold">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <ClientRow key={client.id} client={client} onEdit={onEdit} onRefresh={onRefresh} />
        ))}
      </TableBody>
    </Table>
  );
}
