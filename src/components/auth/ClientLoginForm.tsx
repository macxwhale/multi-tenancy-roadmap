import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const clientLoginSchema = z.object({
  phone_number: z.string().regex(/^0\d{9}$/, 'Phone must be 10 digits starting with 0'),
  pin: z.string().min(6, 'PIN must be at least 6 digits'),
});

type ClientLoginFormData = z.infer<typeof clientLoginSchema>;

interface ClientLoginFormProps {
  onSuccess: () => void;
}

export const ClientLoginForm = ({ onSuccess }: ClientLoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClientLoginFormData>({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: {
      phone_number: '',
      pin: '',
    },
  });

  const onSubmit = async (data: ClientLoginFormData) => {
    setIsLoading(true);
    try {
      // Convert phone number to email format used during client creation
      const email = `${data.phone_number}@client.internal`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: data.pin,
      });

      if (error) throw error;

      toast.success('Logged in successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in. Please check your phone number and PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="0712345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PIN</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your PIN" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </Button>
      </form>
    </Form>
  );
};
