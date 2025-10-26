import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientRow } from "@/features/clients/components/ClientRow";
import type { ClientWithDetails } from "@/api/clients.api";
import { formatCurrency, formatDate } from "@/shared/utils";

interface ClientsTableProps {
  clients: ClientWithDetails[];
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
}

export function ClientsTable({ clients, onEdit, onRefresh }: ClientsTableProps) {
  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {clients.map((client, index) => {
          const rainbowGradients = [
            "from-red-500/10 to-orange-500/10 border-l-4 border-l-red-500",
            "from-orange-500/10 to-yellow-500/10 border-l-4 border-l-orange-500",
            "from-yellow-500/10 to-green-500/10 border-l-4 border-l-yellow-500",
            "from-green-500/10 to-emerald-500/10 border-l-4 border-l-green-500",
            "from-emerald-500/10 to-cyan-500/10 border-l-4 border-l-emerald-500",
            "from-cyan-500/10 to-blue-500/10 border-l-4 border-l-cyan-500",
            "from-blue-500/10 to-indigo-500/10 border-l-4 border-l-blue-500",
            "from-indigo-500/10 to-purple-500/10 border-l-4 border-l-indigo-500",
            "from-purple-500/10 to-pink-500/10 border-l-4 border-l-purple-500",
            "from-pink-500/10 to-rose-500/10 border-l-4 border-l-pink-500",
          ];
          const gradientClass = rainbowGradients[index % rainbowGradients.length];
          
          return (
          <div key={client.id} className={`rounded-xl border border-border/40 bg-gradient-to-r shadow-sm p-4 space-y-3 ${gradientClass}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-sm text-foreground">
                  {client.phone_number || client.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Joined {new Date(client.created_at).toLocaleDateString()}
                </div>
              </div>
              <ClientRow key={client.id} client={client} onEdit={onEdit} onRefresh={onRefresh} mobileActions />
            </div>
            
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Invoiced</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(client.totalInvoiced)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-semibold text-success">
                  {formatCurrency(client.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-semibold text-accent">
                  {formatCurrency(client.totalInvoiced - client.totalPaid)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <span className="text-xs text-muted-foreground">Status</span>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                client.status === "open"
                  ? "bg-success/5 text-success border border-success/30"
                  : "bg-muted text-muted-foreground border border-border/50"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${client.status === "open" ? "bg-success" : "bg-muted-foreground"}`} />
                {client.status === "open" ? "Open" : "Closed"}
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
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
            {clients.map((client, index) => (
              <ClientRow key={client.id} client={client} onEdit={onEdit} onRefresh={onRefresh} rowIndex={index} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
