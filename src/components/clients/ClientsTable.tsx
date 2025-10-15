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
    <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/30">
            <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
              CLIENT
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
              FINANCIAL SUMMARY
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11">
              STATUS
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-xs tracking-wider h-11 text-right">
              ACTIONS
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
