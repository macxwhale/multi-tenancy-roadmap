-- Fix security definer view by making it security invoker
-- This ensures the view respects RLS policies of the querying user
DROP VIEW IF EXISTS client_details;

CREATE OR REPLACE VIEW client_details
WITH (security_invoker = true) AS
SELECT 
  c.*,
  COALESCE(SUM(CASE WHEN i.id IS NOT NULL THEN i.amount ELSE 0 END), 0) as total_invoiced,
  COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) as total_paid
FROM clients c
LEFT JOIN invoices i ON i.client_id = c.id
LEFT JOIN transactions t ON t.client_id = c.id
GROUP BY c.id;