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
    <div className="rounded-lg border border-border/50 overflow-hidden shadow-google">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
            <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide">
              Client
            </TableHead>
            <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide">
              Details
            </TableHead>
            <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide">
              Status
            </TableHead>
            <TableHead className="text-foreground font-semibold text-xs uppercase tracking-wide">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-card">
          {clients.map((client) => (
            <ClientRow key={client.id} client={client} onEdit={onEdit} onRefresh={onRefresh} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
