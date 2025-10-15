-- Create database view for optimized client details
CREATE OR REPLACE VIEW client_details AS
SELECT 
  c.*,
  COALESCE(SUM(CASE WHEN i.id IS NOT NULL THEN i.amount ELSE 0 END), 0) as total_invoiced,
  COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) as total_paid
FROM clients c
LEFT JOIN invoices i ON i.client_id = c.id
LEFT JOIN transactions t ON t.client_id = c.id
GROUP BY c.id;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);