import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out');
    } else {
      toast.success('Logged out successfully');
      navigate('/auth', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cart-Trace</h1>
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Welcome to Cart-Trace</h2>
          <p className="text-muted-foreground mb-8">
            Multi-tenant invoicing & accounting system for Kenyan businesses
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Logged in as: {user.email}</p>
            <p className="mt-2">Dashboard coming in Phase 2...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
