import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, DollarSign, TrendingUp, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    pendingAmount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const getUserName = () => {
    if (!user) return "there";
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "there";
    return name.split(' ')[0];
  };

  const getCurrentTime = () => {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

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
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-8 sm:h-10 w-40 sm:w-48" />
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1.5 sm:mb-2">
            Hello, {getUserName()}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's a summary of your account activity for this week.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
          <MapPin className="h-3 sm:h-4 w-3 sm:w-4" />
          <span className="hidden sm:inline">Nairobi, Kenya – {getCurrentTime()}</span>
          <span className="sm:hidden">NBI – {getCurrentTime()}</span>
        </Badge>
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => navigate('/clients')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-primary/5 to-transparent">
            <CardTitle className="text-sm font-bold text-red-500">Total Clients</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-extrabold tracking-tight text-red-500">{stats.totalClients}</div>
            <p className="text-sm text-muted-foreground mt-2">Active customer base</p>
          </CardContent>
        </Card>

        <Card 
          className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => navigate('/invoices')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-info/5 to-transparent">
            <CardTitle className="text-sm font-bold text-blue-500">Total Invoices</CardTitle>
            <div className="p-2 bg-info/10 rounded-lg">
              <FileText className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-extrabold tracking-tight text-blue-500">{stats.totalInvoices}</div>
            <p className="text-sm text-muted-foreground mt-2">Invoices generated</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-warning/5 to-transparent">
            <CardTitle className="text-sm font-bold text-yellow-500">Pending Amount</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-extrabold tracking-tight text-yellow-500">
              KSH {stats.pendingAmount.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-br from-success/5 to-transparent">
            <CardTitle className="text-sm font-bold text-green-500">Total Revenue</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-extrabold tracking-tight text-green-500">
              KSH {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total income received</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
