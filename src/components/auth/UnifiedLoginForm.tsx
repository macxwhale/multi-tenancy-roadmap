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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const loginSchema = z.object({
  phone_number: z.string().regex(/^0\d{9}$/, 'Phone must be 10 digits starting with 0'),
  password: z.string().min(1, 'Password/PIN is required'),
});

const resetSchema = z.object({
  phone_number: z.string().regex(/^0\d{9}$/, 'Phone must be 10 digits starting with 0'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

interface UnifiedLoginFormProps {
  onSuccess: () => void;
}

export const UnifiedLoginForm = ({ onSuccess }: UnifiedLoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: '',
      password: '',
    },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      phone_number: '',
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

  const onReset = async (data: ResetFormData) => {
    setIsResetting(true);
    try {
      const response = await supabase.functions.invoke('reset-password', {
        body: { phone_number: data.phone_number },
      });

      if (response.error) {
        throw response.error;
      }

      const { pin } = response.data;

      toast.success(`Your new PIN is: ${pin}`, {
        duration: 10000,
        description: 'Please save this PIN. You can now log in with it.',
      });

      setIsResetOpen(false);
      resetForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password. Please contact support.');
    } finally {
      setIsResetting(false);
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

          <div className="flex justify-end">
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="link" className="px-0 text-sm">
                  Forgot password?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your phone number to generate a new 6-digit PIN.
                  </DialogDescription>
                </DialogHeader>
                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                    <FormField
                      control={resetForm.control}
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
                    <Button type="submit" className="w-full" disabled={isResetting}>
                      {isResetting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating PIN...
                        </>
                      ) : (
                        'Generate New PIN'
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

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
