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

const signUpSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Phone number must contain only digits'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess: () => void;
}

export const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      businessName: '',
      fullName: '',
      phoneNumber: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error: signUpError, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            business_name: data.businessName,
            full_name: data.fullName,
            phone_number: data.phoneNumber,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Call edge function to create tenant and profile
        const { error: setupError } = await supabase.functions.invoke('setup-tenant', {
          body: {
            business_name: data.businessName,
            full_name: data.fullName,
            phone_number: data.phoneNumber,
          },
        });

        if (setupError) throw setupError;

        toast.success('Account created successfully!');
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your business name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="0712345678 (10 digits)" 
                  maxLength={10}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>
    </Form>
  );
};
