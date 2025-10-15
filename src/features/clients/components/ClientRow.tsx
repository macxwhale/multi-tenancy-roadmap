import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ClientActions } from "./ClientActions";
import { formatDate, formatCurrency } from "@/shared/utils";
import type { ClientWithDetails } from "@/api/clients.api";

interface ClientRowProps {
  client: ClientWithDetails;
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
  mobileActions?: boolean;
}

export function ClientRow({ client, onEdit, onRefresh, mobileActions }: ClientRowProps) {
  if (mobileActions) {
    return <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />;
  }

  return (
    <TableRow className="group hover:bg-muted/30 transition-colors duration-150 border-b border-border/30">
      <TableCell className="py-4">
        <div>
          <div className="font-semibold text-sm text-foreground">
            {client.phone_number || client.name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Joined {formatDate(client.created_at)}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium w-16">Invoiced</span>
            <span className="font-semibold text-foreground">{formatCurrency(client.totalInvoiced)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium w-16">Paid</span>
            <span className="font-semibold text-success">{formatCurrency(client.totalPaid)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium w-16">Balance</span>
            <span className="font-semibold text-accent">{formatCurrency(client.totalInvoiced - client.totalPaid)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <Badge
          variant="outline"
          className={
            client.status === "active"
              ? "bg-success/5 text-success border-success/30 font-medium px-3 py-1"
              : "bg-muted text-muted-foreground border-border/50 font-medium px-3 py-1"
          }
        >
          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${client.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
          {client.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="py-4 text-right">
        <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />
      </TableCell>
    </TableRow>
  );
}
