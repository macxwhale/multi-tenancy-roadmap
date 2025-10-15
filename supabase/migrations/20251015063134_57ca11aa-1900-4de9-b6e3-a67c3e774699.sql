-- Make phone_number required and name/email optional in clients table
ALTER TABLE public.clients 
  ALTER COLUMN phone_number SET NOT NULL,
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

-- Add unique constraint on phone_number per tenant
ALTER TABLE public.clients
  ADD CONSTRAINT clients_phone_tenant_unique UNIQUE (phone_number, tenant_id);