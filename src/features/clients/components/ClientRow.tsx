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
    <TableRow className="hover:bg-accent/5 transition-all duration-200 border-b border-border/50">
      <TableCell className="py-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-full">
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <div>
            <span className="font-semibold text-sm text-foreground block">
              {client.phone_number || client.name}
            </span>
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(client.created_at)}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-5">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-warning/10 text-warning border-warning/20 font-medium shadow-sm">
            Invoiced {formatCurrency(client.totalInvoiced)}
          </Badge>
          <Badge className="bg-success/10 text-success border-success/20 font-medium shadow-sm">
            Paid {formatCurrency(client.totalPaid)}
          </Badge>
          <Badge className="bg-info/10 text-info border-info/20 font-medium shadow-sm">
            Balance {formatCurrency(client.total_balance)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="py-5">
        <Badge
          variant="outline"
          className={
            client.status === "active"
              ? "bg-success/10 text-success border-success/30 font-semibold"
              : "bg-muted text-muted-foreground border-border font-semibold"
          }
        >
          {client.status === "active" ? "OPEN" : "CLOSED"}
        </Badge>
      </TableCell>
      <TableCell className="py-5">
        <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />
      </TableCell>
    </TableRow>
  );
}
