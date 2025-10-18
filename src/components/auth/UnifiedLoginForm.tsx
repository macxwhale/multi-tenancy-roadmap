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

const loginSchema = z.object({
  phone_number: z.string().regex(/^0\d{9}$/, 'Phone must be 10 digits starting with 0'),
  password: z.string().min(1, 'Password/PIN is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface UnifiedLoginFormProps {
  onSuccess: () => void;
}

export const UnifiedLoginForm = ({ onSuccess }: UnifiedLoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Try client login first (phone@client.internal)
      let email = `${data.phone_number}@client.internal`;
      let { error } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });

      // If client login fails, try owner login (phone@owner.internal)
      if (error) {
        email = `${data.phone_number}@owner.internal`;
        const ownerResult = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });
        
        if (ownerResult.error) throw ownerResult.error;
      }

      toast.success('Logged in successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error('Invalid phone number or password/PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password/PIN</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your password or PIN" {...field} />
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
    </>
  );
};
