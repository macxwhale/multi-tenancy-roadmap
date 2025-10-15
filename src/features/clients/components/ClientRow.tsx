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
}

export function ClientRow({ client, onEdit, onRefresh }: ClientRowProps) {
  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="font-medium">{client.phone_number || client.name}</span>
        </div>
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            Joined {formatDate(client.created_at)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-warning/20 text-warning-foreground border-warning/30">
            Invoiced {formatCurrency(client.totalInvoiced)}
          </Badge>
          <Badge className="bg-success/20 text-success-foreground border-success/30">
            Paid {formatCurrency(client.totalPaid)}
          </Badge>
          <Badge className="bg-info/20 text-info-foreground border-info/30">
            Balance {formatCurrency(client.total_balance)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <Badge
          variant="outline"
          className={
            client.status === "active"
              ? "bg-success/10 text-success border-success/30"
              : "bg-muted text-muted-foreground border-border"
          }
        >
          {client.status === "active" ? "OPEN" : "CLOSED"}
        </Badge>
      </TableCell>
      <TableCell className="py-4">
        <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />
      </TableCell>
    </TableRow>
  );
}
