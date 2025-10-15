import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, DollarSign, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    pendingAmount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [clientsRes, invoicesRes, transactionsRes] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact" }),
        supabase.from("invoices").select("amount, status"),
        supabase.from("transactions").select("amount, type"),
      ]);

      const totalClients = clientsRes.count || 0;
      const totalInvoices = invoicesRes.data?.length || 0;
      const pendingAmount =
        invoicesRes.data
          ?.filter((inv) => inv.status === "pending")
          .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      const totalRevenue =
        transactionsRes.data
          ?.filter((txn) => txn.type === "payment")
          .reduce((sum, txn) => sum + Number(txn.amount), 0) || 0;

      setStats({ totalClients, totalInvoices, pendingAmount, totalRevenue });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's an overview of your business.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-primary/5 to-transparent">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Clients</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold tracking-tight">{stats.totalClients}</div>
            <p className="text-sm text-muted-foreground mt-2">Active customer base</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-info/5 to-transparent">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Invoices</CardTitle>
            <div className="p-2 bg-info/10 rounded-lg">
              <FileText className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold tracking-tight">{stats.totalInvoices}</div>
            <p className="text-sm text-muted-foreground mt-2">Invoices generated</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-warning/5 to-transparent">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Amount</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold tracking-tight text-warning">
              KSH {stats.pendingAmount.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-success/5 to-transparent">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold tracking-tight text-success">
              KSH {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total income received</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
