import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, Tag, User, Receipt, LogOut, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ClientTopUpDialog } from '@/components/clients/ClientTopUpDialog';
import type { ClientWithDetails } from '@/api/clients.api';

// Rainbow gradients for invoice cards
const rainbowGradients = [
  'from-pink-500/90 via-purple-500/90 to-indigo-500/90',
  'from-blue-500/90 via-cyan-500/90 to-teal-500/90',
  'from-green-500/90 via-emerald-500/90 to-lime-500/90',
  'from-yellow-500/90 via-orange-500/90 to-red-500/90',
  'from-rose-500/90 via-pink-500/90 to-fuchsia-500/90',
  'from-violet-500/90 via-purple-500/90 to-pink-500/90',
];

// Rainbow colors for stat boxes
const rainbowStatColors = [
  'bg-pink-500/20 border-pink-400/40',
  'bg-blue-500/20 border-blue-400/40',
  'bg-green-500/20 border-green-400/40',
  'bg-yellow-500/20 border-yellow-400/40',
  'bg-rose-500/20 border-rose-400/40',
  'bg-violet-500/20 border-violet-400/40',
];

interface ClientData {
  id: string;
  name: string;
  phone_number: string;
  total_balance: number;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
  notes: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  date: string;
  notes: string | null;
  invoice_id: string | null;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    name: string;
  };
}

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClientData();
    }
  }, [user]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Get phone number from user's email
      const phoneNumber = user?.email?.replace('@client.internal', '');

      if (!phoneNumber) {
        toast.error('Invalid user data');
        return;
      }

      // Fetch client data
      const { data: clientInfo, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (clientError) {
        console.error('Error fetching client:', clientError);
        toast.error('Failed to load account information');
        return;
      }

      setClientData(clientInfo);

      // Fetch invoices for this client
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientInfo.id)
        .order('created_at', { ascending: false });

      if (invoiceError) {
        console.error('Error fetching invoices:', invoiceError);
        toast.error('Failed to load invoices');
        return;
      }

      setInvoices(invoiceData || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoice: Invoice) => {
    try {
      // Fetch transactions for this invoice
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('date', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

      // In a real implementation, you'd have an invoice_items table
      // For now, we'll use placeholder data
      setInvoiceItems([]);
      
      setSelectedInvoice(invoice);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load transaction details');
    }
  };

  const handleTopUpClick = () => {
    setTopUpDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logged out successfully');
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Account Not Found</CardTitle>
            <CardDescription>
              We couldn't find an account associated with your phone number.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const calculateInvoiceBalance = (invoice: Invoice) => {
    const paid = transactions
      .filter(t => t.invoice_id === invoice.id && t.type === 'payment')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return Number(invoice.amount) - paid;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {clientData?.name || 'My Account'}
                </h2>
                <p className="text-sm text-muted-foreground">{clientData?.phone_number}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Invoices</h1>
          <p className="text-muted-foreground">Track and manage your payment goals</p>
        </div>

        {/* Invoices Grid */}
        {invoices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Receipt className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
              <p className="text-center text-muted-foreground max-w-sm">
                You don't have any invoices at the moment. Check back later for updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">{
          invoices.map((invoice, index) => {
            const balance = calculateInvoiceBalance(invoice);
            const gradientClass = rainbowGradients[index % rainbowGradients.length];
            const statColorClass = rainbowStatColors[index % rainbowStatColors.length];
            const percentagePaid = invoice.amount > 0 
              ? ((invoice.amount - balance) / invoice.amount * 100).toFixed(0)
              : 0;
            
            return (
              <Card 
                key={invoice.id} 
                className={`group overflow-hidden bg-gradient-to-br ${gradientClass} hover:scale-[1.02] text-white transition-all duration-300 shadow-lg hover:shadow-2xl border-0`}
              >
                <CardHeader className="pb-4">
                  {/* Header with Invoice Number */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium opacity-90">Invoice</p>
                        <p className="text-sm font-semibold">{invoice.invoice_number}</p>
                      </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      {percentagePaid}% Paid
                    </Badge>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`${statColorClass} backdrop-blur-sm rounded-xl p-4 border transition-all hover:scale-105`}>
                      <p className="text-xs font-medium opacity-90 mb-2">Goal Amount</p>
                      <p className="text-2xl font-bold tracking-tight">
                        {invoice.amount.toLocaleString()} <span className="text-base">Ksh</span>
                      </p>
                    </div>

                    <div className={`${statColorClass} backdrop-blur-sm rounded-xl p-4 border transition-all hover:scale-105`}>
                      <p className="text-xs font-medium opacity-90 mb-2">Remaining</p>
                      <p className="text-2xl font-bold tracking-tight">
                        {balance.toLocaleString()} <span className="text-base">Ksh</span>
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5 text-sm bg-black/10 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 opacity-90">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Created</span>
                      </div>
                      <span className="font-medium">
                        {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {invoice.notes && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2 opacity-90">
                          <Tag className="h-3.5 w-3.5" />
                          <span>Note</span>
                        </div>
                        <span className="font-medium text-xs truncate max-w-[150px]">
                          {invoice.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleTopUpClick}
                      size="lg"
                      className="flex-1 bg-white text-primary hover:bg-white/90 gap-2 font-semibold shadow-lg transition-all hover:scale-105"
                    >
                      <ArrowUpCircle className="h-4 w-4" />
                      Top Up
                    </Button>
                    <Button
                      onClick={() => fetchInvoiceDetails(invoice)}
                      size="lg"
                      variant="outline"
                      className="flex-1 border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all hover:scale-105"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              Transaction Details
            </DialogTitle>
            {selectedInvoice && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Invoice: {selectedInvoice.invoice_number}</span>
                <span>•</span>
                <span>{format(new Date(selectedInvoice.created_at), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions" className="gap-2">
                <Receipt className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="items" className="gap-2">
                <Tag className="h-4 w-4" />
                Items
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-6 mt-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      Total Amount
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      Ksh {selectedInvoice?.amount.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <ArrowUpCircle className="h-4 w-4" />
                      Balance Due
                    </div>
                    <p className="text-2xl font-bold text-destructive">
                      Ksh {selectedInvoice && calculateInvoiceBalance(selectedInvoice).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions List */}
              {transactions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-center text-muted-foreground">
                      No transactions recorded yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Payment History</h4>
                  {transactions.map((transaction, index) => (
                    <Card key={transaction.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                              <span className="text-success font-semibold">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">Payment Received</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(transaction.date), 'MMMM dd, yyyy • h:mm a')}
                              </p>
                              {transaction.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Note: {transaction.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-success">
                              +Ksh {transaction.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="items" className="space-y-4 mt-6">
              {invoiceItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Tag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-center text-muted-foreground">
                      No invoice items available
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {invoiceItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.products?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} × Ksh {item.price.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-lg font-bold">
                            Ksh {(item.quantity * item.price).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ClientTopUpDialog
        open={topUpDialogOpen}
        onClose={() => {
          setTopUpDialogOpen(false);
          fetchClientData();
        }}
        client={clientData as ClientWithDetails}
      />
    </div>
  );
};

export default ClientDashboard;
