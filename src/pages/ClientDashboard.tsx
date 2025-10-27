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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-4xl space-y-4">
        {/* Header with Logout */}
        <div className="sticky top-4 z-10 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{clientData?.name || clientData?.phone_number}</p>
              <p className="text-sm text-muted-foreground">{clientData?.phone_number}</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground text-lg">
                No invoices found
              </p>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => {
            const balance = calculateInvoiceBalance(invoice);
            return (
              <Card 
                key={invoice.id} 
                className="bg-gradient-to-br from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground transition-all"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Receipt className="h-5 w-5" />
                    {clientData?.phone_number}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-3 border border-yellow-500/30">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="text-yellow-300">💰</span>
                        <span className="font-medium">Goal Amount</span>
                      </div>
                      <p className="text-2xl font-bold">{invoice.amount} Ksh</p>
                    </div>

                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-3 border border-yellow-500/30">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="text-yellow-300">📊</span>
                        <span className="font-medium">Goal Balance</span>
                      </div>
                      <p className="text-2xl font-bold">{balance} Ksh</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Date</span>
                      <span className="font-medium">
                        {format(new Date(invoice.created_at), 'dd-MMM-yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span>Tag</span>
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Owner</span>
                      <span className="font-medium">{clientData?.phone_number}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex gap-2">
                  <Button
                    onClick={handleTopUpClick}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Top Up
                  </Button>
                  <Button
                    onClick={() => fetchInvoiceDetails(invoice)}
                    variant="outline"
                    className="flex-1 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <Receipt className="h-5 w-5" />
              My Transactions
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="items">Invoice Items</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions found
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        📊 Total
                      </div>
                      <p className="text-xl font-bold">
                        {selectedInvoice?.amount} Ksh
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        🟢 Balance
                      </div>
                      <p className="text-xl font-bold">
                        {selectedInvoice && calculateInvoiceBalance(selectedInvoice)} Ksh
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>{format(new Date(transaction.date), 'dd-MMM-yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-green-600">
                          <Receipt className="h-4 w-4" />
                          {transaction.amount} Ksh
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              {invoiceItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No invoice items found
                </p>
              ) : (
                <div className="space-y-3">
                  {invoiceItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {item.price} Ksh
                        </p>
                      </div>
                      <p className="font-bold">
                        {item.quantity * item.price} Ksh
                      </p>
                    </div>
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
