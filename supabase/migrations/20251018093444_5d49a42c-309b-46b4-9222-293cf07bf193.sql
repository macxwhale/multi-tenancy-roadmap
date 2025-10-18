-- Add RLS policy for clients to view their own invoices
CREATE POLICY "Clients can view their own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE phone_number = SUBSTRING(auth.jwt()->>'email' FROM '^(.+)@client\.internal$')
  )
);

-- Add RLS policy for clients to view their own client record
CREATE POLICY "Clients can view their own record"
ON public.clients
FOR SELECT
TO authenticated
USING (
  phone_number = SUBSTRING(auth.jwt()->>'email' FROM '^(.+)@client\.internal$')
);